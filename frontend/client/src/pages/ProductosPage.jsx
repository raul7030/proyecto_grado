// src/pages/ProductosPage.jsx
import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { usePermisos } from '../hooks/usePermisos';
import ModalIngresoStock from '../components/ModalIngresoStock';
import styles from './ProductosPage.module.css'; 

const ProductosPage = () => {
    const { puedeTocarStock, puedeGestionarCatalogo } = usePermisos();
    
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]); 
    const [loading, setLoading] = useState(true);
    
    // Estados para filtros
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('TODOS');
    
    // Estados para Modales Principales
    const [mostrarModalIngreso, setMostrarModalIngreso] = useState(false);
    const [modalProductoAbierto, setModalProductoAbierto] = useState(false);
    
    // Estado para Crear/Editar Textos
    const [productoEditando, setProductoEditando] = useState(null);
    const [formData, setFormData] = useState({
        sku: '',
        nombre_producto: '',
        descripcion: '',
        precio_base: '',
        categoria: '' 
    });

    // NUEVO: Estados para manejar la Fotografía
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // Estados para el Modal de Detalle de Stock
    const [productoVerStock, setProductoVerStock] = useState(null);
    const [detalleStock, setDetalleStock] = useState([]);
    const [cargandoStock, setCargandoStock] = useState(false);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const [resProductos, resCategorias] = await Promise.all([
                axiosInstance.get('/productos/'),
                axiosInstance.get('/categorias/')
            ]);
            setProductos(resProductos.data);
            setCategorias(resCategorias.data);
        } catch (error) {
            console.error("Error cargando datos maestros", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Confirmar eliminacion de este producto?')) {
            try {
                await axiosInstance.delete(`/productos/${id}/`);
                setProductos(productos.filter(p => p.id_producto !== id));
            } catch (error) {
                alert("Error al eliminar. Verifique que no existan movimientos en el Kardex para este item.");
            }
        }
    };

    // --- LÓGICA DEL FORMULARIO Y LA IMAGEN ---

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file)); // Crea la vista previa temporal
        }
    };

    const abrirModalCrear = () => {
        setProductoEditando(null);
        setFormData({ sku: '', nombre_producto: '', descripcion: '', precio_base: '', categoria: '' });
        setImageFile(null); // Limpiar imagen previa
        setImagePreview(null);
        setModalProductoAbierto(true);
    };

    const abrirModalEditar = (prod) => {
        setProductoEditando(prod.id_producto);
        setFormData({
            sku: prod.sku || '',
            nombre_producto: prod.nombre_producto || '',
            descripcion: prod.descripcion || '',
            precio_base: prod.precio_base || '',
            categoria: prod.categoria || '' 
        });
        setImageFile(null);
        // Si el backend envía la URL de la imagen en 'imagen', la mostramos en la edición
        setImagePreview(prod.imagen || null); 
        setModalProductoAbierto(true);
    };

    const guardarProducto = async (e) => {
        e.preventDefault();
        
        // EMPAQUETADO FORMDATA: Obligatorio para poder enviar fotos al servidor
        const dataToSend = new FormData();
        dataToSend.append('sku', formData.sku);
        dataToSend.append('nombre_producto', formData.nombre_producto);
        dataToSend.append('descripcion', formData.descripcion);
        dataToSend.append('precio_base', formData.precio_base);
        dataToSend.append('categoria', formData.categoria);
        
        // Adjuntamos la imagen solo si el usuario seleccionó una nueva
        if (imageFile) {
            dataToSend.append('imagen', imageFile); 
        }

        try {
            if (productoEditando) {
                await axiosInstance.put(`/productos/${productoEditando}/`, dataToSend);
                alert("Registro actualizado correctamente.");
            } else {
                await axiosInstance.post('/productos/', dataToSend);
                alert("Producto registrado en el catalogo de manera exitosa.");
            }
            setModalProductoAbierto(false);
            cargarDatos(); 
        } catch (error) {
            alert("Error al guardar el producto. Verifique los datos o la duplicidad del SKU.");
            console.error(error);
        }
    };

    // --- FIN LÓGICA IMAGEN ---

    const abrirModalStock = async (prod) => {
        setProductoVerStock(prod);
        setCargandoStock(true);
        try {
            const res = await axiosInstance.get(`/stock/`, { params: { producto: prod.id_producto } });
            setDetalleStock(res.data);
        } catch (error) {
            console.error("Error cargando detalle de stock", error);
            alert("No fue posible cargar el detalle del stock.");
        } finally {
            setCargandoStock(false);
        }
    };

    const productosFiltrados = productos.filter(p => {
        const matchTexto = (p.nombre_producto?.toLowerCase() || '').includes(busqueda.toLowerCase()) || 
                           (p.sku?.toLowerCase() || '').includes(busqueda.toLowerCase());
        
        const stockReal = p.stock_total || 0;
        let estadoActual = 'OK';
        if (stockReal <= 0) estadoActual = 'AGOTADO';
        else if (stockReal < 5) estadoActual = 'BAJO';

        const matchEstado = filtroEstado === 'TODOS' || estadoActual === filtroEstado;

        return matchTexto && matchEstado;
    });

    const getStockBadge = (cantidad = 0) => {
        if (cantidad <= 0) {
            return <span className={`${styles.badgeStock} ${styles.badgeAgotado}`}>Agotado</span>;
        } else if (cantidad < 5) {
            return <span className={`${styles.badgeStock} ${styles.badgeBajo}`}>Bajo</span>;
        } else {
            return <span className={`${styles.badgeStock} ${styles.badgeOk}`}>OK</span>;
        }
    };

    if (loading) return <p className="text-center mt-5 text-muted">Cargando inventario...</p>;

    return (
        <div className={styles.pageContainer}>
            <div className="d-flex justify-content-between align-items-center flex-wrap mb-4">
                <div>
                    <h1 className="h3 mb-1 text-dark">Catalogo de Productos</h1>
                    <p className="text-muted mb-0">Gestion general de inventario y precios</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    {puedeTocarStock && (
                        <button onClick={() => setMostrarModalIngreso(true)} className="btn btn-success fw-bold shadow-sm">
                            Ingresar Stock
                        </button>
                    )}

                    {puedeGestionarCatalogo && (
                        <button onClick={abrirModalCrear} className={`btn fw-bold shadow-sm ${styles.buttonPrimary}`}>
                            + Nuevo Item
                        </button>
                    )}
                </div>
            </div>

            {/* Barra de busqueda y filtros */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-md-8">
                    <input 
                        type="text" 
                        placeholder="Buscar por Nombre o SKU..." 
                        className="form-control shadow-sm"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
                <div className="col-12 col-md-4">
                    <select 
                        className="form-select shadow-sm fw-bold text-secondary"
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                    >
                        <option value="TODOS">Todos los estados</option>
                        <option value="OK">Stock Normal (OK)</option>
                        <option value="BAJO">Stock Bajo</option>
                        <option value="AGOTADO">Agotado</option>
                    </select>
                </div>
            </div>

            <div className="table-responsive shadow-sm rounded border">
                <table className={`table align-middle ${styles.noHoverTable} mb-0`}>
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>Producto</th>
                            <th>Categoria</th>
                            <th>Precio</th>
                            <th className="text-center">Stock Global</th>
                            <th className="text-center">Estado</th>
                            <th className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {productosFiltrados.map((prod) => {
                            const stockReal = prod.stock_total || 0; 
                            
                            return (
                                <tr key={prod.id_producto}>
                                    <td className="font-monospace text-primary fw-bold">{prod.sku}</td>
                                    <td>
                                        <div className="d-flex align-items-center gap-3">
                                            {/* Miniatura en la tabla (Opcional, si quieres verla) */}
                                            {prod.imagen && (
                                                <img src={prod.imagen} alt="Miniatura" className="rounded" style={{width: '40px', height: '40px', objectFit: 'cover'}} />
                                            )}
                                            <div>
                                                <strong className="text-dark">{prod.nombre_producto}</strong><br/>
                                                <span className="text-muted small">
                                                    {(prod.descripcion || '').substring(0, 40)}...
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{prod.categoria_nombre || 'General'}</td>
                                    
                                    <td className="fw-bold text-dark">
                                        Bs. {parseFloat(prod.precio_base || 0).toFixed(2)}
                                    </td>
                                    
                                    <td className="text-center fs-5 fw-bold">
                                        {stockReal} <span className="text-muted fs-6 fw-normal">u.</span>
                                    </td>

                                    <td className="text-center">
                                        {getStockBadge(stockReal)}
                                    </td>
                                    
                                    <td className="actions-cell">
                                        <div className={styles.actionButtonsContainer}>
                                            <button 
                                                className="btn btn-sm btn-outline-secondary fw-bold"
                                                title="Ver detalle de stock por sucursal"
                                                onClick={() => abrirModalStock(prod)}
                                            >
                                                Stock
                                            </button>

                                            {puedeGestionarCatalogo && (
                                                <>
                                                    <button 
                                                        className="btn btn-sm btn-outline-secondary fw-bold"
                                                        title="Editar"
                                                        onClick={() => abrirModalEditar(prod)}
                                                    >
                                                        Editar
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-outline-danger fw-bold"
                                                        onClick={() => handleDelete(prod.id_producto)}
                                                        title="Eliminar"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {productosFiltrados.length === 0 && (
                            <tr>
                                <td colSpan="7" className="text-center text-muted py-4">No se encontraron productos coincidentes.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de Ingreso de Stock */}
            {mostrarModalIngreso && puedeTocarStock && (
                <ModalIngresoStock 
                    onClose={() => setMostrarModalIngreso(false)} 
                    onSuccess={cargarDatos}
                />
            )}

            {/* Modal para Ver Detalle de Stock (Mantenido igual) */}
            {productoVerStock && (
                <div className={styles.modalOverlay} onClick={() => setProductoVerStock(null)}>
                    {/* ... (Todo el contenido del modal de stock se mantiene igual) ... */}
                    <div className={`modal-dialog modal-dialog-centered modal-lg ${styles.solidModal}`} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content shadow-lg border-0 bg-white w-100">
                            <div className="modal-header bg-light border-bottom">
                                <div>
                                    <h5 className="modal-title text-dark fw-bold mb-0">Distribucion de Stock</h5>
                                    <p className="text-muted small mb-0 mt-1">
                                        <strong>{productoVerStock.nombre_producto}</strong> (SKU: {productoVerStock.sku})
                                    </p>
                                </div>
                                <button type="button" className="btn-close" onClick={() => setProductoVerStock(null)}></button>
                            </div>

                            <div className="modal-body p-4 bg-white">
                                {cargandoStock ? (
                                    <p className="text-center text-muted py-4">Consultando sucursales...</p>
                                ) : detalleStock.length === 0 ? (
                                    <p className="text-center text-muted py-4">Este producto no tiene stock registrado en ninguna sucursal.</p>
                                ) : (
                                    <div className="table-responsive border rounded shadow-sm">
                                        <table className={`table align-middle ${styles.noHoverTable} mb-0`}>
                                            <thead>
                                                <tr>
                                                    <th>Sucursal</th>
                                                    <th className="text-center">Cantidad Disponible</th>
                                                    <th>Ultima Actualizacion</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white">
                                                {detalleStock.map(item => (
                                                    <tr key={item.id_stock}>
                                                        <td className="fw-bold text-dark">{item.sucursal_nombre}</td>
                                                        <td className={`text-center fs-5 fw-bold ${item.cantidad > 0 ? 'text-success' : 'text-danger'}`}>
                                                            {item.cantidad}
                                                        </td>
                                                        <td className="text-muted small font-monospace">
                                                            {new Date(item.ultima_actualizacion).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer bg-light border-top">
                                <button onClick={() => setProductoVerStock(null)} className="btn btn-secondary fw-bold px-4">
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* === MODAL DE CREAR / EDITAR PRODUCTO (CON IMAGEN) === */}
            {modalProductoAbierto && puedeGestionarCatalogo && (
                <div className={styles.modalOverlay} onClick={() => setModalProductoAbierto(false)}>
                    <div className={`modal-dialog modal-dialog-centered modal-lg ${styles.solidModal}`} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content shadow-lg border-0 bg-white w-100">
                            
                            <div className="modal-header bg-light border-bottom">
                                <h5 className="modal-title text-dark fw-bold">
                                    {productoEditando ? 'Editar Registro de Producto' : 'Registrar Nuevo Producto'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setModalProductoAbierto(false)}></button>
                            </div>
                            
                            <div className={`modal-body p-4 bg-white ${styles.scrollableBody}`}>
                                <form onSubmit={guardarProducto}>

                                    {/* --- SECCIÓN PARA SUBIR IMAGEN --- */}
                                    <div className={styles.imageSection}>
                                        <div className={styles.imagePreviewContainer}>
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Vista previa" className={styles.imagePreview} />
                                            ) : (
                                                <div className={styles.imagePlaceholder}>
                                                    <span>📷 Sin Imagen</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.imageUploadWrapper}>
                                            <label className="form-label fw-bold text-secondary small">Fotografía del Producto:</label>
                                            
                                            <label htmlFor="imagenInput" className={styles.imageUploadButton}>
                                                {imagePreview ? '🔄 Cambiar Imagen' : 'Seleccionar Imagen'}
                                            </label>
                                            <input 
                                                id="imagenInput"
                                                type="file" 
                                                accept="image/png, image/jpeg, image/webp" 
                                                className={styles.formInputFileHidden}
                                                onChange={handleImageChange}
                                            />
                                            <small className="text-muted mt-2 d-block">Formatos permitidos: JPG, PNG, WEBP.</small>
                                        </div>
                                    </div>
                                    
                                    <hr className="my-4" />

                                    {/* --- CAMPOS DE TEXTO --- */}
                                    <div className="row mb-3">
                                        <div className="col-12 col-md-6 mb-3 mb-md-0">
                                            <label className="form-label fw-bold text-secondary small">SKU (Codigo unico) (*):</label>
                                            <input 
                                                required type="text" 
                                                className="form-control bg-light text-dark"
                                                value={formData.sku} 
                                                onChange={e => setFormData({...formData, sku: e.target.value})} 
                                                placeholder="Ej: BOM-001"
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-bold text-secondary small">Precio Base (Bs.) (*):</label>
                                            <input 
                                                required type="number" step="0.01" min="0"
                                                className="form-control bg-light text-dark"
                                                value={formData.precio_base} 
                                                onChange={e => setFormData({...formData, precio_base: e.target.value})} 
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold text-secondary small">Nombre del Producto (*):</label>
                                        <input 
                                            required type="text" 
                                            className="form-control bg-light text-dark"
                                            value={formData.nombre_producto} 
                                            onChange={e => setFormData({...formData, nombre_producto: e.target.value})} 
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold text-secondary small">Categoria:</label>
                                        <select 
                                            className="form-select bg-light text-dark"
                                            value={formData.categoria} 
                                            onChange={e => setFormData({...formData, categoria: e.target.value})}
                                        >
                                            <option value="">-- Sin Categoria (General) --</option>
                                            {categorias.map(cat => (
                                                <option key={cat.id_categoria} value={cat.id_categoria}>
                                                    {cat.nombre_categoria}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold text-secondary small">Descripcion (Opcional):</label>
                                        <textarea 
                                            className="form-control bg-light text-dark"
                                            value={formData.descripcion} 
                                            onChange={e => setFormData({...formData, descripcion: e.target.value})} 
                                            rows="3"
                                            style={{ resize: 'vertical' }}
                                        />
                                    </div>

                                    <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                                        <button type="button" onClick={() => setModalProductoAbierto(false)} className="btn btn-secondary fw-bold px-4">
                                            Cancelar
                                        </button>
                                        <button type="submit" className="btn btn-success fw-bold px-4">
                                            {productoEditando ? 'Guardar Cambios' : 'Registrar Producto'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductosPage;