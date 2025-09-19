// ---------- script.js ----------

const STORAGE_KEY = 'todoList_v1';
const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const listEl = document.getElementById('todo-list');
const countEl = document.getElementById('count');
const filterButtons = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clear-completed');

let todos = [];
let currentFilter = 'all';

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}
function loadTodos() {
  const raw = localStorage.getItem(STORAGE_KEY);
  todos = raw ? JSON.parse(raw) : [];
}

function addTodo(text) {
  todos.unshift({ id: Date.now().toString(), text, completed: false });
  saveTodos();
  render();
}
function toggleTodo(id) {
  todos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  saveTodos(); render();
}
function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos(); render();
}
function clearCompleted() {
  todos = todos.filter(t => !t.completed);
  saveTodos(); render();
}

function render() {
  let filtered = todos;
  if (currentFilter === 'active') filtered = todos.filter(t => !t.completed);
  if (currentFilter === 'completed') filtered = todos.filter(t => t.completed);

  listEl.innerHTML = filtered.length === 0
    ? `<li class="small">No tasks — add one above!</li>`
    : filtered.map(t => `
      <li class="todo-item ${t.completed ? 'completed' : ''}" data-id="${t.id}">
        <div>
          <input type="checkbox" class="todo-checkbox" ${t.completed ? 'checked' : ''}>
          <span class="todo-text">${t.text}</span>
        </div>
        <div>
          <button class="delete-btn">Delete</button>
        </div>
      </li>`).join('');

  countEl.textContent = `${todos.filter(t => !t.completed).length} left`;
  filterButtons.forEach(btn =>
    btn.classList.toggle('active', btn.dataset.filter === currentFilter)
  );
}

// --- Event Listeners ---
form.addEventListener('submit', e => {
  e.preventDefault();
  if (input.value.trim()) addTodo(input.value.trim());
  input.value = '';
});
listEl.addEventListener('click', e => {
  const li = e.target.closest('li[data-id]');
  if (!li) return;
  const id = li.dataset.id;
  if (e.target.matches('.todo-checkbox')) toggleTodo(id);
  if (e.target.matches('.delete-btn')) deleteTodo(id);
});
filterButtons.forEach(btn => btn.addEventListener('click', () => {
  currentFilter = btn.dataset.filter;
  render();
}));
clearCompletedBtn.addEventListener('click', clearCompleted);

// Initialize
loadTodos();
render();
