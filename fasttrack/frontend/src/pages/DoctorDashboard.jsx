import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { ref, onValue, get } from 'firebase/database';
import { Users, CalendarCheck, Activity, ChevronRight, Stethoscope, Clock, Search, User } from 'lucide-react';
import './DoctorDashboard.css';

export default function DoctorDashboard() {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    pendingRequests: 0,
    upcomingAppts: 0,
    totalPatients: 0
  });

  const [doctorDetails, setDoctorDetails] = useState({ name: '', specialty: '', displayPicture: '', hospitalName: '' });

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!currentUser) return navigate('/login');
    if (userRole !== 'doctor') return navigate('/dashboard');

    // Fetch Doctor Profile for Greeting
    const userRef = ref(db, `users/${currentUser.uid}`);
    onValue(userRef, async (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        let hospName = 'Independent Practice';
        if (data.selectedHospital) {
          const hospSnap = await get(ref(db, `users/${data.selectedHospital}`));
          if (hospSnap.exists()) hospName = hospSnap.val().name;
        }
        setDoctorDetails({
          name: data.name || currentUser.email,
          specialty: data.specialty || 'Medical Professional',
          displayPicture: data.displayPicture || '',
          hospitalName: hospName
        });
      }
    });

    // Fetch Appointments to Calculate Quick Stats
    const apptRef = ref(db, 'appointments');
    onValue(apptRef, (snapshot) => {
      let pending = 0;
      let accepted = 0;
      let uniquePatients = new Set();

      snapshot.forEach(child => {
        const data = child.val();
        if (data.doctorId === currentUser.uid) {
          uniquePatients.add(data.patientId);
          if (data.status === 'pending') pending++;
          if (data.status === 'accepted') accepted++;
        }
      });

      setStats({
        pendingRequests: pending,
        upcomingAppts: accepted,
        totalPatients: uniquePatients.size
      });
    });

    // Fetch All Patients for Search functionality
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      const allPatients = [];
      snapshot.forEach(child => {
        const data = child.val();
        if (data.role === 'patient') {
          allPatients.push({
            id: child.key,
            name: data.name || data.email || 'Unnamed Patient',
            email: data.email || 'No email',
            age: data.age || 'N/A',
            displayPicture: data.displayPicture || null
          });
        }
      });
      setPatientsList(allPatients);
    });

  }, [currentUser, userRole, navigate]);

  if (!currentUser) return null;

  return (
    <div className="doc-dashboard-page">
      {/* Background Ornaments */}
      <div className="doc-bg-shape shape-primary"></div>
      <div className="doc-bg-shape shape-secondary"></div>

      <div className="doc-dashboard-container">
        
        {/* Welcome Header */}
        <header className="doc-header">
          <div className="doc-profile-brief">
            <div className="doc-dp-large">
              {doctorDetails.displayPicture ? (
                <img src={doctorDetails.displayPicture} alt="Doctor" />
              ) : (
                <Stethoscope size={36} color="#475569" />
              )}
            </div>
            <div>
              <span className="doc-greeting">Welcome back,</span>
              <h1 className="doc-name">Dr. {doctorDetails.name}</h1>
              <p className="doc-hospital">{doctorDetails.specialty} • {doctorDetails.hospitalName}</p>
            </div>
          </div>
          <Link to="/profile" className="doc-action-btn subtle">
            Edit Profile
          </Link>
        </header>

        {/* Quick Stats Grid */}
        <div className="doc-stats-grid">
          
          <div className="doc-stat-card">
            <div className="stat-icon-wrapper blue">
              <Clock size={24} color="#3b82f6" />
            </div>
            <div className="stat-info">
              <h3>Pending Requests</h3>
              <p className="stat-value">{stats.pendingRequests}</p>
            </div>
          </div>

          <div className="doc-stat-card">
            <div className="stat-icon-wrapper green">
              <CalendarCheck size={24} color="#10b981" />
            </div>
            <div className="stat-info">
              <h3>Upcoming Sessions</h3>
              <p className="stat-value">{stats.upcomingAppts}</p>
            </div>
          </div>

          <div className="doc-stat-card">
            <div className="stat-icon-wrapper purple">
              <Users size={24} color="#8b5cf6" />
            </div>
            <div className="stat-info">
              <h3>Total Patients</h3>
              <p className="stat-value">{stats.totalPatients}</p>
            </div>
          </div>

        </div>

        {/* Action Modules */}
        <div className="doc-modules-grid">
          
          <div className="doc-module highlight" style={{ gridColumn: '1 / -1' }}>
            <div className="module-content">
              <h2>Provider Workspace</h2>
              <p>Review new patient appointment requests, manage your schedule, and launch remote consultations.</p>
              <Link to="/booking" className="doc-action-btn primary mt-4">
                Manage Appointments <ChevronRight size={18} />
              </Link>
            </div>
            <div className="module-illustration">
              <Activity size={100} color="rgba(255,255,255,0.2)" />
            </div>
          </div>

        </div>

        {/* Global Patient Search Section */}
        <div className="patient-search-section">
          <div className="patient-search-header">
             <h2>Patient Directory Search</h2>
             <p>Instantly find patient profiles across the entire network.</p>
          </div>
          
          <div className="search-bar-container">
            <Search className="search-icon" size={24} color="#9ca3af" />
            <input 
              type="text" 
              className="patient-search-input"
              placeholder="Search patients by name (e.g. 'sreeja')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {searchQuery.trim().length > 0 && (
            <div className="search-results-grid">
              {patientsList.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                 <div className="no-results-msg">No patients found matching "{searchQuery}"</div>
              ) : (
                patientsList
                  .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(patient => (
                    <div key={patient.id} className="patient-result-card">
                       {patient.displayPicture ? (
                         <img src={patient.displayPicture} alt={patient.name} className="patient-avatar" />
                       ) : (
                         <div className="patient-avatar placeholder"><User size={20} color="#6b7280" /></div>
                       )}
                       <div className="patient-info">
                         <h4 className="patient-name">{patient.name}</h4>
                         <span className="patient-email">{patient.email}</span>
                         {patient.age !== 'N/A' && <span className="patient-age">Age: {patient.age}</span>}
                       </div>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
