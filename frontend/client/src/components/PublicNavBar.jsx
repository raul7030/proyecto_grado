// src/components/PublicNavBar.jsx
import { Link } from 'react-router-dom';

const PublicNavBar = () => {
    return (
        <>
            {/* --- TOP BAR (Solo visible en PC) --- */}
            <div className="top-bar text-black py-2 d-none d-lg-block" style={{ backgroundColor: '#f8f9fa' }}>
                <div className="container d-flex justify-content-between align-items-center">
                    <div>
                        <i className="fas fa-map-marker-alt me-2"></i> Cochabamba / Santa Cruz, Bolivia
                    </div>
                    <div>
                        <span className="me-3"><i className="fas fa-phone me-1"></i> +591 76920124</span>
                        <span><i className="fas fa-envelope me-1"></i> ventas@sanrafael.com.bo</span>
                    </div>
                </div>
            </div>

            {/* --- NAVBAR PRINCIPAL --- */}
            {/* Usa estilos en línea temporales si no tienes la clase .bg-sanrafael en tu CSS global */}
            <nav className="navbar navbar-expand-lg navbar-dark sticky-top shadow" style={{ backgroundColor: 'var(--color-primary, #1e3672)' }}>
                <div className="container">
                    
                    {/* LOGO */}
                    <Link className="navbar-brand" to="/">
                        {/* Asegúrate de que este logo exista en tu carpeta public/images/ */}
                        <img src="/images/Logo-Grupo-San-Rafael-postivio - copia (2).png" alt="Grupo San Rafael" style={{ height: '50px' }} />
                    </Link>

                    {/* BOTÓN HAMBURGUESA (Para móviles) */}
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menuPrincipal">
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    {/* ENLACES DEL MENÚ */}
                    <div className="collapse navbar-collapse" id="menuPrincipal">
                        <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center">
                            
                            <li className="nav-item">
                                <Link className="nav-link text-white" to="/">Inicio</Link>
                            </li>
                            
                            <li className="nav-item">
                                <Link className="nav-link text-white" to="/nosotros">Nosotros</Link>
                            </li>
                            
                            {/* MENÚ DESPLEGABLE (Productos) */}
                            <li className="nav-item dropdown">
                                <a className="nav-link dropdown-toggle text-white" href="#" role="button" data-bs-toggle="dropdown">
                                    Productos
                                </a>
                                <ul className="dropdown-menu">
                                    <li><h6 className="dropdown-header">Bombas de Agua</h6></li>
                                    <li><Link className="dropdown-item" to="/catalogo?marca=pedrollo">Pedrollo</Link></li>
                                    <li><Link className="dropdown-item" to="/catalogo?marca=caprari">Caprari</Link></li>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li><h6 className="dropdown-header">Agrícola</h6></li>
                                    <li><Link className="dropdown-item" to="/catalogo?tipo=motocultores">Motocultores Changfa</Link></li>
                                    <li><Link className="dropdown-item" to="/catalogo?tipo=motobombas">Motobombas Koshin</Link></li>
                                </ul>
                            </li>

                            <li className="nav-item">
                                <Link className="nav-link text-white" to="/servicios">Servicios</Link>
                            </li>
                            
                            <li className="nav-item ms-lg-3">
                                <Link className="btn btn-outline-light btn-sm px-4" to="/contacto">Contacto</Link>
                            </li>

                            {/* Enlace directo al ERP para el personal */}
                            <li className="nav-item ms-lg-2 mt-2 mt-lg-0">
                                <Link className="btn btn-warning btn-sm px-3 fw-bold" to="/erp">🔑 ERP</Link>
                            </li>

                        </ul>
                    </div>
                </div>
            </nav>
        </>
    );
};

export default PublicNavBar;