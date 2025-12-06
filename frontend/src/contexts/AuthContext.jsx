import { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            // Pegar token CSRF primeiro
            await authService.getCsrfToken();

            // Buscar dados do usuario
            const response = await authService.getCurrentUser();
            setUser(response.data);
            console.log('Usuario autenticado:', response.data);
        } catch (error) {
            console.log('Usuario não autenticado');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials) => {
        try {
            await authService.getCsrfToken();
            const response = await authService.login(credentials);
            setUser(response.data.user);
            console.log('Login bem-sucedido:', response.data.user);
            return { success: true };
        } catch (error) {
            console.error('Erro no login:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Erro ao fazer login'
            };
        }
    };

    const register = async (userData) => {
        try {
            await authService.getCsrfToken();
            await authService.register(userData);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data || 'Erro ao criar conta'
            };
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
            console.log('Logout bem-sucedido');
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        } finally {
            setUser(null);
        }
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        checkAuth
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'var(--gray-50)'
            }}>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};