const API = {
  DASHBOARD: "/api/dashboard",
  PROFILE: "/api/profile",
  TRANSACTIONS: "/api/transactions",
  BUDGETS: "/api/budgets",
  NOTIFICATIONS: "/notifications/all",
  MARK_READ: (id) => `/notifications/${id}/markRead`,
};

const state = {
  dashboard: null,
  notifications: [],
};

async function apiFetch(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
    if (response.status === 204) return null;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    return null;
  }
}

function formatCurrency(amount) {
  const value = Number(amount || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateValue) {
  if (!dateValue) return "";
  return new Date(dateValue).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

function setCurrentMonth() {
  const el = document.getElementById("currentMonth");
  if (!el) return;
  el.textContent = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function setActiveNav() {
  const currentPath = window.location.pathname;
  document.querySelectorAll(".nav-item").forEach((link) => {
    const href = link.getAttribute("href") || "";
    const isActive = href !== "#" && currentPath === href;
    link.classList.toggle("active", isActive);
  });
}

function getGreetingByHour() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}

async function setGreeting() {
  const el = document.getElementById("greeting");
  if (!el) return;
  const profile = await apiFetch(API.PROFILE, { headers: { Accept: "application/json" } });
  const fullName = (profile?.name || "").trim();
  const firstName = fullName ? fullName.split(/\s+/)[0] : "there";
  el.innerHTML = `${getGreetingByHour()}, ${escapeHtml(firstName)} <span>👋</span>`;
}

function setText(id, value, removeSkeleton = false) {
  const el = document.getElementById(id);
  if (!el) return;
  if (removeSkeleton) el.classList.remove("skeleton");
  el.textContent = value;
}

function renderDashboard() {
  const data = state.dashboard;
  if (!data) return;

  setText("balAmt", formatCurrency(data.totalBalance), true);
  setText("metIncome", formatCurrency(data.monthlyIncome), true);
  setText("metExpense", formatCurrency(data.monthlyExpense), true);
  setText("statTx", Number(data.numberOfTransactions || 0));
  setText("statBudgets", Number(data.activeBudgets || 0));
  setText("statBudgetsSub", Number(data.activeBudgets || 0) === 1 ? "1 active budget" : `${Number(data.activeBudgets || 0)} active budgets`);
  setText("statGoals", Number(data.activeGoals || 0));
  setText("statGoalsBadge", Number(data.activeGoals || 0) > 0 ? `${Number(data.activeGoals)} active` : "");

  renderTransactions(data.recentTransactions || []);
  renderBudgets(data.activeBudgetItems || []);
  renderSpendingAlert(data.monthlyIncome, data.monthlyExpense);
  renderMetricBars(data.monthlyIncome, data.monthlyExpense);
  renderTxBadge(Number(data.numberOfTransactions || 0));
}

function renderTransactions(transactions) {
  const list = document.getElementById("txList");
  if (!list) return;
  if (!transactions.length) {
    list.innerHTML = `<div style="text-align:center;padding:24px 0;color:var(--text3);font-size:13px;">No transactions yet.</div>`;
    return;
  }

  list.innerHTML = transactions.slice(0, 5).map((tx) => {
    const type = (tx.type || "").toString().toUpperCase();
    const isIncome = type === "INCOME";
    const label = tx.description || tx.source || `Category #${tx.categoryId ?? "N/A"}`;
    const signedAmount = `${isIncome ? "+" : "−"}${formatCurrency(tx.amount)}`;
    return `
      <div class="tx-item">
        <div class="tx-icon">${isIncome ? "↑" : "↓"}</div>
        <div class="tx-info">
          <div class="tx-name">${escapeHtml(label)}</div>
          <div class="tx-meta">${escapeHtml(type || "TRANSACTION")} · ${formatDate(tx.date)}</div>
        </div>
        <div class="tx-amount ${isIncome ? "positive" : "negative"}">${signedAmount}</div>
      </div>
    `;
  }).join("");
}

function renderBudgets(budgets) {
  const budgetsList = document.getElementById("budgetsList");
  if (!budgetsList) return;
  if (!budgets.length) {
    budgetsList.innerHTML = `<p style="font-size:13px;color:var(--text3);text-align:center;padding:12px 0;">No active budgets.</p>`;
    return;
  }
  budgetsList.innerHTML = budgets.slice(0, 4).map((budget) => {
    const spent = Number(budget.spentAmount || 0);
    const limit = Number(budget.spendingLimit || 0);
    const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
    const color = pct >= 90 ? "#e84040" : pct >= 70 ? "#f59e0b" : "#2aa96b";
    return `
      <div class="budget-item">
        <div class="budget-row">
          <span class="budget-name">Category #${budget.categoryId ?? "N/A"}</span>
          <span class="budget-amounts">${formatCurrency(spent)} / ${formatCurrency(limit)}</span>
        </div>
        <div class="budget-track">
          <div class="budget-fill" style="width:${pct}%;background:${color};"></div>
        </div>
      </div>
    `;
  }).join("");
}

function renderSpendingAlert(monthlyIncome, monthlyExpense) {
  const alertCard = document.getElementById("alertCard");
  const alertMsg = document.getElementById("alertMsg");
  if (!alertCard || !alertMsg) return;
  const income = Number(monthlyIncome || 0);
  const expense = Number(monthlyExpense || 0);
  if (income <= 0) {
    alertCard.setAttribute("hidden", "");
    return;
  }
  const ratio = expense / income;
  if (ratio >= 0.8) {
    alertMsg.textContent = `You've spent ${Math.round(ratio * 100)}% of your monthly income. Consider reviewing your budget.`;
    alertCard.removeAttribute("hidden");
  } else {
    alertCard.setAttribute("hidden", "");
  }
}

function renderMetricBars(monthlyIncome, monthlyExpense) {
  const income = Number(monthlyIncome || 0);
  const expense = Number(monthlyExpense || 0);
  const max = Math.max(income, expense, 1);
  const incomeBar = document.getElementById("incomeBar");
  const expenseBar = document.getElementById("expenseBar");
  if (incomeBar) incomeBar.style.width = `${Math.min((income / max) * 100, 100)}%`;
  if (expenseBar) expenseBar.style.width = `${Math.min((expense / max) * 100, 100)}%`;
}

function renderTxBadge(txCount) {
  const badge = document.getElementById("statTxBadge");
  if (!badge) return;
  if (txCount > 0) {
    badge.textContent = `+${Math.min(txCount, 99)}`;
    badge.style.display = "";
  } else {
    badge.style.display = "none";
  }
}

async function loadDashboardData() {
  const data = await apiFetch(API.DASHBOARD);
  if (!data) {
    const errorMsg = document.getElementById("errorMsg");
    const errorText = document.getElementById("errorText");
    if (errorMsg && errorText) {
      errorText.textContent = "Failed to load dashboard data.";
      errorMsg.style.display = "flex";
    }
    return;
  }
  state.dashboard = data;
  renderDashboard();
}

async function loadNotifications() {
  const data = await apiFetch(API.NOTIFICATIONS);
  state.notifications = Array.isArray(data) ? data : [];
  updateNotifBadge();
}

function updateNotifBadge() {
  const badge = document.getElementById("notifBadge");
  if (!badge) return;
  const unreadCount = state.notifications.filter((n) => !n.read).length;
  badge.classList.toggle("has-unread", unreadCount > 0);
}

function renderNotificationList() {
  const list = document.getElementById("notifList");
  if (!list) return;
  if (!state.notifications.length) {
    list.innerHTML = `<div class="notif-empty">No notifications yet</div>`;
    return;
  }

  list.innerHTML = state.notifications.map((n) => `
    <div class="notif-item ${n.read ? "" : "unread"}" data-id="${n.id}" onclick="markRead(${n.id})">
      <div class="notif-item-body">
        <div class="notif-item-title">${escapeHtml((n.type || "INFO").toString())}</div>
        <div class="notif-item-msg">${escapeHtml(n.message || "")}</div>
        <div class="notif-item-time">${escapeHtml(n.createdAt || "")}</div>
      </div>
      ${n.read ? "" : `<div class="notif-unread-dot"></div>`}
    </div>
  `).join("");
}

function toggleNotifications() {
  const dropdown = document.getElementById("notifDropdown");
  if (!dropdown) return;
  const isOpen = dropdown.classList.contains("is-open");
  if (isOpen) {
    dropdown.classList.remove("is-open");
    return;
  }
  renderNotificationList();
  dropdown.classList.add("is-open");
}

function closeNotifications() {
  document.getElementById("notifDropdown")?.classList.remove("is-open");
}

async function markRead(id) {
  await apiFetch(API.MARK_READ(id), { method: "PUT" });
  const target = state.notifications.find((n) => n.id === id);
  if (target) target.read = true;
  updateNotifBadge();
  renderNotificationList();
}

async function markAllRead() {
  const unread = state.notifications.filter((n) => !n.read);
  await Promise.all(unread.map((n) => markRead(n.id)));
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove("is-open");
  document.body.style.overflow = "";
}

function openAddModal() { openModal("addModal"); }
function closeAddModal() { closeModal("addModal"); }
function openBudgetModal() { openModal("budgetModal"); }
function closeBudgetModal() { closeModal("budgetModal"); }

async function addTransaction() {
  const type = (document.getElementById("txType")?.value || "expense").toUpperCase();
  const description = document.getElementById("txName")?.value?.trim() || "";
  const amount = Number(document.getElementById("txAmt")?.value || 0);
  const payload = {
    type,
    description,
    amount,
    date: new Date().toISOString().slice(0, 10),
  };
  await apiFetch(API.TRANSACTIONS, { method: "POST", body: JSON.stringify(payload) });
  closeAddModal();
  await loadDashboardData();
}

async function addBudget() {
  const spendingLimit = Number(document.getElementById("budgetAmount")?.value || 0);
  const startDate = document.getElementById("budgetStart")?.value || null;
  const endDate = document.getElementById("budgetEnd")?.value || null;
  const payload = { spendingLimit, startDate, endDate };
  await apiFetch(API.BUDGETS, { method: "POST", body: JSON.stringify(payload) });
  closeBudgetModal();
  await loadDashboardData();
}

document.addEventListener("DOMContentLoaded", async () => {
  setCurrentMonth();
  setActiveNav();
  await Promise.all([setGreeting(), loadDashboardData(), loadNotifications()]);

  ["addModal", "budgetModal"].forEach((id) => {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.addEventListener("click", function onOverlayClick(event) {
      if (event.target === this) closeModal(id);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (document.getElementById("addModal")?.classList.contains("is-open")) return closeAddModal();
    if (document.getElementById("budgetModal")?.classList.contains("is-open")) return closeBudgetModal();
    closeNotifications();
  });

  document.addEventListener("click", (event) => {
    const wrapper = document.getElementById("notifWrapper");
    if (wrapper && !wrapper.contains(event.target)) closeNotifications();
  });
});