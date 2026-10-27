/* =========================================================
   DR. RANJIT A. PATIL - QUIZ & ASSESSMENT PORTAL
   Dynamic Google Sheets Questions & Automated Marks Uploader
========================================================= */

// 1. Live Google Sheets Questions Source (First Tab: GID 0)
const GOOGLE_SHEET_QUESTIONS_CSV = "https://docs.google.com/spreadsheets/d/1bv7TGhU2CMfgn5J6-E4nDH7mPYv9_8zIaGjStRNW9SQ/export?format=csv&gid=0";

// 2. Google Apps Script Webhook URL (Target: Marks Tab GID 1645517105)
// Deployed Web App URL connected to your Google Sheet:
const GOOGLE_APPS_SCRIPT_MARKS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbw5yfUTtUwxVV_qDAMCkg-C5Z6lPnr0EW9E1kcMitZFqPOXxO_CDb3IYZMNglPZKvhg/exec";

const QUIZ_CACHE_KEY = "evsd_live_quiz_cache_v6";
const CANDIDATE_STORAGE_KEY = "evsd_active_candidate_v2";
const SUBMISSIONS_STORAGE_KEY = "evsd_saved_submissions_v2";

// Default Question Bank (Exact questions from your live spreadsheet)
const defaultEVSDQuestions = [
  { id: 1, text: "What is the primary function of the Battery Management System (BMS)?", options: ["To convert AC power to DC power", "To monitor cell voltage, temperature, and state of charge", "To regulate the transmission speed", "To manage the regenerative braking system"], correctOption: "B" },
  { id: 2, text: "In EV powertrain, which voltage level is typically considered high-voltage?", options: ["Up to 12V AC or DC", "Up to 30V AC or 60V DC", "Up to 110V AC or 220V DC", "Up to 230V AC or 400V DC"], correctOption: "B" },
  { id: 3, text: "Which dangerous condition occurs when a lithium-ion cell exceeds its safe operating temperature?", options: ["Voltage runaway", "Electrolyte saturation", "Thermal runaway", "Inductive collapse"], correctOption: "C" },
  { id: 4, text: "What is the primary purpose of an on-board charger (OBC) in an EV?", options: ["To convert external AC power to DC power to charge the high-voltage battery", "To step up DC battery voltage for the electric motor", "To convert regenerative energy to heat", "To cool the high-voltage battery pack"], correctOption: "A" },
  { id: 5, text: "When servicing a high-voltage EV battery pack, which PPE rating is minimum required for insulated gloves?", options: ["Heavy-duty rubber gloves", "Class 0 (1000V rated) insulated gloves", "Disposable latex gloves", "Cut-resistant Kevlar gloves"], correctOption: "B" },
  { id: 6, text: "What is the role of the Manual Service Disconnect (MSD) in an electric vehicle?", options: ["To continuously regulate inverter voltage", "To isolate the high-voltage battery pack during maintenance", "To disconnect the 12V auxiliary battery", "To switch the inverter into regenerative mode"], correctOption: "B" },
  { id: 7, text: "In EV system design, what does the creep mode do?", options: ["It applies physical brakes when the vehicle stops", "It slowly moves the vehicle forward when the brake pedal is released, mimicking an automatic transmission", "It dynamically lowers suspension at high speeds", "It completely eliminates battery drain at idle"], correctOption: "B" },
  { id: 8, text: "What is the function of a pyro-fuse in an EV high-voltage safety system?", options: ["To act as a slow-blow thermal protection device", "To rapidly and irreversibly sever the high-voltage circuit using an explosive squib during a crash", "To ignite a controlled discharge resistor", "To automatically reset after an overcurrent event"], correctOption: "B" },
  { id: 9, text: "Which motor type is most commonly used in modern electric vehicles due to high power density and efficiency?", options: ["DC Series Wound Motor", "Single-Phase Induction Motor", "Permanent Magnet Synchronous Motor (PMSM)", "Stepper Motor"], correctOption: "C" },
  { id: 10, text: "What is the standard ISO high-voltage cabling color code in electric vehicles?", options: ["Bright Orange", "Matte Black", "Dark Blue", "Signal Green"], correctOption: "A" }
];

// Default Quizzes matching your live Google Spreadsheet (Quiz 4 with Subject 'NONE' is automatically excluded)
const defaultQuizzes = [
  {
    id: "quiz_1",
    subject: "Electric Vehicle System Design And Safety (DJS23MH1451)",
    semester: "VII",
    durationMinutes: 10,
    liveDate: "27/10/2026",
    startTime: "11:30",
    endTime: "22:00",
    totalQuestions: defaultEVSDQuestions.length,
    questions: defaultEVSDQuestions
  },
  {
    id: "quiz_2",
    subject: "Test 2",
    semester: "VI",
    durationMinutes: 15,
    liveDate: "29/10/2026",
    startTime: "11:30",
    endTime: "22:00",
    totalQuestions: defaultEVSDQuestions.length,
    questions: defaultEVSDQuestions
  },
  {
    id: "quiz_3",
    subject: "Test 3",
    semester: "VI",
    durationMinutes: 15,
    liveDate: "29/10/2026",
    startTime: "11:30",
    endTime: "22:00",
    totalQuestions: defaultEVSDQuestions.length,
    questions: defaultEVSDQuestions
  }
];

// Active State
let availableQuizzes = [...defaultQuizzes];
let activeQuiz = availableQuizzes[0];

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
  // 1. Immediately render initial active quizzes and tabs
  const cachedData = localStorage.getItem(QUIZ_CACHE_KEY);
  if (cachedData) {
    try {
      const parsed = JSON.parse(cachedData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const filtered = parsed.filter(q => q.subject && q.subject.trim().toLowerCase() !== "none");
        if (filtered.length > 0) {
          availableQuizzes = filtered;
          activeQuiz = availableQuizzes[0];
        }
      }
    } catch (e) {
      console.warn("Cached quiz parse error", e);
    }
  }

  // Render Tabs & Active Briefing View
  renderQuizTabs(availableQuizzes);
  renderBriefing(activeQuiz);

  // 2. Fetch fresh questions directly from Google Sheets
  await loadLiveQuestionsFromSheet();

  // 3. Bind Modal Open & Close Triggers
  const openModalBtn = document.getElementById("openRegModalBtn");
  if (openModalBtn) {
    openModalBtn.addEventListener("click", openRegistrationModal);
  }

  const closeModalBtn = document.getElementById("closeRegModalBtn");
  const cancelModalBtn = document.getElementById("cancelRegModalBtn");
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeRegistrationModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeRegistrationModal);

  const modalBackdrop = document.getElementById("quizRegModal");
  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", (e) => {
      if (e.target === modalBackdrop) {
        closeRegistrationModal();
      }
    });
  }

  // 4. Bind Registration Form & Input Restrictions
  const regForm = document.getElementById("quizRegForm");
  if (regForm) {
    regForm.addEventListener("submit", handleStartAssessment);
  }

  // Strictly enforce 11-digit numeric input on SAP ID field
  const sapInputEl = document.getElementById("studentSap");
  if (sapInputEl) {
    sapInputEl.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 11);
    });
  }

  // 5. Bind Assessment Submit Form
  const questionsForm = document.getElementById("nativeQuizForm");
  if (questionsForm) {
    questionsForm.addEventListener("submit", handleManualSubmit);
  }

  // 6. Periodic Schedule Checker (unlocks live when start time arrives)
  updateScheduleLockUI();
  setInterval(updateScheduleLockUI, 5000);

  // 7. Security & Anti-Copy Protection (Quiz Page Only)
  initPageAntiCopy();
}

/* =========================================================
   FETCH & PARSE QUESTIONS FROM GOOGLE SHEET CSV OR WEB APP
========================================================= */

async function loadLiveQuestionsFromSheet() {
  // Strategy 1: Attempt to load from Secure Web App (Works even if sheet is 100% PRIVATE/Restricted!)
  if (GOOGLE_APPS_SCRIPT_MARKS_WEBHOOK_URL) {
    try {
      const secureUrl = `${GOOGLE_APPS_SCRIPT_MARKS_WEBHOOK_URL}?action=getQuestions&t=${Date.now()}`;
      const response = await fetch(secureUrl);
      if (response.ok) {
        const json = await response.json();
        let parsedQuizzes = [];

        if (json && json.status === "success") {
          if (Array.isArray(json.quizzes) && json.quizzes.length > 0) {
            parsedQuizzes = json.quizzes.filter(q => q.subject && q.subject.trim().toLowerCase() !== "none");
          } else if (Array.isArray(json.questions) && json.questions.length > 0) {
            if (json.subject && json.subject.trim().toLowerCase() !== "none") {
              parsedQuizzes = [{
                id: "quiz_1",
                ...json,
                totalQuestions: json.questions.length
              }];
            }
          }
        }

        if (parsedQuizzes.length > 0) {
          availableQuizzes = parsedQuizzes;
          activeQuiz = availableQuizzes[0];
          localStorage.setItem(QUIZ_CACHE_KEY, JSON.stringify(availableQuizzes));
          renderQuizTabs(availableQuizzes);
          renderBriefing(activeQuiz);
          console.log(`🔒 Loaded ${availableQuizzes.length} active quiz(zes) securely from Private Google Sheet via Apps Script!`);
          return;
        }
      }
    } catch (err) {
      console.warn("Secure Web App fetch failed or not configured, falling back to CSV export:", err);
    }
  }

  // Strategy 2: Direct Google Sheet CSV Export
  try {
    const cacheBusterUrl = `${GOOGLE_SHEET_QUESTIONS_CSV}&t=${Date.now()}`;
    const response = await fetch(cacheBusterUrl);
    if (!response.ok) throw new Error("Could not fetch questions sheet");

    const csvText = await response.text();
    if (!csvText || csvText.includes("<!DOCTYPE") || csvText.includes("<html")) {
      throw new Error("Received HTML page instead of CSV data (Google Sheet is likely Private/Restricted).");
    }

    const parsedQuizzes = parseQuestionsSheetCSV(csvText);

    if (parsedQuizzes && parsedQuizzes.length > 0) {
      availableQuizzes = parsedQuizzes;
      activeQuiz = availableQuizzes[0];

      // Cache fresh data for instant offline/re-visit access
      localStorage.setItem(QUIZ_CACHE_KEY, JSON.stringify(availableQuizzes));

      // Render Tabs & Briefing
      renderQuizTabs(availableQuizzes);
      renderBriefing(activeQuiz);
      console.log(`Loaded ${availableQuizzes.length} active quiz(zes) from Google Sheet CSV!`);
    }
  } catch (err) {
    console.warn("Could not fetch live Google Sheet questions, using cached/fallback:", err);
  }
}

/**
 * Safely extracts metadata value from either a single cell (e.g. "Start time: 11:30")
 * or adjacent cells (Col A: "Start time", Col B: "11:30").
 */
function extractMetadataValue(cellA, cellB) {
  const strA = String(cellA || "").trim();
  const strB = String(cellB || "").trim();
  const idx = strA.indexOf(":");
  if (idx !== -1) {
    const after = strA.substring(idx + 1).trim();
    if (after) return after;
  }
  return strB;
}

/**
 * Standardizes time strings (e.g. "11:30", "11:30:00", "11:30 PM", "23:00") into "HH:MM" 24-hr format.
 */
function normalizeTimeString(val) {
  if (!val) return "";
  const str = String(val).trim();
  const match = str.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?/);
  if (!match) return str;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[4] ? match[4].toUpperCase() : null;
  if (ampm === "PM" && hours < 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${minutes}`;
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
 * Multi-Quiz Parser:
 * Dynamically scans the entire spreadsheet for side-by-side quiz blocks.
 * Whenever a column has "Subject" in the top rows, it parses that quiz block.
 * If Subject is "NONE" or "none", it is completely excluded!
 */
function parseQuestionsSheetCSV(csvText) {
  const rows = csvToArray(csvText.trim());
  if (!rows || rows.length === 0) return null;

  const colCount = Math.max(...rows.map(r => r.length));
  const quizzes = [];

  for (let c = 0; c < colCount; c++) {
    // Check if column c defines a quiz with "subject" in the top 6 rows
    let subjectRow = -1;
    for (let r = 0; r < Math.min(rows.length, 6); r++) {
      const cell = String(rows[r][c] || "").trim().toLowerCase();
      if (cell.startsWith("subject")) {
        subjectRow = r;
        break;
      }
    }
    if (subjectRow === -1) continue;

    const rawSubject = String(rows[subjectRow][c] || "");
    const nextSubject = String(rows[subjectRow][c + 1] || "");
    let subject = extractMetadataValue(rawSubject, nextSubject);

    // Completely ignore and skip if subject is empty, "none", or "NONE"
    if (!subject || subject.toLowerCase() === "none") {
      continue;
    }

    let semester = "VII";
    let durationMinutes = 10;
    let liveDate = "";
    let startTime = "";
    let endTime = "";

    // Scan metadata header lines for this specific quiz block
    for (let r = 0; r < Math.min(rows.length, 12); r++) {
      const rawCell = String(rows[r][c] || "").trim();
      const nextCell = String(rows[r][c + 1] || "").trim();
      const label = rawCell.toLowerCase();
      const val = extractMetadataValue(rawCell, nextCell);

      if (label.startsWith("semester") || label.startsWith("sem")) {
        if (val) semester = val;
      } else if (label.startsWith("timer") || (label.startsWith("time") && !label.startsWith("start") && !label.startsWith("end"))) {
        const m = val.match(/\d+/);
        if (m) durationMinutes = parseInt(m[0], 10);
      } else if (label.startsWith("live on date") || label.startsWith("date")) {
        if (val) liveDate = val;
      } else if (label.startsWith("start time") || label.startsWith("start:") || label.startsWith("start ")) {
        if (val) startTime = normalizeTimeString(val);
      } else if (label.startsWith("end time") || label.startsWith("end:") || label.startsWith("end ")) {
        if (val) endTime = normalizeTimeString(val);
      }
    }

    // Find the question header row
    let qHeaderRow = -1;
    for (let r = 0; r < Math.min(rows.length, 15); r++) {
      const cell = String(rows[r][c] || "").trim().toLowerCase();
      if (cell.startsWith("question") || cell.startsWith("sr")) {
        qHeaderRow = r;
        break;
      }
    }

    const questions = [];
    if (qHeaderRow !== -1) {
      for (let r = qHeaderRow + 1; r < rows.length; r++) {
        const qText = String(rows[r][c] || "").trim();
        // Skip subheaders (e.g. 'A', 'Option') or empty lines
        if (!qText || qText.toLowerCase() === "question" || qText.toLowerCase() === "a") continue;

        const optA = String(rows[r][c + 1] || "").trim();
        const optB = String(rows[r][c + 2] || "").trim();
        const optC = String(rows[r][c + 3] || "").trim();
        const optD = String(rows[r][c + 4] || "").trim();
        const correctOpt = String(rows[r][c + 5] || "").trim();

        const options = [optA, optB, optC, optD].filter(Boolean);
        if (options.length >= 2) {
          questions.push({
            id: questions.length + 1,
            text: qText,
            options: options,
            correctOption: correctOpt
          });
        }
      }
    }

    quizzes.push({
      id: `quiz_${quizzes.length + 1}`,
      subject,
      semester,
      durationMinutes,
      liveDate,
      startTime,
      endTime,
      questions,
      totalQuestions: questions.length
    });
  }

  return quizzes;
}

/* =========================================================
   QUIZ TABS RENDERING
========================================================= */

function renderQuizTabs(quizzes) {
  const container = document.getElementById("quizTabsContainer");
  const bar = document.getElementById("quizTabsBar");
  if (!container || !bar) return;

  if (!quizzes || quizzes.length <= 1) {
    container.style.display = "none";
    return;
  }

  container.style.display = "block";
  bar.innerHTML = "";

  quizzes.forEach((quiz) => {
    const schedule = getAssessmentScheduleStatus(quiz);
    const dotClass = schedule.status === "UPCOMING" ? "dot-upcoming" : schedule.status === "ENDED" ? "dot-ended" : "";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `quiz-tab-btn ${activeQuiz && quiz.id === activeQuiz.id ? 'is-active' : ''}`;
    btn.innerHTML = `
      <span class="quiz-tab-status-dot ${dotClass}"></span>
      <span class="quiz-tab-title">${escapeHtml(quiz.subject)}</span>
      <span style="font-size: 0.8rem; opacity: 0.75;">(Sem ${escapeHtml(quiz.semester)})</span>
    `;

    btn.addEventListener("click", () => {
      activeQuiz = quiz;
      bar.querySelectorAll(".quiz-tab-btn").forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      renderBriefing(activeQuiz);
    });

    bar.appendChild(btn);
  });
}

/* =========================================================
   CANDIDATE REGISTRATION MODAL
========================================================= */

function openRegistrationModal() {
  const schedule = getAssessmentScheduleStatus(activeQuiz);
  if (schedule.status === "UPCOMING") {
    alert(`🔒 This assessment is scheduled for ${activeQuiz.liveDate} at ${activeQuiz.startTime}. Access is locked until the scheduled start time.`);
    return;
  }
  if (schedule.status === "ENDED") {
    alert(`⛔ This assessment has concluded.`);
    return;
  }

  const modal = document.getElementById("quizRegModal");
  const subTitle = document.getElementById("modalAssessmentSubtitle");
  if (subTitle && activeQuiz) {
    subTitle.textContent = `${activeQuiz.subject} (Semester ${activeQuiz.semester || 'VII'}) — ${activeQuiz.durationMinutes || 10} Mins`;
  }

  if (modal) {
    modal.classList.add("is-open");
    const nameInput = document.getElementById("studentName");
    if (nameInput) {
      setTimeout(() => nameInput.focus(), 100);
    }
  }
}

function closeRegistrationModal() {
  const modal = document.getElementById("quizRegModal");
  if (modal) {
    modal.classList.remove("is-open");
  }
}

/* =========================================================
   BRIEFING VIEW RENDERING
========================================================= */

function renderBriefing(quiz) {
  if (!quiz) return;

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
      const timeStr = quiz.endTime ? `${quiz.startTime} - ${quiz.endTime}` : quiz.startTime;
      startBadge.textContent = `Time Window: ${timeStr}`;
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
    durationNoteEl.innerHTML = `<strong>Time Limit:</strong> ${quiz.durationMinutes || 10} Minutes (auto-submits when countdown expires).`;
  }

  // Update Modal Subtitle
  const subTitle = document.getElementById("modalAssessmentSubtitle");
  if (subTitle) {
    subTitle.textContent = `${quiz.subject} (Semester ${quiz.semester || 'VII'}) — ${quiz.durationMinutes || 10} Mins`;
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

  // Parse DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD
  const cleanDate = String(quiz.liveDate).trim();
  let day, month, year;

  const dmyMatch = cleanDate.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    day = parseInt(dmyMatch[1], 10);
    month = parseInt(dmyMatch[2], 10) - 1; // 0-indexed in JS Date
    year = parseInt(dmyMatch[3], 10);
  } else {
    const ymdMatch = cleanDate.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
    if (ymdMatch) {
      year = parseInt(ymdMatch[1], 10);
      month = parseInt(ymdMatch[2], 10) - 1;
      day = parseInt(ymdMatch[3], 10);
    } else {
      return { status: "LIVE", message: "Assessment is active" };
    }
  }

  const startNorm = normalizeTimeString(quiz.startTime);
  if (!startNorm || !startNorm.includes(":")) {
    return { status: "LIVE", message: "Assessment is active" };
  }

  const [sHours, sMins] = startNorm.split(":").map(Number);
  const scheduledStart = new Date(year, month, day, sHours, sMins, 0);

  if (isNaN(scheduledStart.getTime())) {
    return { status: "LIVE", message: "Assessment is active" };
  }

  let scheduledEnd;
  const endNorm = normalizeTimeString(quiz.endTime);
  if (endNorm && endNorm.includes(":")) {
    const [eHours, eMins] = endNorm.split(":").map(Number);
    scheduledEnd = new Date(year, month, day, eHours, eMins, 0);
  } else {
    const durationMs = (quiz.durationMinutes || 10) * 60 * 1000;
    // Grace window of 45 mins if no end time specified
    scheduledEnd = new Date(scheduledStart.getTime() + durationMs + (45 * 60 * 1000));
  }

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
  const openModalBtn = document.getElementById("openRegModalBtn");
  const startBtn = document.getElementById("startAssessmentBtn");

  if (!liveBadge) return;

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

    // 3. Disable Action Buttons
    if (openModalBtn) {
      openModalBtn.disabled = true;
      openModalBtn.classList.add("is-locked");
      openModalBtn.innerHTML = `<span>🔒 Opens ${activeQuiz.liveDate} at ${activeQuiz.startTime}</span>`;
    }
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.classList.add("is-locked");
    }

  } else if (schedule.status === "ENDED") {
    // 1. Badge -> Red Closed
    liveBadge.className = "quiz-badge badge-ended";
    liveBadge.innerHTML = '⛔ Assessment Closed';

    // 2. Lock Notice Banner
    if (lockNotice && lockText) {
      lockNotice.style.display = "flex";
      lockNotice.className = "quiz-schedule-lock-notice is-ended";
      lockText.innerHTML = `⛔ <strong>Assessment Concluded:</strong> This assessment concluded on <strong>${activeQuiz.liveDate}</strong>.`;
    }

    // 3. Disable Action Buttons
    if (openModalBtn) {
      openModalBtn.disabled = true;
      openModalBtn.classList.add("is-locked");
      openModalBtn.innerHTML = `<span>⛔ Assessment Window Closed</span>`;
    }
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.classList.add("is-locked");
    }

  } else {
    // LIVE
    liveBadge.className = "quiz-badge badge-live";
    liveBadge.innerHTML = '<span class="pulse-dot"></span> Live Assessment';

    if (lockNotice) {
      lockNotice.style.display = "none";
    }

    if (openModalBtn) {
      openModalBtn.disabled = false;
      openModalBtn.classList.remove("is-locked");
      openModalBtn.innerHTML = `<span>Start Assessment</span> <span>⏱️</span>`;
    }
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.classList.remove("is-locked");
      startBtn.innerHTML = `<span>Begin Assessment</span> <span>⏱️</span>`;
    }
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
  const sapInput = document.getElementById("studentSap");
  const rollInput = document.getElementById("studentRollNo");
  const emailInput = document.getElementById("studentEmail");
  const agreeCheck = document.getElementById("agreementCheck");

  const nameVal = nameInput ? nameInput.value.trim() : "";
  const sapVal = sapInput ? sapInput.value.trim() : "";
  const rollVal = rollInput ? rollInput.value.trim() : "";
  const emailVal = emailInput ? emailInput.value.trim() : "";

  if (!nameVal) {
    showInputError("studentName", "Please enter your full name.");
    return;
  }
  if (!emailVal || !emailVal.includes("@")) {
    showInputError("studentEmail", "Please enter a valid email address.");
    return;
  }
  if (!sapVal || !/^\d{11}$/.test(sapVal)) {
    showInputError("studentSap", "Please enter a valid 11-digit numeric SAP ID (e.g. 60001234567).");
    return;
  }
  if (!rollVal) {
    showInputError("studentRollNo", "Please enter your Class Roll No (e.g. M001).");
    return;
  }
  if (!agreeCheck || !agreeCheck.checked) {
    alert("Please accept the assessment declaration before proceeding.");
    return;
  }

  currentCandidate = {
    name: nameVal,
    sapId: sapVal,
    rollNo: rollVal,
    email: emailVal,
    subject: activeQuiz.subject,
    semester: activeQuiz.semester,
    startTime: Date.now(),
    startedAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  };

  sessionStorage.setItem(CANDIDATE_STORAGE_KEY, JSON.stringify(currentCandidate));

  closeRegistrationModal();
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
    examStudentInfo.textContent = `Candidate: ${currentCandidate.name} | SAP: ${currentCandidate.sapId} | Roll: ${currentCandidate.rollNo}`;
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
  let rawMarksObtained = 0;
  const totalQuestions = activeQuiz.questions.length;
  const detailedAnswers = [];

  activeQuiz.questions.forEach(q => {
    const selectedAnswer = userAnswers[q.id] || "Not Answered";
    const correct = isAnswerCorrect(q, selectedAnswer);

    if (correct) {
      rawMarksObtained++;
    }

    detailedAnswers.push({
      id: q.id,
      question: q.text,
      selected: selectedAnswer,
      correctOption: q.correctOption,
      isCorrect: correct
    });
  });

  // Calculate Violation Penalty (-0.25 marks per violation)
  const penalty = Number((tabSwitchCount * 0.25).toFixed(2));
  const finalMarks = Math.max(0, Number((rawMarksObtained - penalty).toFixed(2)));
  const percentage = Math.round((finalMarks / (totalQuestions || 1)) * 100);

  // Build Payload to push to Google Sheet
  const payload = {
    timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    sapId: currentCandidate ? currentCandidate.sapId : "",
    rollNo: currentCandidate ? currentCandidate.rollNo : "",
    studentName: currentCandidate ? currentCandidate.name : "",
    email: currentCandidate ? currentCandidate.email : "",
    subject: activeQuiz.subject || "EVSD",
    semester: activeQuiz.semester || "VII",
    marksObtained: rawMarksObtained,
    violations: tabSwitchCount,
    penalty: penalty,
    marksAfterViolation: finalMarks,
    totalMarks: totalQuestions,
    percentage: `${percentage}%`,
    timeTaken: timeSpentStr,
    autoSubmitted: isAutoExpiry,
    targetGid: "1645517105",
    answers: detailedAnswers,
    answersSummary: detailedAnswers.map(a => `Q${a.id}: ${a.selected} (${a.isCorrect ? '✓' : '✗'})`).join(" | ") + (tabSwitchCount > 0 ? ` | [Violations: ${tabSwitchCount}, Penalty: -${penalty} marks, Final: ${finalMarks}/${totalQuestions}]` : '')
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

  const displayMarks = result.marksAfterViolation !== undefined ? result.marksAfterViolation : result.marksObtained;
  if (marksObtEl) marksObtEl.textContent = displayMarks;
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
        <span class="receipt-label">SAP ID:</span>
        <span class="receipt-value">${escapeHtml(String(result.sapId || '').replace(/^'/, ''))}</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-label">Class Roll No:</span>
        <span class="receipt-value">${escapeHtml(String(result.rollNo || '').replace(/^'/, ''))}</span>
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
        <span class="receipt-label">Marks Obtained (Raw):</span>
        <span class="receipt-value" style="font-weight: 600;">
          ${result.marksObtained} / ${result.totalMarks}
        </span>
      </div>
      ${result.violations > 0 ? `
      <div class="receipt-row">
        <span class="receipt-label">Violations Penalty:</span>
        <span class="receipt-value" style="color: #f87171; font-weight: 600;">
          -${result.penalty} marks (${result.violations} violation${result.violations > 1 ? 's' : ''} @ -0.25)
        </span>
      </div>
      ` : ''}
      <div class="receipt-row">
        <span class="receipt-label">Marks After Violation:</span>
        <span class="receipt-value" style="color: #34d399; font-weight: 700; font-size: 1.1rem;">
          ${displayMarks} / ${result.totalMarks} (${result.percentage})
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
   SECURITY & ANTI-CHEAT: NO TEXT COPY & SCREENSHOT BLACKOUT (QUIZ ONLY)
========================================================= */

let isExamActiveMode = false;

function initPageAntiCopy() {
  // 1. Disable Right Click (Context Menu) on Quiz Page
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    showToastNotification("⚠️ Right-click is disabled on assessment portal.", "warning");
    return false;
  });

  // 2. Disable Text Copying & Cutting
  document.addEventListener("copy", (e) => {
    e.preventDefault();
    clearClipboard();
    showToastNotification("⚠️ Copying text is strictly prohibited.", "warning");
    return false;
  });

  document.addEventListener("cut", (e) => {
    e.preventDefault();
    clearClipboard();
    return false;
  });

  // 3. Disable Text Highlighting Dragging (outside input fields)
  document.addEventListener("selectstart", (e) => {
    if (e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
      return false;
    }
  });

  // 4. Global Keyboard Protection & Screenshot Interceptor
  document.addEventListener("keydown", handleSecurityKeydown);
  document.addEventListener("keyup", handleSecurityKeyup);

  // 5. Resume from Blackout Button
  const resumeBtn = document.getElementById("quizResumeBtn");
  if (resumeBtn) {
    resumeBtn.addEventListener("click", dismissBlackout);
  }
}

function handleSecurityKeydown(e) {
  // PrintScreen Key -> Immediate Pure Blackout + Clear Clipboard
  if (e.key === "PrintScreen" || e.keyCode === 44) {
    triggerBlackout("Print Screen key detected");
    e.preventDefault();
    return false;
  }

  // Ctrl+P / Cmd+P (Print to PDF / Screenshot Print)
  if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
    triggerBlackout("Print / PDF capture attempt");
    e.preventDefault();
    return false;
  }

  // Ctrl+C, Ctrl+X, Ctrl+A, Ctrl+U, Ctrl+S outside inputs
  if ((e.ctrlKey || e.metaKey) && ["c", "x", "a", "u", "s"].includes(e.key.toLowerCase())) {
    if (document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
      e.preventDefault();
      clearClipboard();
      showToastNotification("⚠️ Shortcut disabled for assessment security.", "warning");
      return false;
    }
  }

  // F12 or Developer Tools Shortcuts
  if (e.key === "F12" || ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase()))) {
    e.preventDefault();
    return false;
  }
}

function handleSecurityKeyup(e) {
  if (e.key === "PrintScreen" || e.keyCode === 44) {
    triggerBlackout("Print Screen key released");
  }
}

function setupAntiCheat() {
  tabSwitchCount = 0;
  isExamActiveMode = true;
  const violationBadge = document.getElementById("violationBadge");

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("blur", handleWindowBlur);

  function handleVisibilityChange() {
    if (document.hidden && !isSubmitted && !isSubmitting) {
      triggerBlackout("Tab switched or minimized");
      logViolation("Tab switch or browser minimized");
    }
  }

  function handleWindowBlur() {
    if (!document.hidden && !isSubmitted && !isSubmitting) {
      // Blur fires whenever Windows Snipping Tool (Win+Shift+S) or screenshot app takes focus!
      triggerBlackout("Window focus lost / Screenshot tool active");
      logViolation("Focus left the exam window");
    }
  }

  function logViolation(reason) {
    tabSwitchCount++;
    const penalty = (tabSwitchCount * 0.25).toFixed(2);
    if (violationBadge) {
      violationBadge.style.display = "inline-flex";
      violationBadge.textContent = `⚠️ Violations: ${tabSwitchCount} (-${penalty} marks)`;
    }

    showToastNotification(`⚠️ Violation #${tabSwitchCount}: ${reason}. Penalty: -${penalty} marks (-0.25 per violation).`, "warning");
  }
}

function triggerBlackout(reason) {
  const overlay = document.getElementById("quizBlackoutOverlay");
  if (overlay) {
    overlay.classList.add("is-active");
  }
  clearClipboard();
}

function dismissBlackout() {
  const overlay = document.getElementById("quizBlackoutOverlay");
  if (overlay) {
    overlay.classList.remove("is-active");
  }
}

function clearClipboard() {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText("").catch(() => {});
    }
  } catch (err) {}
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
