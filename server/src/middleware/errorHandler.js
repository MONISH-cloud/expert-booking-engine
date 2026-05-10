// ── Centralized error handler ─────────────────────────────────────────────────
// All errors land here via next(err). Never leaks stack traces in production.

const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err.message);

  // MongoDB duplicate key → double-booking race condition
  if (err.code === 11000) {
    return res.status(409).json({
      status: 'conflict',
      message: 'This time slot has already been booked',
      errors: [{ field: 'timeSlot', message: 'Slot no longer available' }],
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({ status: 'error', message: 'Validation failed', errors });
  }

  // Mongoose invalid ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid resource ID format',
      errors: [],
    });
  }

  // Application-level errors with explicit status
  const status  = err.status  || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({ status: 'error', message, errors: err.errors || [] });
};

module.exports = errorHandler;
