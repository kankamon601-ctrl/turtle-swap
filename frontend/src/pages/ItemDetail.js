import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getItem, getMyItems, sendOffer } from '../services/api';
import './ItemDetail.css';

function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [result, setResult] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    try {
      const res = await getItem(id);
      setItem(res.data.item);

      // Load my items for offer selection
      const myRes = await getMyItems();
      setMyItems(myRes.data.items.filter(i => i.status === 'active'));
    } catch (err) {
      console.error('Failed to load item:', err);
    }
    setLoading(false);
  };

  const handleSendOffer = async () => {
    if (!selectedItemId) return;
    setSending(true);
    try {
      await sendOffer({
        offered_item_id: selectedItemId,
        target_item_id: id,
        message: message,
      });
      setResult('success');
    } catch (err) {
      setResult(err.response?.data?.error || 'Failed to send offer');
    }
    setSending(false);
  };

  const icons = {
    phones: '📱', cameras: '📷', computers: '💻', electronics: '🔌',
    fashion: '👕', home: '🏠', sports: '⚽', books: '📚', games: '🎮', default: '📦',
  };

  const conditionLabels = {
    new: '✨ New', like_new: '🌿 Like new', good: '👍 Good', fair: '🔧 Fair',
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">
          <span className="loading-mascot">🐢</span>
          <p>Loading item details...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="page">
        <div className="empty-state">
          <span className="empty-mascot">🐻‍❄️</span>
          <h3>Item not found</h3>
          <button className="btn btn-primary mt-16" onClick={() => navigate('/')}>
            Back to home
          </button>
        </div>
      </div>
    );
  }

  const isOwner = currentUser && currentUser.id === item.user_id;
  const icon = icons[item.category] || icons.default;

  return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

      <div className="card detail-card">
        {item.images && item.images.length > 0 ? (
          <div className="detail-img">
            <img src={item.images[0].image_url} alt={item.title} style={{width:'100%',height:'100%',objectFit:'cover'}} />
          </div>
        ) : (
          <div className={`detail-img ${
            item.category === 'cameras' ? 'item-img-ocean' :
            item.category === 'computers' ? 'item-img-arctic' :
            'item-img-forest'
          }`}>
            <span className="detail-icon">{icon}</span>
          </div>
        )}

        {/* Show all images as thumbnails if multiple */}
        {item.images && item.images.length > 1 && (
          <div className="detail-thumbnails">
            {item.images.map((img, i) => (
              <img key={i} src={img.image_url} alt={`${item.title} ${i+1}`} className="detail-thumb" />
            ))}
          </div>
        )}

        <div className="detail-info">
          <h2>{item.title}</h2>

          <div className="detail-badges">
            <span className="badge badge-category">{item.category}</span>
            <span className="badge badge-condition">
              {conditionLabels[item.condition] || item.condition}
            </span>
            <span className="badge badge-matched">{item.status}</span>
          </div>

          {item.description && (
            <p className="detail-description">{item.description}</p>
          )}

          {item.owner && (
            <div className="detail-owner">
              <div className="avatar avatar-forest">
                {item.owner.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="detail-owner-name">{item.owner.username}</span>
                <span className="detail-owner-location">
                  {item.owner.location || 'Unknown location'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Offer section - only show if not the owner */}
      {!isOwner && item.status === 'active' && (
        <div className="mt-16">
          {result === 'success' ? (
            <div className="offer-success">
              <span>🐋</span>
              <div>
                <h3>Offer sent!</h3>
                <p className="text-secondary">
                  Wally is delivering your offer. You'll be notified if it's accepted!
                </p>
              </div>
            </div>
          ) : (
            <>
              {!showOffer ? (
                <button
                  className="btn btn-primary btn-block"
                  onClick={() => setShowOffer(true)}
                >
                  🔄 Offer to swap
                </button>
              ) : (
                <div className="card offer-form">
                  <h3 className="mb-8">Send an offer</h3>
                  <p className="text-secondary mb-16">
                    Pick one of your items to offer in exchange
                  </p>

                  {myItems.length === 0 ? (
                    <div className="text-secondary">
                      You don't have any items listed yet.{' '}
                      <button className="link-btn" onClick={() => navigate('/list')}>
                        List one now
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="form-group">
                        <label className="form-label">Your item *</label>
                        <select
                          className="input select"
                          value={selectedItemId}
                          onChange={(e) => setSelectedItemId(e.target.value)}
                        >
                          <option value="">Select an item to offer</option>
                          {myItems.map((myItem) => (
                            <option key={myItem.id} value={myItem.id}>
                              {myItem.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Message (optional)</label>
                        <textarea
                          className="input textarea"
                          placeholder="Tell them why you want to swap..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                        />
                      </div>

                      {typeof result === 'string' && result !== 'success' && (
                        <div className="error-msg mb-8">{result}</div>
                      )}

                      <button
                        className="btn btn-primary btn-block"
                        onClick={handleSendOffer}
                        disabled={!selectedItemId || sending}
                      >
                        {sending ? 'Sending...' : '🌿 Send offer'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {isOwner && (
        <p className="text-secondary mt-16" style={{ textAlign: 'center' }}>
          This is your item. Check the Offers tab to see incoming offers!
        </p>
      )}
    </div>
  );
}

export default ItemDetail;
