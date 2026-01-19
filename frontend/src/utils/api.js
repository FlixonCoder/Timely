import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000',
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            // config.headers.token = token; // Legacy
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

import { toast } from 'react-toastify';

api.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            toast.error("Session expired. Please login again.");
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000); // Slight delay for toast to be visible
        }
        return Promise.reject(error);
    }
);

export default api;
