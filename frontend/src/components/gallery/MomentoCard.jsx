import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { momentosService } from '../../services/api';
import '../../styles/components/MomentoCard.css';

const MomentoCard = ({ momento, onLike, onDelete }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [liked, setLiked] = useState(momento.is_liked || false);
    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [editForm, setEditForm] = useState({
        titulo: momento.titulo || '',
        descricao: momento.descricao || '',
        tags: momento.tags ? momento.tags.map(t => typeof t === 'string' ? t : t.nome).join(', ') : ''
    });

    const isOwner = user && momento.usuario && user.id === momento.usuario.id;

    // URL do vídeo
    const getVideoUrl = () => momento.video || null;

    const handleLike = async () => {
        try {
            if (!liked) {
                await momentosService.like(momento.id);
            } else {
                await momentosService.unlike(momento.id);
            }
            setLiked(!liked);
            if (onLike) onLike(momento.id, !liked);
        } catch (error) {
            console.error('Erro ao curtir/descurtir:', error);
        }
    };

    const handleDelete = async () => {
        if (isDeleting) return;
        try {
            setIsDeleting(true);
            await momentosService.deletar(momento.id);
            if (onDelete) onDelete(momento.id);
            setShowDeleteModal(false);
        } catch (error) {
            console.error('Erro ao deletar:', error);
            alert('Erro ao deletar momento: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        if (isEditing) return;
        try {
            setIsEditing(true);
            const updateData = {
                titulo: editForm.titulo.trim(),
                descricao: editForm.descricao.trim(),
                tags: editForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
            };
            if (!updateData.titulo) {
                alert('O título não pode estar vazio');
                setIsEditing(false);
                return;
            }
            await momentosService.atualizar(momento.id, updateData);
            momento.titulo = updateData.titulo;
            momento.descricao = updateData.descricao;
            momento.tags = updateData.tags.map(nome => ({ nome }));
            alert('Momento atualizado com sucesso! ✅');
            setShowEditModal(false);
            window.location.reload();
        } catch (error) {
            console.error('Erro ao editar:', error);
            alert('Erro ao editar momento: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsEditing(false);
        }
    };

    const handleOpenEditModal = () => {
        setEditForm({
            titulo: momento.titulo || '',
            descricao: momento.descricao || '',
            tags: momento.tags ? momento.tags.map(t => typeof t === 'string' ? t : t.nome).join(', ') : ''
        });
        setShowMenu(false);
        setShowEditModal(true);
    };

    const handleDownload = async (e) => {
        e.stopPropagation();
        const videoUrl = getVideoUrl();
        if (!videoUrl) {
            alert('Vídeo não disponível para download');
            return;
        }
        try {
            const response = await fetch(videoUrl);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${momento.titulo.replace(/[^a-z0-9]/gi, '_')}.webm`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            console.log('Download iniciado com sucesso!');
        } catch (error) {
            console.error('Erro ao baixar vídeo:', error);
            window.open(videoUrl, '_blank');
        }
    };

    // Navegar para página de vídeo
    const handleOpenVideo = async (e) => {
        // Prevenir navegação se clicar em botões/ações
        if (e.target.closest('.actionBtn') ||
            e.target.closest('.menuBtn') ||
            e.target.closest('.cardDropdown') ||
            e.target.closest('button') ||
            e.target.closest('.user-link')) {
            return;
        }

        const videoUrl = getVideoUrl();
        if (videoUrl) {
            // Navegar para a página de vídeo
            navigate(`/video/${momento.id}`);
        } else {
            alert('Vídeo não disponível');
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
        <>
            <div className="card" onClick={handleOpenVideo}>
                <div className="thumbnail">
                    <img src={momento.thumbnail} alt={momento.titulo} />
                    <div className="overlay">
                        <svg className="playIcon" width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" fill="white" opacity="0.9" />
                            <path d="M10 8l6 4-6 4V8z" fill="#3B82F6" />
                        </svg>
                    </div>
                    <div className="duration">{momento.duracao}</div>
                    {momento.tags && momento.tags.length > 0 && (
                        <div className="tags">
                            {momento.tags.slice(0, 2).map((tag, index) => (
                                <span key={index} className="tag">{typeof tag === 'string' ? tag : tag.nome}</span>
                            ))}
                        </div>
                    )}
                    {isOwner && (
                        <div className="cardMenu">
                            <button className="menuBtn" onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} title="Opções">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <circle cx="12" cy="12" r="1" strokeWidth="2" fill="currentColor" />
                                    <circle cx="12" cy="5" r="1" strokeWidth="2" fill="currentColor" />
                                    <circle cx="12" cy="19" r="1" strokeWidth="2" fill="currentColor" />
                                </svg>
                            </button>
                            {showMenu && (
                                <div className="cardDropdown" onClick={(e) => e.stopPropagation()}>
                                    <button className="cardDropdownItem" onClick={handleOpenEditModal}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Editar
                                    </button>
                                    <button className="cardDropdownItem danger" onClick={() => { setShowMenu(false); setShowDeleteModal(true); }}>
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
                <div className="content">
                    <h3 className="title">{momento.titulo}</h3>
                    <p className="description">{momento.descricao}</p>

                    {/* DIV .user MELHORADA */}
                    <div className="user">
                        <Link
                            to={`/profile/${momento.usuario?.username}`}
                            onClick={(e) => e.stopPropagation()}
                            className="user-link"
                            title={`Ver perfil de ${momento.usuario?.username}`}
                        >
                            <img
                                src={momento.usuario?.avatar || `https://ui-avatars.com/api/?name=${momento.usuario?.username || momento.usuario?.nome}&background=3B82F6&color=fff&size=80`}
                                alt={momento.usuario?.username || momento.usuario?.nome}
                                className="user-avatar"
                            />
                            <div className="user-info">
                                <span className="user-name">
                                    {momento.usuario?.first_name || momento.usuario?.last_name ?
                                        `${momento.usuario.first_name || ''} ${momento.usuario.last_name || ''}`.trim() :
                                        (momento.usuario?.username || momento.usuario?.nome)
                                    }
                                </span>
                                <span className="user-date">{formatDate(momento.data || momento.created_at)}</span>
                            </div>
                        </Link>
                    </div>

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
                            <button onClick={(e) => { e.stopPropagation(); handleLike(); }} className={`actionBtn ${liked ? 'liked' : ''}`} title={liked ? 'Descurtir' : 'Curtir'}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            <button className="actionBtn" title="Baixar Vídeo" onClick={handleDownload}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <polyline points="7 10 12 15 17 10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <line x1="12" y1="15" x2="12" y2="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Exclusão */}
            {showDeleteModal && (
                <div className="modal" onClick={() => !isDeleting && setShowDeleteModal(false)}>
                    <div className="modalContent" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modalTitle">Deletar Momento?</h3>
                        <p className="modalText">Tem certeza que deseja deletar "<strong>{momento.titulo}</strong>"? Esta ação não pode ser desfeita.</p>
                        <div className="modalActions">
                            <button className="btn btn-outline" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>Cancelar</button>
                            <button className="btn btn-danger" onClick={handleDelete} disabled={isDeleting}>{isDeleting ? 'Deletando...' : 'Deletar'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Edição */}
            {showEditModal && (
                <div className="modal" onClick={() => !isEditing && setShowEditModal(false)}>
                    <div className="editModalContent" onClick={(e) => e.stopPropagation()}>
                        <div className="editModalHeader">
                            <h3 className="modalTitle">Editar Momento</h3>
                            <button className="modalCloseBtn" onClick={() => setShowEditModal(false)} disabled={isEditing} title="Fechar">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round" />
                                    <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleEdit} className="editForm">
                            <div className="formGroup">
                                <label className="formLabel">Título *</label>
                                <input type="text" className="formInput" value={editForm.titulo} onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })} placeholder="Ex: Gol incrível no último minuto" required maxLength={200} disabled={isEditing} />
                                <span className="formHint">{editForm.titulo.length}/200 caracteres</span>
                            </div>
                            <div className="formGroup">
                                <label className="formLabel">Descrição</label>
                                <textarea className="formTextarea" value={editForm.descricao} onChange={(e) => setEditForm({ ...editForm, descricao: e.target.value })} placeholder="Conte mais sobre este lance..." rows={4} maxLength={1000} disabled={isEditing} />
                                <span className="formHint">{editForm.descricao.length}/1000 caracteres</span>
                            </div>
                            <div className="formGroup">
                                <label className="formLabel">Tags</label>
                                <input type="text" className="formInput" value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} placeholder="Ex: futebol, gol, brasil" disabled={isEditing} />
                                <span className="formHint">Separe as tags por vírgula</span>
                            </div>
                            <div className="modalActions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)} disabled={isEditing}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" disabled={isEditing}>
                                    {isEditing ? <><svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="3" strokeLinecap="round" /></svg>Salvando...</> : 'Salvar Alterações'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default MomentoCard;