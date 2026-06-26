// src/api/sucursales.js
// Este archivo contiene funciones para interactuar con la API de sucursales, incluyendo creación, actualización y eliminación.
import axios from './axiosInstance'; // <--- IMPORTANTE

export const getSucursales = async () => {
    const response = await axios.get('/sucursales/');
    return response.data;
};

// Crear una sucursal (para uso futuro)
export const createSucursal = async (data) => {
    const response = await axios.post('/sucursales/', data);
    return response.data;
};

// Actualizar sucursal
export const updateSucursal = async (id, data) => {
    const response = await axios.put(`/sucursales/${id}/`, data);
    return response.data;
};

// Eliminar sucursal
export const deleteSucursal = async (id) => {
    await axios.delete(`/sucursales/${id}/`);
};