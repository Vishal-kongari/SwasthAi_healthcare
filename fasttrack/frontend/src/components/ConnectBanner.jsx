// src/components/ConnectBanner.jsx — SwasthAI Light Joy
import React, { useState } from 'react';
import { getAuthUrl } from '../api/healthApi';

export default function ConnectBanner({ connected, onLogout }) {
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const url = await getAuthUrl();
      window.location.href = url;
    } catch {
      alert('Could not connect. Make sure the backend is running on port 5001.');
      setConnecting(false);
    }
  };

  if (connected) {
    return (
      <div style={{ ...styles.banner, background: 'linear-gradient(135deg,#F0FFF6,#EAFFF5)', borderColor: '#9AE6B4' }}>
        <div style={styles.left}>
          <div style={styles.titleRow}>
            <span style={styles.emoji}>✅</span>
            <h3 style={{ ...styles.title, color: '#276749' }}>Google Fit Connected</h3>
          </div>
          <p style={styles.desc}>Your watch data is syncing live. All health metrics are real.</p>
          <div style={styles.chips}>
            {['👣 Steps', '❤️ Heart Rate', '🩸 SpO2', '🔥 Calories', '🌙 Sleep'].map(c => (
              <span key={c} style={{ ...styles.chip, background: '#C6F6D5', color: '#276749' }}>{c}</span>
            ))}
          </div>
        </div>
        <button style={styles.disconnectBtn} onClick={onLogout}>Disconnect</button>
      </div>
    );
  }

  return (
    <div style={styles.banner}>
      <div style={styles.left}>
        <div style={styles.titleRow}>
          <span style={styles.emoji}>🔗</span>
          <h3 style={styles.title}>Connect Your Watch</h3>
        </div>
        <p style={styles.desc}>
          Sync your FastTrack Smart watch via Google Fit to display live health data. Enable Google Fit in your Titan Smart app first.
        </p>
        <div style={styles.steps}>
          {['Open Titan Smart App', 'Settings → Google Fit → ON', 'Click Connect below', 'Allow permissions'].map((s, i) => (
            <div key={i} style={styles.stepItem}>
              <div style={styles.stepNum}>{i + 1}</div>
              <span style={styles.stepText}>{s}</span>
            </div>
          ))}
        </div>
      </div>
      <button
        style={{ ...styles.connectBtn, opacity: connecting ? 0.75 : 1 }}
        onClick={handleConnect}
        disabled={connecting}
      >
        {connecting ? '⏳ Connecting...' : '🔗 Connect Google Fit'}
      </button>
    </div>
  );
}

const styles = {
  banner: {
    background: 'linear-gradient(135deg,#EBF8FF,#E9F0FF)',
    border: '1.5px solid #90CDF4',
    borderRadius: 20, padding: '24px 28px',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', flexWrap: 'wrap',
    gap: 20, marginBottom: 28
  },
  left: { flex: 1 },
  titleRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  emoji: { fontSize: 22 },
  title: { fontFamily: "'Nunito',sans-serif", fontSize: 17, fontWeight: 800, color: '#2B6CB0' },
  desc: { fontSize: 13, color: '#718096', maxWidth: 420, lineHeight: 1.7, marginBottom: 14 },
  chips: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  chip: { borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: 600 },
  steps: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  stepItem: { display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.7)', border: '1px solid #BEE3F8', borderRadius: 10, padding: '6px 12px' },
  stepNum: { width: 20, height: 20, borderRadius: '50%', background: '#2D9CDB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 },
  stepText: { fontSize: 12, color: '#2D3748', fontWeight: 500 },
  connectBtn: {
    background: 'linear-gradient(135deg,#2D9CDB,#56CCF2)',
    border: 'none', color: '#fff',
    padding: '14px 28px', borderRadius: 14,
    fontFamily: "'Nunito',sans-serif", fontSize: 15,
    fontWeight: 800, cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 18px rgba(45,156,219,0.35)',
    transition: 'all 0.2s'
  },
  disconnectBtn: {
    background: '#fff', border: '1.5px solid #9AE6B4',
    color: '#276749', padding: '10px 22px',
    borderRadius: 12, cursor: 'pointer',
    fontFamily: "'Nunito',sans-serif", fontSize: 13, fontWeight: 700
  }
};
