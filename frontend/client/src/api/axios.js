// src/api/axios.js
// Este archivo configura una instancia de Axios con la URL base de la API y un interceptor para agregar el token de autenticación automáticamente.
import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:8000/api',
});

// Interceptor para agregar el token automáticamente
instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('authTokens');
    
    // --- DEBUG: ESTO SALDRÁ EN LA CONSOLA ---
    console.log(">>> INTENTANDO PETICIÓN A:", config.url);
    console.log(">>> TOKEN EN LOCALSTORAGE:", token);
    // ----------------------------------------

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(">>> HEADER AGREGADO EXITOSAMENTE");
    } else {
        console.warn(">>> ¡ALERTA! NO HAY TOKEN, SE ENVÍA SIN HEADER");
    }
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default instance;