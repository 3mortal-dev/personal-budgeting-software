const API = {
  PROFILE: "/api/profile",
  ALL: "/api/budgets",
  ACTIVE: "/api/budgets/active",
  NEAR_LIMIT: "/api/budgets/near-limit",
  OVER_LIMIT: "/api/budgets/Exeeded-limit",
  EXPIRED: "/api/budgets/expired",
  BY_ID: (id) => `/api/budgets/${id}`,
  CATEGORIES: "/api/categories", // GET → [{ id, name }, ...]
  NOTIFICATIONS_UNREAD: "/api/notifications/unread",
};

// ── Shared fetch helper (mirrors dashboard.js pattern) ────────────────────────
let lastApiError = "";

async function apiFetch(endpoint, options = {}) {
  lastApiError = "";
  const { headers = {}, ...fetchOptions } = options;
  try {
    const response = await fetch(endpoint, {
      headers: { "Content-Type": "application/json", ...headers },
      credentials: "include",
      ...fetchOptions,
    });
    if (response.status === 204) return null;
    if (!response.ok) {
      const msg = await response.text().catch(() => "");
      lastApiError = msg || `HTTP ${response.status}`;
      throw new Error(lastApiError);
    }
    return await response.json();
  } catch (err) {
    console.error(
      `[API ERROR] ${options.method || "GET"} ${endpoint}:`,
      err.message,
    );
    return null;
  }
}

const state = {
  budgets: [], // Budget[] from server
  categories: [], // Category[] from server — { id, name }
  profile: null,
  activeFilter: "all",
  pendingDelete: null, // id of budget pending confirmation
};

/**
 * GET /api/budgets
 * Returns Budget[] – each has:
 *   id, userId, categoryId, spendingLimit,
 *   spentAmount, threshold, startDate, endDate, status (BudgetStatus)
 */
async function loadBudgets() {
  renderSkeletons();

  const data = await apiFetch(API.ALL);
  if (data) {
    state.budgets = data;
    renderAll();
  } else {
    showError("Failed to load budgets. Please refresh the page.");
    renderGrid([]); // clear skeletons
  }
}

async function loadProfile() {
  const data = await apiFetch(API.PROFILE, {
    headers: { Accept: "application/json" },
  });
  if (!data) return;

  state.profile = data;
  renderProfile(data);
}

/**
 * GET /api/categories
 * Returns Category[] — { id, name }
 * Populates the category <select> in the modal.
 */
async function loadCategories() {
  const data = await apiFetch(API.CATEGORIES);
  if (!data) return;

  state.categories = data;
  const select = document.getElementById("budgetCategorySelect");
  if (!select) return;

  // Keep the placeholder option, then add one <option> per category
  select.innerHTML =
    `<option value="" disabled selected>Select a category…</option>` +
    data
      .map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`)
      .join("");
}

/** Derive a BudgetStatus string from the entity if the server doesn't include it */
function deriveStatus(b) {
  if (isExpired(b.endDate)) return "EXPIRED";

  const status = String(b.status || "").toUpperCase();
  if (status === "ON_TRACK") return "ACTIVE";
  if (status === "EXCEEDED_LIMIT") return "EXCEEDED";
  if (status === "NEAR_LIMIT") return "NEAR_LIMIT";

  const pct = b.spendingLimit > 0 ? (b.spentAmount / b.spendingLimit) * 100 : 0;
  if (pct >= 100) return "EXCEEDED";
  if (pct >= (b.threshold ?? 80)) return "NEAR_LIMIT";
  return "ACTIVE";
}

function isExpired(dateValue) {
  if (!dateValue) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(dateValue);
  end.setHours(0, 0, 0, 0);
  return end < today;
}

/** Category icon and colour keyed by category name (case-insensitive prefix match) */
function categoryMeta(name = "") {
  const n = name.toLowerCase();
  if (n.includes("food") || n.includes("dining") || n.includes("restaurant"))
    return {
      color: "#10b981",
      bg: "#ecfdf5",
      icon: `<svg viewBox="0 0 24 24"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>`,
    };
  if (n.includes("transport") || n.includes("car") || n.includes("fuel"))
    return {
      color: "#3b82f6",
      bg: "#eff6ff",
      icon: `<svg viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
    };
  if (n.includes("shop") || n.includes("cloth") || n.includes("fashion"))
    return {
      color: "#8b5cf6",
      bg: "#f5f3ff",
      icon: `<svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
    };
  if (n.includes("health") || n.includes("medical") || n.includes("pharma"))
    return {
      color: "#ef4444",
      bg: "#fee2e2",
      icon: `<svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    };
  if (n.includes("entertain") || n.includes("fun") || n.includes("leisure"))
    return {
      color: "#f59e0b",
      bg: "#fffbeb",
      icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>`,
    };
  if (n.includes("util") || n.includes("bill") || n.includes("electric"))
    return {
      color: "#06b6d4",
      bg: "#ecfeff",
      icon: `<svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
    };
  if (n.includes("saving") || n.includes("invest") || n.includes("goal"))
    return {
      color: "#2aa96b",
      bg: "#e8f8f0",
      icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>`,
    };
  // Default fallback
  return {
    color: "#6b7280",
    bg: "#f3f4f6",
    icon: `<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>`,
  };
}

const STATUS_LABEL = {
  ACTIVE: "Active",
  NEAR_LIMIT: "Near Limit",
  EXCEEDED: "Exceeded",
  EXPIRED: "Expired",
};

function spentPct(b) {
  if (!b.spendingLimit || b.spendingLimit <= 0) return 0;
  return Math.min((b.spentAmount / b.spendingLimit) * 100, 100);
}

function fillClass(pct, threshold) {
  if (pct >= 100) return "fill--exceeded";
  if (pct >= (threshold ?? 80)) return "fill--warning";
  if (pct >= 60) return "fill--safe";
  return "fill--safe";
}

function formatDate(str) {
  if (!str) return "—";
  try {
    return new Date(str).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return str;
  }
}

function fmt(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n ?? 0);
}

function escapeHtml(str) {
  if (typeof str !== "string") return String(str ?? "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function renderSkeletons() {
  const grid = document.getElementById("budgetGrid");
  if (!grid) return;
  grid.innerHTML = Array.from(
    { length: 4 },
    () => `
    <div class="budget-skel">
      <div class="skel-row">
        <div class="skel-circ"></div>
        <div style="flex:1;display:flex;flex-direction:column;gap:8px">
          <div class="skel-line" style="width:55%"></div>
          <div class="skel-line" style="width:35%"></div>
        </div>
      </div>
      <div class="skel-line" style="width:40%"></div>
      <div class="skel-bar"></div>
      <div class="skel-row" style="gap:8px">
        <div class="skel-line" style="flex:1;height:32px;border-radius:8px"></div>
        <div class="skel-line" style="flex:1;height:32px;border-radius:8px"></div>
      </div>
    </div>`,
  ).join("");
}

// ── Build a single budget card ────────────────────────────────────────────────
function buildCard(b) {
  const status = deriveStatus(b);
  const cat = state.categories.find((c) => c.id === b.categoryId);
  const catName = b.categoryName || cat?.name || "Uncategorized";
  const meta = categoryMeta(catName);
  const pct = spentPct(b);
  const fClass = fillClass(pct, b.threshold);
  const remaining = Math.max((b.spendingLimit ?? 0) - (b.spentAmount ?? 0), 0);

  return `
    <div class="budget-card" data-id="${b.id}" data-status="${status}">

      <div class="bc-top">
        <div class="bc-category-icon" style="background:${meta.bg};color:${meta.color}">
          ${meta.icon}
        </div>
        <div class="bc-title-group">
          <div class="bc-category">${catName}</div>
          <div class="bc-dates">
            <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${escapeHtml(formatDate(b.startDate))} – ${escapeHtml(formatDate(b.endDate))}
          </div>
        </div>
        <span class="bc-status-badge status--${status}">${escapeHtml(STATUS_LABEL[status] ?? status)}</span>
      </div>

      <div class="bc-amounts">
        <div>
          <div class="bc-spent-label">SPENT</div>
          <div class="bc-spent-amount" style="color:${pct >= 100 ? "var(--red)" : pct >= (b.threshold ?? 80) ? "#d97706" : "var(--text)"}">${fmt(b.spentAmount)}</div>
        </div>
        <div class="bc-limit-wrap">
          <div class="bc-limit-label">LIMIT</div>
          <div class="bc-limit-amount">${fmt(b.spendingLimit)}</div>
        </div>
      </div>

      <div class="bc-progress-wrap">
        <div class="bc-progress-bar">
          <div class="bc-progress-fill ${fClass}" style="width:${pct}%"></div>
        </div>
        <div class="bc-progress-meta">
          <span>${fmt(remaining)} remaining</span>
          <span class="bc-progress-pct" style="color:${pct >= 100 ? "var(--red)" : pct >= (b.threshold ?? 80) ? "#d97706" : "var(--text2)"}">${pct.toFixed(0)}%</span>
        </div>
      </div>

      <div class="bc-threshold">
        <svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        Alert at ${b.threshold ?? 80}% threshold
      </div>

      <div class="bc-actions">
        <button class="bc-btn" onclick="openEditModal(${b.id})">
          <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit
        </button>
        <button class="bc-btn danger" onclick="askDelete(${b.id})">
          <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          Delete
        </button>
      </div>
    </div>`;
}

// ── Render the grid from filtered state ───────────────────────────────────────
function renderGrid(budgets) {
  const grid = document.getElementById("budgetGrid");
  if (!grid) return;

  if (!budgets.length) {
    grid.innerHTML = `
      <div class="budget-add-card" onclick="openAddModal()">
        <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Budget
      </div>`;
    return;
  }

  grid.innerHTML =
    budgets.map(buildCard).join("") +
    `
    <div class="budget-add-card" onclick="openAddModal()">
      <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      New Budget
    </div>`;

  // Animate progress bars after paint
  requestAnimationFrame(() => {
    document.querySelectorAll(".bc-progress-fill").forEach((el) => {
      // Width is already set inline; trigger CSS transition
      el.style.transition = "width 1s cubic-bezier(.4,0,.2,1)";
    });
  });
}

// ── Stats + tab counts ────────────────────────────────────────────────────────
function renderStats() {
  const all = state.budgets;
  const statuses = all.map(deriveStatus);
  const count = (s) => statuses.filter((x) => x === s).length;

  // Write values and strip skeleton shimmer
  ["statTotal", "statActive", "statNear", "statExceeded"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("skeleton-light");
  });

  setText("statTotal", all.length);
  setText("statActive", count("ACTIVE"));
  setText("statNear", count("NEAR_LIMIT"));
  setText("statExceeded", count("EXCEEDED"));

  setText("tabAll", all.length);
  setText("tabActive", count("ACTIVE"));
  setText("tabNear", count("NEAR_LIMIT"));
  setText("tabExceeded", count("EXCEEDED"));
  setText("tabExpired", count("EXPIRED"));
}

// ── Full re-render ────────────────────────────────────────────────────────────
function renderAll() {
  renderStats();
  applyFilter();
}

// ── Filter ────────────────────────────────────────────────────────────────────
function setFilter(filter) {
  state.activeFilter = filter;
  document.querySelectorAll(".filter-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });
  applyFilter();
}

function applyFilter() {
  const filtered =
    state.activeFilter === "all"
      ? state.budgets
      : state.budgets.filter((b) => deriveStatus(b) === state.activeFilter);
  renderGrid(filtered);
}

function openAddModal() {
  document.getElementById("budgetModalTitle").textContent = "Create Budget";
  document
    .getElementById("budgetSubmitBtn")
    .querySelector(".btn-label").textContent = "Create Budget";
  document.getElementById("editBudgetId").value = "";

  // Ensure category select is enabled for new budgets
  const select = document.getElementById("budgetCategorySelect");
  if (select) {
    select.disabled = false;
    select.style.opacity = "";
    select.style.cursor = "";
  }

  clearModalFields();
  openModal("budgetModal");
}

function openEditModal(id) {
  const b = state.budgets.find((b) => b.id === id);
  if (!b) return;

  document.getElementById("budgetModalTitle").textContent = "Edit Budget";
  document
    .getElementById("budgetSubmitBtn")
    .querySelector(".btn-label").textContent = "Save Changes";
  document.getElementById("editBudgetId").value = id;

  // Pre-select the category and lock it — category cannot be changed on edit
  const select = document.getElementById("budgetCategorySelect");
  if (select && b.categoryId != null) {
    select.value = String(b.categoryId);
    select.disabled = true;
    select.style.opacity = "0.6";
    select.style.cursor = "not-allowed";
  }

  document.getElementById("budgetLimit").value = b.spendingLimit ?? "";
  document.getElementById("budgetThreshold").value = b.threshold ?? 80;
  document.getElementById("budgetStartDate").value = 
  	b.startDate?.split("T")[0] ?? b.startDate ?? "";
  document.getElementById("budgetEndDate").value =
    b.endDate?.split("T")[0] ?? b.endDate ?? "";
  openModal("budgetModal");
}

function closeAddModal() {
  // Always re-enable category select so it's ready for next open
  const select = document.getElementById("budgetCategorySelect");
  if (select) {
    select.disabled = false;
    select.style.opacity = "";
    select.style.cursor = "";
  }
  closeModal("budgetModal");
  clearModalFields();
}

function clearModalFields() {
  const select = document.getElementById("budgetCategorySelect");
  if (select) select.value = "";
  ["budgetLimit", "budgetThreshold", "budgetStartDate", "budgetEndDate"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

// ── Submit (create or update) ─────────────────────────────────────────────────
/**
 * POST /api/budgets
 * PUT  /api/budgets/{id}
 * Body: CreateBudgetRequest { categoryId, spendingLimit, threshold, endDate }
 */
async function submitBudget() {
  const btn = document.getElementById("budgetSubmitBtn");
  const selectEl = document.getElementById("budgetCategorySelect");
  const limitEl = document.getElementById("budgetLimit");
  const threshEl = document.getElementById("budgetThreshold");
  const startDateEl = document.getElementById("budgetStartDate");
  const endDateEl = document.getElementById("budgetEndDate");
  const editId = document.getElementById("editBudgetId").value;

  // Clear previous errors
  [selectEl, limitEl, threshEl, startDateEl, endDateEl].forEach(clearFieldError);
  hideBanner("budgetFormError");

  const isEdit = !!editId;
  const originalBudget = isEdit
    ? state.budgets.find((b) => b.id === parseInt(editId, 10))
    : null;
  const categoryId = isEdit
    ? (originalBudget?.categoryId ?? parseInt(selectEl.value, 10))
    : parseInt(selectEl.value, 10);
  const spendingLimit = parseFloat(limitEl.value);
  const threshold = parseFloat(threshEl.value);
  const startDate = startDateEl.value;
  const endDate = endDateEl.value;
  let hasError = false;

  if (!isEdit && (!selectEl.value || isNaN(categoryId))) {
    setFieldError(selectEl, "Please select a category.");
    hasError = true;
  }
  if (isNaN(spendingLimit) || spendingLimit <= 0) {
    setFieldError(limitEl, "Please enter a spending limit greater than 0.");
    hasError = true;
  }
  if (isNaN(threshold) || threshold < 0 || threshold > 100) {
    setFieldError(threshEl, "Threshold must be between 0 and 100.");
    hasError = true;
  }
  if (!startDate) {
    setFieldError(startDateEl, "Please select a start date.");
    hasError = true;
  }
  if (!endDate) {
    setFieldError(endDateEl, "Please select an end date.");
    hasError = true;
  }
  if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
    setFieldError(endDateEl, "End date must be after start date.");
    hasError = true;
  }

  if (hasError) {
    const first = document.querySelector("#budgetModal .form-control.error");
    if (first) first.focus();
    return;
  }

  const payload = { categoryId, spendingLimit, threshold, startDate, endDate };
  const endpoint = isEdit ? API.BY_ID(editId) : API.ALL;
  const method = isEdit ? "PUT" : "POST";

  setButtonLoading(btn, true);

  const saved = await apiFetch(endpoint, {
    method,
    body: JSON.stringify(payload),
  });

  setButtonLoading(btn, false);

  if (saved) {
    if (isEdit) {
      const idx = state.budgets.findIndex((b) => b.id === parseInt(editId, 10));
      if (idx !== -1) state.budgets[idx] = saved;
    } else {
      state.budgets.push(saved);
    }
    renderAll();
    closeAddModal();
    showToast(
      isEdit ? "Budget updated successfully." : "Budget created successfully.",
    );
  } else {
    showBanner(
      "budgetFormError",
      lastApiError ||
        "Failed to save budget. Please check your connection and try again.",
    );
  }
}

function askDelete(id) {
  state.pendingDelete = id;
  const budget = state.budgets.find((b) => b.id === id);
  const category = state.categories.find((c) => c.id === budget?.categoryId);
  const name = budget?.categoryName || category?.name || "this";
  const nameEl = document.getElementById("confirmBudgetName");
  if (nameEl) nameEl.textContent = name;
  openModal("confirmModal");
}

/**
 * DELETE /api/budgets/{budgetID}
 */
async function confirmDelete() {
  const id = state.pendingDelete;
  if (!id) return;

  btnStartLoading("confirmDelBtn");

  await apiFetch(API.BY_ID(id), { method: "DELETE" });

  state.budgets = state.budgets.filter((b) => b.id !== id);
  state.pendingDelete = null;

  renderAll();
  closeModal("confirmModal");
  showToast("Budget deleted.");

  btnStopLoading("confirmDelBtn");
}

function closeConfirmModal() {
  closeModal("confirmModal");
  state.pendingDelete = null;
}

async function loadNotifBadge() {
  const data = await apiFetch(API.NOTIFICATIONS_UNREAD);
  if (!data) return;

  const badge = document.getElementById("notifBadge");
  if (badge) badge.classList.toggle("has-unread", data.length > 0);

  const list = document.getElementById("notifDropdownList");
  if (!list) return;

  if (!data.length) {
    list.innerHTML = `<div class="notif-empty"><svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>No unread notifications</div>`;
    return;
  }

  const iconMap = {
    BUDGET_ALERT: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    GOAL_REACHED: `<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
    TRANSACTION_ADDED: `<svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2M8 7V5a2 2 0 0 0-4 0v2"/></svg>`,
    BUDGET_EXCEEDED: `<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>`,
  };
  const clsMap = {
    BUDGET_ALERT: "notif-icon--alert",
    GOAL_REACHED: "notif-icon--success",
    TRANSACTION_ADDED: "notif-icon--info",
    BUDGET_EXCEEDED: "notif-icon--warning",
  };

  list.innerHTML = data
    .slice(0, 5)
    .map(
      (n) => `
    <div class="notif-item ${!n.read ? "unread" : ""}" data-id="${n.id}">
      <div class="notif-item-icon ${clsMap[n.type] || "notif-icon--info"}">
        ${iconMap[n.type] || iconMap.TRANSACTION_ADDED}
      </div>
      <div class="notif-item-body">
        <div class="notif-item-msg">${escapeHtml(n.message)}</div>
        <div class="notif-item-time">${formatRelativeTime(n.createdAt)}</div>
      </div>
    </div>`,
    )
    .join("");
}

function toggleNotifDropdown() {
  document.getElementById("notifDropdown")?.classList.toggle("is-open");
}

function formatRelativeTime(isoStr) {
  try {
    const diff = Date.now() - new Date(isoStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch {
    return "";
  }
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add("is-open");
  document.body.style.overflow = "hidden";
  setTimeout(() => {
    const first = modal.querySelector(
      "input, select, textarea, button:not(.modal-close)",
    );
    if (first) first.focus();
  }, 60);
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove("is-open");
  document.body.style.overflow = "";
  modal
    .querySelectorAll(".form-control.error")
    .forEach((el) => el.classList.remove("error"));
  modal.querySelectorAll(".field-error").forEach((el) => {
    el.textContent = "";
  });
  const banner = modal.querySelector(".form-error-banner");
  if (banner) {
    banner.textContent = "";
    banner.classList.remove("show");
  }
  setButtonLoading(modal.querySelector(".btn-submit"), false);
}

function setButtonLoading(btn, loading) {
  if (!btn) return;
  btn.disabled = loading;
  btn.classList.toggle("is-loading", loading);
}

// ── Form validation helpers ───────────────────────────────────────────────────
function setFieldError(el, msg) {
  el.classList.add("error");
  const errEl = document.getElementById(el.id + "Err");
  if (errEl) errEl.textContent = msg;
}

function clearFieldError(el) {
  el.classList.remove("error");
  const errEl = document.getElementById(el.id + "Err");
  if (errEl) errEl.textContent = "";
}

function showBanner(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
}

function hideBanner(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = "";
  el.classList.remove("show");
}

// ── Toast ─────────────────────────────────────────────────────────────────────
let toastTimer;

function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

// ── Error banner ──────────────────────────────────────────────────────────────
function showError(msg) {
  const el = document.getElementById("errorMsg");
  const text = document.getElementById("errorText");
  if (el && text) {
    text.textContent = msg;
    el.classList.add("show");
  }
}

// ── Utility ───────────────────────────────────────────────────────────────────
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function getGreetingText() {
  const hour = new Date().getHours();
  return hour >= 5 && hour < 12
    ? "Good morning"
    : hour >= 12 && hour < 17
      ? "Good afternoon"
      : hour >= 17 && hour < 21
        ? "Good evening"
        : "Good night";
}

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2)
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.trim().slice(0, 2).toUpperCase() || "U";
}

function renderProfile(profile = {}) {
  const name = profile.name || profile.username || "User";
  const el = document.getElementById("greeting");
  if (el)
    el.innerHTML = `${escapeHtml(getGreetingText())}, <span id="topbarUsername">${escapeHtml(name)}</span> <span>👋</span>`;

  const avatar = document.getElementById("topbarAvatar");
  if (avatar) avatar.textContent = getInitials(name);
}

function setGreeting() {
  renderProfile(state.profile || {});
}

function setActiveNav() {
  const current = window.location.pathname;
  document.querySelectorAll(".nav-item").forEach((link) => {
    const href = link.getAttribute("href");
    link.classList.toggle(
      "active",
      href === current || href === `${current}.html`,
    );
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  // ── Page loader ───────────────────────────────────────────────
  loaderInit([
    { pct: 25, label: "Loading your profile…" },
    { pct: 55, label: "Loading categories…" },
    { pct: 80, label: "Fetching your budgets…" },
    { pct: 100, label: "Almost ready…" },
  ]);

  // Skeleton greeting while profile loads
  const greetingEl = document.getElementById("greeting");
  if (greetingEl)
    greetingEl.innerHTML = '<span class="skeleton-greeting"></span>';

  setActiveNav();

  loaderAdvance(); // → profile + categories
  await Promise.all([loadProfile(), loadCategories()]);

  loaderAdvance(); // → budgets
  await loadBudgets();

  loaderAdvance(); // → 100 %
  loaderHide();

  loadNotifBadge(); // non-blocking — badge loads after overlay is gone

  // ── Modal: close on overlay click ────────────────────────────
  ["budgetModal", "confirmModal"].forEach((id) => {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.addEventListener("click", function (e) {
      if (e.target !== this) return;
      if (id === "budgetModal") closeAddModal();
      if (id === "confirmModal") closeConfirmModal();
    });
  });

  // ── Escape key ────────────────────────────────────────────────
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (document.getElementById("budgetModal")?.classList.contains("is-open")) {
      closeAddModal();
      return;
    }
    if (
      document.getElementById("confirmModal")?.classList.contains("is-open")
    ) {
      closeConfirmModal();
      return;
    }
    document.getElementById("notifDropdown")?.classList.remove("is-open");
  });

  // ── Close notif dropdown on outside click ─────────────────────
  document.addEventListener("click", (e) => {
    const wrapper = document.getElementById("notifWrapper");
    if (wrapper && !wrapper.contains(e.target))
      document.getElementById("notifDropdown")?.classList.remove("is-open");
  });

  // ── Live validation: clear errors as user types ───────────────
  document.querySelectorAll(".form-control").forEach((el) => {
    el.addEventListener("input", () => {
      if (el.classList.contains("error")) clearFieldError(el);
    });
  });
});
