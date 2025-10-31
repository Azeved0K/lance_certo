import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import MomentoCard from '../components/gallery/MomentoCard';
import styles from '../styles/pages/Home.module.css';

// Dados mocados (futuramente virão da API)
const mockMomentos = [
    {
        id: 1,
        titulo: 'Gol Incrível do Neymar',
        descricao: 'Golaço de falta no ângulo!',
        thumbnail: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=300&fit=crop',
        duracao: '00:45',
        views: 1234,
        likes: 89,
        data: '2024-10-20',
        usuario: { nome: 'Carlos Santos', avatar: null },
        tags: ['Futebol', 'Gol']
    },
    {
        id: 2,
        titulo: 'Defesa Espetacular',
        descricao: 'Goleiro faz defesa impossível!',
        thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=300&fit=crop',
        duracao: '00:30',
        views: 2341,
        likes: 156,
        data: '2024-10-21',
        usuario: { nome: 'Maria Oliveira', avatar: null },
        tags: ['Futebol', 'Defesa']
    },
    {
        id: 3,
        titulo: 'Enterrada Sensacional',
        descricao: 'Jogador voa para a cesta!',
        thumbnail: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
        duracao: '00:20',
        views: 3456,
        likes: 234,
        data: '2024-10-22',
        usuario: { nome: 'Pedro Costa', avatar: null },
        tags: ['Basquete', 'Enterrada']
    },
    {
        id: 4,
        titulo: 'Ace no Vôlei',
        descricao: 'Saque impossível de receber!',
        thumbnail: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400&h=300&fit=crop',
        duracao: '00:15',
        views: 987,
        likes: 67,
        data: '2024-10-23',
        usuario: { nome: 'Ana Paula', avatar: null },
        tags: ['Vôlei', 'Ace']
    },
    {
        id: 5,
        titulo: 'Drible Desconcertante',
        descricao: 'Jogador deixa três na cara!',
        thumbnail: 'https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=400&h=300&fit=crop',
        duracao: '00:35',
        views: 4567,
        likes: 345,
        data: '2024-10-24',
        usuario: { nome: 'Lucas Ferreira', avatar: null },
        tags: ['Futebol', 'Drible']
    },
    {
        id: 6,
        titulo: 'Hat-trick Histórico',
        descricao: 'Três gols em 10 minutos!',
        thumbnail: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&h=300&fit=crop',
        duracao: '02:30',
        views: 8901,
        likes: 678,
        data: '2024-10-24',
        usuario: { nome: 'Roberto Lima', avatar: null },
        tags: ['Futebol', 'Gol']
    }
];

const mockTags = ['Todos', 'Futebol', 'Basquete', 'Vôlei', 'Gol', 'Defesa', 'Drible'];

const Home = ({ user, onLogout }) => {
    const [selectedTag, setSelectedTag] = useState('Todos');
    const [sortBy, setSortBy] = useState('recent');
    const [momentos, setMomentos] = useState(mockMomentos);

    useEffect(() => {
        // Futuramente: buscar momentos da API
        filterAndSort();
    }, [selectedTag, sortBy]);

    const filterAndSort = () => {
        let filtered = selectedTag === 'Todos'
            ? mockMomentos
            : mockMomentos.filter(m => m.tags.includes(selectedTag));

        filtered = [...filtered].sort((a, b) => {
            if (sortBy === 'popular') return b.views - a.views;
            if (sortBy === 'trending') return b.likes - a.likes;
            return new Date(b.data) - new Date(a.data);
        });

        setMomentos(filtered);
    };

    const handleLike = (momentoId, liked) => {
        console.log(`Momento ${momentoId} ${liked ? 'curtido' : 'descurtido'}`);
        // Futuramente: chamar API
    };

    return (
        <>
            <Header user={user} onLogout={onLogout} />

            {/* Hero */}
            <div className={styles.hero}>
                <div className="container">
                    <h1 className={styles.heroTitle}>
                        Lance Certo ⚽🏀
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Reviva os melhores momentos do esporte capturados por fãs como você!
                    </p>
                </div>
            </div>

            <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                {/* Filters */}
                <div className={styles.filters}>
                    <div className={styles.filterSection}>
                        <h2 className={styles.filterTitle}>Categorias</h2>
                        <div className={styles.tags}>
                            {mockTags.map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => setSelectedTag(tag)}
                                    className={`${styles.tag} ${selectedTag === tag ? styles.tagActive : ''}`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.sortBar}>
                        <div className={styles.sortInfo}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <span className={styles.sortLabel}>
                                {sortBy === 'trending' ? 'Em Alta' : sortBy === 'popular' ? 'Mais Vistos' : 'Recentes'}
                            </span>
                            <span className={styles.count}>({momentos.length} momentos)</span>
                        </div>

                        <div className={styles.sortButtons}>
                            <button
                                onClick={() => setSortBy('recent')}
                                className={`${styles.sortBtn} ${sortBy === 'recent' ? styles.sortBtnActive : ''}`}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" />
                                </svg>
                                Recentes
                            </button>
                            <button
                                onClick={() => setSortBy('trending')}
                                className={`${styles.sortBtn} ${sortBy === 'trending' ? styles.sortBtnActive : ''}`}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" />
                                </svg>
                                Em Alta
                            </button>
                            <button
                                onClick={() => setSortBy('popular')}
                                className={`${styles.sortBtn} ${sortBy === 'popular' ? styles.sortBtnActive : ''}`}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" />
                                </svg>
                                Populares
                            </button>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                {momentos.length > 0 ? (
                    <div className="grid grid-cols-3">
                        {momentos.map((momento) => (
                            <MomentoCard key={momento.id} momento={momento} onLike={handleLike} />
                        ))}
                    </div>
                ) : (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>😢</div>
                        <h3 className={styles.emptyTitle}>Nenhum momento encontrado</h3>
                        <p className={styles.emptyText}>Tente selecionar outra categoria</p>
                    </div>
                )}

                {/* CTA */}
                <div className={styles.cta}>
                    <h2 className={styles.ctaTitle}>Capture Seu Momento! 🎥</h2>
                    <p className={styles.ctaText}>
                        Não perca aquele lance incrível. Comece a gravar agora!
                    </p>
                    <Link to="/capture" className={styles.ctaButton}>
                        Começar a Capturar
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <footer className={styles.footer}>
                <div className="container text-center">
                    <p>© 2025 Lance Certo - Desenvolvido com ❤️ para os fãs de esporte.</p>
                </div>
            </footer>
        </>
    );
};

export default Home;