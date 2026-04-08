import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import ListItem from './pages/ListItem';
import Offers from './pages/Offers';
import Matches from './pages/Matches';
import Profile from './pages/Profile';
import ItemDetail from './pages/ItemDetail';
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

          {/* Protected pages — require login */}
          <Route
            path="/"
            element={user ? <Home /> : <Navigate to="/login" />}
          />
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
            path="/item/:id"
            element={user ? <ItemDetail /> : <Navigate to="/login" />}
          />
          <Route
            path="/my-items"
            element={user ? <MyItems /> : <Navigate to="/login" />}
          />
        </Routes>

        {/* Show navbar only when logged in */}
        {user && <Navbar />}
      </div>
    </BrowserRouter>
  );
}

export default App;
