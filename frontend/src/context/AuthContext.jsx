import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { fetchCurrentUser } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('fx_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await fetchCurrentUser();
      setUser(me);
    } catch (err) {
      localStorage.removeItem('fx_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  function setToken(token) {
    localStorage.setItem('fx_token', token);
  }

  function clearSession() {
    localStorage.removeItem('fx_token');
    setUser(null);
  }

  // Role helpers used across the UI
  const designation = typeof user?.designation === 'string' ? user.designation.trim().toLowerCase() : null;
  const isAdmin = designation === 'admin';
  const isApOrHod = designation === 'ap' || designation === 'hod' || isAdmin;
  const isAp = designation === 'ap';
  const isHod = designation === 'hod';
  const isPrincipal = designation === 'principal';
  const isCampusManager = designation === 'campus_manager';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        setToken,
        clearSession,
        reloadUser: loadUser,
        isApOrHod,
        isAp,
        isHod,
        isPrincipal,
        isCampusManager,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
