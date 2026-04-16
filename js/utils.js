export function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function clearContainer(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
}

export function showLoader(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="loader-wrap" role="status" aria-live="polite">
      <div class="loader" aria-hidden="true"></div>
      <p>Loading data…</p>
    </div>
  `;
}

export function hideLoader(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const loaderWrap = container.querySelector('.loader-wrap');
  if (loaderWrap) {
    loaderWrap.remove();
  }
}

export function showError(containerId, message) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="error-banner" role="alert">
      <strong>Unable to load data.</strong>
      <span>${escapeHtml(message)}</span>
    </div>
  `;
}

export function debounce(fn, delay = 300) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
