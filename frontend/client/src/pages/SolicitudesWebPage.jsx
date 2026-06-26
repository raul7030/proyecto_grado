// src/pages/SolicitudesWebPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import styles from './SolicitudesWebPage.module.css';

const SolicitudesWebPage = () => {
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarSolicitudes();
    }, []);

    const cargarSolicitudes = async () => {
        try {
            const res = await axiosInstance.get('/solicitudes-web/');
            setSolicitudes(res.data);
        } catch (error) {
            console.error("Error al cargar las solicitudes web", error);
        } finally {
            setLoading(false);
        }
    };

    const actualizarEstado = async (id, nuevoEstado) => {
        if (!window.confirm(`¿Confirmas el cambio de estado de esta solicitud a ${nuevoEstado}?`)) return;
        
        try {
            await axiosInstance.patch(`/solicitudes-web/${id}/`, { estado: nuevoEstado });
            cargarSolicitudes(); 
        } catch (error) {
            console.error(error);
            alert("Error de comunicacion al actualizar el estado del registro.");
        }
    };

    const getEstadoBadge = (estado) => {
        switch (estado?.toUpperCase()) {
            case 'PENDIENTE': return <span className="badge bg-warning text-dark px-3 py-2">PENDIENTE</span>;
            case 'ATENDIDA': return <span className="badge bg-success px-3 py-2">ATENDIDA</span>;
            case 'DESCARTADA': return <span className="badge bg-danger px-3 py-2">DESCARTADA</span>;
            default: return <span className="badge bg-secondary px-3 py-2">{estado}</span>;
        }
    };

    if (loading) return <p className="text-center mt-5 text-muted">Cargando bandeja de entrada...</p>;

    return (
        <div className={styles.pageContainer}>
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                <div>
                    <h1 className="h3 mb-1 text-dark fw-bold">Bandeja de Solicitudes Web</h1>
                    <p className="text-muted mb-0">Requerimientos de clientes desde el portal publico</p>
                </div>
            </div>

            <div className="table-responsive shadow-sm rounded border">
                <table className={`table align-middle mb-0 ${styles.noHoverTable}`}>
                    <thead className="table-light">
                        <tr>
                            <th>Fecha de Ingreso</th>
                            <th>Cliente Potencial</th>
                            <th>Datos de Contacto</th>
                            <th>Requerimiento Detallado</th>
                            <th className="text-center">Estado</th>
                            <th className="text-center">Acciones y Seguimiento</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {solicitudes.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center text-muted py-4">La bandeja de solicitudes esta vacia en este momento.</td>
                            </tr>
                        ) : (
                            solicitudes.map((sol) => {
                                // Buscamos el ID de la cotizacion en posibles formatos del backend
                                const idCotizacionGenerada = sol.cotizacion_id || sol.id_cotizacion || sol.cotizacion || '';

                                return (
                                    <tr key={sol.id_solicitud}>
                                        <td className="text-muted small font-monospace">
                                            {new Date(sol.fecha_solicitud).toLocaleString()}
                                        </td>
                                        <td className="fw-bold text-dark">
                                            {sol.nombre}
                                        </td>
                                        <td>
                                            <div className="fw-bold text-secondary">{sol.telefono}</div>
                                            {sol.email && <div className="text-muted small">{sol.email}</div>}
                                        </td>
                                        <td>
                                            <div className={styles.detalleText}>{sol.detalle}</div>
                                        </td>
                                        <td className="text-center">
                                            {getEstadoBadge(sol.estado)}
                                        </td>
                                        
                                        <td className="text-center">
                                            {sol.estado === 'PENDIENTE' && (
                                                <div className="d-flex justify-content-center gap-2">
                                                    <Link to={`/erp/cotizaciones/crear?solicitud=${sol.id_solicitud}`}>
                                                        <button className="btn btn-sm btn-primary fw-bold shadow-sm" title="Generar Cotizacion a partir de esta solicitud">
                                                            Cotizar
                                                        </button>
                                                    </Link>
                                                    <button 
                                                        onClick={() => actualizarEstado(sol.id_solicitud, 'DESCARTADA')}
                                                        className="btn btn-sm btn-outline-danger fw-bold shadow-sm"
                                                        title="Descartar y archivar solicitud"
                                                    >
                                                        Descartar
                                                    </button>
                                                </div>
                                            )}

                                            {sol.estado === 'ATENDIDA' && (
                                                <Link to={idCotizacionGenerada ? `/erp/cotizaciones/${idCotizacionGenerada}` : '/erp/cotizaciones'}>
                                                    <button className="btn btn-sm btn-outline-success fw-bold shadow-sm">
                                                        Ver Cotizacion
                                                    </button>
                                                </Link>
                                            )}

                                            {sol.estado === 'DESCARTADA' && (
                                                <span className="badge bg-light text-danger border border-danger">Solicitud Archivada</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SolicitudesWebPage;