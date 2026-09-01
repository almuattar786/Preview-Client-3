import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

interface AuthContextType {
  isAdminLoggedIn: boolean;
  adminUser: { id: string; email: string; role?: string } | null;
  isLoading: boolean;
  initializeAdminSession: () => Promise<{ success: boolean; message?: string }>;
  login: (email?: string, pass?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<{ id: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initializeAdminSession = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await apiFetch<{
        success: boolean;
        token?: string;
        admin: { id: string; email: string; role?: string };
        message?: string;
      }>('/api/auth/session', {
        method: 'POST'
      });

      if (res.success && res.admin) {
        if (res.token) {
          localStorage.setItem('admin_token', res.token);
        }
        setIsAdminLoggedIn(true);
        setAdminUser(res.admin);
        return { success: true };
      }
      return { success: false, message: res.message || 'Could not initialize admin session.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to authorize admin session.' };
    }
  };

  const checkAuth = async () => {
    try {
      const res = await apiFetch<{ success: boolean; admin: { id: string; email: string; role?: string } }>('/api/auth/me');
      if (res.success && res.admin) {
        setIsAdminLoggedIn(true);
        setAdminUser(res.admin);
      } else {
        // Auto-initialize session if valid on server
        const initRes = await initializeAdminSession();
        if (!initRes.success) {
          setIsAdminLoggedIn(false);
          setAdminUser(null);
        }
      }
    } catch (e) {
      // Try to initialize server session
      try {
        const initRes = await initializeAdminSession();
        if (!initRes.success) {
          setIsAdminLoggedIn(false);
          setAdminUser(null);
        }
      } catch (_) {
        setIsAdminLoggedIn(false);
        setAdminUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email?: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await apiFetch<{
        success: boolean;
        token?: string;
        admin: { id: string; email: string; role?: string };
        message?: string;
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(email && password ? { email, password } : {})
      });

      if (res.success && res.admin) {
        if (res.token) {
          localStorage.setItem('admin_token', res.token);
        }
        setIsAdminLoggedIn(true);
        setAdminUser(res.admin);
        return { success: true };
      }
      return { success: false, message: res.message || 'Could not authenticate admin session.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to authenticate admin session.' };
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore
    } finally {
      localStorage.removeItem('admin_token');
      setIsAdminLoggedIn(false);
      setAdminUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAdminLoggedIn,
        adminUser,
        isLoading,
        initializeAdminSession,
        login,
        logout,
        checkAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
