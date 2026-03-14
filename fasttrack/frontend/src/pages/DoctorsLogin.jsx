import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import './Auth.css';

export default function DoctorsLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    
    // Exact requested credentials
    if (email !== 'who@gmail.com') {
      return setError('Access Denied: Only who@gmail.com is authorized to view this directory.');
    }
    
    if (password !== '123456') {
      return setError('Incorrect password for the authorized auditor account.');
    }

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
      setError('Failed to authenticate.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Directory Auditor Login</h2>
        <p style={{textAlign: 'center', marginBottom: '20px', color: '#6b7280', fontSize: '0.9rem'}}>Please login with the authorized credential to access the global directory.</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Authorized Email</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="who@gmail.com" 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
          </div>
          <button disabled={loading} className="auth-btn" type="submit">
            Access Directory
          </button>
        </form>
      </div>
    </div>
  );
}
