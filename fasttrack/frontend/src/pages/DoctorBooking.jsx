import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { ref, get, push, set, onValue, update } from 'firebase/database';
import { Calendar, Clock, User, CheckCircle, XCircle } from 'lucide-react';
import './DoctorBooking.css';

export default function DoctorBooking() {
  const { currentUser, userRole } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    if (userRole === 'patient') {
      // Fetch doctors list
      const usersRef = ref(db, 'users');
      get(usersRef).then((snapshot) => {
        if (snapshot.exists()) {
          const docs = [];
          snapshot.forEach(child => {
            if (child.val().role === 'doctor') {
              docs.push({ id: child.key, ...child.val() });
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
    const apptRef = ref(db, 'appointments');
    const newApptRef = push(apptRef);
    await set(newApptRef, {
      patientId: currentUser.uid,
      patientName: currentUser.email, // Or actual name if stored
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
                  <div className="doc-icon"><User size={32} /></div>
                  <div className="doc-info">
                    <h3>Dr. {doc.name || 'Specialist'}</h3>
                    <p className="doc-specialty">General Practitioner</p>
                  </div>
                  <button className="book-btn" onClick={() => bookAppointment(doc.id, doc.name || doc.email)}>
                    Request Booking
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
                    <div className="appt-person">
                      <User size={18} color="#64748b" />
                      Patient: {appt.patientName}
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
    </div>
  );
}
