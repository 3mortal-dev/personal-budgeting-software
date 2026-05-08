(() => {
  "use strict";

  const API = {
    ALL: "/notifications/all",
    UNREAD: "/notifications/unread",
    MARK_READ: (id) => `/notifications/${id}/markRead`,
  };

  const state = {
    notifications: [],
    unreadCount: 0,
    initialized: false,
  };

  function qs(selector) {
    return document.querySelector(selector);
  }

  function getButton() {
    return qs("#notifBtn") || qs("#bellBtn") || qs("#notif-icon-btn");
  }

  function getDropdown() {
    return qs("#notifDropdown") || qs("#notif-panel");
  }

  function getList() {
    return qs("#notifList") || qs("#notifDropdownList") || qs("#notif-list");
  }

  function getWrapper() {
    return qs("#notifWrapper") || qs(".notif-wrapper") || qs(".notif-wrap");
  }

  function getBadge() {
    return qs("#notifBadge") || qs("#notif-dot");
  }

  async function apiFetch(url, options = {}) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (response.status === 204) return null;
      return await response.json();
    } catch (_err) {
      return null;
    }
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString();
  }

  function escapeHtml(str) {
    if (typeof str !== "string") return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeNotification(item) {
    return {
      id: item?.id,
      type: (item?.type || "INFO").toString(),
      message: item?.message || "",
      read: Boolean(item?.read),
      createdAt: item?.createdAt || "",
    };
  }

  function renderBadge() {
    const badge = getBadge();
    if (!badge) return;

    const unread = state.unreadCount;
    if (badge.id === "notif-dot") {
      badge.style.display = unread > 0 ? "inline-block" : "none";
      return;
    }

    if (unread > 0) {
      badge.textContent = unread > 99 ? "99+" : String(unread);
      badge.style.display = "";
      badge.classList.add("has-unread");
    } else {
      badge.textContent = "";
      badge.style.display = "none";
      badge.classList.remove("has-unread");
    }
  }

  function renderList() {
    const list = getList();
    if (!list) return;

    if (!state.notifications.length) {
      list.innerHTML = `<div class="notif-empty">No notifications yet</div>`;
      return;
    }

    list.innerHTML = state.notifications.map((n) => `
      <div class="notif-item ${n.read ? "" : "unread"}" data-id="${n.id}">
        <div class="notif-item-body">
          <div class="notif-item-title">${escapeHtml(n.type)}</div>
          <div class="notif-item-msg">${escapeHtml(n.message)}</div>
          <div class="notif-item-time">${escapeHtml(formatDate(n.createdAt))}</div>
        </div>
        ${n.read ? "" : `<div class="notif-unread-dot"></div>`}
      </div>
    `).join("");
  }

  function openDropdown() {
    const dropdown = getDropdown();
    if (!dropdown) return;
    dropdown.classList.add("is-open");
    dropdown.classList.add("open");
    dropdown.style.display = "";
  }

  function closeDropdown() {
    const dropdown = getDropdown();
    if (!dropdown) return;
    dropdown.classList.remove("is-open");
    dropdown.classList.remove("open");
    if (dropdown.id === "notif-panel") dropdown.style.display = "none";
  }

  async function markRead(id) {
    await apiFetch(API.MARK_READ(id), { method: "PUT" });
    const target = state.notifications.find((n) => n.id === id);
    if (target) target.read = true;
    state.unreadCount = state.notifications.filter((n) => !n.read).length;
    renderBadge();
    renderList();
  }

  async function markAllRead() {
    const unreadIds = state.notifications.filter((n) => !n.read).map((n) => n.id);
    await Promise.all(unreadIds.map((id) => markRead(id)));
  }

  async function reloadNotifications() {
    const [all, unread] = await Promise.all([
      apiFetch(API.ALL),
      apiFetch(API.UNREAD),
    ]);

    state.notifications = Array.isArray(all) ? all.map(normalizeNotification) : [];
    state.unreadCount = Array.isArray(unread)
      ? unread.length
      : state.notifications.filter((n) => !n.read).length;

    renderBadge();
    renderList();
  }

  function setupEvents() {
    const button = getButton();
    const list = getList();
    const wrapper = getWrapper();

    if (button && !button.hasAttribute("onclick")) {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const dropdown = getDropdown();
        if (!dropdown) return;
        if (dropdown.classList.contains("is-open")) closeDropdown();
        else openDropdown();
      });
    }

    if (list) {
      list.addEventListener("click", (event) => {
        const item = event.target.closest(".notif-item");
        if (!item) return;
        const id = Number(item.getAttribute("data-id"));
        if (!Number.isFinite(id)) return;
        void markRead(id);
      });
    }

    document.addEventListener("click", (event) => {
      if (!wrapper) return;
      if (!wrapper.contains(event.target)) closeDropdown();
    });
  }

  async function initNavbarNotifications() {
    if (state.initialized) return;
    if (!getButton() || !getDropdown() || !getList()) return;
    state.initialized = true;

    setupEvents();
    await reloadNotifications();
  }

  window.toggleNotifications = () => {
    const dropdown = getDropdown();
    if (!dropdown) return;
    if (dropdown.classList.contains("is-open")) closeDropdown();
    else openDropdown();
  };
  window.toggleNotifDropdown = window.toggleNotifications;
  window.toggleNotifPanel = (event) => {
    if (event?.preventDefault) event.preventDefault();
    window.toggleNotifications();
  };
  window.markAllRead = markAllRead;
  window.markRead = markRead;
  window.reloadNavbarNotifications = reloadNotifications;

  document.addEventListener("DOMContentLoaded", () => {
    void initNavbarNotifications();
  });
})();
