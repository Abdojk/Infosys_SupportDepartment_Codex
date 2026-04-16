import { fetchCases } from './api.js';
import { formatDate, showLoader, hideLoader, showError, escapeHtml } from './utils.js';

const STATE_MAP = {
  0: { label: 'Active', className: 'badge-status-active' },
  1: { label: 'Resolved', className: 'badge-status-resolved' },
  2: { label: 'Cancelled', className: 'badge-status-cancelled' }
};

const PRIORITY_MAP = {
  1: { label: 'High', className: 'badge-priority-high' },
  2: { label: 'Normal', className: 'badge-priority-normal' },
  3: { label: 'Low', className: 'badge-priority-low' }
};

function getStateMeta(statecode, fallback = '') {
  const mapped = STATE_MAP[statecode];
  if (mapped) return mapped;
  return { label: fallback || 'Unknown', className: 'badge-neutral' };
}

function getPriorityMeta(prioritycode, fallback = '') {
  const mapped = PRIORITY_MAP[prioritycode];
  if (mapped) return mapped;
  return { label: fallback || 'Unknown', className: 'badge-neutral' };
}

export function buildCaseFilterQuery(filters = {}) {
  const clauses = [];

  if (filters.owner) {
    const owner = filters.owner.replace(/[{}]/g, '');
    clauses.push(`_ownerid_value eq guid'${owner}'`);
  }

  if (filters.status !== '') {
    clauses.push(`statecode eq ${Number(filters.status)}`);
  }

  if (filters.priority !== '') {
    clauses.push(`prioritycode eq ${Number(filters.priority)}`);
  }

  if (filters.dateFrom) {
    clauses.push(`createdon ge ${filters.dateFrom}T00:00:00Z`);
  }

  if (filters.dateTo) {
    clauses.push(`createdon le ${filters.dateTo}T23:59:59Z`);
  }

  return clauses.join(' and ');
}

export function renderCasesTable(cases = []) {
  const container = document.getElementById('cases-container');
  if (!container) return;

  if (!cases.length) {
    container.innerHTML = '<div class="empty-state">No cases match the selected filters.</div>';
    return;
  }

  const rows = cases
    .map((item) => {
      const stateFormatted = item['statecode@OData.Community.Display.V1.FormattedValue'];
      const priorityFormatted = item['prioritycode@OData.Community.Display.V1.FormattedValue'];
      const stateMeta = getStateMeta(item.statecode, stateFormatted);
      const priorityMeta = getPriorityMeta(item.prioritycode, priorityFormatted);
      const ownerName =
        item.owneridname ||
        item['_ownerid_value@OData.Community.Display.V1.FormattedValue'] ||
        'Unassigned';

      return `
        <tr>
          <td>${escapeHtml(item.ticketnumber || '—')}</td>
          <td>${escapeHtml(item.title || 'Untitled')}</td>
          <td>${escapeHtml(ownerName)}</td>
          <td><span class="badge ${stateMeta.className}">${escapeHtml(stateMeta.label)}</span></td>
          <td><span class="badge ${priorityMeta.className}">${escapeHtml(priorityMeta.label)}</span></td>
          <td>${escapeHtml(formatDate(item.createdon))}</td>
          <td>${escapeHtml(formatDate(item.modifiedon))}</td>
        </tr>
      `;
    })
    .join('');

  container.innerHTML = `
    <div class="table-wrap">
      <table class="data-table">
        <caption class="sr-only">Department cases</caption>
        <thead>
          <tr>
            <th scope="col">Ticket #</th>
            <th scope="col">Title</th>
            <th scope="col">Owner</th>
            <th scope="col">Status</th>
            <th scope="col">Priority</th>
            <th scope="col">Created</th>
            <th scope="col">Modified</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

export async function loadCases(filters = {}) {
  showLoader('cases-container');
  try {
    const cases = await fetchCases(filters);
    hideLoader('cases-container');
    renderCasesTable(cases);
    return cases;
  } catch (error) {
    hideLoader('cases-container');
    showError('cases-container', error.message || 'Unknown error while loading cases.');
    throw error;
  }
}
