// src/pages/Inventario.jsx
import { useState, useEffect, useMemo } from 'react';
import { usePermisos } from '../hooks/usePermisos';
import { obtenerMovimientos, obtenerTraspasos, crearTraspaso, aprobarTraspaso, rechazarTraspaso } from '../api/inventario';
import { getProductos } from '../api/productos'; 
import { getSucursales } from '../api/sucursales'; 
import styles from './Inventario.module.css';

const Inventario = () => {
    // Permisos y control de acceso
    const { esAdmin, puedeTocarStock } = usePermisos();
    const [pestanaActiva, setPestanaActiva] = useState('kardex'); 

    // Estados maestros
    const [productos, setProductos] = useState([]);
    const [sucursales, setSucursales] = useState([]);
    const [traspasos, setTraspasos] = useState([]);

    // Filtros de vista principal
    const [filtroSucursal, setFiltroSucursal] = useState('');
    const [busquedaProducto, setBusquedaProducto] = useState('');

    // Estados del Modal Kardex
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [movimientosProducto, setMovimientosProducto] = useState([]);
    const [cargandoKardex, setCargandoKardex] = useState(false);

    // Estados para filtros internos del Kardex
    const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
    const [filtroFechaFin, setFiltroFechaFin] = useState('');
    const [filtroTipoOperacion, setFiltroTipoOperacion] = useState('');

    // Estado del formulario de traspasos
    const [formTraspaso, setFormTraspaso] = useState({ sucursal_origen: '', sucursal_destino: '', producto: '', cantidad: 1 });

    useEffect(() => {
        cargarDatosMaestros();
        if (puedeTocarStock) cargarTraspasos();
    }, [puedeTocarStock]);

    const cargarDatosMaestros = async () => {
        try {
            const prodData = await getProductos();
            const sucData = await getSucursales();
            setProductos(prodData);
            setSucursales(sucData);
        } catch (error) {
            console.error("Error en la carga de catálogos maestros de productos y sucursales.");
        }
    };

    const cargarTraspasos = async () => {
        try {
            const data = await obtenerTraspasos();
            setTraspasos(data);
        } catch (error) {
            console.error("Error al obtener el listado de traspasos.");
        }
    };

    // Apertura y consulta de historial Kardex
    const verKardex = async (producto) => {
        setProductoSeleccionado(producto);
        setCargandoKardex(true);
        // Reiniciar filtros al abrir un nuevo producto
        setFiltroFechaInicio('');
        setFiltroFechaFin('');
        setFiltroTipoOperacion('');

        try {
            const filtros = { producto: producto.id_producto };
            if (filtroSucursal) filtros.sucursal = filtroSucursal;

            const historial = await obtenerMovimientos(filtros);
            setMovimientosProducto(historial);
        } catch (error) {
            alert("Excepción al cargar el historial de movimientos del Kardex.");
        } finally {
            setCargandoKardex(false);
        }
    };

    const cerrarKardex = () => {
        setProductoSeleccionado(null);
        setMovimientosProducto([]);
    };

    // Procesamiento de solicitudes de traspaso
    const handleSolicitar = async (e) => {
        e.preventDefault();
        
        if (!formTraspaso.sucursal_origen || !formTraspaso.sucursal_destino || !formTraspaso.producto) {
            alert("Validación fallida: Todos los campos son obligatorios.");
            return;
        }
        if (formTraspaso.sucursal_origen === formTraspaso.sucursal_destino) {
            alert("Validación fallida: Origen y destino no pueden coincidir.");
            return;
        }

        try {
            await crearTraspaso(formTraspaso);
            alert("Solicitud registrada correctamente.");
            cargarTraspasos();
            setFormTraspaso({ ...formTraspaso, cantidad: 1, producto: '' });
        } catch (error) {
            const data = error.response?.data;
            if (data?.error) alert("Error del servidor: " + data.error);
            else alert("Error de comunicación con el servidor.");
        }
    };

    const handleAprobar = async (id) => {
        if(!window.confirm("¿Confirma la transacción? Esta acción modificará el inventario físico.")) return;
        try { 
            await aprobarTraspaso(id); 
            cargarTraspasos(); 
            cargarDatosMaestros();
            alert("Traspaso ejecutado con éxito.");
        } catch (e) { 
            alert("Excepción al aprobar. Valide la disponibilidad de stock en el almacén de origen."); 
        }
    };

    // Buscador general de productos
    const productosFiltrados = productos.filter(p => 
        (p.nombre_producto?.toLowerCase() || '').includes(busquedaProducto.toLowerCase()) ||
        (p.sku?.toLowerCase() || '').includes(busquedaProducto.toLowerCase())
    );

    // Filtrado dinámico local para los registros del Kardex
    const movimientosKardexFiltrados = useMemo(() => {
        return movimientosProducto.filter(movimiento => {
            let cumpleInicio = true;
            let cumpleFin = true;
            let cumpleTipo = true;

            const fechaMovimiento = new Date(movimiento.fecha);

            if (filtroFechaInicio) {
                const inicio = new Date(filtroFechaInicio);
                inicio.setHours(0, 0, 0, 0);
                cumpleInicio = fechaMovimiento >= inicio;
            }

            if (filtroFechaFin) {
                const fin = new Date(filtroFechaFin);
                fin.setHours(23, 59, 59, 999);
                cumpleFin = fechaMovimiento <= fin;
            }

            if (filtroTipoOperacion) {
                cumpleTipo = movimiento.tipo === filtroTipoOperacion;
            }

            return cumpleInicio && cumpleFin && cumpleTipo;
        });
    }, [movimientosProducto, filtroFechaInicio, filtroFechaFin, filtroTipoOperacion]);

    // Extracción de tipos de operación únicos para el selector del filtro
    const tiposOperacionUnicos = useMemo(() => {
        const tipos = movimientosProducto.map(m => m.tipo);
        return [...new Set(tipos)];
    }, [movimientosProducto]);

    return (
        <div className="container-fluid py-4 bg-light min-vh-100">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
                <div>
                    <h1 className="h3 mb-1 text-dark fw-bold">Control de Inventario y Kardex</h1>
                    <p className="text-muted">Gestión de stock físico, valorado y trazabilidad de productos.</p>
                </div>
            </div>

            {/* Navegación de módulos */}
            <div className={styles.tabsContainer}>
                <button 
                    onClick={() => setPestanaActiva('kardex')}
                    className={pestanaActiva === 'kardex' ? 'btn fw-bold ' + styles.buttonPrimary : 'btn fw-bold ' + styles.buttonSecondary}
                >
                    Catálogo y Kardex
                </button>
                {puedeTocarStock && (
                    <button 
                        onClick={() => setPestanaActiva('traspasos')}
                        className={pestanaActiva === 'traspasos' ? 'btn fw-bold ' + styles.buttonPrimary : 'btn fw-bold ' + styles.buttonSecondary}
                    >
                        Gestión de Traspasos
                    </button>
                )}
            </div>

            {/* Módulo: Catálogo y Kardex */}
            {pestanaActiva === 'kardex' && (
                <div className="card shadow-sm border-0">
                    <div className="card-body">
                        <div className="row mb-4 align-items-end">
                            <div className="col-md-6 mb-3 mb-md-0">
                                <label className="form-label fw-bold text-secondary">Búsqueda de Producto:</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-end-0">Buscar</span>
                                    <input 
                                        type="text" 
                                        placeholder="Ingrese Nombre o SKU..." 
                                        className="form-control border-start-0"
                                        value={busquedaProducto}
                                        onChange={(e) => setBusquedaProducto(e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            {esAdmin && (
                                <div className="col-md-6">
                                    <label className="form-label fw-bold text-secondary">Filtrar por Sucursal:</label>
                                    <select 
                                        className="form-select"
                                        value={filtroSucursal}
                                        onChange={(e) => setFiltroSucursal(e.target.value)}
                                    >
                                        <option value="">-- Consolidado Global --</option>
                                        {sucursales.map(s => (
                                            <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Tabla Principal de Catálogo */}
                        <div className="table-responsive">
                            <table className={`table table-hover align-middle mb-0 ${styles.noHoverTable}`}>
                                <thead className="table-light">
                                    <tr>
                                        <th>SKU</th>
                                        <th>Producto</th>
                                        <th>Categoría</th>
                                        <th>Stock Global</th>
                                        <th className="text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productosFiltrados.map(p => (
                                        <tr key={p.id_producto}>
                                            <td className="font-monospace text-secondary">{p.sku}</td>
                                            <td><strong className="text-dark">{p.nombre_producto}</strong></td>
                                            <td>{p.categoria_nombre || 'General'}</td>
                                            <td className={styles.stockGlobalCell}>
                                                <span className={`badge ${p.stock_total > 0 ? 'bg-success' : 'bg-danger'}`}>
                                                    {p.stock_total || 0} unid.
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <button 
                                                    onClick={() => verKardex(p)}
                                                    className="btn btn-sm btn-outline-primary fw-bold"
                                                >
                                                    Ver Kardex
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {productosFiltrados.length === 0 && (
                                        <tr><td colSpan="5" className="text-center py-4 text-muted">No se encontraron registros.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Detalle Kardex */}
            {productoSeleccionado && (
                <div className={styles.modalOverlay} onClick={cerrarKardex}>
                    <div className={styles.modalKardexContent} onClick={e => e.stopPropagation()}>
                        
                        <div className={styles.modalHeader}>
                            <div className={styles.modalHeaderFlex}>
                                <div>
                                    <h4 className={`text-primary fw-bold ${styles.modalTitle}`}>
                                        {productoSeleccionado.nombre_producto}
                                    </h4>
                                    <p className={`text-muted mb-0 ${styles.modalSubtitle}`}>
                                        SKU: <strong>{productoSeleccionado.sku}</strong> <br/>
                                        Vista Activa: <span className="text-dark">
                                            {filtroSucursal ? sucursales.find(s => s.id_sucursal == filtroSucursal)?.nombre : 'Consolidado Global'}
                                        </span>
                                    </p>
                                </div>
                                <button onClick={cerrarKardex} className="btn-close"></button>
                            </div>
                        </div>

                        <div className={styles.modalBody}>
                            {/* Panel de Filtros Internos del Kardex */}
                            {!cargandoKardex && movimientosProducto.length > 0 && (
                                <div className="row g-2 mb-3 bg-light p-3 rounded border">
                                    <div className="col-12 col-md-4">
                                        <label className="form-label small fw-bold text-secondary mb-1">Fecha Inicio</label>
                                        <input 
                                            type="date" 
                                            className="form-control form-control-sm"
                                            value={filtroFechaInicio}
                                            onChange={(e) => setFiltroFechaInicio(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-12 col-md-4">
                                        <label className="form-label small fw-bold text-secondary mb-1">Fecha Fin</label>
                                        <input 
                                            type="date" 
                                            className="form-control form-control-sm"
                                            value={filtroFechaFin}
                                            onChange={(e) => setFiltroFechaFin(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-12 col-md-4">
                                        <label className="form-label small fw-bold text-secondary mb-1">Tipo de Operación</label>
                                        <select 
                                            className="form-select form-select-sm"
                                            value={filtroTipoOperacion}
                                            onChange={(e) => setFiltroTipoOperacion(e.target.value)}
                                        >
                                            <option value="">Todas las operaciones</option>
                                            {tiposOperacionUnicos.map(tipo => (
                                                <option key={tipo} value={tipo}>{tipo.replace('_', ' ')}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {cargandoKardex ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status"></div>
                                    <p className="mt-2 text-muted">Procesando registros de Kardex...</p>
                                </div>
                            ) : movimientosProducto.length === 0 ? (
                                <div className="text-center py-5">
                                    <p className="text-muted fw-bold">Sin registros históricos para este producto.</p>
                                </div>
                            ) : movimientosKardexFiltrados.length === 0 ? (
                                <div className="text-center py-5">
                                    <p className="text-muted fw-bold">Ningún movimiento coincide con los filtros aplicados.</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className={`table table-sm table-striped align-middle ${styles.noHoverTable} ${styles.kardexTable}`}>
                                        <thead className="table-dark">
                                            <tr>
                                                <th>Fecha Operación</th>
                                                <th>Tipo</th>
                                                <th>Sucursal</th>
                                                <th className={styles.textRight}>Unidades</th>
                                                <th className={styles.textRight}>Saldo Físico</th>
                                                <th>Responsable</th>
                                                <th>Ref. Documental</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {movimientosKardexFiltrados.map((m) => {
                                                const isPositive = m.cantidad > 0;
                                                return (
                                                    <tr key={m.id}>
                                                        <td className={styles.noWrap}>{new Date(m.fecha).toLocaleString()}</td>
                                                        <td>
                                                            <span className={`badge ${isPositive ? 'bg-success' : 'bg-danger'} opacity-75`}>
                                                                {m.tipo.replace('_', ' ')}
                                                            </span>
                                                        </td>
                                                        <td>{m.sucursal_nombre}</td>
                                                        <td className={`${styles.textRight} ${styles.textBold} ${isPositive ? styles.stockPositive : styles.stockNegative}`}>
                                                            {isPositive ? `+${m.cantidad}` : m.cantidad}
                                                        </td>
                                                        <td className={`font-monospace ${styles.textRight} ${styles.textBold}`}>
                                                            {m.saldo_historico}
                                                        </td>
                                                        <td>{m.usuario_nombre}</td>
                                                        <td className="text-muted small text-truncate" style={{maxWidth: '150px'}} title={m.referencia}>
                                                            {m.referencia}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className={styles.modalActions}>
                            <button onClick={cerrarKardex} className="btn btn-secondary fw-bold px-4">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Módulo: Gestión Logística de Traspasos */}
            {pestanaActiva === 'traspasos' && puedeTocarStock && (
                <div className="row g-4">
                    <div className="col-12 col-lg-4">
                        <div className="card shadow-sm border-0 h-100">
                            <div className="card-header bg-white py-3 border-bottom">
                                <h5 className={`m-0 fw-bold ${styles.colorPrimary}`}>Solicitud de Traspaso</h5>
                            </div>
                            <div className="card-body">
                                <form onSubmit={handleSolicitar}>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold text-secondary">Origen</label>
                                        <select 
                                            className="form-select"
                                            value={formTraspaso.sucursal_origen}
                                            onChange={e => setFormTraspaso({...formTraspaso, sucursal_origen: e.target.value})}
                                            required
                                        >
                                            <option value="">Seleccione Origen</option>
                                            {sucursales.map(s => <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre}</option>)}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold text-secondary">Destino</label>
                                        <select 
                                            className="form-select"
                                            value={formTraspaso.sucursal_destino}
                                            onChange={e => setFormTraspaso({...formTraspaso, sucursal_destino: e.target.value})}
                                            required
                                        >
                                            <option value="">Seleccione Destino</option>
                                            {sucursales.map(s => <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre}</option>)}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold text-secondary">Producto Técnico</label>
                                        <select 
                                            className="form-select"
                                            value={formTraspaso.producto}
                                            onChange={e => setFormTraspaso({...formTraspaso, producto: e.target.value})}
                                            required
                                        >
                                            <option value="">Seleccione Producto</option>
                                            {productos.map(p => <option key={p.id_producto} value={p.id_producto}>{p.nombre_producto} (Disp: {p.stock_total})</option>)}
                                        </select>
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label fw-bold text-secondary">Cantidad Operativa</label>
                                        <input 
                                            type="number" min="1"
                                            className="form-control"
                                            value={formTraspaso.cantidad}
                                            onChange={e => setFormTraspaso({...formTraspaso, cantidad: e.target.value})}
                                            required 
                                        />
                                    </div>

                                    <button type="submit" className={`btn w-100 fw-bold ${styles.buttonPrimary}`}>Procesar Solicitud</button>
                                </form>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-lg-8">
                        <div className="card shadow-sm border-0 h-100">
                            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                                <h5 className={`m-0 fw-bold ${styles.colorPrimary}`}>Bitácora de Traspasos</h5>
                                <span className="badge bg-secondary">{traspasos.length} Transacciones</span>
                            </div>
                            <div className="table-responsive">
                                <table className={`table table-hover align-middle mb-0 ${styles.noHoverTable}`}>
                                    <thead className="table-light">
                                        <tr>
                                            <th>Registro</th>
                                            <th>Ruta Operativa</th>
                                            <th>Detalle Producto</th>
                                            <th className="text-center">Vol.</th>
                                            <th className="text-center">Estatus</th>
                                            {esAdmin && <th className="text-center">Control</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {traspasos.map((t) => (
                                            <tr key={t.id}>
                                                <td className="text-muted small">{new Date(t.fecha_solicitud).toLocaleDateString()}</td>
                                                <td>
                                                    <strong>{t.origen_nombre}</strong> 
                                                    <br/>
                                                    <small className="text-muted">Destino: {t.destino_nombre}</small>
                                                </td>
                                                <td>{t.producto_nombre}</td>
                                                <td className="text-center fw-bold text-primary">{t.cantidad}</td>
                                                <td className="text-center">
                                                    <span className={`badge px-2 py-1
                                                        ${t.estado === 'PENDIENTE' ? 'bg-warning text-dark' : ''}
                                                        ${t.estado === 'APROBADA' ? 'bg-success' : ''}
                                                        ${t.estado === 'RECHAZADA' ? 'bg-danger' : ''}
                                                    `}>{t.estado}</span>
                                                </td>
                                                {esAdmin && (
                                                    <td className="text-center">
                                                        {t.estado === 'PENDIENTE' ? (
                                                            <div className="btn-group">
                                                                <button onClick={() => handleAprobar(t.id)} className="btn btn-sm btn-outline-success">Aprobar</button>
                                                                <button onClick={() => rechazarTraspaso(t.id).then(cargarTraspasos)} className="btn btn-sm btn-outline-danger">Rechazar</button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted">Procesado</span>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                        {traspasos.length === 0 && (
                                            <tr><td colSpan="6" className="text-center py-4 text-muted">No existen operaciones de traspaso registradas.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventario;