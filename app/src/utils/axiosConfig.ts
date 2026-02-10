// src/utils/axiosConfig.ts
import axios from 'axios';

const BACKEND_URL = 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API,
  timeout: 10000,
});

// Request interceptor to add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('📤 Adding token to request for:', config.url);
    } else {
      console.warn('⚠️ No token found in localStorage for:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      console.log('🔐 401 Unauthorized - Redirecting to login');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;