import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { notificacoesService } from '../../services/api';
import NotificationDropdown from './NotificationDropdown';
import '../../styles/components/Header.css';
import '../../styles/components/NotificationDropdown.css';

const Header = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    // Ref para o botão e o dropdown para detectar cliques fora
    const notificationBtnRef = useRef(null);

    // Buscar notificações quando o usuário logar
    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Buscar atualizações a cada 1 minuto
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        } else {
            // Limpar notificações se deslogar
            setNotifications([]);
            setShowNotifications(false);
        }
    }, [user]);

    // Fechar dropdown se clicar fora
    useEffect(() => {
        function handleClickOutside(event) {
            if (notificationBtnRef.current &&
                !notificationBtnRef.current.contains(event.target)) {
                // Verifica se o clique foi fora do dropdown também
                if (event.target.closest('.notification-dropdown') === null) {
                    setShowNotifications(false);
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [notificationBtnRef]);

    // Busca as notificações da API
    const fetchNotifications = async () => {
        try {
            const response = await notificacoesService.listar();
            setNotifications(response.data || []);
        } catch (error) {
            console.error('Erro ao buscar notificações:', error);
        }
    };

    // Lógica ao clicar no sino
    const handleNotificationClick = async () => {
        const newShowState = !showNotifications;
        setShowNotifications(newShowState);

        // Se estiver abrindo o dropdown e houver notificações não lidas
        if (newShowState && unreadCount > 0) {
            try {
                // Marcar como lidas no backend
                await notificacoesService.marcarTodasLidas();

                // Atualizar estado local para refletir (remove o ponto azul)
                setNotifications(prev =>
                    prev.map(n => ({ ...n, lida: true }))
                );
            } catch (error) {
                console.error('Erro ao marcar notificações como lidas:', error);
            }
        }
    };

    // Calcular contagem de não lidas
    const unreadCount = notifications.filter(n => !n.lida).length;

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Navegar para Home com parâmetro de busca
            navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <header className="header">
            <div className="container">
                <div className="headerContent">
                    {/* Logo */}
                    <Link to="/" className="logo">
                        <div className="logoIcon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23 7l-7 5 7 5V7z" />
                                <rect x="1" y="5" width="15" height="14" rx="2" />
                            </svg>
                        </div>
                        <span className="logoText">
                            Lance <span className="logoHighlight">Certo</span>
                        </span>
                    </Link>

                    {/* Search Bar */}
                    {user && (
                        <form onSubmit={handleSearch} className="searchContainer">
                            <input
                                type="text"
                                placeholder="Buscar..."
                                className="searchInput"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button type="submit" className="searchButton">
                                <svg className="searchIcon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <circle cx="11" cy="11" r="8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </form>
                    )}

                    {/* Navigation */}
                    <nav className="nav">
                        {user ? (
                            <>
                                <Link to="/capture" className="btnCapture">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M23 7l-7 5 7 5V7z" />
                                        <rect x="1" y="5" width="15" height="14" rx="2" />
                                    </svg>
                                    <span>Capturar</span>
                                </Link>

                                {/* BOTÃO DE NOTIFICAÇÃO */}
                                <div
                                    className="notificationBtnContainer"
                                    ref={notificationBtnRef}
                                    style={{ position: 'relative' }} // Container para o dropdown
                                >
                                    <button
                                        className="notificationBtn"
                                        title="Notificações"
                                        onClick={handleNotificationClick} // Adiciona onClick
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>

                                        {/* Mostra badge apenas se houver não lidas */}
                                        {unreadCount > 0 && (
                                            <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                                        )}
                                    </button>

                                    {/* Renderiza o Dropdown */}
                                    {showNotifications && (
                                        <NotificationDropdown
                                            notifications={notifications}
                                            onClose={() => setShowNotifications(false)}
                                        />
                                    )}
                                </div>

                                <div className="userMenu">
                                    <button className="userBtn">
                                        <img
                                            src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=3B82F6&color=fff`}
                                            alt={user.username}
                                            className="avatar"
                                        />
                                        <span className="username">{user.username}</span>
                                    </button>
                                    <div className="dropdown">

                                        {/* LINK ATUALIZADO */}
                                        <Link
                                            to={ `/profile/${user.username }`}
                                            className="dropdownItem"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <circle cx="12" cy="8" r="4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            Meu Perfil
                                        </Link>
                                        <button onClick={handleLogout} className="dropdownItem logout">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            Sair
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="loginBtn">Entrar</Link>
                                <Link to="/register" className="registerBtn">Cadastrar</Link>
                                <Link to="/capture" className="captureBtn">Capturar</Link>
                            </>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;