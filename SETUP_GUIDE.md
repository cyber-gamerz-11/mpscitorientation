# MPSC IT CLUB — Orientation Challenge Web App Guide

> **Project:** Mohammadpur Preparatory School & College IT Club  
> **Tech Stack:** Python (Flask) · Supabase (PostgreSQL) · HTML5/CSS3/JS · Render Hosting  

---

## 🛠️ Fix for Render Error: `ModuleNotFoundError: No module named 'app'`

If Render shows `ModuleNotFoundError: No module named 'app'`, follow these 2 quick fixes:

### Fix 1: Set Root Directory in Render Settings
If your GitHub repo contains a subfolder named `mpsc Orientation`:
1. Go to your Render Dashboard -> Select your Web Service -> **Settings**.
2. Scroll to **Root Directory**.
3. Set **Root Directory** to: `mpsc Orientation` (or the folder name containing `app.py`).
4. Click **Save Changes** and re-deploy.

### Fix 2: Set Start Command & PYTHONPATH
1. In Render Web Service settings, set **Start Command** to:
   ```bash
   gunicorn --pythonpath . app:app
   ```
2. Under **Environment Variables**, add:
   - **Key:** `PYTHONPATH`
   - **Value:** `.`

---

## ☁️ Deploying to Render (Step-by-Step)

1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "Fix Render deploy settings"
   git push origin main
   ```
2. In [Render Dashboard](https://dashboard.render.com):
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn --pythonpath . app:app`
   - **Environment Variables:**
     - `PYTHONPATH` = `.`
     - `SECRET_KEY` = `mpsc-orientation-secret-2026`
     - `ADMIN_PASSCODE` = `mpsc@admin2026`
     - `SUPABASE_URL` = `https://tepaqxpmydwjilhlqwyx.supabase.co`
     - `SUPABASE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlcGFxeHBteWR3amlsaGxxd3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NDAxMjEsImV4cCI6MjEwNTIxNjEyMX0.pajXz4LD1taQIFPWJ5vwag6jOrrTOxrmyGgfPcnhB1g`

3. Click **Manual Deploy -> Deploy latest commit**.
