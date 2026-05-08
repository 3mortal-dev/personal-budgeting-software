const API = {
    DASHBOARD: "/api/dashboard",
    PROFILE: "/api/profile",
    TRANSACTIONS: "/api/transactions",
    CATEGORIES: "/api/categories",
    BUDGETS: "/api/budgets",
    NOTIFICATIONS: "/api/notifications/all",
    MARK_READ: (id) => `/api/notifications/${id}/read`,
};

const state = {
    dashboard: null,
    notifications: [],
    categories: [],
};

async function apiFetch(endpoint, options = {}) {
    try {
        const response = await fetch(endpoint, {
            headers: {"Content-Type": "application/json", ...(options.headers || {})},
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

// ╔══════════════════════════════════════════════════════════════╗
// ║  PAGE LOADER                                                 ║
// ╚══════════════════════════════════════════════════════════════╝

const LOADER_STEPS = [
    {pct: 15, label: "Loading your profile…"},
    {pct: 40, label: "Fetching dashboard data…"},
    {pct: 65, label: "Loading categories…"},
    {pct: 85, label: "Loading notifications…"},
    {pct: 100, label: "Almost ready…"},
];
let _loaderStep = 0;

function loaderAdvance() {
    const bar = document.getElementById("loaderBar");
    const label = document.getElementById("loaderLabel");
    if (!bar || !label) return;
    const step = LOADER_STEPS[Math.min(_loaderStep, LOADER_STEPS.length - 1)];
    bar.style.width = step.pct + "%";
    label.textContent = step.label;
    _loaderStep++;
}

function loaderHide() {
    const el = document.getElementById("pageLoader");
    if (!el) return;
    el.classList.add("hidden");
    // remove from DOM after transition so it never blocks interaction
    el.addEventListener("transitionend", () => el.remove(), {once: true});
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  SKELETON HELPERS                                            ║
// ╚══════════════════════════════════════════════════════════════╝

/** Renders N skeleton transaction rows into #txList */
function showTxSkeletons(count = 4) {
    const list = document.getElementById("txList");
    if (!list) return;
    list.innerHTML = Array.from({length: count}, () => `
        <div class="skeleton-row">
            <div class="skeleton-circle skeleton-light"></div>
            <div class="skeleton-lines">
                <div class="skeleton-line skeleton-line--long skeleton-light"></div>
                <div class="skeleton-line skeleton-line--medium skeleton-light"></div>
            </div>
            <div class="skeleton-amount skeleton-light"></div>
        </div>
    `).join("");
}

/** Renders N skeleton budget rows into #budgetsList */
function showBudgetSkeletons(count = 3) {
    const list = document.getElementById("budgetsList");
    if (!list) return;
    list.innerHTML = Array.from({length: count}, () => `
        <div class="skeleton-budget-row">
            <div class="skeleton-budget-header">
                <div class="skeleton-line skeleton-line--medium skeleton-light"></div>
                <div class="skeleton-line skeleton-line--short skeleton-light"></div>
            </div>
            <div class="skeleton-bar skeleton-light"></div>
        </div>
    `).join("");
}

/** Puts a button into loading state (shows spinner, disables it) */
function btnStartLoading(btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.classList.add("is-loading");
    btn.disabled = true;
}

/** Removes the loading state from a button */
function btnStopLoading(btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.classList.remove("is-loading");
    btn.disabled = false;
}

/** Removes skeleton class from stat value elements once data arrives */
function clearStatSkeletons() {
    ["statTx", "statBudgets", "statGoals"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove("skeleton-light");
    });
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  TOAST NOTIFICATIONS                                         ║
// ╚══════════════════════════════════════════════════════════════╝

let toastTimer;

/**
 * Core toast engine
 * @param {string} msg   - Message text
 * @param {'success'|'error'|'info'|'warning'} type
 * @param {number}  [duration=3200]
 */
function showToast(msg, type = "success", duration = 3200) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    clearTimeout(toastTimer);
    toast.classList.remove("show");

    requestAnimationFrame(() => {
        toast.innerHTML = `<span class="toast__icon">${TOAST_ICONS[type] ?? TOAST_ICONS.info}</span>
                           <span class="toast__msg">${escapeToast(msg)}</span>`;
        toast.className = `toast toast--${type} show`;
        toastTimer = setTimeout(() => toast.classList.remove("show"), duration);
    });
}

const TOAST_ICONS = {
    success: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="8.5"/><polyline points="6.5,10.5 9,13 13.5,7.5"/></svg>`,
    error: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="8.5"/><line x1="7" y1="7" x2="13" y2="13"/><line x1="13" y1="7" x2="7" y2="13"/></svg>`,
    warning: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2.5L18 17H2L10 2.5Z"/><line x1="10" y1="8" x2="10" y2="12"/><circle cx="10" cy="15" r="0.8" fill="currentColor"/></svg>`,
    info: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="8.5"/><line x1="10" y1="9" x2="10" y2="14"/><circle cx="10" cy="6.5" r="0.8" fill="currentColor"/></svg>`,
};

function escapeToast(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function showSuccess(message) {
    showToast(message, "success");
}

function showError(message) {
    showToast(message, "error");
}

function showWarning(message) {
    showToast(message, "warning");
}

function showInfo(message) {
    showToast(message, "info");
}

// ── Transactions ──────────────────────────────────────────────────────────────

/**
 * Transaction successfully added.
 * Shows type, signed amount, and optional source/category label.
 */
function toastTransactionAdded(type, amount, label) {
    const sign = type === "INCOME" ? "+" : "−";
    const money = formatCurrency(amount);
    const detail = label ? ` · ${label}` : "";
    const verb = type === "INCOME" ? "Income recorded" : "Expense logged";
    showToast(`${verb}: ${sign}${money}${detail}`, "success");
}

/**
 * Transaction save or update failed (network / server error).
 */
function toastSaveFailed(action = "save") {
    showToast(`Couldn't ${action}. Check your connection and try again.`, "error");
}

// ── Dashboard data ────────────────────────────────────────────────────────────

/**
 * Dashboard summary failed to load on page init.
 */
function toastDashboardLoadFailed() {
    showToast("Dashboard data couldn't be loaded. Please refresh.", "error");
}

/**
 * Partial dashboard data (e.g. only some cards populated).
 */
function toastDashboardPartial() {
    showToast("Some data is unavailable right now — showing what we have.", "warning");
}

/**
 * Dashboard refreshed successfully (e.g. after adding a transaction / budget).
 */
function toastDashboardRefreshed() {
    showToast("Dashboard updated.", "info", 2400);
}

// ── Budgets ───────────────────────────────────────────────────────────────────

/**
 * New budget created successfully.
 */
function toastBudgetAdded(categoryName, limit) {
    showToast(`Budget set for ${categoryName}: ${formatCurrency(limit)} / month`, "success");
}

/**
 * Budget deleted.
 */
function toastBudgetDeleted(categoryName) {
    const detail = categoryName ? ` for ${categoryName}` : "";
    showToast(`Budget${detail} removed.`, "info");
}

/**
 * Budget nearing its limit (≥ threshold %).
 * @param {string} categoryName
 * @param {number} pct - percentage spent (0–100)
 */
function toastBudgetWarning(categoryName, pct) {
    const rounded = Math.round(pct);
    showToast(`${categoryName} budget is ${rounded}% used — you're close to the limit.`, "warning", 4500);
}

/**
 * Budget exceeded (spent > limit).
 */
function toastBudgetExceeded(categoryName) {
    showToast(`${categoryName} budget exceeded! Consider adjusting your spending.`, "error", 5000);
}

// ── Spending alerts ───────────────────────────────────────────────────────────

/**
 * High overall spending ratio (≥ 80 % of monthly income spent).
 * @param {number} ratio - decimal (e.g. 0.85 = 85 %)
 */
function toastHighSpending(ratio) {
    const pct = Math.round(ratio * 100);
    showToast(`Heads up — you've used ${pct}% of this month's income.`, "warning", 5000);
}

/**
 * Month-on-month expense increase detected.
 * @param {number} increasePct - positive number, e.g. 15 for +15 %
 */
function toastSpendingIncreased(increasePct) {
    showToast(`Spending is up ${Math.round(increasePct)}% vs. last month.`, "warning", 4500);
}

// ── Notifications ─────────────────────────────────────────────────────────────

/**
 * Notifications failed to load (badge / dropdown unavailable).
 */
function toastNotificationsLoadFailed() {
    showToast("Couldn't load notifications. They'll appear after a refresh.", "error");
}

/**
 * All notifications marked as read.
 */
function toastNotificationsMarkedRead() {
    showToast("All notifications marked as read.", "info", 2400);
}

// ── Profile / session ─────────────────────────────────────────────────────────

/**
 * Profile couldn't be fetched (greeting falls back to "there").
 */
function toastProfileLoadFailed() {
    showToast("Couldn't load your profile. Some features may be limited.", "warning");
}

/**
 * Session expired — user needs to log in again.
 */
function toastSessionExpired() {
    showToast("Your session has expired. Please log in again.", "error", 6000);
}

// ── Categories ────────────────────────────────────────────────────────────────

/**
 * Category list failed to load (affects budget + transaction modals).
 */
function toastCategoriesLoadFailed() {
    showToast("Categories couldn't be loaded. Try refreshing the page.", "error");
}

// ── Generic helpers ───────────────────────────────────────────────────────────

/**
 * Generic network / connectivity error (fallback when action is unknown).
 */
function toastNetworkError() {
    showToast("Network error. Check your connection and try again.", "error");
}

/**
 * Generic "changes saved" confirmation (use for lightweight updates with no dedicated toast).
 */
function toastChangesSaved() {
    showToast("Changes saved successfully.", "success", 2400);
}

function setCurrentMonth() {
    const el = document.getElementById("currentMonth");
    if (!el) return;
    el.textContent = new Date().toLocaleDateString("en-US", {month: "long", year: "numeric"});
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
    const avatar = document.getElementById("topnavAvatar");
    if (!el) return;
    const profile = await apiFetch(API.PROFILE, {headers: {Accept: "application/json"}});
    const fullName = (profile?.name || "").trim();
    const firstName = fullName ? fullName.split(/\s+/)[0] : "there";

    // Build initials for avatar
    const initials = fullName
        ? fullName.trim().split(/\s+/).map(n => n[0].toUpperCase()).join("").slice(0, 2)
        : "";

    el.innerHTML = `${getGreetingByHour()}, ${escapeHtml(firstName)} <span>👋</span>`;

    if (avatar) {
        avatar.classList.remove("skeleton-light");
        avatar.textContent = initials || "?";
    }

    if (!profile) toastProfileLoadFailed();
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

    clearStatSkeletons();

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

    // Fire a toast for the worst-offending budget (only one, to avoid toast spam)
    const worstBudget = budgets
        .slice(0, 4)
        .map(b => {
            const spent = Number(b.spentAmount || 0);
            const limit = Number(b.spendingLimit || 0);
            const pct = limit > 0 ? (spent / limit) * 100 : 0;
            const cat = state.categories.find(c => c.id === b.categoryId);
            return {catName: cat?.name ?? "Budget", pct};
        })
        .sort((a, b) => b.pct - a.pct)[0];

    if (worstBudget) {
        if (worstBudget.pct >= 100) {
            toastBudgetExceeded(worstBudget.catName);
        } else if (worstBudget.pct >= 80) {
            toastBudgetWarning(worstBudget.catName, worstBudget.pct);
        }
    }

    budgetsList.innerHTML = budgets.slice(0, 4).map((budget) => {
        const spent = Number(budget.spentAmount || 0);
        const limit = Number(budget.spendingLimit || 0);
        const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
        const color = pct >= 90 ? "#e84040" : pct >= 70 ? "#f59e0b" : "#2aa96b";
        const cat = state.categories.find(c => c.id === budget.categoryId);
        const catName = cat?.name ?? `Category #${budget.categoryId ?? "N/A"}`;
        return `
      <div class="budget-item">
        <div class="budget-row">
          <span class="budget-name">${catName}</span>
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
        toastHighSpending(ratio);
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
        toastDashboardLoadFailed();
        return;
    }
    state.dashboard = data;
    renderDashboard();
}

async function loadNotifications() {
    const data = await apiFetch(API.NOTIFICATIONS);
    if (!Array.isArray(data)) {
        toastNotificationsLoadFailed();
    }
    state.notifications = Array.isArray(data) ? data : [];
    updateNotifBadge();
}

async function loadCategories() {
    const data = await apiFetch(API.CATEGORIES);
    if (!data) {
        toastCategoriesLoadFailed();
        return;
    }
    state.categories = data;

    const categorySelectTrans = document.getElementById("transactionCategory");
    const categorySelectBudget = document.getElementById("budgetCategory");
    if (!categorySelectTrans) return;
    if (!categorySelectBudget) return;

    categorySelectTrans.innerHTML = data.map(cat =>
        `<option value="${cat.id}">${cat.name}</option>`
    ).join("");

    categorySelectBudget.innerHTML = data.map(cat =>
        `<option value="${cat.id}">${cat.name}</option>`
    ).join("");
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
    await apiFetch(API.MARK_READ(id), {method: "PUT"});
    const target = state.notifications.find((n) => n.id === id);
    if (target) target.read = true;
    updateNotifBadge();
    renderNotificationList();
}

async function markAllRead() {
    const unread = state.notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => markRead(n.id)));
    if (unread.length > 0) toastNotificationsMarkedRead();
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
}

function showAddTransactionModal() {
    // Reset form to default state
    document.getElementById("addTransactionForm").reset();

    // Reset type to INCOME (default)
    document.getElementById("transactionType").value = "INCOME";

    // Set default date to today
    document.getElementById("transactionDate").valueAsDate = new Date();

    // Update form field visibility based on default type (INCOME)
    updateFormFieldsVisibility("INCOME", "add");

    // Show the modal - remove any hidden classes/attributes
    const modal = document.getElementById("addTransactionModal");
    if (modal) {
        modal.removeAttribute("hidden");
        modal.style.display = "flex";
        modal.style.visibility = "visible";
        modal.style.opacity = "1";
        modal.classList.remove("hidden");
        document.body.style.overflow = "hidden";
        console.log("✓ Modal opened");
    }
}

function closeAddTransactionModal() {
    const modal = document.getElementById("addTransactionModal");
    if (modal) {
        modal.style.display = "none";
        modal.style.visibility = "hidden";
        modal.style.opacity = "0";
        document.body.style.overflow = "";
    }
    document.getElementById("addTransactionForm").reset();
}

// Show/hide category and source based on transaction type
function updateFormFieldsVisibility(type, formType) {
    const prefix = formType === "add" ? "" : "edit";
    const categoryInput = document.getElementById(`${prefix}transactionCategory`);
    const sourceInput = document.getElementById(`${prefix}transactionSource`);

    // Check if elements exist before proceeding
    if (!categoryInput || !sourceInput) {
        return;
    }

    // Find the parent form-group containers
    const categoryGroup = categoryInput.closest(".tx-form-group");
    const sourceGroup = sourceInput.closest(".tx-form-group");

    if (!categoryGroup || !sourceGroup) {
        return;
    }

    if (type === "INCOME") {
        // For income: hide category, show source
        categoryGroup.style.display = "none";
        categoryInput.required = false;
        categoryInput.value = "";

        sourceGroup.style.display = "block";
        sourceInput.required = false;
        sourceInput.placeholder = "e.g., Salary, Freelance Work, Investment";
    } else {
        // For expense: show category (required), hide source
        categoryGroup.style.display = "block";
        categoryInput.required = true;

        sourceGroup.style.display = "none";
        sourceInput.required = false;
        sourceInput.value = "";
        sourceInput.placeholder = "";
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
}

function closeAddModal() {
    closeModal("addModal");
}

function openBudgetModal() {
    openModal("budgetModal");
}

function closeBudgetModal() {
    closeModal("budgetModal");
}

async function addTransaction(event) {
    event.preventDefault();
    btnStartLoading("addTransactionBtn");

    const type = document.getElementById("transactionType").value;

    const formData = {
        type: type,
        amount: parseFloat(document.getElementById("transactionAmount").value),
        date: document.getElementById("transactionDate").value,
        categoryId: type === "INCOME" ? null : parseInt(document.getElementById("transactionCategory").value),
        source: type === "INCOME" ? document.getElementById("transactionSource").value : null,
        description: document.getElementById("transactionDescription").value,
    };

    const result = await apiFetch(API.TRANSACTIONS, {
        method: "POST",
        body: JSON.stringify(formData),
    });

    btnStopLoading("addTransactionBtn");

    if (result) {
        closeAddTransactionModal();
        showTxSkeletons(4);  // re-skeleton the list while dashboard refreshes
        await loadDashboardData();
        toastDashboardRefreshed();

        const label = type === "INCOME"
            ? (formData.source || "")
            : (state.categories.find(c => c.id === formData.categoryId)?.name || "");
        toastTransactionAdded(type, formData.amount, label);
    } else {
        toastSaveFailed("add transaction");
    }
}

async function addBudget() {
    btnStartLoading("addBudgetBtn");
    const categoryId = parseInt(document.getElementById("budgetCategory").value);
    const spendingLimit = Number(document.getElementById("budgetAmount")?.value || 0);
    const threshold = Number(document.getElementById("budgetThreshold")?.value || 0);
    const endDate = document.getElementById("budgetEnd")?.value || null;
    const payload = {categoryId, spendingLimit, threshold, endDate};
    const result = await apiFetch(API.BUDGETS, {method: "POST", body: JSON.stringify(payload)});
    btnStopLoading("addBudgetBtn");
    if (result) {
        closeBudgetModal();
        showBudgetSkeletons(3);  // re-skeleton budgets while dashboard refreshes
        await loadDashboardData();
        toastDashboardRefreshed();
        const cat = state.categories.find(c => c.id === categoryId);
        const catName = cat ? cat.name : "Category";
        toastBudgetAdded(catName, spendingLimit);
    } else {
        toastSaveFailed("add budget");
    }
}

// INIT
document.addEventListener("DOMContentLoaded", async () => {
    setCurrentMonth();
    setActiveNav();

    // Show skeleton placeholders immediately — before any fetch completes
    showTxSkeletons(4);
    showBudgetSkeletons(3);
    loaderAdvance();  // step 0 → profile

    const greetingPromise = setGreeting();
    loaderAdvance();  // step 1 → dashboard

    const dashPromise = loadDashboardData();
    loaderAdvance();  // step 2 → categories

    const catPromise = loadCategories();
    loaderAdvance();  // step 3 → notifications

    const notifPromise = loadNotifications();
    loaderAdvance();  // step 4 → almost ready

    await Promise.all([greetingPromise, dashPromise, catPromise, notifPromise]);

    // All data loaded — dismiss the page loader
    loaderHide();

    // Add event listener for transaction type change in modal
    const transactionTypeInput = document.getElementById("transactionType");
    if (transactionTypeInput) {
        transactionTypeInput.addEventListener("change", (e) => {
            updateFormFieldsVisibility(e.target.value, "add");
        });
    }

    // Close modal when clicking on backdrop
    const addTransactionModal = document.getElementById("addTransactionModal");
    if (addTransactionModal) {
        addTransactionModal.addEventListener("click", (e) => {
            if (e.target.id === "addTransactionModal") {
                closeAddTransactionModal();
            }
        });
    }

    ["addModal", "budgetModal"].forEach((id) => {
        const modal = document.getElementById(id);
        if (!modal) return;
        modal.addEventListener("click", function onOverlayClick(event) {
            if (event.target === this) closeModal(id);
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        closeAddTransactionModal();
        if (document.getElementById("addModal")?.classList.contains("is-open")) return closeAddModal();
        if (document.getElementById("budgetModal")?.classList.contains("is-open")) return closeBudgetModal();
        closeNotifications();
    });

    document.addEventListener("click", (event) => {
        const wrapper = document.getElementById("notifWrapper");
        if (wrapper && !wrapper.contains(event.target)) closeNotifications();
    });
    console.log(state.budgets);
});