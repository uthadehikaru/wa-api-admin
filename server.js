require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const dashboardRoutes = require('./routes/dashboard');
const connectionChecker = require('./services/connectionChecker');

// Initialize database (this will create the database and tables if they don't exist)
require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', dashboardRoutes);

// Start connection checker
connectionChecker.startPeriodicCheck();

// Start server
app.listen(PORT, () => {
  console.log(`WhatsApp API Admin server running on http://localhost:${PORT}`);
  console.log(`Connection checks will run every ${process.env.CHECK_INTERVAL || 5} minutes`);
});

