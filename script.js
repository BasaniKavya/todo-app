const STORAGE_KEY = "todoList_v1";
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const prioritySelect = document.getElementById("priority-select");
const categoryInput = document.getElementById("category-input");
const dueDateInput = document.getElementById("due-date");
const searchInput = document.getElementById("search-input");

const listEl = document.getElementById("todo-list");
const countEl = document.getElementById("count");
const filterButtons = document.querySelectorAll(".filter-btn");
const clearCompletedBtn = document.getElementById("clear-completed");

let todos = [];
let currentFilter = "all";
let searchQuery = "";

// Load & Save
function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}
function loadTodos() {
  const raw = localStorage.getItem(STORAGE_KEY);
  todos = raw ? JSON.parse(raw) : [];
}

// Add Todo
function addTodo(text) {
  todos.unshift({
    id: Date.now().toString(),
    text,
    completed: false,
    priority: prioritySelect.value,
    category: categoryInput.value || "",
    due: dueDateInput.value || "",
    subtasks: [],
    order: todos.length
  });
  saveTodos();
  render();
}

// Toggle
function toggleTodo(id) {
  todos = todos.map(t =>
    t.id === id ? { ...t, completed: !t.completed } : t
  );
  saveTodos();
  render();
}

// Edit
function editTodo(id, newText) {
  todos = todos.map(t =>
    t.id === id ? { ...t, text: newText } : t
  );
  saveTodos();
  render();
}

// Delete
function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  render();
}

// Clear Completed
function clearCompleted() {
  todos = todos.filter(t => !t.completed);
  saveTodos();
  render();
}

// Search
searchInput.addEventListener("input", e => {
  searchQuery = e.target.value.toLowerCase();
  render();
});

// Drag & Drop
let draggedItem = null;

listEl.addEventListener("dragstart", e => {
  draggedItem = e.target;
});

listEl.addEventListener("dragover", e => {
  e.preventDefault();
  const target = e.target.closest("li");
  if (target && target !== draggedItem) {
    listEl.insertBefore(draggedItem, target);
  }
});

listEl.addEventListener("dragend", () => {
  const newOrder = Array.from(listEl.children).map((li, index) => ({
    id: li.dataset.id,
    order: index
  }));
  
  todos = todos.map(t => {
    const match = newOrder.find(n => n.id === t.id);
    return { ...t, order: match.order };
  });

  todos.sort((a, b) => a.order - b.order);
  saveTodos();
});

// Render
function render() {
  let filtered = [...todos];

  if (currentFilter === "active") filtered = filtered.filter(t => !t.completed);
  if (currentFilter === "completed") filtered = filtered.filter(t => t.completed);

  // Search filter
  filtered = filtered.filter(t => t.text.toLowerCase().includes(searchQuery));

  filtered.sort((a, b) => a.order - b.order);

  listEl.innerHTML = filtered.length === 0
    ? `<li class="small">No tasks found</li>`
    : filtered.map(t => `
      <li class="todo-item ${t.completed ? "completed" : ""} ${t.priority}" data-id="${t.id}" draggable="true">
        <div>
          <input type="checkbox" class="todo-checkbox" ${t.completed ? "checked" : ""}>
          <span class="todo-text">${t.text}</span>
          ${t.category ? `<span class="small">#${t.category}</span>` : ""}
          ${t.due ? `<div class="due-date">Due: ${t.due}</div>` : ""}
        </div>

        <div class="actions">
          <button class="edit-btn" aria-label="Edit task"><i class="fa fa-edit"></i></button>
          <button class="delete-btn" aria-label="Delete task"><i class="fa fa-trash"></i></button>
        </div>
      </li>
    `).join("");

  countEl.textContent = `${todos.filter(t => !t.completed).length} left`;
}

// Event Listeners
form.addEventListener("submit", e => {
  e.preventDefault();
  if (input.value.trim()) addTodo(input.value.trim());
  input.value = "";
  categoryInput.value = "";
  dueDateInput.value = "";
});

listEl.addEventListener("click", e => {
  const li = e.target.closest("li[data-id]");
  if (!li) return;

  const id = li.dataset.id;

  if (e.target.closest(".todo-checkbox")) toggleTodo(id);

  if (e.target.closest(".delete-btn")) deleteTodo(id);

  if (e.target.closest(".edit-btn")) {
    const newText = prompt("Edit task:", li.querySelector(".todo-text").textContent);
    if (newText !== null) editTodo(id, newText.trim());
  }
});

filterButtons.forEach(btn =>
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    render();
  })
);

clearCompletedBtn.addEventListener("click", clearCompleted);

loadTodos();
render();
