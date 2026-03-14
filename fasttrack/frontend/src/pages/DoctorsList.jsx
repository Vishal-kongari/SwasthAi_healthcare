import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { db } from '../firebase';
import { Stethoscope, User, MapPin, LogOut, Search, X, Mail, Phone, GraduationCap, Briefcase } from 'lucide-react';
import './DoctorsList.css';

const DoctorsList = () => {
  const [hospitalsData, setHospitalsData] = useState([]);
  const [patientsData, setPatientsData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Basic Auth Check
    if (localStorage.getItem('doctorsAuth') !== 'true') {
      navigate('/doctors-login');
      return;
    }

    const fetchHospitalsAndDoctors = async () => {
      try {
        // Step 1: Fetch all users to identify hospitals
        const usersRef = ref(db, 'users');
        const usersSnap = await get(usersRef);
        
        if (!usersSnap.exists()) {
          setLoading(false);
          return;
        }

        const hospitalsMap = {};
        const pList = [];
        
        usersSnap.forEach(child => {
          const userData = child.val();
          if (userData.role === 'hospital') {
             hospitalsMap[child.key] = {
               name: userData.name || 'Unknown Hospital',
               doctors: []
             };
          } else if (userData.role === 'patient') {
             pList.push({
               id: child.key,
               name: userData.name || userData.email || 'Unnamed Patient',
               email: userData.email || '',
               age: userData.age || 'N/A',
               displayPicture: userData.displayPicture || null
             });
          }
        });
        
        setPatientsData(pList);

        // Step 2: Fetch nested doctors inside `hospitals/{hospitalId}/doctors`
        const hospitalsNodeRef = ref(db, 'hospitals');
        const hospitalsNodeSnap = await get(hospitalsNodeRef);

        if (hospitalsNodeSnap.exists()) {
           hospitalsNodeSnap.forEach(hospChild => {
             const hospId = hospChild.key;
             const doctorsNode = hospChild.val().doctors; // an object mapping docId -> docDetails
             
             if (hospitalsMap[hospId] && doctorsNode) {
                 const docArray = Object.keys(doctorsNode).map(docId => ({
                     id: docId,
                     ...doctorsNode[docId]
                 }));
                 hospitalsMap[hospId].doctors = docArray;
             }
           });
        }

        // Convert Map to Array for easy rendering
        const finalArray = Object.keys(hospitalsMap).map(id => ({
          id,
          ...hospitalsMap[id]
        })).filter(h => h.doctors.length > 0); // Only keep hospitals that actually have doctors

        setHospitalsData(finalArray);

      } catch (err) {
        console.error("Failed to fetch doctors data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHospitalsAndDoctors();
  }, []);

  if (loading) {
    return (
      <div className="doctors-list-container loading">
        <div className="spinner"></div>
        <p>Loading medical network...</p>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('doctorsAuth');
    navigate('/');
  };

  const openProfile = (profile, type) => {
    setSelectedProfile({ ...profile, type });
    setSearchQuery(''); // Close search dropdown
  };

  const closeProfile = () => {
    setSelectedProfile(null);
  };

  return (
    <div className="doctors-list-container">
      
      <div className="doctors-list-header" style={{ position: 'relative' }}>
        
        <div style={{ position: 'absolute', right: '0', top: '0', display: 'flex', gap: '15px', alignItems: 'center' }}>
          
          {/* Patient Email Search */}
          <div className="directory-patient-search" style={{ position: 'relative' }}>
             <div style={{ display: 'flex', alignItems: 'center', background: 'white', borderRadius: '8px', border: '1px solid #e11d48', padding: '6px 12px', boxShadow: '0 2px 5px rgba(225,29,72,0.1)' }}>
                <Search size={18} color="#e11d48" />
                <input 
                  type="text" 
                  placeholder="Search patients by email..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ border: 'none', outline: 'none', marginLeft: '8px', padding: '4px', width: '220px', fontSize: '0.95rem' }}
                />
             </div>
             
             {/* Search Results Dropdown */}
             {searchQuery.trim().length > 0 && (
                <div style={{ position: 'absolute', top: '115%', right: '0', width: '320px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', border: '1px solid #e5e7eb', zIndex: 100, maxHeight: '400px', overflowY: 'auto' }}>
                  {patientsData.filter(p => p.email.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280', fontSize: '0.95rem' }}>No patients found with email "{searchQuery}"</div>
                  ) : (
                    patientsData.filter(p => p.email.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => openProfile(p, 'patient')}
                        style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s', cursor: 'pointer' }} 
                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} 
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                      >
                         {p.displayPicture ? (
                           <img src={p.displayPicture} alt={p.name} style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                         ) : (
                           <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}><User size={20} color="#9ca3af" /></div>
                         )}
                         <div style={{ flex: 1, overflow: 'hidden', textAlign: 'left' }}>
                           <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</h4>
                           <span style={{ fontSize: '0.85rem', color: '#6b7280', display: 'block' }}>{p.email}</span>
                           {p.age !== 'N/A' && <span style={{ fontSize: '0.75rem', color: '#059669', background: '#d1fae5', padding: '2px 8px', borderRadius: '12px', display: 'inline-block', marginTop: '6px' }}>Age: {p.age}</span>}
                         </div>
                      </div>
                    ))
                  )}
                </div>
             )}
          </div>

          <button 
             onClick={handleLogout} 
             style={{ background: 'white', color: '#e11d48', border: '1px solid #e11d48', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', transition: 'all 0.2s' }}
             onMouseEnter={e => { e.currentTarget.style.background = '#e11d48'; e.currentTarget.style.color = 'white'; }}
             onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#e11d48'; }}
          >
            <LogOut size={18} /> Exit Directory
          </button>
        </div>

        <h1>Doctors Directory</h1>
        <p>Explore our network of certified professionals across trusted hospitals.</p>
      </div>

      {hospitalsData.length === 0 ? (
        <div className="no-doctors-found">
           <Stethoscope size={48} color="#e5e7eb" />
           <p>No doctors have registered their profiles in the network yet.</p>
        </div>
      ) : (
        <div className="hospitals-wrapper">
          {hospitalsData.map((hospital) => (
            <div key={hospital.id} className="hospital-group">
               <h2 className="hospital-title">
                 <MapPin size={24} color="#f43f5e" />
                 {hospital.name}
               </h2>
               
               <div className="doctor-cards-grid">
                 {hospital.doctors.map(doctor => (
                   <div key={doctor.id} className="doctor-card" onClick={() => openProfile(doctor, 'doctor')} style={{ cursor: 'pointer' }}>
                      <div className="doc-card-header">
                         {doctor.displayPicture ? (
                           <img src={doctor.displayPicture} alt={doctor.name} className="doc-avatar" />
                         ) : (
                           <div className="doc-avatar-placeholder"><User size={24} color="#9ca3af"/></div>
                         )}
                         <div className="doc-basic-info">
                           <h3 className="doc-name">{doctor.name || 'Unnamed Doctor'}</h3>
                           <span className="doc-specialty">{doctor.specialty || 'General Practitioner'}</span>
                         </div>
                      </div>
                      
                      <div className="doc-card-details">
                        <div className="doc-detail-row">
                          <span className="doc-label">Qualifications:</span>
                          <span className="doc-value">{doctor.degree || 'N/A'}</span>
                        </div>
                        <div className="doc-detail-row">
                          <span className="doc-label">Contact:</span>
                          <span className="doc-value">{doctor.contact || 'N/A'}</span>
                        </div>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile Detail Modal */}
      {selectedProfile && (
        <div className="profile-modal-overlay" onClick={closeProfile}>
          <div className="profile-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeProfile}><X size={24} /></button>
            
            <div className="modal-profile-header">
              <div className="modal-avatar-container">
                {selectedProfile.displayPicture ? (
                  <img src={selectedProfile.displayPicture} alt={selectedProfile.name} className="modal-avatar" />
                ) : (
                  <div className="modal-avatar-placeholder"><User size={48} color="#9ca3af" /></div>
                )}
                <div className={`status-badge ${selectedProfile.type}`}>{selectedProfile.type}</div>
              </div>
              
              <div className="modal-id-info">
                <h2>{selectedProfile.name || 'Unnamed'}</h2>
                <div className="modal-main-detail">
                  {selectedProfile.type === 'doctor' ? (
                    <span className="modal-specialty-tag">{selectedProfile.specialty || 'General Practitioner'}</span>
                  ) : (
                    <span className="modal-email-tag">{selectedProfile.email}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-details-grid">
              {selectedProfile.type === 'doctor' ? (
                <>
                  <div className="detail-item">
                    <GraduationCap size={20} color="#f43f5e" />
                    <div className="detail-content">
                      <label>Qualifications</label>
                      <span>{selectedProfile.degree || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <Phone size={20} color="#f43f5e" />
                    <div className="detail-content">
                      <label>Contact Number</label>
                      <span>{selectedProfile.contact || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <Briefcase size={20} color="#f43f5e" />
                    <div className="detail-content">
                      <label>Specialization</label>
                      <span>{selectedProfile.specialty || 'General'}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="detail-item">
                    <Mail size={20} color="#f43f5e" />
                    <div className="detail-content">
                      <label>Registered Email</label>
                      <span>{selectedProfile.email}</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <User size={20} color="#f43f5e" />
                    <div className="detail-content">
                      <label>Patient Age</label>
                      <span>{selectedProfile.age} yrs</span>
                    </div>
                  </div>
                  {selectedProfile.id && (
                    <div className="detail-item">
                      <div className="detail-content">
                        <label>Patient ID</label>
                        <span className="mono-text">{selectedProfile.id}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal-footer">
              <p>Source: SwasthAI Secure Medical Database</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DoctorsList;
