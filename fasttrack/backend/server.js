// ═══════════════════════════════════════════════════════
//  SwasthAI Health Dashboard — Backend Server
//  Express.js + Google Fit API + OAuth 2.0
//  Includes: Steps, Heart Rate, SpO2, Calories, Sleep
// ═══════════════════════════════════════════════════════

const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const session = require('express-session');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');
require('dotenv').config();

const firebaseConfig = {
  apiKey: "AIzaSyCZ8QlNtGeoGtim2Qy-37MlOMTSRybFRF8",
  authDomain: "swasthai-6e223.firebaseapp.com",
  databaseURL: "https://swasthai-6e223-default-rtdb.firebaseio.com",
  projectId: "swasthai-6e223",
  storageBucket: "swasthai-6e223.firebasestorage.app",
  messagingSenderId: "941282531864",
  appId: "1:941282531864:web:ce7886722a8c572f2e416d",
  measurementId: "G-WJRPSWX72T"
};
const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

// Map to track active sync intervals (userId -> intervalId)
const activeSyncs = new Map();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'swasthai-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// ── OAuth2 ──────────────────────────────────────────────
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/auth/callback'
);

const SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.body.read',
  'https://www.googleapis.com/auth/fitness.location.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
  'https://www.googleapis.com/auth/fitness.oxygen_saturation.read',
  'https://www.googleapis.com/auth/fitness.sleep.read',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
];

// ── Root test route ─────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: '✅ SwasthAI Backend Running',
    port: PORT,
    googleClientIdSet: !!process.env.GOOGLE_CLIENT_ID,
    routes: ['GET /auth/url', 'GET /auth/status', 'GET /api/health', 'GET /api/demo', 'GET /api/weekly']
  });
});

// ── Demo data (no auth) ─────────────────────────────────
app.get('/api/demo', (req, res) => {
  res.json({
    steps: 8432,
    heartRate: 72,
    oxygen: 98,
    calories: 337,
    distance: 5.9,
    sleep: { hours: 7, minutes: 20, label: '7h 20m', quality: 'Good' },
    stepsGoal: 10000,
    caloriesGoal: 500,
    heartRateStatus: 'Normal',
    oxygenStatus: 'Excellent',
    lastUpdated: new Date().toISOString()
  });
});

app.get('/api/demo/weekly', (req, res) => {
  res.json({
    weekly: [
      { date: 'Mon', steps: 6200 },
      { date: 'Tue', steps: 9100 },
      { date: 'Wed', steps: 7800 },
      { date: 'Thu', steps: 11200 },
      { date: 'Fri', steps: 8432 },
      { date: 'Sat', steps: 5600 },
      { date: 'Sun', steps: 3100 }
    ]
  });
});

// ── Helpers ─────────────────────────────────────────────
async function aggregateFitData(auth, typeOrObj, startMs, endMs) {
  const fitness = google.fitness({ version: 'v1', auth });
  const aggregateByItem = typeof typeOrObj === 'string' ? { dataTypeName: typeOrObj } : typeOrObj;
  
  try {
    const res = await fitness.users.dataset.aggregate({
      userId: 'me',
      requestBody: {
        aggregateBy: [aggregateByItem],
        bucketByTime: { durationMillis: endMs - startMs },
        startTimeMillis: startMs,
        endTimeMillis: endMs
      }
    });
    const allPoints = [];
    (res.data.bucket || []).forEach(b =>
      (b.dataset || []).forEach(ds =>
        (ds.point || []).forEach(p => allPoints.push(p))
      )
    );
    return allPoints;
  } catch (e) {
    console.error(`❌ ${aggregateByItem.dataTypeName || 'FitData'}:`, e.message);
    return [];
  }
}

function sumInt(points) {
  return points.reduce((s, p) => s + (p?.value?.[0]?.intVal || 0), 0);
}

function sumFloat(points) {
  return points.reduce((s, p) => s + (p?.value?.[0]?.fpVal || 0), 0);
}

function latestFloat(points) {
  if (!points.length) return 0;
  const sorted = [...points].sort((a, b) =>
    parseInt(b.endTimeNanos || 0) - parseInt(a.endTimeNanos || 0)
  );
  return sorted[0]?.value?.[0]?.fpVal || 0;
}

// ── Sleep helper ────────────────────────────────────────
// Google Fit sleep uses activity segments with type 72 = sleep
async function fetchSleepData(auth) {
  const fitness = google.fitness({ version: 'v1', auth });
  const now = Date.now();
  // Look back 24 hours for last night's sleep
  const yesterday = now - 24 * 60 * 60 * 1000;

  try {
    // Method 1: activity segments (sleep type = 72)
    const res = await fitness.users.sessions.list({
      userId: 'me',
      startTime: new Date(yesterday).toISOString(),
      endTime: new Date(now).toISOString(),
      activityType: 72  // 72 = Sleep
    });

    const sessions = res.data.session || [];
    let totalMs = 0;

    sessions.forEach(s => {
      const start = parseInt(s.startTimeMillis || 0);
      const end = parseInt(s.endTimeMillis || 0);
      if (end > start) totalMs += (end - start);
    });

    if (totalMs > 0) {
      const totalMins = Math.round(totalMs / 60000);
      const hours = Math.floor(totalMins / 60);
      const minutes = totalMins % 60;
      const quality = totalMins >= 480 ? 'Excellent' : totalMins >= 360 ? 'Good' : totalMins >= 240 ? 'Fair' : 'Poor';
      return { hours, minutes, label: `${hours}h ${minutes}m`, quality };
    }

    // Method 2: fallback to sleep.sleep_segment datatype
    const sleepPoints = await aggregateFitData(
      auth,
      'com.google.sleep.segment',
      yesterday,
      now
    );

    let sleepMs2 = 0;
    sleepPoints.forEach(p => {
      // value[0].intVal = sleep stage (1=awake, 2=sleep, 3=out-of-bed, 4=light, 5=deep, 6=REM)
      const stage = p?.value?.[0]?.intVal || 0;
      if (stage >= 2 && stage <= 6) {
        const startNs = parseInt(p.startTimeNanos || 0);
        const endNs = parseInt(p.endTimeNanos || 0);
        sleepMs2 += (endNs - startNs) / 1e6;
      }
    });

    if (sleepMs2 > 0) {
      const totalMins2 = Math.round(sleepMs2 / 60000);
      const hours2 = Math.floor(totalMins2 / 60);
      const minutes2 = totalMins2 % 60;
      const quality2 = totalMins2 >= 480 ? 'Excellent' : totalMins2 >= 360 ? 'Good' : totalMins2 >= 240 ? 'Fair' : 'Poor';
      return { hours: hours2, minutes: minutes2, label: `${hours2}h ${minutes2}m`, quality: quality2 };
    }

    // No sleep data found
    return { hours: 0, minutes: 0, label: 'No data', quality: 'Unknown' };

  } catch (e) {
    console.error('❌ Sleep fetch error:', e.message);
    return { hours: 0, minutes: 0, label: 'No data', quality: 'Unknown' };
  }
}

async function fetchWeeklySteps(auth) {
  const fitness = google.fitness({ version: 'v1', auth });
  
  // Align to start of day, 7 days ago
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endTimeMillis = startOfToday.getTime() + 86400000; // up to end of today
  const startTimeMillis = startOfToday.getTime() - 6 * 86400000; // 7 days total including today

  try {
    const res = await fitness.users.dataset.aggregate({
      userId: 'me',
      requestBody: {
        aggregateBy: [{ 
          dataTypeName: 'com.google.step_count.delta',
          dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps'
        }],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: startTimeMillis,
        endTimeMillis: endTimeMillis
      }
    });
    return (res.data.bucket || []).map(b => {
      const daySteps = (b.dataset || []).reduce((t, ds) =>
        t + (ds.point || []).reduce((s, p) => s + (p?.value?.[0]?.intVal || 0), 0), 0
      );
      return {
        date: new Date(parseInt(b.startTimeMillis)).toLocaleDateString('en-IN', { weekday: 'short' }),
        steps: daySteps
      };
    });
  } catch (e) {
    console.error('❌ Weekly steps:', e.message);
    return [];
  }
}

// ── Auth routes ─────────────────────────────────────────
app.get('/auth/url', (req, res) => {
  const url = oauth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES, prompt: 'consent' });
  res.json({ url });
});

app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'No code' });
  try {
    const { tokens } = await oauth2Client.getToken(code);
    req.session.tokens = tokens;
    startBackgroundSync(tokens);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?connected=true`);
  } catch (err) {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?error=auth_failed`);
  }
});

async function startBackgroundSync(tokens) {
  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/auth/callback'
    );
    auth.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth });
    const userInfo = await oauth2.userinfo.get();
    const userId = userInfo.data.id;
    const userName = userInfo.data.name || 'Unknown';
    const safeUserName = userName.replace(/[\.\#\$\[\]]/g, '_');

    if (activeSyncs.has(userId)) {
      clearInterval(activeSyncs.get(userId));
    }

    const syncToFirebase = async () => {
      try {
        const data = await getHealthData(auth);
        
        // --- TEMPORARY DEBUG LOG ---
        try {
          const fitness = google.fitness({ version: 'v1', auth });
          const now = Date.now();
          const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
          
          const response = await fitness.users.dataset.aggregate({
            userId: 'me',
            requestBody: {
              aggregateBy: [{
                dataTypeName: 'com.google.step_count.delta'
              }],
              bucketByTime: { durationMillis: 60 * 60 * 1000 },
              startTimeMillis: startOfDay.getTime(),
              endTimeMillis: now
            }
          });
          
          let debugStr = '\n=== STEP BUCKETS TODAY ===\n';
          (response.data.bucket || []).forEach(b => {
             let st = 0;
             (b.dataset || []).forEach(ds => (ds.point || []).forEach(p => st += (p?.value?.[0]?.intVal || 0)));
             if (st > 0) {
                const h = new Date(parseInt(b.startTimeMillis)).getHours();
                debugStr += `Hour ${h}: ${st} steps\n`;
             }
          });
          debugStr += '==========================\n';
          console.log(debugStr);
        } catch (e) {
          console.error("Bucket debug error:", e.message);
        }
        // -----------------------------

        const timestamp = Date.now();
        const dbRef = ref(database, `users/${safeUserName}/healthData/${timestamp}`);
        await set(dbRef, data);
        console.log(`✅ Firebase synced for ${safeUserName} at ${new Date(timestamp).toLocaleTimeString()}`);
      } catch (err) {
        console.error(`❌ Firebase sync failed for ${safeUserName}:`, err.message);
      }
    };

    // run once immediately
    syncToFirebase();
    // run every 10 min
    const intervalId = setInterval(syncToFirebase, 5 * 60 * 1000);
    activeSyncs.set(userId, intervalId);
  } catch (err) {
    console.error('❌ Failed to start background sync:', err.message);
  }
}

app.get('/auth/status', (req, res) => res.json({ connected: !!req.session.tokens }));
app.post('/auth/logout', (req, res) => { req.session.destroy(); res.json({ success: true }); });

function requireAuth(req, res, next) {
  if (!req.session.tokens) return res.status(401).json({ error: 'Not authenticated.' });
  oauth2Client.setCredentials(req.session.tokens);
  next();
}

// ── /api/health — ALL metrics including sleep ───────────
async function getHealthData(auth) {
  const now = Date.now();
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const startMs = startOfDay.getTime();

  const [stepsPoints, hrPoints, oxyPoints, calPoints, sleepData, distPoints, rawPoints, mergedPoints] = await Promise.all([
    aggregateFitData(auth, {
      dataTypeName: 'com.google.step_count.delta',
      dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps'
    }, startMs, now),
    aggregateFitData(auth, 'com.google.heart_rate.bpm', startMs, now),
    aggregateFitData(auth, 'com.google.oxygen_saturation', startMs, now),
    aggregateFitData(auth, 'com.google.calories.expended', startMs, now),
    fetchSleepData(auth),
    aggregateFitData(auth, 'com.google.distance.delta', startMs, now),
    aggregateFitData(auth, { dataTypeName: 'com.google.step_count.delta' }, startMs, now),
    aggregateFitData(auth, {
      dataTypeName: 'com.google.step_count.delta',
      dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:merge_step_deltas'
    }, startMs, now)
  ]);

  let steps = sumInt(stepsPoints);
  steps = Math.max(0, steps - 1400); // Temporary manual offset as requested

  const rawSteps = sumInt(rawPoints);
  const mergedSteps = sumInt(mergedPoints);
  console.log(`[DEBUG STEPS] estimated: ${steps}, raw: ${rawSteps}, merged: ${mergedSteps}`);
  
  const heartRate = Math.round(latestFloat(hrPoints));
  let oxygen = Math.round(latestFloat(oxyPoints));
  if (oxygen === 0) oxygen = 97; // Default if no data available
  
  const calF = sumFloat(calPoints);
  const calI = sumInt(calPoints);
  const calories = Math.round(calF > 0 ? calF : calI);
  
  let distanceMeters = sumFloat(distPoints);
  if (distanceMeters === 0) distanceMeters = sumInt(distPoints);
  let distance = parseFloat((distanceMeters / 1000).toFixed(2));
  
  // fallback if no location permission or data
  if (distance === 0 && steps > 0) {
    distance = parseFloat((steps * 0.0007).toFixed(2));
  }

  return {
    steps, heartRate, oxygen, calories, distance,
    sleep: sleepData,
    stepsGoal: 10000,
    caloriesGoal: 500,
    heartRateStatus: heartRate < 60 ? 'Low' : heartRate < 100 ? 'Normal' : 'High',
    oxygenStatus: oxygen >= 95 ? 'Excellent' : oxygen >= 90 ? 'Good' : oxygen > 0 ? 'Low' : 'No Data',
    lastUpdated: new Date().toISOString()
  };
}

app.get('/api/debug-steps', async (req, res) => {
  const fitness = google.fitness({ version: 'v1', auth: oauth2Client });
  const now = Date.now();
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const startMs = startOfDay.getTime();

  try {
    const response = await fitness.users.dataset.aggregate({
      userId: 'me',
      requestBody: {
        aggregateBy: [{
          dataTypeName: 'com.google.step_count.delta'
        }],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: startMs,
        endTimeMillis: now
      }
    });

    const sources = {};
    (response.data.bucket || []).forEach(b => {
      (b.dataset || []).forEach(ds => {
        (ds.point || []).forEach(p => {
            const origin = p?.originDataSourceId || 'unknown';
            const val = p?.value?.[0]?.intVal || 0;
            sources[origin] = (sources[origin] || 0) + val;
        });
      });
    });

    res.json({ sources });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', requireAuth, async (req, res) => {
  try {
    const data = await getHealthData(oauth2Client);
    console.log(`✅ steps:${data.steps} hr:${data.heartRate} o2:${data.oxygen} cal:${data.calories} sleep:${data.sleep.label}`);
    res.json(data);
  } catch (err) {
    console.error('❌ Health error:', err.message);
    res.status(500).json({ error: 'Failed to fetch data', detail: err.message });
  }
});

app.get('/api/weekly', requireAuth, async (req, res) => {
  const data = await fetchWeeklySteps(oauth2Client);
  res.json({ weekly: data });
});

// ── Start ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   SwasthAI Backend Running  ✅           ║
  ║   http://localhost:${PORT}                  ║
  ║   Test: http://localhost:${PORT}/           ║
  ║   Demo: http://localhost:${PORT}/api/demo   ║
  ╚══════════════════════════════════════════╝
  `);
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.includes('your_client')) {
    console.warn('  ⚠️  GOOGLE_CLIENT_ID not set — demo mode only\n');
  }
});
