// src/pages/CategoriasPage.jsx
import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { usePermisos } from '../hooks/usePermisos';
import styles from './CategoriasPage.module.css';

const CategoriasPage = () => {
    const { puedeGestionarCatalogo } = usePermisos();
    
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');

    const [modalAbierto, setModalAbierto] = useState(false);
    const [categoriaEditando, setCategoriaEditando] = useState(null); 
    const [formData, setFormData] = useState({
        nombre_categoria: '',
        descripcion: ''
    });

    useEffect(() => {
        fetchCategorias();
    }, []);

    const fetchCategorias = async () => {
        try {
            const res = await axiosInstance.get('/categorias/');
            setCategorias(res.data);
        } catch (error) {
            console.error("Error al obtener categorias:", error);
        } finally {
            setLoading(false);
        }
    };

    const abrirModalCrear = () => {
        setCategoriaEditando(null);
        setFormData({ nombre_categoria: '', descripcion: '' });
        setModalAbierto(true);
    };

    const abrirModalEditar = (cat) => {
        setCategoriaEditando(cat.id_categoria);
        setFormData({
            nombre_categoria: cat.nombre_categoria || '',
            descripcion: cat.descripcion || ''
        });
        setModalAbierto(true);
    };

    const guardarCategoria = async (e) => {
        e.preventDefault();
        try {
            if (categoriaEditando) {
                await axiosInstance.put(`/categorias/${categoriaEditando}/`, formData);
                alert("Categoria actualizada correctamente");
            } else {
                await axiosInstance.post('/categorias/', formData);
                alert("Categoria registrada correctamente");
            }
            setModalAbierto(false);
            fetchCategorias();
        } catch (error) {
            alert("Error al procesar la solicitud. Verifique que el nombre no este duplicado.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Desea eliminar esta categoria definitivamente?')) return;
        
        try {
            await axiosInstance.delete(`/categorias/${id}/`);
            alert("Registro eliminado");
            fetchCategorias();
        } catch (error) {
            alert("Restriccion de integridad: No se puede eliminar una categoria con productos asociados.");
        }
    };

    const categoriasFiltradas = categorias.filter(c => 
        (c.nombre_categoria?.toLowerCase() || '').includes(busqueda.toLowerCase())
    );

    if (loading) return <p className="text-center mt-5 text-muted">Cargando catalogo de categorias...</p>;

    return (
        <div className={styles.pageContainer}>
            <div className="d-flex justify-content-between align-items-center flex-wrap mb-4">
                <div>
                    <h1 className="h3 mb-1 text-dark">Gestion de Categorias</h1>
                    <p className="text-muted mb-0">Organizacion del catalogo de productos</p>
                </div>
                
                {puedeGestionarCatalogo && (
                    <button 
                        onClick={abrirModalCrear} 
                        className={`btn fw-bold shadow-sm mt-3 mt-md-0 ${styles.buttonPrimary}`}
                    >
                        + Nueva Categoria
                    </button>
                )}
            </div>

            <div className="mb-4">
                <input 
                    type="text" 
                    placeholder="Buscar categoria por nombre..." 
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
                            <th>Nombre de Categoria</th>
                            <th>Descripcion</th>
                            <th className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {categoriasFiltradas.map((cat) => (
                            <tr key={cat.id_categoria}>
                                <td className="text-center text-muted fw-bold">#{cat.id_categoria}</td>
                                <td className="fw-bold text-dark">{cat.nombre_categoria}</td>
                                <td className="text-muted">
                                    {cat.descripcion || <span className="fst-italic">Sin descripcion asignada</span>}
                                </td>
                                <td>
                                    <div className={styles.actionButtonsContainer}>
                                        {puedeGestionarCatalogo ? (
                                            <>
                                                <button 
                                                    className="btn btn-sm btn-outline-secondary fw-bold"
                                                    onClick={() => abrirModalEditar(cat)}
                                                >
                                                    Editar
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-outline-danger fw-bold"
                                                    onClick={() => handleDelete(cat.id_categoria)}
                                                >
                                                    Eliminar
                                                </button>
                                            </>
                                        ) : (
                                            <span className="badge bg-light text-secondary border">Solo Lectura</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {categoriasFiltradas.length === 0 && (
                            <tr>
                                <td colSpan="4" className="text-center py-4 text-muted">No se encontraron registros coincidentes.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de Registro / Edicion */}
            {modalAbierto && puedeGestionarCatalogo && (
                <div className={styles.modalOverlay}>
                    <div className={`modal-dialog modal-dialog-centered ${styles.solidModal}`}>
                        <div className="modal-content shadow-lg border-0 bg-white w-100">
                            
                            <div className="modal-header bg-light border-bottom">
                                <h5 className="modal-title text-dark fw-bold">
                                    {categoriaEditando ? 'Modificar Categoria' : 'Registrar Nueva Categoria'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setModalAbierto(false)}></button>
                            </div>

                            <div className="modal-body p-4">
                                <form onSubmit={guardarCategoria}>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold text-secondary small">Nombre de la Categoria (*):</label>
                                        <input 
                                            required 
                                            type="text" 
                                            className="form-control bg-light"
                                            value={formData.nombre_categoria} 
                                            onChange={e => setFormData({...formData, nombre_categoria: e.target.value})} 
                                            placeholder="Ej: Bombas de Agua, Tuberias..."
                                        />
                                    </div>
                                    
                                    <div className="mb-3">
                                        <label className="form-label fw-bold text-secondary small">Descripcion (Opcional):</label>
                                        <textarea 
                                            className="form-control bg-light"
                                            value={formData.descripcion} 
                                            onChange={e => setFormData({...formData, descripcion: e.target.value})}
                                            placeholder="Detalles sobre los productos de esta categoria..."
                                            rows="4"
                                            style={{ resize: 'none' }}
                                        />
                                    </div>
                                    
                                    <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                                        <button type="button" onClick={() => setModalAbierto(false)} className="btn btn-secondary fw-bold px-4">
                                            Cancelar
                                        </button>
                                        <button type="submit" className="btn btn-success fw-bold px-4">
                                            {categoriaEditando ? 'Guardar Cambios' : 'Registrar Categoria'}
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

export default CategoriasPage;