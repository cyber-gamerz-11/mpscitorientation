import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "mpsc-orientation-secret-2026")
    SUPABASE_URL = os.getenv("SUPABASE_URL", "https://tepaqxpmydwjilhlqwyx.supabase.co")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlcGFxeHBteWR3amlsaGxxd3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NDAxMjEsImV4cCI6MjEwNTIxNjEyMX0.pajXz4LD1taQIFPWJ5vwag6jOrrTOxrmyGgfPcnhB1g")
    ADMIN_PASSCODE = os.getenv("ADMIN_PASSCODE", "mpsc@admin2026")
    DEFAULT_QUIZ_TIMER = int(os.getenv("DEFAULT_QUIZ_TIMER", "45"))
    DEFAULT_LOGO_TIMER = int(os.getenv("DEFAULT_LOGO_TIMER", "30"))
    MIN_PRIZE_SCORE = int(os.getenv("MIN_PRIZE_SCORE", "40"))
