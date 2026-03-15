import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Upload, FileText, Activity, AlertCircle, CheckCircle2, HeartPulse, Sparkles, Loader2, ArrowLeft, Edit3, ImagePlus, Stethoscope, User, X, Award, Briefcase, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { ref, push, set, get } from 'firebase/database';
import './AIDiagnosis.css';

// Map AI prediction conditions to doctor specialty keywords (for matching available doctors)
const CONDITION_SPECIALTIES = {
  diabetes: ['diabetologist', 'diabetes', 'endocrinology', 'endocrinologist', 'metabolic', 'general physician', 'general practitioner', 'gp'],
  heart: ['cardiologist', 'cardiology', 'heart', 'cardiac'],
  kidney: ['nephrologist', 'nephrology', 'kidney', 'renal', 'urologist', 'urology'],
  lung: ['pulmonologist', 'pulmonology', 'lung', 'respiratory', 'chest', 'tb', 'asthma', 'copd'],
};

const MANUAL_DEFAULTS = {
  age: '',
  sex: 0,
  bmi: '',
  bloodPressure: '',
  cholesterol: '',
  glucose: '',
  heartRate: '',
  smoking: 0,
  liverEnzymeLevel: '',
};

export default function AIDiagnosis() {
  const { currentUser } = useAuth();
  const [mode, setMode] = useState('upload'); // 'upload' | 'manual'
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [manualData, setManualData] = useState(MANUAL_DEFAULTS);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [allDoctors, setAllDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showDoctorModal, setShowDoctorModal] = useState(false);

  const fileInputRef = useRef(null);

  async function bookAppointment(doctorId, doctorName) {
    if (!currentUser) {
      alert('Please log in to request an appointment.');
      return;
    }
    let patientDp = '';
    let patientDetails = {};
    try {
      const userSnap = await get(ref(db, `users/${currentUser.uid}`));
      if (userSnap.exists()) {
        patientDp = userSnap.val().displayPicture || '';
        patientDetails = userSnap.val();
      }
    } catch (e) {
      console.error('Could not fetch patient details', e);
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
      timestamp: Date.now(),
    });
    setShowDoctorModal(false);
    setSelectedDoctor(null);
    alert(`Booking requested with Dr. ${doctorName || 'the doctor'}!`);
  }

  // Fetch doctors from Firebase when we have results (for recommendations)
  useEffect(() => {
    if (!results?.predictions) return;
    setDoctorsLoading(true);
    const usersRef = ref(db, 'users');
    get(usersRef)
      .then((snapshot) => {
        if (!snapshot.exists()) {
          setAllDoctors([]);
          return;
        }
        const hMap = {};
        snapshot.forEach((child) => {
          const val = child.val();
          if (val.role === 'hospital') hMap[child.key] = val.name || 'Unknown Hospital';
        });
        const docs = [];
        snapshot.forEach((child) => {
          const val = child.val();
          if (val.role === 'doctor') {
            docs.push({
              id: child.key,
              ...val,
              hospitalName: val.selectedHospital ? (hMap[val.selectedHospital] || 'Independent') : 'Independent Practice',
            });
          }
        });
        setAllDoctors(docs);
      })
      .catch(() => setAllDoctors([]))
      .finally(() => setDoctorsLoading(false));
  }, [results]);

  // Recommend doctors whose specialty matches conditions with HIGH or MEDIUM risk
  const recommendedDoctors = useMemo(() => {
    if (!results?.predictions || allDoctors.length === 0) return [];
    const riskConditions = [];
    Object.entries(results.predictions).forEach(([condition, data]) => {
      if (data && !data.error && (data.risk === 'HIGH' || data.risk === 'MEDIUM')) {
        riskConditions.push(condition);
      }
    });
    if (riskConditions.length === 0) return [];
    const keywords = new Set();
    riskConditions.forEach((c) => {
      (CONDITION_SPECIALTIES[c] || []).forEach((kw) => keywords.add(kw));
    });
    const specialtyLower = (s) => (s || '').toLowerCase();
    return allDoctors.filter((doc) => {
      const docSpec = specialtyLower(doc.specialty);
      return [...keywords].some((kw) => docSpec.includes(kw));
    });
  }, [results, allDoctors]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
      setResults(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageSelect({ target: { files: [file] } });
    } else {
      setError("Please drop a valid image file.");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleManualChange = (field, value) => {
    setManualData((prev) => ({ ...prev, [field]: value }));
    setError('');
    setResults(null);
  };

  const analyzeManual = async () => {
    const payload = {
      age: Number(manualData.age) || 40,
      sex: Number(manualData.sex) in { 0: 1, 1: 1 } ? Number(manualData.sex) : 0,
      bmi: Number(manualData.bmi) || 25,
      bloodPressure: Number(manualData.bloodPressure) || 120,
      cholesterol: Number(manualData.cholesterol) || 200,
      glucose: Number(manualData.glucose) || 100,
      heartRate: Number(manualData.heartRate) || 72,
      smoking: Number(manualData.smoking) in { 0: 1, 1: 1 } ? Number(manualData.smoking) : 0,
      liverEnzymeLevel: Number(manualData.liverEnzymeLevel) || 40,
    };
    setIsAnalyzing(true);
    setError('');
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/analyze-manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Analysis failed');
      }
      const data = await response.json();
      setResults(data);
      if (currentUser?.email) saveReportToFirebase(data, null);
    } catch (err) {
      setError(err.message || 'An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeReport = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('report', selectedImage);
      
      // In production, you would upload the image to Firebase Storage first,
      // get the secure URL, and send *that* to the backend.
      // For this implementation, we are sending the file directly to Node via Multer for OCR.
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/analyze-report`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to analyze report');
      }

      const data = await response.json();
      setResults(data);
      if (currentUser?.email) saveReportToFirebase(data, selectedImage);

    } catch (err) {
      setError(err.message || 'An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveReportToFirebase = async (data, imageFile) => {
    if (!currentUser?.email) return;
    try {
      const reportObj = {
        patientEmail: currentUser.email.toLowerCase(),
        doctorName: 'AI Assistant',
        title: data.source === 'manual' ? `AI Analysis (Manual) - ${new Date().toLocaleDateString()}` : `AI Analysis - ${new Date().toLocaleDateString()}`,
        date: new Date().toISOString(),
        fileBase64: null,
        analysisData: data,
      };
      if (imageFile) {
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onloadend = async () => {
          reportObj.fileBase64 = reader.result;
          const reportsListRef = ref(db, 'reports');
          await set(push(reportsListRef), reportObj);
        };
      } else {
        const reportsListRef = ref(db, 'reports');
        await set(push(reportsListRef), reportObj);
      }
    } catch (e) {
      console.error('Failed to save to Firebase:', e);
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'HIGH': return '#ef4444'; // Red
      case 'MEDIUM': return '#f59e0b'; // Amber
      case 'LOW': return '#10b981'; // Green
      default: return '#6b7280'; // Gray
    }
  };

  return (
    <div className="ai-diagnosis-container">
      <div className="swasth-bg-blob blob-1"></div>
      <div className="swasth-bg-blob blob-3"></div>
      
      <div className="ai-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Link to="/dashboard" className="back-link">
              <ArrowLeft size={20} /> Back to Dashboard
            </Link>
            <h1 className="ai-title"><Sparkles size={32} color="#8b5cf6" /> AI Health Diagnostics</h1>
            <p className="ai-subtitle">Upload your medical report and let our 4 specialized AI models analyze your risk factors instantly.</p>
          </div>
        </div>
      </div>

      <div className="ai-content">
        <div className="upload-section">
          <div className="input-mode-tabs">
            <button
              type="button"
              className={`tab-btn ${mode === 'upload' ? 'active' : ''}`}
              onClick={() => { setMode('upload'); setError(''); setResults(null); }}
            >
              <ImagePlus size={20} /> Upload Report
            </button>
            <button
              type="button"
              className={`tab-btn ${mode === 'manual' ? 'active' : ''}`}
              onClick={() => { setMode('manual'); setError(''); setResults(null); }}
            >
              <Edit3 size={20} /> Add manual
            </button>
          </div>

          {mode === 'upload' && (
            <>
              <h2><FileText size={24} color="#3b82f6" /> Upload Medical Report</h2>
              <p>We support lab reports, blood tests, and discharge summaries (JPG, PNG)</p>
              
              <div 
                className={`upload-dropzone ${previewUrl ? 'has-image' : ''}`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={triggerFileInput}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageSelect} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                />
                
                {previewUrl ? (
                  <div className="image-preview-container">
                    <img src={previewUrl} alt="Report Preview" className="image-preview" />
                    <div className="preview-overlay">
                      <Upload size={24} />
                      <span>Click or drag to replace</span>
                    </div>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <Upload size={48} color="#9ca3af" style={{ marginBottom: '15px' }} />
                    <h3>Drag & Drop your report here</h3>
                    <p>or click to browse from your device</p>
                  </div>
                )}
              </div>

              <button 
                className="btn-analyze" 
                onClick={analyzeReport} 
                disabled={!selectedImage || isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={20} className="spinner" />
                    Scanning & Extracting Data...
                  </>
                ) : (
                  <>
                    <Activity size={20} />
                    Run AI Analysis
                  </>
                )}
              </button>
            </>
          )}

          {mode === 'manual' && (
            <>
              <h2><Edit3 size={24} color="#8b5cf6" /> Enter values manually</h2>
              <p>Fill in the health metrics below in the same order used by the models.</p>
              <div className="manual-form">
                <div className="manual-row">
                  <label>Age</label>
                  <input type="number" min="1" max="120" placeholder="e.g. 45" value={manualData.age} onChange={(e) => handleManualChange('age', e.target.value)} />
                </div>
                <div className="manual-row">
                  <label>Sex (0 = Female, 1 = Male)</label>
                  <select value={manualData.sex} onChange={(e) => handleManualChange('sex', e.target.value)}>
                    <option value={0}>Female (0)</option>
                    <option value={1}>Male (1)</option>
                  </select>
                </div>
                <div className="manual-row">
                  <label>BMI</label>
                  <input type="number" min="10" max="60" step="0.1" placeholder="e.g. 25.5" value={manualData.bmi} onChange={(e) => handleManualChange('bmi', e.target.value)} />
                </div>
                <div className="manual-row">
                  <label>Blood pressure (mmHg)</label>
                  <input type="number" min="60" max="200" placeholder="e.g. 120" value={manualData.bloodPressure} onChange={(e) => handleManualChange('bloodPressure', e.target.value)} />
                </div>
                <div className="manual-row">
                  <label>Cholesterol (mg/dL)</label>
                  <input type="number" min="0" placeholder="e.g. 200" value={manualData.cholesterol} onChange={(e) => handleManualChange('cholesterol', e.target.value)} />
                </div>
                <div className="manual-row">
                  <label>Glucose (mg/dL)</label>
                  <input type="number" min="0" placeholder="e.g. 100" value={manualData.glucose} onChange={(e) => handleManualChange('glucose', e.target.value)} />
                </div>
                <div className="manual-row">
                  <label>Heart rate (bpm)</label>
                  <input type="number" min="40" max="200" placeholder="e.g. 72" value={manualData.heartRate} onChange={(e) => handleManualChange('heartRate', e.target.value)} />
                </div>
                <div className="manual-row">
                  <label>Smoking (0 = No, 1 = Yes)</label>
                  <select value={manualData.smoking} onChange={(e) => handleManualChange('smoking', e.target.value)}>
                    <option value={0}>No (0)</option>
                    <option value={1}>Yes (1)</option>
                  </select>
                </div>
                <div className="manual-row">
                  <label>Liver enzyme level (ALT/AST, U/L)</label>
                  <input type="number" min="0" placeholder="e.g. 40" value={manualData.liverEnzymeLevel} onChange={(e) => handleManualChange('liverEnzymeLevel', e.target.value)} />
                </div>
              </div>
              <button 
                className="btn-analyze" 
                onClick={analyzeManual} 
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={20} className="spinner" />
                    Running AI Analysis...
                  </>
                ) : (
                  <>
                    <Activity size={20} />
                    Run AI Analysis
                  </>
                )}
              </button>
            </>
          )}

          {error && (
            <div className="error-alert">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="results-section">
          <h2><HeartPulse size={24} color="#ec4899" /> Analysis Results</h2>
          
          {!results && !isAnalyzing && (
            <div className="empty-results">
              <Sparkles size={40} color="#cbd5e1" style={{ marginBottom: '15px' }} />
              <p>Upload a report and run the analysis to view your AI-generated health assessment here.</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="analyzing-state">
              <div className="scanning-bar"></div>
              <p>1. Running OCR text extraction...</p>
              <p>2. Parsing biomarker heuristics...</p>
              <p>3. Executing local ML models...</p>
            </div>
          )}

          {results && (
            <div className="results-grid">
              
              <div className="extracted-data-card">
                <h3>{results.source === 'manual' ? 'Entered values' : 'Extracted Biomarkers (OCR)'}</h3>
                <ul>
                  {Object.entries(results.parsedData || {}).map(([key, val]) => (
                    <li key={key}>
                      <span className="biomarker-label">{key.toUpperCase()}</span>
                      <span className="biomarker-value">{val}</span>
                    </li>
                  ))}
                </ul>
                {results.source !== 'manual' && <p className="notice">Note: Extraction is based on OCR patterns. Verify values with original report.</p>}
              </div>

              <div className="predictions-container">
                {Object.entries(results.predictions || {}).map(([disease, data]) => (
                  <div key={disease} className="prediction-card">
                    <div className="card-header">
                      <h4 style={{ textTransform: 'capitalize' }}>{disease} Risk</h4>
                      {data.error ? (
                        <span className="badge-error">Error</span>
                      ) : (
                        <span 
                          className="badge-risk" 
                          style={{ backgroundColor: `${getRiskColor(data.risk)}20`, color: getRiskColor(data.risk) }}
                        >
                          {data.risk}
                        </span>
                      )}
                    </div>
                    
                    {!data.error && (
                      <div className="card-body">
                        <div className="prob-bar-container">
                          <div 
                            className="prob-bar" 
                            style={{ 
                              width: `${(data.probability * 100).toFixed(1)}%`,
                              backgroundColor: getRiskColor(data.risk)
                            }}
                          ></div>
                        </div>
                        <p className="prob-text">Probability: {(data.probability * 100).toFixed(1)}%</p>
                      </div>
                    )}
                    {data.error && <p className="error-text">{data.error}</p>}
                  </div>
                ))}
              </div>

              {/* Recommended doctors based on HIGH/MEDIUM risk conditions */}
              <div className="recommended-doctors-card">
                <h3><Stethoscope size={22} color="#3b82f6" /> Recommended doctors for you</h3>
                <p className="recommended-doctors-desc">
                  Based on your risk levels, these specialists from our network may be able to help. Click a doctor to view their profile and request an appointment.
                </p>
                {doctorsLoading && (
                  <div className="recommended-loading">
                    <Loader2 size={24} className="spinner" /> Loading doctors...
                  </div>
                )}
                {!doctorsLoading && recommendedDoctors.length === 0 && (
                  <p className="no-recommended">No matching specialists in the database right now, or your risk levels are low. You can still <Link to="/booking">browse all doctors</Link>.</p>
                )}
                {!doctorsLoading && recommendedDoctors.length > 0 && (
                  <div className="recommended-doctors-grid">
                    {recommendedDoctors.map((doc) => (
                      <div
                        key={doc.id}
                        className="recommended-doctor-card"
                        onClick={() => { setSelectedDoctor(doc); setShowDoctorModal(true); }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedDoctor(doc); setShowDoctorModal(true); } }}
                      >
                        <div className="rec-doc-avatar">
                          {doc.displayPicture ? (
                            <img src={doc.displayPicture} alt={doc.name} />
                          ) : (
                            <User size={28} color="#64748b" />
                          )}
                        </div>
                        <div className="rec-doc-info">
                          <h4>Dr. {doc.name || 'Specialist'}</h4>
                          <span className="rec-doc-specialty">{doc.specialty || 'General Practitioner'}</span>
                          <span className="rec-doc-hospital">🏥 {doc.hospitalName}</span>
                        </div>
                        <span className="rec-doc-view-btn">View profile & book</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="success-banner">
                <CheckCircle2 size={24} color="#10b981" />
                <div>
                  <h4>Analysis Saved Automatically</h4>
                  <p>This report and its predictions have been saved to your patient dashboard under "My Lab & Hospital Reports".</p>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Doctor profile modal (same as Doctor Booking) */}
      {showDoctorModal && selectedDoctor && (
        <div className="modal-overlay" onClick={() => setShowDoctorModal(false)}>
          <div className="modal-content doctor-profile-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setShowDoctorModal(false)} aria-label="Close">
              <X size={24} />
            </button>
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
                <div className="info-item info-item-full">
                  <Briefcase size={20} color="#3b82f6" />
                  <div>
                    <label>Affiliated Hospital</label>
                    <p className="hospital-name">{selectedDoctor.hospitalName}</p>
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
                type="button"
                className="btn-confirm-booking"
                onClick={() => bookAppointment(selectedDoctor.id, selectedDoctor.name || selectedDoctor.email)}
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
