import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { momentosService } from '../services/api';
import '../styles/pages/Capture.css';

const Capture = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const streamRef = useRef(null);

    const [isRecording, setIsRecording] = useState(false);
    const [recordedVideo, setRecordedVideo] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [error, setError] = useState('');
    const [uploadData, setUploadData] = useState({
        titulo: '',
        descricao: '',
        tags: ''
    });

    const BUFFER_DURATION = 60000; // 60 segundos em ms
    const CHUNK_DURATION = 1000; // 1 segundo por chunk

    // Cleanup ao desmontar componente
    useEffect(() => {
        return () => {
            stopStream();
        };
    }, []);

    // Iniciar captura de câmera
    const startCapture = async () => {
        try {
            setError('');

            // Captura de câmera com melhor qualidade
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    facingMode: 'user' // Câmera frontal por padrão
                },
                audio: true
            });

            streamRef.current = stream;

            // Mostrar preview no video element
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }

            // Configurar MediaRecorder
            const options = {
                mimeType: 'video/webm;codecs=vp9,opus',
                videoBitsPerSecond: 2500000 // 2.5 Mbps
            };

            // Fallback para navegadores que não suportam VP9
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'video/webm';
            }

            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;

            // Array para armazenar chunks
            chunksRef.current = [];

            // Evento: dados disponíveis (a cada 1 segundo)
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

            // Evento: parou de gravar
            mediaRecorder.onstop = () => {
                console.log('Gravação finalizada');
            };

            // Evento: erro
            mediaRecorder.onerror = (event) => {
                console.error('Erro no MediaRecorder:', event.error);
                setError('Erro ao gravar vídeo');
            };

            // Iniciar gravação (com chunks a cada 1 segundo)
            mediaRecorder.start(CHUNK_DURATION);
            setIsRecording(true);

        } catch (err) {
            console.error('Erro ao capturar:', err);
            if (err.name === 'NotAllowedError') {
                setError('Permissão negada. Autorize o acesso à câmera.');
            } else if (err.name === 'NotFoundError') {
                setError('Nenhuma câmera encontrada.');
            } else {
                setError('Erro ao iniciar captura: ' + err.message);
            }
        }
    };

    // Parar gravação e gerar vídeo
    const handleStopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }

        setIsRecording(false);

        // Gerar vídeo dos últimos 60 segundos
        setTimeout(() => {
            generateVideo();
        }, 500);
    };

    // Gerar vídeo a partir dos chunks
    const generateVideo = () => {
        if (chunksRef.current.length === 0) {
            setError('Nenhum dado gravado');
            return;
        }

        // Pegar apenas os chunks de vídeo (sem o timestamp)
        const videoChunks = chunksRef.current.map(chunk => chunk.data);

        // Criar blob do vídeo
        const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
        const blob = new Blob(videoChunks, { type: mimeType });

        // Criar URL para preview
        const videoUrl = URL.createObjectURL(blob);

        // Calcular duração aproximada
        const duration = Math.round(chunksRef.current.length * (CHUNK_DURATION / 1000));

        setRecordedVideo({
            blob,
            url: videoUrl,
            duration: `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`,
            size: (blob.size / (1024 * 1024)).toFixed(2) // Tamanho em MB
        });

        // Parar stream
        stopStream();
    };

    // Parar stream de captura
    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    // Descartar vídeo
    const handleDiscard = () => {
        if (window.confirm('Descartar este momento?')) {
            if (recordedVideo?.url) {
                URL.revokeObjectURL(recordedVideo.url);
            }
            setRecordedVideo(null);
            chunksRef.current = [];
        }
    };

    // Abrir modal de upload
    const handleOpenUpload = () => {
        setShowUploadModal(true);
    };

    const handleCloseModal = () => {
        setShowUploadModal(false);
        setUploadData({ titulo: '', descricao: '', tags: '' });
    };

    // Upload do vídeo
    const handleUpload = async (e) => {
        e.preventDefault();

        if (!recordedVideo?.blob) {
            alert('Nenhum vídeo para enviar');
            return;
        }

        try {
            // Criar FormData para enviar arquivo
            const formData = new FormData();

            // Adicionar vídeo
            const videoFile = new File(
                [recordedVideo.blob],
                `momento-${Date.now()}.webm`,
                { type: recordedVideo.blob.type }
            );
            formData.append('video', videoFile);

            // Adicionar outros dados
            formData.append('titulo', uploadData.titulo);
            formData.append('descricao', uploadData.descricao);
            formData.append('duracao', Math.round(chunksRef.current.length * (CHUNK_DURATION / 1000)));

            // Tags (separar por vírgula)
            if (uploadData.tags) {
                const tagsArray = uploadData.tags.split(',').map(t => t.trim());
                formData.append('tags', JSON.stringify(tagsArray));
            }

            // Enviar para API
            await momentosService.criar(formData);

            alert('Momento publicado com sucesso!');

            // Limpar
            if (recordedVideo?.url) {
                URL.revokeObjectURL(recordedVideo.url);
            }

            navigate('/');
        } catch (error) {
            console.error('Erro ao enviar:', error);
            alert('Erro ao publicar momento: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <>
            <Header user={user} onLogout={onLogout} />

            <div className="capture-container">
                <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                    {/* Header */}
                    <div className="capture-header">
                        <h1 className="capture-title">🎥 Capturar Lance</h1>
                        <p className="capture-subtitle">
                            Grave os últimos 60 segundos de ação ao vivo da sua câmera
                        </p>
                    </div>

                    {/* Erro */}
                    {error && (
                        <div className="error-box">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Área de captura */}
                    <div className="capture-card">
                        {!recordedVideo ? (
                            <>
                                <div className="preview-area">
                                    {isRecording && (
                                        <div className="recording-badge">
                                            <div className="recording-dot"></div>
                                            <span>GRAVANDO</span>
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
                                            <p className="placeholder-text">Pronto para capturar</p>
                                            <p className="placeholder-small">
                                                📹 Modo: Captura de Câmera
                                            </p>
                                        </div>
                                    )}

                                    <div className="buffer-badge">Buffer: 60s</div>
                                </div>

                                <div className="controls">
                                    <div className="controls-main">
                                        {!isRecording ? (
                                            <button onClick={startCapture} className="btn-record">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                    <circle cx="12" cy="12" r="10" fill="currentColor" />
                                                </svg>
                                                Iniciar Gravação
                                            </button>
                                        ) : (
                                            <button onClick={handleStopRecording} className="btn-stop">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                    <rect x="6" y="6" width="12" height="12" fill="currentColor" />
                                                </svg>
                                                Parar e Salvar
                                            </button>
                                        )}
                                    </div>

                                    <div className="info-box">
                                        <h3 className="info-title">💡 Como funciona:</h3>
                                        <ul className="info-list">
                                            <li>Mantemos um buffer dos últimos 60 segundos</li>
                                            <li>Clique em "Parar e Salvar" no momento exato</li>
                                            <li>O vídeo salvo conterá os 60s anteriores ao clique</li>
                                        </ul>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="preview-area">
                                    <video
                                        src={recordedVideo.url}
                                        controls
                                        className="video-preview"
                                        style={{ display: 'block' }}
                                    />
                                    <div className="video-info-badge">
                                        {recordedVideo.duration} • {recordedVideo.size} MB
                                    </div>
                                </div>

                                <div className="controls">
                                    <h3 className="success-title">✅ Lance capturado!</h3>
                                    <div className="preview-actions">
                                        <button onClick={handleOpenUpload} className="btn-publish">
                                            Publicar Lance
                                        </button>
                                        <button onClick={handleDiscard} className="btn-discard">
                                            Descartar
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Upload */}
            {showUploadModal && (
                <div className="modal" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Publicar Lance</h2>
                            <button onClick={handleCloseModal} className="modal-close">×</button>
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
                                />
                            </div>

                            <div className="modal-actions">
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