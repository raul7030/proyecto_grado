// src/components/SideBar.jsx
import { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { useLayout } from "../context/LayoutContext"; 
import { usePermisos } from '../hooks/usePermisos';
import styles from './SideBar.module.css'; // <-- Asegúrate de importar tu CSS Module

const SideBar = () => {
    const { isSidebarOpen, toggleSidebar } = useLayout(); 
    const { user, logoutUser } = useContext(AuthContext);
    
    const { esAdmin, puedeTocarStock } = usePermisos();

    if (!user) return null;

    // Actualizamos NavItem para usar las clases del módulo
    const NavItem = ({ to, icon, label }) => (
        <Link to={to} className={styles.navItem} title={!isSidebarOpen ? label : ''}>
            <span className={styles.navIcon}>{icon}</span>
            <span className={styles.navLabel} style={{ display: isSidebarOpen ? 'block' : 'none' }}>{label}</span>
        </Link>
    );

    return (
        <div 
            className={styles.sidebar} 
            style={{ width: isSidebarOpen ? '250px' : '80px' }}
        > 
            
            <button onClick={toggleSidebar} className={styles.toggleButton}>
                {isSidebarOpen ? '◄' : '►'}
            </button>

            <div className={styles.sidebarHeader}>
                <h3 style={{ display: isSidebarOpen ? 'block' : 'none' }}>SR System</h3>
                <span className={styles.navIcon} style={{ display: isSidebarOpen ? 'none' : 'block' }}>SR</span>
            </div>

            <div className={styles.navMenu}>
                <NavItem to="/erp/dashboard" icon="🏠" label="Inicio" />
                <NavItem to="/erp/solicitudes" icon="📩" label="Solicitudes Web" />
                <NavItem to="/erp/cotizaciones" icon="📝" label="Cotizaciones" />
                <NavItem to="/erp/cotizaciones/crear" icon="➕" label="Crear Cotización" />
                
                <div className={styles.separator}></div>
                
                <NavItem to="/erp/clientes" icon="👥" label="Clientes" />
                <NavItem to="/erp/productos" icon="📦" label="Catálogo" />
                <NavItem to="/erp/categorias" icon="📂" label="Categorías" />
                
                {puedeTocarStock && (
                    <NavItem to="/erp/inventario" icon="📊" label="Inventario / Kardex" />
                )}

                {esAdmin && (
                    <>
                        <div className={styles.separator}></div>
                        <NavItem to="/erp/sucursales" icon="🏢" label="Sucursales" />
                        <NavItem to="/erp/usuarios" icon="🧑‍💻" label="Usuarios" />
                    </>
                )}
            </div>

            <div className={styles.sidebarFooter}>
                <div style={{ display: isSidebarOpen ? 'block' : 'none' }} className={styles.userInfo}>
                    <strong>{user?.username}</strong><br/>
                    <small>{user?.rol}</small>
                </div>
                <button onClick={logoutUser} className={styles.logoutButton} title="Cerrar Sesión">
                    {isSidebarOpen ? 'Cerrar Sesión' : '🚪'}
                </button>
            </div>
        </div>
    );
};

export default SideBar;