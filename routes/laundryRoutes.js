// routes/laundryRoutes.js
const express = require('express');
const {
  getAll,
  getById,
  getMine,
  create,
  update,
  remove
} = require('../controllers/laundryController');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// Public reads
router.get('/', getAll);
router.get('/:id', getById);

// Owner-scoped management
router.get('/owner/mine', auth, getMine);
router.post('/', auth, create);
router.put('/:id', auth, update);
router.delete('/:id', auth, remove);

module.exports = router;
