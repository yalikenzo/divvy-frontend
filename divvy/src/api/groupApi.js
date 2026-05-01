import { apiClient } from './apiClient';
import { CreateGroupPayload, Group, UpdateGroupPayload, InviteToGroupPayload, UserGroup } from '../types/group';

export const groupApi = {
  async createGroup(payload) {
    const response = await apiClient.post('/groups/create-group', payload);
    return Group.fromResponse(response);
  },

  async getGroups() {
    const response = await apiClient.get('/groups/user-groups');
    return response.map(group => Group.fromResponse(group));
  },

  async getGroup(groupId) {
    const response = await apiClient.get(`/groups/${groupId}`);
    return Group.fromResponse(response);
  },

  async getGroupMembers(groupId) {
    return apiClient.get(`/user-groups/by-group-id/${groupId}`);
  },

  async updateGroup(groupId, payload) {
    const response = await apiClient.put(`/groups/${groupId}`, payload);
    return Group.fromResponse(response);
  },

  async inviteByEmail(payload) {
    const response = await apiClient.post('/user-groups/invite-by-email', payload);
    return UserGroup.fromResponse(response);
  },

  async deleteGroup(groupId) {
    await apiClient.delete(`/groups/${groupId}`);
  },

  async joinGroup(invitationCode) {
    const response = await apiClient.post(`/groups/join/${invitationCode}`);
    return Group.fromResponse(response);
  },

  async scanReceipt(groupId, files, expenseId = null) {
    const baseURL = process.env.BACKEND_DOMAIN || 'http://localhost:8001';
    const params = new URLSearchParams({ group_id: String(groupId) });
    if (expenseId !== null && expenseId !== undefined) {
      params.append('expense_id', String(expenseId));
    }

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const token = localStorage.getItem('access_token');
    const response = await fetch(`${baseURL}/scan-receipt?${params.toString()}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      let detail = 'Failed to scan receipt';
      try {
        const data = await response.json();
        detail = data?.detail || detail;
      } catch {
      }
      const error = new Error(detail);
      error.status = response.status;
      throw error;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }
    return response.text();
  },

  async createGroupExpense(payload) {
    return apiClient.post('/group-expenses', payload);
  },

  async getGroupExpenses(groupId) {
    return apiClient.get(`/group-expenses/${groupId}`);
  },

  async updateGroupExpense(payload) {
    return apiClient.put('/group-expenses', payload);
  },

  async getExpenseSplitBalances(groupId) {
    return apiClient.get(`/expense-split/${groupId}/balances`);
  },

  async getExpenseSplitDetails(groupId) {
    return apiClient.get(`/expense-split/get-all/${groupId}`);
  },
};
