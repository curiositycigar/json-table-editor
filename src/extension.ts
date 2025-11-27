import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('JSON Table Viewer extension is now active!');

	// Register command to view JSON as table
	const viewAsTableCommand = vscode.commands.registerCommand('json-table-viewer.viewAsTable', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor found');
			return;
		}

		const document = editor.document;
		if (document.languageId !== 'json' && document.languageId !== 'jsonc') {
			vscode.window.showWarningMessage('Current file is not a JSON file');
			return;
		}

		const text = document.getText();
		try {
			const jsonData = JSON.parse(text);
			showJsonTable(context, jsonData, document.fileName, document.uri);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to parse JSON: ${error}`);
		}
	});

	// Register command to view selected JSON as table
	const viewSelectionAsTableCommand = vscode.commands.registerCommand('json-table-viewer.viewSelectionAsTable', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor found');
			return;
		}

		const selection = editor.selection;
		const text = editor.document.getText(selection);

		if (!text.trim()) {
			vscode.window.showWarningMessage('No text selected');
			return;
		}

		try {
			const jsonData = JSON.parse(text);
			showJsonTable(context, jsonData, 'Selected JSON', undefined);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to parse JSON: ${error}`);
		}
	});

	context.subscriptions.push(viewAsTableCommand, viewSelectionAsTableCommand);
}

function showJsonTable(context: vscode.ExtensionContext, jsonData: any, title: string, documentUri?: vscode.Uri) {
	const panel = vscode.window.createWebviewPanel(
		'jsonTableViewer',
		`JSON Table: ${title.split('/').pop()}`,
		vscode.ViewColumn.Two,
		{
			enableScripts: true,
			retainContextWhenHidden: true
		}
	);

	let currentData = jsonData;
	const isArray = Array.isArray(jsonData);

	panel.webview.html = getWebviewContent(currentData, !!documentUri);

	// Handle messages from webview
	panel.webview.onDidReceiveMessage(
		async message => {
			switch (message.command) {
				case 'updateCell':
					if (!documentUri) {
						vscode.window.showWarningMessage('Cannot edit: This is a read-only view');
						return;
					}

					const { rowIndex, columnKey, newValue } = message;
					try {
						// Update the data
						if (isArray && Array.isArray(currentData)) {
							if (currentData[rowIndex] && typeof currentData[rowIndex] === 'object') {
								currentData[rowIndex][columnKey] = parseValue(newValue);
							}
						} else if (typeof currentData === 'object') {
							currentData[columnKey] = parseValue(newValue);
						}

						// Write back to file
						const jsonString = JSON.stringify(currentData, null, 2);
						const edit = new vscode.WorkspaceEdit();
						const fullRange = new vscode.Range(
							0, 0,
							Number.MAX_VALUE, Number.MAX_VALUE
						);
						edit.replace(documentUri, fullRange, jsonString);
						const success = await vscode.workspace.applyEdit(edit);

						if (success) {
							await vscode.workspace.saveAll();
							panel.webview.postMessage({
								command: 'updateSuccess',
								rowIndex,
								columnKey,
								value: currentData[rowIndex][columnKey]
							});
							vscode.window.showInformationMessage('Changes saved successfully');
						} else {
							vscode.window.showErrorMessage('Failed to save changes');
							panel.webview.postMessage({ command: 'updateFailed' });
						}
					} catch (error) {
						vscode.window.showErrorMessage(`Failed to update: ${error}`);
						panel.webview.postMessage({ command: 'updateFailed' });
					}
					break;

				case 'addRow':
					if (!documentUri) {
						vscode.window.showWarningMessage('Cannot edit: This is a read-only view');
						return;
					}

					try {
						if (Array.isArray(currentData)) {
							// Create a new row with empty values for each column
							const newRow: any = {};
							if (currentData.length > 0 && typeof currentData[0] === 'object') {
								Object.keys(currentData[0]).forEach(key => {
									newRow[key] = '';
								});
							}
							currentData.push(newRow);

							// Write back to file
							const jsonString = JSON.stringify(currentData, null, 2);
							const edit = new vscode.WorkspaceEdit();
							const fullRange = new vscode.Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE);
							edit.replace(documentUri, fullRange, jsonString);
							const success = await vscode.workspace.applyEdit(edit);

						if (success) {
							await vscode.workspace.saveAll();
							// Send new row data instead of refreshing entire page
							panel.webview.postMessage({
								command: 'rowAdded',
								newRow: newRow,
								rowIndex: currentData.length - 1,
								columns: Object.keys(newRow)
							});
							vscode.window.showInformationMessage('Row added successfully');
						}
						}
					} catch (error) {
						vscode.window.showErrorMessage(`Failed to add row: ${error}`);
					}
					break;

				case 'deleteRow':
					if (!documentUri) {
						vscode.window.showWarningMessage('Cannot edit: This is a read-only view');
						return;
					}

					const { rowIndex: deleteIndex } = message;
					try {
						if (Array.isArray(currentData)) {
							currentData.splice(deleteIndex, 1);

							// Write back to file
							const jsonString = JSON.stringify(currentData, null, 2);
							const edit = new vscode.WorkspaceEdit();
							const fullRange = new vscode.Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE);
							edit.replace(documentUri, fullRange, jsonString);
							const success = await vscode.workspace.applyEdit(edit);

						if (success) {
							await vscode.workspace.saveAll();
							// Send delete message instead of refreshing entire page
							panel.webview.postMessage({
								command: 'rowDeleted',
								rowIndex: deleteIndex
							});
							vscode.window.showInformationMessage('Row deleted successfully');
						}
						}
					} catch (error) {
						vscode.window.showErrorMessage(`Failed to delete row: ${error}`);
					}
					break;
			}
		},
		undefined,
		context.subscriptions
	);
}

function parseValue(value: string): any {
	// Try to parse as number
	if (!isNaN(Number(value)) && value.trim() !== '') {
		return Number(value);
	}

	// Check for boolean
	if (value === 'true') return true;
	if (value === 'false') return false;

	// Check for null
	if (value === 'null' || value === '') return null;

	// Try to parse as JSON (for objects/arrays)
	try {
		return JSON.parse(value);
	} catch {
		// Return as string
		return value;
	}
}

function getWebviewContent(jsonData: any, editable: boolean = false): string {
	let tableData: any[] = [];

	// Handle different JSON structures
	if (Array.isArray(jsonData)) {
		tableData = jsonData;
	} else if (typeof jsonData === 'object' && jsonData !== null) {
		// If it's an object, convert to array with single item
		tableData = [jsonData];
	} else {
		tableData = [{ value: jsonData }];
	}

	// Extract all unique keys from the data
	const keys = new Set<string>();
	tableData.forEach(item => {
		if (typeof item === 'object' && item !== null) {
			Object.keys(item).forEach(key => keys.add(key));
		}
	});

	const columns = Array.from(keys);

	// Generate table HTML
	const tableHtml = generateTableHtml(tableData, columns, editable);

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>JSON Table Viewer</title>
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}

		body {
			font-family: var(--vscode-font-family);
			font-size: var(--vscode-font-size);
			color: var(--vscode-foreground);
			background-color: var(--vscode-editor-background);
			padding: 20px;
			overflow: auto;
		}

		.container {
			max-width: 100%;
			overflow-x: auto;
		}

		.info {
			margin-bottom: 15px;
			padding: 10px;
			background-color: var(--vscode-textBlockQuote-background);
			border-left: 4px solid var(--vscode-textLink-foreground);
			border-radius: 3px;
		}

		.info-item {
			margin: 5px 0;
			font-size: 0.9em;
		}

		table {
			width: 100%;
			border-collapse: collapse;
			background-color: var(--vscode-editor-background);
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
		}

		thead {
			background-color: var(--vscode-editor-lineHighlightBackground);
			position: sticky;
			top: 0;
			z-index: 10;
		}

		th {
			padding: 12px 15px;
			text-align: left;
			font-weight: 600;
			border-bottom: 2px solid var(--vscode-panel-border);
			color: var(--vscode-foreground);
			white-space: nowrap;
		}

		td {
			padding: 10px 15px;
			border-bottom: 1px solid var(--vscode-panel-border);
			max-width: 500px;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		tr:hover {
			background-color: var(--vscode-list-hoverBackground);
		}

		.null-value {
			color: var(--vscode-debugConsole-warningForeground);
			font-style: italic;
		}

		.number-value {
			color: var(--vscode-debugTokenExpression-number);
		}

		.boolean-value {
			color: var(--vscode-debugTokenExpression-boolean);
		}

		.string-value {
			color: var(--vscode-debugTokenExpression-string);
		}

		.object-value {
			color: var(--vscode-symbolIcon-objectForeground);
			font-family: monospace;
			font-size: 0.9em;
		}

		.expandable {
			cursor: pointer;
			user-select: none;
		}

		.expandable::before {
			content: '▶ ';
			display: inline-block;
			transition: transform 0.2s;
		}

		.expandable.expanded::before {
			transform: rotate(90deg);
		}

		.expanded-content {
			display: none;
			margin-top: 5px;
			padding: 10px;
			background-color: var(--vscode-textCodeBlock-background);
			border-radius: 3px;
			font-family: monospace;
			font-size: 0.85em;
			white-space: pre-wrap;
			word-break: break-all;
		}

		.expanded-content.visible {
			display: block;
		}

		.row-number {
			color: var(--vscode-editorLineNumber-foreground);
			font-weight: normal;
			text-align: right;
			padding-right: 20px;
		}

		.search-container {
			margin-bottom: 15px;
			display: flex;
			gap: 10px;
			align-items: center;
		}

		input[type="text"] {
			flex: 1;
			padding: 8px 12px;
			background-color: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-input-border);
			border-radius: 3px;
			font-family: var(--vscode-font-family);
			font-size: var(--vscode-font-size);
		}

		input[type="text"]:focus {
			outline: 1px solid var(--vscode-focusBorder);
		}

		button {
			padding: 8px 15px;
			background-color: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			border-radius: 3px;
			cursor: pointer;
			font-family: var(--vscode-font-family);
		}

		button:hover {
			background-color: var(--vscode-button-hoverBackground);
		}

		.add-btn {
			background-color: var(--vscode-button-secondaryBackground);
			color: var(--vscode-button-secondaryForeground);
		}

		.add-btn:hover {
			background-color: var(--vscode-button-secondaryHoverBackground);
		}

		.highlight {
			background-color: var(--vscode-editor-findMatchHighlightBackground);
		}

		.editable-cell {
			cursor: text;
			position: relative;
		}

		.editable-cell:hover::after {
			content: '✏️';
			position: absolute;
			right: 5px;
			top: 50%;
			transform: translateY(-50%);
			font-size: 0.8em;
			opacity: 0.6;
		}

		.editable-cell input {
			width: 100%;
			padding: 4px 8px;
			background-color: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-focusBorder);
			border-radius: 2px;
			font-family: var(--vscode-font-family);
			font-size: var(--vscode-font-size);
		}

		.delete-btn {
			padding: 4px 8px;
			font-size: 0.85em;
			background-color: var(--vscode-errorForeground);
			color: white;
			cursor: pointer;
		}

		.delete-btn:hover {
			opacity: 0.8;
		}

		.actions-column {
			text-align: center;
			width: 80px;
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="info">
			<div class="info-item"><strong>Total Rows:</strong> <span id="totalRows">${tableData.length}</span></div>
			<div class="info-item"><strong>Columns:</strong> <span id="totalColumns">${columns.length}</span></div>
			${editable ? '<div class="info-item" style="color: var(--vscode-textLink-foreground);"><strong>✏️ Edit Mode:</strong> Click any cell to edit</div>' : '<div class="info-item" style="color: var(--vscode-debugConsole-warningForeground);"><strong>📖 Read-only Mode</strong></div>'}
		</div>

		<div class="search-container">
			<input type="text" id="searchInput" placeholder="Search in table..." />
			<button onclick="clearSearch()">Clear</button>
			${editable ? '<button onclick="addRow()" class="add-btn">+ Add Row</button>' : ''}
		</div>

		${tableHtml}
	</div>

	<script>
		const vscode = acquireVsCodeApi();

		// Search functionality
		const searchInput = document.getElementById('searchInput');
		let searchTimeout;

		searchInput.addEventListener('input', function() {
			clearTimeout(searchTimeout);
			searchTimeout = setTimeout(() => {
				performSearch(this.value);
			}, 300);
		});

		function performSearch(searchTerm) {
			const cells = document.querySelectorAll('td');
			cells.forEach(cell => {
				cell.classList.remove('highlight');
			});

			if (!searchTerm) return;

			const lowerSearchTerm = searchTerm.toLowerCase();
			cells.forEach(cell => {
				const text = cell.textContent.toLowerCase();
				if (text.includes(lowerSearchTerm)) {
					cell.classList.add('highlight');
				}
			});
		}

		function clearSearch() {
			searchInput.value = '';
			performSearch('');
		}

		// Toggle expandable content
		document.addEventListener('click', function(e) {
			if (e.target.classList.contains('expandable')) {
				e.target.classList.toggle('expanded');
				const content = e.target.nextElementSibling;
				if (content && content.classList.contains('expanded-content')) {
					content.classList.toggle('visible');
				}
			}
		});

		// Edit cell functionality
		let editingCell = null;

		document.addEventListener('click', function(e) {
			const cell = e.target.closest('.editable-cell');
			if (cell && !cell.querySelector('input')) {
				startEdit(cell);
			}
		});

		function startEdit(cell) {
			if (editingCell) return;

			editingCell = cell;
			const rowIndex = parseInt(cell.dataset.row);
			const columnKey = cell.dataset.column;
			const currentValue = cell.dataset.value || cell.textContent.trim();

			const input = document.createElement('input');
			input.type = 'text';
			input.value = currentValue;

			cell.textContent = '';
			cell.appendChild(input);
			input.focus();
			input.select();

			const finishEdit = () => {
				const newValue = input.value;
				if (newValue !== currentValue) {
					vscode.postMessage({
						command: 'updateCell',
						rowIndex: rowIndex,
						columnKey: columnKey,
						newValue: newValue
					});
					cell.textContent = newValue;
					cell.dataset.value = newValue;
				} else {
					cell.textContent = currentValue;
				}
				editingCell = null;
			};

			input.addEventListener('blur', finishEdit);
			input.addEventListener('keydown', (e) => {
				if (e.key === 'Enter') {
					finishEdit();
				} else if (e.key === 'Escape') {
					cell.textContent = currentValue;
					editingCell = null;
				}
			});
		}

		function addRow() {
			vscode.postMessage({
				command: 'addRow'
			});
		}

		function deleteRow(rowIndex) {
			if (confirm('Are you sure you want to delete this row?')) {
				vscode.postMessage({
					command: 'deleteRow',
					rowIndex: rowIndex
				});
			}
		}

		// Listen for messages from extension
		window.addEventListener('message', event => {
			const message = event.data;
			switch (message.command) {
				case 'updateSuccess':
					// Cell updated successfully
					break;
				case 'updateFailed':
					alert('Failed to update cell. Please try again.');
					break;
				case 'rowAdded':
					handleRowAdded(message.newRow, message.rowIndex, message.columns);
					break;
				case 'rowDeleted':
					handleRowDeleted(message.rowIndex);
					break;
			}
		});

		function handleRowAdded(newRow, rowIndex, columns) {
			const tbody = document.querySelector('tbody');
			if (!tbody) return;

			const tr = document.createElement('tr');

			// Row number
			const rowNumCell = document.createElement('td');
			rowNumCell.className = 'row-number';
			rowNumCell.textContent = rowIndex + 1;
			tr.appendChild(rowNumCell);

			// Data cells
			columns.forEach(col => {
				const td = document.createElement('td');
				td.className = 'editable-cell';
				td.dataset.row = rowIndex;
				td.dataset.column = col;
				td.dataset.value = newRow[col] || '';
				td.innerHTML = formatCellValue(newRow[col]);
				tr.appendChild(td);
			});

			// Actions cell
			const actionsCell = document.createElement('td');
			actionsCell.className = 'actions-column';
			const deleteButton = document.createElement('button');
			deleteButton.className = 'delete-btn';
			deleteButton.textContent = 'Delete';
			deleteButton.onclick = function() { deleteRow(rowIndex); };
			actionsCell.appendChild(deleteButton);
			tr.appendChild(actionsCell);

			tbody.appendChild(tr);

			// Update total rows
			const totalRowsSpan = document.getElementById('totalRows');
			if (totalRowsSpan) {
				totalRowsSpan.textContent = tbody.children.length;
			}
		}

		function handleRowDeleted(rowIndex) {
			const tbody = document.querySelector('tbody');
			if (!tbody) return;

			const rows = tbody.querySelectorAll('tr');
			if (rows[rowIndex]) {
				rows[rowIndex].remove();

				// Update row numbers and data-row attributes
				tbody.querySelectorAll('tr').forEach((row, idx) => {
					const rowNumCell = row.querySelector('.row-number');
					if (rowNumCell) {
						rowNumCell.textContent = idx + 1;
					}

					// Update data-row attributes
					row.querySelectorAll('.editable-cell').forEach(cell => {
						cell.dataset.row = idx;
					});

					// Update delete button
					const deleteBtn = row.querySelector('.delete-btn');
					if (deleteBtn) {
						deleteBtn.onclick = function() { deleteRow(idx); };
					}
				});

				// Update total rows
				const totalRowsSpan = document.getElementById('totalRows');
				if (totalRowsSpan) {
					totalRowsSpan.textContent = tbody.children.length;
				}
			}
		}

		function formatCellValue(value) {
			if (value === null || value === undefined || value === '') {
				return '<span class="null-value">null<\\/span>';
			}
			if (typeof value === 'number') {
				return '<span class="number-value">' + value + '<\\/span>';
			}
			if (typeof value === 'boolean') {
				return '<span class="boolean-value">' + value + '<\\/span>';
			}
			return '<span class="string-value">' + escapeHtmlClient(String(value)) + '<\\/span>';
		}

		function escapeHtmlClient(text) {
			const div = document.createElement('div');
			div.textContent = text;
			return div.innerHTML;
		}
	</script>
</body>
</html>`;
}

function generateTableHtml(data: any[], columns: string[], editable: boolean = false): string {
	if (data.length === 0) {
		return '<p>No data to display</p>';
	}

	let html = '<table><thead><tr><th class="row-number">#</th>';

	// Generate column headers
	columns.forEach(col => {
		html += `<th>${escapeHtml(col)}</th>`;
	});

	if (editable) {
		html += '<th class="actions-column">Actions</th>';
	}

	html += '</tr></thead><tbody>';

	// Generate table rows
	data.forEach((item, index) => {
		html += `<tr><td class="row-number">${index + 1}</td>`;

		columns.forEach(col => {
			const value = typeof item === 'object' && item !== null ? item[col] : item;
			if (editable && typeof value !== 'object') {
				html += `<td class="editable-cell" data-row="${index}" data-column="${col}" data-value="${escapeHtml(String(value || ''))}">${formatValue(value)}</td>`;
			} else {
				html += `<td>${formatValue(value)}</td>`;
			}
		});

		if (editable) {
			html += `<td class="actions-column"><button class="delete-btn" onclick="deleteRow(${index})">Delete</button></td>`;
		}

		html += '</tr>';
	});

	html += '</tbody></table>';
	return html;
}

function formatValue(value: any): string {
	if (value === null || value === undefined) {
		return '<span class="null-value">null</span>';
	}

	const type = typeof value;

	if (type === 'number') {
		return `<span class="number-value">${value}</span>`;
	}

	if (type === 'boolean') {
		return `<span class="boolean-value">${value}</span>`;
	}

	if (type === 'string') {
		return `<span class="string-value">${escapeHtml(value)}</span>`;
	}

	if (type === 'object') {
		const jsonStr = JSON.stringify(value, null, 2);
		const preview = JSON.stringify(value).substring(0, 50);
		return `<div class="object-value">
			<span class="expandable">${escapeHtml(preview)}${preview.length >= 50 ? '...' : ''}</span>
			<div class="expanded-content">${escapeHtml(jsonStr)}</div>
		</div>`;
	}

	return escapeHtml(String(value));
}

function escapeHtml(text: string): string {
	const map: { [key: string]: string } = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;'
	};
	return text.replace(/[&<>"']/g, m => map[m]);
}

export function deactivate() {}
