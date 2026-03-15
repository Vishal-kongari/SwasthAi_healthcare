# SwasthAI — Deployment Guide (Step-by-Step)

This guide walks you through deploying the **frontend** (React) and **backend** (Node.js + Express) to production. Firebase (Auth + Realtime DB) is already in the cloud; you only need to configure production domains.

---

## Prerequisites

- **Git** — code in a GitHub/GitLab repo (recommended for most hosting platforms).
- **Accounts:** Firebase, Google Cloud (for OAuth + Fit API), Twilio (SMS), and optionally Vercel + Render (or similar).
- **Backend** requires **Node.js 18+**. The AI diagnosis feature uses a **Python 3** subprocess (`ai_diagnosis/run_pipeline.py`) — your backend host must have Python 3 and the required packages (see backend section).

---

## Part 1: Deploy the Backend

### Option A: Render (recommended, free tier)

1. **Push your code** to GitHub (e.g. repo `swasthai`; backend in `SwasthAi_healthcare/fasttrack/backend` or at repo root).

2. Go to [render.com](https://render.com) → **Sign up** → **New** → **Web Service**.

3. **Connect** your GitHub repo.  
   - If backend is in a subfolder: set **Root Directory** to `SwasthAi_healthcare/fasttrack/backend` (or `fasttrack/backend` as per your structure).

4. **Configure the service:**
   - **Name:** `swasthai-api` (or any name).
   - **Runtime:** Node.
   - **Build Command:** `npm install`
   - **Start Command:** `npm start` (runs `node server.js`)
   - **Instance type:** Free (or paid if you need always-on).

5. **Environment variables** (Render → Environment tab):

   | Key | Value (use your production values) |
   |-----|------------------------------------|
   | `NODE_ENV` | `production` |
   | `PORT` | `5001` (Render sets PORT automatically; your code uses it) |
   | `FRONTEND_URL` | `https://your-frontend-domain.vercel.app` (or your real frontend URL) |
   | `SESSION_SECRET` | Generate a long random string (e.g. `openssl rand -hex 32`) |
   | `GOOGLE_CLIENT_ID` | Same as dev or new OAuth client for prod |
   | `GOOGLE_CLIENT_SECRET` | Same as dev or new client secret |
   | `GOOGLE_REDIRECT_URI` | `https://your-backend.onrender.com/auth/callback` |
   | `GEMINI_API_KEY` | Your Gemini API key |
   | `TWILIO_ACCOUNT_SID` | Twilio SID |
   | `TWILIO_AUTH_TOKEN` | Twilio token |
   | `TWILIO_PHONE_NUMBER` | Your Twilio number (E.164) |

6. **Deploy.** Render will build and run the backend. Note the URL, e.g. `https://swasthai-api.onrender.com`.

7. **Python (AI diagnosis):** On Render free tier you can add a **Build Command** that installs Python dependencies, e.g.  
   `npm install && pip install -r requirements.txt`  
   if you add a `requirements.txt` in the backend root for the Python script. If the Python script is optional, the rest of the app will work without it.

### Option B: Railway

1. Go to [railway.app](https://railway.app) → **Start a New Project** → **Deploy from GitHub**.
2. Select repo and set **Root Directory** to `SwasthAi_healthcare/fasttrack/backend` (or your backend path).
3. Add the same **environment variables** as in the table above; set `GOOGLE_REDIRECT_URI` to `https://your-app.railway.app/auth/callback`.
4. Railway assigns a URL; use it as your backend base URL.

### Option C: Fly.io / Heroku / AWS / GCP

- **Fly.io:** Use `fly launch` in the backend folder, set env via `fly secrets set KEY=value` and `GOOGLE_REDIRECT_URI` to your Fly URL.
- **Heroku:** Create app, set root to backend folder, add env vars in Settings → Config Vars.
- **AWS/GCP:** Run Node in EC2, App Engine, or Cloud Run; set env in the service configuration and point `GOOGLE_REDIRECT_URI` to your backend URL.

**Backend URL to use later:** e.g. `https://swasthai-api.onrender.com` (no trailing slash).

---

## Part 2: Deploy the Frontend

### Option A: Vercel (recommended)

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project** → import your GitHub repo.

2. **Configure:**
   - **Root Directory:** set to `SwasthAi_healthcare/fasttrack/frontend` (or `fasttrack/frontend`).
   - **Framework Preset:** Create React App.
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`

3. **Environment variables** (Vercel → Project → Settings → Environment Variables):

   | Key | Value |
   |-----|--------|
   | `REACT_APP_API_URL` | `https://your-backend.onrender.com` (your actual backend URL from Part 1) |

   Optional (if you want to override Firebase config):
   - `REACT_APP_FIREBASE_API_KEY`
   - `REACT_APP_FIREBASE_AUTH_DOMAIN`
   - `REACT_APP_FIREBASE_DATABASE_URL`
   - `REACT_APP_FIREBASE_PROJECT_ID`
   - etc.

4. **Deploy.** Vercel gives you a URL like `https://your-project.vercel.app`.

### Option B: Netlify

1. **New site from Git** → connect repo.
2. **Base directory:** `SwasthAi_healthcare/fasttrack/frontend`.
3. **Build command:** `npm run build`
4. **Publish directory:** `build`
5. Add **Environment variables:** `REACT_APP_API_URL` = your backend URL.
6. Deploy.

### Option C: Firebase Hosting

1. In project root or frontend folder:  
   `npm install -g firebase-tools` → `firebase login` → `firebase init hosting`.
2. Set **public directory** to `build`, and **single-page app** to Yes.
3. Build: `npm run build`
4. Add env before build: e.g. create `.env.production` with `REACT_APP_API_URL=https://your-backend-url`.
5. Deploy: `firebase deploy`

**Frontend URL to use:** e.g. `https://your-project.vercel.app`.

---

## Part 3: Configure Google OAuth for Production

1. Open [Google Cloud Console](https://console.cloud.google.com) → your project → **APIs & Services** → **Credentials**.
2. Edit your **OAuth 2.0 Client ID** (Web application).
3. **Authorized JavaScript origins:** add  
   `https://your-frontend.vercel.app`  
   (and any other production frontend URLs).
4. **Authorized redirect URIs:** add  
   `https://your-backend.onrender.com/auth/callback`  
   (your real backend URL).
5. Save.

---

## Part 4: Configure Firebase for Production

1. Open [Firebase Console](https://console.firebase.google.com) → your project → **Authentication** → **Settings** → **Authorized domains**.
2. Add your production frontend domain, e.g. `your-project.vercel.app` (without `https://`).
3. Save.

---

## Part 5: CORS and Session

- **Backend:** `FRONTEND_URL` must exactly match the origin of your frontend (e.g. `https://your-project.vercel.app`). The server uses this for CORS and OAuth redirects.
- **Session cookies:** If frontend and backend are on different domains (e.g. Vercel vs Render), ensure:
  - `cookie: { secure: true }` in production (HTTPS only).
  - SameSite and CORS with credentials if you use cookie-based session for health API.  
  If you run into cookie issues, consider moving to token-based auth for the health API or hosting frontend and backend under the same parent domain.

---

## Part 6: Verify Deployment

1. Open your **frontend URL** (e.g. `https://your-project.vercel.app`).
2. **Login/Signup** — should use Firebase (works from any authorized domain).
3. **Vitals** — if you use demo mode, it should work without Google login; if you use “Connect Google Fit”, complete OAuth and ensure redirect goes to your production backend URL.
4. **Symptom Analyser** — submit symptoms; backend should call Gemini and return analysis.
5. **Demo SMS** — from Vitals page, click “Demo SMS”; Twilio should send to the number in your profile.
6. **AI Diagnosis** — manual entry or report upload; backend uses Python pipeline if installed.

---

## Checklist Summary

- [ ] Backend deployed and URL noted (e.g. Render/Railway).
- [ ] Backend env vars set: `FRONTEND_URL`, `GOOGLE_REDIRECT_URI`, `SESSION_SECRET`, `GEMINI_API_KEY`, `TWILIO_*`, etc.
- [ ] Frontend deployed and URL noted (e.g. Vercel).
- [ ] Frontend env: `REACT_APP_API_URL` = backend URL.
- [ ] Google OAuth: production redirect URI and JS origins added.
- [ ] Firebase: production domain added to Authorized domains.
- [ ] Test login, vitals, symptom analysis, and SMS on production URLs.

---

## Optional: Custom Domain and Python on Backend

- **Custom domain:** In Vercel/Render, add your domain in the dashboard and update DNS as instructed. Then update `FRONTEND_URL`, Google OAuth origins/redirect, and Firebase authorized domains.
- **Python (AI diagnosis):** Ensure the backend host can run `python3` and that `ai_diagnosis/run_pipeline.py` and its dependencies (e.g. `joblib`, `scikit-learn`) are installed. On Render you can add a build step that runs `pip install -r requirements.txt` if you add a `requirements.txt` next to the Python script.

---

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| CORS errors | `FRONTEND_URL` on backend must match frontend origin exactly (protocol + host, no trailing slash). |
| OAuth redirect fails | `GOOGLE_REDIRECT_URI` must match the value in Google Cloud Console; backend must be HTTPS in production. |
| Firebase “unauthorized domain” | Add the frontend host (e.g. `your-app.vercel.app`) in Firebase Auth → Authorized domains. |
| API 404 / wrong base URL | Frontend build must have `REACT_APP_API_URL` set at build time (Vercel/Netlify env vars). |
| Session not persisting | Use HTTPS; set `cookie: { secure: true, sameSite: 'none' }` if frontend and backend are on different sites (and CORS allows credentials). |

Once these steps are done, your SwasthAI app is deployed end-to-end in production.
