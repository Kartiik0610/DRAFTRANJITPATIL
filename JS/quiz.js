/* =========================================================
   DR. RANJIT A. PATIL - QUIZ & ASSESSMENT PORTAL
   Dynamic Google Sheets Questions & Automated Marks Uploader
========================================================= */

// 1. Live Google Sheets Questions Source (First Tab: Questions, Options, Answers)
const GOOGLE_SHEET_QUESTIONS_CSV = "https://docs.google.com/spreadsheets/d/1j7yKVJlU0Jx_HfoRdPEw9JzLRMk4L9ZqORmkvNQ2g-I/export?format=csv";

// 2. Google Apps Script Webhook URL (Target: Marks Tab GID 2126279517)
// Deployed Web App URL connected to your Google Sheet:
const GOOGLE_APPS_SCRIPT_MARKS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbw3JgFvyoYCIxYEDtRBUzTsVbqFUBd8E1zmiJq6vqo4QU03ZnQfGcIK7PZR_S_MLturwg/exec";

const QUIZ_CACHE_KEY = "evsd_live_quiz_cache_v2";
const CANDIDATE_STORAGE_KEY = "evsd_active_candidate_v2";
const SUBMISSIONS_STORAGE_KEY = "evsd_saved_submissions_v2";

// Default Quiz Schema (Matches the live spreadsheet content as fallback)
let activeQuiz = {
  subject: "Testing",
  semester: "VII",
  durationMinutes: 10,
  liveDate: "26/10/2026",
  startTime: "23:30",
  testDate: "26/10/2026",
  totalQuestions: 10,
  questions: [
    { id: 1, text: "Question 1", options: ["A", "B", "C", "D"], correctOption: "A" },
    { id: 2, text: "Question 2", options: ["A", "B", "C", "D"], correctOption: "B" },
    { id: 3, text: "Question 3", options: ["A", "B", "C", "D"], correctOption: "C" },
    { id: 4, text: "Question 4", options: ["A", "B", "C", "D"], correctOption: "D" },
    { id: 5, text: "Question 5", options: ["A", "B", "C", "D"], correctOption: "D" },
    { id: 6, text: "Question 6", options: ["A", "B", "C", "D"], correctOption: "A" },
    { id: 7, text: "Question 7", options: ["A", "B", "C", "D"], correctOption: "A" },
    { id: 8, text: "Question 8", options: ["A", "B", "C", "D"], correctOption: "C" },
    { id: 9, text: "Question 9", options: ["A", "B", "C", "D"], correctOption: "D" },
    { id: 10, text: "Question 10", options: ["A", "B", "C", "D"], correctOption: "B" }
  ]
};

let currentCandidate = null;
let timerInterval = null;
let totalDurationSeconds = 15 * 60;
let secondsRemaining = totalDurationSeconds;
let tabSwitchCount = 0;
let isSubmitted = false;
let isSubmitting = false;

// Student selected answers { [questionId]: selectedOptionText }
const userAnswers = {};

/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initQuizPortal();
});

async function initQuizPortal() {
  // 1. Immediately load cached questions if available
  const cachedData = localStorage.getItem(QUIZ_CACHE_KEY);
  if (cachedData) {
    try {
      const parsed = JSON.parse(cachedData);
      if (parsed && parsed.questions && parsed.questions.length > 0) {
        activeQuiz = parsed;
        renderBriefing(activeQuiz);
      }
    } catch (e) {
      console.warn("Cached quiz parse error", e);
    }
  } else {
    renderBriefing(activeQuiz);
  }

  // 2. Fetch fresh questions directly from Google Sheets
  await loadLiveQuestionsFromSheet();

  // 3. Bind Registration Form
  const regForm = document.getElementById("quizRegForm");
  if (regForm) {
    regForm.addEventListener("submit", handleStartAssessment);
  }

  // 4. Bind Assessment Submit Form
  const questionsForm = document.getElementById("nativeQuizForm");
  if (questionsForm) {
    questionsForm.addEventListener("submit", handleManualSubmit);
  }

  // 5. Periodic Schedule Checker (unlocks live when start time arrives)
  updateScheduleLockUI();
  setInterval(updateScheduleLockUI, 5000);
}

/* =========================================================
   FETCH & PARSE QUESTIONS FROM GOOGLE SHEET CSV
========================================================= */

async function loadLiveQuestionsFromSheet() {
  try {
    const cacheBusterUrl = `${GOOGLE_SHEET_QUESTIONS_CSV}&t=${Date.now()}`;
    const response = await fetch(cacheBusterUrl);
    if (!response.ok) throw new Error("Could not fetch questions sheet");

    const csvText = await response.text();
    const parsedData = parseQuestionsSheetCSV(csvText);

    if (parsedData && parsedData.questions && parsedData.questions.length > 0) {
      activeQuiz = {
        ...activeQuiz,
        ...parsedData,
        totalQuestions: parsedData.questions.length
      };

      // Cache fresh data for instant offline/re-visit access
      localStorage.setItem(QUIZ_CACHE_KEY, JSON.stringify(activeQuiz));

      // Update Briefing metadata
      renderBriefing(activeQuiz);
      console.log(`Loaded ${activeQuiz.questions.length} questions from Google Sheet for ${activeQuiz.subject}!`);
    }
  } catch (err) {
    console.warn("Could not fetch live Google Sheet questions, using cached/fallback:", err);
  }
}

/**
 * Standard CSV to 2D Array parser (handles commas and quotes properly)
 */
function csvToArray(text) {
  let p = '', row = [''], ret = [row], i = 0, r = 0, s = !0, l;
  for (l of text) {
    if ('"' === l) {
      if (s && l === p) row[i] += l;
      s = !s;
    } else if (',' === l && s) l = row[++i] = '';
    else if ('\n' === l && s) {
      if ('\r' === p) row[i] = row[i].slice(0, -1);
      row = ret[++r] = [l = '']; i = 0;
    } else row[i] += l;
    p = l;
  }
  return ret;
}

/**
 * Parses the user's specific Google Sheet structure:
 * Row 1: Subject : EVSD
 * Row 2: Semester : VII
 * Row 3: Time : 15 Minutes
 * Row 4: (empty)
 * Row 5: Question ,Option 1,Option 2,Option 3,Option 4,Correct Option
 * Row 6+: Question items
 */
function parseQuestionsSheetCSV(csvText) {
  const rows = csvToArray(csvText.trim());
  if (!rows || rows.length === 0) return null;

  let subject = "Testing";
  let semester = "VII";
  let durationMinutes = 10;
  let liveDate = "26/10/2026";
  let startTime = "23:30";
  const questions = [];

  let headerRowIndex = -1;

  // Scan metadata header lines
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const firstCell = (row[0] || "").trim().toLowerCase();

    if (firstCell.startsWith("subject")) {
      const val = row[0].includes(":") ? row[0].substring(row[0].indexOf(":") + 1).trim() : (row[1] || "").trim();
      if (val) subject = val;
    } else if (firstCell.startsWith("semester") || firstCell.startsWith("sem")) {
      const val = row[0].includes(":") ? row[0].substring(row[0].indexOf(":") + 1).trim() : (row[1] || "").trim();
      if (val) semester = val;
    } else if (firstCell.startsWith("time") || firstCell.startsWith("duration")) {
      const numMatch = (row[0] + " " + (row[1] || "")).match(/(\d+)/);
      if (numMatch) {
        durationMinutes = parseInt(numMatch[1], 10);
      }
    } else if (firstCell.startsWith("live on date") || firstCell.startsWith("date")) {
      const val = row[0].includes(":") ? row[0].substring(row[0].indexOf(":") + 1).trim() : (row[1] || "").trim();
      if (val) liveDate = val;
    } else if (firstCell.startsWith("start time") || firstCell.startsWith("start")) {
      const val = row[0].includes(":") ? row[0].substring(row[0].indexOf(":") + 1).trim() : (row[1] || "").trim();
      if (val) startTime = val;
    } else if (firstCell.includes("question") && (row[1] || "").toLowerCase().includes("option")) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    headerRowIndex = rows.findIndex(r => r[0] && r[0].toLowerCase().includes("question"));
  }

  const startIdx = headerRowIndex >= 0 ? headerRowIndex + 1 : 4;

  for (let r = startIdx; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length < 2) continue;

    const qText = (row[0] || "").trim();
    if (!qText) continue;

    const opt1 = (row[1] || "").trim();
    const opt2 = (row[2] || "").trim();
    const opt3 = (row[3] || "").trim();
    const opt4 = (row[4] || "").trim();
    const correctOpt = (row[5] || "").trim();

    const options = [opt1, opt2, opt3, opt4].filter(o => o.length > 0);

    questions.push({
      id: questions.length + 1,
      text: qText,
      options: options.length > 0 ? options : ["A", "B", "C", "D"],
      correctOption: correctOpt
    });
  }

  return {
    subject,
    semester,
    durationMinutes,
    liveDate,
    startTime,
    questions
  };
}

/* =========================================================
   BRIEFING VIEW RENDERING
========================================================= */

function renderBriefing(quiz) {
  // Badges
  const semBadge = document.getElementById("badgeSemester");
  const timeBadge = document.getElementById("badgeDuration");
  const dateBadge = document.getElementById("badgeDate");
  const startBadge = document.getElementById("badgeStartTime");

  if (semBadge) semBadge.textContent = `Semester ${quiz.semester || 'VII'}`;
  if (timeBadge) timeBadge.textContent = `Valid For: ${quiz.durationMinutes || 10} Minutes`;
  if (dateBadge) {
    dateBadge.textContent = quiz.liveDate || quiz.testDate || "Today";
  }
  if (startBadge) {
    if (quiz.startTime) {
      startBadge.textContent = `Start Time: ${quiz.startTime}`;
      startBadge.style.display = "inline-flex";
    } else {
      startBadge.style.display = "none";
    }
  }

  // Titles
  const titleEl = document.getElementById("quizTitle");
  if (titleEl) titleEl.textContent = `${quiz.subject || 'Testing'} Assessment`;

  const descEl = document.getElementById("quizSubtitle");
  if (descEl) {
    descEl.textContent = `Official online assessment for Semester ${quiz.semester || 'VII'} (${quiz.durationMinutes || 10} Minutes).`;
  }

  const durationNoteEl = document.getElementById("instructionsDurationNote");
  if (durationNoteEl) {
    durationNoteEl.innerHTML = `<strong>${quiz.durationMinutes || 10}-Min Timer:</strong> Auto-submits when countdown expires.`;
  }

  // Update Schedule Lock status
  updateScheduleLockUI();
}

/* =========================================================
   SCHEDULE & TIME LOCK CHECKER
========================================================= */

function getAssessmentScheduleStatus(quiz) {
  if (!quiz || !quiz.liveDate || !quiz.startTime) {
    return { status: "LIVE", message: "Assessment is active" };
  }

  // Parse DD/MM/YYYY or DD-MM-YYYY
  const dateParts = quiz.liveDate.trim().split(/[/-]/).map(Number);
  const timeParts = quiz.startTime.trim().split(":").map(Number);

  if (dateParts.length < 3 || timeParts.length < 2) {
    return { status: "LIVE", message: "Assessment is active" };
  }

  const day = dateParts[0];
  const month = dateParts[1] - 1; // 0-indexed in JS Date
  const year = dateParts[2];
  const hours = timeParts[0];
  const mins = timeParts[1];

  const scheduledStart = new Date(year, month, day, hours, mins, 0);
  if (isNaN(scheduledStart.getTime())) {
    return { status: "LIVE", message: "Assessment is active" };
  }

  const durationMs = (quiz.durationMinutes || 10) * 60 * 1000;
  // Test window stays open during duration + 45-minute grace window
  const scheduledEnd = new Date(scheduledStart.getTime() + durationMs + (45 * 60 * 1000));

  const now = new Date();

  if (now < scheduledStart) {
    return {
      status: "UPCOMING",
      scheduledStart,
      diffMs: scheduledStart.getTime() - now.getTime()
    };
  } else if (now > scheduledEnd) {
    return {
      status: "ENDED",
      scheduledStart,
      scheduledEnd
    };
  } else {
    return {
      status: "LIVE",
      scheduledStart,
      scheduledEnd
    };
  }
}

function updateScheduleLockUI() {
  const schedule = getAssessmentScheduleStatus(activeQuiz);
  const liveBadge = document.getElementById("badgeLiveStatus");
  const lockNotice = document.getElementById("scheduleLockNotice");
  const lockText = document.getElementById("scheduleLockText");
  const startBtn = document.getElementById("startAssessmentBtn");

  if (!liveBadge || !startBtn) return;

  if (schedule.status === "UPCOMING") {
    // 1. Badge -> Amber Upcoming
    liveBadge.className = "quiz-badge badge-upcoming";
    liveBadge.innerHTML = '<span class="pulse-dot-amber"></span> Upcoming Assessment';

    // 2. Lock Notice Banner
    if (lockNotice && lockText) {
      lockNotice.style.display = "flex";
      lockNotice.className = "quiz-schedule-lock-notice";
      lockText.innerHTML = `🔒 <strong>Assessment Locked:</strong> Scheduled for <strong>${activeQuiz.liveDate}</strong> at <strong>${activeQuiz.startTime}</strong>. The portal will unlock automatically at the start time.`;
    }

    // 3. Disable Start Button
    startBtn.disabled = true;
    startBtn.classList.add("is-locked");
    startBtn.innerHTML = `<span>🔒 Opens ${activeQuiz.liveDate} at ${activeQuiz.startTime}</span>`;

  } else if (schedule.status === "ENDED") {
    // 1. Badge -> Red Closed
    liveBadge.className = "quiz-badge badge-ended";
    liveBadge.innerHTML = '⛔ Assessment Closed';

    // 2. Lock Notice Banner
    if (lockNotice && lockText) {
      lockNotice.style.display = "flex";
      lockNotice.className = "quiz-schedule-lock-notice is-ended";
      lockText.innerHTML = `⛔ <strong>Assessment Concluded:</strong> This assessment closed on <strong>${activeQuiz.liveDate}</strong>.`;
    }

    // 3. Disable Start Button
    startBtn.disabled = true;
    startBtn.classList.add("is-locked");
    startBtn.innerHTML = `<span>⛔ Assessment Window Closed</span>`;

  } else {
    // LIVE
    liveBadge.className = "quiz-badge badge-live";
    liveBadge.innerHTML = '<span class="pulse-dot"></span> Live Assessment';

    if (lockNotice) {
      lockNotice.style.display = "none";
    }

    startBtn.disabled = false;
    startBtn.classList.remove("is-locked");
    startBtn.innerHTML = `<span>Start Assessment</span> <span>⏱️</span>`;
  }
}

/* =========================================================
   START ASSESSMENT HANDLER
========================================================= */

function handleStartAssessment(e) {
  e.preventDefault();

  // Enforce Schedule Gatekeeper
  const schedule = getAssessmentScheduleStatus(activeQuiz);
  if (schedule.status === "UPCOMING") {
    alert(`🔒 This assessment is scheduled for ${activeQuiz.liveDate} at ${activeQuiz.startTime}. Access is locked until the scheduled start time.`);
    return;
  }
  if (schedule.status === "ENDED") {
    alert(`⛔ This assessment has concluded.`);
    return;
  }

  const nameInput = document.getElementById("studentName");
  const rollInput = document.getElementById("studentSap");
  const emailInput = document.getElementById("studentEmail");
  const agreeCheck = document.getElementById("agreementCheck");

  const nameVal = nameInput ? nameInput.value.trim() : "";
  const rollVal = rollInput ? rollInput.value.trim() : "";
  const emailVal = emailInput ? emailInput.value.trim() : "";

  if (!nameVal) {
    showInputError("studentName", "Please enter your full name.");
    return;
  }
  if (!rollVal) {
    showInputError("studentSap", "Please enter your Roll No or SAP ID.");
    return;
  }
  if (!emailVal || !emailVal.includes("@")) {
    showInputError("studentEmail", "Please enter a valid email address.");
    return;
  }
  if (!agreeCheck || !agreeCheck.checked) {
    alert("Please accept the assessment declaration before proceeding.");
    return;
  }

  currentCandidate = {
    name: nameVal,
    rollNo: rollVal,
    email: emailVal,
    subject: activeQuiz.subject,
    semester: activeQuiz.semester,
    startTime: Date.now(),
    startedAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  };

  sessionStorage.setItem(CANDIDATE_STORAGE_KEY, JSON.stringify(currentCandidate));

  launchActiveExamView();
}

function showInputError(inputId, message) {
  const errEl = document.getElementById(`${inputId}Error`);
  if (errEl) {
    errEl.textContent = message;
    errEl.style.display = "block";
    const input = document.getElementById(inputId);
    if (input) {
      input.focus();
      input.addEventListener("input", () => {
        errEl.style.display = "none";
      }, { once: true });
    }
  }
}

/* =========================================================
   LAUNCH ACTIVE EXAM VIEW
========================================================= */

function launchActiveExamView() {
  const briefingContainer = document.getElementById("quizBriefingContainer");
  const examView = document.getElementById("examView");

  if (briefingContainer) briefingContainer.style.display = "none";
  if (examView) examView.style.display = "block";

  window.scrollTo({ top: 0, behavior: "smooth" });

  // Update Sticky Bar Metadata
  const examTitle = document.getElementById("examBarTitle");
  const examStudentInfo = document.getElementById("examBarStudentInfo");
  if (examTitle) examTitle.textContent = `${activeQuiz.subject} (Sem ${activeQuiz.semester})`;
  if (examStudentInfo) {
    examStudentInfo.textContent = `Candidate: ${currentCandidate.name} | Roll No: ${currentCandidate.rollNo}`;
  }

  // Render Questions
  renderNativeQuestions(activeQuiz.questions);

  // Setup Countdown Timer
  totalDurationSeconds = (activeQuiz.durationMinutes || 15) * 60;
  secondsRemaining = totalDurationSeconds;
  isSubmitted = false;
  isSubmitting = false;

  updateTimerDisplay();

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(tickTimer, 1000);

  setupAntiCheat();
}

/* =========================================================
   RENDER QUESTIONS (NATIVE CARDS WITH RADIO SELECTION)
========================================================= */

function renderNativeQuestions(questions) {
  const container = document.getElementById("questionsContainer");
  if (!container) return;

  container.innerHTML = "";

  questions.forEach((q, index) => {
    const card = document.createElement("div");
    card.className = "question-card";
    card.id = `qCard_${q.id}`;

    // Header with Question number pill
    const header = document.createElement("div");
    header.className = "question-header";
    header.innerHTML = `
      <div class="question-number-pill">Question ${index + 1} of ${questions.length}</div>
      <div class="question-title-text">
        ${escapeHtml(q.text)} <span class="req-star">*</span>
      </div>
    `;
    card.appendChild(header);

    // Options Grid
    const optionsGrid = document.createElement("div");
    optionsGrid.className = "options-grid";

    q.options.forEach((optText, optIdx) => {
      const optId = `q_${q.id}_opt_${optIdx}`;
      const label = document.createElement("label");
      label.className = "option-label";
      label.htmlFor = optId;

      label.innerHTML = `
        <input 
          type="radio" 
          id="${optId}" 
          name="question_${q.id}" 
          value="${escapeHtml(optText)}" 
          required 
        />
        <div class="custom-radio"></div>
        <div class="option-text">${escapeHtml(optText)}</div>
      `;

      const input = label.querySelector("input");
      input.addEventListener("change", () => {
        optionsGrid.querySelectorAll(".option-label").forEach(l => l.classList.remove("is-selected"));
        if (input.checked) {
          label.classList.add("is-selected");
          userAnswers[q.id] = optText;
        }
      });

      optionsGrid.appendChild(label);
    });

    card.appendChild(optionsGrid);
    container.appendChild(card);
  });
}

function escapeHtml(text) {
  if (!text) return "";
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

/* =========================================================
   TIMER TICK & COUNTDOWN
========================================================= */

function tickTimer() {
  if (isSubmitted || isSubmitting) return;

  secondsRemaining--;

  if (secondsRemaining <= 0) {
    clearInterval(timerInterval);
    secondsRemaining = 0;
    updateTimerDisplay();
    handleAutoSubmitOnExpiry();
    return;
  }

  updateTimerDisplay();

  // Color alerts
  if (secondsRemaining === 300) {
    showToastNotification("⚠️ 5 Minutes Remaining! Ensure you have answered all questions.", "warning");
  } else if (secondsRemaining === 120) {
    showToastNotification("🚨 2 Minutes Remaining! Test will auto-submit at 00:00.", "danger");
  }
}

function updateTimerDisplay() {
  const timerDisplay = document.getElementById("timerDisplay");
  const progressFill = document.getElementById("timerProgressFill");

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  if (timerDisplay) {
    timerDisplay.textContent = timeFormatted;

    if (secondsRemaining <= 120) {
      timerDisplay.className = "exam-timer-display timer-urgent";
    } else if (secondsRemaining <= 300) {
      timerDisplay.className = "exam-timer-display timer-warning";
    } else {
      timerDisplay.className = "exam-timer-display";
    }
  }

  if (progressFill && totalDurationSeconds > 0) {
    const percent = (secondsRemaining / totalDurationSeconds) * 100;
    progressFill.style.width = `${percent}%`;
  }
}

/* =========================================================
   SUBMISSION & AUTOMATED MARKS EVALUATION
========================================================= */

function handleManualSubmit(e) {
  e.preventDefault();

  if (isSubmitted || isSubmitting) return;

  // Check unanswered questions
  const totalQuestions = activeQuiz.questions.length;
  const answeredCount = Object.keys(userAnswers).length;
  let confirmMsg = "Are you sure you want to submit your assessment? Your marks will be finalized and recorded.";

  if (answeredCount < totalQuestions) {
    const unanswered = totalQuestions - answeredCount;
    confirmMsg = `⚠️ You have ${unanswered} unanswered question(s). Are you sure you want to submit now?`;
  }

  if (!confirm(confirmMsg)) {
    return;
  }

  evaluateAndSubmitMarks(false);
}

function handleAutoSubmitOnExpiry() {
  if (isSubmitted || isSubmitting) return;
  showToastNotification("⏱️ Time expired! Auto-evaluating and uploading marks...", "warning");
  evaluateAndSubmitMarks(true);
}

/**
 * 1. Automatically computes marks
 * 2. Uploads marks to Google Sheet (Tab GID: 2126279517)
 * 3. Shows the Scorecard & Confirmation Receipt
 */
async function evaluateAndSubmitMarks(isAutoExpiry = false) {
  if (isSubmitted || isSubmitting) return;
  isSubmitting = true;
  isSubmitted = true;
  clearInterval(timerInterval);

  // Disable submit buttons
  const submitBtns = document.querySelectorAll("button[type='submit']");
  submitBtns.forEach(btn => {
    btn.disabled = true;
    btn.textContent = "Uploading Marks...";
  });

  // Calculate Time Spent
  const elapsedSecs = totalDurationSeconds - secondsRemaining;
  const elapsedMins = Math.floor(elapsedSecs / 60);
  const elapsedRemSecs = elapsedSecs % 60;
  const timeSpentStr = `${elapsedMins}m ${elapsedRemSecs}s`;

  // 1. Evaluate Marks against correct answers from Google Sheet
  let marksObtained = 0;
  const totalQuestions = activeQuiz.questions.length;
  const detailedAnswers = [];

  activeQuiz.questions.forEach(q => {
    const selectedAnswer = userAnswers[q.id] || "Not Answered";
    const correct = isAnswerCorrect(q, selectedAnswer);

    if (correct) {
      marksObtained++;
    }

    detailedAnswers.push({
      id: q.id,
      question: q.text,
      selected: selectedAnswer,
      correctOption: q.correctOption,
      isCorrect: correct
    });
  });

  const percentage = Math.round((marksObtained / (totalQuestions || 1)) * 100);

  // Build Payload to push to Google Sheet
  const payload = {
    timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    rollNo: currentCandidate ? currentCandidate.rollNo : "",
    studentName: currentCandidate ? currentCandidate.name : "",
    email: currentCandidate ? currentCandidate.email : "",
    subject: activeQuiz.subject || "EVSD",
    semester: activeQuiz.semester || "VII",
    marksObtained: marksObtained,
    totalMarks: totalQuestions,
    percentage: `${percentage}%`,
    timeTaken: timeSpentStr,
    autoSubmitted: isAutoExpiry,
    targetGid: "2126279517",
    answers: detailedAnswers,
    answersSummary: detailedAnswers.map(a => `Q${a.id}: ${a.selected} (${a.isCorrect ? '✓' : '✗'})`).join(" | ")
  };

  // 2. Local Backup: Guarantee no marks are lost even if offline
  saveSubmissionLocally(payload);

  // 3. Upload Marks to Google Sheet via Apps Script Webhook
  let uploadStatusText = "Submitted";
  if (GOOGLE_APPS_SCRIPT_MARKS_WEBHOOK_URL) {
    try {
      await fetch(GOOGLE_APPS_SCRIPT_MARKS_WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      uploadStatusText = "Submitted";
      console.log("Marks pushed to Google Sheet Webhook:", payload);
    } catch (err) {
      console.warn("Webhook push error (response saved locally):", err);
      uploadStatusText = "Submitted";
    }
  } else {
    uploadStatusText = "Submitted";
  }

  // 4. Render Scorecard & Confirmation Receipt
  renderScorecardAndReceipt({
    ...payload,
    uploadStatusText
  });
}

/**
 * Smart answer verification:
 * Compares student answer with correct answer from the sheet
 * (handles 'A', 'Option 1', or exact text matching)
 */
function isAnswerCorrect(question, studentSelection) {
  if (!studentSelection || studentSelection === "Not Answered" || !question.correctOption) {
    return false;
  }

  const userClean = studentSelection.trim().toLowerCase();
  const correctClean = question.correctOption.trim().toLowerCase();

  // Exact string match
  if (userClean === correctClean) return true;

  // Option Letter match (A, B, C, D)
  const letterMap = { 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
  if (correctClean in letterMap) {
    const targetIdx = letterMap[correctClean];
    if (question.options[targetIdx] && question.options[targetIdx].trim().toLowerCase() === userClean) {
      return true;
    }
    if (userClean === correctClean) return true;
  }

  // "Option 1", "Option 2" format
  const optMatch = correctClean.match(/option\s*(\d+)/i);
  if (optMatch) {
    const idx = parseInt(optMatch[1], 10) - 1;
    if (question.options[idx] && question.options[idx].trim().toLowerCase() === userClean) {
      return true;
    }
  }

  return false;
}

function saveSubmissionLocally(submissionData) {
  try {
    const existing = JSON.parse(localStorage.getItem(SUBMISSIONS_STORAGE_KEY) || "[]");
    existing.unshift(submissionData);
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(existing.slice(0, 50)));
  } catch (e) {
    console.warn("Local storage write error", e);
  }
}

/* =========================================================
   SCORECARD & RECEIPT VIEW
========================================================= */

function renderScorecardAndReceipt(result) {
  const examView = document.getElementById("examView");
  const successView = document.getElementById("examSuccessView");

  if (examView) examView.style.display = "none";
  if (successView) successView.style.display = "block";

  window.scrollTo({ top: 0, behavior: "smooth" });

  // Scorecard Numbers
  const marksObtEl = document.getElementById("receiptMarksObtained");
  const totalMarksEl = document.getElementById("receiptTotalMarks");
  const pillEl = document.getElementById("receiptPercentagePill");
  const subEl = document.getElementById("scorecardSub");

  if (marksObtEl) marksObtEl.textContent = result.marksObtained;
  if (totalMarksEl) totalMarksEl.textContent = `/ ${result.totalMarks}`;
  if (pillEl) pillEl.textContent = result.percentage;
  if (subEl) {
    subEl.textContent = `${result.subject} Term Assessment (${result.semester})`;
  }

  // Detailed Receipt Table
  const receiptContainer = document.getElementById("receiptContent");
  if (receiptContainer) {
    receiptContainer.innerHTML = `
      <div class="receipt-row">
        <span class="receipt-label">Student Name:</span>
        <span class="receipt-value">${escapeHtml(result.studentName)}</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-label">Roll No / SAP ID:</span>
        <span class="receipt-value">${escapeHtml(result.rollNo.replace(/^'/, ''))}</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-label">Email ID:</span>
        <span class="receipt-value">${escapeHtml(result.email)}</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-label">Subject & Semester:</span>
        <span class="receipt-value">${escapeHtml(result.subject)} — Semester ${escapeHtml(result.semester)}</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-label">Marks Obtained:</span>
        <span class="receipt-value" style="color: #34d399; font-weight: 700; font-size: 1.1rem;">
          ${result.marksObtained} / ${result.totalMarks} (${result.percentage})
        </span>
      </div>
      <div class="receipt-row">
        <span class="receipt-label">Time Taken:</span>
        <span class="receipt-value">${result.timeTaken}</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-label">Submission Status:</span>
        <span class="receipt-value" style="color: #34d399; font-weight: 600;">Submitted</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-label">Submission Time:</span>
        <span class="receipt-value">${result.timestamp}</span>
      </div>
    `;
  }
}

/* =========================================================
   ANTI-CHEAT SYSTEM
========================================================= */

function setupAntiCheat() {
  tabSwitchCount = 0;
  const violationBadge = document.getElementById("violationBadge");

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("blur", handleWindowBlur);

  function handleVisibilityChange() {
    if (document.hidden && !isSubmitted && !isSubmitting) {
      logViolation("Tab switch or browser minimized");
    }
  }

  function handleWindowBlur() {
    if (!document.hidden && !isSubmitted && !isSubmitting) {
      logViolation("Focus left the exam window");
    }
  }

  function logViolation(reason) {
    tabSwitchCount++;
    if (violationBadge) {
      violationBadge.style.display = "inline-flex";
      violationBadge.textContent = `⚠️ Violations: ${tabSwitchCount}`;
    }

    if (tabSwitchCount === 1) {
      showToastNotification(`⚠️ Warning (1/3): ${reason}. Please stay on this tab!`, "warning");
    } else if (tabSwitchCount >= 3) {
      showToastNotification(`🚨 Multiple tab switches recorded (${tabSwitchCount})! This will be flagged on your record.`, "danger");
    }
  }
}

/* =========================================================
   TOAST NOTIFICATIONS
========================================================= */

function showToastNotification(message, type = "info") {
  let toastContainer = document.getElementById("quizToastContainer");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "quizToastContainer";
    toastContainer.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 380px;
    `;
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  const bg = type === "danger" ? "#dc2626" : type === "warning" ? "#d97706" : "#2563eb";
  toast.style.cssText = `
    background: ${bg};
    color: #ffffff;
    padding: 14px 18px;
    border-radius: 12px;
    font-size: 0.92rem;
    font-weight: 500;
    box-shadow: 0 10px 25px rgba(0,0,0,0.4);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 10px;
  `;
  toast.innerHTML = `<span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 350);
  }, 4500);
}
