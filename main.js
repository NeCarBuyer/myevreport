// js/main.js

document.addEventListener('DOMContentLoaded', () => {
  // =========================
  // Header / mobile nav
  // =========================
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const mainNav = document.querySelector('#site-nav') || document.querySelector('.main-nav');
  const navLinks = document.querySelectorAll('.main-nav a');

  // ✅ More dropdown (Option B) — FIXED to toggle [hidden] properly
  const moreWrap = document.querySelector('[data-nav-more]');
  const moreBtn = moreWrap ? moreWrap.querySelector('.nav-more__btn') : null;
  const moreMenu = moreWrap ? moreWrap.querySelector('.nav-more__menu') : null;

  function closeMore() {
    if (!moreWrap || !moreBtn || !moreMenu) return;
    moreWrap.classList.remove('is-open');
    moreBtn.setAttribute('aria-expanded', 'false');
    moreMenu.setAttribute('hidden', '');
  }

  function openMore() {
    if (!moreWrap || !moreBtn || !moreMenu) return;
    moreWrap.classList.add('is-open');
    moreBtn.setAttribute('aria-expanded', 'true');
    moreMenu.removeAttribute('hidden');
  }

  function toggleMore() {
    if (!moreWrap || !moreMenu) return;
    const isOpen = moreWrap.classList.contains('is-open') || !moreMenu.hasAttribute('hidden');
    isOpen ? closeMore() : openMore();
  }

  if (moreWrap && moreBtn && moreMenu) {
    // Ensure consistent initial state
    moreBtn.setAttribute('aria-expanded', 'false');
    if (!moreMenu.hasAttribute('hidden')) moreMenu.setAttribute('hidden', '');

    moreBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleMore();
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!moreWrap.classList.contains('is-open')) return;
      if (!moreWrap.contains(e.target)) closeMore();
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMore();
    });

    // Close after selecting a menu item
    moreWrap.querySelectorAll('.nav-more__item').forEach((a) => {
      a.addEventListener('click', closeMore);
    });
  }

  // ✅ Ensure aria-controls points at the nav
  if (toggle && mainNav) {
    if (!mainNav.id) mainNav.id = 'site-nav';
    if (!toggle.getAttribute('aria-controls')) toggle.setAttribute('aria-controls', mainNav.id);
  }

  function closeNav() {
    if (!header) return;

    header.classList.remove('nav-open');
    if (mainNav) mainNav.classList.remove('is-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');

    // ensure More menu closes when burger closes
    closeMore();
  }

  function openNav() {
    if (!header) return;

    header.classList.add('nav-open');
    if (mainNav) mainNav.classList.add('is-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
  }

  function toggleNav() {
    if (!header) return;
    header.classList.contains('nav-open') ? closeNav() : openNav();
  }

  if (header && toggle) {
    toggle.setAttribute('aria-expanded', 'false');

    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleNav();
    });

    // Close when a link is tapped (mobile)
    navLinks.forEach((link) => link.addEventListener('click', closeNav));

    // Close when clicking outside the header/nav
    document.addEventListener('click', (e) => {
      if (!header.classList.contains('nav-open')) return;
      if (!header.contains(e.target)) closeNav();
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeNav();
    });

    // If you rotate / resize into desktop, close the mobile panel
    window.addEventListener('resize', () => {
      if (window.innerWidth > 980) closeNav();
    });
  }

  // =========================
  // Coverage bubbles toggle
  // =========================
  document.querySelectorAll('.coverage-item').forEach((item) => {
    const btn = item.querySelector('.coverage-header');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      document.querySelectorAll('.coverage-item').forEach((other) => {
        other.classList.remove('open');
        const otherBtn = other.querySelector('.coverage-header');
        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // =========================
  // Footer year
  // =========================
  const yearSpan = document.getElementById('year');
  if (yearSpan) yearSpan.textContent = String(new Date().getFullYear());

  // ==========================================================
  // Supported vehicles CSV: shared loader + make/model dropdowns
  // ==========================================================
  const CSV_URL = "/data/supported-vehicles.csv";

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const n = text[i + 1];

      if (c === '"' && inQuotes && n === '"') {
        cur += '"';
        i++;
        continue;
      }
      if (c === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (!inQuotes && c === ",") {
        row.push(cur);
        cur = "";
        continue;
      }
      if (!inQuotes && (c === "\n" || c === "\r")) {
        if (cur || row.length) {
          row.push(cur);
          rows.push(row);
        }
        row = [];
        cur = "";
        if (c === "\r" && n === "\n") i++;
        continue;
      }
      cur += c;
    }

    if (cur || row.length) {
      row.push(cur);
      rows.push(row);
    }
    return rows;
  }

  function normaliseHeader(h) {
    return String(h || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  async function loadSupportedData() {
    const res = await fetch(CSV_URL, { cache: "no-cache" });
    if (!res.ok) throw new Error("Failed to fetch supported vehicles CSV");
    const raw = parseCSV(await res.text());
    if (!raw.length) throw new Error("CSV empty");

    const headers = raw[0].map(normaliseHeader);

    const makeIdx = headers.indexOf("make");
    const modelIdx = headers.indexOf("model");

    const fuelIdx =
      headers.indexOf("fuel type") !== -1 ? headers.indexOf("fuel type") :
      headers.indexOf("fueltype") !== -1 ? headers.indexOf("fueltype") :
      headers.indexOf("fuel") !== -1 ? headers.indexOf("fuel") : -1;

    if (makeIdx === -1 || modelIdx === -1) {
      throw new Error("CSV must contain Make and Model columns");
    }

    const byMake = new Map();

    for (let i = 1; i < raw.length; i++) {
      const r = raw[i];
      const make = (r[makeIdx] || "").trim();
      const model = (r[modelIdx] || "").trim();
      const fuel = fuelIdx > -1 ? (r[fuelIdx] || "").trim().toUpperCase() : "";

      if (fuel && fuel !== "BEV") continue;

      if (!make || !model) continue;
      if (!byMake.has(make)) byMake.set(make, new Set());
      byMake.get(make).add(model);
    }

    const makes = [...byMake.keys()].sort((a, b) => a.localeCompare(b));

    return { byMake, makes };
  }

  let supportedDataPromise = null;
  function getSupportedData() {
    if (!supportedDataPromise) supportedDataPromise = loadSupportedData();
    return supportedDataPromise;
  }

  function populateMakeSelect(makeSel, makes) {
    makeSel.innerHTML =
      `<option value="">Select make</option>` +
      makes.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join("");
  }

  function populateModelSelect(modelSel, models) {
    modelSel.innerHTML =
      `<option value="">Select model</option>` +
      models.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join("");
  }

  function setSelectValue(select, value) {
    if (!select || !value) return;
    const v = String(value);
    const option = [...select.options].find(o => o.value === v);
    if (option) select.value = v;
  }

  const LS_KEY = "myevreport_vehicle_selection_v1";

  function saveVehicleSelection(make, model) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ make, model, ts: Date.now() }));
    } catch (_) {}
  }

  function readVehicleSelection() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj?.make || !obj?.model) return null;
      return obj;
    } catch (_) {
      return null;
    }
  }

  function readQueryParamsSelection() {
    const params = new URLSearchParams(window.location.search);
    const make = params.get("make");
    const model = params.get("model");
    if (make && model) return { make, model };
    return null;
  }

  async function initBookingMakeModel() {
    const bookMake = document.getElementById("vehicleMake") || document.getElementById("bookMake");
    const bookModel = document.getElementById("vehicleModel") || document.getElementById("bookModel");
    if (!bookMake || !bookModel) return;

    try {
      const { byMake, makes } = await getSupportedData();
      populateMakeSelect(bookMake, makes);

      const fromQuery = readQueryParamsSelection();
      const fromLS = readVehicleSelection();
      const prefill = fromQuery || fromLS;

      bookMake.addEventListener("change", () => {
        const mk = bookMake.value;
        bookModel.disabled = true;
        bookModel.innerHTML = `<option value="">Select a make first</option>`;
        if (!mk) return;

        const models = [...(byMake.get(mk) || [])].sort((a, b) => a.localeCompare(b));
        populateModelSelect(bookModel, models);
        bookModel.disabled = false;

        bookModel.value = "";
      });

      bookModel.addEventListener("change", () => {
        if (bookMake.value && bookModel.value) {
          saveVehicleSelection(bookMake.value, bookModel.value);
        }
      });

      if (prefill) {
        setSelectValue(bookMake, prefill.make);
        bookMake.dispatchEvent(new Event("change"));
        setSelectValue(bookModel, prefill.model);
      }
    } catch (e) {
      bookMake.innerHTML = `<option value="">Unavailable</option>`;
      bookMake.disabled = true;
      bookModel.innerHTML = `<option value="">Unavailable</option>`;
      bookModel.disabled = true;
    }
  }

  async function initSupportedModelsPage() {
    const smMake = document.getElementById("smMake");
    const smModel = document.getElementById("smModel");
    const smResult = document.getElementById("smResult");
    const smActions = document.getElementById("smActions");
    const bookLink = document.getElementById("smBookLink");

    if (!smMake || !smModel || !smResult) return;

    try {
      const { byMake, makes } = await getSupportedData();
      populateMakeSelect(smMake, makes);

      smModel.disabled = true;
      smModel.innerHTML = `<option value="">Select a make first</option>`;

      smMake.addEventListener("change", () => {
        smActions && (smActions.style.display = "none");
        smResult.className = "mini-result";
        smResult.textContent = "Choose a make and model to check support.";

        const mk = smMake.value;
        smModel.disabled = true;
        smModel.innerHTML = `<option value="">Select a make first</option>`;
        if (!mk) return;

        const models = [...(byMake.get(mk) || [])].sort((a, b) => a.localeCompare(b));
        populateModelSelect(smModel, models);
        smModel.disabled = false;
      });

      smModel.addEventListener("change", () => {
        const mk = smMake.value;
        const md = smModel.value;

        if (mk && md && byMake.has(mk) && byMake.get(mk).has(md)) {
          smResult.className = "mini-result success";
          smResult.innerHTML = "<strong>Great news — your vehicle is supported.</strong>You can book your report in under a minute.";
          saveVehicleSelection(mk, md);

          if (bookLink) {
            const url = new URL(bookLink.getAttribute("href") || "book.html", window.location.origin);
            url.searchParams.set("make", mk);
            url.searchParams.set("model", md);
            bookLink.setAttribute("href", url.pathname + url.search);
          }
        } else {
          smResult.className = "mini-result warn";
          smResult.innerHTML = "<strong>We need to confirm this one.</strong>Your model isn’t listed here yet.";
        }

        smActions && (smActions.style.display = "flex");
      });

      const prefill = readQueryParamsSelection() || readVehicleSelection();
      if (prefill) {
        setSelectValue(smMake, prefill.make);
        smMake.dispatchEvent(new Event("change"));
        setSelectValue(smModel, prefill.model);
        smModel.dispatchEvent(new Event("change"));
      }
    } catch (e) {
      smMake.innerHTML = `<option value="">Unavailable</option>`;
      smMake.disabled = true;
      smModel.innerHTML = `<option value="">Unavailable</option>`;
      smModel.disabled = true;

      smResult.className = "mini-result warn";
      smResult.innerHTML = "<strong>We couldn’t load the supported models list.</strong>Please book and we’ll confirm compatibility by email.";
      smActions && (smActions.style.display = "flex");
    }
  }

  async function initIndexCompatibilityChecker() {
    const compatMake = document.getElementById("compatMake");
    const compatModel = document.getElementById("compatModel");

    const postcodeInput = document.getElementById("coverage-postcode");
    const checkBtn = document.getElementById("coverage-check-button");
    const resultEl = document.getElementById("coverage-result");
    const actionsEl = document.getElementById("coverage-success-actions");

    if (!compatMake || !compatModel || !postcodeInput || !checkBtn || !resultEl || !actionsEl) return;

    const bookingSection = document.getElementById("book");
    const bookMake = document.getElementById("bookMake");
    const bookModel = document.getElementById("bookModel");

    const coveredAreas = new Set(["NE", "SR", "DH", "DL", "TS", "CA"]);

    function setResult(type, html) {
      resultEl.className = "compat-result" + (type ? ` ${type}` : "");
      resultEl.innerHTML = html;
    }

    function showActions(make, model) {
      actionsEl.style.display = "flex";
      actionsEl.innerHTML = `
        <button type="button" class="btn btn-primary" id="compatBookBtn">
          Book a report
        </button>
        <a class="btn btn-secondary" href="supported-models.html">See supported vehicles</a>
      `;

      const btn = document.getElementById("compatBookBtn");
      if (btn) {
        btn.addEventListener("click", () => {
          if (bookMake && bookModel && make && model) {
            setSelectValue(bookMake, make);
            bookMake.dispatchEvent(new Event("change"));
            setSelectValue(bookModel, model);
            bookModel.dispatchEvent(new Event("change"));
          }

          if (make && model) saveVehicleSelection(make, model);

          if (bookingSection) bookingSection.scrollIntoView({ behavior: "smooth" });
          else window.location.href = `book.html?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`;
        });
      }
    }

    try {
      const { byMake, makes } = await getSupportedData();
      populateMakeSelect(compatMake, makes);

      compatModel.disabled = true;
      compatModel.innerHTML = `<option value="">Select a make first</option>`;

      compatMake.addEventListener("change", () => {
        actionsEl.style.display = "none";
        actionsEl.innerHTML = "";
        setResult("", "");

        const mk = compatMake.value;
        compatModel.disabled = true;
        compatModel.innerHTML = `<option value="">Select a make first</option>`;
        if (!mk) return;

        const models = [...(byMake.get(mk) || [])].sort((a, b) => a.localeCompare(b));
        populateModelSelect(compatModel, models);
        compatModel.disabled = false;
      });

      compatModel.addEventListener("change", () => {
        const mk = compatMake.value;
        const md = compatModel.value;
        if (bookMake && bookModel && mk && md) {
          setSelectValue(bookMake, mk);
          bookMake.dispatchEvent(new Event("change"));
          setSelectValue(bookModel, md);
          bookModel.dispatchEvent(new Event("change"));
        }
        if (mk && md) saveVehicleSelection(mk, md);
      });

      const prefill = readQueryParamsSelection() || readVehicleSelection();
      if (prefill) {
        setSelectValue(compatMake, prefill.make);
        compatMake.dispatchEvent(new Event("change"));
        setSelectValue(compatModel, prefill.model);
      }

      checkBtn.addEventListener("click", () => {
        const mk = compatMake.value;
        const md = compatModel.value;
        const pcRaw = (postcodeInput.value || "").toUpperCase().trim();

        actionsEl.style.display = "none";
        actionsEl.innerHTML = "";

        if (!mk || !md) {
          setResult("warn", "<strong>Please select your make and model.</strong>Then check compatibility.");
          return;
        }

        if (!pcRaw) {
          setResult("warn", "<strong>Please enter a postcode.</strong>We’ll confirm coverage and compatibility.");
          return;
        }

        const cleaned = pcRaw.replace(/\s+/g, "");
        const match = cleaned.match(/^[A-Z]{1,2}/);
        const area = match ? match[0] : "";

        const supported = byMake.has(mk) && byMake.get(mk).has(md);
        const covered = area && coveredAreas.has(area);

        saveVehicleSelection(mk, md);

        if (supported && covered) {
          setResult(
            "success",
            "<strong>Great news — your vehicle is supported and you’re within our coverage area.</strong>Click below to request a booking."
          );
          showActions(mk, md);
          return;
        }

        if (supported && !covered) {
          setResult(
            "warn",
            "<strong>Good news — your vehicle is supported.</strong>We don’t currently list that postcode area as standard coverage, but we may still be able to help. Click below to request a booking and we’ll confirm availability by email."
          );
          showActions(mk, md);
          return;
        }

        setResult(
          "warn",
          "<strong>We need to confirm this one.</strong>Your model isn’t listed in our supported checker yet. You can still request a booking and we’ll confirm compatibility before taking payment."
        );
        showActions(mk, md);
      });
    } catch (e) {
      setResult(
        "warn",
        "<strong>We couldn’t load the supported vehicles list.</strong>Please request a booking and we’ll confirm compatibility by email."
      );
      actionsEl.style.display = "flex";
      actionsEl.innerHTML = `<a href="book.html" class="btn btn-primary">Book a report</a>`;
    }
  }

  // =========================
  // Auto-updating Latest News carousel (thumbnails)
  // =========================
  function initNewsCarouselThumbnails() {
    const wrap = document.querySelector('[data-news-carousel]');
    if (!wrap) return;

    const prevBtn = document.querySelector('.news-prev');
    const nextBtn = document.querySelector('.news-next');

    fetch('/data/news.json', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(items => {
        const latest = (items || []).slice(0, 3);
        if (!latest.length) return;

        wrap.innerHTML = latest.map((a, i) => `
          <article class="news-slide ${i === 0 ? 'is-active' : ''}">
            <a class="news-thumb" href="${a.url}" aria-label="${escapeHtml(a.title)}">
              <img src="${a.image || ''}" alt="${escapeHtml(a.title)}" loading="lazy">
              <span class="news-thumb__overlay">
                <span class="news-thumb__title">${escapeHtml(a.title)}</span>
              </span>
            </a>
          </article>
        `).join('');

        const slides = wrap.querySelectorAll('.news-slide');
        if (!slides.length) return;

        let current = 0;

        const show = (idx) => {
          slides.forEach(s => s.classList.remove('is-active'));
          slides[idx].classList.add('is-active');
        };

        nextBtn?.addEventListener('click', () => {
          current = (current + 1) % slides.length;
          show(current);
        });

        prevBtn?.addEventListener('click', () => {
          current = (current - 1 + slides.length) % slides.length;
          show(current);
        });
      })
      .catch(() => {
        // Fail quietly (keeps the "View all EV news" link visible)
      });
  }

  // =========================
  // Init
  // =========================
  initBookingMakeModel();
  initSupportedModelsPage();
  initIndexCompatibilityChecker();
  initNewsCarouselThumbnails();
});
// 🎄 Seasonal Popup (only runs where the HTML exists)
document.addEventListener('DOMContentLoaded', () => {
  const popup = document.getElementById('seasonalPopup');
  if (!popup) return; // ✅ means it will only work on index.html + news.html where you added it

  const KEY = 'seasonalPopupLastSeen';
  const SNOOZE_DAYS = 14;

  function daysSince(ts) {
    const diff = Date.now() - ts;
    return diff / (1000 * 60 * 60 * 24);
  }

  function openPopup() {
    popup.classList.add('is-open');
    popup.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('no-scroll');
  }

  function closePopup() {
    popup.classList.remove('is-open');
    popup.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('no-scroll');
    localStorage.setItem(KEY, String(Date.now()));
  }

  popup.querySelectorAll('[data-popup-close]').forEach(el => {
    el.addEventListener('click', closePopup);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && popup.classList.contains('is-open')) closePopup();
  });

  const lastSeen = Number(localStorage.getItem(KEY) || 0);
  const shouldShow = !lastSeen || daysSince(lastSeen) >= SNOOZE_DAYS;

  if (shouldShow) openPopup();
  document.addEventListener('DOMContentLoaded', () => {
  const popup = document.getElementById('seasonalPopup');
  if (!popup) return;

  const KEY = 'seasonalPopupLastSeen';
  const SNOOZE_DAYS = 14;

  function daysSince(ts) {
    return (Date.now() - ts) / (1000 * 60 * 60 * 24);
  }

  function openPopup() {
    popup.classList.add('is-open');
    popup.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('no-scroll');
    document.body.classList.add('no-scroll');
  }

  function closePopup() {
    popup.classList.remove('is-open');
    popup.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('no-scroll');
    document.body.classList.remove('no-scroll');
    localStorage.setItem(KEY, String(Date.now()));
  }

  popup.querySelectorAll('[data-popup-close]').forEach(el => {
    el.addEventListener('click', closePopup);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && popup.classList.contains('is-open')) closePopup();
  });

  const lastSeen = Number(localStorage.getItem(KEY) || 0);
  const shouldShow = !lastSeen || daysSince(lastSeen) >= SNOOZE_DAYS;

  if (shouldShow) openPopup();
});

});
// ❄️ Subtle seasonal snow (visible on light backgrounds)
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const snow = document.createElement('div');
  snow.className = 'seasonal-snow';
  document.body.appendChild(snow);

  const FLAKES = 30;

  for (let i = 0; i < FLAKES; i++) {
    const flake = document.createElement('span');

    const size = 6 + Math.random() * 6;
    flake.style.width = size + 'px';
    flake.style.height = size + 'px';

    flake.style.left = Math.random() * 100 + 'vw';
    flake.style.animationDuration = 12 + Math.random() * 12 + 's';
    flake.style.animationDelay = Math.random() * 10 + 's';
    flake.style.opacity = 0.7 + Math.random() * 0.3;

    snow.appendChild(flake);
  }
}
