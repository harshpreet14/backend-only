require('dotenv').config({path: '../.env'}); // Import and configure dotenv
const app = require('./app'); // Import the Express application
const mongoose = require('mongoose');

//const PORT = process.env.PORT || 3000; // Set the port

// MongoDB connection URL
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('Missing MONGO_URI in .env file.');
    process.exit(1);
}

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
        // Start the server only if MongoDB connection is successful
        app.listen(3000, () => {
            console.log(`Server is running on port 3000`);
        });
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err.message);
    });

module.exports = server;