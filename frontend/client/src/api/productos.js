// src/api/productos.js
// Este archivo contiene funciones para interactuar con la API de productos, incluyendo creación, actualización y eliminación.
import axios from './axiosInstance'; // <--- IMPORTANTE

export const getProductos = async () => {
    const response = await axios.get('/productos/');
    return response.data;
};

// Crear producto
export const createProducto = async (formData) => {
    // Nota: Si usas imágenes, asegúrate de enviar formData y headers correctos
    const response = await axios.post('/productos/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

// Actualizar producto
export const updateProducto = async (id, formData) => {
    const response = await axios.put(`/productos/${id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

// Eliminar producto
export const deleteProducto = async (id) => {
    await axios.delete(`/productos/${id}/`);
};