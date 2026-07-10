import { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch, setAuthTokens, clearAuthTokens } from '../utils/auth';

const AuthContext = createContext(null);
let API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';
if (API_BASE && !API_BASE.endsWith('/api')) {
  API_BASE = API_BASE.replace(/\/$/, '') + '/api';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCurrentUser = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/auth/me`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        localStorage.setItem('kharcha-username', data.username);
      } else {
        setUser(null);
        clearAuthTokens();
      }
    } catch (err) {
      setUser(null);
      clearAuthTokens();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('kharcha-access-token');
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }

    // Listen for global logout events (from interceptor)
    const handleGlobalLogout = () => {
      setUser(null);
    };

    window.addEventListener('auth-logout', handleGlobalLogout);
    return () => {
      window.removeEventListener('auth-logout', handleGlobalLogout);
    };
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to login');
      }

      setAuthTokens(data.access_token, data.refresh_token);
      localStorage.setItem('kharcha-username', data.username);
      setUser({ id: data.user_id, username: data.username });
      
      // Fetch user profile complete
      await fetchCurrentUser();
      return true;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return false;
    }
  };

  const register = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      // Automatically login the registered user
      return await login(username, password);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      // Best-effort logout call to backend
      await apiFetch(`${API_BASE}/auth/logout`, { method: 'POST' });
    } catch (err) {
      console.error('Logout API error:', err);
    } finally {
      clearAuthTokens();
      setUser(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
