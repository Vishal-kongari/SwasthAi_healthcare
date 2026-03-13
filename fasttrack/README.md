# ⌚ FastTrack Health Dashboard
### React.js Frontend + Node.js Backend + Google Fit API

---

## 📁 Project Structure

```
fasttrack/
├── backend/
│   ├── server.js          ← Express server + Google Fit API
│   ├── package.json
│   └── .env               ← Your Google credentials go here
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── api/
    │   │   └── healthApi.js      ← All API calls
    │   ├── components/
    │   │   ├── MetricCard.jsx    ← Steps, Heart, SpO2 cards
    │   │   ├── GoalRing.jsx      ← Circular progress ring
    │   │   ├── WeeklyChart.jsx   ← Bar chart (Recharts)
    │   │   ├── ActivityLog.jsx   ← Daily activity timeline
    │   │   └── ConnectBanner.jsx ← Google Fit connect button
    │   ├── hooks/
    │   │   └── useHealthData.js  ← Custom hook for data fetching
    │   ├── pages/
    │   │   └── Dashboard.jsx     ← Main dashboard page
    │   ├── App.js
    │   └── index.js
    ├── package.json
    └── .env
```

---

## 🚀 Setup Instructions

### STEP 1 — Get Google Credentials

1. Go to https://console.cloud.google.com
2. Create a new project: **FastTrack Dashboard**
3. Go to **APIs & Services** → **Library** → Search **Fitness API** → Enable
4. Go to **APIs & Services** → **OAuth consent screen**
   - Choose **External** → Create
   - App name: FastTrack Dashboard
   - Add your Gmail as test user
5. Go to **APIs & Services** → **Credentials**
   - Click **+ CREATE CREDENTIALS** → **OAuth client ID**
   - Application type: **Web application**
   - Authorised redirect URIs: `http://localhost:5000/auth/callback`
   - Click **CREATE** → Copy Client ID and Client Secret

### STEP 2 — Configure Backend

Edit `backend/.env`:
```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/callback
FRONTEND_URL=http://localhost:3000
SESSION_SECRET=any-random-string-here
PORT=5000
```

### STEP 3 — Install & Run Backend

```bash
cd backend
npm install
npm run dev
```
Backend runs at: http://localhost:5000

### STEP 4 — Install & Run Frontend

```bash
cd frontend
npm install
npm start
```
Frontend runs at: http://localhost:3000

### STEP 5 — Connect Your FastTrack Watch

1. Open **Titan Smart** app on your phone
2. Go to **Settings** → **Connected Apps** → **Google Fit** → Turn ON
3. Open http://localhost:3000 in browser
4. Click **"Connect Google Fit"** button
5. Sign in with your Google account
6. Allow all fitness permissions
7. ✅ Your real watch data now shows on the dashboard!

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /auth/url | Get Google OAuth login URL |
| GET | /auth/callback | OAuth redirect handler |
| GET | /auth/status | Check if connected |
| POST | /auth/logout | Disconnect |
| GET | /api/health | All metrics (steps, HR, SpO2, calories) |
| GET | /api/steps | Today's step count |
| GET | /api/heartrate | Current heart rate |
| GET | /api/oxygen | Blood oxygen % |
| GET | /api/calories | Calories burned |
| GET | /api/weekly | Last 7 days step data |

---

## 🛠️ Tech Stack

**Frontend**
- React.js 18
- React Router v6
- Recharts (bar charts)
- Axios (HTTP requests)
- Custom hooks pattern

**Backend**
- Node.js + Express
- Google APIs (googleapis package)
- OAuth 2.0 (express-session)
- CORS enabled

---

## ⚠️ Troubleshooting

| Problem | Fix |
|---------|-----|
| "Not authenticated" | Click Connect Google Fit and sign in |
| "redirect_uri mismatch" | Add `http://localhost:5000/auth/callback` in Google Console |
| Empty data / zeros | Sync Titan Smart app to Google Fit on phone first |
| CORS error | Make sure backend is running on port 5000 |
| "Access blocked" | Add your Gmail as test user in OAuth consent screen |
