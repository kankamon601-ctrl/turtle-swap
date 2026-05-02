import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIncomingOffers, acceptOffer, rejectOffer, holdOffer } from '../services/api';
import './Offers.css';

/* ---------- Inline icons ---------- */
const OwlIcon = () => (
  <svg width="44" height="44" viewBox="0 0 64 64" fill="none" stroke="currentColor"
       strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 28c0-11 9-20 20-20s20 9 20 20v10c0 8-6 14-14 14h-12c-8 0-14-6-14-14V28z"/>
    <circle cx="24" cy="28" r="5"/>
    <circle cx="40" cy="28" r="5"/>
    <circle cx="24" cy="28" r="1.6" fill="currentColor"/>
    <circle cx="40" cy="28" r="1.6" fill="currentColor"/>
    <path d="M30 36l2 3 2-3"/>
  </svg>
);

const SwapArrowIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="17 3 21 7 17 11"/>
    <line x1="3" y1="7" x2="21" y2="7"/>
    <polyline points="7 21 3 17 7 13"/>
    <line x1="21" y1="17" x2="3" y2="17"/>
  </svg>
);

const EmailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2"/>
    <polyline points="3 7 12 13 21 7"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12a9 9 0 1 1-3.6-7.2L21 3l-1.2 3.6A9 9 0 0 1 21 12z"/>
    <path d="M8.5 9.5c0 4 3 7 7 7 1 0 1.5-.2 1.5-1v-1.2a.8.8 0 0 0-.6-.8l-1.6-.4a.8.8 0 0 0-.8.2l-.4.5a6.5 6.5 0 0 1-2.8-2.8l.5-.4a.8.8 0 0 0 .2-.8l-.4-1.6a.8.8 0 0 0-.8-.6H9.5c-.8 0-1 .5-1 1.5z"/>
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

function Offers() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchResult, setMatchResult] = useState(null);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    setLoading(true);
    try {
      const res = await getIncomingOffers();
      setOffers(res.data.offers);
    } catch (err) {
      console.error('Failed to load offers:', err);
    }
    setLoading(false);
  };

  const handleAccept = async () => {
    if (offers.length === 0) return;
    const offer = offers[0];
    try {
      const res = await acceptOffer(offer.id);
      setMatchResult(res.data.match);
      const fresh = await getIncomingOffers();
      setOffers(fresh.data.offers);
    } catch (err) {
      console.error('Failed to accept:', err);
    }
  };

  const handleReject = async () => {
    if (offers.length === 0) return;
    const offer = offers[0];
    try {
      await rejectOffer(offer.id);
      setOffers(prev => prev.slice(1));
    } catch (err) {
      console.error('Failed to reject:', err);
    }
  };

  const handleHold = async () => {
    if (offers.length === 0) return;
    const offer = offers[0];
    try {
      await holdOffer(offer.id);
      setOffers(prev => [...prev.slice(1), { ...offer, status: 'held' }]);
    } catch (err) {
      console.error('Failed to hold:', err);
    }
  };

  const currentOffer = offers.length > 0 ? offers[0] : null;

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <div className="page">
        <div className="state-block">
          <span className="eyebrow">Loading</span>
          <p className="state-block-msg">Fetching your offers…</p>
        </div>
      </div>
    );
  }

  /* ---------- Match confirmed ---------- */
  if (matchResult) {
    const offer = matchResult.offer;
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const otherUser =
      matchResult.user_a?.id === storedUser.id
        ? matchResult.user_b
        : matchResult.user_a;

    const otherWhatsapp = otherUser?.whatsapp || null;
    const waLink = otherWhatsapp
      ? `https://wa.me/${otherWhatsapp.replace(/[^0-9]/g, '')}`
      : null;
    const otherLocation =
      otherUser?.location ||
      [otherUser?.city, otherUser?.country].filter(Boolean).join(', ');

    const targetImg = offer.target_item.images?.[0]?.image_url;
    const offeredImg = offer.offered_item.images?.[0]?.image_url;
    const targetCat = CATEGORY_LABELS[offer.target_item.category] || offer.target_item.category;
    const offeredCat = CATEGORY_LABELS[offer.offered_item.category] || offer.offered_item.category;

    return (
      <div className="page">
        <div className="match-screen">
          <header className="match-header">
            <span className="match-owl"><OwlIcon /></span>
            <h1 className="match-title">Swap confirmed</h1>
            <p className="match-tagline">One less item produced · One less in landfill</p>
          </header>

          <div className="match-pair">
            <div className="match-item">
              <div className="match-item-img">
                {targetImg ? (
                  <img src={targetImg} alt={offer.target_item.title} />
                ) : (
                  <span className="eyebrow">{targetCat}</span>
                )}
              </div>
              <span className="match-item-tag">Your item</span>
              <span className="match-item-label">{offer.target_item.title}</span>
            </div>

            <span className="match-arrow"><SwapArrowIcon /></span>

            <div className="match-item">
              <div className="match-item-img">
                {offeredImg ? (
                  <img src={offeredImg} alt={offer.offered_item.title} />
                ) : (
                  <span className="eyebrow">{offeredCat}</span>
                )}
              </div>
              <span className="match-item-tag">Their item</span>
              <span className="match-item-label">{offer.offered_item.title}</span>
            </div>
          </div>

          <section className="match-contact">
            <span className="eyebrow match-contact-eyebrow">Contact your match</span>
            <p className="match-contact-intro">
              We've emailed both of you, but it can land in spam — reach out
              directly to arrange the exchange.
            </p>

            <div className="match-contact-person">
              <div className="avatar avatar-forest">
                {otherUser?.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="match-contact-name">{otherUser?.username}</div>
                {otherLocation && (
                  <div className="match-contact-location">{otherLocation}</div>
                )}
              </div>
            </div>

            <div className="match-contact-rows">
              <a
                href={`mailto:${otherUser?.email}`}
                className="match-contact-row"
              >
                <EmailIcon />
                <span>{otherUser?.email}</span>
              </a>

              {otherWhatsapp ? (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="match-contact-row"
                >
                  <WhatsAppIcon />
                  <span>{otherWhatsapp}</span>
                </a>
              ) : (
                <div className="match-contact-row match-contact-na">
                  <WhatsAppIcon />
                  <span>No WhatsApp provided</span>
                </div>
              )}
            </div>
          </section>

          <div className="match-actions">
            {offers.length > 0 ? (
              <button
                className="btn btn-primary btn-block"
                onClick={() => setMatchResult(null)}
              >
                Review next offer
              </button>
            ) : (
              <button
                className="btn btn-primary btn-block"
                onClick={() => navigate('/')}
              >
                Back to home
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Empty ---------- */
  if (!currentOffer) {
    return (
      <div className="page">
        <div className="state-block">
          <span className="eyebrow">Nothing to review</span>
          <h3 className="state-block-title">No pending offers</h3>
          <p className="state-block-msg">
            When someone proposes a swap for one of your items, it'll appear here.
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

  /* ---------- Review mode ---------- */
  const offeredItem = currentOffer.offered_item;
  const offerer = currentOffer.offerer;
  const isHeld = currentOffer.status === 'held';
  const allRemainingAreHeld =
    isHeld && !offers.some(o => o.status === 'pending');
  const offeredCategory =
    CATEGORY_LABELS[offeredItem.category] || offeredItem.category;
  const offeredCondition =
    CONDITION_LABELS[offeredItem.condition] || offeredItem.condition;
  const firstImage =
    offeredItem.images && offeredItem.images.length > 0
      ? offeredItem.images[0].image_url
      : null;

  return (
    <div className="page">
      <div className="offers-header">
        <span className="eyebrow">Review offer</span>
        <span className="offers-counter">{offers.length} total</span>
      </div>

      <p className="offers-sub">
        Offer for your <strong>{currentOffer.target_item.title}</strong>
      </p>

      {allRemainingAreHeld && (
        <div className="held-banner">
          You've reviewed all fresh offers — these are the ones you held.
        </div>
      )}

      <div className="offer-card">
        <div className="offer-card-img">
          {firstImage ? (
            <img
              src={firstImage}
              alt={offeredItem.title}
              className="offer-card-photo"
            />
          ) : (
            <div className="offer-card-placeholder">
              <span className="eyebrow">{offeredCategory}</span>
            </div>
          )}
          {isHeld && <span className="offer-held-badge">On hold</span>}
        </div>

        <div className="offer-card-info">
          <h3 className="offer-card-title">{offeredItem.title}</h3>

          <div className="offer-card-meta">
            <span className="badge badge-category">{offeredCategory}</span>
            <span className="badge badge-condition">{offeredCondition}</span>
          </div>

          <div className="offer-user">
            <div className="avatar avatar-forest">
              {offerer.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="offer-user-name">{offerer.username}</span>
              <span className="offer-user-location">
                {offerer.location || 'No location set'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {currentOffer.message && (
        <blockquote className="offer-message">
          "{currentOffer.message}"
        </blockquote>
      )}

      <div className="swipe-controls">
        <button className="btn btn-danger" onClick={handleReject}>
          Reject
        </button>
        <button className="btn btn-outline" onClick={handleHold}>
          Hold for later
        </button>
        <button className="btn btn-primary" onClick={handleAccept}>
          Accept swap
        </button>
      </div>
    </div>
  );
}

export default Offers;
