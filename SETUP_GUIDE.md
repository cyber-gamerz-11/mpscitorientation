# MPSC IT CLUB — Orientation Challenge Web App Guide

> **Project:** MPSC IT Club Orientation Event Portal  
> **Tech Stack:** Python (Flask) · Supabase (PostgreSQL) · HTML5/CSS3/JS · Render Hosting  

---

## 🌟 Overview & Key Features

1. **Branded Aesthetics**: Cloned design system from `mpscitclub.onrender.com` featuring Pine Green (`#0f3534`), Glowing Mint (`#00f5b4`), Dark Jade (`#051413`), glassmorphism cards, and responsive mobile-first UI.
2. **Onboarding & Anti-Cheat Lockout**:
   - Participants scan a QR code at the orientation booth.
   - Enter **Name** and **Institute**.
   - Triple-layer browser fingerprinting locks the device UUID so each participant can attempt the challenge **ONLY ONCE**.
   - If they reload or scan again, the system immediately redirects to their verified score card with "Lockout Active".
3. **2 Interactive Games**:
   - **IT Quiz (MCQ)**: Speed-test tech MCQ questions under a countdown timer.
   - **Guess The Logo**: Side-by-side logo selector under a countdown timer.
4. **Verified Score Certificate & EC Member Claim**:
   - Generates a verified score card with a unique security code (`MPSC-XXXXXX`).
   - If score is $\ge$ prize threshold, displays "PRIZE ELIGIBLE - Show to EC Member"!
5. **Restricted Admin Dashboard (`/admin`)**:
   - Protected by admin passcode (`mpsc@admin2026`).
   - Live Leaderboard & Submissions.
   - Add/Delete IT MCQ questions and Logo challenges.
   - Configure timer durations and prize score thresholds.
   - Reset individual participant lockouts if an EC member wants to allow a replay.

---

## 🚀 Quick Local Setup

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run Flask Application**:
   ```bash
   python app.py
   ```
   Open your browser at `http://127.0.0.1:5000`.

---

## 🗄️ Supabase Database Setup (1-Minute Setup)

1. Create a free project at [Supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase project dashboard.
3. Open `schema.sql` from this repository, copy all SQL lines, paste them into the SQL Editor, and click **Run**.
4. Go to **Project Settings -> API** and copy:
   - **Project URL** (`SUPABASE_URL`)
   - **anon / public key** (`SUPABASE_KEY`)

---

## ☁️ Deploying to Render.com (Free Hosting)

1. Create a GitHub repository and push this codebase to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for MPSC IT Club Orientation Web"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/mpsc-orientation.git
   git push -u origin main
   ```
2. Log into [Render Dashboard](https://dashboard.render.com).
3. Click **New + -> Web Service**.
4. Connect your GitHub repository.
5. Configure the web service:
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
6. Under **Environment Variables**, add:
   - `SECRET_KEY` = `mpsc-orientation-secret-2026`
   - `ADMIN_PASSCODE` = `mpsc@admin2026`
   - `SUPABASE_URL` = `https://your-supabase-project.supabase.co`
   - `SUPABASE_KEY` = `your-supabase-anon-key`
7. Click **Create Web Service**. Your orientation site is now live!

---

## 📲 Creating the QR Code for the Booth

1. Copy your live Render site URL (e.g. `https://mpsc-orientation.onrender.com`).
2. Generate a QR code using any QR generator (e.g. [qr-code-generator.com](https://www.qr-code-generator.com/)).
3. Print or display the QR code at your orientation stall for students to scan!
