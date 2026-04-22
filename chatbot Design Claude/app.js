/**
 * app.js — Loan Marketplace application logic
 *
 * Responsibilities:
 *   1. Render bank offer cards into #card-list
 *   2. Open / close the bottom sheet
 *   3. Build sheet content (overview, simulator, documents)
 *   4. Live EMI recalculation on slider input
 */

/* ── Finance helpers ─────────────────────────────────────── */

/**
 * Calculate monthly EMI using the standard amortisation formula.
 * @param {number} principal  Loan amount in ₹
 * @param {number} annualRate Interest rate % per annum
 * @param {number} months     Tenure in months
 * @returns {number} Monthly EMI in ₹
 */
function calcEMI(principal, annualRate, months) {
  const r = annualRate / 12 / 100;       // monthly rate
  if (r === 0) return principal / months;
  const factor = Math.pow(1 + r, months);
  return (principal * r * factor) / (factor - 1);
}

/**
 * Format a rupee amount.  Large values shown as ₹X L / ₹X Cr for brevity.
 * @param {number} amount
 * @returns {string}
 */
function formatRupee(amount) {
  const n = Math.round(amount);
  return "₹" + n.toLocaleString("en-IN");
}

/**
 * Compact lakh / crore label for slider readouts and card metrics.
 * @param {number} amount
 * @returns {string}
 */
function formatLakh(amount) {
  if (amount >= 10_000_000) return "₹" + (amount / 10_000_000).toFixed(1) + " Cr";
  if (amount >= 100_000)    return "₹" + (amount / 100_000).toFixed(0) + " L";
  return "₹" + (amount / 1_000).toFixed(0) + "K";
}


/* ── Approval colour helper ──────────────────────────────── */

/**
 * Return CSS colour variables and a text label for an approval percentage.
 * @param {number} pct  0–100
 * @returns {{ chipBg, chipText, label }}
 */
function approvalStyle(pct) {
  if (pct >= 80) return {
    chipBg:   "var(--clr-success-bg)",
    chipText: "var(--clr-success-text)",
    label:    "High",
  };
  if (pct >= 60) return {
    chipBg:   "var(--clr-warning-bg)",
    chipText: "var(--clr-warning-text)",
    label:    "Medium",
  };
  return {
    chipBg:   "var(--clr-danger-bg)",
    chipText: "var(--clr-danger-text)",
    label:    "Low",
  };
}


/* ── Card builder ────────────────────────────────────────── */

/**
 * Build and return the HTML string for a single offer card.
 * @param {object} bank  A bank object from BANKS (data.js)
 * @returns {string} HTML string
 */
function buildCard(bank) {
  const emi = calcEMI(bank.maxLoan, bank.rate, bank.maxTenure);
  const ap  = approvalStyle(bank.approval);

  return /* html */ `
    <article
      class="offer-card ${bank.badge ? "offer-card--featured" : ""}"
      id="card-${bank.id}"
      aria-label="${bank.name} loan offer"
    >

      <!-- Header: logo · name · badge · apply -->
      <div class="card-header">
        <div
          class="bank-logo"
          style="background: ${bank.logoBg}; color: ${bank.logoText};"
          aria-hidden="true"
        >${bank.initials}</div>

        <div class="bank-info">
          <p class="bank-name">${bank.name}</p>
          ${bank.badge
            ? `<span class="bank-badge badge badge--blue">${bank.badge}</span>`
            : ""}
        </div>

        <button
          class="card-apply-btn"
          onclick="handleApply('${bank.name}')"
          aria-label="Apply for loan with ${bank.name}"
        >Apply ↗</button>
      </div>

      <div class="offer-card__divider"></div>

      <!-- Hero: Interest Rate | EMI -->
      <div class="card-hero">
        <div class="hero-col">
          <p class="hero-label">Interest rate</p>
          <p class="hero-value">
            ${bank.rate}<span class="hero-value__unit">%&nbsp;p.a.</span>
          </p>
          <p class="hero-sub">Fixed rate</p>
        </div>
        <div class="hero-col hero-col--right">
          <p class="hero-label">EMI from <span style="font-weight:400;">(${formatLakh(bank.maxLoan)} · ${bank.maxTenure}mo)</span></p>
          <p class="hero-value hero-value--dark" id="emi-chip-${bank.id}">
            ${formatRupee(emi)}
          </p>
          <p class="hero-sub">per month</p>
        </div>
      </div>

      <div class="offer-card__divider"></div>

      <!-- Metrics strip: Max Loan · Tenure · Approval -->
      <div class="card-metrics">
        <div class="metric">
          <span class="metric__label">Max loan</span>
          <span class="metric__value">${formatLakh(bank.maxLoan)}</span>
        </div>
        <div class="metric">
          <span class="metric__label">Tenure</span>
          <span class="metric__value">${bank.maxTenure} mo</span>
        </div>
        <div class="metric metric--right">
          <span class="metric__label">Approval</span>
          <span
            class="approval-chip"
            style="background: ${ap.chipBg}; color: ${ap.chipText};"
          >● ${bank.approval}% ${ap.label}</span>
        </div>
      </div>

      <div class="offer-card__divider"></div>

      <!-- Footer: View details -->
      <div class="card-footer">
        <button
          class="card-details-btn"
          onclick="openSheet(${bank.id})"
          aria-expanded="false"
          aria-controls="bottom-sheet"
        >
          View details
          <span class="card-details-btn__icon" aria-hidden="true">↑</span>
        </button>
      </div>

    </article>
  `;
}


/* ── Sheet content builder ───────────────────────────────── */

/**
 * Build the full HTML for the bottom sheet body for a given bank.
 * Includes: overview grid, what-if simulator, documents required.
 * @param {object} bank
 * @returns {string} HTML string
 */
function buildSheetContent(bank) {
  const emi      = calcEMI(bank.maxLoan, bank.rate, bank.maxTenure);
  const totalInt = emi * bank.maxTenure - bank.maxLoan;
  const ap       = approvalStyle(bank.approval);

  /* ---- document list ---- */
  const docsHTML = bank.docs.map((doc) => /* html */ `
    <li class="doc-item">
      <span class="doc-item__icon" aria-hidden="true">
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path
            d="M1 4L3.5 6.5L9 1"
            stroke="var(--clr-success)"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
      ${doc}
    </li>
  `).join("");

  return /* html */ `

    <!-- Sheet header -->
    <div class="sheet-header">
      <div class="sheet-bank-info">
        <div
          class="bank-logo"
          style="background: ${bank.logoBg}; color: ${bank.logoText}; width:38px; height:38px;"
          aria-hidden="true"
        >${bank.initials}</div>
        <div class="sheet-bank-text">
          <p class="bank-name">${bank.name}</p>
          <span
            class="approval-chip"
            style="background: ${ap.chipBg}; color: ${ap.chipText}; font-size:11px; padding:2px 8px;"
          >● ${bank.approval}% approval — ${ap.label}</span>
        </div>
      </div>
      <button
        class="sheet-close-btn"
        onclick="closeSheet()"
        aria-label="Close details"
      >✕</button>
    </div>

    <!-- Section 1: Quick overview -->
    <section class="sheet-section" aria-labelledby="overview-title-${bank.id}">
      <h2 class="sheet-section__title" id="overview-title-${bank.id}">Overview</h2>
      <div class="overview-grid">
        <div class="overview-cell">
          <p class="overview-cell__label">Interest rate</p>
          <p class="overview-cell__value overview-cell__value--blue">
            ${bank.rate}<span class="overview-cell__unit">% p.a.</span>
          </p>
        </div>
        <div class="overview-cell">
          <p class="overview-cell__label">APR</p>
          <p class="overview-cell__value">
            ${bank.apr}<span class="overview-cell__unit">% p.a.</span>
          </p>
        </div>
        <div class="overview-cell">
          <p class="overview-cell__label">Processing fee</p>
          <p class="overview-cell__value overview-cell__value--sm">${bank.processingFee}</p>
        </div>
        <div class="overview-cell">
          <p class="overview-cell__label">Disbursal time</p>
          <p class="overview-cell__value overview-cell__value--sm">${bank.processingTime}</p>
        </div>
      </div>
    </section>

    <!-- Section 2: What-if simulator -->
    <section class="sheet-section" aria-labelledby="sim-title-${bank.id}">
      <h2 class="sheet-section__title" id="sim-title-${bank.id}">What-if simulator</h2>

      <!-- Loan amount slider -->
      <div class="slider-group">
        <div class="slider-group__header">
          <label class="slider-group__label" for="sl-loan-${bank.id}">Loan amount</label>
          <span class="slider-group__value" id="sv-loan-${bank.id}">${formatLakh(bank.maxLoan)}</span>
        </div>
        <input
          type="range"
          id="sl-loan-${bank.id}"
          min="${bank.minLoan}"
          max="${bank.maxLoan}"
          step="50000"
          value="${bank.maxLoan}"
          oninput="updateSimulator(${bank.id})"
          aria-label="Loan amount"
        />
        <div class="slider-group__range">
          <span>${formatLakh(bank.minLoan)}</span>
          <span>${formatLakh(bank.maxLoan)}</span>
        </div>
      </div>

      <!-- Tenure slider -->
      <div class="slider-group">
        <div class="slider-group__header">
          <label class="slider-group__label" for="sl-ten-${bank.id}">Tenure</label>
          <span class="slider-group__value" id="sv-ten-${bank.id}">${bank.maxTenure} months</span>
        </div>
        <input
          type="range"
          id="sl-ten-${bank.id}"
          min="${bank.minTenure}"
          max="${bank.maxTenure}"
          step="6"
          value="${bank.maxTenure}"
          oninput="updateSimulator(${bank.id})"
          aria-label="Tenure in months"
        />
        <div class="slider-group__range">
          <span>${bank.minTenure} mo</span>
          <span>${bank.maxTenure} mo</span>
        </div>
      </div>

      <!-- Interest rate slider -->
      <div class="slider-group">
        <div class="slider-group__header">
          <label class="slider-group__label" for="sl-rate-${bank.id}">Interest rate</label>
          <span class="slider-group__value" id="sv-rate-${bank.id}">${bank.rate}%</span>
        </div>
        <input
          type="range"
          id="sl-rate-${bank.id}"
          min="${bank.minRate}"
          max="18"
          step="0.25"
          value="${bank.rate}"
          oninput="updateSimulator(${bank.id})"
          aria-label="Interest rate percentage"
        />
        <div class="slider-group__range">
          <span>${bank.minRate}%</span>
          <span>18%</span>
        </div>
      </div>

      <!-- Live results -->
      <div class="sim-results">
        <div>
          <p class="sim-result__label">Monthly EMI</p>
          <p class="sim-result__value sim-result__value--blue" id="sv-emi-${bank.id}">
            ${formatRupee(emi)}
          </p>
        </div>
        <div>
          <p class="sim-result__label">Principal</p>
          <p class="sim-result__value sim-result__value--sm" id="sv-prin-${bank.id}">
            ${formatLakh(bank.maxLoan)}
          </p>
        </div>
        <div>
          <p class="sim-result__label">Interest</p>
          <p class="sim-result__value sim-result__value--warning sim-result__value--sm" id="sv-int-${bank.id}">
            ${formatRupee(totalInt)}
          </p>
        </div>
      </div>
    </section>

    <!-- Section 3: Documents -->
    <section class="sheet-section" aria-labelledby="docs-title-${bank.id}">
      <h2 class="sheet-section__title" id="docs-title-${bank.id}">Documents required</h2>
      <ul style="list-style: none; padding: 0;" role="list">
        ${docsHTML}
      </ul>
    </section>

    <!-- Sticky apply button -->
    <div class="sheet-apply-wrap">
      <button
        class="sheet-apply-btn"
        onclick="handleApply('${bank.name}')"
        aria-label="Apply for loan with ${bank.name}"
      >
        Apply now with ${bank.name} ↗
      </button>
    </div>
  `;
}


/* ── Sheet open / close ──────────────────────────────────── */

/** Currently open bank id, or null */
let activeSheetId = null;

/**
 * Open the bottom sheet for a given bank id.
 * @param {number} id
 */
function openSheet(id) {
  const bank = BANKS.find((b) => b.id === id);
  if (!bank) return;

  activeSheetId = id;

  // Inject content
  document.getElementById("sheet-body").innerHTML = buildSheetContent(bank);

  // Animate in
  document.getElementById("bottom-sheet").classList.add("bottom-sheet--open");
  document.getElementById("overlay").classList.add("overlay--visible");

  // Lock background scroll
  document.body.style.overflow = "hidden";

  // Update aria
  const btn = document.querySelector(`#card-${id} .card-details-btn`);
  if (btn) btn.setAttribute("aria-expanded", "true");
}

/**
 * Close the bottom sheet.
 */
function closeSheet() {
  document.getElementById("bottom-sheet").classList.remove("bottom-sheet--open");
  document.getElementById("overlay").classList.remove("overlay--visible");

  document.body.style.overflow = "";

  if (activeSheetId !== null) {
    const btn = document.querySelector(`#card-${activeSheetId} .card-details-btn`);
    if (btn) btn.setAttribute("aria-expanded", "false");
  }

  activeSheetId = null;
}

// Close sheet on overlay tap
document.getElementById("overlay").addEventListener("click", closeSheet);

// Close sheet on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && activeSheetId !== null) closeSheet();
});


/* ── Live EMI simulator ──────────────────────────────────── */

/**
 * Called on every slider input event inside the sheet.
 * Reads all three sliders for the given bank id and updates the result cells.
 * @param {number} id  Bank id
 */
function updateSimulator(id) {
  const loan = parseFloat(document.getElementById(`sl-loan-${id}`).value);
  const ten  = parseInt(document.getElementById(`sl-ten-${id}`).value, 10);
  const rate = parseFloat(document.getElementById(`sl-rate-${id}`).value);

  // Update labels
  document.getElementById(`sv-loan-${id}`).textContent = formatLakh(loan);
  document.getElementById(`sv-ten-${id}`).textContent  = ten + " months";
  document.getElementById(`sv-rate-${id}`).textContent = rate.toFixed(2) + "%";

  // Recalculate
  const emi      = calcEMI(loan, rate, ten);
  const totalInt = emi * ten - loan;

  // Update result cells
  document.getElementById(`sv-emi-${id}`).textContent  = formatRupee(emi);
  document.getElementById(`sv-prin-${id}`).textContent = formatLakh(loan);
  document.getElementById(`sv-int-${id}`).textContent  = formatRupee(totalInt);

  // Sync EMI chip on the card (live update while sheet is open)
  const chip = document.getElementById(`emi-chip-${id}`);
  if (chip) chip.textContent = formatRupee(emi);
}


/* ── Apply handler ───────────────────────────────────────── */

/**
 * Handle "Apply now" — in production this would navigate to
 * the bank's application page or an in-app flow.
 * @param {string} bankName
 */
function handleApply(bankName) {
  // Replace this with your navigation / tracking logic
  alert(`Redirecting to ${bankName} application…\n\nIn production, this opens the bank's loan application.`);
}


/* ── Initialise ──────────────────────────────────────────── */

/**
 * Render all bank cards into #card-list on page load.
 */
function init() {
  const list = document.getElementById("card-list");
  BANKS.forEach((bank) => {
    list.insertAdjacentHTML("beforeend", buildCard(bank));
  });
}

// Run once DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
