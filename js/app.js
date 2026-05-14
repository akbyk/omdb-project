/**
 * app.js
 * Entry point. Wires together the API, UI, and Storage modules.
 * Handles all user interactions and application flow.
 */

/* ── Element references ──────────────────────────────────────── */
const searchInput = document.getElementById('searchInput');
const searchBtn   = document.getElementById('searchBtn');
const typeFilter  = document.getElementById('typeFilter');
const yearFilter  = document.getElementById('yearFilter');
const resultsGrid = document.getElementById('resultsGrid');
const detailModal = document.getElementById('detailModal');
const closeModalBtn = document.getElementById('closeModal');

/* ── Core search function ────────────────────────────────────── */

/**
 * Run a search: validate → save state → call API → render.
 * @param {string} [overrideQuery] - Optional query to use instead of input value
 */
async function runSearch(overrideQuery) {
  const query = (overrideQuery || searchInput.value || '').trim();
  const type  = typeFilter.value;
  const year  = yearFilter.value.trim();

  // Basic validation
  if (!query) {
    showError('Please enter a movie title.');
    return;
  }
  if (year && (isNaN(year) || year.length !== 4)) {
    showError('Please enter a valid 4-digit year (e.g. 2023).');
    return;
  }

  // Update input if using override (e.g. from history click)
  if (overrideQuery) searchInput.value = overrideQuery;

  showLoading();
  hideHistory();

  // Save to localStorage so state persists on refresh
  saveSearch(query, type, year);
  addToHistory(query);

  try {
    const data = await searchMovies(query, type, year);

    if (data.Response === 'False') {
      // OMDB returns Response: "False" when nothing found — not an HTTP error
      showError(data.Error || 'No results found. Try a different search.');
      return;
    }

    renderResults(data.Search, query, data.totalResults);

  } catch (err) {
    showError(err.message || 'An unexpected error occurred. Please try again.');
  }
}

/* ── Movie detail handler ────────────────────────────────────── */

/**
 * Fetch full details for a movie and open the modal.
 * @param {string} imdbId
 */
async function openMovieDetail(imdbId) {
  try {
    const details = await getMovieDetails(imdbId);

    if (details.Response === 'False') {
      showError(details.Error || 'Could not load movie details.');
      return;
    }

    openModal(details);
  } catch (err) {
    showError(err.message || 'Failed to load movie details.');
  }
}

/* ── Event listeners ─────────────────────────────────────────── */

// Search button click
searchBtn.addEventListener('click', () => runSearch());

// Enter key in search input
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') runSearch();
});

// Show history when input is focused (if there is history)
searchInput.addEventListener('focus', () => {
  const history = getHistory();
  if (history.length > 0) {
    renderHistory(history, term => {
      runSearch(term);
    });
  }
});

// Hide history when input loses focus
searchInput.addEventListener('blur', () => {
  // Slight delay so mousedown on history item fires first
  setTimeout(hideHistory, 150);
});

// Click on a movie card → open detail modal
resultsGrid.addEventListener('click', e => {
  const card = e.target.closest('.movie-card');
  if (!card) return;
  const imdbId = card.getAttribute('data-imdbid');
  if (imdbId) openMovieDetail(imdbId);
});

// Close modal on ✕ button
closeModalBtn.addEventListener('click', closeModal);

// Close modal on overlay click (outside the card)
detailModal.addEventListener('click', e => {
  if (e.target === detailModal) closeModal();
});

// Close modal on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !detailModal.classList.contains('hidden')) {
    closeModal();
  }
});

/* ── On page load: restore last search ──────────────────────── */

(function restoreLastSearch() {
  const { query, type, year } = loadLastSearch();

  if (type)  typeFilter.value = type;
  if (year)  yearFilter.value = year;

  if (query) {
    searchInput.value = query;
    // Automatically re-run the last search
    runSearch(query);
  } else {
    showEmptyState();
  }
})();