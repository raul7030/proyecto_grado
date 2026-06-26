// src/pages/UsuariosPage.jsx
import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { usePermisos } from '../hooks/usePermisos';
import styles from './UsuariosPage.module.css';

const UsuariosPage = () => {
    const { esAdmin } = usePermisos();
    
    const [usuarios, setUsuarios] = useState([]);
    const [roles, setRoles] = useState([]);
    const [sucursales, setSucursales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');

    const [modalAbierto, setModalAbierto] = useState(false);
    const [usuarioEditando, setUsuarioEditando] = useState(null); 
    
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        email: '',
        id_rol: '',
        id_sucursal: '',
        is_active: true
    });

    useEffect(() => {
        if (esAdmin) cargarDatos();
    }, [esAdmin]);

    const cargarDatos = async () => {
        try {
            const [resUsers, resRoles, resSucursales] = await Promise.all([
                axiosInstance.get('/usuarios/'),
                axiosInstance.get('/roles/'),
                axiosInstance.get('/sucursales/')
            ]);
            setUsuarios(resUsers.data);
            setRoles(resRoles.data);
            setSucursales(resSucursales.data);
        } catch (error) {
            console.error("Error cargando datos", error);
        } finally {
            setLoading(false);
        }
    };

    const abrirModalCrear = () => {
        setUsuarioEditando(null);
        setFormData({ 
            username: '', password: '', first_name: '', last_name: '', 
            email: '', id_rol: '', id_sucursal: '', is_active: true 
        });
        setModalAbierto(true);
    };

    const abrirModalEditar = (u) => {
        setUsuarioEditando(u.id);
        setFormData({
            username: u.username,
            password: '', 
            first_name: u.first_name || '',
            last_name: u.last_name || '',
            email: u.email || '',
            id_rol: u.perfilusuario?.rol?.id_rol || '',
            id_sucursal: u.perfilusuario?.sucursal?.id_sucursal || '',
            is_active: Boolean(u.is_active)
        });
        setModalAbierto(true);
    };

    const guardarUsuario = async (e) => {
        e.preventDefault();
        try {
            if (usuarioEditando) {
                const dataToSubmit = { ...formData };
                if (!dataToSubmit.password) delete dataToSubmit.password;
                
                await axiosInstance.put(`/usuarios/${usuarioEditando}/`, dataToSubmit);
                alert("Usuario actualizado correctamente.");
            } else {
                await axiosInstance.post('/usuarios/', formData);
                alert("Usuario creado exitosamente.");
            }
            setModalAbierto(false);
            cargarDatos();
        } catch (error) {
            alert("Error: Verifica que el usuario no exista o que los datos ingresados sean correctos.");
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("¿Seguro que deseas eliminar este usuario? Es preferible cambiar su estado a INACTIVO si ya tiene historial de registros.")) return;
        try {
            await axiosInstance.delete(`/usuarios/${id}/`);
            setUsuarios(usuarios.filter(u => u.id !== id));
            alert("Usuario eliminado correctamente.");
        } catch (error) {
            alert("Error al eliminar. El usuario ya tiene historial asociado en el sistema.");
        }
    };

    const usuariosFiltrados = usuarios.filter(u => 
        (u.username?.toLowerCase() || '').includes(busqueda.toLowerCase()) ||
        (u.first_name?.toLowerCase() || '').includes(busqueda.toLowerCase())
    );

    if (!esAdmin) return <div className="text-center mt-5 text-danger fw-bold">🔒 No tienes permisos para ver esta página.</div>;
    if (loading) return <div className="text-center mt-5 text-muted">Cargando personal...</div>;

    return (
        <div className="container-fluid py-4 bg-light min-vh-100">
            
            {/* ENCABEZADO RESPONSIVO */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h1 className="h3 mb-1 text-dark fw-bold">🧑‍💻 Gestión de Personal y Accesos</h1>
                    <p className="text-muted mb-0">Control de usuarios, roles y asignación de sucursales.</p>
                </div>
                <button onClick={abrirModalCrear} className="btn btn-primary fw-bold shadow-sm">
                    + Nuevo Empleado
                </button>
            </div>

            {/* BARRA DE BÚSQUEDA */}
            <div className="card shadow-sm border-0 mb-4">
                <div className="card-body bg-white rounded">
                    <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">🔍</span>
                        <input 
                            type="text" 
                            className="form-control border-start-0" 
                            placeholder="Buscar por Usuario (Login) o Nombre..." 
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* TABLA RESPONSIVA */}
            <div className="card shadow-sm border-0">
                <div className="table-responsive">
                    <table className={`table table-hover align-middle mb-0 ${styles.noHoverTable}`}>
                        <thead className="table-light">
                            <tr>
                                <th>Usuario (Login)</th>
                                <th>Nombre Completo</th>
                                <th>Rol</th>
                                <th>Sucursal (Base)</th>
                                <th>Estado</th>
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuariosFiltrados.map(u => (
                                <tr key={u.id} className="bg-white">
                                    <td className={styles.loginText}>{u.username}</td>
                                    <td><strong>{u.first_name} {u.last_name}</strong></td>
                                    <td>
                                        {u.perfilusuario?.rol?.nombre_rol ? (
                                            u.perfilusuario.rol.nombre_rol
                                        ) : (
                                            <span className={styles.noRoleText}>Sin Rol</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className="badge bg-secondary px-2 py-1">
                                            {u.perfilusuario?.sucursal?.nombre || 'Central'}
                                        </span>
                                    </td>
                                    <td>
                                        {u.is_active 
                                            ? <span className="badge bg-success bg-opacity-10 text-success border border-success px-2 py-1">✅ Activo</span> 
                                            : <span className="badge bg-danger bg-opacity-10 text-danger border border-danger px-2 py-1">⛔ Inactivo</span>}
                                    </td>
                                    <td>
                                        <div className={styles.actionButtonsContainer}>
                                            <button 
                                                onClick={() => abrirModalEditar(u)} 
                                                className="btn btn-sm btn-outline-primary fw-bold"
                                                title="Editar Usuario"
                                            >
                                                Editar
                                            </button>
                                            {!u.is_superuser && (
                                                <button 
                                                    onClick={() => handleDelete(u.id)} 
                                                    className="btn btn-sm btn-outline-danger fw-bold"
                                                    title="Eliminar Usuario"
                                                >
                                                    Eliminar
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {usuariosFiltrados.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center py-5 text-muted">
                                        No se encontraron usuarios que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL DE CREACIÓN / EDICIÓN RESPONSIVO */}
            {modalAbierto && (
                <div className={styles.modalOverlay} onClick={() => setModalAbierto(false)}>
                    <div className={styles.modalContentSolid} onClick={(e) => e.stopPropagation()}>
                        
                        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                            <h4 className="m-0 fw-bold text-primary">
                                {usuarioEditando ? '✏️ Edición de Personal' : '👤 Registrar Nuevo Empleado'}
                            </h4>
                            <button type="button" className="btn-close" onClick={() => setModalAbierto(false)}></button>
                        </div>
                        
                        <form onSubmit={guardarUsuario}>
                            <div className="row">
                                <div className="col-12 col-md-6 mb-3">
                                    <label className="form-label fw-bold text-secondary small">Usuario (Login) (*):</label>
                                    <input 
                                        required 
                                        type="text" 
                                        className="form-control"
                                        disabled={usuarioEditando} 
                                        value={formData.username} 
                                        onChange={e => setFormData({...formData, username: e.target.value})} 
                                    />
                                    {usuarioEditando && <small className="text-muted">El login no se puede cambiar.</small>}
                                </div>
                                <div className="col-12 col-md-6 mb-3">
                                    <label className="form-label fw-bold text-secondary small">Contraseña {usuarioEditando ? '(Opcional)' : '(*)'}:</label>
                                    <input 
                                        required={!usuarioEditando} 
                                        type="password" 
                                        className="form-control"
                                        placeholder={usuarioEditando ? "Dejar en blanco para no cambiar" : ""}
                                        value={formData.password} 
                                        onChange={e => setFormData({...formData, password: e.target.value})} 
                                    />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-12 col-md-6 mb-3">
                                    <label className="form-label fw-bold text-secondary small">Nombres (*):</label>
                                    <input 
                                        required type="text" 
                                        className="form-control"
                                        value={formData.first_name} 
                                        onChange={e => setFormData({...formData, first_name: e.target.value})} 
                                    />
                                </div>
                                <div className="col-12 col-md-6 mb-3">
                                    <label className="form-label fw-bold text-secondary small">Apellidos (*):</label>
                                    <input 
                                        required type="text" 
                                        className="form-control"
                                        value={formData.last_name} 
                                        onChange={e => setFormData({...formData, last_name: e.target.value})} 
                                    />
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold text-secondary small">Correo Electrónico (*):</label>
                                <input 
                                    required type="email" 
                                    className="form-control"
                                    placeholder="ejemplo@sanrafael.com"
                                    value={formData.email} 
                                    onChange={e => setFormData({...formData, email: e.target.value})} 
                                />
                            </div>

                            <div className="row">
                                <div className="col-12 col-md-6 mb-3">
                                    <label className="form-label fw-bold text-secondary small">Rol en el Sistema (*):</label>
                                    <select 
                                        required 
                                        className="form-select bg-light"
                                        value={formData.id_rol} 
                                        onChange={e => setFormData({...formData, id_rol: e.target.value})}
                                    >
                                        <option value="">-- Seleccionar Rol --</option>
                                        {roles.map(r => (
                                            <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-12 col-md-6 mb-3">
                                    <label className="form-label fw-bold text-secondary small">Sucursal Base (*):</label>
                                    <select 
                                        required 
                                        className="form-select bg-light"
                                        value={formData.id_sucursal} 
                                        onChange={e => setFormData({...formData, id_sucursal: e.target.value})}
                                    >
                                        <option value="">-- Seleccionar Sucursal --</option>
                                        {sucursales.map(s => (
                                            <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {usuarioEditando && (
                                <div className="mb-4 bg-light p-3 rounded border">
                                    <label className="form-label fw-bold text-secondary small">Estado del Acceso al ERP:</label>
                                    <select 
                                        className="form-select border-secondary"
                                        value={String(formData.is_active)}
                                        onChange={e => setFormData({...formData, is_active: e.target.value === 'true'})}
                                    >
                                        <option value="true">✅ Activo (Puede iniciar sesión y operar)</option>
                                        <option value="false">⛔ Inactivo (Acceso totalmente bloqueado)</option>
                                    </select>
                                </div>
                            )}

                            <div className="d-flex justify-content-end gap-2 border-top pt-3 mt-2">
                                <button type="button" onClick={() => setModalAbierto(false)} className="btn btn-secondary fw-bold px-4">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-success fw-bold px-4">
                                    {usuarioEditando ? 'Guardar Cambios' : 'Crear Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsuariosPage;