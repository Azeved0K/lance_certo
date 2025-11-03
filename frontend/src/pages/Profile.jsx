import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/layout/Header';
import MomentoCard from '../components/gallery/MomentoCard';
import { momentosService } from '../services/api';
import '../styles/pages/Profile.css';

const Profile = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [momentos, setMomentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalMomentos: 0,
        totalViews: 0,
        totalLikes: 0
    });

    useEffect(() => {
        if (user) {
            fetchUserMomentos();
        }
    }, [user]);

    const fetchUserMomentos = async () => {
        try {
            setLoading(true);
            const response = await momentosService.listar({ usuario: user.username });
            const data = response.data || [];
            setMomentos(Array.isArray(data) ? data : []);

            // Calcular estatísticas
            const totalViews = data.reduce((sum, m) => sum + (m.views || 0), 0);
            const totalLikes = data.reduce((sum, m) => sum + (m.total_likes || 0), 0);

            setStats({
                totalMomentos: data.length,
                totalViews,
                totalLikes
            });
        } catch (error) {
            console.error('Erro ao carregar momentos do usuário:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (momentoId) => {
        setMomentos(prevMomentos => prevMomentos.filter(m => m.id !== momentoId));
        setStats(prev => ({
            ...prev,
            totalMomentos: prev.totalMomentos - 1
        }));
    };

    if (!user) {
        navigate('/login');
        return null;
    }

    return (
        <>
            <Header user={user} onLogout={logout} />

            <div className="profile-container">
                <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                    {/* Perfil Header */}
                    <div className="profile-header">
                        <div className="profile-info">
                            <img
                                src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=3B82F6&color=fff&size=120`}
                                alt={user.username}
                                className="profile-avatar"
                            />
                            <div className="profile-details">
                                <h1 className="profile-username">{user.username}</h1>
                                <p className="profile-email">{user.email}</p>
                                {user.bio && <p className="profile-bio">{user.bio}</p>}
                                <p className="profile-joined">
                                    Membro desde {new Date(user.created_at).toLocaleDateString('pt-BR', {
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>

                        <button className="btn-edit-profile" onClick={() => alert('Funcionalidade de edição em desenvolvimento!')}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Editar Perfil
                        </button>
                    </div>

                    {/* Estatísticas */}
                    <div className="profile-stats">
                        <div className="stat-card">
                            <svg className="stat-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M23 7l-7 5 7 5V7z" fill="currentColor" />
                                <rect x="1" y="5" width="15" height="14" rx="2" />
                            </svg>
                            <div className="stat-content">
                                <p className="stat-value">{stats.totalMomentos}</p>
                                <p className="stat-label">Momentos</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <svg className="stat-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="12" cy="12" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="stat-content">
                                <p className="stat-value">{stats.totalViews.toLocaleString('pt-BR')}</p>
                                <p className="stat-label">Visualizações</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <svg className="stat-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="stat-content">
                                <p className="stat-value">{stats.totalLikes.toLocaleString('pt-BR')}</p>
                                <p className="stat-label">Curtidas</p>
                            </div>
                        </div>
                    </div>

                    {/* Meus Momentos */}
                    <div className="profile-section">
                        <h2 className="section-title">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M23 7l-7 5 7 5V7z" fill="currentColor" />
                                <rect x="1" y="5" width="15" height="14" rx="2" />
                            </svg>
                            Meus Momentos
                        </h2>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                                <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                            </div>
                        ) : momentos.length > 0 ? (
                            <div className="grid grid-cols-3">
                                {momentos.map((momento) => (
                                    <MomentoCard
                                        key={momento.id}
                                        momento={{
                                            ...momento,
                                            thumbnail: momento.thumbnail || 'https://via.placeholder.com/400x300?text=Sem+Thumbnail',
                                            duracao: formatDuration(momento.duracao),
                                            data: momento.created_at,
                                            likes: momento.total_likes,
                                            usuario: momento.usuario
                                        }}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <svg className="empty-icon" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M23 7l-7 5 7 5V7z" fill="currentColor" />
                                    <rect x="1" y="5" width="15" height="14" rx="2" />
                                </svg>
                                <h3 className="empty-title">Nenhum momento ainda</h3>
                                <p className="empty-text">
                                    Comece a capturar seus melhores momentos!
                                </p>
                                <button
                                    onClick={() => navigate('/capture')}
                                    className="btn btn-primary"
                                    style={{ marginTop: '1rem' }}
                                >
                                    Capturar Primeiro Momento
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

// Função auxiliar para formatar duração
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default Profile; 