import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/pages/Auth.css';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetMessage, setResetMessage] = useState('');

    // Etapas adicionais: inserir código e redefinir senha
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [code, setCode] = useState('');
    const [codeLoading, setCodeLoading] = useState(false);
    const [codeError, setCodeError] = useState('');

    const [showNewPasswordModal, setShowNewPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordLoading, setNewPasswordLoading] = useState(false);
    const [newPasswordMessage, setNewPasswordMessage] = useState('');

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

        const result = await login(formData);

        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    const handleSendResetCode = async (e) => {
        e.preventDefault();
        setResetLoading(true);
        setResetMessage('');
        try {
            await authService.sendPasswordResetCode(resetEmail);
            setResetMessage('Código de restauração enviado para o email informado.');
            // Avança para modal de inserir código
            setShowResetModal(false);
            setShowCodeModal(true);
        } catch (err) {
            setResetMessage('Erro ao enviar código. Verifique o email informado.');
            const serverMessage = err?.response?.data?.error || 'Erro ao enviar código. Verifique o email informado.';
            setResetMessage(serverMessage);
        }
        setResetLoading(false);
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setCodeLoading(true);
        setCodeError('');
        try {
            await authService.verifyPasswordResetCode(resetEmail, code);
            // Código válido: abrir modal para nova senha
            setShowCodeModal(false);
            setShowNewPasswordModal(true);
        } catch (err) {
            const serverMessage = err?.response?.data?.error || 'Código inválido.';
            setCodeError(serverMessage);
        } finally {
            setCodeLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setNewPasswordLoading(true);
        setNewPasswordMessage('');
        try {
            await authService.resetPassword(resetEmail, code, newPassword);
            setNewPasswordMessage('Senha redefinida com sucesso. Faça login com a nova senha.');
            // Fecha todos os modais após sucesso
            setShowNewPasswordModal(false);
            setShowResetModal(false);
            setShowCodeModal(false);
            // opcional: limpar campos
            setResetEmail('');
            setCode('');
            setNewPassword('');
        } catch (err) {
            const serverMessage = err?.response?.data?.error || 'Erro ao redefinir senha.';
            setNewPasswordMessage(serverMessage);
        } finally {
            setNewPasswordLoading(false);
        }
    };

    return (
        <div className="authContainer">
            <div className="authCard">
                {/* Logo */}
                <div className="authHeader">
                    <div className="authLogo">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <path d="M23 7l-7 5 7 5V7z" fill="currentColor" />
                            <rect x="1" y="5" width="15" height="14" rx="2" fill="currentColor" />
                        </svg>
                    </div>
                    <h1 className="authTitle">Bem-vindo de volta!</h1>
                    <p className="authSubtitle">Entre para capturar momentos inesqueciveis</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="authForm">
                    {error && (
                        <div className="errorAlert">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <div className="input-group">
                        <label className="input-label">Usuario ou Email</label>
                        <div className="inputWithIcon">
                            <svg className="inputIcon" width="20" height="20" viewBox="0 0 24 24" fill="none">
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
                        <div className="inputWithIcon">
                            <svg className="inputIcon" width="20" height="20" viewBox="0 0 24 24" fill="none">
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

                    <div className="formOptions">
                        <label className="checkbox">
                            <input type="checkbox" />
                            <span>Lembrar-me</span>
                        </label>
                        <a href="#" className="forgotLink" onClick={(e) => { e.preventDefault(); setShowResetModal(true); }}>
                            Esqueci minha senha
                        </a>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                {/* Divider
                <div className="divider">
                    <span>Ou continue com</span>
                </div> */}

                {/* Social Login
                <div className="socialButtons">
                    <button className="socialBtn" type="button">
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google
                    </button>
                    <button className="socialBtn" type="button">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Facebook
                    </button>
                </div> */}

                {/* Register Link */}
                <p className="authFooter">
                    Não tem uma conta? <Link to="/register" className="authLink">Cadastre-se grátis</Link>
                </p>
            </div>

            {/* Reset Password Modal */}
            {showResetModal && (
                <div className="modal" onClick={() => !resetLoading && setShowResetModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Recuperar Senha</h2>
                            <button onClick={() => setShowResetModal(false)} className="modal-close" disabled={resetLoading}>×</button>
                        </div>
                        <form onSubmit={handleSendResetCode} className="modal-form">
                            <div className="input-group">
                                <label className="input-label">Informe seu email cadastrado</label>
                                <input
                                    type="email"
                                    value={resetEmail}
                                    onChange={e => setResetEmail(e.target.value)}
                                    required
                                    className="input-field"
                                    disabled={resetLoading}
                                />
                            </div>
                            {resetMessage && <div className="infoAlert">{resetMessage}</div>}
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowResetModal(false)} className="btn btn-outline" disabled={resetLoading}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" disabled={resetLoading}>
                                    {resetLoading ? 'Enviando...' : 'Enviar código'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Code Verification Modal */}
            {showCodeModal && (
                <div className="modal" onClick={() => !codeLoading && setShowCodeModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Informe o código</h2>
                            <button onClick={() => setShowCodeModal(false)} className="modal-close" disabled={codeLoading}>×</button>
                        </div>
                        <form onSubmit={handleVerifyCode} className="modal-form">
                            <div className="input-group">
                                <label className="input-label">Código recebido por e-mail</label>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={e => setCode(e.target.value)}
                                    required
                                    className="input-field"
                                    disabled={codeLoading}
                                />
                            </div>
                            {codeError && <div className="errorAlert">{codeError}</div>}
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowCodeModal(false)} className="btn btn-outline" disabled={codeLoading}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" disabled={codeLoading}>
                                    {codeLoading ? 'Verificando...' : 'Verificar código'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* New Password Modal */}
            {showNewPasswordModal && (
                <div className="modal" onClick={() => !newPasswordLoading && setShowNewPasswordModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Redefinir Senha</h2>
                            <button onClick={() => setShowNewPasswordModal(false)} className="modal-close" disabled={newPasswordLoading}>×</button>
                        </div>
                        <form onSubmit={handleResetPassword} className="modal-form">
                            <div className="input-group">
                                <label className="input-label">Nova senha</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    required
                                    className="input-field"
                                    disabled={newPasswordLoading}
                                />
                            </div>
                            {newPasswordMessage && <div className="infoAlert">{newPasswordMessage}</div>}
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowNewPasswordModal(false)} className="btn btn-outline" disabled={newPasswordLoading}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" disabled={newPasswordLoading}>
                                    {newPasswordLoading ? 'Salvando...' : 'Redefinir senha'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;