import { useState, useEffect } from 'react';
import { getItems, getNearbyItems } from '../services/api';
import ItemCard from '../components/ItemCard';
import './Home.css';

function Home() {
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const categories = [
    { key: 'all', label: 'All', icon: '🌍' },
    { key: 'phones', label: 'Phones', icon: '📱' },
    { key: 'cameras', label: 'Cameras', icon: '📷' },
    { key: 'computers', label: 'Computers', icon: '💻' },
    { key: 'electronics', label: 'Electronics', icon: '🔌' },
    { key: 'fashion', label: 'Fashion', icon: '👕' },
    { key: 'games', label: 'Games', icon: '🎮' },
  ];

  useEffect(() => {
    loadItems();
  }, [activeCategory]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeCategory !== 'all') {
        params.category = activeCategory;
      }
      if (search) {
        params.search = search;
      }
      const res = await getItems(params);
      setItems(res.data.items);
    } catch (err) {
      console.error('Failed to load items:', err);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadItems();
  };

  return (
    <div className="page">
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-content">
          <h1 className="hero-title">Swap, don't shop 🌱</h1>
          <p className="hero-subtitle">Give your stuff a second life</p>
        </div>
        <span className="hero-mascot">🐢</span>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="search-container">
        <input
          type="text"
          className="input search-input"
          placeholder="🔍 Search nearby items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>

      {/* Category Pills */}
      <div className="category-scroll">
        {categories.map((cat) => (
          <button
            key={cat.key}
            className={`cat-pill ${activeCategory === cat.key ? 'cat-pill-active' : ''}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="loading-state">
          <span className="loading-mascot">🐢</span>
          <p>Turt is searching for items...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <span className="empty-mascot">🐻‍❄️</span>
          <h3>No items found</h3>
          <p className="text-secondary">Polar couldn't find anything. Try a different search!</p>
        </div>
      ) : (
        <div className="items-grid">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              distance={item.distance_km}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;
