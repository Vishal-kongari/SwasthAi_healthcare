import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { useLanguage } from '../contexts/LanguageContext';
import './Auth.css';

export default function DoctorsLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (email !== 'who@gmail.com') return setError(t('accessDenied'));
    if (password !== '123456') return setError(t('incorrectPassword'));

    try {
      setError('');
      setLoading(true);
      
      try {
        // Attempt to log in to Firebase
        await signInWithEmailAndPassword(auth, email, password);
      } catch (err) {
        // If the user doesn't exist, create it to "save to database" as requested.
        // Firebase Auth treats 'auth/invalid-credential' as both wrong password or user not found.
        try {
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            await set(ref(db, `users/${userCred.user.uid}`), {
               email: email,
               role: 'auditor',
               registeredAt: new Date().toISOString()
            });
        } catch (createErr) {
            console.error("Creation fallback error", createErr);
        }
      }
      
      localStorage.setItem('doctorsAuth', 'true');
      navigate('/doctors');
    } catch (err) {
      setError(t('authFailed'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{t('doctorsLoginTitle')}</h2>
        <p style={{ textAlign: 'center', marginBottom: '20px', color: '#6b7280', fontSize: '0.9rem' }}>{t('doctorsLoginSubtitle')}</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('authorizedEmail')}</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="who@gmail.com" />
          </div>
          <div className="form-group">
            <label>{t('password')}</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button disabled={loading} className="auth-btn" type="submit">{t('accessDirectory')}</button>
        </form>
      </div>
    </div>
  );
}
