# Dr. Ranjit A. Patil - Academic Portfolio Website

Welcome to the source code for the academic portfolio of Dr. Ranjit A. Patil. This website serves as a comprehensive profile showcasing research interests, publications, ongoing projects, and academic materials for students.

## 🚀 Features

- **Responsive Design**: Built with a modern, glassmorphism-inspired dark theme that works beautifully across desktop and mobile devices.
- **Modular Layout**: The navigation bar and footer are shared across all pages, dynamically loaded via `JS/layout.js`, making it incredibly easy to maintain or modify global components.
- **Dynamic Downloads Section**: Courses and study materials are rendered dynamically via `JS/downloads.js`, allowing for easy categorization of syllabi, assignments, and modules.
- **Security / Inspection Protection**: Includes a lightweight script in `layout.js` that disables right-clicking, F12, and common keyboard shortcuts (Ctrl+Shift+I, Ctrl+U, etc.) to prevent casual source code inspection and downloading of unauthorized content.
- **Organized Sections**:
  - **About**: Academic credentials and professional experience.
  - **Courses & Ongoing**: Details about ongoing subjects and activities.
  - **Downloads**: Categorized course materials with download links.
  - **Publications & Research**: Information on research interests, projects, and published papers.
  - **Photo Gallery**: Showcase of academic and professional events.

## 📂 Project Structure

- `index.html`: Home page/profile overview.
- `about.html`, `contact.html`, `courses.html`, `downloads.html`, `ongoing.html`, `publications.html`, `research-interest.html`, `research-projects.html`: Main pages for the respective sections.
- `CSS/`: Contains all stylesheets (`navbar.css`, `footer.css`, `profile.css`, etc.).
- `JS/`: Contains all JavaScript files. 
  - `layout.js` (handles shared navbar/footer and inspection protection).
  - `downloads.js` (data and logic for the downloads page).
- `PARTIALS/`: Contains the reusable `navbar.html` and `footer.html`.
- `assets/`: Folder for images and other static media.

## 🔮 Future Expansions

Here are some potential ideas for scaling and expanding this platform in the future:
1. **Content Management System (CMS)**: Transitioning from static `.js` data arrays (like `downloads.js`) to a backend database (e.g., Firebase, MongoDB, or Strapi) to allow Dr. Patil to upload files and edit text via a friendly admin dashboard without touching the code.
2. **Student Login Portal**: Adding an authentication system where only verified students can access specific notes, assignments, or quiz links.
3. **Blog / Announcements Board**: A dynamic section on the homepage for recent news, upcoming deadlines, or newly published papers.
4. **Interactive Publications List**: Connecting the publications page to an API (like Google Scholar API or ORCID) to automatically fetch and update the latest citations and research papers.
5. **Theme Toggle**: Adding a Light/Dark mode toggle (since the CSS already uses a `data-theme="dark"` attribute).

## 🛠️ How to Update Downloads
If you need to update the files, notes, or assignments in the Downloads section, please refer to the `README_DOWNLOADS.md` file for step-by-step instructions.
