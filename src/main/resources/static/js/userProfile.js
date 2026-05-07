/* ═══════════════════════════════════════════════════════════════
   app.js  –  BudgetWise Profile Page
   All state lives in memory. Replace each TODO block with a real
   fetch() call to your backend API.
═══════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────
   IN-MEMORY STATE
   TODO: Remove this object. On init, call
         GET /api/users/me and populate the
         UI from the response instead.
───────────────────────────────────────────── */
const state = {
  user: {
    name:     '',
    email:    '',
    initials: '',
    role : ''
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

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
function init() {

  renderAll();
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

  /* User */
  document.getElementById('profile-name').textContent  = user.name;
  document.getElementById('profile-email').textContent = user.email;
  document.getElementById('avatar-main').textContent   = user.initials;
  document.getElementById('topbar-avatar').textContent = user.initials;

  /* Stats */
  document.getElementById('stat-tx').textContent    = stats.transactions;
  document.getElementById('stat-bud').textContent   = stats.budgets;
  document.getElementById('stat-goals').textContent = stats.goals;

  /* Prefs */
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

  /*
    TODO: Upload to API:

    const formData = new FormData();
    formData.append('file', file);

    fetch('/api/users/me/avatar', {
      method:  'POST',
      headers: { 'Authorization': 'Bearer ' + getAuthToken() },
      body:    formData,
    })
      .then(res => res.json())
      .then(data => { state.user.avatarUrl = data.avatarUrl; })
      .catch(err => console.error('Avatar upload failed:', err));
  */
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
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + getAuthToken(),
      },
      body: JSON.stringify({ notifications: enabled }),
    })
      .catch(err => {
        // Roll back on failure
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
  const isOpen   = dropdown.classList.contains('open');
  isOpen ? closeCurrencyDropdown() : openCurrencyDropdown();
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

  /* Update active state in dropdown */
  document.querySelectorAll('.currency-option').forEach(el => el.classList.remove('active'));
  optionEl.classList.add('active');

  /* Update trigger display */
  setCurrencyDisplay(value);

  /* Update state */
  state.prefs.currency = value;

  /* Close dropdown */
  closeCurrencyDropdown();

  /*
    TODO: Persist to API:

    fetch('/api/users/me/preferences', {
      method:  'PATCH',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + getAuthToken(),
      },
      body: JSON.stringify({ currency: value }),
    })
      .then(() => {
        // Re-format all monetary values across the app
        // e.g. refreshAllAmounts(value);
      })
      .catch(err => console.error('Currency update failed:', err));
  */
}

function setCurrencyDisplay(value) {
  const meta = CURRENCIES[value] || { flag: '', name: value };
  document.getElementById('currency-label').textContent = value;
  document.getElementById('cur-flag').textContent       = meta.flag;
}

/* ═══════════════════════════════════════════
   EDIT MODAL
═══════════════════════════════════════════ */
function openEditModal() {
  /* Pre-fill fields with current state */
  document.getElementById('edit-name').value    = state.user.name;
  document.getElementById('edit-email').value   = state.user.email;
  document.getElementById('edit-password').value = '';

  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('edit-modal').classList.add('open');
  document.getElementById('edit-name').focus();
}

function closeEditModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.getElementById('edit-modal').classList.remove('open');
}

function saveProfile() {
  const name     = document.getElementById('edit-name').value.trim();
  const email    = document.getElementById('edit-email').value.trim();
  const password = document.getElementById('edit-password').value;

  /* Basic validation */
  if (!name)  { alert('Name cannot be empty.');         return; }
  if (!email) { alert('Email cannot be empty.');        return; }
  if (!email.includes('@')) { alert('Invalid email.'); return; }

  /*
    TODO: Send to API:

    const body = { name, email };
    if (password) body.password = password;

    fetch('/api/users/me', {
      method:  'PATCH',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + getAuthToken(),
      },
      body: JSON.stringify(body),
    })
      .then(res => res.json())
      .then(data => {
        // Update state from API response
        state.user.name  = data.user.name;
        state.user.email = data.user.email;
        state.user.initials = data.user.initials || getInitials(data.user.name);
        renderAll();
        setGreeting();
        closeEditModal();
      })
      .catch(err => {
        console.error('Profile update failed:', err);
        alert('Failed to save changes. Please try again.');
      });
  */

  /* --- Local-only update (remove when wired to API) --- */
  state.user.name     = name;
  state.user.email    = email;
  state.user.initials = getInitials(name);
  renderAll();
  setGreeting();
  closeEditModal();
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

function getAuthToken() {
  /*
    TODO: Return the real auth token.
    Read from memory (a module-level variable set at login).
    Never read tokens from localStorage.
  */
  return 'YOUR_TOKEN_HERE';
}

/* ═══════════════════════════════════════════
   LOGOUT
═══════════════════════════════════════════ */
function handleLogout() {
  /*
    TODO: Call logout endpoint, clear token, redirect:

    fetch('/api/auth/logout', {
      method:  'POST',
      headers: { 'Authorization': 'Bearer ' + getAuthToken() },
    })
      .then(() => {
        clearAuthToken();
        window.location.href = '/login';
      })
      .catch(err => console.error('Logout failed:', err));
  */
  alert('Logout → POST /api/auth/logout');
}

/* ─────────────────────────────────────────────
   BOOT
───────────────────────────────────────────── */
init();
setGreeting();