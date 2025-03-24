const Todo = require('../models/todo');

// Controller methods for todo operations
exports.getAllTodos = (req, res) => {
  try {
    const todos = Todo.getAll();
    res.status(200).json(todos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching todos', error: error.message });
  }
};

exports.getTodoById = (req, res) => {
  try {
    const todo = Todo.findById(req.params.id);
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    res.status(200).json(todo);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching todo', error: error.message });
  }
};

exports.createTodo = (req, res) => {
  try {
    // Validate request
    if (!req.body.title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const newTodo = Todo.create(req.body);
    res.status(201).json(newTodo);
  } catch (error) {
    res.status(500).json({ message: 'Error creating todo', error: error.message });
  }
};

exports.updateTodo = (req, res) => {
  try {
    const updatedTodo = Todo.update(req.params.id, req.body);
    if (!updatedTodo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    res.status(200).json(updatedTodo);
  } catch (error) {
    res.status(500).json({ message: 'Error updating todo', error: error.message });
  }
};

exports.deleteTodo = (req, res) => {
  try {
    const result = Todo.delete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting todo', error: error.message });
  }
};