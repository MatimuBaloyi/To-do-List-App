/**
 * Main application module for the To-Do List application
 * Handles UI interactions and task management
 */

// API service for backend communication
const ApiService = {
    // Get all tasks
    async getTasks() {
        try {
            const response = await fetch('/api/todos');
            if (!response.ok) throw new Error('Failed to fetch tasks');
            return await response.json();
        } catch (error) {
            console.error('Error fetching tasks:', error);
            return [];
        }
    },
    
    // Add a new task
    async addTask(task) {
        try {
            const response = await fetch('/api/todos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(task)
            });
            if (!response.ok) throw new Error('Failed to add task');
            return await response.json();
        } catch (error) {
            console.error('Error adding task:', error);
            return null;
        }
    },
    
    // Update a task
    async updateTask(taskId, updatedTask) {
        try {
            const response = await fetch(`/api/todos/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedTask)
            });
            if (!response.ok) throw new Error('Failed to update task');
            return await response.json();
        } catch (error) {
            console.error('Error updating task:', error);
            return null;
        }
    },
    
    // Toggle task completion status
    async toggleTaskStatus(taskId) {
        try {
            const response = await fetch(`/api/todos/${taskId}/toggle`, {
                method: 'PATCH'
            });
            if (!response.ok) throw new Error('Failed to toggle task status');
            return await response.json();
        } catch (error) {
            console.error('Error toggling task status:', error);
            return null;
        }
    },
    
    // Delete a task (move to recycle bin)
    async deleteTask(taskId) {
        try {
            const response = await fetch(`/api/todos/${taskId}/recycle`, {
                method: 'PATCH'
            });
            if (!response.ok) throw new Error('Failed to delete task');
            return await response.json();
        } catch (error) {
            console.error('Error deleting task:', error);
            return null;
        }
    },
    
    // Get recycled tasks
    async getRecycledTasks() {
        try {
            const response = await fetch('/api/todos/recycled');
            if (!response.ok) throw new Error('Failed to fetch recycled tasks');
            return await response.json();
        } catch (error) {
            console.error('Error fetching recycled tasks:', error);
            return [];
        }
    },
    
    // Restore a task from recycle bin
    async restoreTask(taskId) {
        try {
            const response = await fetch(`/api/todos/${taskId}/restore`, {
                method: 'PATCH'
            });
            if (!response.ok) throw new Error('Failed to restore task');
            return await response.json();
        } catch (error) {
            console.error('Error restoring task:', error);
            return null;
        }
    },
    
    // Permanently delete a task
    async permanentlyDeleteTask(taskId) {
        try {
            const response = await fetch(`/api/todos/${taskId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to permanently delete task');
            return await response.json();
        } catch (error) {
            console.error('Error permanently deleting task:', error);
            return null;
        }
    },
    
    // Clean up recycle bin (delete tasks older than 30 days)
    async cleanupRecycleBin() {
        try {
            const response = await fetch('/api/todos/cleanup', {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to clean up recycle bin');
            return await response.json();
        } catch (error) {
            console.error('Error cleaning up recycle bin:', error);
            return null;
        }
    }
};   

const TodoApp = (function() {
    // DOM elements
    const taskList = document.getElementById('task-list');
    const addTaskBtn = document.getElementById('add-task-btn');
    const filterTabs = document.querySelectorAll('.filter-tabs .tab');
    const categoryItems = document.querySelectorAll('.category-item');
    
    // Current filter and category
    let currentFilter = 'all';
    let currentCategory = 'none';
    
    /**
     * Create a task element
     * @param {Object} task - Task object
     * @returns {HTMLElement} Task element
     */
    function createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskElement.dataset.id = task.id;
        
        // Create checkbox for task completion
        const checkbox = document.createElement('div');
        checkbox.className = 'task-checkbox';
        checkbox.innerHTML = task.completed 
            ? '<i class="fas fa-check-circle"></i>' 
            : '<i class="far fa-circle"></i>';
        
        // Create task content container
        const content = document.createElement('div');
        content.className = 'task-content';
        
        // Create task title
        const title = document.createElement('div');
        title.className = 'task-title';
        title.textContent = task.title;
        
        // Create container for date and category
        const metaInfo = document.createElement('div');
        metaInfo.className = 'task-meta';
        
        // Add due date if available
        if (task.dueDate) {
            const dueDate = document.createElement('span');
            dueDate.className = 'task-due-date';
            dueDate.textContent = formatDueDate(task.dueDate);
            metaInfo.appendChild(dueDate);
        }
        
        // Add category if available
        if (task.category && task.category !== 'none') {
            const category = document.createElement('span');
            category.className = `task-category ${task.category}`;
            category.textContent = capitalizeFirstLetter(task.category);
            metaInfo.appendChild(category);
        }
        
        // Add content elements to content container
        content.appendChild(title);
        content.appendChild(metaInfo);
        
        // Create task actions container
        const actions = document.createElement('div');
        actions.className = 'task-actions';
        
        // Create edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'task-edit';
        editBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
        
        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'task-delete';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        
        // Add action buttons to actions container
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        
        // Add all elements to task container
        taskElement.appendChild(checkbox);
        taskElement.appendChild(content);
        taskElement.appendChild(actions);
        
        // Add event listeners
        checkbox.addEventListener('click', () => toggleTaskCompletion(task.id));
        editBtn.addEventListener('click', () => editTask(task.id));
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        
        return taskElement;
    }
    
    /**
     * Format due date for display
     * @param {String} dateString - Date string in format 'YYYY-MM-DD'
     * @returns {String} Formatted date string
     */
    function formatDueDate(dateString) {
        const date = new Date(dateString);
        const options = { month: 'short', day: 'numeric' };
        return `Due ${date.toLocaleDateString('en-US', options)}`;
    }
    
    /**
     * Capitalize first letter of a string
     * @param {String} string - String to capitalize
     * @returns {String} Capitalized string 
     */
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    /**
     * Render tasks based on current filter and category
     */
    async function renderTasks() {
        // Get tasks from API
        const tasks = await ApiService.getTasks();
        
        // Clear task list
        taskList.innerHTML = '';
        
        // Filter tasks based on current filter and category
        let filteredTasks = tasks;
        
        if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
        } else if (currentFilter === 'active') {
            filteredTasks = tasks.filter(task => !task.completed);
        }
        
        // Apply category filter if not 'none'
        if (currentCategory !== 'none') {
            filteredTasks = filteredTasks.filter(task => task.category === currentCategory);
        }
        
        // Add task elements to task list
        if (filteredTasks.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-tasks';
            emptyMessage.textContent = 'No tasks to display';
            taskList.appendChild(emptyMessage);
        } else {
            filteredTasks.forEach(task => {
                const taskElement = createTaskElement(task);
                taskList.appendChild(taskElement);
            });
        }
    }

    /**
     * Show add task form
     */
    function showAddTaskForm() {
        // Create form element
        const formElement = document.createElement('div');
        formElement.className = 'task-form';
        
        // Create input for task title
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.placeholder = 'Add your task here';
        titleInput.className = 'task-title-input';
        
        // Create due date input
        const dueDateContainer = document.createElement('div');
        dueDateContainer.className = 'due-date-container';
        
        const dueDateLabel = document.createElement('label');
        dueDateLabel.textContent = 'Due date:';
        
        const dueDateInput = document.createElement('input');
        dueDateInput.type = 'date';
        dueDateInput.className = 'task-due-date-input';
        
        dueDateContainer.appendChild(dueDateLabel);
        dueDateContainer.appendChild(dueDateInput);
        
        // Create category selection
        const categoryContainer = document.createElement('div');
        categoryContainer.className = 'category-selection';
        
        const categoryLabel = document.createElement('label');
        categoryLabel.textContent = 'Category:';
        
        const categorySelect = document.createElement('select');
        categorySelect.className = 'task-category-select';
        
        const categoryOptions = [
            { value: 'none', text: 'None' },
            { value: 'home', text: 'Home' },
            { value: 'school', text: 'School' },
            { value: 'shopping', text: 'Shopping list' }
        ];
        
        categoryOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            categorySelect.appendChild(optionElement);
        });
        
        categoryContainer.appendChild(categoryLabel);
        categoryContainer.appendChild(categorySelect);
        
        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'form-buttons';
        
        // Create save button
        const saveButton = document.createElement('button');
        saveButton.className = 'save-task-btn';
        saveButton.textContent = 'Save';
        
        // Create cancel button
        const cancelButton = document.createElement('button');
        cancelButton.className = 'cancel-task-btn';
        cancelButton.textContent = 'Cancel';
        
        buttonContainer.appendChild(saveButton);
        buttonContainer.appendChild(cancelButton);
        
        // Add all elements to form
        formElement.appendChild(titleInput);
        formElement.appendChild(dueDateContainer);
        formElement.appendChild(categoryContainer);
        formElement.appendChild(buttonContainer);
        
        // Replace the add task button with the form
        const addTaskContainer = document.querySelector('.add-task-container');
        addTaskContainer.innerHTML = '';
        addTaskContainer.appendChild(formElement);
        
        // Focus on title input
        titleInput.focus();
        
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        dueDateInput.min = today;
        
        // Add event listeners
        saveButton.addEventListener('click', async () => {
            const title = titleInput.value.trim();
            const dueDate = dueDateInput.value;
            const category = categorySelect.value;
            
            if (!title) {
                alert('Please enter a task title');
                return;
            }
            
            // Create new task
            const newTask = {
                title,
                dueDate,
                category,
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            // Add task via API
            await ApiService.addTask(newTask);
            
            // Restore add task button and render tasks
            restoreAddTaskButton();
            renderTasks();
        });
        
        cancelButton.addEventListener('click', restoreAddTaskButton);
    }

    /**
     * Restore add task button
     */
    function restoreAddTaskButton() {
        const addTaskContainer = document.querySelector('.add-task-container');
        addTaskContainer.innerHTML = '';
        
        // Create a new button since cloning might not preserve event listeners
        const newAddTaskBtn = document.createElement('button');
        newAddTaskBtn.id = 'add-task-btn';
        newAddTaskBtn.className = 'add-task-btn';
        newAddTaskBtn.innerHTML = '<i class="fas fa-plus"></i> Add New Task';
        
        addTaskContainer.appendChild(newAddTaskBtn);
        
        // Attach event listener to the new button
        newAddTaskBtn.addEventListener('click', showAddTaskForm);
    }

    /**
     * Toggle task completion status
     * @param {String} taskId - ID of the task to toggle
     */
    async function toggleTaskCompletion(taskId) {
        await ApiService.toggleTaskStatus(taskId);
        renderTasks();
    }

    /**
     * Edit a task
     * @param {String} taskId - ID of the task to edit
     */
    async function editTask(taskId) {
        // Get task from API
        const tasks = await ApiService.getTasks();
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) return;
        
        // Get task element
        const taskElement = document.querySelector(`.task-item[data-id="${taskId}"]`);
        
        // Create form element
        const formElement = document.createElement('div');
        formElement.className = 'task-form edit-form';
        
        // Create input for task title
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.value = task.title;
        titleInput.className = 'task-title-input';
        
        // Create due date input
        const dueDateContainer = document.createElement('div');
        dueDateContainer.className = 'due-date-container';
        
        const dueDateLabel = document.createElement('label');
        dueDateLabel.textContent = 'Due date:';
        
        const dueDateInput = document.createElement('input');
        dueDateInput.type = 'date';
        dueDateInput.className = 'task-due-date-input';
        dueDateInput.value = task.dueDate || '';
        
        dueDateContainer.appendChild(dueDateLabel);
        dueDateContainer.appendChild(dueDateInput);
        
        // Create category selection
        const categoryContainer = document.createElement('div');
        categoryContainer.className = 'category-selection';
        
        const categoryLabel = document.createElement('label');
        categoryLabel.textContent = 'Category:';
        
        const categorySelect = document.createElement('select');
        categorySelect.className = 'task-category-select';
        
        const categoryOptions = [
            { value: 'none', text: 'None' },
            { value: 'home', text: 'Home' },
            { value: 'school', text: 'School' },
            { value: 'shopping', text: 'Shopping list' }
        ];
        
        categoryOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            if (option.value === task.category) {
                optionElement.selected = true;
            }
            categorySelect.appendChild(optionElement);
        });
        
        categoryContainer.appendChild(categoryLabel);
        categoryContainer.appendChild(categorySelect);
        
        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'form-buttons';
        
        // Create update button
        const updateButton = document.createElement('button');
        updateButton.className = 'update-task-btn';
        updateButton.textContent = 'Update';
        
        // Create cancel button
        const cancelButton = document.createElement('button');
        cancelButton.className = 'cancel-edit-btn';
        cancelButton.textContent = 'Cancel';
        
        buttonContainer.appendChild(updateButton);
        buttonContainer.appendChild(cancelButton);
        
        // Add all elements to form
        formElement.appendChild(titleInput);
        formElement.appendChild(dueDateContainer);
        formElement.appendChild(categoryContainer);
        formElement.appendChild(buttonContainer);
        
        // Replace task element with form
        taskElement.parentNode.replaceChild(formElement, taskElement);
        
        // Focus on title input
        titleInput.focus();
        
        // Add event listeners
        updateButton.addEventListener('click', async () => {
            const title = titleInput.value.trim();
            const dueDate = dueDateInput.value;
            const category = categorySelect.value;
            
            if (!title) {
                alert('Please enter a task title');
                return;
            }
            
            // Update task
            const updatedTask = {
                ...task,
                title,
                dueDate,
                category
            };
            
            // Update task via API
            await ApiService.updateTask(taskId, updatedTask);
            
            // Render tasks
            renderTasks();
        });
        
        cancelButton.addEventListener('click', renderTasks);
    }

    /**
     * Delete a task
     * @param {String} taskId - ID of the task to delete
     */
    async function deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task? It will be moved to the recycle bin.')) {
            await ApiService.deleteTask(taskId);
            renderTasks();
            alert('Task has been placed in the recycle bin.');
        }
    }

    /**
     * Set active filter tab
     * @param {String} filter - Filter to set active
     */
    function setActiveFilter(filter) {
        currentFilter = filter;
        
        // Update active tab
        filterTabs.forEach(tab => {
            if (tab.dataset.filter === filter) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Render tasks with new filter
        renderTasks();
    }

    /**
     * Set active category
     * @param {String} category - Category to set active
     */
    function setActiveCategory(category) {
        currentCategory = category;
        
        // Update active category
        categoryItems.forEach(item => {
            const itemCategory = item.querySelector('span:last-child').textContent.toLowerCase();
            
            if (itemCategory === category) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Filter tasks by category and render
        renderTasks();
    }

    /**
     * Create and show recycle bin modal
     */
    async function showRecycleBin() {
        // Create modal container
        const recycleBinModal = document.createElement('div');
        recycleBinModal.className = 'recycle-bin-modal';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'recycle-bin-content';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'recycle-bin-header';
        
        const title = document.createElement('h2');
        title.textContent = 'Recycle Bin';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-bin-btn';
        closeBtn.innerHTML = '&times;';
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        // Create info message
        const infoMessage = document.createElement('div');
        infoMessage.className = 'recycle-bin-info';
        infoMessage.textContent = 'Items in the recycle bin will be automatically deleted after 30 days.';
        
        // Get recycled tasks
        const recycledTasks = await ApiService.getRecycledTasks();
        
        // Create task list
        const recycledTasksList = document.createElement('div');
        recycledTasksList.className = 'recycled-tasks-list';
        
        if (recycledTasks.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-recycle-bin';
            emptyMessage.textContent = 'Recycle bin is empty';
            recycledTasksList.appendChild(emptyMessage);
        } else {
            recycledTasks.forEach(task => {
                const taskElement = document.createElement('div');
                taskElement.className = 'recycled-task-item';
                taskElement.dataset.id = task.id;
                
                const taskTitle = document.createElement('div');
                taskTitle.className = 'recycled-task-title';
                taskTitle.textContent = task.title;
                
                const deleteDate = document.createElement('div');
                deleteDate.className = 'recycled-task-date';
                const deletedAt = new Date(task.deletedAt);
                deleteDate.textContent = `Deleted on ${deletedAt.toLocaleDateString()}`;
                
                const actionBtns = document.createElement('div');
                actionBtns.className = 'recycled-task-actions';
                
                const restoreBtn = document.createElement('button');
                restoreBtn.className = 'restore-task-btn';
                restoreBtn.innerHTML = '<i class="fas fa-trash-restore"></i> Restore';
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'permanent-delete-btn';
                deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete Permanently';
                
                restoreBtn.addEventListener('click', async () => {
                    await ApiService.restoreTask(task.id);
                    taskElement.remove();
                    renderTasks();
                    
                    // Show empty message if no tasks left
                    const remainingTasks = await ApiService.getRecycledTasks();
                    if (remainingTasks.length === 0) {
                        const emptyMessage = document.createElement('div');
                        emptyMessage.className = 'empty-recycle-bin';
                        emptyMessage.textContent = 'Recycle bin is empty';
                        recycledTasksList.innerHTML = '';
                        recycledTasksList.appendChild(emptyMessage);
                    }
                });
                
                deleteBtn.addEventListener('click', async () => {
                    if (confirm('Are you sure you want to permanently delete this task?')) {
                        await ApiService.permanentlyDeleteTask(task.id);
                        taskElement.remove();
                        
                        // Show empty message if no tasks left
                        const remainingTasks = await ApiService.getRecycledTasks();
                        if (remainingTasks.length === 0) {
                            const emptyMessage = document.createElement('div');
                            emptyMessage.className = 'empty-recycle-bin';
                            emptyMessage.textContent = 'Recycle bin is empty';
                            recycledTasksList.innerHTML = '';
                            recycledTasksList.appendChild(emptyMessage);
                        }
                    }
                });
                
                actionBtns.appendChild(restoreBtn);
                actionBtns.appendChild(deleteBtn);
                
                taskElement.appendChild(taskTitle);
                taskElement.appendChild(deleteDate);
                taskElement.appendChild(actionBtns);
                
                recycledTasksList.appendChild(taskElement);
            });
        }
        
        // Add empty bin button if there are tasks
        if (recycledTasks.length > 0) {
            const emptyBinContainer = document.createElement('div');
            emptyBinContainer.className = 'empty-bin-container';
            
            const emptyBinBtn = document.createElement('button');
            emptyBinBtn.className = 'empty-bin-btn';
            emptyBinBtn.textContent = 'Empty Recycle Bin';
            
            emptyBinBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to permanently delete all items in the recycle bin?')) {
                    // Clear recycle bin via API
                    await ApiService.cleanupRecycleBin();
                    
                    // Update UI
                    recycledTasksList.innerHTML = '';
                    const emptyMessage = document.createElement('div');
                    emptyMessage.className = 'empty-recycle-bin';
                    emptyMessage.textContent = 'Recycle bin is empty';
                    recycledTasksList.appendChild(emptyMessage);
                    
                    // Remove empty bin button
                    emptyBinContainer.remove();
                }
            });
            
            emptyBinContainer.appendChild(emptyBinBtn);
            modalContent.appendChild(emptyBinContainer);
        }
        
        // Assemble modal
        modalContent.appendChild(header);
        modalContent.appendChild(infoMessage);
        modalContent.appendChild(recycledTasksList);
        
        recycleBinModal.appendChild(modalContent);
        document.body.appendChild(recycleBinModal);
        
        // Add event listeners
        closeBtn.addEventListener('click', () => {
            recycleBinModal.remove();
        });
        
        recycleBinModal.addEventListener('click', (e) => {
            if (e.target === recycleBinModal) {
                recycleBinModal.remove();
            }
        });
        
        // Run cleanup on open
        await ApiService.cleanupRecycleBin();
    }

    /**
     * Initialize the application
     */
    async function init() {
        // Render initial tasks
        await renderTasks();
        
        // Set up event listeners
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', showAddTaskForm);
        } else {
            console.error('Add task button not found in the DOM');
        }
        
        // Filter tabs
        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                setActiveFilter(tab.dataset.filter);
            });
        });
        
        // Category items
        categoryItems.forEach(item => {
            item.addEventListener('click', () => {
                const category = item.querySelector('span:last-child').textContent.toLowerCase();
                setActiveCategory(category);
            });
        });
        
        // Categories toggle
        const categoriesHeader = document.querySelector('.categories-header');
        const categoryList = document.querySelector('.category-list');
        
        if (categoriesHeader && categoryList) {
            categoriesHeader.addEventListener('click', () => {
                categoryList.style.display = 
                    categoryList.style.display === 'none' ? 'block' : 'none';
                
                const icon = categoriesHeader.querySelector('i');
                if (icon) {
                    icon.className = 
                        categoryList.style.display === 'none' ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
                }
            });
        }
        
        // Add new category
        const addCategory = document.querySelector('.add-category');
        if (addCategory) {
            addCategory.addEventListener('click', () => {
                const categoryName = prompt('Enter new category name:');
                
                if (categoryName && categoryName.trim()) {
                    // TODO: Add new category functionality
                    alert(`Category "${categoryName}" added!`);
                }
            });
        }
        
        // Recycle bin
        const recycleBin = document.querySelector('.recycle-bin');
        if (recycleBin) {
            recycleBin.addEventListener('click', showRecycleBin);
        }
    }

    // Public API
    return {
        init
    };
})();

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    TodoApp.init();
});