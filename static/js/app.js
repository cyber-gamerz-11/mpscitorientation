/**
 * Mohammadpur Preparatory School & College IT Club
 * Client JavaScript Engine — Anti-Cheat Lockout, Onboarding, Timers, Game Engine & Results
 */

const APP_STATE = {
    uuid: null,
    participant: null,
    scoreRecord: null,
    isLocked: false
};

function getOrCreateDeviceUUID() {
    let devId = localStorage.getItem('mpsc_orientation_uuid');
    if (!devId) {
        devId = 'dev_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
        localStorage.setItem('mpsc_orientation_uuid', devId);
    }
    return devId;
}

document.addEventListener('DOMContentLoaded', () => {
    APP_STATE.uuid = getOrCreateDeviceUUID();
    checkAttemptStatus();
});

async function checkAttemptStatus() {
    try {
        const res = await fetch(`/api/check-attempt?uuid=${APP_STATE.uuid}`);
        const data = await res.json();
        
        if (data.locked) {
            APP_STATE.isLocked = true;
            APP_STATE.participant = data.participant;
            APP_STATE.scoreRecord = data.score;
            localStorage.setItem('mpsc_orientation_locked', 'true');

            const currentPath = window.location.pathname;
            if (currentPath !== '/result' && currentPath !== '/admin') {
                window.location.href = '/result';
            } else if (currentPath === '/result') {
                renderResultPage();
            }
        } else if (data.registered) {
            APP_STATE.participant = data.participant;
            sessionStorage.setItem('mpsc_participant', JSON.stringify(data.participant));
        } else {
            if (window.location.pathname === '/' && !sessionStorage.getItem('mpsc_participant')) {
                showOnboardingModal();
            }
        }
    } catch (err) {
        console.error("Error checking attempt:", err);
    }
}

function showOnboardingModal() {
    const modal = document.getElementById('onboardingModal');
    if (modal) modal.classList.add('active');
}

async function handleRegister(e) {
    if (e) e.preventDefault();
    const nameInput = document.getElementById('participantName');
    const instituteInput = document.getElementById('participantInstitute');

    const name = nameInput ? nameInput.value.trim() : '';
    const institute = instituteInput ? instituteInput.value.trim() : '';

    if (!name || !institute) {
        alert("Please enter both your Name and Institute.");
        return;
    }

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, institute, uuid: APP_STATE.uuid })
        });
        const data = await res.json();

        if (data.is_locked) {
            window.location.href = '/result';
            return;
        }

        if (data.success) {
            APP_STATE.participant = data.participant;
            sessionStorage.setItem('mpsc_participant', JSON.stringify(data.participant));
            const modal = document.getElementById('onboardingModal');
            if (modal) modal.classList.remove('active');
        } else {
            alert(data.error || "Registration failed");
        }
    } catch (err) {
        console.error("Registration error:", err);
        alert("Server communication error. Please try again.");
    }
}

function startGame(gameType) {
    const savedP = sessionStorage.getItem('mpsc_participant');
    if (!savedP && !APP_STATE.participant) {
        showOnboardingModal();
        return;
    }

    if (gameType === 'mcq') {
        window.location.href = '/quiz';
    } else if (gameType === 'logo') {
        window.location.href = '/logo-quiz';
    }
}

// IT QUIZ GAME ENGINE
let quizTimerInterval = null;
let currentQuestions = [];
let currentQIndex = 0;
let userScore = 0;
let timeRemaining = 45;

async function initQuizGame() {
    try {
        const res = await fetch('/api/quiz-questions');
        const data = await res.json();
        currentQuestions = data.questions || [];
        timeRemaining = data.timer || 45;

        if (currentQuestions.length === 0) {
            alert("No quiz questions configured.");
            window.location.href = '/';
            return;
        }

        renderQuizQuestion();
        startQuizTimer();
    } catch (err) {
        console.error("Quiz error:", err);
    }
}

function startQuizTimer() {
    const timerDisplay = document.getElementById('timerText');
    const timerBox = document.getElementById('timerBox');

    quizTimerInterval = setInterval(() => {
        timeRemaining--;
        if (timerDisplay) timerDisplay.textContent = timeRemaining + 's';

        if (timerBox) {
            if (timeRemaining <= 10) {
                timerBox.className = 'timer-box danger';
            } else if (timeRemaining <= 20) {
                timerBox.className = 'timer-box warning';
            }
        }

        if (timeRemaining <= 0) {
            clearInterval(quizTimerInterval);
            finishGame('IT Quiz');
        }
    }, 1000);
}

function renderQuizQuestion() {
    if (currentQIndex >= currentQuestions.length) {
        clearInterval(quizTimerInterval);
        finishGame('IT Quiz');
        return;
    }

    const q = currentQuestions[currentQIndex];
    const qNumEl = document.getElementById('qNumber');
    const qTextEl = document.getElementById('qText');
    const optionsContainer = document.getElementById('optionsContainer');

    if (qNumEl) qNumEl.textContent = `Question ${currentQIndex + 1} / ${currentQuestions.length}`;
    if (qTextEl) qTextEl.textContent = q.question;

    if (optionsContainer) {
        optionsContainer.innerHTML = `
            <button class="option-btn" onclick="selectOption('A', '${q.correct_option}')">
                <span class="option-tag">A</span> ${q.option_a}
            </button>
            <button class="option-btn" onclick="selectOption('B', '${q.correct_option}')">
                <span class="option-tag">B</span> ${q.option_b}
            </button>
            <button class="option-btn" onclick="selectOption('C', '${q.correct_option}')">
                <span class="option-tag">C</span> ${q.option_c}
            </button>
            <button class="option-btn" onclick="selectOption('D', '${q.correct_option}')">
                <span class="option-tag">D</span> ${q.option_d}
            </button>
        `;
    }
}

function selectOption(selectedOpt, correctOpt) {
    if (selectedOpt === correctOpt) {
        userScore += 10;
    }
    currentQIndex++;
    renderQuizQuestion();
}

// LOGO QUIZ GAME ENGINE
let logoQuestions = [];
let logoIndex = 0;
let logoScore = 0;
let logoTimeRemaining = 30;
let logoTimerInterval = null;

async function initLogoGame() {
    try {
        const res = await fetch('/api/logo-questions');
        const data = await res.json();
        logoQuestions = data.questions || [];
        logoTimeRemaining = data.timer || 30;

        if (logoQuestions.length === 0) {
            alert("No logo questions configured.");
            window.location.href = '/';
            return;
        }

        renderLogoQuestion();
        startLogoTimer();
    } catch (err) {
        console.error("Logo Quiz error:", err);
    }
}

function startLogoTimer() {
    const timerDisplay = document.getElementById('logoTimerText');
    const timerBox = document.getElementById('logoTimerBox');

    logoTimerInterval = setInterval(() => {
        logoTimeRemaining--;
        if (timerDisplay) timerDisplay.textContent = logoTimeRemaining + 's';

        if (timerBox) {
            if (logoTimeRemaining <= 10) {
                timerBox.className = 'timer-box danger';
            } else if (logoTimeRemaining <= 20) {
                timerBox.className = 'timer-box warning';
            }
        }

        if (logoTimeRemaining <= 0) {
            clearInterval(logoTimerInterval);
            finishGame('Guess The Logo');
        }
    }, 1000);
}

function renderLogoQuestion() {
    if (logoIndex >= logoQuestions.length) {
        clearInterval(logoTimerInterval);
        finishGame('Guess The Logo');
        return;
    }

    const q = logoQuestions[logoIndex];
    const promptEl = document.getElementById('logoPrompt');
    const qNumEl = document.getElementById('logoQNumber');
    const gridEl = document.getElementById('logoGrid');

    if (qNumEl) qNumEl.textContent = `Challenge ${logoIndex + 1} / ${logoQuestions.length}`;
    if (promptEl) promptEl.textContent = q.prompt;

    if (gridEl) {
        gridEl.innerHTML = `
            <div class="logo-choice-card" onclick="selectLogo('A', '${q.correct_logo}')">
                <img src="${q.logo_a_url}" alt="Option A" class="logo-choice-img">
                <p style="margin-top: 1rem; font-weight:700;">LOGO A</p>
            </div>
            <div class="logo-choice-card" onclick="selectLogo('B', '${q.correct_logo}')">
                <img src="${q.logo_b_url}" alt="Option B" class="logo-choice-img">
                <p style="margin-top: 1rem; font-weight:700;">LOGO B</p>
            </div>
        `;
    }
}

function selectLogo(selected, correct) {
    if (selected === correct) {
        logoScore += 10;
    }
    logoIndex++;
    renderLogoQuestion();
}

// SUBMIT & RESULT
async function finishGame(gameType) {
    const finalScore = (gameType === 'IT Quiz') ? userScore : logoScore;
    const totalQ = (gameType === 'IT Quiz') ? currentQuestions.length : logoQuestions.length;

    try {
        const res = await fetch('/api/submit-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uuid: APP_STATE.uuid,
                game_type: gameType,
                score: finalScore,
                total_questions: totalQ
            })
        });
        const data = await res.json();
        if (data.score_record) {
            sessionStorage.setItem('mpsc_latest_score', JSON.stringify(data));
        }
        window.location.href = '/result';
    } catch (err) {
        console.error("Score submit error:", err);
        window.location.href = '/result';
    }
}

async function renderResultPage() {
    try {
        const res = await fetch(`/api/check-attempt?uuid=${APP_STATE.uuid}`);
        const data = await res.json();

        const participantNameEl = document.getElementById('resName');
        const instituteEl = document.getElementById('resInstitute');
        const scoreEl = document.getElementById('resScore');
        const verifCodeEl = document.getElementById('resCode');
        const claimStatusEl = document.getElementById('resClaimBanner');

        if (data.locked && data.score) {
            const s = data.score;
            if (participantNameEl) participantNameEl.textContent = s.participant_name;
            if (instituteEl) instituteEl.textContent = s.institute;
            if (scoreEl) scoreEl.textContent = s.score + ' PTS';
            if (verifCodeEl) verifCodeEl.textContent = s.verification_code;

            if (claimStatusEl) {
                if (s.score >= 30) {
                    claimStatusEl.innerHTML = `
                        <h3 class="text-mint" style="margin-bottom:0.4rem; letter-spacing:1px;">PRIZE ELIGIBLE</h3>
                        <p>Show this screen to an <strong>Executive Committee (EC) Member</strong> at the booth to claim your MPSC IT Club gift.</p>
                    `;
                } else {
                    claimStatusEl.innerHTML = `
                        <h4 style="color:#ffa502; letter-spacing:1px;">PARTICIPATION BADGE</h4>
                        <p>Thank you for participating in the Mohammadpur Preparatory School & College Orientation.</p>
                    `;
                }
            }
        }
    } catch (err) {
        console.error("Render result error:", err);
    }
}
