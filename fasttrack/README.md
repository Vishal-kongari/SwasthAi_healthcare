# ⌚ FastTrack Health Dashboard

![FastTrack Banner](https://via.placeholder.com/1000x200.png?text=FastTrack+Health+Dashboard&bg=1f2937&textColor=ffffff)

> A modern, full-stack web application that integrates seamlessly with the **Google Fit API** to visualize your daily and weekly health metrics.

[![React](https://img.shields.io/badge/React-18-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Google Fit API](https://img.shields.io/badge/Google_Fit-API-orange.svg?style=for-the-badge&logo=google)](https://developers.google.com/fit)
[![Firebase](https://img.shields.io/badge/Firebase-Database-yellow.svg?style=for-the-badge&logo=firebase)](https://firebase.google.com/)

---

## ✨ Key Features

- **👟 Advanced Step Tracking:** Accurately aggregates daily steps from your Android device and smartwatch using Google Fit's data streams.
- **❤️ Heart Rate & 🩸 SpO2:** Monitors your latest heart rate and blood oxygen levels, categorizing them by status (e.g., Normal, Excellent, Low).
- **🔥 Caloric Burn & 📏 Distance:** Calculates and displays your total energy expenditure and distance traveled.
- **😴 Sleep Analysis:** Provides detailed insights into your sleep duration (Hours/Minutes) and sleep quality.
- **📈 Interactive Weekly Charts:** Beautiful historical data visualization using Recharts.
- **🔄 Automated Background Sync:** Continually fetches your health data every 5 minutes and backs it up to Firebase Realtime Database.

---

## 📁 Project Architecture

The repository is structured as a full-stack monorepo:

```text
fasttrack/
├── backend/                  # Node.js + Express API Server
│   ├── server.js             # API routes, Google OAuth, and Fit API aggregations
│   ├── package.json          # Backend dependencies
│   └── .env                  # Server environment variables
│
└── frontend/                 # React.js User Interface
    ├── src/
    │   ├── api/healthApi.js  # Axios HTTP client configuration
    │   ├── components/       # Reusable UI components (MetricCards, Charts, etc.)
    │   ├── hooks/            # Custom React hooks (e.g., useHealthData)
    │   ├── pages/            # Page layouts like the main Dashboard
    │   └── App.js            # Main application router
    ├── package.json          # Frontend dependencies
    └── .env                  # Client environment variables
```

---

## 🚀 Getting Started

Follow these instructions to get a local copy up and running.

### 1️⃣ Google Cloud Setup (OAuth & Fit API)

1. Navigate to the [Google Cloud Console](https://console.cloud.google.com).
2. Create a new project (e.g., **FastTrack Dashboard**).
3. Go to **APIs & Services > Library**, search for the **Fitness API**, and click **Enable**.
4. Go to **OAuth consent screen**:
   - Choose **External** and click **Create**.
   - Fill in your App name and developer email.
   - Add your personal Gmail address as a **Test User**.
5. Go to **Credentials**:
   - Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
   - Choose **Web application**.
   - Add an Authorized Redirect URI: `http://localhost:5000/auth/callback`
   - Click **Create** and save your **Client ID** and **Client Secret**.

### 2️⃣ Backend Configuration & Startup

1. Open the `backend/.env` file and insert your credentials:
   ```env
   GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:5000/auth/callback
   FRONTEND_URL=http://localhost:3000
   SESSION_SECRET=your_secure_random_string
   PORT=5000
   ```
2. Install dependencies and start the server:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   *The backend will start running on `http://localhost:5000`.*

### 3️⃣ Frontend Configuration & Startup

1. Open the `frontend/.env` file and ensure it points to the backend:
   ```env
   REACT_APP_API_URL=http://localhost:5000
   ```
2. Install dependencies and start the React app:
   ```bash
   cd frontend
   npm install
   npm start
   ```
   *The dashboard will open automatically at `http://localhost:3000`.*

---

## ⌚ Connecting Your Smartwatch (FastTrack / Titan)

To see real smartwatch data on the dashboard:
1. Open your **Titan Smart** (or equivalent) app on your mobile device.
2. Navigate to **Settings > Connected Apps > Google Fit** and toggle it **ON**.
3. Open the FastTrack dashboard running on your browser (`http://localhost:3000`).
4. Click the **"Connect Google Fit"** button.
5. Sign in with the Google Account that is linked to your fitness app and grant all requested scopes.
6. 🎉 **Success!** Your dashboard will now display your live health data.

---

## 🔌 Core API Endpoints

The backend exposes severalRESTful endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/auth/url` | Generates the Google OAuth 2.0 consent screen URL |
| `GET` | `/auth/callback` | OAuth redirect handler that generates tokens |
| `GET` | `/api/health` | Fetches aggregate health metrics (Steps, HR, SpO2, Sleep) |
| `GET` | `/api/weekly` | Fetches step count data for the last 7 days |
| `GET` | `/api/demo` | Returns mock data for UI testing without authentication |

---

## 🛠️ Technology Stack

- **Frontend:** React.js 18, React Router v6, Recharts, Lucide Icons, Axios.
- **Backend:** Node.js, Express.js, Googleapis, Express-Session.
- **Database:** Firebase Realtime Database (for background health data syncing).

---

## 💡 Troubleshooting

| Problem | Solution |
|---------|----------|
| **"Not authenticated" error** | You haven't linked your account. Click "Connect Google Fit" on the main dashboard screen. |
| **`redirect_uri_mismatch`** | Ensure `http://localhost:5000/auth/callback` is exactly listed under Authorized Redirect URIs in your Google Cloud Console. |
| **Dashboard shows all Zeros** | Ensure your smartwatch app is actively syncing data into the Google Fit app on your phone. |
| **Google Sign-In says "Access Blocked"** | While the app is unpublished in Google Cloud, you must manually add your email address to the "Test Users" list on the OAuth Consent Screen. |

---
*Built with ❤️ for health & fitness tracking.*
