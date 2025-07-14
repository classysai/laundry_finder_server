const express = require('express');
const { createBooking, getOwnerBookings } = require('../controllers/bookingController');
const auth = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', auth, createBooking);
router.get('/owner', auth, getOwnerBookings);

module.exports = router;
