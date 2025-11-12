const express = require('express');
const router = express.Router();
const db = require('../config/database');
const connectionChecker = require('../services/connectionChecker');

// Serve dashboard
router.get('/', (req, res) => {
  res.sendFile('index.html', { root: './public' });
});

// Get all APIs as JSON (for dashboard display)
router.get('/apis/data', async (req, res) => {
  try {
    const apis = await db.getAll();
    res.json(apis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new WhatsApp API
router.post('/apis', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const { name, endpoint, token, description } = req.body;
    
    if (!name || !endpoint || !token) {
      return res.status(400).json({ error: 'Name, endpoint, and token are required' });
    }

    await db.create({ name, endpoint, token, description });
    res.redirect('/?success=created');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update existing WhatsApp API
router.post('/apis/:id', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, endpoint, token, description } = req.body;

    if (!name || !endpoint || !token) {
      return res.status(400).json({ error: 'Name, endpoint, and token are required' });
    }

    const existing = await db.getById(id);
    if (!existing) {
      return res.status(404).json({ error: 'API not found' });
    }

    await db.update(id, { name, endpoint, token, description });
    res.redirect('/?success=updated');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete WhatsApp API
router.post('/apis/:id/delete', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await db.getById(id);
    
    if (!existing) {
      return res.status(404).json({ error: 'API not found' });
    }

    await db.delete(id);
    res.redirect('/?success=deleted');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manually trigger connection check
router.post('/apis/:id/check', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const api = await db.getById(id);
    
    if (!api) {
      return res.status(404).json({ error: 'API not found' });
    }

    await connectionChecker.checkSingle(api);
    res.json({ success: true, message: 'Connection check completed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get check logs for a specific API or all logs
router.get('/logs', async (req, res) => {
  try {
    const apiId = req.query.apiId ? parseInt(req.query.apiId) : null;
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    
    const logs = await db.getCheckLogs(apiId, limit);
    
    // Parse response_data JSON strings back to objects
    const parsedLogs = logs.map(log => ({
      ...log,
      response_data: log.response_data ? JSON.parse(log.response_data) : null
    }));
    
    res.json(parsedLogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

