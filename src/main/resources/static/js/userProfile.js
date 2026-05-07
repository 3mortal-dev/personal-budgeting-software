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
    notifications: true,
    currency:      'USD',
  },
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

    renderAll();
    setGreeting();

  } catch (err) {
    console.error('Failed to load profile:', err);
  }

  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('currency-dropdown');
    const trigger  = document.getElementById('currency-trigger');
    if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
      closeCurrencyDropdown();
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

  document.getElementById('notif-toggle').checked = prefs.notifications;
  setCurrencyDisplay(prefs.currency);
}

function setGreeting() {
  const hour      = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  document.getElementById('greeting').textContent =
    `Good ${timeOfDay}, ${state.user.name.split(' ')[0]} 👋`;
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
   NOTIFICATIONS TOGGLE
═══════════════════════════════════════════ */
function toggleNotif() {
  const checkbox = document.getElementById('notif-toggle');
  checkbox.checked = !checkbox.checked;
  onNotifChange(checkbox.checked);
}

function onNotifChange(enabled) {
  state.prefs.notifications = enabled;

  /*
    TODO: Persist to API:
    fetch('/api/users/me/preferences', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      // Cookie sent automatically (HTTP-only)
      body: JSON.stringify({ notifications: enabled }),
    })
      .catch(err => {
        document.getElementById('notif-toggle').checked = !enabled;
        state.prefs.notifications = !enabled;
        console.error('Notification update failed:', err);
      });
  */
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

function selectCurrency(optionEl) {
  const value = optionEl.dataset.value;

  document.querySelectorAll('.currency-option').forEach(el => el.classList.remove('active'));
  optionEl.classList.add('active');

  setCurrencyDisplay(value);
  state.prefs.currency = value;
  closeCurrencyDropdown();
}

function setCurrencyDisplay(value) {
  const meta = CURRENCIES[value] || { flag: '', name: value };
  document.getElementById('currency-label').textContent = value;
  document.getElementById('cur-flag').textContent       = meta.flag;
}

/* ═══════════════════════════════════════════
   EDIT MODAL  –  name only
═══════════════════════════════════════════ */
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

// FIX: added `async` — function body uses `await`
async function saveProfile() {
  const name = document.getElementById('edit-name').value.trim();

  if (!name) { alert('Name cannot be empty.'); return; }

  try {
    const response = await fetch('/api/userProfile', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      // Cookie sent automatically (HTTP-only)
      body: JSON.stringify({ name }),
    });

    if (!response.ok) throw new Error('Update failed');

    await response.json();

    // FIX: state update only runs after confirmed API success
    state.user.name     = name;
    state.user.initials = getInitials(name);
    renderAll();
    setGreeting();
    closeEditModal();

  } catch (err) {
    console.error('Profile update failed:', err);
    alert('Failed to save changes. Please try again.');
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