
function apiFetch(url, options = {}) {
    return fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
}


const state = {
    user: {
        name: '',
        email: '',
        initials: '',
        role: '',
    },
    stats: {
        transactions: 0,
        budgets: 0,
        goals: 0,
    },
    prefs: {
        notifGoals: true,
        notifTransactions: true,
        currency: 'USD',
    },
    notifications: [],
};


const CURRENCIES = {
    EGP: {flag: '🇪🇬', name: 'Egyptian Pound'},
    USD: {flag: '🇺🇸', name: 'US Dollar'},
    EUR: {flag: '🇪🇺', name: 'Euro'},
};



async function init() {
    loaderInit([
        {pct: 40, label: "Loading your profile…"},
        {pct: 100, label: "Almost ready…"},
    ]);

    // Stat values in the profile card
    ["stat-tx", "stat-bud", "stat-goals"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = "\u00a0";
            el.classList.add("skeleton-light");
        }
    });
    // Name / email / avatar in the profile card
    const nameEl = document.getElementById("profile-name");
    const emailEl = document.getElementById("profile-email");
    const avatarEl = document.getElementById("avatar-main");
    const topbarEl = document.getElementById("topbar-avatar");
    if (nameEl) {
        nameEl.innerHTML = '<span class="skeleton-greeting" style="width:140px;height:18px;"></span>';
    }
    if (emailEl) {
        emailEl.innerHTML = '<span class="skeleton-greeting" style="width:200px;height:14px;margin-top:4px;"></span>';
    }
    if (avatarEl) {
        avatarEl.classList.add("skeleton-light");
        avatarEl.textContent = "";
    }
    if (topbarEl) {
        topbarEl.classList.add("skeleton-light");
        topbarEl.textContent = "";
    }

    loaderAdvance();

    try {
        const response = await apiFetch('/api/profile', {
            method: 'GET',
        });

        if (response.status === 401 || response.status === 403) {
            window.location.href = '/index';
            return;
        }

        if (!response.ok) throw new Error('Failed to load profile');

        const data = await response.json();

        state.user.name = data.name;
        state.user.email = data.email;
        state.user.role = data.role;
        state.user.initials = getInitials(data.name);
        state.stats.goals = data.goalsCount ?? 0;
        state.stats.transactions = data.transactionsCount ?? 0;
        state.stats.budgets = data.budgetsCount ?? 0;

        state.prefs.notifGoals = data.goalProgressAlertEnabled ?? true;
        state.prefs.notifTransactions = data.budgetAlertEnabled ?? true;
        state.prefs.currency = data.currency ?? 'USD';

        renderAll();
        setGreeting();

        loaderAdvance();

        await loadNotifications();

    } catch (err) {
        console.error('Failed to load profile:', err);
    }

    loaderHide();

    // Close currency dropdown on outside click
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('currency-dropdown');
        const trigger = document.getElementById('currency-trigger');
        if (dropdown && trigger &&
            !dropdown.contains(e.target) && !trigger.contains(e.target)) {
            closeCurrencyDropdown();
        }
    });

    // Close notification panel on outside click
    document.addEventListener('click', (e) => {
        const panel = document.getElementById('notif-panel');
        const notifBtn = document.getElementById('notif-icon-btn');
        if (panel && notifBtn &&
            !panel.contains(e.target) && !notifBtn.contains(e.target)) {
            closeNotifPanel();
        }
    });
}


function renderAll() {
    const {user, stats, prefs} = state;

    // ── Clear every skeleton set during init ──
    ["stat-tx", "stat-bud", "stat-goals"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove("skeleton-light");
    });
    const avatarEl = document.getElementById("avatar-main");
    const topbarEl = document.getElementById("topbar-avatar");
    if (avatarEl) avatarEl.classList.remove("skeleton-light");
    if (topbarEl) topbarEl.classList.remove("skeleton-light");

    document.getElementById('profile-name').textContent = user.name;
    document.getElementById('profile-email').textContent = user.email;
    document.getElementById('avatar-main').textContent = user.initials;
    document.getElementById('topbar-avatar').textContent = user.initials;

    document.getElementById('stat-tx').textContent = stats.transactions;
    document.getElementById('stat-bud').textContent = stats.budgets;
    document.getElementById('stat-goals').textContent = stats.goals;

    document.getElementById('notif-goals-toggle').checked = prefs.notifGoals;
    document.getElementById('notif-transactions-toggle').checked = prefs.notifTransactions;
    setCurrencyDisplay(prefs.currency);

    document.querySelectorAll('.currency-option').forEach(el => {
        el.classList.toggle('active', el.dataset.value === prefs.currency);
    });

    // Restore bank connected state from localStorage (survives page reload)
    restoreBankState();
}

function setGreeting() {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    document.getElementById('greeting').textContent =
        `Good ${timeOfDay}, ${state.user.name.split(' ')[0]} 👋`;
}



async function loadNotifications() {
    try {
        const response = await apiFetch('/notifications/all', {method: 'GET'});
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        // Map backend shape → what renderNotifList() expects, sorted newest first
        state.notifications = [...data]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map(n => ({
                id: n.id,
                type: n.type?.includes('GOAL') ? 'goal' : 'transaction',
                title: formatNotificationType(n.type),
                message: n.message,
                time: formatRelativeTime(n.createdAt),
                read: n.read,
            }));

    } catch (err) {
        console.error('Failed to load notifications:', err);
        state.notifications = [];
    }

    renderNotifBadge();
}

function addCustomCategory() {
    document.getElementById('new-cat-name').value = '';
    document.getElementById('cat-modal-overlay').classList.add('open');
    document.getElementById('category-modal').classList.add('open');
    document.getElementById('new-cat-name').focus();
}

function closeCategoryModal() {
    document.getElementById('cat-modal-overlay').classList.remove('open');
    document.getElementById('category-modal').classList.remove('open');
}

/* ─────────────────────────────────────────────
   BANK INTEGRATION  –  localStorage-persistent
───────────────────────────────────────────── */
const BANK_STORAGE_KEY = 'budgetwise_linked_bank';

function openBankModal() {
    document.getElementById('bank-modal-overlay').classList.add('open');
    document.getElementById('bank-modal').classList.add('open');
}

function closeBankModal() {
    document.getElementById('bank-modal-overlay').classList.remove('open');
    document.getElementById('bank-modal').classList.remove('open');
}

/**
 * Reads localStorage and rebuilds the connected-bank UI row.
 * Called at the end of renderAll() so it runs on every page load.
 */
function restoreBankState() {
    const saved = localStorage.getItem(BANK_STORAGE_KEY);
    if (!saved) return;
    try {
        const { name, flag } = JSON.parse(saved);
        _renderConnectedUI(name, flag);
        _refreshPendingBadge();
    } catch {
        localStorage.removeItem(BANK_STORAGE_KEY);
    }
}

async function simulateBankLink(bankName, flag) {
    closeBankModal();
    showToast(`Redirecting to ${bankName} Secure Login…`, 'info');

    await new Promise(r => setTimeout(r, 1500));

    // Persist so UI survives page reload / navigation
    localStorage.setItem(BANK_STORAGE_KEY, JSON.stringify({ name: bankName, flag }));

    _renderConnectedUI(bankName, flag);
    await _refreshPendingBadge();

    showToast(`${bankName} linked successfully!`, 'success');
}

async function simulateSync() {
    const syncBtn = document.querySelector('#bank-actions .sync-btn');
    if (syncBtn) {
        syncBtn.disabled   = true;
        syncBtn.innerHTML  = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing…';
    }

    showToast('Fetching latest bank transactions…', 'info');

    try {
        const response = await apiFetch('/api/bank/sync', { method: 'POST' });

        // Check ok BEFORE calling .json() to avoid "Sync failed: undefined"
        if (!response.ok) {
            const text = await response.text().catch(() => '');
            throw new Error(text || `Server error ${response.status}`);
        }

        const data = await response.json();

        if (data.count > 0) {
            showToast(`Sync complete! Imported ${data.count} new transaction${data.count === 1 ? '' : 's'}.`, 'success');
        } else {
            showToast('Your account is already up to date.', 'info');
        }

        _setPendingBadge(0);
        await init();

    } catch (err) {
        showToast('Sync failed: ' + err.message, 'error');
        if (syncBtn) {
            syncBtn.disabled  = false;
            syncBtn.innerHTML = '<i class="fa-solid fa-sync"></i> Sync Now';
        }
    }
}

function disconnectBank() {
    localStorage.removeItem(BANK_STORAGE_KEY);
    document.getElementById('bank-status-text').textContent = 'No bank accounts linked yet';
    document.getElementById('bank-actions').innerHTML = `
        <button class="category-add-btn" onclick="openBankModal()">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"
                      stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 10-5.656-5.656l-1.102 1.101"
                      stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Link Bank
        </button>`;
    showToast('Bank account disconnected.', 'info');
}

/* ── Private helpers ── */

function _renderConnectedUI(name, flag) {
    document.getElementById('bank-status-text').innerHTML =
        `<span style="color:var(--brand)">● Connected to ${name} ${flag}</span>`;

    document.getElementById('bank-actions').innerHTML = `
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <span id="pending-badge" style="
                font-size:0.72rem;font-weight:700;
                background:#eff6ff;color:#1d4ed8;
                border:1px solid #bfdbfe;
                padding:2px 8px;border-radius:20px;
                display:none;
            "></span>
            <a href="/bank-simulator" target="_blank"
               style="font-size:0.8rem;color:var(--brand);text-decoration:underline;white-space:nowrap;">
               Open Simulator
            </a>
            <button class="btn-save sync-btn"
                    style="padding:6px 14px;font-size:0.8rem;"
                    onclick="simulateSync()">
                <i class="fa-solid fa-sync"></i> Sync Now
            </button>
            <button class="btn-cancel"
                    style="padding:6px 10px;font-size:0.8rem;"
                    onclick="disconnectBank()">
                Disconnect
            </button>
        </div>`;
}

async function _refreshPendingBadge() {
    try {
        const res = await apiFetch('/api/mock-bank/pending');
        if (!res.ok) return;
        const rows = await res.json();
        _setPendingBadge(rows.length);
    } catch { }
}

function _setPendingBadge(n) {
    const badge = document.getElementById('pending-badge');
    if (!badge) return;
    if (n > 0) {
        badge.textContent   = `${n} pending`;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

async function submitCustomCategory() {
    const name = document.getElementById('new-cat-name').value.trim();
    if (!name) return;

    try {
        const saveBtn = document.getElementById('save-cat-btn');
        saveBtn.disabled = true;

        const response = await apiFetch('/api/categories', {
            method: 'POST',
            body: JSON.stringify({ name: name.trim() }),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to add custom category');
        }

        showToast('Custom category added successfully!');
        closeCategoryModal();
    } catch (err) {
        showToast(err.message || 'Error adding category', 'error');
    } finally {
        document.getElementById('save-cat-btn').disabled = false;
    }
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast show ${type === 'error' ? 'toast--error' : ''}`;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.className = 'toast', 3000);
}

function formatNotificationType(type) {
    switch (type) {
        case 'BUDGET_ALERT':
            return 'Budget Alert';
        case 'GOAL_REACHED':
            return 'Goal Reached 🎯';
        case 'GOAL_REMINDER':
            return 'Goal Reminder';
        default:
            return type ?? 'Notification';
    }
}

function formatRelativeTime(isoString) {
    if (!isoString) return '';
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(isoString).toLocaleDateString();
}

function renderNotifBadge() {
    const unread = state.notifications.filter(n => !n.read).length;
    const dot = document.getElementById('notif-dot');
    if (dot) dot.style.display = unread > 0 ? 'block' : 'none';
}

function toggleNotifPanel(event) {
    event.stopPropagation();
    const panel = document.getElementById('notif-panel');
    if (panel.classList.contains('open')) {
        closeNotifPanel();
    } else {
        openNotifPanel();
    }
}

function openNotifPanel() {
    renderNotifList();
    document.getElementById('notif-panel').classList.add('open');
}

function closeNotifPanel() {
    document.getElementById('notif-panel').classList.remove('open');
}

function renderNotifList() {
    const container = document.getElementById('notif-list');
    if (!container) return;

    if (state.notifications.length === 0) {
        container.innerHTML = `
      <div class="notif-empty-state">
        <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        <p>No notifications yet</p>
      </div>`;
        return;
    }

    container.innerHTML = state.notifications.map(n => {
        const iconSvg = n.type === 'goal'
            ? `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>`
            : `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`;

        const iconClass = n.type === 'goal' ? 'notif-icon-goal' : 'notif-icon-tx';

        return `
      <div class="notif-item ${n.read ? '' : 'unread'}" onclick="markNotifRead(${n.id})">
        <div class="notif-item-icon ${iconClass}">${iconSvg}</div>
        <div class="notif-item-body">
          <div class="notif-item-title">${n.title}</div>
          <div class="notif-item-msg">${n.message}</div>
          <div class="notif-item-time">${n.time}</div>
        </div>
        ${!n.read ? '<div class="notif-unread-dot"></div>' : ''}
      </div>`;
    }).join('');
}

async function markNotifRead(id) {
    const notif = state.notifications.find(n => n.id === id);
    if (!notif || notif.read) return;

    try {
        const response = await apiFetch(`/notifications/${id}/markRead`, {method: 'PUT'});
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        notif.read = true;
    } catch (err) {
        console.error('Failed to mark notification as read:', err);
        return;
    }

    renderNotifList();
    renderNotifBadge();
}

async function markAllRead() {
    const unread = state.notifications.filter(n => !n.read);
    if (!unread.length) return;

    const results = await Promise.all(
        unread.map(n =>
            apiFetch(`/notifications/${n.id}/markRead`, {method: 'PUT'})
                .then(r => r.ok)
                .catch(() => false)
        )
    );

    unread.forEach((n, i) => {
        if (results[i]) n.read = true;
    });

    renderNotifList();
    renderNotifBadge();
}


function previewAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const el = document.getElementById('avatar-main');
        el.textContent = '';
        el.style.backgroundImage = `url(${e.target.result})`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
    };
    reader.readAsDataURL(file);
}


async function onNotifGoalsChange(enabled) {
    state.prefs.notifGoals = enabled;

    try {
        const response = await apiFetch('/api/profile/notifications', {
            method: 'PUT',
            body: JSON.stringify({
                budgetAlerts: state.prefs.notifTransactions,
                goalReminders: enabled,
            }),
        });
        if (!response.ok) throw new Error('Failed');
    } catch (err) {
        state.prefs.notifGoals = !enabled;
        document.getElementById('notif-goals-toggle').checked = !enabled;
        console.error('Goals notification update failed:', err);
    }
}

function toggleNotifGoals() {
    const checkbox = document.getElementById('notif-goals-toggle');
    checkbox.checked = !checkbox.checked;
    onNotifGoalsChange(checkbox.checked);
}

async function onNotifTransactionsChange(enabled) {
    state.prefs.notifTransactions = enabled;

    try {
        const response = await apiFetch('/api/profile/notifications', {
            method: 'PUT',
            body: JSON.stringify({
                budgetAlerts: enabled,
                goalReminders: state.prefs.notifGoals,
            }),
        });
        if (!response.ok) throw new Error('Failed');
    } catch (err) {
        state.prefs.notifTransactions = !enabled;
        document.getElementById('notif-transactions-toggle').checked = !enabled;
        console.error('Transactions notification update failed:', err);
    }
}

function toggleNotifTransactions() {
    const checkbox = document.getElementById('notif-transactions-toggle');
    checkbox.checked = !checkbox.checked;
    onNotifTransactionsChange(checkbox.checked);
}


function toggleCurrencyDropdown(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('currency-dropdown');
    dropdown.classList.contains('open') ? closeCurrencyDropdown() : openCurrencyDropdown();
}

function openCurrencyDropdown() {
    document.getElementById('currency-dropdown').classList.add('open');
    document.getElementById('currency-trigger').classList.add('open');
    document.getElementById('currency-chevron').classList.add('open');
}

function closeCurrencyDropdown() {
    document.getElementById('currency-dropdown').classList.remove('open');
    document.getElementById('currency-trigger').classList.remove('open');
    document.getElementById('currency-chevron').classList.remove('open');
}

function selectCurrency(optionEl) {
    const value = optionEl.dataset.value;

    document.querySelectorAll('.currency-option').forEach(el => el.classList.remove('active'));
    optionEl.classList.add('active');

    setCurrencyDisplay(value);
    state.prefs.currency = value;
    closeCurrencyDropdown();

}

function setCurrencyDisplay(value) {
    const meta = CURRENCIES[value] || {flag: '', name: value};
    document.getElementById('currency-label').textContent = value;
    document.getElementById('cur-flag').textContent = meta.flag;
}


function openEditModal() {
    document.getElementById('edit-name').value = state.user.name;
    document.getElementById('modal-overlay').classList.add('open');
    document.getElementById('edit-modal').classList.add('open');
    document.getElementById('edit-name').focus();
}

function closeEditModal() {
    document.getElementById('modal-overlay').classList.remove('open');
    document.getElementById('edit-modal').classList.remove('open');
}

async function saveProfile() {
    const name = document.getElementById('edit-name').value.trim();
    const input = document.getElementById('edit-name');

    if (!name) {
        input.classList.add('error');
        input.focus();
        return;
    }
    input.classList.remove('error');

    btnStartLoading("saveProfileBtn");

    try {
        const response = await apiFetch('/api/profile', {
            method: 'PUT',
            body: JSON.stringify({name}),
        });

        if (!response.ok) throw new Error('Update failed');

        await response.json();

        state.user.name = name;
        state.user.initials = getInitials(name);
        renderAll();
        setGreeting();
        closeEditModal();

    } catch (err) {
        console.error('Profile update failed:', err);
        alert('Failed to save changes. Please try again.');
    } finally {
        btnStopLoading("saveProfileBtn");
    }
}

document.getElementById('add-custom-category-btn')?.addEventListener('click', addCustomCategory);

function getInitials(fullName) {
    return fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join('');
}


async function handleLogout() {
    try {
        await apiFetch('/api/auth/logout', {
            method: 'POST',
        });
    } catch (err) {
        console.error('Logout error:', err);
    } finally {
        window.location.href = '/login';
    }
}

document.addEventListener("DOMContentLoaded", init);