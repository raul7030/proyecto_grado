// src/pages/ForgotPasswordPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import styles from './ForgotPasswordPage.module.css';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje('');
        setError('');
        try {
            await axiosInstance.post('/password-reset/', { email });
            setMensaje('Si el correo está registrado, recibirás un enlace en unos momentos.');
        } catch (err) {
            setError('Hubo un problema al procesar tu solicitud.');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h2 className={styles.title}>Recuperar Contraseña</h2>
                <p className={styles.textMuted}>Ingresa tu correo electrónico registrado.</p>
                
                <form onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="emailInput" className={styles.label}>Correo Electrónico</label>
                        <input 
                            id="emailInput"
                            type="email" 
                            className={styles.input} 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                        />
                    </div>
                    
                    {mensaje && <div className={styles.alertSuccess}>{mensaje}</div>}
                    {error && <div className={styles.alertError}>{error}</div>}
                    
                    <button type="submit" className={styles.submitButton}>
                        Enviar Enlace
                    </button>
                </form>
                
                <div className={styles.linkContainer}>
                    <Link to="/login" className={styles.backLink}>
                        Volver al Inicio de Sesión
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;