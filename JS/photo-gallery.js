const galleryData = [
  {
    title: "Attended an inspirational talk of NASA ",
    description: "Astronaut Jeanette Epps at University of Maryland, College Park, USA",
    driveId: "https://lh3.googleusercontent.com/sitesv/AAzXCkfX9m9Iq1wJFCcSSnCGPz2pFu9WZitJy88qG99n6a7XpZ7Ty1O2QYoURRDpLWaX4GTS2rUkRaRFBbWY1s5-8EPr1ewIM-Up9-Bnb3BN8BXW3BqHA-G1MsifEfBehpYx-LChc0BCycpXkGh7Gdo5JAvV_9wV_U3PY9iOC414mqqqisom9aFHTWgMUqZuVZXq36JjyLCBV8SxHrBq7GDV9oR2fxJpv_rqJzZId1A=w1280",
    layout: "tall"
  },
  {
    title: "Discovery Space Shuttle",
    description: "Udvar-Hazy Center in Chantilly, Virginia",
    driveId: "PASTE_DRIVE_ID_HERE",
    layout: "normal"
  },
  {
    title: "With Dr. San and Dr. Mellal ",
    description: "M-Circle, University of Maryland, College Park, USA",
    driveId: "PASTE_DRIVE_ID_HERE",
    layout: "tall"
  },
  {
    title: "Great Interaction with Dr. Darryll J. Pines",
    description: "President, University of Maryland, College Park, USA",
    driveId: "PASTE_DRIVE_ID_HERE",
    layout: "normal"
  }
];

const galleryGrid = document.getElementById("galleryGrid");

galleryData.forEach(item => {
  const figure = document.createElement("figure");
  figure.className = `gallery-item ${item.layout || ""}`;

  figure.innerHTML = `
    <img
      src="https://drive.google.com/uc?export=view&id=${item.driveId}"
      alt="${item.title}"
      loading="lazy"
    />
    <figcaption>
      <h3>${item.title}</h3>
      <p>${item.description}</p>
    </figcaption>
  `;

  galleryGrid.appendChild(figure);
});
