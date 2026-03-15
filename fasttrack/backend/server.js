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
const Tesseract = require('tesseract.js');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const twilio = require('twilio');
require('dotenv').config();

// Prefer backend .venv Python for AI pipeline (has joblib, scikit-learn)
const venvPython = path.join(__dirname, '.venv', 'bin', 'python');
const pythonBin = process.env.PYTHON_PATH || (fs.existsSync(venvPython) ? venvPython : 'python3');

// Setup Multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });


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
const PORT = process.env.PORT || 5001;

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
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5001/auth/callback'
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
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5001/auth/callback'
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
  steps = Math.max(0, steps); // Temporary manual offset as requested

  const rawSteps = sumInt(rawPoints);
  const mergedSteps = sumInt(mergedPoints);
  console.log(`[DEBUG STEPS] estimated: ${steps}, raw: ${rawSteps}, merged: ${mergedSteps}`);

  let heartRate = Math.round(latestFloat(hrPoints));
  if (heartRate === 0) heartRate = 98;
  let oxygen = Math.round(latestFloat(oxyPoints));
  if (oxygen ===  0) oxygen = 97; // Default if no data available


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

// ── Vital alert SMS (Twilio) — demo or real drop alert ─
function toE164(phone) {
  if (!phone || typeof phone !== 'string') return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (phone.startsWith('+')) return phone.length <= 16 ? phone : null;
  return digits.length >= 10 ? `+${digits}` : null;
}

app.post('/api/send-vital-alert-sms', async (req, res) => {
  try {
    const { phone, demo, message } = req.body || {};
    const toNumber = toE164(phone);
    if (!toNumber) {
      return res.status(400).json({ error: 'Valid phone number required (e.g. 10-digit Indian or E.164).' });
    }
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!accountSid || !authToken || !fromNumber) {
      console.error('Twilio env not set: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER');
      return res.status(503).json({ error: 'SMS service is not configured.' });
    }
    const client = twilio(accountSid, authToken);
    const body = demo
      ? 'SwasthAI Demo: This is a test vital alert. In production, you\'d receive this when your vitals show a sudden drop. Stay healthy!'
      : (message || 'SwasthAI: Your vitals show a significant change. Please check your dashboard.');
    await client.messages.create({ body, from: fromNumber, to: toNumber });
    res.json({ success: true, message: 'SMS sent.' });
  } catch (err) {
    console.error('Twilio SMS error:', err.message);
    res.status(500).json({ error: 'Failed to send SMS.', detail: err.message });
  }
});

// ── Run ML pipeline with extracted/manual data (shared) ─
function runMlPipeline(extractedData) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonBin, [
      `${__dirname}/ai_diagnosis/run_pipeline.py`,
      JSON.stringify(extractedData)
    ]);
    let outputData = '';
    let errorData = '';
    pythonProcess.stdout.on('data', (data) => { outputData += data.toString(); });
    pythonProcess.stderr.on('data', (data) => { errorData += data.toString(); });
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('[AI Diagnosis] Python stderr:', errorData);
        return reject(new Error(errorData || 'ML pipeline failed'));
      }
      try {
        resolve(JSON.parse(outputData));
      } catch (e) {
        reject(new Error('Invalid output from ML pipeline'));
      }
    });
  });
}

// ── AI Diagnosis: manual entry (same 9 attributes in canonical order) ─
app.post('/api/analyze-manual', async (req, res) => {
  try {
    const body = req.body || {};
    const extractedData = {
      age: Number(body.age) || OCR_DEFAULTS.age,
      sex: Number(body.sex) in { 0: 1, 1: 1 } ? Number(body.sex) : OCR_DEFAULTS.sex,
      bmi: Number(body.bmi) || OCR_DEFAULTS.bmi,
      bloodPressure: Number(body.bloodPressure) || Number(body.bp) || OCR_DEFAULTS.bloodPressure,
      cholesterol: Number(body.cholesterol) || OCR_DEFAULTS.cholesterol,
      glucose: Number(body.glucose) || OCR_DEFAULTS.glucose,
      heartRate: Number(body.heartRate) || OCR_DEFAULTS.heartRate,
      smoking: Number(body.smoking) in { 0: 1, 1: 1 } ? Number(body.smoking) : OCR_DEFAULTS.smoking,
      liverEnzymeLevel: Number(body.liverEnzymeLevel) || OCR_DEFAULTS.liverEnzymeLevel,
    };
    console.log('[AI Diagnosis] Manual input (canonical order):', extractedData);
    const predictions = await runMlPipeline(extractedData);
    const finalReport = {
      parsedData: extractedData,
      predictions,
      timestamp: new Date().toISOString(),
      source: 'manual'
    };
    res.json(finalReport);
  } catch (error) {
    console.error('❌ AI Diagnosis manual error:', error.message);
    res.status(500).json({ error: 'Analysis failed', detail: error.message });
  }
});

// ── AI Diagnosis OCR Pipeline ───────────────────────────
app.post('/api/analyze-report', upload.single('report'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    console.log(`[AI Diagnosis] Received image buffer of size: ${req.file.size}`);

    // Run Tesseract OCR on the image buffer
    const ocrResult = await Tesseract.recognize(req.file.buffer, 'eng');
    const text = ocrResult.data.text;

    console.log('[AI Diagnosis] OCR Extraction complete. Extracted text sample:', text.substring(0, 200));

    // Collect all details from OCR and map to model attributes in canonical order
    const extractedData = extractAllFromOcr(text);
    console.log('[AI Diagnosis] Mapped to model attributes (canonical order):', extractedData);

    const predictions = await runMlPipeline(extractedData);
    console.log('[AI Diagnosis] Final predictions:', JSON.stringify(predictions, null, 2));
    const finalReport = {
      parsedData: extractedData,
      predictions,
      timestamp: new Date().toISOString(),
      source: 'ocr'
    };
    res.json(finalReport);

  } catch (error) {
    console.error('❌ AI Diagnosis error:', error.message);
    res.status(500).json({ error: 'Analysis failed', detail: error.message });
  }
});

// ── AI Symptom Analyser (Gemini) ─────────────────────────────────────
app.post('/api/analyze-symptoms', async (req, res) => {
  try {
    const { symptoms } = req.body || {};
    const text = (typeof symptoms === 'string' ? symptoms : '').trim();
    if (!text) {
      return res.status(400).json({ error: 'Please provide symptoms to analyze.' });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not set');
      return res.status(500).json({ error: 'Symptom analysis is not configured.' });
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `You are a medical symptom analyst. A patient described these symptoms:

"${text}"

Reply with ONLY plain text. Do NOT use markdown: no asterisks, no hashtags, no bold/italic symbols.

Structure your reply in two parts separated by exactly this line (on its own line):
---EXPLAINABLE---

PART 1 (before ---EXPLAINABLE---):
The very first line of Part 1 MUST be exactly one of these (choose based on severity of the described symptoms):
PRIORITY: EMERGENCY   — life-threatening or need emergency care now (e.g. chest pain, severe bleeding, stroke signs, difficulty breathing, severe injury).
PRIORITY: URGENT      — should see a doctor soon, within days (e.g. high fever, persistent pain, worsening condition, infection concerns).
PRIORITY: ROUTINE     — can wait for routine or scheduled care (e.g. mild cold, minor aches, stable mild symptoms).

After that priority line, add a blank line, then give a short structured analysis with these section titles on their own lines:
Possible conditions: (2-4 brief possibilities)
When to see a doctor: (one line: immediately / soon / routine, and why)
Self-care tips: (1-3 short tips)

Keep Part 1 under 250 words. Use only the section titles above; no extra formatting.

PART 2 (after ---EXPLAINABLE---): In 2-4 clear sentences, explain why you gave this specific output for these specific symptoms. Describe which symptoms led to which conclusions. This is for transparency so the user understands the reasoning.`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    if (!response || !response.text) {
      return res.status(500).json({ error: 'No response from AI.' });
    }
    const raw = response.text().trim();
    const stripMarkdown = (s) => (s || '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}\s?/g, '').replace(/__/g, '').replace(/_/g, '').trim();
    const parts = raw.split(/\s*---EXPLAINABLE---\s*/);
    let analysisText = stripMarkdown(parts[0] || raw);
    const priorityMatch = analysisText.match(/PRIORITY:\s*(EMERGENCY|URGENT|ROUTINE)/i);
    const priority = priorityMatch ? priorityMatch[1].toLowerCase() : 'routine';
    analysisText = analysisText.replace(/PRIORITY:\s*(EMERGENCY|URGENT|ROUTINE)\s*/i, '').replace(/^\s*\n+/, '').trim();
    const explanation = parts[1] ? stripMarkdown(parts[1]) : '';
    res.json({ analysis: analysisText, explanation, priority });
  } catch (error) {
    console.error('❌ Symptom analysis error:', error.message);
    res.status(500).json({ error: 'Analysis failed', detail: error.message });
  }
});

function extractValue(regex, text) {
  const match = text.match(regex);
  return match && match[1] ? parseFloat(match[1]) : null;
}

// Canonical 9 attributes in model order: Age, Sex, BMI, BloodPressure, Cholesterol, Glucose, HeartRate, Smoking, LiverEnzymeLevel
const CANONICAL_ATTRS = ['age', 'sex', 'bmi', 'bloodPressure', 'cholesterol', 'glucose', 'heartRate', 'smoking', 'liverEnzymeLevel'];
const OCR_DEFAULTS = { age: 40, sex: 0, bmi: 25, bloodPressure: 120, cholesterol: 200, glucose: 100, heartRate: 72, smoking: 0, liverEnzymeLevel: 40 };

// Multiple regex patterns per attribute (various ways lab reports write values). First match wins.
const OCR_PATTERNS = {
  age: [
    /\bage\s*[:\-=\s]+\s*(\d+)/i,
    /\b(?:yrs?|years?)\s*[:\-=\s]+\s*(\d+)/i,
    /\b(\d+)\s*years?\s*old/i,
    /\bage\s*(\d+)/i,
  ],
  sex: [
    /\bsex\s*[:\-=\s]+\s*([01mfn])/i,
    /\bgender\s*[:\-=\s]+\s*(\w+)/i,
    /\bmale\b/i,  // presence -> 1
    /\bfemale\b/i, // presence -> 0 (checked after male so female wins if both)
  ],
  bmi: [
    /\bbmi\s*[:\-=\s]+\s*(\d+\.?\d*)/i,
    /\bbody\s*mass\s*(?:index)?\s*[:\-=\s]+\s*(\d+\.?\d*)/i,
    /\b(\d+\.?\d*)\s*kg\/m/i,
  ],
  bloodPressure: [
    /\bblood\s*pressure\s*[:\-=\s]+\s*(\d+\.?\d*)/i,
    /\bbp\s*[:\-=\s]+\s*(\d+\.?\d*)/i,
    /\bsystolic\s*[:\-=\s]+\s*(\d+\.?\d*)/i,
    /\b(\d+)\s*\/\s*\d+\s*mmhg/i,
    /\b(\d+)\s*\/\s*\d+\s*mmHg/i,
  ],
  cholesterol: [
    /\bcholesterol\s*[:\-=\s]+\s*(\d+\.?\d*)/i,
    /\btotal\s*cholesterol\s*[:\-=\s]+\s*(\d+\.?\d*)/i,
    /\bchol\s*[:\-=\s]+\s*(\d+\.?\d*)/i,
    /\btc\s*[:\-=\s]+\s*(\d+\.?\d*)/i,
  ],
  glucose: [
    /\bglucose\s*[:\-=\s]+\s*(\d+\.?\d*)/i,
    /\bblood\s*sugar\s*[:\-=\s]+\s*(\d+\.?\d*)/i,
    /\bfasting\s*(?:blood\s*)?glucose\s*[:\-=\s]+\s*(\d+\.?\d*)/i,
    /\bfbg\s*[:\-=\s]+\s*(\d+\.?\d*)/i,
    /\bsugar\s*[:\-=\s]+\s*(\d+\.?\d*)/i,
  ],
  heartRate: [
    /\bheart\s*rate\s*[:\-=\s]+\s*(\d+\.?\d*)/i,
    /\bhr\s*[:\-=\s]+\s*(\d+\.?\d*)/i,
    /\bpulse\s*[:\-=\s]+\s*(\d+\.?\d*)/i,
    /\bbpm\s*[:\-=\s]+\s*(\d+\.?\d*)/i,
    /\b(\d+)\s*bpm\b/i,
  ],
  smoking: [
    /\bsmoking\s*[:\-=\s]+\s*([01yn])/i,
    /\bsmoker\s*[:\-=\s]+\s*([01yn])/i,
    /\btobacco\s*[:\-=\s]+\s*([01yn])/i,
    /\b(?:current|past)\s*smoker/i,  // presence -> 1
    /\bnon[- ]?smoker/i,              // -> 0
  ],
  liverEnzymeLevel: [
    /\bliver\s*enzyme\s*[:\-=\s]+\s*(\d+\.?\d*)/i,
    /\balt\s*[:\-=\s]+\s*(\d+\.?\d*)/i,
    /\bast\s*[:\-=\s]+\s*(\d+\.?\d*)/i,
    /\bsgpt\s*[:\-=\s]+\s*(\d+\.?\d*)/i,
    /\bsgot\s*[:\-=\s]+\s*(\d+\.?\d*)/i,
    /\balanine\s*[:\-=\s]+\s*(\d+\.?\d*)/i,
    /\baspartate\s*[:\-=\s]+\s*(\d+\.?\d*)/i,
  ],
};

function parseOcrSex(match, text) {
  if (match === null) {
    if (/female/i.test(text)) return 0;
    if (/male/i.test(text)) return 1;
    return OCR_DEFAULTS.sex;
  }
  const v = String(match[1] || match[0]).toLowerCase();
  if (v === '1' || v === 'm' || v === 'male' || v === 'y') return 1;
  return 0;
}

function parseOcrSmoking(match, text) {
  if (match === null) {
    if (/\b(?:current|past)\s*smoker|\bsmoker\b/i.test(text) && !/non[- ]?smoker/i.test(text)) return 1;
    return OCR_DEFAULTS.smoking;
  }
  const v = String(match[1] || match[0]).toLowerCase();
  if (v === '1' || v === 'y' || v === 'yes') return 1;
  return 0;
}

/** Collect all details from OCR text and map to model attributes in canonical order. */
function extractAllFromOcr(text) {
  const raw = (text || '').toLowerCase();
  const out = {};

  for (const key of CANONICAL_ATTRS) {
    const patterns = OCR_PATTERNS[key];
    let value = null;
    let matched = null;
    for (const re of patterns) {
      const m = raw.match(re);
      if (!m) continue;
      if (key === 'sex') {
        out[key] = parseOcrSex(m, raw);
        value = 1;
        break;
      }
      if (key === 'smoking') {
        out[key] = parseOcrSmoking(m, raw);
        value = 1;
        break;
      }
      const num = parseFloat(m[1]);
      if (!Number.isNaN(num)) {
        out[key] = key === 'sex' ? (num >= 1 ? 1 : 0) : (key === 'smoking' ? (num >= 1 ? 1 : 0) : num);
        value = 1;
        break;
      }
    }
    if (value === null) out[key] = OCR_DEFAULTS[key];
  }
  return out;
}

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
