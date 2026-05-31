'use strict';

const API = {
    PROFILE: '/api/profile',
    STATS: '/api/admin/stats',
    USERS: '/api/admin/users',
    USER: id => `/api/admin/users/${id}`,
    ROLE: id => `/api/admin/users/${id}/role`,
    TRANSACTIONS: id => `/api/admin/users/${id}/transactions`,
    ADD_CATEGORY: '/api/categories/built-in',
    AUDIT_LOGS: '/api/admin/audit-logs',
    LOGOUT: '/api/auth/logout',
};

const state = {
    users: [],
    stats: null,
    selectedUserId: null,
    query: '',
    activeTab: 'users',
    auditLogs: [],
};

async function apiFetch(endpoint, options = {}) {
    const { headers = {}, ...fetchOptions } = options;
    const response = await fetch(endpoint, {
        headers: { 'Content-Type': 'application/json', ...headers },
        credentials: 'include',
        ...fetchOptions,
    });

    if (response.status === 204) return null;
    if (!response.ok) {
        const message = await response.text().catch(() => '');
        throw new Error(message || `HTTP ${response.status}`);
    }
    return response.json();
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatMoney(value, currencyCode) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode || 'USD',
        minimumFractionDigits: 2,
    }).format(Number(value || 0));
}

function formatDate(value) {
    if (!value) return '';
    return new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function getInitials(name = '') {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.trim().slice(0, 2).toUpperCase() || 'A';
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// async function loadProfile() {
//     try {
//         const profile = await apiFetch(API.PROFILE);
//         const name = profile.name || 'Admin';
//         document.getElementById('adminGreeting').textContent = `Admin console, ${name}`;
//         document.getElementById('adminAvatar').textContent = getInitials(name);
//     } catch {
//         document.getElementById('adminGreeting').textContent = 'Admin console';
//     }
// }

async function loadAdminData() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.disabled = true;

    try {
        const [stats, usersPage] = await Promise.all([
            apiFetch(API.STATS),
            apiFetch(API.USERS),
        ]);
        state.stats = stats;
        state.users = usersPage?.content || [];
        renderStats();
        renderUsers();
    } catch (error) {
        showToast('Could not load admin data.');
    } finally {
        if (refreshBtn) refreshBtn.disabled = false;
    }
}

const STAT_ICONS = {
    users: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    admins: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    transactions: '<svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
    budgets: '<svg viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    goals: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    categories: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
};

function renderStats() {
    const stats = state.stats || {};
    const cards = [
        { key: 'users', label: 'Users', value: stats.users },
        { key: 'admins', label: 'Admins', value: stats.admins },
        { key: 'transactions', label: 'Transactions', value: stats.transactions },
        { key: 'budgets', label: 'Budgets', value: stats.budgets },
        { key: 'goals', label: 'Goals', value: stats.goals },
        { key: 'categories', label: 'Categories', value: stats.categories },
    ];

    document.getElementById('adminStats').innerHTML = cards.map(c => `
        <div class="admin-stat">
            <div class="admin-stat__accent admin-stat__accent--${c.key}"></div>
            <div class="admin-stat__icon admin-stat__icon--${c.key}">${STAT_ICONS[c.key]}</div>
            <div class="admin-stat__body">
                <div class="admin-stat__label">${escapeHtml(c.label)}</div>
                <div class="admin-stat__value">${Number(c.value || 0)}</div>
            </div>
        </div>
    `).join('');
}

function getFilteredUsers() {
    const query = state.query.toLowerCase();
    if (!query) return state.users;
    return state.users.filter(user =>
        (user.name || '').toLowerCase().includes(query) ||
        (user.email || '').toLowerCase().includes(query) ||
        String(user.id).includes(query)
    );
}

function renderUsers() {
    const body = document.getElementById('usersTableBody');
    const users = getFilteredUsers();

    if (!users.length) {
        body.innerHTML = `<tr><td colspan="5">No users found.</td></tr>`;
        return;
    }

    body.innerHTML = users.map(user => `
        <tr>
            <td>
                <div class="admin-user-cell">
                    <div class="admin-user-avatar admin-user-avatar--${user.role.toLowerCase()}">${getInitials(user.name)}</div>
                    <div class="admin-user-info">
                        <span class="admin-user-name">${escapeHtml(user.name)}</span>
                        <span class="admin-user-id">ID ${user.id}</span>
                    </div>
                </div>
            </td>
            <td>${escapeHtml(user.email)}</td>
            <td>
                <select class="role-select" data-user-id="${user.id}">
                    <option value="USER" ${user.role === 'USER' ? 'selected' : ''}>User</option>
                    <option value="ADMIN" ${user.role === 'ADMIN' ? 'selected' : ''}>Admin</option>
                </select>
            </td>
            <td>
                <span class="alert-pill ${user.budgetAlertEnabled ? 'alert-pill--on' : 'alert-pill--off'}">B</span>
                <span class="alert-pill ${user.goalProgressAlertEnabled ? 'alert-pill--on' : 'alert-pill--off'}">G</span>
            </td>
            <td>
                <div class="admin-actions">
                    <button class="admin-btn" type="button" data-action="view" data-user-id="${user.id}">Activity</button>
                    <button class="admin-btn admin-btn--danger" type="button" data-action="delete" data-user-id="${user.id}">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function addBuiltInCategory() {
    document.getElementById('newCatName').value = '';
    document.getElementById('catModalOverlay').classList.add('active');
    document.getElementById('categoryModal').classList.add('active');
    document.getElementById('newCatName').focus();
}

function closeCategoryModal() {
    document.getElementById('catModalOverlay').classList.remove('active');
    document.getElementById('categoryModal').classList.remove('active');
}

async function submitBuiltInCategory() {
    const nameInput = document.getElementById('newCatName');
    const name = nameInput.value.trim();
    if (!name) return;

    const btn = document.getElementById('confirmCatBtn');
    btn.disabled = true;

    try {
        await apiFetch(API.ADD_CATEGORY, {
            method: 'POST',
            body: JSON.stringify({ name }),
        });
        showToast('Built-in category added successfully.');
        closeCategoryModal();
        await loadAdminData(); // Refreshes Category count stat
    } catch (error) {
        showToast(error.message || 'Failed to add category.');
    } finally {
        btn.disabled = false;
    }
}

async function updateRole(userId, role) {
    try {
        const updated = await apiFetch(API.ROLE(userId), {
            method: 'PATCH',
            body: JSON.stringify({ role }),
        });
        state.users = state.users.map(user => user.id === userId ? updated : user);
        renderUsers();
        showToast('Role updated.');
    } catch {
        showToast('Could not update role.');
        renderUsers();
    }
}

async function deleteUser(userId) {
    const user = state.users.find(item => item.id === userId);
    const name = user?.name || 'this user';
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;

    try {
        await apiFetch(API.USER(userId), { method: 'DELETE' });
        state.users = state.users.filter(item => item.id !== userId);
        if (state.selectedUserId === userId) clearTransactions();
        await loadAdminData();
        showToast('User deleted.');
    } catch (error) {
        showToast(error.message || 'Could not delete user.');
    }
}

async function viewTransactions(userId) {
    const user = state.users.find(item => item.id === userId);
    state.selectedUserId = userId;
    document.getElementById('detailsTitle').textContent = `${user?.name || 'User'} Activity`;
    document.getElementById('detailEmpty').style.display = 'none';
    document.getElementById('transactionsList').innerHTML = `<div class="admin-detail-empty">Loading transactions...</div>`;

    try {
        const txPage = await apiFetch(API.TRANSACTIONS(userId));
        renderTransactions(txPage?.content || []);
    } catch {
        document.getElementById('transactionsList').innerHTML = `<div class="admin-detail-empty">Could not load transactions.</div>`;
    }
}

function clearTransactions() {
    state.selectedUserId = null;
    document.getElementById('detailsTitle').textContent = 'User Activity';
    document.getElementById('detailEmpty').style.display = '';
    document.getElementById('transactionsList').innerHTML = '';
}

function renderTransactions(transactions) {
    const list = document.getElementById('transactionsList');
    if (!transactions.length) {
        list.innerHTML = `<div class="admin-detail-empty">
            <svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
            No transactions for this user.
        </div>`;
        return;
    }

    list.innerHTML = transactions.map(tx => {
        const type = String(tx.type || '').toLowerCase();
        const category = tx.categoryName || tx.source || 'Uncategorized';
        const txCurrency = tx.currency || 'USD';
        const icon = type === 'income'
            ? '<svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>'
            : '<svg viewBox="0 0 24 24"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>';
        return `
            <div class="admin-tx admin-tx--${type}">
                <div class="admin-tx__row">
                    <div class="admin-tx__icon">${icon}</div>
                    <div style="flex:1;min-width:0">
                        <div class="admin-tx__top">
                            <span>${escapeHtml(category)}</span>
                            <span class="admin-tx__amount">${formatMoney(tx.amount, txCurrency)}</span>
                        </div>
                        <div class="admin-tx__meta">${escapeHtml(tx.type)} - ${escapeHtml(formatDate(tx.date))}</div>
                        ${tx.description ? `<div class="admin-tx__meta">${escapeHtml(tx.description)}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function loadAuditLogs() {
    try {
        const page = await apiFetch(API.AUDIT_LOGS);
        state.auditLogs = page?.content || [];
        renderAuditLogs();
    } catch {
        document.getElementById('auditLogBody').innerHTML = '';
        document.getElementById('auditEmpty').style.display = '';
    }
}

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = Math.max(0, now - then);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + 'm ago';
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + 'h ago';
    const days = Math.floor(hours / 24);
    if (days < 30) return days + 'd ago';
    return formatDate(dateStr);
}

function renderAuditLogs() {
    const body = document.getElementById('auditLogBody');
    const empty = document.getElementById('auditEmpty');
    const logs = state.auditLogs;

    if (!logs.length) {
        body.innerHTML = '';
        if (empty) empty.style.display = '';
        return;
    }

    if (empty) empty.style.display = 'none';

    body.innerHTML = logs.map(log => {
        const actionLabel = log.action
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
        const target = log.targetUserName
            ? `<div class="audit-target">${escapeHtml(log.targetUserName)}<span class="audit-target-email">${escapeHtml(log.targetUserEmail)}</span></div>`
            : '<span class="audit-target" style="color:var(--text3)">—</span>';
        return `
            <tr>
                <td>
                    <span style="font-weight:600;font-size:13px;color:var(--text)">${timeAgo(log.createdAt)}</span>
                    <span class="audit-time">${formatDate(log.createdAt)}</span>
                </td>
                <td>
                    <div class="audit-log-admin">
                        <div class="audit-log-admin__avatar">${getInitials(log.adminName)}</div>
                        <span class="audit-log-admin__name">${escapeHtml(log.adminName)}</span>
                    </div>
                </td>
                <td><span class="audit-action audit-action--${log.action.toLowerCase()}">${escapeHtml(actionLabel)}</span></td>
                <td>${target}</td>
                <td><span class="audit-details" title="${escapeHtml(log.details || '')}">${escapeHtml(log.details || '')}</span></td>
            </tr>
        `;
    }).join('');
}

function switchTab(tab) {
    state.activeTab = tab;
    document.querySelectorAll('.admin-tab').forEach(btn => {
        btn.classList.toggle('admin-tab--active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.admin-tab-content').forEach(el => {
        el.classList.toggle('admin-tab-content--active', el.id === 'tab' + tab.charAt(0).toUpperCase() + tab.slice(1));
    });
    if (tab === 'audit' && !state.auditLogs.length) {
        loadAuditLogs();
    }
}

async function handleLogout() {
    try {
        await apiFetch(API.LOGOUT, {
            method: 'POST',
        });
    } catch (err) {
        console.error('Logout error:', err);
    } finally {
        window.location.href = '/login';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // loadProfile();
	
    loaderInit([
        { pct: 50,  label: "Loading admin data…" },
        { pct: 100, label: "Almost ready…" },
    ]);
    loaderAdvance();

    loadAdminData().finally(() => {
        loaderAdvance();
        loaderHide();
    });

    document.getElementById('refreshBtn')?.addEventListener('click', loadAdminData);

    document.querySelectorAll('.admin-tab').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    document.getElementById('addCategoryBtn')?.addEventListener('click', addBuiltInCategory);

    document.getElementById('userSearch')?.addEventListener('input', event => {
        state.query = event.target.value;
        renderUsers();
    });

    // Navbar search - keep synced with local userSearch input
    document.addEventListener('app-search', (e) => {
        state.query = e.detail.query;
        const localSearch = document.getElementById('userSearch');
        if (localSearch) localSearch.value = e.detail.query;
        renderUsers();
    });

    document.getElementById('usersTableBody')?.addEventListener('change', event => {
        if (!event.target.matches('.role-select')) return;
        updateRole(Number(event.target.dataset.userId), event.target.value);
    });

    document.getElementById('usersTableBody')?.addEventListener('click', event => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const userId = Number(button.dataset.userId);
        if (button.dataset.action === 'view') viewTransactions(userId);
        if (button.dataset.action === 'delete') deleteUser(userId);
    });
});
