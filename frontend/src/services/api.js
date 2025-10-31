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

// Funções de autenticação
export const authService = {
    login: (credentials) => api.post('/auth/login/', credentials),
    logout: () => api.post('/auth/logout/'),
    register: (userData) => api.post('/auth/register/', userData),
    getCurrentUser: () => api.get('/auth/user/'),
    getCsrfToken: () => api.get('/auth/csrf/'),
};

// Funções de momentos
export const momentosService = {
    listar: (params) => api.get('/momentos/', { params }),
    criar: (formData) => api.post('/momentos/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    buscar: (id) => api.get(`/momentos/${id}/`),
    like: (id) => api.post(`/momentos/${id}/like/`),
    unlike: (id) => api.delete(`/momentos/${id}/like/`),
};

export default api;