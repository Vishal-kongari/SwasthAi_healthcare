import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Stethoscope, Brain, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './LandingPage.css'; // Reusing the same CSS for the blobs and cards

export default function PatientDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  return (
    <div className="swasth-dashboard">
      <div className="swasth-bg-blob blob-1"></div>
      <div className="swasth-bg-blob blob-2"></div>
      <div className="swasth-bg-blob blob-3"></div>

      <div className="swasth-container">
        <header className="swasth-header">
          <h1 className="swasth-title">Welcome Back!</h1>
          <p className="swasth-subtitle">
            Your personal patient dashboard. Access your live vitals, book doctor appointments, and manage your remote care journey from one central hub.
          </p>
        </header>

        <div className="modules-grid" style={{ marginTop: '40px' }}>
          
          {/* Vitals Card */}
          <div className="module-card delay-1">
            <div className="card-icon-wrapper">
              <Activity size={28} color="#8b5cf6" />
            </div>
            <h3 className="module-title">Health Vitals</h3>
            <p className="module-desc">Sync with Google Fit to monitor your live steps, heart rate, sleep quality, and SpO2 levels.</p>
            <div style={{ marginTop: '20px' }}>
              <Link to="/vitals" className="btn-vitals" style={{ display: 'inline-flex', padding: '10px 20px', fontSize: '15px' }}>
                Open Vitals
                <ArrowRight className="btn-icon" size={20} />
              </Link>
            </div>
          </div>

          {/* Doctor Booking Card */}
          <div className="module-card delay-2">
            <div className="card-icon-wrapper">
              <Stethoscope size={28} color="#10b981" />
            </div>
            <h3 className="module-title">Doctor Appointments</h3>
            <p className="module-desc">Book remote telehealth sessions or in-person checkups with our network of specialized doctors.</p>
            <div style={{ marginTop: '20px' }}>
              <Link to="/booking" className="btn-vitals" style={{ display: 'inline-flex', padding: '10px 20px', fontSize: '15px', background: 'linear-gradient(135deg, #10b981, #34d399)' }}>
                Book Session
                <ArrowRight className="btn-icon" size={20} />
              </Link>
            </div>
          </div>

          {/* AI Diagnostics (Coming Soon Placeholder) */}
          <div className="module-card delay-3">
            <div className="card-icon-wrapper">
              <Brain size={28} color="#3b82f6" />
            </div>
            <h3 className="module-title">AI Diagnostics</h3>
            <p className="module-desc">Input your symptoms to receive instant AI-powered preliminary assessments (Coming Soon).</p>
            <div style={{ marginTop: '20px' }}>
              <button disabled className="btn-vitals" style={{ display: 'inline-flex', padding: '10px 20px', fontSize: '15px', background: '#cbd5e1', cursor: 'not-allowed', color: '#64748b' }}>
                Coming Soon
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
