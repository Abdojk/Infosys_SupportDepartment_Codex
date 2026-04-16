import { ensureAuthenticatedOrRedirect, initMsal, logout } from './auth.js';
import { fetchSystemUsers } from './api.js';
import { loadCases } from './cases.js';
import { loadTimeEntries } from './timesheets.js';
import {
  renderCasesByStatusChart,
  renderHoursByOwnerChart,
  renderCasesTrendChart
} from './charts.js';
import { showError, escapeHtml } from './utils.js';

let currentFilters = {
  owner: '',
  status: '',
  priority: '',
  dateFrom: '',
  dateTo: ''
};

function getFilterValues() {
  return {
    owner: document.getElementById('owner-filter')?.value || '',
    status: document.getElementById('status-filter')?.value || '',
    priority: document.getElementById('priority-filter')?.value || '',
    dateFrom: document.getElementById('date-from')?.value || '',
    dateTo: document.getElementById('date-to')?.value || ''
  };
}

function setKpi(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value;
}

function updateKpis(cases, aggregated) {
  const activeCases = cases.filter((c) => c.statecode === 0).length;
  const resolvedCases = cases.filter((c) => c.statecode === 1).length;
  const totalHours = aggregated.reduce((sum, row) => sum + row.totalHours, 0);

  setKpi('kpi-total-cases', String(cases.length));
  setKpi('kpi-active-cases', String(activeCases));
  setKpi('kpi-resolved-cases', String(resolvedCases));
  setKpi('kpi-total-hours', `${totalHours.toFixed(2)}h`);
  setKpi('kpi-owner-count', String(aggregated.length));
}

async function populateOwnerFilter() {
  const ownerSelect = document.getElementById('owner-filter');
  if (!ownerSelect) return;

  try {
    const users = await fetchSystemUsers();
    const options = users
      .map(
        (user) =>
          `<option value="${escapeHtml(user.systemuserid)}">${escapeHtml(
            user.fullname || user.internalemailaddress || 'Unnamed User'
          )}</option>`
      )
      .join('');

    ownerSelect.insertAdjacentHTML('beforeend', options);
  } catch (error) {
    showError('cases-container', `Unable to load owners: ${error.message}`);
  }
}

async function loadDashboardData(filters = {}) {
  const tasks = {
    cases: null,
    aggregated: null
  };

  try {
    tasks.cases = await loadCases(filters);
  } catch (error) {
    console.error('Cases load failed', error);
  }

  try {
    const timeData = await loadTimeEntries(filters);
    tasks.aggregated = timeData.aggregated;
  } catch (error) {
    console.error('Time entries load failed', error);
  }

  if (tasks.cases) {
    renderCasesByStatusChart(tasks.cases);
    renderCasesTrendChart(tasks.cases);
  }

  if (tasks.aggregated) {
    renderHoursByOwnerChart(tasks.aggregated);
  }

  updateKpis(tasks.cases || [], tasks.aggregated || []);
}

function wireEvents() {
  document.getElementById('apply-filters')?.addEventListener('click', async () => {
    currentFilters = getFilterValues();
    await loadDashboardData(currentFilters);
  });

  document.getElementById('reset-filters')?.addEventListener('click', async () => {
    document.getElementById('owner-filter').value = '';
    document.getElementById('status-filter').value = '';
    document.getElementById('priority-filter').value = '';
    document.getElementById('date-from').value = '';
    document.getElementById('date-to').value = '';

    currentFilters = {
      owner: '',
      status: '',
      priority: '',
      dateFrom: '',
      dateTo: ''
    };

    await loadDashboardData(currentFilters);
  });

  document.getElementById('refresh-dashboard')?.addEventListener('click', async () => {
    currentFilters = getFilterValues();
    await loadDashboardData(currentFilters);
  });

  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await logout();
  });
}

async function bootstrap() {
  try {
    await initMsal();
    const ok = await ensureAuthenticatedOrRedirect();
    if (!ok) return;

    wireEvents();
    await populateOwnerFilter();
    await loadDashboardData(currentFilters);
  } catch (error) {
    console.error(error);
    showError('cases-container', `Dashboard startup failed: ${error.message}`);
    showError('timesheet-container', `Dashboard startup failed: ${error.message}`);
  }
}

bootstrap();
