const expressionEl = document.getElementById('expression');
const resultEl = document.getElementById('result');
const keypad = document.querySelector('.keypad');
const themeToggle = document.getElementById('theme-toggle');

let expression = '';

const operators = ['+', '-', '*', '/', '%'];

const isOperator = (char) => operators.includes(char);

const updateDisplay = (preview = null) => {
  expressionEl.textContent = expression || '0';
  resultEl.textContent = preview ?? '0';
};

const tokenize = (input) => {
  const tokens = [];
  let current = '';

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];

    if ((ch >= '0' && ch <= '9') || ch === '.') {
      current += ch;
      continue;
    }

    if (isOperator(ch)) {
      if (current !== '') {
        tokens.push(Number(current));
        current = '';
      }
      tokens.push(ch);
    }
  }

  if (current !== '') {
    tokens.push(Number(current));
  }

  return tokens;
};

const reduceTokens = (tokens, opList) => {
  const result = [];
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    if (typeof token === 'string' && opList.includes(token)) {
      const left = result.pop();
      const right = tokens[i + 1];
      let value = 0;

      if (token === '*') value = left * right;
      if (token === '/') value = right === 0 ? NaN : left / right;
      if (token === '%') value = right === 0 ? NaN : left % right;
      if (token === '+') value = left + right;
      if (token === '-') value = left - right;

      result.push(value);
      i += 2;
      continue;
    }

    result.push(token);
    i += 1;
  }

  return result;
};

const calculate = (input) => {
  if (!input) return 0;

  const safeInput = input.replace(/\s+/g, '');
  if (isOperator(safeInput[safeInput.length - 1])) {
    return null;
  }

  const tokens = tokenize(safeInput);
  if (tokens.length === 0) return 0;

  const pass1 = reduceTokens(tokens, ['*', '/', '%']);
  const pass2 = reduceTokens(pass1, ['+', '-']);

  const finalValue = pass2[0];
  if (Number.isNaN(finalValue) || !Number.isFinite(finalValue)) {
    return 'Error';
  }

  return Number(finalValue.toFixed(10)).toString();
};

const canAddDecimal = () => {
  for (let i = expression.length - 1; i >= 0; i -= 1) {
    const ch = expression[i];
    if (isOperator(ch)) break;
    if (ch === '.') return false;
  }
  return true;
};

const appendValue = (value) => {
  if (value === '.') {
    if (!canAddDecimal()) return;
    if (expression === '' || isOperator(expression[expression.length - 1])) {
      expression += '0';
    }
  }

  if (isOperator(value) && expression === '') {
    if (value === '-') {
      expression = '-';
      updateDisplay();
    }
    return;
  }

  const last = expression[expression.length - 1];
  if (isOperator(value) && isOperator(last)) {
    expression = expression.slice(0, -1) + value;
  } else {
    expression += value;
  }

  const preview = calculate(expression);
  updateDisplay(preview === null ? '...' : preview);
};

const clearAll = () => {
  expression = '';
  updateDisplay('0');
};

const deleteOne = () => {
  expression = expression.slice(0, -1);
  const preview = calculate(expression);
  updateDisplay(preview === null ? '...' : preview ?? '0');
};

const toggleSign = () => {
  if (!expression) {
    expression = '-';
    updateDisplay();
    return;
  }

  const tokens = tokenize(expression);
  if (tokens.length === 0) return;

  const lastToken = tokens[tokens.length - 1];
  if (typeof lastToken !== 'number') return;

  const lastAsString = String(lastToken);
  const index = expression.lastIndexOf(lastAsString);
  if (index === -1) return;

  const negated = String(lastToken * -1);
  expression = expression.slice(0, index) + negated;
  const preview = calculate(expression);
  updateDisplay(preview === null ? '...' : preview);
};

const evaluate = () => {
  const output = calculate(expression);
  if (output === null) return;
  if (output === 'Error') {
    resultEl.textContent = 'Error';
    return;
  }

  expression = output;
  updateDisplay(output);
};

keypad.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;

  const { value, action } = button.dataset;
  if (value) appendValue(value);

  if (action === 'clear') clearAll();
  if (action === 'delete') deleteOne();
  if (action === 'sign') toggleSign();
  if (action === 'equals') evaluate();
});

document.addEventListener('keydown', (event) => {
  const { key } = event;

  if ((key >= '0' && key <= '9') || ['+', '-', '*', '/', '.', '%'].includes(key)) {
    appendValue(key);
    return;
  }

  if (key === 'Enter' || key === '=') {
    event.preventDefault();
    evaluate();
    return;
  }

  if (key === 'Backspace') {
    deleteOne();
    return;
  }

  if (key === 'Escape') {
    clearAll();
  }
});

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
});

updateDisplay('0');
