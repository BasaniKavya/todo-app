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

// Toggle Completion
function toggleTodo(id) {
  todos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  saveTodos();
  render();
}

// Delete Todo
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

// Render list
function render() {
  // Optionally sort / filter here (just simple all / active / completed)
  let filtered = [...todos];
  if (currentFilter === "active") filtered = filtered.filter(t => !t.completed);
  if (currentFilter === "completed") filtered = filtered.filter(t => t.completed);

  // sort by custom order
  filtered.sort((a,b) => a.order - b.order);

  listEl.innerHTML = filtered.length === 0
    ? `<li class="small">No tasks — add one above!</li>`
    : filtered.map(t => `
      <li class="todo-item ${t.completed ? "completed" : ""}" data-id="${t.id}" draggable="true">
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
  filterButtons.forEach(btn =>
    btn.classList.toggle("active", btn.dataset.filter === currentFilter)
  );
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

// Initialize
loadTodos();
render();
