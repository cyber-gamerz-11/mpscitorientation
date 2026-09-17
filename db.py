import os
import json
import uuid
import time
import requests
from config import Config

class SupabaseDB:
    def __init__(self):
        self.url = Config.SUPABASE_URL.rstrip("/")
        self.key = Config.SUPABASE_KEY
        self.is_configured = bool(self.url and self.key)
        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    def _req(self, method, endpoint, payload=None, params=None):
        if not self.is_configured:
            return None
        url = f"{self.url}/rest/v1/{endpoint}"
        try:
            res = requests.request(method, url, headers=self.headers, json=payload, params=params, timeout=6)
            if res.ok:
                return res.json()
            else:
                print(f"[Supabase API Error] Status {res.status_code}: {res.text}")
        except Exception as e:
            print(f"[Supabase Request Exception] {e}")
        return None

    # Participant Management
    def get_participant_by_uuid(self, device_uuid):
        if self.is_configured:
            res = self._req("GET", "participants", params={"uuid": f"eq.{device_uuid}"})
            if res and len(res) > 0:
                p = res[0]
                score_res = self._req("GET", "scores", params={"participant_uuid": f"eq.{device_uuid}"})
                p["score_record"] = score_res[0] if score_res and len(score_res) > 0 else None
                return p
        return None

    def register_participant(self, name, institute, device_uuid, ip_address):
        existing = self.get_participant_by_uuid(device_uuid)
        if existing:
            return existing, bool(existing.get("score_record"))
        
        data = {
            "uuid": device_uuid,
            "name": name,
            "institute": institute,
            "ip_address": ip_address,
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }

        if self.is_configured:
            res = self._req("POST", "participants", payload=data)
            if res and len(res) > 0:
                p = res[0]
                p["score_record"] = None
                return p, False
        
        return data, False

    # Score Submission & Verification
    def submit_score(self, device_uuid, game_type, score, total_q):
        participant = self.get_participant_by_uuid(device_uuid)
        if not participant:
            return None, "Participant not registered"
        
        if participant.get("score_record"):
            return participant["score_record"], "Already attempted! Score is locked."

        verif_code = f"MPSC-{uuid.uuid4().hex[:6].upper()}"
        score_data = {
            "participant_uuid": device_uuid,
            "participant_name": participant["name"],
            "institute": participant["institute"],
            "game_type": game_type,
            "score": score,
            "total_questions": total_q,
            "verification_code": verif_code,
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }

        if self.is_configured:
            res = self._req("POST", "scores", payload=score_data)
            if res and len(res) > 0:
                return res[0], None

        return score_data, None

    # Questions & Content
    def get_quiz_questions(self):
        if self.is_configured:
            res = self._req("GET", "quiz_questions")
            return res if res is not None else []
        return []

    def get_logo_questions(self):
        if self.is_configured:
            res = self._req("GET", "logo_questions")
            return res if res is not None else []
        return []

    # Leaderboard & Admin
    def get_leaderboard(self):
        if not self.is_configured:
            return []

        # Fetch all registered participants
        participants = self._req("GET", "participants", params={"order": "created_at.desc"}) or []
        # Fetch all submitted scores
        scores = self._req("GET", "scores") or []
        scores_map = {s["participant_uuid"]: s for s in scores}

        result = []
        for p in participants:
            p_uuid = p["uuid"]
            score_rec = scores_map.get(p_uuid)
            
            result.append({
                "participant_uuid": p_uuid,
                "participant_name": p.get("name", "Unknown"),
                "institute": p.get("institute", "N/A"),
                "game_type": score_rec["game_type"] if score_rec else "Registered (In Progress)",
                "score": score_rec["score"] if score_rec else 0,
                "total_questions": score_rec["total_questions"] if score_rec else 0,
                "verification_code": score_rec["verification_code"] if score_rec else "PENDING",
                "completed": bool(score_rec),
                "created_at": score_rec["created_at"] if score_rec else p.get("created_at", "")
            })

        # Sort: Completed high scores first, then recent registrations
        result.sort(key=lambda x: (x["completed"], x["score"]), reverse=True)
        return result

    def add_quiz_question(self, question, opt_a, opt_b, opt_c, opt_d, correct):
        data = {
            "question": question,
            "option_a": opt_a,
            "option_b": opt_b,
            "option_c": opt_c,
            "option_d": opt_d,
            "correct_option": correct.upper()
        }
        if self.is_configured:
            res = self._req("POST", "quiz_questions", payload=data)
            if res:
                return res[0]
        return data

    def delete_quiz_question(self, q_id):
        if self.is_configured:
            self._req("DELETE", "quiz_questions", params={"id": f"eq.{q_id}"})
            return True
        return True

    def add_logo_question(self, prompt, logo_a_url, logo_b_url, correct):
        data = {
            "prompt": prompt,
            "logo_a_url": logo_a_url,
            "logo_b_url": logo_b_url,
            "correct_logo": correct.upper()
        }
        if self.is_configured:
            res = self._req("POST", "logo_questions", payload=data)
            if res:
                return res[0]
        return data

    def delete_logo_question(self, q_id):
        if self.is_configured:
            self._req("DELETE", "logo_questions", params={"id": f"eq.{q_id}"})
            return True
        return True

    def reset_participant_lockout(self, device_uuid):
        if self.is_configured:
            self._req("DELETE", "scores", params={"participant_uuid": f"eq.{device_uuid}"})
            self._req("DELETE", "participants", params={"uuid": f"eq.{device_uuid}"})
            return True
        return True

    def get_settings(self):
        if self.is_configured:
            res = self._req("GET", "settings")
            if res:
                s_map = {item["key"]: item["value"] for item in res}
                return {
                    "quiz_timer": int(s_map.get("quiz_timer", Config.DEFAULT_QUIZ_TIMER)),
                    "logo_timer": int(s_map.get("logo_timer", Config.DEFAULT_LOGO_TIMER)),
                    "min_prize_score": int(s_map.get("min_prize_score", Config.MIN_PRIZE_SCORE))
                }
        return {
            "quiz_timer": Config.DEFAULT_QUIZ_TIMER,
            "logo_timer": Config.DEFAULT_LOGO_TIMER,
            "min_prize_score": Config.MIN_PRIZE_SCORE
        }

    def update_setting(self, key, value):
        if self.is_configured:
            self._req("POST", "settings", payload={"key": key, "value": str(value)})
            return True
        return True

db = SupabaseDB()
