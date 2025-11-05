import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/layout/Header';
import MomentoCard from '../components/gallery/MomentoCard';
import { momentosService } from '../services/api';
import '../styles/pages/Home.css';

const mockTags = ['Todos', 'Futebol', 'Basquete', 'Volei', 'Gol', 'Defesa', 'Drible'];

const Home = () => {
    const { user, logout } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    // ✅ Ler parâmetros da URL
    const searchQuery = searchParams.get('search') || '';
    const tagParam = searchParams.get('tag') || 'Todos';
    const sortParam = searchParams.get('sort') || 'recent';

    const [selectedTag, setSelectedTag] = useState(tagParam);
    const [sortBy, setSortBy] = useState(sortParam);
    const [momentos, setMomentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // ✅ Sincronizar estado com URL
    useEffect(() => {
        const newSearchParams = new URLSearchParams();

        if (searchQuery) newSearchParams.set('search', searchQuery);
        if (selectedTag !== 'Todos') newSearchParams.set('tag', selectedTag);
        if (sortBy !== 'recent') newSearchParams.set('sort', sortBy);

        setSearchParams(newSearchParams, { replace: true });
    }, [selectedTag, sortBy, searchQuery, setSearchParams]);

    // ✅ Buscar momentos quando filtros mudarem
    useEffect(() => {
        fetchMomentos();
    }, [selectedTag, sortBy, searchQuery, user]);

    const fetchMomentos = async () => {
        try {
            setLoading(true);
            setError('');

            const params = {};

            // ✅ NOVO: Se sortBy for 'meus', filtrar por usuário logado
            if (sortBy === 'meus' && user) {
                params.usuario = user.username;
                params.sort = 'recent'; // Ordenar por mais recentes
            } else {
                params.sort = sortBy;
            }

            // Filtrar por tag
            if (selectedTag !== 'Todos') {
                params.tag = selectedTag.toLowerCase();
            }

            // Busca por texto
            if (searchQuery) {
                params.search = searchQuery;
            }

            console.log('🔍 Parâmetros enviados para API:', params);

            const response = await momentosService.listar(params);
            const data = response.data || [];

            // Garantir que data é array
            const filteredData = Array.isArray(data) ? data : [];

            setMomentos(filteredData);
            console.log('✅ Momentos carregados:', filteredData.length, 'itens');
        } catch (err) {
            console.error('❌ Erro ao carregar momentos:', err);
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

    const handleDelete = (momentoId) => {
        setMomentos(prevMomentos => prevMomentos.filter(m => m.id !== momentoId));
    };

    const handleTagChange = (tag) => {
        console.log('🏷️ Tag selecionada:', tag);
        setSelectedTag(tag);
    };

    const handleSortChange = (sort) => {
        console.log('📊 Ordenação alterada para:', sort);
        setSortBy(sort);
    };

    const clearSearch = () => {
        window.location.href = '/';
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getSortLabel = () => {
        switch (sortBy) {
            case 'meus':
                return 'Seus Vídeos';
            case 'trending':
                return 'Em Alta';
            case 'popular':
                return 'Mais Vistos';
            case 'recent':
            default:
                return 'Recentes';
        }
    };

    const getSortIcon = () => {
        switch (sortBy) {
            case 'meus':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="8" r="4" strokeWidth="2" />
                        <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" strokeWidth="2" />
                    </svg>
                );
            case 'trending':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" fill="currentColor" />
                    </svg>
                );
            case 'popular':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" fill="currentColor" />
                    </svg>
                );
            case 'recent':
            default:
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" />
                    </svg>
                );
        }
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
                {/* Banner de Busca Ativa */}
                {searchQuery && (
                    <div className="search-active-banner">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="11" cy="11" r="8" strokeWidth="2" />
                            <path d="M21 21l-4.35-4.35" strokeWidth="2" />
                        </svg>
                        <span>
                            Resultados para: <strong>"{searchQuery}"</strong>
                        </span>
                        <button
                            onClick={clearSearch}
                            className="clear-search-btn"
                        >
                            Limpar busca
                        </button>
                    </div>
                )}

                {/* Filtros */}
                <div className="filters">
                    {/* Tags */}
                    <div className="filterSection">
                        <h2 className="filterTitle">Categorias</h2>
                        <div className="tags">
                            {mockTags.map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => handleTagChange(tag)}
                                    className={`tag ${selectedTag === tag ? 'tagActive' : ''}`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ✅ Barra de Ordenação - COM "SEUS VÍDEOS" */}
                    <div className="sortBar">
                        <div className="sortInfo">
                            {getSortIcon()}
                            <span className="sortLabel">
                                {getSortLabel()}
                            </span>
                            <span className="count">({momentos.length} momentos)</span>
                        </div>

                        <div className="sortButtons">
                            <button
                                onClick={() => handleSortChange('recent')}
                                className={`sortBtn ${sortBy === 'recent' ? 'sortBtnActive' : ''}`}
                                title="Momentos mais recentes"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" />
                                </svg>
                                Recentes
                            </button>
                            <button
                                onClick={() => handleSortChange('trending')}
                                className={`sortBtn ${sortBy === 'trending' ? 'sortBtnActive' : ''}`}
                                title="Momentos com mais curtidas"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" />
                                </svg>
                                Em Alta
                            </button>
                            <button
                                onClick={() => handleSortChange('popular')}
                                className={`sortBtn ${sortBy === 'popular' ? 'sortBtnActive' : ''}`}
                                title="Momentos com mais visualizações"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" />
                                </svg>
                                Populares
                            </button>

                            {/* ✅ NOVO BOTÃO: Seus Vídeos (só aparece se logado) */}
                            {user && (
                                <button
                                    onClick={() => handleSortChange('meus')}
                                    className={`sortBtn ${sortBy === 'meus' ? 'sortBtnActive' : ''}`}
                                    title="Seus vídeos publicados"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <circle cx="12" cy="8" r="4" strokeWidth="2" />
                                        <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" strokeWidth="2" />
                                    </svg>
                                    Seus Vídeos
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Loading */}
                {loading && (
                    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                        <p style={{ marginTop: '1rem', color: 'var(--gray-600)' }}>
                            Carregando momentos...
                        </p>
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

                {/* Grid de Momentos */}
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

                {/* Empty State */}
                {!loading && momentos.length === 0 && (
                    <div className="empty">
                        <div className="emptyIcon">😢</div>
                        <h3 className="emptyTitle">
                            {searchQuery
                                ? `Nenhum resultado para "${searchQuery}"`
                                : sortBy === 'meus'
                                    ? 'Você ainda não publicou nenhum vídeo'
                                    : 'Nenhum momento encontrado'
                            }
                        </h3>
                        <p className="emptyText">
                            {searchQuery
                                ? 'Tente buscar com outros termos'
                                : sortBy === 'meus'
                                    ? 'Comece a capturar seus melhores momentos!'
                                    : selectedTag === 'Todos'
                                        ? 'Seja o primeiro a capturar um momento!'
                                        : 'Tente selecionar outra categoria'
                            }
                        </p>
                        {searchQuery ? (
                            <button
                                onClick={clearSearch}
                                className="btn btn-primary"
                                style={{ marginTop: '1rem' }}
                            >
                                Limpar busca
                            </button>
                        ) : sortBy === 'meus' && (
                            <Link
                                to="/capture"
                                className="btn btn-primary"
                                style={{ marginTop: '1rem' }}
                            >
                                Capturar Primeiro Momento
                            </Link>
                        )}
                    </div>
                )}

                {/* CTA */}
                {!searchQuery && sortBy !== 'meus' && (
                    <div className="cta">
                        <h2 className="ctaTitle">Capture Seu Momento! 🎥</h2>
                        <p className="ctaText">
                            Não perca aquele lance incrível. Comece a gravar agora!
                        </p>
                        <Link to="/capture" className="ctaButton">
                            Começar a Capturar
                        </Link>
                    </div>
                )}
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

export default Home;