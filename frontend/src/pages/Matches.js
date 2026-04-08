import { useState, useEffect } from 'react';
import { getMatches } from '../services/api';
import './Matches.css';

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
        <div className="loading-state">
          <span className="loading-mascot">🐋</span>
          <p>Wally is finding your matches...</p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="page">
        <h2 className="mb-16">My matches</h2>
        <div className="empty-state">
          <span className="empty-mascot">🐻‍❄️</span>
          <h3>No matches yet</h3>
          <p className="text-secondary">
            Accept an offer to create your first match!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h2 className="mb-16">My matches 💚</h2>

      <div className="matches-list">
        {matches.map((match) => {
          const offer = match.offer;
          const partner = match.user_a.id === JSON.parse(localStorage.getItem('user')).id
            ? match.user_b
            : match.user_a;

          return (
            <div key={match.id} className="card match-card">
              <div className="match-card-header">
                <div className="avatar avatar-ocean">
                  {partner.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="match-partner-name">
                    Matched with {partner.username}
                  </span>
                  <span className="match-date">
                    {new Date(match.matched_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="match-items">
                <div className="match-item">
                  <span className="match-item-label">Your item</span>
                  <span className="match-item-title">{offer.target_item.title}</span>
                </div>
                <span className="match-arrow">⇄</span>
                <div className="match-item">
                  <span className="match-item-label">Their item</span>
                  <span className="match-item-title">{offer.offered_item.title}</span>
                </div>
              </div>

              <div className="match-contact">
                <a href={`mailto:${partner.email}`} className="btn btn-primary btn-block">
                  📧 Contact {partner.username}
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Impact tracker */}
      <div className="impact-section mt-16">
        <h3 className="mb-8">🌱 Your impact</h3>
        <div className="impact-grid">
          <div className="impact-card">
            <span className="impact-number">{matches.length}</span>
            <span className="impact-label">Items swapped</span>
          </div>
          <div className="impact-card">
            <span className="impact-number">{matches.length}</span>
            <span className="impact-label">Items saved from landfill</span>
          </div>
        </div>
        <p className="impact-message">
          🐢 You've given {matches.length} item{matches.length !== 1 ? 's' : ''} a second life!
        </p>
      </div>
    </div>
  );
}

export default Matches;
