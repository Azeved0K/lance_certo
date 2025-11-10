import { Link } from 'react-router-dom';

// Função helper para formatar o tempo (ex: "5m atrás", "1h atrás")
const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "a";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return Math.floor(seconds) + "s";
};

// Ícone para cada tipo de notificação
const NotificationIcon = ({ tipo }) => {
    if (tipo === 'like') {
        return (
            <div className="notification-icon like">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
            </div>
        );
    }
    if (tipo === 'view_milestone') {
        return (
            <div className="notification-icon view">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                     <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                     <circle cx="12" cy="12" r="3" fill="white" />
                </svg>
            </div>
        );
    }
    return null;
};

const NotificationDropdown = ({ notifications = [], onClose }) => {

    const handleNotificationClick = (notification) => {
        onClose(); // Fecha o dropdown ao clicar
    };

    return (
        <div className="notification-dropdown">
            <div className="notification-header">
                <h3>Notificações</h3>
                {/* <button className="mark-read-btn">Marcar todas como lidas</button> */}
            </div>

            <div className="notification-list">
                {notifications.length === 0 ? (
                    <div className="notification-empty">
                        <p>Nenhuma notificação por aqui</p>
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <Link
                            key={notif.id}
                            // Navega para o vídeo se houver um momento_id
                            to={notif.momento_id ? `/video/${notif.momento_id}` : '#'}
                            className={`notification-item ${!notif.lida ? 'unread' : ''}`}
                            onClick={() => handleNotificationClick(notif)}
                        >
                            <NotificationIcon tipo={notif.tipo} />
                            <div className="notification-content">
                                <p className="notification-message">
                                    {/* Exemplo de como destacar usuário:
                                    {notif.usuario_origem && <strong>{notif.usuario_origem.username}</strong>}
                                    {' '}{notif.mensagem_resumida}
                                    */}
                                    {notif.mensagem}
                                </p>
                                <span className="notification-time">
                                    {formatTimeAgo(notif.created_at)}
                                </span>
                            </div>
                            {!notif.lida && <div className="unread-dot"></div>}
                        </Link>
                    ))
                )}
            </div>

            <div className="notification-footer">
                <Link to="/notificacoes" onClick={onClose}>Ver todas</Link>
            </div>
        </div>
    );
};

export default NotificationDropdown;