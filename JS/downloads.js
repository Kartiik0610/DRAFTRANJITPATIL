/* =========================================================
   SUBJECT DATA — DYNAMICALLY FETCHED FROM GOOGLE SHEETS
========================================================= */
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1OPP7gnKAj-a7LimDhUwSYRmn6Rsqe_BuXDEa2143ap8/export?format=csv";

// We will populate this array dynamically
let subjects = [];

/* =========================================================
   RENDER LOGIC (NO NUMBERING, NATURAL FLOW)
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("subjectGrid");
  if (!grid) return;

  const CACHE_KEY = "subjects_data_cache";

  // 1. Instantly load from localStorage if available
  const cachedData = localStorage.getItem(CACHE_KEY);
  if (cachedData) {
    try {
      subjects = JSON.parse(cachedData);
      renderSubjects(subjects, grid);
    } catch (e) {
      console.error("Failed to parse cached subjects");
    }
  } else {
    // Show a loading indicator if no cache exists
    grid.innerHTML = "<p id='loadingMsg'>Loading study materials...</p>";
  }

  // 2. Fetch the latest data in the background
  try {
    // Append a timestamp to bypass browser cache
    const cacheBusterUrl = GOOGLE_SHEET_CSV_URL + "&t=" + new Date().getTime();
    const response = await fetch(cacheBusterUrl);
    if (!response.ok) throw new Error("Network response was not ok");
    const csvText = await response.text();
    
    // Convert CSV to structured data
    const freshSubjects = parseCSVToSubjects(csvText);
    
    // Update cache
    localStorage.setItem(CACHE_KEY, JSON.stringify(freshSubjects));
    
    // Update UI if data changed or if it's the first load
    if (!cachedData || JSON.stringify(freshSubjects) !== cachedData) {
      subjects = freshSubjects;
      grid.innerHTML = ""; // Clear grid
      renderSubjects(subjects, grid);
    }
  } catch (error) {
    console.error("Failed to fetch subjects data:", error);
    if (!cachedData) {
      grid.innerHTML = "<p>Failed to load subjects data. Please try again later.</p>";
    }
  }
});

function renderSubjects(subjectsData, grid) {
  const showOngoingOnly = grid.dataset.ongoing === "true";

  subjectsData
    .filter(s => !showOngoingOnly || s.ongoing)
    .forEach(subject => {
      const card = document.createElement("div");
      card.className = "subject-card";

      const grouped = groupByType(subject.items);

      card.innerHTML = `
        <h3>${subject.title}</h3>

        <ul class="subject-items">
          ${renderSection("Syllabus", grouped.syllabus)}
          ${renderSection("Units", grouped.unit)}
          ${renderSection("Assessment Rubrics", grouped.rubric)}
          ${renderSection("Experiments", grouped.experiment)}
          ${renderSection("Assignments", grouped.assignment)}
          ${renderSection("Topics / Sessions", grouped.topic || grouped.session)}
          ${renderSection("Forms / Documents", grouped.form)}
        </ul>

        <a class="download-all"
           href=""
           target="_blank"
           rel="noopener">
          Download All Notes
        </a>
      `;

      grid.appendChild(card);
    });
};

/* =========================================================
   HELPERS
========================================================= */

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

function parseCSVToSubjects(csvText) {
  const rows = csvToArray(csvText.trim());
  const header = rows[0];
  const dataRows = rows.slice(1);

  const subjectsMap = new Map();

  dataRows.forEach(row => {
    // Skip empty rows
    if (row.length < 2 || !row[0]) return;

    const courseCode = row[0]?.trim();
    const courseName = row[1]?.trim();
    const resourceType = row[2]?.trim();
    const itemName = row[3]?.trim();
    const topicDetails = row[4]?.trim();
    const status = row[5]?.trim();
    const resourceUrl = row[6]?.trim();

    // Generate subject title
    const subjectTitle = `${courseName} (${courseCode})`;

    if (!subjectsMap.has(subjectTitle)) {
      subjectsMap.set(subjectTitle, {
        title: subjectTitle,
        ongoing: true, // Assuming all fetched are ongoing, or you can add logic if needed
        fullDownload: "",
        items: []
      });
    }

    const subject = subjectsMap.get(subjectTitle);

    // Map resource type
    let type = "other";
    const rtLower = resourceType ? resourceType.toLowerCase() : "";
    if (rtLower.includes("syllabus")) type = "syllabus";
    else if (rtLower.includes("lecture notes")) type = "unit";
    else if (rtLower.includes("rubric")) type = "rubric";
    else if (rtLower.includes("lab manual")) type = "experiment";
    else if (rtLower.includes("assignment")) type = "assignment";
    else if (rtLower.includes("topic")) type = "topic";
    else if (rtLower.includes("form")) type = "form";
    else type = "unit"; // default

    // Create item
    const item = {
      label: itemName,
      fileId: resourceUrl || "",
      type: type
    };

    if (status === "Pending") {
      item.disabled = true;
    } else if (status === "Self Study") {
      item.ss = true;
    }

    if (itemName && itemName !== "") {
        subject.items.push(item);
    }
  });

  return Array.from(subjectsMap.values());
}

function groupByType(items) {
  return items.reduce((acc, item) => {
    const t = item.type || "other";
    acc[t] = acc[t] || [];
    acc[t].push(item);
    return acc;
  }, {});
}

function renderSection(title, items = []) {
  if (!items.length) return "";
  return `
    <li class="content-group">
      <div class="group-title">${title}</div>
      <ul class="group-list">
        ${items.map(createItemHTML).join("")}
      </ul>
    </li>
  `;
}

function createItemHTML(item) {
  if (item.disabled) {
    return `
      <li class="content-item ${item.type} disabled-item" style="opacity: 0.6; cursor: not-allowed;" title="Notes will be available soon">
        <span class="item-link">
          🔒 ${item.label}
        </span>
      </li>
    `;
  }

   if (item.ss) {
    return `
      <li class="content-item ${item.type} disabled-item" style="opacity: 1; cursor: not-allowed;" title="Self Study">
        <span class="item-link">
          🔒 ${item.label}
        </span>
      </li>
    `;
  } 
  
  const view = item.fileId;
  const dl = view; // Since it's Sharepoint links mostly, downloading via drive.google.com/uc?id won't work unless it's a Drive ID. The user's original logic was combining Sharepoint URLs into Google Drive download URLs which is broken. We'll leave it as original or just use view link.
  
  // To keep it strictly matching original download logic:
  let downloadUrl = view;
  if (!view.startsWith("http")) {
      downloadUrl = `https://drive.google.com/uc?export=download&id=${item.fileId}`;
  }

  return `
    <li class="content-item ${item.type}">
      <a href="${view}" target="_blank" rel="noopener" class="item-link">
        ${item.label}
      </a>
      <a href="${downloadUrl}" class="download-icon" title="Download">⬇️</a>
    </li>
  `;
}
