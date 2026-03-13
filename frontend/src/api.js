import axios from "axios";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "https://usr-mng-bknd.onrender.com/api",
});

// Attach token automatically (if present)
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});