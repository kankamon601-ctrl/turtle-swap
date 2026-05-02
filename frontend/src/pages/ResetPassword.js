import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { resetPassword } from '../services/api';
import './EditProfile.css';

const IconChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const validatePassword = (pw) => {
  if (pw.length < 8) return 'Password must be at least 8 characters';
  if (!/[a-zA-Z]/.test(pw)) return 'Password must include at least one letter';
  if (!/[0-9]/.test(pw)) return 'Password must include at least one number';
  if (/^(.)\1+$/.test(pw)) return 'Password cannot be all the same character';
  const common = [
    'password', '12345678', '123456789', '1234567890', 'qwerty123',
    'abcdefgh', 'abcd1234', 'iloveyou', 'password1', 'admin123',
  ];
  if (common.includes(pw.toLowerCase()))
    return 'That password is too common — pick something less guessable';
  return null;
};

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const pwError = validatePassword(password);
    if (pwError) {
      setError(pwError);
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Could not reset your password. The link may have expired.'
      );
    }
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="page">
        <div className="state-block">
          <span className="eyebrow">Done</span>
          <h2 className="state-block-title">Password updated</h2>
          <p className="state-block-msg">
            Heading to the sign-in page…
          </p>
        </div>
      </div>
    );
  }

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
        <h1 className="edit-title">Choose a new password</h1>
      </header>

      <form className="edit-form" onSubmit={handleSubmit}>
        {error && <div className="error-msg">{error}</div>}

        <div className="edit-section">
          <p className="edit-section-hint">
            Pick something you'll remember — at least 8 characters, with one
            letter and one number.
          </p>

          <div className="form-group">
            <label className="form-label">New password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm new password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={submitting}
        >
          {submitting ? 'Updating…' : 'Update password'}
        </button>

        <p
          className="edit-section-hint"
          style={{ textAlign: 'center', marginTop: 14, marginBottom: 0 }}
        >
          Need a new link?{' '}
          <Link to="/forgot-password" className="link-btn">
            Request another
          </Link>
        </p>
      </form>
    </div>
  );
}

export default ResetPassword;
