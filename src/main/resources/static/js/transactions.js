// Configure API
const API = {
  BASE_URL: "/api",

  PROFILE: "/profile",
  TRANSACTIONS: "/transactions",
  CATEGORIES: "/categories",
  NOTIFICATIONS: "/notifications/all",
  MARK_READ: (id) => `/notifications/${id}/markRead`,
  LOGOUT: "/auth/logout",
};

// Shared Fetch Helper
async function apiFetch(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  try {
    const response = await fetch(`${API.BASE_URL}${endpoint}`, {
      credentials: "include",
      headers,
      ...options,
    });

    if (response.status === 204) return null;
    if (response.status === 401 || response.status === 403) {
      window.location.href = "/login";
      return null;
    }

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`API Error [${endpoint}]: ${response.status}`, errorBody);
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    // Silently fail for API errors - don't spam console
    return null;
  }
}

// State while the user is logged in
const state = {
  user: null,
  transactions: [],
  categories: [],
  notifications: [],
  currency: "USD",
  currentFilter: {
    type: "all",
    categoryId: "all",
    dateFrom: "",
    dateTo: "",
    searchQuery: "",
  },
};

// Initialize UI
document.addEventListener("DOMContentLoaded", async () => {
  // ── Page loader config ──
  loaderInit([
    { pct: 25, label: "Loading your profile…" },
    { pct: 60, label: "Loading categories…" },
    { pct: 85, label: "Fetching transactions…" },
    { pct: 100, label: "Almost ready…" },
  ]);

  // ── Skeleton greeting ──
  const greetingEl = document.getElementById("greeting");
  if (greetingEl)
    greetingEl.innerHTML = '<span class="skeleton-greeting"></span>';

  // ── Skeleton table rows ──
  showTableSkeletons("transactionsTableBody", 8);

  loaderAdvance(); // → profile

  const profilePromise = loadUserProfile();

  // Update greeting as soon as profile resolves
  profilePromise.then(() => updateGreeting());

  loaderAdvance(); // → transactions
  const transactionsPromise = loadTransactions();

  loaderAdvance(); // → categories
  const categoriesPromise = loadCategories();

  await Promise.all([profilePromise, transactionsPromise, categoriesPromise]);

  loaderAdvance(); // → 100 %
  loaderHide();

  setupEventListeners();
});

// Event Listeners

function setupEventListeners() {
  // Modal close on outside click
  document
    .getElementById("addTransactionModal")
    .addEventListener("click", (e) => {
      if (e.target.id === "addTransactionModal") closeAddTransactionModal();
    });

  document
    .getElementById("editTransactionModal")
    .addEventListener("click", (e) => {
      if (e.target.id === "editTransactionModal") closeEditTransactionModal();
    });

  // ESC key to close modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAddTransactionModal();
      closeEditTransactionModal();
    }
  });

  // Handle transaction type change for Add modal
  document.getElementById("transactionType").addEventListener("change", (e) => {
    updateFormFieldsVisibility(e.target.value, "add");
  });

  // Handle transaction type change for Edit modal
  document
    .getElementById("editTransactionType")
    .addEventListener("change", (e) => {
      updateFormFieldsVisibility(e.target.value, "edit");
    });

  // Navbar search
  document.addEventListener("app-search", (e) => {
    state.currentFilter.searchQuery = e.detail.query;
    renderTransactions();
  });
}

// Show/hide category and source based on transaction type
function updateFormFieldsVisibility(type, formType) {
  // Construct IDs with proper camelCase
  const categoryId =
    formType === "add" ? "transactionCategory" : "editTransactionCategory";
  const sourceId =
    formType === "add" ? "transactionSource" : "editTransactionSource";

  const categoryInput = document.getElementById(categoryId);
  const sourceInput = document.getElementById(sourceId);

  // Check if elements exist before proceeding
  if (!categoryInput || !sourceInput) {
    return;
  }

  // Find the parent field-group containers
  const categoryGroup = categoryInput.closest(".field-group");
  const sourceGroup = sourceInput.closest(".field-group");

  if (!categoryGroup || !sourceGroup) {
    return;
  }

  if (type === "INCOME") {
    // For income: hide category, show source (required)
    categoryGroup.style.display = "none";
    categoryInput.required = false;
    categoryInput.value = "";

    sourceGroup.style.display = "block";
    sourceInput.required = true;
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

// User Profile
async function loadUserProfile() {
  const data = await apiFetch(API.PROFILE);
  if (data) {
    state.user = data;
    state.currency = data.currency || "USD";
  }
}

// Transactions
async function loadTransactions() {
  const data = await apiFetch(API.TRANSACTIONS);
  if (data) {
    state.transactions = data;
    renderTransactions();
  } else {
    toastLoadFailed();
  }
}

function renderTransactions() {
  const tbody = document.getElementById("transactionsTableBody");
  const filteredTransactions = filterTransactionsData();

  tbody.innerHTML = "";

  if (filteredTransactions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center" style="padding: 40px; color: var(--text3); text-align: center;">
          No transactions found. <a href="#" onclick="showAddTransactionModal()" style="color: var(--green);">Add your first transaction</a>.
        </td>
      </tr>
    `;
    return;
  }

  filteredTransactions.forEach((transaction) => {
    let detailText;

    // For INCOME: use source; for EXPENSE: use category
    if (transaction.type === "INCOME") {
      detailText = transaction.source || "-";
    } else {
      const category = state.categories.find(
        (c) => c.id === transaction.categoryId,
      );
      detailText = category ? category.name : "Unknown";
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formatDate(transaction.date)}</td>
      <td>
        <span class="type-badge ${transaction.type.toLowerCase()}">
          ${transaction.type}
        </span>
      </td>
      <td>${detailText}</td>
      <td>${transaction.description || "-"}</td>
      <td class="col-source" >${transaction.source || "-"}</td>
      <td class="amount ${transaction.type.toLowerCase()}">
        ${transaction.type === "INCOME" ? "+" : "-"}${formatCurrency(transaction.amount, transaction.currency)}
      </td>
      <td class="actions">
        <button class="btn-icon-small" onclick="editTransaction(${transaction.id})" title="Edit">
          <i class=\"fas fa-edit\"></i>
        </button>
        <button class=\"btn-icon-small\" onclick=\"deleteTransaction(${transaction.id})\" title=\"Delete\">
          <i class=\"fas fa-trash\"></i>
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function filterTransactionsData() {
  return state.transactions.filter((transaction) => {
    const { type, categoryId, dateFrom, dateTo, searchQuery } = state.currentFilter;

    // Type filter
    if (type !== "all" && transaction.type.toLowerCase() !== type) {
      return false;
    }

    // Category filter
    if (
      categoryId !== "all" &&
      transaction.categoryId !== parseInt(categoryId)
    ) {
      return false;
    }

    // Date filters
    const transactionDate = new Date(transaction.date);
    if (dateFrom && transactionDate < new Date(dateFrom)) {
      return false;
    }
    if (dateTo && transactionDate > new Date(dateTo)) {
      return false;
    }

    // Text search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesDescription = (transaction.description || "").toLowerCase().includes(q);
      const matchesSource = (transaction.source || "").toLowerCase().includes(q);
      const matchesType = transaction.type.toLowerCase().includes(q);
      const category = state.categories.find((c) => c.id === transaction.categoryId);
      const matchesCategory = (category?.name || "").toLowerCase().includes(q);
      const matchesAmount = String(transaction.amount).includes(q);
      if (!matchesDescription && !matchesSource && !matchesType && !matchesCategory && !matchesAmount) {
        return false;
      }
    }

    return true;
  });
}

function filterTransactions() {
  state.currentFilter = {
    type: document.getElementById("typeFilter").value,
    categoryId: document.getElementById("categoryFilter").value,
    dateFrom: document.getElementById("dateFrom").value,
    dateTo: document.getElementById("dateTo").value,
  };
  renderTransactions();
}

async function addTransaction(event) {
  event.preventDefault();

  const type = document.getElementById("transactionType").value;
  const amount = parseFloat(document.getElementById("transactionAmount").value);
  const date = document.getElementById("transactionDate").value;
  const categoryId =
    type === "INCOME"
      ? null
      : parseInt(document.getElementById("transactionCategory").value);
  const source =
    type === "INCOME"
      ? document.getElementById("transactionSource").value
      : null;
  const description = document.getElementById("transactionDescription").value;

  document.querySelectorAll("#addTransactionForm .field-error").forEach((el) => (el.textContent = ""));
  let hasError = false;
  if (!amount || isNaN(amount) || amount <= 0) {
    const err = document.getElementById("amountErr");
    if (err) err.textContent = "Enter an amount greater than $0.";
    hasError = true;
  }
  if (!date) {
    const err = document.getElementById("dateErr");
    if (err) err.textContent = "Date is required.";
    hasError = true;
  }
  if (type === "EXPENSE" && (!categoryId || isNaN(categoryId))) {
    const err = document.getElementById("categoryErr");
    if (err) err.textContent = "Select a category.";
    hasError = true;
  }
  if (hasError) return;

  btnStartLoading("addTransactionBtn");

  const formData = { type, amount, date, categoryId, source, description };

  const result = await apiFetch(API.TRANSACTIONS, {
    method: "POST",
    body: JSON.stringify(formData),
  });

  btnStopLoading("addTransactionBtn");

  if (result) {
    state.transactions.unshift(result);
    renderTransactions();
    closeAddTransactionModal();
    resetAddTransactionForm();

    const label =
      type === "INCOME"
        ? formData.source || ""
        : state.categories.find((c) => c.id === formData.categoryId)?.name ||
          "";
    toastTransactionAdded(type, formData.amount, label);
  } else {
    toastSaveFailed("add");
  }
}

async function updateTransaction(event) {
  event.preventDefault();
  btnStartLoading("editTransactionBtn");

  const transactionId = document.getElementById("editTransactionId").value;
  const type = document.getElementById("editTransactionType").value;

  const formData = {
    type: type,
    amount: parseFloat(document.getElementById("editTransactionAmount").value),
    date: document.getElementById("editTransactionDate").value,
    categoryId:
      type === "INCOME"
        ? null
        : parseInt(document.getElementById("editTransactionCategory").value),
    source:
      type === "INCOME"
        ? document.getElementById("editTransactionSource").value
        : null,
    description: document.getElementById("editTransactionDescription").value,
  };

  const result = await apiFetch(`${API.TRANSACTIONS}/${transactionId}`, {
    method: "PUT",
    body: JSON.stringify(formData),
  });

  btnStopLoading("editTransactionBtn");

  if (result) {
    const index = state.transactions.findIndex(
      (t) => t.id === parseInt(transactionId),
    );
    if (index !== -1) {
      state.transactions[index] = result;
    }
    renderTransactions();
    closeEditTransactionModal();
    toastTransactionUpdated(type, formData.amount);
  } else {
    toastSaveFailed("update");
  }
}

async function deleteTransaction(transactionId) {
  if (!confirm("Are you sure you want to delete this transaction?")) {
    return;
  }

  const result = await apiFetch(`${API.TRANSACTIONS}/${transactionId}`, {
    method: "DELETE",
  });

  // Note: apiFetch returns null for a successful 204 No Content response.
  if (result === null) {
    state.transactions = state.transactions.filter(
      (t) => t.id !== transactionId,
    );
    renderTransactions();
    toastTransactionDeleted();
  }
}

function editTransaction(transactionId) {
  const transaction = state.transactions.find((t) => t.id === transactionId);
  if (!transaction) return;

  // Populate form fields
  document.getElementById("editTransactionId").value = transaction.id;
  document.getElementById("editTransactionType").value = transaction.type;
  document.getElementById("editTransactionAmount").value = transaction.amount;
  document.getElementById("editTransactionDate").value = transaction.date;
  document.getElementById("editTransactionCategory").value =
    transaction.categoryId || "";
  document.getElementById("editTransactionSource").value =
    transaction.source || "";
  document.getElementById("editTransactionDescription").value =
    transaction.description || "";

  // Update form field visibility based on transaction type BEFORE showing modal
  updateFormFieldsVisibility(transaction.type, "edit");

  // Show the modal
  document.getElementById("edit-modal-overlay").style.display = "block";
  document.getElementById("editTransactionModal").style.display = "flex";
}

// Categories
async function loadCategories() {
  const data = await apiFetch(API.CATEGORIES);
  if (data) {
    state.categories = data;
    populateCategoryFilters();
  }
}

function populateCategoryFilters() {
  const categoryFilter = document.getElementById("categoryFilter");
  const transactionCategory = document.getElementById("transactionCategory");
  const editTransactionCategory = document.getElementById(
    "editTransactionCategory",
  );

  // Clear existing options except "All Categories"
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  transactionCategory.innerHTML = "";
  editTransactionCategory.innerHTML = "";

  state.categories.forEach((category) => {
    // Filter dropdown
    const filterOption = document.createElement("option");
    filterOption.value = category.id;
    filterOption.textContent = category.name;
    categoryFilter.appendChild(filterOption);

    // Add/Edit form dropdowns
    const addOption = document.createElement("option");
    addOption.value = category.id;
    addOption.textContent = category.name;
    transactionCategory.appendChild(addOption);

    const editOption = document.createElement("option");
    editOption.value = category.id;
    editOption.textContent = category.name;
    editTransactionCategory.appendChild(editOption);
  });
}

// Notifications
async function loadNotifications() {
  const data = await apiFetch(API.NOTIFICATIONS);
  if (data) {
    state.notifications = data;
    updateNotificationBadge();
  }
}

function updateNotificationBadge() {
  const badge = document.getElementById("notifBadge");
  const unreadCount = state.notifications.filter((n) => !n.read).length;

  if (unreadCount > 0) {
    badge.textContent = unreadCount > 99 ? "99+" : unreadCount;
    badge.style.display = "flex";
  } else {
    badge.style.display = "none";
  }
}

function toggleNotifications() {
  const dropdown = document.getElementById("notifDropdown");
  dropdown.style.display =
    dropdown.style.display === "block" ? "none" : "block";
}

async function markAllRead() {
  const unread = state.notifications.filter((n) => !n.read);
  await Promise.all(
    unread.map((n) =>
      apiFetch(API.MARK_READ(n.id), { method: "PUT" }),
    ),
  );
  unread.forEach((n) => (n.read = true));
  updateNotificationBadge();
}

// Render UI
function showAddTransactionModal() {
  const modal = document.getElementById("addTransactionModal");
  const overlay = document.getElementById("add-modal-overlay");
  const form = document.getElementById("addTransactionForm");

  if (overlay) overlay.style.display = "block";
  if (modal) modal.style.display = "flex";

  // Reset form to default state
  if (form) form.reset();

  // Reset type to INCOME (default)
  document.getElementById("transactionType").value = "INCOME";

  // Set default date to today
  document.getElementById("transactionDate").valueAsDate = new Date();

  // Update form field visibility based on default type (INCOME)
  updateFormFieldsVisibility("INCOME", "add");
}

function closeAddTransactionModal() {
  document.getElementById("add-modal-overlay").style.display = "none";
  document.getElementById("addTransactionModal").style.display = "none";
  const form = document.getElementById("addTransactionForm");
  if (form) form.reset();
}

function closeEditTransactionModal() {
  document.getElementById("edit-modal-overlay").style.display = "none";
  document.getElementById("editTransactionModal").style.display = "none";
  const form = document.getElementById("editTransactionForm");
  if (form) form.reset();
}

function resetAddTransactionForm() {
  const form = document.getElementById("addTransactionForm");
  if (form) form.reset();
}

function updateGreeting() {
  const greeting = document.getElementById("greeting");
  const avatar = document.querySelector(".avatar");

  if (!greeting || !state.user) return;

  const hour = new Date().getHours();
  let greetingText = "Good morning";

  if (hour >= 12 && hour < 17) {
    greetingText = "Good afternoon";
  } else if (hour >= 17) {
    greetingText = "Good evening";
  }

  const fullName = state.user.name || "";

  // First name for greeting
  const firstName = fullName.split(" ")[0] || "";

  // Initials generation
  const initials = fullName
    .trim()
    .split(" ")
    .filter((name) => name.length > 0)
    .map((name) => name[0].toUpperCase())
    .join("");

  greeting.innerHTML = `${greetingText}, ${firstName} <span>👋</span>`;

  // Render initials in avatar
  if (avatar) {
    avatar.textContent = initials;
  }
}

async function handleLogout() {
  try {
    await apiFetch(API.LOGOUT, {
      method: "POST",
    });
  } catch (err) {
    console.error("Logout error:", err);
  } finally {
    window.location.href = "/login";
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  TOAST NOTIFICATIONS                                         ║
// ╚══════════════════════════════════════════════════════════════╝

let toastTimer;

/**
 * Core toast engine — matches goal.js pattern.
 * @param {string} msg   - Message text
 * @param {'success'|'error'|'info'|'warning'} type
 * @param {number}  [duration=3200]
 */
function showToast(msg, type = "success", duration = 3200) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  // Swap content and class atomically so re-triggers feel snappy
  clearTimeout(toastTimer);
  toast.classList.remove("show");

  // Allow the browser to repaint the hidden state before re-showing
  requestAnimationFrame(() => {
    toast.innerHTML = `<span class="toast__icon">${TOAST_ICONS[type] ?? TOAST_ICONS.info}</span>
                           <span class="toast__msg">${escapeToast(msg)}</span>`;
    toast.className = `toast toast--${type} show`;
    toastTimer = setTimeout(() => toast.classList.remove("show"), duration);
  });
}

/** Icon set for each toast type (inline SVG — no extra network request) */
const TOAST_ICONS = {
  success: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="8.5"/><polyline points="6.5,10.5 9,13 13.5,7.5"/></svg>`,
  error: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="8.5"/><line x1="7" y1="7" x2="13" y2="13"/><line x1="13" y1="7" x2="7" y2="13"/></svg>`,
  warning: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2.5L18 17H2L10 2.5Z"/><line x1="10" y1="8" x2="10" y2="12"/><circle cx="10" cy="15" r="0.8" fill="currentColor"/></svg>`,
  info: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="8.5"/><line x1="10" y1="9" x2="10" y2="14"/><circle cx="10" cy="6.5" r="0.8" fill="currentColor"/></svg>`,
};

/** Minimal HTML-escape for toast content */
function escapeToast(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ── Contextual wrappers used throughout the file ──────────────────────────────

function showSuccess(message) {
  showToast(message, "success");
}

function showError(message) {
  showToast(message, "error");
}

// ── Per-action contextual messages ───────────────────────────────────────────

/**
 * Called after a transaction is successfully created.
 * Gives a tailored message based on type, amount, and category/source.
 */
function toastTransactionAdded(type, amount, label) {
  const sign = type === "INCOME" ? "+" : "−";
  const money = formatCurrency(amount, state.currency);
  const detail = label ? ` · ${label}` : "";
  const verb = type === "INCOME" ? "Income recorded" : "Expense logged";
  showToast(`${verb}: ${sign}${money}${detail}`, "success");
}

/**
 * Called after a transaction is successfully updated.
 */
function toastTransactionUpdated(type, amount) {
  const sign = type === "INCOME" ? "+" : "−";
  const money = formatCurrency(amount, state.currency);
  showToast(`Transaction updated — ${sign}${money}`, "success");
}

/**
 * Called after a transaction is deleted.
 */
function toastTransactionDeleted() {
  showToast("Transaction deleted.", "info");
}

/**
 * Called when an API write fails (add / update).
 */
function toastSaveFailed(action = "save") {
  showToast(
    `Couldn't ${action} transaction. Check your connection and try again.`,
    "error",
  );
}

/**
 * Called when the transaction list fails to load.
 */
function toastLoadFailed() {
  showToast("Failed to load transactions. Please refresh the page.", "error");
}

/** Format currency without the Intl overhead for toast strings */
function formatCurrency(amount, currencyCode) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode || state.currency || "USD",
    minimumFractionDigits: 2,
  }).format(amount ?? 0);
}
