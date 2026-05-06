/**
 * BudgetWise – Goals Page JavaScript
 * Spring Boot static resource: src/main/resources/static/js/goals.js
 *
 * Communicates with Spring Boot REST endpoints:
 *   GET    /api/goals          → list all goals
 *   POST   /api/goals          → create a goal
 *   PUT    /api/goals/{id}     → update a goal
 *   DELETE /api/goals/{id}     → delete a goal
 *
 * When the Thymeleaf template pre-renders goal cards server-side,
 * the JS layer adds interactivity on top.
 * When the page is fully SPA-style (no Thymeleaf data), call loadGoals() on init.
 */

'use strict';

/* ═══════════════════════════════════════════════════
   CONFIG
   ═══════════════════════════════════════════════════ */
const API_BASE = '/api/goals';

/* ═══════════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════════ */
let goals = [];          // master list
let deleteTargetId = null;

/* ═══════════════════════════════════════════════════
   DOM REFS
   ═══════════════════════════════════════════════════ */
const goalsGrid        = document.getElementById('goalsGrid');
const emptyState       = document.getElementById('emptyState');
const activeGoalsCount = document.getElementById('activeGoalsCount');
const totalSavedEl     = document.getElementById('totalSaved');
const targetAmountEl   = document.getElementById('targetAmount');

const modalOverlay     = document.getElementById('modalOverlay');
const goalModal        = document.getElementById('goalModal');
const modalTitle       = document.getElementById('modalTitle');
const goalForm         = document.getElementById('goalForm');
const goalIdInput      = document.getElementById('goalId');
const goalNameInput    = document.getElementById('goalName');
const savedAmountInput = document.getElementById('savedAmount');
const targetAmountInput= document.getElementById('targetAmount');
const deadlineInput    = document.getElementById('deadline');
const selectedIconInput= document.getElementById('selectedIcon');
const selectedColorInput=document.getElementById('selectedColor');
const iconPicker       = document.getElementById('iconPicker');

const deleteOverlay    = document.getElementById('deleteOverlay');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn  = document.getElementById('cancelDeleteBtn');

const toast            = document.getElementById('toast');
const searchInput      = document.getElementById('searchInput');
const langToggle       = document.getElementById('langToggle');
const langLabel        = document.getElementById('langLabel');

/* ═══════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  attachEventListeners();

  // If the grid was pre-rendered by Thymeleaf, scrape data from DOM.
  // Otherwise, call loadGoals() to fetch from the API.
  const preRendered = goalsGrid.querySelectorAll('.goal-card[data-id]');
  if (preRendered.length > 0) {
    scrapeGoalsFromDOM(preRendered);
    updateSummary();
  } else {
    loadGoals();
  }
});

/* ═══════════════════════════════════════════════════
   EVENT LISTENERS
   ═══════════════════════════════════════════════════ */
function attachEventListeners() {
  // Add goal
  document.getElementById('openModalBtn').addEventListener('click', () => openAddModal());
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('cancelModalBtn').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

  // Form submit
  goalForm.addEventListener('submit', handleFormSubmit);

  // Delete confirm
  confirmDeleteBtn.addEventListener('click', confirmDelete);
  cancelDeleteBtn.addEventListener('click', () => closeDeleteModal());
  deleteOverlay.addEventListener('click', e => { if (e.target === deleteOverlay) closeDeleteModal(); });

  // Icon picker
  iconPicker.querySelectorAll('.icon-opt').forEach(btn => {
    btn.addEventListener('click', () => selectIcon(btn));
  });
  // Default selection
  selectIcon(iconPicker.querySelector('.icon-opt'));

  // Search
  searchInput.addEventListener('input', handleSearch);

  // Language toggle
  langToggle.addEventListener('click', toggleLanguage);
}

/* ═══════════════════════════════════════════════════
   API CALLS
   ═══════════════════════════════════════════════════ */

/** Load all goals from backend */
async function loadGoals() {
  try {
    const res = await fetch(API_BASE, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    goals = await res.json();
    renderGoals(goals);
    updateSummary();
  } catch (err) {
    console.error('Failed to load goals:', err);
    showToast('Failed to load goals.', 'error');
  }
}

/** Save a new or updated goal */
async function saveGoal(payload) {
  const isEdit = !!payload.id;
  const url    = isEdit ? `${API_BASE}/${payload.id}` : API_BASE;
  const method = isEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': getCsrfToken(),   // Spring Security CSRF
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const saved = await res.json();
    return saved;
  } catch (err) {
    console.error('Save goal failed:', err);
    throw err;
  }
}

/** Delete a goal by id */
async function deleteGoalById(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: { 'X-CSRF-TOKEN': getCsrfToken() },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

/* ═══════════════════════════════════════════════════
   RENDER
   ═══════════════════════════════════════════════════ */

function renderGoals(list) {
  goalsGrid.innerHTML = '';
  if (!list || list.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  list.forEach((goal, idx) => {
    const card = buildGoalCard(goal);
    card.style.animationDelay = `${idx * 0.07}s`;
    goalsGrid.appendChild(card);
  });
}

function buildGoalCard(goal) {
  const pct       = Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100));
  const left      = goal.targetAmount - goal.savedAmount;
  const completed = goal.completed || pct >= 100;

  const card = document.createElement('div');
  card.className = `goal-card${completed ? ' goal-card--completed' : ''}`;
  card.dataset.id = goal.id;

  card.innerHTML = `
    <div class="goal-card__header">
      <div class="goal-card__icon-wrap goal-card__icon-wrap--${goal.iconColor || 'green'}">
        <i class="fa-solid ${goal.iconClass || 'fa-bullseye'}"></i>
      </div>
      <div class="goal-card__info">
        <h3 class="goal-card__name">${escapeHtml(goal.name)}</h3>
        <p class="goal-card__deadline">Deadline: ${completed ? 'Completed' : formatDeadline(goal.deadline)}</p>
      </div>
      ${completed ? `<span class="badge-completed"><i class="fa-solid fa-circle-check"></i> Completed</span>` : ''}
    </div>
    <div class="goal-card__amounts">
      <span class="goal-card__saved">${formatMoney(goal.savedAmount)}</span>
      <span class="goal-card__sep">/</span>
      <span class="goal-card__target">${formatMoney(goal.targetAmount)}</span>
      <span class="goal-card__pct">${pct}%</span>
    </div>
    <div class="progress-track">
      <div class="progress-fill${completed ? ' progress-fill--completed' : ''}" style="width:0%"></div>
    </div>
    ${!completed ? `<p class="goal-card__left">${formatMoney(left)} left</p>` : ''}
    <div class="goal-card__actions">
      <button class="btn-icon btn-icon--edit" title="Edit" onclick="openEditModal(${goal.id})">
        <i class="fa-solid fa-pen"></i>
      </button>
      <button class="btn-icon btn-icon--delete" title="Delete" onclick="deleteGoal(${goal.id})">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `;

  // Animate progress bar after paint
  requestAnimationFrame(() => {
    setTimeout(() => {
      const fill = card.querySelector('.progress-fill');
      if (fill) fill.style.width = pct + '%';
    }, 50);
  });

  return card;
}

/* Scrape data when Thymeleaf pre-renders */
function scrapeGoalsFromDOM(cards) {
  goals = Array.from(cards).map(c => ({
    id:           parseInt(c.dataset.id, 10),
    savedAmount:  parseFloat(c.dataset.saved)  || 0,
    targetAmount: parseFloat(c.dataset.target) || 0,
  }));
  // Animate progress bars
  cards.forEach(card => {
    const saved  = parseFloat(card.dataset.saved)  || 0;
    const target = parseFloat(card.dataset.target) || 0;
    const pct    = Math.min(100, Math.round((saved / target) * 100));
    const fill   = card.querySelector('.progress-fill');
    if (fill) {
      fill.style.width = '0%';
      requestAnimationFrame(() => setTimeout(() => { fill.style.width = pct + '%'; }, 80));
    }
    // Wire action buttons
    const editBtn = card.querySelector('.btn-icon--edit');
    const delBtn  = card.querySelector('.btn-icon--delete');
    const id = parseInt(card.dataset.id, 10);
    if (editBtn) editBtn.addEventListener('click', () => openEditModal(id));
    if (delBtn)  delBtn.addEventListener('click',  () => deleteGoal(id));
  });
}

function updateSummary() {
  const active = goals.filter(g => !g.completed).length;
  const saved  = goals.reduce((s, g) => s + (g.savedAmount || 0), 0);
  const target = goals.reduce((s, g) => s + (g.targetAmount || 0), 0);

  if (activeGoalsCount) activeGoalsCount.textContent = active;
  if (totalSavedEl)     totalSavedEl.textContent     = formatMoney(saved);
  if (targetAmountEl)   targetAmountEl.textContent   = formatMoney(target);
}

/* ═══════════════════════════════════════════════════
   MODAL – ADD / EDIT
   ═══════════════════════════════════════════════════ */

function openAddModal() {
  modalTitle.textContent = 'Add New Goal';
  goalForm.reset();
  goalIdInput.value = '';
  selectIcon(iconPicker.querySelector('.icon-opt'));
  openModal();
}

/** Called from Thymeleaf th:onclick or inline JS */
window.openEditModal = async function(id) {
  // Try local cache first
  let goal = goals.find(g => g.id === id);
  if (!goal) {
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      goal = await res.json();
    } catch {
      showToast('Could not load goal.', 'error');
      return;
    }
  }
  modalTitle.textContent      = 'Edit Goal';
  goalIdInput.value           = goal.id;
  goalNameInput.value         = goal.name || '';
  savedAmountInput.value      = goal.savedAmount  || 0;
  targetAmountInput.value     = goal.targetAmount || 0;
  deadlineInput.value         = goal.deadline     || '';
  selectedIconInput.value     = goal.iconClass    || 'fa-bullseye';
  selectedColorInput.value    = goal.iconColor    || 'green';
  // Highlight correct icon
  iconPicker.querySelectorAll('.icon-opt').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.icon === goal.iconClass);
  });
  openModal();
};

function openModal() {
  modalOverlay.classList.add('is-open');
  goalNameInput.focus();
}

function closeModal() {
  modalOverlay.classList.remove('is-open');
}

/* ─── Form Submit ─────────────────────────────────── */
async function handleFormSubmit(e) {
  e.preventDefault();
  if (!validateForm()) return;

  const payload = {
    id:           goalIdInput.value ? parseInt(goalIdInput.value, 10) : null,
    name:         goalNameInput.value.trim(),
    savedAmount:  parseFloat(savedAmountInput.value) || 0,
    targetAmount: parseFloat(targetAmountInput.value),
    deadline:     deadlineInput.value,
    iconClass:    selectedIconInput.value,
    iconColor:    selectedColorInput.value,
  };

  const saveBtn = document.getElementById('saveGoalBtn');
  saveBtn.textContent = 'Saving…';
  saveBtn.disabled = true;

  try {
    const saved = await saveGoal(payload);
    closeModal();
    showToast(payload.id ? 'Goal updated!' : 'Goal added!', 'success');
    await loadGoals();   // refresh list + summary
  } catch {
    showToast('Failed to save goal. Try again.', 'error');
  } finally {
    saveBtn.textContent = 'Save Goal';
    saveBtn.disabled = false;
  }
}

function validateForm() {
  let valid = true;
  document.getElementById('nameErr').textContent = '';

  if (!goalNameInput.value.trim()) {
    document.getElementById('nameErr').textContent = 'Goal name is required.';
    valid = false;
  }
  if (parseFloat(targetAmountInput.value) <= 0) {
    showToast('Target amount must be greater than 0.', 'error');
    valid = false;
  }
  return valid;
}

/* ═══════════════════════════════════════════════════
   DELETE
   ═══════════════════════════════════════════════════ */

window.deleteGoal = function(id) {
  deleteTargetId = id;
  deleteOverlay.classList.add('is-open');
};

async function confirmDelete() {
  if (!deleteTargetId) return;
  try {
    await deleteGoalById(deleteTargetId);
    closeDeleteModal();
    showToast('Goal deleted.', 'success');
    await loadGoals();
  } catch {
    showToast('Failed to delete goal.', 'error');
  }
}

function closeDeleteModal() {
  deleteOverlay.classList.remove('is-open');
  deleteTargetId = null;
}

/* ═══════════════════════════════════════════════════
   SEARCH
   ═══════════════════════════════════════════════════ */
function handleSearch() {
  const q = searchInput.value.toLowerCase().trim();
  if (!q) { renderGoals(goals); return; }
  const filtered = goals.filter(g => g.name && g.name.toLowerCase().includes(q));
  renderGoals(filtered);
}

/* ═══════════════════════════════════════════════════
   LANGUAGE TOGGLE
   ═══════════════════════════════════════════════════ */
let isArabic = false;

function toggleLanguage() {
  isArabic = !isArabic;
  document.documentElement.lang = isArabic ? 'ar' : 'en';
  document.documentElement.dir  = isArabic ? 'rtl' : 'ltr';
}

/* ═══════════════════════════════════════════════════
   ICON PICKER
   ═══════════════════════════════════════════════════ */
function selectIcon(btn) {
  iconPicker.querySelectorAll('.icon-opt').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedIconInput.value  = btn.dataset.icon;
  selectedColorInput.value = btn.dataset.color;
}

/* ═══════════════════════════════════════════════════
   TOAST
   ═══════════════════════════════════════════════════ */
let toastTimer;
function showToast(msg, type = 'success') {
  toast.textContent = msg;
  toast.className   = `toast toast--${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.classList.remove('show'); }, 3200);
}

/* ═══════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════ */
function formatMoney(n) {
  return '$' + Number(n || 0).toLocaleString('en-US');
}

function formatDeadline(iso) {
  // iso = "2026-08" (year-month) or full date string
  if (!iso) return '—';
  const [year, month] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(month, 10) - 1] || ''} ${year}`;
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}

/** Read CSRF token from meta tag (add <meta name="_csrf" th:content="${_csrf.token}"> to <head>) */
function getCsrfToken() {
  const meta = document.querySelector('meta[name="_csrf"]');
  return meta ? meta.getAttribute('content') : '';
}


function renderNotifications(list) {
  notifDropdown.innerHTML = '';

  if (!list || list.length === 0) {
    const defaults = [
      "🎉 Welcome to BudgetWise!",
      "🎯 Start by adding your first goal",
      "💰 Track your first transaction"
    ];

    defaults.forEach(msg => {
      const item = document.createElement('div');
      item.className = 'notif-item';
      item.textContent = msg;
      notifDropdown.appendChild(item);
    });

    return;
  }


  list.forEach(n => {
    const item = document.createElement('div');
    item.className = 'notif-item';

    item.innerHTML = `
      ${n.message}
      ${!n.read ? '<span class="dot"></span>' : ''}
    `;

    notifDropdown.appendChild(item);
  });
}