// src/layouts/PrivateLayout.jsx
import { useContext } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { useLayout } from '../context/LayoutContext';

import SideBar from '../components/SideBar'; 
import NavBar from '../components/NavBar';   

// 👇 Importación actualizada con el nuevo nombre y ubicación
import styles from './PrivateLayout.module.css'; 

const PrivateLayout = () => {
    const { user } = useContext(AuthContext);
    const { isSidebarOpen, toggleSidebar } = useLayout();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div style={{ position: 'relative' }}>
            {/* Backdrop oscuro para móviles */}
            {isSidebarOpen && (
                <div 
                    className="d-md-none" 
                    onClick={toggleSidebar}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 1040,
                        backdropFilter: 'blur(2px)'
                    }}
                />
            )}

            <SideBar />
            
            <div className={`
                ${styles.mainContent} 
                ${!isSidebarOpen ? styles.collapsed : ''}
            `}>
                <NavBar /> 
                
                <main className={styles.pageWrapper}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default PrivateLayout;