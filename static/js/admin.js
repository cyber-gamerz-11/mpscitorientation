/**
 * Mohammadpur Preparatory School & College IT Club
 * Restricted Admin Panel JS — Live Supabase Sync & Question Manager
 */

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
});

async function handleAdminLogin(e) {
    if (e) e.preventDefault();
    const passcode = document.getElementById('adminPasscode').value;
    try {
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ passcode })
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('adminDashboard').style.display = 'block';
            loadAdminData();
        } else {
            alert(data.error || "Login failed");
        }
    } catch (err) {
        console.error(err);
        alert("Server connection error");
    }
}

function checkAdminAuth() {
    loadAdminData();
}

async function loadAdminData() {
    try {
        const res = await fetch('/api/admin/leaderboard');
        if (res.status === 401) {
            document.getElementById('loginSection').style.display = 'block';
            document.getElementById('adminDashboard').style.display = 'none';
            return;
        }
        const data = await res.json();
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';

        renderLeaderboard(data.leaderboard || []);
        renderExistingQuizQuestions(data.quiz_questions || []);
        renderExistingLogoQuestions(data.logo_questions || []);

        if (data.settings) {
            document.getElementById('cfgQuizTimer').value = data.settings.quiz_timer || 45;
            document.getElementById('cfgLogoTimer').value = data.settings.logo_timer || 30;
            document.getElementById('cfgMinScore').value = data.settings.min_prize_score || 40;
        }
    } catch (err) {
        console.error("Load admin error:", err);
    }
}

function renderLeaderboard(list) {
    const tbody = document.getElementById('leaderboardBody');
    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;" class="text-muted">No registered participants yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map((item, idx) => `
        <tr>
            <td><strong>#${idx + 1}</strong></td>
            <td><strong>${escapeHtml(item.participant_name)}</strong></td>
            <td>${escapeHtml(item.institute)}</td>
            <td><span class="nav-badge">${escapeHtml(item.game_type)}</span></td>
            <td><strong class="text-mint">${item.score} PTS</strong></td>
            <td><code>${item.verification_code}</code></td>
            <td>
                <button class="btn-outline" style="padding:0.3rem 0.8rem; font-size:0.75rem; border-color:var(--danger-red); color:var(--danger-red);" onclick="resetParticipant('${item.participant_uuid}')">
                    Reset Lockout
                </button>
            </td>
        </tr>
    `).join('');
}

function renderExistingQuizQuestions(questions) {
    const container = document.getElementById('existingQuizContainer');
    if (!container) return;

    if (questions.length === 0) {
        container.innerHTML = `<p class="text-muted" style="margin-top:1rem; text-align:center;">No IT Quiz questions uploaded yet. Use the form above to add your first question.</p>`;
        return;
    }

    container.innerHTML = `
        <h4 style="margin: 1.5rem 0 0.8rem 0; color: var(--emerald-green);">Existing IT Quiz Questions (${questions.length})</h4>
        <div style="display:flex; flex-direction:column; gap:0.8rem;">
            ${questions.map((q, idx) => `
                <div style="background:rgba(15, 53, 52, 0.3); border:1px solid var(--glass-border); padding:1rem; border-radius:12px; display:flex; justify-content:space-between; align-items:center; gap:1rem;">
                    <div>
                        <strong>Q${idx + 1}: ${escapeHtml(q.question)}</strong>
                        <p style="font-size:0.8rem; color:var(--soft-gray); margin-top:0.3rem;">
                            A: ${escapeHtml(q.option_a)} | B: ${escapeHtml(q.option_b)} | C: ${escapeHtml(q.option_c)} | D: ${escapeHtml(q.option_d)} (Correct: ${q.correct_option})
                        </p>
                    </div>
                    <button class="btn-outline" style="padding:0.3rem 0.8rem; font-size:0.75rem; border-color:var(--danger-red); color:var(--danger-red); flex-shrink:0;" onclick="deleteQuizQuestion('${q.id}')">
                        Delete
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

function renderExistingLogoQuestions(questions) {
    const container = document.getElementById('existingLogoContainer');
    if (!container) return;

    if (questions.length === 0) {
        container.innerHTML = `<p class="text-muted" style="margin-top:1rem; text-align:center;">No Logo challenges uploaded yet. Use the form above to upload images and create your first challenge.</p>`;
        return;
    }

    container.innerHTML = `
        <h4 style="margin: 1.5rem 0 0.8rem 0; color: var(--emerald-green);">Existing Logo Challenges (${questions.length})</h4>
        <div style="display:flex; flex-direction:column; gap:0.8rem;">
            ${questions.map((q, idx) => `
                <div style="background:rgba(15, 53, 52, 0.3); border:1px solid var(--glass-border); padding:1rem; border-radius:12px; display:flex; justify-content:space-between; align-items:center; gap:1rem;">
                    <div>
                        <strong>Challenge ${idx + 1}: ${escapeHtml(q.prompt)}</strong>
                        <div style="display:flex; gap:1rem; margin-top:0.5rem; align-items:center;">
                            <img src="${q.logo_a_url}" alt="A" style="height:35px; width:auto; object-fit:contain; border:1px solid rgba(255,255,255,0.2); padding:2px; border-radius:4px;">
                            <img src="${q.logo_b_url}" alt="B" style="height:35px; width:auto; object-fit:contain; border:1px solid rgba(255,255,255,0.2); padding:2px; border-radius:4px;">
                            <span style="font-size:0.8rem; color:var(--emerald-green);">Correct: Logo ${q.correct_logo}</span>
                        </div>
                    </div>
                    <button class="btn-outline" style="padding:0.3rem 0.8rem; font-size:0.75rem; border-color:var(--danger-red); color:var(--danger-red); flex-shrink:0;" onclick="deleteLogoQuestion('${q.id}')">
                        Delete
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

async function deleteQuizQuestion(id) {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
        const res = await fetch('/api/admin/delete-quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.success) {
            loadAdminData();
        }
    } catch (err) {
        console.error(err);
    }
}

async function deleteLogoQuestion(id) {
    if (!confirm("Are you sure you want to delete this logo challenge?")) return;
    try {
        const res = await fetch('/api/admin/delete-logo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.success) {
            loadAdminData();
        }
    } catch (err) {
        console.error(err);
    }
}

async function resetParticipant(uuid) {
    if (!confirm("Are you sure you want to reset this participant's lockout? They will be able to play again.")) return;
    try {
        const res = await fetch('/api/admin/reset-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uuid })
        });
        const data = await res.json();
        if (data.success) {
            alert("Lockout cleared successfully.");
            loadAdminData();
        }
    } catch (err) {
        console.error(err);
    }
}

async function handleAddQuiz(e) {
    if (e) e.preventDefault();
    const question = document.getElementById('qTitle').value;
    const option_a = document.getElementById('qOptA').value;
    const option_b = document.getElementById('qOptB').value;
    const option_c = document.getElementById('qOptC').value;
    const option_d = document.getElementById('qOptD').value;
    const correct_option = document.getElementById('qCorrect').value;

    try {
        const res = await fetch('/api/admin/add-quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, option_a, option_b, option_c, option_d, correct_option })
        });
        const data = await res.json();
        if (data.success) {
            alert("Quiz Question Added.");
            document.getElementById('addQuizForm').reset();
            loadAdminData();
        }
    } catch (err) {
        console.error(err);
    }
}

async function handleAddLogo(e) {
    if (e) e.preventDefault();
    const prompt = document.getElementById('lPrompt').value;
    const logo_a_file = document.getElementById('lLogoAFile').files[0];
    const logo_b_file = document.getElementById('lLogoBFile').files[0];
    const correct_logo = document.getElementById('lCorrect').value;

    if (!logo_a_file || !logo_b_file) {
        alert("Please select image files for both Logo A and Logo B.");
        return;
    }

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('logo_a_file', logo_a_file);
    formData.append('logo_b_file', logo_b_file);
    formData.append('correct_logo', correct_logo);

    try {
        const res = await fetch('/api/admin/add-logo', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.success) {
            alert("Logo Challenge & Image Files Uploaded Successfully!");
            document.getElementById('addLogoForm').reset();
            loadAdminData();
        } else {
            alert(data.error || "File upload failed");
        }
    } catch (err) {
        console.error("Upload error:", err);
        alert("Server connection error during logo upload.");
    }
}

async function handleSaveSettings(e) {
    if (e) e.preventDefault();
    const quiz_timer = document.getElementById('cfgQuizTimer').value;
    const logo_timer = document.getElementById('cfgLogoTimer').value;
    const min_prize_score = document.getElementById('cfgMinScore').value;

    try {
        const res = await fetch('/api/admin/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quiz_timer, logo_timer, min_prize_score })
        });
        const data = await res.json();
        if (data.success) {
            alert("Settings updated.");
        }
    } catch (err) {
        console.error(err);
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    const activeBtn = document.querySelector(`[onclick="switchTab('${tabId}')"]`);
    const activeContent = document.getElementById(tabId);
    if (activeBtn) activeBtn.classList.add('active');
    if (activeContent) activeContent.classList.add('active');
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
