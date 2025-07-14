const express = require('express');
const { getAll, create } = require('../controllers/laundryController');
const auth = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', getAll);
router.post('/', auth, create);

module.exports = router;
