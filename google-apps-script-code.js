/**
 * ===================================================================
 * GOOGLE APPS SCRIPT: AUTOMATIC QUIZ MARKS RECORDING (TAB GID: 2126279517)
 * SPREADSHEET: https://docs.google.com/spreadsheets/d/1j7yKVJlU0Jx_HfoRdPEw9JzLRMk4L9ZqORmkvNQ2g-I/edit
 * ===================================================================
 * 
 * STEP-BY-STEP SETUP INSTRUCTIONS (Takes 1 Minute):
 * 1. Open your Google Sheet:
 *    https://docs.google.com/spreadsheets/d/1j7yKVJlU0Jx_HfoRdPEw9JzLRMk4L9ZqORmkvNQ2g-I/edit
 * 
 * 2. In the top Google Sheet menu, click:
 *    "Extensions" -> "Apps Script"
 * 
 * 3. Delete any code currently in the editor, and PASTE THIS ENTIRE FILE.
 * 
 * 4. Click the blue "Deploy" button (top right) -> select "New deployment".
 * 
 * 5. Under "Select type" (gear icon), choose "Web app".
 *    - Description: "Quiz Marks Uploader"
 *    - Execute as: "Me (your google account)"
 *    - Who has access: "Anyone"  <--- (IMPORTANT: allows the website to push marks!)
 * 
 * 6. Click "Deploy", review/allow permissions when prompted by Google.
 * 
 * 7. Copy the "Web app URL" (looks like: https://script.google.com/macros/s/AKfycb.../exec)
 * 
 * 8. Open `JS/quiz.js` and paste the URL into:
 *    const GOOGLE_APPS_SCRIPT_MARKS_WEBHOOK_URL = "PASTE_YOUR_WEB_APP_URL_HERE";
 * 
 * Once deployed, whenever a student submits their quiz on your website,
 * their Roll No, Email ID, Name, Marks Obtained, and Percentage will be
 * AUTOMATICALLY recorded into your Google Sheet (Tab GID: 2126279517)!
 */

var TARGET_MARKS_GID = 2126279517;

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
    var rollNo = "'" + (data.rollNo || data.sapId || "");
    var studentName = data.name || data.studentName || "";
    var email = data.email || data.studentEmail || "";
    var subject = data.subject || "EVSD";
    var semester = data.semester || "VII";
    var marksObtained = Number(data.marksObtained !== undefined ? data.marksObtained : 0);
    var totalMarks = Number(data.totalMarks !== undefined ? data.totalMarks : 10);
    var percentage = data.percentage || ((marksObtained / (totalMarks || 1)) * 100).toFixed(1) + "%";
    var timeTaken = data.timeTaken || "";

    // Append to marks sheet
    sheet.appendRow([
      timestamp,
      rollNo,
      studentName,
      email,
      subject,
      semester,
      marksObtained,
      totalMarks,
      percentage,
      timeTaken,
      answersText
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Marks uploaded successfully to Google Sheet!",
      student: studentName,
      rollNo: rollNo,
      marks: marksObtained,
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

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "Dr. Ranjit Patil Quiz Marks Webhook is active and listening!",
    targetGid: TARGET_MARKS_GID
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Finds the exact target sheet by GID (2126279517) or fallback
 */
function getMarksSheet(ss) {
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === TARGET_MARKS_GID) {
      return sheets[i];
    }
  }
  return ss.getSheetByName("Marks") || 
         ss.getSheetByName("Quiz_Responses") || 
         (sheets.length > 1 ? sheets[1] : sheets[0]);
}

/**
 * Creates dark modern header styling
 */
function setupSheetHeaders(sheet) {
  var headers = [
    "Timestamp",
    "Roll No / SAP ID",
    "Student Name",
    "Email ID",
    "Subject",
    "Semester",
    "Marks Obtained",
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
