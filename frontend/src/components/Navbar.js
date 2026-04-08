import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getOfferCount } from '../services/api';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [offerCount, setOfferCount] = useState(0);

  useEffect(() => {
    loadOfferCount();
    const interval = setInterval(loadOfferCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadOfferCount();
  }, [location.pathname]);

  const loadOfferCount = async () => {
    try {
      const res = await getOfferCount();
      setOfferCount(res.data.count);
    } catch (err) {}
  };

  const tabs = [
    { path: '/', label: 'Home', icon: '\u{1F3E0}' },
    { path: '/list', label: 'List', icon: '\u{2795}' },
    { path: '/offers', label: 'Offers', icon: '\u{1F504}', badge: offerCount },
    { path: '/matches', label: 'Matches', icon: '\u{1F49A}' },
    { path: '/profile', label: 'Profile', icon: '\u{1F464}' },
  ];

  return (
    <nav className="navbar">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          className={`nav-tab ${location.pathname === tab.path ? 'nav-active' : ''}`}
          onClick={() => navigate(tab.path)}
        >
          <span className="nav-icon-wrapper">
            <span className="nav-icon">{tab.icon}</span>
            {tab.badge > 0 && <span className="nav-badge"></span>}
          </span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default Navbar;
