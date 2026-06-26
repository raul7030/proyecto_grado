// src/context/LayoutContext.jsx
import { createContext, useState, useContext } from 'react';

const LayoutContext = createContext();

// Hook personalizado para usar el contexto fácilmente
export const useLayout = () => useContext(LayoutContext);

export const LayoutProvider = ({ children }) => {
    // Estado inicial: el menú está abierto
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); 

    // Función para alternar el estado
    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    return (
        <LayoutContext.Provider value={{ isSidebarOpen, toggleSidebar }}>
            {children}
        </LayoutContext.Provider>
    );
};