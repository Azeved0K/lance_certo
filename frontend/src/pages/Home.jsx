import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/layout/Header';
import MomentoCard from '../components/gallery/MomentoCard';
import { momentosService, authService } from '../services/api';
import '../styles/pages/Home.css';

const mockTags = ['Todos', 'Futebol', 'Basquete', 'Volei', 'Gol', 'Defesa', 'Drible'];

const Home = () => {
    const { user, logout } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    // Ler parâmetros da URL
    const searchQuery = searchParams.get('search') || '';
    const tagParam = searchParams.get('tag') || 'Todos';
    const sortParam = searchParams.get('sort') || 'recent';
    const pageParam = parseInt(searchParams.get('page') || '1', 10);

    const [selectedTag, setSelectedTag] = useState(tagParam);
    const [sortBy, setSortBy] = useState(sortParam);
    const [momentos, setMomentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Resultados de Usuários
    const [userResults, setUserResults] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Estados de paginação
    const [currentPage, setCurrentPage] = useState(pageParam);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [pageInput, setPageInput] = useState(pageParam.toString());

    // Sincronizar estado com URL
    useEffect(() => {
        const newSearchParams = new URLSearchParams();

        if (searchQuery) newSearchParams.set('search', searchQuery);
        if (selectedTag !== 'Todos') newSearchParams.set('tag', selectedTag);
        if (sortBy !== 'recent') newSearchParams.set('sort', sortBy);
        if (currentPage > 1) newSearchParams.set('page', currentPage.toString());

        setSearchParams(newSearchParams, { replace: true });
    }, [selectedTag, sortBy, searchQuery, currentPage, setSearchParams]);

    // Resetar para página 1 quando filtros mudarem
    useEffect(() => {
        setCurrentPage(1);
        setPageInput('1');
    }, [selectedTag, sortBy, searchQuery]);

    useEffect(() => {
        const fetchUsers = async () => {
            if (searchQuery) {
                setLoadingUsers(true);
                try {
                    const response = await authService.searchUsers(searchQuery);
                    setUserResults(response.data.results || []); // API agora é paginada
                } catch (err) {
                    console.error("Erro ao buscar usuários:", err);
                    setUserResults([]);
                } finally {
                    setLoadingUsers(false);
                }
            } else {
                setUserResults([]); // Limpa se a busca for limpa
            }
        };

        fetchUsers();
    }, [searchQuery]); // Depende apenas da query de busca

    // Buscar momentos quando página ou filtros mudarem
    useEffect(() => {
        fetchMomentos();
        // Scroll para o topo ao mudar de página
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [selectedTag, sortBy, searchQuery, currentPage, user]);

    const fetchMomentos = async () => {
        try {
            setLoading(true);
            setError('');

            const params = {
                page: currentPage,
                page_size: 9  // 9 momentos por página (3x3)
            };

            // Se sortBy for 'meus', filtrar por usuário logado
            if (sortBy === 'meus' && user) {
                params.usuario = user.username;
                params.sort = 'recent';
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

            // Resposta paginada do Django REST Framework
            const data = response.data?.results || response.data || [];
            const count = response.data?.count || 0;

            setMomentos(Array.isArray(data) ? data : []);
            setTotalCount(count);
            setTotalPages(Math.ceil(count / 9));

            console.log('✅ Momentos carregados:', data.length, 'itens');
            console.log('📊 Total:', count, '| Página:', currentPage, '/', Math.ceil(count / 9));
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
        setTotalCount(prev => prev - 1);
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

    // Funções de navegação de página
    const goToFirstPage = () => {
        setCurrentPage(1);
        setPageInput('1');
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
            setPageInput((currentPage - 1).toString());
        }
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
            setPageInput((currentPage + 1).toString());
        }
    };

    const goToLastPage = () => {
        setCurrentPage(totalPages);
        setPageInput(totalPages.toString());
    };

    const handlePageInputChange = (e) => {
        const value = e.target.value;
        // Permitir apenas números
        if (/^\d*$/.test(value)) {
            setPageInput(value);
        }
    };

    const handlePageInputSubmit = (e) => {
        e.preventDefault();
        const pageNumber = parseInt(pageInput, 10);

        if (pageNumber && pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        } else {
            // Resetar para página atual se inválido
            setPageInput(currentPage.toString());
        }
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
                return 'Mais Curtidos';
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
                        <circle cx="12" cy="8" r="4" strokeWidth="2"/>
                        <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" strokeWidth="2"/>
                    </svg>
                );
            case 'trending':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" fill="currentColor"/>
                    </svg>
                );
            case 'popular':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                );
            case 'recent':
            default:
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                );
        }
    };

    return (
        <>
            <Header user={user} onLogout={logout}/>

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
                    <div className="search-results-container">
                        <h2 className="search-results-title">
                            Resultados para "{searchQuery}"
                        </h2>

                        {/* Resultados de Usuários */}
                        {loadingUsers ? (
                            <div className="loading-spinner-small"></div>
                        ) : (
                            userResults.length > 0 && (
                                <div className="user-results-section">
                                    <h3>Usuários encontrados</h3>
                                    <div className="user-results-grid">
                                        {userResults.map((u) => (
                                            <Link key={u.id} to={`/profile/${u.username}`} className="user-result-card">
                                                <img
                                                    src={u.avatar || `https://ui-avatars.com/api/?name=${u.username}&background=3B82F6&color=fff`}
                                                    alt={u.username}
                                                />
                                                <span>{u.username}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )
                        )}

                        {/* Divisor */}
                        <hr className="search-divider" />
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

                    {/* Barra de Ordenação */}
                    <div className="sortBar">
                        <div className="sortInfo">
                            {getSortIcon()}
                            <span className="sortLabel">
                                {/* Título dinâmico se estiver buscando */}
                                {searchQuery ? "Resultados de Momentos" : getSortLabel()}
                            </span>
                            <span className="count">
                                ({totalCount} {totalCount === 1 ? 'momento' : 'momentos'})
                            </span>
                        </div>

                        <div className="sortButtons">
                            <button
                                onClick={() => handleSortChange('recent')}
                                className={`sortBtn ${sortBy === 'recent' ? 'sortBtnActive' : ''}`}
                                title="Momentos mais recentes"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                                Recentes
                            </button>
                            <button
                                onClick={() => handleSortChange('trending')}
                                className={`sortBtn ${sortBy === 'trending' ? 'sortBtnActive' : ''}`}
                                title="Momentos com mais visualizações"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                                Em Alta
                            </button>
                            <button
                                onClick={() => handleSortChange('popular')}
                                className={`sortBtn ${sortBy === 'popular' ? 'sortBtnActive' : ''}`}
                                title="Momentos com mais curtidas"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Populares
                            </button>

                            {user && (
                                <button
                                    onClick={() => handleSortChange('meus')}
                                    className={`sortBtn ${sortBy === 'meus' ? 'sortBtnActive' : ''}`}
                                    title="Seus vídeos publicados"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <circle cx="12" cy="8" r="4" strokeWidth="2"/>
                                        <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" strokeWidth="2"/>
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
                    <>
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

                        {/* Paginação */}
                        {totalPages > 1 && (
                            <div className="pagination">
                                <div className="pagination-info">
                                    Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
                                    <span className="pagination-total">
                                        ({(currentPage - 1) * 9 + 1}-{Math.min(currentPage * 9, totalCount)} de {totalCount})
                                    </span>
                                </div>

                                <div className="pagination-controls">
                                    {/* Primeira Página */}
                                    <button
                                        onClick={goToFirstPage}
                                        disabled={currentPage === 1}
                                        className="pagination-btn"
                                        title="Primeira página"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M11 19l-7-7 7-7M18 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </button>

                                    {/* Página Anterior */}
                                    <button
                                        onClick={goToPreviousPage}
                                        disabled={currentPage === 1}
                                        className="pagination-btn"
                                        title="Página anterior"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M15 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Anterior
                                    </button>

                                    {/* Input de Página */}
                                    <form onSubmit={handlePageInputSubmit} className="pagination-input-form">
                                        <span>Ir para:</span>
                                        <input
                                            type="text"
                                            value={pageInput}
                                            onChange={handlePageInputChange}
                                            className="pagination-input"
                                            placeholder={currentPage.toString()}
                                        />
                                        <button type="submit" className="pagination-go-btn">
                                            Ir
                                        </button>
                                    </form>

                                    {/* Próxima Página */}
                                    <button
                                        onClick={goToNextPage}
                                        disabled={currentPage === totalPages}
                                        className="pagination-btn"
                                        title="Próxima página"
                                    >
                                        Próxima
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </button>

                                    {/* Última Página */}
                                    <button
                                        onClick={goToLastPage}
                                        disabled={currentPage === totalPages}
                                        className="pagination-btn"
                                        title="Última página"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M13 5l7 7-7 7M6 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
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