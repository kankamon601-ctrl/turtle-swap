import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyItems, deleteItem } from '../services/api';
import ItemCard from '../components/ItemCard';
import './MyItems.css';

/* ---------- Icons ---------- */
const IconChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/>
    <path d="M14 11v6"/>
  </svg>
);

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

  const handleDelete = async (itemId, itemTitle) => {
    if (!window.confirm(`Delete "${itemTitle}"? This cannot be undone.`)) return;
    try {
      await deleteItem(itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="state-block">
          <span className="eyebrow">Loading</span>
          <p className="state-block-msg">Fetching your listings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="my-items-nav">
        <button
          className="my-items-back"
          onClick={() => navigate('/profile')}
          aria-label="Back to profile"
        >
          <IconChevronLeft />
          <span>Back to profile</span>
        </button>
      </div>

      <header className="my-items-header">
        <span className="eyebrow">Your inventory</span>
        <h1 className="my-items-title">My listings</h1>
        {items.length > 0 && (
          <p className="my-items-sub">
            {items.length} item{items.length !== 1 ? 's' : ''} listed.
          </p>
        )}
      </header>

      {items.length === 0 ? (
        <div className="state-block">
          <span className="eyebrow">Empty</span>
          <h3 className="state-block-title">No items listed yet</h3>
          <p className="state-block-msg">
            List your first item and give it a second life.
          </p>
          <div className="state-action">
            <button className="btn btn-primary" onClick={() => navigate('/list')}>
              List an item
            </button>
          </div>
        </div>
      ) : (
        <div className="my-items-grid">
          {items.map((item) => (
            <div key={item.id} className="my-item-wrapper">
              <ItemCard item={item} />
              <div className="my-item-actions">
                <button
                  className="my-item-action my-item-edit"
                  onClick={() => navigate(`/edit-item/${item.id}`)}
                >
                  <IconEdit />
                  <span>Edit</span>
                </button>
                <button
                  className="my-item-action my-item-delete"
                  onClick={() => handleDelete(item.id, item.title)}
                >
                  <IconTrash />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyItems;
