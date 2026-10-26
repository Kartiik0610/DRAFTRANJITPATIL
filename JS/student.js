document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('classroom_role') !== 'student') {
    alert('Access Denied. Please login as student.');
    window.location.href = 'classroom.html';
    return;
  }

  const sapId = localStorage.getItem('classroom_sap');
  const subject = localStorage.getItem('classroom_subject');
  const studentName = localStorage.getItem('classroom_name');
  
  let peer = null;
  let conn = null;
  let fabricCanvas = new fabric.Canvas('viewCanvas');
  fabricCanvas.selection = false;
  fabricCanvas.forEachObject(o => o.selectable = false);

  initPeer();

  function initPeer() {
    peer = new Peer({ debug: 2 });

    peer.on('open', (id) => {
      // Connect to the dynamic teacher host ID for this subject
      const hostId = `djsce-classroom-host-${subject}`;
      conn = peer.connect(hostId);
      
      conn.on('open', () => {
        document.getElementById('connStatus').innerText = `Connected.`;
        document.getElementById('connStatus').style.color = '#28a745';
        
        // Send join details (for attendance)
        conn.send({
          type: 'join',
          sapId: sapId,
          name: studentName,
          subject: subject
        });
      });

      conn.on('data', (data) => {
        handleHostData(data);
      });

      conn.on('close', () => {
        document.getElementById('connStatus').innerText = 'Disconnected from Teacher.';
        document.getElementById('connStatus').style.color = 'red';
      });
    });
  }

  function handleHostData(data) {
    if (data.type === 'sync' || data.type === 'sync_drawings') {
      document.getElementById('waitingMsg').style.display = 'none';
      if (data.drawings) {
        fabricCanvas.loadFromJSON(data.drawings, () => {
          fabricCanvas.forEachObject(o => o.selectable = false);
          fabricCanvas.renderAll();
        });
      }
    } else if (data.type === 'page_change') {
      document.getElementById('waitingMsg').style.display = 'none';
      if(data.clearDrawings) {
         fabricCanvas.clear();
      }
      // Note: Full PDF rendering synchronization requires syncing the actual PDF file over PeerJS
      // or drawing the PDF as a background image on the fabric canvas on the teacher side.
      // For this prototype, we rely on syncing the fabric canvas state. 
    } else if (data.type === 'draw') {
      document.getElementById('waitingMsg').style.display = 'none';
      // Reconstruct path
      fabric.Path.fromObject(data.path, function(path) {
        path.selectable = false;
        fabricCanvas.add(path);
        fabricCanvas.renderAll();
      });
    } else if (data.type === 'clear_drawings') {
      fabricCanvas.clear();
    } else if (data.type === 'start_quiz') {
      startQuiz(data.question);
    } else if (data.type === 'end_quiz') {
      endQuiz();
    }
  }

  // Raise Hand
  document.getElementById('raiseHandBtn').addEventListener('click', () => {
    if (conn && conn.open) {
      conn.send({ type: 'raise_hand' });
      alert("Hand raised!");
    }
  });

  // Quiz Logic
  function startQuiz(question) {
    document.getElementById('quizOverlay').style.display = 'flex';
    document.getElementById('quizQuestionText').innerText = question;
    document.getElementById('quizAnswer').value = '';
    
    // Dispatch custom event for anti-cheat
    window.dispatchEvent(new Event('quizStarted'));
  }

  function endQuiz() {
    document.getElementById('quizOverlay').style.display = 'none';
    alert("The teacher has ended the quiz.");
    
    // Dispatch custom event for anti-cheat
    window.dispatchEvent(new Event('quizEnded'));
  }

  document.getElementById('submitQuizBtn').addEventListener('click', () => {
    const answer = document.getElementById('quizAnswer').value.trim();
    if (!answer) return;
    
    if (conn && conn.open) {
      conn.send({
        type: 'quiz_answer',
        answer: answer
      });
      document.getElementById('quizOverlay').style.display = 'none';
      alert("Answer submitted successfully.");
      
      // Dispatch custom event for anti-cheat
      window.dispatchEvent(new Event('quizEnded'));
    }
  });
});
