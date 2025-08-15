// controllers/laundryController.js
const Laundry = require('../models/Laundry');

// Public: list all laundries
exports.getAll = async (req, res) => {
  const laundries = await Laundry.findAll();
  res.json(laundries);
};

// Public: get one
exports.getById = async (req, res) => {
  const item = await Laundry.findByPk(req.params.id);
  if (!item) return res.status(404).json({ message: 'Laundry not found' });
  res.json(item);
};

// Owner: list my laundries
exports.getMine = async (req, res) => {
  const list = await Laundry.findAll({ where: { ownerId: req.user.id } });
  res.json(list);
};

// Owner: create
exports.create = async (req, res) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Only owners can create laundries' });
  }
  const laundry = await Laundry.create({ ...req.body, ownerId: req.user.id });
  res.status(201).json(laundry);
};

// Owner: update my laundry
exports.update = async (req, res) => {
  const item = await Laundry.findByPk(req.params.id);
  if (!item) return res.status(404).json({ message: 'Laundry not found' });
  if (item.ownerId !== req.user.id) {
    return res.status(403).json({ message: 'You can only update your own laundry' });
  }

  // Only fields that exist in your current model/DB
  const { name, description, lat, lng } = req.body;
  if (typeof name !== 'undefined') item.name = name;
  if (typeof description !== 'undefined') item.description = description;
  if (typeof lat !== 'undefined') item.lat = lat;
  if (typeof lng !== 'undefined') item.lng = lng;

  await item.save();
  res.json(item);
};

// Owner: delete my laundry
exports.remove = async (req, res) => {
  const item = await Laundry.findByPk(req.params.id);
  if (!item) return res.status(404).json({ message: 'Laundry not found' });
  if (item.ownerId !== req.user.id) {
    return res.status(403).json({ message: 'You can only delete your own laundry' });
  }
  await item.destroy();
  res.json({ message: 'Laundry deleted' });
};
