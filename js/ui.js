/**
 * ui.js
 * All DOM rendering functions. These functions only care about
 * displaying data — they have zero knowledge of the API.
 */

/* ── Element references ──────────────────────────────────────── */
const $ = id => document.getElementById(id);

const UI = {
  searchInput:      $('searchInput'),
  typeFilter:       $('typeFilter'),
  yearFilter:       $('yearFilter'),
  searchBtn:        $('searchBtn'),
  errorBox:         $('errorBox'),
  errorText:        $('errorText'),
  loadingSpinner:   $('loadingSpinner'),
  resultsSection:   $('resultsSection'),
  resultsTitle:     $('resultsTitle'),
  resultsCount:     $('resultsCount'),
  resultsGrid:      $('resultsGrid'),
  detailModal:      $('detailModal'),
  modalInner:       $('modalInner'),
  closeModal:       $('closeModal'),
  emptyState:       $('emptyState'),
  historyDropdown:  $('historyDropdown'),
  historyList:      $('historyList'),
};

/* ── State helpers ───────────────────────────────────────────── */

/** Show loading spinner, hide everything else */
function showLoading() {
  UI.errorBox.classList.add('hidden');
  UI.resultsSection.classList.add('hidden');
  UI.emptyState.classList.add('hidden');
  UI.loadingSpinner.classList.remove('hidden');
}

/** Hide loading spinner */
function hideLoading() {
  UI.loadingSpinner.classList.add('hidden');
}

/** Show an error message */
function showError(message) {
  hideLoading();
  UI.resultsSection.classList.add('hidden');
  UI.emptyState.classList.add('hidden');
  UI.errorText.textContent = message;
  UI.errorBox.classList.remove('hidden');
}

/** Hide error message */
function hideError() {
  UI.errorBox.classList.add('hidden');
}

/** Show the empty/initial state */
function showEmptyState() {
  UI.emptyState.classList.remove('hidden');
  UI.resultsSection.classList.add('hidden');
  UI.errorBox.classList.add('hidden');
}

/* ── Results rendering ───────────────────────────────────────── */

/**
 * Render a list of search results into the grid.
 * @param {Array} movies - Array of movie objects from OMDB search
 * @param {string} query - The search query (for the heading)
 * @param {string} total - Total results count from OMDB
 */
function renderResults(movies, query, total) {
  hideLoading();
  hideError();
  UI.emptyState.classList.add('hidden');

  UI.resultsGrid.innerHTML = '';
  UI.resultsTitle.textContent = `"${query}"`;
  UI.resultsCount.textContent = `${total} result${parseInt(total) !== 1 ? 's' : ''} found`;

  movies.forEach((movie, index) => {
    const card = createMovieCard(movie, index);
    UI.resultsGrid.appendChild(card);
  });

  UI.resultsSection.classList.remove('hidden');
}

/**
 * Build a single movie card DOM element.
 * @param {Object} movie
 * @param {number} index - Used for staggered animation delay
 * @returns {HTMLElement}
 */
function createMovieCard(movie, index) {
  const card = document.createElement('article');
  card.className = 'movie-card';
  card.style.animationDelay = `${index * 40}ms`;
  card.setAttribute('data-imdbid', movie.imdbID);
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `${movie.Title}, ${movie.Year}`);

  const hasPoster = movie.Poster && movie.Poster !== 'N/A';

  card.innerHTML = `
    ${hasPoster
      ? `<img class="card-poster" src="${movie.Poster}" alt="${escapeHtml(movie.Title)} poster" loading="lazy" />`
      : `<div class="card-poster-placeholder">🎬</div>`
    }
    <div class="card-body">
      <p class="card-title">${escapeHtml(movie.Title)}</p>
      <div class="card-meta">
        <span class="card-year">${movie.Year || '—'}</span>
        ${movie.Type ? `<span class="card-type">${movie.Type}</span>` : ''}
      </div>
    </div>
  `;

  // Keyboard accessibility
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      card.click();
    }
  });

  return card;
}

/* ── Modal ───────────────────────────────────────────────────── */

/**
 * Open the detail modal and render full movie info.
 * @param {Object} details - Full movie details from OMDB ?i= endpoint
 */
function openModal(details) {
  const hasPoster = details.Poster && details.Poster !== 'N/A';
  const rating    = details.imdbRating && details.imdbRating !== 'N/A'
    ? details.imdbRating
    : null;

  UI.modalInner.innerHTML = `
    ${hasPoster
      ? `<img class="modal-poster" src="${details.Poster}" alt="${escapeHtml(details.Title)} poster" />`
      : `<div class="modal-poster-placeholder">🎬</div>`
    }
    <div class="modal-info">
      <h2 class="modal-title">${escapeHtml(details.Title)}</h2>

      <div class="modal-badges">
        ${details.Year    && details.Year    !== 'N/A' ? `<span class="badge accent">${details.Year}</span>` : ''}
        ${details.Rated   && details.Rated   !== 'N/A' ? `<span class="badge">${details.Rated}</span>` : ''}
        ${details.Runtime && details.Runtime !== 'N/A' ? `<span class="badge">${details.Runtime}</span>` : ''}
        ${details.Type ? `<span class="badge" style="text-transform:capitalize">${details.Type}</span>` : ''}
      </div>

      ${details.Plot && details.Plot !== 'N/A'
        ? `<p class="modal-plot">${escapeHtml(details.Plot)}</p>`
        : ''
      }

      <div class="modal-details">
        ${detailRow('Director',  details.Director)}
        ${detailRow('Genre',     details.Genre)}
        ${detailRow('Actors',    details.Actors)}
        ${detailRow('Language',  details.Language)}
        ${detailRow('Country',   details.Country)}
        ${detailRow('Awards',    details.Awards)}
      </div>

      ${rating ? `
        <div class="modal-rating">
          <span class="rating-score">${rating}</span>
          <div>
            <div style="color:var(--accent);font-size:13px;">★★★★★</div>
            <div class="rating-source">IMDB Rating / 10</div>
          </div>
        </div>
      ` : ''}
    </div>
  `;

  UI.detailModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Focus the close button for accessibility
  setTimeout(() => UI.closeModal.focus(), 50);
}

/**
 * Close the detail modal.
 */
function closeModal() {
  UI.detailModal.classList.add('hidden');
  document.body.style.overflow = '';
}

/**
 * Build a detail row. Returns empty string if value is missing.
 * @param {string} label
 * @param {string} value
 * @returns {string}
 */
function detailRow(label, value) {
  if (!value || value === 'N/A') return '';
  return `
    <div class="detail-item">
      <div class="detail-label">${label}</div>
      <div class="detail-value">${escapeHtml(value)}</div>
    </div>
  `;
}

/* ── History Dropdown ────────────────────────────────────────── */

/**
 * Render the search history dropdown.
 * @param {Array<{term: string, date: number}>} history
 * @param {Function} onSelect - Called with (term) when an item is clicked
 */
function renderHistory(history, onSelect) {
  if (!history || history.length === 0) {
    UI.historyDropdown.classList.add('hidden');
    return;
  }

  UI.historyList.innerHTML = '';
  history.slice(0, 6).forEach(item => {
    const li = document.createElement('li');
    const timeAgo = formatTimeAgo(item.date);
    li.innerHTML = `
      <span class="hist-term">${escapeHtml(item.term)}</span>
      <span class="hist-meta">${timeAgo}</span>
    `;
    li.addEventListener('mousedown', e => {
      e.preventDefault(); // prevent input blur firing first
      onSelect(item.term);
    });
    UI.historyList.appendChild(li);
  });

  UI.historyDropdown.classList.remove('hidden');
}

/** Hide history dropdown */
function hideHistory() {
  UI.historyDropdown.classList.add('hidden');
}

/* ── Helpers ─────────────────────────────────────────────────── */

/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Format a timestamp as a relative time string (e.g. "2 hours ago").
 * @param {number} timestamp
 * @returns {string}
 */
function formatTimeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);

  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}