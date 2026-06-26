// src/pages/CrearCotizacionPage.jsx
import { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { usePermisos } from '../hooks/usePermisos';
import AuthContext from '../context/AuthContext';
import styles from './CrearCotizacionPage.module.css';

const CrearCotizacionPage = () => {
    const navigate = useNavigate();
    const { sucursalUsuario } = usePermisos(); 
    const { user } = useContext(AuthContext);

    const [clientes, setClientes] = useState([]);
    const [productos, setProductos] = useState([]); 
    const [loading, setLoading] = useState(true);
    
    // Búsqueda y Selección de Clientes
    const [busquedaCliente, setBusquedaCliente] = useState('');
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [mostrarDropdownCliente, setMostrarDropdownCliente] = useState(false);

    // Búsqueda y Selección de Productos
    const [busquedaProducto, setBusquedaProducto] = useState('');
    const [productoActual, setProductoActual] = useState(null);
    const [mostrarDropdownProducto, setMostrarDropdownProducto] = useState(false);
    
    // Variables operativas
    const [fechaValidez, setFechaValidez] = useState('');
    const [descuento, setDescuento] = useState(0);
    const [cantidad, setCantidad] = useState(1);
    const [stockDisponible, setStockDisponible] = useState(0);
    const [itemsCotizacion, setItemsCotizacion] = useState([]);

    const [searchParams] = useSearchParams();
    const solicitudWebId = searchParams.get('solicitud');

    useEffect(() => {
        const hoy = new Date();
        hoy.setDate(hoy.getDate() + 7);
        setFechaValidez(hoy.toISOString().split('T')[0]);

        cargarDatos();
    }, [sucursalUsuario]);

    const cargarDatos = async () => {
        try {
            const [resClientes, resProductos] = await Promise.all([
                axiosInstance.get('/clientes/'),
                axiosInstance.get('/productos/')
            ]);

            let stockLocal = [];
            if (sucursalUsuario) {
                const resStock = await axiosInstance.get(`/stock/?sucursal=${sucursalUsuario}`);
                stockLocal = resStock.data;
            }

            const productosConStock = resProductos.data.map(prod => {
                const stockItem = stockLocal.find(s => s.producto === prod.id_producto);
                return {
                    ...prod,
                    stock_local: stockItem ? stockItem.cantidad : 0
                };
            });

            setClientes(resClientes.data);
            setProductos(productosConStock);
        } catch (error) {
            console.error("Error cargando datos:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filtros dinámicos para los dropdowns
    const clientesFiltrados = clientes.filter(c => 
        c.nombre_cliente.toLowerCase().includes(busquedaCliente.toLowerCase())
    );

    const productosFiltrados = productos.filter(p => 
        p.nombre_producto.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
        p.sku.toLowerCase().includes(busquedaProducto.toLowerCase())
    );

    // Manejadores de Selección
    const seleccionarCliente = (cliente) => {
        setClienteSeleccionado(cliente.id_cliente);
        setBusquedaCliente(cliente.nombre_cliente);
        setMostrarDropdownCliente(false);
    };

    const seleccionarProducto = (prod) => {
        setProductoActual(prod.id_producto);
        setBusquedaProducto(`${prod.sku} - ${prod.nombre_producto}`);
        setStockDisponible(prod.stock_local || 0);
        setCantidad(1);
        setMostrarDropdownProducto(false);
    };

    // Agregar Item al Carrito
    const handleAddItem = (e) => {
        e.preventDefault();
        if (!productoActual || cantidad <= 0) return;

        if (cantidad > stockDisponible) {
            alert(`Stock insuficiente. Solo tienes ${stockDisponible} unidades físicamente en tu sucursal.`);
            return; 
        }

        const prod = productos.find(p => p.id_producto === parseInt(productoActual));
        const existe = itemsCotizacion.find(i => i.producto_id === prod.id_producto);
        
        if (existe) {
            alert("Este producto ya está en la lista. Quítalo y agrégalo de nuevo con la cantidad total.");
            return;
        }

        const newItem = {
            producto_id: prod.id_producto,
            sku: prod.sku,
            nombre: prod.nombre_producto,
            precio: parseFloat(prod.precio_base),
            cantidad: parseInt(cantidad),
            subtotal: parseFloat(prod.precio_base) * parseInt(cantidad)
        };

        setItemsCotizacion([...itemsCotizacion, newItem]);
        
        setProductoActual(null);
        setBusquedaProducto('');
        setCantidad(1);
        setStockDisponible(0);
    };

    const handleRemoveItem = (index) => {
        const newItems = [...itemsCotizacion];
        newItems.splice(index, 1);
        setItemsCotizacion(newItems);
    };

    // Cálculos Finales
    const subtotalGeneral = itemsCotizacion.reduce((acc, item) => acc + item.subtotal, 0);
    const totalFinal = subtotalGeneral - parseFloat(descuento || 0);

    const handleSubmit = async () => {
        if (!clienteSeleccionado || itemsCotizacion.length === 0) {
            alert("Selecciona un cliente y agrega al menos un producto.");
            return;
        }
        if (totalFinal < 0) {
            alert("El descuento no puede ser mayor al total de la venta.");
            return;
        }

        const payload = {
            cliente: clienteSeleccionado,
            usuario_vendedor: user.user_id, 
            sucursal: user.sucursal_id, 
            fecha_validez: fechaValidez || null,
            descuento: parseFloat(descuento) || 0,
            estado: 'Pendiente', 
            detalles: itemsCotizacion.map(item => ({
                producto: item.producto_id,
                cantidad: item.cantidad,
                precio_unitario_cotizado: item.precio
            })),
            solicitud_web_id: solicitudWebId ? parseInt(solicitudWebId) : null
        };

        try {
            await axiosInstance.post('/cotizaciones/', payload);
            alert("Cotización generada correctamente.");
            navigate('/erp/cotizaciones');
        } catch (error) {
            console.error("Error creando cotización:", error);
            alert("Error al procesar la solicitud.");
        }
    };

    // Cerrar dropdowns al hacer clic fuera (Lógica básica de Blur)
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest(`.${styles.autocompleteWrapper}`)) {
                setMostrarDropdownCliente(false);
                setMostrarDropdownProducto(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    if (loading) return <p className="text-center mt-5 text-muted">Preparando módulo de ventas...</p>;

    return (
        <div className={styles.pageContainer}>
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                <h1 className="h3 mb-0 text-dark fw-bold">Nueva Cotización / Venta</h1>
                <button onClick={() => navigate('/erp/cotizaciones')} className="btn btn-outline-secondary fw-bold shadow-sm">
                    Volver al Listado
                </button>
            </div>

            {solicitudWebId && (
                <div className="alert alert-info border-start border-4 border-info shadow-sm">
                    <strong>Modo Respuesta:</strong> Estás generando una cotización en base a la Solicitud Web #{solicitudWebId}. Al guardar, la solicitud se marcará automáticamente como "Atendida".
                </div>
            )}
            
            {/* SECCIÓN 1: DATOS CABECERA */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-4">
                    <div className="row g-4">
                        
                        <div className="col-12 col-md-6">
                            <label className="form-label fw-bold text-secondary">Buscar y Seleccionar Cliente (*):</label>
                            <div className={styles.autocompleteWrapper}>
                                <input 
                                    type="text" 
                                    className="form-control bg-light"
                                    placeholder="Escribe el nombre del cliente..."
                                    value={busquedaCliente}
                                    onChange={(e) => {
                                        setBusquedaCliente(e.target.value);
                                        setClienteSeleccionado(null);
                                        setMostrarDropdownCliente(true);
                                    }}
                                    onClick={() => setMostrarDropdownCliente(true)}
                                />
                                {mostrarDropdownCliente && (
                                    <ul className={styles.autocompleteDropdown}>
                                        {clientesFiltrados.length > 0 ? (
                                            clientesFiltrados.map(c => (
                                                <li key={c.id_cliente} className={styles.autocompleteItem} onClick={() => seleccionarCliente(c)}>
                                                    {c.nombre_cliente}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="p-3 text-muted text-center">No se encontraron clientes</li>
                                        )}
                                    </ul>
                                )}
                            </div>
                        </div>
                        
                        <div className="col-12 col-md-6">
                            <label className="form-label fw-bold text-secondary">Válida hasta:</label>
                            <input 
                                type="date" 
                                className="form-control bg-light"
                                value={fechaValidez} 
                                onChange={e => setFechaValidez(e.target.value)} 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: AGREGAR PRODUCTOS */}
            <div className="card border-0 shadow-sm mb-4 bg-light">
                <div className="card-body p-4">
                    <h5 className="card-title fw-bold text-dark mb-3">Agregar Productos al Carrito</h5>
                    <form onSubmit={handleAddItem}>
                        <div className="row g-3 align-items-end">
                            
                            <div className="col-12 col-md-8">
                                <label className="form-label fw-bold text-secondary">Buscar Producto por SKU o Nombre:</label>
                                <div className={styles.autocompleteWrapper}>
                                    <input 
                                        type="text" 
                                        className="form-control bg-white border"
                                        placeholder="Escribe para buscar..."
                                        value={busquedaProducto}
                                        onChange={(e) => {
                                            setBusquedaProducto(e.target.value);
                                            setProductoActual(null);
                                            setStockDisponible(0);
                                            setMostrarDropdownProducto(true);
                                        }}
                                        onClick={() => setMostrarDropdownProducto(true)}
                                    />
                                    {mostrarDropdownProducto && (
                                        <ul className={styles.autocompleteDropdown}>
                                            {productosFiltrados.length > 0 ? (
                                                productosFiltrados.map(p => (
                                                    <li 
                                                        key={p.id_producto} 
                                                        className={p.stock_local <= 0 ? styles.autocompleteItemDisabled : styles.autocompleteItem}
                                                        onClick={() => {
                                                            if (p.stock_local > 0) seleccionarProducto(p);
                                                        }}
                                                    >
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <span><strong>{p.sku}</strong> - {p.nombre_producto}</span>
                                                            <span className={`badge ${p.stock_local > 0 ? 'bg-success' : 'bg-danger'}`}>
                                                                Stock: {p.stock_local}
                                                            </span>
                                                        </div>
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="p-3 text-muted text-center">No se encontraron productos</li>
                                            )}
                                        </ul>
                                    )}
                                </div>
                                {productoActual && (
                                    <div className={`mt-2 fw-bold small ${stockDisponible > 0 ? 'text-success' : 'text-danger'}`}>
                                        {stockDisponible > 0 ? `Stock confirmado: ${stockDisponible} unidades físicas.` : `Producto agotado en sucursal.`}
                                    </div>
                                )}
                            </div>

                            <div className="col-6 col-md-2">
                                <label className="form-label fw-bold text-secondary">Cant:</label>
                                <input 
                                    type="number" min="1" 
                                    className="form-control bg-white text-center"
                                    value={cantidad} 
                                    onChange={e => setCantidad(e.target.value)} 
                                    required 
                                />
                            </div>

                            <div className="col-6 col-md-2">
                                <button type="submit" className="btn btn-primary w-100 fw-bold shadow-sm" disabled={!productoActual || stockDisponible <= 0}>
                                    Agregar
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* SECCIÓN 3: TABLA DE ÍTEMS */}
            <div className="table-responsive bg-white shadow-sm rounded border mb-4">
                <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                        <tr>
                            <th>SKU</th>
                            <th>Producto</th>
                            <th className="text-end">Precio Unit. (Bs)</th>
                            <th className="text-center">Cant.</th>
                            <th className="text-end">Subtotal (Bs)</th>
                            <th className="text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemsCotizacion.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center text-muted py-4">El carrito está vacío. Busca un producto y agrégalo.</td>
                            </tr>
                        ) : (
                            itemsCotizacion.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="font-monospace fw-bold text-primary">{item.sku}</td>
                                    <td className="fw-bold text-dark">{item.nombre}</td>
                                    <td className="text-end">{item.precio.toFixed(2)}</td>
                                    <td className="text-center fw-bold">{item.cantidad}</td>
                                    <td className="text-end fw-bold text-primary">
                                        {item.subtotal.toFixed(2)}
                                    </td>
                                    <td className="text-center">
                                        <button 
                                            onClick={() => handleRemoveItem(idx)} 
                                            className="btn btn-outline-danger btn-sm fw-bold"
                                            title="Eliminar ítem"
                                        >
                                            Quitar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* SECCIÓN 4: TOTALES Y GUARDAR */}
            <div className="row justify-content-end">
                <div className="col-12 col-md-6 col-lg-4">
                    <div className="card border-0 shadow-sm bg-white">
                        <div className="card-body p-4">
                            
                            <div className="d-flex justify-content-between mb-3 text-secondary">
                                <span className="fw-bold">Subtotal:</span>
                                <span>Bs. {subtotalGeneral.toFixed(2)}</span>
                            </div>
                            
                            <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                                <span className="fw-bold text-secondary">Descuento (Bs):</span>
                                <input 
                                    type="number" 
                                    className="form-control bg-light w-50 text-end"
                                    value={descuento} 
                                    onChange={e => setDescuento(e.target.value)} 
                                    min="0"
                                />
                            </div>
                            
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <span className="h4 mb-0 fw-bold text-dark">TOTAL:</span>
                                <span className="h4 mb-0 fw-bold text-success">Bs. {totalFinal.toFixed(2)}</span>
                            </div>
                            
                            <button 
                                onClick={handleSubmit} 
                                className="btn btn-success w-100 fw-bold py-2 shadow-sm"
                                disabled={itemsCotizacion.length === 0 || !clienteSeleccionado}
                            >
                                Generar Cotización
                            </button>
                            
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CrearCotizacionPage;