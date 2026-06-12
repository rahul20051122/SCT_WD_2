document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const inputDisplay = document.getElementById('inputDisplay');
  const equationDisplay = document.getElementById('equationDisplay');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const historyToggleBtn = document.getElementById('historyToggleBtn');
  const historyDrawer = document.getElementById('historyDrawer');
  const historyCloseBtn = document.getElementById('historyCloseBtn');
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const calcButtons = document.querySelectorAll('.calc-btn');

  // Calculator State
  let currentInput = '0';
  let equationString = '';
  let shouldResetInput = false;
  let isCalculated = false;
  let history = [];

  // Initialize
  initTheme();
  initHistory();
  updateDisplay();

  // --- Theme Management ---
  function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark-theme';
    document.body.className = savedTheme;
  }

  themeToggleBtn.addEventListener('click', () => {
    if (document.body.classList.contains('dark-theme')) {
      document.body.className = 'light-theme';
      localStorage.setItem('theme', 'light-theme');
    } else {
      document.body.className = 'dark-theme';
      localStorage.setItem('theme', 'dark-theme');
    }
  });

  // --- History Management ---
  function initHistory() {
    const savedHistory = localStorage.getItem('calc-history');
    if (savedHistory) {
      try {
        history = JSON.parse(savedHistory);
      } catch (e) {
        history = [];
      }
    }
    updateHistoryUI();
  }

  function saveHistory() {
    localStorage.setItem('calc-history', JSON.stringify(history));
    updateHistoryUI();
  }

  function updateHistoryUI() {
    historyList.innerHTML = '';
    
    if (history.length === 0) {
      const emptyMsg = document.createElement('li');
      emptyMsg.className = 'history-empty-msg';
      emptyMsg.textContent = 'No history yet';
      historyList.appendChild(emptyMsg);
      return;
    }

    // Show history in reverse order (most recent first)
    [...history].reverse().forEach((item, index) => {
      const idx = history.length - 1 - index;
      const li = document.createElement('li');
      li.className = 'history-item';
      li.setAttribute('tabindex', '0');
      li.setAttribute('role', 'button');
      li.setAttribute('aria-label', `Equation: ${item.equation}. Result: ${item.result}`);

      const eqDiv = document.createElement('div');
      eqDiv.className = 'history-equation';
      eqDiv.textContent = formatEquationDisplay(item.equation);

      const resDiv = document.createElement('div');
      resDiv.className = 'history-result';
      resDiv.textContent = item.result;

      li.appendChild(eqDiv);
      li.appendChild(resDiv);

      // Restore calculation when clicked
      const restoreItem = () => {
        // Strip equals sign and space at end if present
        let cleanEq = item.equation;
        if (cleanEq.endsWith('=')) {
          cleanEq = cleanEq.substring(0, cleanEq.length - 1).trim();
        }
        equationString = cleanEq;
        currentInput = item.result;
        isCalculated = true;
        shouldResetInput = true;
        updateDisplay();
        closeDrawer();
      };

      li.addEventListener('click', restoreItem);
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          restoreItem();
        }
      });

      historyList.appendChild(li);
    });
  }

  function clearHistory() {
    history = [];
    saveHistory();
  }

  clearHistoryBtn.addEventListener('click', clearHistory);

  // Drawer Toggles
  function openDrawer() {
    historyDrawer.classList.add('open');
    historyToggleBtn.setAttribute('aria-expanded', 'true');
    // Set focus inside the drawer for accessibility
    setTimeout(() => historyCloseBtn.focus(), 100);
  }

  function closeDrawer() {
    historyDrawer.classList.remove('open');
    historyToggleBtn.setAttribute('aria-expanded', 'false');
    historyToggleBtn.focus();
  }

  historyToggleBtn.addEventListener('click', openDrawer);
  historyCloseBtn.addEventListener('click', closeDrawer);

  // Close drawer on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && historyDrawer.classList.contains('open')) {
      closeDrawer();
    }
  });

  // --- Display Handling ---
  function updateDisplay() {
    // Dynamic text sizing based on output length to prevent clipping
    const inputLen = currentInput.length;
    if (inputLen > 14) {
      inputDisplay.style.fontSize = '1.4rem';
    } else if (inputLen > 9) {
      inputDisplay.style.fontSize = '1.9rem';
    } else {
      inputDisplay.style.fontSize = '2.75rem';
    }

    // Format output display with thousands separators if it is a valid number
    if (currentInput === 'Error' || currentInput === 'Cannot divide by 0') {
      inputDisplay.textContent = currentInput;
    } else {
      inputDisplay.textContent = formatLocaleNumber(currentInput);
    }

    // Format equation view operators for visual appeal
    equationDisplay.textContent = formatEquationDisplay(equationString);
    
    // Auto-scroll inputs to the right
    inputDisplay.scrollLeft = inputDisplay.scrollWidth;
    equationDisplay.scrollLeft = equationDisplay.scrollWidth;
  }

  // Helper to visually replace operators for premium typography (* -> ×, / -> ÷)
  function formatEquationDisplay(str) {
    if (!str) return '';
    return str
      .replace(/\*/g, ' × ')
      .replace(/\//g, ' ÷ ')
      .replace(/\+/g, ' + ')
      .replace(/\-/g, ' − ');
  }

  // Format digit inputs with local formatting (e.g. 1,000,000)
  function formatLocaleNumber(numStr) {
    if (numStr.includes('e')) return numStr; // exponential view as is
    
    const parts = numStr.split('.');
    let integerPart = parts[0];
    const decimalPart = parts.length > 1 ? '.' + parts[1] : '';

    // Add thousands separator using regex to support negative signs safely
    const sign = integerPart.startsWith('-') ? '-' : '';
    if (sign) integerPart = integerPart.substring(1);
    
    const formattedInt = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return sign + formattedInt + decimalPart;
  }

  // --- Calculator Logic Operations ---
  function handleDigit(digit) {
    if (currentInput === 'Error' || currentInput === 'Cannot divide by 0') {
      currentInput = '0';
    }

    if (shouldResetInput || currentInput === '0') {
      currentInput = digit;
      shouldResetInput = false;
    } else {
      // Limit to 15 digits to avoid floating point representation overflow
      if (currentInput.replace(/[^0-9]/g, '').length < 15) {
        currentInput += digit;
      }
    }
    isCalculated = false;
    updateDisplay();
  }

  function handleDecimal() {
    if (currentInput === 'Error' || currentInput === 'Cannot divide by 0') {
      currentInput = '0';
    }

    if (shouldResetInput) {
      currentInput = '0.';
      shouldResetInput = false;
    } else if (!currentInput.includes('.')) {
      currentInput += '.';
    }
    isCalculated = false;
    updateDisplay();
  }

  function handleOperator(op) {
    if (currentInput === 'Error' || currentInput === 'Cannot divide by 0') return;

    if (isCalculated) {
      equationString = currentInput + ' ' + op;
      shouldResetInput = true;
      isCalculated = false;
    } else {
      if (currentInput !== '') {
        // If there's an ongoing equation, construct it
        if (equationString === '') {
          equationString = currentInput + ' ' + op;
        } else {
          // If we had a pending operator, we can build up the equation
          equationString += ' ' + currentInput + ' ' + op;
        }
        shouldResetInput = true;
      } else if (equationString !== '') {
        // Operator was pressed right after another operator, swap it
        const tokens = equationString.trim().split(' ');
        if (tokens.length > 0) {
          const lastToken = tokens[tokens.length - 1];
          if (['+', '-', '*', '/'].includes(lastToken)) {
            tokens[tokens.length - 1] = op;
            equationString = tokens.join(' ');
          }
        }
      }
    }
    updateDisplay();
  }

  function handlePercent() {
    if (currentInput === 'Error' || currentInput === 'Cannot divide by 0') return;
    
    const val = parseFloat(currentInput);
    if (!isNaN(val)) {
      const res = val / 100;
      currentInput = formatNumberPrecision(res);
      isCalculated = false;
      updateDisplay();
    }
  }

  function handleToggleSign() {
    if (currentInput === 'Error' || currentInput === 'Cannot divide by 0' || currentInput === '0') return;

    if (currentInput.startsWith('-')) {
      currentInput = currentInput.substring(1);
    } else {
      currentInput = '-' + currentInput;
    }
    isCalculated = false;
    updateDisplay();
  }

  function handleClear() {
    currentInput = '0';
    equationString = '';
    shouldResetInput = false;
    isCalculated = false;
    updateDisplay();
  }

  function handleBackspace() {
    if (currentInput === 'Error' || currentInput === 'Cannot divide by 0') {
      handleClear();
      return;
    }

    if (isCalculated) {
      equationString = '';
      updateDisplay();
      return;
    }

    if (currentInput.length > 1) {
      currentInput = currentInput.slice(0, -1);
      // If result is just a minus, reset to 0
      if (currentInput === '-') currentInput = '0';
    } else {
      currentInput = '0';
    }
    updateDisplay();
  }

  function handleCalculate() {
    if (equationString === '' || isCalculated) return;
    if (currentInput === 'Error' || currentInput === 'Cannot divide by 0') return;

    const fullExpression = equationString + ' ' + currentInput;
    try {
      const result = evaluateExpression(fullExpression);
      const formattedResult = formatNumberPrecision(result);
      
      // Save history log
      history.push({
        equation: fullExpression + ' =',
        result: formattedResult
      });
      saveHistory();

      // Update Screen
      equationString = fullExpression + ' =';
      currentInput = formattedResult;
      isCalculated = true;
      shouldResetInput = true;
    } catch (err) {
      currentInput = err.message || 'Error';
      isCalculated = true;
      shouldResetInput = true;
    }
    updateDisplay();
  }

  // Helper to format float values and handle extreme numbers
  function formatNumberPrecision(num) {
    if (!isFinite(num)) {
      return 'Error';
    }
    
    // Check if exponent representation is needed for extreme bounds
    const absVal = Math.abs(num);
    if (absVal > 999999999999 || (absVal > 0 && absVal < 0.000001)) {
      return num.toExponential(6);
    }

    // Limit floating point numbers to max 10 decimal digits to prevent binary roundoff issues (e.g. 0.1+0.2)
    const fixedNum = parseFloat(num.toFixed(10));
    return fixedNum.toString();
  }

  // --- Custom Safe Expression Parser (No eval) ---
  function evaluateExpression(expr) {
    // 1. Tokenize the string expression
    const tokens = tokenize(expr);
    if (tokens.length === 0) return 0;
    
    // 2. Resolve Multiplications and Divisions (higher operator precedence)
    let i = 0;
    while (i < tokens.length) {
      if (tokens[i] === '*' || tokens[i] === '/') {
        const op = tokens[i];
        const left = tokens[i - 1];
        const right = tokens[i + 1];

        if (left === undefined || right === undefined) {
          throw new Error('Error');
        }

        let tempRes;
        if (op === '*') {
          tempRes = left * right;
        } else {
          if (right === 0) {
            throw new Error('Cannot divide by 0');
          }
          tempRes = left / right;
        }

        tokens.splice(i - 1, 3, tempRes);
        i--; // Adjustment for index offset
      } else {
        i++;
      }
    }

    // 3. Resolve Additions and Subtractions (lower precedence, evaluated left to right)
    i = 0;
    while (i < tokens.length) {
      if (tokens[i] === '+' || tokens[i] === '-') {
        const op = tokens[i];
        const left = tokens[i - 1];
        const right = tokens[i + 1];

        if (left === undefined || right === undefined) {
          throw new Error('Error');
        }

        const tempRes = op === '+' ? left + right : left - right;
        tokens.splice(i - 1, 3, tempRes);
        i--;
      } else {
        i++;
      }
    }

    if (tokens.length !== 1 || isNaN(tokens[0])) {
      throw new Error('Error');
    }

    return tokens[0];
  }

  // Parser helper to split digits, floats, negative symbols, and operators
  function tokenize(str) {
    const tokens = [];
    const rawTokens = str.trim().split(/\s+/);
    
    for (let i = 0; i < rawTokens.length; i++) {
      const t = rawTokens[i];
      if (['+', '-', '*', '/'].includes(t)) {
        tokens.push(t);
      } else {
        const num = parseFloat(t);
        if (isNaN(num)) {
          throw new Error('Error');
        }
        tokens.push(num);
      }
    }
    return tokens;
  }

  // --- Keyboard Event Handling mapping ---
  window.addEventListener('keydown', (e) => {
    // Prevent default scrolling on spacebar if targeting buttons
    if (e.key === ' ' && document.activeElement.tagName === 'BUTTON') {
      return;
    }

    let buttonId = null;

    if (e.key >= '0' && e.key <= '9') {
      buttonId = `key-${e.key}`;
      handleDigit(e.key);
    } else if (e.key === '.') {
      buttonId = 'key-decimal';
      handleDecimal();
    } else if (e.key === '+') {
      buttonId = 'key-add';
      handleOperator('+');
    } else if (e.key === '-') {
      buttonId = 'key-subtract';
      handleOperator('-');
    } else if (e.key === '*' || e.key.toLowerCase() === 'x') {
      buttonId = 'key-multiply';
      handleOperator('*');
    } else if (e.key === '/') {
      e.preventDefault(); // Prevent opening page search in some browsers
      buttonId = 'key-divide';
      handleOperator('/');
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      buttonId = 'key-equals';
      handleCalculate();
    } else if (e.key === 'Backspace') {
      buttonId = 'key-backspace';
      handleBackspace();
    } else if (e.key === 'Escape') {
      buttonId = 'key-clear';
      handleClear();
    } else if (e.key === '%') {
      buttonId = 'key-percent';
      handlePercent();
    }

    // Trigger visual active haptic styling on keyboard presses
    if (buttonId) {
      const btn = document.getElementById(buttonId);
      if (btn) {
        btn.classList.add('btn-active-trigger');
        setTimeout(() => btn.classList.remove('btn-active-trigger'), 100);
      }
    }
  });

  // --- Click Events Keypad binding ---
  calcButtons.forEach(button => {
    button.addEventListener('click', () => {
      const digit = button.getAttribute('data-val');
      const op = button.getAttribute('data-operator');
      const action = button.getAttribute('data-action');

      if (digit !== null) {
        handleDigit(digit);
      } else if (op !== null) {
        handleOperator(op);
      } else if (action !== null) {
        switch (action) {
          case 'clear':
            handleClear();
            break;
          case 'backspace':
            handleBackspace();
            break;
          case 'percent':
            handlePercent();
            break;
          case 'toggle-sign':
            handleToggleSign();
            break;
          case 'calculate':
            handleCalculate();
            break;
        }
      }
    });
  });
});
