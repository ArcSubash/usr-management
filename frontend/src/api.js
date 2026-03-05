import axios from "axios";

export const api = axios.create({
    baseURL: "/api", // uses Vite proxy
});

// Attach token automatically (if present)
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});