const STORAGE_KEY = "todoList_v1";
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const dueDateInput = document.getElementById("todo-due");
const prioritySelect = document.getElementById("todo-priority");

const listEl = document.getElementById("todo-list");
const countEl = document.getElementById("count");
const filterButtons = document.querySelectorAll(".filter-btn");
const clearCompletedBtn = document.getElementById("clear-completed");

let todos = [];
let currentFilter = "all";

let dragSrcEl = null;

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
    due: dueDateInput.value || "",
    order: todos.length
  });
  saveTodos();
  render();
}

// Toggle, Delete, Edit
function toggleTodo(id) {
  todos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  saveTodos();
  render();
}
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

// Render
function render() {
  // filter
  let filtered = [...todos];
  if (currentFilter === "active") filtered = filtered.filter(t => !t.completed);
  if (currentFilter === "completed") filtered = filtered.filter(t => t.completed);

  // sort by order
  filtered.sort((a,b) => a.order - b.order);

  listEl.innerHTML = filtered.length === 0
    ? `<li class="small">No tasks — add one above!</li>`
    : filtered.map(t => `
      <li class="todo-item ${t.completed ? "completed" : ""}"
        data-id="${t.id}" draggable="true">
        <div class="left">
          <input type="checkbox" class="todo-checkbox" ${t.completed ? "checked" : ""}>
          <span class="todo-text">${t.text}</span>
          ${t.due ? `<span class="todo-meta">Due: ${t.due}</span>` : ""}
        </div>
        <div class="item-actions">
          <button class="edit-btn" title="Edit"><i class="fa fa-edit"></i></button>
          <button class="delete-btn" title="Delete"><i class="fa fa-trash"></i></button>
        </div>
      </li>
    `).join("");

  countEl.textContent = `${todos.filter(t => !t.completed).length} left`;

  // attach drag handlers
  addDragAndDrop();
}

// Event Listeners
form.addEventListener("submit", e => {
  e.preventDefault();
  const val = input.value.trim();
  if (!val) return;
  addTodo(val);
  input.value = "";
  dueDateInput.value = "";
  prioritySelect.value = "normal";
});

listEl.addEventListener("click", e => {
  const li = e.target.closest("li[data-id]");
  if (!li) return;
  const id = li.dataset.id;

  if (e.target.closest(".todo-checkbox")) {
    toggleTodo(id);
  } else if (e.target.closest(".delete-btn")) {
    deleteTodo(id);
  } else if (e.target.closest(".edit-btn")) {
    const newText = prompt("Edit task:", li.querySelector(".todo-text").textContent);
    if (newText !== null) {
      const clean = newText.trim();
      if (clean) {
        todos = todos.map(t => t.id === id ? { ...t, text: clean } : t);
        saveTodos();
        render();
      }
    }
  }
});

filterButtons.forEach(btn =>
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    render();
  })
);

clearCompletedBtn.addEventListener("click", clearCompleted);

// Drag & Drop reordering functions
function addDragAndDrop() {
  const items = listEl.querySelectorAll('li.todo-item');
  items.forEach(item => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('dragenter', handleDragEnter);
    item.addEventListener('dragleave', handleDragLeave);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragend', handleDragEnd);
  });
}
function handleDragStart(e) {
  dragSrcEl = e.currentTarget;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragSrcEl.dataset.id);
  dragSrcEl.classList.add('dragging');
}
function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}
function handleDragEnter(e) {
  if (e.currentTarget !== dragSrcEl) {
    e.currentTarget.classList.add('drop-target');
  }
}
function handleDragLeave(e) {
  e.currentTarget.classList.remove('drop-target');
}
function handleDrop(e) {
  e.stopPropagation();
  const srcId = e.dataTransfer.getData('text/plain');
  const destId = e.currentTarget.dataset.id;
  if (srcId !== destId) {
    const srcIndex = todos.findIndex(t => t.id === srcId);
    const destIndex = todos.findIndex(t => t.id === destId);
    // swap order
    const tmp = todos[srcIndex].order;
    todos[srcIndex].order = todos[destIndex].order;
    todos[destIndex].order = tmp;
    saveTodos();
    render();
  }
}
function handleDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  listEl.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
}

// Init
loadTodos();
render();

