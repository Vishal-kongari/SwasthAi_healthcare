import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { ref, get, push, set, onValue, update } from 'firebase/database';
import { Calendar, Clock, User, CheckCircle, XCircle, Award, Briefcase, Phone, Mail, X } from 'lucide-react';
import './DoctorBooking.css';

export default function DoctorBooking() {
  const { currentUser, userRole } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [hospitalsMap, setHospitalsMap] = useState({});

  useEffect(() => {
    if (!currentUser) return;

    if (userRole === 'patient') {
      // Fetch doctors list
      const usersRef = ref(db, 'users');
      get(usersRef).then((snapshot) => {
        if (snapshot.exists()) {
          const docs = [];
          const hMap = {};
          
          // First pass: Build hospital map
          snapshot.forEach(child => {
            const val = child.val();
            if (val.role === 'hospital') {
              hMap[child.key] = val.name || 'Unknown Hospital';
            }
          });
          setHospitalsMap(hMap);

          // Second pass: Get doctors and link hospital names
          snapshot.forEach(child => {
            const val = child.val();
            if (val.role === 'doctor') {
              docs.push({ 
                id: child.key, 
                ...val,
                hospitalName: val.selectedHospital ? hMap[val.selectedHospital] : 'Independent Practice'
              });
            }
          });
          setDoctors(docs);
        }
      });

      // Listen to patient's appointments
      const apptRef = ref(db, `appointments`);
      onValue(apptRef, (snapshot) => {
        const myAppts = [];
        snapshot.forEach(child => {
          const data = child.val();
          if (data.patientId === currentUser.uid) {
            myAppts.push({ id: child.key, ...data });
          }
        });
        setAppointments(myAppts);
        setLoading(false);
      });
    } else if (userRole === 'doctor') {
      // Listen to doctor's appointments
      const apptRef = ref(db, `appointments`);
      onValue(apptRef, (snapshot) => {
        const myAppts = [];
        snapshot.forEach(child => {
          const data = child.val();
          if (data.doctorId === currentUser.uid) {
            myAppts.push({ id: child.key, ...data });
          }
        });
        setAppointments(myAppts);
        setLoading(false);
      });
    }
  }, [currentUser, userRole]);

  async function bookAppointment(doctorId, doctorName) {
    let patientDp = '';
    let patientDetails = {};
    try {
      const userSnap = await get(ref(db, `users/${currentUser.uid}`));
      if (userSnap.exists()) {
        patientDp = userSnap.val().displayPicture || '';
        patientDetails = userSnap.val();
      }
    } catch (e) {
      console.error("Could not fetch patient DP");
    }

    const apptRef = ref(db, 'appointments');
    const newApptRef = push(apptRef);
    await set(newApptRef, {
      patientId: currentUser.uid,
      patientName: patientDetails.name || currentUser.email,
      patientEmail: currentUser.email,
      patientPhone: patientDetails.phone || '',
      patientDp: patientDp,
      doctorId,
      doctorName,
      status: 'pending',
      timestamp: Date.now()
    });
    alert(`Booking requested with ${doctorName}!`);
  }

  async function updateStatus(apptId, status) {
    const apptRef = ref(db, `appointments/${apptId}`);
    await update(apptRef, { status });
  }

  // Wait for loading or redirect in a `useEffect` instead if desired
  // But to fix the hooks error right now, just don't return early before hooks
  // Actually, all hooks (useState, useEffect) are already called at the top of the file!
  // The early return `if (!currentUser) return ...` is at line 81, *after* all hooks.
  // Wait, let's look closer. Are there any hooks inside the early return? No.
  // BUT what if `currentUser` becomes null *during* the render?
  // Let's change the return to not use a completely different early return that might skip nested custom hooks if there were any, though there aren't.
  // Actually, wait! The error "Rendered fewer hooks than expected" happens when a component returns early BEFORE a hook is called, or if a hook is inside a condition.
  // In `DoctorBooking.jsx`:
  // line 10: const [doctors, setDoctors] = useState([]);
  // line 11: const [appointments, setAppointments] = useState([]);
  // ...
  // line 81: if (!currentUser) return <div className="booking-page"><div className="auth-alert">Please login to access bookings.</div></div>;
  // This is actually perfectly legal since all hooks are above line 81.
  // Let me double check where the error is coming from.
  // Wait, `Dashboard.jsx` has `useSearchParams()` and `useHealthData()`.
  // Then `if (params.get... )`.
  // Wait, let me check `Navbar.jsx`? `useAuth()`, `useNavigate()`.
  // Let's re-examine `Dashboard.jsx`.
  
  if (!currentUser) return <div className="booking-page"><div className="auth-alert">Please login to access bookings.</div></div>;

  return (
    <div className="booking-page">
      <div className="booking-header">
        <h1>{userRole === 'doctor' ? 'Provider Dashboard' : 'Find a Doctor'}</h1>
        <p>{userRole === 'doctor' ? 'Manage your patient appointments' : 'Book a remote consultation with available specialists.'}</p>
      </div>

      <div className="booking-content">
        {userRole === 'patient' && (
          <div className="patient-view">
            <h2>Available Doctors</h2>
            <div className="doctors-grid">
              {doctors.map(doc => (
                <div key={doc.id} className="doctor-card">
                  <div className="doc-icon">
                    {doc.displayPicture ? (
                      <img src={doc.displayPicture} alt={doc.name} style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />
                    ) : (
                      <User size={32} />
                    )}
                  </div>
                  <div className="doc-info">
                    <h3>Dr. {doc.name || 'Specialist'}</h3>
                    <p className="doc-specialty">{doc.specialty || 'General Practitioner'}</p>
                    <p className="doc-hospital" style={{fontSize: '0.85rem', color: '#3b82f6', fontWeight: '600', marginBottom: '15px'}}>
                      🏥 {doc.hospitalName}
                    </p>
                  </div>
                  <button className="book-btn" onClick={() => { setSelectedDoctor(doc); setShowModal(true); }}>
                    View Profile & Book
                  </button>
                </div>
              ))}
              {doctors.length === 0 && <p className="no-data">No doctors currently available.</p>}
            </div>

            <h2 className="section-title">My Appointments</h2>
            <div className="appointments-list">
              {appointments.map(appt => (
                <div key={appt.id} className={`appt-card status-${appt.status}`}>
                  <div className="appt-detail">
                    <strong>Doctor:</strong> Dr. {appt.doctorName}
                  </div>
                  <div className="appt-detail">
                    <strong>Status:</strong> <span className={`status-badge ${appt.status}`}>{appt.status}</span>
                  </div>
                </div>
              ))}
              {appointments.length === 0 && !loading && <p className="no-data">You have no appointments.</p>}
            </div>
          </div>
        )}

        {userRole === 'doctor' && (
          <div className="doctor-view">
            <h2>Patient Requests</h2>
            <div className="appointments-list">
              {appointments.map(appt => (
                <div key={appt.id} className="appt-card doctor-appt-card">
                  <div className="doc-appt-info">
                    <div className="appt-person" style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px'}}>
                      {appt.patientDp ? (
                        <img src={appt.patientDp} alt="Patient" style={{width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover'}} />
                      ) : (
                        <User size={24} color="#64748b" />
                      )}
                      <div>
                        <strong>{appt.patientName}</strong> <br/>
                        <small style={{color: '#64748b'}}>{appt.patientEmail} {appt.patientPhone && `| ${appt.patientPhone}`}</small>
                      </div>
                    </div>
                    <div className="appt-time">
                      <Clock size={18} color="#64748b" />
                      Requested: {new Date(appt.timestamp).toLocaleString()}
                    </div>
                    <div className="appt-status">
                      Status: <span className={`status-badge ${appt.status}`}>{appt.status}</span>
                    </div>
                  </div>
                  {appt.status === 'pending' && (
                    <div className="appt-actions">
                      <button className="action-btn accept" onClick={() => updateStatus(appt.id, 'accepted')}>
                        <CheckCircle size={18} /> Accept
                      </button>
                      <button className="action-btn decline" onClick={() => updateStatus(appt.id, 'declined')}>
                        <XCircle size={18} /> Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {appointments.length === 0 && !loading && <p className="no-data">No new appointment requests.</p>}
            </div>
          </div>
        )}
      </div>

      {/* Doctor Profile Modal */}
      {showModal && selectedDoctor && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content doctor-profile-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}><X size={24} /></button>
            <div className="modal-header">
              <div className="modal-dp">
                {selectedDoctor.displayPicture ? (
                  <img src={selectedDoctor.displayPicture} alt={selectedDoctor.name} />
                ) : (
                  <User size={64} color="#64748b" />
                )}
              </div>
              <div className="modal-title">
                <h2>Dr. {selectedDoctor.name || 'Specialist'}</h2>
                <p className="modal-specialty">{selectedDoctor.specialty || 'General Practitioner'}</p>
              </div>
            </div>

            <div className="modal-body">
              <div className="info-grid">
                <div className="info-item">
                  <Award size={20} color="#8b5cf6" />
                  <div>
                    <label>Degree / Qualification</label>
                    <p>{selectedDoctor.degree || 'MBBS'}</p>
                  </div>
                </div>
                <div className="info-item">
                  <Briefcase size={20} color="#3b82f6" />
                  <div>
                    <label>Specialty</label>
                    <p>{selectedDoctor.specialty || 'General Practitioner'}</p>
                  </div>
                </div>
                <div className="info-item">
                  <Phone size={20} color="#10b981" />
                  <div>
                    <label>Contact Number</label>
                    <p>{selectedDoctor.phone || 'Contact not provided'}</p>
                  </div>
                </div>
                <div className="info-item">
                  <Mail size={20} color="#ec4899" />
                  <div>
                    <label>Email Address</label>
                    <p>{selectedDoctor.email || 'Email not provided'}</p>
                  </div>
                </div>
                <div className="info-item" style={{gridColumn: 'span 2'}}>
                  <Briefcase size={20} color="#3b82f6" />
                  <div>
                    <label>Affiliated Hospital</label>
                    <p style={{color: '#3b82f6', fontWeight: '700'}}>{selectedDoctor.hospitalName}</p>
                  </div>
                </div>
              </div>

              {selectedDoctor.about && (
                <div className="info-section">
                  <label>About Doctor</label>
                  <p>{selectedDoctor.about}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn-confirm-booking" 
                onClick={() => {
                  bookAppointment(selectedDoctor.id, selectedDoctor.name || selectedDoctor.email);
                  setShowModal(false);
                }}
              >
                Confirm Appointment Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
