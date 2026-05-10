const mongoose = require('mongoose');
const Expert   = require('../models/Expert');
const Booking  = require('../models/Booking');

// ── POST /api/bookings ────────────────────────────────────────────────────────
// Uses a Mongoose managed transaction (ACID) so that:
//   1. Expert slot is atomically marked isBooked = true
//   2. Booking document is created
// If either step fails both roll back.
// Fallback: if server runs on standalone Mongo (no replica-set), transactions
// are not supported → we catch the error and fall through to sequential ops.
const createBooking = async (req, res, next) => {
  const { expertId, userName, email, phone, date, timeSlot, notes } = req.body;

  const session = await mongoose.startSession();

  try {
    let booking;

    await session.withTransaction(async () => {
      // ── Step 1: atomically flip isBooked on the matching, un-booked slot ──
      const updatedExpert = await Expert.findOneAndUpdate(
        {
          _id: expertId,
          availableSlots: {
            $elemMatch: { date, time: timeSlot, isBooked: false },
          },
        },
        {
          $set: { 'availableSlots.$[slot].isBooked': true },
        },
        {
          arrayFilters: [{ 'slot.date': date, 'slot.time': timeSlot, 'slot.isBooked': false }],
          new: true,
          session,
        }
      );

      if (!updatedExpert) {
        const err      = new Error('Slot is no longer available');
        err.status     = 409;
        err.isConflict = true;
        throw err;
      }

      // ── Step 2: create the booking document ───────────────────────────────
      const created = await Booking.create(
        [
          {
            expertId,
            expertName: updatedExpert.name,
            userName,
            email: email.toLowerCase(),
            phone,
            date,
            timeSlot,
            notes: notes || '',
          },
        ],
        { session }
      );

      booking = created[0];
    });

    // ── Emit real-time event to expert-specific room ──────────────────────
    const io = req.app.get('io');
    if (io) {
      io.to(`expert-${booking.expertId}`).emit('slotBooked', {
        expertId: String(booking.expertId),
        date:     booking.date,
        timeSlot: booking.timeSlot,
      });
    }

    return res.status(201).json({ status: 'success', data: booking });
  } catch (err) {
    // ── Slot conflict (thrown inside transaction or duplicate-key index) ──
    if (err.isConflict || err.code === 11000) {
      return res.status(409).json({
        status:  'conflict',
        message: 'This time slot has just been taken. Please choose another.',
        errors:  [{ field: 'timeSlot', message: 'Slot no longer available' }],
      });
    }

    // ── Standalone MongoDB — transactions not supported ───────────────────
    if (err.message && err.message.includes('Transaction')) {
      // Graceful fallback: sequential operations
      try {
        const updatedExpert = await Expert.findOneAndUpdate(
          {
            _id: expertId,
            availableSlots: { $elemMatch: { date, time: timeSlot, isBooked: false } },
          },
          { $set: { 'availableSlots.$[slot].isBooked': true } },
          {
            arrayFilters: [{ 'slot.date': date, 'slot.time': timeSlot, 'slot.isBooked': false }],
            new: true,
          }
        );

        if (!updatedExpert) {
          return res.status(409).json({
            status:  'conflict',
            message: 'This time slot has just been taken. Please choose another.',
            errors:  [{ field: 'timeSlot', message: 'Slot no longer available' }],
          });
        }

        const booking = await Booking.create({
          expertId,
          expertName: updatedExpert.name,
          userName,
          email: email.toLowerCase(),
          phone,
          date,
          timeSlot,
          notes: notes || '',
        });

        const io = req.app.get('io');
        if (io) {
          io.to(`expert-${booking.expertId}`).emit('slotBooked', {
            expertId: String(booking.expertId),
            date:     booking.date,
            timeSlot: booking.timeSlot,
          });
        }

        return res.status(201).json({ status: 'success', data: booking });
      } catch (fallbackErr) {
        if (fallbackErr.code === 11000) {
          return res.status(409).json({
            status:  'conflict',
            message: 'This time slot has just been taken. Please choose another.',
            errors:  [{ field: 'timeSlot', message: 'Slot no longer available' }],
          });
        }
        return next(fallbackErr);
      }
    }

    next(err);
  } finally {
    session.endSession();
  }
};

// ── PATCH /api/bookings/:id/status ───────────────────────────────────────────
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ['pending', 'confirmed', 'completed'];

    if (!valid.includes(status)) {
      return res.status(400).json({
        status:  'error',
        message: `Status must be one of: ${valid.join(', ')}`,
        errors:  [],
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ status: 'error', message: 'Booking not found', errors: [] });
    }

    res.json({ status: 'success', data: booking });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/bookings?email= ──────────────────────────────────────────────────
const getBookingsByEmail = async (req, res, next) => {
  try {
    const { email } = req.query;

    if (!email || !email.trim()) {
      return res.status(400).json({
        status:  'error',
        message: 'Email query parameter is required',
        errors:  [{ field: 'email', message: 'Email is required' }],
      });
    }

    const bookings = await Booking.find({ email: email.toLowerCase().trim() })
      .populate('expertId', 'name category avatar')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ status: 'success', data: bookings });
  } catch (err) {
    next(err);
  }
};

module.exports = { createBooking, updateBookingStatus, getBookingsByEmail };
