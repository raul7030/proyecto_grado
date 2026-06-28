// src/hooks/usePermisos.js
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

export const usePermisos = () => {
    const { user } = useContext(AuthContext);
    
    // Extraemos el rol, el ID de la sucursal y el NUEVO campo con el nombre de texto
    const rol = user?.rol || '';
    const sucursalId = user?.sucursal_id || null;
    const sucursalNombre = user?.sucursal_usuario || 'Asignada'; // <-- CAPTURAMOS EL NOMBRE DEL TOKEN

    return {
        // --- IDENTIDAD ---
        rolUsuario: rol,
        sucursalUsuario: sucursalId,     // Se queda como ID para las peticiones de las APIs
        nombreSucursal: sucursalNombre,   // <-- NUEVO: Para mostrar en texto en los diseños
        
        // --- ROLES BASE ---
        esAdmin: rol === 'Administrador',
        esVendedor: rol === 'Vendedor',
        esAlmacenero: ['Almacenero', 'Almacenista'].includes(rol),
        esGerente: rol === 'Gerente',
        
        // --- PERMISOS DE MÓDULOS ---
        puedeTocarStock: ['Administrador', 'Almacenero', 'Almacenista'].includes(rol),
        puedeGestionarCatalogo: ['Administrador', 'Gerente'].includes(rol),
        puedeGestionarUsuarios: rol === 'Administrador',
        puedeCrearClientes: ['Administrador', 'Vendedor'].includes(rol),
        puedeEliminarClientes: rol === 'Administrador', 
        puedeCrearCotizaciones: ['Administrador', 'Vendedor'].includes(rol),
    };
};