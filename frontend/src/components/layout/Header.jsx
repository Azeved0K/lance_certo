import { Link, useNavigate } from 'react-router-dom';
import '../../styles/components/Header.css';

const Header = ({ user, onLogout }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        if (onLogout) {
            onLogout();
        }
        navigate('/login');
    };

    return (
        <header className="header">
            <div className="container">
                <div className="headerContent">
                    {/* Logo */}
                    <Link to="/" className="logo">
                        <div className="logoIcon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M23 7l-7 5 7 5V7z" fill="currentColor" />
                                <rect x="1" y="5" width="15" height="14" rx="2" fill="currentColor" />
                            </svg>
                        </div>
                        <span className="logoText">
                            Lance <span className="logoHighlight">Certo</span>
                        </span>
                    </Link>

                    {/* Search Bar */}
                    {user && (
                        <div className="searchContainer">
                            <input
                                type="text"
                                placeholder="Buscar momentos incríveis..."
                                className="searchInput"
                            />
                            <svg className="searchIcon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </div>
                    )}

                    {/* Navigation */}
                    <nav className="nav">
                        {user ? (
                            <>
                                <Link to="/capture" className="btnCapture">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M23 7l-7 5 7 5V7z" fill="currentColor" />
                                        <rect x="1" y="5" width="15" height="14" rx="2" fill="currentColor" />
                                    </svg>
                                    <span>Capturar</span>
                                </Link>

                                <button className="notificationBtn">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" />
                                        <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                    <span className="badge">3</span>
                                </button>

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
                                        <Link to="/profile" className="dropdownItem">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                                                <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2" />
                                            </svg>
                                            Meu Perfil
                                        </Link>
                                        <button onClick={handleLogout} className={`$"dropdownItem" $"logout"`}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" />
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