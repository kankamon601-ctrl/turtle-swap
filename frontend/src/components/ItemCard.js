import { useNavigate } from 'react-router-dom';
import './ItemCard.css';

const CONDITION_LABELS = {
  new: 'New',
  like_new: 'Like new',
  good: 'Good',
  fair: 'Fair',
};

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

function ItemCard({ item, distance, browseList }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(
      `/item/${item.id}`,
      browseList ? { state: { browseList } } : undefined
    );
  };

  const conditionLabel = CONDITION_LABELS[item.condition] || item.condition;
  const categoryLabel = CATEGORY_LABELS[item.category] || item.category;
  const isSwapped = item.status === 'pending' || item.status === 'swapped';
  const firstImage =
    item.images && item.images.length > 0 ? item.images[0].image_url : null;

  return (
    <div
      className={`item-card ${isSwapped ? 'item-card-swapped' : ''}`}
      onClick={handleClick}
    >
      <div className="item-card-img">
        {firstImage ? (
          <img
            src={firstImage}
            alt={item.title}
            className="item-card-photo"
          />
        ) : (
          <div className="item-card-placeholder">
            <span className="eyebrow">{categoryLabel}</span>
          </div>
        )}

        {isSwapped && (
          <span className="item-card-status-badge">
            {item.status === 'swapped' ? 'Swapped' : 'Pending'}
          </span>
        )}

        {distance !== undefined && (
          <span className="item-card-distance">{distance} km</span>
        )}
      </div>

      <div className="item-card-info">
        <h3 className="item-card-title">{item.title}</h3>

        <div className="item-card-meta">
          <span className="badge badge-condition">{conditionLabel}</span>
        </div>

        {item.owner && (
          <div className="item-card-owner">
            <div className="avatar avatar-forest">
              {item.owner.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="item-card-owner-name">{item.owner.username}</span>
              <span className="item-card-owner-location">
                {item.owner.location || 'No location set'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ItemCard;
