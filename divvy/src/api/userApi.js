import { apiClient } from './apiClient';
import { UpdateUserPayload } from '../types/user';

export const userApi = {
  /**
   * Обновить текущего пользователя
   * @param {UpdateUserPayload} payload
   */
  async updateCurrentUser(payload) {
    return apiClient.patch('/users', payload);
  },

  /**
   * Удалить текущего пользователя
   */
  async deleteCurrentUser() {
    return apiClient.delete('/users');
  },
};

export { UpdateUserPayload };
