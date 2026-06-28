/**
 * CSRF Protection Middleware (Double-Submit Token Pattern)
 *
 * Flow:
 *   1. Client calls GET /api/csrf-token → receives a unique token
 *   2. Token is stored server-side in a memory Map keyed by a session ID
 *   3. Client sends token back as X-CSRF-Token header on every POST/PUT/DELETE
 *   4. This middleware validates the header token matches the stored token
 *
 * Why this works: A cross-origin attacker cannot read the token value because
 * browsers enforce the Same-Origin Policy on XHR/fetch responses. Even if the
 * attacker tricks the browser into making a state-changing request, they cannot
 * inject the correct X-CSRF-Token header value.
 *
 * Note: APIs that use JWT in the Authorization header (not cookies) are already
 * inherently immune to CSRF because browsers never auto-attach Authorization
 * headers cross-origin. This middleware adds a defense-in-depth layer.
 */

const crypto = require('crypto');

// In-memory token store: sessionId → { token, createdAt }
// In production, replace with Redis or a DB-backed store for horizontal scaling.
const tokenStore = new Map();

// Tokens expire after 2 hours
const TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

// State-changing HTTP methods that require CSRF validation
const PROTECTED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Generates a cryptographically secure random token.
 * crypto.randomBytes is backed by the OS CSPRNG — never use Math.random() for security tokens.
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex'); // 256 bits of entropy
}

/**
 * Purge tokens older than TOKEN_TTL_MS to prevent unbounded memory growth.
 */
function pruneExpiredTokens() {
  const now = Date.now();
  for (const [sessionId, entry] of tokenStore.entries()) {
    if (now - entry.createdAt > TOKEN_TTL_MS) {
      tokenStore.delete(sessionId);
    }
  }
}
// Prune every 30 minutes
setInterval(pruneExpiredTokens, 30 * 60 * 1000);

/**
 * GET /api/csrf-token
 * Issues a new CSRF token. The client must call this once on app load
 * and store the token (e.g. in memory or a non-cookie variable).
 */
function issueCsrfToken(req, res) {
  // Use an existing session ID from header, or generate a fresh one
  const sessionId = req.headers['x-session-id'] || generateToken();
  const token = generateToken();

  tokenStore.set(sessionId, { token, createdAt: Date.now() });

  // Return both so the client knows which session ID to use on future requests
  res.json({ csrfToken: token, sessionId });
}

/**
 * Middleware: validateCsrfToken
 * Attach this to any router or individual route that changes state.
 * Passes through GET/HEAD/OPTIONS without checking (safe methods per RFC 7231).
 */
function validateCsrfToken(req, res, next) {
  if (!PROTECTED_METHODS.has(req.method)) {
    return next(); // Safe methods are not at risk of CSRF
  }

  const sessionId = req.headers['x-session-id'];
  const headerToken = req.headers['x-csrf-token'];

  if (!sessionId || !headerToken) {
    return res.status(403).json({
      error: 'CSRF token missing. Include X-CSRF-Token and X-Session-Id headers.',
    });
  }

  const stored = tokenStore.get(sessionId);

  if (!stored) {
    return res.status(403).json({ error: 'CSRF session not found. Re-fetch /api/csrf-token.' });
  }

  // Check expiry
  if (Date.now() - stored.createdAt > TOKEN_TTL_MS) {
    tokenStore.delete(sessionId);
    return res.status(403).json({ error: 'CSRF token expired. Re-fetch /api/csrf-token.' });
  }

  // Constant-time comparison to prevent timing attacks.
  // timingSafeEqual requires equal-length buffers.
  const storedBuf = Buffer.from(stored.token, 'utf8');
  const headerBuf = Buffer.from(headerToken, 'utf8');

  const tokensMatch =
    storedBuf.length === headerBuf.length &&
    crypto.timingSafeEqual(storedBuf, headerBuf);

  if (!tokensMatch) {
    return res.status(403).json({ error: 'Invalid CSRF token.' });
  }

  // Rotate the token after each successful use (one-time-use pattern)
  const newToken = generateToken();
  tokenStore.set(sessionId, { token: newToken, createdAt: Date.now() });

  // Send the rotated token back so the client can update its copy
  res.setHeader('X-New-CSRF-Token', newToken);

  next();
}

module.exports = { issueCsrfToken, validateCsrfToken };
