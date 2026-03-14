// src/hooks/useHealthData.js
import { useState, useEffect, useCallback } from 'react';
import { getAllHealth, getWeeklySteps, getAuthStatus } from '../api/healthApi';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const OFFLINE_DEMO = {
  steps: 8432, heartRate: 72, oxygen: 98, calories: 337, distance: 5.9,
  sleep: { hours: 7, minutes: 20, label: '7h 20m', quality: 'Good' },
  stepsGoal: 10000, caloriesGoal: 500,
  heartRateStatus: 'Normal', oxygenStatus: 'Excellent',
  lastUpdated: new Date().toISOString()
};

const OFFLINE_WEEKLY = [
  { date: 'Mon', steps: 6200 }, { date: 'Tue', steps: 9100 },
  { date: 'Wed', steps: 7800 }, { date: 'Thu', steps: 11200 },
  { date: 'Fri', steps: 8432 }, { date: 'Sat', steps: 5600 },
  { date: 'Sun', steps: 3100 }
];

export function useHealthData() {
  const [health, setHealth]           = useState(OFFLINE_DEMO);
  const [weekly, setWeekly]           = useState(OFFLINE_WEEKLY);
  const [connected, setConnected]     = useState(false);
  const [loading, setLoading]         = useState(true);
  const [syncing, setSyncing]         = useState(false);
  const [error, setError]             = useState(null);
  const [lastSync, setLastSync]       = useState(new Date());
  const [backendOnline, setBackendOnline] = useState(false);

  const fetchDemo = useCallback(async () => {
    try {
      const [dRes, wRes] = await Promise.all([
        axios.get(`${API_URL}/api/demo`),
        axios.get(`${API_URL}/api/demo/weekly`)
      ]);
      setHealth(dRes.data);
      setWeekly(wRes.data.weekly || OFFLINE_WEEKLY);
      setBackendOnline(true);
      setLastSync(new Date());
    } catch {
      setHealth(OFFLINE_DEMO);
      setWeekly(OFFLINE_WEEKLY);
      setBackendOnline(false);
    }
  }, []);

  const fetchReal = useCallback(async (isManual = false) => {
    if (isManual) setSyncing(true);
    setError(null);
    try {
      const [healthData, weeklyData] = await Promise.all([
        getAllHealth(),
        getWeeklySteps()
      ]);
      setHealth(healthData);
      if (weeklyData?.length) setWeekly(weeklyData);
      setLastSync(new Date());
      setBackendOnline(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not fetch data');
      if (err.response?.status === 401) { setConnected(false); await fetchDemo(); }
    } finally { setSyncing(false); }
  }, [fetchDemo]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const isConn = await getAuthStatus();
        setConnected(isConn);
        if (isConn) await fetchReal();
        else await fetchDemo();
      } catch { await fetchDemo(); }
      finally { setLoading(false); }
    };
    init();
  }, []);

  const refresh = useCallback(() => connected ? fetchReal(true) : fetchDemo(), [connected, fetchReal, fetchDemo]);

  useEffect(() => {
    if (!connected) return;
    const iv = setInterval(() => fetchReal(), 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, [connected, fetchReal]);

  return { health, weekly, connected, loading, syncing, error, lastSync, backendOnline, refresh, setConnected, refetch: fetchReal };
}
