const galleryData = [
  {
    title: "Dummy Album 1",
    description: "This is a placeholder album.",
    driveId: "PASTE_DRIVE_ID_HERE",
    layout: "normal"
  },
  {
    title: "Dummy Album 2",
    description: "This is a placeholder album.",
    driveId: "PASTE_DRIVE_ID_HERE",
    layout: "tall"
  },
  {
    title: "Dummy Album 3",
    description: "This is a placeholder album.",
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
