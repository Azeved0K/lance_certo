import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para incluir CSRF token
api.interceptors.request.use((config) => {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
    }
    return config;
});

api.interceptors.response.use(
    response => response,
    async (error) => {
        const originalRequest = error.config;
        if (
            error.response &&
            error.response.status === 403 &&
            originalRequest &&
            !originalRequest.__isRetry &&
            originalRequest.method && originalRequest.method.toLowerCase() === 'post'
        ) {
            try {
                await api.get('/auth/csrf/');
                originalRequest.__isRetry = true;
                return api.request(originalRequest);
            } catch (e) {
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    }
);

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

async function ensureCsrf() {
    try {
        const resp = await api.get('/auth/csrf/');
        const token = resp?.data?.csrfToken;
        if (token) {
            api.defaults.headers['X-CSRFToken'] = token;
        }
    } catch (e) {
        /* ignora */
    }
}

// Funções de autenticação
export const authService = {
    login: async (credentials) => {
        await ensureCsrf();
        return api.post('/auth/login/', credentials);
    },
    logout: () => api.post('/auth/logout/'),
    register: async (userData) => {
        await ensureCsrf();
        return api.post('/auth/register/', userData);
    },
    getCurrentUser: () => api.get('/auth/user/'),
    getCsrfToken: () => api.get('/auth/csrf/'),
    getPublicProfile: (username) => api.get(`/auth/profile/${username}/`),
    searchUsers: (query) => api.get(`/auth/search/`, { params: { search: query } }),
    sendPasswordResetCode: async (email) => { await ensureCsrf(); return api.post('/auth/password-reset-code/', { email }); },
    verifyPasswordResetCode: async (email, code) => { await ensureCsrf(); return api.post('/auth/password-reset-verify/', { email, code }); },
    resetPassword: async (email, code, new_password) => { await ensureCsrf(); return api.post('/auth/password-reset/', { email, code, new_password }); },
};

// Funções de momentos
export const momentosService = {
    listar: (params) => api.get('/momentos/', {params}),
    criar: (formData) => api.post('/momentos/', formData, {
        headers: {'Content-Type': 'multipart/form-data'},
    }),
    buscar: (id) => api.get(`/momentos/${id}/`),
    atualizar: (id, data) => api.patch(`/momentos/${id}/`, data),
    deletar: (id) => api.delete(`/momentos/${id}/`),
    like: (id) => api.post(`/momentos/${id}/like/`),
    unlike: (id) => api.delete(`/momentos/${id}/like/`),
    incrementarView: (id) => api.post(`/momentos/${id}/view/`),
    getSuggestions: (id) => api.get(`/momentos/${id}/suggestions/`),
};

// Função de Notificações
export const notificacoesService = {
    listar: () => api.get('/momentos/notificacoes/'),
    marcarTodasLidas: () => api.post('/momentos/notificacoes/marcar-lidas/'),
};

export default api;