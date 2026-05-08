'use strict';

/* ═══════════════════════════════════════════════════
   CONFIG
   ═══════════════════════════════════════════════════ */
const API_BASE   = '/api/goals';
const NOTIF_BASE = '/api/notifications';

/* ═══════════════════════════════════════════════════
   CSRF
   1. <meta name="_csrf">  (Thymeleaf / HttpSessionCsrfTokenRepository)
   2. XSRF-TOKEN cookie    (CookieCsrfTokenRepository.withHttpOnlyFalse())
   ═══════════════════════════════════════════════════ */
function getCsrfToken() {
  const metaVal = document.querySelector('meta[name="_csrf"]')?.content;
  if (metaVal) return metaVal;
  const row = document.cookie.split('; ').find(r => r.startsWith('XSRF-TOKEN='));
  return row ? decodeURIComponent(row.split('=')[1]) : '';
}
function getCsrfHeader() {
  return document.querySelector('meta[name="_csrf_header"]')?.content || 'X-XSRF-TOKEN';
}
function csrfHeaders(extra = {}) {
  const h = { ...extra };
  const t = getCsrfToken();
  if (t) h[getCsrfHeader()] = t;
  return h;
}

/* ═══════════════════════════════════════════════════
   USERNAME
   Spring Security does NOT set a username cookie.
   We fetch /api/profile (already used by the profile page)
   to get the display name, then populate the topbar.
   ═══════════════════════════════════════════════════ */
async function applyUsername() {
  const usernameEl = document.getElementById('topbarUsername');
  const avatarEl   = document.getElementById('topbarAvatar');
  try {
    const res = await fetch('/api/profile', { headers: { Accept: 'application/json' } });
    if (!res.ok) return;
    const data = await res.json();
    const name = data.name || data.username || '';
    if (usernameEl) usernameEl.textContent = name;
    if (avatarEl) {
      const parts    = name.split(' ').filter(Boolean);
      const initials = parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase();
      avatarEl.textContent = initials || 'U';
    }
  } catch { /* topbar shows fallback values */ }
}

/* ═══════════════════════════════════════════════════
   ICON CATALOGUE
   ═══════════════════════════════════════════════════ */
const ICON_PRESETS = [
  'fa-bullseye','fa-house','fa-car','fa-plane',
  'fa-graduation-cap','fa-heart','fa-star','fa-piggy-bank',
  'fa-laptop','fa-mobile-screen','fa-dumbbell','fa-bicycle',
  'fa-book','fa-music','fa-camera','fa-utensils',
  'fa-umbrella-beach','fa-baby-carriage','fa-ring','fa-seedling',
  'fa-tooth','fa-shirt','fa-gem','fa-gamepad',
  'fa-palette','fa-dog','fa-cat','fa-building',
  'fa-bolt','fa-briefcase','fa-wallet','fa-chart-line',
  'fa-globe','fa-mountain-sun','fa-stethoscope','fa-wrench',
  'fa-paint-roller','fa-couch','fa-tv','fa-trophy',
  'fa-fire','fa-clock','fa-shield-halved','fa-sun',
  'fa-snowflake','fa-spa','fa-guitar','fa-rocket',
  'fa-sack-dollar','fa-coins','fa-landmark','fa-tree',
];

const COLOR_HEX = {
  green:  '#16a34a', blue:   '#2563eb', red:    '#dc2626',
  yellow: '#ca8a04', purple: '#7c3aed', pink:   '#db2777',
  orange: '#ea580c', gray:   '#4b5563',
};

/* ═══════════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════════ */
let goals          = [];
let notifications  = [];
let deleteTargetId = null;
let activeNotifTab = 'all';

/* ═══════════════════════════════════════════════════
   DOM REFS
   ═══════════════════════════════════════════════════ */
const goalsGrid           = document.getElementById('goalsGrid');
const emptyState          = document.getElementById('emptyState');
const activeGoalsCount    = document.getElementById('activeGoalsCount');
const totalSavedEl        = document.getElementById('totalSaved');
const targetAmountSummary = document.getElementById('targetAmountSummary');

const modalOverlay       = document.getElementById('modalOverlay');
const modalTitle         = document.getElementById('modalTitle');
const goalForm           = document.getElementById('goalForm');
const goalIdInput        = document.getElementById('goalId');
const goalNameInput      = document.getElementById('goalName');
const savedAmountInput   = document.getElementById('savedAmount');
const targetAmountInput  = document.getElementById('targetAmountInput');
const deadlineInput      = document.getElementById('deadline');
const selectedIconInput  = document.getElementById('selectedIcon');
const selectedColorInput = document.getElementById('selectedColor');

const iconGrid           = document.getElementById('iconGrid');
const iconManualInput    = document.getElementById('iconManualInput');
const iconManualApplyBtn = document.getElementById('iconManualApplyBtn');
const iconPreviewEl      = document.getElementById('iconPreviewEl');
const iconPreviewWrap    = document.getElementById('iconPreviewWrap');
const iconPreviewLabel   = document.getElementById('iconPreviewLabel');
const colorSwatches      = document.getElementById('colorSwatches');

const deleteOverlay    = document.getElementById('deleteOverlay');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn  = document.getElementById('cancelDeleteBtn');

const bellBtn        = document.getElementById('bellBtn');
const notifDropdown  = document.getElementById('notifDropdown');
const notifBadge     = document.getElementById('notifBadge');
const notifListEl    = document.getElementById('notifList');
const markAllReadBtn = document.getElementById('markAllReadBtn');

const toast       = document.getElementById('toast');
const searchInput = document.getElementById('searchInput');

/* ═══════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  applyUsername();
  initIconPicker();
  attachEventListeners();
  initNotifications();
  loadGoals(false);
});

/* ═══════════════════════════════════════════════════
   EVENT LISTENERS
   ═══════════════════════════════════════════════════ */
function attachEventListeners() {
  document.getElementById('openModalBtn')?.addEventListener('click', openAddModal);
  document.getElementById('closeModalBtn')?.addEventListener('click', closeModal);
  document.getElementById('cancelModalBtn')?.addEventListener('click', closeModal);
  modalOverlay?.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

  goalForm?.addEventListener('submit', handleFormSubmit);

  confirmDeleteBtn?.addEventListener('click', confirmDelete);
  cancelDeleteBtn?.addEventListener('click', closeDeleteModal);
  deleteOverlay?.addEventListener('click', e => { if (e.target === deleteOverlay) closeDeleteModal(); });

  searchInput?.addEventListener('input', handleSearch);

  bellBtn?.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = notifDropdown.classList.toggle('is-open');
    if (isOpen) loadNotifications();
  });
  document.addEventListener('click', e => {
    if (bellBtn && notifDropdown &&
        !bellBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
      notifDropdown.classList.remove('is-open');
    }
  });

  document.querySelectorAll('.notif-tab').forEach(tab =>
    tab.addEventListener('click', () => {
      document.querySelectorAll('.notif-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeNotifTab = tab.dataset.tab;
      renderNotifList();
    })
  );
  markAllReadBtn?.addEventListener('click', markAllNotificationsRead);
}

/* ═══════════════════════════════════════════════════
   ICON PICKER
   ═══════════════════════════════════════════════════ */
function initIconPicker() {
  if (!iconGrid) return;
  buildIconGrid();
  iconManualApplyBtn?.addEventListener('click', applyManualIcon);
  if (iconManualInput) {
    iconManualInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); applyManualIcon(); }
    });
    iconManualInput.addEventListener('input', () => {
      let raw = iconManualInput.value.trim();
      if (!raw) return;
      if (!raw.startsWith('fa-')) raw = 'fa-' + raw;
      previewIcon(raw);
    });
  }
  colorSwatches?.querySelectorAll('.color-swatch').forEach(btn =>
    btn.addEventListener('click', () => selectColor(btn.dataset.color))
  );
  applyIcon('fa-bullseye');
  selectColor('green');
}

function buildIconGrid() {
  if (!iconGrid) return;
  iconGrid.innerHTML = '';
  const current = selectedIconInput?.value || '';
  ICON_PRESETS.forEach(icon => {
    const btn        = document.createElement('button');
    btn.type         = 'button';
    btn.className    = 'icon-grid-btn' + (icon === current ? ' selected' : '');
    btn.dataset.icon = icon;
    btn.title        = icon.replace('fa-', '');
    btn.innerHTML    = `<i class="fa-solid ${icon}"></i>`;
    btn.addEventListener('click', () => applyIcon(icon));
    iconGrid.appendChild(btn);
  });
}

function previewIcon(cls) {
  if (iconPreviewEl)    iconPreviewEl.className    = `fa-solid ${cls}`;
  if (iconPreviewLabel) iconPreviewLabel.textContent = cls;
}

function applyIcon(cls) {
  if (!cls) return;
  if (!cls.startsWith('fa-')) cls = 'fa-' + cls;
  if (selectedIconInput) selectedIconInput.value = cls;
  previewIcon(cls);
  iconGrid?.querySelectorAll('.icon-grid-btn').forEach(b =>
    b.classList.toggle('selected', b.dataset.icon === cls)
  );
  if (iconManualInput) iconManualInput.value = '';
}

function applyManualIcon() {
  let raw = iconManualInput?.value.trim();
  if (!raw) return;
  if (!raw.startsWith('fa-')) raw = 'fa-' + raw;
  applyIcon(raw);
}

function selectColor(color) {
  if (selectedColorInput) selectedColorInput.value = color;
  colorSwatches?.querySelectorAll('.color-swatch').forEach(b =>
    b.classList.toggle('selected', b.dataset.color === color)
  );
  const hex = COLOR_HEX[color] || '#16a34a';
  if (iconPreviewWrap) {
    iconPreviewWrap.style.background = hex + '22';
    iconPreviewWrap.style.border     = `1.5px solid ${hex}66`;
  }
  if (iconPreviewEl) iconPreviewEl.style.color = hex;
}

function resetIconPicker() {
  if (iconManualInput) iconManualInput.value = '';
  applyIcon('fa-bullseye');
  selectColor('green');
  buildIconGrid();
}

function loadIconPickerForEdit(iconClass, iconColor) {
  if (iconManualInput) iconManualInput.value = '';
  applyIcon(iconClass || 'fa-bullseye');
  selectColor(iconColor || 'green');
  buildIconGrid();
}

/* ═══════════════════════════════════════════════════
   NOTIFICATIONS
   ═══════════════════════════════════════════════════ */
function initNotifications() { loadNotifications(); }

async function loadNotifications() {
  try {
    const res = await fetch(NOTIF_BASE, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error();
    notifications = await res.json();
  } catch {
    notifications = [];
  }
  renderNotifList();
  updateNotifBadge();
}

function renderNotifList() {
  if (!notifListEl) return;
  let list = [...notifications];
  if (activeNotifTab === 'unread') list = list.filter(n => !n.read);
  else if (activeNotifTab === 'goals')  list = list.filter(n => n.type === 'goal');
  else if (activeNotifTab === 'budget') list = list.filter(n => n.type === 'budget');
  if (!list.length) {
    notifListEl.innerHTML = `
      <div class="notif-empty">
        <i class="fa-regular fa-bell-slash"></i>
        <p>No notifications here</p>
      </div>`;
    return;
  }
  notifListEl.innerHTML = list.map(buildNotifItem).join('');
  notifListEl.querySelectorAll('.notif-item[data-id]').forEach(el =>
    el.addEventListener('click', () => markNotificationRead(+el.dataset.id))
  );
}

function buildNotifItem(n) {
  const { cls, icon } = notifIconFor(n.type);
  return `
    <div class="notif-item ${!n.read ? 'notif-item--unread' : ''}" data-id="${n.id}">
      <div class="notif-icon ${cls}"><i class="fa-solid ${icon}"></i></div>
      <div class="notif-body">
        <p class="notif-msg">${escapeHtml(n.message || '')}</p>
        <p class="notif-time">${formatNotifTime(n.createdAt || n.timestamp)}</p>
      </div>
      ${!n.read ? '<div class="notif-dot"></div>' : ''}
    </div>`;
}

function notifIconFor(type) {
  if (type === 'goal')   return { cls: 'notif-icon--goal',   icon: 'fa-bullseye' };
  if (type === 'budget') return { cls: 'notif-icon--budget', icon: 'fa-chart-pie' };
  if (type === 'warn')   return { cls: 'notif-icon--warn',   icon: 'fa-triangle-exclamation' };
  return                        { cls: 'notif-icon--info',   icon: 'fa-circle-info' };
}

function updateNotifBadge() {
  if (!notifBadge) return;
  const unread = notifications.filter(n => !n.read).length;
  notifBadge.textContent   = unread > 99 ? '99+' : unread;
  notifBadge.style.display = unread > 0 ? 'flex' : 'none';
}

async function markNotificationRead(id) {
  const notif = notifications.find(n => n.id === id);
  if (!notif || notif.read) return;
  try {
    await fetch(`${NOTIF_BASE}/${id}/read`, { method: 'PATCH', headers: csrfHeaders() });
  } catch { /* optimistic */ }
  notif.read = true;
  renderNotifList();
  updateNotifBadge();
}

async function markAllNotificationsRead() {
  try {
    await fetch(`${NOTIF_BASE}/read-all`, { method: 'PATCH', headers: csrfHeaders() });
  } catch { /* optimistic */ }
  notifications.forEach(n => (n.read = true));
  renderNotifList();
  updateNotifBadge();
  showToast('All notifications marked as read', 'success');
}

/* ═══════════════════════════════════════════════════
   API — GOALS
   ═══════════════════════════════════════════════════ */
async function loadGoals(silent = false) {
  try {
    const res = await fetch(`${API_BASE}/user`, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    goals = (await res.json()).map(normalizeGoal);
    if (!silent) renderGoals(goals);
    updateSummary();
  } catch (err) {
    console.error('Failed to load goals:', err);
    if (!silent) showToast('Failed to load goals.', 'error');
  }
}

/*
  normalizeGoal — maps server field names to what the UI expects.

  GoalResponse sends:
    name         (= goal.getGoalName())
    savedAmount  (= goal.getCurrentAmount())
    completed    (= status == EXCEEDED || savedAmount >= targetAmount)
    status, iconClass, iconColor — all correct field names
*/
function normalizeGoal(g) {
  return {
    ...g,
    name:        g.name        || g.goalName     || '',
    savedAmount: g.savedAmount ?? g.currentAmount ?? 0,
    completed:   g.completed
                 || g.status === 'EXCEEDED'
                 || (g.targetAmount > 0 && (g.savedAmount ?? 0) >= g.targetAmount),
  };
}

async function saveGoal(payload) {
  const isEdit = !!payload.id;
  const res = await fetch(
    isEdit ? `${API_BASE}/${payload.id}` : API_BASE,
    {
      method:  isEdit ? 'PUT' : 'POST',
      headers: csrfHeaders({ 'Content-Type': 'application/json' }),
      body:    JSON.stringify(payload),
    }
  );
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}${msg ? ': ' + msg : ''}`);
  }
  return res.json();
}

async function deleteGoalById(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method:  'DELETE',
    headers: csrfHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

async function fetchGoalById(id) {
  const cached = goals.find(g => g.id === id);
  if (cached && cached.name) return cached;
  const res = await fetch(`${API_BASE}/user`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  goals = (await res.json()).map(normalizeGoal);
  const found = goals.find(g => g.id === id);
  if (!found) throw new Error(`Goal ${id} not found`);
  return found;
}

/* ═══════════════════════════════════════════════════
   RENDER — GOALS
   ═══════════════════════════════════════════════════ */
function renderGoals(list) {
  goalsGrid.innerHTML = '';
  emptyState.style.display = (!list || !list.length) ? 'block' : 'none';
  if (!list || !list.length) return;
  list.forEach((goal, idx) => {
    const card = buildGoalCard(goal);
    card.style.animationDelay = `${idx * 0.07}s`;
    goalsGrid.appendChild(card);
  });
}

function buildGoalCard(goal) {
  const saved     = goal.savedAmount  ?? 0;
  const target    = goal.targetAmount ?? 1;
  const pct       = Math.min(100, Math.round((saved / target) * 100));
  const left      = Math.max(0, target - saved);
  const completed = goal.completed || pct >= 100;

  const card = document.createElement('div');
  card.className  = `goal-card${completed ? ' goal-card--completed' : ''}`;
  card.dataset.id = goal.id;

  card.innerHTML = `
    <div class="goal-card__header">
      <div class="goal-card__icon-wrap goal-card__icon-wrap--${goal.iconColor || 'green'}">
        <i class="fa-solid ${goal.iconClass || 'fa-bullseye'}"></i>
      </div>
      <div class="goal-card__info">
        <h3 class="goal-card__name">${escapeHtml(goal.name || '')}</h3>
        <p class="goal-card__deadline">
          ${completed ? 'Completed 🎉' : 'Deadline: ' + formatDeadline(goal.deadline)}
        </p>
      </div>
      ${completed
        ? `<span class="badge-completed"><i class="fa-solid fa-circle-check"></i> Completed</span>`
        : ''}
    </div>
    <div class="goal-card__amounts">
      <span class="goal-card__saved">${formatMoney(saved)}</span>
      <span class="goal-card__sep">/</span>
      <span class="goal-card__target">${formatMoney(target)}</span>
      <span class="goal-card__pct">${pct}%</span>
    </div>
    <div class="progress-track">
      <div class="progress-fill${completed ? ' progress-fill--completed' : ''}" style="width:0%"></div>
    </div>
    ${!completed ? `<p class="goal-card__left">${formatMoney(left)} left</p>` : ''}
    <div class="goal-card__actions">
      <button class="btn-icon btn-icon--edit"   title="Edit"   aria-label="Edit goal">
        <i class="fa-solid fa-pen"></i>
      </button>
      <button class="btn-icon btn-icon--delete" title="Delete" aria-label="Delete goal">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>`;

  card.querySelector('.btn-icon--edit').addEventListener('click',   () => openEditModal(goal.id));
  card.querySelector('.btn-icon--delete').addEventListener('click', () => openDeleteModal(goal.id));

  requestAnimationFrame(() =>
    setTimeout(() => {
      const fill = card.querySelector('.progress-fill');
      if (fill) fill.style.width = pct + '%';
    }, 50)
  );
  return card;
}

function updateSummary() {
  // Active = not completed. Mirrors backend: ONTRACK + NEARLIMIT.
  const active = goals.filter(g => !g.completed).length;
  const saved  = goals.reduce((s, g) => s + (g.savedAmount  || 0), 0);
  const target = goals.reduce((s, g) => s + (g.targetAmount || 0), 0);
  if (activeGoalsCount)    activeGoalsCount.textContent    = active;
  if (totalSavedEl)        totalSavedEl.textContent        = formatMoney(saved);
  if (targetAmountSummary) targetAmountSummary.textContent = formatMoney(target);
}

/* ═══════════════════════════════════════════════════
   MODAL — ADD / EDIT
   ═══════════════════════════════════════════════════ */
function openAddModal() {
  modalTitle.textContent = 'Add New Goal';
  goalForm.reset();
  goalIdInput.value = '';
  resetIconPicker();
  openModal();
}

window.openEditModal = async function(id) {
  let goal = goals.find(g => g.id === id);
  if (!goal || !goal.name) {
    try { goal = await fetchGoalById(id); }
    catch { showToast('Could not load goal.', 'error'); return; }
  }
  modalTitle.textContent     = 'Edit Goal';
  goalIdInput.value          = goal.id;
  goalNameInput.value        = goal.name || '';
  savedAmountInput.value     = goal.savedAmount  ?? 0;
  targetAmountInput.value    = goal.targetAmount ?? 0;

  // FIX: deadline from server is "YYYY-MM-DD"; <input type="month"> needs "YYYY-MM"
  deadlineInput.value = goal.deadline
    ? String(goal.deadline).slice(0, 7)
    : '';

  loadIconPickerForEdit(goal.iconClass, goal.iconColor);
  openModal();
};

function openModal()  { modalOverlay.classList.add('is-open');    goalNameInput.focus(); }
function closeModal() { modalOverlay.classList.remove('is-open'); }

async function handleFormSubmit(e) {
  e.preventDefault();
  if (!validateForm()) return;

  /*
    FIX: deadline — <input type="month"> sends "YYYY-MM".
    Spring's LocalDate deserializer requires "YYYY-MM-DD".
    We append "-01" (first of month) before sending.
    The backend stores the full date; we slice it back to "YYYY-MM" on edit.
  */
  const rawDeadline = deadlineInput.value;
  const deadline    = rawDeadline ? rawDeadline + '-01' : null;

  const payload = {
    ...(goalIdInput.value ? { id: +goalIdInput.value } : {}),
    goalName:     goalNameInput.value.trim(),
    savedAmount:  parseFloat(savedAmountInput.value)  || 0,
    targetAmount: parseFloat(targetAmountInput.value) || 0,
    deadline,
    iconClass:    selectedIconInput?.value  || 'fa-bullseye',
    iconColor:    selectedColorInput?.value || 'green',
  };

  const saveBtn = document.getElementById('saveGoalBtn');
  if (saveBtn) { saveBtn.textContent = 'Saving…'; saveBtn.disabled = true; }

  try {
    await saveGoal(payload);
    closeModal();
    showToast(payload.id ? 'Goal updated!' : 'Goal added!', 'success');
    await loadGoals(false);
  } catch (err) {
    console.error('Save failed:', err);
    showToast('Failed to save goal. Please try again.', 'error');
  } finally {
    if (saveBtn) { saveBtn.textContent = 'Save Goal'; saveBtn.disabled = false; }
  }
}

function validateForm() {
  const nameErr = document.getElementById('nameErr');
  if (nameErr) nameErr.textContent = '';
  if (!goalNameInput.value.trim()) {
    if (nameErr) nameErr.textContent = 'Goal name is required.';
    goalNameInput.focus();
    return false;
  }
  if (!targetAmountInput?.value || parseFloat(targetAmountInput.value) <= 0) {
    showToast('Target amount must be greater than 0.', 'error');
    targetAmountInput?.focus();
    return false;
  }
  return true;
}

/* ═══════════════════════════════════════════════════
   DELETE
   ═══════════════════════════════════════════════════ */
function openDeleteModal(id) {
  deleteTargetId = id;
  deleteOverlay.classList.add('is-open');
}

async function confirmDelete() {
  if (!deleteTargetId) return;
  try {
    await deleteGoalById(deleteTargetId);
    closeDeleteModal();
    showToast('Goal deleted.', 'success');
    await loadGoals(false);
  } catch (err) {
    console.error('Delete failed:', err);
    showToast('Failed to delete goal.', 'error');
  }
}

function closeDeleteModal() {
  deleteOverlay.classList.remove('is-open');
  deleteTargetId = null;
}

window.deleteGoal = openDeleteModal;

/* ═══════════════════════════════════════════════════
   SEARCH
   ═══════════════════════════════════════════════════ */
function handleSearch() {
  const q = searchInput.value.toLowerCase().trim();
  if (!q) { renderGoals(goals); return; }
  renderGoals(goals.filter(g => (g.name || '').toLowerCase().includes(q)));
}

/* ═══════════════════════════════════════════════════
   TOAST
   ═══════════════════════════════════════════════════ */
let toastTimer;
function showToast(msg, type = 'success') {
  if (!toast) return;
  toast.textContent = msg;
  toast.className   = `toast toast--${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

/* ═══════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════ */
function formatMoney(n) {
  return '$' + Number(n || 0).toLocaleString('en-US');
}

/*
  formatDeadline — server returns "YYYY-MM-DD" (LocalDate ISO string).
  We display only month + year: "Feb 2026".
*/
function formatDeadline(iso) {
  if (!iso) return '—';
  const [year, month] = String(iso).split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[+month - 1] || ''} ${year}`;
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}

function formatNotifTime(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}