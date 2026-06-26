// src/hooks/usePermisos.js
// Este hook centraliza la lógica de permisos basada en el rol del usuario.
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

export const usePermisos = () => {
    const { user } = useContext(AuthContext);
    
    // Extraemos el rol y la sucursal desde el token decodificado
    const rol = user?.rol || '';
    const sucursalId = user?.sucursal_id || null;

    return {
        // --- IDENTIDAD ---
        rolUsuario: rol,
        sucursalUsuario: sucursalId,
        
        // --- ROLES BASE ---
        esAdmin: rol === 'Administrador',
        esVendedor: rol === 'Vendedor',
        // Validamos ambos por si en la BD se usó "Almacenista" o "Almacenero"
        esAlmacenero: ['Almacenero', 'Almacenista'].includes(rol),
        esGerente: rol === 'Gerente',
        
        // --- PERMISOS DE MÓDULOS ---
        // Inventario: Admin y Almacén pueden tocar kardex manual
        puedeTocarStock: ['Administrador', 'Almacenero', 'Almacenista'].includes(rol),
        
        // Catálogo: Admin y Gerente pueden crear productos o categorías
        puedeGestionarCatalogo: ['Administrador', 'Gerente'].includes(rol),
        
        // Seguridad: Solo el Admin crea usuarios
        puedeGestionarUsuarios: rol === 'Administrador',
        
        // Clientes: Vendedor y Admin pueden crear
        puedeCrearClientes: ['Administrador', 'Vendedor'].includes(rol),
        puedeEliminarClientes: rol === 'Administrador', 

        // Ventas: Vendedores y Admin pueden vender
        puedeCrearCotizaciones: ['Administrador', 'Vendedor'].includes(rol),
    };
};