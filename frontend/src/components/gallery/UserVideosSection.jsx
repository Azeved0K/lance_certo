import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MomentoCard from './MomentoCard';
import { momentosService } from '../../services/api';

const UserVideosSection = ({ user }) => {
    const [userMomentos, setUserMomentos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchUserMomentos();
        }
    }, [user]);

    const fetchUserMomentos = async () => {
        try {
            setLoading(true);
            const response = await momentosService.listar({
                usuario: user.username,
                sort: 'recent'
            });
            const data = response.data || [];
            // Pegar apenas os 3 mais recentes
            setUserMomentos(Array.isArray(data) ? data.slice(0, 3) : []);
        } catch (error) {
            console.error('Erro ao carregar seus vídeos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (momentoId) => {
        setUserMomentos(prev => prev.filter(m => m.id !== momentoId));
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Não mostrar se não tiver vídeos
    if (!loading && userMomentos.length === 0) {
        return null;
    }

    return (
        <div className="user-videos-section">
            <div className="user-videos-header">
                <div className="user-videos-title-wrapper">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M23 7l-7 5 7 5V7z" fill="currentColor" />
                        <rect x="1" y="5" width="15" height="14" rx="2" />
                    </svg>
                    <h2 className="user-videos-title">Seus Vídeos</h2>
                    <span className="user-videos-count">({userMomentos.length})</span>
                </div>
                <Link to="/profile" className="view-all-link">
                    Ver todos
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </Link>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                </div>
            ) : (
                <div className="user-videos-grid">
                    {userMomentos.map((momento) => (
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
            )}
        </div>
    );
};

export default UserVideosSection;