document.addEventListener('DOMContentLoaded', () => {
  const sapInput = document.getElementById('sapId');
  const subjectGroup = document.getElementById('subjectGroup');
  const subjectSelect = document.getElementById('subjectSelect');
  const loginForm = document.getElementById('loginForm');
  const sapError = document.getElementById('sapError');

  let subjects = [];
  
  // Dummy student database for prototype
  const studentDB = {
    "12345678901": "John Doe",
    "10987654321": "Jane Smith",
    "11111111111": "Alice Johnson"
  };

  // Load subjects immediately so it's ready for both teacher and student
  loadSubjects();

  sapInput.addEventListener('input', () => {
    const val = sapInput.value.trim();
    sapError.style.display = 'none';

    // Both Teacher (50001) and Students need to select a classroom (subject)
    if (val === '50001' || (val.length === 11 && /^\d+$/.test(val))) {
      subjectGroup.style.display = 'block';
      subjectSelect.setAttribute('required', 'true');
    } else {
      subjectGroup.style.display = 'none';
      subjectSelect.removeAttribute('required');
    }
  });

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = sapInput.value.trim();
    const selectedSubject = subjectSelect.value;
    const subjectName = subjectSelect.options[subjectSelect.selectedIndex].text;

    if (!selectedSubject) {
      alert("Please select a classroom (subject).");
      return;
    }

    if (val === '50001') {
      // Login as teacher
      localStorage.setItem('classroom_role', 'teacher');
      localStorage.setItem('classroom_sap', val);
      localStorage.setItem('classroom_name', 'Dr. Ranjit Patil');
      localStorage.setItem('classroom_subject', selectedSubject);
      localStorage.setItem('classroom_subject_name', subjectName);
      window.location.href = 'teacher-room.html';
      
    } else if (val.length === 11 && /^\d+$/.test(val)) {
      // Look up student in "database"
      const studentName = studentDB[val] || `Student ${val}`;
      
      // Login as student
      localStorage.setItem('classroom_role', 'student');
      localStorage.setItem('classroom_sap', val);
      localStorage.setItem('classroom_name', studentName);
      localStorage.setItem('classroom_subject', selectedSubject);
      localStorage.setItem('classroom_subject_name', subjectName);
      window.location.href = 'student-room.html';
      
    } else {
      sapError.innerText = "Invalid SAP ID.";
      sapError.style.display = 'block';
    }
  });

  async function loadSubjects() {
    try {
      const response = await fetch('data/subjects.xlsx');
      if (!response.ok) throw new Error("Excel file not found");
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(worksheet);
      populateDropdown(json);
    } catch (err) {
      console.warn("Using fallback subject data.", err);
      populateDropdown([
        { "code": "MEC201", "name": "Thermodynamics" },
        { "code": "MEC202", "name": "Fluid Mechanics" },
        { "code": "MEC203", "name": "Machine Design" }
      ]);
    }
  }

  function populateDropdown(data) {
    subjectSelect.innerHTML = '<option value="">-- Select Classroom (Subject) --</option>';
    data.forEach(row => {
      const code = row['Subject Code'] || row['Course Code'] || row['code'] || 'Unknown';
      const name = row['Subject Name'] || row['Course Name'] || row['name'] || 'Unknown';
      const option = document.createElement('option');
      option.value = code; 
      option.textContent = `${name} (${code})`;
      subjectSelect.appendChild(option);
    });
  }
});
