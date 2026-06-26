// src/api/clientes.js
import axiosInstance from './axiosInstance';

export const obtenerDetalleCliente = async (idCliente) => {
    const response = await axiosInstance.get(`/clientes/${idCliente}/`);
    return response.data;
};

export const obtenerHistorialCotizaciones = async (idCliente) => {
    const response = await axiosInstance.get(`/cotizaciones/?cliente=${idCliente}`);
    return response.data;
};

export const obtenerHistorialCompras = async (idCliente) => {
    const response = await axiosInstance.get(`/cotizaciones/?cliente=${idCliente}&estado=ACEPTADA`);
    
    // Corrección del mapeo usando los campos exactos del modelo Django
    return response.data.map(cot => ({
        id_venta: cot.id_cotizacion,
        codigo_transaccion: cot.codigo_cotizacion,
        fecha_emision: cot.fecha_creacion,
        metodo_pago: 'Efectivo / Transferencia',
        moneda: 'Bs.', 
        total_pagado: cot.total 
    }));
};