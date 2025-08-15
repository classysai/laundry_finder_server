// controllers/bookingController.js
const Booking = require('../models/Booking');
const Laundry = require('../models/Laundry');
const User = require('../models/User');

// Helper: check ownership or booker rights for a single booking (already fetched with includes)
function canView(booking, userId) {
  const isOwner = booking?.Laundry?.ownerId === userId;
  const isBooker = booking?.userId === userId;
  return isOwner || isBooker;
}

function canOwnerModify(booking, userId) {
  return booking?.Laundry?.ownerId === userId;
}

function canUserModifyOwn(booking, userId) {
  return booking?.userId === userId;
}

// CREATE: POST /api/bookings
exports.createBooking = async (req, res) => {
  try {
    const { laundryId, scheduledAt, serviceType, notes, price } = req.body;
    if (!laundryId) return res.status(400).json({ message: 'laundryId is required' });

    const laund = await Laundry.findByPk(laundryId);
    if (!laund) return res.status(404).json({ message: 'Laundry not found' });

    // Optional rule: prevent owners booking their own laundry
    if (laund.ownerId === req.user.id) {
      return res.status(400).json({ message: 'Owners cannot book their own laundry' });
    }

    const booking = await Booking.create({
      userId: req.user.id,
      laundryId,
      scheduledAt: scheduledAt || null,
      serviceType: serviceType || null,
      notes: notes || null,
      price: typeof price === 'number' || (price && !Number.isNaN(Number(price))) ? price : null,
      status: 'pending',
    });

    res.status(201).json(booking);
  } catch (err) {
    console.error('createBooking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// READ (owner list): GET /api/bookings/owner
exports.getOwnerBookings = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const bookings = await Booking.findAll({
      include: [
        {
          model: Laundry,
          as: 'Laundry',
          attributes: ['id', 'name', 'address', 'phone', 'imageUrl', 'ownerId'],
          where: { ownerId },
          required: true,
        },
        { model: User, as: 'User', attributes: ['id', 'name', 'email', 'phone'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(bookings);
  } catch (err) {
    console.error('getOwnerBookings error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// READ (my bookings as the customer): GET /api/bookings/me
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { userId: req.user.id },
      include: [
        { model: Laundry, as: 'Laundry', attributes: ['id', 'name', 'address', 'phone', 'imageUrl', 'ownerId'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(bookings);
  } catch (err) {
    console.error('getMyBookings error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// READ (single): GET /api/bookings/:id
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByPk(id, {
      include: [
        { model: Laundry, as: 'Laundry', attributes: ['id', 'name', 'address', 'phone', 'imageUrl', 'ownerId'] },
        { model: User, as: 'User', attributes: ['id', 'name', 'email', 'phone'] },
      ],
    });

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!canView(booking, req.user.id)) return res.status(403).json({ message: 'Forbidden' });

    res.json(booking);
  } catch (err) {
    console.error('getBookingById error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UPDATE (full): PUT /api/bookings/:id
// Owners can update anything except userId/laundryId; Bookers can update only their own booking's
// non-critical fields (scheduledAt, serviceType, notes) while status changes are reserved for owners.
exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByPk(id, {
      include: [{ model: Laundry, as: 'Laundry', attributes: ['ownerId'] }],
    });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isOwner = canOwnerModify(booking, req.user.id);
    const isBooker = canUserModifyOwn(booking, req.user.id);
    if (!isOwner && !isBooker) return res.status(403).json({ message: 'Forbidden' });

    const { scheduledAt, serviceType, notes, price, status } = req.body;

    // Booker cannot change status; owner can.
    if (!isOwner && typeof status !== 'undefined') {
      return res.status(403).json({ message: 'Only laundry owner can change status' });
    }

    if (typeof scheduledAt !== 'undefined') booking.scheduledAt = scheduledAt;
    if (typeof serviceType !== 'undefined') booking.serviceType = serviceType;
    if (typeof notes !== 'undefined') booking.notes = notes;
    if (typeof price !== 'undefined') booking.price = price;

    if (isOwner && typeof status !== 'undefined') {
      const next = String(status).toLowerCase();
      const allowed = ['pending', 'confirmed', 'cancelled'];
      if (!allowed.includes(next)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      booking.status = next;
    }

    await booking.save();
    return res.json(booking);
  } catch (err) {
    console.error('updateBooking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH status (owner only): PATCH /api/bookings/:id/status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const next = (req.body?.status || '').toLowerCase();
    const allowed = ['pending', 'confirmed', 'cancelled'];
    if (!allowed.includes(next)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await Booking.findByPk(id, {
      include: [{ model: Laundry, as: 'Laundry', attributes: ['ownerId'] }],
    });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!canOwnerModify(booking, req.user.id)) return res.status(403).json({ message: 'Forbidden' });

    booking.status = next;
    await booking.save();
    res.json(booking);
  } catch (err) {
    console.error('updateBookingStatus error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE: DELETE /api/bookings/:id
// Allow owner to remove any booking on their laundry; allow booker to delete their own
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByPk(id, {
      include: [{ model: Laundry, as: 'Laundry', attributes: ['ownerId'] }],
    });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isOwner = canOwnerModify(booking, req.user.id);
    const isBooker = canUserModifyOwn(booking, req.user.id);

    if (!isOwner && !isBooker) return res.status(403).json({ message: 'Forbidden' });

    await booking.destroy();
    res.json({ message: 'Booking deleted' });
  } catch (err) {
    console.error('deleteBooking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
