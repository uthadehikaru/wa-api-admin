const axios = require('axios');
const cron = require('node-cron');
const db = require('../config/database');

// Check connection for a single API
async function checkSingle(api) {
  try {
    // Use WhatsApp API status endpoint based on Postman collection
    // Endpoint: /api/v1/qr/status
    // Remove trailing slash from endpoint if present
    const baseUrl = api.endpoint.replace(/\/$/, '');
    const statusEndpoint = `${baseUrl}/api/v1/qr/status`;

    let success = false;
    let lastError = null;

    let connectionStatus = null;
    let responseData = null;

    try {
      const response = await axios.get(statusEndpoint, {
        headers: {
          'Authorization': `Bearer ${api.token}`
        },
        timeout: 10000 // 10 second timeout
      });

      // If we get a successful response (2xx), consider it online
      if (response.status >= 200 && response.status < 300) {
        success = true;
        responseData = response.data;
        
        // Parse the response to extract connection status
        if (responseData && responseData.success && responseData.data) {
          connectionStatus = responseData.data.connectionStatus || null;
        }
      }
    } catch (error) {
      lastError = error;
      // Check if it's a network error or authentication error
      if (error.response) {
        // Got a response, but it's an error status (4xx, 5xx)
        // For 401/403, the endpoint exists but auth failed - still consider offline
        // For 404, endpoint might not exist - try base endpoint as fallback
        if (error.response.status === 404) {
          // Try base endpoint as fallback
          try {
            const fallbackResponse = await axios.get(baseUrl, {
              headers: {
                'Authorization': `Bearer ${api.token}`
              },
              timeout: 5000
            });
            if (fallbackResponse.status >= 200 && fallbackResponse.status < 300) {
              success = true;
            }
          } catch (fallbackError) {
            // Both endpoints failed
            lastError = fallbackError;
          }
        }
      }
    }

    const status = success ? 'online' : 'offline';
    const lastChecked = new Date().toISOString();
    
    await db.updateStatus(api.id, status, lastChecked, connectionStatus);
    
    return { success, status, lastChecked, connectionStatus, responseData };
  } catch (error) {
    const lastChecked = new Date().toISOString();
    await db.updateStatus(api.id, 'offline', lastChecked, null);
    throw error;
  }
}

// Check all APIs
async function checkAll() {
  try {
    const apis = await db.getAllForCheck();
    const results = [];

    for (const api of apis) {
      try {
        const result = await checkSingle(api);
        results.push({ id: api.id, ...result });
      } catch (error) {
        results.push({ id: api.id, success: false, error: error.message });
      }
    }

    return results;
  } catch (error) {
    console.error('Error checking all APIs:', error);
    throw error;
  }
}

// Start periodic checking
function startPeriodicCheck() {
  const intervalMinutes = parseInt(process.env.CHECK_INTERVAL) || 5;

  console.log(`Starting periodic connection checks every ${intervalMinutes} minutes`);

  // Run immediately on start
  checkAll().catch(err => console.error('Initial check failed:', err));

  // Schedule periodic checks using cron
  // Convert minutes to cron expression (e.g., every 5 minutes: */5 * * * *)
  const cronExpression = `*/${intervalMinutes} * * * *`;
  
  cron.schedule(cronExpression, () => {
    console.log('Running periodic connection check...');
    checkAll().catch(err => console.error('Periodic check failed:', err));
  });
}

module.exports = {
  checkSingle,
  checkAll,
  startPeriodicCheck
};

