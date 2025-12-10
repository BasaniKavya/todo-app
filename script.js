// ---------- script.js (enhanced) ----------
const STORAGE_KEY = 'todoList_v1';
const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const listEl = document.getElementById('todo-list');
const countEl = document.getElementById('count');
const filterButtons = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clear-completed');
const themeToggle = document.getElementById('theme-toggle');

let todos = [];
let currentFilter = 'all';

// -------- storage ----------
function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}
function loadTodos() {
  const raw = localStorage.getItem(STORAGE_KEY);
  todos = raw ? JSON.parse(raw) : [];
}

// -------- todo operations ----------
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
function updateTodoText(id, newText) {
  todos = todos.map(t => t.id === id ? { ...t, text: newText } : t);
  saveTodos(); render();
}

// -------- render ----------
function render() {
  let filtered = todos;
  if (currentFilter === 'active') filtered = todos.filter(t => !t.completed);
  if (currentFilter === 'completed') filtered = todos.filter(t => t.completed);

  if (filtered.length === 0) {
    listEl.innerHTML = `<li class="small">No tasks — add one above!</li>`;
  } else {
    listEl.innerHTML = filtered.map(t => `
      <li class="todo-item ${t.completed ? 'completed' : ''}" data-id="${t.id}">
        <div class="left">
          <input type="checkbox" class="todo-checkbox" ${t.completed ? 'checked' : ''} aria-label="Mark task complete">
          <span class="todo-text" title="${escapeHtml(t.text)}">${escapeHtml(t.text)}</span>
        </div>
        <div class="item-actions">
          <button class="delete-btn" aria-label="Delete task">Delete</button>
        </div>
      </li>`).join('');
  }

  countEl.textContent = `${todos.filter(t => !t.completed).length} left`;
  filterButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === currentFilter);
    btn.setAttribute('aria-selected', btn.dataset.filter === currentFilter ? 'true' : 'false');
  });
}

// small utility to avoid XSS via titles
function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]);
}

// -------- event listeners ----------
form.addEventListener('submit', e => {
  e.preventDefault();
  const val = input.value.trim();
  if (val) addTodo(val);
  input.value = '';
  input.focus();
});

// delegated click handling for list
listEl.addEventListener('click', e => {
  const li = e.target.closest('li[data-id]');
  if (!li) return;
  const id = li.dataset.id;

  if (e.target.matches('.todo-checkbox')) {
    toggleTodo(id);
    return;
  }
  if (e.target.matches('.delete-btn')) {
    // small fade animation before removing
    li.style.opacity = '0';
    li.style.transform = 'translateY(8px)';
    setTimeout(() => deleteTodo(id), 160);
  }
});

// double-click to edit
listEl.addEventListener('dblclick', e => {
  const li = e.target.closest('li[data-id]');
  if (!li) return;
  const id = li.dataset.id;
  const span = li.querySelector('.todo-text');
  if (!span) return;

  // create input
  const inputEdit = document.createElement('input');
  inputEdit.type = 'text';
  inputEdit.className = 'edit-input';
  inputEdit.value = todos.find(t => t.id === id)?.text || '';
  span.replaceWith(inputEdit);
  inputEdit.focus();
  inputEdit.setSelectionRange(inputEdit.value.length, inputEdit.value.length);

  // handle keys
  const onKey = (ev) => {
    if (ev.key === 'Enter') {
      const newVal = inputEdit.value.trim();
      if (newVal) updateTodoText(id, newVal);
      else deleteTodo(id);
      cleanup();
    } else if (ev.key === 'Escape') {
      cleanup();
      render();
    }
  };
  inputEdit.addEventListener('keydown', onKey);

  // blur -> commit
  inputEdit.addEventListener('blur', () => {
    const newVal = inputEdit.value.trim();
    if (newVal) updateTodoText(id, newVal);
    else render();
    cleanup();
  });

  function cleanup() {
    inputEdit.removeEventListener('keydown', onKey);
  }
});

// filters
filterButtons.forEach(btn => btn.addEventListener('click', () => {
  currentFilter = btn.dataset.filter;
  render();
}));

// clear completed
clearCompletedBtn.addEventListener('click', () => {
  clearCompleted();
});

// keyboard shortcut: N -> focus input
document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'n' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    e.preventDefault();
    input.focus();
  }
});

// theme toggle (keeps as a simple label; palette is fixed to pink night)
themeToggle?.addEventListener('click', () => {
  // For now, it's a cosmetic toggle: simply animate glows on/off
  const left = document.querySelector('.left-glow');
  const right = document.querySelector('.right-glow');
  if (left.style.opacity === '0') {
    left.style.opacity = right.style.opacity = '.32';
    themeToggle.setAttribute('aria-pressed','true');
  } else {
    left.style.opacity = right.style.opacity = '0';
    themeToggle.setAttribute('aria-pressed','false');
  }
});

// Initialize
loadTodos();
render();
