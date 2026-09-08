// ============ CONFIGURATION & CONSTANTS ============
const TEMPLATES = [
    { id: 'modern', name: 'Modern', thumb: 'linear-gradient(180deg,#6366f1 30%,#fff 30%)' },
    { id: 'classic', name: 'Classic', thumb: 'linear-gradient(180deg,#1a1a1a 25%,#fafafa 25%)' },
    { id: 'minimal', name: 'Minimal', thumb: 'linear-gradient(180deg,#fff 35%,#f1f5f9 35%)' },
    { id: 'sidebar', name: 'Sidebar', thumb: 'linear-gradient(90deg,#6366f1 35%,#fff 35%)' },
    { id: 'creative', name: 'Creative', thumb: 'linear-gradient(135deg,#fdf2f8 50%,#ede9fe 50%)' },
    { id: 'executive', name: 'Executive', thumb: 'linear-gradient(180deg,#1e293b 20%,#fafafa 20%)' },
    { id: 'timeline', name: 'Timeline', thumb: 'linear-gradient(180deg,#fff 15%,#f8fafc 15%)' },
    { id: 'compact', name: 'Compact', thumb: '#fafafa' },
    { id: 'infographic', name: 'Infographic', thumb: 'linear-gradient(180deg,#6366f1 25%,#fff 25%)' },
    { id: 'elegant', name: 'Elegant', thumb: 'linear-gradient(180deg,#1a1a1a 15%,#fff 15%)' },
    { id: 'professional', name: 'Professional', thumb: 'linear-gradient(180deg,#1e3a5f 20%,#fff 20%)' },
    { id: 'gradient', name: 'Gradient', thumb: 'linear-gradient(135deg,#6366f1,#ec4899)' }
];

const FONT_PAIRS = {
    default: { heading: 'Inter', body: 'Inter' },
    serif: { heading: 'Playfair Display', body: 'Merriweather' },
    mono: { heading: 'JetBrains Mono', body: 'JetBrains Mono' },
    poppins: { heading: 'Poppins', body: 'Poppins' },
    merriweather: { heading: 'Merriweather', body: 'Lora' }
};

const STOPWORDS = new Set([
    'about','above','after','again','against','all','and','any','are','aren\'t','because','been','before','being','below',
    'between','both','but','can','cannot','could','did','do','does','doing','don\'t','down','during','each','few','for',
    'from','further','had','has','have','having','her','here','hers','herself','him','himself','his','how','into','its',
    'itself','just','more','most','must','myself','nor','not','off','once','only','other','ought','our','ours','ourselves',
    'out','over','own','same','she','should','some','such','than','that','the','their','theirs','them','themselves',
    'then','there','these','they','this','those','through','too','under','until','very','was','wasn\'t','were','we\'re',
    'what','when','where','which','while','who','whom','why','with','won\'t','would','you','your','yours','yourself'
]);

// ============ STATE & VERSION MANAGER ============
let currentVersionId = 'default';
let state = null;
let versions = {};

function loadVersions() {
    const saved = localStorage.getItem('resumeForge_versions');
    if (saved) {
        try { versions = JSON.parse(saved); } catch(e) { versions = {}; }
    }
    if (!versions.default) {
        versions = { default: getDefaultState() };
        saveVersions();
    }
    currentVersionId = localStorage.getItem('resumeForge_currentVersion') || 'default';
    if (!versions[currentVersionId]) currentVersionId = 'default';
    state = JSON.parse(JSON.stringify(versions[currentVersionId]));
}

function saveVersions() {
    localStorage.setItem('resumeForge_versions', JSON.stringify(versions));
    localStorage.setItem('resumeForge_currentVersion', currentVersionId);
}

function saveState() {
    versions[currentVersionId] = JSON.parse(JSON.stringify(state));
    saveVersions();
    updateATS();
}

function switchVersion(id) {
    if (!versions[id]) return;
    currentVersionId = id;
    state = JSON.parse(JSON.stringify(versions[id]));
    saveVersions();
    applyStateToForm();
    buildSectionOrder();
    buildTemplateGrid();
    renderPreview();
    updateVersionList();
    showToast(`Switched to "${versions[id].versionName || id}"`);
}

function cloneVersion(name) {
    const newId = 'v_' + Date.now();
    const newState = JSON.parse(JSON.stringify(state));
    newState.versionName = name || 'Untitled';
    versions[newId] = newState;
    saveVersions();
    currentVersionId = newId;
    state = newState;
    applyStateToForm();
    buildSectionOrder();
    renderPreview();
    updateVersionList();
    showToast(`Created new version "${newState.versionName}"`);
}

function deleteVersion(id) {
    if (id === 'default') {
        showToast('Cannot delete the default version');
        return;
    }
    delete versions[id];
    if (currentVersionId === id) {
        currentVersionId = 'default';
        state = JSON.parse(JSON.stringify(versions.default));
    }
    saveVersions();
    applyStateToForm();
    buildSectionOrder();
    renderPreview();
    updateVersionList();
    showToast('Version deleted');
}

function getDefaultState() {
    return {
        personal: { fullName: '', jobTitle: '', email: '', phone: '', location: '', website: '', summary: '', linkedin: '', github: '', twitter: '', photo: '' },
        skills: [],
        experience: [],
        education: [],
        projects: [],
        customSections: [],
        languages: '',
        certifications: '',
        template: 'modern',
        accentPrimary: '#6366f1',
        accentSecondary: '#8b5cf6',
        fontPair: 'default',
        spacing: 'normal',
        sectionsOrder: ['summary', 'experience', 'education', 'projects', 'skills', 'custom', 'languages'],
        zoom: 1,
        atsScore: 0,
        inlineEdit: false,
        versionName: 'Default'
    };
}

// ============ UTILITY ============
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);
const escapeHtml = str => (str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

function showToast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
    loadVersions();
    buildTemplateGrid();
    buildSectionOrder();
    applyStateToForm();
    renderPreview();
    setupListeners();
    updateVersionList();
});

// ============ TEMPLATE GRID ============
function buildTemplateGrid() {
    const grid = $('#templateGrid');
    grid.innerHTML = '';
    TEMPLATES.forEach(t => {
        const card = document.createElement('div');
        card.className = `template-card ${t.id === state.template ? 'selected' : ''}`;
        card.dataset.template = t.id;
        card.innerHTML = `<div class="template-thumb" style="background:${t.thumb}"></div><span>${t.name}</span>`;
        card.addEventListener('click', () => {
            state.template = t.id;
            $$('.template-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            $('#templateModal').classList.remove('active');
            saveState();
            renderPreview();
            showToast(`Template changed to ${t.name}`);
        });
        grid.appendChild(card);
    });
}

// ============ SECTION ORDER ============
function buildSectionOrder() {
    const container = $('#sectionOrderList');
    container.innerHTML = '';
    state.sectionsOrder.forEach(sec => {
        const chip = document.createElement('span');
        chip.className = 'order-chip';
        chip.textContent = sec;
        chip.dataset.section = sec;
        container.appendChild(chip);
    });
    if (window.Sortable) {
        new Sortable(container, {
            animation: 150,
            onEnd: () => {
                state.sectionsOrder = [...$$('#sectionOrderList .order-chip')].map(c => c.dataset.section);
                saveState();
                renderPreview();
            }
        });
    }
}

// ============ APPLY STATE TO FORM ============
function applyStateToForm() {
    const p = state.personal;
    $('#fullName').value = p.fullName;
    $('#jobTitle').value = p.jobTitle;
    $('#email').value = p.email;
    $('#phone').value = p.phone;
    $('#location').value = p.location;
    $('#website').value = p.website;
    $('#summary').value = p.summary;
    $('#summaryCount').textContent = `${p.summary.length} / 500`;
    $('#linkedin').value = p.linkedin;
    $('#github').value = p.github;
    $('#twitter').value = p.twitter;

    if (p.photo) {
        $('#photoPreview').innerHTML = `<img src="${p.photo}" alt="Profile">`;
        $('#removePhoto').style.display = 'inline-flex';
    } else {
        $('#photoPreview').innerHTML = '📷';
        $('#removePhoto').style.display = 'none';
    }

    renderAllForms();
    $('#languages').value = state.languages;
    $('#certifications').value = state.certifications;
    $('#accentPrimary').value = state.accentPrimary;
    $('#accentSecondary').value = state.accentSecondary;
    $('#fontSelect').value = state.fontPair;
    $('#spacingSelect').value = state.spacing;
}

function renderAllForms() {
    renderSkillsForm();
    renderExperienceForm();
    renderEducationForm();
    renderProjectsForm();
    renderCustomSectionsForm();
}

// ============ FORM RENDERERS ============
function renderSkillsForm() {
    const container = $('#skillsContainer');
    container.innerHTML = '';
    state.skills.forEach((cat, catIdx) => {
        const div = document.createElement('div');
        div.className = 'skill-category';
        div.innerHTML = `
            <div class="skill-cat-header">
                <input class="cat-name" value="${escapeHtml(cat.category)}" placeholder="Category" data-cat="${catIdx}">
                <button class="btn-remove remove-cat" data-cat="${catIdx}" type="button">✕</button>
            </div>
            <div class="skill-list">
                ${cat.items.map((item, itemIdx) => `
                    <span class="skill-item">
                        ${escapeHtml(item.name)}
                        <select class="proficiency" data-cat="${catIdx}" data-item="${itemIdx}">
                            <option value="Beginner" ${item.proficiency==='Beginner'?'selected':''}>Beginner</option>
                            <option value="Intermediate" ${item.proficiency==='Intermediate'?'selected':''}>Intermediate</option>
                            <option value="Expert" ${item.proficiency==='Expert'?'selected':''}>Expert</option>
                        </select>
                        <span class="remove-skill" data-cat="${catIdx}" data-item="${itemIdx}">×</span>
                    </span>
                `).join('')}
                <input class="add-skill-input" placeholder="Add skill + Enter" data-cat="${catIdx}">
            </div>
        `;
        container.appendChild(div);
    });
}

function renderExperienceForm() {
    const container = $('#experienceContainer');
    container.innerHTML = '';
    state.experience.forEach((exp, idx) => {
        const div = document.createElement('div');
        div.className = 'entry-form';
        div.dataset.idx = idx;  // <-- FIX: data-idx on root
        div.innerHTML = `
            <div class="entry-header" style="cursor: grab;">
                <button class="collapse-toggle" type="button">▼ ${escapeHtml(exp.title) || 'Experience'}</button>
                <button class="btn-remove remove-exp" data-idx="${idx}" type="button">✕</button>
            </div>
            <div class="entry-body">
                <div class="form-row">
                    <input class="exp-title" placeholder="Job Title" value="${escapeHtml(exp.title)}" data-idx="${idx}">
                    <input class="exp-company" placeholder="Company" value="${escapeHtml(exp.company)}" data-idx="${idx}">
                </div>
                <div class="form-row">
                    <select class="exp-start-month" data-idx="${idx}">
                        ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => `<option ${exp.startMonth===m?'selected':''}>${m}</option>`).join('')}
                    </select>
                    <input class="exp-start-year" type="number" placeholder="Year" value="${escapeHtml(exp.startYear)}" data-idx="${idx}">
                </div>
                <div class="form-row">
                    <select class="exp-end-month" data-idx="${idx}" ${exp.present?'disabled':''}>
                        <option value="">Month</option>
                        ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => `<option ${exp.endMonth===m?'selected':''}>${m}</option>`).join('')}
                    </select>
                    <input class="exp-end-year" type="number" placeholder="Year" value="${escapeHtml(exp.endYear)}" data-idx="${idx}" ${exp.present?'disabled':''}>
                </div>
                <label style="font-size:0.8rem; cursor:pointer; display:flex; align-items:center; gap:0.3rem;">
                    <input type="checkbox" class="exp-present" data-idx="${idx}" ${exp.present?'checked':''}> Currently working here
                </label>
                <div class="bullet-list">
                    ${exp.bullets.map((b, bIdx) => `
                        <div class="bullet-item">
                            <input class="exp-bullet" value="${escapeHtml(b)}" data-idx="${idx}" data-bullet="${bIdx}">
                            <button class="remove-bullet" data-idx="${idx}" data-bullet="${bIdx}" type="button">×</button>
                        </div>
                    `).join('')}
                    <input class="add-bullet" placeholder="Add accomplishment + Enter" data-idx="${idx}">
                </div>
            </div>
        `;
        container.appendChild(div);
    });

    // Sortable for experience entries
    if (window.Sortable) {
        new Sortable(container, {
            animation: 150,
            handle: '.entry-header',
            onEnd: () => {
                const newOrder = [...$$('#experienceContainer .entry-form')].map(el => parseInt(el.dataset.idx, 10));
                state.experience = newOrder.map(i => state.experience[i]);
                saveState();
                renderExperienceForm();
                renderPreview();
            }
        });
    }
}

function renderEducationForm() {
    const container = $('#educationContainer');
    container.innerHTML = '';
    state.education.forEach((edu, idx) => {
        const div = document.createElement('div');
        div.className = 'entry-form';
        div.dataset.idx = idx;  // FIX
        div.innerHTML = `
            <div class="entry-header" style="cursor: grab;">
                <button class="collapse-toggle" type="button">▼ ${escapeHtml(edu.degree) || 'Education'}</button>
                <button class="btn-remove remove-edu" data-idx="${idx}" type="button">✕</button>
            </div>
            <div class="entry-body">
                <div class="form-row">
                    <input class="edu-degree" placeholder="Degree" value="${escapeHtml(edu.degree)}" data-idx="${idx}">
                    <input class="edu-school" placeholder="School" value="${escapeHtml(edu.school)}" data-idx="${idx}">
                </div>
                <div class="form-row">
                    <input class="edu-start-year" type="number" placeholder="Start Year" value="${escapeHtml(edu.startYear)}" data-idx="${idx}">
                    <input class="edu-end-year" type="number" placeholder="End Year" value="${escapeHtml(edu.endYear)}" data-idx="${idx}">
                </div>
                <input class="edu-details" placeholder="Details" value="${escapeHtml(edu.details)}" data-idx="${idx}">
            </div>
        `;
        container.appendChild(div);
    });
    // Sortable for education entries
    if (window.Sortable) {
        new Sortable(container, {
            animation: 150,
            handle: '.entry-header',
            onEnd: () => {
                const newOrder = [...$$('#educationContainer .entry-form')].map(el => parseInt(el.dataset.idx, 10));
                state.education = newOrder.map(i => state.education[i]);
                saveState();
                renderEducationForm();
                renderPreview();
            }
        });
    }
}

function renderProjectsForm() {
    const container = $('#projectsContainer');
    container.innerHTML = '';
    state.projects.forEach((proj, idx) => {
        const div = document.createElement('div');
        div.className = 'entry-form';
        div.dataset.idx = idx;  // FIX
        div.innerHTML = `
            <div class="entry-header" style="cursor: grab;">
                <button class="collapse-toggle" type="button">▼ ${escapeHtml(proj.name) || 'Project'}</button>
                <button class="btn-remove remove-proj" data-idx="${idx}" type="button">✕</button>
            </div>
            <div class="entry-body">
                <div class="form-row">
                    <input class="proj-name" placeholder="Project Name" value="${escapeHtml(proj.name)}" data-idx="${idx}">
                    <input class="proj-link" placeholder="Link" value="${escapeHtml(proj.link)}" data-idx="${idx}">
                </div>
                <textarea class="proj-desc" placeholder="Description" data-idx="${idx}">${escapeHtml(proj.description)}</textarea>
                <div class="bullet-list">
                    ${proj.bullets.map((b, bIdx) => `
                        <div class="bullet-item">
                            <input class="proj-bullet" value="${escapeHtml(b)}" data-idx="${idx}" data-bullet="${bIdx}">
                            <button class="remove-bullet" data-idx="${idx}" data-bullet="${bIdx}" type="button">×</button>
                        </div>
                    `).join('')}
                    <input class="add-bullet-proj" placeholder="Add bullet + Enter" data-idx="${idx}">
                </div>
            </div>
        `;
        container.appendChild(div);
    });
    // Sortable for projects entries
    if (window.Sortable) {
        new Sortable(container, {
            animation: 150,
            handle: '.entry-header',
            onEnd: () => {
                const newOrder = [...$$('#projectsContainer .entry-form')].map(el => parseInt(el.dataset.idx, 10));
                state.projects = newOrder.map(i => state.projects[i]);
                saveState();
                renderProjectsForm();
                renderPreview();
            }
        });
    }
}

function renderCustomSectionsForm() {
    const container = $('#customSectionsContainer');
    container.innerHTML = '';
    state.customSections.forEach((sec, secIdx) => {
        const div = document.createElement('div');
        div.className = 'entry-form';
        div.dataset.sec = secIdx;
        div.innerHTML = `
            <input class="custom-sec-title" placeholder="Section Title" value="${escapeHtml(sec.title)}" data-sec="${secIdx}">
            <button class="btn-remove remove-custom-sec" data-sec="${secIdx}" type="button">✕</button>
            <div class="custom-entries">
                ${sec.entries.map((entry, entryIdx) => `
                    <div class="custom-entry" style="border:1px solid var(--border); padding:0.5rem; margin:0.4rem 0; border-radius:6px;" data-entry="${entryIdx}">
                        <div class="form-row">
                            <input class="custom-entry-title" placeholder="Title" value="${escapeHtml(entry.title)}" data-sec="${secIdx}" data-entry="${entryIdx}">
                            <input class="custom-entry-date" placeholder="Date" value="${escapeHtml(entry.date)}" data-sec="${secIdx}" data-entry="${entryIdx}">
                        </div>
                        <input class="custom-entry-subtitle" placeholder="Subtitle / Organization" value="${escapeHtml(entry.subtitle)}" data-sec="${secIdx}" data-entry="${entryIdx}" style="margin-bottom:0.4rem;">
                        <textarea class="custom-entry-desc" placeholder="Description" data-sec="${secIdx}" data-entry="${entryIdx}">${escapeHtml(entry.description)}</textarea>
                        <button class="btn-remove remove-custom-entry" data-sec="${secIdx}" data-entry="${entryIdx}" type="button">Remove Item</button>
                    </div>
                `).join('')}
                <button class="btn btn-sm btn-ghost add-custom-entry" data-sec="${secIdx}" type="button">+ Add Entry</button>
            </div>
        `;
        container.appendChild(div);
    });
}

// ============ PREVIEW ============
function renderPreview() {
    const resumePaper = $('#resumePaper');
    resumePaper.style.setProperty('--accent-primary', state.accentPrimary);
    resumePaper.style.setProperty('--accent-secondary', state.accentSecondary);

    const fp = FONT_PAIRS[state.fontPair] || FONT_PAIRS.default;
    resumePaper.style.setProperty('--font-heading', fp.heading);
    resumePaper.style.setProperty('--font-body', fp.body);
    resumePaper.style.fontFamily = fp.body;

    const spacing = state.spacing;
    let lineHeight = 1.5;
    if (spacing === 'tight') lineHeight = 1.35;
    if (spacing === 'relaxed') lineHeight = 1.7;
    resumePaper.style.lineHeight = lineHeight;

    const p = state.personal;
    const contactParts = [];
    if (p.email) contactParts.push({ type: 'email', value: p.email });
    if (p.phone) contactParts.push({ type: 'phone', value: p.phone });
    if (p.location) contactParts.push({ type: 'location', value: p.location });
    if (p.website) contactParts.push({ type: 'website', value: p.website });
    if (p.linkedin) contactParts.push({ type: 'linkedin', value: p.linkedin });
    if (p.github) contactParts.push({ type: 'github', value: p.github });

    if (state.template === 'sidebar') {
        resumePaper.innerHTML = buildSidebarTemplate(p, contactParts);
    } else {
        resumePaper.innerHTML = buildStandardTemplate(p, contactParts);
    }

    resumePaper.className = `resume-paper template-${state.template}`;
    resumePaper.style.transform = `scale(${state.zoom})`;
    $('#zoomLevel').textContent = `${Math.round(state.zoom * 100)}%`;

    // Inline editing mode
    if (state.inlineEdit) {
        resumePaper.setAttribute('contenteditable', 'true');
        resumePaper.querySelectorAll('.editable').forEach(el => el.setAttribute('contenteditable', 'true'));
    } else {
        resumePaper.removeAttribute('contenteditable');
        resumePaper.querySelectorAll('.editable').forEach(el => el.removeAttribute('contenteditable'));
    }

    const indicator = $('#pageBreakIndicator');
    if (resumePaper.scrollHeight > 1050) {
        indicator.style.display = 'block';
        indicator.textContent = '⚠️ Content may exceed single page (A4)';
    } else {
        indicator.style.display = 'none';
    }
}

// SVG contact icon generator
function contactIcon(type) {
    const icons = {
        email: '<svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>',
        phone: '<svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>',
        location: '<svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
        website: '<svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/></svg>',
        linkedin: '<svg viewBox="0 0 24 24"><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.27c-.97 0-1.75-.79-1.75-1.76s.78-1.76 1.75-1.76 1.75.79 1.75 1.76-.78 1.76-1.75 1.76zm13.5 12.27h-3v-5.6c0-1.34-.03-3.07-1.87-3.07-1.87 0-2.16 1.46-2.16 2.97v5.7h-3v-11h2.88v1.5h.04c.4-.76 1.38-1.56 2.84-1.56 3.04 0 3.6 2 3.6 4.6v6.46z"/></svg>',
        github: '<svg viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>'
    };
    return icons[type] || '';
}

function buildStandardTemplate(p, contactParts) {
    let contactHtml = contactParts.map(c => `<span style="display:inline-flex;align-items:center;">${contactIcon(c.type)} ${escapeHtml(c.value)}</span>`).join('');
    let html = '';
    if (p.photo) {
        html += `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                <div>
                    <h1 class="editable" data-field="fullName">${escapeHtml(p.fullName) || 'Your Name'}</h1>
                    <div class="job-title editable" data-field="jobTitle">${escapeHtml(p.jobTitle) || 'Professional Title'}</div>
                    ${contactHtml ? `<div class="contact-line">${contactHtml}</div>` : ''}
                </div>
                <img src="${p.photo}" style="width:75px;height:75px;border-radius:50%;object-fit:cover;border:2px solid var(--accent-primary);" alt="Profile">
            </div>
        `;
    } else {
        html += `
            <div style="margin-bottom:1rem;">
                <h1 class="editable" data-field="fullName">${escapeHtml(p.fullName) || 'Your Name'}</h1>
                <div class="job-title editable" data-field="jobTitle">${escapeHtml(p.jobTitle) || 'Professional Title'}</div>
                ${contactHtml ? `<div class="contact-line">${contactHtml}</div>` : ''}
            </div>
        `;
    }
    html += renderSectionsContent();
    return html;
}

function buildSidebarTemplate(p, contactParts) {
    let sidebar = `<div class="sidebar">`;
    if (p.photo) {
        sidebar += `<img src="${p.photo}" style="width:90px;height:90px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,0.8); margin:0 auto 1rem; display:block;" alt="Profile">`;
    }
    sidebar += `<h1 class="editable" data-field="fullName">${escapeHtml(p.fullName) || 'Your Name'}</h1>`;
    sidebar += `<div class="job-title editable" data-field="jobTitle">${escapeHtml(p.jobTitle) || 'Professional Title'}</div>`;
    if (contactParts.length) {
        sidebar += `<div class="section-title">Contact</div><div class="sidebar-contact">${contactParts.map(c => `<div style="display:flex;align-items:center;gap:0.3rem;">${contactIcon(c.type)} ${escapeHtml(c.value)}</div>`).join('')}</div>`;
    }
    if (state.skills.length) {
        sidebar += `<div class="section-title">Skills</div>`;
        state.skills.forEach(cat => {
            sidebar += `<div style="font-size:0.75rem;font-weight:600;margin-top:0.4rem;color:rgba(255,255,255,0.9);">${escapeHtml(cat.category)}</div>`;
            sidebar += `<div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-top:0.2rem;">`;
            cat.items.forEach(item => {
                sidebar += `<span style="background:rgba(255,255,255,0.2);color:white;padding:0.15rem 0.4rem;border-radius:12px;font-size:0.7rem;">${escapeHtml(item.name)}</span>`;
            });
            sidebar += `</div>`;
        });
    }
    if (state.languages) sidebar += `<div class="section-title">Languages</div><div class="sidebar-contact">${escapeHtml(state.languages)}</div>`;
    sidebar += `</div>`;
    let main = `<div class="main-content">`;
    main += renderSectionsContent(['skills', 'languages']);
    main += `</div>`;
    return sidebar + main;
}

// ============ SECTION RENDERING ============
function renderSectionsContent(skipSections = []) {
    let html = '';
    const p = state.personal;
    state.sectionsOrder.forEach(sec => {
        if (skipSections.includes(sec)) return;
        switch (sec) {
            case 'summary':
                if (p.summary) html += `<div class="section-title">Summary</div><p class="editable" data-field="summary" style="white-space: pre-wrap;">${renderMarkdown(p.summary)}</p>`;
                break;
            case 'experience':
                if (state.experience.length) {
                    html += `<div class="section-title">Experience</div>`;
                    state.experience.forEach((exp, idx) => {
                        html += `
                            <div class="entry">
                                <div class="entry-header">
                                    <span class="entry-title editable" data-field="exp-title-${idx}">${escapeHtml(exp.title)}</span>
                                    <span class="entry-date">${formatDate(exp)}</span>
                                </div>
                                ${exp.company ? `<div class="entry-subtitle editable" data-field="exp-company-${idx}">${escapeHtml(exp.company)}</div>` : ''}
                                ${exp.bullets.length ? `<ul>${exp.bullets.map((b, bIdx) => `<li class="editable" data-field="exp-bullet-${idx}-${bIdx}">${renderMarkdown(b)}</li>`).join('')}</ul>` : ''}
                            </div>
                        `;
                    });
                }
                break;
            case 'education':
                if (state.education.length) {
                    html += `<div class="section-title">Education</div>`;
                    state.education.forEach((edu, idx) => {
                        html += `
                            <div class="entry">
                                <div class="entry-header">
                                    <span class="entry-title editable" data-field="edu-degree-${idx}">${escapeHtml(edu.degree)}</span>
                                    <span class="entry-date">${escapeHtml(edu.startYear)}${edu.endYear ? ` – ${escapeHtml(edu.endYear)}` : ''}</span>
                                </div>
                                ${edu.school ? `<div class="entry-subtitle editable" data-field="edu-school-${idx}">${escapeHtml(edu.school)}</div>` : ''}
                                ${edu.details ? `<p class="editable" data-field="edu-details-${idx}">${escapeHtml(edu.details)}</p>` : ''}
                            </div>
                        `;
                    });
                }
                break;
            case 'projects':
                if (state.projects.length) {
                    html += `<div class="section-title">Projects</div>`;
                    state.projects.forEach((proj, idx) => {
                        html += `
                            <div class="entry">
                                <div class="entry-header">
                                    <span class="entry-title editable" data-field="proj-name-${idx}">${escapeHtml(proj.name)}</span>
                                    ${proj.link ? `<a href="${escapeHtml(proj.link)}" target="_blank" style="color:var(--accent-primary);text-decoration:none;font-size:0.75rem;">↗ Link</a>` : ''}
                                </div>
                                ${proj.description ? `<p class="editable" data-field="proj-desc-${idx}">${renderMarkdown(proj.description)}</p>` : ''}
                                ${proj.bullets.length ? `<ul>${proj.bullets.map((b, bIdx) => `<li class="editable" data-field="proj-bullet-${idx}-${bIdx}">${renderMarkdown(b)}</li>`).join('')}</ul>` : ''}
                            </div>
                        `;
                    });
                }
                break;
            case 'skills':
                if (state.skills.length) {
                    html += `<div class="section-title">Skills</div>`;
                    state.skills.forEach(cat => {
                        html += `
                            <div class="skill-cat-row">
                                <span class="skill-cat-name">${escapeHtml(cat.category)}:</span>
                                <div class="skills-inline-list">
                                    ${cat.items.map(item => `<span class="skill-chip">${escapeHtml(item.name)} <span class="proficiency-dot" style="background:${item.proficiency === 'Expert' ? 'var(--accent-primary)' : item.proficiency === 'Intermediate' ? 'var(--accent-secondary)' : '#cbd5e1'}"></span></span>`).join('')}
                                </div>
                            </div>
                        `;
                    });
                }
                break;
            case 'custom':
                state.customSections.forEach((cs, csIdx) => {
                    html += `<div class="section-title">${escapeHtml(cs.title)}</div>`;
                    cs.entries.forEach((entry, entryIdx) => {
                        html += `
                            <div class="entry">
                                <div class="entry-header">
                                    <span class="entry-title editable" data-field="custom-title-${csIdx}-${entryIdx}">${escapeHtml(entry.title)}</span>
                                    ${entry.date ? `<span class="entry-date">${escapeHtml(entry.date)}</span>` : ''}
                                </div>
                                ${entry.subtitle ? `<div class="entry-subtitle editable" data-field="custom-subtitle-${csIdx}-${entryIdx}">${escapeHtml(entry.subtitle)}</div>` : ''}
                                ${entry.description ? `<p class="editable" data-field="custom-desc-${csIdx}-${entryIdx}">${renderMarkdown(entry.description)}</p>` : ''}
                            </div>
                        `;
                    });
                });
                break;
            case 'languages':
                if (state.languages) html += `<div class="section-title">Languages</div><p>${escapeHtml(state.languages)}</p>`;
                if (state.certifications) html += `<div class="section-title">Certifications</div><p class="editable" data-field="certifications" style="white-space:pre-wrap;">${renderMarkdown(state.certifications)}</p>`;
                break;
        }
    });
    return html;
}

// ============ MARKDOWN ============
function renderMarkdown(text) {
    if (!text) return '';
    let html = escapeHtml(text);
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
    return html;
}

// ============ INLINE EDIT SYNC (FULL) ============
function syncInlineEdits() {
    if (!state.inlineEdit) return;
    $$('#resumePaper .editable[data-field]').forEach(el => {
        const field = el.dataset.field;
        const text = el.innerText.trim();
        if (field === 'fullName') state.personal.fullName = text;
        else if (field === 'jobTitle') state.personal.jobTitle = text;
        else if (field === 'summary') state.personal.summary = text;
        else if (field === 'certifications') state.certifications = text;
        else if (field.startsWith('exp-title-')) {
            const idx = parseInt(field.split('-')[2], 10);
            if (!isNaN(idx)) state.experience[idx].title = text;
        }
        else if (field.startsWith('exp-company-')) {
            const idx = parseInt(field.split('-')[2], 10);
            if (!isNaN(idx)) state.experience[idx].company = text;
        }
        else if (field.startsWith('exp-bullet-')) {
            const parts = field.split('-');
            const idx = parseInt(parts[2], 10);
            const bIdx = parseInt(parts[3], 10);
            if (!isNaN(idx) && !isNaN(bIdx)) state.experience[idx].bullets[bIdx] = text;
        }
        else if (field.startsWith('edu-degree-')) {
            const idx = parseInt(field.split('-')[2], 10);
            if (!isNaN(idx)) state.education[idx].degree = text;
        }
        else if (field.startsWith('edu-school-')) {
            const idx = parseInt(field.split('-')[2], 10);
            if (!isNaN(idx)) state.education[idx].school = text;
        }
        else if (field.startsWith('edu-details-')) {
            const idx = parseInt(field.split('-')[2], 10);
            if (!isNaN(idx)) state.education[idx].details = text;
        }
        else if (field.startsWith('proj-name-')) {
            const idx = parseInt(field.split('-')[2], 10);
            if (!isNaN(idx)) state.projects[idx].name = text;
        }
        else if (field.startsWith('proj-desc-')) {
            const idx = parseInt(field.split('-')[2], 10);
            if (!isNaN(idx)) state.projects[idx].description = text;
        }
        else if (field.startsWith('proj-bullet-')) {
            const parts = field.split('-');
            const idx = parseInt(parts[2], 10);
            const bIdx = parseInt(parts[3], 10);
            if (!isNaN(idx) && !isNaN(bIdx)) state.projects[idx].bullets[bIdx] = text;
        }
        else if (field.startsWith('custom-title-')) {
            const parts = field.split('-');
            const csIdx = parseInt(parts[2], 10);
            const entryIdx = parseInt(parts[3], 10);
            if (!isNaN(csIdx) && !isNaN(entryIdx)) state.customSections[csIdx].entries[entryIdx].title = text;
        }
        else if (field.startsWith('custom-subtitle-')) {
            const parts = field.split('-');
            const csIdx = parseInt(parts[2], 10);
            const entryIdx = parseInt(parts[3], 10);
            if (!isNaN(csIdx) && !isNaN(entryIdx)) state.customSections[csIdx].entries[entryIdx].subtitle = text;
        }
        else if (field.startsWith('custom-desc-')) {
            const parts = field.split('-');
            const csIdx = parseInt(parts[2], 10);
            const entryIdx = parseInt(parts[3], 10);
            if (!isNaN(csIdx) && !isNaN(entryIdx)) state.customSections[csIdx].entries[entryIdx].description = text;
        }
    });
    saveState();
    // Update form inputs without re-render
    $('#fullName').value = state.personal.fullName;
    $('#jobTitle').value = state.personal.jobTitle;
    $('#summary').value = state.personal.summary;
    $('#summaryCount').textContent = `${state.personal.summary.length} / 500`;
    $('#certifications').value = state.certifications;
    // For nested fields, we would update the specific input if visible, but since form re-renders are avoided, we can skip or update via applyStateToForm (but that would lose focus). We'll update critical ones.
}

// ============ VERSION MANAGER UI ============
function updateVersionList() {
    const list = $('#versionList');
    list.innerHTML = '';
    Object.keys(versions).forEach(id => {
        const v = versions[id];
        const item = document.createElement('div');
        item.className = `version-item ${id === currentVersionId ? 'active' : ''}`;
        item.innerHTML = `
            <span>${escapeHtml(v.versionName || id)}</span>
            <div style="display:flex; gap:0.3rem;">
                <button class="btn btn-sm btn-ghost switch-version" data-id="${id}" type="button">Switch</button>
                <button class="btn btn-sm btn-ghost duplicate-version" data-id="${id}" type="button">Clone</button>
                <button class="btn btn-sm btn-ghost delete-version" data-id="${id}" type="button">✕</button>
            </div>
        `;
        list.appendChild(item);
    });
}

// ============ EXPORT FUNCTIONS ============
function exportJSON() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `${(state.personal.fullName || 'resume').toLowerCase().replace(/\s+/g, '-')}.json`);
}

function exportTxt() {
    let txt = '';
    txt += `${state.personal.fullName}\n${state.personal.jobTitle}\n`;
    if (state.personal.email) txt += `${state.personal.email} | `;
    if (state.personal.phone) txt += `${state.personal.phone} | `;
    if (state.personal.location) txt += `${state.personal.location}\n`;
    txt += `\nSUMMARY\n${state.personal.summary}\n\n`;
    if (state.experience.length) {
        txt += `EXPERIENCE\n`;
        state.experience.forEach(exp => {
            txt += `${exp.title} - ${exp.company} (${formatDate(exp)})\n`;
            exp.bullets.forEach(b => txt += `• ${b}\n`);
            txt += '\n';
        });
    }
    if (state.education.length) {
        txt += `EDUCATION\n`;
        state.education.forEach(edu => {
            txt += `${edu.degree} - ${edu.school} (${edu.startYear}-${edu.endYear})\n`;
        });
        txt += '\n';
    }
    if (state.projects.length) {
        txt += `PROJECTS\n`;
        state.projects.forEach(proj => {
            txt += `${proj.name}${proj.link ? ' - ' + proj.link : ''}\n`;
            if (proj.description) txt += `${proj.description}\n`;
            proj.bullets.forEach(b => txt += `• ${b}\n`);
            txt += '\n';
        });
    }
    if (state.skills.length) {
        txt += `SKILLS\n`;
        state.skills.forEach(cat => {
            txt += `${cat.category}: ${cat.items.map(i => i.name).join(', ')}\n`;
        });
        txt += '\n';
    }
    if (state.languages) txt += `LANGUAGES\n${state.languages}\n\n`;
    if (state.certifications) txt += `CERTIFICATIONS\n${state.certifications}\n`;
    const blob = new Blob([txt], { type: 'text/plain' });
    downloadBlob(blob, `${(state.personal.fullName || 'resume').toLowerCase().replace(/\s+/g, '-')}.txt`);
}

function exportMarkdown() {
    let md = `# ${state.personal.fullName}\n## ${state.personal.jobTitle}\n\n`;
    if (state.personal.email || state.personal.phone || state.personal.location) {
        md += `${[state.personal.email, state.personal.phone, state.personal.location].filter(Boolean).join(' | ')}\n\n`;
    }
    md += `## Summary\n${state.personal.summary}\n\n`;
    if (state.experience.length) {
        md += `## Experience\n`;
        state.experience.forEach(exp => {
            md += `### ${exp.title} - ${exp.company}\n${formatDate(exp)}\n`;
            exp.bullets.forEach(b => md += `- ${b}\n`);
            md += '\n';
        });
    }
    if (state.education.length) {
        md += `## Education\n`;
        state.education.forEach(edu => md += `- ${edu.degree}, ${edu.school} (${edu.startYear}-${edu.endYear})\n`);
        md += '\n';
    }
    if (state.projects.length) {
        md += `## Projects\n`;
        state.projects.forEach(proj => {
            md += `### ${proj.name}${proj.link ? ' - ' + proj.link : ''}\n${proj.description || ''}\n`;
            proj.bullets.forEach(b => md += `- ${b}\n`);
            md += '\n';
        });
    }
    if (state.skills.length) {
        md += `## Skills\n`;
        state.skills.forEach(cat => md += `- **${cat.category}:** ${cat.items.map(i => i.name).join(', ')}\n`);
        md += '\n';
    }
    if (state.languages) md += `## Languages\n${state.languages}\n\n`;
    if (state.certifications) md += `## Certifications\n${state.certifications}\n`;
    const blob = new Blob([md], { type: 'text/markdown' });
    downloadBlob(blob, `${(state.personal.fullName || 'resume').toLowerCase().replace(/\s+/g, '-')}.md`);
}

function exportPDF() {
    const element = document.getElementById('resumePaper');
    const opt = {
        margin:        [0.5, 0.5],
        filename:      `${(state.personal.fullName || 'resume').toLowerCase().replace(/\s+/g, '-')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
}

function downloadBlob(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}

// ============ ATS & JOB DESCRIPTION ============
function updateATS() {
    let score = 0;
    const missing = [];
    if (state.personal.email) score += 10; else missing.push('Email');
    if (state.personal.phone) score += 10; else missing.push('Phone');
    if (state.personal.fullName) score += 10; else missing.push('Full Name');
    if (state.personal.summary.length > 30) score += 15; else missing.push('Summary');
    if (state.experience.length) score += 20; else missing.push('Experience');
    const actionVerbs = ['led','engineered','developed','reduced','created','managed','designed','built','improved'];
    let hasAction = false;
    state.experience.forEach(exp => exp.bullets.forEach(b => { if (actionVerbs.some(v => b.toLowerCase().includes(v))) hasAction = true; }));
    if (hasAction) score += 15; else missing.push('Action verbs');
    // Impact metrics detection
    let hasMetric = false;
    const metricRegex = /\b\d+%|\$\d+|\d+\s*(?:users|hours|days|weeks|months|years|million|k)\b/i;
    state.experience.forEach(exp => exp.bullets.forEach(b => { if (metricRegex.test(b)) hasMetric = true; }));
    if (hasMetric) score += 10;
    if (state.skills.length) score += 10; else missing.push('Skills');
    if (state.education.length) score += 10; else missing.push('Education');
    state.atsScore = score;
    const el = $('#atsScore');
    el.textContent = `ATS Score: ${score}/100`;
    if (missing.length) el.textContent += ` (Add: ${missing.join(', ')})`;
}

// Multi-word phrase extraction for job description
function extractPhrases(text) {
    // First, create a list of multi-word technical terms from skills and common tech phrases
    const knownPhrases = [
        'project management', 'continuous integration', 'spring boot', 'react native', 'rest apis', 'aws lambda',
        'node.js', 'machine learning', 'data analysis', 'ui/ux design', 'version control', 'agile methodologies',
        'scrum', 'kanban', 'microservices', 'docker', 'kubernetes', 'ci/cd', 'front-end', 'back-end', 'full-stack'
    ];
    // Add skill names (multi-word)
    state.skills.forEach(cat => cat.items.forEach(item => {
        if (item.name.includes(' ')) knownPhrases.push(item.name.toLowerCase());
    }));
    const lower = text.toLowerCase();
    const phrases = [];
    knownPhrases.forEach(phrase => {
        if (lower.includes(phrase)) phrases.push(phrase);
    });
    // Add single words (filtered)
    const words = lower.match(/\b[a-z]{3,}\b/g)?.filter(w => !STOPWORDS.has(w)) || [];
    return { phrases, words };
}

function analyzeJobDescription() {
    const jdText = $('#jdText').value;
    if (!jdText.trim()) { showToast('Please paste a job description'); return; }
    const jdAnalysis = extractPhrases(jdText);
    const resumeAnalysis = extractPhrases(buildResumeTextForMatching());
    const matched = [];
    const missing = [];
    // Check phrases first (higher weight)
    jdAnalysis.phrases.forEach(p => {
        if (resumeAnalysis.phrases.includes(p) || resumeAnalysis.words.includes(p.replace(/\s+/g, ''))) matched.push(p);
        else missing.push(p);
    });
    jdAnalysis.words.forEach(w => {
        if (resumeAnalysis.words.includes(w) || resumeAnalysis.phrases.some(p => p.includes(w))) {
            if (!matched.includes(w)) matched.push(w);
        } else {
            if (!missing.includes(w) && !missing.some(m => m.includes(w))) missing.push(w);
        }
    });
    const results = $('#jdResults');
    results.innerHTML = `
        <div style="margin-top:1rem;">
            <p><strong>Match Rate:</strong> ${matched.length} matched, ${missing.length} missing</p>
            <h4 style="color:#16a34a;">Matched (${matched.length})</h4>
            <div class="match-list">${matched.slice(0,30).map(w => `<span class="skill-chip" style="background:#dcfce7;color:#15803d;">${escapeHtml(w)}</span>`).join('')}</div>
            <h4 style="color:#dc2626;">Missing (${missing.length})</h4>
            <div class="missing-list">${missing.slice(0,30).map(w => `<span class="skill-chip" style="background:#fee2e2;color:#b91c1c;">${escapeHtml(w)}</span>`).join('')}</div>
        </div>
    `;
}

function buildResumeTextForMatching() {
    let text = state.personal.summary + ' ';
    state.skills.forEach(cat => { text += cat.category + ' '; cat.items.forEach(i => text += i.name + ' '); });
    state.experience.forEach(exp => { text += exp.title + ' ' + exp.company + ' '; exp.bullets.forEach(b => text += b + ' '); });
    state.education.forEach(edu => { text += edu.degree + ' ' + edu.school + ' '; });
    state.projects.forEach(proj => { text += proj.name + ' ' + proj.description + ' '; proj.bullets.forEach(b => text += b + ' '); });
    return text;
}

// ============ EVENT LISTENERS ============
function setupListeners() {
    // Modals
    $('#changeTemplateBtn').addEventListener('click', () => $('#templateModal').classList.add('active'));
    $('#closeModal').addEventListener('click', () => $('#templateModal').classList.remove('active'));
    $('.template-modal-overlay').addEventListener('click', () => $('#templateModal').classList.remove('active'));
    $('#jdMatchBtn').addEventListener('click', () => $('#jdModal').classList.add('active'));
    $('#closeJdModal').addEventListener('click', () => $('#jdModal').classList.remove('active'));
    $('.jd-modal-overlay').addEventListener('click', () => $('#jdModal').classList.remove('active'));
    $('#analyzeJdBtn').addEventListener('click', analyzeJobDescription);

    // Version manager
    $('#versionManagerBtn').addEventListener('click', () => { updateVersionList(); $('#versionModal').classList.add('active'); });
    $('#closeVersionModal').addEventListener('click', () => $('#versionModal').classList.remove('active'));
    $('.version-modal-overlay').addEventListener('click', () => $('#versionModal').classList.remove('active'));
    $('#createVersionBtn').addEventListener('click', () => {
        const name = $('#newVersionName').value.trim();
        cloneVersion(name);
        $('#versionModal').classList.remove('active');
        $('#newVersionName').value = '';
    });
    // Version list actions
    $('#versionList').addEventListener('click', (e) => {
        const btn = e.target;
        const id = btn.dataset.id;
        if (btn.classList.contains('switch-version')) switchVersion(id);
        if (btn.classList.contains('duplicate-version')) {
            const name = versions[id].versionName + ' Copy';
            cloneVersion(name);
        }
        if (btn.classList.contains('delete-version')) deleteVersion(id);
    });

    // Personal inputs
    $$('#personalFields input, #personalFields textarea').forEach(el => {
        el.addEventListener('input', () => {
            const id = el.id;
            if (id === 'summary') {
                state.personal.summary = el.value;
                $('#summaryCount').textContent = `${el.value.length} / 500`;
            } else if (id !== 'photoUpload') {
                state.personal[id] = el.value;
            }
            saveState();
            renderPreview();
        });
    });

    // Photo
    $('#photoUpload').addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = ev => {
                state.personal.photo = ev.target.result;
                $('#photoPreview').innerHTML = `<img src="${ev.target.result}" alt="Profile">`;
                $('#removePhoto').style.display = 'inline-flex';
                saveState();
                renderPreview();
            };
            reader.readAsDataURL(file);
        }
    });
    $('#removePhoto').addEventListener('click', () => {
        state.personal.photo = '';
        $('#photoUpload').value = '';
        $('#photoPreview').innerHTML = '📷';
        $('#removePhoto').style.display = 'none';
        saveState();
        renderPreview();
    });

    // Section toggles & collapsibles
    document.addEventListener('click', e => {
        const header = e.target.closest('.section-header');
        if (header) {
            header.classList.toggle('active');
            header.nextElementSibling.classList.toggle('show');
        }
        const toggle = e.target.closest('.collapse-toggle');
        if (toggle) {
            const body = toggle.closest('.entry-form').querySelector('.entry-body');
            body.style.display = body.style.display === 'none' ? 'block' : 'none';
        }
    });

    // Add buttons
    $('#addExperience').addEventListener('click', () => {
        state.experience.push({ title: '', company: '', startMonth: 'Jan', startYear: new Date().getFullYear(), endMonth: '', endYear: '', present: true, bullets: [] });
        saveState(); renderExperienceForm(); renderPreview();
    });
    $('#addEducation').addEventListener('click', () => {
        state.education.push({ degree: '', school: '', startYear: '', endYear: '', details: '' });
        saveState(); renderEducationForm(); renderPreview();
    });
    $('#addProject').addEventListener('click', () => {
        state.projects.push({ name: '', link: '', description: '', bullets: [] });
        saveState(); renderProjectsForm(); renderPreview();
    });
    $('#addSkillCategory').addEventListener('click', () => {
        state.skills.push({ category: 'General', items: [] });
        saveState(); renderSkillsForm(); renderPreview();
    });
    $('#addCustomSection').addEventListener('click', () => {
        state.customSections.push({ title: 'New Section', entries: [{ title: '', subtitle: '', date: '', description: '' }] });
        saveState(); renderCustomSectionsForm(); renderPreview();
    });

    // Enter key for bullets/skills
    document.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            const target = e.target;
            if (target.classList.contains('add-bullet')) {
                e.preventDefault();
                const idx = target.dataset.idx;
                const bullet = target.value.trim();
                if (bullet) {
                    state.experience[idx].bullets.push(bullet);
                    saveState(); renderExperienceForm(); renderPreview();
                }
            } else if (target.classList.contains('add-bullet-proj')) {
                e.preventDefault();
                const idx = target.dataset.idx;
                const bullet = target.value.trim();
                if (bullet) {
                    state.projects[idx].bullets.push(bullet);
                    saveState(); renderProjectsForm(); renderPreview();
                }
            } else if (target.classList.contains('add-skill-input')) {
                e.preventDefault();
                const catIdx = target.dataset.cat;
                const skill = target.value.trim();
                if (skill) {
                    state.skills[catIdx].items.push({ name: skill, proficiency: 'Intermediate' });
                    saveState(); renderSkillsForm(); renderPreview();
                }
            }
        }
    });

    // Delegated input updates
    document.addEventListener('input', e => {
        const t = e.target;
        if (t.classList.contains('exp-title')) state.experience[t.dataset.idx].title = t.value;
        if (t.classList.contains('exp-company')) state.experience[t.dataset.idx].company = t.value;
        if (t.classList.contains('exp-start-month')) state.experience[t.dataset.idx].startMonth = t.value;
        if (t.classList.contains('exp-start-year')) state.experience[t.dataset.idx].startYear = t.value;
        if (t.classList.contains('exp-end-month')) state.experience[t.dataset.idx].endMonth = t.value;
        if (t.classList.contains('exp-end-year')) state.experience[t.dataset.idx].endYear = t.value;
        if (t.classList.contains('exp-present')) { state.experience[t.dataset.idx].present = t.checked; renderExperienceForm(); }
        if (t.classList.contains('exp-bullet')) state.experience[t.dataset.idx].bullets[t.dataset.bullet] = t.value;
        if (t.classList.contains('edu-degree')) state.education[t.dataset.idx].degree = t.value;
        if (t.classList.contains('edu-school')) state.education[t.dataset.idx].school = t.value;
        if (t.classList.contains('edu-start-year')) state.education[t.dataset.idx].startYear = t.value;
        if (t.classList.contains('edu-end-year')) state.education[t.dataset.idx].endYear = t.value;
        if (t.classList.contains('edu-details')) state.education[t.dataset.idx].details = t.value;
        if (t.classList.contains('proj-name')) state.projects[t.dataset.idx].name = t.value;
        if (t.classList.contains('proj-link')) state.projects[t.dataset.idx].link = t.value;
        if (t.classList.contains('proj-desc')) state.projects[t.dataset.idx].description = t.value;
        if (t.classList.contains('proj-bullet')) state.projects[t.dataset.idx].bullets[t.dataset.bullet] = t.value;
        if (t.classList.contains('cat-name')) state.skills[t.dataset.cat].category = t.value;
        if (t.classList.contains('proficiency')) state.skills[t.dataset.cat].items[t.dataset.item].proficiency = t.value;
        if (t.classList.contains('custom-sec-title')) state.customSections[t.dataset.sec].title = t.value;
        if (t.classList.contains('custom-entry-title')) state.customSections[t.dataset.sec].entries[t.dataset.entry].title = t.value;
        if (t.classList.contains('custom-entry-subtitle')) state.customSections[t.dataset.sec].entries[t.dataset.entry].subtitle = t.value;
        if (t.classList.contains('custom-entry-date')) state.customSections[t.dataset.sec].entries[t.dataset.entry].date = t.value;
        if (t.classList.contains('custom-entry-desc')) state.customSections[t.dataset.sec].entries[t.dataset.entry].description = t.value;
        if (t.id === 'languages') state.languages = t.value;
        if (t.id === 'certifications') state.certifications = t.value;
        saveState();
        renderPreview();
    });

    // Removals
    document.addEventListener('click', e => {
        const t = e.target;
        if (t.classList.contains('remove-exp')) state.experience.splice(t.dataset.idx, 1);
        if (t.classList.contains('remove-edu')) state.education.splice(t.dataset.idx, 1);
        if (t.classList.contains('remove-proj')) state.projects.splice(t.dataset.idx, 1);
        if (t.classList.contains('remove-cat')) state.skills.splice(t.dataset.cat, 1);
        if (t.classList.contains('remove-skill')) state.skills[t.dataset.cat].items.splice(t.dataset.item, 1);
        if (t.classList.contains('remove-custom-sec')) state.customSections.splice(t.dataset.sec, 1);
        if (t.classList.contains('remove-custom-entry')) state.customSections[t.dataset.sec].entries.splice(t.dataset.entry, 1);
        if (t.classList.contains('remove-bullet')) {
            const idx = t.dataset.idx, bIdx = t.dataset.bullet;
            if (t.closest('#experienceContainer')) state.experience[idx].bullets.splice(bIdx, 1);
            if (t.closest('#projectsContainer')) state.projects[idx].bullets.splice(bIdx, 1);
        }
        if (t.classList.contains('add-custom-entry')) {
            state.customSections[t.dataset.sec].entries.push({ title: '', subtitle: '', date: '', description: '' });
        }
        if (t.classList.contains('btn-remove') || t.classList.contains('remove-skill') || t.classList.contains('remove-bullet') || t.classList.contains('add-custom-entry')) {
            saveState(); renderAllForms(); renderPreview();
        }
    });

    // Style controls
    $('#accentPrimary').addEventListener('input', e => { state.accentPrimary = e.target.value; saveState(); renderPreview(); });
    $('#accentSecondary').addEventListener('input', e => { state.accentSecondary = e.target.value; saveState(); renderPreview(); });
    $('#fontSelect').addEventListener('change', e => { state.fontPair = e.target.value; saveState(); renderPreview(); });
    $('#spacingSelect').addEventListener('change', e => { state.spacing = e.target.value; saveState(); renderPreview(); });
    $('#zoomIn').addEventListener('click', () => { state.zoom = Math.min(state.zoom + 0.1, 1.6); renderPreview(); });
    $('#zoomOut').addEventListener('click', () => { state.zoom = Math.max(state.zoom - 0.1, 0.6); renderPreview(); });
    $('#fitScreen').addEventListener('click', () => { state.zoom = 1; renderPreview(); });

    // Inline edit toggle
    $('#toggleInlineEdit').addEventListener('click', () => {
        state.inlineEdit = !state.inlineEdit;
        renderPreview();
        if (state.inlineEdit) {
            $('#resumePaper').focus();
            showToast('Inline editing enabled – click on highlighted areas to edit');
        } else {
            showToast('Inline editing disabled');
        }
    });

    // Blur sync for inline edits (no renderPreview to preserve caret)
    $('#resumePaper').addEventListener('blur', (e) => {
        if (state.inlineEdit && e.target.classList.contains('editable')) {
            syncInlineEdits();
        }
    }, true);

    // Download/Export buttons
    $('#downloadBtn').addEventListener('click', exportPDF);
    $('#exportTxtBtn').addEventListener('click', exportTxt);
    $('#exportMdBtn').addEventListener('click', exportMarkdown);
    $('#resetBtn').addEventListener('click', () => {
        if (confirm('Reset all data?')) { localStorage.removeItem('resumeForge_versions'); location.reload(); }
    });

    // Sample / Export / Import
    $('#loadSampleBtn').addEventListener('click', loadSampleData);
    $('#exportBtn').addEventListener('click', exportJSON);
    $('#importBtn').addEventListener('click', () => $('#importFile').click());
    $('#importFile').addEventListener('change', importJSON);

    // Theme toggle
    $('#themeToggle').addEventListener('click', () => {
        document.documentElement.setAttribute('data-theme',
            document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
}

// ============ SAMPLE DATA ============
function loadSampleData() {
    state = {
        personal: {
            fullName: 'Alex Johnson',
            jobTitle: 'Staff Software Engineer',
            email: 'alex.johnson@example.com',
            phone: '+1 (555) 019-2834',
            location: 'San Francisco, CA',
            website: 'https://alexjohnson.dev',
            summary: 'Results-driven software architect with 8+ years designing fault-tolerant cloud systems.',
            linkedin: 'linkedin.com/in/alexjohnson',
            github: 'github.com/alexjohnson',
            twitter: '@alexdev',
            photo: ''
        },
        skills: [
            { category: 'Frontend', items: [{ name: 'TypeScript', proficiency: 'Expert' }, { name: 'React', proficiency: 'Expert' }] },
            { category: 'Backend & Cloud', items: [{ name: 'Node.js', proficiency: 'Expert' }, { name: 'AWS', proficiency: 'Expert' }] }
        ],
        experience: [
            {
                title: 'Senior Software Engineer',
                company: 'Vanguard Systems',
                startMonth: 'Jan',
                startYear: '2021',
                endMonth: '',
                endYear: '',
                present: true,
                bullets: ['Led migration to event-driven services, reducing latency by 35%.', 'Engineered real-time engine handling 50k concurrent channels.']
            }
        ],
        education: [
            { degree: 'B.S. Computer Science', school: 'UC Berkeley', startYear: '2013', endYear: '2017', details: 'GPA 3.85' }
        ],
        projects: [
            { name: 'HyperQueue Engine', link: 'https://github.com', description: 'Distributed job queue', bullets: ['1.2k GitHub stars', '150k tasks/sec'] }
        ],
        customSections: [
            { title: 'Awards', entries: [{ title: 'Outstanding Achievement', subtitle: 'Company Awards', date: '2023', description: 'Zero-downtime migration' }] }
        ],
        languages: 'English (Native), German (Professional)',
        certifications: 'AWS Certified Solutions Architect',
        template: 'modern',
        accentPrimary: '#6366f1', accentSecondary: '#8b5cf6',
        fontPair: 'default', spacing: 'normal',
        sectionsOrder: ['summary','experience','education','projects','skills','custom','languages'],
        zoom: 1, atsScore: 0, inlineEdit: false,
        versionName: 'Default'
    };
    saveState();
    applyStateToForm();
    buildSectionOrder();
    renderPreview();
    updateVersionList();
    showToast('Sample data loaded');
}

// ============ JSON IMPORT ============
function importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        try {
            state = JSON.parse(ev.target.result);
            versions[currentVersionId] = state;
            saveVersions();
            applyStateToForm();
            buildSectionOrder();
            renderPreview();
            updateVersionList();
            showToast('Imported successfully');
        } catch { showToast('Invalid JSON'); }
    };
    reader.readAsText(file);
}

// ============ HELPERS ============
function formatDate(exp) {
    if (exp.present) return `${escapeHtml(exp.startMonth)} ${escapeHtml(exp.startYear)} – Present`;
    return `${escapeHtml(exp.startMonth)} ${escapeHtml(exp.startYear)} – ${escapeHtml(exp.endMonth)} ${escapeHtml(exp.endYear)}`;
}