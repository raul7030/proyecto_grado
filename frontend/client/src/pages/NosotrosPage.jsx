// src/pages/NosotrosPage.jsx
import { Link } from 'react-router-dom';
import styles from './NosotrosPage.module.css';

const NosotrosPage = () => {
    return (
        <div className={styles.pageContainer}>
            {/* HERO SECTION */}
            <div className={styles.heroSection}>
                <div className="container text-center">
                    <h1 className="fw-bold display-4 mb-3">Sobre San Rafael</h1>
                    <p className="lead mx-auto" style={{ maxWidth: '700px' }}>
                        Expertos en equipamiento y soluciones integrales a nivel nacional.
                    </p>
                </div>
            </div>

            <div className="container py-5">
                {/* HISTORIA / QUIÉNES SOMOS */}
                <div className="row align-items-center mb-5 pb-4">
                    <div className="col-lg-6 mb-4 mb-lg-0">
                        <img 
                            src="/images/foto-grupal.webp" 
                            alt="Instalaciones San Rafael" 
                            className={`img-fluid rounded shadow-sm ${styles.aboutImage}`} 
                        />
                    </div>
                    <div className="col-lg-6 px-lg-5">
                        <h2 className={`fw-bold mb-3 ${styles.letraAzul}`}>
                            Más que un proveedor, tu aliado técnico
                        </h2>
                        <p>
                            En <strong>Distribuidora San Rafael Ltda.</strong>, entendemos que un sistema de bombeo es una inversión a largo plazo. Por eso, no solo comercializamos equipos, sino que brindamos asesoría técnica especializada para asegurar que adquieras exactamente lo que tu proyecto necesita.
                        </p>
                        <p>
                            Desde repuestos específicos hasta la automatización completa de cuartos de máquinas, nuestro inventario está diseñado para responder con agilidad a los requerimientos de hogares, condominios y empresas.
                        </p>
                    </div>
                </div>

                <hr className="text-muted opacity-25 my-5" />

                {/* MISIÓN Y VISIÓN */}
                <div className="row g-4 mb-5 pb-4">
                    <div className="col-md-6">
                        <div className={`card h-100 border-0 shadow-sm ${styles.visionCard}`}>
                            <div className="card-body p-4 p-lg-5">
                                <div className={styles.iconCircle}>
                                    <img src="/images/ico-mision.png" alt="Misión" />
                                </div>
                                <h3 className={`fw-bold mb-3 ${styles.letraAzul}`}>Nuestra Misión</h3>
                                <p>
                                    Enfrentar los problemas de escasez de recursos hídricos y energéticos 
                                    con productos y servicios eficientes y confiables.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className={`card h-100 border-0 shadow-sm ${styles.visionCard}`}>
                            <div className="card-body p-4 p-lg-5">
                                <div className={styles.iconCircle}>
                                    <img src="/images/ico-vision.png" alt="Visión" />
                                </div>
                                <h3 className={`fw-bold mb-3 ${styles.letraAzul}`}>Nuestra Visión</h3>
                                <p>
                                    Ser una empresa innovadora con una organización orientada al servicio 
                                    y comprometida con el medio ambiente.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* POR QUÉ ELEGIRNOS (Valores) */}
                <div className="text-center mb-5">
                    <h2 className={`fw-bold mb-3 ${styles.letraAzul}`}>¿Por qué trabajar con nosotros?</h2>
                    <div className="row g-4 mt-2">
                        <div className="col-md-4">
                            <div className="p-3">
                                <h1 className={`mb-3 ${styles.letraCeleste}`}><i className="fas fa-boxes"></i></h1>
                                <h5 className="fw-bold">Stock Garantizado</h5>
                                <p className="text-muted small">Mantenemos un inventario actualizado en tiempo real para entregas inmediatas.</p>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="p-3">
                                <h1 className={`mb-3 ${styles.letraCeleste}`}><i className="fas fa-tools"></i></h1>
                                <h5 className="fw-bold">Respaldo Técnico</h5>
                                <p className="text-muted small">
                                    Equipo técnico especializado para brindar asesoría personalizada y soporte postventa.
                                </p>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="p-3">
                                <h1 className={`mb-3 ${styles.letraCeleste}`}><i className="fas fa-handshake"></i></h1>
                                <h5 className="fw-bold">Garantía Real</h5>
                                <p className="text-muted small">
                                    Trabajando con marcas líderes, ofrecemos garantías que respaldan la calidad y durabilidad de nuestros productos.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CALL TO ACTION (CTA) */}
            <div className={styles.ctaSection}>
                <div className="container text-center py-5">
                    <h2 className="fw-bold text-white mb-3">¿Listo para cotizar tu próximo proyecto?</h2>
                    <p className="text-white-50 mb-4 lead">Explora nuestro catálogo en línea y solicita tu proforma al instante.</p>
                    <Link to="/catalogo" className={`btn btn-light btn-lg fw-bold px-5 ${styles.buttonsecondary}`}>
                        Ir al Catálogo de Productos
                    </Link>
                </div>
            </div>
            <hr />
        </div>
    );
};

export default NosotrosPage;