// script.js — Blue Gradient (enhanced)
const STORAGE_KEY = 'todoList_v1';
const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const listEl = document.getElementById('todo-list');
const countEl = document.getElementById('count');
const filterButtons = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clear-completed');
const glowToggle = document.getElementById('theme-glow-toggle');

let todos = [];
let currentFilter = 'all';

// storage
function saveTodos(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(todos)); }
function loadTodos(){ const raw = localStorage.getItem(STORAGE_KEY); todos = raw ? JSON.parse(raw) : []; }

// operations
function addTodo(text){
  todos.unshift({ id: Date.now().toString(), text, completed: false });
  saveTodos(); render();
}
function toggleTodo(id){
  todos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  saveTodos(); render();
}
function deleteTodo(id){
  todos = todos.filter(t => t.id !== id);
  saveTodos(); render();
}
function clearCompleted(){
  todos = todos.filter(t => !t.completed);
  saveTodos(); render();
}
function updateTodoText(id, newText){
  todos = todos.map(t => t.id === id ? { ...t, text: newText } : t);
  saveTodos(); render();
}

// small safe escape to avoid XSS in title attributes
function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]);
}

// render
function render(){
  let filtered = todos;
  if (currentFilter === 'active') filtered = todos.filter(t => !t.completed);
  if (currentFilter === 'completed') filtered = todos.filter(t => t.completed);

  if (filtered.length === 0){
    listEl.innerHTML = `<li class="small">No tasks — add one above!</li>`;
  } else {
    listEl.innerHTML = filtered.map(t => `
      <li class="todo-item ${t.completed ? 'completed' : ''}" data-id="${t.id}">
        <div class="left">
          <input type="checkbox" class="todo-checkbox" ${t.completed ? 'checked' : ''} aria-label="Mark task complete">
          <span class="todo-text" title="${escapeHtml(t.text)}">${escapeHtml(t.text)}</span>
        </div>
        <div class="item-actions">
          <button class="delete-btn" aria-label="Delete task">
            <i class="fa fa-trash"></i>
          </button>
        </div>
      </li>
    `).join('');
  }

  countEl.textContent = `${todos.filter(t => !t.completed).length} left`;

  filterButtons.forEach(btn => {
    const isActive = btn.dataset.filter === currentFilter;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

// events
form.addEventListener('submit', e => {
  e.preventDefault();
  const val = input.value.trim();
  if (val) addTodo(val);
  input.value = '';
  input.focus();
});

listEl.addEventListener('click', e => {
  const li = e.target.closest('li[data-id]');
  if (!li) return;
  const id = li.dataset.id;

  if (e.target.matches('.todo-checkbox')) {
    toggleTodo(id);
    return;
  }
  if (e.target.closest('.delete-btn')) {
    // small fade animation
    li.style.transition = 'opacity .16s ease, transform .16s ease';
    li.style.opacity = '0';
    li.style.transform = 'translateY(10px)';
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

  const inputEdit = document.createElement('input');
  inputEdit.type = 'text';
  inputEdit.className = 'edit-input';
  inputEdit.value = todos.find(t => t.id === id)?.text || '';
  span.replaceWith(inputEdit);
  inputEdit.focus();
  inputEdit.setSelectionRange(inputEdit.value.length, inputEdit.value.length);

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

  inputEdit.addEventListener('blur', () => {
    const newVal = inputEdit.value.trim();
    if (newVal) updateTodoText(id, newVal);
    else render();
    cleanup();
  });

  function cleanup(){
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
  if (e.key.toLowerCase() === 'n' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) {
    e.preventDefault();
    input.focus();
  }
});

// glow toggle
glowToggle?.addEventListener('click', () => {
  const left = document.querySelector('.accent-left');
  const right = document.querySelector('.accent-right');
  if (!left || !right) return;
  const off = left.style.opacity === '0';
  left.style.opacity = off ? '.24' : '0';
  right.style.opacity = off ? '.24' : '0';
  glowToggle.classList.toggle('active', off);
});

// init
loadTodos();
render();
