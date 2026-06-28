/**
 * Server-side Input Sanitization Middleware
 *
 * Strips HTML tags (especially <script>, <iframe>, event handlers like onerror=)
 * from all incoming string fields before they reach route handlers.
 *
 * This is a defense-in-depth complement to:
 *   - Parameterized queries (prevent SQL injection at the DB layer)
 *   - Frontend DOMPurify (prevent XSS at the render layer)
 *   - Zod schema validation (enforce type/shape constraints)
 *
 * We use a simple but effective regex approach here rather than a full HTML
 * parser, because our inputs are plain text fields — we expect NO legitimate
 * HTML in names, addresses, descriptions, etc.
 */

// Patterns we actively strip. Order matters — remove script blocks first,
// then inline event handlers, then remaining tags.
const DANGEROUS_PATTERNS = [
  // <script>...</script> blocks (case-insensitive, multiline, with any attributes)
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,

  // <iframe>, <object>, <embed>, <link>, <meta> — can load remote content
  /<(iframe|object|embed|link|meta|base|form|input|button|select|textarea)\b[^>]*>/gi,
  /<\/(iframe|object|embed|form|select|textarea)>/gi,

  // Inline event handlers: onclick=, onerror=, onload=, onmouseover=, etc.
  /\bon\w+\s*=\s*["'][^"']*["']/gi,
  /\bon\w+\s*=\s*[^\s>]*/gi,

  // javascript: and data: URIs in any attribute value
  /javascript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /vbscript\s*:/gi,

  // Any remaining HTML tags (strips all markup from plain-text fields)
  /<[^>]+>/g,
];

/**
 * Recursively sanitize a value:
 *   - strings: run through all DANGEROUS_PATTERNS, then trim
 *   - objects/arrays: recurse into each value
 *   - numbers/booleans/null: pass through unchanged
 */
function sanitizeValue(value) {
  if (typeof value === 'string') {
    let cleaned = value;
    for (const pattern of DANGEROUS_PATTERNS) {
      // Reset lastIndex between calls since patterns use global flag
      pattern.lastIndex = 0;
      cleaned = cleaned.replace(pattern, '');
    }
    return cleaned.trim();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value !== null && typeof value === 'object') {
    const sanitized = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val);
    }
    return sanitized;
  }

  // numbers, booleans, null, undefined pass through untouched
  return value;
}

/**
 * Express middleware: sanitizes req.body in-place before route handlers run.
 * Safe to apply globally — only touches string values.
 */
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  next();
}

module.exports = { sanitizeBody, sanitizeValue };
