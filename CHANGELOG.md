# Changelog

## 0.0.6

- Added a guided screenshot walkthrough in the README using real `media/preview` images
- Renamed preview assets to clean filenames so packaging and README references stay stable
- Repackaged the extension so the latest Marketplace/VS Code details page shows the updated preview content

## 0.0.5

- Added a saved `.codeatlas/project-index.json` file with per-file summaries, symbols, and dependency metadata for AI-friendly context reuse
- Improved graph readability for larger workspaces with smarter initial layouts, reduced label clutter, and clearer graph guidance in the webview
- Updated default exclude patterns to skip common generated folders like `venv`, `__pycache__`, `node_modules`, `.git`, `dist`, and `build`

## 0.0.4

- Updated default exclude patterns to skip common generated folders like `venv`, `__pycache__`, `node_modules`, `.git`, `dist`, and `build`
- Improved graph readability for larger workspaces with smarter initial layouts and reduced label clutter
- Added a clearer graph summary and guidance in the webview side panel
- Added a saved `.codeatlas/project-index.json` file with per-file summaries, symbols, and dependency metadata for AI-friendly context reuse

## 0.0.3

- Fixed the webview runtime error affecting graph opening
- Finalized packaging configuration for public release

## 0.0.2

- Updated extension branding to CodeAtlas
- Improved Marketplace metadata, README content, and packaging setup
- Polished manifest details for publishing

## 0.0.1

- Initial preview release
- Added workspace analysis for code dependency graphs
- Added interactive webview with multiple layouts and file exploration
- Added commands for opening and refreshing the project graph
