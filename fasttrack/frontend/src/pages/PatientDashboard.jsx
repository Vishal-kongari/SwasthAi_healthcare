import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Stethoscope, Brain, ArrowRight, FileText, Download, X, Eye, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import './LandingPage.css';

export default function PatientDashboard() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [viewingReport, setViewingReport] = useState(null);

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

  if (!currentUser) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t('redirecting')}</div>;

  return (
    <div className="swasth-dashboard">
      <div className="swasth-bg-blob blob-1"></div>
      <div className="swasth-bg-blob blob-2"></div>
      <div className="swasth-bg-blob blob-3"></div>

      <div className="swasth-container">
        <header className="swasth-header">
          <h1 className="swasth-title">{t('welcomeBack')}</h1>
          <p className="swasth-subtitle">{t('patientDashboardSubtitle')}</p>
        </header>

        <div className="modules-grid" style={{ marginTop: '40px' }}>
          <div className="module-card delay-1">
            <div className="card-icon-wrapper"><Activity size={28} color="#8b5cf6" /></div>
            <h3 className="module-title">{t('healthVitals')}</h3>
            <p className="module-desc">{t('healthVitalsDesc')}</p>
            <div style={{ marginTop: '20px' }}>
              <Link to="/vitals" className="btn-vitals" style={{ display: 'inline-flex', padding: '10px 20px', fontSize: '15px' }}>
                {t('openVitals')}
                <ArrowRight className="btn-icon" size={20} />
              </Link>
            </div>
          </div>
          <div className="module-card delay-2">
            <div className="card-icon-wrapper"><Stethoscope size={28} color="#10b981" /></div>
            <h3 className="module-title">{t('doctorAppointments')}</h3>
            <p className="module-desc">{t('doctorAppointmentsDesc')}</p>
            <div style={{ marginTop: '20px' }}>
              <Link to="/booking" className="btn-vitals" style={{ display: 'inline-flex', padding: '10px 20px', fontSize: '15px', background: 'linear-gradient(135deg, #10b981, #34d399)' }}>
                {t('bookSession')}
                <ArrowRight className="btn-icon" size={20} />
              </Link>
            </div>
          </div>
          <div className="module-card delay-3">
            <div className="card-icon-wrapper"><Brain size={28} color="#3b82f6" /></div>
            <h3 className="module-title">{t('aiDiagnostics')}</h3>
            <p className="module-desc">{t('aiDiagnosticsDesc')}</p>
            <div style={{ marginTop: '20px' }}>
              <Link to="/ai-diagnosis" className="btn-vitals" style={{ display: 'inline-flex', padding: '10px 20px', fontSize: '15px', background: 'linear-gradient(135deg, #3b82f6, #ec4899)' }}>
                {t('uploadReport')}
                <ArrowRight className="btn-icon" size={20} />
              </Link>
            </div>
          </div>
          <div className="module-card delay-4">
            <div className="card-icon-wrapper"><MessageCircle size={28} color="#8b5cf6" /></div>
            <h3 className="module-title">{t('aiSymptomAnalyser')}</h3>
            <p className="module-desc">{t('aiSymptomAnalyserDesc')}</p>
            <div style={{ marginTop: '20px' }}>
              <Link to="/symptom-analyser" className="btn-vitals" style={{ display: 'inline-flex', padding: '10px 20px', fontSize: '15px', background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' }}>
                {t('analyseSymptoms')}
                <ArrowRight className="btn-icon" size={20} />
              </Link>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '40px', background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={24} color="#ec4899" />
            {t('myReports')}
          </h2>
          {reports.length === 0 ? (
            <p style={{ color: '#6b7280' }}>{t('noReports')}</p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {reports.map(report => (
                <div key={report.id} style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem', background: '#f9fafb' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#111827' }}>{report.title}</h4>
                  <p style={{ margin: '0 0 1rem 0', color: '#4b5563', fontSize: '0.9rem' }}>
                    {t('uploadedBy')} {report.doctorName}
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => setViewingReport(report)}
                      style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px', background: '#ec4899', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}
                    >
                      <Eye size={16} /> {t('viewReport')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full Screen Report Viewer Modal */}
      {viewingReport && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column',
          zIndex: 2000, padding: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', color: 'white' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{viewingReport.title}</h2>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>{t('uploadedBy')} {viewingReport.doctorName}</p>
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = viewingReport.fileBase64;
                  // Detect extension from base64 if possible
                  const ext = viewingReport.fileBase64.split(';')[0].split('/')[1] || 'png';
                  link.download = `${viewingReport.title}.${ext}`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                style={{ background: 'white', color: 'black', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Download size={18} /> {t('download')}
              </button>
              <button 
                onClick={() => setViewingReport(null)}
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>
          </div>
          
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
            <img 
              src={viewingReport.fileBase64} 
              alt={viewingReport.title} 
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', boxShadow: '0 0 30px rgba(0,0,0,0.5)', borderRadius: '4px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
