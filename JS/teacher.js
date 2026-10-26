document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('classroom_role') !== 'teacher') {
    alert('Access Denied. Please login as teacher.');
    window.location.href = 'classroom.html';
    return;
  }

  // State
  let peer = null;
  let connections = {}; // Map of connection ID to connection object
  let students = {}; // Map of connection ID to student info
  
  const subjectCode = localStorage.getItem('classroom_subject');
  const subjectName = localStorage.getItem('classroom_subject_name');

  // PDF State
  let pdfDoc = null,
      pageNum = 1,
      pageRendering = false,
      pageNumPending = null,
      canvas = document.getElementById('pdfCanvas'),
      ctx = canvas.getContext('2d');

  // Fabric State
  let fabricCanvas = new fabric.Canvas('drawingCanvas', {
    isDrawingMode: true
  });
  let currentTool = 'pen'; // pen, highlighter, eraser

  initFabric();
  initPeer();

  /* --- PEER JS INIT --- */
  function initPeer() {
    // Dynamic host ID based on subject to prevent collisions
    const hostId = `djsce-classroom-host-${subjectCode}`;
    
    peer = new Peer(hostId, {
      debug: 2
    });

    peer.on('open', (id) => {
      document.getElementById('connStatus').innerText = `Live: ${subjectName}`;
      document.getElementById('connStatus').style.color = '#28a745';
    });

    peer.on('connection', (conn) => {
      conn.on('data', (data) => {
        handleIncomingData(conn.peer, data, conn);
      });
      conn.on('close', () => {
        removeStudent(conn.peer);
      });
    });

    peer.on('error', (err) => {
      console.error(err);
      document.getElementById('connStatus').innerText = `Connection Error: ${err.type}. Ensure you are not opening multiple teacher tabs for the same subject.`;
      document.getElementById('connStatus').style.color = 'red';
    });
  }

  function handleIncomingData(peerId, data, conn) {
    if (data.type === 'join') {
      connections[peerId] = conn;
      students[peerId] = {
        sapId: data.sapId,
        name: data.name || "Unknown",
        subject: data.subject,
        joinTime: new Date().toLocaleTimeString(),
        handRaised: false
      };
      updateStudentList();
      showNotification(`${students[peerId].name} (${data.sapId}) joined.`);
      
      // Send current state to new student
      conn.send({
        type: 'sync',
        page: pageNum,
        drawings: fabricCanvas.toJSON()
      });
    } else if (data.type === 'raise_hand') {
      if (students[peerId]) {
        students[peerId].handRaised = true;
        updateStudentList();
        showNotification(`Student ${students[peerId].sapId} raised their hand!`);
        
        // Auto lower hand after 10 seconds
        setTimeout(() => {
          if(students[peerId]) {
             students[peerId].handRaised = false;
             updateStudentList();
          }
        }, 10000);
      }
    } else if (data.type === 'quiz_answer') {
      const responseDiv = document.createElement('div');
      responseDiv.style.borderBottom = '1px solid #444';
      responseDiv.style.padding = '0.5rem 0';
      responseDiv.innerHTML = `<strong>${students[peerId].sapId}:</strong> ${data.answer}`;
      document.getElementById('quizResponses').appendChild(responseDiv);
    }
  }

  function removeStudent(peerId) {
    if (students[peerId]) {
      showNotification(`${students[peerId].name} (${students[peerId].sapId}) left.`);
      delete students[peerId];
      delete connections[peerId];
      updateStudentList();
    }
  }

  function broadcast(data) {
    Object.values(connections).forEach(conn => {
      if (conn.open) {
        conn.send(data);
      }
    });
  }

  /* --- UI UPDATES --- */
  function updateStudentList() {
    const list = document.getElementById('studentList');
    list.innerHTML = '';
    let count = 0;
    for (let id in students) {
      count++;
      const s = students[id];
      const li = document.createElement('li');
      li.innerText = `${s.name} (${s.sapId})`;
      if (s.handRaised) {
        const span = document.createElement('span');
        span.className = 'hand-raised';
        span.innerText = '✋';
        li.appendChild(span);
      }
      list.appendChild(li);
    }
    document.getElementById('studentCount').innerText = count;
  }

  function showNotification(msg) {
    const area = document.getElementById('notificationArea');
    const note = document.createElement('div');
    note.className = 'notification';
    note.innerText = msg;
    area.appendChild(note);
    setTimeout(() => note.remove(), 4000);
  }

  /* --- PDF HANDLING --- */
  const pdfjsLib = window['pdfjs-dist/build/pdf'];
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js';

  document.getElementById('pdfUpload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    let finalPdfData = null;

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const fileReader = new FileReader();
      fileReader.onload = function() {
        const typedarray = new Uint8Array(this.result);
        loadPdfFromData(typedarray);
      };
      fileReader.readAsArrayBuffer(file);
    } else if (file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) {
      // Send to local backend for conversion
      const formData = new FormData();
      formData.append('file', file);
      
      document.getElementById('pageInfo').innerText = "Converting PPT... Please wait.";
      
      try {
        const response = await fetch('http://localhost:3000/convert', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
           throw new Error(await response.text());
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const typedarray = new Uint8Array(arrayBuffer);
        loadPdfFromData(typedarray);
      } catch (err) {
        alert("Conversion failed. Ensure the local backend is running and LibreOffice is installed. Error: " + err.message);
        document.getElementById('pageInfo').innerText = "Page: 0/0";
      }
    } else {
      alert('Please upload a PDF, PPT, or PPTX file.');
    }
  });

  function loadPdfFromData(typedarray) {
    pdfjsLib.getDocument(typedarray).promise.then(pdf => {
      pdfDoc = pdf;
      document.getElementById('pageInfo').innerText = `Page: 1/${pdfDoc.numPages}`;
      document.getElementById('prevPage').disabled = false;
      document.getElementById('nextPage').disabled = false;
      renderPage(1);
    });
  }

  function renderPage(num) {
    pageRendering = true;
    pdfDoc.getPage(num).then(page => {
      const viewport = page.getViewport({scale: 1.5});
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Update Fabric Canvas size to match PDF
      fabricCanvas.setDimensions({ width: viewport.width, height: viewport.height });
      fabricCanvas.clear(); // Clear drawings on page change

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };
      
      const renderTask = page.render(renderContext);
      renderTask.promise.then(() => {
        pageRendering = false;
        if (pageNumPending !== null) {
          renderPage(pageNumPending);
          pageNumPending = null;
        } else {
           // Broadcast page change and clear drawings
           broadcast({ type: 'page_change', page: pageNum, clearDrawings: true });
        }
      });
    });
    document.getElementById('pageInfo').innerText = `Page: ${num}/${pdfDoc.numPages}`;
  }

  function queueRenderPage(num) {
    if (pageRendering) {
      pageNumPending = num;
    } else {
      renderPage(num);
    }
  }

  document.getElementById('prevPage').addEventListener('click', () => {
    if (pageNum <= 1) return;
    pageNum--;
    queueRenderPage(pageNum);
  });

  document.getElementById('nextPage').addEventListener('click', () => {
    if (pageNum >= pdfDoc.numPages) return;
    pageNum++;
    queueRenderPage(pageNum);
  });

  /* --- FABRIC DRAWING --- */
  function initFabric() {
    fabricCanvas.freeDrawingBrush.color = '#ff0000';
    fabricCanvas.freeDrawingBrush.width = 3;

    fabricCanvas.on('path:created', function(e) {
      // Broadcast new path to students
      broadcast({
        type: 'draw',
        path: e.path.toJSON()
      });
    });
  }

  function setTool(tool) {
    document.querySelectorAll('.drawing-tools button').forEach(b => b.classList.remove('active'));
    currentTool = tool;
    
    if (tool === 'pen') {
      document.getElementById('toolPen').classList.add('active');
      fabricCanvas.isDrawingMode = true;
      fabricCanvas.freeDrawingBrush.color = '#ff0000';
      fabricCanvas.freeDrawingBrush.width = 3;
    } else if (tool === 'highlighter') {
      document.getElementById('toolHighlighter').classList.add('active');
      fabricCanvas.isDrawingMode = true;
      fabricCanvas.freeDrawingBrush.color = 'rgba(255, 255, 0, 0.4)';
      fabricCanvas.freeDrawingBrush.width = 15;
    } else if (tool === 'eraser') {
      document.getElementById('toolEraser').classList.add('active');
      fabricCanvas.isDrawingMode = false;
      // Eraser logic: delete object on click
      fabricCanvas.on('mouse:down', function(e){
        if(currentTool === 'eraser' && e.target) {
          fabricCanvas.remove(e.target);
          // Broadcast full canvas state since object removed
          broadcast({ type: 'sync_drawings', drawings: fabricCanvas.toJSON() });
        }
      });
    }
  }

  document.getElementById('toolPen').addEventListener('click', () => setTool('pen'));
  document.getElementById('toolHighlighter').addEventListener('click', () => setTool('highlighter'));
  document.getElementById('toolEraser').addEventListener('click', () => setTool('eraser'));
  
  document.getElementById('clearBoard').addEventListener('click', () => {
    fabricCanvas.clear();
    broadcast({ type: 'clear_drawings' });
  });

  /* --- ATTENDANCE & QUIZ --- */
  document.getElementById('exportAttendance').addEventListener('click', () => {
    let csv = "SAP ID,Name,Subject,Join Time\n";
    for(let id in students) {
      csv += `${students[id].sapId},${students[id].name},${students[id].subject},${students[id].joinTime}\n`;
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${new Date().toLocaleDateString()}.csv`;
    a.click();
  });

  document.getElementById('startQuiz').addEventListener('click', () => {
    const q = document.getElementById('quizQuestion').value.trim();
    if (!q) {
      alert("Please enter a question.");
      return;
    }
    document.getElementById('startQuiz').style.display = 'none';
    document.getElementById('endQuiz').style.display = 'inline-block';
    document.getElementById('quizResponses').innerHTML = ''; // clear old
    broadcast({ type: 'start_quiz', question: q });
  });

  document.getElementById('endQuiz').addEventListener('click', () => {
    document.getElementById('startQuiz').style.display = 'inline-block';
    document.getElementById('endQuiz').style.display = 'none';
    broadcast({ type: 'end_quiz' });
  });
});
