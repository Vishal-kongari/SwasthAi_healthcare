import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const userCred = await login(email, password);
      
      // Assume the user logged in successfully. 
      // Fetch their role.
      const db = (await import('../firebase')).db;
      const { ref, get } = await import('firebase/database');
      
      const userRef = ref(db, `users/${userCred.user.uid}`);
      const snap = await get(userRef);
      if (snap.exists() && snap.val().role === 'doctor') {
        navigate('/doctor/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(t('authError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{t('loginTitle')}</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('email')}</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>{t('password')}</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button disabled={loading} className="auth-btn" type="submit">{t('logIn')}</button>
        </form>
        <div className="auth-links">
          {t('noAccount')} <Link to="/signup">{t('signUp')}</Link>
        </div>
      </div>
    </div>
  );
}
