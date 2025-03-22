/**
 * Storage module for the To-Do List application
 * Handles saving and retrieving tasks from localStorage
 */

const Storage = (function() {
    // Key for storing tasks in localStorage
    const TASKS_STORAGE_KEY = 'todoTasks';
    
    /**
     * Save tasks to localStorage
     * @param {Array} tasks - Array of task objects
     */
    function saveTasks(tasks) {
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    }
    
    /**
     * Get tasks from localStorage
     * @returns {Array} Array of task objects
     */
    function getTasks() {
        const tasksJSON = localStorage.getItem(TASKS_STORAGE_KEY);
        return tasksJSON ? JSON.parse(tasksJSON) : [];
    }
    
    /**
     * Add a new task
     * @param {Object} task - Task object
     * @returns {Array} Updated array of tasks
     */
    function addTask(task) {
        const tasks = getTasks();
        // Generate a unique ID for the task
        task.id = Date.now().toString();
        tasks.push(task);
        saveTasks(tasks);
        return tasks;
    }
    
    /**
     * Update an existing task
     * @param {String} taskId - ID of the task to update
     * @param {Object} updatedTask - Updated task object
     * @returns {Array} Updated array of tasks
     */
    function updateTask(taskId, updatedTask) {
        const tasks = getTasks();
        const index = tasks.findIndex(task => task.id === taskId);
        
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...updatedTask };
            saveTasks(tasks);
        }
        
        return tasks;
    }
    
    /**
     * Delete a task
     * @param {String} taskId - ID of the task to delete
     * @returns {Array} Updated array of tasks
     */
    function deleteTask(taskId) {
        const tasks = getTasks();
        const filteredTasks = tasks.filter(task => task.id !== taskId);
        saveTasks(filteredTasks);
        return filteredTasks;
    }
    
    /**
     * Toggle the completed status of a task
     * @param {String} taskId - ID of the task to toggle
     * @returns {Array} Updated array of tasks
     */
    function toggleTaskStatus(taskId) {
        const tasks = getTasks();
        const index = tasks.findIndex(task => task.id === taskId);
        
        if (index !== -1) {
            tasks[index].completed = !tasks[index].completed;
            saveTasks(tasks);
        }
        
        return tasks;
    }
    
    /**
     * Get tasks due on a specific date
     * @param {String} date - Date string in format 'YYYY-MM-DD'
     * @returns {Array} Array of tasks due on the specified date
     */
    function getTasksByDate(date) {
        const tasks = getTasks();
        return tasks.filter(task => task.dueDate === date);
    }
    
    /**
     * Get all dates that have tasks
     * @returns {Array} Array of date strings that have associated tasks
     */
    function getDatesWithTasks() {
        const tasks = getTasks();
        const dates = new Set();
        
        tasks.forEach(task => {
            if (task.dueDate) {
                dates.add(task.dueDate);
            }
        });
        
        return Array.from(dates);
    }

    // Add to Storage module in storage.js

// New key for storing recycled tasks
const RECYCLED_TASKS_KEY = 'recycledTasks';

// Function to get recycled tasks
function getRecycledTasks() {
    const recycledTasksJSON = localStorage.getItem(RECYCLED_TASKS_KEY);
    return recycledTasksJSON ? JSON.parse(recycledTasksJSON) : [];
}

// Modify deleteTask to move task to recycle bin instead of deleting
function deleteTask(taskId) {
    const tasks = getTasks();
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex !== -1) {
        // Get the task to be deleted
        const taskToRecycle = tasks[taskIndex];
        
        // Add deletion timestamp
        taskToRecycle.deletedAt = new Date().toISOString();
        
        // Move to recycle bin
        const recycledTasks = getRecycledTasks();
        recycledTasks.push(taskToRecycle);
        localStorage.setItem(RECYCLED_TASKS_KEY, JSON.stringify(recycledTasks));
        
        // Remove from active tasks
        tasks.splice(taskIndex, 1);
        saveTasks(tasks);
    }
    
    return tasks;
}

// Function to permanently delete task from recycle bin
function permanentlyDeleteTask(taskId) {
    const recycledTasks = getRecycledTasks();
    const filteredTasks = recycledTasks.filter(task => task.id !== taskId);
    localStorage.setItem(RECYCLED_TASKS_KEY, JSON.stringify(filteredTasks));
    return filteredTasks;
}

// Function to restore task from recycle bin
function restoreTask(taskId) {
    const recycledTasks = getRecycledTasks();
    const taskIndex = recycledTasks.findIndex(task => task.id === taskId);
    
    if (taskIndex !== -1) {
        // Get the task to restore
        const taskToRestore = {...recycledTasks[taskIndex]};
        
        // Remove deletedAt property
        delete taskToRestore.deletedAt;
        
        // Add back to active tasks
        const tasks = getTasks();
        tasks.push(taskToRestore);
        saveTasks(tasks);
        
        // Remove from recycle bin
        recycledTasks.splice(taskIndex, 1);
        localStorage.setItem(RECYCLED_TASKS_KEY, JSON.stringify(recycledTasks));
    }
    
    return recycledTasks;
}

// Function to clean up old recycled tasks (older than 30 days)
function cleanupRecycleBin() {
    const recycledTasks = getRecycledTasks();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const filteredTasks = recycledTasks.filter(task => {
        const deletedDate = new Date(task.deletedAt);
        return deletedDate > thirtyDaysAgo;
    });
    
    localStorage.setItem(RECYCLED_TASKS_KEY, JSON.stringify(filteredTasks));
    return filteredTasks;
}
    
    // Public API
    return {
        getTasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
        getTasksByDate,
        getDatesWithTasks,
        getRecycledTasks,
    permanentlyDeleteTask,
    restoreTask,
    cleanupRecycleBin
    };
})();