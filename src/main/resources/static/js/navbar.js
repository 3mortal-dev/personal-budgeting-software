"use strict";

/* ══════════════════════════════════════════════════════
   BudgetWise – Shared Navbar Component
   ══════════════════════════════════════════════════════
   HOW TO USE ON ANY PAGE:
   1. <link> to navbar.css in <head>
   2. <div id="sidebar-root"></div>  — before <main> in <body>
   3. <div id="topbar-root"></div>   — first child inside <main>
   4. <script src="/js/navbar.js"></script> before page scripts
   ══════════════════════════════════════════════════════ */

(function () {
  /* ─────────────────────────────────────────────────────
       1. NAV LINKS  — edit here to update all pages at once
    ───────────────────────────────────────────────────── */
  const NAV_LINKS = [
    { href: "/dashboard", icon: "fa-house", label: "Home" },
    { href: "/transactions", icon: "fa-receipt", label: "Transactions" },
    { href: "/budget", icon: "fa-chart-pie", label: "Budgets" },
    { href: "/goals", icon: "fa-bullseye", label: "Goals" },
    { href: "/reports", icon: "fa-chart-bar", label: "Reports" },
    { href: "/notifications", icon: "fa-bell", label: "Notifications" },
    { href: "/userProfile", icon: "fa-user", label: "Profile" },
  ];

  const NOTIF_API = {
    ALL: "/notifications/all",
    MARK_READ: (id) => `/notifications/${id}/markRead`,
  };

  /* ─────────────────────────────────────────────────────
       2. ACTIVE LINK DETECTION
    ───────────────────────────────────────────────────── */
  function isActive(href) {
    return window.location.pathname.startsWith(href);
  }

  /* ─────────────────────────────────────────────────────
       3. BUILD SIDEBAR HTML
    ───────────────────────────────────────────────────── */
  function buildSidebar() {
    const links = NAV_LINKS.map(({ href, icon, label }) => {
      const active = isActive(href) ? " sidebar__link--active" : "";
      return `
        <a class="sidebar__link${active}" href="${href}">
          <i class="fa-solid ${icon}"></i><span>${label}</span>
        </a>`;
    }).join("");

    return `
      <div class="sidebar-backdrop" id="sidebarBackdrop"></div>
      <aside class="sidebar" id="sidebar">
        <a class="sidebar__logo" href="/dashboard">
          <div class="sidebar__logo-icon"><i class="fa-solid fa-wallet"></i></div>
          <span class="sidebar__logo-text">BudgetWise</span>
        </a>
        <nav class="sidebar__nav">
          ${links}
        </nav>
        <form class="sidebar__logout-form" action="/login" method="get">
          <button type="submit" class="sidebar__logout">
            <i class="fa-solid fa-arrow-right-from-bracket"></i><span>Logout</span>
          </button>
        </form>
      </aside>`;
  }

  /* ─────────────────────────────────────────────────────
       4. BUILD TOPBAR HTML
    ───────────────────────────────────────────────────── */
  function buildTopbar() {
    return `
      <header class="topbar">
        <div class="topbar__left">
          <button class="topbar__hamburger" id="hamburgerBtn" aria-label="Open menu">
            <span></span><span></span><span></span>
          </button>
          <div class="topbar__greeting">
            Good <span id="topbarTimeOfDay">day</span>,
            <span id="topbarUsername" class="topbar__name">User</span> 👋
          </div>
        </div>

        <div class="topbar__actions">
          <div class="topbar__search">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" placeholder="Search…" id="searchInput"/>
          </div>

          <div class="notif-wrap" id="notifWrap">
            <button id="bellBtn" class="topbar__notif" aria-label="Notifications">
              <i class="fa-regular fa-bell"></i>
              <span id="notifBadge" class="topbar__notif-badge" style="display:none">0</span>
            </button>
            <div id="notifDropdown" class="notif-dropdown">
              <div class="notif-header">
                <span class="notif-title">Notifications</span>
                <button id="markAllReadBtn" class="notif-mark-all">Mark all read</button>
              </div>
              <div class="notif-tabs">
                <button class="notif-tab active" data-tab="all">All</button>
                <button class="notif-tab" data-tab="unread">Unread</button>
                <button class="notif-tab" data-tab="goals">Goals</button>
                <button class="notif-tab" data-tab="budget">Budget</button>
              </div>
              <div id="notifList" class="notif-list">
                <div class="notif-empty">
                  <i class="fa-regular fa-bell-slash"></i>
                  <p>Loading…</p>
                </div>
              </div>
              <div class="notif-footer">
                <a class="notif-view-all" href="/notifications">View all notifications</a>
              </div>
            </div>
          </div>

          <div class="topbar__avatar" id="topbarAvatar">U</div>
        </div>
      </header>`;
  }

  /* ─────────────────────────────────────────────────────
       5. NOTIFICATION HELPERS
    ───────────────────────────────────────────────────── */
  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatTime(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return "";
    const diff = Math.floor((Date.now() - d) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  function typeIcon(type) {
    switch (type) {
      case "GOAL_REACHED":
        return { cls: "notif-icon--goal", icon: "fa-bullseye" };
      case "GOAL_REMINDER":
        return { cls: "notif-icon--goal", icon: "fa-flag" };
      case "BUDGET_ALERT":
        return { cls: "notif-icon--budget", icon: "fa-chart-pie" };
      default:
        return { cls: "notif-icon--info", icon: "fa-circle-info" };
    }
  }

  function typeLabel(type) {
    switch (type) {
      case "BUDGET_ALERT":
        return "Budget Alert";
      case "GOAL_REACHED":
        return "Goal Reached";
      case "GOAL_REMINDER":
        return "Goal Reminder";
      default:
        return type || "Info";
    }
  }

  /* ─────────────────────────────────────────────────────
       6. NOTIFICATION STATE + RENDER
    ───────────────────────────────────────────────────── */
  const notifState = { all: [], filter: "all" };

  function filteredNotifs() {
    const { all, filter } = notifState;
    if (filter === "unread") return all.filter((n) => !n.read);
    if (filter === "goals")
      return all.filter((n) => n.type?.startsWith("GOAL"));
    if (filter === "budget")
      return all.filter((n) => n.type === "BUDGET_ALERT");
    return all;
  }

  function renderNotifBadge() {
    const badge = document.getElementById("notifBadge");
    if (!badge) return;
    const count = notifState.all.filter((n) => !n.read).length;
    if (count > 0) {
      badge.textContent = count > 99 ? "99+" : count;
      badge.style.display = "";
    } else {
      badge.style.display = "none";
    }
  }

  function renderNotifList() {
    const list = document.getElementById("notifList");
    if (!list) return;

    renderNotifBadge();

    const items = filteredNotifs().slice(0, 10);

    if (!items.length) {
      list.innerHTML = `
        <div class="notif-empty">
          <i class="fa-regular fa-bell-slash"></i>
          <p>No notifications here</p>
        </div>`;
      return;
    }

    list.innerHTML = items
      .map((n) => {
        const { cls, icon } = typeIcon(n.type);
        return `
        <div class="notif-item ${n.read ? "" : "notif-item--unread"}" data-id="${n.id}">
          <div class="notif-icon ${cls}"><i class="fa-solid ${icon}"></i></div>
          <div class="notif-body">
            <p class="notif-msg">
              <strong>${escapeHtml(typeLabel(n.type))}</strong> — ${escapeHtml(n.message)}
            </p>
            <p class="notif-time">${formatTime(n.createdAt)}</p>
          </div>
          ${!n.read ? '<div class="notif-dot"></div>' : ""}
        </div>`;
      })
      .join("");

    list.querySelectorAll(".notif-item[data-id]").forEach((el) => {
      el.addEventListener("click", () => markOneRead(Number(el.dataset.id)));
    });
  }

  async function fetchNotifications() {
    try {
      const res = await fetch(NOTIF_API.ALL, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return;
      notifState.all = await res.json();
      renderNotifList();
    } catch {
      /* badge stays hidden */
    }
  }

  async function markOneRead(id) {
    try {
      await fetch(NOTIF_API.MARK_READ(id), {
        method: "PUT",
        credentials: "include",
      });
      const n = notifState.all.find((x) => x.id === id);
      if (n) n.read = true;
      renderNotifList();
    } catch {}
  }

  async function markAllRead() {
    const unread = notifState.all.filter((n) => !n.read);
    await Promise.all(
      unread.map((n) =>
        fetch(NOTIF_API.MARK_READ(n.id), {
          method: "PUT",
          credentials: "include",
        }),
      ),
    );
    unread.forEach((n) => {
      n.read = true;
    });
    renderNotifList();
  }

  /* ─────────────────────────────────────────────────────
       7. TIME-OF-DAY GREETING
    ───────────────────────────────────────────────────── */
  function applyTimeOfDay() {
    const h = new Date().getHours();
    const el = document.getElementById("topbarTimeOfDay");
    if (el)
      el.textContent = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  }

  /* ─────────────────────────────────────────────────────
       8. FETCH USERNAME & INITIALS
    ───────────────────────────────────────────────────── */
  async function applyUsername() {
    try {
      const res = await fetch("/api/profile", {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return;
      const data = await res.json();
      const name = data.name || data.username || "";
      const usernameEl = document.getElementById("topbarUsername");
      const avatarEl = document.getElementById("topbarAvatar");
      if (usernameEl) usernameEl.textContent = name;
      if (avatarEl) {
        const parts = name.trim().split(/\s+/).filter(Boolean);
        avatarEl.textContent =
          parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : name.slice(0, 2).toUpperCase() || "U";
      }
    } catch {}
  }

  /* ─────────────────────────────────────────────────────
       9. HAMBURGER — mobile sidebar toggle
    ───────────────────────────────────────────────────── */
  function setupHamburger() {
    const btn = document.getElementById("hamburgerBtn");
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    if (!btn || !sidebar || !backdrop) return;

    function openSidebar() {
      sidebar.classList.add("sidebar--open");
      backdrop.classList.add("sidebar-backdrop--visible");
      btn.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }

    function closeSidebar() {
      sidebar.classList.remove("sidebar--open");
      backdrop.classList.remove("sidebar-backdrop--visible");
      btn.classList.remove("is-open");
      document.body.style.overflow = "";
    }

    btn.addEventListener("click", () =>
      sidebar.classList.contains("sidebar--open")
        ? closeSidebar()
        : openSidebar(),
    );
    backdrop.addEventListener("click", closeSidebar);

    // Auto-close when a link is tapped on mobile
    sidebar.querySelectorAll(".sidebar__link").forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth < 768) closeSidebar();
      });
    });
  }

  /* ─────────────────────────────────────────────────────
       10. NOTIFICATION DROPDOWN EVENTS
    ───────────────────────────────────────────────────── */
  function setupNotifDropdown() {
    const bell = document.getElementById("bellBtn");
    const dropdown = document.getElementById("notifDropdown");
    const wrap = document.getElementById("notifWrap");
    const markAll = document.getElementById("markAllReadBtn");
    if (!bell || !dropdown) return;

    bell.addEventListener("click", (e) => {
      e.stopPropagation();
      const opening = !dropdown.classList.contains("is-open");
      dropdown.classList.toggle("is-open", opening);
      if (opening) fetchNotifications();
    });

    dropdown.querySelectorAll(".notif-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        dropdown
          .querySelectorAll(".notif-tab")
          .forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        notifState.filter = tab.dataset.tab;
        renderNotifList();
      });
    });

    if (markAll) markAll.addEventListener("click", markAllRead);

    document.addEventListener("click", (e) => {
      if (wrap && !wrap.contains(e.target)) {
        dropdown.classList.remove("is-open");
      }
    });
  }

  /* ─────────────────────────────────────────────────────
       11. INJECT & INIT
    ───────────────────────────────────────────────────── */
  function inject() {
    const sidebarRoot = document.getElementById("sidebar-root");
    const topbarRoot = document.getElementById("topbar-root");

    if (!sidebarRoot) {
      console.warn('[navbar.js] Missing <div id="sidebar-root"></div>');
      return;
    }
    if (!topbarRoot) {
      console.warn(
        '[navbar.js] Missing <div id="topbar-root"></div> inside <main>',
      );
      return;
    }

    sidebarRoot.innerHTML = buildSidebar();
    topbarRoot.innerHTML = buildTopbar();

    applyTimeOfDay();
    applyUsername();
    fetchNotifications(); // load badge count immediately
    setupHamburger();
    setupNotifDropdown();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
})();
