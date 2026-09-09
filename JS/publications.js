/* =====================================================
   PUBLICATIONS & PATENTS — DYNAMIC LOADER
   Frontend-compatible + Backend-ready
===================================================== */

const ORCID_ID = "0000-0002-9047-9275";
const ORCID_API = `https://pub.orcid.org/v3.0/${ORCID_ID}/works`;

// If you want to use a Google Sheet for Publications & Patents (like downloads.js), 
// paste the direct CSV export link here:
const GOOGLE_SHEET_PUBS_CSV_URL = ""; 

/* ===============================
   STATIC FALLBACK DATA
=============================== */

// Update this array manually, or use the Google Sheet URL above!
let publicationsData = {
  patents: [
    {
      title: "Automatic Side-Stand Retraction System for Two Wheelers",
      details: "202321016791",
      status: "Filled and Published"
    },
    {
      title: "Intelligent door lock with key authentication",
      details: "202321005226",
      status: "Published - FER received"
    },
    {
      title: "Shape memory alloy (SMA) reinforced composite for adaptive vibration control and shape recovery",
      details: "TEMP/E-1/54926/2021-MUM",
      status: "Provisionally filled"
    }
  ],
  awards: [
    {
      title: "Best Paper Award - INTERNATIONAL CONFERENCE ON SMART MECHANICAL SYSTEMS FOR SUSTAINABILITY (ICSMSS 2025)",
      details: "Dr./Mr./Ms. Rahul Kumbhar, Samir B. Kumbhar, Ranjit Anil Patil has been awarded the Best Paper Award for the paper titled Influence of Shape Memory Alloy (SMA) Wire Position and Transformation Temperature on the Natural Frequencies of SMA-Reinforced Composite Beams... in recognition of its outstanding quality, originality, and technical contribution."
    },
    {
      title: "Promising Young Teacher Award",
      details: "Ranjit A. Patil received the Promising Young Teacher Award 2023 in recognition of his valuable contributions to academia during the academic year 2022–23. The award was presented on 5 September 2023, by the Indian Society for Technical Education (ISTE)."
    }
  ],
  journals: [
    {
      title: "Bibliometric Analysis of Hydrogen-Powered Vehicle Safety and Reliability Research",
      journal: "Hydrogen (MDPI)",
      year: "2025",
      doi: "10.3390/hydrogen6020042"
    },
    {
      title: "Reliability and Risk Assessment of Solar Photovoltaic Panels Using FMEA",
      journal: "Sustainability (MDPI)",
      year: "2024",
      doi: "10.3390/su16104183"
    }
  ]
};

/* ===============================
   FETCH ORCID (AUTO-SYNC)
=============================== */

async function fetchFromORCID() {
  const response = await fetch(ORCID_API, {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) throw new Error("ORCID API failed");
  const data = await response.json();
  return data.group;
}

/* ===============================
   RENDER HTML CARDS
=============================== */

function createPublicationCard({ title, journal, year, doi }) {
  return `
    <article class="pub-card searchable">
      <h3>${title}</h3>
      <p><strong>${journal || ""}</strong> ${year ? `(${year})` : ""}</p>
      ${doi ? `<a href="${doi.startsWith('http') ? doi : `https://doi.org/${doi}`}" target="_blank">View Paper</a>` : ""}
    </article>
  `;
}

function createPatentCard({ title, details, status }) {
  return `
    <li style="margin-bottom: 1rem;">
      <strong>Indian Patent</strong> — <em>${title}</em><br>
      <span style="color: var(--text-muted);">${details}</span><br>
      <span style="color: var(--primary-color); font-weight: 500;">Status: ${status}</span>
    </li>
  `;
}

function createAwardCard({ title, details }) {
  return `
    <article class="pub-card">
      <h3>${title}</h3>
      <p>${details}</p>
    </article>
  `;
}

/* ===============================
   LOAD EVERYTHING
=============================== */

async function loadPublications() {
  const journalContainer = document.getElementById("journalList");
  const patentsContainer = document.getElementById("patentList");
  const awardsContainer = document.getElementById("awardsList");

  // Render Static/Manual Patents & Awards
  if (patentsContainer) {
    patentsContainer.innerHTML = publicationsData.patents.map(createPatentCard).join("");
    const statPatent = document.getElementById("stat-patent");
    if (statPatent) statPatent.innerText = publicationsData.patents.length;
  }
  
  if (awardsContainer) {
    awardsContainer.innerHTML = publicationsData.awards.map(createAwardCard).join("");
    const statAwards = document.getElementById("stat-awards");
    if (statAwards) statAwards.innerText = publicationsData.awards.length;
  }

  // Try fetching Journals from ORCID automatically
  let total = 0, journals = 0;
  
  try {
    if (journalContainer) journalContainer.innerHTML = "<p>Syncing automatically from ORCID…</p>";
    
    const orcidData = await fetchFromORCID();
    if (journalContainer) journalContainer.innerHTML = "";

    // If ORCID succeeds, we render from ORCID
    orcidData.forEach(pub => {
      const summary = pub["work-summary"][0];
      const type = summary?.type || "";

      total++;
      if (type === "journal-article" || type === "conference-paper") journals++;

      const title = summary?.title?.title?.value || "Untitled";
      const year = summary?.["publication-date"]?.year?.value || "—";
      const journal = summary?.["journal-title"]?.value || "—";

      const doiObj = summary?.["external-ids"]?.["external-id"]?.find(
        id => id["external-id-type"] === "doi" || id["external-id-type"] === "uri"
      );
      const doi = doiObj?.["external-id-url"]?.value || doiObj?.["external-id-value"];

      const cardHTML = createPublicationCard({ title, journal, year, doi });
      if (journalContainer) journalContainer.insertAdjacentHTML("beforeend", cardHTML);
    });

  } catch (error) {
    console.warn("ORCID failed, using manual fallback data", error);
    // If ORCID fails, use fallback data
    if (journalContainer) {
      journalContainer.innerHTML = "";
      publicationsData.journals.forEach(pub => {
        total++;
        journals++;
        journalContainer.insertAdjacentHTML("beforeend", createPublicationCard(pub));
      });
    }
  }

  // Update Stats
  const elTotal = document.getElementById("stat-total");
  const elJournal = document.getElementById("stat-journal");
  if (elTotal) elTotal.innerText = total + publicationsData.patents.length;
  if (elJournal) elJournal.innerText = journals;
}

document.addEventListener("DOMContentLoaded", loadPublications);
