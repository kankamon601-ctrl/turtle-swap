import { useNavigate } from 'react-router-dom';
import './Profile.css';

function Profile({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="page">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <h2>{user.username}</h2>
        <p className="text-secondary">{user.email}</p>
        <p className="text-small">{user.location || 'No location set'}</p>
      </div>

      {/* Menu */}
      <div className="profile-menu">
        <button className="profile-menu-item" onClick={() => navigate('/my-items')}>
          <span>📦</span>
          <span>My listings</span>
          <span className="menu-arrow">›</span>
        </button>
        <button className="profile-menu-item" onClick={() => navigate('/matches')}>
          <span>💚</span>
          <span>My matches</span>
          <span className="menu-arrow">›</span>
        </button>
        <button className="profile-menu-item" onClick={() => navigate('/offers')}>
          <span>🔄</span>
          <span>Pending offers</span>
          <span className="menu-arrow">›</span>
        </button>
      </div>

      {/* Eco Impact */}
      <div className="profile-eco">
        <h3>🌍 Your environmental impact</h3>
        <p className="eco-description">
          Every swap means one less new item produced and one less item in landfill.
        </p>
        <div className="eco-stat-row">
          <span className="eco-mascot">🐢</span>
          <p className="eco-stat-text">
            Keep swapping to help Turt protect the planet!
          </p>
        </div>
      </div>

      {/* Logout */}
      <button className="btn btn-outline btn-block mt-16" onClick={handleLogout}>
        Log out
      </button>

      <p className="profile-version">SwapMart v1.0 🌱</p>
    </div>
  );
}

export default Profile;
