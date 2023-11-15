// Import necessary modules and configurations
require('dotenv').config(); // Load environment variables from .env file
const express = require('express'); // Import Express framework
const walletRoutes = require('./routes/walletRoutes'); // Import routes for wallet operations
const cors = require('cors');
// Initialize the Express application
const app = express();
app.use(cors());
/**
 * Middleware Setup
 */

// Use Express's built-in JSON parser middleware
// This will automatically parse JSON content in request bodies
app.use(express.json());

/**
 * Routes Registration
 */

// Register wallet-specific routes under '/api' path
// This means all wallet routes will be accessible under '/api' (e.g., '/api/setup', '/api/transact/:walletId', etc.)
app.use('/api', walletRoutes);

/**
 * Error Handling Middleware
 *
 * This middleware is used for catching and responding to any errors that occur during request handling.
 * It logs the error stack and sends a generic error message to the client.
 */
app.use((err, req, res, next) => {
    console.error(err.stack); // Log the error stack for debugging purposes
    res.status(500).send('Something broke!'); // Send a generic error response
});

// Export the Express app instance
// This is used in server.js where the server is started
module.exports = app;