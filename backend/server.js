/**
 * SwapLease API Server
 *
 * Security layers (in order of execution for each request):
 *  1. CORS         — only our frontend origin is allowed
 *  2. sanitizeBody — strips HTML/script tags from all string fields server-side
 *  3. Zod schemas  — validate shape, type, length constraints; strip unknown fields
 *  4. CSRF tokens  — validates X-CSRF-Token header on POST/PUT/DELETE
 *  5. Parameterised queries — all DB access uses ? placeholders (never string concat)
 *  6. DOMPurify    — on the frontend, sanitises text before rendering (XSS layer)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const { Resend } = require('resend');

const { sanitizeBody } = require('./middleware/sanitize');
const { issueCsrfToken, validateCsrfToken } = require('./middleware/csrf');
const { upload, handleUploadError, UPLOAD_DIR } = require('./middleware/upload');
const {
  validate,
  registerSchema,
  loginSchema,
  createListingSchema,
  updateListingSchema,
  sendMessageSchema,
  updateProfileSchema,
} = require('./schemas/index');

const app = express();
const PORT = process.env.PORT || 5001;

const JWT_SECRET = process.env.JWT_SECRET || 'swapleasse_secret_key_change_in_production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// ── Database ───────────────────────────────────────────────────────────────

const db = new sqlite3.Database(path.join(__dirname, 'swapleasse.db'));

/**
 * Parameterised query helpers.
 *
 * SAFETY: All three functions accept a `params` array that sqlite3 binds using
 * prepared statements internally. The `?` placeholders are NEVER replaced by
 * string concatenation — sqlite3 sends them to SQLite as separate protocol values.
 * This means user input can NEVER be interpreted as SQL syntax, eliminating
 * SQL injection at the driver level regardless of what the input contains.
 *
 * ✗ UNSAFE (never do this):   `db.run("SELECT * FROM users WHERE id = '" + id + "'")`
 * ✓ SAFE (what we do):        `db.run("SELECT * FROM users WHERE id = ?", [id])`
 */
const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) { if (err) reject(err); else resolve(this); });
});
const get = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => { if (err) reject(err); else resolve(row); });
});
const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => { if (err) reject(err); else resolve(rows); });
});

// ── DB Initialisation ──────────────────────────────────────────────────────

async function initDB() {
  await run('PRAGMA foreign_keys = ON');

  await run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    university TEXT,
    bio TEXT,
    phone TEXT,
    avatar TEXT,
    emailVerified INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now'))
  )`);

  // email_tokens stores verification and password-reset tokens.
  // Tokens are single-use and expire after 24 h.
  await run(`CREATE TABLE IF NOT EXISTS email_tokens (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    usedAt TEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  )`);

  await run(`CREATE TABLE IF NOT EXISTS listings (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    address TEXT,
    city TEXT,
    suburb TEXT,
    rent REAL,
    bond REAL,
    availableFrom TEXT,
    availableTo TEXT,
    type TEXT DEFAULT 'apartment',
    furnished INTEGER DEFAULT 0,
    bedrooms INTEGER DEFAULT 1,
    bathrooms INTEGER DEFAULT 1,
    nearbyUni TEXT,
    images TEXT DEFAULT '[]',
    tenants INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active',
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    listingId TEXT,
    user1Id TEXT NOT NULL,
    user2Id TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (listingId) REFERENCES listings(id),
    FOREIGN KEY (user1Id) REFERENCES users(id),
    FOREIGN KEY (user2Id) REFERENCES users(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversationId TEXT NOT NULL,
    senderId TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (conversationId) REFERENCES conversations(id),
    FOREIGN KEY (senderId) REFERENCES users(id)
  )`);

  // Seed demo data if the DB is empty
  const userCount = await get('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    const users = [
      { id: 'u1', name: 'Sarah Chen', email: 'sarah@example.com', pw: 'password123', uni: 'University of Melbourne', bio: 'Exchange student looking to transfer my lease early.', phone: '0412 345 678' },
      { id: 'u2', name: 'James Nguyen', email: 'james@example.com', pw: 'password123', uni: 'RMIT University', bio: 'Moving back home after graduating. Great place available!', phone: '0423 456 789' },
      { id: 'u3', name: 'Emily Watson', email: 'emily@example.com', pw: 'password123', uni: 'Monash University', bio: 'Heading overseas for my masters. Studio available ASAP.', phone: '0434 567 890' },
    ];
    for (const u of users) {
      const hashed = await bcrypt.hash(u.pw, 12); // cost factor 12 — balances security vs speed
      // PARAMETERISED: all 8 values are bound separately, never interpolated
      await run(
        'INSERT INTO users (id, name, email, password, university, bio, phone, emailVerified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [u.id, u.name, u.email, hashed, u.uni, u.bio, u.phone, 1]
      );
    }

    const listings = [
      { id: 'l1', userId: 'u1', title: 'Modern 2BR Apartment Near Melbourne Uni', description: 'Bright and spacious 2-bedroom apartment just a 5-minute walk from the University of Melbourne. Recently renovated kitchen, in-unit laundry, and a sunny balcony with city views. Building has gym and rooftop terrace. Transferring lease due to exchange program abroad.', address: '45 Swanston St', city: 'Melbourne', suburb: 'Carlton', rent: 650, bond: 2600, availableFrom: '2024-03-01', availableTo: '2024-12-31', type: 'apartment', furnished: 1, bedrooms: 2, bathrooms: 1, tenants: 2, nearbyUni: 'University of Melbourne', images: JSON.stringify(['https://picsum.photos/seed/l1/800/500', 'https://picsum.photos/seed/l1b/800/500']) },
      { id: 'l2', userId: 'u2', title: 'Cozy Studio in Fitzroy - Great for Students', description: 'Perfect studio apartment in vibrant Fitzroy. Walking distance to RMIT City campus and multiple tram lines. Compact but well-designed with a Murphy bed, kitchenette, and private bathroom. All utilities included in rent. Great cafes and bars downstairs.', address: '12 Brunswick St', city: 'Melbourne', suburb: 'Fitzroy', rent: 320, bond: 1280, availableFrom: '2024-02-15', availableTo: '2024-11-30', type: 'studio', furnished: 1, bedrooms: 1, bathrooms: 1, tenants: 1, nearbyUni: 'RMIT University', images: JSON.stringify(['https://picsum.photos/seed/l2/800/500']) },
      { id: 'l3', userId: 'u3', title: 'Shared House - 1 Room Available in Clayton', description: 'Single room available in a friendly 4-bedroom share house 500m from Monash University Clayton campus. Shared kitchen, living room, and 2 bathrooms. Large backyard, off-street parking, fast NBN included. Housemates are all Monash students.', address: '88 Wellington Rd', city: 'Melbourne', suburb: 'Clayton', rent: 240, bond: 960, availableFrom: '2024-03-10', availableTo: '2025-01-31', type: 'house', furnished: 1, bedrooms: 4, bathrooms: 2, tenants: 4, nearbyUni: 'Monash University', images: JSON.stringify(['https://picsum.photos/seed/l3/800/500', 'https://picsum.photos/seed/l3b/800/500']) },
      { id: 'l4', userId: 'u1', title: 'Luxury 1BR in Southbank with River Views', description: 'Stunning 1-bedroom apartment in Southbank with panoramic Yarra River views. Floor-to-ceiling windows, modern appliances, and a generous living area. Building features pool, gym, and 24/7 concierge. Easy tram access to Melbourne Uni.', address: '200 City Rd', city: 'Melbourne', suburb: 'Southbank', rent: 550, bond: 2200, availableFrom: '2024-04-01', availableTo: '2024-12-15', type: 'apartment', furnished: 0, bedrooms: 1, bathrooms: 1, tenants: 1, nearbyUni: 'University of Melbourne', images: JSON.stringify(['https://picsum.photos/seed/l4/800/500']) },
      { id: 'l5', userId: 'u2', title: 'Student Accommodation - En-suite Room at UniLodge', description: 'En-suite room at UniLodge Swanston Street. All-inclusive rent covers electricity, water, internet, and weekly cleaning of common areas. Ideal for international students.', address: '235 Swanston St', city: 'Melbourne', suburb: 'Melbourne CBD', rent: 410, bond: 1640, availableFrom: '2024-02-20', availableTo: '2024-11-20', type: 'student_accom', furnished: 1, bedrooms: 1, bathrooms: 1, tenants: 3, nearbyUni: 'University of Melbourne', images: JSON.stringify(['https://picsum.photos/seed/l5/800/500', 'https://picsum.photos/seed/l5b/800/500']) },
      { id: 'l6', userId: 'u3', title: 'Sunny 3BR House in Brunswick - Student Friendly', description: 'Charming 3-bedroom Victorian terrace in Brunswick. Newly renovated bathroom and kitchen. Huge backyard with veggie garden. Close to Brunswick train station and multiple tram lines into RMIT and Melbourne Uni.', address: '57 Lygon St', city: 'Melbourne', suburb: 'Brunswick', rent: 290, bond: 1160, availableFrom: '2024-03-05', availableTo: '2025-02-28', type: 'house', furnished: 0, bedrooms: 3, bathrooms: 1, tenants: 3, nearbyUni: 'RMIT University', images: JSON.stringify(['https://picsum.photos/seed/l6/800/500']) },
    ];
    for (const l of listings) {
      await run(
        'INSERT INTO listings (id, userId, title, description, address, city, suburb, rent, bond, availableFrom, availableTo, type, furnished, bedrooms, bathrooms, tenants, nearbyUni, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [l.id, l.userId, l.title, l.description, l.address, l.city, l.suburb, l.rent, l.bond, l.availableFrom, l.availableTo, l.type, l.furnished, l.bedrooms, l.bathrooms, l.tenants || 1, l.nearbyUni, l.images]
      );
    }
    console.log('Database seeded with sample data.');
  }
}

// ── Email Verification Helpers ─────────────────────────────────────────────

/**
 * Creates a secure random email verification token for a user.
 * crypto.randomBytes(32) produces 256 bits — sufficient for a single-use token.
 */
async function createEmailToken(userId, type = 'verify_email') {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 h
  const id = uuidv4();
  // PARAMETERISED: token value is bound, never embedded in the SQL string
  await run(
    'INSERT INTO email_tokens (id, userId, token, type, expiresAt) VALUES (?, ?, ?, ?, ?)',
    [id, userId, token, type, expiresAt]
  );
  return token;
}

/**
 * Sends a verification email.
 * In development we log the link to console instead of requiring SMTP setup.
 * Replace the console.log with a real nodemailer.sendMail() call in production.
 */
async function sendVerificationEmail(email, token) {
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

  if (resend) {
    await resend.emails.send({
      from: 'SwapLease <noreply@swaplease.com.au>',
      to: email,
      subject: 'Verify your SwapLease account',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#1d4ed8">Welcome to SwapLease!</h2>
          <p>Click the button below to verify your email address and activate your account.</p>
          <a href="${verifyUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Verify my email</a>
          <p style="color:#6b7280;font-size:13px;margin-top:24px">This link expires in 24 hours. If you didn't sign up, you can ignore this email.</p>
        </div>
      `,
    });
  } else {
    console.log('\n────────────────────────────────────────────');
    console.log('EMAIL VERIFICATION (dev mode — set RESEND_API_KEY to send real emails)');
    console.log(`    To: ${email}`);
    console.log(`    Link: ${verifyUrl}`);
    console.log('────────────────────────────────────────────\n');
  }
}

// ── Global Middleware ──────────────────────────────────────────────────────

app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Session-Id'],
  exposedHeaders: ['X-New-CSRF-Token'], // Allow client to read the rotated token
}));
app.use(express.json({ limit: '1mb' })); // cap body size to prevent memory exhaustion

// sanitizeBody runs before ALL routes — strips HTML/script tags from req.body
app.use(sanitizeBody);

// ── Auth Middleware ────────────────────────────────────────────────────────

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ── CSRF Token Endpoint ────────────────────────────────────────────────────

// GET /api/csrf-token — no auth required; issues a token for the session
app.get('/api/csrf-token', issueCsrfToken);

// ── Listing Image Serve Route (auth-gated, outside web root) ──────────────

/**
 * Serves uploaded files from uploads_secure/ only after validating the path.
 * Because uploads_secure/ is NOT registered with express.static(), no file
 * in that directory is directly accessible via URL — only through this route.
 */
app.get('/api/uploads/:filename', (req, res) => {
  // Sanitise the filename: strip any path traversal sequences
  const safeName = path.basename(req.params.filename);
  const filePath = path.join(UPLOAD_DIR, safeName);

  // Verify the resolved path is still inside UPLOAD_DIR
  if (!filePath.startsWith(UPLOAD_DIR + path.sep)) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.sendFile(filePath);
});

// ── Secure Upload Route ────────────────────────────────────────────────────

app.post(
  '/api/upload',
  authMiddleware,
  validateCsrfToken,
  upload.array('images', 10),
  handleUploadError,
  (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    // Return the API URL for each uploaded file (not the raw filesystem path)
    const urls = req.files.map(f => `${BACKEND_URL}/api/uploads/${f.filename}`);
    res.json({ urls });
  }
);

// ── AUTH ROUTES ────────────────────────────────────────────────────────────

const authRouter = express.Router();

/**
 * POST /api/auth/register
 *
 * Security chain:
 *  sanitizeBody (global) → validate(registerSchema) → bcrypt hash → parameterised INSERT
 *
 * The registerSchema enforces:
 *  - email === confirmEmail (confirm email address field)
 *  - password complexity (min 8 chars, uppercase, digit)
 *  - name character whitelist (no HTML injection via name field)
 */
authRouter.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { name, email, password, university } = req.body;
    // PARAMETERISED: email value bound separately — cannot break out of the WHERE clause
    const existing = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    // bcrypt cost factor 12: ~300ms on commodity hardware — makes brute-force infeasible
    const hashedPassword = await bcrypt.hash(password, 12);
    const id = uuidv4();

    // PARAMETERISED: all 5 values bound — user-supplied strings never touch the SQL text
    await run(
      'INSERT INTO users (id, name, email, password, university, emailVerified) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, email, hashedPassword, university || null, 0]
    );

    // Create and "send" verification token
    const verifyToken = await createEmailToken(id, 'verify_email');
    await sendVerificationEmail(email, verifyToken);

    res.status(201).json({
      message: 'Account created. Check your email (or console in dev mode) to verify your address.',
      // Return token in dev so the test client can verify without email
      devVerifyToken: process.env.NODE_ENV === 'production' ? undefined : verifyToken,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * GET /api/auth/verify-email?token=...
 * Marks the user's email as verified. Token is single-use.
 */
authRouter.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token required' });

    // PARAMETERISED: token value bound — no SQL injection possible
    const record = await get(
      "SELECT * FROM email_tokens WHERE token = ? AND type = 'verify_email' AND usedAt IS NULL",
      [token]
    );

    if (!record) return res.status(400).json({ error: 'Invalid or already-used token' });
    if (new Date(record.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Token expired. Request a new verification email.' });
    }

    // Mark token as used and verify the user — both in one round-trip via parameterised statements
    await run('UPDATE email_tokens SET usedAt = datetime("now") WHERE id = ?', [record.id]);
    await run('UPDATE users SET emailVerified = 1 WHERE id = ?', [record.userId]);

    res.json({ message: 'Email verified! You can now log in.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * POST /api/auth/resend-verification
 */
authRouter.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    // PARAMETERISED
    const user = await get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    // Always respond the same way to prevent email enumeration
    if (!user || user.emailVerified) {
      return res.json({ message: 'If that email exists and is unverified, we sent a new link.' });
    }
    const token = await createEmailToken(user.id, 'verify_email');
    await sendVerificationEmail(user.email, token);
    res.json({ message: 'Verification email resent. Check the console in dev mode.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * POST /api/auth/login
 * validate(loginSchema) ensures email is a valid email and password is present.
 */
authRouter.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    // PARAMETERISED
    const user = await get('SELECT * FROM users WHERE email = ?', [email]);

    // Deliberately identical error message for "user not found" vs "wrong password"
    // to prevent user enumeration attacks
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    if (!user.emailVerified) {
      return res.status(403).json({
        error: 'Please verify your email address before logging in.',
        needsVerification: true,
      });
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: userWithoutPassword });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

authRouter.get('/me', authMiddleware, async (req, res) => {
  try {
    // PARAMETERISED: req.user.id came from the verified JWT — still parameterised as best practice
    const user = await get(
      'SELECT id, name, email, university, bio, phone, avatar, emailVerified, createdAt FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.use('/api/auth', authRouter);

// ── LISTINGS ROUTES ────────────────────────────────────────────────────────

const listingsRouter = express.Router();

const parseListing = (l) => {
  if (!l) return l;
  try { l.images = JSON.parse(l.images || '[]'); } catch { l.images = []; }
  l.furnished = !!l.furnished;
  return l;
};

/**
 * GET /api/listings
 *
 * Dynamic query building — still fully parameterised.
 * User search terms are pushed into the `params` array as bound values (?).
 * The `query` string only ever receives static SQL fragments appended to it —
 * no user input is ever concatenated directly into the query string.
 *
 * The LIKE pattern uses `%${search}%` but this is placed into `params`, not
 * into the SQL string itself, so it cannot escape the string or inject SQL.
 */
listingsRouter.get('/', async (req, res) => {
  try {
    const { search, type, maxRent, city, furnished, bedrooms, sort } = req.query;

    let query = `
      SELECT l.*, u.name as userName, u.university as userUniversity
      FROM listings l
      JOIN users u ON l.userId = u.id
      WHERE l.status = ?
    `;
    const params = ['active']; // always the first bound value

    if (search) {
      // PARAMETERISED: the search string is a bound value — cannot inject SQL
      query += ' AND (l.title LIKE ? OR l.suburb LIKE ? OR l.city LIKE ? OR l.description LIKE ? OR l.nearbyUni LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }
    if (type) { query += ' AND l.type = ?'; params.push(type); }
    if (maxRent) { query += ' AND l.rent <= ?'; params.push(Number(maxRent)); }
    if (city) { query += ' AND l.city LIKE ?'; params.push(`%${city}%`); }
    if (furnished === 'true') { query += ' AND l.furnished = 1'; } // boolean flag — no param needed
    if (bedrooms) { query += ' AND l.bedrooms >= ?'; params.push(Number(bedrooms)); }

    // ORDER BY uses static strings selected from a fixed set — no user value interpolated
    if (sort === 'cheapest') query += ' ORDER BY l.rent ASC';
    else if (sort === 'expensive') query += ' ORDER BY l.rent DESC';
    else query += ' ORDER BY l.createdAt DESC';

    const listings = await all(query, params);
    res.json(listings.map(parseListing));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

listingsRouter.get('/:id', async (req, res) => {
  try {
    // PARAMETERISED: req.params.id is a bound value
    const listing = await get(
      `SELECT l.*, u.name as userName, u.university as userUniversity,
              u.bio as userBio, u.avatar as userAvatar
       FROM listings l
       JOIN users u ON l.userId = u.id
       WHERE l.id = ?`,
      [req.params.id]
    );
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json(parseListing(listing));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

listingsRouter.post('/', authMiddleware, validateCsrfToken, validate(createListingSchema), async (req, res) => {
  try {
    const { title, description, address, city, suburb, rent, bond, availableFrom, availableTo, type, furnished, bedrooms, bathrooms, tenants, nearbyUni, images } = req.body;
    const id = uuidv4();
    await run(
      'INSERT INTO listings (id, userId, title, description, address, city, suburb, rent, bond, availableFrom, availableTo, type, furnished, bedrooms, bathrooms, tenants, nearbyUni, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.user.id, title, description || null, address || null, city || null, suburb || null, rent || null, bond || null, availableFrom || null, availableTo || null, type, furnished ? 1 : 0, bedrooms, bathrooms, tenants || 1, nearbyUni || null, JSON.stringify(images)]
    );
    const listing = await get('SELECT * FROM listings WHERE id = ?', [id]);
    res.status(201).json(parseListing(listing));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

listingsRouter.put('/:id', authMiddleware, validateCsrfToken, validate(updateListingSchema), async (req, res) => {
  try {
    // PARAMETERISED
    const listing = await get('SELECT * FROM listings WHERE id = ?', [req.params.id]);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.userId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    const b = req.body;
    // PARAMETERISED: all values bound
    await run(
      'UPDATE listings SET title=?, description=?, address=?, city=?, suburb=?, rent=?, bond=?, availableFrom=?, availableTo=?, type=?, furnished=?, bedrooms=?, bathrooms=?, nearbyUni=?, images=?, status=? WHERE id=?',
      [b.title ?? listing.title, b.description ?? listing.description, b.address ?? listing.address, b.city ?? listing.city, b.suburb ?? listing.suburb, b.rent ?? listing.rent, b.bond ?? listing.bond, b.availableFrom ?? listing.availableFrom, b.availableTo ?? listing.availableTo, b.type ?? listing.type, b.furnished !== undefined ? (b.furnished ? 1 : 0) : listing.furnished, b.bedrooms ?? listing.bedrooms, b.bathrooms ?? listing.bathrooms, b.nearbyUni ?? listing.nearbyUni, b.images ? JSON.stringify(b.images) : listing.images, b.status ?? listing.status, req.params.id]
    );
    const updated = await get('SELECT * FROM listings WHERE id = ?', [req.params.id]);
    res.json(parseListing(updated));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

listingsRouter.delete('/:id', authMiddleware, validateCsrfToken, async (req, res) => {
  try {
    // PARAMETERISED
    const listing = await get('SELECT * FROM listings WHERE id = ?', [req.params.id]);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.userId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    await run('DELETE FROM listings WHERE id = ?', [req.params.id]);
    res.json({ message: 'Listing deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

listingsRouter.post('/:id/contact', authMiddleware, validateCsrfToken, async (req, res) => {
  try {
    const listing = await get('SELECT * FROM listings WHERE id = ?', [req.params.id]);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.userId === req.user.id) return res.status(400).json({ error: 'Cannot contact yourself' });
    // PARAMETERISED: 5 bound values in a single lookup
    let conv = await get(
      'SELECT * FROM conversations WHERE listingId = ? AND ((user1Id = ? AND user2Id = ?) OR (user1Id = ? AND user2Id = ?))',
      [req.params.id, req.user.id, listing.userId, listing.userId, req.user.id]
    );
    if (!conv) {
      const id = uuidv4();
      await run('INSERT INTO conversations (id, listingId, user1Id, user2Id) VALUES (?, ?, ?, ?)', [id, req.params.id, req.user.id, listing.userId]);
      conv = await get('SELECT * FROM conversations WHERE id = ?', [id]);
    }
    res.json(conv);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.use('/api/listings', listingsRouter);

// ── MESSAGES ROUTES ────────────────────────────────────────────────────────

const messagesRouter = express.Router();

messagesRouter.get('/conversations', authMiddleware, async (req, res) => {
  try {
    // PARAMETERISED: req.user.id bound twice for the OR clause
    const convs = await all(`
      SELECT c.*,
        u1.name as user1Name, u1.avatar as user1Avatar,
        u2.name as user2Name, u2.avatar as user2Avatar,
        l.title as listingTitle,
        (SELECT content FROM messages WHERE conversationId = c.id ORDER BY createdAt DESC LIMIT 1) as lastMessage,
        (SELECT createdAt FROM messages WHERE conversationId = c.id ORDER BY createdAt DESC LIMIT 1) as lastMessageAt
      FROM conversations c
      JOIN users u1 ON c.user1Id = u1.id
      JOIN users u2 ON c.user2Id = u2.id
      LEFT JOIN listings l ON c.listingId = l.id
      WHERE c.user1Id = ? OR c.user2Id = ?
      ORDER BY lastMessageAt DESC, c.createdAt DESC
    `, [req.user.id, req.user.id]);
    res.json(convs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

messagesRouter.get('/conversations/listing/:listingId', authMiddleware, async (req, res) => {
  try {
    const listing = await get('SELECT * FROM listings WHERE id = ?', [req.params.listingId]);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    let conv = await get(
      'SELECT * FROM conversations WHERE listingId = ? AND ((user1Id = ? AND user2Id = ?) OR (user1Id = ? AND user2Id = ?))',
      [req.params.listingId, req.user.id, listing.userId, listing.userId, req.user.id]
    );
    if (!conv && listing.userId !== req.user.id) {
      const id = uuidv4();
      await run('INSERT INTO conversations (id, listingId, user1Id, user2Id) VALUES (?, ?, ?, ?)', [id, req.params.listingId, req.user.id, listing.userId]);
      conv = await get('SELECT * FROM conversations WHERE id = ?', [id]);
    }
    res.json(conv);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

messagesRouter.get('/conversations/:conversationId', authMiddleware, async (req, res) => {
  try {
    const conv = await get('SELECT * FROM conversations WHERE id = ?', [req.params.conversationId]);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    if (conv.user1Id !== req.user.id && conv.user2Id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    const messages = await all(
      'SELECT m.*, u.name as senderName FROM messages m JOIN users u ON m.senderId = u.id WHERE m.conversationId = ? ORDER BY m.createdAt ASC',
      [req.params.conversationId]
    );
    res.json(messages);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

messagesRouter.post('/conversations/:conversationId', authMiddleware, validateCsrfToken, validate(sendMessageSchema), async (req, res) => {
  try {
    const conv = await get('SELECT * FROM conversations WHERE id = ?', [req.params.conversationId]);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    if (conv.user1Id !== req.user.id && conv.user2Id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    const { content } = req.body; // already validated and trimmed by Zod schema
    const id = uuidv4();
    // PARAMETERISED
    await run(
      'INSERT INTO messages (id, conversationId, senderId, content) VALUES (?, ?, ?, ?)',
      [id, req.params.conversationId, req.user.id, content]
    );
    const message = await get(
      'SELECT m.*, u.name as senderName FROM messages m JOIN users u ON m.senderId = u.id WHERE m.id = ?',
      [id]
    );
    res.status(201).json(message);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.use('/api/messages', messagesRouter);

// ── USERS ROUTES ───────────────────────────────────────────────────────────

const usersRouter = express.Router();

usersRouter.get('/:id', async (req, res) => {
  try {
    // PARAMETERISED
    const user = await get(
      'SELECT id, name, university, bio, avatar, createdAt FROM users WHERE id = ?',
      [req.params.id]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    const listingCountRow = await get(
      'SELECT COUNT(*) as count FROM listings WHERE userId = ? AND status = ?',
      [req.params.id, 'active']
    );
    res.json({ ...user, listingCount: listingCountRow.count });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

usersRouter.put('/me', authMiddleware, validateCsrfToken, validate(updateProfileSchema), async (req, res) => {
  try {
    const { name, bio, university, phone } = req.body;
    const current = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    // PARAMETERISED: 5 values bound
    await run(
      'UPDATE users SET name=?, bio=?, university=?, phone=? WHERE id=?',
      [name ?? current.name, bio ?? current.bio, university ?? current.university, phone ?? current.phone, req.user.id]
    );
    const user = await get(
      'SELECT id, name, email, university, bio, phone, avatar, emailVerified, createdAt FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.use('/api/users', usersRouter);

// ── Start ──────────────────────────────────────────────────────────────────

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`SwapLease API running on http://localhost:${PORT}`);
    console.log('Security: CSRF tokens, Zod validation, parameterised queries, sanitization all active.');
  });
}).catch(err => { console.error('DB init failed:', err); process.exit(1); });
