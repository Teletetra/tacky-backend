const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';

export function getAuthHeaders() {
  const token = localStorage.getItem('kharcha-access-token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export function setAuthTokens(accessToken, refreshToken) {
  localStorage.setItem('kharcha-access-token', accessToken);
  if (refreshToken) {
    localStorage.setItem('kharcha-refresh-token', refreshToken);
  }
}

export function clearAuthTokens() {
  localStorage.removeItem('kharcha-access-token');
  localStorage.removeItem('kharcha-refresh-token');
  localStorage.removeItem('kharcha-username');
}

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

export async function apiFetch(url, options = {}) {
  // Setup headers
  options.headers = {
    ...options.headers,
    ...getAuthHeaders(),
  };

  // Convert object body to JSON if needed
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  let response = await fetch(url, options);

  // If unauthorized, attempt to refresh the token
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('kharcha-refresh-token');
    
    if (!refreshToken) {
      clearAuthTokens();
      window.dispatchEvent(new Event('auth-logout'));
      return response;
    }

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          const newAccessToken = data.access_token;
          setAuthTokens(newAccessToken);
          isRefreshing = false;
          onRefreshed(newAccessToken);
        } else {
          // Refresh token is expired or revoked
          clearAuthTokens();
          isRefreshing = false;
          window.dispatchEvent(new Event('auth-logout'));
          return response;
        }
      } catch (err) {
        clearAuthTokens();
        isRefreshing = false;
        window.dispatchEvent(new Event('auth-logout'));
        return response;
      }
    }

    // Return a promise that resolves when the token is refreshed
    const retryOrigRequest = new Promise((resolve) => {
      subscribeTokenRefresh((newToken) => {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`
        };
        resolve(fetch(url, options));
      });
    });

    return retryOrigRequest;
  }

  return response;
}
