// src/api/healthApi.js
// ─────────────────────────────────────────────
// All API calls to the Express backend

import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  withCredentials: true  // Important: sends session cookies
});

// ── Auth ──────────────────────────────────────
export const getAuthUrl = async () => {
  const res = await API.get('/auth/url');
  return res.data.url;
};

export const getAuthStatus = async () => {
  const res = await API.get('/auth/status');
  return res.data.connected;
};

export const logout = async () => {
  await API.post('/auth/logout');
};

// ── Health Data ───────────────────────────────
export const getAllHealth = async () => {
  const res = await API.get('/api/health');
  return res.data;
};

export const getSteps = async () => {
  const res = await API.get('/api/steps');
  return res.data;
};

export const getHeartRate = async () => {
  const res = await API.get('/api/heartrate');
  return res.data;
};

export const getOxygen = async () => {
  const res = await API.get('/api/oxygen');
  return res.data;
};

export const getCalories = async () => {
  const res = await API.get('/api/calories');
  return res.data;
};

export const getWeeklySteps = async () => {
  const res = await API.get('/api/weekly');
  return res.data.weekly;
};
