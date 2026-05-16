
const Toast = (() => {
  let container = null;

  const ICONS = {
    success: "✓",
    error: "✕",
    info: "ℹ",
    warning: "⚠",
  };

  const TITLES = {
    success: "Success",
    error: "Error",
    info: "Info",
    warning: "Warning",
  };

  function getContainer() {
    if (!container) {
      container = document.createElement("div");
      container.className = "bw-toast-container";
      document.body.appendChild(container);
    }
    return container;
  }

  function dismiss(toast) {
    toast.classList.add("is-leaving");
    toast.addEventListener("animationend", () => toast.remove(), {
      once: true,
    });
  }

  function show(type, message, { title, duration = 4000 } = {}) {
    const c = getContainer();

    const toast = document.createElement("div");
    toast.className = `bw-toast bw-toast--${type}`;
    toast.innerHTML = `
      <span class="bw-toast__icon">${ICONS[type] || ICONS.info}</span>
      <div class="bw-toast__body">
        <div class="bw-toast__title">${title || TITLES[type] || "Notice"}</div>
        ${message ? `<div class="bw-toast__message">${message}</div>` : ""}
      </div>
      <button class="bw-toast__close" aria-label="Dismiss">×</button>
      <div class="bw-toast__progress" style="animation-duration:${duration}ms"></div>
    `;

    toast
      .querySelector(".bw-toast__close")
      .addEventListener("click", () => dismiss(toast));

    c.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        if (toast.isConnected) dismiss(toast);
      }, duration);
    }

    return toast;
  }

  return {
    success: (msg, opts) => show("success", msg, opts),
    error: (msg, opts) => show("error", msg, opts),
    info: (msg, opts) => show("info", msg, opts),
    warning: (msg, opts) => show("warning", msg, opts),
  };
})();


const API = {
  MONTHLY: "/api/reports/monthly",
  DOWNLOAD: "/api/reports/download",
};


let monthlyChart = null;
let categoryChart = null;


const MONTH_ORDER = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];


async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("token"); // ← add this

  try {
    const response = await fetch(url, {
      credentials: "include",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}), // ← add this
        ...(options.headers || {}),
      },
    });


    if (response.status === 401) {
      window.location.href = "/login";
      return null;
    }


    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(errorText || `HTTP ${response.status}`);
    }


    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return null;
  } catch (error) {
    console.error("API ERROR:", error);

    return {
      error: true,
      message: error.message || "Unknown error",
    };
  }
}


function $(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const el = $(id);

  if (el) {
    el.textContent = value;
  }
}

function showEl(id, show = true) {
  const el = $(id);

  if (el) {
    el.hidden = !show;
  }
}

function disableBtn(id, disabled = true) {
  const btn = $(id);

  if (btn) {
    btn.disabled = disabled;
  }
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function yearStartISO() {
  const d = new Date();

  return `${d.getFullYear()}-01-01`;
}

function formatMoney(value) {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EGP",
  }).format(value);
}

function sumMap(obj) {
  if (!obj || typeof obj != "object") {
    return 0;
  }

  return Object.values(obj).reduce((sum, value) => {
    const num = Number(value);

    return sum + (Number.isNaN(num) ? 0 : num);
  }, 0);
}

function normalizeMonthMap(raw) {
  if (!raw || typeof raw != "object") {
    return {};
  }

  const out = {};

  Object.keys(raw).forEach((k) => {
    out[String(k).toUpperCase()] = Number(raw[k]) || 0;
  });

  return out;
}

function sortMonthKeys(obj) {
  if (!obj || typeof obj != "object") {
    return [];
  }

  return Object.keys(obj).sort((a, b) => {
    let ia = MONTH_ORDER.indexOf(String(a).toUpperCase());

    let ib = MONTH_ORDER.indexOf(String(b).toUpperCase());

    if (ia === -1) ia = 999;
    if (ib === -1) ib = 999;

    return ia - ib;
  });
}

function shortMonthLabel(key) {
  const idx = MONTH_ORDER.indexOf(String(key).toUpperCase());

  if (idx === -1) {
    return String(key);
  }

  return MONTH_SHORT[idx];
}


function destroyMonthlyChart() {
  if (monthlyChart) {
    monthlyChart.destroy();
    monthlyChart = null;
  }
}

function destroyCategoryChart() {
  if (categoryChart) {
    categoryChart.destroy();
    categoryChart = null;
  }
}


function renderMonthlyChart(labels, expenseSeries, incomeSeries) {
  const canvas = $("monthlyBarChart");

  if (!canvas || typeof Chart === "undefined") {
    return;
  }

  destroyMonthlyChart();

  monthlyChart = new Chart(canvas.getContext("2d"), {
    type: "bar",

    data: {
      labels,

      datasets: [
        {
          label: "Expenses",
          data: expenseSeries,
          backgroundColor: "rgba(232, 64, 64, 0.75)",
          borderRadius: 6,
        },

        {
          label: "Income",
          data: incomeSeries,
          backgroundColor: "rgba(42, 169, 107, 0.75)",
          borderRadius: 6,
        },
      ],
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          position: "bottom",
        },
      },

      scales: {
        x: {
          grid: {
            display: false,
          },
        },

        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

function renderCategoryChart(categoryMap) {
  const canvas = $("categoryDoughnutChart");

  if (!canvas || typeof Chart === "undefined") {
    return;
  }

  destroyCategoryChart();

  let labels = Object.keys(categoryMap || {});

  let data = labels.map((k) => Number(categoryMap[k]) || 0);

  const palette = [
    "#2aa96b",
    "#2251a3",
    "#f59e0b",
    "#e84040",
    "#8b5cf6",
    "#06b6d4",
    "#ec4899",
    "#64748b",
  ];

  let colors = labels.map((_, i) => palette[i % palette.length]);

  if (labels.length === 0) {
    labels = ["No data"];
    data = [1];
    colors = ["#e2e8f0"];
  }

  categoryChart = new Chart(canvas.getContext("2d"), {
    type: "doughnut",

    data: {
      labels,

      datasets: [
        {
          data,
          backgroundColor: colors,
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

/* ═══════════════════════════════════════════════════
   REPORT DATA
═══════════════════════════════════════════════════ */

function applyReportData(data) {
  if (!data) {
    return;
  }

  const expenseRaw = data.monthlyExpense || {};

  const incomeRaw = data.monthlyIncome || {};

  const expenseByCategory = data.expenseByCategory || {};

  const expenseMap = normalizeMonthMap(expenseRaw);

  const incomeMap = normalizeMonthMap(incomeRaw);

  const keys = [
    ...new Set([...sortMonthKeys(expenseMap), ...sortMonthKeys(incomeMap)]),
  ];

  const labels = keys.map(shortMonthLabel);

  const expenseSeries = keys.map(
    (k) => expenseMap[String(k).toUpperCase()] || 0,
  );

  const incomeSeries = keys.map((k) => incomeMap[String(k).toUpperCase()] || 0);

  renderMonthlyChart(labels, expenseSeries, incomeSeries);

  renderCategoryChart(expenseByCategory);

  const totalExpense = sumMap(expenseMap);

  const totalIncome = sumMap(incomeMap);

  const net = totalIncome - totalExpense;

  setText("sumExpense", formatMoney(totalExpense));

  setText("sumIncome", formatMoney(totalIncome));

  setText("sumNet", formatMoney(net));

  const netEl = $("sumNet");

  if (netEl) {
    netEl.style.color = net >= 0 ? "var(--green-dark)" : "var(--red)";
  }

  showEl("summaryCards", true);

  // Trigger pop animation on stat cards
  document.querySelectorAll(".stat-card").forEach((card, i) => {
    setTimeout(() => {
      card.classList.add("animating");
      setTimeout(() => card.classList.remove("animating"), 500);
    }, i * 80);
  });
}

/* ═══════════════════════════════════════════════════
   DOWNLOAD HELPERS
═══════════════════════════════════════════════════ */

function parseFilename(disposition) {
  if (!disposition) {
    return null;
  }

  const utf = disposition.match(/filename\\*=UTF-8''(.+)/);

  if (utf && utf[1]) {
    return decodeURIComponent(utf[1].split(";")[0]);
  }

  const normal = disposition.match(/filename="?([^"]+)"?/);

  if (normal && normal[1]) {
    return normal[1];
  }

  return null;
}


// Load Report
async function loadMonthlyReport() {
  const errEl = $("reportError");

  if (errEl) {
    errEl.textContent = "";
  }

  showEl("reportError", false);

  const start = $("rangeStart")?.value;

  const end = $("rangeEnd")?.value;

  if (!start || !end) {
    setText("reportError", "Choose start and end dates.");

    showEl("reportError", true);

    return;
  }

  if (start > end) {
    setText("reportError", "Start date must be before end date.");

    showEl("reportError", true);

    return;
  }

  btnStartLoading("loadReportBtn");
  setLoadReportLoading(true);

  // Add shimmer to chart cards while loading
  document
    .querySelectorAll(".chart-card")
    .forEach((c) => c.classList.add("is-loading"));

  const loadingToast = Toast.info("Fetching your report data…", {
    title: "Loading",
    duration: 0,
  });

  const result = await apiFetch(API.MONTHLY, {
    method: "POST",

    body: JSON.stringify({
      startDate: start,
      endDate: end,
    }),
  });

  btnStopLoading("loadReportBtn");
  setLoadReportLoading(false);
  showEl("reportLoading", false);
  loadingToast.classList.add("is-leaving");

  document
    .querySelectorAll(".chart-card")
    .forEach((c) => c.classList.remove("is-loading"));

  if (!result || result.error) {
    setText("reportError", result?.message || "Could not load report.");
    showEl("reportError", true);
    Toast.error(result?.message || "Could not load report.", {
      title: "Report failed",
    });
    return;
  }

  applyReportData(result);
  Toast.success("Report loaded successfully.", { title: "Done" });
}



// DOWNLOAD REPORT
async function downloadReport() {
  const errEl = $("downloadError");

  if (errEl) {
    errEl.textContent = "";
  }

  showEl("downloadError", false);

  const format = $("downloadFormat")?.value;

  const start = $("downloadStart")?.value;

  const end = $("downloadEnd")?.value;

  if (!start || !end) {
    setText("downloadError", "Choose start and end dates.");

    showEl("downloadError", true);

    return;
  }

  if (start > end) {
    setText("downloadError", "Start date must be before end date.");

    showEl("downloadError", true);

    return;
  }

  btnStartLoading("downloadBtn");
  const downloadBtn = $("downloadBtn");
  if (downloadBtn) downloadBtn.classList.add("is-downloading");

  // Show progress UI
  let progressEl = $("downloadProgress");
  if (!progressEl) {
    progressEl = document.createElement("div");
    progressEl.id = "downloadProgress";
    progressEl.className = "download-progress";
    progressEl.innerHTML = `
      <div class="download-progress__track">
        <div class="download-progress__fill" id="downloadFill"></div>
      </div>
      <div class="download-progress__label" id="downloadProgressLabel">Preparing your ${format} report…</div>
    `;
    downloadBtn?.parentElement?.after(progressEl);
  }
  progressEl.classList.add("is-visible");

  // Animate progress bar (simulated)
  const fill = $("downloadFill");
  const progressLabel = $("downloadProgressLabel");
  if (fill) fill.style.width = "30%";
  const progressTimer = setTimeout(() => {
    if (fill) fill.style.width = "70%";
  }, 400);

  const downloadingToast = Toast.info(`Generating your ${format} report…`, {
    title: "Download starting",
    duration: 0,
  });

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(API.DOWNLOAD, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ format, startDate: start, endDate: end }),
    });

    if (response.status === 401) {
      window.location.href = "/login";
      return;
    }

    if (!response.ok) {
      const txt = await response.text();

      throw new Error(txt || `HTTP ${response.status}`);
    }

    if (fill) fill.style.width = "90%";
    if (progressLabel) progressLabel.textContent = "Processing file…";

    const blob = await response.blob();

    // Complete the bar
    if (fill) fill.style.width = "100%";
    if (progressLabel) progressLabel.textContent = "Download complete!";

    const filename =
      parseFilename(response.headers.get("Content-Disposition")) || "report";

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = filename;

    document.body.appendChild(a);

    a.click();

    a.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);

    clearTimeout(progressTimer);
    if (downloadBtn) {
      downloadBtn.classList.remove("is-downloading");
      downloadBtn.classList.add("is-success");
      const label = downloadBtn.querySelector(".btn-label");
      const originalLabel = label?.textContent;
      if (label) label.textContent = "✓ Downloaded!";
      setTimeout(() => {
        downloadBtn.classList.remove("is-success");
        if (label) label.textContent = originalLabel;
      }, 2500);
    }

    downloadingToast.classList.add("is-leaving");
    Toast.success(`${format} report downloaded successfully.`, {
      title: "Download complete",
    });

    setTimeout(() => {
      progressEl.classList.remove("is-visible");
      if (fill) fill.style.width = "0%";
    }, 2000);
  } catch (error) {
    console.error(error);

    clearTimeout(progressTimer);
    if (fill) fill.style.width = "0%";
    progressEl.classList.remove("is-visible");

    // Error state on button
    if (downloadBtn) {
      downloadBtn.classList.remove("is-downloading");
      downloadBtn.classList.add("is-error");
      const label = downloadBtn.querySelector(".btn-label");
      const originalLabel = label?.textContent;
      if (label) label.textContent = "✕ Failed";
      setTimeout(() => {
        downloadBtn.classList.remove("is-error");
        if (label) label.textContent = originalLabel;
      }, 2500);
    }

    setText("downloadError", error.message || "Download failed.");
    showEl("downloadError", true);

    downloadingToast.classList.add("is-leaving");
    Toast.error(error.message || "Download failed. Please try again.", {
      title: "Download failed",
    });
  } finally {
    btnStopLoading("downloadBtn");
    if (downloadBtn) downloadBtn.classList.remove("is-downloading");
  }
}

// Button Ripple Effect

function initButtonRipples() {
  document.querySelectorAll(".btn-primary").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      if (this.disabled) return;

      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.4;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const ripple = document.createElement("span");
      ripple.className = "btn-ripple";
      ripple.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
      `;

      this.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove(), {
        once: true,
      });
    });
  });
}

function setLoadReportLoading(on) {
  const btn = $("loadReportBtn");
  if (!btn) return;
  if (on) {
    btn.classList.add("is-loading-state");
  } else {
    btn.classList.remove("is-loading-state");
    // brief success flash
    // btn.style.transition = "background 0.2s";
    btn.style.background = "#059669";
    setTimeout(() => {
      btn.style.background = "";
    }, 700);
  }
}

// Init

document.addEventListener("DOMContentLoaded", async () => {
  loaderInit([
    { pct: 50, label: "Generating reports…" },
    { pct: 100, label: "Finalizing…" },
  ]);

  initButtonRipples();

  if ($("rangeStart")) {
    $("rangeStart").value = yearStartISO();
  }

  if ($("rangeEnd")) {
    $("rangeEnd").value = todayISO();
  }

  if ($("downloadStart")) {
    $("downloadStart").value = yearStartISO();
  }

  if ($("downloadEnd")) {
    $("downloadEnd").value = todayISO();
  }

  $("loadReportBtn")?.addEventListener("click", loadMonthlyReport);

  $("downloadBtn")?.addEventListener("click", downloadReport);

  loaderAdvance();
  await loadMonthlyReport();
  loaderAdvance();
  loaderHide();
});
