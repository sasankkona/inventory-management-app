import axios from 'axios';

const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    (process.env.NODE_ENV === 'production'
        ? 'https://inventory-management-app-sx1n.onrender.com'
        : 'http://localhost:4000');

const api = axios.create({
    baseURL: API_BASE_URL,
});

export const getProducts = async (category) => {
    const params = {};
    if (category) params.category = category;
    const res = await api.get('/api/products', { params });
    return res.data;
};

export const searchProducts = async (name) => {
    const res = await api.get('/api/products/search', { params: { name } });
    return res.data;
};

export const importProducts = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/api/products/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
};

export const exportProducts = async () => {
    const res = await api.get('/api/products/export', { responseType: 'blob' });
    return res.data;
};

export const updateProduct = async (id, data) => {
    const res = await api.put(`/api/products/${id}`, data);
    return res.data;
};

export const getProductHistory = async (id) => {
    const res = await api.get(`/api/products/${id}/history`);
    return res.data;
};

export default api;
