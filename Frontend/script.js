const API_BASE = "https://task-management-app-2-hfeq.onrender.com";

/* ==================== Toast ==================== */
let toastTimer = null;
function showToast(text, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = text;
  toast.className = `toast is-visible ${type === "error" ? "is-error" : "is-success"}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2500);
}

/* ==================== API helper ==================== */
async function api(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) headers["authorization"] = localStorage.getItem("token") || "";

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try { data = await response.json(); } catch (_) { /* empty body */ }

  if (!response.ok) {
    const message = (data && data.detail) || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data;
}

/* ==================== Page switching ==================== */
function showAuthPage() {
  document.getElementById("page-auth").hidden = false;
  document.getElementById("page-dashboard").hidden = true;
}
function showDashboardPage() {
  document.getElementById("page-auth").hidden = true;
  document.getElementById("page-dashboard").hidden = false;
}

/* ==================== Auth tabs ==================== */
function setAuthTab(tab) {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.toggle("is-active", btn.dataset.tab === tab);
  });
  document.getElementById("login-form").classList.toggle("is-active", tab === "login");
  document.getElementById("register-form").classList.toggle("is-active", tab === "register");
}

/* ==================== Modals ==================== */
function openModal(id) { document.getElementById(id).hidden = false; }
function closeModal(id) { document.getElementById(id).hidden = true; }

/* ==================== Auth actions ==================== */
async function handleRegister(event) {
  event.preventDefault();
  const form = event.target;
  const payload = {
    name: form.name.value.trim(),
    username: form.username.value.trim(),
    password: form.password.value,
    email: form.email.value.trim(),
  };
  try {
    await api("/users/create_user", { method: "POST", body: payload });
    showToast("Account created — you can log in now");
    form.reset();
    setAuthTab("login");
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.target;
  const payload = {
    username: form.username.value.trim(),
    password: form.password.value,
  };
  try {
    const result = await api("/users/login", { method: "POST", body: payload });
    localStorage.setItem("token", result.token);
    showToast("Logged in");
    await loadDashboard();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function handleLogout() {
  localStorage.removeItem("token");
  showAuthPage();
}

/* ==================== Profile ==================== */
async function loadProfile() {
  const profile = await api("/users/is_auth", { auth: true });
  document.getElementById("profile-name").textContent = profile.name;
  document.getElementById("profile-username").textContent = profile.username;
  document.getElementById("profile-email").textContent = profile.email;
}

/* ==================== Tasks: render ==================== */
function renderTasks(tasks) {
  const body = document.getElementById("tasks-body");
  const empty = document.getElementById("tasks-empty");

  if (!tasks.length) {
    body.innerHTML = "";
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  body.innerHTML = tasks.map(task => {
    const done = task.is_completed === true || task.is_completed === "true";
    return `
      <tr>
        <td>${escapeHtml(task.title)}</td>
        <td><span class="status-pill ${done ? "done" : "pending"}">${done ? "Done" : "Pending"}</span></td>
        <td class="col-actions">
          <div class="row-actions">
            <button type="button" class="btn-text" data-action="view" data-id="${task.id}">View</button>
            <button type="button" class="btn-text" data-action="edit" data-id="${task.id}">Edit</button>
            <button type="button" class="btn-text danger" data-action="delete" data-id="${task.id}">Delete</button>
          </div>
        </td>
      </tr>`;
  }).join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

async function loadTasks() {
  const tasks = await api("/tasks/all_tasks", { auth: true });
  renderTasks(tasks);
}

/* ==================== Tasks: actions ==================== */
async function handleAddTask(event) {
  event.preventDefault();
  const form = event.target;
  const payload = {
    title: form.title.value.trim(),
    description: form.description.value.trim(),
  };
  try {
    await api("/tasks/create", { method: "POST", body: payload, auth: true });
    showToast("Task added");
    form.reset();
    closeModal("add-modal");
    await loadTasks();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function viewTask(id) {
  try {
    const task = await api(`/tasks/one_task/${id}`, { auth: true });
    document.getElementById("view-modal-title").textContent = task.title;
    document.getElementById("view-description").textContent = task.description || "No description.";
    openModal("view-modal");
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function openEditTask(id) {
  try {
    const task = await api(`/tasks/one_task/${id}`, { auth: true });
    const form = document.getElementById("edit-task-form");
    form.task_id.value = task.id;
    form.title.value = task.title;
    form.description.value = task.description || "";
    form.is_completed.value = String(task.is_completed);
    openModal("edit-modal");
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function handleEditTask(event) {
  event.preventDefault();
  const form = event.target;
  const id = form.task_id.value;
  const payload = {
    title: form.title.value.trim(),
    description: form.description.value.trim(),
    is_completed: form.is_completed.value,
  };
  try {
    await api(`/tasks/update_task/${id}`, { method: "PUT", body: payload, auth: true });
    showToast("Task updated");
    closeModal("edit-modal");
    await loadTasks();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function deleteTask(id) {
  if (!confirm("Delete this task?")) return;
  try {
    await api(`/tasks/delete_task/${id}`, { method: "DELETE", auth: true });
    showToast("Task deleted");
    await loadTasks();
  } catch (err) {
    showToast(err.message, "error");
  }
}

/* ==================== Bootstrap ==================== */
async function loadDashboard() {
  try {
    await loadProfile();
    await loadTasks();
    showDashboardPage();
  } catch (err) {
    // token invalid/expired
    localStorage.removeItem("token");
    showAuthPage();
    showToast("Session expired — please log in again", "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Auth tab switching
  document.querySelectorAll("[data-tab]").forEach(el => {
    el.addEventListener("click", () => setAuthTab(el.dataset.tab));
  });

  document.getElementById("login-form").addEventListener("submit", handleLogin);
  document.getElementById("register-form").addEventListener("submit", handleRegister);
  document.getElementById("logout-btn").addEventListener("click", handleLogout);

  // Modal open/close
  document.getElementById("add-task-btn").addEventListener("click", () => openModal("add-modal"));
  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => closeModal(btn.dataset.close));
  });
  document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) backdrop.hidden = true;
    });
  });

  document.getElementById("add-task-form").addEventListener("submit", handleAddTask);
  document.getElementById("edit-task-form").addEventListener("submit", handleEditTask);

  // Delegated task row actions
  document.getElementById("tasks-body").addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-action]");
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === "view") viewTask(id);
    if (action === "edit") openEditTask(id);
    if (action === "delete") deleteTask(id);
  });

  // Restore session
  if (localStorage.getItem("token")) {
    loadDashboard();
  } else {
    showAuthPage();
  }
});
