/**
 * Secure File Upload Middleware
 *
 * Security measures applied:
 *
 *  1. EXTENSION WHITELIST — Only explicitly allowed image extensions are accepted.
 *     We check BOTH the MIME type (from the Content-Type header) AND the file
 *     extension. Checking only one is insufficient:
 *       - MIME-only: attacker renames shell.php.jpg → browser sends image/jpeg
 *       - Extension-only: attacker sets Content-Type: image/jpeg on a .php file
 *     Both checks together close these gaps.
 *
 *  2. FILE SIZE LIMIT — Multer's limits.fileSize rejects oversized uploads at
 *     the stream level before the file is fully buffered in memory. This prevents
 *     disk-exhaustion and memory-exhaustion DoS attacks.
 *
 *  3. RANDOMISED FILENAMES — We never trust the client-supplied filename.
 *     Using crypto.randomUUID() + the validated extension prevents:
 *       - Path traversal:  ../../etc/passwd.jpg
 *       - Overwrite attacks: existing-important-file.jpg
 *       - Enumeration: sequential IDs let attackers guess other uploads
 *
 *  4. STORAGE OUTSIDE WEB ROOT — Files are written to uploads_secure/ which
 *     is NOT served by express.static(). To serve a file, a route must
 *     explicitly read it and stream it — this prevents direct URL access to
 *     uploaded content and allows auth checks before serving.
 *
 *  5. FIELD COUNT LIMIT — limits.files prevents a single request from uploading
 *     hundreds of files and exhausting the server.
 */

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// ── Configuration ──────────────────────────────────────────────────────────

const MAX_FILE_SIZE_MB = 5;
const MAX_FILES_PER_REQUEST = 10;

// Whitelist of allowed MIME types and their corresponding extensions.
// Any type not in this map is rejected outright.
const ALLOWED_MIME_TYPES = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
]);

// Derived set of allowed extensions for the double-check
const ALLOWED_EXTENSIONS = new Set(ALLOWED_MIME_TYPES.values());

// ── Storage: OUTSIDE the web root ─────────────────────────────────────────
// This directory is intentionally NOT registered with express.static().
// Files are only accessible via the /api/uploads/:filename route below,
// which can enforce authentication and authorisation checks.

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads_secure');

// Ensure directory exists at startup
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },

  filename: (_req, file, cb) => {
    // Determine the safe extension from the validated MIME type.
    // We use the MIME-derived extension rather than the client's filename extension
    // so an attacker cannot sneak in .php or .html by faking the MIME type —
    // the fileFilter below already verified the MIME, so this is now trustworthy.
    const safeExt = ALLOWED_MIME_TYPES.get(file.mimetype) || '.bin';

    // crypto.randomUUID() generates a v4 UUID — 122 bits of randomness.
    // This makes filenames completely unpredictable.
    const safeName = `${crypto.randomUUID()}${safeExt}`;
    cb(null, safeName);
  },
});

// ── File filter: MIME + extension double-check ─────────────────────────────

function fileFilter(_req, file, cb) {
  // Check 1: MIME type must be in our whitelist
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(
      new Error(`File type not allowed. Accepted types: ${[...ALLOWED_MIME_TYPES.keys()].join(', ')}`),
      false
    );
  }

  // Check 2: Extract the client's original extension and verify it matches
  // an allowed extension. This catches edge cases like image/jpeg with .exe extension.
  const originalExt = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(originalExt)) {
    return cb(
      new Error(`File extension "${originalExt}" not allowed, even with a valid MIME type.`),
      false
    );
  }

  // Both checks passed — allow the upload
  cb(null, true);
}

// ── Multer instance ────────────────────────────────────────────────────────

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024, // bytes
    files: MAX_FILES_PER_REQUEST,
  },
});

// ── Error handler for Multer errors ───────────────────────────────────────

function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.` });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: `Too many files. Maximum is ${MAX_FILES_PER_REQUEST}.` });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
}

module.exports = { upload, handleUploadError, UPLOAD_DIR };
