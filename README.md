## ResumeForge – Advanced Resume Builder

ResumeForge is a client‑side resume builder that helps you create professional, ATS‑optimized resumes with live preview, multiple templates, drag‑and‑drop section ordering, rich editing, and multi‑format export. It runs entirely in the browser – no backend required.

##To view the page

please visit - https://abislive.github.io/Resume-Builder/

##✨ Features

🎨 Design & Customization

12 distinct resume templates – Modern, Classic, Minimal, Sidebar, Creative, Executive, Timeline, Compact, Infographic, Elegant, Professional, Gradient.

Live preview with zoom, fit‑to‑screen, and page‑break indication.

Dynamic accent colors – pick primary and secondary theme colors.

Font pair selector – Inter, Playfair Display, JetBrains Mono, Poppins, Merriweather.

Spacing controls – tight, normal, relaxed.

Inline editing – click directly on preview elements to edit text with Markdown support.

##📝 Content Management

Personal information – name, contact, photo, social links.

Work experience – multiple entries with bullet points, date ranges, and “currently working” toggle.

Education – degrees, schools, years, details.

Skills – categorized with proficiency levels (Beginner, Intermediate, Expert) and drag‑to‑reorder.

Projects – name, link, description, bullet points.

Custom sections – add awards, publications, volunteer work, etc.

Languages & certifications.

Sample data – one‑click demo content.

##🧩 Advanced Functionality

Drag‑and‑drop reordering – sections, experience entries, education, projects (via SortableJS).

Section order control – rearrange how sections appear on the resume.

ATS score – real‑time feedback on contact details, action verbs, and impact metrics.

Job description matcher – paste a job description to see matched/missing keywords, including multi‑word phrases.

Markdown support in descriptions and bullets (**bold**, *italic*, URLs).

Version manager – save multiple resume versions (e.g., “Full‑Stack”, “DevOps”) and switch between them.

Auto‑save to localStorage with debounce.

##📤 Export & Persistence

PDF download – direct client‑side PDF generation via html2pdf.js.

Plain text export (.txt)

Markdown export (.md)

JSON export / import – backup and restore.

Print – A4 print styles with proper page breaks.

##📂 File Structure

ResumeForge/

├── index.html      # Main HTML structure

├── styles.css      # All styling, including template-specific CSS

├── script.js       # Application logic (state, rendering, events)

└── README.md       # This file

##🚀 Getting Started

Download or clone the repository.

Open index.html in a modern browser (Chrome, Edge, Firefox, Safari).

On first load, the template selection modal appears – choose a template.

Use the left panel to edit your resume; the preview updates instantly.

Use the toolbar above the preview to:

Zoom in/out or fit to screen.

Change font, spacing, and accent colors.

Toggle inline editing.

Download PDF, export TXT/MD/JSON, or print.

Use the Versions button (📁) to manage multiple resume profiles.

Note: No installation or build step is required. All dependencies are loaded via CDN.

##🔌 External Dependencies

Library	Purpose	CDN

SortableJS	Drag‑and‑drop reordering	https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js

html2pdf.js	Client‑side PDF generation	https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js

Google Fonts	Typography	https://fonts.googleapis.com/css2?family=...

All libraries are loaded from reliable CDNs. An internet connection is required for them (unless you self‑host the files).

##🧠 How It Works

The entire resume state is stored in a central JavaScript object (state) and persisted to localStorage.

The preview is rendered via a pure function that maps the state to HTML.

Form inputs update the state; the preview re‑renders automatically.

Inline edits use the contenteditable attribute and sync back to the state on blur (without losing focus).

Templates are implemented with CSS classes that change typography, borders, colors, and layout.

##⚙️ Browser Support

Optimized for modern evergreen browsers:

Google Chrome (latest)

Mozilla Firefox (latest)

Microsoft Edge (latest)

Safari (latest)

Older browsers may not support all CSS features (e.g., backdrop-filter) but will still function.

##🛠️ Known Limitations

PDF generation uses html2canvas; complex layouts with multiple pages may occasionally clip. For best results, use the browser’s Print → 
Save as PDF option.

The job description matcher uses a simple keyword/phrase comparison and is not a full NLP parser.

LocalStorage capacity (~5 MB) may limit the number of resume versions you can save, especially with photos.

##🔮 Future Enhancements

More templates (e.g., functional, hybrid, academic CV).

Rich text editor for bullet points.

LinkedIn import / JSON Resume schema support.

Real‑time grammar and spell check integration.

Multi‑page layout simulation with true page breaks.

Cloud sync (optional).

##📝 License

This project is provided for educational and personal use. You are free to modify and distribute it, but attribution is appreciated.

##🙏 Acknowledgements

SortableJS – drag‑and‑drop

html2pdf.js – PDF export

Google Fonts – typography

Happy resume building! 🚀
