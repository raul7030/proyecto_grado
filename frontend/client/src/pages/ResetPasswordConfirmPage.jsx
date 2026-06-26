// src/pages/ResetPasswordConfirmPage.jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import styles from './ResetPasswordConfirmPage.module.css';

const ResetPasswordConfirmPage = () => {
    const { uid, token } = useParams();
    const navigate = useNavigate();
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validacion de coincidencia de contraseñas
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        try {
            // Envio de la nueva credencial al servidor
            await axiosInstance.post(`/password-reset/confirm/${uid}/${token}/`, { password });
            alert('Contraseña actualizada con éxito.');
            navigate('/login');
        } catch (err) {
            setError('El enlace de recuperación ha expirado o es inválido.');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h2 className={styles.title}>Nueva Contraseña</h2>
                
                <form onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="newPassword" className={styles.label}>Nueva Contraseña</label>
                        <input 
                            id="newPassword"
                            type="password" 
                            className={styles.input} 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                    </div>
                    
                    <div className={styles.inputGroup}>
                        <label htmlFor="confirmPassword" className={styles.label}>Confirmar Contraseña</label>
                        <input 
                            id="confirmPassword"
                            type="password" 
                            className={styles.input} 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            required 
                        />
                    </div>
                    
                    {error && <div className={styles.alertError}>{error}</div>}
                    
                    <button type="submit" className={styles.submitButton}>
                        Restablecer Contraseña
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordConfirmPage;