# JSON Table Viewer

Simple JSON Table Editor is a lightweight VS Code extension that displays JSON data as an interactive table and adapts automatically to Light/Dark themes.

## Features

- Table view for JSON arrays and objects
- Automatic theme adaptation (Light/Dark) using VS Code theme variables
- Inline editing of primitive values and JSON objects
- Expandable nested objects and arrays with a modal table editor
- Search and highlight matching cells
- Type-aware coloring for numbers, strings, booleans, and null
- Multiple activation methods: command palette, editor context menu, editor title

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

- Double-click (or click) a cell to edit. Primitive values (numbers, booleans, strings, null) are edited inline.
- JSON objects/arrays open a textarea or a modal table editor for structured editing.
- Edits are validated (JSON parsing) before saving back to the file.

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
