import { useState, useEffect } from 'react';
import { getMatches } from '../services/api';
import './Matches.css';

/* ---------- Icons ---------- */
const SwapArrowIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="17 3 21 7 17 11"/>
    <line x1="3" y1="7" x2="21" y2="7"/>
    <polyline points="7 21 3 17 7 13"/>
    <line x1="21" y1="17" x2="3" y2="17"/>
  </svg>
);

const EmailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2"/>
    <polyline points="3 7 12 13 21 7"/>
  </svg>
);

function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const res = await getMatches();
      setMatches(res.data.matches);
    } catch (err) {
      console.error('Failed to load matches:', err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="page">
        <div className="state-block">
          <span className="eyebrow">Loading</span>
          <p className="state-block-msg">Fetching your matches…</p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="page">
        <header className="matches-header">
          <span className="eyebrow">Your history</span>
          <h1 className="matches-title">My matches</h1>
        </header>
        <div className="state-block">
          <span className="eyebrow">Empty</span>
          <h3 className="state-block-title">No matches yet</h3>
          <p className="state-block-msg">
            When you accept an offer, your swap will show up here.
          </p>
        </div>
      </div>
    );
  }

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="page">
      <header className="matches-header">
        <span className="eyebrow">Your history</span>
        <h1 className="matches-title">My matches</h1>
        <p className="matches-sub">
          {matches.length} swap{matches.length !== 1 ? 's' : ''} completed ·
          {' '}{matches.length} item{matches.length !== 1 ? 's' : ''} kept out of landfill.
        </p>
      </header>

      <div className="matches-list">
        {matches.map((match) => {
          const offer = match.offer;
          const partner =
            match.user_a.id === storedUser.id ? match.user_b : match.user_a;

          return (
            <article key={match.id} className="matches-row">
              <header className="matches-row-head">
                <div className="avatar avatar-forest">
                  {partner.username.charAt(0).toUpperCase()}
                </div>
                <div className="matches-row-head-text">
                  <span className="matches-row-partner">
                    Matched with {partner.username}
                  </span>
                  <span className="matches-row-date">
                    {new Date(match.matched_at).toLocaleDateString()}
                  </span>
                </div>
              </header>

              <div className="matches-pair">
                <div className="matches-pair-item">
                  <span className="matches-pair-tag">Your item</span>
                  <span className="matches-pair-title">
                    {offer.target_item.title}
                  </span>
                </div>
                <span className="matches-pair-arrow">
                  <SwapArrowIcon />
                </span>
                <div className="matches-pair-item">
                  <span className="matches-pair-tag">Their item</span>
                  <span className="matches-pair-title">
                    {offer.offered_item.title}
                  </span>
                </div>
              </div>

              <a
                href={`mailto:${partner.email}`}
                className="btn btn-primary btn-block matches-contact-btn"
              >
                <EmailIcon />
                <span>Contact {partner.username}</span>
              </a>
            </article>
          );
        })}
      </div>

      {/* Impact tracker */}
      <section className="matches-impact">
        <span className="eyebrow">Your impact</span>
        <div className="matches-impact-grid">
          <div className="matches-impact-cell">
            <span className="matches-impact-num">{matches.length}</span>
            <span className="matches-impact-label">Items swapped</span>
          </div>
          <div className="matches-impact-cell">
            <span className="matches-impact-num">{matches.length}</span>
            <span className="matches-impact-label">Kept from landfill</span>
          </div>
        </div>
        <p className="matches-impact-msg">
          You've given {matches.length} item{matches.length !== 1 ? 's' : ''} a second life.
        </p>
      </section>
    </div>
  );
}

export default Matches;
