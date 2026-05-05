/* ═══════════════════════════════════════════════════
   BudgetWise – Dashboard JavaScript
   dashboard.js
═══════════════════════════════════════════════════ */

// ── In-Memory State ───────────────────────────────────────────────────────────
// All data lives here during the session.
// TODO: replace each section's data with your API responses.

const state = {
  transactions: [
    // TODO: fetch from GET /api/transactions
  ],
  budgets: [
    // TODO: fetch from GET /api/budgets
  ],
  goals: [
    // TODO: fetch from GET /api/goals
  ],
  notifications: [
    // TODO: fetch from GET /api/notifications
    { id: 1, type: "alert",   title: "Budget limit reached",      msg: "Your Food & Dining budget has reached 90% of its monthly limit.", time: "2 min ago",   unread: true  },
    { id: 2, type: "success", title: "Salary received",           msg: "A payment of $3,500.00 was credited to your account.",            time: "1 hour ago",  unread: true  },
    { id: 3, type: "warning", title: "Unusual spending detected", msg: "You've spent 40% more on Transport than last month.",             time: "3 hours ago", unread: true  },
    { id: 4, type: "info",    title: "Goal update",               msg: "You're 65% of the way to your Vacation Fund goal. Keep it up!",   time: "Yesterday",   unread: false },
    { id: 5, type: "success", title: "Bill paid successfully",    msg: "Your electricity bill of $85.00 was paid on time.",               time: "2 days ago",  unread: false },
  ],
};

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
    if (href && href === current) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

// ── Modal ─────────────────────────────────────────────────────────────────────

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

function addTransaction() {
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
    const firstError = document.querySelector(".form-control.error");
    if (firstError) firstError.focus();
    return;
  }

  const transaction = {
    id:       Date.now(),
    type,
    name,
    category,
    amount,
    date: new Date().toISOString(),
  };

  // TODO: POST /api/transactions — on success, push to state and re-render
  state.transactions.unshift(transaction);

  renderTransactions();
  updateStats();
  closeAddModal();
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
    style:                "currency",
    currency:             "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
  const totalIncome  = txs.filter(t => t.type === "income").reduce((s, t)  => s + t.amount, 0);
  const totalExpense = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance      = totalIncome - totalExpense;

  const balAmtEl = document.getElementById("balAmt");
  if (balAmtEl) { balAmtEl.classList.remove("skeleton"); balAmtEl.textContent = formatCurrency(balance); }

  const metIncomeEl = document.getElementById("metIncome");
  if (metIncomeEl) { metIncomeEl.classList.remove("skeleton"); metIncomeEl.textContent = formatCurrency(totalIncome); }

  const metExpenseEl = document.getElementById("metExpense");
  if (metExpenseEl) { metExpenseEl.classList.remove("skeleton"); metExpenseEl.textContent = formatCurrency(totalExpense); }

  const max        = Math.max(totalIncome, totalExpense, 1);
  const incomeBar  = document.getElementById("incomeBar");
  const expenseBar = document.getElementById("expenseBar");
  if (incomeBar)  incomeBar.style.width  = Math.min((totalIncome  / max) * 100, 100) + "%";
  if (expenseBar) expenseBar.style.width = Math.min((totalExpense / max) * 100, 100) + "%";

  const statTxEl = document.getElementById("statTx");
  if (statTxEl) statTxEl.textContent = txs.length;

  const statTxBadgeEl = document.getElementById("statTxBadge");
  if (statTxBadgeEl && txs.length > 0) statTxBadgeEl.textContent = `+${Math.min(txs.length, 99)}`;

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

// ── Goals Stat ────────────────────────────────────────────────────────────────

function renderGoals() {
  const inProgress     = state.goals.filter(g => g.status === "in_progress" || !g.status);
  const statGoalsEl    = document.getElementById("statGoals");
  const statGoalsBadge = document.getElementById("statGoalsBadge");

  if (statGoalsEl)    statGoalsEl.textContent = inProgress.length;
  if (statGoalsBadge && inProgress.length > 0) statGoalsBadge.textContent = `${inProgress.length} active`;
}

// ── Notifications ─────────────────────────────────────────────────────────────

const NOTIF_ICONS = {
  alert:   `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  success: `<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
  info:    `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  warning: `<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
};

function toggleNotifications() {
  const dropdown = document.getElementById("notifDropdown");
  const isOpen   = dropdown.classList.contains("is-open");
  if (isOpen) {
    closeNotifications();
  } else {
    renderNotificationList();
    dropdown.classList.add("is-open");
  }
}

function closeNotifications() {
  const dropdown = document.getElementById("notifDropdown");
  if (dropdown) dropdown.classList.remove("is-open");
}

function markAllRead() {
  // TODO: PATCH /api/notifications/mark-all-read
  state.notifications.forEach(n => { n.unread = false; });
  renderNotificationList();
  updateNotifBadge();
}

function markRead(id) {
  // TODO: PATCH /api/notifications/:id/read
  const notif = state.notifications.find(n => n.id === id);
  if (notif) notif.unread = false;

  updateNotifBadge();
  const item = document.querySelector(`.notif-item[data-id="${id}"]`);
  if (item) {
    item.classList.remove("unread");
    const dot = item.querySelector(".notif-unread-dot");
    if (dot) dot.remove();
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

// ── Utilities ─────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  setGreeting();
  setCurrentMonth();
  setActiveNav();
  renderTransactions();
  updateStats();
  renderBudgets();
  renderGoals();
  updateNotifBadge();

  // Close modal on overlay click
  const modal = document.getElementById("addModal");
  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === this) closeAddModal();
    });
  }

  // Close modal or notifications on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (modal && modal.classList.contains("is-open")) closeAddModal();
      closeNotifications();
    }
  });

  // Close notification dropdown on outside click
  document.addEventListener("click", (e) => {
    const wrapper = document.getElementById("notifWrapper");
    if (wrapper && !wrapper.contains(e.target)) closeNotifications();
  });
});



// ── Budget Modal ─────────────────────────────

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

function addBudget() {

  const category = document.getElementById("budgetCategory").value.trim();
  const amount   = document.getElementById("budgetAmount").value.trim();
  const start    = document.getElementById("budgetStart").value;
  const end      = document.getElementById("budgetEnd").value;
  const alertVal = document.getElementById("budgetAlert").value;

  // validation
  if (!category || !amount || !start || !end) {
    alert("Please fill all fields");
    return;
  }

  const budgetData = {
    category,
    amount: parseFloat(amount),
    start_date: start,
    end_date: end,
    alert_percentage: parseInt(alertVal)
  };

  console.log("Budget Ready to Send:", budgetData);

  // For(API)
  // ex:
  /*
  fetch("http://localhost:8080/api/budgets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(budgetData)
  })
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
  */

  closeBudgetModal();

  // reset form
  document.getElementById("budgetCategory").value = "";
  document.getElementById("budgetAmount").value = "";
  document.getElementById("budgetStart").value = "";
  document.getElementById("budgetEnd").value = "";
  document.getElementById("budgetAlert").value = "80";
}