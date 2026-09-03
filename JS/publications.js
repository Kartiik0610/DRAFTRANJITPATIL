/* =====================================================
   PUBLICATIONS — HYBRID SAFE LOADER
   Frontend-compatible + Backend-ready
===================================================== */

const ORCID_ID = "0000-0002-9047-9275";
const ORCID_API = `https://pub.orcid.org/v3.0/${ORCID_ID}/works`;

/* ===============================
   STATIC FALLBACK DATA
=============================== */

const fallbackPublications = [
  {
    title:
      "Bibliometric Analysis of Hydrogen-Powered Vehicle Safety and Reliability Research",
    journal: "Hydrogen (MDPI)",
    year: "2025",
    doi: "10.3390/hydrogen6020042"
  },
  {
    title:
      "Reliability and Risk Assessment of Solar Photovoltaic Panels Using FMEA",
    journal: "Sustainability (MDPI)",
    year: "2024",
    doi: "10.3390/su16104183"
  }
];

/* ===============================
   FETCH ORCID (BACKEND ONLY)
=============================== */

async function fetchFromORCID() {
  const response = await fetch(ORCID_API, {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error("ORCID blocked by browser");
  }

  const data = await response.json();
  return data.group;
}

/* ===============================
   RENDER CARD
=============================== */

function createPublicationCard({ title, journal, year, doi }) {
  return `
    <article class="pub-card searchable">
      <h3>${title}</h3>
      <p><strong>${journal}</strong> (${year})</p>
      ${
        doi
          ? `<a href="https://doi.org/${doi}" target="_blank">DOI</a>`
          : ""
      }
    </article>
  `;
}

/* ===============================
   LOAD PUBLICATIONS
=============================== */

async function loadPublications() {
  const journalContainer = document.getElementById("journalList");
  const confContainer = document.getElementById("conferenceList");
  const bookContainer = document.getElementById("bookChapterList");

  if (!journalContainer) return;

  journalContainer.innerHTML = "<p>Loading journals…</p>";
  if(confContainer) confContainer.innerHTML = "<p>Loading conferences…</p>";
  if(bookContainer) bookContainer.innerHTML = "<p>Loading book chapters…</p>";

  try {
    /* Attempt ORCID (will fail in browser) */
    const orcidData = await fetchFromORCID();

    journalContainer.innerHTML = "";
    if(confContainer) confContainer.innerHTML = "";
    if(bookContainer) bookContainer.innerHTML = "";

    let total = 0, journals = 0, confs = 0, books = 0;

    orcidData.forEach(pub => {
      const summary = pub["work-summary"][0];
      const type = summary?.type || "";

      total++;

      const title = summary?.title?.title?.value || "Untitled";
      const year = summary?.["publication-date"]?.year?.value || "—";
      const journal = summary?.["journal-title"]?.value || "—";

      const doiObj = summary?.["external-ids"]?.["external-id"]?.find(
        id => id["external-id-type"] === "doi"
      );
      const doi = doiObj?.["external-id-value"];

      const cardHTML = createPublicationCard({ title, journal, year, doi });

      if (type === "journal-article") {
        journals++;
        journalContainer.insertAdjacentHTML("beforeend", cardHTML);
      } else if (type === "conference-paper") {
        confs++;
        if(confContainer) confContainer.insertAdjacentHTML("beforeend", cardHTML);
      } else if (type === "book-chapter") {
        books++;
        if(bookContainer) bookContainer.insertAdjacentHTML("beforeend", cardHTML);
      } else {
        // Fallback or other type, just add to journal container
        journalContainer.insertAdjacentHTML("beforeend", cardHTML);
      }
    });

    const elTotal = document.getElementById("stat-total");
    const elJournal = document.getElementById("stat-journal");
    const elConf = document.getElementById("stat-conf");
    const elBook = document.getElementById("stat-book");
    
    if (elTotal) elTotal.innerText = total;
    if (elJournal) elJournal.innerText = journals;
    if (elConf) elConf.innerText = confs;
    if (elBook) elBook.innerText = books;

  } catch (error) {
    /* FALLBACK — ALWAYS WORKS */
    console.warn("Using fallback publications", error);

    journalContainer.innerHTML = "";
    fallbackPublications.forEach(pub => {
      journalContainer.insertAdjacentHTML(
        "beforeend",
        createPublicationCard(pub)
      );
    });
  }
}

document.addEventListener("DOMContentLoaded", loadPublications);
