# Simple JSON Table Editor

Simple JSON Table Editor is a lightweight VS Code extension that lets you **view and edit** JSON data as an interactive table with automatic Light/Dark theme adaptation.

## Features

- 📊 **View & Edit**: Display JSON as a table and edit values inline
- ✏️ **Inline Editing**: Edit primitive values (numbers, strings, booleans, null) directly in cells
- 🎯 **Nested Editing**: Edit nested objects and arrays using a modal table editor or textarea
- 🎨 **Theme Adaptive**: Automatic Light/Dark theme support using VS Code theme variables
- 🔍 **Search & Filter**: Real-time search with highlighting across all cells
- 🌈 **Type-Aware Display**: Color-coded values by type (numbers, strings, booleans, null, objects)
- ➕ **Add/Delete Rows**: Add new rows or delete existing ones with confirmation
- 📦 **Expandable Objects**: Click icons to expand and edit nested JSON structures
- 🚀 **Multiple Triggers**: Command palette, context menu, editor title bar, or selection

## Quick Start

### From Command Palette
1. Open a JSON file in the editor.
2. Run `Command Palette` (Cmd/Ctrl+Shift+P).
3. Choose `View as Table`.

### From Editor Context Menu
1. Right-click inside a JSON file.
2. Choose `View as Table`.

### For Selected JSON
1. Select a JSON fragment.
2. Right-click and choose `View Selection as Table`.

## Supported JSON Shapes

- Array of objects (recommended)

```json
[
  {"id": 1, "name": "Alice", "age": 28, "active": true},
  {"id": 2, "name": "Bob", "age": 32, "active": false}
]
```

- Single object

```json
{
  "name": "Alice",
  "age": 28,
  "email": "alice@example.com"
}
```

- Nested objects and arrays are supported and editable via the nested editor.

## Editing

### Edit Cells
- **Click any cell** to start editing
- **Primitive values** (numbers, strings, booleans, null) are edited inline with an input field
- **JSON objects/arrays** can be edited:
  - As JSON text in a textarea (with validation)
  - Or click the 📋/📊 icon to open a **modal table editor** for structured editing

### Add/Delete Rows
- Click **"Add Row"** button to insert a new row at the bottom
- Click the **delete button** (🗑️) on any row to remove it (with confirmation dialog)

### Nested Objects
- Nested objects and arrays show preview text with an icon (📋 for arrays, 📊 for objects)
- Click the icon to open a **modal popup** with the nested data displayed as an editable table
- Edit values in the modal, click **Save** to apply changes

### Auto-Save
- All edits are **automatically saved** to the JSON file
- **JSON validation** ensures malformed data is rejected
- Type changes are reflected immediately (e.g., typing `false` displays as a boolean)

## Development

To run the extension in a development host:

```bash
# Install dependencies
npm install

# Compile and bundle
npm run compile

# Start watcher during development
npm run watch

# Press F5 in VS Code to launch the Extension Development Host
```

## Packaging

```bash
# Install vsce if you haven't
npm install -g @vscode/vsce

# Create a VSIX package
vsce package

# Install the created VSIX locally
code --install-extension simple-json-table-editor-0.0.1.vsix
```

Note: The `name` field in `package.json` is `simple-json-table-editor` and `displayName` is `Simple JSON Table Editor`.

## Contributing

Contributions are welcome. Please open issues or submit pull requests for improvements and bug fixes.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

Enjoy using Simple JSON Table Editor!
