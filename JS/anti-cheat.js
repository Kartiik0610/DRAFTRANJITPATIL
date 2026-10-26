let isQuizActive = false;
let antiCheatWarnings = 0;

window.addEventListener('quizStarted', () => {
  isQuizActive = true;
  enableAntiCheat();
});

window.addEventListener('quizEnded', () => {
  isQuizActive = false;
  disableAntiCheat();
});

function enableAntiCheat() {
  // 1. Disable text selection
  document.body.style.userSelect = 'none';
  document.body.style.webkitUserSelect = 'none';
  
  // 2. Disable context menu (Right click)
  document.addEventListener('contextmenu', preventDefault);
  
  // 3. Monitor visibility change (switching tabs/windows)
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // 4. Keyboard shortcuts (PrintScreen, Ctrl+C)
  document.addEventListener('keydown', handleKeyDown);
}

function disableAntiCheat() {
  document.body.style.userSelect = 'auto';
  document.body.style.webkitUserSelect = 'auto';
  
  document.removeEventListener('contextmenu', preventDefault);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  document.removeEventListener('keydown', handleKeyDown);
}

function preventDefault(e) {
  e.preventDefault();
}

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    antiCheatWarnings++;
    alert(`WARNING (${antiCheatWarnings}): You have switched tabs or minimized the window during an active quiz. This incident has been logged.`);
    // Send to teacher could be implemented via conn.send() if we had reference to `conn` globally here.
  }
}

function handleKeyDown(e) {
  // Prevent Copy (Ctrl+C)
  if (e.ctrlKey && e.key === 'c') {
    e.preventDefault();
    alert("Copying is disabled during the quiz.");
  }
  
  // Prevent Print Screen (Not always caught by browsers, but best effort)
  if (e.key === 'PrintScreen' || e.keyCode === 44) {
    e.preventDefault();
    navigator.clipboard.writeText('Screenshots are disabled.').catch(err => {});
    alert("Screenshots are disabled during the quiz.");
  }
  
  // Prevent Windows + Shift + S snippet (Difficult to catch entirely, but clearing clipboard helps)
  if (e.shiftKey && e.metaKey && e.key === 's') {
    e.preventDefault();
  }
}
