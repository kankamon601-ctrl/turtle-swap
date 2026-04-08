import { useNavigate } from 'react-router-dom';
import './ItemCard.css';

function ItemCard({ item, distance }) {
  const navigate = useNavigate();

  const gradients = {
    phones: 'item-img-forest',
    cameras: 'item-img-ocean',
    computers: 'item-img-arctic',
    electronics: 'item-img-forest',
    default: 'item-img-forest',
  };

  const icons = {
    phones: '\u{1F4F1}', cameras: '\u{1F4F7}', computers: '\u{1F4BB}',
    electronics: '\u{1F50C}', fashion: '\u{1F455}', home: '\u{1F3E0}',
    sports: '\u26BD', books: '\u{1F4DA}', games: '\u{1F3AE}', default: '\u{1F4E6}',
  };

  const conditionLabels = {
    new: '\u2728 New', like_new: '\u{1F33F} Like new',
    good: '\u{1F44D} Good', fair: '\u{1F527} Fair',
  };

  const gradientClass = gradients[item.category] || gradients.default;
  const icon = icons[item.category] || icons.default;
  const conditionLabel = conditionLabels[item.condition] || item.condition;
  const isSwapped = item.status === 'pending' || item.status === 'swapped';
  const firstImage = item.images && item.images.length > 0 ? item.images[0].image_url : null;

  return (
    <div className={`item-card card ${isSwapped ? 'item-card-swapped' : ''}`} onClick={() => navigate(`/item/${item.id}`)}>
      {isSwapped && (
        <div className="item-card-status-overlay">
          <span className="item-card-status-badge">
            {item.status === 'swapped' ? '\u{1F331} Swapped' : '\u{1F91D} Pending swap'}
          </span>
        </div>
      )}
      <div className={`item-card-img ${gradientClass}`}>
        {firstImage ? (
          <img src={firstImage} alt={item.title} className="item-card-photo" />
        ) : (
          <span className="item-card-icon">{icon}</span>
        )}
        {distance !== undefined && (
          <span className="item-card-distance">{distance} km</span>
        )}
      </div>
      <div className="item-card-info">
        <h3 className="item-card-title">{item.title}</h3>
        <div className="item-card-meta">
          <span className="badge badge-condition">{conditionLabel}</span>
          {item.owner && <span className="stars">{'\u2605'.repeat(5)}</span>}
        </div>
        {item.owner && (
          <div className="item-card-owner">
            <div className="avatar avatar-forest">
              {item.owner.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="item-card-owner-name">{item.owner.username}</span>
              <span className="item-card-owner-location">
                {item.owner.location || 'Unknown location'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ItemCard;
