import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, User } from '@/services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (nombre: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { nombre?: string; email?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      if (authService.isAuthenticated()) {
        const userData = authService.getUserFromToken();
        if (userData) {
          setUser(userData);
        } else {
          console.error('Error getting user from token');
          authService.logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await authService.login({ email, password });
      const userData = authService.getUserFromToken();
      if (userData) {
        setUser(userData);
      } else {
        throw new Error('No se pudo obtener la información del usuario');
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (nombre: string, email: string, password: string) => {
    try {
      await authService.register({ nombre, email, password });
      const userData = authService.getUserFromToken();
      if (userData) {
        setUser(userData);
      } else {
        throw new Error('No se pudo obtener la información del usuario');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateProfile = async (data: { nombre?: string; email?: string }) => {
    try {
      await authService.updateProfile(data);
      const updatedUser = await authService.getProfile();
      setUser(updatedUser);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};