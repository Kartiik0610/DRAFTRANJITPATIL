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
  const container = document.getElementById("journalList");

  if (!container) return;

  container.innerHTML = "<p>Loading publications…</p>";

  try {
    /* Attempt ORCID (will fail in browser) */
    const orcidData = await fetchFromORCID();

    container.innerHTML = "";

    orcidData.forEach(pub => {
      const summary = pub["work-summary"][0];

      const title =
        summary?.title?.title?.value || "Untitled";

      const year =
        summary?.["publication-date"]?.year?.value || "—";

      const journal =
        summary?.["journal-title"]?.value || "—";

      const doiObj =
        summary?.["external-ids"]?.["external-id"]?.find(
          id => id["external-id-type"] === "doi"
        );

      const doi = doiObj?.["external-id-value"];

      container.insertAdjacentHTML(
        "beforeend",
        createPublicationCard({ title, journal, year, doi })
      );
    });

  } catch (error) {
    /* FALLBACK — ALWAYS WORKS */
    console.warn("Using fallback publications", error);

    container.innerHTML = "";

    fallbackPublications.forEach(pub => {
      container.insertAdjacentHTML(
        "beforeend",
        createPublicationCard(pub)
      );
    });
  }
}

document.addEventListener("DOMContentLoaded", loadPublications);
