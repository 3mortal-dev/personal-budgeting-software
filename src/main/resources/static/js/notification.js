// API CONFIGURATION

const API = {
  BASE_URL: "/api/notifications",
  PROFILE_URL: "/api/profile",

  ALL: "/all",
  UNREAD: "/unread",

  MARK_READ: (id) => `/${id}/markRead`,
  DELETE: (id) => `/${id}/delete`,

  DELETE_ALL: "/deleteAll",

  BY_TYPE: (type) => `/type?type=${type}`,
};

// State

const state = {
  notifications: [],
  activeFilter: "all",
  searchQuery: "",
};

// Fetch Helper

async function apiFetch(endpoint, options = {}) {
  try {
    const response = await fetch(`${API.BASE_URL}${endpoint}`, {
      credentials: "include",

      headers: {
        "Content-Type": "application/json",
      },

      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return true;
  } catch (error) {
    console.error("API ERROR:", error);

    showToast("Something went wrong");

    return null;
  }
}

// profile

async function loadProfile() {
  try {
    const response = await fetch(API.PROFILE_URL, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    renderProfile(data);
  } catch (err) {
    console.error("Failed to load profile:", err);
    // Leave the greeting as-is rather than crashing the page
  }
}

function renderProfile(data) {
  const name = data?.name || data?.username || "there";
  const firstName = name.trim().split(/\s+/)[0];
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  // Greeting
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const greetingEl = document.getElementById("greeting");
  if (greetingEl) {
    greetingEl.innerHTML = `Good ${timeOfDay}, ${escapeHtml(firstName)} <span>👋</span>`;
  }

  // Avatar — try the topnav avatar first, fall back to any .avatar element
  const avatarEl =
    document.getElementById("topnavAvatar") ||
    document.querySelector(".avatar");
  if (avatarEl) {
    avatarEl.textContent = initials || "?";
    avatarEl.classList.remove("skeleton-light");
  }
}

async function loadNotifications() {
  const data = await apiFetch(API.ALL);

  if (!data) {
    renderErrorState();
    return;
  }

  state.notifications = data;

  renderEverything();
}

// Main Render

function renderEverything() {
  renderList();

  renderStats();
}

// Filtering

function getFilteredNotifications() {
  let filtered = state.notifications;

  if (state.activeFilter === "unread") {
    filtered = filtered.filter((n) => !n.read);
  } else if (state.activeFilter === "budget") {
    filtered = filtered.filter(
      (n) => n.type === "BUDGET_NEAR_LIMIT" || n.type === "BUDGET_EXCEEDED",
    );
  } else if (state.activeFilter === "goals") {
    filtered = filtered.filter((n) => n.type === "GOAL_REMINDER");
  } else if (state.activeFilter !== "all") {
    filtered = filtered.filter((n) => n.type === state.activeFilter);
  }

  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter((n) => {
      return (n.message || "").toLowerCase().includes(q)
        || (n.type || "").toLowerCase().includes(q);
    });
  }

  return filtered;
}

function setFilter(filter) {
  state.activeFilter = filter;

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });

  renderList();

  renderStats();
}

// RENDER LIST

function renderList() {
  const list = document.getElementById("notifPageList");

  if (!list) return;

  const notifications = getFilteredNotifications();

  if (!notifications.length) {
    list.innerHTML = `
      <div class="notif-empty-page">
        <p>No notifications found.</p>
      </div>
    `;

    return;
  }

  list.innerHTML = notifications
    .map((notification) => {
      return `
        <div class="notif-page-item ${!notification.read ? "unread" : ""}">

          <div class="notif-page-body">

            <div class="notif-page-type">
              ${formatNotificationType(notification.type)}
            </div>

            <div class="notif-page-msg">
              ${escapeHtml(notification.message)}
            </div>

            <div class="notif-page-time">
              ${formatTime(notification.createdAt)}
            </div>

          </div>

          <div class="notif-page-actions-row">

            ${
              !notification.read
                ? `
              <button
                class="notif-action-btn"
                onclick="markRead(${notification.id})"
                title="Mark as read"
              >
                ✓
              </button>
            `
                : ""
            }

            <button
              class="notif-action-btn delete-btn"
              onclick="deleteNotification(${notification.id})"
              title="Delete"
            >
              ✕
            </button>

          </div>

        </div>
      `;
    })
    .join("");
}

/* ═══════════════════════════════════════════════════
   STATS
═══════════════════════════════════════════════════ */

function renderStats() {
  const visibleNotifications = getFilteredNotifications();

  const total = visibleNotifications.length;

  const unread = visibleNotifications.filter((n) => !n.read).length;

  const alerts = visibleNotifications.filter(
    (n) => n.type === "BUDGET_NEAR_LIMIT" || n.type === "BUDGET_EXCEEDED",
  ).length;

  const goals = visibleNotifications.filter(
    (n) => n.type === "GOAL_REMINDER",
  ).length;

  setText("statTotal", total);

  setText("statUnread", unread);

  setText("statAlerts", alerts);

  setText("statGoals", goals);
}

// Actions

async function markRead(id) {
  const result = await apiFetch(API.MARK_READ(id), {
    method: "PUT",
  });

  if (!result) return;

  const notification = state.notifications.find((n) => n.id === id);

  if (notification) {
    notification.read = true;
  }

  renderEverything();

  showToast("Notification marked as read");
}

async function markAllRead() {
  const unreadNotifications = state.notifications.filter((n) => !n.read);

  if (!unreadNotifications.length) {
    showToast("No unread notifications");

    return;
  }

  await Promise.all(
    unreadNotifications.map((notification) =>
      apiFetch(API.MARK_READ(notification.id), {
        method: "PUT",
      }),
    ),
  );

  unreadNotifications.forEach((n) => {
    n.read = true;
  });

  renderEverything();

  showToast("All notifications marked as read");
}

async function deleteNotification(id) {
  const result = await apiFetch(API.DELETE(id), {
    method: "DELETE",
  });

  if (!result) return;

  state.notifications = state.notifications.filter((n) => n.id !== id);

  renderEverything();

  showToast("Notification deleted");
}

async function deleteAllNotifications() {
  btnStartLoading("confirmDelBtn");

  const result = await apiFetch(API.DELETE_ALL, {
    method: "DELETE",
  });

  btnStopLoading("confirmDelBtn");

  if (!result) return;

  state.notifications = [];

  renderEverything();

  closeConfirmModal();

  showToast("All notifications deleted");
}

/* ═══════════════════════════════════════════════════
   MODAL
═══════════════════════════════════════════════════ */

function confirmDeleteAll() {
  document.getElementById("confirmModal")?.classList.add("is-open");
}

function closeConfirmModal() {
  document.getElementById("confirmModal")?.classList.remove("is-open");
}

/* ═══════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════ */

let toastTimeout;

function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) return;

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(toastTimeout);

  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function escapeHtml(str) {
  if (!str) return "";

  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatTime(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  return date.toLocaleString();
}

function formatNotificationType(type) {
  switch (type) {
    case "BUDGET_NEAR_LIMIT":
      return "Budget Near Limit";

    case "BUDGET_EXCEEDED":
      return "Budget Exceeded";

    case "GOAL_REMINDER":
      return "Goal Reminder";

    default:
      return type;
  }
}

// Error state

function renderErrorState() {
  const list = document.getElementById("notifPageList");

  if (!list) return;

  list.innerHTML = `
    <div class="notif-empty-page">
      <p>Failed to load notifications.</p>
    </div>
  `;
}

// Init

document.addEventListener("DOMContentLoaded", async () => {
  loaderInit([
    { pct: 30, label: "Loading your profile…" },
    { pct: 70, label: "Loading notifications…" },
    { pct: 100, label: "Almost ready…" },
  ]);

  // Skeleton placeholders while data loads
  const greetingEl = document.getElementById("greeting");
  if (greetingEl)
    greetingEl.innerHTML = '<span class="skeleton-greeting"></span>';

  const avatarEl =
    document.getElementById("topnavAvatar") ||
    document.querySelector(".avatar");
  if (avatarEl) avatarEl.classList.add("skeleton-light");

  showNotifSkeletons(3);

  loaderAdvance(); // → profile

  await loadProfile();

  loaderAdvance(); // → notifications

  await loadNotifications();

  loaderAdvance(); // → 100%
  loaderHide();

  // Navbar search
  document.addEventListener("app-search", (e) => {
    state.searchQuery = e.detail.query;
    renderEverything();
  });
});
