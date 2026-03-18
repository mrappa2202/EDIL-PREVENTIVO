import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const authStore = useAuthStore.getState();
            // Save draft before logout if editing quote
            authStore.logout();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth
export const authApi = {
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    me: () => api.get('/auth/me'),
    getSessions: () => api.get('/auth/sessions'),
    revokeSession: (sessionId) => api.delete(`/auth/sessions/${sessionId}`),
    changePassword: (data) => api.post('/auth/change-password', data),
    heartbeat: () => api.post('/auth/heartbeat'),
};

// Users
export const usersApi = {
    getAll: () => api.get('/users'),
    create: (data) => api.post('/users', data),
    delete: (id) => api.delete(`/users/${id}`),
};

// Categories
export const categoriesApi = {
    getAll: () => api.get('/categories'),
    create: (data) => api.post('/categories', data),
    update: (id, data) => api.put(`/categories/${id}`, data),
    reorder: (positions) => api.put('/categories/reorder', positions),
    delete: (id, reassignTo = null) => 
        api.delete(`/categories/${id}${reassignTo ? `?reassign_to=${reassignTo}` : ''}`),
};

// Saved Options (for combobox persistence)
export const optionsApi = {
    get: (optionType) => api.get(`/options/${optionType}`),
    save: (data) => api.post('/options', data),
};

// Clients
export const clientsApi = {
    getAll: (search = '') => api.get(`/clients?search=${search}`),
    getOne: (id) => api.get(`/clients/${id}`),
    create: (data) => api.post('/clients', data),
    update: (id, data) => api.put(`/clients/${id}`, data),
    delete: (id) => api.delete(`/clients/${id}`),
};

// Quotes
export const quotesApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/quotes?${query}`);
    },
    getOne: (id) => api.get(`/quotes/${id}`),
    create: (data) => api.post('/quotes', data),
    update: (id, data) => api.put(`/quotes/${id}`, data),
    delete: (id) => api.delete(`/quotes/${id}`),
    duplicate: (id) => api.post(`/quotes/${id}/duplicate`),
    getPdf: (id) => api.get(`/quotes/${id}/pdf`, { responseType: 'blob' }),
    // Drafts
    saveDraft: (data) => api.post('/quotes/drafts', data),
    getDrafts: () => api.get('/quotes/drafts'),
    deleteDraft: (id) => api.delete(`/quotes/drafts/${id}`),
};

// Materials
export const materialsApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/materials?${query}`);
    },
    getOne: (id) => api.get(`/materials/${id}`),
    create: (data) => api.post('/materials', data),
    update: (id, data) => api.put(`/materials/${id}`, data),
    delete: (id) => api.delete(`/materials/${id}`),
    adjustStock: (id, adjustment, reason) => 
        api.post(`/materials/${id}/adjust-stock?adjustment=${adjustment}&reason=${encodeURIComponent(reason)}`),
};

// Expenses
export const expensesApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/expenses?${query}`);
    },
    create: (data) => api.post('/expenses', data),
    update: (id, data) => api.put(`/expenses/${id}`, data),
    delete: (id) => api.delete(`/expenses/${id}`),
};

// Employees
export const employeesApi = {
    getAll: () => api.get('/employees'),
    getOne: (id) => api.get(`/employees/${id}`),
    create: (data) => api.post('/employees', data),
    update: (id, data) => api.put(`/employees/${id}`, data),
    delete: (id) => api.delete(`/employees/${id}`),
};

// Work Logs
export const worklogsApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/worklogs?${query}`);
    },
    create: (data) => api.post('/worklogs', data),
    delete: (id) => api.delete(`/worklogs/${id}`),
};

// Payments
export const paymentsApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/payments?${query}`);
    },
    create: (data) => api.post('/payments', data),
    update: (id, data) => api.put(`/payments/${id}`, data),
    delete: (id) => api.delete(`/payments/${id}`),
};

// Settings
export const settingsApi = {
    get: () => api.get('/settings'),
    update: (data) => api.put('/settings', data),
};

// Dashboard
export const dashboardApi = {
    getStats: () => api.get('/dashboard/stats'),
};

// Global Search
export const searchApi = {
    search: (query, limit = 20) => api.get(`/search?q=${encodeURIComponent(query)}&limit=${limit}`),
};

export default api;
