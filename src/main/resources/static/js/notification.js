/* ═══════════════════════════════════════════════════
   BudgetWise - Notifications JavaScript
═══════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════
   API CONFIGURATION
═══════════════════════════════════════════════════ */

const API = {
    BASE_URL: "http://localhost:8080/notifications",
    PROFILE_URL: "http://localhost:8080/api/profile",

    ALL: "/all",
    UNREAD: "/unread",

    MARK_READ: (id) => `/${id}/markRead`,
    DELETE: (id) => `/${id}/delete`,

    DELETE_ALL: "/deleteAll",

    BY_TYPE: (type) => `/type?type=${type}`,
};


/* ═══════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════ */

const state = {
    notifications: [],
    activeFilter: "all",
};


/* ═══════════════════════════════════════════════════
   FETCH HELPER
═══════════════════════════════════════════════════ */

async function apiFetch(endpoint, options = {}) {

    try {

        const response = await fetch(
            `${API.BASE_URL}${endpoint}`,
            {
                credentials: "include",

                headers: {
                    "Content-Type": "application/json",
                },

                ...options,
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const contentType =
            response.headers.get("content-type");

        if (
            contentType &&
            contentType.includes("application/json")
        ) {
            return await response.json();
        }

        return true;

    } catch (error) {

        console.error("API ERROR:", error);

        showToast("Something went wrong");

        return null;
    }
}


/* ═══════════════════════════════════════════════════
   PROFILE  —  greeting + avatar
═══════════════════════════════════════════════════ */

async function loadProfile() {
    try {
        const response = await fetch(API.PROFILE_URL, {
            credentials: "include",
            headers: {"Content-Type": "application/json"},
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
    const initials = name.trim().split(/\s+/)
        .filter(Boolean).slice(0, 2)
        .map(w => w[0].toUpperCase()).join("");

    // Greeting
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
    const greetingEl = document.getElementById("greeting");
    if (greetingEl) {
        greetingEl.innerHTML = `Good ${timeOfDay}, ${escapeHtml(firstName)} <span>👋</span>`;
    }

    // Avatar — try the topnav avatar first, fall back to any .avatar element
    const avatarEl = document.getElementById("topnavAvatar")
        || document.querySelector(".avatar");
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


/* ═══════════════════════════════════════════════════
   MAIN RENDER
═══════════════════════════════════════════════════ */

function renderEverything() {

    renderList();

    renderStats();

    renderFilterCounts();

    updateTopNavBadge();

    renderDropdownList();
}


/* ═══════════════════════════════════════════════════
   FILTERING
═══════════════════════════════════════════════════ */

function getFilteredNotifications() {

    if (state.activeFilter === "all") {
        return state.notifications;
    }

    if (state.activeFilter === "unread") {

        return state.notifications.filter(
            n => !n.read
        );
    }

    return state.notifications.filter(
        n => n.type === state.activeFilter
    );
}


function setFilter(filter) {

    state.activeFilter = filter;

    document
        .querySelectorAll(".filter-btn")
        .forEach(btn => {

            btn.classList.toggle(
                "active",
                btn.dataset.filter === filter
            );
        });

    renderList();

    renderStats();
}


/* ═══════════════════════════════════════════════════
   RENDER LIST
═══════════════════════════════════════════════════ */

function renderList() {

    const list =
        document.getElementById("notifPageList");

    if (!list) return;

    const notifications =
        getFilteredNotifications();

    if (!notifications.length) {

        list.innerHTML = `
      <div class="notif-empty-page">
        <p>No notifications found.</p>
      </div>
    `;

        return;
    }

    list.innerHTML =
        notifications.map(notification => {

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

            ${!notification.read ? `
              <button
                class="notif-action-btn"
                onclick="markRead(${notification.id})"
                title="Mark as read"
              >
                ✓
              </button>
            ` : ""}

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

        }).join("");
}


/* ═══════════════════════════════════════════════════
   STATS
═══════════════════════════════════════════════════ */

function renderStats() {

    const visibleNotifications =
        getFilteredNotifications();

    const total =
        visibleNotifications.length;

    const unread =
        visibleNotifications.filter(
            n => !n.read
        ).length;

    const alerts =
        visibleNotifications.filter(
            n => n.type === "BUDGET_ALERT"
        ).length;

    const goals =
        visibleNotifications.filter(
            n =>
                n.type === "GOAL_REACHED" ||
                n.type === "GOAL_REMINDER"
        ).length;

    setText("statTotal", total);

    setText("statUnread", unread);

    setText("statAlerts", alerts);

    setText("statGoals", goals);
}


function renderFilterCounts() {

    setText(
        "countAll",
        state.notifications.length
    );

    setText(
        "countUnread",
        state.notifications.filter(
            n => !n.read
        ).length
    );
}


/* ═══════════════════════════════════════════════════
   TOP NAV BADGE
═══════════════════════════════════════════════════ */

function updateTopNavBadge() {

    const badge =
        document.getElementById("notifBadge");

    if (!badge) return;

    const unread =
        state.notifications.filter(
            n => !n.read
        ).length;

    badge.textContent =
        unread > 0 ? unread : "";

    badge.classList.toggle(
        "has-unread",
        unread > 0
    );
}


/* ═══════════════════════════════════════════════════
   DROPDOWN
═══════════════════════════════════════════════════ */

function renderDropdownList() {

    const list =
        document.getElementById("notifDropdownList");

    if (!list) return;

    const recent =
        state.notifications.slice(0, 5);

    if (!recent.length) {

        list.innerHTML = `
      <div class="notif-empty">
        No notifications
      </div>
    `;

        return;
    }

    list.innerHTML =
        recent.map(notification => `

      <div
        class="notif-item ${!notification.read ? "unread" : ""}"
        onclick="markRead(${notification.id})"
      >

        <div class="notif-item-body">

          <div class="notif-item-title">
            ${formatNotificationType(notification.type)}
          </div>

          <div class="notif-item-msg">
            ${escapeHtml(notification.message)}
          </div>

          <div class="notif-item-time">
            ${formatTime(notification.createdAt)}
          </div>

        </div>

      </div>

    `).join("");
}


/* ═══════════════════════════════════════════════════
   ACTIONS
═══════════════════════════════════════════════════ */

async function markRead(id) {

    const result =
        await apiFetch(
            API.MARK_READ(id),
            {
                method: "PUT",
            }
        );

    if (!result) return;

    const notification =
        state.notifications.find(
            n => n.id === id
        );

    if (notification) {
        notification.read = true;
    }

    renderEverything();

    showToast("Notification marked as read");
}


async function markAllRead() {

    const unreadNotifications =
        state.notifications.filter(
            n => !n.read
        );

    if (!unreadNotifications.length) {

        showToast("No unread notifications");

        return;
    }

    await Promise.all(
        unreadNotifications.map(notification =>

            apiFetch(
                API.MARK_READ(notification.id),
                {
                    method: "PUT",
                }
            )
        )
    );

    unreadNotifications.forEach(n => {
        n.read = true;
    });

    renderEverything();

    showToast("All notifications marked as read");
}


async function deleteNotification(id) {

    const result =
        await apiFetch(
            API.DELETE(id),
            {
                method: "DELETE",
            }
        );

    if (!result) return;

    state.notifications =
        state.notifications.filter(
            n => n.id !== id
        );

    renderEverything();

    showToast("Notification deleted");
}


async function deleteAllNotifications() {

    btnStartLoading('confirmDelBtn');

    const result =
        await apiFetch(
            API.DELETE_ALL,
            {
                method: "DELETE",
            }
        );

    btnStopLoading('confirmDelBtn');

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

    document
        .getElementById("confirmModal")
        ?.classList.add("is-open");
}


function closeConfirmModal() {

    document
        .getElementById("confirmModal")
        ?.classList.remove("is-open");
}


/* ═══════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════ */

let toastTimeout;

function showToast(message) {

    const toast =
        document.getElementById("toast");

    if (!toast) return;

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 2500);
}


/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */

function setText(id, value) {

    const element =
        document.getElementById(id);

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

        case "BUDGET_ALERT":
            return "Budget Alert";

        case "GOAL_REACHED":
            return "Goal Reached";

        case "GOAL_REMINDER":
            return "Goal Reminder";

        default:
            return type;
    }
}


/* ═══════════════════════════════════════════════════
   DROPDOWN
═══════════════════════════════════════════════════ */

function toggleNotifDropdown() {

    document
        .getElementById("notifDropdown")
        ?.classList.toggle("is-open");
}


/* ═══════════════════════════════════════════════════
   ERROR STATE
═══════════════════════════════════════════════════ */

function renderErrorState() {

    const list =
        document.getElementById("notifPageList");

    if (!list) return;

    list.innerHTML = `
    <div class="notif-empty-page">
      <p>Failed to load notifications.</p>
    </div>
  `;
}


/* ═══════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════ */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        loaderInit([
            {pct: 30, label: "Loading your profile…"},
            {pct: 70, label: "Loading notifications…"},
            {pct: 100, label: "Almost ready…"},
        ]);

        // Skeleton placeholders while data loads
        const greetingEl = document.getElementById("greeting");
        if (greetingEl) greetingEl.innerHTML = '<span class="skeleton-greeting"></span>';

        const avatarEl = document.getElementById("topnavAvatar")
            || document.querySelector(".avatar");
        if (avatarEl) avatarEl.classList.add("skeleton-light");

        showNotifSkeletons(3);

        loaderAdvance(); // → profile

        await loadProfile();

        loaderAdvance(); // → notifications

        await loadNotifications();

        loaderAdvance(); // → 100%
        loaderHide();

        document.addEventListener(
            "click",
            (e) => {

                const wrapper =
                    document.getElementById(
                        "notifWrapper"
                    );

                if (
                    wrapper &&
                    !wrapper.contains(e.target)
                ) {

                    document
                        .getElementById(
                            "notifDropdown"
                        )
                        ?.classList.remove("is-open");
                }
            }
        );
    }
);