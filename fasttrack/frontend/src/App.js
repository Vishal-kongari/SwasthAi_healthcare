import React from 'react';
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
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
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
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
