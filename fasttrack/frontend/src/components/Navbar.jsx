import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import './Navbar.css';
import { LogOut, Heart, User, Globe } from 'lucide-react';

export default function Navbar() {
  const { currentUser, userRole, logout } = useAuth();
  const { language, setLanguage, t, languages } = useLanguage();
  const navigate = useNavigate();
  const [langOpen, setLangOpen] = useState(false);

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

  const roleLabel = userRole === 'doctor' ? t('roleDoctor') : userRole === 'hospital' ? t('roleHospital') : userRole === 'auditor' ? t('roleAuditor') : t('rolePatient');

  return (
    <nav className="swasth-navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <Heart color="#ec4899" size={24} fill="#ec4899" className="logo-icon" />
          {t('landingTitle')}
        </Link>
        <div className="navbar-links">
          <Link to={currentUser ? (userRole === 'hospital' ? "/hospital/dashboard" : userRole === 'doctor' ? "/doctor/dashboard" : "/dashboard") : "/"} className="nav-link">{t('navHome')}</Link>
          <Link to="/vitals" className="nav-link">{t('navVitals')}</Link>
          <Link to="/booking" className="nav-link">{t('navDoctorBooking')}</Link>
        </div>
        <div className="navbar-auth">
          <div className="nav-lang-wrap">
            <button type="button" className="nav-lang-btn" onClick={() => setLangOpen(!langOpen)} aria-label="Change language">
              <Globe size={18} />
              <span>{languages.find(l => l.code === (language || 'en'))?.native || 'EN'}</span>
            </button>
            {langOpen && (
              <div className="nav-lang-dropdown">
                {languages.map((lang) => (
                  <button key={lang.code} type="button" className="nav-lang-option" onClick={() => { setLanguage(lang.code); setLangOpen(false); }}>
                    {lang.native}
                  </button>
                ))}
              </div>
            )}
          </div>
          {currentUser ? (
            <div className="user-menu">
              <span className="user-role-badge">
                {userRole === 'doctor' ? '👨‍⚕️' : userRole === 'hospital' ? '🏥' : userRole === 'auditor' ? '👤' : '👤'} {roleLabel}
              </span>
              <Link to="/profile" className="profile-btn-nav" title={t('navProfile')}>
                {dp ? <img src={dp} alt="Profile" className="nav-dp" /> : <User size={18} />}
              </Link>
              <button onClick={handleLogout} className="logout-btn">
                <LogOut size={18} /> {t('navLogout')}
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="nav-link login-link">{t('navLogIn')}</Link>
              <Link to="/signup" className="nav-link signup-btn">{t('navSignUp')}</Link>
            </>
          )}
        </div>
      </div>
      {langOpen && <div className="nav-lang-backdrop" onClick={() => setLangOpen(false)} aria-hidden="true" />}
    </nav>
  );
}
