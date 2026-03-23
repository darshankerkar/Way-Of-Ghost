import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

export const http = axios.create({
  baseURL: `${baseURL}/api`,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
