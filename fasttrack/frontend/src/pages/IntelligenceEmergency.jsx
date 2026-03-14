import React, { useState } from 'react';
import { ShieldAlert, Send, HeartPulse, Activity, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function IntelligenceEmergency() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResponse('');

    try {
      // Connect to the new endpoint
      const res = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/intelligence-emergency`, {
        query: query
      });
      setResponse(res.data.result);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to analyze emergency. Please check your backend is running and GEMINI_API_KEY is active.');
    } finally {
      setLoading(false);
    }
  };

  // Convert Gemini markdown to HTML-ish display, since we don't have a markdown parser handy.
  // We'll just simple-replace standard markdown patterns.
  const formatResponse = (text) => {
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')       // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>')                    // Italic
      .replace(/## (.*?)\n/g, '<h3 style="color:#2D3748; margin-top:20px; font-weight:800; font-family:\'Nunito\', sans-serif;">$1</h3>') // H2
      .replace(/# (.*?)\n/g, '<h2 style="color:#C53030; margin-top:20px; font-weight:900; font-family:\'Nunito\', sans-serif;">$1</h2>') // H1
      .replace(/\n\n/g, '<br/><br/>')                          // Paragraphs
      .replace(/- (.*?)\n/g, '<li style="margin-left: 20px; margin-bottom: 8px;">$1</li>'); // Lists

    return { __html: formatted };
  };

  return (
    <div style={styles.page}>
      {/* Background blobs for aesthetics */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.blob3} />

      <div style={styles.wrap}>
        {/* Header Section */}
        <header style={styles.header}>
          <div style={styles.headerIcon}>
            <ShieldAlert size={36} color="#E53E3E" strokeWidth={2.5} />
          </div>
          <div style={styles.headerTextContainer}>
            <h1 style={styles.title}>Intelligence Emergency</h1>
            <p style={styles.subtitle}>Critical guidance during the "Golden Hour". Powered by AI + Official Sources.</p>
          </div>
        </header>

        {/* Info Banner */}
        <div style={styles.infoBanner}>
          <AlertCircle size={22} color="#DD6B20" />
          <span style={styles.infoText}>
            <strong>Disclaimer:</strong> This is an AI assistant, not a replacement for medical professionals. Always call your local emergency services (e.g., 911, 112, 108) immediately.
          </span>
        </div>

        {/* Input Card */}
        <div style={styles.inputCard}>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputWrapper}>
              <HeartPulse size={24} color="#F56565" style={styles.inputIcon} />
              <input 
                type="text"
                placeholder="Describe the medical emergency (e.g. 'Someone is having a severe allergic reaction' or 'My friend has deep cut on arm')"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={styles.input}
                disabled={loading}
              />
            </div>
            <button type="submit" style={styles.submitBtn} disabled={loading || !query.trim()}>
              {loading ? (
                <Loader2 size={22} color="#FFF" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <>
                  <span>Analyze</span>
                  <Send size={18} color="#FFF" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Response Area */}
        {error && (
          <div style={styles.errorBox}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{error}</span>
          </div>
        )}

        {response && (
          <div style={{...styles.responseCard, ...styles.fadeIn}}>
            <div style={styles.responseHeader}>
              <Activity size={24} color="#3182CE" />
              <h2 style={styles.responseTitle}>Immediate Actions Recommended</h2>
            </div>
            
            <div 
              style={styles.responseText}
              dangerouslySetInnerHTML={formatResponse(response)} 
            />
            
            <div style={styles.sourcesFooter}>
              <p style={styles.sourcesTitle}><strong>Sources Notice:</strong> Information above is gathered recognizing guidelines from official health websites (like WHO, CDC, Red Cross). Ensure actions are verified if possible.</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #FFF5F5 0%, #FEFCBF 50%, #EBF8FF 100%)',
    fontFamily: "'Lato', sans-serif",
    position: 'relative',
    overflowX: 'hidden',
    paddingTop: 40,
    paddingBottom: 80
  },
  blob1: {
    position: 'fixed', top: -50, left: -100, width: 400, height: 400,
    background: 'radial-gradient(circle, rgba(254,178,178,0.2) 0%, transparent 70%)',
    borderRadius: '50%', pointerEvents: 'none', zIndex: 0
  },
  blob2: {
    position: 'fixed', bottom: -50, right: -150, width: 450, height: 450,
    background: 'radial-gradient(circle, rgba(144,205,244,0.25) 0%, transparent 70%)',
    borderRadius: '50%', pointerEvents: 'none', zIndex: 0
  },
  blob3: {
    position: 'fixed', top: '30%', right: '20%', width: 250, height: 250,
    background: 'radial-gradient(circle, rgba(251,211,141,0.25) 0%, transparent 70%)',
    borderRadius: '50%', pointerEvents: 'none', zIndex: 0
  },
  wrap: {
    position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '0 24px',
    animation: 'fadeUp 0.6s ease forwards'
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 20, marginBottom: 30,
    justifyContent: 'center', textAlign: 'center',
    flexDirection: 'column'
  },
  headerIcon: {
    width: 80, height: 80, borderRadius: 24,
    background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 10px 30px rgba(229, 62, 62, 0.2)',
    border: '4px solid #FFF5F5'
  },
  headerTextContainer: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8
  },
  title: {
    fontFamily: "'Nunito', sans-serif", fontSize: 42, fontWeight: 900,
    color: '#E53E3E', margin: 0, letterSpacing: -1
  },
  subtitle: {
    fontSize: 16, color: '#4A5568', margin: 0, fontWeight: 500
  },
  infoBanner: {
    background: '#FFFAF0', border: '1.5px solid #FBD38D', borderRadius: 12,
    padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
    marginBottom: 30, boxShadow: '0 4px 15px rgba(221, 107, 32, 0.05)'
  },
  infoText: {
    color: '#9C4221', fontSize: 13, lineHeight: 1.5
  },
  inputCard: {
    background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 1)', borderRadius: 24,
    padding: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
    marginBottom: 30
  },
  form: {
    display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap'
  },
  inputWrapper: {
    flex: 1, position: 'relative', display: 'flex', alignItems: 'center', minWidth: 280
  },
  inputIcon: {
    position: 'absolute', left: 20
  },
  input: {
    width: '100%', padding: '20px 20px 20px 56px',
    borderRadius: 16, border: '2px solid #EDF2F7',
    fontSize: 16, fontFamily: "'Lato', sans-serif", color: '#2D3748',
    background: '#F7FAFC', transition: 'all 0.3s ease',
    outline: 'none'
  },
  submitBtn: {
    background: 'linear-gradient(135deg, #E53E3E, #F56565)',
    color: 'white', border: 'none', borderRadius: 16,
    padding: '0 32px', height: 60,
    fontSize: 16, fontWeight: 700, fontFamily: "'Nunito', sans-serif",
    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(229, 62, 62, 0.3)', transition: 'transform 0.2s',
  },
  errorBox: {
    background: '#FEFCBF', border: '1.5px solid #F6E05E', borderRadius: 16,
    padding: '20px', display: 'flex', alignItems: 'center', gap: 16,
    color: '#975A16', marginBottom: 30, boxShadow: '0 4px 15px rgba(214, 158, 46, 0.1)'
  },
  responseCard: {
    background: 'white', borderRadius: 24, padding: '32px',
    boxShadow: '0 15px 50px rgba(0,0,0,0.08)',
    border: '1px solid #E2E8F0', marginTop: 20
  },
  fadeIn: {
    animation: 'fadeUp 0.6s ease forwards'
  },
  responseHeader: {
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
    paddingBottom: 20, borderBottom: '1.5px solid #EDF2F7'
  },
  responseTitle: {
    fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 800,
    color: '#2B6CB0', margin: 0
  },
  responseText: {
    fontSize: 16, color: '#2D3748', lineHeight: 1.8,
    fontFamily: "'Lato', sans-serif",
  },
  sourcesFooter: {
    marginTop: 30, paddingTop: 20, borderTop: '1px dashed #CBD5E0',
    background: '#F7FAFC', padding: '16px', borderRadius: 12
  },
  sourcesTitle: {
    margin: 0, fontSize: 13, color: '#718096', lineHeight: 1.5
  }
};
