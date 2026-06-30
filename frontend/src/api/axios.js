/**
 * Axios API Client, with CSRF token management
 *
 * On startup the client fetches a CSRF token from /api/csrf-token.
 * Every state-changing request (POST/PUT/DELETE) automatically includes:
 *   X-CSRF-Token: <token>
 *   X-Session-Id: <sessionId>
 *
 * After each successful mutating request the server returns a rotated token
 * in the X-New-CSRF-Token response header, we update our stored token so
 * the next request uses the fresh one-time value.
 *
 * Why: Even though our JWT-in-Authorization-header approach is already CSRF-immune,
 * this adds defense-in-depth for any future cookie-based auth flows and satisfies
 * security audit requirements for financial/tenancy platforms.
 *
 * DOMPurify note: Individual form components import DOMPurify and sanitize
 * user-visible string outputs before setting innerHTML or dangerouslySetInnerHTML.
 * Sanitization at the API layer (sanitizeBody middleware) handles the backend side.
 */

import axios from 'axios';

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

// In-memory CSRF state, survives page navigation but not a hard reload
// (which triggers a fresh token fetch on the next mutating request)
let csrfToken = null;
let sessionId = null;
let csrfFetchPromise = null;

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE,
});

/**
 * Fetch a CSRF token if we don't have one yet.
 * Uses a single in-flight promise so concurrent requests don't race.
 */
async function ensureCsrfToken() {
  if (csrfToken && sessionId) return;
  if (csrfFetchPromise) {
    await csrfFetchPromise;
    return;
  }
  csrfFetchPromise = axios
    .get(`${API_BASE}/csrf-token`)
    .then(res => {
      csrfToken = res.data.csrfToken;
      sessionId = res.data.sessionId;
    })
    .finally(() => { csrfFetchPromise = null; });
  await csrfFetchPromise;
}

// ── Request Interceptor ────────────────────────────────────────────────────

api.interceptors.request.use(async (config) => {
  // Attach JWT if present
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Attach CSRF headers for state-changing methods
  if (MUTATING_METHODS.has(config.method?.toLowerCase())) {
    await ensureCsrfToken();
    if (csrfToken) config.headers['X-CSRF-Token'] = csrfToken;
    if (sessionId) config.headers['X-Session-Id'] = sessionId;
  }

  return config;
});

// ── Response Interceptor ───────────────────────────────────────────────────

api.interceptors.response.use(
  (response) => {
    // Rotate CSRF token if the server sent a new one
    const newToken = response.headers['x-new-csrf-token'];
    if (newToken) csrfToken = newToken;
    return response;
  },
  (error) => {
    // If the CSRF token is rejected (403 with specific message), clear and re-fetch
    if (error.response?.status === 403 && error.response?.data?.error?.includes('CSRF')) {
      csrfToken = null;
      sessionId = null;
    }
    return Promise.reject(error);
  }
);

export default api;
