import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase';
import { ref, get, set, update, onValue } from 'firebase/database';
import { User, Image as ImageIcon, Briefcase, Award, Droplets, Activity, Thermometer, Weight, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import './Profile.css';

export default function Profile() {
  const { currentUser, userRole } = useAuth();
  const { t } = useLanguage();
  
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
  const [symptomHistory, setSymptomHistory] = useState([]);
  const [expandedSymptomId, setExpandedSymptomId] = useState(null);

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

    // Fetch symptom history (for patients - AI symptom analyses appended here)
    if (userRole === 'patient') {
      const symptomHistoryRef = ref(db, `users/${currentUser.uid}/symptomHistory`);
      onValue(symptomHistoryRef, (snapshot) => {
        if (snapshot.exists()) {
          const list = Object.entries(snapshot.val()).map(([id, v]) => ({ id, ...v }));
          list.sort((a, b) => new Date(b.date || b.id) - new Date(a.date || a.id));
          setSymptomHistory(list);
        } else {
          setSymptomHistory([]);
        }
      });
    }

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

      setSaveMessage(t('profileSaved'));
    } catch (error) {
      console.error(error);
      setSaveMessage(t('profileSaved'));
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  if (!currentUser) return <div style={{ padding: '50px', textAlign: 'center' }}>{t('pleaseLoginFirst')}</div>;

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h2>{userRole === 'doctor' ? t('doctorProfile') : t('patientProfile')}</h2>
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
                <ImageIcon size={18} /> {t('uploadPicture')}
              </label>
              <input id="dp-input" type="file" accept="image/*" onChange={handleImageUpload} />
            </div>
          </div>
          <div className="form-group">
            <label>{t('fullName')}</label>
            <input type="text" name="name" value={profileData.name || ''} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>{t('phone')}</label>
            <input type="text" name="phone" value={profileData.phone || ''} onChange={handleChange} />
          </div>
          {userRole === 'doctor' && (
            <>
              <div className="form-group">
                <label><Award size={16} /> {t('degree')}</label>
                <input type="text" name="degree" value={profileData.degree || ''} onChange={handleChange} placeholder="e.g. MBBS, MD" required />
              </div>
              <div className="form-group">
                <label><Briefcase size={16} /> {t('specialty')}</label>
                <input type="text" name="specialty" value={profileData.specialty || ''} onChange={handleChange} placeholder="e.g. Cardiologist" required />
              </div>
              <div className="form-group">
                <label>{t('hospital')}</label>
                <select name="selectedHospital" value={profileData.selectedHospital || ''} onChange={handleChange}>
                  <option value="">-- {t('selectHospital')} --</option>
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
                  <label>{t('age')}</label>
                  <input type="number" name="age" value={profileData.age || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>{t('gender')}</label>
                  <select name="gender" value={profileData.gender || ''} onChange={handleChange}>
                    <option value="">{t('selectGender')}</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="profile-row">
                <div className="form-group">
                  <label><Droplets size={16} color="#ef4444" /> {t('bloodGroup')}</label>
                  <select name="bloodGroup" value={profileData.bloodGroup || ''} onChange={handleChange}>
                    <option value="">{t('selectBloodGroup')}</option>
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
                  <label><Weight size={16} color="#3b82f6" /> {t('weight')} (kg)</label>
                  <input type="number" name="weight" value={profileData.weight || ''} onChange={handleChange} placeholder="e.g. 70" />
                </div>
              </div>

              <div className="form-group">
                <label><Activity size={16} color="#10b981" /> {t('recentDiseases')}</label>
                <input 
                  type="text" 
                  name="recentDiseases" 
                  value={profileData.recentDiseases || ''} 
                  onChange={handleChange} 
                  placeholder="e.g. Flu, Viral Fever, etc." 
                />
              </div>

              <div className="form-group">
                <label>{t('medicalHistory')}</label>
                <textarea 
                  name="medicalHistory" 
                  value={profileData.medicalHistory || ''} 
                  onChange={handleChange}
                  placeholder="Any chronic conditions, allergies, or long-term medications."
                  rows="4"
                />
              </div>

              {symptomHistory.length > 0 && (
                <div className="form-group symptom-history-section">
                  <label><MessageCircle size={16} color="#8b5cf6" /> {t('symptomHistory')}</label>
                  <p className="symptom-history-hint">{t('symptomHistoryHint')}</p>
                  <div className="symptom-history-list">
                    {symptomHistory.map((entry) => (
                      <div key={entry.id} className="symptom-history-item">
                        <button
                          type="button"
                          className="symptom-history-header"
                          onClick={() => setExpandedSymptomId(expandedSymptomId === entry.id ? null : entry.id)}
                        >
                          <span className="symptom-history-date">{new Date(entry.date || entry.id).toLocaleDateString()}</span>
                          <span className="symptom-history-snippet">{entry.symptoms?.slice(0, 50)}{entry.symptoms?.length > 50 ? '…' : ''}</span>
                          {expandedSymptomId === entry.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                        {expandedSymptomId === entry.id && (
                          <div className="symptom-history-body">
                            <p><strong>Symptoms:</strong> {entry.symptoms}</p>
                            <p><strong>Analysis:</strong> {entry.analysis}</p>
                            {entry.explanation && <p><strong>Why this response:</strong> {entry.explanation}</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <button type="submit" className="profile-save-btn" disabled={saving}>
            {saving ? t('saving') : t('saveProfile')}
          </button>
        </form>
      </div>
    </div>
  );
}
