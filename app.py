from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.utils import secure_filename
from config import Config
from db import db
import functools
import os
import uuid

app = Flask(__name__, static_folder='static', template_folder='templates')
app.config.from_object(Config)

UPLOAD_FOLDER = os.path.join(app.static_folder, 'uploads', 'logos')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def admin_required(f):
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('is_admin'):
            return jsonify({"error": "Unauthorized admin access required"}), 401
        return f(*args, **kwargs)
    return decorated_function

# ── WEB ROUTES ───────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/quiz')
def quiz():
    return render_template('quiz.html')

@app.route('/logo-quiz')
def logo_quiz():
    return render_template('logo_quiz.html')

@app.route('/result')
def result():
    return render_template('result.html')

@app.route('/admin')
def admin_page():
    return render_template('admin.html')

# ── API ENDPOINTS ─────────────────────────────────────────

@app.route('/api/health')
def health():
    return jsonify({"status": "online", "message": "MPSC IT Club Orientation Server Active"}), 200

@app.route('/api/check-attempt', methods=['GET'])
def check_attempt():
    device_uuid = request.args.get('uuid')
    if not device_uuid:
        return jsonify({"locked": False})
    
    participant = db.get_participant_by_uuid(device_uuid)
    if participant and participant.get('score_record'):
        return jsonify({
            "locked": True,
            "participant": participant,
            "score": participant['score_record']
        })
    elif participant:
        return jsonify({
            "locked": False,
            "registered": True,
            "participant": participant
        })
    return jsonify({"locked": False, "registered": False})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    institute = data.get('institute', '').strip()
    device_uuid = data.get('uuid', '').strip()

    if not name or not institute or not device_uuid:
        return jsonify({"error": "Name, Institute and Device UUID are required"}), 400

    ip_addr = request.remote_addr or request.headers.get('X-Forwarded-For', '127.0.0.1')
    participant, is_locked = db.register_participant(name, institute, device_uuid, ip_addr)

    return jsonify({
        "success": True,
        "is_locked": is_locked,
        "participant": participant
    })

@app.route('/api/quiz-questions', methods=['GET'])
def get_quiz_questions():
    questions = db.get_quiz_questions()
    settings = db.get_settings()
    return jsonify({
        "questions": questions,
        "timer": settings.get("quiz_timer", Config.DEFAULT_QUIZ_TIMER)
    })

@app.route('/api/logo-questions', methods=['GET'])
def get_logo_questions():
    questions = db.get_logo_questions()
    settings = db.get_settings()
    return jsonify({
        "questions": questions,
        "timer": settings.get("logo_timer", Config.DEFAULT_LOGO_TIMER)
    })

@app.route('/api/submit-score', methods=['POST'])
def submit_score():
    data = request.get_json() or {}
    device_uuid = data.get('uuid', '').strip()
    game_type = data.get('game_type', 'IT Quiz')
    score = int(data.get('score', 0))
    total_q = int(data.get('total_questions', 0))

    if not device_uuid:
        return jsonify({"error": "Device UUID required"}), 400

    score_record, err = db.submit_score(device_uuid, game_type, score, total_q)
    if err:
        return jsonify({"error": err, "score_record": score_record}), 400

    settings = db.get_settings()
    min_prize_score = settings.get("min_prize_score", Config.MIN_PRIZE_SCORE)
    is_eligible_for_gift = score >= min_prize_score

    return jsonify({
        "success": True,
        "score_record": score_record,
        "eligible_for_gift": is_eligible_for_gift,
        "min_prize_score": min_prize_score
    })

# ── ADMIN API ENDPOINTS ───────────────────────────────────

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json() or {}
    passcode = data.get('passcode', '')
    if passcode == app.config['ADMIN_PASSCODE']:
        session['is_admin'] = True
        return jsonify({"success": True, "message": "Authenticated successfully"})
    return jsonify({"error": "Invalid secret passcode"}), 401

@app.route('/api/admin/logout', methods=['POST'])
def admin_logout():
    session.pop('is_admin', None)
    return jsonify({"success": True})

@app.route('/api/admin/leaderboard', methods=['GET'])
@admin_required
def admin_leaderboard():
    leaderboard = db.get_leaderboard()
    settings = db.get_settings()
    quiz_questions = db.get_quiz_questions()
    logo_questions = db.get_logo_questions()
    return jsonify({
        "leaderboard": leaderboard,
        "settings": settings,
        "quiz_questions": quiz_questions,
        "logo_questions": logo_questions
    })

@app.route('/api/admin/add-quiz', methods=['POST'])
@admin_required
def admin_add_quiz():
    data = request.get_json() or {}
    q = db.add_quiz_question(
        data.get('question'),
        data.get('option_a'),
        data.get('option_b'),
        data.get('option_c'),
        data.get('option_d'),
        data.get('correct_option')
    )
    return jsonify({"success": True, "question": q})

@app.route('/api/admin/delete-quiz', methods=['POST'])
@admin_required
def admin_delete_quiz():
    data = request.get_json() or {}
    q_id = data.get('id')
    db.delete_quiz_question(q_id)
    return jsonify({"success": True})

@app.route('/api/admin/add-logo', methods=['POST'])
@admin_required
def admin_add_logo():
    prompt = request.form.get('prompt', '').strip()
    correct_logo = request.form.get('correct_logo', 'A').strip().upper()
    
    file_a = request.files.get('logo_a_file')
    file_b = request.files.get('logo_b_file')

    if not prompt or not file_a or not file_b:
        return jsonify({"error": "Prompt, Logo A file, and Logo B file are required"}), 400

    if not allowed_file(file_a.filename) or not allowed_file(file_b.filename):
        return jsonify({"error": "Invalid image file format. Allowed: PNG, JPG, JPEG, SVG, WEBP"}), 400

    fname_a = f"logo_a_{uuid.uuid4().hex[:8]}_{secure_filename(file_a.filename)}"
    fname_b = f"logo_b_{uuid.uuid4().hex[:8]}_{secure_filename(file_b.filename)}"

    path_a = os.path.join(UPLOAD_FOLDER, fname_a)
    path_b = os.path.join(UPLOAD_FOLDER, fname_b)

    file_a.save(path_a)
    file_b.save(path_b)

    url_a = f"/static/uploads/logos/{fname_a}"
    url_b = f"/static/uploads/logos/{fname_b}"

    q = db.add_logo_question(prompt, url_a, url_b, correct_logo)
    return jsonify({"success": True, "question": q})

@app.route('/api/admin/delete-logo', methods=['POST'])
@admin_required
def admin_delete_logo():
    data = request.get_json() or {}
    q_id = data.get('id')
    db.delete_logo_question(q_id)
    return jsonify({"success": True})

@app.route('/api/admin/reset-user', methods=['POST'])
@admin_required
def admin_reset_user():
    data = request.get_json() or {}
    uuid_str = data.get('uuid')
    db.reset_participant_lockout(uuid_str)
    return jsonify({"success": True})

@app.route('/api/admin/settings', methods=['POST'])
@admin_required
def admin_update_settings():
    data = request.get_json() or {}
    if 'quiz_timer' in data:
        db.update_setting('quiz_timer', data['quiz_timer'])
    if 'logo_timer' in data:
        db.update_setting('logo_timer', data['logo_timer'])
    if 'min_prize_score' in data:
        db.update_setting('min_prize_score', data['min_prize_score'])
    return jsonify({"success": True, "settings": db.get_settings()})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
