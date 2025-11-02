// Wait for the DOM to be fully loaded before running script
document.addEventListener('DOMContentLoaded', () => {

    // --- Global Nerdamer Configuration ---
    // Check if nerdamer is loaded (it should be, from index.html)
    if (typeof nerdamer !== 'undefined') {
        // Set Nerdamer to use symbolic matrix evaluation
        nerdamer.set('MAT_EVAL_METHOD', 'symbolic');
    } else {
        console.error("Nerdamer.js library not loaded. Complex math will fail.");
    }
    
    // --- Tab Navigation Logic ---
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');

    function showTab(tabId) {
        // Hide all panels
        tabPanels.forEach(panel => {
            if (panel.id === `tab-panel-${tabId}`) {
                panel.classList.remove('hidden');
                panel.classList.add('active');
            } else {
                panel.classList.add('hidden');
                panel.classList.remove('active');
            }
        });
        
        // Deactivate all buttons
        tabButtons.forEach(btn => {
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            showTab(tabId);
        });
    });

    // --- Helper functions for displaying results ---
    function displayResult(element, result) {
        element.textContent = result.toString();
        element.classList.remove('result-error');
    }

    function displayError(element, error) {
        element.textContent = `Error: ${error.message || 'Invalid input'}`;
        element.classList.add('result-error');
    }

    // --- 1. Simple Calculator Logic ---
    const simpleDisplay = document.getElementById('simple-display');
    const calcGrid = document.getElementById('calc-grid');
    let currentInput = '0';
    let shouldResetDisplay = false;

    calcGrid.addEventListener('click', (e) => {
        if (!e.target.matches('.calc-btn')) return;

        const value = e.target.dataset.value;

        if (value === 'C') {
            currentInput = '0';
            simpleDisplay.textContent = currentInput;
            return;
        }

        if (value === 'CE') {
            currentInput = '0';
            simpleDisplay.textContent = currentInput;
            return;
        }
        
        if (value === '=') {
            try {
                // Using Function constructor is slightly safer than direct eval()
                const result = new Function('"use strict";return (' + currentInput + ')')();
                simpleDisplay.textContent = result;
                currentInput = result.toString();
                shouldResetDisplay = true;
            } catch (e) {
                simpleDisplay.textContent = 'Error';
                currentInput = '0';
                shouldResetDisplay = true;
            }
            return;
        }

        if (['+', '-', '*', '/'].includes(value)) {
            currentInput += ` ${value} `;
            simpleDisplay.textContent = currentInput;
            shouldResetDisplay = false;
            return;
        }
        
        if (value === '.') {
            // Avoid multiple dots in one number segment
            const parts = currentInput.split(' ');
            if (!parts[parts.length - 1].includes('.')) {
                currentInput += value;
            }
        } else {
             if (currentInput === '0' || shouldResetDisplay) {
                currentInput = value;
                shouldResetDisplay = false;
            } else {
                currentInput += value;
            }
        }
       
        simpleDisplay.textContent = currentInput;
    });


    // --- 2. Symbolic Calculator Logic ---
    const calcInput = document.getElementById('calcInput');
    const calcResult = document.getElementById('calcResult');

    document.getElementById('btnSimplify').addEventListener('click', () => {
        try {
            const expr = calcInput.value;
            const result = nerdamer.simplify(expr);
            displayResult(calcResult, result);
        } catch (e) {
            displayError(calcResult, e);
        }
    });

    document.getElementById('btnIntegrate').addEventListener('click', () => {
        try {
            const expr = calcInput.value;
            // Assumes integration variable is 'x'
            const result = nerdamer.integrate(expr, 'x');
            displayResult(calcResult, result);
        } catch (e) {
            displayError(calcResult, e);
        }
    });

    document.getElementById('btnDifferentiate').addEventListener('click', () => {
        try {
            const expr = calcInput.value;
            // Assumes differentiation variable is 'x'
            const result = nerdamer.diff(expr, 'x');
            displayResult(calcResult, result);
        } catch (e) {
            displayError(calcResult, e);
        }
    });


    // --- 3. Equation Solver Logic ---
    const eqInputs = [
        document.getElementById('eq1'),
        document.getElementById('eq2'),
        document.getElementById('eq3'),
        document.getElementById('eq4'),
    ];
    const solverResult = document.getElementById('solverResult');
    
    document.getElementById('btnSolveSystem').addEventListener('click', () => {
        try {
            // Get non-empty equations
            const equations = eqInputs
                .map(input => input.value)
                .filter(eq => eq.trim() !== '');

            if (equations.length === 0) {
                throw new Error('Please enter at least one equation.');
            }
            
            // Solve the system
            const result = nerdamer.solveEquations(equations);
            
            // Format the result
            const formattedResult = result.map(v => `${v[0]} = ${v[1]}`).join('\n');
            solverResult.textContent = formattedResult || 'No unique solution found.';
            solverResult.classList.remove('result-error');

        } catch (e) {
            displayError(solverResult, e);
        }
    });

    // --- 4. Matrix Logic ---
    const matrixA = document.getElementById('matrixA');
    const matrixB = document.getElementById('matrixB');
    const matrixResult = document.getElementById('matrixResult');

    document.getElementById('btnMatrixAdd').addEventListener('click', () => {
        try {
            const result = nerdamer(`(${matrixA.value}) + (${matrixB.value})`);
            displayResult(matrixResult, result);
        } catch (e) {
            displayError(matrixResult, e);
        }
    });

    document.getElementById('btnMatrixMultiply').addEventListener('click', () => {
        try {
            const result = nerdamer(`(${matrixA.value}) * (${matrixB.value})`);
            displayResult(matrixResult, result);
        } catch (e) {
            displayError(matrixResult, e);
        }
    });

    document.getElementById('btnMatrixDetA').addEventListener('click', () => {
        try {
            const result = nerdamer(`det(${matrixA.value})`);
            displayResult(matrixResult, result);
        } catch (e) {
            displayError(matrixResult, e);
        }
    });

    document.getElementById('btnMatrixInvA').addEventListener('click', () => {
        try {
            const result = nerdamer(`invert(${matrixA.value})`);
            displayResult(matrixResult, result);
        } catch (e) {
            displayError(matrixResult, e);
        }
    });

});