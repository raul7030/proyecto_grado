// src/App.jsx
// PUNTO DE ENTRADA PRINCIPAL DE LA APLICACIÓN
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LayoutProvider } from './context/LayoutContext'; 

// --- LAYOUTS ---
import PublicLayout from './layouts/PublicLayout';
import PrivateLayout from './layouts/PrivateLayout';

// --- PÁGINAS PÚBLICAS ---
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';

// --- PÁGINAS DEL ERP (PRIVADAS) ---
import HomePage from './pages/HomePage'; 
import UsuariosPage from './pages/UsuariosPage';
import SucursalesPage from './pages/SucursalesPage';
import SucursalFormPage from './pages/SucursalFormPage';
import CategoriasPage from './pages/CategoriasPage';
import ProductosPage from './pages/ProductosPage';
import ProductoFormPage from './pages/ProductoFormPage';
import Inventario from './pages/Inventario';
import ClientesPage from './pages/ClientesPage';
import PerfilCliente from './pages/PerfilCliente';
import CotizacionesListPage from './pages/CotizacionesListPage';
import CrearCotizacionPage from './pages/CrearCotizacionPage';
import DetalleCotizacionPage from './pages/DetalleCotizacionPage';
import ReportesInventarioPage from './pages/ReportesInventarioPage';
import ReportesAnalisisStockPage from './pages/ReportesAnalisisStockPage';
import CatalogoPage from './pages/CatalogoPage';
import SolicitudesWebPage from './pages/SolicitudesWebPage';
import NosotrosPage from './pages/NosotrosPage';
import ServiciosPage from './pages/ServiciosPage';
import ContactoPage from './pages/ContactoPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordConfirmPage from './pages/ResetPasswordConfirmPage';
import ReportesPage from './pages/ReportesPage';
import ImprimirCotizacionPage from './pages/ImprimirCotizacionPage';

function App() {
    return (
        <AuthProvider>
            <LayoutProvider>
                <Routes>
                    
                    {/* =========================================
                        1. MUNDO PÚBLICO (P/VISITANTES Y CLIENTES)
                        ========================================= */}
                    <Route element={<PublicLayout />}>
                        <Route path="/" element={<LandingPage />} />                        
                        <Route path="/catalogo" element={<CatalogoPage />} />
                        <Route path="/nosotros" element={<NosotrosPage />} />
                        <Route path="/servicios" element={<ServiciosPage />} />
                        <Route path="/contacto" element={<ContactoPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password/:uid/:token" element={<ResetPasswordConfirmPage />} />
                    </Route>

                    {/* =========================================
                        2. LOGIN
                        ========================================= */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* =========================================
                        3. MUNDO PRIVADO (P/USUARIOS AUTENTICADOS)
                        ========================================= */}
                    <Route path="/erp" element={<PrivateLayout />}>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<HomePage />} />
                        <Route path="usuarios" element={<UsuariosPage />} />
                        <Route path="sucursales" element={<SucursalesPage />} />
                        <Route path="sucursales/crear" element={<SucursalFormPage />} />
                        <Route path="categorias" element={<CategoriasPage />} />
                        <Route path="productos" element={<ProductosPage />} />
                        <Route path="productos/crear" element={<ProductoFormPage />} />
                        <Route path="inventario" element={<Inventario />} />
                        
                        {/* Módulo de CRM y Clientes */}
                        <Route path="clientes" element={<ClientesPage />} />
                        <Route path="clientes/perfil/:idCliente" element={<PerfilCliente />} /> {/* <-- Nueva ruta dinámica */}
                        
                        <Route path="cotizaciones" element={<CotizacionesListPage />} />
                        <Route path="cotizaciones/crear" element={<CrearCotizacionPage />} />
                        <Route path="cotizaciones/:id" element={<DetalleCotizacionPage />} />
                        <Route path="reportes/inventario" element={<ReportesInventarioPage />} />
                        <Route path="reportes/analisis-stock" element={<ReportesAnalisisStockPage />} />
                        <Route path="solicitudes" element={<SolicitudesWebPage />} />
                        <Route path="reportes" element={<ReportesPage />} />
                        <Route path="/erp/cotizaciones/:id/imprimir" element={<ImprimirCotizacionPage />} />
                    </Route>

                    {/* =========================================
                        4. RUTA 404
                        ========================================= */}
                    <Route path="*" element={<Navigate to="/" replace />} />

                </Routes>
            </LayoutProvider>
        </AuthProvider>
    );
}

export default App;