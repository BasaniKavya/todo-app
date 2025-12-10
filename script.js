// script.js — full-featured (drag, due date, priority, export/import, theme)
const STORAGE_KEY = 'todoList_v1';
const THEME_KEY = 'todoTheme_v1';

const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const dueInput = document.getElementById('todo-due');
const prioritySelect = document.getElementById('todo-priority');
const listEl = document.getElementById('todo-list');
const countEl = document.getElementById('count');
const filterButtons = document.querySelectorAll('.filter-btn');
const sortSelect = document.getElementById('sort-select');
const clearCompletedBtn = document.getElementById('clear-completed');
const exportBtn = document.getElementById('export-btn');
const importFile = document.getElementById('import-file');
const themeToggle = document.getElementById('theme-toggle');
const appRoot = document.getElementById('app-root');

let todos = []; // {id,text,completed,due,priority,createdAt}
let currentFilter = 'all';
let currentSort = 'manual';
let dragId = null;

// ---------- storage ----------
function saveTodos(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(todos)); }
function loadTodos(){ const raw = localStorage.getItem(STORAGE_KEY); todos = raw ? JSON.parse(raw) : []; }

// theme
function loadTheme(){
  const t = localStorage.getItem(THEME_KEY) || 'glow-on';
  if(t === 'light') document.documentElement.setAttribute('data-theme','light');
  else document.documentElement.removeAttribute('data-theme');
  themeToggle.setAttribute('aria-pressed', t === 'glow-on' ? 'true' : 'false');
  // store glow state in button dataset for quick toggling
  themeToggle.dataset.state = t;
}
function toggleTheme(){
  const state = themeToggle.dataset.state === 'light' ? 'glow-on' : 'light';
  themeToggle.dataset.state = state;
  if(state === 'light') document.documentElement.setAttribute('data-theme','light');
  else document.documentElement.removeAttribute('data-theme');
  localStorage.setItem(THEME_KEY, state);
}

// ---------- todo operations ----------
function createTodoObj(text, due=null, priority='normal'){
  return { id: Date.now().toString(), text, completed:false, due: due || null, priority, createdAt: Date.now() };
}

function addTodo(text, due=null, priority='normal'){
  // add to start (newest) for manual ordering
  todos.unshift(createTodoObj(text,due,priority));
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
function updateTodoMeta(id, meta){
  todos = todos.map(t => t.id === id ? { ...t, ...meta } : t);
  saveTodos(); render();
}

// reorder helper: move draggedId before dropId
function moveItem(dragId, dropId){
  if(dragId === dropId) return;
  const fromIndex = todos.findIndex(t => t.id === dragId);
  const toIndex = todos.findIndex(t => t.id === dropId);
  if(fromIndex === -1 || toIndex === -1) return;
  const [item] = todos.splice(fromIndex,1);
  // insert at toIndex (placing dragged item at position of drop)
  todos.splice(toIndex,0,item);
  saveTodos(); render();
}

// ---------- sorting ----------
function applySort(list){
  if(currentSort === 'manual') return list;
  if(currentSort === 'created') return [...list].sort((a,b)=> b.createdAt - a.createdAt);
  if(currentSort === 'due') return [...list].sort((a,b)=>{
    if(!a.due && !b.due) return 0;
    if(!a.due) return 1;
    if(!b.due) return -1;
    return new Date(a.due) - new Date(b.due);
  });
  if(currentSort === 'priority') return [...list].sort((a,b)=>{
    const rank = { high: 0, normal: 1, low: 2 };
    return (rank[a.priority] ?? 1) - (rank[b.priority] ?? 1);
  });
  return list;
}

// ---------- render ----------
function render(){
  // apply filter
  let filtered = todos;
  if(currentFilter === 'active') filtered = todos.filter(t=>!t.completed);
  if(currentFilter === 'completed') filtered = todos.filter(t=>t.completed);

  // apply sort (but do not modify underlying manual order unless drag)
  filtered = applySort(filtered);

  if(filtered.length === 0){
    listEl.innerHTML = `<li class="small">No tasks — add one above!</li>`;
  } else {
    listEl.innerHTML = filtered.map(t => {
      const dueLabel = t.due ? `<span class="todo-meta">${formatDateShort(t.due)}</span>` : '';
      const prClass = t.priority === 'high' ? 'priority-high' : t.priority === 'low' ? 'priority-low' : 'priority-normal';
      const prText = t.priority === 'high' ? 'H' : t.priority === 'low' ? 'L' : 'N';
      return `
      <li class="todo-item ${t.completed ? 'completed' : ''}" data-id="${t.id}" draggable="${currentSort === 'manual'}" >
        <div class="left">
          <input type="checkbox" class="todo-checkbox" ${t.completed?'checked':''} aria-label="Mark complete">
          <div style="min-width:0;">
            <span class="todo-text" title="${escapeHtml(t.text)}">${escapeHtml(t.text)}</span>
            <div class="todo-meta">
              ${dueLabel}
              <span class="priority-chip ${prClass}" title="Priority">${prText}</span>
            </div>
          </div>
        </div>
        <div class="item-actions">
          <button class="ghost edit-btn" title="Edit"><i class="fa fa-pen"></i></button>
          <button class="delete-btn" aria-label="Delete task"><i class="fa fa-trash"></i></button>
        </div>
      </li>`;
    }).join('');
  }

  // update counters and active states
  countEl.textContent = `${todos.filter(t=>!t.completed).length} left`;
  filterButtons.forEach(btn=>{
    const isActive = btn.dataset.filter === currentFilter;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  // update sort control UI value
  sortSelect.value = currentSort;
  // attach drag handlers (delegated below) and focusability remains
}

// utilities
function escapeHtml(s=''){ return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]); }
function formatDateShort(iso){ // YYYY-MM-DD -> readable
  try { const d = new Date(iso + 'T00:00:00'); return d.toLocaleDateString(undefined,{month:'short',day:'numeric'}); } catch { return iso; }
}

// ---------- events ----------
// add
form.addEventListener('submit', e=>{
  e.preventDefault();
  const text = input.value.trim();
  if(!text) return;
  const due = dueInput.value || null;
  const pr = prioritySelect.value || 'normal';
  addTodo(text, due, pr);
  input.value=''; dueInput.value=''; prioritySelect.value='normal';
  input.focus();
});

// click handlers (delegation)
listEl.addEventListener('click', e=>{
  const li = e.target.closest('li[data-id]');
  if(!li) return;
  const id = li.dataset.id;

  if(e.target.matches('.todo-checkbox')) { toggleTodo(id); return; }
  if(e.target.closest('.delete-btn')) { // animated remove
    li.style.transition = 'opacity .16s ease, transform .16s ease';
    li.style.opacity = '0'; li.style.transform = 'translateY(10px)';
    setTimeout(()=> deleteTodo(id), 160);
    return;
  }
  if(e.target.closest('.edit-btn')) {
    startEdit(li, id);
    return;
  }
});

// double-click to edit
listEl.addEventListener('dblclick', e=>{
  const li = e.target.closest('li[data-id]');
  if(!li) return;
  const id = li.dataset.id;
  startEdit(li, id);
});

// start inline edit
function startEdit(li, id){
  const t = todos.find(x=>x.id===id);
  if(!t) return;
  const span = li.querySelector('.todo-text');
  const meta = li.querySelector('.todo-meta');
  const editInput = document.createElement('input');
  editInput.type = 'text'; editInput.className = 'edit-input'; editInput.value = t.text;
  // replace the span and meta with a small editor row (text + due + priority controls)
  span.replaceWith(editInput);
  // create small controls for due + priority
  const editorMeta = document.createElement('div');
  editorMeta.style.display = 'flex'; editorMeta.style.gap = '6px'; editorMeta.style.marginTop = '6px';
  editorMeta.innerHTML = `
    <input type="date" class="edit-due" value="${t.due ? t.due : ''}">
    <select class="edit-pr" aria-label="Priority">
      <option value="high"${t.priority==='high'?' selected':''}>High</option>
      <option value="normal"${t.priority==='normal'?' selected':''}>Normal</option>
      <option value="low"${t.priority==='low'?' selected':''}>Low</option>
    </select>
  `;
  span.parentElement.appendChild(editorMeta);
  editInput.focus();
  editInput.setSelectionRange(editInput.value.length, editInput.value.length);

  const onKey = (ev)=>{
    if(ev.key === 'Enter'){
      commit();
    } else if(ev.key === 'Escape'){
      render();
    }
  };
  function commit(){
    const newText = editInput.value.trim();
    const newDue = editorMeta.querySelector('.edit-due').value || null;
    const newPr = editorMeta.querySelector('.edit-pr').value || 'normal';
    if(newText) updateTodoMeta(id, { text: newText, due: newDue, priority: newPr });
    else deleteTodo(id);
  }
  editInput.addEventListener('keydown', onKey);
  editInput.addEventListener('blur', ()=>{ setTimeout(()=>render(),60); }); // small delay to allow clicks on selects
}

// filters
filterButtons.forEach(btn => btn.addEventListener('click', ()=>{
  currentFilter = btn.dataset.filter;
  render();
}));

// sort selection
sortSelect.addEventListener('change', ()=>{
  currentSort = sortSelect.value;
  render();
});

// clear completed
clearCompletedBtn.addEventListener('click', ()=> {
  if(confirm('Clear all completed tasks?')) clearCompleted();
});

// export
exportBtn.addEventListener('click', ()=>{
  const dataStr = JSON.stringify(todos, null, 2);
  const blob = new Blob([dataStr], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `todos_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// import
importFile.addEventListener('change', (e)=>{
  const f = e.target.files && e.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = (ev)=>{
    try {
      const parsed = JSON.parse(ev.target.result);
      if(!Array.isArray(parsed)) throw new Error('Invalid format');
      // basic validation: ensure objects have id & text
      const cleaned = parsed.map(p => ({
        id: p.id || Date.now().toString() + Math.random().toString(16).slice(2),
        text: p.text || '',
        completed: !!p.completed,
        due: p.due || null,
        priority: p.priority || 'normal',
        createdAt: p.createdAt || Date.now()
      }));
      // confirm overwrite or merge
      if(confirm('Import will replace current tasks. Proceed?')) {
        todos = cleaned;
        saveTodos();
        render();
      }
    } catch(err){
      alert('Failed to import: invalid JSON file.');
    }
  };
  reader.readAsText(f);
  // reset input
  e.target.value = '';
});

// keyboard shortcut: N -> focus input
document.addEventListener('keydown', (e)=>{
  if(e.key.toLowerCase() === 'n' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){
    e.preventDefault(); input.focus();
  }
});

// theme toggle (persisted)
themeToggle.addEventListener('click', ()=>{
  const current = localStorage.getItem(THEME_KEY) || 'glow-on';
  if(current === 'glow-on'){ // switch to light (alternate)
    localStorage.setItem(THEME_KEY,'light'); themeToggle.setAttribute('aria-pressed','true'); document.documentElement.setAttribute('data-theme','light');
  } else {
    localStorage.setItem(THEME_KEY,'glow-on'); themeToggle.setAttribute('aria-pressed','false'); document.documentElement.removeAttribute('data-theme');
  }
});

// ---------- drag & drop (manual mode) ----------
let lastOver = null;
listEl.addEventListener('dragstart', (e)=>{
  const li = e.target.closest('li[data-id]');
  if(!li) return;
  dragId = li.dataset.id;
  li.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  try { e.dataTransfer.setData('text/plain', dragId); } catch{}
});

listEl.addEventListener('dragend', (e)=>{
  const li = e.target.closest('li[data-id]');
  if(li) li.classList.remove('dragging');
  dragId = null;
  // cleanup any visual states
  document.querySelectorAll('.drop-target').forEach(n=>n.classList.remove('drop-target'));
});

listEl.addEventListener('dragover', (e)=>{
  e.preventDefault();
  const li = e.target.closest('li[data-id]');
  if(!li || !dragId) return;
  if(li.dataset.id === dragId) return;
  // show drop target outline
  if(lastOver && lastOver !== li) lastOver.classList.remove('drop-target');
  li.classList.add('drop-target');
  lastOver = li;
});

listEl.addEventListener('dragleave', (e)=>{
  const li = e.target.closest('li[data-id]');
  if(li) li.classList.remove('drop-target');
});

listEl.addEventListener('drop', (e)=>{
  e.preventDefault();
  const li = e.target.closest('li[data-id]');
  if(!li || !dragId) return;
  const dropId = li.dataset.id;
  moveItem(dragId, dropId);
  // remove visuals
  document.querySelectorAll('.drop-target').forEach(n=>n.classList.remove('drop-target'));
});

// ---------- delegated event: checkboxes, edit button, delete handled above by click delegation ----------

// ---------- init ----------
loadTodos();
loadTheme();
render();
