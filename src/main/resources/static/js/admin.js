'use strict';

const API = {
    PROFILE: '/api/profile',
    STATS: '/api/admin/stats',
    USERS: '/api/admin/users',
    USER: id => `/api/admin/users/${id}`,
    ROLE: id => `/api/admin/users/${id}/role`,
    TRANSACTIONS: id => `/api/admin/users/${id}/transactions`,
};

const state = {
    users: [],
    stats: null,
    selectedUserId: null,
    query: '',
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

function formatMoney(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
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

async function loadProfile() {
    try {
        const profile = await apiFetch(API.PROFILE);
        const name = profile.name || 'Admin';
        document.getElementById('adminGreeting').textContent = `Admin console, ${name}`;
        document.getElementById('adminAvatar').textContent = getInitials(name);
    } catch {
        document.getElementById('adminGreeting').textContent = 'Admin console';
    }
}

async function loadAdminData() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.disabled = true;

    try {
        const [stats, users] = await Promise.all([
            apiFetch(API.STATS),
            apiFetch(API.USERS),
        ]);
        state.stats = stats;
        state.users = users || [];
        renderStats();
        renderUsers();
    } catch (error) {
        showToast('Could not load admin data.');
    } finally {
        if (refreshBtn) refreshBtn.disabled = false;
    }
}

function renderStats() {
    const stats = state.stats || {};
    const cards = [
        ['Users', stats.users],
        ['Admins', stats.admins],
        ['Transactions', stats.transactions],
        ['Budgets', stats.budgets],
        ['Goals', stats.goals],
        ['Categories', stats.categories],
    ];

    document.getElementById('adminStats').innerHTML = cards.map(([label, value]) => `
        <div class="admin-stat">
            <div class="admin-stat__label">${escapeHtml(label)}</div>
            <div class="admin-stat__value">${Number(value || 0)}</div>
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
                <span class="admin-user-name">${escapeHtml(user.name)}</span>
                <span class="admin-user-id">ID ${user.id}</span>
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
        const transactions = await apiFetch(API.TRANSACTIONS(userId));
        renderTransactions(transactions || []);
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
        list.innerHTML = `<div class="admin-detail-empty">No transactions for this user.</div>`;
        return;
    }

    list.innerHTML = transactions.map(tx => {
        const type = String(tx.type || '').toLowerCase();
        const category = tx.categoryName || tx.source || 'Uncategorized';
        return `
            <div class="admin-tx admin-tx--${type}">
                <div class="admin-tx__top">
                    <span>${escapeHtml(category)}</span>
                    <span class="admin-tx__amount">${formatMoney(tx.amount)}</span>
                </div>
                <div class="admin-tx__meta">${escapeHtml(tx.type)} - ${escapeHtml(formatDate(tx.date))}</div>
                ${tx.description ? `<div class="admin-tx__meta">${escapeHtml(tx.description)}</div>` : ''}
            </div>
        `;
    }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    loadAdminData();

    document.getElementById('refreshBtn')?.addEventListener('click', loadAdminData);

    document.getElementById('userSearch')?.addEventListener('input', event => {
        state.query = event.target.value;
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
