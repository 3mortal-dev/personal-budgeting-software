

const BANK_STORAGE_KEY = 'budgetwise_linked_bank'; // localStorage key


function openBankModal() {
    document.getElementById('bank-modal-overlay').classList.add('open');
    document.getElementById('bank-modal').classList.add('open');
}

function closeBankModal() {
    document.getElementById('bank-modal-overlay').classList.remove('open');
    document.getElementById('bank-modal').classList.remove('open');
}

function restoreBankState() {
    const saved = localStorage.getItem(BANK_STORAGE_KEY);
    if (!saved) return;

    try {
        const { name, flag } = JSON.parse(saved);
        _renderConnectedUI(name, flag);
        // Also refresh the pending-count badge from the real backend
        _refreshPendingBadge();
    } catch {
        localStorage.removeItem(BANK_STORAGE_KEY);
    }
}


async function simulateBankLink(bankName, flag) {
    closeBankModal();
    showToast(`Redirecting to ${bankName} Secure Login…`, 'info');

    // Simulate OAuth handshake delay
    await new Promise(r => setTimeout(r, 1500));

    // Persist so the UI survives a reload
    localStorage.setItem(BANK_STORAGE_KEY, JSON.stringify({ name: bankName, flag }));

    _renderConnectedUI(bankName, flag);
    await _refreshPendingBadge();

    showToast(`${bankName} linked successfully!`, 'success');
}


async function simulateSync() {
    const syncBtn = document.querySelector('#bank-actions .sync-btn');
    if (syncBtn) {
        syncBtn.disabled     = true;
        syncBtn.innerHTML    = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing…';
    }

    showToast('Fetching latest bank transactions…', 'info');

    try {
        // credentials:'include' is handled by apiFetch in userProfile.js
        const response = await apiFetch('/api/bank/sync', { method: 'POST' });

        // ← FIX: check ok BEFORE calling .json()
        if (!response.ok) {
            const errorBody = await response.text().catch(() => '');
            throw new Error(errorBody || `Server error ${response.status}`);
        }

        const data = await response.json();

        if (data.count > 0) {
            showToast(`Sync complete! Imported ${data.count} new transaction${data.count === 1 ? '' : 's'}.`, 'success');
        } else {
            showToast('Your account is already up to date.', 'info');
        }

        // Pending count drops to 0 after a successful sync
        _setPendingBadge(0);

        // Refresh profile stats (transaction count, etc.)
        await init();

    } catch (err) {
        showToast('Sync failed: ' + err.message, 'error');
        if (syncBtn) {
            syncBtn.disabled  = false;
            syncBtn.innerHTML = '<i class="fa-solid fa-sync"></i> Sync Now';
        }
    }
}


/**
 * Renders the "connected" bank UI row (status text + action buttons).
 * Called both after a fresh link AND when restoring from localStorage.
 */
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

/**
 * Hits GET /api/mock-bank/pending and updates the badge count.
 */
async function _refreshPendingBadge() {
    try {
        const res = await apiFetch('/api/mock-bank/pending');
        if (!res.ok) return;
        const rows = await res.json();
        _setPendingBadge(rows.length);
    } catch {
        // Badge stays hidden — non-critical
    }
}

/**
 * Sets the pending-transactions badge to n.
 * If n === 0 the badge is hidden.
 */
function _setPendingBadge(n) {
    const badge = document.getElementById('pending-badge');
    if (!badge) return;
    if (n > 0) {
        badge.textContent = `${n} pending`;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
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