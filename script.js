const input = document.getElementById("todo-input");
const form = document.getElementById("todo-form");
const list = document.getElementById("todo-list");
const countDisplay = document.getElementById("count");
const clearCompleted = document.getElementById("clear-completed");
const filterBtns = document.querySelectorAll(".filter-btn");
const themeBtn = document.getElementById("theme-btn");

let tasks = [];
let filter = "all";

/* ================================
   THEME SWITCHING
================================== */

function loadTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.add("light");
    themeBtn.innerHTML = `<i class="fa fa-sun"></i>`;
  }
}

themeBtn.onclick = () => {
  document.body.classList.toggle("light");

  if (document.body.classList.contains("light")) {
    themeBtn.innerHTML = `<i class="fa fa-sun"></i>`;
    localStorage.setItem("theme", "light");
  } else {
    themeBtn.innerHTML = `<i class="fa fa-moon"></i>`;
    localStorage.setItem("theme", "dark");
  }
};

loadTheme();


/* ================================
   TASK FUNCTIONS
================================== */

function render() {
  list.innerHTML = "";

  const filtered = tasks.filter(t =>
    filter === "all"
      ? true
      : filter === "active"
      ? !t.completed
      : t.completed
  );

  filtered.forEach(task => {
    const li = document.createElement("li");
    li.className = "todo-item" + (task.completed ? " completed" : "");

    li.innerHTML = `
      <span class="todo-text" ondblclick="editTask(${task.id})">${task.text}</span>
      <button class="edit-btn" onclick="editTask(${task.id})"><i class="fa fa-edit"></i></button>
      <button class="delete-btn" onclick="deleteTask(${task.id})"><i class="fa fa-trash"></i></button>
    `;

    li.onclick = e => {
      if (e.target.classList.contains("fa")) return;
      toggleComplete(task.id);
    };

    list.appendChild(li);
  });

  updateCount();
}

function updateCount() {
  const activeCount = tasks.filter(t => !t.completed).length;
  countDisplay.textContent = `${activeCount} left`;
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  tasks.push({
    id: Date.now(),
    text,
    completed: false
  });

  input.value = "";
  render();
});

function toggleComplete(id) {
  tasks = tasks.map(t =>
    t.id === id ? { ...t, completed: !t.completed } : t
  );
  render();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  render();
}

function editTask(id) {
  const newText = prompt("Edit task:");
  if (!newText) return;

  tasks = tasks.map(t =>
    t.id === id ? { ...t, text: newText } : t
  );
  render();
}

filterBtns.forEach(btn =>
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filter = btn.dataset.filter;
    render();
  })
);

clearCompleted.onclick = () => {
  tasks = tasks.filter(t => !t.completed);
  render();
};

render();
