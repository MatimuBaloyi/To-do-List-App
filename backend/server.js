/**
 * Main server file for the Todo application
 */

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.')));

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');
const TODOS_FILE = path.join(DATA_DIR, 'todos.json');
const RECYCLED_FILE = path.join(DATA_DIR, 'recycled.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// Initialize data files if they don't exist
if (!fs.existsSync(TODOS_FILE)) {
    fs.writeFileSync(TODOS_FILE, JSON.stringify([]));
}

if (!fs.existsSync(RECYCLED_FILE)) {
    fs.writeFileSync(RECYCLED_FILE, JSON.stringify([]));
}

// Helper functions to read and write data
const readTodos = () => {
    const data = fs.readFileSync(TODOS_FILE);
    return JSON.parse(data);
};

const writeTodos = (todos) => {
    fs.writeFileSync(TODOS_FILE, JSON.stringify(todos, null, 2));
};

const readRecycled = () => {
    const data = fs.readFileSync(RECYCLED_FILE);
    return JSON.parse(data);
};

const writeRecycled = (recycled) => {
    fs.writeFileSync(RECYCLED_FILE, JSON.stringify(recycled, null, 2));
};

// API Routes

// Get all active todos
app.get('/api/todos', (req, res) => {
    const todos = readTodos();
    res.json(todos);
});

// Add a new todo
app.post('/api/todos', (req, res) => {
    const todos = readTodos();
    const newTodo = {
        id: uuidv4(),
        ...req.body,
        createdAt: new Date().toISOString()
    };
    
    todos.push(newTodo);
    writeTodos(todos);
    
    res.status(201).json(newTodo);
});

// Update a todo
app.put('/api/todos/:id', (req, res) => {
    const todos = readTodos();
    const id = req.params.id;
    const todoIndex = todos.findIndex(todo => todo.id === id);
    
    if (todoIndex === -1) {
        return res.status(404).json({ error: 'Todo not found' });
    }
    
    todos[todoIndex] = {
        ...todos[todoIndex],
        ...req.body,
        updatedAt: new Date().toISOString()
    };
    
    writeTodos(todos);
    res.json(todos[todoIndex]);
});

// Toggle todo status
app.patch('/api/todos/:id/toggle', (req, res) => {
    const todos = readTodos();
    const id = req.params.id;
    const todoIndex = todos.findIndex(todo => todo.id === id);
    
    if (todoIndex === -1) {
        return res.status(404).json({ error: 'Todo not found' });
    }
    
    todos[todoIndex].completed = !todos[todoIndex].completed;
    todos[todoIndex].updatedAt = new Date().toISOString();
    
    writeTodos(todos);
    res.json(todos[todoIndex]);
});

// Delete a todo (move to recycle bin)
app.patch('/api/todos/:id/recycle', (req, res) => {
    const todos = readTodos();
    const recycled = readRecycled();
    const id = req.params.id;
    const todoIndex = todos.findIndex(todo => todo.id === id);
    
    if (todoIndex === -1) {
        return res.status(404).json({ error: 'Todo not found' });
    }
    
    const removedTodo = todos.splice(todoIndex, 1)[0];
    removedTodo.deletedAt = new Date().toISOString();
    
    recycled.push(removedTodo);
    
    writeTodos(todos);
    writeRecycled(recycled);
    
    res.json(removedTodo);
});

// Get recycled todos
app.get('/api/todos/recycled', (req, res) => {
    const recycled = readRecycled();
    res.json(recycled);
});

// Restore a todo from recycle bin
app.patch('/api/todos/:id/restore', (req, res) => {
    const todos = readTodos();
    const recycled = readRecycled();
    const id = req.params.id;
    const recycledIndex = recycled.findIndex(todo => todo.id === id);
    
    if (recycledIndex === -1) {
        return res.status(404).json({ error: 'Recycled todo not found' });
    }
    
    const restoredTodo = recycled.splice(recycledIndex, 1)[0];
    delete restoredTodo.deletedAt;
    restoredTodo.restoredAt = new Date().toISOString();
    
    todos.push(restoredTodo);
    
    writeTodos(todos);
    writeRecycled(recycled);
    
    res.json(restoredTodo);
});

// Permanently delete a todo
app.delete('/api/todos/:id', (req, res) => {
    const recycled = readRecycled();
    const id = req.params.id;
    const recycledIndex = recycled.findIndex(todo => todo.id === id);
    
    if (recycledIndex === -1) {
        return res.status(404).json({ error: 'Recycled todo not found' });
    }
    
    const deletedTodo = recycled.splice(recycledIndex, 1)[0];
    
    writeRecycled(recycled);
    
    res.json(deletedTodo);
});

// Clean up recycle bin (delete tasks older than 30 days)
app.delete('/api/todos/cleanup', (req, res) => {
    const recycled = readRecycled();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const filteredRecycled = recycled.filter(todo => {
        const deletedAt = new Date(todo.deletedAt);
        return deletedAt >= thirtyDaysAgo;
    });
    
    const removedCount = recycled.length - filteredRecycled.length;
    
    writeRecycled(filteredRecycled);
    
    res.json({ 
        message: `Cleaned up recycle bin. Removed ${removedCount} items.`, 
        removedCount 
    });
});
// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '..'))); // Serve static files from root



// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});