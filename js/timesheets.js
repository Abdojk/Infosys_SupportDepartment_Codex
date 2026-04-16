import { fetchTimeEntries } from './api.js';
import { showLoader, hideLoader, showError, escapeHtml } from './utils.js';

export function aggregateByOwner(entries = []) {
  const byOwner = new Map();

  entries.forEach((entry) => {
    const ownerName =
      entry.owneridname ||
      entry['_ownerid_value@OData.Community.Display.V1.FormattedValue'] ||
      'Unknown Owner';

    const existing = byOwner.get(ownerName) || { ownerName, totalHours: 0, entryCount: 0 };

    // Assumption: msdyn_duration is stored in minutes, so convert to hours by dividing by 60.
    const durationMinutes = Number(entry.msdyn_duration || 0);
    existing.totalHours += durationMinutes / 60;
    existing.entryCount += 1;

    byOwner.set(ownerName, existing);
  });

  return [...byOwner.values()]
    .map((item) => ({
      ownerName: item.ownerName,
      totalHours: Number(item.totalHours.toFixed(2)),
      entryCount: item.entryCount
    }))
    .sort((a, b) => b.totalHours - a.totalHours);
}

export function renderTimesheetSummary(aggregated = []) {
  const container = document.getElementById('timesheet-container');
  if (!container) return;

  if (!aggregated.length) {
    container.innerHTML = '<div class="empty-state">No time entries found for the selected filters.</div>';
    return;
  }

  container.innerHTML = aggregated
    .map(
      (row) => `
        <article class="summary-card">
          <h3>${escapeHtml(row.ownerName)}</h3>
          <p class="summary-metric">${escapeHtml(row.totalHours.toFixed(2))}h</p>
          <p class="summary-meta">${escapeHtml(String(row.entryCount))} entries</p>
        </article>
      `
    )
    .join('');
}

export async function loadTimeEntries(filters = {}) {
  showLoader('timesheet-container');
  try {
    const entries = await fetchTimeEntries(filters);
    const aggregated = aggregateByOwner(entries);
    hideLoader('timesheet-container');
    renderTimesheetSummary(aggregated);
    return { entries, aggregated };
  } catch (error) {
    hideLoader('timesheet-container');
    showError('timesheet-container', error.message || 'Unknown error while loading time entries.');
    throw error;
  }
}
