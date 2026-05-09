/* ═══════════════════════════════════════════════════════════════
   BudgetWise — loading.js
   Shared loading helpers: page loader, skeletons, button spinners.
   Include BEFORE the page's own JS on every page.

   HOW TO USE ON A NEW PAGE
   ────────────────────────
   1. Add loading.css to <head>.
   2. Paste the #pageLoader HTML block right after <body> opens.
   3. Add <script src="/js/loading.js"></script> before your page JS.
   4. In your DOMContentLoaded init:

        // Define your steps (label + % for each fetch)
        loaderInit([
            { pct: 20,  label: "Loading your profile…"   },
            { pct: 60,  label: "Fetching your data…"     },
            { pct: 100, label: "Almost ready…"            },
        ]);

        loaderAdvance();          // moves bar to step 0
        await loadProfile();

        loaderAdvance();          // moves bar to step 1
        await loadPageData();

        loaderAdvance();          // moves bar to step 2 (100%)
        loaderHide();             // fades out and removes overlay

   5. For every async list, call a skeleton helper before the fetch,
      and remove it when the render function replaces the content.
═══════════════════════════════════════════════════════════════ */


// ╔══════════════════════════════════════════════════════════════╗
// ║  PAGE LOADER                                                 ║
// ╚══════════════════════════════════════════════════════════════╝

let _loaderSteps = [];
let _loaderStep = 0;

/**
 * Configure the loader steps for this page.
 * Call once at the very start of DOMContentLoaded, before any fetches.
 * @param {Array<{pct: number, label: string}>} steps
 */
function loaderInit(steps) {
    _loaderSteps = steps;
    _loaderStep = 0;
}

/**
 * Advance the progress bar to the next step.
 * Call once just before (or just after) each async operation starts.
 */
function loaderAdvance() {
    const bar = document.getElementById("loaderBar");
    const label = document.getElementById("loaderLabel");
    if (!bar || !label || !_loaderSteps.length) return;
    const step = _loaderSteps[Math.min(_loaderStep, _loaderSteps.length - 1)];
    bar.style.width = step.pct + "%";
    label.textContent = step.label;
    _loaderStep++;
}

/**
 * Fade out and remove the page loader overlay.
 * Call after all fetches on the page have resolved.
 */
function loaderHide() {
    const el = document.getElementById("pageLoader");
    if (!el) return;
    el.classList.add("hidden");
    el.addEventListener("transitionend", () => el.remove(), {once: true});
}


// ╔══════════════════════════════════════════════════════════════╗
// ║  BUTTON SPINNER                                              ║
// ╚══════════════════════════════════════════════════════════════╝

/**
 * Put a submit button into loading state.
 * The button must contain:
 *   <span class="btn-label">…</span>
 *   <span class="btn-spinner" aria-hidden="true"></span>
 * @param {string} btnId
 */
function btnStartLoading(btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.classList.add("is-loading");
    btn.disabled = true;
}

/**
 * Remove the loading state from a button.
 * @param {string} btnId
 */
function btnStopLoading(btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.classList.remove("is-loading");
    btn.disabled = false;
}


// ╔══════════════════════════════════════════════════════════════╗
// ║  GENERIC SKELETON RENDERER                                   ║
// ╚══════════════════════════════════════════════════════════════╝

/**
 * Fill a container with N copies of a skeleton HTML template.
 * @param {string} containerId  - id of the target element
 * @param {string} templateHtml - HTML string for one skeleton item
 * @param {number} count        - how many copies to render
 */
function showSkeletons(containerId, templateHtml, count = 4) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = Array.from({length: count}, () => templateHtml).join("");
}

/**
 * Remove .skeleton or .skeleton-light from a list of element IDs.
 * @param {...string} ids
 */
function clearSkeletons(...ids) {
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove("skeleton", "skeleton-light");
    });
}


// ╔══════════════════════════════════════════════════════════════╗
// ║  PRE-BUILT SKELETON TEMPLATES                                ║
// ║  Use with showSkeletons(containerId, SKELETONS.xxx, count)   ║
// ╚══════════════════════════════════════════════════════════════╝

const SKELETONS = {

    /** Transaction list row: circle icon + 2 lines + amount */
    txRow: `
        <div class="skeleton-row">
            <div class="skeleton-circle skeleton-circle--md skeleton-light"></div>
            <div class="skeleton-lines">
                <div class="skeleton-line skeleton-line--long skeleton-light"></div>
                <div class="skeleton-line skeleton-line--medium skeleton-light"></div>
            </div>
            <div class="skeleton-amount skeleton-light"></div>
        </div>`,

    /** Budget / goal progress row: label + value + bar */
    budgetRow: `
        <div class="skeleton-budget-row">
            <div class="skeleton-budget-header">
                <div class="skeleton-line skeleton-line--medium skeleton-light"></div>
                <div class="skeleton-line skeleton-line--short skeleton-light"></div>
            </div>
            <div class="skeleton-bar skeleton-light"></div>
        </div>`,

    /** Notification row: dot + title + message */
    notifRow: `
        <div class="skeleton-notif-row">
            <div class="skeleton-circle skeleton-circle--sm skeleton-light"></div>
            <div class="skeleton-lines">
                <div class="skeleton-line skeleton-line--medium skeleton-light"></div>
                <div class="skeleton-line skeleton-line--long skeleton-light"></div>
                <div class="skeleton-line skeleton-line--short skeleton-light"></div>
            </div>
        </div>`,

    /** Transactions table row (7 columns) */
    tableRowTx: `
        <tr>
            <td><div class="skeleton-line skeleton-line--short skeleton-light"></div></td>
            <td><div class="skeleton-line skeleton-line--xs skeleton-light"></div></td>
            <td><div class="skeleton-line skeleton-line--medium skeleton-light"></div></td>
            <td><div class="skeleton-line skeleton-line--long skeleton-light"></div></td>
            <td class="col-source"><div class="skeleton-line skeleton-line--medium skeleton-light"></div></td>
            <td><div class="skeleton-line skeleton-line--short skeleton-light"></div></td>
            <td><div class="skeleton-line skeleton-line--xs skeleton-light"></div></td>
        </tr>`,

    /** Goal card: title + subtitle + progress bar + stats */
    goalCard: `
        <div class="skeleton-card-row">
            <div class="skeleton-line skeleton-line--medium skeleton-light"></div>
            <div class="skeleton-line skeleton-line--long skeleton-light"></div>
            <div class="skeleton-bar skeleton-light" style="height:10px;"></div>
            <div style="display:flex;gap:12px;">
                <div class="skeleton-block skeleton-block--sm skeleton-light"></div>
                <div class="skeleton-block skeleton-block--sm skeleton-light"></div>
            </div>
        </div>`,

    /** Profile field: label + value input */
    profileField: `
        <div class="skeleton-field-row">
            <div class="skeleton-line skeleton-line--short skeleton-light"></div>
            <div class="skeleton-card-area skeleton-card-area--sm skeleton-light" style="height:40px;border-radius:8px;"></div>
        </div>`,

    /** Chart / report area placeholder */
    chartArea: `
        <div class="skeleton-card-area skeleton-card-area--lg skeleton-light" style="margin:8px 0;"></div>`,

    /** Summary stat card: label + big number */
    statCard: `
        <div style="display:flex;flex-direction:column;gap:8px;padding:4px 0;">
            <div class="skeleton-line skeleton-line--short skeleton-light"></div>
            <div class="skeleton-block skeleton-block--lg skeleton-light"></div>
        </div>`,
};


// ╔══════════════════════════════════════════════════════════════╗
// ║  CONVENIENCE WRAPPERS  (mirrors old dashboard API)           ║
// ╚══════════════════════════════════════════════════════════════╝

/** @param {number} count */
function showTxSkeletons(count = 4) {
    showSkeletons("txList", SKELETONS.txRow, count);
}

/** @param {number} count */
function showBudgetSkeletons(count = 3) {
    showSkeletons("budgetsList", SKELETONS.budgetRow, count);
}

/** @param {number} count */
function showNotifSkeletons(count = 4) {
    showSkeletons("notifList", SKELETONS.notifRow, count);
}

/** @param containerId
 @param {number} count */
function showTableSkeletons(containerId = "transactionsTableBody", count = 8) {
    showSkeletons(containerId, SKELETONS.tableRowTx, count);
}

/** @param {number} count */
function showGoalSkeletons(containerId = "goalsList", count = 3) {
    showSkeletons(containerId, SKELETONS.goalCard, count);
}

/** @param {number} count */
function showProfileSkeletons(containerId = "profileFields", count = 5) {
    showSkeletons(containerId, SKELETONS.profileField, count);
}

/** @param {number} count */
function showReportSkeletons(containerId = "reportArea", count = 1) {
    showSkeletons(containerId, SKELETONS.chartArea, count);
}