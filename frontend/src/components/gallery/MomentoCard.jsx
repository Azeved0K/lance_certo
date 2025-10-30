import { useState } from 'react';
import styles from '../../styles/components/MomentoCard.module.css';

const MomentoCard = ({ momento, onLike }) => {
    const [liked, setLiked] = useState(false);

    const handleLike = () => {
        setLiked(!liked);
        if (onLike) {
            onLike(momento.id, !liked);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatViews = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    return (
        <div className={styles.card}>
            {/* Thumbnail */}
            <div className={styles.thumbnail}>
                <img src={momento.thumbnail} alt={momento.titulo} />
                <div className={styles.overlay}>
                    <svg className={styles.playIcon} width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="white" opacity="0.9" />
                        <path d="M10 8l6 4-6 4V8z" fill="#3B82F6" />
                    </svg>
                </div>
                <div className={styles.duration}>{momento.duracao}</div>
                {momento.tags && momento.tags.length > 0 && (
                    <div className={styles.tags}>
                        {momento.tags.slice(0, 2).map((tag, index) => (
                            <span key={index} className={styles.tag}>{tag}</span>
                        ))}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className={styles.content}>
                <h3 className={styles.title}>{momento.titulo}</h3>
                <p className={styles.description}>{momento.descricao}</p>

                {/* User */}
                <div className={styles.user}>
                    <img
                        src={momento.usuario?.avatar || `https://ui-avatars.com/api/?name=${momento.usuario?.nome}&background=3B82F6&color=fff`}
                        alt={momento.usuario?.nome}
                        className={styles.avatar}
                    />
                    <span className={styles.username}>{momento.usuario?.nome}</span>
                    <span className={styles.date}>{formatDate(momento.data)}</span>
                </div>

                {/* Stats */}
                <div className={styles.stats}>
                    <div className={styles.statsLeft}>
                        <div className={styles.stat}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" />
                                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <span>{formatViews(momento.views)}</span>
                        </div>
                        <div className={styles.stat}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'}>
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <span>{momento.likes + (liked ? 1 : 0)}</span>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button
                            onClick={handleLike}
                            className={`${styles.actionBtn} ${liked ? styles.liked : ''}`}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'}>
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </button>
                        <button className={styles.actionBtn}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2" />
                                <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                                <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2" />
                                <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MomentoCard;