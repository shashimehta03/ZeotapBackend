// Import necessary modules
const Node = require('../utils/ast'); // Node structure for the AST (Abstract Syntax Tree)
const Rule = require('../models/Rule'); // Rule model for MongoDB

// Define valid attributes for rule evaluation
const validAttributes = ['age', 'department', 'salary', 'experience'];

// Recursive function to evaluate nodes in the AST
const evaluateNode = (node, data) => {
    // If the node is an operator (AND/OR), evaluate its children
    if (node.type === 'operator') {
        const leftValue = evaluateNode(node.left, data);
        const rightValue = evaluateNode(node.right, data);

        // Perform logical operations based on operator type
        if (node.value === 'AND') {
            return leftValue && rightValue;
        } else if (node.value === 'OR') {
            return leftValue || rightValue;
        }
    } 
    // If the node is an operand (comparison), evaluate based on operator and value
    else if (node.type === 'operand') {
        const { attribute, operator, value } = node.value;
        const dataValue = data[attribute]; // Get the data attribute's value
        const cleanValue = typeof value === 'string' && value.startsWith("'") && value.endsWith("'")
            ? value.slice(1, -1) // Clean value if it's a string with quotes
            : value;

        // Perform comparison based on the operator
        switch (operator) {
            case '>':
                return dataValue > cleanValue;
            case '<':
                return dataValue < cleanValue;
            case '>=':
                return dataValue >= cleanValue;
            case '<=':
                return dataValue <= cleanValue;
            case '=':
                return dataValue == cleanValue;
            default:
                return false; // Return false if operator is invalid
        }
    }

    return false; // Return false if node type is unrecognized
};

// Function to parse a rule string into an AST (Shunting-yard algorithm used for parsing)
const parseRuleString = (ruleString) => {
    console.log('Parsing rule string:', ruleString);
    const tokens = ruleString.match(/(?:[^\s()]+|\(|\))/g); // Tokenize the rule string
    if (!tokens) throw new Error('Invalid rule string'); // Error handling for invalid strings

    const outputQueue = []; // To store final output in Reverse Polish Notation
    const operatorStack = []; // To temporarily hold operators
    const operators = ['AND', 'OR']; // Define logical operators
    const precedence = { 'AND': 1, 'OR': 0 }; // Set precedence levels for operators

    tokens.forEach(token => {
        // Handle logical operators based on precedence
        if (operators.includes(token)) {
            while (operatorStack.length && operators.includes(operatorStack[operatorStack.length - 1]) && precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]) {
                outputQueue.push(operatorStack.pop());
            }
            operatorStack.push(token);
        } 
        // Handle parentheses
        else if (token === '(') {
            operatorStack.push(token);
        } else if (token === ')') {
            while (operatorStack.length && operatorStack[operatorStack.length - 1] !== '(') {
                outputQueue.push(operatorStack.pop());
            }
            operatorStack.pop(); // Remove the opening parenthesis
        } 
        // Push operands directly to the output queue
        else {
            outputQueue.push(token);
        }
    });

    // Pop remaining operators from the stack
    while (operatorStack.length) {
        outputQueue.push(operatorStack.pop());
    }

    const stack = [];

    // Function to create operand nodes for the AST
    const createOperandNode = (tokens) => {
        const [attribute, operator, value] = tokens;
        if (!attribute || !operator || !value) throw new Error('Invalid rule string');
        return new Node('operand', null, null, { attribute, operator, value });
    };

    // Process the tokens and build the AST
    for (let i = 0; i < outputQueue.length; i++) {
        const token = outputQueue[i];
        if (operators.includes(token)) {
            // Pop two operands and create an operator node
            const right = stack.pop();
            const left = stack.pop();
            if (!right || !left) throw new Error('Invalid rule string');
            stack.push(new Node('operator', left, right, token));
        } else if (['>', '<', '>=', '<=', '='].includes(token)) {
            // Create an operand node for comparisons
            const value = outputQueue[++i];
            const attribute = stack.pop();
            stack.push(new Node('operand', null, null, { attribute, operator: token, value }));
        } else {
            stack.push(token); // Push the token as an operand
        }
    }

    // The final AST should have exactly one root node
    if (stack.length !== 1) throw new Error('Invalid rule string');

    return stack[0];
};

// Controller method to create a new rule
exports.createRule = async (req, res) => {
    try {
        const { rule_string: ruleString } = req.body;
        console.log('Received rule string:', ruleString);
        const ast = parseRuleString(ruleString); // Parse rule into AST
        const newRule = new Rule({ ruleString, ast });
        await newRule.save(); // Save the new rule in the database
        res.status(201).json(newRule);
    } catch (error) {
        console.error('Error:', error.message); // Log the error for debugging
        res.status(400).json({ error: 'Invalid rule string' });
    }
};

// Controller method to combine multiple rules into a single AST
exports.combineRules = async (req, res) => {
    try {
        const { ruleStrings } = req.body;
        const parsedRules = ruleStrings.map(parseRuleString);

        // Combine multiple ASTs using AND operator
        let combinedAST = parsedRules[0];
        for (let i = 1; i < parsedRules.length; i++) {
            combinedAST = new Node('operator', combinedAST, parsedRules[i], 'AND');
        }

        res.json({ combinedAST });
    } catch (error) {
        res.status(400).json({ error: 'Error combining rules' });
    }
};

// Controller method to evaluate a rule based on given data
exports.evaluateRule = async (req, res) => {
    try {
        console.log("Evaluating rule...");
        const { ruleId, data } = req.body;
        const rule = await Rule.findOne({ _id: ruleId });
        console.log("Fetched rule:", JSON.stringify(rule, null, 2)); // Log rule for debugging

        if (!rule) {
            return res.status(404).json({ error: 'Rule not found' });
        }

        const result = evaluateNode(rule.ast, data); // Evaluate the rule
        res.json({ result });
    } catch (error) {
        res.status(400).json({ error: 'Invalid data format' });
    }
};

// Controller method to modify an existing rule
exports.modifyRule = async (req, res) => {
    try {
        const { ruleId, newRuleString } = req.body;
        const newAST = parseRuleString(newRuleString); // Parse the new rule string
        const rule = await Rule.findById(ruleId);
        if (!rule) {
            return res.status(404).json({ error: 'Rule not found' });
        }

        rule.ruleString = newRuleString; // Update rule string and AST
        rule.ast = newAST;
        await rule.save();
        res.json(rule);
    } catch (error) {
        res.status(400).json({ error: 'Invalid rule string or rule not found' });
    }
};

// Controller method to fetch all rules from the database
exports.getAllRules = async (req, res) => {
    try {
        const rules = await Rule.find(); // Fetch all rules
        res.status(200).json(rules);
    } catch (error) {
        console.error('Error fetching rules:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
};
