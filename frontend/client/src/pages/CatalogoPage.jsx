// src/pages/CatalogoPage.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './CatalogoPage.module.css';
import axios from 'axios';

const CatalogoPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [categoriaActiva, setCategoriaActiva] = useState('Todas');
    const [productoSeleccionado, setProductoSeleccionado] = useState(null); // Para el modal de stock
    
    // --- NUEVO: ESTADOS PARA COTIZACIONES WEB ---
    const [modalCotizacion, setModalCotizacion] = useState(false);
    const [formCotizacion, setFormCotizacion] = useState({
        nombre: '', telefono: '', email: '', detalle: ''
    });
    
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const obtenerProductos = async () => {
            try {
                const respuesta = await fetch('http://187.127.34.217/api/productos/');
                if (!respuesta.ok) throw new Error('Hubo un problema al cargar el catálogo');
                
                const datos = await respuesta.json();
                setProductos(datos);
            } catch (err) {
                console.error("Error al obtener productos:", err);
                setError(err.message);
            } finally {
                setCargando(false);
            }
        };
        obtenerProductos();
    }, []);

    useEffect(() => {
        // Si hay un producto en el state de la ruta y los productos ya cargaron
        if (location.state?.productoDesdeChatbot && productos.length > 0) {
            const prodChat = location.state.productoDesdeChatbot;
            
            // Buscamos el producto completo en el catálogo usando el SKU
            const productoCompleto = productos.find(p => p.sku === prodChat.sku);
            
            if (productoCompleto) {
                abrirCotizacionProducto(productoCompleto);
            } else {
                // Si por alguna razón no lo encuentra en la lista, usamos los datos del chat
                abrirCotizacionProducto({
                    nombre_producto: prodChat.nombre,
                    sku: prodChat.sku
                });
            }
            
            // Limpiamos la "mochila" de la ruta para que el modal no se vuelva 
            // a abrir solo si el usuario recarga la página web manualmente
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, productos, navigate]);

    const categoriasDinamicas = ['Todas', ...new Set(productos.map(p => p.categoria_nombre))];

    const productosFiltrados = categoriaActiva === 'Todas' 
        ? productos 
        : productos.filter(prod => prod.categoria_nombre === categoriaActiva);

    // Limpia la URL de la imagen
    const obtenerUrlImagen = (rutaImagen) => {
        if (!rutaImagen) return 'https://placehold.co/400x400?text=Sin+Imagen';
        if (rutaImagen.startsWith('http')) return rutaImagen; 
        
        let rutaLimpia = rutaImagen;
        if (rutaLimpia.startsWith('/')) rutaLimpia = rutaLimpia.substring(1); 
        if (rutaLimpia.startsWith('media/')) rutaLimpia = rutaLimpia.substring(6); 
        return `http://187.127.34.217/media/${rutaLimpia}`;
    };

    // --- NUEVO: LÓGICA DE COTIZACIÓN ---
    const abrirCotizacionGeneral = () => {
        setFormCotizacion({ nombre: '', telefono: '', email: '', detalle: '' });
        setModalCotizacion(true);
    };

    const abrirCotizacionProducto = (producto) => {
        setFormCotizacion({ 
            nombre: '', 
            telefono: '', 
            email: '', 
            // Pre-llenamos el detalle con el producto que seleccionó
            detalle: `Me interesa cotizar el siguiente equipo:\n- ${producto.nombre_producto} (SKU: ${producto.sku})\n\nMis consultas son: ` 
        });
        setModalCotizacion(true);
    };

    const enviarSolicitudWeb = async (e) => {
        e.preventDefault();
        try {
            // Enviamos los datos por POST a la nueva ruta
            await axios.post('http://187.127.34.217/api/solicitudes-web/', formCotizacion);
            
            alert(`¡Gracias ${formCotizacion.nombre}! Tu solicitud ha sido enviada. Un asesor se comunicará contigo pronto.`);
            
            // Cerramos modal y limpiamos formulario
            setModalCotizacion(false);
            setFormCotizacion({ nombre: '', telefono: '', email: '', detalle: '' });
            
        } catch (error) {
            console.error("Error al enviar solicitud:", error);
            alert("Hubo un problema al enviar tu solicitud. Por favor intenta de nuevo.");
        }
    };

    return (
        <div style={{ backgroundColor: '#f4f7fa', minHeight: '100vh', paddingBottom: '60px' }}>
            
            <div className={styles.catalogoHeader}>
                <div className="container d-flex flex-wrap justify-content-between align-items-center">
                    <div>
                        <h1 className="fw-bold display-4 mb-2">Catálogo de Productos</h1>
                        <p className="lead mb-0">Encuentra la maquinaria y tecnología ideal para tu proyecto.</p>
                    </div>
                    {/* Botón de Cotización General en el Header */}
                    <button onClick={abrirCotizacionGeneral} className={`btn btn-light btn-lg shadow-sm ${styles.btnCotizacionHeader}`}>
                        <i className="fas fa-file-invoice-dollar me-2"></i>
                        Cotización Personalizada
                    </button>
                </div>
            </div>

            <div className="container mt-4">
                <div className={styles.filtrosContainer}>
                    {categoriasDinamicas.map((cat, index) => (
                        <button 
                            key={index}
                            onClick={() => setCategoriaActiva(cat)}
                            className={`${styles.btnFiltro} ${categoriaActiva === cat ? styles.btnFiltroActivo : ''}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {cargando && (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Cargando...</span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="alert alert-danger text-center my-5" role="alert">
                        {error}. Por favor, intenta de nuevo más tarde.
                    </div>
                )}

                {!cargando && !error && (
                    <div className="row g-4">
                        {productosFiltrados.length > 0 ? (
                            productosFiltrados.map(producto => (
                                <div className="col-12 col-md-6 col-lg-4 col-xl-3" key={producto.id_producto}>
                                    <div className={`card ${styles.productoCard}`}>
                                        
                                        <div className={styles.imgContainer}>
                                            <img 
                                                src={obtenerUrlImagen(producto.imagen)} 
                                                alt={producto.nombre_producto} 
                                                className={styles.productoImg} 
                                                onError={(e) => { 
                                                    e.target.onerror = null; 
                                                    e.target.src = 'https://placehold.co/400x400?text=Sin+Imagen'; 
                                                }} 
                                            />
                                        </div>
                                        
                                        <div className="card-body d-flex flex-column">
                                            <span className={styles.skuText}>SKU: {producto.sku}</span>
                                            <h5 className={`card-title fw-bold mt-2 ${styles.letraAzul}`}>{producto.nombre_producto}</h5>
                                            
                                            {/* Botones de acción del cliente */}
                                            <div className="mt-auto pt-3 d-flex flex-column gap-2">
                                                <button 
                                                    className={`btn fw-bold ${(producto.stock > 0 || producto.stock_total > 0) ? `btn-outline-success ${styles.buttonsecondary}` : 'btn-outline-danger'}`}
                                                    onClick={() => setProductoSeleccionado(producto)}
                                                >
                                                    <i className="fas fa-box me-2"></i>
                                                    {(producto.stock > 0 || producto.stock_total > 0) ? 'Ver Disponibilidad' : 'Agotado'}
                                                </button>

                                                <button 
                                                    className={`btn btn-primary fw-bold ${styles.buttonprimary}`}
                                                    onClick={() => abrirCotizacionProducto(producto)}
                                                >
                                                    <i className="fas fa-paper-plane me-2"></i>
                                                    Solicitar Cotización
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-12 text-center py-5">
                                <h4 className="text-muted">No se encontraron productos en esta categoría.</h4>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* --- MODAL PARA SOLICITAR COTIZACIÓN --- */}
            {modalCotizacion && (
                <div className={styles.modalOverlay} onClick={() => setModalCotizacion(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.btnCerrarModal} onClick={() => setModalCotizacion(false)}>&times;</button>
                        
                        <h4 className="fw-bold text-primary mb-1">Solicitar Cotización</h4>
                        <p className="text-muted small mb-4">Déjanos tus datos y requerimientos, un asesor te contactará a la brevedad.</p>
                        
                        <form onSubmit={enviarSolicitudWeb}>
                            <div className="mb-3">
                                <label className="form-label fw-bold small">Nombre Completo *</label>
                                <input 
                                    type="text" className="form-control" required
                                    value={formCotizacion.nombre}
                                    onChange={e => setFormCotizacion({...formCotizacion, nombre: e.target.value})}
                                />
                            </div>
                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold small">Teléfono / Celular *</label>
                                    <input 
                                        type="tel" className="form-control" required
                                        value={formCotizacion.telefono}
                                        onChange={e => setFormCotizacion({...formCotizacion, telefono: e.target.value})}
                                    />
                                </div>
                                <div className="col-md-6 mt-3 mt-md-0">
                                    <label className="form-label fw-bold small">Correo Electrónico</label>
                                    <input 
                                        type="email" className="form-control" 
                                        value={formCotizacion.email}
                                        onChange={e => setFormCotizacion({...formCotizacion, email: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="form-label fw-bold small">Detalle de tu requerimiento *</label>
                                <textarea 
                                    className="form-control" rows="4" required
                                    placeholder="Ej: Necesito una electrobomba para un edificio de 4 pisos..."
                                    value={formCotizacion.detalle}
                                    onChange={e => setFormCotizacion({...formCotizacion, detalle: e.target.value})}
                                ></textarea>
                            </div>
                            <button type="submit" className="btn btn-primary w-100 fw-bold py-2">
                                Enviar Solicitud
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL DE DISPONIBILIDAD (STOCK) --- */}
            {productoSeleccionado && (
                <div className={styles.modalOverlay} onClick={() => setProductoSeleccionado(null)}>
                    {/* ... (Aquí se mantiene tu modal de stock intacto) ... */}
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.btnCerrarModal} onClick={() => setProductoSeleccionado(null)}>&times;</button>
                        <h4 className="fw-bold text-primary mb-1">{productoSeleccionado.nombre_producto}</h4>
                        <p className="text-muted small mb-4">SKU: {productoSeleccionado.sku}</p>
                        
                        <h6 className="fw-bold mb-3 border-bottom pb-2">Disponibilidad por Sucursal</h6>
                        <div className="mb-4">
                            {productoSeleccionado.disponibilidad ? (
                                productoSeleccionado.disponibilidad.map((sucursal, idx) => (
                                    <div key={idx} className={styles.sucursalItem}>
                                        <span className="fw-semibold text-secondary">
                                            <i className="fas fa-store me-2"></i>{sucursal.sucursal}
                                        </span>
                                        {sucursal.cantidad > 0 ? (
                                            <span className="badge bg-success rounded-pill px-3 py-2">{sucursal.cantidad} en stock</span>
                                        ) : (
                                            <span className="badge bg-danger rounded-pill px-3 py-2">Sin stock</span>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted small">Detalle de sucursales no disponible aún.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CatalogoPage;
