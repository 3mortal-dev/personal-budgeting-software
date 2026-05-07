// Configure API
const API = {
    BASE_URL: "http://localhost:8080/api",

    PROFILE: "/profile",
    TRANSACTIONS: "/transactions",
    CATEGORIES: "/categories",
    NOTIFICATIONS: "/notifications",
    MARK_ALL_READ: "/notifications/mark-all-read",
    MARK_READ: (id) => `/notifications/${id}/read`,
};

// ── Shared Fetch Helper ───────────────────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem("jwtToken");
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API.BASE_URL}${endpoint}`, {
            headers,
            ...options,
        });

        if (response.status === 204) return null;
        if (!response.ok)
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);

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
    currentFilter: {
        type: "all",
        categoryId: "all",
        dateFrom: "",
        dateTo: "",
    },
};

// Initialize UI
document.addEventListener("DOMContentLoaded", async () => {

    // Start all requests immediately in parallel
    const profilePromise = loadUserProfile();
    const categoriesPromise = loadCategories();
    const transactionsPromise = loadTransactions();

    // Update greeting as soon as profile finishes
    profilePromise.then(() => {
        updateGreeting();
    });

    // Wait for the remaining data
    await Promise.all([
        categoriesPromise,
        transactionsPromise,
    ]);

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
    document.getElementById("editTransactionType").addEventListener("change", (e) => {
        updateFormFieldsVisibility(e.target.value, "edit");
    });
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
    const categoryGroup = categoryInput.closest(".form-group");
    const sourceGroup = sourceInput.closest(".form-group");

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
    }
}

// Transactions
async function loadTransactions() {
    const data = await apiFetch(API.TRANSACTIONS);
    if (data) {
        state.transactions = data;
        renderTransactions();
    }
}

function renderTransactions() {
    const tbody = document.getElementById("transactionsTableBody");
    const filteredTransactions = filterTransactionsData();

    tbody.innerHTML = "";

    if (filteredTransactions.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center" style="padding: 40px; color: var(--text3);">
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
      <td>${transaction.source || "-"}</td>
      <td class="amount ${transaction.type.toLowerCase()}">
        ${transaction.type === "INCOME" ? "+" : "-"}$${transaction.amount.toFixed(2)}
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
        const {type, categoryId, dateFrom, dateTo} = state.currentFilter;

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
        return !(dateTo && transactionDate > new Date(dateTo));


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

    if (result) {
        state.transactions.unshift(result);
        renderTransactions();
        closeAddTransactionModal();
        resetAddTransactionForm();
        showSuccess("Transaction added successfully!");
    }
}

async function updateTransaction(event) {
    event.preventDefault();

    const transactionId = document.getElementById("editTransactionId").value;
    const type = document.getElementById("editTransactionType").value;

    const formData = {
        type: type,
        amount: parseFloat(document.getElementById("editTransactionAmount").value),
        date: document.getElementById("editTransactionDate").value,
        categoryId: type === "INCOME" ? null : parseInt(document.getElementById("editTransactionCategory").value),
        source: type === "INCOME" ? document.getElementById("editTransactionSource").value : null,
        description: document.getElementById("editTransactionDescription").value,
    };

    const result = await apiFetch(`${API.TRANSACTIONS}/${transactionId}`, {
        method: "PUT",
        body: JSON.stringify(formData),
    });

    if (result) {
        const index = state.transactions.findIndex(
            (t) => t.id === parseInt(transactionId),
        );
        if (index !== -1) {
            state.transactions[index] = result;
        }
        renderTransactions();
        closeEditTransactionModal();
        showSuccess("Transaction updated successfully!");
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
        showSuccess("Transaction deleted successfully!");
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
    document.getElementById("editTransactionCategory").value = transaction.categoryId || "";
    document.getElementById("editTransactionSource").value = transaction.source || "";
    document.getElementById("editTransactionDescription").value = transaction.description || "";

    // Update form field visibility based on transaction type BEFORE showing modal
    updateFormFieldsVisibility(transaction.type, "edit");

    // Show the modal
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
    await apiFetch(API.MARK_ALL_READ, {method: "PUT"});
    state.notifications.forEach((n) => (n.read = true));
    updateNotificationBadge();
    // Reload notifications to update UI
    await loadNotifications();
}

// Render UI
function showAddTransactionModal() {
    // Reset form to default state
    document.getElementById("addTransactionForm").reset();

    // Reset type to INCOME (default)
    document.getElementById("transactionType").value = "INCOME";

    // Set default date to today
    document.getElementById("transactionDate").valueAsDate = new Date();

    // Update form field visibility based on default type (INCOME)
    updateFormFieldsVisibility("INCOME", "add");

    // Show the modal
    document.getElementById("addTransactionModal").style.display = "flex";
}

function closeAddTransactionModal() {
    document.getElementById("addTransactionModal").style.display = "none";
    document.getElementById("addTransactionForm").reset();
}

function closeEditTransactionModal() {
    document.getElementById("editTransactionModal").style.display = "none";
    document.getElementById("editTransactionForm").reset();
}

function resetAddTransactionForm() {
    document.getElementById("addTransactionForm").reset();
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
        .filter(name => name.length > 0)
        .map(name => name[0].toUpperCase())
        .join("");

    greeting.innerHTML = `${greetingText}, ${firstName} <span>👋</span>`;

    // Render initials in avatar
    if (avatar) {
        avatar.textContent = initials;
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

function showSuccess(message) {
    // Simple success notification - you could enhance this
    console.log("Success:", message);
}

function showError(message) {
    // Simple error notification
    console.error("Error:", message);
    alert(message);
}
