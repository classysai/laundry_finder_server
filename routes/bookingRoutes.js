// routes/bookingRoutes.js
const express = require('express');
const {
  createBooking,
  getOwnerBookings,
  getMyBookings,
  getBookingById,
  updateBooking,
  updateBookingStatus,
  deleteBooking
} = require('../controllers/bookingController');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// Users create bookings
router.post('/', auth, createBooking);

// Owners read bookings for their laundries; users read their own
router.get('/owner', auth, getOwnerBookings);
router.get('/me', auth, getMyBookings);

// Single booking (owner of that laundry OR the booking user)
router.get('/:id', auth, getBookingById);

// Owner manages status (confirm/cancel/pending)
router.patch('/:id/status', auth, updateBookingStatus);

// Booking user can edit allowed fields (scheduledAt, serviceType, notes, price)
router.put('/:id', auth, updateBooking);

// Delete (owner of laundry OR the booking user)
router.delete('/:id', auth, deleteBooking);

module.exports = router;
