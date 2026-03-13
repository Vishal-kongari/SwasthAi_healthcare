// src/components/WeeklyChart.jsx — Light Joy Theme
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: '#fff', border: '1px solid #E2E8F0',
        borderRadius: 12, padding: '8px 14px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: 11, color: '#9BABB8', marginBottom: 3, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#2D9CDB', fontFamily: "'Nunito',sans-serif" }}>
          {payload[0].value.toLocaleString()} steps
        </div>
      </div>
    );
  }
  return null;
};

export default function WeeklyChart({ data = [] }) {
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short' });
  return (
    <div style={{ width: '100%', height: 150 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="28%">
          <XAxis dataKey="date" tick={{ fill: '#9BABB8', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Bar dataKey="steps" radius={[8, 8, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.date === today ? '#2D9CDB' : '#BEE3F8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
