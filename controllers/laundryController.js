const Laundry = require('../models/Laundry');

exports.getAll = async (req, res) => {
  const laundries = await Laundry.findAll();
  res.json(laundries);
};

exports.create = async (req, res) => {
  const laundry = await Laundry.create({ ...req.body, ownerId: req.user.id });
  res.json(laundry);
};
