import { useState, useEffect } from 'react';
import { getIncomingOffers, acceptOffer, rejectOffer } from '../services/api';
import './Offers.css';

function Offers() {
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
      // Remove accepted offer from list
      setOffers(prev => prev.slice(1));
    } catch (err) {
      console.error('Failed to accept:', err);
    }
  };

  const handleReject = async () => {
    if (offers.length === 0) return;
    const offer = offers[0];
    try {
      await rejectOffer(offer.id);
      // Remove rejected offer from list
      setOffers(prev => prev.slice(1));
    } catch (err) {
      console.error('Failed to reject:', err);
    }
  };

  const currentOffer = offers.length > 0 ? offers[0] : null;

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">
          <span className="loading-mascot">{'\u{1F42C}'}</span>
          <p>Finn is loading your offers...</p>
        </div>
      </div>
    );
  }

  if (matchResult) {
    const offer = matchResult.offer;
    return (
      <div className="page">
        <div className="match-celebration">
          <span className="match-whale">{'\u{1F40B}'}</span>
          <h2 className="match-heading">It's a match!</h2>
          <p className="match-sub">Wally is doing a happy dance {'\u{1F30A}'}</p>

          <div className="match-swap-pair">
            <div className="match-swap-item">
              <div className="match-swap-img item-img-forest">{'\u{1F4E6}'}</div>
              <span className="match-swap-label">{offer.target_item.title}</span>
            </div>
            <span className="match-swap-arrow">{'\u21C4'}</span>
            <div className="match-swap-item">
              <div className="match-swap-img item-img-ocean">{'\u{1F4E6}'}</div>
              <span className="match-swap-label">{offer.offered_item.title}</span>
            </div>
          </div>

          <div className="eco-message">
            <span>{'\u{1F331}'}</span>
            <p>By swapping instead of buying new, you helped save resources!</p>
          </div>

          <button
            className="btn btn-primary btn-block mt-16"
            onClick={() => setMatchResult(null)}
          >
            {offers.length > 0 ? 'Continue swiping' : 'Done'}
          </button>
        </div>
      </div>
    );
  }

  if (!currentOffer) {
    return (
      <div className="page">
        <div className="empty-state">
          <span className="empty-mascot">{'\u{1F43B}\u200D\u2744\uFE0F'}</span>
          <h3>No pending offers</h3>
          <p className="text-secondary">
            Polar says: when someone offers to swap with you, you'll see it here!
          </p>
        </div>
      </div>
    );
  }

  const offeredItem = currentOffer.offered_item;
  const offerer = currentOffer.offerer;

  return (
    <div className="page">
      <div className="offers-header">
        <h2>Review offers</h2>
        <span className="text-secondary">
          1 of {offers.length}
        </span>
      </div>

      <p className="text-secondary mb-8">
        Offers for your {currentOffer.target_item.title}
      </p>

      <div className="card offer-card">
        <div className={`offer-card-img ${
          offeredItem.category === 'cameras' ? 'item-img-ocean' :
          offeredItem.category === 'computers' ? 'item-img-arctic' :
          'item-img-forest'
        }`}>
          {offeredItem.images && offeredItem.images.length > 0 ? (
            <img src={offeredItem.images[0].image_url} alt={offeredItem.title} style={{width:'100%',height:'100%',objectFit:'cover'}} />
          ) : (
            <span className="offer-card-icon">
              {offeredItem.category === 'cameras' ? '\u{1F4F7}' :
               offeredItem.category === 'computers' ? '\u{1F4BB}' :
               offeredItem.category === 'phones' ? '\u{1F4F1}' : '\u{1F4E6}'}
            </span>
          )}
        </div>
        <div className="offer-card-info">
          <h3>{offeredItem.title}</h3>
          <div className="flex gap-8 mt-8">
            <span className="badge badge-category">{offeredItem.category}</span>
            <span className="badge badge-condition">{offeredItem.condition}</span>
          </div>

          <div className="offer-user mt-8">
            <div className="avatar avatar-ocean">
              {offerer.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="offer-user-name">{offerer.username}</span>
              <span className="offer-user-location">
                {offerer.location || 'Unknown'} <span className="stars">{'\u2605\u2605\u2605\u2605'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {currentOffer.message && (
        <div className="offer-message mt-8">
          "{currentOffer.message}"
        </div>
      )}

      <div className="swipe-controls">
        <button className="swipe-btn swipe-reject" onClick={handleReject}>
          {'\u2717'}
        </button>
        <button className="swipe-btn swipe-accept" onClick={handleAccept}>
          {'\u2713'}
        </button>
      </div>

      <p className="text-small" style={{ textAlign: 'center' }}>
        {'\u{1F42C}'} Finn says: check their rating before you swap!
      </p>
    </div>
  );
}

export default Offers;
