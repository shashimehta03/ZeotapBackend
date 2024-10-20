// Define a class for the nodes used in the AST (Abstract Syntax Tree)
class Node {
    // Constructor to initialize a new node
    constructor(type, left = null, right = null, value = null) {
        this.type = type;    // Type of the node (e.g., 'operator' or 'operand')
        this.left = left;    // Left child node (for binary operations)
        this.right = right;  // Right child node (for binary operations)
        this.value = value;  // Value of the node (e.g., operator type or operand data)
    }
}

// Export the Node class to be used in other parts of the application
module.exports = Node;
