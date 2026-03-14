import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import './Navbar.css';
import { LogOut, Heart, User, Settings } from 'lucide-react';

export default function Navbar() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  }

  const [dp, setDp] = useState('');

  React.useEffect(() => {
    if (!currentUser) {
      setDp('');
      return;
    }
    const userRef = ref(db, `users/${currentUser.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists() && snapshot.val().displayPicture) {
        setDp(snapshot.val().displayPicture);
      } else {
        setDp('');
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  return (
    <nav className="swasth-navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <Heart color="#ec4899" size={24} fill="#ec4899" className="logo-icon" />
          SwasthAi
        </Link>
        <div className="navbar-links">
          <Link to={currentUser ? (userRole === 'hospital' ? "/hospital/dashboard" : userRole === 'doctor' ? "/doctor/dashboard" : "/dashboard") : "/"} className="nav-link">Home</Link>
          <Link to="/vitals" className="nav-link">Vitals</Link>
          <Link to="/booking" className="nav-link">Doctor Booking</Link>
        </div>
        <div className="navbar-auth">
          {currentUser ? (
            <div className="user-menu">
              <span className="user-role-badge">
                {userRole === 'doctor' ? '👨‍⚕️ Doctor' : userRole === 'hospital' ? '🏥 Hospital' : '👤 Patient'}
              </span>
              <Link to="/profile" className="profile-btn-nav" title="My Profile">
                {dp ? <img src={dp} alt="Profile" className="nav-dp" /> : <User size={18} />}
              </Link>
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
