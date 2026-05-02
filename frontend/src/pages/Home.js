import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getItems, getNearbyItems } from '../services/api';
import ItemCard from '../components/ItemCard';
import './Home.css';

const PER_PAGE = 20;

const CATEGORIES = [
  { key: 'all',         label: 'All' },
  { key: 'electronics', label: 'Electronics' },
  { key: 'automotive', label: 'Automotive' },
  { key: 'home',        label: 'Home' },
  { key: 'garden',      label: 'Garden' },
  { key: 'sports',      label: 'Sports' },
  { key: 'books',       label: 'Books' },
  { key: 'hardware',    label: 'Hardware' },
  { key: 'fashion',     label: 'Fashion' },
  { key: 'other',       label: 'Other' },
];

// Reusable 16x16 line icons (no emojis in UI chrome)
const SearchIcon = () => (
  <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7"/>
    <line x1="21" y1="21" x2="16.5" y2="16.5"/>
  </svg>
);

const PinIcon = () => (
  <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z"/>
    <circle cx="12" cy="9" r="2.5"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth="2.5"
       strokeLinecap="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

function Home() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
  const userHasCoords =
    storedUser && storedUser.latitude != null && storedUser.longitude != null;

  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [nearbyOnly, setNearbyOnly] = useState(userHasCoords);

  useEffect(() => {
    loadItems(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, nearbyOnly]);

  const loadItems = async (pageNum, replace) => {
    if (replace) setLoading(true); else setLoadingMore(true);
    try {
      const extra = {};
      if (activeCategory !== 'all') extra.category = activeCategory;
      if (search) extra.search = search;
      if (location) extra.location = location;

      if (nearbyOnly && userHasCoords) {
        const res = await getNearbyItems(
          storedUser.latitude, storedUser.longitude, 0, extra
        );
        setItems(res.data.items);
        setPage(1);
        setTotalPages(1);
        setTotal(res.data.total);
      } else {
        const params = { page: pageNum, per_page: PER_PAGE, ...extra };
        const res = await getItems(params);
        const newItems = res.data.items;
        setItems((prev) => (replace ? newItems : [...prev, ...newItems]));
        setPage(res.data.page);
        setTotalPages(res.data.pages);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error('Failed to load items:', err);
    }
    setLoading(false);
    setLoadingMore(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadItems(1, true);
  };

  const handleLoadMore = () => loadItems(page + 1, false);

  const handleToggleNearby = () => {
    if (!userHasCoords) {
      if (window.confirm(
        "You haven't set your address yet, so we can't sort by distance.\n\nGo to your profile now to add it?"
      )) {
        navigate('/edit-profile');
      }
      return;
    }
    setNearbyOnly((prev) => !prev);
  };

  const hasMore = !nearbyOnly && page < totalPages;

  return (
    <div className="page home-page">
      <header className="home-header">
        <h1 className="home-title">Browse swaps</h1>
        <p className="home-sub">
          Trade things you don't use. Find things you need.
        </p>
      </header>

      <form onSubmit={handleSearch} className="search-dual">
        <div className="search-field">
          <SearchIcon />
          <input
            type="text"
            className="input search-input"
            placeholder="What are you looking for?"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="search-divider" />
        <div className="search-field search-field-location">
          <PinIcon />
          <input
            type="text"
            className="input search-input"
            placeholder="City, country"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <button type="submit" className="search-btn">Search</button>
      </form>

      {storedUser && (
        <div className="filter-row">
          <button
            type="button"
            className={`filter-chip ${nearbyOnly ? 'is-active' : ''}`}
            onClick={handleToggleNearby}
            title={
              userHasCoords
                ? 'Sort items by distance from your address'
                : 'Add your address to sort by distance'
            }
          >
            {nearbyOnly ? 'Sorted by distance' : 'Sort by distance'}
          </button>
          {!userHasCoords && (
            <span className="filter-hint">
              <button
                className="link-btn"
                onClick={() => navigate('/edit-profile')}
              >
                Add your address
              </button>{' '}
              to sort by distance
            </span>
          )}
        </div>
      )}

      <nav className="category-scroll" aria-label="Categories">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={`cat-tab ${activeCategory === cat.key ? 'is-active' : ''}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </nav>

      {loading ? (
        <div className="state-block">
          <p className="state-text">Loading items…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="state-block">
          <h3 className="state-heading">Nothing matches</h3>
          <p className="state-text">
            {nearbyOnly
              ? "No items found with distance sort on. Try turning it off or broadening your search."
              : "No items found. Try a different search or category."}
          </p>
        </div>
      ) : (
        <>
          <p className="results-count">
            {nearbyOnly
              ? `${items.length} ${items.length === 1 ? 'item' : 'items'} — sorted by distance`
              : `${items.length} of ${total} ${total === 1 ? 'item' : 'items'}`}
          </p>

          <div className="items-grid">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                distance={item.distance_km}
                browseList={items}
              />
            ))}
          </div>

          {hasMore && (
            <div className="load-more-wrap">
              <button
                className="btn btn-outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}

          {!hasMore && !nearbyOnly && items.length >= PER_PAGE && (
            <p className="results-end">End of results</p>
          )}
        </>
      )}

      {storedUser && (
        <button
          className="fab-list"
          onClick={() => navigate('/list')}
          aria-label="List an item"
        >
          <PlusIcon />
          <span className="fab-list-label">List an item</span>
        </button>
      )}
    </div>
  );
}

export default Home;
