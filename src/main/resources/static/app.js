const $ = s => document.querySelector(s);
const box = $('#jobsBox'), select = $('#jobSelect'), result = $('#result');
let jobs = [], appliedJobIds = new Set(), user = JSON.parse(localStorage.getItem('hiresenseUser') || 'null');

const esc = value => {
  const node = document.createElement('div');
  node.textContent = value == null ? '' : String(value);
  return node.innerHTML;
};
const css = document.createElement('style');
css.textContent = `
.apply{margin:14px 8px 0 0;background:#17204e}
.package{font-size:13px;color:#65728a}
.tracker{margin:30px 0;padding:25px;border:1px solid #e4e7f0;border-radius:14px;background:#fff}
.row{display:flex;justify-content:space-between;gap:16px;border-top:1px solid #eee;padding:16px 0;align-items:flex-start}
.row p{margin:5px 0;color:#71809a;font-size:13px;overflow-wrap:anywhere}
.status{font-size:11px;font-weight:bold;padding:6px 9px;border-radius:5px;background:#eef0ff;color:#4d5cf4;height:max-content;white-space:nowrap}
.SHORTLISTED{background:#e7f9ef;color:#13885c}.REJECTED{background:#fff0ef;color:#be4a41}.UNDER_REVIEW{background:#fff8df;color:#a87800}
.actions button{font-size:11px;padding:7px;margin:6px 4px 0 0}
.manage{display:none;margin-top:10px}.manage.show{display:inline-flex;align-items:center;white-space:nowrap}
.resume-link{display:inline-flex;margin-top:8px;color:#4c59d9;font-size:12px;font-weight:700;text-decoration:none}
.candidate-details{min-width:0}.form-note{font-size:12px;color:#74809a;line-height:1.5}
#applicationMessage{font-size:13px;color:#b54735}#applicationMessage.success{color:#12835b}
#applicationModal form button{width:100%;margin-top:10px}
#recruiterPanel{display:none}.recruiter-mode #recruiterPanel{display:block}
.recruiter-mode .candidate-analyze{display:none}\n.recruiter-mode .candidate-apply{display:none !important}
`;
document.head.append(css);

const tracker = document.createElement('section');
tracker.className = 'tracker hidden';
document.querySelector('.workspace').after(tracker);
const manage = $('#manageApplicationsNav');

function parseErrorBody(raw) {
  if (!raw) return {};
  try { return JSON.parse(raw); }
  catch (_) {
    const plain = raw.replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return { message: plain.length > 240 ? plain.slice(0, 240) + '…' : plain };
  }
}
function api(url, options = {}) {
  return fetch(url, options).then(async response => {
    const raw = await response.text();
    const data = parseErrorBody(raw);
    if (!response.ok) {
      const detail = data.message || data.detail || data.error || data.title || data.message;
      throw Error(detail || `Request failed (${response.status} ${response.statusText}). Check the server console for details.`);
    }
    return data;
  });
}
function status(value) {
  return String(value || '').replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
}
function setUser(nextUser) {
  user = nextUser;
  localStorage.setItem('hiresenseUser', JSON.stringify(nextUser));
  $('#authButtons').classList.add('hidden');
  $('#userMenu').classList.remove('hidden');
  $('#welcome').textContent = `Hi, ${nextUser.name.split(' ')[0]} · ${nextUser.role === 'RECRUITER' ? 'Recruiter' : 'Candidate'}`;
  document.body.classList.toggle('recruiter-mode', nextUser.role === 'RECRUITER');
  manage.classList.toggle('show', nextUser.role === 'RECRUITER');
  manage.textContent = 'Applications';
  tracker.classList.add('hidden');
  if (nextUser.role === 'CANDIDATE') loadMine();
  else loadRecruiterApplications();
}
function logout() {
  localStorage.removeItem('hiresenseUser');
  location.reload();
}
function openAuth(view) {
  ['login', 'register', 'forgot'].forEach(name => $('#' + name + 'View').classList.toggle('hidden', name !== view));
  $('#authMessage').textContent = '';
  authModal.showModal();
}
function startJobPost() {
  if (!user) return openAuth('login');
  if (user.role !== 'RECRUITER') return alert('Job posting is available only to recruiter accounts.');
  jobModal.showModal();
}
async function load() {
  try {
    const dashboard = await api('/api/dashboard');
    $('#totalJobs').textContent = dashboard.totalJobs;
    $('#openings').textContent = dashboard.openings;
    $('#companies').textContent = dashboard.companies;
    jobs = await api('/api/jobs');
    render();
    if (user && user.role === 'CANDIDATE') loadMine();
    else if (user && user.role === 'RECRUITER') loadRecruiterApplications();
  } catch (error) {
    box.innerHTML = `<p class="empty">Could not load jobs. Check that the application and database are running, then refresh.</p>`;
  }
}
function savedJobIds() { try { return JSON.parse(localStorage.getItem('hiresenseSavedJobs') || '[]').map(Number); } catch (_) { return []; } }
function isSaved(id) { return savedJobIds().includes(Number(id)); }
window.toggleSavedJob = id => {
  if (!user || user.role !== 'CANDIDATE') { openAuth('login'); $('#authMessage').textContent = 'Log in with a candidate account to save jobs.'; return; }
  let ids = savedJobIds(); ids = ids.includes(Number(id)) ? ids.filter(value => value !== Number(id)) : [...ids, Number(id)];
  localStorage.setItem('hiresenseSavedJobs', JSON.stringify(ids)); render();
};
function render() {
  box.innerHTML = jobs.map(job => `
    <article class="job">
      <div class="job-head"><span>${esc(job.employmentType)}</span><small>${esc(job.openPositions || 1)} open positions</small></div>
      <h3>${esc(job.title)}</h3><p class="company">${esc(job.company)} · ${esc(job.location)}</p>
      <p class="desc">${esc(job.description)}</p>
      <div class="chips">${String(job.skills || '').split(',').slice(0, 5).map(skill => `<b>${esc(skill.trim())}</b>`).join('')}</div>
      <p class="package">Package: <b>${esc(job.salaryPackage || 'Not disclosed')}</b> · ${esc(job.experienceLevel || 'Fresher')}</p>
      ${!user || user.role === 'CANDIDATE' ? `<button class="text candidate-analyze" onclick="analyze(${job.id})">Analyze candidate fit →</button>
      ${user && appliedJobIds.has(Number(job.id)) ? '<button class="apply candidate-apply" disabled>✓ Already applied</button>' : `<button class="apply candidate-apply" onclick="applyJob(${job.id})">Apply now →</button>`}<button class="text candidate-save" onclick="toggleSavedJob(${job.id})">${isSaved(job.id) ? '★ Saved job' : '☆ Save job'}</button>` : ''}
    </article>`).join('') || '<p class="empty">No jobs found. Check back soon for new opportunities.</p>';
  select.innerHTML = '<option value="">Select a role to analyze</option>' +
    jobs.map(job => `<option value="${job.id}">${esc(job.title)} — ${esc(job.company)}</option>`).join('');
}
window.analyze = id => {
  select.value = id;
  $('#matcher').scrollIntoView({ behavior: 'smooth' });
};
window.applyJob = id => {
  if (!user) {
    openAuth('login');
    $('#authMessage').textContent = 'Log in or create a candidate account before applying.';
    return;
  }
  if (user.role !== 'CANDIDATE') return alert('Only candidate accounts can apply for jobs.');
  $('#applicationForm').reset();
  $('#applicationJobId').value = id;
  $('#applicationForm [name="candidateName"]').value = user.name || '';
  $('#applicationForm [name="candidateEmail"]').value = user.email || '';
  $('#applicationMessage').textContent = '';
  $('#applicationMessage').classList.remove('success');
  applicationModal.showModal();
};
async function loadMine() {
  if (!user || user.role !== 'CANDIDATE') return;
  try {
    const applications = await api('/api/applications?email=' + encodeURIComponent(user.email));
    appliedJobIds = new Set(applications.map(item => Number(item.jobId)));
    render();
    const saved = savedJobIds().map(id => jobs.find(job => Number(job.id) === id)).filter(Boolean);
    const shortlisted = applications.filter(item => item.status === 'SHORTLISTED').length;
    const inReview = applications.filter(item => item.status === 'UNDER_REVIEW').length;
    tracker.classList.remove('hidden');
    tracker.innerHTML = `<div class="tracker-heading"><div><p class="eyebrow">CANDIDATE DASHBOARD</p><h3>Welcome back, ${esc(user.name || 'Candidate')}</h3><p class="package">Track applications, follow status changes, and keep promising roles saved.</p></div></div>
      <div class="dashboard-stats"><article><span>Total applications</span><b>${applications.length}</b></article><article><span>Under review</span><b>${inReview}</b></article><article><span>Shortlisted</span><b>${shortlisted}</b></article><article><span>Saved jobs</span><b>${saved.length}</b></article></div>
      <h4 class="subheading">My applications</h4>` +
      (applications.length ? applications.map(item => `<div class="row"><div class="candidate-details"><b>${esc(item.jobTitle)}</b><p>${esc(item.company)} · Applied ${esc((item.appliedAt || '').replace('T', ' '))}</p></div><span class="status ${esc(item.status)}">${esc(status(item.status))}</span></div>`).join('') : '<p class="empty-applications">No applications yet. Apply to a role to track its status here.</p>') +
      '<h4 class="subheading">Saved jobs</h4>' + (saved.length ? saved.map(job => `<div class="row"><div><b>${esc(job.title)}</b><p>${esc(job.company)} · ${esc(job.location)}</p></div><button class="ghost" onclick="analyze(${job.id})">Check fit</button></div>`).join('') : '<p class="package">Save jobs from the listings to build your shortlist.</p>');
  } catch (error) { tracker.classList.remove('hidden'); tracker.innerHTML = `<p>Unable to load your applications right now: ${esc(error.message)}</p>`; }
}
async function loadRecruiterApplications() {
  if (!user || user.role !== 'RECRUITER') return;
  tracker.classList.remove('hidden');
  tracker.innerHTML = '<p class="eyebrow">RECRUITER WORKSPACE</p><h3>Candidate applications</h3><p class="package">Loading applications…</p>';
  try {
    const applications = await api('/api/applications/recruiter');
    const countStatus = value => applications.filter(item => item.status === value).length;
    const stats = `<div class="dashboard-stats recruiter-stats"><article><span>Jobs available</span><b>${jobs.length}</b></article><article><span>Total applicants</span><b>${applications.length}</b></article><article><span>Under review</span><b>${countStatus('UNDER_REVIEW')}</b></article><article><span>Shortlisted</span><b>${countStatus('SHORTLISTED')}</b></article></div>`;
    const analytics = `<div class="analytics-panel"><div class="analytics-title"><b>Hiring pipeline</b><span class="package">Application status overview</span></div>${[['Applied',countStatus('APPLIED')],['Under review',countStatus('UNDER_REVIEW')],['Shortlisted',countStatus('SHORTLISTED')],['Rejected',countStatus('REJECTED')]].map(([label,count]) => `<div class="bar-row"><span>${label}</span><div class="analytics-track"><i style="width:${applications.length ? Math.max(count ? 5 : 0, Math.round(count*100/applications.length)) : 0}%"></i></div><b>${count}</b></div>`).join('')}</div>`;
    tracker.innerHTML = `<div class="tracker-heading"><div><p class="eyebrow">RECRUITER WORKSPACE</p><h3>Manage candidate applications</h3><p class="package">Review applicant details, download resumes and update application status.</p></div><b class="application-count">${applications.length} application${applications.length === 1 ? '' : 's'}</b></div>${stats}${analytics}<div class="ats-tools"><input id="applicantSearch" placeholder="Search candidate, email or job…" aria-label="Search applications"><select id="statusFilter" aria-label="Filter by status"><option value="ACTIVE" selected>Active applications (exclude rejected)</option><option value="REJECTED">Rejected only</option><option value="">All applications</option><option value="APPLIED">Applied</option><option value="UNDER_REVIEW">Under review</option><option value="SHORTLISTED">Shortlisted</option></select></div><div id="applicationRows">` +
      (applications.length ? applications.map(item => `<div class="row"><div class="candidate-details"><b>${esc(item.candidateName)}</b><p>${esc(item.candidateEmail)}</p><p><b>Education:</b> ${esc(item.education || 'Not provided')}</p><p><b>Applied for:</b> ${esc(item.jobTitle)} · ${esc(item.company)}</p><p><b>Submitted:</b> ${esc((item.appliedAt || '').replace('T', ' '))}</p>${item.resumeUrl ? `<a class="resume-link" href="${esc(item.resumeUrl)}" target="_blank" rel="noopener">↓ View / download ${esc(item.resumeFileName || 'resume.pdf')}</a>` : '<p>No resume attached</p>'}</div><div><span class="status ${esc(item.status)}">${esc(status(item.status))}</span><div class="actions"><button onclick="updateStatus(${item.id},'UNDER_REVIEW')">Review</button><button onclick="updateStatus(${item.id},'SHORTLISTED')">Shortlist</button><button onclick="updateStatus(${item.id},'REJECTED')">Reject</button></div></div></div>`).join('') : '<div class="empty-applications"><h4>No applications received yet</h4><p>Applications submitted by candidates will appear here automatically.</p></div>') + '</div>';
    const filterRows = () => { const q = ($('#applicantSearch')?.value || '').toLowerCase().trim(); const st = $('#statusFilter')?.value || 'ACTIVE'; document.querySelectorAll('#applicationRows .row').forEach(row => { const statusEl = row.querySelector('.status'); const isRejected = statusEl?.classList.contains('REJECTED'); const statusMatch = st === 'ACTIVE' ? !isRejected : st === 'REJECTED' ? isRejected : !st || (statusEl && statusEl.classList.contains(st)); row.style.display = (!q || row.textContent.toLowerCase().includes(q)) && statusMatch ? '' : 'none'; }); }; filterRows();
    $('#applicantSearch')?.addEventListener('input', filterRows); $('#statusFilter')?.addEventListener('change', filterRows);
    tracker.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) { tracker.innerHTML = `<p class="eyebrow">RECRUITER WORKSPACE</p><h3>Manage candidate applications</h3><p class="error-message">Could not load applications: ${esc(error.message)}. Check that the server and database are running, then refresh.</p>`; }
}
manage.onclick = loadRecruiterApplications;
window.updateStatus = async (id, value) => {
  try {
    await api('/api/applications/' + id + '/status', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: value })
    });
    manage.onclick();
  } catch (error) { alert(error.message); }
};
$('#search').oninput = event => {
  const query = event.target.value.toLowerCase().trim();
  box.querySelectorAll('.job').forEach((node, index) => {
    const job = jobs[index];
    node.style.display = job && (job.title + ' ' + job.company + ' ' + job.location).toLowerCase().includes(query) ? '' : 'none';
  });
};
$('#match').onclick = async () => {
  const job = jobs.find(item => String(item.id) === select.value), resumeText = $('#resume').value.trim();
  if (!job || !resumeText) { result.textContent = 'Select a role and paste a resume or profile first.'; return; }
  result.textContent = 'Analyzing skills…';
  try {
    const match = await api('/api/match', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText, jobSkills: job.skills })
    });
    result.classList.add('ready'); result.innerHTML = `<div class="score"><b>${esc(match.matchScore)}%</b><small>skills alignment</small><span>${match.matchScore >= 75 ? 'STRONG MATCH' : match.matchScore >= 45 ? 'POTENTIAL MATCH' : 'SKILL GAP'}</span></div><p><b>Matched skills</b><br>${esc((match.matchedSkills || []).join(', ') || 'None identified')}</p><p><b>Skills to build</b><br>${esc((match.missingSkills || []).join(', ') || 'None identified')}</p><p class="insight">${esc(match.suggestion)} Use this as decision support, not as an automatic hiring decision.</p>`;
  } catch (error) { result.textContent = error.message; }
};
$('#resumeUpload')?.addEventListener('change', () => { if ($('#resumeUpload').files[0]) $('#resume').value = ''; });
$('#matchUpload')?.addEventListener('click', async () => {
  const job = jobs.find(item => String(item.id) === select.value), file = $('#resumeUpload')?.files[0];
  if (!job || !file) { result.textContent = 'Select a role and upload a PDF or DOCX resume first.'; return; }
  const data = new FormData(); data.append('resume', file); data.append('jobSkills', job.skills || ''); result.textContent = 'Reading resume and analyzing required skills…';
  try { const match = await api('/api/match-upload', { method: 'POST', body: data }); result.classList.add('ready'); result.innerHTML = `<div class="score"><b>${esc(match.matchScore)}%</b><small>skills alignment</small><span>${match.matchScore >= 75 ? 'STRONG MATCH' : match.matchScore >= 45 ? 'POTENTIAL MATCH' : 'SKILL GAP'}</span></div><p><b>Matched skills</b><br>${esc((match.matchedSkills || []).join(', ') || 'None identified')}</p><p><b>Skills to build</b><br>${esc((match.missingSkills || []).join(', ') || 'None identified')}</p><p class="insight">${esc(match.suggestion)} Use this as decision support, not as an automatic hiring decision.</p>`; } catch (error) { result.textContent = error.message; }
});
$('#loginForm').onsubmit = async event => {
  event.preventDefault();
  try {
    setUser(await api('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(event.target))) }));
    authModal.close();
  } catch (error) { $('#authMessage').textContent = error.message; }
};
$('#registerForm').onsubmit = async event => {
  event.preventDefault();
  try {
    setUser(await api('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(event.target))) }));
    authModal.close();
  } catch (error) { $('#authMessage').textContent = error.message; }
};
$('#forgotForm').onsubmit = async event => {
  event.preventDefault();
  try {
    const response = await api('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(event.target))) });
    $('#authMessage').textContent = response.message;
  } catch (error) { $('#authMessage').textContent = error.message; }
};
$('#jobForm').onsubmit = async event => {
  event.preventDefault();
  if (!user || user.role !== 'RECRUITER') return alert('Only recruiters can publish a job.');
  const values = Object.fromEntries(new FormData(event.target));
  values.openPositions = Number(values.openPositions);
  try {
    await api('/api/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
    jobModal.close(); event.target.reset(); await load();
  } catch (error) { alert(error.message); }
};
$('#applicationForm').onsubmit = async event => {
  event.preventDefault();
  if (!user || user.role !== 'CANDIDATE') return alert('Please log in with a candidate account.');
  const form = event.target, submit = $('#submitApplication'), message = $('#applicationMessage');
  const data = new FormData(form);
  // Use the authenticated candidate account's identity rather than trusting a different email.
  data.set('candidateName', String(data.get('candidateName')).trim());
  data.set('candidateEmail', user.email);
  submit.disabled = true; submit.textContent = 'Submitting…'; message.textContent = '';
  try {
    await fetch('/api/applications/with-resume', { method: 'POST', body: data }).then(async response => {
      const raw = await response.text();
      const body = parseErrorBody(raw);
      if (!response.ok) {
        const detail = body.message || body.detail || body.error || body.title;
        throw Error(detail || `Application failed (${response.status} ${response.statusText}). Check the Spring Boot console for the exact server error.`);
      }
      return body;
    });
    message.textContent = 'Application submitted successfully!';
    message.classList.add('success');
    submit.textContent = 'Submitted ✓';
    await loadMine();
    await load();
    setTimeout(() => { applicationModal.close(); form.reset(); submit.disabled = false; submit.textContent = 'Submit application →'; }, 1200);
  } catch (error) {
    message.textContent = error.message;
    submit.disabled = false; submit.textContent = 'Submit application →';
  }
};
if (user) {
  $('#authButtons').classList.add('hidden');
  $('#userMenu').classList.remove('hidden');
  $('#welcome').textContent = `Hi, ${user.name.split(' ')[0]} · ${user.role === 'RECRUITER' ? 'Recruiter' : 'Candidate'}`;
  document.body.classList.toggle('recruiter-mode', user.role === 'RECRUITER');
  manage.classList.toggle('show', user.role === 'RECRUITER');
  if (user.role === 'CANDIDATE') loadMine();
  else if (user.role === 'RECRUITER') loadRecruiterApplications();
}
load();
