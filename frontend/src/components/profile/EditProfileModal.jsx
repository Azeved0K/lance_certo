import { useState, useRef } from 'react';
import '../../styles/components/EditProfileModal.css';

const EditProfileModal = ({ user, isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        bio: user?.bio || '',
        data_nascimento: user?.data_nascimento || '',
        is_private: user?.is_private || false,
        avatar: null
    });
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setError('');
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // ✅ ATUALIZADO: Validar tamanho (máx 25MB ao invés de 5MB)
            if (file.size > 25 * 1024 * 1024) {
                setError('A imagem deve ter no máximo 25MB');
                return;
            }

            // Validar tipo
            if (!file.type.startsWith('image/')) {
                setError('Por favor, selecione uma imagem válida');
                return;
            }

            setFormData(prev => ({ ...prev, avatar: file }));

            // Preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveAvatar = () => {
        setFormData(prev => ({ ...prev, avatar: null }));
        setAvatarPreview(user?.avatar || null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const updateData = new FormData();

            // Adicionar campos de texto
            if (formData.first_name !== user?.first_name) {
                updateData.append('first_name', formData.first_name);
            }
            if (formData.last_name !== user?.last_name) {
                updateData.append('last_name', formData.last_name);
            }
            if (formData.bio !== user?.bio) {
                updateData.append('bio', formData.bio);
            }
            if (formData.data_nascimento !== user?.data_nascimento) {
                updateData.append('data_nascimento', formData.data_nascimento);
            }

            // Adicionar campo de privacidade
            if (formData.is_private !== user?.is_private) {
                updateData.append('is_private', formData.is_private.toString());
            }

            // Adicionar avatar se foi alterado
            if (formData.avatar instanceof File) {
                updateData.append('avatar', formData.avatar);
            }

            await onSave(updateData);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao salvar perfil');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="edit-profile-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">✏️ Editar Perfil</h2>
                    <button
                        className="modal-close-btn"
                        onClick={onClose}
                        disabled={loading}
                        title="Fechar"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" />
                            <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" />
                        </svg>
                    </button>
                </div>

                {error && (
                    <div className="error-alert">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" strokeWidth="2" />
                            <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
                            <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="edit-profile-form">
                    {/* Avatar */}
                    <div className="avatar-section">
                        <div className="avatar-preview">
                            <img
                                src={avatarPreview || `https://ui-avatars.com/api/?name=${user?.username}&background=3B82F6&color=fff&size=150`}
                                alt="Avatar Preview"
                                className="avatar-image"
                            />
                            <button
                                type="button"
                                className="avatar-edit-btn"
                                onClick={handleAvatarClick}
                                disabled={loading}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" strokeWidth="2" />
                                    <circle cx="12" cy="13" r="4" strokeWidth="2" />
                                </svg>
                            </button>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            style={{ display: 'none' }}
                        />
                        <div className="avatar-actions">
                            <button
                                type="button"
                                className="btn-change-avatar"
                                onClick={handleAvatarClick}
                                disabled={loading}
                            >
                                📸 Alterar Foto
                            </button>
                            {avatarPreview && (
                                <button
                                    type="button"
                                    className="btn-remove-avatar"
                                    onClick={handleRemoveAvatar}
                                    disabled={loading}
                                >
                                    🗑️ Remover
                                </button>
                            )}
                        </div>
                        {/* ✅ ATUALIZADO: Mensagem com novo limite */}
                        <p className="avatar-hint">JPG, PNG ou GIF. Máximo 25MB.</p>
                    </div>

                    {/* Nome e Sobrenome */}
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Nome</label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="Seu nome"
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Sobrenome</label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="Seu sobrenome"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="form-group">
                        <label className="form-label">
                            Bio
                            <span className="char-count">
                                {formData.bio.length}/500
                            </span>
                        </label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            className="form-textarea"
                            placeholder="Conte um pouco sobre você..."
                            rows={4}
                            maxLength={500}
                            disabled={loading}
                        />
                        <p className="form-hint">
                            Compartilhe seus interesses, hobbies ou uma frase que te representa
                        </p>
                    </div>

                    {/* Data de Nascimento */}
                    <div className="form-group">
                        <label className="form-label">Data de Nascimento</label>
                        <input
                            type="date"
                            name="data_nascimento"
                            value={formData.data_nascimento}
                            onChange={handleChange}
                            className="form-input"
                            max={new Date().toISOString().split('T')[0]}
                            disabled={loading}
                        />
                        <p className="form-hint">Esta informação não será exibida publicamente</p>
                    </div>

                    {/* Perfil Privado Toggle */}
                    <div className="form-group" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid var(--gray-200)',
                        paddingTop: '1.5rem',
                        marginBottom: '0.5rem'
                    }}>
                        <div>
                            <label className="form-label" style={{ marginBottom: '0' }}>Perfil Privado</label>
                            <p className="form-hint" style={{ marginTop: '0.375rem' }}>Se ativado, outros usuários não verão seu perfil ou vídeos.</p>
                        </div>
                        <input
                            type="checkbox"
                            name="is_private"
                            checked={formData.is_private}
                            onChange={handleChange}
                            style={{
                                width: '20px',
                                height: '20px',
                                accentColor: 'var(--primary-color)'
                            }}
                            disabled={loading}
                        />
                    </div>

                    {/* Ações */}
                    <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <svg className="spinner" width="16" height="16" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                                    </svg>
                                    Salvando...
                                </>
                            ) : (
                                '💾 Salvar Alterações'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;