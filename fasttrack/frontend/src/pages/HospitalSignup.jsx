import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import './Auth.css';

export default function HospitalSignup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== passwordConfirm) return setError(t('passwordsNoMatch'));
    try {
      setError('');
      setLoading(true);
      await signup(email, password, 'hospital', name);
      navigate('/hospital/dashboard');
    } catch (err) {
      setError(t('signUpError'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{t('hospitalSignUpTitle')}</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('hospitalName')}</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>{t('email')}</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>{t('password')}</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div className="form-group">
            <label>{t('confirmPassword')}</label>
            <input type="password" required value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} />
          </div>
          <button disabled={loading} className="auth-btn" type="submit">
            {t('registerHospital')}
          </button>
        </form>
        <div className="auth-links">
          {t('alreadyRegistered')} <Link to="/hospital/login">{t('logIn')}</Link>
        </div>
      </div>
    </div>
  );
}
