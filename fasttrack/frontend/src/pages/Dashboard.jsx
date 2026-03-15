// src/pages/Dashboard.jsx — SwasthAI Light Joy Theme
import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MetricCard from '../components/MetricCard';
import GoalRing from '../components/GoalRing';
import WeeklyChart from '../components/WeeklyChart';
import ConnectBanner from '../components/ConnectBanner';
import { useHealthData } from '../hooks/useHealthData';
import { logout } from '../api/healthApi';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase';
import { ref, get } from 'firebase/database';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
const ALERT_COOLDOWN_MS = 5 * 60 * 1000;

export default function Dashboard() {
  const [params] = useSearchParams();
  const { health, weekly, connected, loading, syncing, error, lastSync, backendOnline, refresh, setConnected, refetch } = useHealthData();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [patientPhone, setPatientPhone] = useState('');
  const [smsSending, setSmsSending] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const previousHealthRef = useRef(null);
  const lastAlertSentRef = useRef(0);

  useEffect(() => {
    if (params.get('connected') === 'true') { setConnected(true); refetch(); }
  }, [params]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    get(ref(db, `users/${currentUser.uid}`)).then((snap) => {
      if (snap.exists()) setPatientPhone(snap.val().phone || '');
    }).catch(() => {});
  }, [currentUser?.uid]);

  useEffect(() => {
    const hr = typeof health.heartRate === 'number' ? health.heartRate : null;
    const o2 = typeof health.oxygen === 'number' ? health.oxygen : null;
    const prev = previousHealthRef.current;
    previousHealthRef.current = { heartRate: hr, oxygen: o2 };
    if (!prev || !patientPhone) return;
    const now = Date.now();
    if (now - lastAlertSentRef.current < ALERT_COOLDOWN_MS) return;
    const hrDrop = hr != null && (hr < 50 || (prev.heartRate != null && hr < prev.heartRate - 15));
    const o2Drop = o2 != null && (o2 < 90 || (prev.oxygen != null && o2 < prev.oxygen - 5));
    if (!hrDrop && !o2Drop) return;
    const parts = [];
    if (hrDrop) parts.push(`Heart rate ${hr} BPM`);
    if (o2Drop) parts.push(`Blood oxygen ${o2}%`);
    const message = `SwasthAI Alert: Significant change in vitals — ${parts.join('; ')}. Please check your dashboard.`;
    lastAlertSentRef.current = now;
    fetch(`${API_URL}/api/send-vital-alert-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ phone: patientPhone, message }),
    }).catch(() => {});
  }, [health.heartRate, health.oxygen, patientPhone]);

  const handleLogout = async () => { await logout(); setConnected(false); window.location.href = '/'; };

  const handleDemoSms = async () => {
    if (!patientPhone?.trim()) {
      setSmsMessage(t('addPhoneForDemo'));
      return;
    }
    setSmsMessage('');
    setSmsSending(true);
    try {
      const res = await fetch(`${API_URL}/api/send-vital-alert-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone: patientPhone.trim(), demo: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setSmsMessage(t('demoSmSSent'));
    } catch (e) {
      setSmsMessage(e.message || t('addPhoneForDemo'));
    } finally {
      setSmsSending(false);
    }
  };

  // Sleep display — handle both string and object formats
  const sleepObj = typeof health.sleep === 'object' ? health.sleep : { label: health.sleep || '7h 20m', quality: 'Good' };
  const sleepPct = sleepObj.hours != null
    ? Math.min(Math.round(((sleepObj.hours * 60 + (sleepObj.minutes || 0)) / 480) * 100), 100)
    : 92;

  const goalPct = Math.min(Math.round(
    ((health.steps || 0) / (health.stepsGoal || 10000)) * 35 +
    ((health.calories || 0) / (health.caloriesGoal || 500)) * 25 +
    ((health.oxygen || 0) / 100) * 20 +
    (sleepPct / 100) * 20
  ), 100);

  const goals = [
    { name: 'Steps', value: `${(health.steps || 0).toLocaleString()} / ${(health.stepsGoal || 10000).toLocaleString()}`, color: '#2D9CDB' },
    { name: 'Heart', value: `${health.heartRate || '--'} BPM`, color: '#EB5757' },
    { name: 'Oxygen', value: `${health.oxygen || '--'}%`, color: '#27AE60' },
    { name: 'Calories', value: `${health.calories || 0} / ${health.caloriesGoal || 500} kcal`, color: '#F2994A' },
    { name: 'Sleep', value: sleepObj.label || '7h 20m', color: '#9B51E0' },
  ];

  return (
    <div style={styles.page}>
      {/* Soft blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.blob3} />

      <div style={styles.wrap}>

        {/* ── HEADER ── */}
        <header style={styles.header}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              <span style={{ fontSize: 26 }}>🌿</span>
            </div>
            <div>
              <div style={styles.logoTitle}>{t('landingTitle')}</div>
              <div style={styles.logoSub}>{t('vitalsPersonalDashboard')}</div>
            </div>
          </div>

          <div style={styles.headerRight}>
            <div style={{
              ...styles.pill,
              background: backendOnline ? connected ? '#F0FFF6' : '#EBF8FF' : '#FFF5F5',
              border: `1.5px solid ${backendOnline ? connected ? '#9AE6B4' : '#90CDF4' : '#FEB2B2'}`,
              color: backendOnline ? connected ? '#276749' : '#2B6CB0' : '#C53030'
            }}>
              <span style={{
                ...styles.dot,
                background: backendOnline ? connected ? '#48BB78' : '#4299E1' : '#FC8181',
                animation: backendOnline ? 'pulse 2s infinite' : 'none'
              }} />
              {backendOnline ? connected ? `🟢 ${t('liveData')}` : `🔵 ${t('demoMode')}` : `🔴 ${t('backendOffline')}`}
            </div>
            <button style={{ ...styles.syncBtn, opacity: syncing ? 0.7 : 1 }} onClick={refresh} disabled={syncing}>
              <span style={{ display: 'inline-block', animation: syncing ? 'spin 0.8s linear infinite' : 'none' }}>↻</span>
              {syncing ? ` ${t('syncing')}` : ` ${t('sync')}`}
            </button>
          </div>
        </header>

        <div style={styles.dateStrip}>
          <div style={styles.dateLeft}>
            <span style={styles.dateEmoji}>📅</span>
            <strong style={{ color: '#2D3748' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </strong>
          </div>
          <div style={styles.syncTime}>
            {t('lastSync')} <span style={{ color: '#2D9CDB', fontWeight: 700 }}>
              {lastSync.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* ── BACKEND OFFLINE WARNING ── */}
        {!backendOnline && (
          <div style={styles.warnBox}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <strong>{t('backendNotRunning')}</strong> {t('showingDemoData')}
              <br />
              {t('backendNotRunningDesc')}
            </div>
          </div>
        )}

        {error && (
          <div style={styles.errorBox}>⚠️ {error} {t('showingDemoData')}</div>
        )}

        {/* ── CONNECT BANNER ── */}
        <ConnectBanner connected={connected} onLogout={handleLogout} />

        {/* ── LOADING BAR ── */}
        {loading && (
          <div style={styles.loadTrack}>
            <div style={styles.loadFill} />
          </div>
        )}

        {/* ── METRIC CARDS ── */}
        <div style={styles.grid}>
          <MetricCard delay={0}
            type="steps" icon="👣" label={t('stepsToday')}
            value={(health.steps || 0).toLocaleString()}
            unit={`of ${(health.stepsGoal || 10000).toLocaleString()} goal`}
            trend="vs yesterday" trendDir="up"
            progress={((health.steps || 0) / (health.stepsGoal || 10000)) * 100}
          />
          <MetricCard delay={80}
            type="heart" icon="❤️" label={t('heartRate')}
            value={health.heartRate || '--'}
            unit={`BPM — ${health.heartRateStatus || 'Normal'}`}
            trend="Resting zone" trendDir="neutral"
            progress={((health.heartRate || 0) / 120) * 100}
          />
          <MetricCard delay={160}
            type="oxygen" icon="🩸" label={t('bloodOxygen')}
            value={health.oxygen || '--'}
            unit={`% — ${health.oxygenStatus || 'Excellent'}`}
            trend="Optimal range" trendDir="up"
            progress={health.oxygen || 0}
          />
          <MetricCard delay={240}
            type="calories" icon="🔥" label={t('caloriesBurned')}
            value={health.calories || 0}
            unit={`kcal of ${health.caloriesGoal || 500} goal`}
            trend="On track" trendDir="up"
            progress={((health.calories || 0) / (health.caloriesGoal || 500)) * 100}
          />

          <MetricCard delay={400}
            type="distance" icon="📍" label={t('distance')}
            value={health.distance || 0}
            unit="km walked today"
            trend="vs daily avg" trendDir="up"
            progress={((health.distance || 0) / 10) * 100}
          />
        </div>

        {/* ── VITAL ALERTS (SMS) ── */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <div style={styles.cardTitle}>📱 {t('vitalAlerts')}</div>
              <div style={styles.cardSub}>{t('vitalAlertsDesc')}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={handleDemoSms}
              disabled={smsSending}
              style={{
                ...styles.syncBtn,
                opacity: smsSending ? 0.7 : 1,
                background: 'linear-gradient(135deg,#10b981,#34d399)',
                boxShadow: '0 3px 12px rgba(16,185,129,0.3)',
              }}
            >
              {smsSending ? t('sending') : t('demoSms')}
            </button>
            {smsMessage && (
              <span style={{ fontSize: 13, color: smsMessage === t('demoSmSSent') ? '#276749' : '#C53030', fontWeight: 600 }}>
                {smsMessage}
              </span>
            )}
          </div>
          {!currentUser && (
            <p style={{ marginTop: 10, fontSize: 12, color: '#718096' }}>{t('loginForAlerts')}</p>
          )}
          {currentUser && !patientPhone && (
            <p style={{ marginTop: 10, fontSize: 12, color: '#718096' }}>{t('addPhoneInProfile')}</p>
          )}
        </div>

        {/* ── BOTTOM ROW ── */}
        <div style={styles.bottomRow}>

          {/* Weekly Steps Chart */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <div style={styles.cardTitle}>{t('weeklySteps')}</div>
                <div style={styles.cardSub}>{t('your7DayActivity')}</div>
              </div>
              <span style={styles.badge}>{t('last7Days')}</span>
            </div>
            <WeeklyChart data={weekly} />
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <div style={styles.cardTitle}>{t('dailyGoals')}</div>
                <div style={styles.cardSub}>{t('todaysProgress')}</div>
              </div>
              <span style={{ ...styles.badge, background: '#EBF8FF', color: '#2D9CDB', borderColor: '#90CDF4' }}>
                {goalPct}% {t('done')}
              </span>
            </div>
            <GoalRing percentage={goalPct} goals={goals} />
          </div>

        </div>



      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Lato:wght@300;400;700&display=swap');
        @keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.85)} }
        @keyframes loadB { 0%{width:0%} 70%{width:85%} 100%{width:100%} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing:border-box; margin:0; padding:0; }
        body { background:#F7FAFC; }
        code { font-family:monospace; }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg,#F0F9FF 0%,#FAFFFE 40%,#FFF5F0 100%)',
    color: '#2D3748', fontFamily: "'Lato',sans-serif",
    position: 'relative', overflowX: 'hidden'
  },
  blob1: {
    position: 'fixed', top: -100, left: -100, width: 350, height: 350,
    background: 'radial-gradient(circle,rgba(144,205,244,0.25) 0%,transparent 70%)',
    borderRadius: '50%', pointerEvents: 'none', zIndex: 0
  },
  blob2: {
    position: 'fixed', bottom: -80, right: -80, width: 300, height: 300,
    background: 'radial-gradient(circle,rgba(154,230,180,0.2) 0%,transparent 70%)',
    borderRadius: '50%', pointerEvents: 'none', zIndex: 0
  },
  blob3: {
    position: 'fixed', top: '40%', right: '10%', width: 200, height: 200,
    background: 'radial-gradient(circle,rgba(251,211,141,0.18) 0%,transparent 70%)',
    borderRadius: '50%', pointerEvents: 'none', zIndex: 0
  },
  wrap: { position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '32px 24px' },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 24, flexWrap: 'wrap', gap: 16,
    background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
    borderRadius: 20, padding: '16px 24px',
    border: '1px solid rgba(255,255,255,0.9)',
    boxShadow: '0 2px 20px rgba(0,0,0,0.06)'
  },
  logo: { display: 'flex', alignItems: 'center', gap: 14 },
  logoIcon: {
    width: 50, height: 50,
    background: 'linear-gradient(135deg,#C6F6D5,#BEE3F8)',
    borderRadius: 16, display: 'flex', alignItems: 'center',
    justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
  },
  logoTitle: {
    fontFamily: "'Nunito',sans-serif", fontSize: 22,
    fontWeight: 900, color: '#2D9CDB', letterSpacing: -0.5
  },
  logoSub: { fontSize: 12, color: '#9BABB8', fontWeight: 600 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  pill: {
    display: 'flex', alignItems: 'center', gap: 7,
    borderRadius: 999, padding: '7px 16px',
    fontSize: 13, fontWeight: 700, fontFamily: "'Nunito',sans-serif"
  },
  dot: { width: 8, height: 8, borderRadius: '50%' },
  syncBtn: {
    background: 'linear-gradient(135deg,#2D9CDB,#56CCF2)',
    border: 'none', color: '#fff',
    padding: '8px 20px', borderRadius: 10,
    cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
    fontSize: 14, fontWeight: 700,
    boxShadow: '0 3px 12px rgba(45,156,219,0.3)'
  },
  dateStrip: {
    background: 'rgba(255,255,255,0.8)', borderRadius: 14,
    padding: '12px 20px', marginBottom: 20,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: 10,
    border: '1px solid rgba(226,232,240,0.8)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
  },
  dateLeft: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600, color: '#4A5568' },
  dateEmoji: { fontSize: 18 },
  syncTime: { fontSize: 13, color: '#9BABB8', fontWeight: 600 },
  warnBox: {
    background: '#FFFAF0', border: '1.5px solid #FBD38D',
    borderRadius: 12, padding: '14px 18px',
    display: 'flex', alignItems: 'flex-start', gap: 12,
    fontSize: 13, color: '#744210', lineHeight: 1.7, marginBottom: 16
  },
  errorBox: {
    background: '#FFF5F5', border: '1.5px solid #FEB2B2',
    borderRadius: 10, padding: '10px 18px',
    fontSize: 13, color: '#C53030', marginBottom: 16
  },
  inlineCode: {
    background: '#EDF2F7', padding: '2px 8px',
    borderRadius: 6, fontSize: 12, color: '#2D9CDB', fontFamily: 'monospace'
  },
  loadTrack: { height: 4, background: '#BEE3F8', borderRadius: 99, overflow: 'hidden', marginBottom: 16 },
  loadFill: { height: '100%', background: 'linear-gradient(90deg,#2D9CDB,#56CCF2)', animation: 'loadB 1.5s ease forwards' },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
    gap: 18, marginBottom: 24
  },
  bottomRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 },
  card: {
    background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)',
    border: '1px solid rgba(226,232,240,0.8)',
    borderRadius: 20, padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    marginBottom: 20
  },
  cardHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  cardTitle: { fontFamily: "'Nunito',sans-serif", fontSize: 16, fontWeight: 800, color: '#2D3748' },
  cardSub: { fontSize: 12, color: '#9BABB8', fontWeight: 600, marginTop: 2 },
  badge: {
    fontSize: 11, fontWeight: 700,
    background: '#F0FFF6', color: '#276749',
    border: '1.5px solid #9AE6B4',
    padding: '4px 12px', borderRadius: 999,
    fontFamily: "'Nunito',sans-serif"
  },
  // Sleep detail
  sleepRow: { display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' },
  sleepMain: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 100 },
  sleepIcon: { fontSize: 36 },
  sleepTime: {
    fontFamily: "'Nunito',sans-serif", fontSize: 32,
    fontWeight: 900, color: '#9B51E0', lineHeight: 1
  },
  sleepLabel: { fontSize: 11, color: '#9BABB8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 },
  sleepStages: { flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 200 },
  stageItem: {},
  stageTop: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 },
  stageName: { fontSize: 12, color: '#4A5568', fontWeight: 600, flex: 1 },
  stagePct: { fontSize: 12, fontWeight: 800, fontFamily: "'Nunito',sans-serif" },
  stageTrack: { height: 5, background: '#EDF2F7', borderRadius: 99, overflow: 'hidden' },
  stageFill: { height: '100%', borderRadius: 99, transition: 'width 1.2s ease' },
  sleepTips: { minWidth: 180 },
  tipsTitle: { fontSize: 13, fontWeight: 800, color: '#2D3748', marginBottom: 10, fontFamily: "'Nunito',sans-serif" },
  tipRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 },
  tipText: { fontSize: 12, fontWeight: 500 },
  sleepBarLabel: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  sleepBarTrack: { height: 8, background: '#EDF2F7', borderRadius: 99, overflow: 'hidden' },
  sleepBarFill: { height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#9B51E0,#BB6BD9)', transition: 'width 1.3s ease' }
};
