import { apiClient } from './apiClient';

export const userApi = {
  updateUserProfile(payload) {
    return apiClient.patch('/users', payload);
  },

  changePassword(payload) {
    return apiClient.post('/users/change-password', payload);
  },

  deleteAccount() {
    return apiClient.delete('/users');
  },
};
