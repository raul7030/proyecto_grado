// src/components/PublicFooter.jsx
import { Link } from 'react-router-dom';
import styles from './PublicFooter.module.css';

const PublicFooter = () => {
    // Obtenemos el año actual automáticamente
    const currentYear = new Date().getFullYear();

    return (
        <footer className={`${styles.bgFooter} pt-5 pb-3 mt-auto`}>
            <div className="container">
                <div className="row">
                    
                    {/* COLUMNA 1: INFO DE LA EMPRESA */}
                    <div className="col-md-4 mb-4">
                        <h5 className="text-uppercase fw-bold mb-3 text-white">Grupo San Rafael</h5>
                        <p className="small text-white-50">
                            Líderes en soluciones hidráulicas y maquinaria agrícola en Bolivia. 
                            Representantes oficiales de marcas de prestigio mundial.
                        </p>
                    </div>

                    {/* COLUMNA 2: ENLACES RÁPIDOS */}
                    <div className="col-md-4 mb-4">
                        <h5 className="text-uppercase fw-bold mb-3 text-white">Enlaces Rápidos</h5>
                        <ul className="list-unstyled">
                            <li className="mb-2">
                                <Link to="/" className={`text-decoration-none text-white-50 ${styles.hoverWhite}`}>
                                    <i className="fas fa-chevron-right me-2 small"></i>Inicio
                                </Link>
                            </li>
                            <li className="mb-2">
                                <Link to="/catalogo?marca=pedrollo" className={`text-decoration-none text-white-50 ${styles.hoverWhite}`}>
                                    <i className="fas fa-chevron-right me-2 small"></i>Bombas Pedrollo
                                </Link>
                            </li>
                            <li className="mb-2">
                                <Link to="/servicios" className={`text-decoration-none text-white-50 ${styles.hoverWhite}`}>
                                    <i className="fas fa-chevron-right me-2 small"></i>Perforación de Pozos
                                </Link>
                            </li>
                            <li className="mb-2">
                                <Link to="/contacto" className={`text-decoration-none text-white-50 ${styles.hoverWhite}`}>
                                    <i className="fas fa-chevron-right me-2 small"></i>Solicitar Cotización
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* COLUMNA 3: CONTACTO */}
                    <div className="col-md-4 mb-4">
                        <h5 className="text-uppercase fw-bold mb-3 text-white">Contáctanos</h5>
                        <div>
                            <p className="mb-2 text-white-50"><i className="fas fa-map-marker-alt me-2"></i> Av. Blanco Galindo Km 5</p>
                            <p className="mb-2 text-white-50"><i className="fas fa-phone me-2"></i> +591 4 444 4444</p>
                            <p className="mb-2 text-white-50"><i className="fab fa-whatsapp me-2"></i> +591 76920124</p>
                            <p className="text-white-50"><i className="fas fa-envelope me-2"></i> ventas@sanrafael.com.bo</p>
                        </div>
                    </div>
                </div>

                <hr className="border-secondary my-4" />

                {/* FILA INFERIOR: COPYRIGHT Y REDES SOCIALES */}
                <div className="row align-items-center">
                    <div className="col-md-6 text-center text-md-start">
                        <p className="small mb-0 text-white-50">
                            &copy; {currentYear} Grupo San Rafael. Todos los derechos reservados.
                        </p>
                    </div>
                    <div className="col-md-6 text-center text-md-end">
                        <a href="#" className="text-white me-3" target="_blank" rel="noopener noreferrer"><i className="fab fa-facebook-f"></i></a>
                        <a href="#" className="text-white me-3" target="_blank" rel="noopener noreferrer"><i className="fab fa-instagram"></i></a>
                        <a href="#" className="text-white" target="_blank" rel="noopener noreferrer"><i className="fab fa-linkedin-in"></i></a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default PublicFooter;