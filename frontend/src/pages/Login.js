import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../services/api';
import './Login.css';

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (isRegister) {
        res = await register({ email, username, password, location });
      } else {
        res = await login({ email, password });
      }

      // Save token and user info
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
      <div className="login-hero">
        <span className="login-mascot">🐢</span>
        <h1>SwapMart 🌱</h1>
        <p>Swap, don't shop</p>
      </div>

      <div className="login-card card">
        <h2>{isRegister ? 'Create account' : 'Welcome back'}</h2>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="input"
              placeholder="your@email.com"
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
              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Chiang Mai"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? '...' : isRegister ? 'Create account 🌿' : 'Log in 🌿'}
          </button>
        </form>

        <p className="login-switch">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            className="link-btn"
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
          >
            {isRegister ? 'Log in' : 'Sign up'}
          </button>
        </p>
      </div>

      <p className="login-tagline">🐋 Every swap helps our planet</p>
    </div>
  );
}

export default Login;
