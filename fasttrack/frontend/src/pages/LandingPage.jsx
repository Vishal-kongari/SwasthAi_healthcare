import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  Brain,
  ShieldCheck,
  Stethoscope,
  GitBranch,
  ArrowRight,
  Users
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import './LandingPage.css';

const MainDashboard = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const modules = [
    { titleKey: 'moduleAIDiagnostic', descKey: 'moduleAIDiagnosticDesc', icon: <Brain size={28} color="#3b82f6" />, delay: 'delay-1' },
    { titleKey: 'modulePredictive', descKey: 'modulePredictiveDesc', icon: <Activity size={28} color="#8b5cf6" />, delay: 'delay-2' },
    { titleKey: 'moduleRemoteCare', descKey: 'moduleRemoteCareDesc', icon: <Stethoscope size={28} color="#10b981" />, delay: 'delay-3' },
    { titleKey: 'modulePrivacy', descKey: 'modulePrivacyDesc', icon: <ShieldCheck size={28} color="#f59e0b" />, delay: 'delay-4' },
    { titleKey: 'moduleWorkflow', descKey: 'moduleWorkflowDesc', icon: <GitBranch size={28} color="#ec4899" />, delay: 'delay-5' }
  ];

  return (
    <div className="swasth-dashboard">
      {/* Background animated blobs */}
      <div className="swasth-bg-blob blob-1"></div>
      <div className="swasth-bg-blob blob-2"></div>
      <div className="swasth-bg-blob blob-3"></div>

      <div className="swasth-container">

        {/* Header Section */}
        <header className="swasth-header">
          <h1 className="swasth-title">{t('landingTitle')}</h1>
          <p className="swasth-subtitle">{t('landingSubtitle')}</p>
          <div className="objective-tags">
            <span className="objective-tag">⚕️ {t('tagCollect')}</span>
            <span className="objective-tag">🧠 {t('tagPredict')}</span>
            <span className="objective-tag">🚦 {t('tagTriage')}</span>
            <span className="objective-tag">🔒 {t('tagPrivacy')}</span>
            <span className="objective-tag">⚙️ {t('tagAutomate')}</span>
          </div>
        </header>
        <div className="vitals-btn-container" style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/login" className="btn-vitals" style={{ padding: '16px 36px', fontSize: '18px' }}>
            {t('userLogin')}
            <ArrowRight className="btn-icon" size={24} />
          </Link>
          <Link to="/hospital/login" className="btn-vitals" style={{ padding: '16px 36px', fontSize: '18px', background: 'linear-gradient(135deg, #10b981, #34d399)' }}>
            {t('hospitalPortal')}
            <ArrowRight className="btn-icon" size={24} />
          </Link>
          <Link to="/doctors-login" className="btn-vitals" style={{ padding: '16px 36px', fontSize: '18px', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>
            {t('doctorsDirectory')}
            <Users className="btn-icon" size={24} />
          </Link>
        </div>
        <div className="modules-grid">
          {modules.map((mod, idx) => (
            <div key={idx} className={`module-card ${mod.delay}`}>
              <div className="card-icon-wrapper">{mod.icon}</div>
              <h3 className="module-title">{t(mod.titleKey || '')}</h3>
              <p className="module-desc">{t(mod.descKey || '')}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default MainDashboard;
