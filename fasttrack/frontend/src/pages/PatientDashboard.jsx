import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Stethoscope, Brain, ArrowRight, FileText, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import './LandingPage.css'; // Reusing the same CSS for the blobs and cards

export default function PatientDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!currentUser || !currentUser.email) return;
    const reportsRef = ref(db, 'reports');
    onValue(reportsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsedList = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        const patientReports = parsedList.filter(r => r.patientEmail === currentUser.email.toLowerCase());
        setReports(patientReports);
      } else {
        setReports([]);
      }
    });
  }, [currentUser]);

  if (!currentUser) return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Redirecting...</div>;

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

        {/* Reports Section */}
        <div style={{ marginTop: '40px', background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={24} color="#ec4899" />
            My Lab & Hospital Reports
          </h2>
          {reports.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No reports uploaded by your hospital yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {reports.map(report => (
                <div key={report.id} style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem', background: '#f9fafb' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#111827' }}>{report.title}</h4>
                  <p style={{ margin: '0 0 1rem 0', color: '#4b5563', fontSize: '0.9rem' }}>
                    Uploaded by: {report.doctorName}
                  </p>
                  <a 
                    href={report.fileBase64} 
                    download={`${report.title}.pdf`} 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#ec4899', color: 'white', padding: '8px 12px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.9rem' }}
                  >
                    <Download size={16} /> View / Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
