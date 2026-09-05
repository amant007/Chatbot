import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [guestId, setGuestId] = useState(localStorage.getItem('omnichat_guest_id') || null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'

  // Initialize auth state
  useEffect(() => {
    async function initAuth() {
      try {
        const token = localStorage.getItem('omnichat_token');
        if (token) {
          api.setToken(token);
          const profile = await api.getProfile();
          setUser(profile);
        } else {
          const guestRes = await api.initGuest();
          setGuestId(guestRes.guest_id);
        }
      } catch (err) {
        console.warn('Auth initialization fallback to guest session:', err);
        api.setToken(null);
        const guestRes = await api.initGuest();
        setGuestId(guestRes.guest_id);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (username, password) => {
    const res = await api.login(username, password);
    setUser(res.user);
    setAuthModalOpen(false);
    return res;
  };

  const register = async (username, email, password) => {
    const res = await api.register(username, email, password);
    setUser(res.user);
    setAuthModalOpen(false);
    return res;
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
    // Switch back to anonymous guest session
    api.initGuest().then(g => setGuestId(g.guest_id));
  };

  const openAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        guestId,
        isAuthenticated: !!user,
        isAdmin: user?.is_staff || false,
        loading,
        authModalOpen,
        authModalMode,
        login,
        register,
        logout,
        openAuthModal,
        closeAuthModal,
        setAuthModalMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
