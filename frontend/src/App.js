import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Terms from './pages/Terms';
import ListItem from './pages/ListItem';
import Offers from './pages/Offers';
import Matches from './pages/Matches';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import ItemDetail from './pages/ItemDetail';
import EditItem from './pages/EditItem';
import MyItems from './pages/MyItems';
import './index.css';

function App() {
  // Check if user is already logged in (token exists in localStorage)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleUserUpdate = (updated) => {
    setUser(updated);
  };

  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          {/* Login page — no navbar */}
          <Route
            path="/login"
            element={
              user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
            }
          />

          {/* Password reset — public, even when logged in is fine */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Legal — public */}
          <Route path="/terms" element={<Terms />} />

          {/* Public pages — no login required */}
          <Route path="/" element={<Home />} />
          <Route path="/item/:id" element={<ItemDetail />} />

          {/* Protected pages — require login */}
          <Route
            path="/list"
            element={user ? <ListItem /> : <Navigate to="/login" />}
          />
          <Route
            path="/offers"
            element={user ? <Offers /> : <Navigate to="/login" />}
          />
          <Route
            path="/matches"
            element={user ? <Matches /> : <Navigate to="/login" />}
          />
          <Route
            path="/profile"
            element={
              user ? (
                <Profile user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/edit-profile"
            element={
              user ? (
                <EditProfile user={user} onUserUpdate={handleUserUpdate} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/edit-item/:id"
            element={user ? <EditItem /> : <Navigate to="/login" />}
          />
          <Route
            path="/my-items"
            element={user ? <MyItems /> : <Navigate to="/login" />}
          />
        </Routes>

        {/* Show navbar always — adapts for guests vs logged-in */}
        <Navbar user={user} />
      </div>
    </BrowserRouter>
  );
}

export default App;
