import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { setUnauthorizedHandler, tokenStorage } from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  // True while we check a saved token on page load, so protected pages don't flash the login screen
  const [initializing, setInitializing] = useState(Boolean(tokenStorage.get()));

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    navigate('/login', { replace: true });
  }, [clearSession, navigate]);

  // Any 401 from a protected endpoint (e.g. expired JWT) ends the session
  useEffect(() => {
    setUnauthorizedHandler((message) => {
      clearSession();
      navigate('/login', {
        replace: true,
        state: { message: message || 'Your session has expired. Please log in again.' },
      });
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession, navigate]);

  // Restore login on refresh: verify the saved token with the server
  useEffect(() => {
    if (!tokenStorage.get()) return;

    let ignore = false;
    api
      .get('/auth/me')
      .then(({ data }) => {
        if (!ignore) setUser(data.user);
      })
      .catch(() => {
        // 401 is already handled by the interceptor. For network errors we
        // can't verify the token, so the user simply sees the login page.
      })
      .finally(() => {
        if (!ignore) setInitializing(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleAuthSuccess = ({ user: loggedInUser, token }) => {
    tokenStorage.set(token);
    setUser(loggedInUser);
  };

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    handleAuthSuccess(data);
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/signup', { name, email, password });
    handleAuthSuccess(data);
  }, []);

  const value = useMemo(
    () => ({ user, initializing, login, signup, logout }),
    [user, initializing, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
};
