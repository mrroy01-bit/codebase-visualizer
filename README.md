# Codebase Visualizer

Codebase Visualizer is a VS Code extension that scans your workspace and renders an interactive dependency graph directly inside the editor.

It helps you explore:

- File dependencies across the project
- Module connections and import relationships
- Structural hotspots such as heavily imported files
- Folder-level distribution and codebase stats

## Features

- Interactive graph view inside a VS Code webview
- Force, radial, and folder-grouped layouts
- Click-to-focus node exploration
- Search for files by name or path
- Side panel with file details, imports, and reverse dependencies
- Workspace stats for files, edges, lines, folders, and external packages
- Refresh command for re-running analysis after code changes

## Commands

- `Codebase Visualizer: Open Project Graph`
- `Codebase Visualizer: Refresh Project Graph`

## Settings

The extension contributes these settings:

- `codebaseVisualizer.excludePatterns`
- `codebaseVisualizer.maxFiles`
- `codebaseVisualizer.includeExtensions`

## How It Works

The analyzer walks the current workspace, filters files by extension, extracts imports for supported languages, resolves local module references, and sends the resulting graph data into the visual explorer panel.

## Supported File Types

Default analysis includes:

- JavaScript: `.js`, `.jsx`, `.mjs`, `.cjs`
- TypeScript: `.ts`, `.tsx`
- Python: `.py`
- Frontend modules: `.vue`, `.svelte`

The analyzer also contains parsing patterns for additional languages such as Go, Rust, Java, C#, Ruby, and PHP, which can be enabled by including those extensions in settings.

## Development

1. Open this folder in VS Code.
2. Press `F5` to launch an Extension Development Host.
3. In the new window, run `Codebase Visualizer: Open Project Graph`.

## Packaging

Before publishing:

1. Replace the placeholder `publisher` value in `package.json` with your actual VS Code Marketplace publisher ID.
2. Install the packaging tool:

```bash
npm install --save-dev @vscode/vsce
```

3. Create a `.vsix` package:

```bash
npm run package
```

4. Publish to the marketplace:

```bash
npm run publish
```

## Notes

- The current manifest is marked as `preview` until you finish testing in a real Extension Development Host.
- Very large repos may need a higher `codebaseVisualizer.maxFiles` value.
