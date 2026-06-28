/**
 * Zod Validation Schemas
 *
 * Every schema defines the exact shape, types, and constraints for a request body.
 * Using .parse() / .safeParse() at the route level ensures:
 *   - Unknown fields are stripped (.strip() is the default — no extra keys leak through)
 *   - Types are coerced to their declared type (z.coerce.number() converts "5" → 5)
 *   - Lengths and ranges are enforced (prevents absurdly long inputs that could DoS the DB)
 *   - Zod never interpolates values directly into SQL — it just validates shape/type.
 *     The actual SQL safety comes from parameterized queries in the route handlers.
 */

const { z } = require('zod');

// ─── Auth ──────────────────────────────────────────────────────────────────

const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name too long')
    .regex(/^[\p{L}\s'\-\.]+$/u, 'Name may only contain letters, spaces, hyphens and apostrophes'),

  email: z.string()
    .email('Invalid email address')
    .max(255)
    .toLowerCase(), // normalise before storing/comparing

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),

  confirmEmail: z.string().email('Invalid confirm email').toLowerCase(),

  university: z.string().max(120).optional().nullable(),
}).refine(data => data.email === data.confirmEmail, {
  message: 'Email addresses do not match',
  path: ['confirmEmail'], // surface the error on the confirmEmail field
});

const loginSchema = z.object({
  email: z.string().email('Invalid email').toLowerCase(),
  password: z.string().min(1, 'Password required').max(128),
});

// ─── Listings ──────────────────────────────────────────────────────────────

const LISTING_TYPES = ['apartment', 'house', 'studio', 'student_accom'];

const createListingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(120),
  description: z.string().max(3000).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  suburb: z.string().max(80).optional().nullable(),

  // z.coerce.number() safely converts string "450" → 450 from form submissions.
  // Without coerce, a form POST would send strings, causing NaN in the DB.
  rent: z.coerce.number().positive('Rent must be positive').max(10000, 'Rent too high').optional().nullable(),
  bond: z.coerce.number().nonnegative().max(50000).optional().nullable(),

  availableFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format').optional().nullable(),
  availableTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format').optional().nullable(),

  type: z.enum(LISTING_TYPES).default('apartment'),
  furnished: z.boolean().default(false),
  bedrooms: z.coerce.number().int().min(1).max(20).default(1),
  bathrooms: z.coerce.number().int().min(1).max(20).default(1),
  tenants: z.coerce.number().int().min(1).max(50).default(1),
  nearbyUni: z.string().max(120).optional().nullable(),

  // Each image must be a valid URL — prevents arbitrary string injection into image tags
  images: z.array(
    z.string().url('Each image must be a valid URL').max(500)
  ).max(10, 'Maximum 10 images').default([]),
});

const updateListingSchema = createListingSchema.partial(); // All fields optional on update

// ─── Messages ──────────────────────────────────────────────────────────────

const sendMessageSchema = z.object({
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message too long (max 2000 characters)')
    .transform(s => s.trim()), // .transform() runs after validation — safe to use here
});

// ─── Users ─────────────────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  bio: z.string().max(500).optional().nullable(),
  university: z.string().max(120).optional().nullable(),
  phone: z.string()
    .max(20)
    .regex(/^[\d\s\+\-\(\)]*$/, 'Phone number contains invalid characters')
    .optional()
    .nullable(),
});

// ─── Helper: validate middleware factory ───────────────────────────────────

/**
 * Creates an Express middleware that validates req.body against a Zod schema.
 * On failure, returns 400 with structured field-level error messages.
 * On success, replaces req.body with the parsed (and stripped) Zod output —
 * this means unknown extra fields are automatically removed.
 *
 * Usage:
 *   router.post('/register', validate(registerSchema), handler)
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      // Flatten Zod errors into { field: firstErrorMessage } for easy frontend display
      const errors = {};
      for (const issue of result.error.issues) {
        const field = issue.path.join('.') || 'body';
        if (!errors[field]) errors[field] = issue.message;
      }
      return res.status(400).json({ error: 'Validation failed', errors });
    }
    // Replace req.body with the validated, stripped, and type-coerced data
    req.body = result.data;
    next();
  };
}

module.exports = {
  registerSchema,
  loginSchema,
  createListingSchema,
  updateListingSchema,
  sendMessageSchema,
  updateProfileSchema,
  validate,
};
