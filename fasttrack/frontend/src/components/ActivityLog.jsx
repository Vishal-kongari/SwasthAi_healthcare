// src/components/ActivityLog.jsx
import React from 'react';

const ACTIVITIES = [
  { icon: '🚶', bg: 'rgba(0,210,255,0.1)', name: 'Morning Walk', time: '7:30 AM — 25 min', val: '2,100', unit: 'steps', color: '#00d2ff' },
  { icon: '❤️', bg: 'rgba(255,77,109,0.1)', name: 'Heart Rate Check', time: '10:15 AM', val: '68', unit: 'BPM', color: '#ff4d6d' },
  { icon: '🩸', bg: 'rgba(168,255,120,0.1)', name: 'SpO2 Reading', time: '12:00 PM', val: '98', unit: '%', color: '#a8ff78' },
  { icon: '🏃', bg: 'rgba(249,199,79,0.1)', name: 'Afternoon Jog', time: '5:00 PM — 40 min', val: '4,100', unit: 'steps', color: '#f9c74f' },
  { icon: '🌙', bg: 'rgba(192,132,252,0.1)', name: 'Sleep Tracking', time: '10:30 PM — 7h 20m', val: '92', unit: '% quality', color: '#c084fc' },
];

export default function ActivityLog() {
  return (
    <div>
      {ACTIVITIES.map((a, i) => (
        <div key={i} style={{
          ...styles.row,
          borderBottom: i < ACTIVITIES.length - 1
            ? '1px solid rgba(255,255,255,0.04)' : 'none'
        }}>
          <div style={{ ...styles.iconBox, background: a.bg }}>{a.icon}</div>
          <div style={styles.body}>
            <div style={styles.name}>{a.name}</div>
            <div style={styles.time}>{a.time}</div>
          </div>
          <div style={styles.stat}>
            <div style={{ ...styles.statVal, color: a.color }}>{a.val}</div>
            <div style={styles.statUnit}>{a.unit}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  row: {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '14px 0', transition: 'background 0.15s'
  },
  iconBox: {
    width: 42, height: 42, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, flexShrink: 0
  },
  body: { flex: 1 },
  name: { fontSize: 14, fontWeight: 500, color: '#e0eaff', marginBottom: 3 },
  time: { fontSize: 12, color: '#5a7a99' },
  stat: { textAlign: 'right' },
  statVal: { fontFamily: "'Orbitron', monospace", fontSize: 14, fontWeight: 600 },
  statUnit: { fontSize: 11, color: '#5a7a99' }
};
