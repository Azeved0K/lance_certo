import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { momentosService } from '../../services/api';
import '../../styles/components/MomentoCard.css';

const MomentoCard = ({ momento, onLike, onDelete }) => {
    const { user } = useAuth();
    const [liked, setLiked] = useState(momento.is_liked || false);
    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isOwner = user && momento.usuario && user.id === momento.usuario.id;

    // ✅ Construir URL completa do vídeo
    const getVideoUrl = () => {
        if (!momento.video) return null;
        
        // Se já for uma URL completa, retornar como está
        if (momento.video.startsWith('http')) {
            return momento.video;
        }
        
        // Caso contrário, construir URL completa
        const baseUrl = 'http://localhost:8000';
        const videoPath = momento.video.startsWith('/') ? momento.video : `/${momento.video}`;
        return `${baseUrl}${videoPath}`;
    };

    const handleLike = async () => {
        try {
            if (!liked) {
                await momentosService.like(momento.id);
            } else {
                await momentosService.unlike(momento.id);
            }
            setLiked(!liked);
            if (onLike) {
                onLike(momento.id, !liked);
            }
        } catch (error) {
            console.error('Erro ao curtir/descurtir:', error);
        }
    };

    const handleDelete = async () => {
        if (isDeleting) return;

        try {
            setIsDeleting(true);
            await momentosService.deletar(momento.id);
            
            if (onDelete) {
                onDelete(momento.id);
            }
            
            setShowDeleteModal(false);
        } catch (error) {
            console.error('Erro ao deletar:', error);
            alert('Erro ao deletar momento: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDownload = async (e) => {
        e.stopPropagation(); // Prevenir abertura do modal
        
        const videoUrl = getVideoUrl();
        
        if (!videoUrl) {
            alert('Vídeo não disponível para download');
            return;
        }

        try {
            // Fazer fetch do vídeo
            const response = await fetch(videoUrl);
            const blob = await response.blob();
            
            // Criar URL temporária do blob
            const blobUrl = window.URL.createObjectURL(blob);
            
            // Criar link temporário para download
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${momento.titulo.replace(/[^a-z0-9]/gi, '_')}.webm`;
            document.body.appendChild(link);
            link.click();
            
            // Limpar
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            
            console.log('Download iniciado com sucesso!');
        } catch (error) {
            console.error('Erro ao baixar vídeo:', error);
            
            // Fallback: abrir em nova aba
            window.open(videoUrl, '_blank');
        }
    };

    const handleOpenVideo = (e) => {
        // Não abrir se clicou em botões, links ou menu
        if (
            e.target.closest('.actionBtn') || 
            e.target.closest('.menuBtn') ||
            e.target.closest('.cardDropdown') ||
            e.target.closest('button')
        ) {
            return;
        }
        
        const videoUrl = getVideoUrl();
        if (videoUrl) {
            setShowVideoModal(true);
        } else {
            alert('Vídeo não disponível');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
    };

    const formatViews = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    return (
        <>
            <div className="card" onClick={handleOpenVideo}>
                {/* Thumbnail */}
                <div className="thumbnail">
                    <img src={momento.thumbnail} alt={momento.titulo} />
                    <div className="overlay">
                        <svg className="playIcon" width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" fill="white" opacity="0.9" />
                            <path d="M10 8l6 4-6 4V8z" fill="#3B82F6" />
                        </svg>
                    </div>
                    <div className="duration">{momento.duracao}</div>
                    
                    {/* Tags */}
                    {momento.tags && momento.tags.length > 0 && (
                        <div className="tags">
                            {momento.tags.slice(0, 2).map((tag, index) => (
                                <span key={index} className="tag">
                                    {typeof tag === 'string' ? tag : tag.nome}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Menu de opções (apenas para o dono) */}
                    {isOwner && (
                        <div className="cardMenu">
                            <button
                                className="menuBtn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(!showMenu);
                                }}
                                title="Opções"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <circle cx="12" cy="12" r="1" strokeWidth="2" fill="currentColor" />
                                    <circle cx="12" cy="5" r="1" strokeWidth="2" fill="currentColor" />
                                    <circle cx="12" cy="19" r="1" strokeWidth="2" fill="currentColor" />
                                </svg>
                            </button>

                            {showMenu && (
                                <div className="cardDropdown" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                        className="cardDropdownItem" 
                                        onClick={(e) => {
                                            setShowMenu(false);
                                            handleDownload(e);
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Baixar Vídeo
                                    </button>
                                    <button 
                                        className="cardDropdownItem danger" 
                                        onClick={() => {
                                            setShowMenu(false);
                                            setShowDeleteModal(true);
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Deletar
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="content">
                    <h3 className="title">{momento.titulo}</h3>
                    <p className="description">{momento.descricao}</p>

                    {/* User */}
                    <div className="user">
                        <img
                            src={momento.usuario?.avatar || `https://ui-avatars.com/api/?name=${momento.usuario?.username || momento.usuario?.nome}&background=3B82F6&color=fff`}
                            alt={momento.usuario?.username || momento.usuario?.nome}
                            className="avatar"
                        />
                        <span className="username">{momento.usuario?.username || momento.usuario?.nome}</span>
                        <span className="date">{formatDate(momento.data || momento.created_at)}</span>
                    </div>

                    {/* Stats */}
                    <div className="stats">
                        <div className="statsLeft">
                            <div className="stat">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="12" cy="12" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>{formatViews(momento.views)}</span>
                            </div>
                            <div className="stat">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>{(momento.likes || momento.total_likes || 0) + (liked && !momento.is_liked ? 1 : 0)}</span>
                            </div>
                        </div>

                        <div className="actions">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleLike();
                                }}
                                className={`actionBtn ${liked ? 'liked' : ''}`}
                                title={liked ? 'Descurtir' : 'Curtir'}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            {/* ✅ ÍCONE DE COMPARTILHAR RESTAURADO, mas função de download */}
                            <button 
                                className="actionBtn" 
                                title="Baixar Vídeo" 
                                onClick={handleDownload}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <circle cx="18" cy="5" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="6" cy="12" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="18" cy="19" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de confirmação de exclusão */}
            {showDeleteModal && (
                <div className="modal" onClick={() => !isDeleting && setShowDeleteModal(false)}>
                    <div className="modalContent" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modalTitle">Deletar Momento?</h3>
                        <p className="modalText">
                            Tem certeza que deseja deletar "<strong>{momento.titulo}</strong>"? 
                            Esta ação não pode ser desfeita.
                        </p>
                        <div className="modalActions">
                            <button 
                                className="btn btn-outline" 
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                            >
                                Cancelar
                            </button>
                            <button 
                                className="btn btn-danger" 
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deletando...' : 'Deletar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de reprodução de vídeo */}
            {showVideoModal && (
                <div className="videoModal" onClick={() => setShowVideoModal(false)}>
                    <div className="videoModalContent" onClick={(e) => e.stopPropagation()}>
                        <button 
                            className="videoModalClose" 
                            onClick={() => setShowVideoModal(false)}
                            title="Fechar"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round" />
                                <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                        
                        <video 
                            src={getVideoUrl()} 
                            controls 
                            autoPlay
                            className="videoPlayer"
                            onError={(e) => {
                                console.error('Erro ao carregar vídeo:', e);
                                alert('Erro ao carregar o vídeo');
                            }}
                        />
                        
                        <div className="videoModalInfo">
                            <h3>{momento.titulo}</h3>
                            {momento.descricao && <p>{momento.descricao}</p>}
                            <div className="videoModalStats">
                                <span>👁️ {formatViews(momento.views)} visualizações</span>
                                <span>❤️ {momento.likes || momento.total_likes || 0} curtidas</span>
                                <span>📅 {formatDate(momento.data || momento.created_at)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MomentoCard;