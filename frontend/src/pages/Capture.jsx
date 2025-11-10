import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { momentosService } from '../services/api';
import '../styles/pages/Capture.css';

/**
 * Gera um thumbnail a partir de um blob de vídeo.
 * @param {Blob} videoBlob O blob do clipe de vídeo.
 * @returns {Promise<File|null>} Um arquivo de imagem (thumbnail) ou null se falhar.
 */
const generateThumbnail = (videoBlob) => {
    return new Promise((resolve, reject) => {
        try {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.src = URL.createObjectURL(videoBlob);
            video.muted = true;
            video.playsInline = true;

            video.onloadeddata = () => {
                // Tenta buscar o frame 0.1s para garantir que carregou
                video.currentTime = 0.1;
            };

            video.onseeked = () => {
                // Criar canvas
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');

                // Desenhar o frame no canvas
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Converter canvas para blob
                canvas.toBlob((blob) => {
                    if (blob) {
                        const thumbnailFile = new File(
                            [blob],
                            `thumbnail-${Date.now()}.jpg`,
                            { type: 'image/jpeg' }
                        );
                        URL.revokeObjectURL(video.src); // Limpar memória
                        resolve(thumbnailFile);
                    } else {
                        reject(new Error('Falha ao criar blob do canvas'));
                    }
                }, 'image/jpeg', 0.8); // 80% de qualidade
            };

            video.onerror = (e) => {
                console.error('Erro ao carregar vídeo para thumbnail:', e);
                URL.revokeObjectURL(video.src);
                reject(new Error('Erro ao carregar vídeo'));
            };

            video.play().catch(e => {
                // Play é necessário em alguns browsers para buscar frames
            });

        } catch (error) {
            console.error('Erro ao gerar thumbnail:', error);
            reject(error);
        }
    });
};


const Capture = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const streamRef = useRef(null);
    const recordingStartTimeRef = useRef(null);

    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [clips, setClips] = useState([]);
    const [showClipsManager, setShowClipsManager] = useState(false);
    const [selectedClips, setSelectedClips] = useState([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [currentClipData, setCurrentClipData] = useState(null);
    const [error, setError] = useState('');
    const [uploadData, setUploadData] = useState({
        titulo: '',
        descricao: '',
        tags: ''
    });
    const [isUploading, setIsUploading] = useState(false);

    const BUFFER_DURATION = 60000; // 60 segundos
    const CHUNK_DURATION = 1000; // 1 segundo por chunk

    // Timer da gravação
    useEffect(() => {
        let interval;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            setRecordingTime(0);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    // Cleanup ao desmontar
    useEffect(() => {
        return () => {
            stopStream();
        };
    }, []);

    // Iniciar captura de câmera
    const startCapture = async () => {
        try {
            setError('');

            // Solicitar acesso à câmera
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: true
            });

            streamRef.current = stream;

            // Mostrar preview
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }

            // Configurar MediaRecorder
            const options = {
                mimeType: 'video/webm;codecs=vp9,opus',
                videoBitsPerSecond: 2500000
            };

            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'video/webm';
            }

            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;

            chunksRef.current = [];
            recordingStartTimeRef.current = Date.now();

            // Evento: dados disponíveis
            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    chunksRef.current.push({
                        data: event.data,
                        timestamp: Date.now()
                    });

                    // Manter apenas últimos 60 segundos
                    const now = Date.now();
                    chunksRef.current = chunksRef.current.filter(
                        chunk => now - chunk.timestamp <= BUFFER_DURATION
                    );
                }
            };

            mediaRecorder.onerror = (event) => {
                console.error('Erro no MediaRecorder:', event.error);
                setError('Erro ao gravar vídeo');
            };

            // Iniciar gravação
            mediaRecorder.start(CHUNK_DURATION);
            setIsRecording(true);

        } catch (err) {
            console.error('Erro ao capturar câmera:', err);
            if (err.name === 'NotAllowedError') {
                setError('Permissão negada. Autorize o acesso à câmera.');
            } else if (err.name === 'NotFoundError') {
                setError('Nenhuma câmera encontrada.');
            } else {
                setError('Erro ao iniciar captura: ' + err.message);
            }
        }
    };

    // Salvar clipe dos últimos 60 segundos
    const handleSaveClip = () => {
        if (chunksRef.current.length === 0) {
            alert('Nenhum dado gravado ainda. Aguarde alguns segundos.');
            return;
        }

        // Criar blob do clipe
        const videoChunks = chunksRef.current.map(chunk => chunk.data);
        const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
        const blob = new Blob(videoChunks, { type: mimeType });
        const videoUrl = URL.createObjectURL(blob);

        // Calcular duração
        const duration = Math.round(chunksRef.current.length * (CHUNK_DURATION / 1000));

        const newClip = {
            id: Date.now(),
            blob,
            url: videoUrl,
            duration: `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`,
            durationSeconds: duration,
            size: (blob.size / (1024 * 1024)).toFixed(2),
            savedAt: new Date().toLocaleTimeString('pt-BR')
        };

        setClips(prev => [...prev, newClip]);

        // Feedback visual
        const btn = document.querySelector('.btn-save-clip');
        if (btn) {
            btn.classList.add('clip-saved-animation');
            setTimeout(() => btn.classList.remove('clip-saved-animation'), 500);
        }

        console.log(`📹 Clipe ${clips.length + 1} salvo!`, newClip);
    };

    // Parar gravação e abrir gerenciador de clipes
    const handleStopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }

        setIsRecording(false);
        stopStream();

        if (clips.length === 0) {
            alert('Nenhum clipe foi salvo durante a gravação.');
            return;
        }

        setShowClipsManager(true);
    };

    // Parar stream
    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    // Selecionar/desselecionar clipe
    const toggleClipSelection = (clipId) => {
        setSelectedClips(prev =>
            prev.includes(clipId)
                ? prev.filter(id => id !== clipId)
                : [...prev, clipId]
        );
    };

    // Deletar clipe
    const handleDeleteClip = (clipId) => {
        setClips(prev => prev.filter(clip => clip.id !== clipId));
        setSelectedClips(prev => prev.filter(id => id !== clipId));
    };

    // Publicar clipes selecionados
    const handlePublishSelected = () => {
        if (selectedClips.length === 0) {
            alert('Selecione pelo menos um clipe para publicar');
            return;
        }

        // Pegar primeiro clipe selecionado para publicar
        const clipToPublish = clips.find(c => c.id === selectedClips[0]);

        if (clipToPublish) {
            setCurrentClipData(clipToPublish);
            setShowUploadModal(true);
        }
    };

    // Upload do clipe (COM GERAÇÃO DE THUMBNAIL)
    const handleUpload = async (e) => {
        e.preventDefault();
        if (isUploading) return; // Prevenir duplo clique

        if (!currentClipData?.blob) {
            alert('Nenhum clipe para enviar');
            return;
        }

        setIsUploading(true); // Ativa loading

        try {
            const formData = new FormData();

            // 1. Criar arquivo de vídeo
            const videoFile = new File(
                [currentClipData.blob],
                `momento-${Date.now()}.webm`,
                { type: currentClipData.blob.type }
            );

            // 2. Gerar thumbnail
            console.log('Gerando thumbnail...');
            const thumbnailFile = await generateThumbnail(currentClipData.blob);

            // 3. Adicionar tudo ao FormData
            formData.append('video', videoFile);
            if (thumbnailFile) {
                formData.append('thumbnail', thumbnailFile);
                console.log('Thumbnail gerada e adicionada!', thumbnailFile);
            } else {
                console.warn('Não foi possível gerar a thumbnail.');
            }

            formData.append('titulo', uploadData.titulo);
            formData.append('descricao', uploadData.descricao);
            formData.append('duracao', currentClipData.durationSeconds);

            if (uploadData.tags) {
                const tagsArray = uploadData.tags.split(',').map(t => t.trim());
                // Backend espera 'tags' como um JSON array string
                formData.append('tags', JSON.stringify(tagsArray));
            }

            console.log('Enviando momento para a API...');
            await momentosService.criar(formData);

            alert('✅ Momento publicado com sucesso!');

            // Limpar
            if (currentClipData?.url) {
                URL.revokeObjectURL(currentClipData.url);
            }

            // Resetar tudo
            setClips([]);
            setSelectedClips([]);
            setShowUploadModal(false);
            setShowClipsManager(false);
            setCurrentClipData(null);
            setUploadData({ titulo: '', descricao: '', tags: '' });

            navigate('/');
        } catch (error) {
            console.error('Erro ao enviar:', error);
            alert('❌ Erro ao publicar momento: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsUploading(false); // Desativa loading
        }
    };

    // Formatar tempo de gravação
    const formatRecordingTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <>
            <Header user={user} onLogout={onLogout} />

            <div className="capture-container">
                <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                    {/* Header */}
                    <div className="capture-header">
                        <h1 className="capture-title">📹 Capturar Momentos</h1>
                        <p className="capture-subtitle">
                            Grave continuamente e salve clipes dos últimos 60 segundos a qualquer momento
                        </p>
                    </div>

                    {/* Erro */}
                    {error && (
                        <div className="error-box">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Área de captura */}
                    {!showClipsManager && (
                        <div className="capture-card">
                            <div className="preview-area">
                                {isRecording && (
                                    <div className="recording-badge">
                                        <div className="recording-dot"></div>
                                        <span>GRAVANDO {formatRecordingTime(recordingTime)}</span>
                                    </div>
                                )}

                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="video-preview"
                                    style={{ display: isRecording ? 'block' : 'none' }}
                                />

                                {!isRecording && (
                                    <div className="placeholder-content">
                                        <svg className="camera-icon" width="80" height="80" viewBox="0 0 24 24" fill="none">
                                            <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
                                            <circle cx="9" cy="12" r="2" stroke="currentColor" strokeWidth="2" />
                                            <path d="M15 9l4-2v10l-4-2" stroke="currentColor" strokeWidth="2" />
                                        </svg>
                                        <p className="placeholder-text">Pronto para começar</p>
                                        <p className="placeholder-small">📹 Modo: Captura de Câmera</p>
                                    </div>
                                )}

                                {isRecording && clips.length > 0 && (
                                    <div className="clips-counter">
                                        📼 {clips.length} clipe(s) salvos
                                    </div>
                                )}
                            </div>

                            <div className="controls">
                                {!isRecording ? (
                                    <>
                                        <div className="controls-main">
                                            <button onClick={startCapture} className="btn-record">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                    <circle cx="12" cy="12" r="10" fill="currentColor" />
                                                </svg>
                                                Iniciar Gravação
                                            </button>
                                        </div>

                                        <div className="info-box">
                                            <h3 className="info-title">💡 Como funciona:</h3>
                                            <ul className="info-list">
                                                <li>Clique em "Iniciar Gravação" para começar</li>
                                                <li>Durante a gravação, clique em "Salvar Clipe" quando quiser capturar os últimos 60 segundos</li>
                                                <li>Você pode salvar vários clipes durante uma mesma gravação</li>
                                                <li>Ao finalizar, escolha quais clipes deseja publicar</li>
                                            </ul>
                                        </div>
                                    </>
                                ) : (
                                    <div className="recording-controls">
                                        <button onClick={handleSaveClip} className="btn-save-clip">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <polyline points="17 21 17 13 7 13 7 21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <polyline points="7 3 7 8 15 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            Salvar Clipe (últimos 60s)
                                        </button>

                                        <button onClick={handleStopRecording} className="btn-stop">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                <rect x="6" y="6" width="12" height="12" fill="currentColor" />
                                            </svg>
                                            Parar e Finalizar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Gerenciador de Clipes */}
                    {showClipsManager && (
                        <div className="clips-manager">
                            <div className="clips-manager-header">
                                <h2 className="clips-title">
                                    📼 Gerenciar Clipes ({clips.length})
                                </h2>
                                <p className="clips-subtitle">
                                    Selecione os clipes que deseja publicar
                                </p>
                            </div>

                            <div className="clips-grid">
                                {clips.map((clip) => (
                                    <div
                                        key={clip.id}
                                        className={`clip-card ${selectedClips.includes(clip.id) ? 'selected' : ''}`}
                                    >
                                        <div className="clip-preview">
                                            <video
                                                src={clip.url}
                                                controls
                                                className="clip-video"
                                            />
                                            <div className="clip-duration">{clip.duration}</div>
                                        </div>

                                        <div className="clip-info">
                                            <p className="clip-saved-at">Salvo às {clip.savedAt}</p>
                                            <p className="clip-size">{clip.size} MB</p>
                                        </div>

                                        <div className="clip-actions">
                                            <button
                                                onClick={() => toggleClipSelection(clip.id)}
                                                className={`btn-select ${selectedClips.includes(clip.id) ? 'selected' : ''}`}
                                            >
                                                {selectedClips.includes(clip.id) ? '✓ Selecionado' : 'Selecionar'}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClip(clip.id)}
                                                className="btn-delete-clip"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="clips-manager-footer">
                                <button
                                    onClick={() => {
                                        setShowClipsManager(false);
                                        setClips([]);
                                        setSelectedClips([]);
                                    }}
                                    className="btn btn-outline"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handlePublishSelected}
                                    className="btn btn-primary"
                                    disabled={selectedClips.length === 0}
                                >
                                    Publicar {selectedClips.length > 0 ? `(${selectedClips.length})` : ''}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Upload */}
            {showUploadModal && (
                <div className="modal" onClick={() => !isUploading && setShowUploadModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Publicar Clipe</h2>
                            <button onClick={() => setShowUploadModal(false)} className="modal-close" disabled={isUploading}>×</button>
                        </div>

                        <form onSubmit={handleUpload} className="modal-form">
                            <div className="input-group">
                                <label className="input-label">Título do Lance</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Gol incrível no último minuto"
                                    value={uploadData.titulo}
                                    onChange={(e) => setUploadData({ ...uploadData, titulo: e.target.value })}
                                    className="input-field"
                                    disabled={isUploading}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Descrição (opcional)</label>
                                <textarea
                                    rows="3"
                                    placeholder="Conte mais sobre este lance..."
                                    value={uploadData.descricao}
                                    onChange={(e) => setUploadData({ ...uploadData, descricao: e.target.value })}
                                    className="input-field"
                                    disabled={isUploading}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Tags</label>
                                <input
                                    type="text"
                                    placeholder="Ex: futebol, gol, brasil"
                                    value={uploadData.tags}
                                    onChange={(e) => setUploadData({ ...uploadData, tags: e.target.value })}
                                    className="input-field"
                                    disabled={isUploading}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowUploadModal(false)} className="btn btn-outline" disabled={isUploading}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isUploading}>
                                    {isUploading ? (
                                        <>
                                            <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <circle cx="12" cy="12" r="10" strokeWidth="3" fill="none" />
                                            </svg>
                                            Publicando...
                                        </>
                                    ) : (
                                        'Publicar'
                                    )}
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