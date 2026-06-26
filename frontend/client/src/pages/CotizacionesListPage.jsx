// src/pages/CotizacionesListPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import styles from './CotizacionesListPage.module.css';

const CotizacionesListPage = () => {
    const [cotizaciones, setCotizaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estados de filtrado
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('TODOS');

    // Carga de datos inicial
    useEffect(() => {
        const fetchCotizaciones = async () => {
            try {
                const response = await axiosInstance.get('/cotizaciones/');
                setCotizaciones(response.data);
            } catch (err) {
                console.error("Error fetching cotizaciones:", err);
                alert("Error al cargar el registro de cotizaciones.");
            } finally {
                setLoading(false);
            }
        };
        fetchCotizaciones();
    }, []);

    // Renderizado de etiquetas de estado
    const getEstadoBadge = (estado) => {
        const est = estado?.toUpperCase() || '';
        if (est === 'ACEPTADA') return <span className="badge bg-success">ACEPTADA</span>;
        if (est === 'PENDIENTE') return <span className="badge bg-warning text-dark">PENDIENTE</span>;
        if (est === 'RECHAZADA' || est === 'VENCIDA') return <span className="badge bg-danger">{est}</span>;
        return <span className="badge bg-secondary">{estado}</span>;
    };

    // Logica combinada de busqueda y filtro por estado
    const cotizacionesFiltradas = cotizaciones.filter(c => {
        const matchTexto = (c.codigo_cotizacion?.toLowerCase() || '').includes(busqueda.toLowerCase()) ||
                           (c.cliente_nombre?.toLowerCase() || '').includes(busqueda.toLowerCase());
        
        const est = c.estado?.toUpperCase() || '';
        const matchEstado = filtroEstado === 'TODOS' || est === filtroEstado;

        return matchTexto && matchEstado;
    });

    if (loading) return <p className="text-center mt-5 text-muted">Cargando registro de cotizaciones...</p>;

    return (
        <div className={styles.pageContainer}>
            <div className="d-flex justify-content-between align-items-center flex-wrap mb-4">
                <div>
                    <h1 className="h3 mb-1 text-dark">Registro de Cotizaciones a Clientes</h1>
                    <p className="text-muted mb-0">Historial de cotizaciones y ventas procesadas</p>
                </div>
                <Link to="/erp/cotizaciones/crear" className="mt-3 mt-md-0">
                    <button className={`btn shadow-sm fw-bold ${styles.colorPrimary}`}>
                        + Nueva Cotizacion
                    </button>
                </Link>
            </div>

            {/* Controles de Filtro */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-md-8">
                    <input 
                        type="text" 
                        placeholder="Buscar por Codigo o Cliente..." 
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
                        <option value="ACEPTADA">Aceptada</option>
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="RECHAZADA">Rechazada</option>
                        <option value="VENCIDA">Vencida</option>
                    </select>
                </div>
            </div>

            {/* Tabla de Resultados */}
            <div className="table-responsive shadow-sm rounded border">
                <table className={`table align-middle mb-0 ${styles.noHoverTable}`}>
                    <thead>
                        <tr>
                            <th>Codigo</th>
                            <th>Cliente</th>
                            <th>Vendedor</th>
                            <th>Fecha Emision</th>
                            <th>Validez</th>
                            <th className={styles.textRight}>Total (Bs.)</th>
                            <th className={styles.textCenter}>Estado</th>
                            <th className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {cotizacionesFiltradas.map(c => (
                            <tr key={c.id_cotizacion}>
                                <td className="font-monospace text-primary fw-bold">{c.codigo_cotizacion}</td>
                                <td className="fw-bold text-dark">{c.cliente_nombre}</td>
                                <td>{c.vendedor_nombre}</td>
                                <td>{new Date(c.fecha_creacion).toLocaleDateString()}</td>
                                <td className="text-muted">{new Date(c.fecha_validez).toLocaleDateString()}</td>
                                
                                <td className={styles.totalCell}>
                                    {parseFloat(c.total).toFixed(2)}
                                </td>
                                
                                <td className={styles.textCenter}>
                                    {getEstadoBadge(c.estado)}
                                </td>
                                
                                <td className="text-center">
                                    <Link to={`/erp/cotizaciones/${c.id_cotizacion}`}>
                                        <button 
                                            className="btn btn-sm btn-outline-secondary fw-bold" 
                                            title="Ver Detalles"
                                        >
                                            Detalles
                                        </button>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {cotizacionesFiltradas.length === 0 && (
                            <tr>
                                <td colSpan="8" className="text-center text-muted py-4">No se encontraron cotizaciones registradas.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CotizacionesListPage;