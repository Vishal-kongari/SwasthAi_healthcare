import React, { useState, useRef } from 'react';
import { Upload, FileText, Activity, AlertCircle, CheckCircle2, HeartPulse, Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { ref, push, set } from 'firebase/database';
import './AIDiagnosis.css';

export default function AIDiagnosis() {
  const { currentUser } = useAuth();
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);

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
      
      // Save the result to Firebase if user is logged in
      if (currentUser && currentUser.email) {
        saveReportToFirebase(data);
      }

    } catch (err) {
      setError(err.message || 'An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveReportToFirebase = async (data) => {
    try {
      // Create object to save
      // Converting image to Base64 to save alongside JSON data (for demo purposes)
      // In prod: Upload exact file to Firebase Storage -> Save URL to Realtime DB
      const reader = new FileReader();
      reader.readAsDataURL(selectedImage);
      reader.onloadend = async () => {
        const base64data = reader.result;
        
        const reportObj = {
          patientEmail: currentUser.email.toLowerCase(),
          doctorName: "AI Assistant",
          title: `AI Analysis - ${new Date().toLocaleDateString()}`,
          date: new Date().toISOString(),
          fileBase64: base64data,
          analysisData: data
        };

        const reportsListRef = ref(db, 'reports');
        const newReportRef = push(reportsListRef);
        await set(newReportRef, reportObj);
      };
    } catch (e) {
      console.error("Failed to save to Firebase:", e);
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

          {error && (
            <div className="error-alert">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

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
                <h3>Extracted Biomarkers (OCR)</h3>
                <ul>
                  {Object.entries(results.parsedData || {}).map(([key, val]) => (
                    <li key={key}>
                      <span className="biomarker-label">{key.toUpperCase()}</span>
                      <span className="biomarker-value">{val}</span>
                    </li>
                  ))}
                </ul>
                <p className="notice">Note: Extraction is based on simple heuristics. Verify values with original report.</p>
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
    </div>
  );
}
