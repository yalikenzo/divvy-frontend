import { apiClient } from './apiClient';
import { CreateGroupPayload, Group, UpdateGroupPayload, InviteToGroupPayload, UserGroup } from '../types/group';

export const groupApi = {
  /**
   * Создать новую группу
   * @param {CreateGroupPayload} payload
   * @returns {Promise<Group>}
   */
  async createGroup(payload) {
    const response = await apiClient.post('/groups/create-group', payload);
    return Group.fromResponse(response);
  },

  /**
   * Получить список всех групп пользователя
   * @returns {Promise<Group[]>}
   */
  async getGroups() {
    const response = await apiClient.get('/groups/user-groups');
    return response.map(group => Group.fromResponse(group));
  },

  /**
   * Получить информацию о конкретной группе
   * @param {number} groupId
   * @returns {Promise<Group>}
   */
  async getGroup(groupId) {
    const response = await apiClient.get(`/groups/${groupId}`);
    return Group.fromResponse(response);
  },

  /**
   * Обновить группу
   * @param {number} groupId
   * @param {UpdateGroupPayload} payload
   * @returns {Promise<Group>}
   */
  async updateGroup(groupId, payload) {
    const response = await apiClient.put(`/groups/${groupId}`, payload);
    return Group.fromResponse(response);
  },

  /**
   * Пригласить пользователя в группу по email
   * @param {InviteToGroupPayload} payload
   * @returns {Promise<UserGroup>}
   */
  async inviteByEmail(payload) {
    const response = await apiClient.post('/user-groups/invite-by-email', payload);
    return UserGroup.fromResponse(response);
  },

  /**
   * Удалить группу
   * @param {number} groupId
   * @returns {Promise<void>}
   */
  async deleteGroup(groupId) {
    await apiClient.delete(`/groups/${groupId}`);
  },

  /**
   * Присоединиться к группе по инвайт-ссылке
   * @param {string} invitationCode
   * @returns {Promise<Group>}
   */
  async joinGroup(invitationCode) {
    const response = await apiClient.post(`/groups/join/${invitationCode}`);
    return Group.fromResponse(response);
  },
};
