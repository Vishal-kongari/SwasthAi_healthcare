# SwasthAI — Healthcare Platform

A full-stack healthcare application that combines **Google Fit** vitals, **AI-powered diagnosis**, **symptom analysis**, **doctor/hospital workflows**, and **vital alerts via SMS**. Built with React, Node.js, Firebase, and optional Python ML pipelines.

[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_%26_DB-ffca28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![Google Fit](https://img.shields.io/badge/Google_Fit-API-4285f4?style=flat-square&logo=google)](https://developers.google.com/fit)

---

## Table of Contents

- [Features](#-features)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [How to Use](#-how-to-use)
- [API Reference](#-api-reference)
- [Tech Stack](#-tech-stack)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

### For Patients

| Feature | Description |
|--------|-------------|
| **Health Vitals** | Connect **Google Fit** to see steps, heart rate, SpO2, calories, distance, and sleep. Data syncs every 5 minutes and is backed up to Firebase. |
| **Symptom Analyser** | Describe your symptoms in plain text; **Gemini AI** returns a priority (Emergency / Urgent / Routine), possible conditions, when to see a doctor, and self-care tips, plus an explainable reasoning section. |
| **AI Diagnosis** | **Manual entry** or **upload a lab report image** (OCR). Backend runs a Python ML pipeline (diabetes, heart, kidney, lung risk predictions) and returns a structured report with recommended doctors. |
| **Doctor Booking** | Browse doctors by hospital, view profiles, and request appointments. Doctors can accept/decline; patients see status and can view doctor details. |
| **Patient Dashboard** | Single hub: open Vitals, book a doctor, go to AI Diagnostics, view past AI reports (from Firebase), and access Profile. |
| **Vital Alert SMS** | Add your phone in Profile; trigger a **Twilio** SMS (e.g. demo or real alert) so you can receive vital alerts when needed. |
| **Profile** | Update name, phone, weight; view symptom history. Phone is used for vital-alert SMS. |
| **Intelligence Emergency** | Emergency-focused AI assistant (frontend; backend endpoint may need to be added for full functionality). |
| **Multi-language** | Language selector in the navbar for localized UI. |

### For Hospitals

| Feature | Description |
|--------|-------------|
| **Hospital Login / Signup** | Firebase Auth; separate portal for hospitals. |
| **Hospital Dashboard** | Manage doctors: add doctors (name, specialty, email, phone, etc.), view list, edit, and see appointment requests. |

### For Doctors

| Feature | Description |
|--------|-------------|
| **Doctors Login** | Firebase Auth for doctors. |
| **Doctor Dashboard** | View profile, stats, and **appointment requests** from patients. Accept or decline requests; view patient details. |
| **Doctor Booking (patient view)** | Patients see doctors grouped by hospital and can send booking requests. |

### Technical Highlights

- **Google OAuth 2.0** for Fit API (steps, heart rate, SpO2, sleep, etc.).
- **Firebase Realtime Database** for health data sync and report storage.
- **Firebase Authentication** for patients, hospitals, and doctors.
- **Gemini API** for symptom analysis (priority + explainable text).
- **Twilio** for vital-alert SMS.
- **Python ML pipeline** (optional): OCR + risk models for diabetes, heart, kidney, lung (see `backend/ai_diagnosis/`).
- **Medical-themed UI** with hero background and consistent teal/sky palette.

---

## 📁 Project Structure

```
fasttrack/
├── backend/                    # Node.js + Express API
│   ├── server.js               # Routes, OAuth, Fit aggregation, AI endpoints
│   ├── package.json
│   ├── .env                    # See Environment Variables
│   ├── ai_diagnosis/           # Python ML pipeline (OCR + risk models)
│   │   ├── run_pipeline.py     # Entry point; loads joblib models
│   │   └── models/             # diabetes, heart, kidney, lung (add as needed)
│   └── offlineaccess/          # Offline/utility scripts (e.g. vital, details)
│
├── frontend/                   # Create React App
│   ├── public/
│   │   ├── index.html
│   │   ├── hero.jpeg           # Global background image
│   │   └── logo.jpeg
│   ├── src/
│   │   ├── App.js               # Router + Auth + Language providers
│   │   ├── MedicalTheme.css     # Global medical theme + hero background
│   │   ├── assets/              # e.g. hero.jpeg (used by CSS)
│   │   ├── components/          # Navbar, LanguageSelectorModal, etc.
│   │   ├── contexts/            # AuthContext, LanguageContext
│   │   ├── pages/               # Landing, Login, Signup, Dashboards, etc.
│   │   └── firebase.js          # Firebase config
│   ├── package.json
│   └── .env                    # REACT_APP_API_URL
│
├── README.md                   # This file
└── DEPLOYMENT.md               # Step-by-step production deployment
```

---

## 🔧 Prerequisites

- **Node.js** 18+ (backend and frontend)
- **npm** (or yarn)
- **Google Cloud** project with Fitness API and OAuth credentials
- **Firebase** project (Auth + Realtime Database)
- **Twilio** account (for SMS alerts)
- **Google Gemini API key** (for symptom analysis)
- **Python 3** (optional, for AI diagnosis pipeline: `ai_diagnosis/run_pipeline.py` and its `joblib`/scikit-learn models)

---

## 🚀 Quick Start

### 1. Clone and install

```bash
cd SwasthAi_healthcare/fasttrack

# Backend
cd backend
npm install
# Optional: for AI diagnosis OCR + ML
# python3 -m venv .venv && source .venv/bin/activate  # or .venv\Scripts\activate on Windows
# pip install -r ai_diagnosis/requirements.txt  # if you have one

# Frontend (from fasttrack/)
cd ../frontend
npm install
```

### 2. Configure environment

- **Backend:** Copy `.env.example` to `.env` (or create `.env`) and set variables (see [Environment Variables](#-environment-variables)).
- **Frontend:** Create `frontend/.env` with:
  ```env
  REACT_APP_API_URL=http://localhost:5001
  ```

### 3. Google Cloud (OAuth & Fitness API)

1. [Google Cloud Console](https://console.cloud.google.com) → create/select project.
2. **APIs & Services → Library** → enable **Fitness API**.
3. **OAuth consent screen:** External, add app name and test users (your Gmail).
4. **Credentials → Create → OAuth client ID** (Web application):
   - Authorized redirect URI: `http://localhost:5001/auth/callback`
5. Put **Client ID** and **Client Secret** in `backend/.env`.

### 4. Run

```bash
# Terminal 1 — Backend (from fasttrack/backend)
npm run dev
# Backend: http://localhost:5001

# Terminal 2 — Frontend (from fasttrack/frontend)
npm start
# Frontend: http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000). Use **Login** (patient), **Hospital Portal** (hospital), or **Doctors Directory** (doctor) from the landing page.

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default `5001`) |
| `FRONTEND_URL` | Yes* | Frontend origin, e.g. `http://localhost:3000` (CORS + OAuth redirect) |
| `SESSION_SECRET` | Yes* | Random string for session signing |
| `GOOGLE_CLIENT_ID` | Yes for Fit | OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | Yes for Fit | OAuth 2.0 Client Secret |
| `GOOGLE_REDIRECT_URI` | Yes for Fit | e.g. `http://localhost:5001/auth/callback` |
| `GEMINI_API_KEY` | Yes for Symptom Analyser | Google Gemini API key |
| `TWILIO_ACCOUNT_SID` | For SMS | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | For SMS | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | For SMS | Twilio phone (E.164) |
| `PYTHON_PATH` | No | Path to Python for ML pipeline (default: `.venv` or `python3`) |

\* Required for production; some features work in demo mode without Google/Twilio.

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `REACT_APP_API_URL` | Backend base URL, e.g. `http://localhost:5001` |

Firebase is configured in `frontend/src/firebase.js` (and optionally via env if you use `REACT_APP_FIREBASE_*`).

---

## 📖 How to Use

### As a Patient

1. **Sign up / Log in** (Firebase Auth) from the landing page.
2. **Connect Google Fit** (from **Vitals** or **Dashboard**): click “Connect Google Fit”, sign in with Google, grant Fitness scopes. Your steps, heart rate, SpO2, sleep, etc. will sync every 5 minutes and backup to Firebase.
3. **Vitals** (`/vitals`): View today’s metrics and weekly step chart. Use **Demo** if not connected.
4. **Symptom Analyser** (`/symptom-analyser`): Type symptoms → get priority (Emergency/Urgent/Routine), possible conditions, when to see a doctor, self-care tips, and explainable reasoning.
5. **AI Diagnosis** (`/ai-diagnosis`): Either **manual entry** (age, sex, BMI, BP, cholesterol, glucose, heart rate, smoking, liver enzyme) or **upload a lab report image** (OCR). Get risk predictions and recommended doctors (if backend and Python pipeline are set up).
6. **Doctor Booking** (`/booking`): Choose a hospital → see doctors → **Book** → request is sent to the doctor. Check status on the same page or dashboard.
7. **Profile** (`/profile`): Set name, **phone** (for vital alerts), weight; view symptom history.
8. **Vital Alert SMS**: In Profile, add phone and use the “Demo SMS” (or equivalent) from Vitals/Dashboard to test Twilio; in production, alerts can be sent when vitals cross thresholds.

### As a Hospital

1. **Hospital Portal** → **Sign up / Log in** (Firebase).
2. **Hospital Dashboard** (`/hospital/dashboard`): Add doctors (name, specialty, email, phone, etc.), view and edit list, see appointment requests.

### As a Doctor

1. **Doctors Directory** → **Doctors Login** (Firebase).
2. **Doctor Dashboard** (`/doctor/dashboard`): View incoming appointment requests, **Accept** or **Decline**, view patient details.

### Doctors List (Public)

- **Doctors** (`/doctors`): Browse doctors by hospital (no login required for viewing). Login required to book.

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check and route list |
| `GET` | `/auth/url` | Get Google OAuth consent URL |
| `GET` | `/auth/callback` | OAuth callback (redirects to frontend) |
| `GET` | `/auth/status` | Returns `{ connected: boolean }` |
| `POST` | `/auth/logout` | Destroy session |
| `GET` | `/api/demo` | Mock health metrics (no auth) |
| `GET` | `/api/demo/weekly` | Mock weekly steps (no auth) |
| `GET` | `/api/health` | Aggregate health (steps, HR, SpO2, sleep, etc.) — **requires auth** |
| `GET` | `/api/weekly` | Weekly step data — **requires auth** |
| `POST` | `/api/send-vital-alert-sms` | Send SMS (body: `phone`, optional `demo`, `message`) — Twilio |
| `POST` | `/api/analyze-manual` | AI diagnosis from manual JSON (9 attributes) |
| `POST` | `/api/analyze-report` | AI diagnosis from uploaded image (OCR + ML) — `multipart/form-data`, field `report` |
| `POST` | `/api/analyze-symptoms` | Symptom text → Gemini analysis (body: `symptoms`) |

---

## 🛠️ Tech Stack

- **Frontend:** React 18, React Router v6, Axios, Recharts, Lucide Icons, Firebase (Auth + Realtime DB).
- **Backend:** Node.js, Express, Google APIs (OAuth2 + Fitness), express-session, Multer, Tesseract.js (OCR), Twilio, Google Generative AI (Gemini), Firebase Admin/Realtime.
- **AI/ML:** Python 3, joblib, scikit-learn (in `ai_diagnosis/`); Gemini for symptom analysis.
- **Database:** Firebase Realtime Database (health sync, reports, app data).

---

## 🌐 Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for:

- Backend: Render, Railway, Fly.io, etc.
- Frontend: Vercel, Netlify, Firebase Hosting
- Environment variables for production
- Google OAuth redirect URIs and Firebase authorized domains
- CORS and session cookie notes

---

## 💡 Troubleshooting

| Problem | What to check |
|---------|----------------|
| **“Not authenticated” on /api/health** | Connect Google Fit from the app (Vitals or Dashboard); ensure session cookie is sent (same-origin or CORS with credentials). |
| **`redirect_uri_mismatch`** | `GOOGLE_REDIRECT_URI` must exactly match the value in Google Cloud Console (e.g. `http://localhost:5001/auth/callback`). |
| **Vitals all zeros** | Ensure Google Fit is connected and your device/app is syncing data to Google Fit. |
| **Symptom Analyser fails** | Backend must have `GEMINI_API_KEY` set. |
| **AI Diagnosis fails** | Python 3 and `ai_diagnosis/run_pipeline.py` (and models) must be available; optional `PYTHON_PATH` or `.venv`. |
| **SMS not sending** | Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` in backend `.env`. |
| **CORS errors** | `FRONTEND_URL` on backend must match the frontend origin (protocol + host, no trailing slash). |
| **Firebase “unauthorized domain”** | Add your frontend domain in Firebase Console → Authentication → Authorized domains. |

---

*SwasthAI — built for integrated health tracking, AI-assisted triage, and care coordination.*
