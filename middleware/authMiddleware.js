const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function auth(req, res, next) {
  try {
    // Accept both 'authorization' and 'Authorization'
    const hdr = req.headers.authorization || req.headers.Authorization;
    if (!hdr || !hdr.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = hdr.split(' ')[1];
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Optional but safer: ensure the user still exists
    const user = await User.findByPk(payload.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found for token' });
    }

    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    console.error('auth middleware error:', err);
    res.status(500).json({ message: 'Auth server error' });
  }
};
