import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/layout/Header';
import MomentoCard from '../components/gallery/MomentoCard';
import EditProfileModal from '../components/profile/EditProfileModal';
import { momentosService, authService } from '../services/api';
import api from '../services/api';
import '../styles/pages/Profile.css';

const Profile = () => {
    const navigate = useNavigate();
    const { username } = useParams();
    const { user, logout, checkAuth } = useAuth(); // 'user' é o usuário LOGADO
    const [profile, setProfile] = useState(null); // Estado para o perfil VISITADO
    const [momentos, setMomentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [stats, setStats] = useState({
        totalMomentos: 0,
        totalViews: 0,
        totalLikes: 0
    });

    // Verifica se o usuário logado é o dono deste perfil
    const isOwner = user && profile && user.id === profile.id;

    // Efeito para buscar dados do perfil (substitui o fetchUserMomentos)
    useEffect(() => {
        const fetchProfileData = async () => {
            if (!username) return;
            setLoading(true);
            try {
                // 1. Busca o usuário e seus momentos paginados
                const response = await authService.getPublicProfile(username);
                const data = response.data;

                setProfile(data.user); // Dados do usuário (bio, avatar, etc.)

                // 2. Extrai os momentos da resposta
                const momentosData = data.momentos.results || [];
                setMomentos(momentosData);

                // 3. Calcula estatísticas
                const totalViews = momentosData.reduce((sum, m) => sum + (m.views || 0), 0);
                const totalLikes = momentosData.reduce((sum, m) => sum + (m.total_likes || 0), 0);

                setStats({
                    totalMomentos: data.momentos.count || 0, // Usa o total da paginação
                    totalViews,
                    totalLikes
                });

            } catch (error) {
                console.error('Erro ao carregar perfil:', error);
                navigate('/'); // Se o perfil não existe, volta para a home
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [username, navigate]); // Roda sempre que o username na URL mudar

    const handleDelete = (momentoId) => {
        setMomentos(prevMomentos => prevMomentos.filter(m => m.id !== momentoId));
        setStats(prev => ({
            ...prev,
            totalMomentos: prev.totalMomentos - 1
        }));
    };

    const handleSaveProfile = async (formData) => {
        try {
            await api.patch('/auth/user/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            await checkAuth();

            // Recarrega os dados do perfil público (para o caso do username mudar, etc)
            // Mas para este caso, apenas o checkAuth() já atualiza o 'user'
            // O 'profile' pode ser atualizado manualmente se necessário
            setProfile(prev => ({ ...prev, ...Object.fromEntries(formData.entries()) }));

            alert('✅ Perfil atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            throw error;
        }
    };

    // Atualiza o estado de loading
    if (loading || !profile) {
        return (
            <>
                <Header />
                <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                </div>
            </>
        );
    }

    // Se o usuário logado não existir (deslogado)
    if (!user) {
        navigate('/login');
        return null;
    }

    return (
        <>
            <Header user={user} onLogout={logout} />

            <div className="profile-container">
                <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                    {/* Perfil Header - USA DADOS DO 'profile' */}
                    <div className="profile-header">
                        <div className="profile-info">
                            <img
                                src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.username}&background=3B82F6&color=fff&size=120`}
                                alt={profile.username}
                                className="profile-avatar"
                            />
                            <div className="profile-details">
                                <h1 className="profile-username">
                                    {profile.first_name || profile.last_name ?
                                        `${profile.first_name || ''} ${profile.last_name || ''}`.trim() :
                                        profile.username
                                    }
                                </h1>
                                <p className="profile-email">{profile.email}</p>
                                {profile.bio && <p className="profile-bio">{profile.bio}</p>}
                                <p className="profile-joined">
                                    Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR', {
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* MOSTRA BOTÃO APENAS SE FOR O DONO */}
                        {isOwner && (
                            <button
                                className="btn-edit-profile"
                                onClick={() => setShowEditModal(true)}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Editar Perfil
                            </button>
                        )}
                    </div>

                    {/* Estatísticas - USA DADOS DO 'stats' */}
                    <div className="profile-stats">
                        <div className="stat-card">
                            <svg className="stat-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M23 7l-7 5 7 5V7z" fill="currentColor"/>
                                <rect x="1" y="5" width="15" height="14" rx="2"/>
                            </svg>
                            <div className="stat-content">
                                <div className="stat-value">{stats.totalMomentos}</div>
                                <div className="stat-label">Momentos</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <svg className="stat-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <circle cx="12" cy="12" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <div className="stat-content">
                                <div className="stat-value">{stats.totalViews}</div>
                                <div className="stat-label">Visualizações</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <svg className="stat-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <div className="stat-content">
                                <div className="stat-value">{stats.totalLikes}</div>
                                <div className="stat-label">Curtidas</div>
                            </div>
                        </div>
                    </div>

                    {/* Meus Momentos - USA DADOS DO 'momentos' */}
                    <div className="profile-section">
                        <h2 className="section-title">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M23 7l-7 5 7 5V7z" fill="currentColor" />
                                <rect x="1" y="5" width="15" height="14" rx="2" />
                            </svg>
                            {/* Texto dinâmico */}
                            {isOwner ? 'Meus Momentos' : `Momentos de ${profile.username}`}
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
                                            usuario: momento.usuario // Passa o objeto de usuário do momento
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

            {/* O modal só é renderizado se for o dono */}
            {isOwner && (
                <EditProfileModal
                    user={user} // Passa o usuário logado (user) para edição
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    onSave={handleSaveProfile}
                />
            )}
        </>
    );
};

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default Profile;