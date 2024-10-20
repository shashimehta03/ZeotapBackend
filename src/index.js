// Import required modules
const express = require('express');
const bodyParser = require('body-parser');  // Not used in the current code, can be removed if not needed
const ruleRoutes = require('./routes/rules'); // Import rule-related routes
const cors = require('cors');  // To enable Cross-Origin Resource Sharing
const cookieParser = require('cookie-parser'); // For parsing cookies
const dotenv = require('dotenv');  // To load environment variables

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000; // Set the port from environment variable or fallback to 3000

// Middleware setup
app.use(express.json()); // Parse incoming JSON requests
app.use(cookieParser()); // Parse cookies
app.use(cors()); // Enable CORS for all routes

// Connect to the database (config file handles the connection details)
require('./config/db');

// Define API routes for rules
app.use('/api/rules', ruleRoutes);

// Start the server
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Function to evaluate a rule against the provided data
function evaluateRule(rule, data) {
    const { age, department, salary, experience } = data;
    
    // Replace logical operators in the rule string with JavaScript equivalents
    const condition = rule.replace(/AND/g, '&&').replace(/OR/g, '||');
    
    // Use eval to dynamically evaluate the condition (ensure proper validation in production)
    return eval(condition);
}

// POST route to evaluate a rule
app.post('/api/rules/evaluate', (req, res) => {
    const { ruleId, data } = req.body;
    
    // Evaluate the rule against the provided data
    const result = evaluateRule(ruleId, data);
    
    // Send the result as JSON response
    res.json({ result });
});

// Handle server errors like port conflicts
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please use a different port.`);
    } else {
        console.error(`Server error: ${err}`);
    }
});
