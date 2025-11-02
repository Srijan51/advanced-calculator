// Wait for the DOM to be fully loaded before running script
document.addEventListener('DOMContentLoaded', () => {

    // --- Global Nerdamer Configuration ---
    if (typeof nerdamer !== 'undefined') {
        nerdamer.set('MAT_EVAL_METHOD', 'symbolic');
    } else {
        console.error("Nerdamer.js library not loaded. Complex math will fail.");
    }
    
    // --- Tab Navigation Logic ---
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');

    function showTab(tabId) {
        tabPanels.forEach(panel => {
            if (panel.id === `tab-panel-${tabId}`) {
                panel.classList.remove('hidden');
            } else {
                panel.classList.add('hidden');
            }
        });
        
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

        if (value === 'C') { // All Clear
            currentInput = '0';
            shouldResetDisplay = false;
        } else if (value === 'DEL') { // Delete last character
            currentInput = currentInput.slice(0, -1);
            if (currentInput === '') {
                currentInput = '0';
            }
            shouldResetDisplay = false;
        } else if (value === '=') {
            try {
                // Using Function constructor is slightly safer than direct eval()
                const result = new Function('"use strict";return (' + currentInput + ')')();
                currentInput = result.toString();
                shouldResetDisplay = true;
            } catch (e) {
                currentInput = '0';
                simpleDisplay.textContent = 'Error';
                shouldResetDisplay = true;
                return; // Don't update display at end
            }
        } else if (['+', '-', '*', '/'].includes(value)) {
            currentInput += ` ${value} `;
            shouldResetDisplay = false;
        } else if (value === '.') {
            const parts = currentInput.split(' ');
            if (!parts[parts.length - 1].includes('.')) {
                currentInput += value;
            }
            shouldResetDisplay = false;
        } else { // Number
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
    const symbolicVar = document.getElementById('symbolicVar');
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
            const variable = symbolicVar.value || 'x'; // Default to 'x' if empty
            const result = nerdamer.integrate(expr, variable);
            displayResult(calcResult, result);
        } catch (e) {
            displayError(calcResult, e);
        }
    });

    document.getElementById('btnDifferentiate').addEventListener('click', () => {
        try {
            const expr = calcInput.value;
            const variable = symbolicVar.value || 'x'; // Default to 'x' if empty
            const result = nerdamer.diff(expr, variable);
            displayResult(calcResult, result);
        } catch (e) {
            displayError(calcResult, e);
        }
    });


    // --- 3. Equation Solver Logic ---
    const varCountSelect = document.getElementById('solverVarCount');
    const eqContainer = document.getElementById('solverEqContainer');
    const solverResult = document.getElementById('solverResult');
    
    function updateSolverInputs() {
        const count = parseInt(varCountSelect.value, 10);
        eqContainer.innerHTML = ''; // Clear existing inputs
        
        const variables = ['x', 'y', 'z', 'w'];
        let placeholder = `e.g., 2*${variables[0]} + ${variables[1]} = 5`;

        for (let i = 1; i <= count; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.id = `eq${i}`;
            input.className = 'form-input';
            
            // Generate a more relevant placeholder
            let eqVars = variables.slice(0, count).join(', ');
            input.placeholder = `Eq ${i} (in terms of ${eqVars})`;
            
            eqContainer.appendChild(input);
        }
    }
    
    varCountSelect.addEventListener('change', updateSolverInputs);

    document.getElementById('btnSolveSystem').addEventListener('click', () => {
        try {
            // Get non-empty equations from the dynamically generated inputs
            const inputs = eqContainer.querySelectorAll('.form-input');
            const equations = Array.from(inputs)
                .map(input => input.value)
                .filter(eq => eq.trim() !== '');

            if (equations.length === 0) {
                throw new Error('Please enter at least one equation.');
            }
            if (equations.length !== parseInt(varCountSelect.value, 10)) {
                 throw new Error(`Please enter ${varCountSelect.value} equations for ${varCountSelect.value} variables.`);
            }
            
            const result = nerdamer.solveEquations(equations);
            
            // Format the result
            const formattedResult = result.map(v => `${v[0]} = ${v[1]}`).join('\n');
            solverResult.textContent = formattedResult || 'No unique solution found or system is complex.';
            solverResult.classList.remove('result-error');

        } catch (e) {
            displayError(solverResult, e);
        }
    });

    // --- 4. Matrix Logic ---
    const matrixARows = document.getElementById('matrixARows');
    const matrixACols = document.getElementById('matrixACols');
    const matrixBRows = document.getElementById('matrixBRows');
    const matrixBCols = document.getElementById('matrixBCols');
    const matrixAGrid = document.getElementById('matrixAGrid');
    const matrixBGrid = document.getElementById('matrixBGrid');
    const matrixResult = document.getElementById('matrixResult');

    /**
     * Creates a grid of input cells for a matrix.
     * @param {number} rows - Number of rows.
     * @param {number} cols - Number of columns.
     * @param {HTMLElement} container - The container element to populate.
     */
    function createMatrixGrid(rows, cols, container) {
        container.innerHTML = ''; // Clear old grid
        container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = document.createElement('input');
                cell.type = 'text'; // Use text to allow symbolic input
                cell.className = 'matrix-cell';
                cell.value = (r === c) ? '1' : '0'; // Default to identity-ish
                cell.dataset.row = r;
                cell.dataset.col = c;
                container.appendChild(cell);
            }
        }
    }

    /**
     * Reads the values from a matrix grid and converts to Nerdamer string format.
     * @param {HTMLElement} container - The grid container.
     * @param {number} rows - Number of rows.
     * @param {number} cols - Number of columns.
     * @returns {string} - Matrix in Nerdamer format, e.g., "[[1,2],[3,4]]"
     */
    function readMatrixFromGrid(container, rows, cols) {
        const cells = container.querySelectorAll('.matrix-cell');
        let matrix = [];
        for (let r = 0; r < rows; r++) {
            let row = [];
            for (let c = 0; c < cols; c++) {
                // Find the cell at [r, c]
                // This is safer than relying on querySelectorAll order if grid changes
                const cell = cells[r * cols + c];
                row.push(cell.value.trim() || '0'); // Default to '0' if empty
            }
            matrix.push(`[${row.join(',')}]`);
        }
        return `[${matrix.join(',')}]`;
    }

    // Update grids when dimensions change
    function updateMatrixGrids() {
        createMatrixGrid(parseInt(matrixARows.value), parseInt(matrixACols.value), matrixAGrid);
        createMatrixGrid(parseInt(matrixBRows.value), parseInt(matrixBCols.value), matrixBGrid);
    }
    
    [matrixARows, matrixACols, matrixBRows, matrixBCols].forEach(select => {
        select.addEventListener('change', updateMatrixGrids);
    });

    // Helper to get matrix strings from current grid state
    function getMatrixStrings() {
        const aRows = parseInt(matrixARows.value);
        const aCols = parseInt(matrixACols.value);
        const bRows = parseInt(matrixBRows.value);
        const bCols = parseInt(matrixBCols.value);

        const matAString = readMatrixFromGrid(matrixAGrid, aRows, aCols);
        const matBString = readMatrixFromGrid(matrixBGrid, bRows, bCols);
        
        return { matAString, matBString, aRows, aCols, bRows, bCols };
    }

    // Matrix button listeners
    document.getElementById('btnMatrixAdd').addEventListener('click', () => {
        try {
            const { matAString, matBString } = getMatrixStrings();
            const result = nerdamer(`(${matAString}) + (${matBString})`);
            displayResult(matrixResult, result);
        } catch (e) {
            displayError(matrixResult, e);
        }
    });

    document.getElementById('btnMatrixMultiply').addEventListener('click', () => {
        try {
            const { matAString, matBString } = getMatrixStrings();
            const result = nerdamer(`(${matAString}) * (${matBString})`);
            displayResult(matrixResult, result);
        } catch (e) {
            displayError(matrixResult, e);
        }
    });

    document.getElementById('btnMatrixDetA').addEventListener('click', () => {
        try {
            const { matAString, aRows, aCols } = getMatrixStrings();
            if (aRows !== aCols) {
                throw new Error('Determinant requires a square matrix.');
            }
            const result = nerdamer(`det(${matAString})`);
            displayResult(matrixResult, result);
        } catch (e) {
            displayError(matrixResult, e);
        }
    });

    document.getElementById('btnMatrixInvA').addEventListener('click', () => {
        try {
            const { matAString, aRows, aCols } = getMatrixStrings();
             if (aRows !== aCols) {
                throw new Error('Inverse requires a square matrix.');
            }
            const result = nerdamer(`invert(${matAString})`);
            displayResult(matrixResult, result);
        } catch (e) {
            displayError(matrixResult, e);
        }
    });

    // --- Initial setup on load ---
    showTab('simple'); // Show the first tab by default
    updateSolverInputs(); // Create initial solver inputs
    updateMatrixGrids(); // Create initial matrix grids

});