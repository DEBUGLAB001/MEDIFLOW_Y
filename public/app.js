/**
 * MediFlow — Hospital Operations Command Center Frontend Logic
 */

// Application State Cache
const state = {
  stats: null,
  queue: [],
  beds: [],
  visits: [],
  events: [],
  activeAssessment: null,
  selectedBedId: null,
  selectedVisitId: null
};

// API Transport Helper (relative paths ensure preview-proxy compatibility)
async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 200);
  }, 3500);
}

// Live Clock
function startClock() {
  const clockEl = document.getElementById('liveClock');
  function update() {
    if (clockEl) {
      const now = new Date();
      clockEl.textContent = now.toTimeString().split(' ')[0];
    }
  }
  update();
  setInterval(update, 1000);
}

// Tab Switching
function setupTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.tab;

      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
      });

      const activePanel = document.getElementById(targetId);
      if (activePanel) {
        activePanel.classList.add('active');
      }
    });
  });
}

// -------------------------------------------------------------
// Data Fetching & Rendering
// -------------------------------------------------------------

async function loadStats() {
  try {
    const data = await apiRequest('api/stats');
    state.stats = data.stats;
    state.events = data.recentEvents || [];

    document.getElementById('statWaiting').textContent = state.stats.waiting;
    document.getElementById('statInAssessment').textContent = state.stats.inAssessment;
    document.getElementById('statAwaitingBed').textContent = state.stats.awaitingBed;
    document.getElementById('statOccupied').textContent = state.stats.occupiedBeds;
    document.getElementById('statOccupancyRate').textContent = `${state.stats.occupancyRate}% occupancy`;
    document.getElementById('statAvailable').textContent = state.stats.availableBeds;
    document.getElementById('statTotalBeds').textContent = `${state.stats.totalBeds} total beds`;
    document.getElementById('statDischarged').textContent = state.stats.discharged;

    renderAuditLog(state.events);
  } catch (err) {
    console.error('Error loading operational stats:', err);
  }
}

async function loadQueue() {
  try {
    const data = await apiRequest('api/queue');
    state.queue = data.queue || [];
    renderQueue(state.queue);
  } catch (err) {
    console.error('Error loading emergency queue:', err);
  }
}

function renderQueue(queue) {
  const tbody = document.getElementById('queueTableBody');
  if (!tbody) return;

  if (queue.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 24px; color: var(--text-muted);">No patients currently waiting in the emergency queue.</td></tr>`;
    return;
  }

  tbody.innerHTML = queue.map(visit => {
    return `
      <tr>
        <td>
          <span class="rank-badge ${visit.queuePosition === 1 ? 'rank-1' : ''}">${visit.queuePosition}</span>
        </td>
        <td>
          <strong>${escapeHtml(visit.patientName)}</strong><br>
          <span style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">${visit.id}</span>
        </td>
        <td>
          <span class="triage-badge triage-cat-${visit.triageCategory}">
            Cat ${visit.triageCategory}
          </span>
        </td>
        <td style="max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(visit.chiefComplaint)}">
          ${escapeHtml(visit.chiefComplaint)}
        </td>
        <td>
          <span style="font-family: var(--font-mono);">${visit.waitingMinutes} min</span>
        </td>
        <td>
          <span class="status-pill status-${visit.status.toLowerCase()}">${visit.status}</span>
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="window.advanceSpecificPatient('${visit.id}')">
            Prioritize
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function loadBeds() {
  try {
    const ward = document.getElementById('filterWard')?.value || 'ALL';
    const capability = document.getElementById('filterCapability')?.value || 'ALL';
    const status = document.getElementById('filterStatus')?.value || 'ALL';

    const params = new URLSearchParams();
    if (ward !== 'ALL') params.append('ward', ward);
    if (capability !== 'ALL') params.append('capability', capability);
    if (status !== 'ALL') params.append('status', status);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const data = await apiRequest(`api/beds${queryStr}`);
    state.beds = data.beds || [];
    renderBeds(state.beds);
  } catch (err) {
    console.error('Error loading bed board:', err);
  }
}

function renderBeds(beds) {
  const grid = document.getElementById('bedsGrid');
  const summaryEl = document.getElementById('bedFilterSummary');
  if (!grid) return;

  if (summaryEl) {
    summaryEl.textContent = `Showing ${beds.length} beds`;
  }

  if (beds.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No beds match the selected filters.</div>`;
    return;
  }

  grid.innerHTML = beds.map(bed => {
    const statusClass = `status-${bed.status.toLowerCase()}`;
    const badgeClass = `badge-${bed.status.toLowerCase()}`;
    const hasOccupant = bed.status === 'OCCUPIED' && bed.occupant;

    let occupantHtml = `<div class="bed-empty-state">Ready for patient allocation</div>`;
    let actionsHtml = `
      <button class="btn btn-primary btn-sm" onclick="window.openAllocateModal('${bed.id}', '${bed.capability}')">
        Allocate Patient
      </button>
    `;

    if (hasOccupant) {
      occupantHtml = `
        <div class="bed-occupant-box">
          <div class="occupant-name">${escapeHtml(bed.occupant.patientName)}</div>
          <div class="occupant-detail">
            <span>${bed.occupant.visitId}</span> &bull; <span>Age ${bed.occupant.age}</span> &bull; <span>Cat ${bed.occupant.triageCategory}</span>
          </div>
          <div class="occupant-detail" style="margin-top: 4px; font-style: italic;">
            ${escapeHtml(bed.occupant.chiefComplaint || '')}
          </div>
        </div>
      `;
      actionsHtml = `
        <button class="btn btn-secondary btn-sm" onclick="window.openTransferModal('${bed.occupant.visitId}', '${escapeHtml(bed.occupant.patientName)}')">
          Transfer
        </button>
        <button class="btn btn-danger btn-sm" onclick="window.handleDischarge('${bed.occupant.visitId}')">
          Discharge
        </button>
      `;
    }

    return `
      <div class="bed-card ${statusClass}">
        <div class="bed-card-header">
          <div>
            <div class="bed-id">${bed.id}</div>
            <div class="bed-room">${escapeHtml(bed.room || bed.ward)}</div>
          </div>
          <span class="bed-badge ${badgeClass}">${bed.status}</span>
        </div>

        <div class="bed-meta-row">
          <span>Ward: <strong>${bed.ward}</strong></span>
          <span class="capability-pill">${bed.capability}</span>
        </div>

        ${occupantHtml}

        <div class="bed-card-actions">
          ${actionsHtml}
        </div>
      </div>
    `;
  }).join('');
}

async function loadVisits() {
  try {
    const filterStatus = document.getElementById('filterVisitStatus')?.value || 'ALL';
    const queryStr = filterStatus !== 'ALL' ? `?status=${filterStatus}` : '';
    const data = await apiRequest(`api/visits${queryStr}`);
    state.visits = data.visits || [];
    renderVisits(state.visits);
  } catch (err) {
    console.error('Error loading patient visits:', err);
  }
}

function renderVisits(visits) {
  const tbody = document.getElementById('directoryTableBody');
  if (!tbody) return;

  if (visits.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 24px; color: var(--text-muted);">No patient visits found.</td></tr>`;
    return;
  }

  tbody.innerHTML = visits.map(v => {
    let actionBtn = '-';
    if (v.status === 'AWAITING_BED') {
      actionBtn = `<button class="btn btn-primary btn-sm" onclick="window.switchTabToBeds()">Find Bed</button>`;
    } else if (v.status === 'ADMITTED') {
      actionBtn = `<button class="btn btn-danger btn-sm" onclick="window.handleDischarge('${v.id}')">Discharge</button>`;
    } else if (v.status === 'IN_ASSESSMENT') {
      actionBtn = `<button class="btn btn-secondary btn-sm" onclick="window.requestBed('${v.id}')">Request Bed</button>`;
    }

    return `
      <tr>
        <td style="font-family: var(--font-mono); font-weight: 600;">${v.id}</td>
        <td><strong>${escapeHtml(v.patientName)}</strong></td>
        <td>${v.age}</td>
        <td><span class="triage-badge triage-cat-${v.triageCategory}">Cat ${v.triageCategory}</span></td>
        <td style="font-size: 11px; color: var(--text-secondary);">${new Date(v.arrivalTime).toLocaleTimeString()}</td>
        <td><span class="capability-pill">${v.requiredCapability}</span></td>
        <td style="font-family: var(--font-mono);">${v.assignedBedId || '—'}</td>
        <td><span class="status-pill status-${v.status.toLowerCase()}">${v.status}</span></td>
        <td>${actionBtn}</td>
      </tr>
    `;
  }).join('');
}

function renderAuditLog(events) {
  const feed = document.getElementById('auditFeed');
  if (!feed) return;

  if (events.length === 0) {
    feed.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px;">No operational events recorded yet.</div>`;
    return;
  }

  feed.innerHTML = events.map(e => `
    <div class="audit-item">
      <span class="audit-time">${new Date(e.timestamp).toLocaleTimeString()}</span>
      <span class="audit-tag">${escapeHtml(e.type)}</span>
      <span class="audit-text">${escapeHtml(e.description)}</span>
    </div>
  `).join('');
}

// -------------------------------------------------------------
// Clinical & Operational User Actions
// -------------------------------------------------------------

async function handleRegisterPatient(e) {
  e.preventDefault();
  const name = document.getElementById('regPatientName').value;
  const age = document.getElementById('regAge').value;
  const triageCategory = document.getElementById('regTriageCategory').value;
  const requiredCapability = document.getElementById('regRequiredCapability').value;
  const chiefComplaint = document.getElementById('regComplaint').value;

  try {
    const data = await apiRequest('api/visits/register', {
      method: 'POST',
      body: JSON.stringify({
        patientName: name,
        age,
        triageCategory,
        requiredCapability,
        chiefComplaint
      })
    });

    showToast(`Patient ${data.visit.patientName} (${data.visit.id}) registered & enqueued`, 'success');
    document.getElementById('patientRegistrationForm').reset();

    await loadQueue();
    await loadVisits();
    await loadStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleCallNextPatient() {
  try {
    const data = await apiRequest('api/queue/call-next', {
      method: 'POST'
    });

    showToast(`Called next patient: ${data.visit.patientName} (${data.visit.id})`, 'success');
    renderActiveAssessment(data.visit);

    await loadQueue();
    await loadVisits();
    await loadStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderActiveAssessment(visit) {
  const box = document.getElementById('activeAssessmentBox');
  const body = document.getElementById('activeAssessmentBody');
  if (!box || !body) return;

  if (!visit) {
    box.classList.add('hidden');
    return;
  }

  box.classList.remove('hidden');
  body.innerHTML = `
    <div class="assessment-patient-info">
      <div>
        <div class="patient-identity">
          ${escapeHtml(visit.patientName)} <span>[${visit.id} &bull; Cat ${visit.triageCategory}]</span>
        </div>
        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
          ${escapeHtml(visit.chiefComplaint)} (Requires: ${visit.requiredCapability})
        </div>
      </div>
      <div class="assessment-actions">
        <button class="btn btn-primary btn-sm" onclick="window.requestBed('${visit.id}')">
          Request Inpatient Bed
        </button>
        <button class="btn btn-secondary btn-sm" onclick="window.handleDirectDischarge('${visit.id}')">
          Discharge from ED
        </button>
      </div>
    </div>
  `;
}

window.requestBed = async function(visitId) {
  try {
    await apiRequest(`api/visits/${visitId}/transition`, {
      method: 'POST',
      body: JSON.stringify({ status: 'AWAITING_BED' })
    });
    showToast('Patient marked as awaiting inpatient bed allocation', 'success');
    renderActiveAssessment(null);
    await loadQueue();
    await loadVisits();
    await loadStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.handleDirectDischarge = async function(visitId) {
  try {
    await apiRequest('api/admissions/discharge', {
      method: 'POST',
      body: JSON.stringify({ visitId })
    });
    showToast('Patient directly discharged from ED assessment', 'success');
    renderActiveAssessment(null);
    await loadQueue();
    await loadVisits();
    await loadStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.advanceSpecificPatient = async function(visitId) {
  try {
    await apiRequest(`api/visits/${visitId}/transition`, {
      method: 'POST',
      body: JSON.stringify({ status: 'IN_ASSESSMENT' })
    });
    const visitData = await apiRequest(`api/visits/${visitId}`);
    renderActiveAssessment(visitData.visit);
    showToast(`Prioritized ${visitData.visit.patientName} into clinical assessment`, 'info');
    await loadQueue();
    await loadVisits();
    await loadStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// Modals: Bed Allocation & Transfer
window.openAllocateModal = function(bedId, capability) {
  state.selectedBedId = bedId;
  const modal = document.getElementById('allocateModal');
  const infoEl = document.getElementById('allocateBedInfo');
  const select = document.getElementById('allocateVisitSelect');

  if (infoEl) {
    infoEl.innerHTML = `Selected Bed: <strong>${bedId}</strong> &bull; Capability: <strong>${capability}</strong>`;
  }

  // Populate patients awaiting bed or in assessment
  const eligible = state.visits.filter(v => v.status === 'AWAITING_BED' || v.status === 'IN_ASSESSMENT');
  if (eligible.length === 0) {
    select.innerHTML = `<option value="">No patients currently awaiting bed</option>`;
  } else {
    select.innerHTML = eligible.map(v => `
      <option value="${v.id}">
        ${escapeHtml(v.patientName)} (${v.id}) - Cat ${v.triageCategory} [Req: ${v.requiredCapability}]
      </option>
    `).join('');
  }

  modal.classList.remove('hidden');
};

async function handleConfirmAllocate() {
  const bedId = state.selectedBedId;
  const visitId = document.getElementById('allocateVisitSelect')?.value;

  if (!bedId || !visitId) {
    showToast('Please select a valid patient to allocate', 'error');
    return;
  }

  try {
    await apiRequest('api/beds/allocate', {
      method: 'POST',
      body: JSON.stringify({ bedId, visitId })
    });
    showToast(`Allocated bed ${bedId} successfully`, 'success');
    document.getElementById('allocateModal').classList.add('hidden');
    renderActiveAssessment(null);

    await loadBeds();
    await loadVisits();
    await loadStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

window.openTransferModal = function(visitId, patientName) {
  state.selectedVisitId = visitId;
  const modal = document.getElementById('transferModal');
  const infoEl = document.getElementById('transferPatientInfo');
  const select = document.getElementById('transferBedSelect');

  if (infoEl) {
    infoEl.innerHTML = `Patient: <strong>${escapeHtml(patientName)}</strong> (${visitId})`;
  }

  // Filter available beds
  const availableBeds = state.beds.filter(b => b.status === 'AVAILABLE');
  if (availableBeds.length === 0) {
    select.innerHTML = `<option value="">No available beds currently in hospital</option>`;
  } else {
    select.innerHTML = availableBeds.map(b => `
      <option value="${b.id}">
        ${b.id} (${b.ward}) - ${b.capability}
      </option>
    `).join('');
  }

  modal.classList.remove('hidden');
};

async function handleConfirmTransfer() {
  const visitId = state.selectedVisitId;
  const targetBedId = document.getElementById('transferBedSelect')?.value;

  if (!visitId || !targetBedId) {
    showToast('Please select a valid destination bed', 'error');
    return;
  }

  try {
    await apiRequest('api/beds/transfer', {
      method: 'POST',
      body: JSON.stringify({ visitId, targetBedId })
    });
    showToast(`Transferred patient to ${targetBedId} successfully`, 'success');
    document.getElementById('transferModal').classList.add('hidden');

    await loadBeds();
    await loadVisits();
    await loadStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

window.handleDischarge = async function(visitId) {
  if (!confirm('Confirm discharge and release of bed for this patient?')) {
    return;
  }

  try {
    await apiRequest('api/admissions/discharge', {
      method: 'POST',
      body: JSON.stringify({ visitId })
    });

    showToast('Patient discharged successfully', 'success');

    // Refresh visits, queue, and stats
    await loadVisits();
    await loadQueue();
    await loadStats();

  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.switchTabToBeds = function() {
  const bedTabBtn = document.querySelector('.nav-tab[data-tab="bedsTab"]');
  if (bedTabBtn) bedTabBtn.click();
};

async function handleResetDemoData() {
  if (!confirm('Reset all demo patient admissions, beds, and triage queues to deterministic baseline?')) {
    return;
  }

  try {
    await apiRequest('api/reset', { method: 'POST' });
    showToast('Demo data reset to baseline successfully', 'success');
    renderActiveAssessment(null);

    await loadStats();
    await loadQueue();
    await loadBeds();
    await loadVisits();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// -------------------------------------------------------------
// Initialization
// -------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  startClock();
  setupTabs();

  // Attach event listeners
  document.getElementById('patientRegistrationForm')?.addEventListener('submit', handleRegisterPatient);
  document.getElementById('btnCallNext')?.addEventListener('click', handleCallNextPatient);
  document.getElementById('resetDemoBtn')?.addEventListener('click', handleResetDemoData);

  document.getElementById('filterWard')?.addEventListener('change', loadBeds);
  document.getElementById('filterCapability')?.addEventListener('change', loadBeds);
  document.getElementById('filterStatus')?.addEventListener('change', loadBeds);
  document.getElementById('filterVisitStatus')?.addEventListener('change', loadVisits);

  document.getElementById('btnConfirmAllocate')?.addEventListener('click', handleConfirmAllocate);
  document.getElementById('btnConfirmTransfer')?.addEventListener('click', handleConfirmTransfer);

  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.close;
      document.getElementById(modalId)?.classList.add('hidden');
    });
  });

  // Initial load
  loadStats();
  loadQueue();
  loadBeds();
  loadVisits();
});
