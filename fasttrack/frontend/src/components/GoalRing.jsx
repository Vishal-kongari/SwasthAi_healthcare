// src/components/GoalRing.jsx — Light Joy Theme
import React, { useEffect, useRef } from 'react';

export default function GoalRing({ percentage, goals }) {
  const ringRef = useRef(null);
  const circ = 2 * Math.PI * 54;

  useEffect(() => {
    if (ringRef.current) {
      const offset = circ - (percentage / 100) * circ;
      setTimeout(() => { ringRef.current.style.strokeDashoffset = offset; }, 500);
    }
  }, [percentage, circ]);

  return (
    <div style={styles.wrap}>
      <div style={styles.ringWrap}>
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
          <defs>
            <linearGradient id="ringG" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2D9CDB" />
              <stop offset="100%" stopColor="#56CCF2" />
            </linearGradient>
          </defs>
          <circle cx="70" cy="70" r="54" fill="none" stroke="#EDF2F7" strokeWidth="11" />
          <circle ref={ringRef} cx="70" cy="70" r="54" fill="none"
            stroke="url(#ringG)" strokeWidth="11" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ}
            style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div style={styles.center}>
          <div style={styles.pct}>{percentage}%</div>
          <div style={styles.sub}>Complete</div>
        </div>
      </div>

      <div style={styles.list}>
        {goals.map((g, i) => (
          <div key={i} style={styles.row}>
            <div style={styles.left}>
              <div style={{ ...styles.dot, background: g.color }} />
              <span style={styles.name}>{g.name}</span>
            </div>
            <span style={styles.val}>{g.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 },
  ringWrap: { position: 'relative', width: 140, height: 140 },
  center: {
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
  },
  pct: { fontFamily: "'Nunito',sans-serif", fontSize: 28, fontWeight: 800, color: '#2D3748' },
  sub: { fontSize: 11, color: '#9BABB8', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 },
  list: { width: '100%', display: 'flex', flexDirection: 'column', gap: 10 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 },
  left: { display: 'flex', alignItems: 'center', gap: 8 },
  dot: { width: 9, height: 9, borderRadius: '50%' },
  name: { color: '#718096', fontWeight: 500 },
  val: { fontWeight: 700, color: '#2D3748', fontFamily: "'Nunito',sans-serif" }
};
