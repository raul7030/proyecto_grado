// src/api/cotizaciones.js
// Este archivo contiene funciones para interactuar con la API de cotizaciones, incluyendo la nueva función para aprobar cotizaciones.
import axios from './axiosInstance';

export const getCotizaciones = async () => {
    const response = await axios.get('/cotizaciones/');
    return response.data;
};

export const createCotizacion = async (data) => {
    const response = await axios.post('/cotizaciones/', data);
    return response.data;
};

export const getCotizacionById = async (id) => {
    const response = await axios.get(`/cotizaciones/${id}/`);
    return response.data;
};

// --- ESTA ES LA NUEVA ---
export const aprobarCotizacion = async (id) => {
    const response = await axios.post(`/cotizaciones/${id}/aprobar/`);
    return response.data;
};