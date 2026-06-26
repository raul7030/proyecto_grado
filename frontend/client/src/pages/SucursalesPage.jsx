// src/pages/SucursalesPage.jsx
import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { usePermisos } from '../hooks/usePermisos';
import styles from './SucursalesPage.module.css';

const SucursalesPage = () => {
    const { esAdmin } = usePermisos();
    
    const [sucursales, setSucursales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');

    const [modalAbierto, setModalAbierto] = useState(false);
    const [sucursalEditando, setSucursalEditando] = useState(null); 
    
    const [formData, setFormData] = useState({
        nombre: '',
        direccion: '',
        telefono: ''
    });

    useEffect(() => {
        if (esAdmin) cargarDatos();
    }, [esAdmin]);

    const cargarDatos = async () => {
        try {
            const res = await axiosInstance.get('/sucursales/');
            setSucursales(res.data);
        } catch (error) {
            console.error("Error cargando datos", error);
        } finally {
            setLoading(false);
        }
    };

    const abrirModalCrear = () => {
        setSucursalEditando(null);
        setFormData({ nombre: '', direccion: '', telefono: '' });
        setModalAbierto(true);
    };

    const abrirModalEditar = (sucursal) => {
        // Se asegura de tomar el ID correcto dependiendo de la estructura del backend
        const id = sucursal.id_sucursal || sucursal.id;
        setSucursalEditando(id);
        setFormData({
            nombre: sucursal.nombre || '',
            direccion: sucursal.direccion || '',
            telefono: sucursal.telefono || ''
        });
        setModalAbierto(true);
    };

    const guardarSucursal = async (e) => {
        e.preventDefault();
        try {
            if (sucursalEditando) {
                await axiosInstance.put(`/sucursales/${sucursalEditando}/`, formData);
            } else {
                await axiosInstance.post('/sucursales/', formData);
            }
            setModalAbierto(false);
            cargarDatos();
        } catch (error) {
            console.error(error);
            alert("Error al guardar la información de la sucursal.");
        }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("¿Seguro que deseas eliminar esta sucursal? Asegúrate de que no tenga usuarios o inventario asociado.")) return;
        try {
            await axiosInstance.delete(`/sucursales/${id}/`);
            setSucursales(sucursales.filter(s => (s.id_sucursal || s.id) !== id));
        } catch (error) {
            alert("Error al eliminar. La sucursal podría tener registros dependientes.");
        }
    };

    const sucursalesFiltradas = sucursales.filter(s => 
        (s.nombre?.toLowerCase() || '').includes(busqueda.toLowerCase())
    );

    if (!esAdmin) return <p className="text-center mt-5">No tienes permisos para ver esta página.</p>;
    if (loading) return <p className="text-center mt-5 text-muted">Cargando red de sucursales...</p>;

    return (
        <div className={styles.pageContainer}>
            <div className="d-flex justify-content-between align-items-center flex-wrap mb-4">
                <div>
                    <h1 className="h3 mb-1 text-dark">Red de Sucursales</h1>
                    <p className="text-muted mb-0">Gestión de puntos de venta y almacenes</p>
                </div>
                <button onClick={abrirModalCrear} className={`btn fw-bold shadow-sm mt-3 mt-md-0 ${styles.buttonPrimary}`}>
                    + Nueva Sucursal
                </button>
            </div>

            <div className="mb-4">
                <input 
                    type="text" 
                    placeholder="🔍 Buscar por nombre de sucursal..." 
                    className="form-control shadow-sm"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </div>

            <div className="table-responsive shadow-sm rounded border">
                <table className={`table align-middle ${styles.noHoverTable} mb-0`}>
                    <thead>
                        <tr>
                            <th className="text-center">ID</th>
                            <th>Nombre</th>
                            <th>Dirección</th>
                            <th>Teléfono</th>
                            <th className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {sucursalesFiltradas.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center py-4 text-muted">No se encontraron sucursales.</td>
                            </tr>
                        ) : (
                            sucursalesFiltradas.map((s, index) => {
                                const id = s.id_sucursal || s.id;
                                return (
                                    <tr key={id}>
                                        <td className="text-center text-muted fw-bold">#{index + 1}</td>
                                        <td className="fw-bold text-dark">{s.nombre}</td>
                                        <td>{s.direccion || '-'}</td>
                                        <td>{s.telefono || '-'}</td>
                                        <td>
                                            <div className={styles.actionButtonsContainer}>
                                                <button 
                                                    onClick={() => abrirModalEditar(s)} 
                                                    className="btn btn-sm btn-outline-secondary fw-bold"
                                                >
                                                    Editar
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(id)} 
                                                    className="btn btn-sm btn-outline-danger fw-bold"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL BLINDADO */}
            {modalAbierto && (
                <div className={styles.modalOverlay}>
                    <div className={`modal-dialog modal-dialog-centered ${styles.solidModal}`}>
                        <div className="modal-content shadow-lg border-0 bg-white w-100">
                            
                            <div className="modal-header bg-light border-bottom">
                                <h5 className="modal-title text-dark fw-bold">
                                    {sucursalEditando ? 'Editar Sucursal' : 'Registrar Nueva Sucursal'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setModalAbierto(false)}></button>
                            </div>
                            
                            <div className="modal-body bg-white p-4">
                                <form onSubmit={guardarSucursal}>
                                    
                                    <div className="mb-3">
                                        <label className="form-label fw-bold text-secondary small">Nombre de la Sucursal (*):</label>
                                        <input 
                                            required 
                                            type="text" 
                                            className="form-control bg-light text-dark"
                                            placeholder="Ej: Sucursal Centro, Bodega Norte..."
                                            value={formData.nombre} 
                                            onChange={e => setFormData({...formData, nombre: e.target.value})} 
                                        />
                                    </div>
                                    
                                    <div className="mb-3">
                                        <label className="form-label fw-bold text-secondary small">Dirección:</label>
                                        <input 
                                            type="text" 
                                            className="form-control bg-light text-dark"
                                            value={formData.direccion} 
                                            onChange={e => setFormData({...formData, direccion: e.target.value})} 
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label fw-bold text-secondary small">Teléfono de Contacto:</label>
                                        <input 
                                            type="text" 
                                            className="form-control bg-light text-dark"
                                            placeholder="Ej: +591 70000000"
                                            value={formData.telefono} 
                                            onChange={e => setFormData({...formData, telefono: e.target.value})} 
                                        />
                                    </div>

                                    <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                                        <button type="button" onClick={() => setModalAbierto(false)} className="btn btn-secondary fw-bold px-4">
                                            Cancelar
                                        </button>
                                        <button type="submit" className="btn btn-success fw-bold px-4">
                                            {sucursalEditando ? 'Guardar Cambios' : 'Registrar Sucursal'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SucursalesPage;