// frontend/src/pages/VideoPlayer.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/layout/Header';
import VideoSuggestions from '../components/video/VideoSuggestions';
import { momentosService } from '../services/api';
import '../styles/pages/VideoPlayer.css';

const VideoPlayer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const videoRef = useRef(null);

    const [momento, setMomento] = useState(null);
    const [sugestoes, setSugestoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(false);
    const [viewIncremented, setViewIncremented] = useState(false);

    useEffect(() => {
        fetchMomento();
        fetchSugestoes();
    }, [id]);

    const fetchMomento = async () => {
        try {
            setLoading(true);
            const response = await momentosService.buscar(id);
            setMomento(response.data);
            setLiked(response.data.is_liked || false);
        } catch (error) {
            console.error('Erro ao buscar momento:', error);
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const fetchSugestoes = async () => {
        try {
            // Ajuste: A API de sugestões não foi implementada no backend.
            // Vamos buscar momentos recentes como sugestão, excluindo o atual.
            const response = await momentosService.listar({sort: 'recent', page_size: 10});
            const allMomentos = response.data?.results || [];
            // Filtra o momento atual da lista de sugestões
            setSugestoes(allMomentos.filter(m => m.id !== parseInt(id, 10)));
        } catch (error) {
            console.error('Erro ao buscar sugestões:', error);
        }
    };

    const handleVideoPlay = async () => {
        if (!viewIncremented) {
            try {
                await momentosService.incrementarView(id);
                setViewIncremented(true);
                console.log('✅ View incrementada');
            } catch (error) {
                console.error('Erro ao incrementar view:', error);
            }
        }
    };

    const handleLike = async () => {
        if (!user) {
            alert('Faça login para curtir!');
            return;
        }

        try {
            if (!liked) {
                await momentosService.like(id);
            } else {
                await momentosService.unlike(id);
            }
            setLiked(!liked);
            // Atualizar contagem
            setMomento(prev => ({
                ...prev,
                total_likes: liked ? prev.total_likes - 1 : prev.total_likes + 1
            }));
        } catch (error) {
            console.error('Erro ao curtir:', error);
        }
    };

    const formatViews = (num) => {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <>
                <Header/>
                <div className="video-player-loading">
                    <div className="loading-spinner"></div>
                </div>
            </>
        );
    }

    if (!momento) {
        return (
            <>
                <Header/>
                <div className="video-player-error">
                    <h2>Vídeo não encontrado</h2>
                    <Link to="/" className="btn btn-primary">Voltar ao Início</Link>
                </div>
            </>
        );
    }

    return (
        <>
            <Header/>

            <div className="video-player-container">
                <div className="container-fluid">
                    <div className="video-player-layout">
                        {/* ===== COLUNA PRINCIPAL: VÍDEO ===== */}
                        <div className="video-player-main">
                            {/* Player de Vídeo */}
                            <div className="video-wrapper">
                                <video
                                    ref={videoRef}
                                    src={momento.video}
                                    controls
                                    autoPlay
                                    className="video-element"
                                    onPlay={handleVideoPlay}
                                />
                            </div>

                            {/* Informações do Vídeo */}
                            <div className="video-info">
                                {/* Título */}
                                <h1 className="video-title">{momento.titulo}</h1>

                                {/* Stats e Ações */}
                                <div className="video-stats-actions">
                                    <div className="video-stats">
                                        <div className="stat-item">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2"/>
                                                <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                                            </svg>
                                            <span>{formatViews(momento.views)} visualizações</span>
                                        </div>

                                        <div className="stat-item">
                                            <span className="stat-divider">•</span>
                                            <span>{formatDate(momento.created_at)}</span>
                                        </div>
                                    </div>

                                    <div className="video-actions">
                                        <button
                                            onClick={handleLike}
                                            className={`action-btn ${liked ? 'liked' : ''}`}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor">
                                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeWidth="2"/>
                                            </svg>
                                            <span>{formatViews(momento.total_likes)}</span>
                                        </button>

                                        <button className="action-btn">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <circle cx="18" cy="5" r="3" strokeWidth="2"/>
                                                <circle cx="6" cy="12" r="3" strokeWidth="2"/>
                                                <circle cx="18" cy="19" r="3" strokeWidth="2"/>
                                                <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" strokeWidth="2"/>
                                            </svg>
                                            <span>Compartilhar</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Informações do Uploader */}
                                <div className="video-uploader">
                                    <Link
                                        to={`/profile/${momento.usuario?.username}`}
                                        className="uploader-info-link"
                                    >
                                        <div className="uploader-info">
                                            <img
                                                src={momento.usuario?.avatar || `https://ui-avatars.com/api/?name=${momento.usuario?.username}&background=3B82F6&color=fff`}
                                                alt={momento.usuario?.username}
                                                className="uploader-avatar"
                                            />
                                            <div className="uploader-details">
                                                <h3 className="uploader-name">{momento.usuario?.username}</h3>
                                                <p className="uploader-stats">
                                                    {momento.usuario?.total_momentos} vídeos
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                </div>

                                {/* Descrição e Tags */}
                                <div className="video-description-box">
                                    {/* Tags */}
                                    {momento.tags && momento.tags.length > 0 && (
                                        <div className="video-tags">
                                            {momento.tags.map((tag, index) => (
                                                <Link
                                                    key={index}
                                                    to={`/?tag=${tag.slug || tag.nome}`}
                                                    className="video-tag"
                                                >
                                                    #{tag.nome}
                                                </Link>
                                            ))}
                                        </div>
                                    )}

                                    {/* Descrição */}
                                    {momento.descricao && (
                                        <div className="video-description">
                                            <p>{momento.descricao}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ===== SIDEBAR: SUGESTÕES ===== */}
                        <VideoSuggestions
                            sugestoes={sugestoes}
                            currentVideoId={id}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default VideoPlayer;