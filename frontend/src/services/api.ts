import axios from "axios";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

// Add a request interceptor
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token"); // get token from localStorage
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
