/**
 * storage.js
 * Handles reading and writing search state to localStorage.
 * Stores the last search query, filters, and search history.
 */

const STORAGE_KEYS = {
  LAST_QUERY:   'cinesearch_last_query',
  LAST_TYPE:    'cinesearch_last_type',
  LAST_YEAR:    'cinesearch_last_year',
  HISTORY:      'cinesearch_history',
};

const MAX_HISTORY = 8;

/**
 * Save the current search state (query + filters).
 * @param {string} query - The search term
 * @param {string} type  - Type filter value (movie/series/episode or '')
 * @param {string} year  - Year filter value or ''
 */
function saveSearch(query, type, year) {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_QUERY, query);
    localStorage.setItem(STORAGE_KEYS.LAST_TYPE,  type || '');
    localStorage.setItem(STORAGE_KEYS.LAST_YEAR,  year || '');
  } catch (e) {
    console.warn('localStorage unavailable:', e);
  }
}

/**
 * Load the last saved search state.
 * @returns {{ query: string, type: string, year: string }}
 */
function loadLastSearch() {
  try {
    return {
      query: localStorage.getItem(STORAGE_KEYS.LAST_QUERY) || '',
      type:  localStorage.getItem(STORAGE_KEYS.LAST_TYPE)  || '',
      year:  localStorage.getItem(STORAGE_KEYS.LAST_YEAR)  || '',
    };
  } catch (e) {
    return { query: '', type: '', year: '' };
  }
}

/**
 * Add a search term to the history list (deduplicated, max 8 items).
 * @param {string} query
 */
function addToHistory(query) {
  if (!query || !query.trim()) return;
  try {
    const history = getHistory().filter(
      item => item.term.toLowerCase() !== query.toLowerCase()
    );
    history.unshift({ term: query, date: Date.now() });
    if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  } catch (e) {
    console.warn('Could not save history:', e);
  }
}

/**
 * Retrieve the search history array.
 * @returns {Array<{ term: string, date: number }>}
 */
function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]');
  } catch (e) {
    return [];
  }
}

/**
 * Clear all stored data.
 */
function clearStorage() {
  try {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  } catch (e) { /* silent */ }
}