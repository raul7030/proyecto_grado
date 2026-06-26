// src/pages/ReportesAnalisisStockPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { usePermisos } from '../hooks/usePermisos';
import * as XLSX from 'xlsx';
import styles from './ReportesAnalisisStockPage.module.css';

const ReportesAnalisisStockPage = () => {
    const { esAdmin } = usePermisos();
    
    const [loading, setLoading] = useState(true);
    const [productosRaw, setProductosRaw] = useState([]);
    const [cotizacionesRaw, setCotizacionesRaw] = useState([]);
    const [datosReporte, setDatosReporte] = useState([]);
    
    const hoy = new Date().toISOString().split('T')[0];
    const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    
    const [fechaInicio, setFechaInicio] = useState(primerDiaMes);
    const [fechaFin, setFechaFin] = useState(hoy);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const [resProd, resCotiz] = await Promise.all([
                axiosInstance.get('/productos/'),
                axiosInstance.get('/cotizaciones/')
            ]);
            setProductosRaw(resProd.data);
            setCotizacionesRaw(resCotiz.data);
            setLoading(false);
        } catch (error) {
            console.error("Error cargando datos para análisis:", error);
            setLoading(false);
        }
    };

    const generarReporte = () => {
        if (!fechaInicio || !fechaFin) {
            alert("Por favor selecciona ambas fechas.");
            return;
        }

        const start = new Date(fechaInicio + 'T00:00:00');
        const end = new Date(fechaFin + 'T23:59:59');

        const ventasEnRango = cotizacionesRaw.filter(c => {
            if (c.estado?.toUpperCase() !== 'ACEPTADA') return false;
            const fechaCotiz = new Date(c.fecha_creacion);
            return fechaCotiz >= start && fechaCotiz <= end;
        });

        const reporteGenerado = productosRaw.map(prod => {
            let cantidadVendida = 0;
            
            ventasEnRango.forEach(cotiz => {
                const detalles = cotiz.detalles || cotiz.detallecotizacion_set || [];
                detalles.forEach(item => {
                    if (item.producto === prod.id_producto) {
                        cantidadVendida += parseInt(item.cantidad || 0);
                    }
                });
            });

            const stockFinal = parseInt(prod.stock_total || 0);
            const stockInicial = stockFinal + cantidadVendida;

            return {
                id: prod.id_producto,
                sku: prod.sku,
                nombre: prod.nombre_producto,
                categoria: prod.categoria_nombre || 'General',
                stockInicial: stockInicial,
                vendido: cantidadVendida,
                stockFinal: stockFinal
            };
        });

        reporteGenerado.sort((a, b) => b.vendido - a.vendido);
        setDatosReporte(reporteGenerado);
    };

    const handleImprimir = () => window.print();

    const handleExportarExcel = () => {
        const datosParaExcel = datosReporte.map(item => ({
            'Código SKU': item.sku,
            'Nombre del Producto': item.nombre,
            'Categoría': item.categoria,
            'Stock al Iniciar Periodo': item.stockInicial,
            'Salidas / Ventas': item.vendido,
            'Stock a la Fecha': item.stockFinal
        }));

        const worksheet = XLSX.utils.json_to_sheet(datosParaExcel);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Rotacion_Stock");
        XLSX.writeFile(workbook, `Analisis_Stock_${fechaInicio}_al_${fechaFin}.xlsx`);
    };

    if (!esAdmin) return <div className="text-center mt-5 text-danger fw-bold">🔒 Acceso denegado. Solo gerencia puede ver reportes analíticos de stock.</div>;
    if (loading) return <div className="text-center mt-5 text-muted">Cargando base de datos de inventario...</div>;

    return (
        <div className="container-fluid py-4 bg-light min-vh-100">
            
            {/* ZONA DE NO IMPRESIÓN (Controles y Filtros) */}
            <div className="noPrint">
                
                {/* ENCABEZADO RESPONSIVO */}
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                    <div>
                        <h1 className="h3 mb-1 text-dark fw-bold">📊 Análisis de Rotación de Stock</h1>
                        <p className="text-muted mb-0">Calcula la rotación de inventario en un periodo específico.</p>
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                        <Link to="/erp/reportes" className="btn btn-outline-secondary fw-bold shadow-sm">
                            🏠 Volver a Reportes
                        </Link>
                        
                        <button 
                            onClick={handleExportarExcel} 
                            className="btn btn-success fw-bold shadow-sm" 
                            disabled={datosReporte.length === 0}
                        >
                            📊 Descargar Excel
                        </button>

                        <button 
                            onClick={handleImprimir} 
                            className="btn btn-secondary fw-bold shadow-sm" 
                            disabled={datosReporte.length === 0}
                        >
                            🖨️ Imprimir / PDF
                        </button>
                    </div>
                </div>

                {/* FILTROS RESPONSIVOS (Cards) */}
                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-body bg-white rounded">
                        <div className="row g-3 align-items-end">
                            <div className="col-12 col-md-4 col-lg-3">
                                <label className="form-label fw-bold text-secondary small">📅 Fecha de Inicio:</label>
                                <input 
                                    type="date" 
                                    className="form-control bg-light" 
                                    value={fechaInicio} 
                                    onChange={(e) => setFechaInicio(e.target.value)} 
                                />
                            </div>
                            <div className="col-12 col-md-4 col-lg-3">
                                <label className="form-label fw-bold text-secondary small">📅 Fecha de Fin (Corte):</label>
                                <input 
                                    type="date" 
                                    className="form-control bg-light" 
                                    value={fechaFin} 
                                    onChange={(e) => setFechaFin(e.target.value)} 
                                />
                            </div>
                            <div className="col-12 col-md-4 col-lg-3">
                                <button onClick={generarReporte} className="btn btn-primary fw-bold w-100 h-100">
                                    ⚙️ Generar Análisis
                                </button>
                            </div>
                            
                            <div className="col-12 mt-3">
                                <div className="alert alert-info py-2 px-3 mb-0 small">
                                    ℹ️ <strong>Nota contable:</strong> El "Stock Inicial" se calcula matemáticamente sumando el stock actual + las ventas del periodo. No contempla ingresos de nueva mercadería que hayan ocurrido en ese mismo lapso.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ZONA DE IMPRESIÓN Y RESULTADOS */}
            {datosReporte.length > 0 ? (
                <div className={`${styles.printArea} card shadow-sm border-0`}>
                    
                    <div className={styles.printHeader}>
                        <h2>ANÁLISIS DE ROTACIÓN DE STOCK</h2>
                        <p><strong>Periodo analizado:</strong> {new Date(fechaInicio + 'T00:00:00').toLocaleDateString()} al {new Date(fechaFin + 'T00:00:00').toLocaleDateString()}</p>
                        <small>Generado el: {new Date().toLocaleString()}</small>
                        <hr />
                    </div>

                    <div className="table-responsive">
                        <table className={`table table-hover align-middle mb-0 ${styles.noHoverTable} ${styles.printTable}`}>
                            <thead className="table-light">
                                <tr>
                                    <th className={styles.colSku}>SKU</th>
                                    <th>Producto y Categoría</th>
                                    <th className="text-center">Stock al Iniciar</th>
                                    <th className="text-center">Vendido (Salidas)</th>
                                    <th className="text-center">Stock a la Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datosReporte.map((item) => {
                                    const claseVentaColor = item.vendido > 0 ? styles.cellVendidoRojo : styles.cellVendidoGris;
                                    
                                    return (
                                        <tr key={item.id}>
                                            <td className={styles.colSku}>{item.sku}</td>
                                            <td>
                                                <strong className="text-dark">{item.nombre}</strong> <br/>
                                                <span className={styles.catText}>{item.categoria}</span>
                                            </td>
                                            <td className={`text-center fs-5 ${styles.cellInicial}`}>
                                                {item.stockInicial}
                                            </td>
                                            <td className={`text-center fs-5 ${styles.cellVendido} ${claseVentaColor}`}>
                                                {item.vendido > 0 ? `- ${item.vendido}` : '0'}
                                            </td>
                                            <td className={`text-center fs-5 ${styles.cellFinal}`}>
                                                {item.stockFinal}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-5 noPrint">
                    <div className="display-4 text-muted mb-3 opacity-50">📅</div>
                    <h5 className="text-muted fw-bold">Esperando parámetros</h5>
                    <p className="text-muted">Selecciona un rango de fechas y presiona "Generar Análisis" para visualizar el reporte.</p>
                </div>
            )}
        </div>
    );
};

export default ReportesAnalisisStockPage;