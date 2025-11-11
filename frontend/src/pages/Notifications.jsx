import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/layout/Header';
import { notificacoesService } from '../services/api';
import '../styles/components/NotificationDropdown.css';
import '../styles/pages/Notifications.css';

const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} anos atrás`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} meses atrás`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} dias atrás`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} horas atrás`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} minutos atrás`;
    return `${Math.floor(seconds)} segundos atrás`;
};

const NotificationIcon = ({ tipo }) => {
    if (tipo === 'like') {
        return (
            <div className="notification-icon like">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
            </div>
        );
    }
    if (tipo === 'view_milestone') {
        return (
            <div className="notification-icon view">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3" fill="white"/>
                </svg>
            </div>
        );
    }
    return null;
};

const NotificationsPage = () => {
    const { user, logout } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllNotifications = async () => {
            try {
                setLoading(true);
                const response = await notificacoesService.listar(); // O endpoint já busca todas
                setNotifications(response.data || []);

                // Marcar como lidas (ao abrir a página)
                await notificacoesService.marcarTodasLidas();

            } catch (error) {
                console.error("Erro ao buscar notificações:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllNotifications();
    }, []);

    return (
        <>
            <Header/>
            <div className="notifications-page-container">
                <div className="notifications-page-card">
                    <h1 className="notifications-page-title">Notificações</h1>

                    <div className="notification-list full-page-list">
                        {loading && (
                            <div className="loading-container">
                                <div className="loading-spinner"></div>
                            </div>
                        )}

                        {!loading && notifications.length === 0 && (
                            <div className="notification-empty">
                                <p>Nenhuma notificação por aqui</p>
                                <span className="empty-icon">📭</span>
                                <p className="empty-subtext">Novos likes e marcos aparecerão aqui.</p>
                            </div>
                        )}

                        {!loading && notifications.map((notif) => (
                            <Link
                                key={notif.id}
                                to={notif.momento_id ? `/video/${notif.momento_id}` : '#'}
                                className="notification-item" // 'lida' já foi marcado
                            >
                                <NotificationIcon tipo={ notif.tipo }/>
                                <div className="notification-content">
                                    <p className="notification-message">
                                        {notif.mensagem}
                                    </p>
                                    <span className="notification-time">
                                        {formatTimeAgo(notif.created_at)}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default NotificationsPage;