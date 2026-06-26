// src/components/ModalIngresoStock.jsx
import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import styles from '../pages/ProductosPage.module.css'; // Usamos el CSS de ProductosPage para el Overlay

const ModalIngresoStock = ({ onClose, onSuccess }) => {
    const [sucursales, setSucursales] = useState([]);
    const [productos, setProductos] = useState([]);
    
    // Estado del formulario
    const [formData, setFormData] = useState({
        sucursal: '',
        producto: '',
        cantidad: '',
        referencia: ''
    });
    
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        cargarSelects();
    }, []);

    const cargarSelects = async () => {
        try {
            const [resSucursales, resProductos] = await Promise.all([
                axiosInstance.get('/sucursales/'),
                axiosInstance.get('/productos/')
            ]);
            setSucursales(resSucursales.data);
            setProductos(resProductos.data);
        } catch (error) {
            console.error("Error cargando catálogos para ingreso de stock:", error);
            alert("No se pudieron cargar los productos o sucursales.");
        }
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        
        if (!formData.sucursal || !formData.producto || !formData.cantidad) {
            alert("Por favor complete todos los campos obligatorios (*).");
            return;
        }

        setLoading(true);
        try {
            // Mandamos el POST al endpoint que creaste en Django para ingresos directos
            await axiosInstance.post('/stock/ingreso/', {
                sucursal: formData.sucursal,
                producto: formData.producto,
                cantidad: parseInt(formData.cantidad),
                referencia: formData.referencia || 'Ingreso manual por catálogo'
            });
            
            alert("Stock ingresado correctamente a la sucursal.");
            onSuccess(); // Recarga la tabla de atrás
            onClose();   // Cierra el modal
        } catch (error) {
            console.error(error);
            alert("Ocurrió un error al procesar el ingreso de stock.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            {/* Contenedor principal con max-height para scroll en celular */}
            <div className={`modal-dialog modal-dialog-centered modal-lg ${styles.solidModal}`} style={{ width: '100%', maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-content shadow-lg border-0 bg-white w-100">
                    
                    {/* ENCABEZADO DEL MODAL */}
                    <div className="modal-header bg-light border-bottom">
                        <div>
                            <h5 className="modal-title text-success fw-bold mb-0">📦 Ingreso Directo de Stock</h5>
                            <p className="text-muted small mb-0 mt-1">Registrar nueva mercancía en una sucursal específica.</p>
                        </div>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>

                    {/* CUERPO DEL FORMULARIO CON SCROLL RESPONSIVO */}
                    <div className={`modal-body p-4 bg-white ${styles.scrollableBody}`}>
                        <form onSubmit={handleGuardar} id="formIngresoStock">
                            
                            <div className="mb-3">
                                <label className="form-label fw-bold text-secondary small">Sucursal de Destino (*):</label>
                                <select 
                                    className="form-select bg-light text-dark"
                                    value={formData.sucursal}
                                    onChange={(e) => setFormData({...formData, sucursal: e.target.value})}
                                    required
                                >
                                    <option value="">-- Seleccione Sucursal --</option>
                                    {sucursales.map(s => (
                                        <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold text-secondary small">Producto a Ingresar (*):</label>
                                <select 
                                    className="form-select bg-light text-dark"
                                    value={formData.producto}
                                    onChange={(e) => setFormData({...formData, producto: e.target.value})}
                                    required
                                >
                                    <option value="">-- Seleccione Producto --</option>
                                    {productos.map(p => (
                                        <option key={p.id_producto} value={p.id_producto}>
                                            {p.sku} - {p.nombre_producto} (Stock Actual: {p.stock_total || 0})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="row">
                                <div className="col-12 col-md-6 mb-3">
                                    <label className="form-label fw-bold text-secondary small">Cantidad Ingresada (*):</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        className="form-control text-success fw-bold fs-5"
                                        value={formData.cantidad}
                                        onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                                        required
                                        placeholder="Ej: 50"
                                    />
                                </div>
                                <div className="col-12 col-md-6 mb-3">
                                    <label className="form-label fw-bold text-secondary small">Referencia / Motivo:</label>
                                    <input 
                                        type="text" 
                                        className="form-control"
                                        value={formData.referencia}
                                        onChange={(e) => setFormData({...formData, referencia: e.target.value})}
                                        placeholder="Ej: Compra a proveedor local"
                                    />
                                </div>
                            </div>

                        </form>
                    </div>

                    {/* PIE DEL MODAL */}
                    <div className="modal-footer bg-light border-top d-flex justify-content-end gap-2">
                        <button type="button" onClick={onClose} className="btn btn-secondary fw-bold px-4" disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" form="formIngresoStock" className="btn btn-success fw-bold px-4" disabled={loading}>
                            {loading ? 'Procesando...' : 'Confirmar Ingreso'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ModalIngresoStock;