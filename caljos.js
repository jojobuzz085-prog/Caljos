// Currency Converter, Function Plotter, and Scientific Calculator logic

// -----------------------------
// Utilities
// -----------------------------
function formatCurrency(value, currencyCode) {
    try {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currencyCode }).format(value);
    } catch (_) {
        return value.toFixed(2) + ' ' + currencyCode;
    }
}

// -----------------------------
// Currency Converter
// -----------------------------
// Base rates relative to EUR. These can be adjusted or fetched from an API if needed.
const CURRENCY_RATES_EUR = {
    EUR: 1,
    USD: 1.08,
    GBP: 0.85,
    JPY: 162.0,
    CHF: 0.96,
    CAD: 1.47,
    AUD: 1.62,
    CNY: 7.86,
    XOF: 655.957
};

function convertCurrency(amount, fromCode, toCode) {
    if (!Number.isFinite(amount)) return NaN;
    const fromRate = CURRENCY_RATES_EUR[fromCode];
    const toRate = CURRENCY_RATES_EUR[toCode];
    if (!fromRate || !toRate) return NaN;
    // Convert from source to EUR, then to target
    const inEur = amount / fromRate;
    return inEur * toRate;
}

function updateConversion() {
    const amountEl = document.getElementById('amount');
    const fromEl = document.getElementById('fromCurrency');
    const toEl = document.getElementById('toCurrency');
    const resultEl = document.getElementById('conversionResult');
    if (!amountEl || !fromEl || !toEl || !resultEl) return;

    const amount = parseFloat(amountEl.value);
    const from = fromEl.value;
    const to = toEl.value;

    if (!Number.isFinite(amount)) {
        resultEl.classList.add('error');
        resultEl.textContent = "Veuillez entrer un montant valide";
        return;
    }

    const converted = convertCurrency(amount, from, to);
    if (!Number.isFinite(converted)) {
        resultEl.classList.add('error');
        resultEl.textContent = "Conversion impossible";
        return;
    }

    resultEl.classList.remove('error');
    resultEl.textContent = `${formatCurrency(amount, from)} = ${formatCurrency(converted, to)}`;
}

// -----------------------------
// Function Plotter (Chart.js)
// -----------------------------
let functionChartInstance = null;

function compileExpressionToFunction(expr) {
    // Allow common math function aliases without Math. prefix
    const allowed = ['sin','cos','tan','log','sqrt','abs','pow','min','max','round','floor','ceil','exp'];
    let sanitized = expr
        .replace(/\^/g, '**')
        .replace(/π/g, 'Math.PI');

    // Replace bare function names with Math.function
    for (const name of allowed) {
        const re = new RegExp(`(?<![\w.])${name}\\s*\\(`, 'g');
        sanitized = sanitized.replace(re, `Math.${name}(`);
    }

    // Provide Math and x in a safe Function scope
    // Note: This still evaluates user input; in a trusted local app it's acceptable.
    // For untrusted contexts, use a real parser like math.js.
    // eslint-disable-next-line no-new-func
    const fn = new Function('x', 'Math', `return (${sanitized});`);
    return (x) => fn(x, Math);
}

function plotFunction() {
    const input = document.getElementById('functionInput');
    const canvas = document.getElementById('chartCanvas');
    if (!input || !canvas) return;

    const expr = input.value.trim();
    if (!expr) return;

    let f;
    try {
        f = compileExpressionToFunction(expr);
        // test evaluation
        void f(0);
    } catch (e) {
        alert("Expression invalide. Exemple: sin(x), x**2, log(x)");
        return;
    }

    const xs = [];
    const ys = [];
    const start = -10;
    const end = 10;
    const steps = 400;
    const step = (end - start) / steps;
    for (let i = 0; i <= steps; i++) {
        const x = start + i * step;
        let y = NaN;
        try { y = f(x); } catch (_) { y = NaN; }
        xs.push(x);
        ys.push(Number.isFinite(y) ? y : null);
    }

    if (functionChartInstance) {
        functionChartInstance.destroy();
        functionChartInstance = null;
    }

    functionChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: xs,
            datasets: [{
                label: `y = ${expr}`,
                data: ys,
                borderColor: '#00d4ff',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: { display: true, text: 'x', color: '#b0b0b0' },
                    ticks: { color: '#b0b0b0', maxTicksLimit: 10 }
                },
                y: {
                    title: { display: true, text: 'y', color: '#b0b0b0' },
                    ticks: { color: '#b0b0b0' }
                }
            },
            plugins: {
                legend: { labels: { color: '#e0e0e0' } }
            }
        }
    });
}

// Expose for onclick handlers in HTML
window.plotFunction = plotFunction;

// -----------------------------
// Scientific Calculator
// -----------------------------
function getDisplay() {
    return document.getElementById('calcDisplay');
}

function addToDisplay(text) {
    const display = getDisplay();
    if (!display) return;
    display.value += text;
}

function addSquare() {
    addToDisplay('**2');
}

function clearDisplay() {
    const display = getDisplay();
    if (!display) return;
    display.value = '';
}

function backspace() {
    const display = getDisplay();
    if (!display) return;
    display.value = display.value.slice(0, -1);
}

function safeEvalExpression(expr) {
    const allowed = ['sin','cos','tan','log','sqrt','abs','pow','min','max','round','floor','ceil','exp'];
    let sanitized = expr
        .replace(/\^/g, '**')
        .replace(/π/g, 'Math.PI');
    for (const name of allowed) {
        const re = new RegExp(`(?<![\w.])${name}\\s*\\(`, 'g');
        sanitized = sanitized.replace(re, `Math.${name}(`);
    }
    // Allow constants
    sanitized = sanitized.replace(/(?<![\w.])e(?![\w.])/g, 'Math.E');
    // eslint-disable-next-line no-new-func
    const fn = new Function('Math', `return (${sanitized});`);
    return fn(Math);
}

function calculate() {
    const display = getDisplay();
    if (!display) return;
    const expr = display.value;
    try {
        const result = safeEvalExpression(expr);
        if (typeof result === 'number' && Number.isFinite(result)) {
            display.value = String(result);
        } else {
            display.value = 'Erreur';
        }
    } catch (_) {
        display.value = 'Erreur';
    }
}

// Expose for onclick handlers in HTML
window.addToDisplay = addToDisplay;
window.addSquare = addSquare;
window.clearDisplay = clearDisplay;
window.backspace = backspace;
window.calculate = calculate;

// -----------------------------
// Wiring & Initialization
// -----------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Currency converter listeners
    const amountEl = document.getElementById('amount');
    const fromEl = document.getElementById('fromCurrency');
    const toEl = document.getElementById('toCurrency');
    if (amountEl) amountEl.addEventListener('input', updateConversion);
    if (fromEl) fromEl.addEventListener('change', updateConversion);
    if (toEl) toEl.addEventListener('change', updateConversion);
    updateConversion();

    // Calculator keyboard support
    const display = getDisplay();
    if (display) {
        // Scope keyboard handling ONLY to the calculator display to avoid
        // interfering with other inputs (converter amount, function input).
        display.addEventListener('keydown', (e) => {
            const key = e.key;
            if (/^[0-9.+\-*/()^]$/.test(key)) {
                e.preventDefault();
                addToDisplay(key === '^' ? '**' : key);
            } else if (key === 'Enter') {
                e.preventDefault();
                calculate();
            } else if (key === 'Backspace') {
                e.preventDefault();
                backspace();
            } else if (key === 'Escape') {
                e.preventDefault();
                clearDisplay();
            }
        });
    }

    // Enable Enter to plot in the function input without affecting calculator
    const functionInput = document.getElementById('functionInput');
    if (functionInput) {
        functionInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                plotFunction();
            }
        });
    }
});


