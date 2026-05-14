/**
 * api.js
 * Handles all communication with the OMDB API.
 * Includes an in-memory cache to avoid redundant requests.
 */

const API_KEY  = '3997fb1c'; 
const BASE_URL = 'https://www.omdbapi.com/';

/** Simple in-memory cache: key → result */
const _cache = {};

/**
 * Build a cache key from params.
 * @param {Object} params
 * @returns {string}
 */
function _cacheKey(params) {
  return JSON.stringify(params);
}

/**
 * Core fetch wrapper. Returns parsed JSON or throws on failure.
 * @param {Object} params - URL query params
 * @returns {Promise<Object>}
 */
async function _fetchOMDB(params) {
  const key = _cacheKey(params);
  if (_cache[key]) return _cache[key];

  const url = new URL(BASE_URL);
  url.searchParams.set('apikey', API_KEY);
  Object.entries(params).forEach(([k, v]) => {
    if (v) url.searchParams.set(k, v);
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Network error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  _cache[key] = data;
  return data;
}

/**
 * Search for movies/series by title.
 * Uses the ?s= endpoint which returns a list of results.
 * @param {string} query - Search term
 * @param {string} [type] - 'movie', 'series', or 'episode'
 * @param {string} [year] - Release year
 * @returns {Promise<Object>} - { Search: [...], totalResults, Response }
 */
async function searchMovies(query, type = '', year = '') {
  if (!query || !query.trim()) {
    throw new Error('Please enter a movie title to search.');
  }
  if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
    throw new Error('API key not set. Open js/api.js and replace YOUR_API_KEY_HERE with your OMDB key from omdbapi.com');
  }

  const params = { s: query.trim() };
  if (type) params.type = type;
  if (year) params.y    = year;

  return _fetchOMDB(params);
}

/**
 * Fetch full details for a movie by its IMDB ID.
 * Uses the ?i= endpoint which returns complete info (genre, director, plot, etc.)
 * @param {string} imdbId
 * @returns {Promise<Object>}
 */
async function getMovieDetails(imdbId) {
  if (!imdbId) throw new Error('No IMDB ID provided.');
  return _fetchOMDB({ i: imdbId, plot: 'short' });
}

/**
 * Clear the in-memory cache (useful for testing).
 */
function clearCache() {
  Object.keys(_cache).forEach(k => delete _cache[k]);
}