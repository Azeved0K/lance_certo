import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import styles from '../styles/pages/Capture.module.css';

const Capture = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const [isRecording, setIsRecording] = useState(false);
    const [recordedVideo, setRecordedVideo] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadData, setUploadData] = useState({
        titulo: '',
        descricao: '',
        tags: ''
    });

    // Simula início da gravação
    const handleStartRecording = () => {
        setIsRecording(true);
        // Futuramente: iniciar MediaRecorder
    };

    // Simula parar a gravação
    const handleStopRecording = () => {
        setIsRecording(false);
        // Simula vídeo gravado
        setRecordedVideo({
            url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=600&fit=crop',
            duration: '00:45'
        });
    };

    const handleOpenUpload = () => {
        setShowUploadModal(true);
    };

    const handleCloseModal = () => {
        setShowUploadModal(false);
        setUploadData({ titulo: '', descricao: '', tags: '' });
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        // Futuramente: enviar para API
        console.log('Upload:', uploadData);
        alert('Momento publicado com sucesso!');
        navigate('/');
    };

    const handleDiscard = () => {
        if (window.confirm('Descartar este momento?')) {
            setRecordedVideo(null);
        }
    };

    return (
        <>
            <Header user={user} onLogout={onLogout} />

            <div className={styles.container}>
                <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                    {/* Title */}
                    <div className={styles.header}>
                        <h1 className={styles.title}>🎥 Capturar Momento</h1>
                        <p className={styles.subtitle}>
                            Grave os últimos 60 segundos de ação ao vivo
                        </p>
                    </div>

                    {/* Capture Area */}
                    <div className={styles.captureCard}>
                        {!recordedVideo ? (
                            /* Recording Mode */
                            <>
                                <div className={styles.preview}>
                                    {isRecording && (
                                        <div className={styles.recordingBadge}>
                                            <div className={styles.recordingDot}></div>
                                            <span>GRAVANDO</span>
                                        </div>
                                    )}

                                    <div className={styles.placeholderContent}>
                                        <svg className={styles.cameraIcon} width="80" height="80" viewBox="0 0 24 24" fill="none">
                                            <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
                                            <circle cx="9" cy="12" r="2" stroke="currentColor" strokeWidth="2" />
                                            <path d="M15 9l4-2v10l-4-2" stroke="currentColor" strokeWidth="2" />
                                        </svg>
                                        <p className={styles.placeholderText}>
                                            {isRecording ? 'Capturando ao vivo...' : 'Pronto para capturar'}
                                        </p>
                                        <p className={styles.placeholderSmall}>
                                            (MediaRecorder API será implementada aqui)
                                        </p>
                                    </div>

                                    <div className={styles.bufferBadge}>Buffer: 60s</div>
                                </div>

                                <div className={styles.controls}>
                                    <div className={styles.controlsMain}>
                                        {!isRecording ? (
                                            <button onClick={handleStartRecording} className={styles.btnRecord}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                    <path d="M5 3l14 9-14 9V3z" fill="currentColor" />
                                                </svg>
                                                Iniciar Gravação
                                            </button>
                                        ) : (
                                            <button onClick={handleStopRecording} className={styles.btnStop}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                    <rect x="6" y="6" width="12" height="12" fill="currentColor" />
                                                </svg>
                                                Parar e Salvar
                                            </button>
                                        )}
                                    </div>

                                    <div className={styles.infoBox}>
                                        <h3 className={styles.infoTitle}>
                                            <span>💡</span>
                                            Como funciona:
                                        </h3>
                                        <ul className={styles.infoList}>
                                            <li>Mantemos um buffer dos últimos 60 segundos</li>
                                            <li>Clique em "Parar e Salvar" no momento exato</li>
                                            <li>O vídeo salvo conterá os 60s anteriores ao clique</li>
                                        </ul>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Preview Mode */
                            <>
                                <div className={styles.preview}>
                                    <img src={recordedVideo.url} alt="Preview" className={styles.previewImage} />
                                    <div className={styles.playOverlay}>
                                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="10" fill="white" opacity="0.9" />
                                            <path d="M10 8l6 4-6 4V8z" fill="#3B82F6" />
                                        </svg>
                                    </div>
                                    <div className={styles.bufferBadge}>{recordedVideo.duration}</div>
                                </div>

                                <div className={styles.controls}>
                                    <h3 className={styles.successTitle}>Momento capturado!</h3>
                                    <div className={styles.previewActions}>
                                        <button onClick={handleOpenUpload} className={styles.btnPublish}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" />
                                            </svg>
                                            Publicar Momento
                                        </button>
                                        <button onClick={handleDiscard} className={styles.btnDiscard}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                                            </svg>
                                            Descartar
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Tips */}
                    <div className={styles.tips}>
                        <div className={styles.tipCard}>
                            <div className={styles.tipIcon}>⚡</div>
                            <h3 className={styles.tipTitle}>Capture Rápido</h3>
                            <p className={styles.tipText}>Salve apenas o momento certo, sem gravar tudo</p>
                        </div>
                        <div className={styles.tipCard}>
                            <div className={styles.tipIcon}>🎯</div>
                            <h3 className={styles.tipTitle}>60 Segundos</h3>
                            <p className={styles.tipText}>Buffer automático dos últimos momentos</p>
                        </div>
                        <div className={styles.tipCard}>
                            <div className={styles.tipIcon}>☁️</div>
                            <h3 className={styles.tipTitle}>Upload Seguro</h3>
                            <p className={styles.tipText}>Seus vídeos salvos na nuvem</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className={styles.modal} onClick={handleCloseModal}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Publicar Momento</h2>
                            <button onClick={handleCloseModal} className={styles.modalClose}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleUpload} className={styles.modalForm}>
                            <div className="input-group">
                                <label className="input-label">Título do Momento</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Gol incrível no último minuto"
                                    value={uploadData.titulo}
                                    onChange={(e) => setUploadData({ ...uploadData, titulo: e.target.value })}
                                    className="input-field"
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Descrição (opcional)</label>
                                <textarea
                                    rows="3"
                                    placeholder="Conte mais sobre este momento..."
                                    value={uploadData.descricao}
                                    onChange={(e) => setUploadData({ ...uploadData, descricao: e.target.value })}
                                    className="input-field"
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Tags</label>
                                <input
                                    type="text"
                                    placeholder="Ex: futebol, gol, brasil (separadas por vírgula)"
                                    value={uploadData.tags}
                                    onChange={(e) => setUploadData({ ...uploadData, tags: e.target.value })}
                                    className="input-field"
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                                    Use vírgulas para separar as tags
                                </p>
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" onClick={handleCloseModal} className="btn btn-outline">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Publicar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Capture;