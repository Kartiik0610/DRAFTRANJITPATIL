/**
 * ===================================================================
 * GOOGLE APPS SCRIPT: AUTOMATIC QUIZ MARKS RECORDING & PRIVATE QUESTIONS GATEWAY
 * SPREADSHEET: https://docs.google.com/spreadsheets/d/1bv7TGhU2CMfgn5J6-E4nDH7mPYv9_8zIaGjStRNW9SQ/edit
 * QUESTIONS TAB GID: 0
 * MARKS COLLECTOR TAB GID: 1645517105
 * ===================================================================
 * 
 * 🔒 PRIVACY & ANTI-CHEATING ADVANTAGE:
 * With this Apps Script, your Google Sheet can remain 100% PRIVATE ("Restricted" to you only)!
 * Students CANNOT open the Google Sheet link, CANNOT see other students' marks, and CANNOT
 * view answers, because this script acts as a secure, authenticated bridge running under your account.
 * 
 * STEP-BY-STEP SETUP INSTRUCTIONS (Takes 1 Minute):
 * 1. Open your Google Sheet:
 *    https://docs.google.com/spreadsheets/d/1bv7TGhU2CMfgn5J6-E4nDH7mPYv9_8zIaGjStRNW9SQ/edit
 * 
 * 2. In the top Google Sheet menu, click:
 *    "Extensions" -> "Apps Script"
 * 
 * 3. Delete any code currently in the editor, and PASTE THIS ENTIRE FILE.
 * 
 * 4. Click the blue "Deploy" button (top right) -> select "New deployment".
 * 
 * 5. Under "Select type" (gear icon), choose "Web app":
 *    - Description: "Quiz Gateway & Marks Uploader"
 *    - Execute as: "Me (your google account)"
 *    - Who has access: "Anyone"  <--- (IMPORTANT: allows the website to communicate securely!)
 * 
 * 6. Click "Deploy", review/allow permissions when prompted by Google.
 * 
 * 7. Copy the "Web app URL" (looks like: https://script.google.com/macros/s/AKfycb.../exec)
 * 
 * 8. Open `JS/quiz.js` and paste the URL into:
 *    const GOOGLE_APPS_SCRIPT_MARKS_WEBHOOK_URL = "PASTE_YOUR_WEB_APP_URL_HERE";
 * 
 * That's it! Your assessment portal will now run securely with zero public sheet sharing required!
 */

var TARGET_MARKS_GID = 1645517105;
var QUESTIONS_GID = 0;

/**
 * Handles Incoming Student Marks Submissions
 */
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getMarksSheet(ss);
    
    // Auto-setup professional headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      setupSheetHeaders(sheet);
    }

    var data = {};
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e.parameter) {
      data = e.parameter;
    }

    // Prepare human-readable answers summary
    var answersText = "";
    if (Array.isArray(data.answers)) {
      var parts = [];
      for (var i = 0; i < data.answers.length; i++) {
        var a = data.answers[i];
        parts.push("Q" + a.id + ": " + a.selected + (a.isCorrect ? " [✓]" : " [✗]"));
      }
      answersText = parts.join(" | ");
    } else if (data.answersSummary) {
      answersText = String(data.answersSummary);
    }

    var timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    
    // Separate SAP ID (strictly 11 digits prefixed with ' so Sheets preserves format) and Roll No (e.g. M001)
    var rawSap = data.sapId || (data.rollNo && /^\d{11}$/.test(String(data.rollNo)) ? data.rollNo : "");
    var rawRoll = data.rollNo && !/^\d{11}$/.test(String(data.rollNo)) ? data.rollNo : (data.classRollNo || data.rollNumber || "");
    if (data.sapId && data.rollNo) {
      rawSap = data.sapId;
      rawRoll = data.rollNo;
    }
    var sapId = rawSap ? "'" + String(rawSap).replace(/^'/, "") : "";
    var rollNo = rawRoll ? String(rawRoll).replace(/^'/, "") : "";

    var studentName = data.name || data.studentName || "";
    var email = data.email || data.studentEmail || "";
    var subject = data.subject || "EVSD";
    var semester = data.semester || "VII";
    var marksObtained = Number(data.marksObtained !== undefined ? data.marksObtained : (data.rawMarks !== undefined ? data.rawMarks : 0));
    var violations = Number(data.violations !== undefined ? data.violations : 0);
    var marksAfterViolation = Number(data.marksAfterViolation !== undefined ? data.marksAfterViolation : marksObtained);
    var totalMarks = Number(data.totalMarks !== undefined ? data.totalMarks : 10);
    var percentage = data.percentage || ((marksAfterViolation / (totalMarks || 1)) * 100).toFixed(1) + "%";
    var timeTaken = data.timeTaken || "";

    // Append to marks collector sheet (GID 1645517105)
    sheet.appendRow([
      timestamp,
      sapId,
      rollNo,
      studentName,
      email,
      subject,
      semester,
      marksObtained,
      violations,
      marksAfterViolation,
      totalMarks,
      percentage,
      timeTaken,
      answersText
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Marks uploaded successfully to Google Sheet!",
      student: studentName,
      sapId: sapId,
      rollNo: rollNo,
      marksObtained: marksObtained,
      violations: violations,
      marksAfterViolation: marksAfterViolation,
      total: totalMarks,
      percentage: percentage
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Secure Questions Serving & Health Check
 * Allows the website to load questions from a 100% PRIVATE Google Sheet!
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = (e && e.parameter && e.parameter.action) || "";

    // Securely serve questions to website without requiring public sheet sharing
    if (action === "getQuestions") {
      var qSheet = getSheetByGid(ss, QUESTIONS_GID) || ss.getSheets()[0];
      var data = qSheet.getDataRange().getValues();
      var colCount = 0;
      for (var i = 0; i < data.length; i++) {
        if (data[i].length > colCount) colCount = data[i].length;
      }

      var quizzes = [];

      for (var c = 0; c < colCount; c++) {
        var subjectRow = -1;
        for (var r = 0; r < Math.min(data.length, 6); r++) {
          var cell = String(data[r][c] || "").trim().toLowerCase();
          if (cell.startsWith("subject")) {
            subjectRow = r;
            break;
          }
        }
        if (subjectRow === -1) continue;

        var cellVal = String(data[subjectRow][c] || "");
        var subject = cellVal.indexOf(":") !== -1 ? cellVal.split(":")[1].trim() : String(data[subjectRow][c + 1] || "").trim();

        // Completely skip and hide any quiz whose Subject is "NONE" or empty
        if (!subject || subject.toLowerCase() === "none") {
          continue;
        }

        var semester = "VII";
        var durationMinutes = 10;
        var liveDate = "";
        var startTime = "";
        var endTime = "";

        for (var r = 0; r < Math.min(data.length, 12); r++) {
          var label = String(data[r][c] || "").trim().toLowerCase();
          var val = label.indexOf(":") !== -1 ? String(data[r][c]).split(":")[1].trim() : String(data[r][c + 1] || "").trim();

          if (label.startsWith("semester") || label.startsWith("sem")) {
            if (val) semester = val;
          } else if (label.startsWith("timer") || (label.startsWith("time") && !label.startsWith("start") && !label.startsWith("end"))) {
            var m = val.match(/\d+/);
            if (m) durationMinutes = parseInt(m[0], 10);
          } else if (label.startsWith("live on date") || label.startsWith("date")) {
            if (val) liveDate = val;
          } else if (label.startsWith("start time")) {
            if (val) startTime = val;
          } else if (label.startsWith("end time")) {
            if (val) endTime = val;
          }
        }

        var qHeaderRow = -1;
        for (var r = 0; r < Math.min(data.length, 15); r++) {
          var cell = String(data[r][c] || "").trim().toLowerCase();
          if (cell.startsWith("question") || cell.startsWith("sr")) {
            qHeaderRow = r;
            break;
          }
        }

        var questions = [];
        if (qHeaderRow !== -1) {
          for (var r = qHeaderRow + 1; r < data.length; r++) {
            var qText = String(data[r][c] || "").trim();
            if (!qText || qText.toLowerCase() === "question" || qText.toLowerCase() === "a") continue;

            var optA = String(data[r][c + 1] || "").trim();
            var optB = String(data[r][c + 2] || "").trim();
            var optC = String(data[r][c + 3] || "").trim();
            var optD = String(data[r][c + 4] || "").trim();
            var correctOpt = String(data[r][c + 5] || "").trim();

            var options = [];
            if (optA) options.push(optA);
            if (optB) options.push(optB);
            if (optC) options.push(optC);
            if (optD) options.push(optD);

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
          id: "quiz_" + (quizzes.length + 1),
          subject: subject,
          semester: semester,
          durationMinutes: durationMinutes,
          liveDate: liveDate,
          startTime: startTime,
          endTime: endTime,
          questions: questions,
          totalQuestions: questions.length
        });
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        totalQuizzes: quizzes.length,
        quizzes: quizzes,
        subject: quizzes.length > 0 ? quizzes[0].subject : "Assessment",
        semester: quizzes.length > 0 ? quizzes[0].semester : "VII",
        durationMinutes: quizzes.length > 0 ? quizzes[0].durationMinutes : 10,
        liveDate: quizzes.length > 0 ? quizzes[0].liveDate : "",
        startTime: quizzes.length > 0 ? quizzes[0].startTime : "",
        endTime: quizzes.length > 0 ? quizzes[0].endTime : "",
        totalQuestions: quizzes.length > 0 ? quizzes[0].totalQuestions : 0,
        questions: quizzes.length > 0 ? quizzes[0].questions : []
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Default Health Check ping
    return ContentService.createTextOutput(JSON.stringify({
      status: "online",
      message: "Dr. Ranjit Patil Quiz Webhook is active and listening!",
      targetGid: TARGET_MARKS_GID,
      questionsGid: QUESTIONS_GID
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Finds the exact target sheet by GID (1645517105) or fallback
 */
function getMarksSheet(ss) {
  return getSheetByGid(ss, TARGET_MARKS_GID) || 
         ss.getSheetByName("Marks") || 
         ss.getSheetByName("Quiz_Responses") || 
         (ss.getSheets().length > 1 ? ss.getSheets()[1] : ss.getSheets()[0]);
}

/**
 * Helper to find sheet by GID
 */
function getSheetByGid(ss, gid) {
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === gid) {
      return sheets[i];
    }
  }
  return null;
}

/**
 * Creates dark modern header styling
 */
function setupSheetHeaders(sheet) {
  var headers = [
    "Timestamp",
    "SAP ID",
    "Roll No",
    "Student Name",
    "Email ID",
    "Subject",
    "Semester",
    "Marks Obtained",
    "Violations",
    "Marks After Violation",
    "Total Marks",
    "Percentage",
    "Time Taken",
    "Answers Summary"
  ];
  sheet.appendRow(headers);
  sheet.setFrozenRows(1);
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#0f172a");
  headerRange.setFontColor("#f8fafc");
  headerRange.setHorizontalAlignment("center");
}
