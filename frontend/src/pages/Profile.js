import { useNavigate } from 'react-router-dom';
import './Profile.css';

/* ---------- Icons ---------- */
const IconEdit = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
  </svg>
);

const IconBox = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 8l-9 4-9-4 9-4z"/>
    <path d="M3 8v8l9 4 9-4V8"/>
    <path d="M12 12v8"/>
  </svg>
);

const IconHeart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const IconSwap = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="17 3 21 7 17 11"/>
    <line x1="3" y1="7" x2="21" y2="7"/>
    <polyline points="7 21 3 17 7 13"/>
    <line x1="21" y1="17" x2="3" y2="17"/>
  </svg>
);

const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const IconWhatsApp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12a9 9 0 1 1-3.6-7.2L21 3l-1.2 3.6A9 9 0 0 1 21 12z"/>
  </svg>
);

function Profile({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
    navigate('/login');
  };

  if (!user) return null;

  const locationLabel =
    user.location ||
    [user.city, user.country].filter(Boolean).join(', ') ||
    'No location set';

  const hasCoords = user.latitude != null && user.longitude != null;

  const menuItems = [
    { icon: IconEdit,  label: 'Edit profile',    onClick: () => navigate('/edit-profile') },
    { icon: IconBox,   label: 'My listings',     onClick: () => navigate('/my-items') },
    { icon: IconHeart, label: 'My matches',      onClick: () => navigate('/matches') },
    { icon: IconSwap,  label: 'Pending offers',  onClick: () => navigate('/offers') },
  ];

  return (
    <div className="page">
      {/* Profile header */}
      <header className="profile-header">
        <div className="profile-avatar">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <h1 className="profile-name">{user.username}</h1>
        <p className="profile-email">{user.email}</p>
        <p className="profile-location">{locationLabel}</p>
        {user.whatsapp && (
          <p className="profile-whatsapp">
            <IconWhatsApp />
            <span>{user.whatsapp}</span>
          </p>
        )}

        {!hasCoords && (
          <div className="profile-warning">
            Your address isn't pinned on the map yet. Tap{' '}
            <strong>Edit profile</strong> so nearby search can find you.
          </div>
        )}
      </header>

      {/* Menu */}
      <nav className="profile-menu">
        {menuItems.map(({ icon: Icon, label, onClick }) => (
          <button key={label} className="profile-menu-item" onClick={onClick}>
            <span className="profile-menu-icon"><Icon /></span>
            <span className="profile-menu-label">{label}</span>
            <span className="profile-menu-arrow"><IconChevronRight /></span>
          </button>
        ))}
      </nav>

      {/* Impact / mission */}
      <section className="profile-eco">
        <span className="eyebrow">Your impact</span>
        <h3 className="profile-eco-title">Why this matters</h3>
        <p className="profile-eco-msg">
          Every swap means one less new item produced and one less item in
          landfill. Keep going — small trades add up.
        </p>
      </section>

      {/* Logout */}
      <div className="profile-logout">
        <button className="btn btn-outline btn-block" onClick={handleLogout}>
          Log out
        </button>
      </div>

      <p className="profile-version">SwapHoot · v1.0</p>
    </div>
  );
}

export default Profile;
