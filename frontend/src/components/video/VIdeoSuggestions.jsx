import { Link } from 'react-router-dom';

const VideoSuggestions = ({ sugestoes, currentVideoId }) => {
    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatViews = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoje';
        if (diffDays === 1) return 'Ontem';
        if (diffDays < 7) return `${diffDays} dias atrás`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;
        return `${Math.floor(diffDays / 365)} anos atrás`;
    };

    if (!sugestoes || sugestoes.length === 0) {
        return (
            <div className="video-suggestions">
                <div className="suggestions-header">
                    <h2>Sugestões</h2>
                </div>
                <div className="suggestions-empty">
                    <p>Nenhuma sugestão disponível</p>
                </div>
            </div>
        );
    }

    return (
        <div className="video-suggestions">
            <div className="suggestions-header">
                <h2>Sugestões</h2>
                <span className="suggestions-count">({sugestoes.length})</span>
            </div>

            <div className="suggestions-list">
                {sugestoes.map((sugestao) => (
                    <Link
                        key={sugestao.id}
                        to={`/video/${sugestao.id}`}
                        className={`suggestion-card ${sugestao.id === parseInt(currentVideoId) ? 'current' : ''}`}
                    >
                        {/* Thumbnail */}
                        <div className="suggestion-thumbnail">
                            <img
                                src={sugestao.thumbnail || 'https://via.placeholder.com/168x94?text=No+Thumbnail'}
                                alt={sugestao.titulo}
                            />
                            <span className="suggestion-duration">
                                {formatDuration(sugestao.duracao)}
                            </span>
                        </div>

                        {/* Informações */}
                        <div className="suggestion-info">
                            <h3 className="suggestion-title">{sugestao.titulo}</h3>

                            <div className="suggestion-meta">
                                <span className="suggestion-uploader">
                                    {/* CORREÇÃO DO NOME DO UPLOADER */}
                                    {sugestao.usuario?.first_name || sugestao.usuario?.last_name ?
                                        `${sugestao.usuario.first_name || ''} ${sugestao.usuario.last_name || ''}`.trim() :
                                        sugestao.usuario?.username
                                    }
                                </span>

                                <div className="suggestion-stats">
                                    <span>{formatViews(sugestao.views)} views</span>
                                    <span className="meta-divider">•</span>
                                    <span>{formatDate(sugestao.created_at)}</span>
                                </div>
                            </div>

                            {/* Tags (primeiras 2) */}
                            {sugestao.tags && sugestao.tags.length > 0 && (
                                <div className="suggestion-tags">
                                    {sugestao.tags.slice(0, 2).map((tag, index) => (
                                        <span key={index} className="suggestion-tag">
                                            #{typeof tag === 'string' ? tag : tag.nome}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Badge "Assistindo Agora" */}
                        {sugestao.id === parseInt(currentVideoId) && (
                            <div className="current-badge">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                                Assistindo
                            </div>
                        )}
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default VideoSuggestions;