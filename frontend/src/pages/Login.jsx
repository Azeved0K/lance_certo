import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import styles from '../styles/pages/Auth.module.css';

const Login = ({ onLogin }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authService.login(formData);
            if (onLogin) {
                onLogin(response.data.user);
            }
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao fazer login. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                {/* Logo */}
                <div className={styles.authHeader}>
                    <div className={styles.authLogo}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <path d="M23 7l-7 5 7 5V7z" fill="currentColor" />
                            <rect x="1" y="5" width="15" height="14" rx="2" fill="currentColor" />
                        </svg>
                    </div>
                    <h1 className={styles.authTitle}>Bem-vindo de volta!</h1>
                    <p className={styles.authSubtitle}>Entre para capturar momentos inesquecíveis</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className={styles.authForm}>
                    {error && (
                        <div className={styles.errorAlert}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <div className="input-group">
                        <label className="input-label">Usuário ou Email</label>
                        <div className={styles.inputWithIcon}>
                            <svg className={styles.inputIcon} width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                                <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="seu_usuario"
                                required
                                className="input-field"
                                style={{ paddingLeft: '2.5rem' }}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Senha</label>
                        <div className={styles.inputWithIcon}>
                            <svg className={styles.inputIcon} width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                className="input-field"
                                style={{ paddingLeft: '2.5rem' }}
                            />
                        </div>
                    </div>

                    <div className={styles.formOptions}>
                        <label className={styles.checkbox}>
                            <input type="checkbox" />
                            <span>Lembrar-me</span>
                        </label>
                        <Link to="/forgot-password" className={styles.forgotLink}>
                            Esqueci minha senha
                        </Link>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                {/* Divider */}
                <div className={styles.divider}>
                    <span>Ou continue com</span>
                </div>

                {/* Social Login */}
                <div className={styles.socialButtons}>
                    <button className={styles.socialBtn}>
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google
                    </button>
                    <button className={styles.socialBtn}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Facebook
                    </button>
                </div>

                {/* Register Link */}
                <p className={styles.authFooter}>
                    Não tem uma conta? <Link to="/register" className={styles.authLink}>Cadastre-se grátis</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;