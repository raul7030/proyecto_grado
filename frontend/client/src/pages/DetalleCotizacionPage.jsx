// src/pages/DetalleCotizacionPage.jsx
import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; 
import axiosInstance from '../api/axiosInstance';
import AuthContext from '../context/AuthContext';
import styles from './DetalleCotizacionPage.module.css';

const DetalleCotizacionPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [cotizacion, setCotizacion] = useState(null);
    const [seguimientos, setSeguimientos] = useState([]);
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Acciones
    const [nuevoEstado, setNuevoEstado] = useState('');
    const [notasSeguimiento, setNotasSeguimiento] = useState('');
    const [tipoInteraccion, setTipoInteraccion] = useState('Llamada');

    useEffect(() => {
        fetchCotizacion();
    }, [id]);

    const fetchCotizacion = async () => {
        try {
            setLoading(true);
            const [cotizRes, segRes, prodRes] = await Promise.all([
                axiosInstance.get(`/cotizaciones/${id}/`),
                axiosInstance.get(`/seguimientos/?cotizacion=${id}`),
                axiosInstance.get('/productos/')
            ]);
            
            setCotizacion(cotizRes.data);
            setNuevoEstado(cotizRes.data.estado); 
            setSeguimientos(segRes.data.reverse()); 
            setProductos(prodRes.data);
            
            setError(null);
        } catch (err) {
            console.error("Error fetching detalle cotización:", err);
            setError("No se pudo cargar la cotización.");
            setCotizacion(null);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSeguimiento = async (e) => {
        e.preventDefault();
        try {
            const data = {
                cotizacion: cotizacion.id_cotizacion,
                tipo_interaccion: tipoInteraccion,
                notas: notasSeguimiento,
            };
            const response = await axiosInstance.post('/seguimientos/', data);
            setSeguimientos([response.data, ...seguimientos]);
            setNotasSeguimiento('');
        } catch (err) {
            alert("❌ Error al registrar el seguimiento.");
            console.error(err);
        }
    };
    
    const handleUpdateEstado = async () => {
        if (!window.confirm(`¿Estás seguro de cambiar el estado a ${nuevoEstado}?`)) return;

        try {
            await axiosInstance.patch(`/cotizaciones/${id}/`, { estado: nuevoEstado });
            setCotizacion({ ...cotizacion, estado: nuevoEstado });
            alert(`✅ Estado actualizado a: ${nuevoEstado}. El inventario se ajustó si corresponde.`);
            fetchCotizacion(); 
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.detail || err.response?.data?.non_field_errors || "Error al actualizar";
            alert("❌ No se pudo cambiar el estado:\n" + errorMsg);
            setNuevoEstado(cotizacion.estado); 
        }
    };

    const handleImprimir = () => window.print();

    const getEstadoBadge = (estado) => {
        const est = estado?.toUpperCase() || '';
        if (est === 'ACEPTADA') return <span className={`badge bg-success ${styles.badgeLarge}`}>ACEPTADA</span>;
        if (est === 'PENDIENTE') return <span className={`badge bg-warning ${styles.badgeLarge}`}>PENDIENTE</span>;
        if (est === 'RECHAZADA' || est === 'VENCIDA') return <span className={`badge bg-danger ${styles.badgeLarge}`}>{est}</span>;
        return <span className={`badge bg-secondary ${styles.badgeLarge}`}>{estado}</span>;
    };

    if (loading) return <p className="loading-text">Cargando detalles de la venta...</p>;
    if (error && !cotizacion) return <p className="empty-state text-danger">{error}</p>;
    if (!cotizacion) return <p className="empty-state">Cotización no encontrada.</p>;

    const subtotal = cotizacion.detalles.reduce((acc, item) => 
        acc + (parseFloat(item.cantidad || 0) * parseFloat(item.precio_unitario_cotizado || 0)), 0);
    const total = subtotal - parseFloat(cotizacion.descuento || 0);

    return (
        <div className={`page-container ${styles.printArea}`}>
            
            {/* ENCABEZADO FORMAL (SOLO VISIBLE AL IMPRIMIR) */}
            <div className={styles.printOnlyHeader}>
                <h2>DOCUMENTO DE COTIZACIÓN</h2>
                <p><strong>N° de Referencia:</strong> {cotizacion.codigo_cotizacion}</p>
                <p><strong>Fecha de Emisión:</strong> {new Date(cotizacion.fecha_creacion).toLocaleDateString()}</p>
                <hr />
            </div>

            {/* CABECERA WEB */}
            <div className={`page-header ${styles.mb20} ${styles.noPrint}`}>
                <div>
                    <h1>📄 Detalle de Cotización <span className={styles.highlightId}>#{cotizacion.codigo_cotizacion}</span></h1>
                    <p className="text-muted">
                        Emitida por <strong>{cotizacion.vendedor_nombre}</strong> el {new Date(cotizacion.fecha_creacion).toLocaleDateString()}
                    </p>
                </div>
                <div className={styles.noPrint}>
                    <button onClick={() => navigate('/erp/cotizaciones')} className="btn-secondary mr-2">
                        ← Volver
                    </button>
                    <button onClick={() => navigate(`/erp/cotizaciones/${cotizacion.id_cotizacion}/imprimir`)}>
                        🖨️ Imprimir
                    </button>
                </div>
            </div>

            {/* SECCIÓN 1: INFO Y ESTADO */}
            <div className={`dashboard-widgets-grid ${styles.mb20}`}>
                
                <div className="widget-card">
                    <div className="widget-header">🏢 Información Comercial</div>
                    <div className="form-row">
                        <div className="form-group half">
                            <label className="text-muted">Cliente:</label>
                            <div className={styles.infoValue}>{cotizacion.cliente_nombre}</div>
                        </div>
                        <div className="form-group half">
                            <label className="text-muted">Sucursal de Origen:</label>
                            <div className={styles.infoValue}>📍 {cotizacion.sucursal_nombre}</div>
                        </div>
                    </div>
                    <div className={`form-row ${styles.mt5}`}>
                        <div className="form-group half">
                            <label className="text-muted">Fecha de Validez:</label>
                            <div>{new Date(cotizacion.fecha_validez).toLocaleDateString()}</div>
                        </div>
                    </div>
                </div>

                <div className={`widget-card ${styles.cardVariant} ${styles.noPrint}`}>
                    <div className="widget-header">🚦 Estado de la Venta</div>
                    
                    <div className={styles.estadoRow}>
                        <span className="text-muted">Estado Actual:</span>
                        {getEstadoBadge(cotizacion.estado)}
                    </div>

                    <div className={`${styles.cambiarEstadoBox} ${styles.noPrint}`}>
                        <label className={styles.labelBold}>Cambiar Estado:</label>
                        <div className={styles.actionRow}>
                            <select 
                                className={`search-input ${styles.flex1}`} 
                                value={nuevoEstado} 
                                onChange={(e) => setNuevoEstado(e.target.value)}
                            >
                                <option value="Pendiente">Pendiente</option>
                                <option value="Aceptada">Aceptada (Descuenta Stock)</option>
                                <option value="Rechazada">Rechazada</option>
                                <option value="Vencida">Vencida</option>
                            </select>
                            <button onClick={handleUpdateEstado} className="btn-primary">
                                Actualizar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: PRODUCTOS COTIZADOS */}
            <div className={`widget-card ${styles.mb20}`}>
                <div className="widget-header">📦 Detalle de Productos</div>
                <div className={`table-wrapper ${styles.tableWrapper}`}>
                    <table className={`data-table ${styles.noHoverTable}`}>
                        <thead>
                            <tr>
                                {/* APLICANDO LAS CLASES DE ANCHO ESPECÍFICO */}
                                <th className={styles.colSku}>SKU</th>
                                <th className={styles.colDesc}>Producto</th>
                                <th className={styles.colQty}>Cantidad</th>
                                <th className={styles.colPrice}>P. Unitario (Bs)</th>
                                <th className={styles.colSubtotal}>Subtotal (Bs)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cotizacion.detalles.map((item, index) => {
                                const productoReal = productos.find(p => p.id_producto === item.producto);
                                const nombreMostrar = productoReal ? productoReal.nombre_producto : (item.nombre_producto || 'Producto no encontrado');
                                const skuMostrar = productoReal ? productoReal.sku : (item.producto_sku || '-');

                                return (
                                    <tr key={item.id_detalle || index}>
                                        <td className="font-mono text-muted">{skuMostrar}</td>
                                        <td><strong>{nombreMostrar}</strong></td>
                                        <td className={styles.qtyCell}>{item.cantidad}</td>
                                        <td className={styles.textRight}>{parseFloat(item.precio_unitario_cotizado || 0).toFixed(2)}</td>
                                        <td className={styles.subtotalCell}>
                                            {(parseFloat(item.cantidad || 0) * parseFloat(item.precio_unitario_cotizado || 0)).toFixed(2)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* TOTALES */}
                <div className={styles.totalsWrapper}>
                    <div className={styles.totalsBox}>
                        <div className={styles.totalRow}>
                            <span>Subtotal:</span>
                            <span>Bs. {subtotal.toFixed(2)}</span>
                        </div>
                        <div className={styles.discountRow}>
                            <span>Descuento Aplicado:</span>
                            <span>- Bs. {parseFloat(cotizacion.descuento || 0).toFixed(2)}</span>
                        </div>
                        <div className={styles.finalTotalRow}>
                            <span>TOTAL:</span>
                            <span>Bs. {total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 3: MÓDULO CRM (SEGUIMIENTO) - COMPLETAMENTE OCULTO AL IMPRIMIR */}
            <div className={`widget-card ${styles.noPrint}`}>
                <div className="widget-header">📝 Registro de Seguimiento (CRM)</div>
                
                <form onSubmit={handleAddSeguimiento} className={styles.crmForm}>
                    <div className={`form-row ${styles.crmFormRow}`}>
                        <div className={`form-group ${styles.flex1}`}>
                            <label>Tipo de Interacción:</label>
                            <select 
                                className={`search-input ${styles.fullWidthInput}`}
                                value={tipoInteraccion} 
                                onChange={(e) => setTipoInteraccion(e.target.value)}
                            >
                                <option value="Llamada">📞 Llamada</option>
                                <option value="Email">📧 Email</option>
                                <option value="WhatsApp">💬 WhatsApp</option>
                                <option value="Visita">🤝 Visita Presencial</option>
                                <option value="Otro">📌 Otro</option>
                            </select>
                        </div>
                        <div className={`form-group ${styles.flex3}`}>
                            <label>Notas del Vendedor:</label>
                            <textarea 
                                className={`search-input ${styles.textAreaCrm}`}
                                value={notasSeguimiento} 
                                onChange={(e) => setNotasSeguimiento(e.target.value)} 
                                placeholder="Ej: El cliente dice que lo revisará con su gerente y me avisa el viernes..."
                                required 
                            />
                        </div>
                    </div>
                    <div className={styles.btnAlignRight}>
                        <button type="submit" className="btn-success">
                            💾 Registrar Interacción
                        </button>
                    </div>
                </form>

                <h4 className={styles.timelineTitle}>Historial de Actividades:</h4>
                {seguimientos.length === 0 ? (
                    <p className="empty-state">No hay registros de seguimiento para esta cotización.</p>
                ) : (
                    <div className={styles.timelineWrapper}>
                        {seguimientos.map(s => (
                            <div key={s.id_seguimiento} className={styles.timelineItem}>
                                <div className={styles.timelineHeader}>
                                    <span className={styles.timelineType}>{s.tipo_interaccion}</span>
                                    <span className={`text-muted ${styles.timelineDate}`}>
                                        {new Date(s.fecha_seguimiento).toLocaleString()}
                                    </span>
                                </div>
                                <p className={styles.timelineNote}>{s.notas}</p>
                                <div className={styles.timelineAuthor}>
                                    Registrado por: <strong>{s.usuario_nombre}</strong>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};

export default DetalleCotizacionPage;