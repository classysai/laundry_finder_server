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

// Create
router.post('/', auth, createBooking);

// Read collections
router.get('/owner', auth, getOwnerBookings); // bookings for laundries owned by current user
router.get('/me', auth, getMyBookings);       // bookings created by current user

// Read single
router.get('/:id', auth, getBookingById);

// Update full
router.put('/:id', auth, updateBooking);

// Patch status (owner only)
router.patch('/:id/status', auth, updateBookingStatus);

// Delete
router.delete('/:id', auth, deleteBooking);

module.exports = router;
