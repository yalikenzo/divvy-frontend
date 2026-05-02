import { apiClient } from './apiClient';

export const virtualCardApi = {
    async getVirtualCard() {
        return apiClient.get('/virtual-card/');
    },

    async createVirtualCard() {
        return apiClient.post('/virtual-card/');
    },

    async payDebt(cardId, payload) {
        return apiClient.post(`/virtual-card/${cardId}/pay-debt`, payload);
    },

    async deposit(cardId, payload) {
        return apiClient.post(`/virtual-card/${cardId}/deposit`, payload);
    },

    async convert(cardId, payload) {
        return apiClient.post(`/virtual-card/${cardId}/convert`, payload);
    },
};
