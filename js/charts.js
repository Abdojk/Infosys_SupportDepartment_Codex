import { formatDate } from './utils.js';

let casesStatusChart;
let hoursByOwnerChart;
let casesTrendChart;

const PALETTE = {
  blue: '#0078D4',
  green: '#107C10',
  gray: '#797775',
  red: '#D13438',
  slate: '#4A5568',
  grid: '#E2E8F0'
};

function emptyChart(containerId, message) {
  const canvas = document.getElementById(containerId);
  if (!canvas) return;
  const parent = canvas.parentElement;
  if (!parent) return;

  let note = parent.querySelector('.chart-empty');
  if (!note) {
    note = document.createElement('div');
    note.className = 'chart-empty';
    parent.appendChild(note);
  }
  note.textContent = message;
}

function clearEmptyChart(containerId) {
  const canvas = document.getElementById(containerId);
  if (!canvas) return;
  const parent = canvas.parentElement;
  if (!parent) return;
  const note = parent.querySelector('.chart-empty');
  if (note) note.remove();
}

function toDateKey(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export function renderCasesByStatusChart(cases = []) {
  const canvas = document.getElementById('chart-cases-status');
  if (!canvas || !window.Chart) return;

  if (casesStatusChart) casesStatusChart.destroy();

  if (!cases.length) {
    emptyChart('chart-cases-status', 'No case data available for this chart.');
    return;
  }

  clearEmptyChart('chart-cases-status');

  const counts = { Active: 0, Resolved: 0, Cancelled: 0 };
  cases.forEach((item) => {
    if (item.statecode === 0) counts.Active += 1;
    else if (item.statecode === 1) counts.Resolved += 1;
    else if (item.statecode === 2) counts.Cancelled += 1;
  });

  casesStatusChart = new window.Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['Active', 'Resolved', 'Cancelled'],
      datasets: [
        {
          data: [counts.Active, counts.Resolved, counts.Cancelled],
          backgroundColor: [PALETTE.blue, PALETTE.green, PALETTE.gray],
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        title: { display: true, text: 'Cases By Status' },
        legend: { position: 'bottom' }
      }
    }
  });
}

export function renderHoursByOwnerChart(aggregated = []) {
  const canvas = document.getElementById('chart-hours-owner');
  if (!canvas || !window.Chart) return;

  if (hoursByOwnerChart) hoursByOwnerChart.destroy();

  if (!aggregated.length) {
    emptyChart('chart-hours-owner', 'No time entry data available for this chart.');
    return;
  }

  clearEmptyChart('chart-hours-owner');

  hoursByOwnerChart = new window.Chart(canvas, {
    type: 'bar',
    data: {
      labels: aggregated.map((item) => item.ownerName),
      datasets: [
        {
          label: 'Hours',
          data: aggregated.map((item) => item.totalHours),
          backgroundColor: PALETTE.blue,
          borderColor: PALETTE.slate,
          borderWidth: 1
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        title: { display: true, text: 'Hours By Owner' },
        legend: { display: false }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: PALETTE.grid }
        },
        y: {
          grid: { display: false }
        }
      }
    }
  });
}

export function renderCasesTrendChart(cases = []) {
  const canvas = document.getElementById('chart-cases-trend');
  if (!canvas || !window.Chart) return;

  if (casesTrendChart) casesTrendChart.destroy();

  const days = [];
  const countsByDay = new Map();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let i = 29; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setUTCDate(today.getUTCDate() - i);
    const key = day.toISOString().slice(0, 10);
    days.push(key);
    countsByDay.set(key, 0);
  }

  cases.forEach((item) => {
    const key = toDateKey(item.createdon);
    if (key && countsByDay.has(key)) {
      countsByDay.set(key, countsByDay.get(key) + 1);
    }
  });

  const values = days.map((day) => countsByDay.get(day));

  if (!cases.length || values.every((value) => value === 0)) {
    emptyChart('chart-cases-trend', 'No recent case activity for the last 30 days.');
  } else {
    clearEmptyChart('chart-cases-trend');
  }

  casesTrendChart = new window.Chart(canvas, {
    type: 'line',
    data: {
      labels: days.map((day) => formatDate(day)),
      datasets: [
        {
          label: 'Cases Created',
          data: values,
          borderColor: PALETTE.blue,
          backgroundColor: 'rgba(0, 120, 212, 0.15)',
          pointRadius: 2,
          tension: 0.2,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        title: { display: true, text: 'Cases Trend (Last 30 Days)' },
        legend: { position: 'bottom' }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxTicksLimit: 8 }
        },
        y: {
          beginAtZero: true,
          grid: { color: PALETTE.grid },
          ticks: { precision: 0 }
        }
      }
    }
  });
}
