import { apiClient } from './apiClient';

const baseURL = process.env.BACKEND_DOMAIN || 'http://localhost:8001';

const getToken = () => localStorage.getItem('access_token');

const buildUrl = (path, params = {}) => {
    const url = new URL(path, baseURL);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
        }
    });
    return url.toString();
};

export const mediaApi = {
    async getGroupMedia(groupId) {
        return apiClient.get(`/group-media/group/${groupId}`);
    },

    async getMediaBlobUrl(key) {
        const url = buildUrl('/minio/media', { key });
        const token = getToken();

        const response = await fetch(url, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) {
            throw new Error(`Failed to load media: ${response.status}`);
        }

        const blob = await response.blob();
        return URL.createObjectURL(blob);
    },

    async uploadReceipt(groupId, files, expenseId = null) {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));

        const url = buildUrl('/group-media/receipt', { group_id: groupId, expense_id: expenseId });
        const token = getToken();

        const response = await fetch(url, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        });

        if (!response.ok) {
            let detail = 'Failed to upload receipt';
            try {
                const data = await response.json();
                detail = data?.detail || detail;
            } catch {}
            const error = new Error(detail);
            error.status = response.status;
            throw error;
        }

        return response.json();
    },

    async uploadPhoto(groupId, files) {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));

        const url = buildUrl('/group-media/photo', { group_id: groupId });
        const token = getToken();

        const response = await fetch(url, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        });

        if (!response.ok) {
            let detail = 'Failed to upload photo';
            try {
                const data = await response.json();
                detail = data?.detail || detail;
            } catch {}
            const error = new Error(detail);
            error.status = response.status;
            throw error;
        }

        return response.json();
    },
};
