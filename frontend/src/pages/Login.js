import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, register } from '../services/api';
import { COUNTRY_OPTIONS } from '../data/countries';
import { ReactComponent as SwapHootLogo } from '../assets/swaphoot-logo.svg';
import './Login.css';

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (pw) => {
    if (pw.length < 8) return 'Password must be at least 8 characters';
    if (!/[a-zA-Z]/.test(pw)) return 'Password must include at least one letter';
    if (!/[0-9]/.test(pw)) return 'Password must include at least one number';
    if (/^(.)\1+$/.test(pw)) return 'Password cannot be all the same character';
    const common = [
      'password', '12345678', '123456789', '1234567890', 'qwerty123',
      'abcdefgh', 'abcd1234', 'iloveyou', 'password1', 'admin123',
    ];
    if (common.includes(pw.toLowerCase())) return 'That password is too common — pick something less guessable';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setWarning('');

    if (isRegister) {
      const pwError = validatePassword(password);
      if (pwError) { setError(pwError); return; }
      if (!agreedToTerms) {
        setError('Please agree to the SwapHoot Terms of Service to continue.');
        return;
      }
    }

    setLoading(true);

    try {
      let res;
      if (isRegister) {
        res = await register({
          email,
          username,
          password,
          country,
          city,
          street,
          postal_code: postalCode,
          whatsapp,
          email_notifications: emailNotifications,
          terms_accepted: agreedToTerms,
        });
        if (res.data.geocoded === false) {
          setWarning(
            "We couldn't locate your address yet, so nearby search won't include you. You can fix it later from your profile."
          );
        }
      } else {
        res = await login({ email, password });
      }

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin(res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-layout">

        <div className="login-hero">
          <SwapHootLogo className="login-logo" />
          <p className="login-intro">
            Less new stuff. Less landfill.
          </p>
          <p className="login-intro-sub">
            A marketplace for trading things you don't use — no money, no waste.
          </p>
        </div>

        <div className="login-card">
          <h2>{isRegister ? 'Create an account' : 'Welcome back'}</h2>

          {error && <div className="error-msg">{error}</div>}
          {warning && <div className="warning-msg">{warning}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {isRegister && (
              <>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Pick a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="form-section-label">Location</div>

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
                    placeholder="Stockholm"
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
                    placeholder="123 Drottninggatan"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Postal code</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="11151"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>

                <div className="form-section-label">Contact</div>
                <p className="form-hint">
                  Your WhatsApp number is shared only with someone you match with,
                  so you can arrange the swap. Optional — you can add it later.
                </p>

                <div className="form-group">
                  <label className="form-label">WhatsApp number</label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="+46701234567"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value.replace(/[^0-9+]/g, ''))}
                  />
                  <p className="form-hint" style={{ marginTop: 6 }}>
                    Include your country code — e.g. +46 for Sweden, +1 for USA.
                  </p>
                </div>

                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                  />
                  <span>
                    Email me when I have a new offer or match.
                  </span>
                </label>

                <label className="checkbox-row checkbox-row-terms">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    required
                  />
                  <span>
                    I am at least 18 and I agree to the{' '}
                    <Link
                      to="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-btn"
                    >
                      SwapHoot Terms of Service
                    </Link>
                    .
                  </span>
                </label>
              </>
            )}

            <div className="form-group" style={{ marginTop: isRegister ? 18 : 0 }}>
              <label className="form-label">Password</label>
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {isRegister && (
                <p className="form-hint" style={{ marginTop: 6 }}>
                  At least 8 characters, with one letter and one number.
                </p>
              )}
              {!isRegister && (
                <p className="login-forgot">
                  <Link to="/forgot-password" className="link-btn">
                    Forgot password?
                  </Link>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="login-switch">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              className="link-btn"
              onClick={() => { setIsRegister(!isRegister); setError(''); setWarning(''); }}
            >
              {isRegister ? 'Sign in' : 'Create one'}
            </button>
          </p>
        </div>

        <p className="login-footer">
          One less item produced. One less in landfill.
        </p>

      </div>
    </div>
  );
}

export default Login;
