import React, { createContext, useState, useCallback, useEffect } from 'react';
import { authApi } from '../api/authApi';
import { userApi, UpdateUserPayload } from '../api/userApi';
import { User } from '../types/auth';
import { RegisterPayload, LoginPayload } from '../types/auth';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Инициализируем пользователя при загрузке
  useEffect(() => {
    const currentUser = authApi.getCurrentUser();
    setUser(currentUser);
    setIsInitialized(true);
  }, []);

  const register = useCallback(async (email, password, firstName, lastName) => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = new RegisterPayload(email, password, firstName, lastName);
      const response = await authApi.register(payload);

      const currentUser = authApi.getCurrentUser();
      setUser(currentUser);

      return response;
    } catch (err) {
      const errorMessage = err.data?.detail || err.message || 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = new LoginPayload(email, password);
      const response = await authApi.login(payload);

      const currentUser = authApi.getCurrentUser();
      setUser(currentUser);

      return response;
    } catch (err) {
      const errorMessage = err.data?.detail || err.message || 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
    setError(null);
  }, []);

  const startGoogleLogin = useCallback(() => {
    window.location.href = authApi.getGoogleLoginUrl();
  }, []);

  const completeGoogleLogin = useCallback(async (code) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.loginWithGoogleCode(code);
      const currentUser = authApi.getCurrentUser();
      setUser(currentUser);
      return response;
    } catch (err) {
      const errorMessage = err.data?.detail || err.message || 'Google login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (firstName, lastName) => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = new UpdateUserPayload(firstName, lastName);
      const response = await userApi.updateCurrentUser(payload);

      const currentUser = authApi.getCurrentUser();
      if (currentUser) {
        const mergedUser = new User(
          currentUser.sub,
          currentUser.email,
          response?.first_name ?? firstName,
          response?.last_name ?? lastName,
          currentUser.is_verified,
          currentUser.is_active,
          currentUser.exp,
          currentUser.type
        );
        localStorage.setItem('user', JSON.stringify(mergedUser));
        setUser(mergedUser);
      }

      return response;
    } catch (err) {
      const errorMessage = err.data?.detail || err.message || 'Profile update failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await userApi.deleteCurrentUser();
      authApi.logout();
      setUser(null);
    } catch (err) {
      const errorMessage = err.data?.detail || err.message || 'Account deletion failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = {
    user,
    isLoading,
    error,
    isInitialized,
    register,
    login,
    startGoogleLogin,
    completeGoogleLogin,
    updateProfile,
    deleteAccount,
    logout,
    isAuthenticated: user !== null && !user.isTokenExpired?.(),
    isVerified: user?.is_verified === true,
    isActive: user?.is_active === true,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
