// controllers/bookingController.js
const Booking = require('../models/Booking');
const Laundry = require('../models/Laundry');
const User = require('../models/User');

// View permission: owner of laundry OR the booking user
function canView(booking, userId) {
  const isOwner = booking?.Laundry?.ownerId === userId;
  const isBooker = booking?.userId === userId;
  return isOwner || isBooker;
}

function isOwnerOfLaundry(booking, userId) {
  return booking?.Laundry?.ownerId === userId;
}

// CREATE: users only
exports.createBooking = async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only users can create bookings' });
    }

    const { laundryId } = req.body;
    if (!laundryId) return res.status(400).json({ message: 'laundryId is required' });

    const laund = await Laundry.findByPk(laundryId);
    if (!laund) return res.status(404).json({ message: 'Laundry not found' });

    // Prevent booking own laundry (belt & braces)
    if (laund.ownerId === req.user.id) {
      return res.status(400).json({ message: 'Owners cannot book their own laundry' });
    }

    // Keep to columns that exist in your DB dump
    const booking = await Booking.create({
      userId: req.user.id,
      laundryId,
      status: 'pending',
    });

    res.status(201).json(booking);
  } catch (err) {
    console.error('createBooking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// READ (owner list): bookings for laundries owned by current user
exports.getOwnerBookings = async (req, res) => {
  try {
    const rows = await Booking.findAll({
      include: [{
        model: Laundry,
        as: 'Laundry',
        where: { ownerId: req.user.id },
        attributes: ['id', 'name', 'description', 'address', 'phone', 'imageUrl', 'lat', 'lng', 'ownerId']
      }],
      attributes: [
        'id', 'status', 'scheduledAt', 'serviceType', 'notes', 'price',
        'createdAt', 'updatedAt', 'userId', 'laundryId'
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(rows);
  } catch (e) {
    console.error('getOwnerBookings error:', e);
    res.status(500).json({ message: 'Failed to load bookings' });
  }
};


// READ (my bookings as the customer)
// return ALL booking columns you care about
exports.getMyBookings = async (req, res) => {
  try {
    const rows = await Booking.findAll({
      where: { userId: req.user.id },
      attributes: [
        'id', 'status', 'scheduledAt', 'serviceType', 'notes', 'price',
        'createdAt', 'updatedAt', 'userId', 'laundryId'
      ],
      include: [{
        model: Laundry,
        as: 'Laundry',
        attributes: ['id', 'name', 'description', 'address', 'phone', 'imageUrl', 'lat', 'lng', 'ownerId']
      }],
      order: [['createdAt', 'DESC']],
    });
    res.json(rows);
  } catch (e) {
    console.error('getMyBookings error:', e);
    res.status(500).json({ message: 'Failed to load bookings' });
  }
};


// READ (single)
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByPk(id, {
      attributes: ['id', 'status', 'createdAt', 'updatedAt', 'userId', 'laundryId'],
      include: [
        { model: Laundry, as: 'Laundry', attributes: ['id', 'name', 'description', 'lat', 'lng', 'ownerId'] },
        { model: User, as: 'User', attributes: ['id', 'email'] },
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

// UPDATE FULL (booking user only; no editable fields in current DB schema)
exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;

    // Load booking and the owning laundry to enforce permissions
    const booking = await Booking.findByPk(id, {
      include: [{ model: Laundry, as: 'Laundry', attributes: ['id', 'ownerId'] }]
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Permission checks
    const isUser = req.user?.role === 'user';
    const isOwner = req.user?.role === 'owner';
    const isUsersOwnBooking = booking.userId === req.user?.id;
    const isOwnerOfLaundry = isOwner && booking.Laundry && booking.Laundry.ownerId === req.user?.id;

    if (isUser && !isUsersOwnBooking) {
      return res.status(403).json({ message: 'You can only update your own bookings' });
    }
    if (isOwner && !isOwnerOfLaundry) {
      // Owners can only manage bookings that belong to their laundries
      return res.status(403).json({ message: 'You can only manage bookings for your laundries' });
    }

    // Build whitelist of editable fields
    const allowedForAllUsers = ['scheduledAt', 'serviceType', 'notes', 'price'];
    const allowedForOwnersExtra = ['status']; // owners may update status

    const payload = {};
    for (const f of allowedForAllUsers) {
      if (Object.prototype.hasOwnProperty.call(req.body, f)) {
        payload[f] = req.body[f] === '' ? null : req.body[f];
      }
    }

    // Parse/normalize types
    if (payload.scheduledAt != null) {
      const d = new Date(payload.scheduledAt);
      payload.scheduledAt = isNaN(d.getTime()) ? null : d; // store as Date
    }
    if (payload.price != null) {
      const num = Number(payload.price);
      payload.price = Number.isFinite(num) ? num : null;
    }

    // Owner-only field(s)
    if (isOwnerOfLaundry && Object.prototype.hasOwnProperty.call(req.body, 'status')) {
      payload.status = req.body.status || 'pending';
    }

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: 'No editable fields available for bookings' });
    }

    await booking.update(payload);
    const fresh = await Booking.findByPk(id, {
      include: [{ model: Laundry, as: 'Laundry' }],
    });

    return res.json(fresh);
  } catch (err) {
    console.error('updateBooking error:', err);
    return res.status(500).json({ message: 'Failed to update booking' });
  }
};

// PATCH status (owners manage bookings on their laundries)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const next = String(req.body?.status || '').toLowerCase();
    const allowed = ['pending', 'confirmed', 'cancelled'];
    if (!allowed.includes(next)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await Booking.findByPk(id, {
      include: [{ model: Laundry, as: 'Laundry', attributes: ['ownerId'] }],
    });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (!isOwnerOfLaundry(booking, req.user.id)) {
      return res.status(403).json({ message: 'Only the laundry owner can change status' });
    }

    booking.status = next;
    await booking.save();
    res.json(booking);
  } catch (err) {
    console.error('updateBookingStatus error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE: owner of laundry OR booking user
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByPk(id, {
      include: [{ model: Laundry, as: 'Laundry', attributes: ['ownerId'] }],
    });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isOwner = isOwnerOfLaundry(booking, req.user.id);
    const isBooker = booking.userId === req.user.id;
    if (!isOwner && !isBooker) return res.status(403).json({ message: 'Forbidden' });

    await booking.destroy();
    res.json({ message: 'Booking deleted' });
  } catch (err) {
    console.error('deleteBooking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
