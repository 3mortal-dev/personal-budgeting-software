/* ═══════════════════════════════════════════════════════════════
   app.js  –  BudgetWise Profile Page
═══════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────
   IN-MEMORY STATE
───────────────────────────────────────────── */
const state = {
  user: {
    name:     '',
    email:    '',
    initials: '',
    role:     '',
  },
  stats: {
    transactions: 0,
    budgets:      0,
    goals:        0,
  },
  prefs: {
    notifGoals:        true,
    notifTransactions: true,
    currency:          'USD',
  },
  notifications: [],
};

/* ─────────────────────────────────────────────
   CURRENCY META
───────────────────────────────────────────── */
const CURRENCIES = {
  EGP: { flag: '🇪🇬', name: 'Egyptian Pound' },
  USD: { flag: '🇺🇸', name: 'US Dollar'      },
  EUR: { flag: '🇪🇺', name: 'Euro'            },
};

/* ─────────────────────────────────────────────
   INIT
───────────────────────────────────────────── */
async function init() {
  try {
    const response = await fetch('/api/profile', {
      method:  'GET',
      headers: { 'Content-Type': 'application/json' },
      // Cookie sent automatically (HTTP-only)
    });

    if (response.status === 401 || response.status === 403) {
      window.location.href = '/index';
      return;
    }

    if (!response.ok) throw new Error('Failed to load profile');

    const data = await response.json();

    state.user.name          = data.name;
    state.user.email         = data.email;
    state.user.role          = data.role;
    state.user.initials      = getInitials(data.name);
    state.stats.goals        = data.goalsCount        ?? 0;
    state.stats.transactions = data.transactionsCount ?? 0;
    state.stats.budgets      = data.budgetsCount      ?? 0;

    // Load notification preferences from API response if available
    state.prefs.notifGoals        = data.prefs?.notifGoals        ?? true;
    state.prefs.notifTransactions = data.prefs?.notifTransactions ?? true;
    state.prefs.currency          = data.prefs?.currency          ?? 'USD';

    renderAll();
    setGreeting();
    loadNotifications();

  } catch (err) {
    console.error('Failed to load profile:', err);
  }

  // Close currency dropdown on outside click
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('currency-dropdown');
    const trigger  = document.getElementById('currency-trigger');
    if (dropdown && trigger &&
        !dropdown.contains(e.target) && !trigger.contains(e.target)) {
      closeCurrencyDropdown();
    }
  });

  // Close notification dropdown on outside click
  document.addEventListener('click', (e) => {
    const panel   = document.getElementById('notif-panel');
    const notifBtn = document.getElementById('notif-icon-btn');
    if (panel && notifBtn &&
        !panel.contains(e.target) && !notifBtn.contains(e.target)) {
      closeNotifPanel();
    }
  });
}

/* ═══════════════════════════════════════════
   RENDER
═══════════════════════════════════════════ */
function renderAll() {
  const { user, stats, prefs } = state;

  document.getElementById('profile-name').textContent  = user.name;
  document.getElementById('profile-email').textContent = user.email;
  document.getElementById('avatar-main').textContent   = user.initials;
  document.getElementById('topbar-avatar').textContent = user.initials;

  document.getElementById('stat-tx').textContent    = stats.transactions;
  document.getElementById('stat-bud').textContent   = stats.budgets;
  document.getElementById('stat-goals').textContent = stats.goals;

  document.getElementById('notif-goals-toggle').checked        = prefs.notifGoals;
  document.getElementById('notif-transactions-toggle').checked = prefs.notifTransactions;
  setCurrencyDisplay(prefs.currency);

  // Mark the currently active currency option in the dropdown
  document.querySelectorAll('.currency-option').forEach(el => {
    el.classList.toggle('active', el.dataset.value === prefs.currency);
  });
}

function setGreeting() {
  const hour      = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  document.getElementById('greeting').textContent =
    `Good ${timeOfDay}, ${state.user.name.split(' ')[0]} 👋`;
}

/* ═══════════════════════════════════════════
   NOTIFICATIONS PANEL
═══════════════════════════════════════════ */

/**
 * Loads notifications from the backend and renders them.
 *
 * TODO (Backend Integration):
 * Replace the mock data below with a real API call:
 *
 *   const response = await fetch('/api/notifications', {
 *     method: 'GET',
 *     headers: { 'Content-Type': 'application/json' },
 *     // Cookie sent automatically (HTTP-only)
 *   });
 *   const data = await response.json();
 *   // data should be an array of notification objects:
 *   // [{ id, type ('goal'|'transaction'|'alert'), title, message, time, read: bool }]
 *   state.notifications = data;
 *
 * For now, we use mock data to demonstrate the UI.
 */
async function loadNotifications() {
  // MOCK DATA — replace with real fetch above
  state.notifications = [
    {
      id: 1,
      type: 'goal',
      title: 'Goal Achieved 🎯',
      message: 'You reached your "Emergency Fund" savings goal!',
      time: '2 min ago',
      read: false,
    },
    {
      id: 2,
      type: 'transaction',
      title: 'Large Transaction',
      message: 'A payment of $450.00 was made to Amazon.',
      time: '1 hr ago',
      read: false,
    },
    {
      id: 3,
      type: 'transaction',
      title: 'Salary Received',
      message: 'Your monthly salary of $3,200 has been credited.',
      time: '3 hrs ago',
      read: true,
    },
    {
      id: 4,
      type: 'goal',
      title: 'Goal Reminder',
      message: 'You are 80% toward your "Vacation" goal. Keep going!',
      time: 'Yesterday',
      read: true,
    },
  ];

  renderNotifBadge();
}

function renderNotifBadge() {
  const unread = state.notifications.filter(n => !n.read).length;
  const dot    = document.getElementById('notif-dot');
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

/**
 * Marks a single notification as read.
 *
 * TODO (Backend Integration):
 *   await fetch(`/api/notifications/${id}/read`, {
 *     method: 'PATCH',
 *     // Cookie sent automatically (HTTP-only)
 *   });
 */
function markNotifRead(id) {
  const notif = state.notifications.find(n => n.id === id);
  if (notif) notif.read = true;
  renderNotifList();
  renderNotifBadge();
}

/**
 * Marks all notifications as read.
 *
 * TODO (Backend Integration):
 *   await fetch('/api/notifications/read-all', {
 *     method: 'PATCH',
 *     // Cookie sent automatically (HTTP-only)
 *   });
 */
function markAllRead() {
  state.notifications.forEach(n => n.read = true);
  renderNotifList();
  renderNotifBadge();
}

/* ═══════════════════════════════════════════
   AVATAR UPLOAD
═══════════════════════════════════════════ */
function previewAvatar(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const el = document.getElementById('avatar-main');
    el.textContent              = '';
    el.style.backgroundImage    = `url(${e.target.result})`;
    el.style.backgroundSize     = 'cover';
    el.style.backgroundPosition = 'center';
  };
  reader.readAsDataURL(file);
}

/* ═══════════════════════════════════════════
   NOTIFICATIONS PREFERENCES
═══════════════════════════════════════════ */

/**
 * Toggles the "Goals" notification preference.
 *
 * TODO (Backend Integration):
 * Uncomment the fetch below to persist this preference:
 *
 *   await fetch('/api/users/me/preferences', {
 *     method: 'PATCH',
 *     headers: { 'Content-Type': 'application/json' },
 *     // Cookie sent automatically (HTTP-only)
 *     body: JSON.stringify({ notifGoals: enabled }),
 *   }).catch(err => {
 *     // Revert UI on failure
 *     document.getElementById('notif-goals-toggle').checked = !enabled;
 *     state.prefs.notifGoals = !enabled;
 *     console.error('Notification (goals) update failed:', err);
 *   });
 */
function onNotifGoalsChange(enabled) {
  state.prefs.notifGoals = enabled;
  console.log('Goals notifications:', enabled);

  // TODO: persist — see comment above
}

function toggleNotifGoals() {
  const checkbox = document.getElementById('notif-goals-toggle');
  checkbox.checked = !checkbox.checked;
  onNotifGoalsChange(checkbox.checked);
}

/**
 * Toggles the "Transactions" notification preference.
 *
 * TODO (Backend Integration):
 * Uncomment the fetch below to persist this preference:
 *
 *   await fetch('/api/users/me/preferences', {
 *     method: 'PATCH',
 *     headers: { 'Content-Type': 'application/json' },
 *     // Cookie sent automatically (HTTP-only)
 *     body: JSON.stringify({ notifTransactions: enabled }),
 *   }).catch(err => {
 *     // Revert UI on failure
 *     document.getElementById('notif-transactions-toggle').checked = !enabled;
 *     state.prefs.notifTransactions = !enabled;
 *     console.error('Notification (transactions) update failed:', err);
 *   });
 */
function onNotifTransactionsChange(enabled) {
  state.prefs.notifTransactions = enabled;
  console.log('Transactions notifications:', enabled);

  // TODO: persist — see comment above
}

function toggleNotifTransactions() {
  const checkbox = document.getElementById('notif-transactions-toggle');
  checkbox.checked = !checkbox.checked;
  onNotifTransactionsChange(checkbox.checked);
}

/* ═══════════════════════════════════════════
   CURRENCY DROPDOWN
═══════════════════════════════════════════ */
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

/**
 * Selects a currency and optionally persists it to the backend.
 *
 * TODO (Backend Integration):
 * After updating local state, uncomment the fetch below:
 *
 *   await fetch('/api/users/me/preferences', {
 *     method: 'PATCH',
 *     headers: { 'Content-Type': 'application/json' },
 *     // Cookie sent automatically (HTTP-only)
 *     body: JSON.stringify({ currency: value }),
 *   }).catch(err => {
 *     // Revert on failure
 *     const prev = state.prefs.currency;
 *     state.prefs.currency = prev;
 *     setCurrencyDisplay(prev);
 *     console.error('Currency update failed:', err);
 *   });
 *
 * After saving, you also need to re-render any monetary values shown
 * across the dashboard using the new currency symbol / conversion rate.
 * Example:
 *   renderDashboardAmounts(value); // your own function that re-formats amounts
 *
 * If you need live exchange rates, call a rates API first:
 *   const ratesResp = await fetch('/api/exchange-rates?base=USD');
 *   const { rates } = await ratesResp.json();
 *   // rates = { EGP: 48.7, EUR: 0.92, ... }
 *   // Then convert amounts: amount * rates[value]
 */
function selectCurrency(optionEl) {
  const value = optionEl.dataset.value;

  document.querySelectorAll('.currency-option').forEach(el => el.classList.remove('active'));
  optionEl.classList.add('active');

  setCurrencyDisplay(value);
  state.prefs.currency = value;
  closeCurrencyDropdown();

  // TODO: persist to backend — see detailed comment above
}

function setCurrencyDisplay(value) {
  const meta = CURRENCIES[value] || { flag: '', name: value };
  document.getElementById('currency-label').textContent = value;
  document.getElementById('cur-flag').textContent       = meta.flag;
}

/* ═══════════════════════════════════════════
   EDIT MODAL  –  name only
   BUG FIX: Modal now uses the correct CSS classes ('open' not 'is-open')
   and state update only runs after confirmed API success.
═══════════════════════════════════════════ */
function openEditModal() {
  document.getElementById('edit-name').value = state.user.name;

  // FIX: use 'open' class consistently (matching .modal-overlay.open and .modal.open in CSS)
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('edit-modal').classList.add('open');
  document.getElementById('edit-name').focus();
}

function closeEditModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.getElementById('edit-modal').classList.remove('open');
}

async function saveProfile() {
  const name  = document.getElementById('edit-name').value.trim();
  const input = document.getElementById('edit-name');

  if (!name) {
    input.classList.add('error');
    input.focus();
    return;
  }
  input.classList.remove('error');

  const saveBtn = document.querySelector('.btn-save');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving…'; }

  try {
    const response = await fetch('/api/userProfile', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      // Cookie sent automatically (HTTP-only)
      body: JSON.stringify({ name }),
    });

    if (!response.ok) throw new Error('Update failed');

    await response.json();

    // FIX: state is only updated after confirmed API success
    state.user.name     = name;
    state.user.initials = getInitials(name);
    renderAll();
    setGreeting();
    closeEditModal();

  } catch (err) {
    console.error('Profile update failed:', err);
    alert('Failed to save changes. Please try again.');
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save Changes'; }
  }
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function getInitials(fullName) {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

/* ═══════════════════════════════════════════
   LOGOUT
═══════════════════════════════════════════ */
async function handleLogout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      // Cookie sent automatically (HTTP-only)
    });
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    window.location.href = '/login'; // always redirect
  }
}

init();