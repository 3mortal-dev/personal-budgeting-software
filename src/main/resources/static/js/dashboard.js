/* ═══════════════════════════════════════════════════
   BudgetWise – Dashboard JavaScript
   dashboard.js
═══════════════════════════════════════════════════ */


// ╔══════════════════════════════════════════════════════════════╗
// ║  API CONFIGURATION                                           ║
// ║  Change BASE_URL to your Spring server address.              ║
// ║  In production, replace with your deployed backend URL.      ║
// ╚══════════════════════════════════════════════════════════════╝

const API = {
  BASE_URL: "http://localhost:8080/api",

  // ── Endpoint paths ──────────────────────────────────────────
  // Spring Controller  →  @RequestMapping("/api/...")
  TRANSACTIONS:        "/transactions",          // TransactionController
  BUDGETS:             "/budgets",               // BudgetController
  GOALS:               "/goals",                 // GoalController
  NOTIFICATIONS:       "/notifications",         // NotificationController
  MARK_ALL_READ:       "/notifications/mark-all-read",
  MARK_READ:           (id) => `/notifications/${id}/read`,
};

// ── Shared Fetch Helper ───────────────────────────────────────────────────────
// Wraps every API call with error handling.
// Returns parsed JSON on success, or null on failure.
//
// Spring side: make sure your controllers return proper HTTP status codes:
//   200 OK | 201 Created | 204 No Content | 400 Bad Request | 500 Server Error

async function apiFetch(endpoint, options = {}) {
  try {
    const response = await fetch(`${API.BASE_URL}${endpoint}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (response.status === 204) return null; // No Content (used by DELETE)
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    return await response.json();

  } catch (err) {
    console.error(`[API ERROR] ${options.method || "GET"} ${endpoint}:`, err.message);
    return null;
  }
}


// ╔══════════════════════════════════════════════════════════════╗
// ║  📦 IN-MEMORY STATE                                          ║
// ║  Holds all data for the current session.                     ║
// ║  Populated via loadAllData() on page load.                   ║
// ╚══════════════════════════════════════════════════════════════╝

const state = {
  transactions:  [],   // ← loaded from GET /api/transactions
  budgets:       [],   // ← loaded from GET /api/budgets
  goals:         [],   // ← loaded from GET /api/goals
  notifications: [],   // ← loaded from GET /api/notifications
};


// ╔══════════════════════════════════════════════════════════════╗
// ║  📡 DATA LOADERS                                             ║
// ║  Each function calls one Spring endpoint and saves           ║
// ║  the result into state.                                      ║
// ╚══════════════════════════════════════════════════════════════╝

// ── Load Transactions ─────────────────────────────────────────
// Spring:  GET /api/transactions
// Controller method:  @GetMapping → List<Transaction>
// Response shape expected:
//   [{ id, type, name, category, amount, date }, ...]

async function loadTransactions() {
  const data = await apiFetch(API.TRANSACTIONS);
  if (data) {
    state.transactions = data;
    renderTransactions();
    updateStats();
  }
}

// ── Load Budgets ──────────────────────────────────────────────
// Spring:  GET /api/budgets
// Controller method:  @GetMapping → List<Budget>
// Response shape expected:
//   [{ id, name, spent, limit }, ...]

async function loadBudgets() {
  const data = await apiFetch(API.BUDGETS);
  if (data) {
    state.budgets = data;
    renderBudgets();
  }
}

// ── Load Goals ────────────────────────────────────────────────
// Spring:  GET /api/goals
// Controller method:  @GetMapping → List<Goal>
// Response shape expected:
//   [{ id, name, status, saved, target }, ...]

async function loadGoals() {
  const data = await apiFetch(API.GOALS);
  if (data) {
    state.goals = data;
    renderGoals();
  }
}

// ── Load Notifications ────────────────────────────────────────
// Spring:  GET /api/notifications
// Controller method:  @GetMapping → List<Notification>
// Response shape expected:
//   [{ id, type, title, msg, time, unread }, ...]

async function loadNotifications() {
  const data = await apiFetch(API.NOTIFICATIONS);
  if (data) {
    state.notifications = data;
    updateNotifBadge();
  }
}

// ── Load Everything on Page Start ────────────────────────────
// Called once in DOMContentLoaded.
// Uses Promise.all so all 4 requests run in parallel (faster).

async function loadAllData() {
  await Promise.all([
    loadTransactions(),
    loadBudgets(),
    loadGoals(),
    loadNotifications(),
  ]);
}


// ── Navigation ────────────────────────────────────────────────────────────────

function goToBudgets() {
  window.location.href = "budget.html";
}

function goToTransactions() {
  window.location.href = "transactions.html";
}


// ── Time-based Greeting ───────────────────────────────────────────────────────

function setGreeting() {
  const hour = new Date().getHours();
  let salutation;

  if (hour >= 5 && hour < 12)       salutation = "Good morning";
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
// ║  ➕ ADD TRANSACTION                                           ║
// ║  Sends a POST to Spring, then updates state + UI.            ║
// ╚══════════════════════════════════════════════════════════════╝

function openAddModal() {
  const modal = document.getElementById("addModal");
  if (!modal) return;
  modal.removeAttribute("hidden");
  modal.classList.add("is-open");
  document.body.style.overflow = "hidden";
  setTimeout(() => {
    const first = modal.querySelector("input, select");
    if (first) first.focus();
  }, 50);
}

function closeAddModal() {
  const modal = document.getElementById("addModal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("hidden", "");
  document.body.style.overflow = "";

  document.getElementById("txName").value = "";
  document.getElementById("txCat").value  = "";
  document.getElementById("txAmt").value  = "";
  document.getElementById("txType").value = "expense";

  document.querySelectorAll(".form-control.error").forEach(el => el.classList.remove("error"));
}

// ── addTransaction ────────────────────────────────────────────
// Spring:  POST /api/transactions
// Controller method:
//   @PostMapping
//   public ResponseEntity<Transaction> create(@RequestBody Transaction tx)
//
// Request body sent:
//   { type, name, category, amount, date }
//
// Expected response:
//   The saved Transaction object with its generated id
//   → { id, type, name, category, amount, date }

async function addTransaction() {
  const type    = document.getElementById("txType").value;
  const nameEl  = document.getElementById("txName");
  const catEl   = document.getElementById("txCat");
  const amtEl   = document.getElementById("txAmt");

  const name     = nameEl.value.trim();
  const category = catEl.value.trim();
  const amount   = parseFloat(amtEl.value);

  [nameEl, catEl, amtEl].forEach(el => el.classList.remove("error"));

  let hasError = false;
  if (!name)                        { nameEl.classList.add("error"); hasError = true; }
  if (!category)                    { catEl.classList.add("error");  hasError = true; }
  if (isNaN(amount) || amount <= 0) { amtEl.classList.add("error");  hasError = true; }
  if (hasError) {
    document.querySelector(".form-control.error")?.focus();
    return;
  }

  const transaction = { type, name, category, amount, date: new Date().toISOString() };

  // 📡 POST /api/transactions
  const saved = await apiFetch(API.TRANSACTIONS, {
    method: "POST",
    body: JSON.stringify(transaction),
  });

  if (saved) {
    // Use the ID assigned by Spring/database, not a local one
    state.transactions.unshift(saved);
    renderTransactions();
    updateStats();
    closeAddModal();
  } else {
    alert("Failed to save transaction. Is the server running?");
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

  const statTxBadgeEl = document.getElementById("statTxBadge");
  if (statTxBadgeEl && txs.length > 0)
    statTxBadgeEl.textContent = `+${Math.min(txs.length, 99)}`;

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

// ── Mark All Read ─────────────────────────────────────────────
// Spring:  PATCH /api/notifications/mark-all-read
// Controller method:
//   @PatchMapping("/mark-all-read")
//   public ResponseEntity<Void> markAllRead()
//   → returns 204 No Content

async function markAllRead() {
  // 📡 PATCH /api/notifications/mark-all-read
  await apiFetch(API.MARK_ALL_READ, { method: "PATCH" });

  // Update local state regardless (optimistic update)
  state.notifications.forEach(n => { n.unread = false; });
  renderNotificationList();
  updateNotifBadge();
}

// ── Mark Single Notification Read ────────────────────────────
// Spring:  PATCH /api/notifications/{id}/read
// Controller method:
//   @PatchMapping("/{id}/read")
//   public ResponseEntity<Void> markRead(@PathVariable Long id)
//   → returns 204 No Content

async function markRead(id) {
  // 📡 PATCH /api/notifications/:id/read
  await apiFetch(API.MARK_READ(id), { method: "PATCH" });

  // Update local state (optimistic update)
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
// ║  💰 BUDGET MODAL                                             ║
// ╚══════════════════════════════════════════════════════════════╝

function openBudgetModal() {
  const modal = document.getElementById("budgetModal");
  if (!modal) return;
  modal.removeAttribute("hidden");
  modal.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeBudgetModal() {
  const modal = document.getElementById("budgetModal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("hidden", "");
  document.body.style.overflow = "";
}

// ── addBudget ─────────────────────────────────────────────────
// Spring:  POST /api/budgets
// Controller method:
//   @PostMapping
//   public ResponseEntity<Budget> create(@RequestBody Budget budget)
//
// Request body sent:
//   { category, amount, start_date, end_date, alert_percentage }
//
// Expected response:
//   The saved Budget object → { id, name, spent, limit, ... }

async function addBudget() {
  const category = document.getElementById("budgetCategory").value.trim();
  const amount   = document.getElementById("budgetAmount").value.trim();
  const start    = document.getElementById("budgetStart").value;
  const end      = document.getElementById("budgetEnd").value;
  const alertVal = document.getElementById("budgetAlert").value;

  if (!category || !amount || !start || !end) {
    alert("Please fill all fields");
    return;
  }

  const budgetData = {
    category,
    amount:           parseFloat(amount),
    start_date:       start,
    end_date:         end,
    alert_percentage: parseInt(alertVal),
  };

  // 📡 POST /api/budgets
  const saved = await apiFetch(API.BUDGETS, {
    method: "POST",
    body:   JSON.stringify(budgetData),
  });

  if (saved) {
    state.budgets.push(saved);
    renderBudgets();
    closeBudgetModal();

    // Reset form fields
    document.getElementById("budgetCategory").value = "";
    document.getElementById("budgetAmount").value   = "";
    document.getElementById("budgetStart").value    = "";
    document.getElementById("budgetEnd").value      = "";
    document.getElementById("budgetAlert").value    = "80";
  } else {
    alert("Failed to save budget. Is the server running?");
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
// ║  Runs when the page finishes loading.                        ║
// ╚══════════════════════════════════════════════════════════════╝

document.addEventListener("DOMContentLoaded", () => {
  setGreeting();
  setCurrentMonth();
  setActiveNav();

  // 📡 Load all data from Spring API
  loadAllData();

  // ── Modal: close on overlay click ───────────────────────────
  const modal = document.getElementById("addModal");
  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === this) closeAddModal();
    });
  }

  // ── Close modal / notifications on Escape ───────────────────
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (modal?.classList.contains("is-open")) closeAddModal();
      closeNotifications();
    }
  });

  // ── Close notification dropdown on outside click ─────────────
  document.addEventListener("click", (e) => {
    const wrapper = document.getElementById("notifWrapper");
    if (wrapper && !wrapper.contains(e.target)) closeNotifications();
  });
});