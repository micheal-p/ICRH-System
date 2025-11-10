import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Initialize auth state from localStorage
    const storedUser = authAPI.getCurrentUser();
    const hasToken = authAPI.isAuthenticated();
    
    console.log('[AUTH] Initializing:', { hasToken, storedUser });
    
    if (storedUser && hasToken) {
      setUser(storedUser);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const data = await authAPI.login(credentials);
      setUser(data.user);
      setIsAuthenticated(true);
      console.log('[AUTH] Login successful:', data.user);
      return { success: true, user: data.user };
    } catch (error) {
      console.error('[AUTH] Login failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const register = async (formData) => {
    try {
      await authAPI.register(formData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    setIsAuthenticated(false);
    console.log('[AUTH] Logged out');
  };

  const isAdmin = () => {
    return user?.is_admin === true;
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin,
    isAuthenticated,  // Use state value, not function call
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;