import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { ref, get, set, update, onValue } from 'firebase/database';
import { User, Image as ImageIcon, Briefcase, Award, Droplets, Activity, Thermometer, Weight } from 'lucide-react';
import './Profile.css';

export default function Profile() {
  const { currentUser, userRole } = useAuth();
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    displayPicture: '',
    // Doctor specific Fields
    degree: '',
    specialty: '',
    selectedHospital: '',
    // Patient specific fields
    age: '',
    gender: '',
    bloodGroup: '',
    weight: '',
    recentDiseases: '',
    medicalHistory: ''
  });

  const [hospitals, setHospitals] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Initial load
  useEffect(() => {
    if (!currentUser) return;

    // Fetch User Profile
    const userRef = ref(db, `users/${currentUser.uid}`);
    onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setProfileData(prev => ({ ...prev, ...snapshot.val() }));
      } else {
        setProfileData(prev => ({ ...prev, email: currentUser.email }));
      }
    }, { onlyOnce: true });

    // Fetch Hospitals (for doctor dropdown)
    if (userRole === 'doctor') {
      const hospRef = ref(db, 'users');
      get(hospRef).then((snap) => {
        if (snap.exists()) {
          const hospList = [];
          snap.forEach(child => {
            if (child.val().role === 'hospital') {
              hospList.push({ id: child.key, name: child.val().name });
            }
          });
          setHospitals(hospList);
        }
      });
    }

  }, [currentUser, userRole]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, displayPicture: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage('');

    try {
      const userRef = ref(db, `users/${currentUser.uid}`);
      await update(userRef, profileData);

      // If doctor selected a hospital, link them properly.
      if (userRole === 'doctor' && profileData.selectedHospital) {
        const hospitalDoctorRef = ref(db, `hospitals/${profileData.selectedHospital}/doctors/${currentUser.uid}`);
        await set(hospitalDoctorRef, {
          name: profileData.name,
          specialty: profileData.specialty || 'General',
          contact: profileData.phone || '',
          degree: profileData.degree || '',
          displayPicture: profileData.displayPicture || ''
        });
      }

      setSaveMessage('Profile saved successfully!');
    } catch (error) {
      console.error(error);
      setSaveMessage('Error saving profile.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  if (!currentUser) return <div style={{padding: '50px', textAlign: 'center'}}>Please Login First.</div>;

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h2>{userRole === 'doctor' ? 'Doctor Profile' : 'Patient Profile'}</h2>
        {saveMessage && <div className="save-message">{saveMessage}</div>}
        
        <form onSubmit={handleSave} className="profile-form">
          <div className="dp-section">
            <div className="dp-preview">
              {profileData.displayPicture ? (
                <img src={profileData.displayPicture} alt="Profile" />
              ) : (
                <User size={64} color="#9ca3af" />
              )}
            </div>
            <div className="dp-upload">
              <label htmlFor="dp-input" className="dp-label">
                <ImageIcon size={18} /> Upload Picture
              </label>
              <input id="dp-input" type="file" accept="image/*" onChange={handleImageUpload} />
            </div>
          </div>

          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="name" value={profileData.name || ''} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input type="text" name="phone" value={profileData.phone || ''} onChange={handleChange} />
          </div>

          {userRole === 'doctor' && (
            <>
              <div className="form-group">
                <label><Award size={16} /> Degree / Qualifications</label>
                <input type="text" name="degree" value={profileData.degree || ''} onChange={handleChange} placeholder="e.g. MBBS, MD" required />
              </div>
              <div className="form-group">
                <label><Briefcase size={16} /> Specialty</label>
                <input type="text" name="specialty" value={profileData.specialty || ''} onChange={handleChange} placeholder="e.g. Cardiologist" required />
              </div>
              <div className="form-group">
                <label>Affiliated Hospital</label>
                <select name="selectedHospital" value={profileData.selectedHospital || ''} onChange={handleChange}>
                  <option value="">-- Select Hospital --</option>
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
                <small>Selecting a hospital will automatically add you to their dashboard.</small>
              </div>
            </>
          )}

          {userRole === 'patient' && (
            <>
              <div className="profile-row">
                <div className="form-group">
                  <label>Age</label>
                  <input type="number" name="age" value={profileData.age || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select name="gender" value={profileData.gender || ''} onChange={handleChange}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="profile-row">
                <div className="form-group">
                  <label><Droplets size={16} color="#ef4444" /> Blood Group</label>
                  <select name="bloodGroup" value={profileData.bloodGroup || ''} onChange={handleChange}>
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div className="form-group">
                  <label><Weight size={16} color="#3b82f6" /> Weight (kg)</label>
                  <input type="number" name="weight" value={profileData.weight || ''} onChange={handleChange} placeholder="e.g. 70" />
                </div>
              </div>

              <div className="form-group">
                <label><Activity size={16} color="#10b981" /> Recent Diseases / Conditions</label>
                <input 
                  type="text" 
                  name="recentDiseases" 
                  value={profileData.recentDiseases || ''} 
                  onChange={handleChange} 
                  placeholder="e.g. Flu, Viral Fever, etc." 
                />
              </div>

              <div className="form-group">
                <label>Medical History (Optional)</label>
                <textarea 
                  name="medicalHistory" 
                  value={profileData.medicalHistory || ''} 
                  onChange={handleChange}
                  placeholder="Any chronic conditions, allergies, or long-term medications."
                  rows="4"
                />
              </div>
            </>
          )}

          <button type="submit" className="profile-save-btn" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
