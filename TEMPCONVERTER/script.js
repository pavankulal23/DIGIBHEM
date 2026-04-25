const form = document.getElementById('converter-form');
const temperatureInput = document.getElementById('temperature-input');
const fromUnit = document.getElementById('from-unit');
const toUnit = document.getElementById('to-unit');
const swapBtn = document.getElementById('swap-btn');
const precisionRange = document.getElementById('precision-range');
const precisionLabel = document.getElementById('precision-label');
const autoConvert = document.getElementById('auto-convert');
const resetBtn = document.getElementById('reset-btn');
const copyBtn = document.getElementById('copy-btn');
const resultValue = document.getElementById('result-value');
const formulaText = document.getElementById('formula-text');
const errorText = document.getElementById('error-text');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history');
const presetButtons = document.querySelectorAll('.preset-chip');

const history = [];
const MAX_HISTORY = 8;

const labels = {
  C: 'C',
  F: 'F',
  K: 'K'
};

const convertToCelsius = (value, unit) => {
  if (unit === 'C') return value;
  if (unit === 'F') return ((value - 32) * 5) / 9;
  return value - 273.15;
};

const convertFromCelsius = (valueInCelsius, unit) => {
  if (unit === 'C') return valueInCelsius;
  if (unit === 'F') return (valueInCelsius * 9) / 5 + 32;
  return valueInCelsius + 273.15;
};

const formatResult = (number, decimals) => {
  if (!Number.isFinite(number)) return '--';
  return Number(number).toFixed(decimals).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
};

const formulaDescription = (from, to) => {
  if (from === to) return 'No conversion needed: value remains the same.';

  const map = {
    'C-F': 'F = (C x 9/5) + 32',
    'C-K': 'K = C + 273.15',
    'F-C': 'C = (F - 32) x 5/9',
    'F-K': 'K = (F - 32) x 5/9 + 273.15',
    'K-C': 'C = K - 273.15',
    'K-F': 'F = (K - 273.15) x 9/5 + 32'
  };

  return `Formula: ${map[`${from}-${to}`]}`;
};

const setError = (message) => {
  errorText.textContent = message;
};

const renderHistory = () => {
  historyList.innerHTML = '';

  if (history.length === 0) {
    historyList.innerHTML = '<li class="empty-state">No conversions yet.</li>';
    return;
  }

  history.forEach((entry) => {
    const li = document.createElement('li');
    li.innerHTML = `${entry.input} ${entry.from} -> ${entry.output} ${entry.to}<span class="time">${entry.time}</span>`;
    historyList.appendChild(li);
  });
};

const addHistory = (input, from, output, to) => {
  const now = new Date();
  history.unshift({
    input,
    from,
    output,
    to,
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  if (history.length > MAX_HISTORY) {
    history.pop();
  }

  renderHistory();
};

const convertTemperature = (appendHistory = true) => {
  const rawValue = temperatureInput.value.trim();
  const parsedValue = Number(rawValue);
  const from = fromUnit.value;
  const to = toUnit.value;
  const decimals = Number(precisionRange.value);

  if (rawValue === '' || Number.isNaN(parsedValue)) {
    setError('Please enter a valid numeric temperature.');
    resultValue.textContent = '--';
    formulaText.textContent = 'Formula will appear here after conversion.';
    return false;
  }

  if (from === 'K' && parsedValue < 0) {
    setError('Kelvin cannot be below 0.');
    resultValue.textContent = '--';
    formulaText.textContent = 'Formula will appear here after conversion.';
    return false;
  }

  const valueInCelsius = convertToCelsius(parsedValue, from);
  if (valueInCelsius < -273.15) {
    setError('Temperature cannot be below absolute zero.');
    resultValue.textContent = '--';
    formulaText.textContent = 'Formula will appear here after conversion.';
    return false;
  }

  const converted = convertFromCelsius(valueInCelsius, to);
  const output = formatResult(converted, decimals);

  setError('');
  resultValue.textContent = `${output} ${labels[to]}`;
  formulaText.textContent = formulaDescription(from, to);

  if (appendHistory) {
    addHistory(formatResult(parsedValue, decimals), labels[from], output, labels[to]);
  }

  return true;
};

const triggerAutoConvert = () => {
  if (autoConvert.checked) {
    convertTemperature(false);
  }
};

form.addEventListener('submit', (event) => {
  event.preventDefault();
  convertTemperature(true);
});

swapBtn.addEventListener('click', () => {
  const from = fromUnit.value;
  fromUnit.value = toUnit.value;
  toUnit.value = from;
  triggerAutoConvert();
});

precisionRange.addEventListener('input', () => {
  const value = Number(precisionRange.value);
  precisionLabel.textContent = value === 1 ? '1 decimal' : `${value} decimals`;
  triggerAutoConvert();
});

[fromUnit, toUnit, temperatureInput].forEach((el) => {
  el.addEventListener('input', triggerAutoConvert);
  el.addEventListener('change', triggerAutoConvert);
});

resetBtn.addEventListener('click', () => {
  form.reset();
  fromUnit.value = 'C';
  toUnit.value = 'F';
  precisionRange.value = '2';
  precisionLabel.textContent = '2 decimals';
  autoConvert.checked = true;
  resultValue.textContent = '--';
  formulaText.textContent = 'Formula will appear here after conversion.';
  setError('');
  temperatureInput.focus();
});

copyBtn.addEventListener('click', async () => {
  const text = resultValue.textContent.trim();
  if (text === '--') {
    setError('Convert a value first to copy the result.');
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    setError('Result copied to clipboard.');
  } catch (_error) {
    setError('Copy failed. Please copy manually.');
  }
});

clearHistoryBtn.addEventListener('click', () => {
  history.length = 0;
  renderHistory();
});

presetButtons.forEach((button) => {
  button.addEventListener('click', () => {
    temperatureInput.value = button.dataset.presetValue;
    fromUnit.value = button.dataset.presetUnit;
    if (fromUnit.value === toUnit.value) {
      toUnit.value = fromUnit.value === 'C' ? 'F' : 'C';
    }
    convertTemperature(true);
  });
});

precisionLabel.textContent = '2 decimals';
renderHistory();
