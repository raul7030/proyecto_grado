// src/context/AuthContext.jsx
// Este archivo define el contexto de autenticación para la aplicación, manejando el estado del usuario y los tokens JWT.
import { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

// 1. Crear el Contexto
const AuthContext = createContext();

// Exportamos el proveedor de contexto
export const AuthProvider = ({ children }) => {
    // 2. Estados
    // Obtener tokens de localStorage (si existen)
    const [authTokens, setAuthTokens] = useState(() => 
        localStorage.getItem('authTokens') 
        ? JSON.parse(localStorage.getItem('authTokens')) 
        : null
    );

    // Obtener usuario decodificado del token (si existe)
    const [user, setUser] = useState(() => 
        localStorage.getItem('authTokens') 
        ? jwtDecode(JSON.parse(localStorage.getItem('authTokens')).access) 
        : null
    );

    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // 3. Lógica de Login
    const loginUser = async (username, password) => {
            try {
                // Hacemos la petición POST a /login/ (axiosInstance añade la baseURL)
                const response = await axiosInstance.post('/token/', {
                    username: username,
                    password: password
                });

                const data = response.data;

                // Si la petición es exitosa (status 200)
                if (response.status === 200) {
                    // 1. Guardar tokens en el estado
                    setAuthTokens(data);
                    // 2. Decodificar el token para obtener info del usuario
                    setUser(jwtDecode(data.access));
                    // 3. Guardar tokens en localStorage para persistencia
                    localStorage.setItem('authTokens', JSON.stringify(data));
                    // 4. Redirigir al Dashboard (la página principal)
                    navigate('/erp/dashboard/');
                } 
            } catch (error) {
                // Manejar errores
                console.error("Error en el login:", error);
                if (error.response && error.response.status === 401) {
                    alert('¡Usuario o contraseña incorrectos!');
                } else {
                    alert('Ocurrió un error al intentar iniciar sesión.');
                }
            }
        };

    // 4. Lógica de Logout
    const logoutUser = () => {
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
        navigate('/login');
    };

    // 5. Datos que el contexto proveerá
    const contextData = {
        user: user,
        authTokens: authTokens,
        loginUser: loginUser,
        logoutUser: logoutUser,
    };

    // 6. Efecto para actualizar el estado de carga
    useEffect(() => {
        // Lógica para verificar validez del token (se puede agregar después)
        setLoading(false);
    }, [authTokens]);

    // 7. Retornar el Proveedor
    return (
        <AuthContext.Provider value={contextData}>
            {/* Solo renderiza hijos si no está cargando */}
            {loading ? null : children} 
        </AuthContext.Provider>
    );
};

export default AuthContext;