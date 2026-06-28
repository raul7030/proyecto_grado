// src/pages/HomePage.jsx
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { usePermisos } from '../hooks/usePermisos';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell 
} from 'recharts';
import styles from './HomePage.module.css';

const HomePage = () => {
    // CORRECCIÓN: Aquí es donde declaramos nombreSucursal correctamente
    const { esAdmin, nombreSucursal } = usePermisos();
    const [loading, setLoading] = useState(true);
    
    const [cotizacionesRaw, setCotizacionesRaw] = useState([]);
    const [productosRaw, setProductosRaw] = useState([]);
    const [vendedoresRaw, setVendedoresRaw] = useState([]);

    const [filtroMes, setFiltroMes] = useState('ALL');
    const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear().toString());
    const [filtroVendedor, setFiltroVendedor] = useState('ALL');

    useEffect(() => {
        cargarDatosGlobales();
    }, []);

    const cargarDatosGlobales = async () => {
        try {
            const [resCotiz, resProd, resUser] = await Promise.all([
                axiosInstance.get('/cotizaciones/'),
                axiosInstance.get('/productos/'),
                axiosInstance.get('/usuarios/')
            ]);

            setCotizacionesRaw(resCotiz.data);
            setProductosRaw(resProd.data);
            setVendedoresRaw(resUser.data);
        } catch (error) {
            console.error("Excepción al cargar métricas del Dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const reportes = useMemo(() => {
        if (!cotizacionesRaw.length && !productosRaw.length) return null;

        // 1. APLICACIÓN DE FILTROS GLOBALES
        const cotsFiltradas = cotizacionesRaw.filter(c => {
            if (!c.fecha_creacion) return false;
            
            const fecha = new Date(c.fecha_creacion);
            const mesMatch = filtroMes === 'ALL' || (fecha.getMonth() + 1).toString() === filtroMes.toString();
            const anioMatch = filtroAnio === 'ALL' || fecha.getFullYear().toString() === filtroAnio.toString();
            
            const idVendedorCotizacion = c.usuario_vendedor_id || c.usuario_vendedor || c.id_usuario || '';
            const vendMatch = filtroVendedor === 'ALL' || String(idVendedorCotizacion) === String(filtroVendedor);
            
            return mesMatch && anioMatch && vendMatch;
        });

        // 2. INICIALIZACIÓN DE VARIABLES
        let montoTotal = 0;
        let ventasReales = 0;
        let countAceptada = 0, countPendiente = 0, countRechazada = 0;
        const rankingProds = {};
        const rankVend = {};

        // 3. PROCESAMIENTO DE DATOS
        cotsFiltradas.forEach(c => {
            const totalCotiz = parseFloat(c.total || c.total_calculado || 0);
            montoTotal += totalCotiz;
            
            const estadoStr = (c.estado || '').toUpperCase();
            
            if (estadoStr === 'ACEPTADA') {
                ventasReales += totalCotiz;
                countAceptada++;
            } else if (estadoStr === 'PENDIENTE' || estadoStr === 'EMITIDA') {
                countPendiente++;
            } else {
                countRechazada++; 
            }

            const detalles = c.detalles || c.detallecotizacion_set || [];
            detalles.forEach(det => {
                const prodReal = productosRaw.find(p => p.id_producto === det.producto);
                const nombreItem = prodReal ? prodReal.nombre_producto : (det.producto_sku || `Item-${det.producto}`);
                
                rankingProds[nombreItem] = (rankingProds[nombreItem] || 0) + parseInt(det.cantidad || 0);
            });

            const idVend = c.usuario_vendedor_id || c.usuario_vendedor || c.id_usuario;
            const vendedorEncontrado = vendedoresRaw.find(v => v.id === idVend || v.id_usuario === idVend);
            const vendNom = vendedorEncontrado ? (vendedorEncontrado.nombre || vendedorEncontrado.username) : 'Usuario No Identificado';
            
            if (!rankVend[vendNom]) {
                rankVend[vendNom] = { nombre: vendNom, total: 0, aceptadas: 0, ingresos: 0 };
            }
            
            rankVend[vendNom].total++;
            if (estadoStr === 'ACEPTADA') {
                rankVend[vendNom].aceptadas++;
                rankVend[vendNom].ingresos += totalCotiz;
            }
        });

        // 4. GENERACIÓN DE ESTRUCTURAS FINALES

        // Top Producto Individual (KPI)
        const topProductoArr = Object.entries(rankingProds).sort((a,b) => b[1] - a[1])[0] || ["Sin registros", 0];
        const topProducto = { nombre: topProductoArr[0], cant: topProductoArr[1] };

        // Top 10 Productos Más Cotizados (Panel de Demanda)
        const top10Productos = Object.entries(rankingProds)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([nombre, cantidad]) => ({
                // Truncamos el nombre para que no desborde el eje Y del gráfico
                nombreCorto: nombre.length > 25 ? nombre.substring(0, 25) + '...' : nombre,
                nombreCompleto: nombre,
                cantidad: cantidad
            }));

        const dataVendedores = Object.values(rankVend).map(v => ({
            ...v,
            tasaCierre: v.total > 0 ? ((v.aceptadas / v.total) * 100).toFixed(1) : 0
        })).sort((a, b) => b.ingresos - a.ingresos);

        const mesesLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const graficoEvolucion = mesesLabels.map((mes, idx) => {
            const cotsMes = cotizacionesRaw.filter(c => {
                if(!c.fecha_creacion) return false;
                const f = new Date(c.fecha_creacion);
                
                const anioMatch = filtroAnio === 'ALL' || f.getFullYear().toString() === filtroAnio.toString();
                const idVendCot = c.usuario_vendedor_id || c.usuario_vendedor || c.id_usuario || '';
                const vendMatch = filtroVendedor === 'ALL' || String(idVendCot) === String(filtroVendedor);
                
                return anioMatch && vendMatch && (f.getMonth() === idx);
            });

            return {
                name: mes,
                Aceptada: cotsMes.filter(c => (c.estado || '').toUpperCase() === 'ACEPTADA').length,
                Pendiente: cotsMes.filter(c => ['PENDIENTE', 'EMITIDA'].includes((c.estado || '').toUpperCase())).length,
                Rechazada: cotsMes.filter(c => !['ACEPTADA', 'PENDIENTE', 'EMITIDA'].includes((c.estado || '').toUpperCase())).length,
            };
        });

        const productosBajoStock = productosRaw.filter(p => (p.stock_total || 0) < 10 && (p.stock_total || 0) > 0).slice(0, 5);

        return {
            kpis: { montoTotal, ventasReales, countAceptada, countPendiente, countRechazada, topProducto },
            dataVendedores,
            top10Productos,
            graficoEvolucion,
            productosBajoStock,
            totalGlobalCots: cotsFiltradas.length
        };
    }, [cotizacionesRaw, productosRaw, vendedoresRaw, filtroMes, filtroAnio, filtroVendedor]);

    const COLORS_PIE = ['#16a34a', '#f59e0b', '#dc2626'];

    if (loading) return <div className="text-center mt-5 text-muted">Procesando métricas gerenciales...</div>;

    return (
        <div className={styles.homeContainer}>
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
                <div>
                    <h1 className="h3 mb-1 text-dark fw-bold">Dashboard Estratégico</h1>
                    {/* CORRECCIÓN: Quitamos la línea suelta de JS que rompía la vista */}
                    <p className="text-muted">
                        {esAdmin ? 'Análisis consolidado de rendimiento global' : `Operativa: Sucursal ${nombreSucursal}`}
                    </p>
                </div>
                
                <div className="d-flex gap-2 align-items-center flex-wrap">
                    {esAdmin && (
                        <div className={styles.filterContainer}>
                            <select className="form-select form-select-sm" value={filtroVendedor} onChange={e => setFiltroVendedor(e.target.value)}>
                                <option value="ALL">-- Consolidado de Asesores --</option>
                                {vendedoresRaw.map(v => (
                                    <option key={v.id_usuario || v.id} value={v.id_usuario || v.id}>{v.nombre || v.username}</option>
                                ))}
                            </select>
                            <select className="form-select form-select-sm" value={filtroMes} onChange={e => setFiltroMes(e.target.value)}>
                                <option value="ALL">Vista Anual Completa</option>
                                {["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"].map((m, i) => (
                                    <option key={i+1} value={i+1}>{m}</option>
                                ))}
                            </select>
                            <select className="form-select form-select-sm" value={filtroAnio} onChange={e => setFiltroAnio(e.target.value)}>
                                <option value="ALL">Registro Histórico Global</option>
                                <option value="2024">Gestión 2024</option>
                                <option value="2025">Gestión 2025</option>
                                <option value="2026">Gestión 2026</option>
                            </select>
                        </div>
                    )}
                    <Link to="/erp/cotizaciones/crear">
                        <button className="btn btn-success fw-bold shadow-sm">Generar Proforma</button>
                    </Link>
                </div>
            </div>

            {reportes && (
                <>
                    <div className="row g-3 mb-4">
                        <div className="col-md-3">
                            <div className={`${styles.kpiCard} ${styles.borderPrimary}`}>
                                <small className={styles.kpiLabelPrimary}>Proyección Comercial</small>
                                <div className="h4 mb-0 fw-bold">Bs. {reportes.kpis.montoTotal.toLocaleString('es-BO', {minimumFractionDigits: 2})}</div>
                                <small className="text-muted">{reportes.totalGlobalCots} propuestas emitidas</small>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className={`${styles.kpiCard} ${styles.borderSuccess}`}>
                                <small className={styles.kpiLabelSuccess}>Ingresos Confirmados</small>
                                <div className="h4 mb-0 fw-bold">Bs. {reportes.kpis.ventasReales.toLocaleString('es-BO', {minimumFractionDigits: 2})}</div>
                                <small className="text-muted">{reportes.kpis.countAceptada} transacciones exitosas</small>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className={`${styles.kpiCard} ${styles.borderWarning}`}>
                                <small className={styles.kpiLabelWarning}>Pipeline en Seguimiento</small>
                                <div className="h4 mb-0 fw-bold">{reportes.kpis.countPendiente}</div>
                                <small className="text-muted">Documentos vigentes sin cierre</small>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className={`${styles.kpiCard} ${styles.borderInfo}`}>
                                <small className={styles.kpiLabelInfo}>Demanda Dominante</small>
                                <div className="h6 mb-0 fw-bold text-truncate" title={reportes.kpis.topProducto.nombre}>
                                    {reportes.kpis.topProducto.nombre}
                                </div>
                                <small className="text-muted">{reportes.kpis.topProducto.cant} unidades solicitadas</small>
                            </div>
                        </div>
                    </div>

                    <div className="row g-4 mb-4">
                        <div className="col-lg-8">
                            <div className={styles.chartCard}>
                                <h6 className={styles.chartTitle}>Evolución Mensual de Conversión Comercial</h6>
                                <div className={styles.barChartContainer}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={reportes.graficoEvolucion}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} />
                                            <YAxis tick={{fill: '#64748b', fontSize: 12}} />
                                            <Tooltip cursor={{fill: '#f1f5f9'}} />
                                            <Legend />
                                            <Bar dataKey="Aceptada" stackId="a" fill="#16a34a" radius={[0, 0, 4, 4]} />
                                            <Bar dataKey="Pendiente" stackId="a" fill="#f59e0b" />
                                            <Bar dataKey="Rechazada" stackId="a" fill="#dc2626" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-4">
                            <div className={styles.chartCard}>
                                <h6 className={styles.chartTitle}>Tasa de Conversión Histórica</h6>
                                <div className={styles.pieChartContainer}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie 
                                                data={[
                                                    { name: 'Ventas Cerradas', value: reportes.kpis.countAceptada },
                                                    { name: 'En Proceso', value: reportes.kpis.countPendiente },
                                                    { name: 'Oportunidad Perdida', value: reportes.kpis.countRechazada }
                                                ]} 
                                                innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value"
                                            >
                                                {COLORS_PIE.map((color, i) => <Cell key={i} fill={color} />)}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className={styles.pieChartLegend}>
                                    <span className="me-2"><span className={styles.legendColorSuccess}>●</span> Aceptada</span>
                                    <span className="me-2"><span className={styles.legendColorWarning}>●</span> Pendiente</span>
                                    <span><span className={styles.legendColorDanger}>●</span> Vencida/Rechazada</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* NUEVO PANEL: TOP 10 PRODUCTOS MÁS DEMANDADOS */}
                    <div className="row mb-4">
                        <div className="col-12">
                            <div className={styles.chartCard}>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className={styles.chartTitle}>Análisis de Demanda: Top 10 Productos Más Cotizados</h6>
                                </div>
                                <div className={styles.topProductsChartContainer}>
                                    {reportes.top10Productos.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart 
                                                layout="vertical" 
                                                data={reportes.top10Productos} 
                                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                                <XAxis type="number" tick={{fill: '#64748b', fontSize: 12}} />
                                                <YAxis dataKey="nombreCorto" type="category" width={180} tick={{fill: '#495057', fontSize: 12, fontWeight: 500}} />
                                                <Tooltip 
                                                    cursor={{fill: '#f1f5f9'}} 
                                                    formatter={(value) => [value, 'Unidades Demandadas']}
                                                />
                                                <Bar dataKey="cantidad" fill="#1e3672" radius={[0, 4, 4, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className={styles.emptyStateContainer}>
                                            <p className="text-muted fw-bold mb-0">Sin datos de demanda</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row g-4 mb-5">
                        <div className="col-12 col-lg-8">
                            <div className={styles.chartCard}>
                                <div className={styles.tableHeader}>
                                    Rendimiento del Equipo Comercial
                                </div>
                                <div className="table-responsive rounded">
                                    <table className={`table table-hover align-middle mb-0 ${styles.noHoverTable}`}>
                                        <thead className="table-light">
                                            <tr>
                                                <th>Identificación de Vendedor</th>
                                                <th className="text-center">Propuestas Emitidas</th>
                                                <th className="text-center">Cierres Exitosos</th>
                                                <th className="text-center">Tasa Efectividad</th>
                                                <th className="text-end">Ingreso Aportado (Bs)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportes.dataVendedores.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="text-center text-muted py-4">Sin actividad registrada en el periodo seleccionado.</td>
                                                </tr>
                                            ) : (
                                                reportes.dataVendedores.map((v, index) => (
                                                    <tr key={index}>
                                                        <td><strong>{v.nombre}</strong> {index === 0 && <span className="ms-1" title="Líder en Ventas">★</span>}</td>
                                                        <td className="text-center">{v.total}</td>
                                                        <td className="text-center text-success fw-bold">{v.aceptadas}</td>
                                                        <td className="text-center">
                                                            <span className={`badge ${v.tasaCierre >= 50 ? 'bg-success' : 'bg-warning text-dark'}`}>
                                                                {v.tasaCierre}%
                                                            </span>
                                                        </td>
                                                        <td className="text-end fw-bold text-primary">
                                                            {v.ingresos.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-lg-4">
                            <div className={styles.chartCard}>
                                <div className={`${styles.tableHeader} text-danger`}>
                                    Alerta de Inventario Crítico
                                </div>
                                <div className="card-body">
                                    {reportes.productosBajoStock.length > 0 ? (
                                        reportes.productosBajoStock.map(p => (
                                            <div className={styles.criticalStockItem} key={p.id_producto}>
                                                <div>
                                                    <strong className="text-dark d-block">{p.sku}</strong>
                                                    <span className="text-muted small">{p.nombre_producto}</span>
                                                </div>
                                                <span className="badge bg-warning text-dark px-2 py-1">Quedan {p.stock_total}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className={styles.emptyStateContainer}>
                                            <p className="text-muted fw-bold mb-0">Niveles de Inventario Estables</p>
                                            <small className="text-secondary">Sin alertas críticas reportadas.</small>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default HomePage;