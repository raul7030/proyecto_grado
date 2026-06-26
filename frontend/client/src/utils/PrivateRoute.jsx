// src/utils/PrivateRoute.jsx

import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const PrivateRoute = () => {
    const { user } = useContext(AuthContext);

    // Si no hay usuario, redirige a /login
    // 'replace' evita que el usuario pueda "volver" a la página protegida
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Si hay usuario, muestra el componente hijo (la página protegida)
    return <Outlet />;
};

export default PrivateRoute;