const fields = {
    index: document.getElementById('app_index'),
    company: document.getElementById('company'),
    jobTitle: document.getElementById('job_title'),
    location: document.getElementById('location'),
    dateUpdated: document.getElementById('date_updated'),
    previousFollowup: document.getElementById('previous_followup'),
    descriptionFile: document.getElementById('description_file'),
    status: document.querySelectorAll('input[name="Status"]'),
    descriptionContent: document.getElementById('description_content')
};

const state = {
    applications: [],
    selectedIndex: -1
};

const followup = document.getElementById('followup');
const recent = document.getElementById('recent');
const offer = document.getElementById('offer');
const deny = document.getElementById('deny');
const enterDays = document.getElementById('enter_days');
const applicationList = document.getElementById('application_list');
const formTitle = document.getElementById('form_title');
const statusMessage = document.getElementById('status_message');
const deleteButton = document.getElementById('delete_application');

const sections = [followup, recent, offer, deny];

let domReady = false;
let apiReady = false;
let started = false;
let eventsBound = false;

document.addEventListener('DOMContentLoaded', () => {
    domReady = true;
    maybeStart();
});

window.addEventListener('pywebviewready', () => {
    apiReady = true;
    maybeStart();
    if (domReady) {
        loadApplications();
    }
});

function maybeStart() {
    if (!apiReady && window.pywebview && window.pywebview.api) {
        apiReady = true;
    }
    if (!domReady || started) {
        return;
    }
    started = true;
    bindEvents();
    enterDays.value = localStorage.getItem('days') || '30';
    if (apiReady) {
        loadApplications();
    } else {
        loadEmbeddedApplications();
    }
}

function bindEvents() {
    if (eventsBound) {
        return;
    }
    eventsBound = true;

    document.querySelectorAll('.tab').forEach((tab) => {
        tab.addEventListener('click', () => showPage(tab.dataset.page));
    });

    enterDays.addEventListener('input', () => {
        localStorage.setItem('days', enterDays.value);
        renderDashboard();
    });

    document.getElementById('new_application').addEventListener('click', () => {
        selectApplication(-1);
    });

    document.getElementById('application_form').addEventListener('submit', async (event) => {
        event.preventDefault();
        await saveApplication();
    });

    deleteButton.addEventListener('click', async () => {
        await deleteApplication();
    });

    document.getElementById('open_description').addEventListener('click', async () => {
        const filename = fields.descriptionFile.value.trim();
        if (!filename) {
            showStatus('Add a description file name first.');
            return;
        }
        if (!window.pywebview || !window.pywebview.api) {
            showStatus('Read-only mode. Start with python3 app.py to open markdown files.');
            return;
        }
        await window.pywebview.api.open_description(filename);
    });
}

function showPage(page) {
    document.querySelectorAll('.tab').forEach((tab) => {
        tab.classList.toggle('active', tab.dataset.page === page);
    });
    document.querySelectorAll('.page').forEach((section) => {
        section.classList.toggle('active', section.id === `${page}_page`);
    });
}

async function loadApplications() {
    if (!window.pywebview || !window.pywebview.api) {
        loadEmbeddedApplications();
        return;
    }

    try {
        const response = await window.pywebview.api.get_applications();
        state.applications = response.applications || [];
        renderDashboard();
        renderApplicationList();
        if (state.selectedIndex >= 0) {
            selectApplication(state.selectedIndex);
        } else {
            selectApplication(state.applications.length ? state.applications[0]._index : -1);
        }
    } catch (error) {
        showStatus(`Unable to load applications: ${error}`);
    }
}

function loadEmbeddedApplications() {
    if (typeof data === 'undefined') {
        showStatus('No data loaded. Start the editable app with python3 app.py.');
        return;
    }

    try {
        state.applications = JSON.parse(data).map((application, index) => ({
            _index: index,
            ...application
        }));
        renderDashboard();
        renderApplicationList();
        selectApplication(state.applications.length ? state.applications[0]._index : -1);
        showStatus('Read-only mode. Start with python3 app.py to save changes.');
    } catch (error) {
        showStatus(`Unable to load data.json: ${error}`);
    }
}

function renderDashboard() {
    sections.forEach((section) => {
        section.querySelectorAll('.application_card').forEach((card) => card.remove());
    });

    let rendered = 0;
    sortByDate(state.applications).forEach((application) => {
        const card = createDashboardCard(application);
        if (application.Denied === 'Yes') {
            card.classList.add('denied');
            deny.appendChild(card);
        } else if (application.Offered === 'Yes') {
            card.classList.add('offered');
            offer.appendChild(card);
        } else if (needsFollowup(application)) {
            card.classList.add(application.Interviewed === 'Yes' ? 'followup_interviewed' : 'followup_standard');
            followup.appendChild(card);
        } else {
            card.classList.add(application.Interviewed === 'Yes' ? 'recent_interviewed' : 'recent_standard');
            recent.appendChild(card);
        }
        rendered += 1;
    });

    if (rendered === 0) {
        recent.appendChild(createEmptyCard());
    }
}

function createDashboardCard(application) {
    const button = document.createElement('button');
    button.className = 'application_card';
    button.type = 'button';
    button.innerHTML = `
        <h3>${escapeHtml(application.JobTitle)}</h3>
        <p>${escapeHtml(application.Company)} - ${escapeHtml(application.Location)}</p>
        <span>Date Updated: ${formatDisplayDate(application.DateUpdated)}</span>
        ${needsFollowup(application) ? `<small>Previous Followup: ${escapeHtml(application.PreviousFollowup || 'No')}</small>` : ''}
    `;
    button.addEventListener('click', () => {
        selectApplication(application._index);
        showPage('manage');
    });
    return button;
}

function createEmptyCard() {
    const card = document.createElement('div');
    card.className = 'application_card empty_card';
    card.innerHTML = `
        <h3>No Applications</h3>
        <p>Add an application from the Manage Applications page.</p>
    `;
    return card;
}

function renderApplicationList() {
    applicationList.innerHTML = '';
    sortByCompany(state.applications).forEach((application) => {
        const button = document.createElement('button');
        button.className = 'application_list_item';
        button.type = 'button';
        button.classList.toggle('active', application._index === state.selectedIndex);
        button.innerHTML = `
            <strong>${escapeHtml(application.Company || 'Untitled Company')}</strong>
            <span>${escapeHtml(application.JobTitle || 'Untitled Role')}</span>
        `;
        button.addEventListener('click', () => selectApplication(application._index));
        applicationList.appendChild(button);
    });
}

async function selectApplication(index) {
    state.selectedIndex = Number(index);
    const application = state.applications.find((item) => item._index === state.selectedIndex);
    renderApplicationList();
    clearStatus();

    if (!application) {
        formTitle.textContent = 'New Application';
        deleteButton.disabled = true;
        fillForm({
            _index: -1,
            Company: '',
            JobTitle: '',
            Location: '',
            Denied: 'No',
            Interviewed: 'No',
            Offered: 'No',
            DateUpdated: toInputDate(new Date()),
            PreviousFollowup: 'No',
            DescriptionFile: '',
            DescriptionContent: ''
        });
        return;
    }

    formTitle.textContent = `${application.Company || 'Application'} Details`;
    deleteButton.disabled = false;
    fillForm(application);
    await loadDescription(application.DescriptionFile);
}

function fillForm(application) {
    fields.index.value = application._index ?? -1;
    fields.company.value = application.Company || '';
    fields.jobTitle.value = application.JobTitle || '';
    fields.location.value = application.Location || '';
    fields.dateUpdated.value = toInputDate(application.DateUpdated);
    fields.previousFollowup.value = application.PreviousFollowup === 'Yes' ? 'Yes' : 'No';
    fields.descriptionFile.value = application.DescriptionFile || '';
    setStatus(getApplicationStatus(application));
    fields.descriptionContent.value = application.DescriptionContent || '';
}

async function loadDescription(filename) {
    fields.descriptionContent.value = '';
    if (!filename || !window.pywebview || !window.pywebview.api) {
        return;
    }
    const response = await window.pywebview.api.get_description(filename);
    fields.descriptionContent.value = response.content || '';
}

async function saveApplication() {
    if (!window.pywebview || !window.pywebview.api) {
        showStatus('Read-only mode. Start with python3 app.py to save changes.');
        return;
    }

    const selectedStatus = getSelectedStatus();
    const descriptionContent = fields.descriptionContent.value;
    const descriptionFile = fields.descriptionFile.value.trim() || buildDescriptionFileName();

    const application = {
        _index: Number(fields.index.value),
        Company: fields.company.value,
        JobTitle: fields.jobTitle.value,
        Location: fields.location.value,
        Denied: selectedStatus === 'Denied' ? 'Yes' : 'No',
        Interviewed: selectedStatus === 'Interviewed' ? 'Yes' : 'No',
        Offered: selectedStatus === 'Offered' ? 'Yes' : 'No',
        DateUpdated: fromInputDate(fields.dateUpdated.value),
        PreviousFollowup: fields.previousFollowup.value,
        DescriptionFile: descriptionFile
    };

    try {
        if (descriptionFile) {
            fields.descriptionFile.value = descriptionFile;
        }
        if (descriptionFile && descriptionContent.trim()) {
            const descriptionResponse = await window.pywebview.api.save_description(descriptionFile, descriptionContent);
            if (descriptionResponse.filename) {
                application.DescriptionFile = descriptionResponse.filename;
                fields.descriptionFile.value = descriptionResponse.filename;
            }
        }
        const response = await window.pywebview.api.save_application(application);
        state.applications = response.applications || [];
        state.selectedIndex = findSavedIndex(application);
        renderDashboard();
        renderApplicationList();
        selectApplication(state.selectedIndex);
        showStatus('Saved.');
    } catch (error) {
        showStatus(`Unable to save: ${error}`);
    }
}

async function deleteApplication() {
    if (!window.pywebview || !window.pywebview.api) {
        showStatus('Read-only mode. Start with python3 app.py to delete applications.');
        return;
    }

    const index = Number(fields.index.value);
    if (index < 0) {
        return;
    }
    const confirmed = window.confirm('Delete this job application?');
    if (!confirmed) {
        return;
    }
    try {
        const response = await window.pywebview.api.delete_application(index);
        state.applications = response.applications || [];
        state.selectedIndex = state.applications.length ? state.applications[0]._index : -1;
        renderDashboard();
        renderApplicationList();
        selectApplication(state.selectedIndex);
        showStatus('Deleted.');
    } catch (error) {
        showStatus(`Unable to delete: ${error}`);
    }
}

function findSavedIndex(savedApplication) {
    if (savedApplication._index >= 0) {
        return savedApplication._index;
    }
    const match = state.applications[state.applications.length - 1];
    return match ? match._index : -1;
}

function getApplicationStatus(application) {
    if (application.Denied === 'Yes') {
        return 'Denied';
    }
    if (application.Offered === 'Yes') {
        return 'Offered';
    }
    if (application.Interviewed === 'Yes') {
        return 'Interviewed';
    }
    return 'Active';
}

function getSelectedStatus() {
    const selected = document.querySelector('input[name="Status"]:checked');
    return selected ? selected.value : 'Active';
}

function setStatus(status) {
    fields.status.forEach((option) => {
        option.checked = option.value === status;
    });
}

function buildDescriptionFileName() {
    const baseName = `${fields.company.value} ${fields.jobTitle.value}`.trim();
    return baseName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function needsFollowup(application) {
    const updated = parseDate(application.DateUpdated);
    if (!updated) {
        return false;
    }
    const now = new Date();
    const days = Number.parseInt(enterDays.value || '30', 10);
    return ((now - updated) / (1000 * 3600 * 24)) >= days;
}

function sortByDate(applications) {
    return [...applications].sort((a, b) => {
        const aDate = parseDate(a.DateUpdated);
        const bDate = parseDate(b.DateUpdated);
        return (aDate || 0) - (bDate || 0);
    });
}

function sortByCompany(applications) {
    return [...applications].sort((a, b) => {
        return `${a.Company} ${a.JobTitle}`.localeCompare(`${b.Company} ${b.JobTitle}`);
    });
}

function parseDate(value) {
    if (!value) {
        return null;
    }
    if (value.includes('/')) {
        const [month, day, year] = value.split('/').map(Number);
        return new Date(year, month - 1, day);
    }
    return new Date(value);
}

function formatDisplayDate(value) {
    const parsed = parseDate(value);
    if (!parsed || Number.isNaN(parsed.getTime())) {
        return 'Unknown';
    }
    return parsed.toLocaleDateString('en-us', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function toInputDate(value) {
    const parsed = value instanceof Date ? value : parseDate(value);
    if (!parsed || Number.isNaN(parsed.getTime())) {
        return '';
    }
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${parsed.getFullYear()}-${month}-${day}`;
}

function fromInputDate(value) {
    if (!value) {
        return '';
    }
    const [year, month, day] = value.split('-');
    return `${month}/${day}/${year}`;
}

function showStatus(message) {
    statusMessage.textContent = message;
}

function clearStatus() {
    statusMessage.textContent = '';
}

function escapeHtml(value) {
    return String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
