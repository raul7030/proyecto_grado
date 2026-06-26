// src/pages/ReportesInventarioPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { usePermisos } from '../hooks/usePermisos';
import styles from './ReportesInventarioPage.module.css';

const ReportesInventarioPage = () => {
    const { esAdmin, esAlmacenero, sucursalUsuario } = usePermisos();
    
    const [loading, setLoading] = useState(true);
    const [sucursales, setSucursales] = useState([]);
    const [productos, setProductos] = useState([]);
    const [stockFiltrado, setStockFiltrado] = useState([]);
    const [sucursalSeleccionada, setSucursalSeleccionada] = useState(esAdmin ? '' : sucursalUsuario);

    useEffect(() => {
        cargarDatosBase();
    }, []);

    useEffect(() => {
        if (sucursalSeleccionada && productos.length > 0) {
            cargarStockDeSucursal(sucursalSeleccionada);
        } else {
            setStockFiltrado([]);
        }
    }, [sucursalSeleccionada, productos]);

    const cargarDatosBase = async () => {
        try {
            const [resSucursales, resProductos] = await Promise.all([
                axiosInstance.get('/sucursales/'),
                axiosInstance.get('/productos/')
            ]);
            setSucursales(resSucursales.data);
            setProductos(resProductos.data);
        } catch (error) {
            console.error("Error cargando datos base:", error);
        } finally {
            setLoading(false);
        }
    };

    const cargarStockDeSucursal = async (idSucursal) => {
        try {
            const resStock = await axiosInstance.get(`/stock/?sucursal=${idSucursal}`);
            const stockLocal = resStock.data;

            const listaParaConteo = productos.map(prod => {
                const stockItem = stockLocal.find(s => s.producto === prod.id_producto);
                return {
                    sku: prod.sku,
                    nombre: prod.nombre_producto,
                    categoria: prod.categoria_nombre || 'Sin Categoría',
                    stockSistema: stockItem ? stockItem.cantidad : 0
                };
            }).filter(item => item.stockSistema !== 0);

            listaParaConteo.sort((a, b) => a.sku.localeCompare(b.sku));
            setStockFiltrado(listaParaConteo);
        } catch (error) {
            console.error("Error cargando stock local:", error);
        }
    };

    const handleImprimir = () => {
        window.print();
    };

    const nombreSucursalActual = sucursales.find(s => s.id_sucursal === parseInt(sucursalSeleccionada))?.nombre || 'General';

    if (!esAdmin && !esAlmacenero) return <div className="text-center mt-5 text-danger fw-bold">🔒 Acceso denegado.</div>;
    if (loading) return <div className="text-center mt-5 text-muted">Cargando módulo de reportes...</div>;

    return (
        <div className="container-fluid py-4 bg-light min-vh-100">
            
            {/* ZONA DE CONTROLES (Oculta al imprimir) */}
            <div className="noPrint">
                
                {/* ENCABEZADO RESPONSIVO */}
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                    <div>
                        <h1 className="h3 mb-1 text-dark fw-bold">📋 Hoja de Conteo Físico</h1>
                        <p className="text-muted mb-0">Genera un reporte para cuadrar el inventario físico con el sistema.</p>
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                        <Link to="/erp/reportes" className="btn btn-outline-secondary fw-bold shadow-sm">
                            🏠 Volver a Reportes
                        </Link>
                        <button 
                            onClick={handleImprimir} 
                            className="btn btn-primary fw-bold shadow-sm"
                            disabled={!sucursalSeleccionada || stockFiltrado.length === 0}
                        >
                            🖨️ Imprimir Hoja
                        </button>
                    </div>
                </div>

                {/* FILTROS RESPONSIVOS (Card) */}
                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-body bg-white rounded">
                        <div className="row align-items-center">
                            <div className="col-12 col-md-6 col-lg-4">
                                <label className="form-label fw-bold text-secondary small">📍 Seleccionar Sucursal para el Conteo:</label>
                                <select 
                                    className="form-select bg-light text-dark" 
                                    value={sucursalSeleccionada} 
                                    onChange={(e) => setSucursalSeleccionada(e.target.value)}
                                    disabled={!esAdmin}
                                >
                                    <option value="">-- Elige una sucursal --</option>
                                    {sucursales.map(s => (
                                        <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre}</option>
                                    ))}
                                </select>
                                {!esAdmin && <small className="text-muted d-block mt-2">Solo puedes ver el stock de tu sucursal asignada.</small>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ZONA DE IMPRESIÓN Y TABLA */}
            {sucursalSeleccionada ? (
                <div className={`${styles.printSection} card shadow-sm border-0`}>
                    
                    <div className={styles.printHeader}>
                        <h2>HOJA DE CONTEO FÍSICO DE INVENTARIO</h2>
                        <p><strong>Sucursal:</strong> {nombreSucursalActual}</p>
                        <small>Fecha: {new Date().toLocaleDateString()} - Hora: {new Date().toLocaleTimeString()}</small>
                        <hr />
                    </div>

                    <div className="table-responsive">
                        <table className={`table table-hover align-middle mb-0 ${styles.noHoverTable} ${styles.printTable}`}>
                            <thead className="table-light">
                                <tr>
                                    <th className={styles.colSku}>SKU</th>
                                    <th className={styles.colDesc}>Descripción del Producto</th>
                                    <th className={styles.colCat}>Categoría</th>
                                    <th className={styles.colStock}>Stock Sistema</th>
                                    <th className={`${styles.colConteo} ${styles.thConteo}`}>CONTEO FÍSICO</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stockFiltrado.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center text-muted py-5">
                                            <div className="display-4 mb-3 opacity-50 noPrint">📦</div>
                                            No hay productos en stock en esta sucursal.
                                        </td>
                                    </tr>
                                ) : (
                                    stockFiltrado.map((item, index) => (
                                        <tr key={index}>
                                            <td className={styles.colSku}>{item.sku}</td>
                                            <td className={styles.colDesc}>
                                                <strong className="text-dark">{item.nombre}</strong>
                                            </td>
                                            <td className={styles.colCat}>{item.categoria}</td>
                                            <td className={`fs-5 ${styles.colStock}`}>{item.stockSistema}</td>
                                            {/* Celda vacía intencionalmente para que el almacenero anote a mano */}
                                            <td className={styles.colConteo}></td> 
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className={styles.printSignatures}>
                        <div className={styles.signatureBlock}>
                            <div className={styles.signatureLine}></div>
                            <p className={styles.signatureTitle}>Firma del Almacenero</p>
                            <p className={styles.signatureSubtitle}>Responsable del Conteo</p>
                        </div>
                        <div className={styles.signatureBlock}>
                            <div className={styles.signatureLine}></div>
                            <p className={styles.signatureTitle}>Firma del Gerente/Admin</p>
                            <p className={styles.signatureSubtitle}>Validación</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-5 noPrint">
                    <div className="display-4 text-muted mb-3 opacity-50">📍</div>
                    <h5 className="text-muted fw-bold">Esperando Sucursal</h5>
                    <p className="text-muted">Selecciona una sucursal en la parte superior para cargar la hoja de conteo.</p>
                </div>
            )}
        </div>
    );
};

export default ReportesInventarioPage;