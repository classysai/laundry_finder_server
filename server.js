const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const laundryRoutes = require('./routes/laundryRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const db = require('./config/db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

db.sync().then(() => console.log("Database synced"));

app.use('/api/auth', authRoutes);
app.use('/api/laundries', laundryRoutes);
app.use('/api/bookings', bookingRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
