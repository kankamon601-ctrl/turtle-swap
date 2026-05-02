import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getOfferCount } from '../services/api';
import { ReactComponent as SwapHootLogo } from '../assets/swaphoot-logo.svg';
import './Navbar.css';

/* ---------- Line icons (no emoji in UI chrome) ---------- */
const IconHome = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 11l9-8 9 8"/>
    <path d="M5 10v10h14V10"/>
  </svg>
);

const IconPlus = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconSwap = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="17 3 21 7 17 11"/>
    <line x1="3" y1="7" x2="21" y2="7"/>
    <polyline points="7 21 3 17 7 13"/>
    <line x1="21" y1="17" x2="3" y2="17"/>
  </svg>
);

const IconHeart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconBell = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

/* ---------- Mascot cast for toast pop-ups ---------- */
const TOAST_MASCOTS = [
  { emoji: '\u{1F98E}', name: 'Gecko',  lines: ['new swap offer just landed!', 'someone wants to swap!'] },
  { emoji: '\u{1F989}', name: 'Owl',    lines: ['hoo-hoo — new offer for you!', 'a swap just came in.'] },
  { emoji: '\u{1F42C}', name: 'Finn',   lines: ['new offer splashing in!', 'someone\u2019s making a swap move.'] },
  { emoji: '\u{1F422}', name: 'Turtle', lines: ['slow and steady \u2014 new offer!', 'a fresh swap just arrived.'] },
  { emoji: '\u{1F43B}\u200D\u2744\uFE0F', name: 'Polar', lines: ['new swap in the wild!', 'someone wants to trade.'] },
  { emoji: '\u{1F40B}', name: 'Wally',  lines: ['big news \u2014 a new swap offer!', 'a swap just rolled in.'] },
  { emoji: '\u{1F98A}', name: 'Fox',    lines: ['sniffed out a new swap offer!', 'a fresh offer for you.'] },
  { emoji: '\u{1F438}', name: 'Frog',   lines: ['a new offer just hopped in!', 'swap alert!'] },
];

const pickMascot = () => TOAST_MASCOTS[Math.floor(Math.random() * TOAST_MASCOTS.length)];
const pickLine = (m) => m.lines[Math.floor(Math.random() * m.lines.length)];

function Navbar({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [offerCount, setOfferCount] = useState(0);
  const [toast, setToast] = useState(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (!user) return;
    loadOfferCount();
    const interval = setInterval(loadOfferCount, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadOfferCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, user]);

  const loadOfferCount = async () => {
    try {
      const res = await getOfferCount();
      const newCount = res.data.count;

      if (newCount > prevCountRef.current && prevCountRef.current >= 0) {
        const diff = newCount - prevCountRef.current;
        showToast(diff);
      }

      prevCountRef.current = newCount;
      setOfferCount(newCount);
    } catch (err) {}
  };

  const showToast = (diff) => {
    const mascot = pickMascot();
    setToast({ count: diff, mascot, line: pickLine(mascot) });
    setTimeout(() => setToast(null), 15000);
  };

  const tabs = user
    ? [
        { path: '/',        label: 'Home',    Icon: IconHome },
        { path: '/list',    label: 'List',    Icon: IconPlus },
        { path: '/offers',  label: 'Offers',  Icon: IconSwap, badge: offerCount },
        { path: '/matches', label: 'Matches', Icon: IconHeart },
        { path: '/profile', label: 'Profile', Icon: IconUser },
      ]
    : [
        { path: '/',      label: 'Browse',  Icon: IconHome },
        { path: '/login', label: 'Sign in', Icon: IconUser },
      ];

  return (
    <>
      <nav className="navbar">
        <button
          className="navbar-brand"
          onClick={() => navigate('/')}
          aria-label="SwapHoot home"
        >
          <SwapHootLogo className="navbar-logo" />
        </button>

        <div className="navbar-tabs">
          {tabs.map((tab) => {
            const { Icon } = tab;
            const active = location.pathname === tab.path;
            return (
              <button
                key={tab.path}
                className={`nav-tab ${active ? 'nav-active' : ''}`}
                onClick={() => navigate(tab.path)}
              >
                <span className="nav-icon-wrapper">
                  <span className="nav-icon"><Icon /></span>
                  {tab.badge > 0 && (
                    <span className="nav-badge">
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </span>
                <span className="nav-label">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {toast && (
        <div
          className="offer-toast"
          onClick={() => { setToast(null); navigate('/offers'); }}
        >
          <span className="offer-toast-mascot" aria-hidden="true">
            {toast.mascot.emoji}
          </span>
          <div className="offer-toast-body">
            <span className="offer-toast-msg">
              <strong>{toast.mascot.name} says:</strong>{' '}
              {toast.count === 1
                ? toast.line
                : `${toast.count} new swap offers for you!`}
            </span>
            <span className="offer-toast-action">Tap to review</span>
          </div>
          <button
            className="offer-toast-close"
            onClick={(e) => { e.stopPropagation(); setToast(null); }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}

export default Navbar;
