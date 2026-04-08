import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyItems } from '../services/api';
import ItemCard from '../components/ItemCard';
import './MyItems.css';

function MyItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const res = await getMyItems();
      setItems(res.data.items);
    } catch (err) {
      console.error('Failed to load items:', err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">
          <span className="loading-mascot">🐢</span>
          <p>Loading your items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate('/profile')}>← Back to profile</button>
      <h2 className="mb-16">My listings 📦</h2>

      {items.length === 0 ? (
        <div className="empty-state">
          <span className="empty-mascot">🐻‍❄️</span>
          <h3>No items listed yet</h3>
          <p className="text-secondary mb-16">
            List your first item and give it a second life!
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/list')}>
            ➕ List an item
          </button>
        </div>
      ) : (
        <div className="my-items-grid">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export default MyItems;
