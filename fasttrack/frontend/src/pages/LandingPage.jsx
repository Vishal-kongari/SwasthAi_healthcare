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
import './LandingPage.css';

const MainDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const modules = [
    {
      title: "AI Diagnostic Module",
      description: "Advanced machine learning algorithms providing early disease detection and diagnostic suggestions based on patient symptoms and historical data.",
      icon: <Brain size={28} color="#3b82f6" />,
      delay: "delay-1"
    },
    {
      title: "Predictive Analytics Engine",
      description: "Continuously monitoring health trends to predict potential risks and emergencies before they occur, optimizing preventive care.",
      icon: <Activity size={28} color="#8b5cf6" />,
      delay: "delay-2"
    },
    {
      title: "Remote Care Module",
      description: "Bridging the gap for rural populations with reliable telehealth connections, enabling remote checkups and continuous vital tracking.",
      icon: <Stethoscope size={28} color="#10b981" />,
      delay: "delay-3"
    },
    {
      title: "Privacy & Security Layer",
      description: "Military-grade encryption and decentralized data architecture ensuring patient information remains completely confidential and HIPAA-compliant.",
      icon: <ShieldCheck size={28} color="#f59e0b" />,
      delay: "delay-4"
    },
    {
      title: "Workflow Automation",
      description: "Intelligent resource allocation managing hospital beds, doctor schedules, and appointment triage (Emergency / Urgent / Routine) automatically.",
      icon: <GitBranch size={28} color="#ec4899" />,
      delay: "delay-5"
    }
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
          <h1 className="swasth-title">SwasthAi</h1>
          <p className="swasth-subtitle">
            An intelligent, AI-powered remote healthcare platform enabling early diagnosis, predictive risk monitoring, and automated workflow optimization for underserved populations.
          </p>

          <div className="objective-tags">
            <span className="objective-tag">⚕️ Collect Patient Data</span>
            <span className="objective-tag">🧠 Predict Health Risk</span>
            <span className="objective-tag">🚦 Triage Classification</span>
            <span className="objective-tag">🔒 Data Privacy</span>
            <span className="objective-tag">⚙️ Automate Allocation</span>
          </div>
        </header>

        {/* Call to action */}
        <div className="vitals-btn-container" style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/login" className="btn-vitals" style={{ padding: '16px 36px', fontSize: '18px' }}>
            Patient Login
            <ArrowRight className="btn-icon" size={24} />
          </Link>
          <Link to="/hospital/login" className="btn-vitals" style={{ padding: '16px 36px', fontSize: '18px', background: 'linear-gradient(135deg, #10b981, #34d399)' }}>
            Hospital Portal
            <ArrowRight className="btn-icon" size={24} />
          </Link>
          <Link to="/doctors-login" className="btn-vitals" style={{ padding: '16px 36px', fontSize: '18px', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>
            Doctors Directory
            <Users className="btn-icon" size={24} />
          </Link>
        </div>

        {/* Core Modules Grid */}
        <div className="modules-grid">
          {modules.map((mod, idx) => (
            <div key={idx} className={`module-card ${mod.delay}`}>
              <div className="card-icon-wrapper">
                {mod.icon}
              </div>
              <h3 className="module-title">{mod.title}</h3>
              <p className="module-desc">{mod.description}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default MainDashboard;
