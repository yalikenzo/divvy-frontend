import { apiClient } from './apiClient';
import { Group, UserGroup } from '../types/group';

const toFiniteNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const normalizeScannedItem = (item) => {
  const quantity = Math.max(1, toFiniteNumber(item?.quantity, 1));
  const totalPrice = toFiniteNumber(
    item?.total_price ?? item?.total ?? item?.price,
    0
  );
  const unitPrice = quantity > 0 ? totalPrice / quantity : totalPrice;

  return {
    ...item,
    quantity,
    price: Number(unitPrice.toFixed(2)),
    total_price: Number(totalPrice.toFixed(2)),
  };
};

const normalizeScannedResponse = (payload) => {
  if (Array.isArray(payload)) {
    return payload.map(normalizeScannedItem);
  }

  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.items)) {
      return {
        ...payload,
        items: payload.items.map(normalizeScannedItem),
      };
    }

    if (Array.isArray(payload.data)) {
      return {
        ...payload,
        data: payload.data.map(normalizeScannedItem),
      };
    }
  }

  return payload;
};

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
    const baseURL = process.env.REACT_APP_BACKEND_DOMAIN;
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
      const data = await response.json();
      return normalizeScannedResponse(data);
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
