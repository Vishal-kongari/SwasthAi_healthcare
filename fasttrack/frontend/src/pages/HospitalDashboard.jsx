import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { ref, push, set, get, onValue, serverTimestamp } from 'firebase/database';
import { User, X, Award, Briefcase, Phone, Mail } from 'lucide-react';
import './HospitalDashboard.css';

export default function HospitalDashboard() {
  const { currentUser, userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('manage-doctors');

  // Doctor Form
  const [doctorName, setDoctorName] = useState('');
  const [doctorSpecialty, setDoctorSpecialty] = useState('');
  const [doctorContact, setDoctorContact] = useState('');
  const [doctorsList, setDoctorsList] = useState([]);

  // Doctor profile modal (full profile from their user account)
  const [showDoctorProfileModal, setShowDoctorProfileModal] = useState(false);
  const [selectedDoctorForProfile, setSelectedDoctorForProfile] = useState(null);
  const [doctorFullProfile, setDoctorFullProfile] = useState(null);
  const [hospitalName, setHospitalName] = useState('');

  // Report Form
  const [patientEmail, setPatientEmail] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [fileBase64, setFileBase64] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');

  // File variables

  // Fetch Doctors for this hospital
  useEffect(() => {
    if (!currentUser) return;
    const dbRef = ref(db, `hospitals/${currentUser.uid}/doctors`);
    onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsedList = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setDoctorsList(parsedList);
      } else {
        setDoctorsList([]);
      }
    });
  }, [currentUser]);

  // Fetch hospital name for modal
  useEffect(() => {
    if (!currentUser) return;
    const userRef = ref(db, `users/${currentUser.uid}`);
    get(userRef).then((snap) => {
      if (snap.exists()) setHospitalName(snap.val().name || '');
    });
  }, [currentUser]);

  const openDoctorProfile = async (doc) => {
    setSelectedDoctorForProfile(doc);
    setShowDoctorProfileModal(true);
    setDoctorFullProfile(null);
    try {
      const doctorUserRef = ref(db, `users/${doc.id}`);
      const snap = await get(doctorUserRef);
      if (snap.exists()) setDoctorFullProfile(snap.val());
      else setDoctorFullProfile({}); // fallback to card data
    } catch (e) {
      console.error('Failed to load doctor profile', e);
      setDoctorFullProfile({});
    }
  };

  const closeDoctorProfileModal = () => {
    setShowDoctorProfileModal(false);
    setSelectedDoctorForProfile(null);
    setDoctorFullProfile(null);
  };

  // Protect route
  if (!currentUser || userRole !== 'hospital') {
    return <div className="hospital-dashboard-error">Access Denied. Hospital staff only.</div>;
  }

  // handleAddDoctor removed because doctors pull in dynamically via Profile

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadReport = async (e) => {
    e.preventDefault();
    if (!patientEmail || !selectedDoctor || !reportTitle || !fileBase64) {
      setUploadStatus('Please fill all fields and select a valid file.');
      return;
    }
    setUploadStatus('Uploading...');
    try {
      const reportsRef = ref(db, 'reports');
      const newReportRef = push(reportsRef);
      await set(newReportRef, {
        hospitalId: currentUser.uid,
        patientEmail: patientEmail.toLowerCase(),
        doctorName: selectedDoctor,
        title: reportTitle,
        fileBase64: fileBase64,
        uploadedAt: serverTimestamp()
      });
      setPatientEmail('');
      setSelectedDoctor('');
      setReportTitle('');
      setFileBase64('');
      // clear the file input
      document.getElementById('reportFileInput').value = '';
      setUploadStatus('Report uploaded successfully!');
      setTimeout(() => setUploadStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setUploadStatus('Upload failed.');
    }
  };

  return (
    <div className="hospital-dashboard-container">
      <div className="hospital-sidebar">
        <h2>Hospital Portal</h2>
        <ul>
          <li 
            className={activeTab === 'manage-doctors' ? 'active' : ''} 
            onClick={() => setActiveTab('manage-doctors')}
          >
            Manage Doctors
          </li>
          <li 
            className={activeTab === 'upload-reports' ? 'active' : ''} 
            onClick={() => setActiveTab('upload-reports')}
          >
            Upload Reports
          </li>
        </ul>
      </div>
      <div className="hospital-content">
        {activeTab === 'manage-doctors' && (
          <div className="tab-section">
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <h3 className="section-title">Our Doctors</h3>
              <small style={{color: '#6b7280'}}>Doctors appear here when they select this hospital in their Profile.</small>
            </div>
            
            <div className="doctors-list" style={{marginTop: '20px'}}>
              {doctorsList.length === 0 ? <p>No doctors affiliated yet.</p> : (
                <div className="hospital-doctors-grid">
                  {doctorsList.map(doc => (
                    <button
                      key={doc.id}
                      type="button"
                      className="hospital-doctor-card"
                      onClick={() => openDoctorProfile(doc)}
                    >
                      <div className="hospital-doctor-avatar">
                        {doc.displayPicture ? (
                          <img src={doc.displayPicture} alt={doc.name} />
                        ) : (
                          <User size={28} color="#9ca3af" />
                        )}
                      </div>
                      <div className="hospital-doctor-info">
                        <strong className="hospital-doctor-name">{doc.name}</strong>
                        <div className="hospital-doctor-meta">{doc.specialty} {doc.degree && `• ${doc.degree}`}</div>
                        <div className="hospital-doctor-contact">{doc.contact}</div>
                      </div>
                      <span className="hospital-doctor-view">View profile →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'upload-reports' && (
          <div className="tab-section">
            <h3>Upload Patient Report</h3>
            {uploadStatus && <div className="status-msg">{uploadStatus}</div>}
            <form onSubmit={handleUploadReport} className="hospital-form">
              <input 
                type="email" 
                placeholder="Patient Email" 
                value={patientEmail} 
                onChange={(e) => setPatientEmail(e.target.value)} 
                required 
              />
              <select 
                value={selectedDoctor} 
                onChange={(e) => setSelectedDoctor(e.target.value)} 
                required
              >
                <option value="" disabled>Select Doctor</option>
                {doctorsList.map(doc => (
                  <option key={doc.id} value={doc.name}>{doc.name} ({doc.specialty})</option>
                ))}
              </select>
              <input 
                type="text" 
                placeholder="Report Title (e.g. Blood Test Results)" 
                value={reportTitle} 
                onChange={(e) => setReportTitle(e.target.value)} 
                required 
              />
              <input 
                id="reportFileInput"
                type="file" 
                onChange={handleFileChange} 
                accept="image/*,.pdf"
                required 
              />
              <button type="submit" className="save-btn">Upload Report</button>
            </form>
          </div>
        )}
      </div>

      {/* Doctor full profile modal (same as Book Session) */}
      {showDoctorProfileModal && selectedDoctorForProfile && (
        <div className="hospital-modal-overlay" onClick={closeDoctorProfileModal}>
          <div className="hospital-modal-content doctor-profile-modal" onClick={e => e.stopPropagation()}>
            <button type="button" className="hospital-modal-close" onClick={closeDoctorProfileModal} aria-label="Close">
              <X size={24} />
            </button>
            <div className="hospital-modal-header">
              <div className="hospital-modal-dp">
                {(doctorFullProfile?.displayPicture || selectedDoctorForProfile.displayPicture) ? (
                  <img src={doctorFullProfile?.displayPicture || selectedDoctorForProfile.displayPicture} alt="" />
                ) : (
                  <User size={64} color="#64748b" />
                )}
              </div>
              <div className="hospital-modal-title">
                <h2>Dr. {doctorFullProfile?.name || selectedDoctorForProfile.name || 'Doctor'}</h2>
                <p className="hospital-modal-specialty">{doctorFullProfile?.specialty || selectedDoctorForProfile.specialty || 'General Practitioner'}</p>
              </div>
            </div>
            <div className="hospital-modal-body">
              <div className="hospital-info-grid">
                <div className="hospital-info-item">
                  <Award size={20} color="#8b5cf6" />
                  <div>
                    <label>Degree / Qualification</label>
                    <p>{doctorFullProfile?.degree || selectedDoctorForProfile.degree || 'MBBS'}</p>
                  </div>
                </div>
                <div className="hospital-info-item">
                  <Briefcase size={20} color="#3b82f6" />
                  <div>
                    <label>Specialty</label>
                    <p>{doctorFullProfile?.specialty || selectedDoctorForProfile.specialty || 'General Practitioner'}</p>
                  </div>
                </div>
                <div className="hospital-info-item">
                  <Phone size={20} color="#10b981" />
                  <div>
                    <label>Contact Number</label>
                    <p>{doctorFullProfile?.phone || selectedDoctorForProfile.contact || 'Not provided'}</p>
                  </div>
                </div>
                <div className="hospital-info-item">
                  <Mail size={20} color="#ec4899" />
                  <div>
                    <label>Email Address</label>
                    <p>{doctorFullProfile?.email || 'Not provided'}</p>
                  </div>
                </div>
                <div className="hospital-info-item hospital-info-item-full">
                  <Briefcase size={20} color="#3b82f6" />
                  <div>
                    <label>Affiliated Hospital</label>
                    <p className="hospital-affiliated-name">{hospitalName || 'This hospital'}</p>
                  </div>
                </div>
              </div>
              {(doctorFullProfile?.about) && (
                <div className="hospital-info-section">
                  <label>About Doctor</label>
                  <p>{doctorFullProfile.about}</p>
                </div>
              )}
            </div>
            <div className="hospital-modal-footer">
              <button type="button" className="hospital-modal-close-btn" onClick={closeDoctorProfileModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
