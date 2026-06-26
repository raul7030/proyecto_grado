// src/api/axiosInstance.js
import axios from 'axios';

const baseURL = 'http://localhost:8000/api'; // Ajusta esto si tu URL es diferente

const axiosInstance = axios.create({
    baseURL: baseURL,
});

// ============================================================================
// 1. INTERCEPTOR DE PETICIONES (Pone la llave VIP antes de salir)
// ============================================================================
axiosInstance.interceptors.request.use(async req => {
    const authTokens = localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null;
    
    if (authTokens) {
        req.headers.Authorization = `Bearer ${authTokens.access}`;
    }
    return req;
});

// ============================================================================
// 2. INTERCEPTOR DE RESPUESTAS (El Escudo Silencioso)
// ============================================================================
axiosInstance.interceptors.response.use(
    (response) => {
        // Todo salió bien (Código 200), dejamos pasar la respuesta.
        return response;
    },
    async (error) => {
        // Atrapamos la petición original que acaba de fallar
        const originalRequest = error.config;

        // Si el error es 401 (Token expirado) y NO hemos intentado reintentar esta misma petición
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            
            // 👈 EL TRUCO: Marcamos esta petición para no caer en un bucle infinito
            originalRequest._retry = true; 

            const authTokens = localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null;

            // Si tenemos el "pase maestro" (Refresh Token) guardado...
            if (authTokens && authTokens.refresh) {
                try {
                    // 1. Vamos en secreto a Django a pedir llaves nuevas
                    // Nota: Usamos axios normal aquí, no axiosInstance, para evitar bucles.
                    const response = await axios.post(`${baseURL}/token/refresh/`, {
                        refresh: authTokens.refresh
                    });

                    // 2. ¡Éxito! Guardamos las llaves nuevas en el navegador
                    localStorage.setItem('authTokens', JSON.stringify(response.data));

                    // 3. Le cambiamos la llave vieja por la nueva a la petición que había fallado
                    originalRequest.headers.Authorization = `Bearer ${response.data.access}`;

                    // 4. Volvemos a disparar la petición como si nada hubiera pasado
                    return axiosInstance(originalRequest);

                } catch (refreshError) {
                    // Si este bloque falla, significa que el Refresh Token (de 1 día) también expiró.
                    // Aquí SÍ debemos echar al usuario por seguridad.
                    console.warn("Sesión caducada por completo. Redirigiendo al login...");
                    localStorage.removeItem('authTokens');
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            } else {
                // No hay Refresh Token, echamos al usuario directo
                localStorage.removeItem('authTokens');
                window.location.href = '/login';
            }
        }
        
        // Si es cualquier otro error (Ej: 404, 500), simplemente lo devolvemos
        return Promise.reject(error);
    }
);

export default axiosInstance;