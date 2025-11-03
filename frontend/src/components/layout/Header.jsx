import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/components/Header.css';

const Header = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');

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
                                placeholder="Buscar momentos incriveis..."
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

                                <button className="notificationBtn" title="Notificacoes">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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