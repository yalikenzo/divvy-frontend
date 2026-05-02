import { apiClient } from './apiClient';
import { User } from '../types/auth';

const BACKEND_DOMAIN = process.env.REACT_APP_BACKEND_DOMAIN;

function parseJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
}

function saveTokenPair(tokenPair) {
  if (!tokenPair?.access_token) return;

  localStorage.setItem('access_token', tokenPair.access_token);
  if (tokenPair.refresh_token) {
    localStorage.setItem('refresh_token', tokenPair.refresh_token);
  } else {
    localStorage.removeItem('refresh_token');
  }

  const userPayload = parseJWT(tokenPair.access_token);
  if (!userPayload) return;

  const user = User.fromJWTPayload(userPayload);
  localStorage.setItem('user', JSON.stringify(user));
}

export const authApi = {
  async register(payload) {
    const response = await apiClient.post('/auth/register', payload);
    saveTokenPair(response);
    return response;
  },

  async login(payload) {
    const response = await apiClient.post('/auth/login', payload);
    saveTokenPair(response);
    return response;
  },

  getGoogleLoginUrl() {
    return `${BACKEND_DOMAIN}/auth/google/login`;
  },

  async loginWithGoogleCode(code) {
    const response = await apiClient.get(`/auth/google/complete?code=${encodeURIComponent(code)}`);
    saveTokenPair(response);
    return response;
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;

      const userData = JSON.parse(userStr);
      const user = new User(
        userData.sub,
        userData.email,
        userData.first_name,
        userData.last_name,
        userData.is_verified,
        userData.is_active,
        userData.exp,
        userData.type
      );

      if (user.isTokenExpired()) {
        authApi.logout();
        return null;
      }

      return user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  },

  isAuthenticated() {
    const token = localStorage.getItem('access_token');
    if (!token) return false;

    const user = authApi.getCurrentUser();
    return user !== null && !user.isTokenExpired();
  },

  isUserVerified() {
    const user = authApi.getCurrentUser();
    return user?.is_verified === true;
  },

  isUserActive() {
    const user = authApi.getCurrentUser();
    return user?.is_active === true;
  },
};
