import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { ref, push, set, onValue, serverTimestamp } from 'firebase/database';
import './HospitalDashboard.css';

export default function HospitalDashboard() {
  const { currentUser, userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('manage-doctors');

  // Doctor Form
  const [doctorName, setDoctorName] = useState('');
  const [doctorSpecialty, setDoctorSpecialty] = useState('');
  const [doctorContact, setDoctorContact] = useState('');
  const [doctorsList, setDoctorsList] = useState([]);

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
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px'}}>
                  {doctorsList.map(doc => (
                    <div key={doc.id} style={{border: '1px solid #e5e7eb', borderRadius: '10px', padding: '15px', display: 'flex', alignItems: 'center', gap: '15px', background: '#f9fafb'}}>
                      <div style={{width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#e5e7eb', overflow: 'hidden', flexShrink: 0}}>
                        {doc.displayPicture ? (
                          <img src={doc.displayPicture} alt={doc.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                        ) : (
                          <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '24px'}}>👨‍⚕️</div>
                        )}
                      </div>
                      <div>
                        <strong style={{fontSize: '1.1rem', color: '#111827'}}>{doc.name}</strong>
                        <div style={{fontSize: '0.9rem', color: '#4b5563', marginTop: '2px'}}>{doc.specialty} {doc.degree && `• ${doc.degree}`}</div>
                        <div style={{fontSize: '0.85rem', color: '#6b7280', marginTop: '4px'}}>{doc.contact}</div>
                      </div>
                    </div>
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
    </div>
  );
}
