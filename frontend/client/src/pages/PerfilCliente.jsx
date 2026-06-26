// src/pages/PerfilCliente.jsx
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { obtenerDetalleCliente, obtenerHistorialCotizaciones, obtenerHistorialCompras } from '../api/clientes';
import styles from './PerfilCliente.module.css';

const PerfilCliente = () => {
    const { idCliente } = useParams();
    const navigate = useNavigate();

    const [cliente, setCliente] = useState(null);
    const [cotizaciones, setCotizaciones] = useState([]);
    const [compras, setCompras] = useState([]);
    
    const [cargando, setCargando] = useState(true);
    const [pestanaActiva, setPestanaActiva] = useState('cotizaciones');

    useEffect(() => {
        if (idCliente) {
            cargarDatosConsolidados();
        }
    }, [idCliente]);

    const cargarDatosConsolidados = async () => {
        setCargando(true);
        try {
            const [dataCliente, dataCotizaciones, dataCompras] = await Promise.all([
                obtenerDetalleCliente(idCliente),
                obtenerHistorialCotizaciones(idCliente),
                obtenerHistorialCompras(idCliente)
            ]);

            setCliente(dataCliente);
            setCotizaciones(dataCotizaciones);
            setCompras(dataCompras);
        } catch (error) {
            console.error("Excepción al obtener el historial consolidado del cliente.", error);
            alert("Error al cargar la información del cliente. Verifique su conexión.");
        } finally {
            setCargando(false);
        }
    };

    const kpis = useMemo(() => {
        if (!cliente) return null;

        const fechaUltimaCompra = compras.length > 0 && compras[0].fecha_emision
            ? new Date(compras[0].fecha_emision).toLocaleDateString() 
            : 'Sin registros';

        const estadoUltimaCotizacion = cotizaciones.length > 0 
            ? cotizaciones[0].estado 
            : 'Sin registros';

        return { fechaUltimaCompra, estadoUltimaCotizacion };
    }, [cliente, compras, cotizaciones]);


    if (cargando) {
        return (
            <div className="container p-5 text-center">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-muted mt-3">Cargando perfil consolidado...</p>
            </div>
        );
    }

    if (!cliente) {
        return <div className="container p-5 text-center text-danger">Registro de cliente no encontrado.</div>;
    }

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="h3 mb-1 fw-bold text-dark">{cliente.nombre_cliente || cliente.razon_social}</h2>
                    <p className="text-muted mb-0">NIT/CI: {cliente.nit_ci || cliente.documento_identidad} | Contacto: {cliente.telefono}</p>
                </div>
                <button onClick={() => navigate('/erp/clientes')} className="btn btn-outline-secondary">
                    Volver al Directorio
                </button>
            </div>

            <div className="row mb-4">
                <div className="col-md-6 mb-3">
                    <div className="card border-0 shadow-sm bg-light">
                        <div className="card-body">
                            <h6 className="text-muted fw-bold text-uppercase mb-1">Última Compra Realizada</h6>
                            <h4 className="fw-bold mb-0 text-primary">{kpis.fechaUltimaCompra}</h4>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 mb-3">
                    <div className="card border-0 shadow-sm bg-light">
                        <div className="card-body">
                            <h6 className="text-muted fw-bold text-uppercase mb-1">Estado Última Cotización</h6>
                            <h4 className="fw-bold mb-0 text-primary">{kpis.estadoUltimaCotizacion}</h4>
                        </div>
                    </div>
                </div>
            </div>

            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button 
                        className={`nav-link fw-bold ${pestanaActiva === 'cotizaciones' ? 'active text-primary' : 'text-secondary'}`}
                        onClick={() => setPestanaActiva('cotizaciones')}
                    >
                        Historial de Cotizaciones ({cotizaciones.length})
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link fw-bold ${pestanaActiva === 'compras' ? 'active text-primary' : 'text-secondary'}`}
                        onClick={() => setPestanaActiva('compras')}
                    >
                        Compras Históricas ({compras.length})
                    </button>
                </li>
            </ul>

            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    
                    {pestanaActiva === 'cotizaciones' && (
                        <div className="table-responsive">
                            <table className={`table table-hover align-middle mb-0 ${styles.noHoverTable}`}>
                                <thead className="table-light">
                                    <tr>
                                        <th className="ps-4">Código Proforma</th>
                                        <th>Fecha Emisión</th>
                                        <th>Validez</th>
                                        <th>Monto Total</th>
                                        <th>Estado</th>
                                        <th className="text-center pe-4">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cotizaciones.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center py-4 text-muted">No existen cotizaciones emitidas para este cliente.</td></tr>
                                    ) : (
                                        cotizaciones.map((cot) => (
                                            <tr key={cot.id_cotizacion}>
                                                <td className="ps-4 fw-bold">{cot.codigo_cotizacion || 'S/N'}</td>
                                                <td>{cot.fecha_creacion ? new Date(cot.fecha_creacion).toLocaleDateString() : '-'}</td>
                                                <td className="text-muted">{cot.fecha_validez ? new Date(cot.fecha_validez).toLocaleDateString() : '-'}</td>
                                                <td className="fw-bold">Bs. {cot.total || '0.00'}</td>
                                                <td>
                                                    <span className={`badge 
                                                        ${cot.estado === 'ACEPTADA' ? 'bg-success' : ''}
                                                        ${cot.estado === 'EMITIDA' ? 'bg-warning text-dark' : ''}
                                                        ${cot.estado === 'ANULADA' ? 'bg-danger' : ''}
                                                        ${!['ACEPTADA', 'EMITIDA', 'ANULADA'].includes(cot.estado) ? 'bg-secondary' : ''}
                                                    `}>
                                                        {cot.estado || 'PENDIENTE'}
                                                    </span>
                                                </td>
                                                <td className="text-center pe-4">
                                                    <button 
                                                        onClick={() => navigate(`/erp/cotizaciones/${cot.id_cotizacion}`)}
                                                        className="btn btn-sm btn-outline-primary fw-bold"
                                                    >
                                                        Ver Detalle
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {pestanaActiva === 'compras' && (
                        <div className="table-responsive">
                            <table className={`table table-hover align-middle mb-0 ${styles.noHoverTable}`}>
                                <thead className="table-light">
                                    <tr>
                                        <th className="ps-4">Nro. Transacción</th>
                                        <th>Fecha de Compra</th>
                                        <th>Método de Pago</th>
                                        <th>Total Facturado</th>
                                        <th className="text-center pe-4">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {compras.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center py-4 text-muted">No existen compras registradas para este cliente.</td></tr>
                                    ) : (
                                        compras.map((compra) => (
                                            <tr key={compra.id_venta}>
                                                <td className="ps-4 fw-bold">{compra.codigo_transaccion || 'S/N'}</td>
                                                <td>{compra.fecha_emision ? new Date(compra.fecha_emision).toLocaleDateString() : '-'}</td>
                                                <td>{compra.metodo_pago}</td>
                                                <td className="fw-bold text-success">{compra.moneda} {compra.total_pagado || '0.00'}</td>
                                                <td className="text-center pe-4">
                                                    <button 
                                                        onClick={() => navigate(`/erp/cotizaciones/${compra.id_venta}`)}
                                                        className="btn btn-sm btn-outline-primary fw-bold"
                                                    >
                                                        Ver Comprobante
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default PerfilCliente;