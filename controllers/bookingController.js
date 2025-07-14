const Booking = require('../models/Booking');
const Laundry = require('../models/Laundry');

exports.createBooking = async (req, res) => {
  const { laundryId } = req.body;
  const booking = await Booking.create({ userId: req.user.id, laundryId });
  res.json(booking);
};

exports.getOwnerBookings = async (req, res) => {
  const bookings = await Booking.findAll({ include: [Laundry] });
  const filtered = bookings.filter(b => b.Laundry.ownerId === req.user.id);
  res.json(filtered);
};
