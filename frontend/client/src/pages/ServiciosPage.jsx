// src/pages/ServiciosPage.jsx
import { Link } from 'react-router-dom';
import styles from './ServiciosPage.module.css';

const ServiciosPage = () => {
    return (
        <div className={styles.pageContainer}>
            
            {/* HERO SECTION */}
            <div className={styles.heroSection}>
                <div className="container text-center">
                    <h1 className="fw-bold display-4 mb-3">Nuestros Servicios</h1>
                    <p className="lead mx-auto" style={{ maxWidth: '800px' }}>
                        Respaldamos tu inversión con soporte técnico especializado y ejecución de proyectos hídricos a medida.
                    </p>
                </div>
            </div>

            <div className="container py-5">
                
                {/* SECCIÓN 1: SERVICIO TÉCNICO */}
                <div className="text-center mb-5">
                    <span className={`badge ${styles.badgePrimary} mb-2`}>Soporte Integral</span>
                        <h2 className={`fw-bold mb-4 ${styles.letraAzul}`}>Servicio Técnico Especializado</h2>
                    <p className="mx-auto" style={{ maxWidth: '600px' }}>
                        Nuestro equipo de ingenieros y técnicos está capacitado para garantizar que tus equipos funcionen al 100% de su capacidad durante toda su vida útil.
                    </p>
                </div>

                <div className="row g-4 mb-5 pb-5 border-bottom">
                    {/* Tarjeta 1: Instalación */}
                    <div className="col-lg-4 col-md-6">
                        <div className={`card h-100 border-0 shadow-sm ${styles.serviceCard}`}>
                            <div className="card-body p-4 text-center">
                                <div className={styles.iconCircle}>
                                    <img className='fotoico' src="/images/ico-instalacion.png" alt="Instalación" />
                                </div>
                                <h4 className="fw-bold mb-3">Instalación</h4>
                                <p className="text-muted">
                                    Realizamos el montaje e instalación profesional de electrobombas, filtros, tableros de control y sistemas de automatización, respetando las normativas del fabricante.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tarjeta 2: Reparaciones */}
                    <div className="col-lg-4 col-md-6">
                        <div className={`card h-100 border-0 shadow-sm ${styles.serviceCard}`}>
                            <div className="card-body p-4 text-center">
                                <div className={styles.iconCircle}>
                                    <img src="/images/ico-reparacion.png" alt="Reparación" />
                                </div>
                                <h4 className="fw-bold mb-3">Reparaciones</h4>
                                <p className="text-muted">
                                    Diagnóstico preciso y mantenimiento correctivo. Contamos con repuestos originales para devolverle la operatividad a tus equipos en el menor tiempo posible.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tarjeta 3: Asesoramiento */}
                    <div className="col-lg-4 col-md-6">
                        <div className={`card h-100 border-0 shadow-sm ${styles.serviceCard}`}>
                            <div className="card-body p-4 text-center">
                                <div className={styles.iconCircle}>
                                    <img src="/images/ico-asesor.png" alt="Asesoría" />
                                </div>
                                <h4 className="fw-bold mb-3">Asesoría de Compra</h4>
                                <p className="text-muted">
                                    ¿No sabes qué bomba necesitas? Calculamos el caudal, la altura y los requerimientos para que adquieras exactamente el equipo que tu proyecto exige.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 2: PERFORACIÓN DE POZOS */}
                <div className="row align-items-center mt-5 pt-3">
                    <div className="col-lg-6 mb-4 mb-lg-0 pr-lg-5">
                        <span className={`badge ${styles.badgePrimary} mb-2`}>Ingeniería Hídrica</span>
                        <h2 className={`fw-bold mb-4 ${styles.letraAzul}`}>Perforación de Pozos de Agua</h2>
                        <p className="mb-4" style={{ lineHeight: '1.8' }}>
                            Asegura un suministro de agua constante e independiente para tu condominio, industria o proyecto agrícola. Contamos con maquinaria especializada y personal experimentado para la captación de aguas subterráneas.
                        </p>
                        
                        <div className={styles.wellFeatures}>
                            <div className={styles.featureItem}>
                                <i className="fas fa-check-circle text-success me-3"></i>
                                <div>
                                    <strong>Diámetros disponibles:</strong>
                                    <span className="text-muted d-block">Perforaciones de 4", 6" y 8" pulgadas según el estudio de suelo.</span>
                                </div>
                            </div>
                            <div className={styles.featureItem}>
                                <i className="fas fa-check-circle text-success me-3"></i>
                                <div>
                                    <strong>Estudio y perfilaje:</strong>
                                    <span className="text-muted d-block">Análisis del terreno para ubicar las mejores venas de agua.</span>
                                </div>
                            </div>
                            <div className={styles.featureItem}>
                                <i className="fas fa-check-circle text-success me-3"></i>
                                <div>
                                    <strong>Equipamiento "Llave en Mano":</strong>
                                    <span className="text-muted d-block">Dejamos el pozo operando con su respectiva bomba sumergible instalada.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="col-lg-6">
                        <div className={styles.imageWrapper}>
                            <img 
                                src="/images/serv-pozos.webp" 
                                alt="Perforación de pozos de agua" 
                                className="img-fluid rounded shadow"
                            />
                            {/* Insignia superpuesta en la imagen */}
                            <div className={styles.floatingBadge}>
                                <span className="d-block fw-bold fs-4">4", 6" y 8"</span>
                                <small> <b>Pulgadas</b></small>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* CALL TO ACTION (CTA) */}
            <div className={styles.ctaSection}>
                <div className="container text-center py-5">
                    <h2 className="fw-bold text-white mb-3">¿Necesitas agendar un servicio?</h2>
                    <p className="text-white-50 mb-4 lead">Comunícate con nuestros ingenieros y cuéntanos sobre tu proyecto.</p>
                    <Link to="/contacto" className={`btn btn-light btn-lg fw-bold px-5 ${styles.buttonsecondary}`}>
                        Contactar a un Asesor
                    </Link>
                </div>
            </div>
            <hr />

        </div>
    );
};

export default ServiciosPage;