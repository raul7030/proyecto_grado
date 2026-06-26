// src/api/inventario.js
// Este archivo contiene funciones para interactuar con la API de inventario, incluyendo movimientos y traspasos.
import axios from './axiosInstance'; // <--- IMPORTANTE: Usa el nombre correcto de tu archivo

export const obtenerMovimientos = async (filtros = {}) => {
    // Convierte el objeto filtros { producto: 1, sucursal: 2 } a query params: ?producto=1&sucursal=2
    const params = new URLSearchParams(filtros).toString();
    const response = await axios.get(`/movimientos/?${params}`);
    return response.data;
};

export const obtenerTraspasos = async () => {
    const response = await axios.get('/traspasos/');
    return response.data;
};

export const crearTraspaso = async (data) => {
    const response = await axios.post('/traspasos/', data);
    return response.data;
};

export const aprobarTraspaso = async (id) => {
    const response = await axios.post(`/traspasos/${id}/aprobar/`);
    return response.data;
};

export const rechazarTraspaso = async (id) => {
    const response = await axios.post(`/traspasos/${id}/rechazar/`);
    return response.data;
};