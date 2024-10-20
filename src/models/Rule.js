// Import the mongoose library to define a schema for MongoDB
const mongoose = require('mongoose');

// Define the schema for the Rule model
const ruleSchema = new mongoose.Schema({
    // The original rule string in plain text format
    ruleString: String,

    // The parsed AST (Abstract Syntax Tree) representation of the rule
    ast: Object
});

// Export the Rule model, allowing it to be used in other parts of the application
module.exports = mongoose.model('Rule', ruleSchema);
