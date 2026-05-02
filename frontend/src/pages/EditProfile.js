import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, updateProfile } from '../services/api';
import { COUNTRY_OPTIONS } from '../data/countries';
import './EditProfile.css';

const IconChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

function EditProfile({ user, onUserUpdate }) {
  const navigate = useNavigate();
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    getMe()
      .then((res) => {
        const u = res.data.user;
        setCountry(u.country || '');
        setCity(u.city || '');
        setStreet(u.street || '');
        setPostalCode(u.postal_code || '');
        setWhatsapp(u.whatsapp || '');
        setEmailNotifications(u.email_notifications !== false);
      })
      .catch(() => {
        if (user) {
          setCountry(user.country || '');
          setCity(user.city || '');
          setStreet(user.street || '');
          setPostalCode(user.postal_code || '');
          setWhatsapp(user.whatsapp || '');
          setEmailNotifications(user.email_notifications !== false);
        }
      });
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setSaving(true);
    try {
      const res = await updateProfile({
        country,
        city,
        street,
        postal_code: postalCode,
        whatsapp,
        email_notifications: emailNotifications,
      });
      const updated = res.data.user;
      localStorage.setItem('user', JSON.stringify(updated));
      if (onUserUpdate) onUserUpdate(updated);
      if (res.data.geocoded === false) {
        setInfo(
          "Saved — but we couldn't locate your address. Try a more specific street or postal code so nearby items can find you."
        );
      } else {
        setInfo('Saved!');
        setTimeout(() => navigate('/profile'), 700);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save changes');
    }
    setSaving(false);
  };

  return (
    <div className="page">
      <div className="edit-nav">
        <button
          className="edit-back"
          onClick={() => navigate('/profile')}
          aria-label="Back to profile"
        >
          <IconChevronLeft />
          <span>Back</span>
        </button>
      </div>

      <header className="edit-header">
        <span className="eyebrow">Account</span>
        <h1 className="edit-title">Edit profile</h1>
      </header>

      <form className="edit-form" onSubmit={handleSubmit}>
        {error && <div className="error-msg">{error}</div>}
        {info && <div className="info-msg">{info}</div>}

        {/* Address section */}
        <div className="edit-section">
          <span className="eyebrow edit-section-eyebrow">Address</span>
          <p className="edit-section-hint">
            Help us find items near you. We'll show swaps within 20 km of your address.
          </p>

          <div className="form-group">
            <label className="form-label">Country</label>
            <select
              className="input select"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
            >
              <option value="">Select country</option>
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">City</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Stockholm"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Street</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. 45 Götgatan"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Postal code</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. 11820"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            />
          </div>
        </div>

        {/* WhatsApp section */}
        <div className="edit-section">
          <span className="eyebrow edit-section-eyebrow">WhatsApp (optional)</span>
          <p className="edit-section-hint">
            Shared with your match so you can arrange the swap.
          </p>

          <div className="form-group">
            <label className="form-label">WhatsApp number</label>
            <input
              type="tel"
              className="input"
              placeholder="e.g. +46701234567"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value.replace(/[^0-9+]/g, ''))}
            />
            <p className="edit-section-hint" style={{ marginTop: 6 }}>
              Include country code, e.g. +46 for Sweden, +1 for USA.
            </p>
          </div>
        </div>

        {/* Notifications section */}
        <div className="edit-section">
          <span className="eyebrow edit-section-eyebrow">Email notifications</span>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
            />
            <span>
              Send me email notifications for new offers and matches.
            </span>
          </label>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}

export default EditProfile;
