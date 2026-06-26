// src/pages/ContactoPage.jsx
import { useState } from 'react';
import styles from './ContactoPage.module.css';

const ContactoPage = () => {
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        asunto: '',
        mensaje: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        // Aquí conectarías con tu backend o un servicio de correo
        console.log("Datos de contacto:", formData);
        alert(`¡Gracias ${formData.nombre}! Hemos recibido tu mensaje. Nos pondremos en contacto contigo pronto.`);
        setFormData({ nombre: '', email: '', asunto: '', mensaje: '' });
    };

    return (
        <div className={styles.pageContainer}>
            {/* ENCABEZADO */}
            <div className={styles.heroSection}>
                <div className="container text-center">
                    <h1 className="fw-bold display-4 mb-3">Contáctanos</h1>
                    <p className="lead">Estamos listos para asesorarte en tu próximo proyecto hídrico.</p>
                </div>
            </div>

            <div className="container py-5">
                <div className="row g-5">
                    
                    {/* INFORMACIÓN DE CONTACTO */}
                    <div className="col-lg-5">
                        <div className={styles.infoCard}>
                            <h2 className={`fw-bold mb-4 ${styles.letraAzul}`}>Información de Enlace</h2>
                            
                            <div className={styles.contactItem}>
                                <div className={styles.iconBox}><i className="fas fa-map-marker-alt"></i></div>
                                <div>
                                    <h5 className="fw-bold mb-1">Nuestra Ubicación</h5>
                                    <p className="text-muted">Cochabamba, Bolivia<br />Av. Blanco Galindo Km 5.5, Edif. San Rafael</p>
                                </div>
                            </div>

                            <div className={styles.contactItem}>
                                <div className={styles.iconBox}><i className="fab fa-whatsapp"></i></div>
                                <div>
                                    <h5 className="fw-bold mb-1">Ventas y Consultas</h5>
                                    <p className="text-muted">+591 700 00000</p>
                                </div>
                            </div>

                            <div className={styles.contactItem}>
                                <div className={styles.iconBox}><i className="fas fa-envelope"></i></div>
                                <div>
                                    <h5 className="fw-bold mb-1">Correo Electrónico</h5>
                                    <p className="text-muted">ventas@sanrafael.com.bo</p>
                                </div>
                            </div>

                            <div className={styles.contactItem}>
                                <div className={styles.iconBox}><i className="fas fa-clock"></i></div>
                                <div>
                                    <h5 className="fw-bold mb-1">Horario de Atención</h5>
                                    <p className="text-muted">Lun - Vie: 08:30 - 18:30<br />Sábados: 09:00 - 13:00</p>
                                </div>
                            </div>
                        </div>

                         {/* MAPA OPENSTREETMAP (Alternativa Gratuita y Libre) */}
                        <div className={`mt-4 rounded shadow-sm overflow-hidden ${styles.mapContainer}`}>
                            <iframe 
                                title="Mapa de Ubicación San Rafael (OSM)"
                                width="100%" 
                                height="250" 
                                style={{ border: 0 }}
                                /* Las coordenadas apuntan al centro de Cochabamba (Aprox -17.3895, -66.1568) */
                                src="https://www.openstreetmap.org/export/embed.html?bbox=-66.1968%2C-17.4195%2C-66.1168%2C-17.3595&amp;layer=mapnik&amp;marker=-17.3895%2C-66.1568" 
                                allowFullScreen="" 
                                loading="lazy">
                            </iframe>
                            
                            {/* Pequeño enlace de atribución (Requerido por OSM) */}
                            <div className="text-end px-2 py-1" style={{ fontSize: '0.7rem', backgroundColor: '#f8fafc' }}>
                                <a href="https://www.openstreetmap.org/?mlat=-17.3895&mlon=-66.1568#map=14/-17.3895/-66.1568" target="_blank" rel="noreferrer" style={{ color: '#0ea5e9', textDecoration: 'none' }}>
                                    Ver mapa más grande
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* FORMULARIO DE CONTACTO */}
                    <div className="col-lg-7">
                        <div className={`card border-0 shadow-sm p-4 p-lg-5 ${styles.formCard}`}>
                            <h3 className={`fw-bold mb-4 ${styles.letraAzul}`}>Envíanos un mensaje</h3>
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label fw-bold small">Nombre Completo *</label>
                                    <input 
                                        type="text" className="form-control form-control-lg" required
                                        value={formData.nombre}
                                        onChange={e => setFormData({...formData, nombre: e.target.value})}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-bold small">Correo Electrónico *</label>
                                    <input 
                                        type="email" className="form-control form-control-lg" required
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-bold small">Asunto</label>
                                    <input 
                                        type="text" className="form-control form-control-lg"
                                        value={formData.asunto}
                                        onChange={e => setFormData({...formData, asunto: e.target.value})}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="form-label fw-bold small">Mensaje *</label>
                                    <textarea 
                                        className="form-control form-control-lg" rows="5" required
                                        value={formData.mensaje}
                                        onChange={e => setFormData({...formData, mensaje: e.target.value})}
                                    ></textarea>
                                </div>
                                <button type="submit" className={`btn btn-primary btn-lg w-100 fw-bold ${styles.submitBtn}`}>
                                    Enviar Mensaje
                                </button>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ContactoPage;