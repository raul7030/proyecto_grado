// src/pages/SucursalFormPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

const SucursalFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        nombre: '',
        direccion: '',
        telefono: ''
    });

    // Carga de datos si es modo edicion
    useEffect(() => {
        if (id) {
            axiosInstance.get(`/sucursales/${id}/`)
                .then(res => setFormData(res.data))
                .catch(err => console.error("Error al cargar la sucursal:", err));
        }
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (id) {
                await axiosInstance.put(`/sucursales/${id}/`, formData);
            } else {
                await axiosInstance.post('/sucursales/', formData);
            }
            // Retorno a la lista de sucursales en el area privada
            navigate('/erp/sucursales'); 
        } catch (error) {
            console.error("Error en el registro:", error);
            alert('Error al guardar la información de la sucursal.');
        }
    };

    return (
        <div className="container-fluid py-4">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                    
                    <div className="mb-4">
                        <Link to="/erp/sucursales" className="btn btn-outline-secondary btn-sm fw-bold shadow-sm">
                            &larr; Volver a Sucursales
                        </Link>
                    </div>
                    
                    {/* CONTENEDOR BLINDADO (Bootstrap Puro)
                      - card: Crea la estructura base.
                      - shadow-lg: Le da profundidad para que flote sobre el fondo.
                      - border-0: Quita bordes grises feos.
                      - bg-white: Fuerza el fondo blanco puro.
                    */}
                    <div className="card shadow-lg border-0 bg-white">
                        
                        <div className="card-header bg-white border-bottom pb-3 pt-4 text-center">
                            <h2 className="h4 mb-0 text-dark fw-bold">
                                {id ? 'Editar Sucursal' : 'Nueva Sucursal'}
                            </h2>
                        </div>
                        
                        <div className="card-body p-4 p-md-5 bg-white">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label fw-bold text-secondary">
                                        Nombre de Sucursal:
                                    </label>
                                    <input 
                                        type="text" 
                                        className="form-control bg-light text-dark border"
                                        required
                                        value={formData.nombre}
                                        onChange={e => setFormData({...formData, nombre: e.target.value})}
                                    />
                                </div>
                                
                                <div className="mb-3">
                                    <label className="form-label fw-bold text-secondary">
                                        Dirección:
                                    </label>
                                    <input 
                                        type="text" 
                                        className="form-control bg-light text-dark border"
                                        value={formData.direccion}
                                        onChange={e => setFormData({...formData, direccion: e.target.value})}
                                    />
                                </div>
                                
                                <div className="mb-4">
                                    <label className="form-label fw-bold text-secondary">
                                        Teléfono:
                                    </label>
                                    <input 
                                        type="text" 
                                        className="form-control bg-light text-dark border"
                                        value={formData.telefono}
                                        onChange={e => setFormData({...formData, telefono: e.target.value})}
                                    />
                                </div>
                                
                                <button type="submit" className="btn btn-primary w-100 fw-bold py-2 mt-2 shadow-sm">
                                    {id ? 'Actualizar Información' : 'Guardar Sucursal'}
                                </button>
                            </form>
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
    );
};

export default SucursalFormPage;