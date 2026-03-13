// src/components/MetricCard.jsx — SwasthAI Light Joy Theme
import React, { useEffect, useRef } from 'react';

const colorMap = {
  steps:    { bg: '#EEF9FF', accent: '#2D9CDB', grad: 'linear-gradient(135deg,#2D9CDB,#56CCF2)', shadow: 'rgba(45,156,219,0.18)' },
  heart:    { bg: '#FFF0F3', accent: '#EB5757', grad: 'linear-gradient(135deg,#EB5757,#F2994A)', shadow: 'rgba(235,87,87,0.18)' },
  oxygen:   { bg: '#F0FFF6', accent: '#27AE60', grad: 'linear-gradient(135deg,#27AE60,#6FCF97)', shadow: 'rgba(39,174,96,0.18)' },
  calories: { bg: '#FFF8EC', accent: '#F2994A', grad: 'linear-gradient(135deg,#F2994A,#F2C94C)', shadow: 'rgba(242,153,74,0.18)' },
  sleep:    { bg: '#F5F0FF', accent: '#9B51E0', grad: 'linear-gradient(135deg,#9B51E0,#BB6BD9)', shadow: 'rgba(155,81,224,0.18)' },
  distance: { bg: '#EDFBF8', accent: '#219653', grad: 'linear-gradient(135deg,#219653,#27AE60)', shadow: 'rgba(33,150,83,0.18)' },
};

export default function MetricCard({ type, icon, label, value, unit, trend, trendDir, progress, delay = 0 }) {
  const c = colorMap[type] || colorMap.steps;
  const barRef = useRef(null);

  useEffect(() => {
    if (barRef.current) {
      setTimeout(() => {
        barRef.current.style.width = `${Math.min(progress || 0, 100)}%`;
      }, 400 + delay);
    }
  }, [progress, delay]);

  return (
    <div style={{ ...styles.card, background: c.bg, boxShadow: `0 4px 24px ${c.shadow}` }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${c.shadow}`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 24px ${c.shadow}`; }}
    >
      {/* Icon bubble */}
      <div style={{ ...styles.iconBubble, background: c.grad }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>

      <div style={styles.label}>{label}</div>
      <div style={{ ...styles.value, color: c.accent }}>{value}</div>
      <div style={styles.unit}>{unit}</div>

      {trend && (
        <div style={{
          ...styles.trend,
          color: trendDir === 'up' ? '#27AE60' : trendDir === 'down' ? '#EB5757' : '#BDBDBD'
        }}>
          {trendDir === 'up' ? '↑' : trendDir === 'down' ? '↓' : '→'} {trend}
        </div>
      )}

      <div style={{ ...styles.track, background: `${c.accent}18` }}>
        <div ref={barRef} style={{
          ...styles.fill, background: c.grad, width: '0%',
          transition: 'width 1.3s cubic-bezier(0.4,0,0.2,1)'
        }} />
      </div>
    </div>
  );
}

const styles = {
  card: {
    borderRadius: 20, padding: '24px 20px',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
    cursor: 'default', border: '1px solid rgba(0,0,0,0.05)'
  },
  iconBubble: {
    width: 48, height: 48, borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 14, boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
  },
  label: { fontSize: 11, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#9BABB8', marginBottom: 6, fontWeight: 600 },
  value: { fontFamily: "'Nunito', sans-serif", fontSize: 28, fontWeight: 800, lineHeight: 1, marginBottom: 4 },
  unit: { fontSize: 12, color: '#9BABB8', marginBottom: 10 },
  trend: { fontSize: 12, fontWeight: 600, marginBottom: 12 },
  track: { height: 6, borderRadius: 99, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 99 }
};
