// src/pages/ClientesPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Importación necesaria para la navegación programática
import axiosInstance from '../api/axiosInstance';
import { usePermisos } from '../hooks/usePermisos';
import styles from './ClientesPage.module.css';

const ClientesPage = () => {
    const navigate = useNavigate(); // Instancia del hook de enrutamiento
    const { puedeCrearClientes, puedeEliminarClientes } = usePermisos();
    
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');

    // Estados de control para el Modal de Registro/Edición
    const [modalAbierto, setModalAbierto] = useState(false);
    const [clienteEditando, setClienteEditando] = useState(null); // null implica modo creación; ID implica modo edición
    const [formData, setFormData] = useState({
        nombre_cliente: '',
        nit_ci: '',
        telefono: '',
        email: '',
        direccion: ''
    });

    // Carga inicial del directorio de clientes
    useEffect(() => {
        fetchClientes();
    }, []);

    const fetchClientes = async () => {
        try {
            const res = await axiosInstance.get('/clientes/');
            setClientes(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Excepción al cargar el directorio de clientes", error);
            setLoading(false);
        }
    };

    // Lógica de gestión de formularios y modales
    const abrirModalCrear = () => {
        setClienteEditando(null);
        setFormData({ nombre_cliente: '', nit_ci: '', telefono: '', email: '', direccion: '' });
        setModalAbierto(true);
    };

    const abrirModalEditar = (cliente) => {
        setClienteEditando(cliente.id_cliente);
        setFormData({
            nombre_cliente: cliente.nombre_cliente || '',
            nit_ci: cliente.nit_ci || '',
            telefono: cliente.telefono || '',
            email: cliente.email || '',
            direccion: cliente.direccion || ''
        });
        setModalAbierto(true);
    };

    const guardarCliente = async (e) => {
        e.preventDefault();
        try {
            if (clienteEditando) {
                // Petición de actualización (PUT)
                await axiosInstance.put(`/clientes/${clienteEditando}/`, formData);
                alert("Registro de cliente actualizado correctamente.");
            } else {
                // Petición de creación (POST)
                await axiosInstance.post('/clientes/', formData);
                alert("Nuevo cliente registrado con éxito en el sistema.");
            }
            setModalAbierto(false);
            fetchClientes();
        } catch (error) {
            alert("Error de validación o comunicación al guardar el cliente.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Confirma la eliminación lógica de este cliente del sistema?")) return;
        try {
            await axiosInstance.delete(`/clientes/${id}/`);
            alert("Registro de cliente eliminado exitosamente.");
            fetchClientes();
        } catch (error) {
            alert("Acción denegada: El cliente posee dependencias transaccionales (cotizaciones/ventas) activas.");
        }
    };

    // Aplicación de filtro local por búsqueda asíncrona en memoria
    const clientesFiltrados = clientes.filter(c => 
        (c.nombre_cliente?.toLowerCase() || '').includes(busqueda.toLowerCase()) || 
        (c.nit_ci?.toLowerCase() || '').includes(busqueda.toLowerCase())
    );

    if (loading) return <div className="text-center mt-5 text-muted">Procesando directorio de clientes...</div>;

    return (
        <div className="container-fluid py-4 bg-light min-vh-100">
            {/* Encabezado Principal */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h1 className="h3 mb-1 text-dark fw-bold">Directorio de Clientes</h1>
                    <p className="text-muted mb-0">Gestión consolidada de cartera y perfiles comerciales.</p>
                </div>
                
                {puedeCrearClientes && (
                    <button onClick={abrirModalCrear} className={`btn shadow-sm fw-bold ${styles.buttonPrimary}`}>
                        Nuevo Cliente
                    </button>
                )}
            </div>

            {/* Panel de Búsqueda Predictiva */}
            <div className="card shadow-sm border-0 mb-4">
                <div className="card-body bg-white rounded">
                    <div className="input-group">
                        <span className="input-group-text bg-light border-end-0 text-muted">Buscar</span>
                        <input 
                            type="text" 
                            className="form-control border-start-0" 
                            placeholder="Ingrese Nombre o NIT/CI para filtrar..." 
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Grilla de Datos de Clientes */}
            <div className="card shadow-sm border-0">
                <div className="table-responsive">
                    <table className={`table table-hover align-middle mb-0 ${styles.noHoverTable}`}>
                        <thead className="table-light">
                            <tr>
                                <th>NIT / CI</th>
                                <th>Nombre o Razón Social</th>
                                <th>Teléfono</th>
                                <th>Email</th>
                                <th>Dirección</th>
                                <th className="text-center">Acciones Operativas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientesFiltrados.map((cliente) => (
                                <tr key={cliente.id_cliente}>
                                    <td className="font-monospace text-secondary">{cliente.nit_ci || 'S/N'}</td>
                                    <td><strong className="text-dark">{cliente.nombre_cliente}</strong></td>
                                    <td>{cliente.telefono || '-'}</td>
                                    <td>{cliente.email || '-'}</td>
                                    <td>{cliente.direccion || '-'}</td>
                                    <td>
                                        <div className={styles.actionButtonsContainer}>
                                            
                                            {/* Acción de navegación al perfil consolidado */}
                                            <button 
                                                onClick={() => navigate(`/erp/clientes/perfil/${cliente.id_cliente}`)}
                                                className="btn btn-sm btn-outline-info fw-bold"
                                                title="Ver historial de compras y cotizaciones"
                                            >
                                                Ver Perfil
                                            </button>

                                            {/* Control de accesos para edición */}
                                            {puedeCrearClientes && (
                                                <button 
                                                    onClick={() => abrirModalEditar(cliente)}
                                                    className="btn btn-sm btn-outline-primary fw-bold"
                                                    title="Modificar datos del cliente"
                                                >
                                                    Editar
                                                </button>
                                            )}
                                            
                                            {/* Control de accesos para eliminación */}
                                            {puedeEliminarClientes && (
                                                <button 
                                                    onClick={() => handleDelete(cliente.id_cliente)}
                                                    className="btn btn-sm btn-outline-danger fw-bold"
                                                    title="Eliminación lógica de la base de datos"
                                                >
                                                    Eliminar
                                                </button>
                                            )}

                                            {!puedeCrearClientes && !puedeEliminarClientes && (
                                                <span className="badge bg-secondary">Solo Lectura</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {clientesFiltrados.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center py-5 text-muted">
                                        No se encontraron coincidencias en la base de datos.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Superpuesto para Registro y Modificación */}
            {modalAbierto && puedeCrearClientes && (
                <div className={styles.modalOverlay} onClick={() => setModalAbierto(false)}>
                    <div className={styles.modalContentSolid} onClick={e => e.stopPropagation()}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="m-0 fw-bold text-primary">
                                {clienteEditando ? 'Edición de Perfil' : 'Registro de Cliente'}
                            </h4>
                            <button type="button" className="btn-close" onClick={() => setModalAbierto(false)}></button>
                        </div>
                        
                        <form onSubmit={guardarCliente}>
                            <div className="mb-3">
                                <label className="form-label fw-bold text-secondary">Nombre o Razón Social (*)</label>
                                <input 
                                    required type="text" 
                                    className="form-control"
                                    value={formData.nombre_cliente} 
                                    onChange={e => setFormData({...formData, nombre_cliente: e.target.value})} 
                                />
                            </div>
                            
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-bold text-secondary">Documento (NIT / CI)</label>
                                    <input 
                                        type="text" 
                                        className="form-control"
                                        value={formData.nit_ci} 
                                        onChange={e => setFormData({...formData, nit_ci: e.target.value})} 
                                    />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-bold text-secondary">Teléfono de Contacto</label>
                                    <input 
                                        type="text" 
                                        className="form-control"
                                        value={formData.telefono} 
                                        onChange={e => setFormData({...formData, telefono: e.target.value})} 
                                    />
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold text-secondary">Correo Electrónico Corporativo</label>
                                <input 
                                    type="email" 
                                    className="form-control"
                                    value={formData.email} 
                                    onChange={e => setFormData({...formData, email: e.target.value})} 
                                />
                            </div>

                            <div className="mb-4">
                                <label className="form-label fw-bold text-secondary">Dirección Física Registrada</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    value={formData.direccion} 
                                    onChange={e => setFormData({...formData, direccion: e.target.value})} 
                                />
                            </div>
                            
                            <div className="d-flex justify-content-end gap-2 border-top pt-3">
                                <button type="button" onClick={() => setModalAbierto(false)} className="btn btn-secondary fw-bold">
                                    Descartar
                                </button>
                                <button type="submit" className="btn btn-success fw-bold">
                                    {clienteEditando ? 'Actualizar Información' : 'Confirmar Registro'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientesPage;