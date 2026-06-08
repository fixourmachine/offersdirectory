/* ============================================================
   Offers Directory — App Logic
   Vanilla JS: load data, fuzzy search (Fuse.js), sort, filter, pin
   ============================================================ */

'use strict';

// ─── State ───────────────────────────────────────────────────────────────────
const state = {
  all: [],          // full offers array
  filtered: [],     // after search + filter
  pinned: new Set(), // Set of offer IDs
  query: '',
  sortBy: 'pct-desc',
  filterSources: new Set(),
  filterCategories: new Set(),
  filterTypes: new Set(),
  filterMinPct: 0,
  pinnedCollapsed: false,
  fuse: null,
};

const PIN_KEY = 'offers_pinned_v1';
const SORT_KEY = 'offers_sort_v1';

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const $ = (id) => typeof document !== 'undefined' ? document.getElementById(id) : null;
const els = {
  searchInput:   null,
  searchClear:   null,
  offerCount:    null,
  filterMinPct:  null,
  sortSelect:    null,
  clearFilters:  null,
  pinnedSection: null,
  pinnedGrid:    null,
  pinnedToggle:  null,
  pinnedCount:   null,
  offersGrid:    null,
  resultsCount:  null,
  mainLoading:   null,
  btnOpenFilters:null,
  filterModal:   null,
  btnCloseFilters:null,
  btnApplyFilters:null,
  filterBadge:   null,
  categoryCheckboxes:null,
  typeCheckboxes:null,
};

function initEls() {
  els.searchInput = $('search-input');
  els.searchClear = $('search-clear');
  els.offerCount = $('offer-count');
  els.filterMinPct = $('filter-min-pct');
  els.sortSelect = $('sort-select');
  els.clearFilters = $('clear-filters');
  els.pinnedSection = $('pinned-section');
  els.pinnedGrid = $('pinned-grid');
  els.pinnedToggle = $('pinned-toggle');
  els.pinnedCount = $('pinned-count');
  els.offersGrid = $('offers-grid');
  els.resultsCount = $('results-count');
  els.mainLoading = $('main-loading');
  els.btnOpenFilters = $('btn-open-filters');
  els.filterModal = $('filter-modal');
  els.btnCloseFilters = $('btn-close-filters');
  els.btnApplyFilters = $('btn-apply-filters');
  els.filterBadge = $('filter-badge');
  els.categoryCheckboxes = $('category-checkboxes');
  els.typeCheckboxes = $('type-checkboxes');
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
async function boot() {
  initEls();
  loadPins();
  loadSort();
  await loadOffers();
  setupEvents();
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(console.warn);
  }
  setupInstallBanner();
}

// ─── Load + parse data ────────────────────────────────────────────────────────
async function loadOffers() {
  try {
    const res = await fetch('./data/offers.json');
    const data = await res.json();
    state.all = data.offers || [];
  } catch (e) {
    console.error('Failed to load offers:', e);
    state.all = [];
  }

  // Init Fuse.js for fuzzy search
  if (window.Fuse) {
    state.fuse = new Fuse(state.all, {
      keys: [
        { name: 'brand',       weight: 3 },
        { name: 'title',       weight: 2 },
        { name: 'description', weight: 1 },
        { name: 'keywords',    weight: 1.5 },
        { name: 'category',    weight: 1.2 },
        { name: 'type',        weight: 0.8 },
        { name: 'source',      weight: 0.5 },
      ],
      threshold: 0.35,
      includeScore: true,
      useExtendedSearch: false,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }

  populateCategoryFilter();
  populateTypeFilter();
  els.offerCount.textContent = `${state.all.length} offers`;
  if (els.mainLoading) els.mainLoading.remove();
  apply();
}

function populateCategoryFilter() {
  const cats = [...new Set(state.all.map(o => o.category).filter(Boolean))].sort();
  cats.forEach(c => {
    const lbl = document.createElement('label');
    lbl.className = 'tickbox';
    lbl.innerHTML = `<input type="checkbox" value="${escHtml(c)}" data-group="category"> <span class="tick-label">${escHtml(c)}</span>`;
    els.categoryCheckboxes.appendChild(lbl);
  });
}

function populateTypeFilter() {
  const types = [...new Set(state.all.map(o => o.type).filter(Boolean))].sort();
  types.forEach(t => {
    const lbl = document.createElement('label');
    lbl.className = 'tickbox';
    lbl.innerHTML = `<input type="checkbox" value="${escHtml(t)}" data-group="type"> <span class="tick-label">${escHtml(t)}</span>`;
    els.typeCheckboxes.appendChild(lbl);
  });
}

// ─── Pin persistence ──────────────────────────────────────────────────────────
function loadPins() {
  try {
    const raw = localStorage.getItem(PIN_KEY);
    if (raw) JSON.parse(raw).forEach(id => state.pinned.add(id));
  } catch {}
}

function savePins() {
  localStorage.setItem(PIN_KEY, JSON.stringify([...state.pinned]));
}

function loadSort() {
  const saved = localStorage.getItem(SORT_KEY);
  if (saved) { state.sortBy = saved; }
}

function togglePin(id) {
  if (state.pinned.has(id)) {
    state.pinned.delete(id);
  } else {
    state.pinned.add(id);
  }
  savePins();
  render();
}

// ─── Search + Filter + Sort ───────────────────────────────────────────────────
function apply() {
  let results = state.all;

  // 1. Fuzzy search
  if (state.query.length >= 1) {
    if (state.fuse) {
      results = state.fuse.search(state.query).map(r => r.item);
    } else {
      // Fallback plain search if Fuse not loaded
      const q = state.query.toLowerCase();
      results = results.filter(o =>
        `${o.brand} ${o.title} ${o.description} ${o.keywords} ${o.type}`.toLowerCase().includes(q)
      );
    }
  }

  // 2. Source filter
  if (state.filterSources.size > 0) {
    results = results.filter(o => state.filterSources.has(o.source));
  }

  // 3. Category filter
  if (state.filterCategories.size > 0) {
    results = results.filter(o => state.filterCategories.has(o.category));
  }

  // 4. Type filter
  if (state.filterTypes.size > 0) {
    results = results.filter(o => state.filterTypes.has(o.type));
  }

  // 5. Min % filter
  if (state.filterMinPct > 0) {
    results = results.filter(o => o.discount_pct != null && o.discount_pct >= state.filterMinPct);
  }

  // 5. Sort (only when not searching; Fuse returns relevance order)
  if (!state.query) {
    results = sortOffers(results, state.sortBy);
  }

  state.filtered = results;
  render();
}

function sortOffers(arr, mode) {
  return [...arr].sort((a, b) => {
    switch (mode) {
      case 'pct-desc':
        if (a.discount_pct == null && b.discount_pct == null) return 0;
        if (a.discount_pct == null) return 1;
        if (b.discount_pct == null) return -1;
        return b.discount_pct - a.discount_pct;
      case 'pct-asc':
        if (a.discount_pct == null && b.discount_pct == null) return 0;
        if (a.discount_pct == null) return 1;
        if (b.discount_pct == null) return -1;
        return a.discount_pct - b.discount_pct;
      case 'alpha':
        return (a.brand || '').localeCompare(b.brand || '');
      case 'source':
        if (a.source !== b.source) return a.source.localeCompare(b.source);
        return (b.discount_pct || 0) - (a.discount_pct || 0);
      default:
        return 0;
    }
  });
}

// ─── Render ───────────────────────────────────────────────────────────────────
function render() {
  // Pinned section
  const pinnedOffers = state.all.filter(o => state.pinned.has(o.id));
  if (pinnedOffers.length > 0) {
    els.pinnedSection.hidden = false;
    els.pinnedCount.textContent = pinnedOffers.length;
    els.pinnedGrid.innerHTML = '';
    pinnedOffers.forEach(o => els.pinnedGrid.appendChild(createCard(o, true)));
    els.pinnedGrid.className = 'offers-grid' + (state.pinnedCollapsed ? ' collapsed' : '');
    els.pinnedToggle.classList.toggle('collapsed', state.pinnedCollapsed);
  } else {
    els.pinnedSection.hidden = true;
  }

  // Non-pinned results
  const unpinned = state.filtered.filter(o => !state.pinned.has(o.id));
  els.offersGrid.innerHTML = '';

  if (unpinned.length === 0 && pinnedOffers.length === 0) {
    els.offersGrid.innerHTML = `
      <div class="empty-state">
        <span class="icon">🔍</span>
        <p>No offers found</p>
        <span>Try a different search term or clear your filters</span>
      </div>`;
  } else {
    unpinned.forEach((o, i) => {
      const card = createCard(o, false);
      card.style.animationDelay = `${Math.min(i * 18, 200)}ms`;
      els.offersGrid.appendChild(card);
    });
  }

  // Results count
  const total = state.filtered.length;
  const filterCount = state.filterSources.size + state.filterCategories.size + state.filterTypes.size + (state.filterMinPct > 0 ? 1 : 0);
  const showing = state.query || filterCount > 0
    ? `Showing ${total} of ${state.all.length} offers`
    : `${state.all.length} offers`;
  els.resultsCount.textContent = showing;

  // Active filter indicator
  els.clearFilters.hidden = filterCount === 0;
  els.clearFilters.classList.toggle('active', filterCount > 0);
  
  els.btnOpenFilters.classList.toggle('active', filterCount > 0);
  els.filterBadge.textContent = filterCount;
  els.filterBadge.classList.toggle('hidden', filterCount === 0);
  document.querySelector('.pct-wrap')?.classList.toggle('active', state.filterMinPct > 0);
}

// ─── Card builder ─────────────────────────────────────────────────────────────
function discountBadge(pct, display) {
  if (pct == null && !display) {
    return `<span class="discount-badge free">FREE / DEAL</span>`;
  }
  if (pct == null && display) {
    return `<span class="discount-badge tier-1">${escHtml(display)}</span>`;
  }
  
  let tier;
  if (pct >= 50) tier = 'tier-5';
  else if (pct >= 30) tier = 'tier-4';
  else if (pct >= 15) tier = 'tier-3';
  else if (pct >= 5)  tier = 'tier-2';
  else                tier = 'tier-1';
  
  let text = display || (pct + '%');
  
  // Make it explicitly clearer if it doesn't already contain descriptive words
  if (!/off|save|varies|deal|free/i.test(text)) {
    if (!/%/.test(text) && !isNaN(parseFloat(text))) {
      text = text + '% OFF';
    } else {
      text = text + ' OFF';
    }
  }

  return `<span class="discount-badge ${tier}">${escHtml(text)}</span>`;
}

function sourceBadge(source) {
  if (source === 'vivup') return `<span class="badge badge-vivup">Vivup</span>`;
  if (source === 'lebara') return `<span class="badge badge-lebara">Lebara</span>`;
  if (source === 'Blue Light Card') return `<span class="badge badge-blc">Blue Light Card</span>`;
  if (source === 'Health Service Discounts') return `<span class="badge badge-hsd">HSD</span>`;
  return `<span class="badge">${escHtml(source)}</span>`;
}


function createCard(offer, isPinned) {
  const card = document.createElement('div');
  card.className = `offer-card${isPinned ? ' pinned' : ''}`;
  card.dataset.id = offer.id;

  const pinned = state.pinned.has(offer.id);
  const title = offer.title !== offer.brand ? offer.title : (offer.description || '');

  card.innerHTML = `
    <div class="card-top">
      <div class="card-brand">${escHtml(offer.brand)}</div>
      <div class="card-actions">
        <button class="pin-btn${pinned ? ' active' : ''}" aria-label="${pinned ? 'Unpin' : 'Pin'} offer" data-id="${offer.id}">
          ${pinned ? '📌' : '📍'}
        </button>
        ${discountBadge(offer.discount_pct, offer.discount_display)}
      </div>
    </div>
    ${title ? `<div class="card-title">${escHtml(title)}</div>` : ''}
    <div class="card-meta">
      ${sourceBadge(offer.source)}
      <span class="badge badge-type">${escHtml(offer.category)}</span>
      <span class="badge badge-type">${escHtml(offer.type)}</span>
    </div>
    <div class="card-footer">
      <a href="${escHtml(offer.url)}" target="_blank" rel="noopener" class="get-offer-btn">
        Get Offer <span class="arrow">→</span>
      </a>
    </div>
  `;

  card.querySelector('.pin-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    togglePin(offer.id);
  });

  return card;
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Event listeners ──────────────────────────────────────────────────────────
function setupEvents() {
  // Search
  let debounce;
  els.searchInput.addEventListener('input', () => {
    state.query = els.searchInput.value.trim();
    els.searchClear.classList.toggle('hidden', !state.query);
    clearTimeout(debounce);
    debounce = setTimeout(() => apply(), 150);
  });

  els.searchClear.addEventListener('click', () => {
    state.query = '';
    els.searchInput.value = '';
    els.searchClear.classList.add('hidden');
    els.searchInput.focus();
    apply();
  });

  // Filter Modal
  els.btnOpenFilters.addEventListener('click', () => {
    els.filterModal.classList.remove('hidden');
    els.filterModal.setAttribute('aria-hidden', 'false');
  });

  const closeFilters = () => {
    els.filterModal.classList.add('hidden');
    els.filterModal.setAttribute('aria-hidden', 'true');
  };

  els.btnCloseFilters.addEventListener('click', closeFilters);
  els.btnApplyFilters.addEventListener('click', closeFilters);

  els.filterModal.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox') {
      const group = e.target.dataset.group;
      let set = state.filterSources;
      if (group === 'category') set = state.filterCategories;
      else if (group === 'type') set = state.filterTypes;
      
      if (e.target.checked) set.add(e.target.value);
      else set.delete(e.target.value);
      apply();
    }
  });

  els.filterMinPct.addEventListener('change', () => {
    state.filterMinPct = Number(els.filterMinPct.value);
    apply();
  });

  els.sortSelect.addEventListener('change', () => {
    state.sortBy = els.sortSelect.value;
    localStorage.setItem(SORT_KEY, state.sortBy);
    apply();
  });

  els.clearFilters.addEventListener('click', () => {
    state.filterSources.clear();
    state.filterCategories.clear();
    state.filterTypes.clear();
    state.filterMinPct = 0;
    
    document.querySelectorAll('.modal-body input[type="checkbox"]').forEach(cb => cb.checked = false);
    els.filterMinPct.value = '0';
    
    apply();
  });

  // Pinned section collapse
  document.getElementById('pinned-header').addEventListener('click', () => {
    state.pinnedCollapsed = !state.pinnedCollapsed;
    render();
  });

  // Restore sort
  els.sortSelect.value = state.sortBy;
}

// ─── PWA Install Banner ────────────────────────────────────────────────────────
let deferredPrompt;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
}

function setupInstallBanner() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (isStandalone) return;

  const dismissed = sessionStorage.getItem('install_dismissed');
  if (dismissed) return;

  const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

  setTimeout(() => {
    const banner = document.createElement('div');
    banner.className = 'install-banner';
    
    if (isIos) {
      banner.innerHTML = `
        <span class="icon">📲</span>
        <div class="text">
          <strong>Install App</strong>
          <small>Tap Share then 'Add to Home Screen'</small>
        </div>
        <button class="dismiss-btn" aria-label="Dismiss">✕</button>
      `;
    } else {
      banner.innerHTML = `
        <span class="icon">🏷️</span>
        <div class="text">
          <strong>Add to Home Screen</strong>
          <small>Quick access to all your offers</small>
        </div>
        <button class="install-btn">Install</button>
        <button class="dismiss-btn" aria-label="Dismiss">✕</button>
      `;
    }

    const installBtn = banner.querySelector('.install-btn');
    if (installBtn) {
      installBtn.addEventListener('click', () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then(() => {
            deferredPrompt = null;
            banner.remove();
          });
        } else {
          alert('To install, open your browser menu and select "Add to Home Screen" or "Install App".');
          banner.remove();
        }
      });
    }

    banner.querySelector('.dismiss-btn').addEventListener('click', () => {
      sessionStorage.setItem('install_dismissed', '1');
      banner.remove();
    });

    document.body.appendChild(banner);
  }, 2000);
}

// ─── Start ─────────────────────────────────────────────────────────────────────
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', boot);
}

// ─── Exports (for Node testing) ──────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    state,
    els,
    initEls,
    sortOffers,
    escHtml,
    discountBadge,
    sourceBadge,
    apply,
    render,
  };
}

