// src/pages/ReportesPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { usePermisos } from '../hooks/usePermisos';

const ReportesPage = () => {
    const { esAdmin } = usePermisos();

    return (
        <div className="container-fluid py-4">
            <h1 className="h3 mb-4 text-gray-800 fw-bold">Centro de Reportes y Analítica</h1>
            <p className="text-muted mb-4">Selecciona el reporte que deseas generar o exportar.</p>

            <div className="row g-4">
                {/* 1. REPORTE DE STOCK (Para todos los usuarios permitidos) */}
                <div className="col-md-4">
                    <div className="card shadow-sm h-100 border-0 border-start border-danger border-4">
                        <div className="card-body text-center py-5">
                            <div className="display-4 mb-3 text-danger">📉</div>
                            <h5 className="card-title fw-bold">Stock Mínimo y Crítico</h5>
                            <p className="card-text text-muted small mb-4">
                                Visualiza los productos que están por agotarse o ya no tienen existencias en la distribuidora.
                            </p>
                            <Link to="/erp/reportes/analisis-stock" className="btn btn-outline-danger w-100">
                                Generar Reporte
                            </Link>
                        </div>
                    </div>
                </div>

                {/* 2. REPORTE DE INVENTARIO GENERAL */}
                <div className="col-md-4">
                    <div className="card shadow-sm h-100 border-0 border-start border-primary border-4">
                        <div className="card-body text-center py-5">
                            <div className="display-4 mb-3 text-primary">📦</div>
                            <h5 className="card-title fw-bold">Inventario Valorizado</h5>
                            <p className="card-text text-muted small mb-4">
                                Listado completo del catálogo actual, costos, precios y valor total de la mercancía almacenada.
                            </p>
                            <Link to="/erp/reportes/inventario" className="btn btn-outline-primary w-100">
                                Generar Reporte
                            </Link>
                        </div>
                    </div>
                </div>

                {/* 3. REPORTE DE VENTAS (Solo Administradores/Gerentes) */}
                {esAdmin && (
                    <div className="col-md-4">
                        <div className="card shadow-sm h-100 border-0 border-start border-success border-4">
                            <div className="card-body text-center py-5">
                                <div className="display-4 mb-3 text-success">💹</div>
                                <h5 className="card-title fw-bold">Desempeño Comercial</h5>
                                <p className="card-text text-muted small mb-4">
                                    Métricas avanzadas de cierres de venta, comisiones y efectividad por cada asesor de la empresa.
                                </p>
                                <Link to="/erp/reportes/ventas" className="btn btn-outline-success w-100">
                                    Generar Reporte
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportesPage;