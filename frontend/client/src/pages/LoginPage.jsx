// src/pages/LoginPage.jsx
import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import styles from './LoginPage.module.css';

const LoginPage = () => {
    const { loginUser } = useContext(AuthContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        loginUser(username, password);
    };

    return (
        <div className={styles.loginContainer}>
            <form onSubmit={handleSubmit} className={styles.loginForm}>
                
                {/* Logo Principal */}
                <img 
                    src="../images/SAN RAFAEL logo fondo transparente.png"
                    alt="Logo Distribuidora San Rafael" 
                    className={styles.loginLogo} 
                />
                
                <h2>Acceso al Sistema</h2>

                <div className={styles.inputGroup}>
                    <label htmlFor="username">Usuario:</label>
                    <input 
                        type="text" 
                        id="username" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        required 
                    />
                </div>
                
                <div className={styles.inputGroup}>
                    <label htmlFor="password">Contraseña:</label>
                    <input 
                        type="password" 
                        id="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />
                </div>
                
                <button type="submit" className={styles.loginButton}>
                    Ingresar
                </button>

                {/* Enlace de Recuperación de Contraseña */}
                <div className={styles.recoveryLinkContainer}>
                    <Link to="/forgot-password" className={styles.recoveryLink}>
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default LoginPage;