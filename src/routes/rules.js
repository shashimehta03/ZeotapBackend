// Import the Express framework and create a router instance
const express = require('express');
const router = express.Router();

// Import the rule controller which contains all the business logic for rules
const ruleController = require('../controllers/ruleController');

// Route to create a new rule
router.post('/', ruleController.createRule);

// Route to combine multiple rules into one
router.post('/combine', ruleController.combineRules);

// Route to evaluate a rule against a given data set
router.post('/evaluate', ruleController.evaluateRule);

// Route to modify an existing rule
router.put('/modify', ruleController.modifyRule);

// Route to fetch all the rules from the database
router.get('/all', ruleController.getAllRules);

// Export the router to be used in the main application
module.exports = router;
