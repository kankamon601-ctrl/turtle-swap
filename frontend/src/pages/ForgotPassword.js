import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../services/api';
import './EditProfile.css';

const IconChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setInfo('');
    setError('');
    if (!email) {
      setError('Enter the email you signed up with.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await forgotPassword(email);
      setInfo(
        res.data?.message ||
          'If an account exists for that email, a reset link is on its way.'
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    }
    setSubmitting(false);
  };

  return (
    <div className="page">
      <div className="edit-nav">
        <button
          className="edit-back"
          onClick={() => navigate('/login')}
          aria-label="Back to sign in"
        >
          <IconChevronLeft />
          <span>Back to sign in</span>
        </button>
      </div>

      <header className="edit-header">
        <span className="eyebrow">Account</span>
        <h1 className="edit-title">Forgot your password?</h1>
      </header>

      <form className="edit-form" onSubmit={handleSubmit}>
        {error && <div className="error-msg">{error}</div>}
        {info && <div className="info-msg">{info}</div>}

        <div className="edit-section">
          <p className="edit-section-hint">
            Enter the email address tied to your SwapHoot account and we'll send
            you a link to pick a new password. The link is good for one hour.
          </p>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={submitting}
        >
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>

        <p
          className="edit-section-hint"
          style={{ textAlign: 'center', marginTop: 14, marginBottom: 0 }}
        >
          Remembered it? <Link to="/login" className="link-btn">Sign in</Link>
        </p>
      </form>
    </div>
  );
}

export default ForgotPassword;
