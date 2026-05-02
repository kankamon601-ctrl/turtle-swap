import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getItem, getMyItems, sendOffer } from '../services/api';
import './ItemDetail.css';

/* ---------- Icons ---------- */
const IconChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const CATEGORY_LABELS = {
  electronics: 'Electronics',
  automotive: 'Automotive',
  home: 'Home',
  garden: 'Garden',
  sports: 'Sports',
  books: 'Books',
  hardware: 'Hardware',
  fashion: 'Fashion',
  other: 'Other',
};

const CONDITION_LABELS = {
  new: 'New',
  like_new: 'Like new',
  good: 'Good',
  fair: 'Fair',
};

const STATUS_LABELS = {
  active: 'Available',
  pending: 'Pending swap',
  swapped: 'Swapped',
};

function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const browseList = location.state?.browseList || [];
  const currentIdx = browseList.findIndex((i) => i.id === id);
  const prevItem = currentIdx > 0 ? browseList[currentIdx - 1] : null;
  const nextItem =
    currentIdx >= 0 && currentIdx < browseList.length - 1
      ? browseList[currentIdx + 1]
      : null;

  const goToItem = (targetId) => {
    navigate(`/item/${targetId}`, { state: { browseList } });
  };

  const [item, setItem] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    loadItem();
    setSelectedImageIdx(0);
    setShowOffer(false);
    setResult(null);
    setSelectedItemId('');
    setMessage('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadItem = async () => {
    try {
      const res = await getItem(id);
      setItem(res.data.item);
      if (currentUser) {
        const myRes = await getMyItems();
        setMyItems(myRes.data.items.filter((i) => i.status === 'active'));
      }
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

  if (loading) {
    return (
      <div className="page">
        <div className="state-block">
          <span className="eyebrow">Loading</span>
          <p className="state-block-msg">Fetching item details…</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="page">
        <div className="state-block">
          <span className="eyebrow">Not found</span>
          <h3 className="state-block-title">Item not found</h3>
          <p className="state-block-msg">
            It may have been removed or already swapped.
          </p>
          <div className="state-action">
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = currentUser && currentUser.id === item.user_id;
  const categoryLabel = CATEGORY_LABELS[item.category] || item.category;
  const conditionLabel = CONDITION_LABELS[item.condition] || item.condition;
  const statusLabel = STATUS_LABELS[item.status] || item.status;
  const showStatusBadge = item.status !== 'active';

  return (
    <div className="page">
      {/* Top bar: back + position indicator */}
      <div className="detail-nav-row">
        <button
          className="detail-back"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <IconChevronLeft />
          <span>Back</span>
        </button>
        {browseList.length > 0 && currentIdx >= 0 && (
          <span className="detail-position">
            Item {currentIdx + 1} of {browseList.length}
          </span>
        )}
      </div>

      {/* Side navigation */}
      {browseList.length > 0 && currentIdx >= 0 && (
        <>
          <button
            className="side-nav-btn side-nav-prev"
            onClick={() => prevItem && goToItem(prevItem.id)}
            disabled={!prevItem}
            aria-label="Previous item"
          >
            <IconChevronLeft />
            <span className="side-nav-label">Prev</span>
          </button>
          <button
            className="side-nav-btn side-nav-next"
            onClick={() => nextItem && goToItem(nextItem.id)}
            disabled={!nextItem}
            aria-label="Next item"
          >
            <span className="side-nav-label">Next</span>
            <IconChevronRight />
          </button>
        </>
      )}

      {/* Main card */}
      <div className="detail-card">
        <div className="detail-img">
          {item.images && item.images.length > 0 ? (
            <img
              src={item.images[selectedImageIdx].image_url}
              alt={item.title}
              className="detail-photo"
            />
          ) : (
            <div className="detail-placeholder">
              <span className="eyebrow">{categoryLabel}</span>
            </div>
          )}

          {showStatusBadge && (
            <span className="detail-status-badge">{statusLabel}</span>
          )}
        </div>

        {item.images && item.images.length > 1 && (
          <div className="detail-thumbnails">
            {item.images.map((img, i) => (
              <button
                key={i}
                className={`detail-thumb ${
                  i === selectedImageIdx ? 'detail-thumb-active' : ''
                }`}
                onClick={() => setSelectedImageIdx(i)}
                aria-label={`View image ${i + 1}`}
              >
                <img src={img.image_url} alt={`${item.title} ${i + 1}`} />
              </button>
            ))}
          </div>
        )}

        <div className="detail-info">
          <span className="eyebrow">{categoryLabel}</span>
          <h1 className="detail-title">{item.title}</h1>

          <div className="detail-badges">
            <span className="badge badge-condition">{conditionLabel}</span>
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
                  {item.owner.location || 'No location set'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Guest CTA */}
      {!currentUser && item.status === 'active' && (
        <div className="detail-guest">
          <span className="eyebrow">Not signed in</span>
          <h3 className="detail-guest-title">Want to make a swap?</h3>
          <p className="detail-guest-msg">
            Create an account to start trading with people nearby.
          </p>
          <button
            className="btn btn-primary btn-block"
            onClick={() => navigate('/login')}
          >
            Create account
          </button>
        </div>
      )}

      {/* Offer flow */}
      {currentUser && !isOwner && item.status === 'active' && (
        <div className="detail-offer-wrap">
          {result === 'success' ? (
            <>
              <div className="detail-success">
                <span className="eyebrow">Sent</span>
                <h3 className="detail-success-title">Offer on its way</h3>
                <p className="detail-success-msg">
                  {item.owner?.username || 'The owner'} will be notified. You'll
                  hear back if they accept.
                </p>
              </div>
              <button
                className="btn btn-primary btn-block"
                onClick={() => navigate('/')}
              >
                Back to home
              </button>
            </>
          ) : !showOffer ? (
            <button
              className="btn btn-primary btn-block"
              onClick={() => setShowOffer(true)}
            >
              Offer to swap
            </button>
          ) : (
            <div className="detail-offer-form">
              <span className="eyebrow">Send an offer</span>
              <h3 className="detail-offer-title">Pick an item to offer</h3>
              <p className="detail-offer-intro">
                Choose one of your listings in exchange for this one.
              </p>

              {myItems.length === 0 ? (
                <div className="detail-offer-empty">
                  You don't have any items listed yet.{' '}
                  <button className="link-btn" onClick={() => navigate('/list')}>
                    List one now
                  </button>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Your item</label>
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
                      placeholder="Tell them why you'd like to swap…"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>

                  {typeof result === 'string' && result !== 'success' && (
                    <div className="error-msg">{result}</div>
                  )}

                  <button
                    className="btn btn-primary btn-block"
                    onClick={handleSendOffer}
                    disabled={!selectedItemId || sending}
                  >
                    {sending ? 'Sending…' : 'Send offer'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {isOwner && (
        <p className="detail-owner-note">
          This is your item. Check the Offers tab to see incoming offers.
        </p>
      )}
    </div>
  );
}

export default ItemDetail;
