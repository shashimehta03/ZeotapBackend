// Import the mongoose library to interact with MongoDB
const mongoose = require('mongoose');

// Load environment variables from a .env file
require('dotenv').config();

// Establish a connection to the MongoDB database using environment variables
mongoose.connect(process.env.MONGO_URL, {
    // Specify the name of the database to connect to
    dbName: process.env.DB_NAME
})
// If the connection is successful, log a success message
.then(() => {
    console.log("Successfully connected to the database");
})
// If there is an error in the connection, log an error message with the error details
.catch(err => {
    console.log("Database connection failed: ", err.message);
});
