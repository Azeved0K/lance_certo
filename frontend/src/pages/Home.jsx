import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/layout/Header';
import MomentoCard from '../components/gallery/MomentoCard';
import { momentosService } from '../services/api';
import '../styles/pages/Home.css';

const mockTags = ['Todos', 'Futebol', 'Basquete', 'Volei', 'Gol', 'Defesa', 'Drible'];

const Home = () => {
    const { user, logout } = useAuth();
    const [selectedTag, setSelectedTag] = useState('Todos');
    const [sortBy, setSortBy] = useState('recent');
    const [momentos, setMomentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchMomentos();
    }, [selectedTag, sortBy]);

    const fetchMomentos = async () => {
        try {
            setLoading(true);
            setError('');

            const params = {
                sort: sortBy
            };

            if (selectedTag !== 'Todos') {
                params.tag = selectedTag.toLowerCase();
            }

            const response = await momentosService.listar(params);
            const data = response.data || [];
            setMomentos(Array.isArray(data) ? data : []);
            console.log('Momentos carregados:', data);
        } catch (err) {
            console.error('Erro ao carregar momentos:', err);
            setError('Erro ao carregar momentos');
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (momentoId, liked) => {
        try {
            if (liked) {
                await momentosService.like(momentoId);
            } else {
                await momentosService.unlike(momentoId);
            }
            // Atualizar lista
            fetchMomentos();
        } catch (error) {
            console.error('Erro ao curtir/descurtir:', error);
        }
    };

    // ✅ NOVO: Callback para remover momento da lista após exclusão
    const handleDelete = (momentoId) => {
        setMomentos(prevMomentos => prevMomentos.filter(m => m.id !== momentoId));
    };

    return (
        <>
            <Header user={user} onLogout={logout} />

            {/* Hero */}
            <div className="hero">
                <div className="container">
                    <h1 className="heroTitle">Lance Certo</h1>
                    <p className="heroSubtitle">
                        O replay garantido do seu melhor momento.
                    </p>
                </div>
            </div>

            <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                {/* Filters */}
                <div className="filters">
                    <div className="filterSection">
                        <h2 className="filterTitle">Categorias</h2>
                        <div className="tags">
                            {mockTags.map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => setSelectedTag(tag)}
                                    className={`tag ${selectedTag === tag ? 'tagActive' : ''}`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="sortBar">
                        <div className="sortInfo">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <span className="sortLabel">
                                {sortBy === 'trending' ? 'Em Alta' : sortBy === 'popular' ? 'Mais Vistos' : 'Recentes'}
                            </span>
                            <span className="count">({momentos.length} momentos)</span>
                        </div>

                        <div className="sortButtons">
                            <button
                                onClick={() => setSortBy('recent')}
                                className={`sortBtn ${sortBy === 'recent' ? 'sortBtnActive' : ''}`}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" />
                                </svg>
                                Recentes
                            </button>
                            <button
                                onClick={() => setSortBy('trending')}
                                className={`sortBtn ${sortBy === 'trending' ? 'sortBtnActive' : ''}`}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" />
                                </svg>
                                Em Alta
                            </button>
                            <button
                                onClick={() => setSortBy('popular')}
                                className={`sortBtn ${sortBy === 'popular' ? 'sortBtnActive' : ''}`}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" />
                                </svg>
                                Populares
                            </button>
                        </div>
                    </div>
                </div>

                {/* Loading */}
                {loading && (
                    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div style={{
                        padding: '1rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '2px solid var(--danger-color)',
                        borderRadius: '8px',
                        color: 'var(--danger-color)',
                        textAlign: 'center',
                        marginBottom: '2rem'
                    }}>
                        {error}
                    </div>
                )}

                {/* Grid */}
                {!loading && momentos.length > 0 && (
                    <div className="grid grid-cols-3">
                        {momentos.map((momento) => (
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
                                onLike={handleLike}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}

                {/* Empty */}
                {!loading && momentos.length === 0 && (
                    <div className="empty">
                        <div className="emptyIcon">😢</div>
                        <h3 className="emptyTitle">Nenhum momento encontrado</h3>
                        <p className="emptyText">
                            {selectedTag === 'Todos'
                                ? 'Seja o primeiro a capturar um momento!'
                                : 'Tente selecionar outra categoria'}
                        </p>
                    </div>
                )}

                {/* CTA */}
                <div className="cta">
                    <h2 className="ctaTitle">Capture Seu Momento! 🎥</h2>
                    <p className="ctaText">
                        Não perca aquele lance incrível. Comece a gravar agora!
                    </p>
                    <Link to="/capture" className="ctaButton">
                        Começar a Capturar
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <footer className="footer">
                <div className="container" style={{ textAlign: 'center' }}>
                    <p>© 2025 Lance Certo - Desenvolvido com ❤️ para os fãs de esporte.</p>
                </div>
            </footer>
        </>
    );
};

// Função auxiliar para formatar duração
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default Home;