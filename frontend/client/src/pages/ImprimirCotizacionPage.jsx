// src/pages/ImprimirCotizacionPage.jsx
import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import AuthContext from '../context/AuthContext';
import styles from './ImprimirCotizacionPage.module.css';

const ImprimirCotizacionPage = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const { user } = useContext(AuthContext); // Obtenemos al usuario activo
    const [cotizacion, setCotizacion] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCotizacion = async () => {
            try {
                const response = await axiosInstance.get(`/cotizaciones/${id}/`);
                setCotizacion(response.data);
            } catch (error) {
                console.error("Error al cargar la cotización para impresión", error);
                alert("No se pudo cargar el documento.");
            } finally {
                setLoading(false);
            }
        };

        fetchCotizacion();
    }, [id]);

    const handleImprimir = () => {
        window.print();
    };

    if (loading) return <div className="text-center mt-5">Cargando documento...</div>;
    if (!cotizacion) return <div className="text-center mt-5">Documento no encontrado.</div>;

    return (
        <div className={styles.hojaImpresion}>
            
            <div className={styles.noPrint}>
                <button onClick={handleImprimir} className="btn btn-primary me-2 fw-bold">
                    🖨️ Imprimir Documento
                </button>
                <button onClick={() => navigate(-1)} className="btn btn-outline-secondary fw-bold">
                    Volver
                </button>
            </div>

            <div className={styles.encabezado}>
                <div className={styles.seccionLogo}>
                    <img 
                        src="/images/LOGO SAN RAFAEL.jpg" 
                        alt="Logo San Rafael" 
                        className={styles.imgLogo} 
                    />
                    <div className={styles.infoEmpresa}>
                        <h2 className={styles.tituloEmpresa}>Distribuidora San Rafael Ltda.</h2>
                        <p className={styles.subtituloEmpresa}>Venta al por mayor y menor</p>
                    </div>
                </div>

                <div className={styles.datosDocumento}>
                    <h3 className={styles.tipoDocumento}>COTIZACIÓN</h3>
                    <p><strong>Nro:</strong> {cotizacion.id_cotizacion}</p>
                    <p><strong>Fecha:</strong> {new Date(cotizacion.fecha_creacion).toLocaleDateString()}</p>
                    <p><strong>Válida hasta:</strong> {cotizacion.fecha_validez}</p>
                </div>
            </div>

            <hr className={styles.separador} />

            <div className={styles.datosCliente}>
                <p><strong>Señor(es):</strong> {cotizacion.cliente_nombre}</p>
            </div>

            <table className={styles.tablaDetalle}>
                <thead>
                    <tr>
                        <th className={styles.textCenter}>CANT.</th>
                        <th>DESCRIPCIÓN DEL PRODUCTO</th>
                        <th className={styles.textRight}>PRECIO UNIT.</th>
                        <th className={styles.textRight}>SUBTOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {cotizacion.detalles.map((item, index) => (
                        <tr key={index}>
                            <td className={styles.textCenter}>{item.cantidad}</td>
                            <td>{item.producto_nombre}</td>
                            <td className={styles.textRight}>Bs. {parseFloat(item.precio_unitario_cotizado).toFixed(2)}</td>
                            <td className={styles.textRight}>Bs. {(item.cantidad * item.precio_unitario_cotizado).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className={styles.totales}>
                {cotizacion.descuento > 0 && (
                    <p><strong>Descuento:</strong> Bs. {parseFloat(cotizacion.descuento).toFixed(2)}</p>
                )}
                <p className={styles.totalFinal}><strong>TOTAL:</strong> Bs. {parseFloat(cotizacion.total).toFixed(2)}</p>
            </div>

            <div className={styles.seccionCotizador}>
                <div className={styles.firmaCotizador}>
                    <div className={styles.lineaFirma}></div>
                    <p>
                        <strong>Cotizador:</strong>{' '}
                        {cotizacion.vendedor_nombre_completo || 
                         (user?.first_name ? `${user.first_name} ${user.last_name}`.trim() : user?.username) || 
                         'No registrado'}
                    </p>
                </div>
            </div>

            {/* Pie de página con la Sucursal Dinámica */}
            <div className={styles.pieDePagina}>
                <div className={styles.infoSucursal}>
                    <p>Sucursal: <strong> {cotizacion.sucursal_nombre || user?.sucursal_id || 'Principal'}</strong></p>
                    {/* AQUÍ AGREGAMOS LA DIRECCIÓN */}
                    <p>Dirección: <strong>{cotizacion.sucursal_direccion || 'Calle 25 de Mayo N°580'}</strong></p>
                </div>
                <p><small>Este documento no es válido como factura.</small></p>
            </div>
        </div>
    );
};

export default ImprimirCotizacionPage;