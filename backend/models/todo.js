// Since we're not using a database yet, we'll store todos in memory
let todos = [];
let nextId = 1; // For generating unique IDs

class Todo {
  constructor(title, description = '', dueDate = null) {
    this.id = nextId++;
    this.title = title;
    this.description = description;
    this.dueDate = dueDate;
    this.completed = false;
    this.createdAt = new Date();
  }

  // Static methods to handle the collection of todos
  static getAll() {
    return todos;
  }

  static findById(id) {
    return todos.find(todo => todo.id === parseInt(id));
  }

  static create(todoData) {
    const { title, description, dueDate } = todoData;
    const newTodo = new Todo(title, description, dueDate);
    todos.push(newTodo);
    return newTodo;
  }

  static update(id, updates) {
    const todoIndex = todos.findIndex(todo => todo.id === parseInt(id));
    if (todoIndex === -1) return null;
    
    const updatedTodo = { ...todos[todoIndex], ...updates, id: parseInt(id) };
    todos[todoIndex] = updatedTodo;
    return updatedTodo;
  }

  static delete(id) {
    const todoIndex = todos.findIndex(todo => todo.id === parseInt(id));
    if (todoIndex === -1) return false;
    
    todos.splice(todoIndex, 1);
    return true;
  }
}

module.exports = Todo;