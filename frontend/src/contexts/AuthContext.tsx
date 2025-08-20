
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api';

interface AuthState {
  user: { phone: string } | null;
  isTrialActive: boolean;
  hasActiveSubscription: boolean;
  planName: string;
  effectiveDailyLimit: number;
  isParentVerified: boolean;
  subscriptionEndDate?: string;
  trialEndDate?: string;
}

interface AuthContextType extends AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
    user: null,
    isTrialActive: false,
    hasActiveSubscription: false,
    planName: '未订阅',
    effectiveDailyLimit: 0,
    isParentVerified: false,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(initialState);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const clearAuth = useCallback(() => {
    localStorage.removeItem('token');
    setAuthState(initialState);
    setIsAuthenticated(false);
  }, []);

  const refreshAuthStatus = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      clearAuth();
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.auth.getStatus();
      const data = response.data;
      setAuthState({
        user: data.user,
        isTrialActive: data.isTrialActive,
        hasActiveSubscription: data.hasActiveSubscription,
        planName: data.planName,
        effectiveDailyLimit: data.effectiveDailyLimit,
        isParentVerified: data.isParentVerified,
        subscriptionEndDate: data.subscriptionEndDate,
        trialEndDate: data.trialEndDate,
      });
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to refresh auth status', error);
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, [clearAuth]);

  useEffect(() => {
    refreshAuthStatus();
    
    const handleAuthError = () => clearAuth();
    if (typeof window !== 'undefined') {
      (window as any).addEventListener('auth-error', handleAuthError);
    }
    return () => {
      if (typeof window !== 'undefined') {
        (window as any).removeEventListener('auth-error', handleAuthError);
      }
    };

  }, [refreshAuthStatus, clearAuth]);

  const login = async (phone: string, password: string) => {
    const response = await api.auth.login({ phone, password });
    localStorage.setItem('token', response.data.token);
    await refreshAuthStatus();
  };

  const register = async (phone: string, password: string) => {
    const response = await api.auth.register({ phone, password });
    localStorage.setItem('token', response.data.token);
    await refreshAuthStatus();
  };

  const logout = () => {
    clearAuth();
  };

  const value = {
    ...authState,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};