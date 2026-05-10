const express = require('express');
const { createBooking, updateBookingStatus, getBookingsByEmail } = require('../controllers/bookingController');
const { bookingValidationRules, validate } = require('../middleware/validate');

const router = express.Router();

router.post('/',             bookingValidationRules, validate, createBooking);
router.patch('/:id/status',  updateBookingStatus);
router.get('/',              getBookingsByEmail);

module.exports = router;
