import axios from 'axios';

const TOKEN_KEY = 'taskflow_token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000, // don't leave the UI spinning forever if the server hangs
  headers: { 'Content-Type': 'application/json' },
});

// AuthContext registers a callback here so this file doesn't depend on React
let onUnauthorized = null;
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Login/signup failures are 401/409 for bad credentials, not an expired session
const isAuthRequest = (url = '') => url.includes('/auth/login') || url.includes('/auth/signup');

/**
 * Success: unwrap to the API envelope { success, data, message }.
 * Failure: reject with a plain Error whose message is safe to show the user.
 */
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Request was intentionally cancelled (e.g. component unmounted) - not a real error
    if (axios.isCancel(error)) {
      const cancelled = new Error('Request cancelled');
      cancelled.cancelled = true;
      return Promise.reject(cancelled);
    }

    // No response at all: server down, CORS blocked, offline, or timeout
    if (!error.response) {
      const message =
        error.code === 'ECONNABORTED'
          ? 'The server is taking too long to respond. Please try again.'
          : 'Unable to reach the server. Please check your connection and try again.';
      const networkError = new Error(message);
      networkError.isNetworkError = true;
      return Promise.reject(networkError);
    }

    const { status, data } = error.response;

    // Expired/invalid token on a protected route -> log the user out
    if (status === 401 && !isAuthRequest(error.config?.url) && onUnauthorized) {
      onUnauthorized(data?.message);
    }

    const apiError = new Error(data?.message || 'Something went wrong. Please try again.');
    apiError.status = status;
    return Promise.reject(apiError);
  }
);

export default api;
