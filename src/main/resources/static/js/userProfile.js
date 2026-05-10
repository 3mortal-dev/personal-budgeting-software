/* ═══════════════════════════════════════════════════════════════
   app.js  –  BudgetWise Profile Page
═══════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────
   API FETCH WRAPPER  –  always sends cookies
───────────────────────────────────────────── */
function apiFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

/* ─────────────────────────────────────────────
   IN-MEMORY STATE
───────────────────────────────────────────── */
const state = {
  user: {
    name: "",
    email: "",
    initials: "",
    role: "",
  },
  stats: {
    transactions: 0,
    budgets: 0,
    goals: 0,
  },
  prefs: {
    notifGoals: true,
    notifTransactions: true,
    currency: "USD",
  },
  notifications: [],
  categories: [], // custom categories
};

/* ─────────────────────────────────────────────
   CURRENCY META
───────────────────────────────────────────── */
const CURRENCIES = {
  EGP: { flag: "🇪🇬", name: "Egyptian Pound" },
  USD: { flag: "🇺🇸", name: "US Dollar" },
  EUR: { flag: "🇪🇺", name: "Euro" },
};

/* ─────────────────────────────────────────────
   INIT
───────────────────────────────────────────── */
async function init() {
  loaderInit([
    { pct: 40, label: "Loading your profile…" },
    { pct: 80, label: "Loading categories…" },
    { pct: 100, label: "Almost ready…" },
  ]);

  try {
    const response = await apiFetch("/api/profile", {
      method: "GET",
    });

    if (response.status === 401 || response.status === 403) {
      window.location.href = "/login";
      return;
    }

    if (!response.ok) throw new Error("Failed to load profile");

    const data = await response.json();

    state.user.name = data.name;
    state.user.email = data.email;
    state.user.role = data.role;
    state.user.initials = getInitials(data.name);
    state.stats.goals = data.goalsCount ?? 0;
    state.stats.transactions = data.transactionsCount ?? 0;
    state.stats.budgets = data.budgetsCount ?? 0;

    state.prefs.notifGoals = data.goalProgressAlertEnabled ?? true;
    state.prefs.notifTransactions = data.budgetAlertEnabled ?? true;
    state.prefs.currency = data.currency ?? "USD";

    renderAll();
    setGreeting();

    loaderAdvance(); // → 80%

    // Load notifications and custom categories in parallel
    await Promise.all([loadNotifications(), loadCustomCategories()]);

    // Restore bank connection UI if present in localStorage
    if (typeof restoreBankState === "function") restoreBankState();
  } catch (err) {
    console.error("Failed to load profile:", err);
  } finally {
    loaderAdvance(); // → 100%
    loaderHide(); // Always hide the loader, even on error
  }

  // Close currency dropdown on outside click
  document.addEventListener("click", (e) => {
    const dropdown = document.getElementById("currency-dropdown");
    const trigger = document.getElementById("currency-trigger");
    if (
      dropdown &&
      trigger &&
      !dropdown.contains(e.target) &&
      !trigger.contains(e.target)
    ) {
      closeCurrencyDropdown();
    }
  });

  // Close notification panel on outside click
  document.addEventListener("click", (e) => {
    const panel = document.getElementById("notif-panel");
    const notifBtn = document.getElementById("notif-icon-btn");
    if (
      panel &&
      notifBtn &&
      !panel.contains(e.target) &&
      !notifBtn.contains(e.target)
    ) {
      closeNotifPanel();
    }
  });
}

/* ═══════════════════════════════════════════
   RENDER
═══════════════════════════════════════════ */
function renderAll() {
  const { user, stats, prefs } = state;

  document.getElementById("profile-name").textContent = user.name;
  document.getElementById("profile-email").textContent = user.email;
  document.getElementById("avatar-main").textContent = user.initials;
  document.getElementById("topbarAvatar").textContent = user.initials;

  document.getElementById("stat-tx").textContent = stats.transactions;
  document.getElementById("stat-bud").textContent = stats.budgets;
  document.getElementById("stat-goals").textContent = stats.goals;

  document.getElementById("notif-goals-toggle").checked = prefs.notifGoals;
  document.getElementById("notif-transactions-toggle").checked =
    prefs.notifTransactions;
  setCurrencyDisplay(prefs.currency);

  document.querySelectorAll(".currency-option").forEach((el) => {
    el.classList.toggle("active", el.dataset.value === prefs.currency);
  });
}

function setGreeting() {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  document
    .querySelectorAll("topbar__greeting")
    .forEach(
      (e) =>
        (e.textContent = `Good ${timeOfDay}, ${state.user.name.split(" ")[0]} 👋`),
    );
}

/* ═══════════════════════════════════════════
   NOTIFICATIONS PANEL
═══════════════════════════════════════════ */

// FIX 1: fetch from real API instead of mock data
async function loadNotifications() {
  try {
    const response = await apiFetch("/notifications/all", { method: "GET" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    // Map backend shape → what renderNotifList() expects, sorted newest first
    state.notifications = [...data]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((n) => ({
        id: n.id,
        type: n.type?.includes("GOAL") ? "goal" : "transaction",
        title: formatNotificationType(n.type),
        message: n.message,
        time: formatRelativeTime(n.createdAt),
        read: n.read,
      }));
  } catch (err) {
    console.error("Failed to load notifications:", err);
    state.notifications = [];
  }

  renderNotifBadge();
}

async function loadCustomCategories() {
  try {
    const response = await apiFetch("/api/categories/custom");
    if (!response.ok) throw new Error("Failed to load categories");
    state.categories = await response.json();
    renderCustomCategories();
  } catch (err) {
    console.error(err);
  }
}

function renderCustomCategories() {
  const container = document.getElementById("custom-categories-list");
  if (!container) return;

  if (state.categories.length === 0) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = state.categories
    .map(
      (cat) => `
        <div class="category-item">
            <span>${cat.name}</span>
            <div class="category-item-actions">
                <button class="btn-cat-action" onclick="openEditCategoryModal(${cat.id}, '${cat.name.replace(/'/g, "\\'")}')" title="Edit">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button class="btn-cat-action delete" onclick="deleteCustomCategory(${cat.id})" title="Delete">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
            </div>
        </div>
    `,
    )
    .join("");
}

function addCustomCategory() {
  document.getElementById("edit-cat-id").value = "";
  document.getElementById("new-cat-name").value = "";
  document.querySelector("#category-modal .modal-title").textContent =
    "New Category";
  document.getElementById("save-cat-btn").textContent = "Create Category";

  document.getElementById("cat-modal-overlay").classList.add("open");
  document.getElementById("category-modal").classList.add("open");
  document.getElementById("new-cat-name").focus();
}

function openEditCategoryModal(id, name) {
  document.getElementById("edit-cat-id").value = id;
  document.getElementById("new-cat-name").value = name;
  document.querySelector("#category-modal .modal-title").textContent =
    "Edit Category";
  document.getElementById("save-cat-btn").textContent = "Save Changes";

  document.getElementById("cat-modal-overlay").classList.add("open");
  document.getElementById("category-modal").classList.add("open");
  document.getElementById("new-cat-name").focus();
}

function closeCategoryModal() {
  document.getElementById("cat-modal-overlay").classList.remove("open");
  document.getElementById("category-modal").classList.remove("open");
}

async function deleteCustomCategory(id) {
  if (!confirm("Are you sure you want to delete this category?")) return;

  try {
    const response = await apiFetch(`/api/categories/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete category");

    showToast("Category deleted");
    await loadCustomCategories();
  } catch (err) {
    showToast(err.message || "Error deleting category", "error");
  }
}

async function submitCustomCategory() {
  const name = document.getElementById("new-cat-name").value.trim();
  const id = document.getElementById("edit-cat-id").value;
  if (!name) return;

  try {
    const saveBtn = document.getElementById("save-cat-btn");
    saveBtn.disabled = true;

    const url = id ? `/api/categories/${id}` : "/api/categories";
    const method = id ? "PUT" : "POST";

    const response = await apiFetch(url, {
      method: method,
      body: JSON.stringify({ name: name }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Failed to save category");
    }

    showToast(id ? "Category updated!" : "Category added!");
    closeCategoryModal();
    await loadCustomCategories();
  } catch (err) {
    showToast(err.message || "Error adding category", "error");
  } finally {
    document.getElementById("save-cat-btn").disabled = false;
  }
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast show ${type === "error" ? "toast--error" : ""}`;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => (toast.className = "toast"), 3000);
}

function formatNotificationType(type) {
  switch (type) {
    case "BUDGET_ALERT":
      return "Budget Alert";
    case "GOAL_REACHED":
      return "Goal Reached 🎯";
    case "GOAL_REMINDER":
      return "Goal Reminder";
    default:
      return type ?? "Notification";
  }
}

function formatRelativeTime(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString();
}

function renderNotifBadge() {
  const unread = state.notifications.filter((n) => !n.read).length;
  const dot = document.getElementById("notif-dot");
  if (dot) dot.style.display = unread > 0 ? "block" : "none";
}

function toggleNotifPanel(event) {
  event.stopPropagation();
  const panel = document.getElementById("notif-panel");
  if (panel.classList.contains("open")) {
    closeNotifPanel();
  } else {
    openNotifPanel();
  }
}

function openNotifPanel() {
  renderNotifList();
  document.getElementById("notif-panel").classList.add("open");
}

function closeNotifPanel() {
  document.getElementById("notif-panel").classList.remove("open");
}

function renderNotifList() {
  const container = document.getElementById("notif-list");
  if (!container) return;

  if (state.notifications.length === 0) {
    container.innerHTML = `
      <div class="notif-empty-state">
        <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        <p>No notifications yet</p>
      </div>`;
    return;
  }

  container.innerHTML = state.notifications
    .map((n) => {
      const iconSvg =
        n.type === "goal"
          ? `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>`
          : `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`;

      const iconClass = n.type === "goal" ? "notif-icon-goal" : "notif-icon-tx";

      return `
      <div class="notif-item ${n.read ? "" : "unread"}" onclick="markNotifRead(${n.id})">
        <div class="notif-item-icon ${iconClass}">${iconSvg}</div>
        <div class="notif-item-body">
          <div class="notif-item-title">${n.title}</div>
          <div class="notif-item-msg">${n.message}</div>
          <div class="notif-item-time">${n.time}</div>
        </div>
        ${!n.read ? '<div class="notif-unread-dot"></div>' : ""}
      </div>`;
    })
    .join("");
}

// FIX 2: async, calls backend, skips already-read, reverts on failure
async function markNotifRead(id) {
  const notif = state.notifications.find((n) => n.id === id);
  if (!notif || notif.read) return;

  try {
    const response = await apiFetch(`/notifications/${id}/markRead`, {
      method: "PUT",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    notif.read = true;
  } catch (err) {
    console.error("Failed to mark notification as read:", err);
    return;
  }

  renderNotifList();
  renderNotifBadge();
}

// FIX 3: async, calls backend per notification, only updates state on success
async function markAllRead() {
  const unread = state.notifications.filter((n) => !n.read);
  if (!unread.length) return;

  const results = await Promise.all(
    unread.map((n) =>
      apiFetch(`/notifications/${n.id}/markRead`, { method: "PUT" })
        .then((r) => r.ok)
        .catch(() => false),
    ),
  );

  unread.forEach((n, i) => {
    if (results[i]) n.read = true;
  });

  renderNotifList();
  renderNotifBadge();
}

/* ═══════════════════════════════════════════
   AVATAR UPLOAD
═══════════════════════════════════════════ */
function previewAvatar(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const el = document.getElementById("avatar-main");
    el.textContent = "";
    el.style.backgroundImage = `url(${e.target.result})`;
    el.style.backgroundSize = "cover";
    el.style.backgroundPosition = "center";
  };
  reader.readAsDataURL(file);
}

/* ═══════════════════════════════════════════
   NOTIFICATION PREFERENCES
═══════════════════════════════════════════ */
async function onNotifGoalsChange(enabled) {
  state.prefs.notifGoals = enabled;

  try {
    const response = await apiFetch("/api/profile/notifications", {
      method: "PUT",
      body: JSON.stringify({
        budgetAlerts: state.prefs.notifTransactions,
        goalReminders: enabled,
      }),
    });
    if (!response.ok) throw new Error("Failed");
  } catch (err) {
    state.prefs.notifGoals = !enabled;
    document.getElementById("notif-goals-toggle").checked = !enabled;
    console.error("Goals notification update failed:", err);
  }
}

function toggleNotifGoals() {
  const checkbox = document.getElementById("notif-goals-toggle");
  checkbox.checked = !checkbox.checked;
  onNotifGoalsChange(checkbox.checked);
}

async function onNotifTransactionsChange(enabled) {
  state.prefs.notifTransactions = enabled;

  try {
    const response = await apiFetch("/api/profile/notifications", {
      method: "PUT",
      body: JSON.stringify({
        budgetAlerts: enabled,
        goalReminders: state.prefs.notifGoals,
      }),
    });
    if (!response.ok) throw new Error("Failed");
  } catch (err) {
    state.prefs.notifTransactions = !enabled;
    document.getElementById("notif-transactions-toggle").checked = !enabled;
    console.error("Transactions notification update failed:", err);
  }
}

function toggleNotifTransactions() {
  const checkbox = document.getElementById("notif-transactions-toggle");
  checkbox.checked = !checkbox.checked;
  onNotifTransactionsChange(checkbox.checked);
}

/* ═══════════════════════════════════════════
   CURRENCY DROPDOWN
═══════════════════════════════════════════ */
function toggleCurrencyDropdown(event) {
  event.stopPropagation();
  const dropdown = document.getElementById("currency-dropdown");
  dropdown.classList.contains("open")
    ? closeCurrencyDropdown()
    : openCurrencyDropdown();
}

function openCurrencyDropdown() {
  document.getElementById("currency-dropdown").classList.add("open");
  document.getElementById("currency-trigger").classList.add("open");
  document.getElementById("currency-chevron").classList.add("open");
}

function closeCurrencyDropdown() {
  document.getElementById("currency-dropdown").classList.remove("open");
  document.getElementById("currency-trigger").classList.remove("open");
  document.getElementById("currency-chevron").classList.remove("open");
}

function selectCurrency(optionEl) {
  const value = optionEl.dataset.value;

  document
    .querySelectorAll(".currency-option")
    .forEach((el) => el.classList.remove("active"));
  optionEl.classList.add("active");

  setCurrencyDisplay(value);
  state.prefs.currency = value;
  closeCurrencyDropdown();

  // TODO: persist to backend
  // await apiFetch('/api/profile/preferences', { method: 'PATCH', body: JSON.stringify({ currency: value }) });
}

function setCurrencyDisplay(value) {
  const meta = CURRENCIES[value] || { flag: "", name: value };
  document.getElementById("currency-label").textContent = value;
  document.getElementById("cur-flag").textContent = meta.flag;
}

/* ═══════════════════════════════════════════
   EDIT MODAL  –  name only
═══════════════════════════════════════════ */
function openEditModal() {
  document.getElementById("edit-name").value = state.user.name;
  document.getElementById("modal-overlay").classList.add("open");
  document.getElementById("edit-modal").classList.add("open");
  document.getElementById("edit-name").focus();
}

function closeEditModal() {
  document.getElementById("modal-overlay").classList.remove("open");
  document.getElementById("edit-modal").classList.remove("open");
}

async function saveProfile() {
  const name = document.getElementById("edit-name").value.trim();
  const input = document.getElementById("edit-name");

  if (!name) {
    input.classList.add("error");
    input.focus();
    return;
  }
  input.classList.remove("error");

  const saveBtn = document.querySelector(".btn-save");
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving…";
  }

  try {
    const response = await apiFetch("/api/profile", {
      method: "PUT",
      body: JSON.stringify({ name }),
    });

    if (!response.ok) throw new Error("Update failed");

    await response.json();

    state.user.name = name;
    state.user.initials = getInitials(name);
    renderAll();
    setGreeting();
    closeEditModal();
  } catch (err) {
    console.error("Profile update failed:", err);
    alert("Failed to save changes. Please try again.");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Changes";
    }
  }
}

document
  .getElementById("add-custom-category-btn")
  ?.addEventListener("click", addCustomCategory);

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function getInitials(fullName) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/* ═══════════════════════════════════════════
   LOGOUT
═══════════════════════════════════════════ */
async function handleLogout() {
  try {
    await apiFetch("/api/auth/logout", {
      method: "POST",
    });
  } catch (err) {
    console.error("Logout error:", err);
  } finally {
    window.location.href = "/login";
  }
}

init();
