/* =========================================================
   SUBJECT DATA — ALL SUBJECTS
========================================================= */

const subjects = [

/* =========================================================
   1. ELECTRIC DRIVES & CONTROLS
========================================================= */
{
  title: "Electric Drives and Controls (EDC)",
  ongoing: true,
  fullDownload: "PASTE_EDC_FOLDER_ID",
  items: [
    { label: "Syllabus", fileId: "PASTE_EDC_SYLLABUS_ID", type: "syllabus" },

    { label: "Unit 00: Course Introduction", fileId: "PASTE_EDC_UNIT00_ID", type: "unit" },
    { label: "Unit 01: Basics of Power Conversion", fileId: "PASTE_EDC_UNIT01_ID", type: "unit" },
    { label: "Unit 02: Elements of Drives", fileId: "PASTE_EDC_UNIT02_ID", type: "unit" },
    { label: "Unit 03: EV Motor Drive Topologies – I", fileId: "PASTE_EDC_UNIT03_ID", type: "unit" },
    { label: "Unit 04: EV Motor Drive Topologies – II", fileId: "PASTE_EDC_UNIT04_ID", type: "unit" },
    { label: "Unit 05: EV Motor Drive Topologies – III", fileId: "PASTE_EDC_UNIT05_ID", type: "unit" },
    { label: "Unit 06: Selection / Sizing of EV Motors", fileId: "PASTE_EDC_UNIT06_ID", type: "unit" },

    { label: "Assessment Rubrics (All-in-One)", fileId: "PASTE_EDC_RUBRIC_ID", type: "rubric" },

    { label: "Study of device characteristics (SCR, TRIAC, BJT, MOSFET, IGBT)", fileId: "PASTE_EDC_EXP01_ID", type: "experiment" },
    { label: "I/O toggling using Arduino", fileId: "PASTE_EDC_EXP02_ID", type: "experiment" },
    { label: "Embedded system for timer and PWM generation", fileId: "PASTE_EDC_EXP03_ID", type: "experiment" },
    { label: "MOSFET-based step-up & step-down converter", fileId: "PASTE_EDC_EXP04_ID", type: "experiment" },
    { label: "Current/Voltage loop control of DC motor", fileId: "PASTE_EDC_EXP05_ID", type: "experiment" },
    { label: "Drive schemes & control signals in induction motor", fileId: "PASTE_EDC_EXP06_ID", type: "experiment" },
    { label: "Control of induction motor", fileId: "PASTE_EDC_EXP07_ID", type: "experiment" },
    { label: "Drive schemes & control signals for BLDC motor", fileId: "PASTE_EDC_EXP08_ID", type: "experiment" },
    { label: "Control of BLDC motor", fileId: "PASTE_EDC_EXP09_ID", type: "experiment" }
  ]
},

/* =========================================================
   2. DATA ANALYTICS LAB (DJS23MLPE516)
========================================================= */
{
  title: "Data Analytics Laboratory (DJS23MLPE516)",
  ongoing: true,
  fullDownload: "PASTE_DALAB_FOLDER_ID",
  items: [
    { label: "Individual Experiment Assessment", fileId: "PASTE_DALAB_RUB1", type: "rubric" },
    { label: "Overall Experiment Assessment", fileId: "PASTE_DALAB_RUB2", type: "rubric" },
    { label: "Mini-Project Assessment", fileId: "PASTE_DALAB_RUB3", type: "rubric" },

    { label: "Introduction to Data Science, AI-ML-DL", fileId: "PASTE_DALAB_EXP01", type: "experiment" },
    { label: "Descriptive statistical analysis using failure data", fileId: "PASTE_DALAB_EXP02", type: "experiment" },
    { label: "Best-fit probability distribution selection", fileId: "PASTE_DALAB_EXP03", type: "experiment" },
    { label: "Data visualization", fileId: "PASTE_DALAB_EXP04", type: "experiment" },
    { label: "Hypothesis testing", fileId: "PASTE_DALAB_EXP05", type: "experiment" }
  ]
},

/* =========================================================
   3. MECHANICAL MEASUREMENT & METROLOGY LAB
========================================================= */
{
  title: "Mechanical Measurement and Metrology Laboratory (DJS23MLPC502)",
  ongoing: true,
  fullDownload: "PASTE_MMM_FOLDER_ID",
  items: [
    { label: "Individual Experiment Assessment", fileId: "PASTE_MMM_RUB1", type: "rubric" },
    { label: "Overall Experiment Assessment", fileId: "PASTE_MMM_RUB2", type: "rubric" },
    { label: "Mini-Project Assessment", fileId: "PASTE_MMM_RUB3", type: "rubric" },

    { label: "Torque measurement", fileId: "PASTE_MMM_EXP01", type: "experiment" },
    { label: "Calibration of pressure gauge using dead weight gauge", fileId: "PASTE_MMM_EXP02", type: "experiment" },
    { label: "Speed measurement", fileId: "PASTE_MMM_EXP03", type: "experiment" },
    { label: "Displacement measurement using LVDT", fileId: "PASTE_MMM_EXP04", type: "experiment" },
    { label: "Strain gauge calibration", fileId: "PASTE_MMM_EXP05", type: "experiment" },
    { label: "Floating carriage micrometer", fileId: "PASTE_MMM_EXP06", type: "experiment" },
    { label: "Gear tooth thickness measurement", fileId: "PASTE_MMM_EXP07", type: "experiment" }
  ]
},

/* =========================================================
   4. DESIGN THINKING LAB
========================================================= */
{
  title: "Design Thinking Laboratory",
  ongoing: false,
  fullDownload: "PASTE_DT_FOLDER_ID",
  items: [
    { label: "Faculty Orientation Program", fileId: "PASTE_DT_DOC1", type: "topic" }
  ]
},

/* =========================================================
   5. ISTE STTP
========================================================= */
{
  title: "ISTE Approved One-Week STTP",
  ongoing: false,
  fullDownload: "PASTE_ISTE_FOLDER_ID",
  items: [
    { label: "From Draft to Publication: Research Article Writing", fileId: "PASTE_ISTE_OVERVIEW", type: "topic" },

    { label: "Fundamentals of research article writing", fileId: "PASTE_ISTE_S01", type: "session" },
    { label: "Journal indexing & quality metrics", fileId: "PASTE_ISTE_S02", type: "session" },
    { label: "Ethics, plagiarism & referencing tools", fileId: "PASTE_ISTE_S03", type: "session" },

    { label: "Title Page", fileId: "PASTE_ISTE_FORM1", type: "form" },
    { label: "Cover Letter", fileId: "PASTE_ISTE_FORM2", type: "form" },
    { label: "Response File", fileId: "PASTE_ISTE_FORM3", type: "form" },
    { label: "Author Statement", fileId: "PASTE_ISTE_FORM4", type: "form" }
  ]
},

/* =========================================================
   6. BUSINESS ANALYTICS
========================================================= */
{
  title: "Business Analytics",
  ongoing: false,
  fullDownload: "PASTE_BA_FOLDER_ID",
  items: [
    { label: "Syllabus", fileId: "PASTE_BA_SYLLABUS_ID", type: "syllabus" },
    { label: "Course Introduction", fileId: "PASTE_BA_UNIT00_ID", type: "unit" },
    { label: "Introduction to Business Analytics", fileId: "PASTE_BA_UNIT01_ID", type: "unit" },
    { label: "Data Management & Descriptive Analytics", fileId: "PASTE_BA_UNIT02_ID", type: "unit" },
    { label: "Predictive Analytics & Statistical Modeling", fileId: "PASTE_BA_UNIT03_ID", type: "unit" },
    { label: "Advanced ML & Prescriptive Analytics", fileId: "PASTE_BA_UNIT04_ID", type: "unit" },
    { label: "Applications & Industry Trends", fileId: "PASTE_BA_UNIT05_ID", type: "unit" }
  ]
},

/* =========================================================
   7. NUMERICAL & STATISTICAL TECHNIQUES
========================================================= */
{
  title: "Numerical and Statistical Techniques (NST)",
  ongoing: true,
  fullDownload: "PASTE_NST_FOLDER_ID",
  items: [
    { label: "MATLAB introduction", fileId: "PASTE_NST_EXP00", type: "experiment" },
    { label: "Flowcharts & algorithms", fileId: "PASTE_NST_EXP00A", type: "experiment" },
    { label: "Correlation & linear regression", fileId: "PASTE_NST_EXP01", type: "experiment" },
    { label: "PDE – Crank Nicolson method", fileId: "PASTE_NST_EXP02", type: "experiment" },
    { label: "Binomial distribution", fileId: "PASTE_NST_EXP03", type: "experiment" },
    { label: "Poisson distribution", fileId: "PASTE_NST_EXP04", type: "experiment" },
    { label: "Normal distribution", fileId: "PASTE_NST_EXP05", type: "experiment" },
    { label: "Z-test", fileId: "PASTE_NST_EXP06", type: "experiment" },
    { label: "T-test", fileId: "PASTE_NST_EXP07", type: "experiment" },
    { label: "Chi-Square test", fileId: "PASTE_NST_EXP08", type: "experiment" }
  ]
},

/* =========================================================
   8. DATA ANALYTICS (THEORY + LAB)
========================================================= */
{
  title: "Data Analytics (DJS22MEC5015 & DJS22MEL5015)",
  ongoing: false,
  fullDownload: "PASTE_DA2_FOLDER_ID",
  items: [
    { label: "Introduction", fileId: "PASTE_DA2_UNIT01", type: "unit" },
    { label: "Descriptive Statistics", fileId: "PASTE_DA2_UNIT02", type: "unit" },
    { label: "Inferential Statistics", fileId: "PASTE_DA2_UNIT03", type: "unit" },
    { label: "Data Analytics Approaches", fileId: "PASTE_DA2_UNIT04", type: "unit" },
    { label: "Data Visualization", fileId: "PASTE_DA2_UNIT05", type: "unit" },

    { label: "Introduction to DA & AI-ML-DL", fileId: "PASTE_DA2_EXP01", type: "experiment" },
    { label: "Descriptive statistics using failure data", fileId: "PASTE_DA2_EXP02", type: "experiment" },
    { label: "Probability distribution fitting", fileId: "PASTE_DA2_EXP03", type: "experiment" },
    { label: "Data visualization", fileId: "PASTE_DA2_EXP04", type: "experiment" },
    { label: "Hypothesis testing", fileId: "PASTE_DA2_EXP05", type: "experiment" }
  ]
},

/* =========================================================
   9. FUNDAMENTALS OF ELECTRIC VEHICLES
========================================================= */
{
  title: "Fundamentals of Electric Vehicles (FEV)",
  ongoing: false,
  fullDownload: "PASTE_FEV_FOLDER_ID",
  items: [
    { label: "Introduction to EVs", fileId: "PASTE_FEV_UNIT01", type: "unit" },
    { label: "Vehicle Mechanics", fileId: "PASTE_FEV_UNIT02", type: "unit" },
    { label: "Vehicle Dynamics & Stability", fileId: "PASTE_FEV_UNIT03", type: "unit" },
    { label: "Transmission Systems", fileId: "PASTE_FEV_UNIT04", type: "unit" },
    { label: "Battery Technologies", fileId: "PASTE_FEV_UNIT05", type: "unit" },
    { label: "Motor Selection & Sizing", fileId: "PASTE_FEV_UNIT06", type: "unit" }
  ]
},

/* =========================================================
   10. DESIGN FOR RELIABILITY
========================================================= */
{
  title: "Design for Reliability",
  ongoing: false,
  fullDownload: "PASTE_DFR_FOLDER_ID",
  items: [
    { label: "Reliability basics & mathematics", fileId: "PASTE_DFR_UNIT01", type: "unit" },
    { label: "Probability distributions", fileId: "PASTE_DFR_UNIT02", type: "unit" },
    { label: "System reliability & warranty", fileId: "PASTE_DFR_UNIT03", type: "unit" },
    { label: "Probabilistic design & factor of safety", fileId: "PASTE_DFR_UNIT04", type: "unit" },
    { label: "Reliability allocation", fileId: "PASTE_DFR_UNIT05", type: "unit" },
    { label: "Reliability testing", fileId: "PASTE_DFR_UNIT06", type: "unit" }
  ]
},

/* =========================================================
   11. NUMERICAL METHODS & OPTIMIZATION
========================================================= */
{
  title: "Numerical Methods and Optimization",
  ongoing: false,
  fullDownload: "PASTE_NMO_FOLDER_ID",
  items: [
    { label: "Roots of equations", fileId: "PASTE_NMO_T01", type: "topic" },
    { label: "Linear equations", fileId: "PASTE_NMO_T02", type: "topic" },
    { label: "Numerical integration techniques", fileId: "PASTE_NMO_T03", type: "topic" },
    { label: "Curve fitting & regression", fileId: "PASTE_NMO_T04", type: "topic" },

    { label: "MATLAB overview", fileId: "PASTE_NMO_LAB01", type: "experiment" },
    { label: "Roots of equations", fileId: "PASTE_NMO_LAB02", type: "experiment" }
  ]
},

/* =========================================================
   12. LOCTITE ADHESIVE TECHNOLOGIES
========================================================= */
{
  title: "LOCTITE Adhesive Technologies",
  ongoing: false,
  fullDownload: "PASTE_LOCTITE_FOLDER_ID",
  items: [
    { label: "Basics of adhesives", fileId: "PASTE_LOC_UNIT01", type: "unit" },
    { label: "Threaded assemblies", fileId: "PASTE_LOC_UNIT02", type: "unit" },
    { label: "Gasketing & bonding", fileId: "PASTE_LOC_UNIT03", type: "unit" },
    { label: "Dispensing equipment", fileId: "PASTE_LOC_UNIT04", type: "unit" },
    { label: "Troubleshooting", fileId: "PASTE_LOC_UNIT05", type: "unit" }
  ]
},

/* =========================================================
   13. QUALITY & RELIABILITY ENGINEERING
========================================================= */
{
  title: "Quality and Reliability Engineering",
  ongoing: false,
  fullDownload: "PASTE_QRE_FOLDER_ID",
  items: [
    { label: "Quality concepts & tools", fileId: "PASTE_QRE_UNIT01", type: "unit" },
    { label: "Statistical Quality Control", fileId: "PASTE_QRE_UNIT02", type: "unit" },
    { label: "Reliability fundamentals", fileId: "PASTE_QRE_UNIT03", type: "unit" },
    { label: "System reliability & allocation", fileId: "PASTE_QRE_UNIT04", type: "unit" },
    { label: "Reliability in design", fileId: "PASTE_QRE_UNIT05", type: "unit" },
    { label: "Reliability testing & management", fileId: "PASTE_QRE_UNIT06", type: "unit" }
  ]
},

/* =========================================================
   14. DATA ANALYTICS – ADVANCED LAB
========================================================= */
{
  title: "Data Analytics – Advanced Laboratory",
  ongoing: true,
  fullDownload: "PASTE_DA_ADV_FOLDER_ID",
  items: [
    { label: "Reliability analysis of deep groove ball bearing", fileId: "PASTE_DA_ADV_EXP01", type: "experiment" },
    { label: "Solar PV power generation data analysis", fileId: "PASTE_DA_ADV_EXP02", type: "experiment" },
    { label: "Mechanical property extraction from stress-strain data", fileId: "PASTE_DA_ADV_EXP03", type: "experiment" },
    { label: "Automobile dataset analysis", fileId: "PASTE_DA_ADV_EXP04", type: "experiment" },
    { label: "3D printer data analysis", fileId: "PASTE_DA_ADV_EXP05", type: "experiment" },
    { label: "Predictive maintenance", fileId: "PASTE_DA_ADV_EXP06", type: "experiment" }
  ]
}

];

/* =========================================================
   RENDER LOGIC (NO NUMBERING, NATURAL FLOW)
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("subjectGrid");
  if (!grid) return;

  const showOngoingOnly = grid.dataset.ongoing === "true";

  subjects
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
          ${renderSection("Topics / Sessions", grouped.topic || grouped.session)}
          ${renderSection("Forms / Documents", grouped.form)}
        </ul>

        <a class="download-all"
           href="https://drive.google.com/drive/folders/${subject.fullDownload}"
           target="_blank"
           rel="noopener">
          Download All Notes
        </a>
      `;

      grid.appendChild(card);
    });
});

/* =========================================================
   HELPERS
========================================================= */

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
  const view = `https://drive.google.com/file/d/${item.fileId}/view`;
  const dl = `https://drive.google.com/uc?export=download&id=${item.fileId}`;

  return `
    <li class="content-item ${item.type}">
      <a href="${view}" target="_blank" rel="noopener" class="item-link">
        ${item.label}
      </a>
      <a href="${dl}" class="download-icon" title="Download">⬇️</a>
    </li>
  `;
}
