// REPLACE "YOUR_GID_HERE" WITH THE ACTUAL GID OF SHEET 3
// You can find the gid in your browser's URL bar when viewing Sheet 3 (e.g., #gid=12345678)
const CSV_URL = "https://docs.google.com/spreadsheets/d/1OPP7gnKAj-a7LimDhUwSYRmn6Rsqe_BuXDEa2143ap8/export?format=csv&gid=474175050";

function csvToArray(text) {
  let p = "", row = [""], ret = [row], i = 0, r = 0, s = !0, l;
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

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("eventsContainer");
  
  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) throw new Error("Network response was not ok");
    
    const csvText = await response.text();
    const rows = csvToArray(csvText.trim());
    const dataRows = rows.slice(1); // skip header
    
    if (dataRows.length === 0 || (dataRows.length === 1 && dataRows[0].length < 2)) {
      container.innerHTML = "<p>No events found.</p>";
      return;
    }

    dataRows.forEach(row => {
      // Event No: row[0], Title: row[1], Desc: row[2], Date: row[3]
      if (row.length < 2 || !row[1]) return; // Skip empty rows
      
      const title = row[1]?.trim();
      const desc = row[2]?.trim();
      const date = row[3]?.trim();
      
      // Helper to convert Google Drive share links to embeddable image links
      function getDirectImageUrl(url) {
        if (!url) return "";
        if (url.includes("drive.google.com")) {
          const match = url.match(/[-\w]{25,}/);
          if (match) {
            // Using the thumbnail endpoint is much more reliable for embedding Drive images
            return `https://drive.google.com/thumbnail?id=${match[0]}&sz=w1000`;
          }
        }
        return url;
      }

      // Images 1 to 6 (indexes 4 to 9)
      const images = [];
      for (let i = 4; i <= 9; i++) {
        if (row[i] && row[i].trim() !== "") {
          images.push(getDirectImageUrl(row[i].trim()));
        }
      }
      
      // PDF (index 10)
      const pdf = row[10]?.trim();
      
      // Create Event Card
      const card = document.createElement("div");
      card.className = "event-card";
      
      // Images HTML
      let imagesHTML = "";
      if (images.length > 0) {
        imagesHTML = `<div class="event-carousel">` + 
          images.map((img, idx) => `<img src="${img}" alt="Event Image" class="${idx === 0 ? 'active' : ''}" loading="lazy" />`).join("") + 
          `</div>`;
      }
      
      // PDF Button HTML
      let pdfHTML = "";
      if (pdf) {
        pdfHTML = `<a href="${pdf}" target="_blank" rel="noopener" class="event-pdf-btn">View Activity Report</a>`;
      }
      
      card.innerHTML = `
        <div class="event-header">
          <h3>${title}</h3>
          ${date ? `<span class="event-date">${date}</span>` : ""}
        </div>
        ${desc ? `<p class="event-desc">${desc}</p>` : ""}
        ${imagesHTML}
        ${pdfHTML}
      `;
      
      container.appendChild(card);
    });

    // Start carousel cycling
    startCarousels();
    
  } catch (error) {
    console.error("Failed to fetch events:", error);
    container.innerHTML = "<p>Failed to load events. Please ensure the CSV link (including the GID for Sheet 3) is correct in JS/photo-gallery.js.</p>";
  }
});

function startCarousels() {
  const carousels = document.querySelectorAll(".event-carousel");
  
  carousels.forEach(carousel => {
    const images = carousel.querySelectorAll("img");
    if (images.length <= 1) return; // No need to cycle if only 1 image
    
    let currentIndex = 0;
    setInterval(() => {
      images[currentIndex].classList.remove("active");
      currentIndex = (currentIndex + 1) % images.length;
      images[currentIndex].classList.add("active");
    }, 3000); // Change image every 3 seconds
  });
}
