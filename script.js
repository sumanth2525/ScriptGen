document.addEventListener('DOMContentLoaded', () => {
    const createScriptBtn = document.getElementById('createScriptBtn');
    const createStoredProcBtn = document.getElementById('createStoredProcBtn');
    const scriptGenerator = document.getElementById('scriptGenerator');
    const addColumnBtn = document.getElementById('addColumnBtn');
    const columnsList = document.getElementById('columnsList');
    const tableNameInput = document.getElementById('tableName');
    const valuesInput = document.getElementById('valuesInput');
    const generatedScript = document.getElementById('generatedScript');
    const copyScriptBtn = document.getElementById('copyScriptBtn');

    let columns = [];

    // Show script generator section
    createScriptBtn.addEventListener('click', () => {
        scriptGenerator.classList.remove('hidden');
    });

    // Add new column with constraint checkboxes
    addColumnBtn.addEventListener('click', () => {
        const columnDiv = document.createElement('div');
        columnDiv.className = 'column-item';
        
        const columnInput = document.createElement('input');
        columnInput.type = 'text';
        columnInput.placeholder = 'Column name';
        columnInput.className = 'column-name';
        
        const dataTypeSelect = document.createElement('select');
        dataTypeSelect.className = 'data-type';
        ['INT', 'VARCHAR(255)', 'TEXT', 'DATE', 'DECIMAL(10,2)', 'BOOLEAN'].forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            dataTypeSelect.appendChild(option);
        });

        // Constraint checkboxes
        const pkLabel = document.createElement('label');
        pkLabel.style.marginLeft = '10px';
        const pkCheckbox = document.createElement('input');
        pkCheckbox.type = 'checkbox';
        pkCheckbox.className = 'pk-constraint';
        pkLabel.appendChild(pkCheckbox);
        pkLabel.appendChild(document.createTextNode('Primary Key'));

        const fkLabel = document.createElement('label');
        fkLabel.style.marginLeft = '10px';
        const fkCheckbox = document.createElement('input');
        fkCheckbox.type = 'checkbox';
        fkCheckbox.className = 'fk-constraint';
        fkLabel.appendChild(fkCheckbox);
        fkLabel.appendChild(document.createTextNode('Foreign Key'));

        const nnLabel = document.createElement('label');
        nnLabel.style.marginLeft = '10px';
        const nnCheckbox = document.createElement('input');
        nnCheckbox.type = 'checkbox';
        nnCheckbox.className = 'nn-constraint';
        nnLabel.appendChild(nnCheckbox);
        nnLabel.appendChild(document.createTextNode('Not Null'));

        const uqLabel = document.createElement('label');
        uqLabel.style.marginLeft = '10px';
        const uqCheckbox = document.createElement('input');
        uqCheckbox.type = 'checkbox';
        uqCheckbox.className = 'uq-constraint';
        uqLabel.appendChild(uqCheckbox);
        uqLabel.appendChild(document.createTextNode('Unique'));

        // Default value
        const defLabel = document.createElement('label');
        defLabel.style.marginLeft = '10px';
        defLabel.appendChild(document.createTextNode('Default: '));
        const defInput = document.createElement('input');
        defInput.type = 'text';
        defInput.className = 'def-constraint';
        defInput.style.width = '80px';
        defLabel.appendChild(defInput);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'action-btn';
        deleteBtn.style.backgroundColor = '#dc3545';
        deleteBtn.addEventListener('click', () => columnDiv.remove());

        columnDiv.appendChild(columnInput);
        columnDiv.appendChild(dataTypeSelect);
        columnDiv.appendChild(pkLabel);
        columnDiv.appendChild(fkLabel);
        columnDiv.appendChild(nnLabel);
        columnDiv.appendChild(uqLabel);
        columnDiv.appendChild(defLabel);
        columnDiv.appendChild(deleteBtn);
        columnsList.appendChild(columnDiv);
    });

    // Handle keyword buttons
    document.querySelectorAll('.keyword-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const keyword = btn.dataset.keyword;
            const selectedColumn = document.querySelector('.column-name:focus');
            if (selectedColumn) {
                const columnDiv = selectedColumn.closest('.column-item');
                const keywordSpan = document.createElement('span');
                keywordSpan.textContent = keyword;
                keywordSpan.className = 'keyword-tag';
                columnDiv.appendChild(keywordSpan);
            }
        });
    });

    // Generate SQL script
    function generateScript(showAlerts = false) {
        const tableName = tableNameInput.value.trim();
        if (showAlerts && !tableName) {
            alert('Please enter a table name');
            return;
        }

        const columnElements = document.querySelectorAll('.column-item');
        if (showAlerts && columnElements.length === 0) {
            alert('Please add at least one column');
            return;
        }

        // Generate CREATE TABLE statement
        let createTableSQL = `CREATE TABLE ${tableName} (\n`;
        const columnDefinitions = [];
        let pkColumns = [];
        let fkColumns = [];

        columnElements.forEach(columnDiv => {
            const columnName = columnDiv.querySelector('.column-name').value.trim();
            const dataType = columnDiv.querySelector('.data-type').value;
            const isPK = columnDiv.querySelector('.pk-constraint').checked;
            const isFK = columnDiv.querySelector('.fk-constraint').checked;
            const isNN = columnDiv.querySelector('.nn-constraint').checked;
            const isUQ = columnDiv.querySelector('.uq-constraint').checked;
            const defVal = columnDiv.querySelector('.def-constraint').value.trim();

            let constraints = [];
            if (isNN) constraints.push('NOT NULL');
            if (isUQ) constraints.push('UNIQUE');
            if (defVal) constraints.push(`DEFAULT '${defVal}'`);
            // PK and FK handled separately

            if (columnName) {
                columnDefinitions.push(`    ${columnName} ${dataType} ${constraints.join(' ')}`.trim());
                if (isPK) pkColumns.push(columnName);
                if (isFK) fkColumns.push(columnName); // For demo, just collect
            }
        });

        // Add PRIMARY KEY constraint
        if (pkColumns.length > 0) {
            columnDefinitions.push(`    PRIMARY KEY (${pkColumns.join(', ')})`);
        }
        // Add FOREIGN KEY constraint (for demo, not referencing another table)
        // In a real app, you'd want to ask for the referenced table/column
        if (fkColumns.length > 0) {
            fkColumns.forEach(col => {
                columnDefinitions.push(`    FOREIGN KEY (${col}) REFERENCES other_table(other_id)`);
            });
        }

        if (columnDefinitions.length > 0) {
            createTableSQL += columnDefinitions.join(',\n') + '\n);\n\n';

            // Generate INSERT statement if values are provided
            let insertSQL = '';
            const values = valuesInput.value.trim();
            if (values) {
                const columnNames = Array.from(columnElements)
                    .map(div => div.querySelector('.column-name').value.trim())
                    .filter(name => name);

                insertSQL = `INSERT INTO ${tableName} (${columnNames.join(', ')})\nVALUES\n`;
                const valueRows = values.split('\n').map(row => {
                    const rowValues = row.split(',').map(v => v.trim());
                    return `    (${rowValues.map(v => `'${v}'`).join(', ')})`;
                });
                insertSQL += valueRows.join(',\n') + ';';
            }

            generatedScript.textContent = createTableSQL + insertSQL;
        } else {
            generatedScript.textContent = '';
        }
    }

    // Update script when inputs change (without alerts)
    [tableNameInput, valuesInput].forEach(input => {
        input.addEventListener('input', () => generateScript(false));
    });

    // Copy script to clipboard
    copyScriptBtn.addEventListener('click', () => {
        const script = generatedScript.textContent;
        if (script) {
            navigator.clipboard.writeText(script)
                .then(() => alert('Script copied to clipboard!'))
                .catch(err => console.error('Failed to copy script:', err));
        }
    });

    // Generate script when columns are modified (without alerts)
    columnsList.addEventListener('input', () => generateScript(false));
    columnsList.addEventListener('change', () => generateScript(false));

    // --- STORED PROCEDURE GENERATOR LOGIC ---
    const storedProcGenerator = document.getElementById('storedProcGenerator');
    const procNameInput = document.getElementById('procName');
    const paramNameInput = document.getElementById('paramNameInput');
    const paramTypeInput = document.getElementById('paramTypeInput');
    const addParamBtn = document.getElementById('addParamBtn');
    const paramsList = document.getElementById('paramsList');
    const sqlOperation = document.getElementById('sqlOperation');
    const procBody = document.getElementById('procBody');
    const generateProcBtn = document.getElementById('generateProcBtn');
    const generatedProc = document.getElementById('generatedProc');
    const copyProcBtn = document.getElementById('copyProcBtn');

    let procParams = [];

    // Show stored procedure generator section
    createStoredProcBtn.addEventListener('click', () => {
        scriptGenerator.classList.add('hidden');
        storedProcGenerator.classList.remove('hidden');
    });

    // Add parameter
    addParamBtn.addEventListener('click', () => {
        const name = paramNameInput.value.trim();
        const type = paramTypeInput.value;
        if (!name) return;
        procParams.push({ name, type });
        renderParams();
        paramNameInput.value = '';
    });

    // Render parameter list
    function renderParams() {
        paramsList.innerHTML = '';
        procParams.forEach((param, idx) => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.gap = '0.5rem';
            div.style.marginBottom = '0.25rem';
            div.textContent = `@${param.name} ${param.type}`;
            const delBtn = document.createElement('button');
            delBtn.textContent = 'Delete';
            delBtn.className = 'action-btn';
            delBtn.style.backgroundColor = '#dc3545';
            delBtn.onclick = () => {
                procParams.splice(idx, 1);
                renderParams();
            };
            div.appendChild(delBtn);
            paramsList.appendChild(div);
        });
    }

    // SQL operation template
    sqlOperation.addEventListener('change', () => {
        const op = sqlOperation.value;
        let template = '';
        if (op === 'SELECT') {
            template = 'SELECT * FROM TableName WHERE /* conditions */;';
        } else if (op === 'INSERT') {
            template = 'INSERT INTO TableName (columns) VALUES (values);';
        } else if (op === 'UPDATE') {
            template = 'UPDATE TableName SET column = value WHERE /* conditions */;';
        } else if (op === 'DELETE') {
            template = 'DELETE FROM TableName WHERE /* conditions */;';
        }
        procBody.value = template;
    });

    // Quick-action buttons
    document.querySelectorAll('.proc-action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            if (action === 'BEGIN TRANSACTION') {
                procBody.value = 'BEGIN TRANSACTION\n' + procBody.value;
            } else if (action === 'COMMIT') {
                procBody.value = procBody.value + '\nCOMMIT;';
            } else if (action === 'ROLLBACK') {
                procBody.value = procBody.value + '\nROLLBACK;';
            } else if (action === 'TRY CATCH') {
                procBody.value =
`BEGIN TRY
    -- SQL statements
${procBody.value.split('\n').map(line => '    ' + line).join('\n')}
END TRY
BEGIN CATCH
    -- Error handling
    ROLLBACK;
END CATCH`;
            } else if (action === 'BEST PRACTICE') {
                // Generate best practice template using current procName and params
                const procName = procNameInput.value.trim() || 'ProcedureName';
                const schemaProcName = procName.includes('.') ? procName : 'dbo.' + procName;
                const paramLines = procParams.map((p, i) => `    @${p.name} ${p.type}${i < procParams.length - 1 ? ',' : ''}`).join('\n') || '    -- parameters';
                const tableName = procName.replace(/^Add|^usp_Add/i, '').replace(/([A-Z])/g, '_$1').replace(/^_/, '').toLowerCase() || 'TableName';
                const colNames = procParams.map(p => p.name.charAt(0).toUpperCase() + p.name.slice(1)).join(', ');
                const paramNames = procParams.map(p => `@${p.name}`).join(', ');
                procBody.value =
`SET NOCOUNT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    INSERT INTO dbo.${tableName} (${colNames})
    VALUES (${paramNames});

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    -- If transaction is still open, roll it back
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;

    -- Re-throw the error
    THROW;
END CATCH`;
            }
        });
    });

    // Generate stored procedure script
    generateProcBtn.addEventListener('click', () => {
        const procName = procNameInput.value.trim();
        if (!procName) {
            alert('Please enter a procedure name');
            return;
        }
        const schemaProcName = procName.includes('.') ? procName : 'dbo.' + procName;
        const paramLines = procParams.map((p, i) => `    @${p.name} ${p.type}${i < procParams.length - 1 ? ',' : ''}`).join('\n');
        const body = procBody.value.trim() || '-- SQL statements here';
        const script =
`CREATE PROCEDURE ${schemaProcName}
${paramLines}
AS
BEGIN
${body.split('\n').map(line => '    ' + line).join('\n')}
END;
GO`;
        generatedProc.textContent = script;
    });

    // Copy stored procedure script
    copyProcBtn.addEventListener('click', () => {
        const script = generatedProc.textContent;
        if (script) {
            navigator.clipboard.writeText(script)
                .then(() => alert('Script copied to clipboard!'))
                .catch(err => console.error('Failed to copy script:', err));
        }
    });
}); 
