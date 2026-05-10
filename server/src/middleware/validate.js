const { body, validationResult } = require('express-validator');

// ── Booking validation rules ─────────────────────────────────────────────────
const bookingValidationRules = [
  body('expertId')
    .notEmpty().withMessage('Expert ID is required'),

  body('userName')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),

  body('email')
    .isEmail().withMessage('A valid email address is required')
    .normalizeEmail(),

  body('phone')
    .matches(/^\+?[\d\s\-().]{10,15}$/)
    .withMessage('Phone must be 10–15 digits (e.g. +91 9876543210)'),

  body('date')
    .notEmpty().withMessage('Date is required')
    .custom((value) => {
      const selected = new Date(value);
      const today    = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) throw new Error('Date must be today or in the future');
      return true;
    }),

  body('timeSlot')
    .notEmpty().withMessage('Time slot is required'),

  body('notes')
    .optional()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
];

// ── Middleware: collect errors and short-circuit ─────────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = { bookingValidationRules, validate };
