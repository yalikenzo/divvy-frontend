import { apiClient } from './apiClient';
import { RegisterPayload, LoginPayload, User } from '../types/auth';

/**
 * Парсит JWT токен и извлекает payload
 */
function parseJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
}

export const authApi = {
  /**
   * Регистрация нового пользователя
   * @param {RegisterPayload} payload
   * @returns {Promise<{access_token: string, refresh_token: string, token_type: string}>}
   */
  async register(payload) {
    const response = await apiClient.post('/auth/register', payload);

    // Сохраняем токены
    if (response.access_token && response.refresh_token) {
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);

      // Парсим JWT и сохраняем user данные
      const userPayload = parseJWT(response.access_token);
      if (userPayload) {
        const user = User.fromJWTPayload(userPayload);
        localStorage.setItem('user', JSON.stringify(user));
      }
    }

    return response;
  },

  /**
   * Вход пользователя
   * @param {LoginPayload} payload
   * @returns {Promise<{access_token: string, refresh_token: string, token_type: string}>}
   */
  async login(payload) {
    const response = await apiClient.post('/auth/login', payload);

    // Сохраняем токены
    if (response.access_token && response.refresh_token) {
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);

      // Парсим JWT и сохраняем user данные
      const userPayload = parseJWT(response.access_token);
      if (userPayload) {
        const user = User.fromJWTPayload(userPayload);
        localStorage.setItem('user', JSON.stringify(user));
      }
    }

    return response;
  },

  /**
   * Выход пользователя
   */
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  /**
   * Получить текущего пользователя из localStorage
   * @returns {User|null}
   */
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

      // Проверяем истек ли токен
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

  /**
   * Проверить авторизован ли пользователь
   * @returns {boolean}
   */
  isAuthenticated() {
    const token = localStorage.getItem('access_token');
    if (!token) return false;

    const user = authApi.getCurrentUser();
    return user !== null && !user.isTokenExpired();
  },

  /**
   * Проверить верифицирован ли пользователь
   * @returns {boolean}
   */
  isUserVerified() {
    const user = authApi.getCurrentUser();
    return user?.is_verified === true;
  },

  /**
   * Проверить активен ли пользователь
   * @returns {boolean}
   */
  isUserActive() {
    const user = authApi.getCurrentUser();
    return user?.is_active === true;
  },
};
