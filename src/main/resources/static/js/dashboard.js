/* ═══════════════════════════════════════════════════
   BudgetWise – Dashboard JavaScript
   dashboard.js
═══════════════════════════════════════════════════ */


// ╔══════════════════════════════════════════════════════════════╗
// ║  API CONFIGURATION                                           ║
// ╚══════════════════════════════════════════════════════════════╝

const API = {
  BASE_URL: "http://localhost:8080/api",

  TRANSACTIONS:   "/transactions",
  BUDGETS:        "/budgets",
  GOALS:          "/goals",
  NOTIFICATIONS:  "/notifications",
  MARK_ALL_READ:  "/notifications/mark-all-read",
  MARK_READ:      (id) => `/notifications/${id}/read`,
};

// ── Shared Fetch Helper ───────────────────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  try {
    const response = await fetch(`${API.BASE_URL}${endpoint}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (response.status === 204) return null;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    return await response.json();
  } catch (err) {
    console.error(`[API ERROR] ${options.method || "GET"} ${endpoint}:`, err.message);
    return null;
  }
}


// ╔══════════════════════════════════════════════════════════════╗
// ║  📦 IN-MEMORY STATE                                          ║
// ╚══════════════════════════════════════════════════════════════╝

const state = {
  transactions:  [],
  budgets:       [],
  goals:         [],
  notifications: [],
};


// ╔══════════════════════════════════════════════════════════════╗
// ║  📡 DATA LOADERS                                             ║
// ╚══════════════════════════════════════════════════════════════╝

async function loadTransactions() {
  const data = await apiFetch(API.TRANSACTIONS);
  if (data) {
    state.transactions = data;
    renderTransactions();
    updateStats();
  }
}

async function loadBudgets() {
  const data = await apiFetch(API.BUDGETS);
  if (data) {
    state.budgets = data;
    renderBudgets();
  }
}

async function loadGoals() {
  const data = await apiFetch(API.GOALS);
  if (data) {
    state.goals = data;
    renderGoals();
  }
}

async function loadNotifications() {
  const data = await apiFetch(API.NOTIFICATIONS);
  if (data) {
    state.notifications = data;
    updateNotifBadge();
  }
}

async function loadAllData() {
  await Promise.all([
    loadTransactions(),
    loadBudgets(),
    loadGoals(),
    loadNotifications(),
  ]);
}


// ── Navigation ────────────────────────────────────────────────────────────────

function goToBudgets()      { window.location.href = "budget.html"; }
function goToTransactions() { window.location.href = "transactions.html"; }


// ── Time-based Greeting ───────────────────────────────────────────────────────

function setGreeting() {
  const hour = new Date().getHours();
  let salutation;

  if (hour >= 5  && hour < 12) salutation = "Good morning";
  else if (hour >= 12 && hour < 17) salutation = "Good afternoon";
  else if (hour >= 17 && hour < 21) salutation = "Good evening";
  else                               salutation = "Good night";

  const el = document.getElementById("greeting");
  if (el) el.innerHTML = `${salutation}, Ahmed <span>👋</span>`;
}


// ── Current Month Label ───────────────────────────────────────────────────────

function setCurrentMonth() {
  const el = document.getElementById("currentMonth");
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}


// ── Active Nav Highlight ──────────────────────────────────────────────────────

function setActiveNav() {
  const current = window.location.pathname.split("/").pop() || "dashboard.html";
  document.querySelectorAll(".nav-item").forEach(link => {
    const href = link.getAttribute("href");
    link.classList.toggle("active", href === current);
  });
}


// ╔══════════════════════════════════════════════════════════════╗
// ║  🔧 MODAL HELPERS                                            ║
// ║                                                              ║
// ║  FIX: Visibility is controlled ONLY by the .is-open class.   ║
// ║  The `hidden` HTML attribute is no longer used on modals     ║
// ║  because it overrides CSS `display` in all browsers and       ║
// ║  prevented modals from appearing when .is-open was added     ║
// ║  without first removing `hidden`.                            ║
// ╚══════════════════════════════════════════════════════════════╝

/**
 * Opens a modal by id.
 * Traps focus on the first interactive element inside.
 */
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add("is-open");
  document.body.style.overflow = "hidden";
  setTimeout(() => {
    const first = modal.querySelector("input, select, textarea, button:not(.modal-close)");
    if (first) first.focus();
  }, 60);
}

/**
 * Closes a modal by id.
 * Clears all field .error classes and inline error messages within the modal.
 *
 * FIX: Budget modal previously had no close-on-Escape and no clear-errors logic.
 * Both are now handled here centrally so both modals behave identically.
 */
function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove("is-open");
  document.body.style.overflow = "";

  // Clear field error states
  modal.querySelectorAll(".form-control.error").forEach(el => el.classList.remove("error"));
  // Clear per-field error messages
  modal.querySelectorAll(".field-error").forEach(el => { el.textContent = ""; });
  // Clear banner error
  const banner = modal.querySelector(".form-error-banner");
  if (banner) { banner.textContent = ""; banner.classList.remove("show"); }

  // Clear loading state from the submit button
  setButtonLoading(modal.querySelector(".btn-submit"), false);
}


// ── Add Transaction Modal ─────────────────────────────────────────────────────

function openAddModal()   { openModal("addModal"); }
function closeAddModal()  {
  closeModal("addModal");
  // Reset field values
  document.getElementById("txName").value = "";
  document.getElementById("txCat").value  = "";
  document.getElementById("txAmt").value  = "";
  document.getElementById("txType").value = "expense";
}


// ── Budget Modal ──────────────────────────────────────────────────────────────

function openBudgetModal()  { openModal("budgetModal"); }
function closeBudgetModal() {
  closeModal("budgetModal");
  // Reset field values
  document.getElementById("budgetCategory").value = "";
  document.getElementById("budgetAmount").value   = "";
  document.getElementById("budgetStart").value    = "";
  document.getElementById("budgetEnd").value      = "";
  document.getElementById("budgetAlert").value    = "80";
}


// ╔══════════════════════════════════════════════════════════════╗
// ║  ⏳ BUTTON LOADING STATE                                     ║
// ║                                                              ║
// ║  FIX: Submit buttons can be clicked multiple times during    ║
// ║  an in-flight API request, causing duplicate POSTs.          ║
// ║  setButtonLoading() disables the button and shows a spinner  ║
// ║  while the request is in progress.                           ║
// ╚══════════════════════════════════════════════════════════════╝

function setButtonLoading(btn, loading) {
  if (!btn) return;
  btn.disabled = loading;
  btn.classList.toggle("is-loading", loading);
}


// ╔══════════════════════════════════════════════════════════════╗
// ║  🗒️  INLINE FORM VALIDATION HELPERS                          ║
// ║                                                              ║
// ║  FIX: addBudget() previously called alert() for validation   ║
// ║  errors — a poor UX pattern that blocks the page and loses   ║
// ║  the form state. Replaced with inline per-field error        ║
// ║  messages consistent with how addTransaction() works.        ║
// ╚══════════════════════════════════════════════════════════════╝

/**
 * Marks a field as invalid and shows a message below it.
 * @param {HTMLElement} field - The input / select element.
 * @param {string}      msg   - The error message to display.
 */
function setFieldError(field, msg) {
  if (!field) return;
  field.classList.add("error");
  const errEl = document.getElementById(field.id + "Err");
  if (errEl) errEl.textContent = msg;
}

/**
 * Clears a single field's error state.
 */
function clearFieldError(field) {
  if (!field) return;
  field.classList.remove("error");
  const errEl = document.getElementById(field.id + "Err");
  if (errEl) errEl.textContent = "";
}

/**
 * Shows a banner-level error inside a modal (e.g. server failure).
 * @param {string} bannerId - The id of the .form-error-banner element.
 * @param {string} msg
 */
function showBanner(bannerId, msg) {
  const el = document.getElementById(bannerId);
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
}

function hideBanner(bannerId) {
  const el = document.getElementById(bannerId);
  if (!el) return;
  el.textContent = "";
  el.classList.remove("show");
}


// ╔══════════════════════════════════════════════════════════════╗
// ║  ➕ ADD TRANSACTION                                           ║
// ╚══════════════════════════════════════════════════════════════╝

async function addTransaction() {
  const btn     = document.getElementById("addTxBtn");
  const typeEl  = document.getElementById("txType");
  const nameEl  = document.getElementById("txName");
  const catEl   = document.getElementById("txCat");
  const amtEl   = document.getElementById("txAmt");

  // Clear previous errors
  [nameEl, catEl, amtEl].forEach(clearFieldError);
  hideBanner("addFormError");

  const type     = typeEl.value;
  const name     = nameEl.value.trim();
  const category = catEl.value.trim();
  const amount   = parseFloat(amtEl.value);

  let hasError = false;

  if (!name) {
    setFieldError(nameEl, "Please enter a description.");
    hasError = true;
  }
  if (!category) {
    setFieldError(catEl, "Please enter a category.");
    hasError = true;
  }
  if (isNaN(amount) || amount <= 0) {
    setFieldError(amtEl, "Please enter a valid amount greater than 0.");
    hasError = true;
  }

  if (hasError) {
    // Focus the first invalid field
    const firstError = document.querySelector("#addModal .form-control.error");
    if (firstError) firstError.focus();
    return;
  }

  const transaction = { type, name, category, amount, date: new Date().toISOString() };

  setButtonLoading(btn, true);

  // 📡 POST /api/transactions
  const saved = await apiFetch(API.TRANSACTIONS, {
    method: "POST",
    body:   JSON.stringify(transaction),
  });

  setButtonLoading(btn, false);

  if (saved) {
    state.transactions.unshift(saved);
    renderTransactions();
    updateStats();
    closeAddModal();
  } else {
    showBanner("addFormError", "Failed to save transaction. Please check your connection and try again.");
  }
}


// ── Transaction Rendering ─────────────────────────────────────────────────────

const CATEGORY_ICONS = {
  food:      `<svg viewBox="0 0 24 24"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
  transport: `<svg viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
  income:    `<svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  shopping:  `<svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  health:    `<svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
  default:   `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
};

const CATEGORY_COLORS = {
  food:      { bg: "#fef3c7", stroke: "#d97706" },
  transport: { bg: "#dbeafe", stroke: "#2563eb" },
  income:    { bg: "#d1fae5", stroke: "#059669" },
  shopping:  { bg: "#ede9fe", stroke: "#7c3aed" },
  health:    { bg: "#fee2e2", stroke: "#dc2626" },
  default:   { bg: "#f0f2f7", stroke: "#8a98a8" },
};

function getCategoryKey(category) {
  if (!category) return "default";
  const lower = category.toLowerCase();
  for (const key of Object.keys(CATEGORY_ICONS)) {
    if (lower.includes(key)) return key;
  }
  return "default";
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function renderTransactions() {
  const list = document.getElementById("txList");
  if (!list) return;

  if (state.transactions.length === 0) {
    list.innerHTML = `<div style="text-align:center;padding:24px 0;color:var(--text3);font-size:13px;">No transactions yet. Add one above.</div>`;
    return;
  }

  list.innerHTML = state.transactions.slice(0, 5).map(tx => {
    const catKey   = getCategoryKey(tx.category);
    const colors   = CATEGORY_COLORS[catKey];
    const icon     = CATEGORY_ICONS[catKey];
    const isIncome = tx.type === "income";
    return `
      <div class="tx-item">
        <div class="tx-icon" style="background:${colors.bg};color:${colors.stroke};">${icon}</div>
        <div class="tx-info">
          <div class="tx-name">${escapeHtml(tx.name)}</div>
          <div class="tx-meta">${escapeHtml(tx.category)} · ${formatDate(tx.date)}</div>
        </div>
        <div class="tx-amount ${isIncome ? "positive" : "negative"}">${isIncome ? "+" : "−"}${formatCurrency(tx.amount)}</div>
      </div>
    `;
  }).join("");
}


// ── Stats ─────────────────────────────────────────────────────────────────────

function updateStats() {
  const txs          = state.transactions;
  const totalIncome  = txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance      = totalIncome - totalExpense;

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) { el.classList.remove("skeleton"); el.textContent = val; }
  };

  set("balAmt",     formatCurrency(balance));
  set("metIncome",  formatCurrency(totalIncome));
  set("metExpense", formatCurrency(totalExpense));
  set("statTx",     txs.length);

  // FIX: Only show the badge when there are transactions, and hide it via display
  // rather than leaving a "+0" badge visible on empty state.
  const statTxBadgeEl = document.getElementById("statTxBadge");
  if (statTxBadgeEl) {
    if (txs.length > 0) {
      statTxBadgeEl.textContent    = `+${Math.min(txs.length, 99)}`;
      statTxBadgeEl.style.display  = "";
    } else {
      statTxBadgeEl.style.display  = "none";
    }
  }

  const max        = Math.max(totalIncome, totalExpense, 1);
  const incomeBar  = document.getElementById("incomeBar");
  const expenseBar = document.getElementById("expenseBar");
  if (incomeBar)  incomeBar.style.width  = Math.min((totalIncome  / max) * 100, 100) + "%";
  if (expenseBar) expenseBar.style.width = Math.min((totalExpense / max) * 100, 100) + "%";

  const alertCard = document.getElementById("alertCard");
  const alertMsg  = document.getElementById("alertMsg");
  if (alertCard && alertMsg && totalIncome > 0) {
    const ratio = totalExpense / totalIncome;
    if (ratio >= 0.8) {
      alertMsg.textContent = `You've spent ${Math.round(ratio * 100)}% of your income this period. Consider reviewing your budget.`;
      alertCard.removeAttribute("hidden");
    } else {
      alertCard.setAttribute("hidden", "");
    }
  }
}


// ── Budgets ───────────────────────────────────────────────────────────────────

function renderBudgets() {
  const budgetsList      = document.getElementById("budgetsList");
  const statBudgetsEl    = document.getElementById("statBudgets");
  const statBudgetsSubEl = document.getElementById("statBudgetsSub");
  const budgets          = state.budgets;

  if (statBudgetsEl)    statBudgetsEl.textContent    = budgets.length;
  if (statBudgetsSubEl) statBudgetsSubEl.textContent = budgets.length === 1 ? "1 category" : `${budgets.length} categories`;
  if (!budgetsList) return;

  if (budgets.length === 0) {
    budgetsList.innerHTML = `<p style="font-size:13px;color:var(--text3);text-align:center;padding:12px 0;">No budgets yet.</p>`;
    return;
  }

  budgetsList.innerHTML = budgets.slice(0, 4).map(b => {
    const pct   = Math.min((b.spent / b.limit) * 100, 100);
    const color = pct >= 90 ? "#e84040" : pct >= 70 ? "#f59e0b" : "#2aa96b";
    return `
      <div class="budget-item">
        <div class="budget-row">
          <span class="budget-name">${escapeHtml(b.name)}</span>
          <span class="budget-amounts">${formatCurrency(b.spent)} / ${formatCurrency(b.limit)}</span>
        </div>
        <div class="budget-track">
          <div class="budget-fill" style="width:${pct}%;background:${color};"></div>
        </div>
      </div>
    `;
  }).join("");
}


// ── Goals ─────────────────────────────────────────────────────────────────────

function renderGoals() {
  const inProgress     = state.goals.filter(g => g.status === "in_progress" || !g.status);
  const statGoalsEl    = document.getElementById("statGoals");
  const statGoalsBadge = document.getElementById("statGoalsBadge");

  if (statGoalsEl)    statGoalsEl.textContent = inProgress.length;
  if (statGoalsBadge && inProgress.length > 0)
    statGoalsBadge.textContent = `${inProgress.length} active`;
}


// ╔══════════════════════════════════════════════════════════════╗
// ║  🔔 NOTIFICATIONS                                            ║
// ╚══════════════════════════════════════════════════════════════╝

const NOTIF_ICONS = {
  alert:   `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  success: `<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
  info:    `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  warning: `<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
};

function toggleNotifications() {
  const dropdown = document.getElementById("notifDropdown");
  const isOpen   = dropdown.classList.contains("is-open");
  if (isOpen) closeNotifications();
  else {
    renderNotificationList();
    dropdown.classList.add("is-open");
  }
}

function closeNotifications() {
  document.getElementById("notifDropdown")?.classList.remove("is-open");
}

// 📡 PATCH /api/notifications/mark-all-read
async function markAllRead() {
  await apiFetch(API.MARK_ALL_READ, { method: "PATCH" });
  state.notifications.forEach(n => { n.unread = false; });
  renderNotificationList();
  updateNotifBadge();
}

// 📡 PATCH /api/notifications/:id/read
async function markRead(id) {
  await apiFetch(API.MARK_READ(id), { method: "PATCH" });
  const notif = state.notifications.find(n => n.id === id);
  if (notif) notif.unread = false;

  updateNotifBadge();
  const item = document.querySelector(`.notif-item[data-id="${id}"]`);
  if (item) {
    item.classList.remove("unread");
    item.querySelector(".notif-unread-dot")?.remove();
  }
}

function updateNotifBadge() {
  const badge  = document.getElementById("notifBadge");
  const unread = state.notifications.filter(n => n.unread).length;
  if (badge) badge.classList.toggle("has-unread", unread > 0);
}

function renderNotificationList() {
  const list   = document.getElementById("notifList");
  const notifs = state.notifications;

  if (!notifs.length) {
    list.innerHTML = `
      <div class="notif-empty">
        <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        No notifications yet
      </div>`;
    return;
  }

  list.innerHTML = notifs.map(n => `
    <div class="notif-item ${n.unread ? "unread" : ""}" data-id="${n.id}" onclick="markRead(${n.id})">
      <div class="notif-item-icon notif-icon--${n.type}">${NOTIF_ICONS[n.type] || NOTIF_ICONS.info}</div>
      <div class="notif-item-body">
        <div class="notif-item-title">${escapeHtml(n.title)}</div>
        <div class="notif-item-msg">${escapeHtml(n.msg)}</div>
        <div class="notif-item-time">${escapeHtml(n.time)}</div>
      </div>
      ${n.unread ? `<div class="notif-unread-dot"></div>` : ""}
    </div>
  `).join("");
}


// ╔══════════════════════════════════════════════════════════════╗
// ║  💰 ADD BUDGET                                               ║
// ╚══════════════════════════════════════════════════════════════╝

// ── addBudget ─────────────────────────────────────────────────
// Spring:  POST /api/budgets
// Request body: { category, amount, start_date, end_date, alert_percentage }
// Response:     { id, name, spent, limit, ... }

async function addBudget() {
  const btn         = document.getElementById("addBudgetBtn");
  const categoryEl  = document.getElementById("budgetCategory");
  const amountEl    = document.getElementById("budgetAmount");
  const startEl     = document.getElementById("budgetStart");
  const endEl       = document.getElementById("budgetEnd");
  const alertEl     = document.getElementById("budgetAlert");

  // Clear previous errors
  [categoryEl, amountEl, startEl, endEl].forEach(clearFieldError);
  hideBanner("budgetFormError");

  const category = categoryEl.value.trim();
  const amount   = parseFloat(amountEl.value);
  const start    = startEl.value;
  const end      = endEl.value;
  const alertVal = parseInt(alertEl.value, 10);

  let hasError = false;

  if (!category) {
    setFieldError(categoryEl, "Please enter a budget category.");
    hasError = true;
  }
  if (isNaN(amount) || amount <= 0) {
    setFieldError(amountEl, "Please enter a valid amount greater than 0.");
    hasError = true;
  }
  if (!start) {
    setFieldError(startEl, "Please select a start date.");
    hasError = true;
  }
  if (!end) {
    setFieldError(endEl, "Please select an end date.");
    hasError = true;
  }
  // FIX: Added date-range sanity check
  if (start && end && end < start) {
    setFieldError(endEl, "End date must be after the start date.");
    hasError = true;
  }

  if (hasError) {
    const firstError = document.querySelector("#budgetModal .form-control.error");
    if (firstError) firstError.focus();
    return;
  }

  const budgetData = {
    category,
    amount,
    start_date:       start,
    end_date:         end,
    alert_percentage: alertVal,
  };

  setButtonLoading(btn, true);

  // 📡 POST /api/budgets
  const saved = await apiFetch(API.BUDGETS, {
    method: "POST",
    body:   JSON.stringify(budgetData),
  });

  setButtonLoading(btn, false);

  if (saved) {
    state.budgets.push(saved);
    renderBudgets();
    closeBudgetModal();
  } else {
    showBanner("budgetFormError", "Failed to save budget. Please check your connection and try again.");
  }
}


// ── Utilities ─────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&#039;");
}


// ╔══════════════════════════════════════════════════════════════╗
// ║  🚀 INIT                                                     ║
// ╚══════════════════════════════════════════════════════════════╝

document.addEventListener("DOMContentLoaded", () => {
  setGreeting();
  setCurrentMonth();
  setActiveNav();

  // 📡 Load all data from Spring API
  loadAllData();

  // ── Modal: close on overlay click ───────────────────────────
  // FIX: Wired up for BOTH modals. Previously only addModal had this.
  ["addModal", "budgetModal"].forEach(id => {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.addEventListener("click", function (e) {
      if (e.target === this) {
        if (id === "addModal")    closeAddModal();
        if (id === "budgetModal") closeBudgetModal();
      }
    });
  });

  // ── Close modal / notifications on Escape ───────────────────
  // FIX: Now handles BOTH modals, not just addModal.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;

    const addModal    = document.getElementById("addModal");
    const budgetModal = document.getElementById("budgetModal");

    if (addModal?.classList.contains("is-open"))    { closeAddModal();    return; }
    if (budgetModal?.classList.contains("is-open")) { closeBudgetModal(); return; }

    closeNotifications();
  });

  // ── Close notification dropdown on outside click ─────────────
  document.addEventListener("click", (e) => {
    const wrapper = document.getElementById("notifWrapper");
    if (wrapper && !wrapper.contains(e.target)) closeNotifications();
  });

  // ── Live validation: clear errors as user types ──────────────
  // Improves UX by removing the red border the moment the field is corrected.
  document.querySelectorAll(".form-control").forEach(el => {
    el.addEventListener("input", () => {
      if (el.classList.contains("error")) clearFieldError(el);
    });
  });
});