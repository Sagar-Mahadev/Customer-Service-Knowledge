import axios from 'axios';

// Single Axios instance pointing to our Express backend
const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// 1. Customer Management (/api/customers)
export const customerAPI = {
    getAll: () => api.get('/customers'),
    getById: (id) => api.get(`/customers/${id}`),
    create: (data) => api.post('/customers', data),
    update: (id, data) => api.put(`/customers/${id}`, data),
    delete: (id) => api.delete(`/customers/${id}`),
};

// 2. Support Request Management + ML (/api/support-requests)
export const ticketAPI = {
    getAll: () => api.get('/support-requests'),
    getById: (ticketId) => api.get(`/support-requests/${ticketId}`),
    create: (data) => api.post('/support-requests', data),
    update: (ticketId, data) => api.put(`/support-requests/${ticketId}`, data),
    delete: (ticketId) => api.delete(`/support-requests/${ticketId}`),
};

// 3. Knowledge Category Management (/api/knowledge-categories)
export const categoryAPI = {
    getAll: () => api.get('/knowledge-categories'),
    getById: (categoryId) => api.get(`/knowledge-categories/${categoryId}`),
    create: (data) => api.post('/knowledge-categories', data),
    update: (categoryId, data) => api.put(`/knowledge-categories/${categoryId}`, data),
    deactivate: (categoryId) => api.delete(`/knowledge-categories/${categoryId}`),
};

// 4. Knowledge Articles & Versions (/api/knowledge-articles)
export const articleAPI = {
    getAll: () => api.get('/knowledge-articles'),
    getById: (articleId) => api.get(`/knowledge-articles/${articleId}`),
    create: (data) => api.post('/knowledge-articles', data),
    update: (articleId, data) => api.patch(`/knowledge-articles/${articleId}`, data),
    approve: (articleId, updatedBy) => api.patch(`/knowledge-articles/${articleId}/approve`, { updatedBy }),
    publish: (articleId, updatedBy) => api.patch(`/knowledge-articles/${articleId}/publish`, { updatedBy }),
    retire: (articleId, updatedBy) => api.patch(`/knowledge-articles/${articleId}/retire`, { updatedBy }),
    getVersions: (articleId) => api.get(`/knowledge-articles/${articleId}/versions`),
    getVersion: (articleId, versionNumber) =>
        api.get(`/knowledge-articles/${articleId}/versions/${versionNumber}`),
};

export default api;