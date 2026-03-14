import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';
import { LogOut, Heart, User } from 'lucide-react';

export default function Navbar() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  }

  return (
    <nav className="swasth-navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <Heart color="#ec4899" size={24} fill="#ec4899" className="logo-icon" />
          SwasthAi
        </Link>
        <div className="navbar-links">
          <Link to={currentUser ? "/dashboard" : "/"} className="nav-link">Home</Link>
          <Link to="/vitals" className="nav-link">Vitals</Link>
          <Link to="/booking" className="nav-link">Doctor Booking</Link>
        </div>
        <div className="navbar-auth">
          {currentUser ? (
            <div className="user-menu">
              <span className="user-role-badge">{userRole === 'doctor' ? '👨‍⚕️ Doctor' : '👤 Patient'}</span>
              <button onClick={handleLogout} className="logout-btn">
                <LogOut size={18} /> Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="nav-link login-link">Log In</Link>
              <Link to="/signup" className="nav-link signup-btn">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
