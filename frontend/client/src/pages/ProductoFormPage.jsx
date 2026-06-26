// src/pages/ProductoFormPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import styles from './ProductoFormPage.module.css';

const ProductoFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        sku: '',
        nombre_producto: '',
        descripcion: '',
        precio_base: '',
        categoria: ''
    });

    // Nuevos estados para manejar la imagen
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [categorias, setCategorias] = useState([]);

    useEffect(() => {
        // Cargar listado de categorias
        axiosInstance.get('/categorias/')
            .then(res => setCategorias(res.data))
            .catch(err => console.error("Error al cargar categorías", err));

        // Si existe un ID, cargar los datos para edición
        if (id) {
            axiosInstance.get(`/productos/${id}/`)
                .then(res => {
                    const data = res.data;
                    setFormData({
                        sku: data.sku || '',
                        nombre_producto: data.nombre_producto || '',
                        descripcion: data.descripcion || '',
                        precio_base: data.precio_base || '',
                        categoria: data.categoria || ''
                    });
                    
                    // Si el producto ya tiene una imagen guardada, mostrarla en la vista previa
                    if (data.imagen) {
                        setImagePreview(data.imagen);
                    }
                })
                .catch(err => console.error("Error al cargar el producto", err));
        }
    }, [id]);

    // Función para manejar la selección de la imagen
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            // Crea una URL temporal para mostrar la imagen seleccionada inmediatamente
            setImagePreview(URL.createObjectURL(file)); 
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // EMPAQUETADO FORMDATA (Obligatorio para enviar archivos)
        const dataToSend = new FormData();
        dataToSend.append('sku', formData.sku);
        dataToSend.append('nombre_producto', formData.nombre_producto);
        dataToSend.append('descripcion', formData.descripcion);
        dataToSend.append('precio_base', formData.precio_base);
        dataToSend.append('categoria', formData.categoria);
        
        // Solo adjuntamos la imagen si el usuario seleccionó una nueva
        if (imageFile) {
            dataToSend.append('imagen', imageFile); 
        }

        try {
            if (id) {
                // Axios detecta automáticamente que es FormData y ajusta los headers
                await axiosInstance.put(`/productos/${id}/`, dataToSend);
                alert('Registro de producto actualizado exitosamente.');
            } else {
                await axiosInstance.post('/productos/', dataToSend);
                alert('Producto registrado exitosamente en el catálogo.');
            }
            navigate('/productos');
        } catch (error) {
            console.error(error);
            alert("Error al guardar el registro. Verifique los datos ingresados.");
        }
    };

    return (
        <div className={`page-container ${styles.container}`}>
            <div className={styles.headerForm}>
                <Link to="/productos" className="btn-secondary">Volver al Directorio</Link>
            </div>
            
            <h1 className={styles.titleForm}>
                {id ? 'Editar Registro de Producto' : 'Registrar Nuevo Producto'}
            </h1>

            <form onSubmit={handleSubmit} className={styles.formCard}>
                
                {/* --- SECCIÓN DE IMAGEN --- */}
                <div className={styles.imageSection}>
                    <div className={styles.imagePreviewContainer}>
                        {imagePreview ? (
                            <img src={imagePreview} alt="Vista previa" className={styles.imagePreview} />
                        ) : (
                            <div className={styles.imagePlaceholder}>
                                <span>📷 Sin Imagen</span>
                            </div>
                        )}
                    </div>
                    <div className={styles.imageUploadWrapper}>
                        <label className={styles.formLabel}>Fotografía del Producto:</label>
                        <input 
                            type="file" 
                            accept="image/png, image/jpeg, image/webp" 
                            className={styles.formInput}
                            onChange={handleImageChange}
                        />
                        <small className="text-muted mt-1 d-block">Formatos permitidos: JPG, PNG, WEBP.</small>
                    </div>
                </div>

                <hr className={styles.divider} />

                {/* --- CAMPOS DE TEXTO ORIGINALES --- */}
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>SKU (*):</label>
                    <input 
                        type="text" 
                        required
                        className={styles.formInput}
                        value={formData.sku}
                        onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Nombre del Producto (*):</label>
                    <input 
                        type="text" 
                        required
                        className={styles.formInput}
                        value={formData.nombre_producto}
                        onChange={(e) => setFormData({...formData, nombre_producto: e.target.value})}
                    />
                </div>

                <div className={styles.formRow}>
                    <div className={styles.formGroupHalf}>
                        <label className={styles.formLabel}>Precio Base (Bs.) (*):</label>
                        <input 
                            type="number" 
                            step="0.01"
                            required
                            className={styles.formInput}
                            value={formData.precio_base}
                            onChange={(e) => setFormData({...formData, precio_base: e.target.value})}
                        />
                    </div>
                    <div className={styles.formGroupHalf}>
                        <label className={styles.formLabel}>Categoría (*):</label>
                        <select 
                            className={styles.formInput}
                            value={formData.categoria}
                            onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                            required
                        >
                            <option value="">-- Seleccione Categoría --</option>
                            {categorias.map(cat => (
                                <option key={cat.id_categoria} value={cat.id_categoria}>
                                    {cat.nombre_categoria} 
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Descripción:</label>
                    <textarea 
                        rows="3"
                        className={styles.formInput}
                        value={formData.descripcion}
                        onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                    />
                </div>

                <button type="submit" className={`btn-primary ${styles.btnSubmit}`}>
                    {id ? 'Guardar Cambios' : 'Registrar Producto'}
                </button>

            </form>
        </div>
    );
};

export default ProductoFormPage;