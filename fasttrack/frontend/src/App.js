import React from 'react';
import './MedicalTheme.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DoctorBooking from './pages/DoctorBooking';
import PatientDashboard from './pages/PatientDashboard';
import HospitalLogin from './pages/HospitalLogin';
import HospitalSignup from './pages/HospitalSignup';
import HospitalDashboard from './pages/HospitalDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import Profile from './pages/Profile';
import AIDiagnosis from './pages/AIDiagnosis';
import SymptomAnalyser from './pages/SymptomAnalyser';
import IntelligenceEmergency from './pages/IntelligenceEmergency';
import DoctorsList from './pages/DoctorsList';
import DoctorsLogin from './pages/DoctorsLogin';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Navbar from './components/Navbar';
import LanguageSelectorModal from './components/LanguageSelectorModal';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LanguageProvider>
        <AuthProvider>
          <LanguageSelectorModal />
          <Navbar />
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/hospital/login" element={<HospitalLogin />} />
          <Route path="/hospital/signup" element={<HospitalSignup />} />
          <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/booking" element={<DoctorBooking />} />
          <Route path="/vitals" element={<Dashboard />} />
          <Route path="/dashboard" element={<PatientDashboard />} />
          <Route path="/ai-diagnosis" element={<AIDiagnosis />} />
          <Route path="/symptom-analyser" element={<SymptomAnalyser />} />
          <Route path="/intelligence-emergency" element={<IntelligenceEmergency />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/doctors-login" element={<DoctorsLogin />} />
          <Route path="/doctors" element={<DoctorsList />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
