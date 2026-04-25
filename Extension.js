const vscode = require('vscode');
const { analyzeWorkspace } = require('./Analyzer');
const { GraphPanel } = require('./Graphpanel');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('CodeAtlas is now active');

  let currentPanel = undefined;

  const showCommand = vscode.commands.registerCommand('codebaseVisualizer.show', async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage('CodeAtlas: Please open a workspace folder first.');
      return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;

    if (currentPanel) {
      currentPanel.reveal();
      return;
    }

    currentPanel = new GraphPanel(context.extensionUri, context);
    currentPanel.onDispose(() => { currentPanel = undefined; });

    // Show loading state
    currentPanel.setLoading(true);

    try {
      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "CodeAtlas",
        cancellable: false
      }, async (progress) => {
        progress.report({ message: "Scanning files..." });
        
        const config = vscode.workspace.getConfiguration('codebaseVisualizer');
        const excludePatterns = config.get('excludePatterns');
        const maxFiles = config.get('maxFiles');
        const includeExtensions = config.get('includeExtensions');

        const graphData = await analyzeWorkspace(rootPath, {
          excludePatterns,
          maxFiles,
          includeExtensions,
          onProgress: (msg) => progress.report({ message: msg })
        });

        progress.report({ message: "Rendering graph..." });
        currentPanel.setData(graphData, rootPath);
        currentPanel.setLoading(false);
        
        return Promise.resolve();
      });
    } catch (error) {
      currentPanel.setLoading(false);
      vscode.window.showErrorMessage(`CodeAtlas: Analysis failed - ${error.message}`);
    }
  });

  const refreshCommand = vscode.commands.registerCommand('codebaseVisualizer.refresh', async () => {
    if (!currentPanel) {
      vscode.commands.executeCommand('codebaseVisualizer.show');
      return;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return;

    const rootPath = workspaceFolders[0].uri.fsPath;
    currentPanel.setLoading(true);

    try {
      const config = vscode.workspace.getConfiguration('codebaseVisualizer');
      const graphData = await analyzeWorkspace(rootPath, {
        excludePatterns: config.get('excludePatterns'),
        maxFiles: config.get('maxFiles'),
        includeExtensions: config.get('includeExtensions')
      });
      currentPanel.setData(graphData, rootPath);
      currentPanel.setLoading(false);
    } catch (error) {
      currentPanel.setLoading(false);
      vscode.window.showErrorMessage(`Refresh failed: ${error.message}`);
    }
  });

  // Open file command (called from webview)
  const openFileCommand = vscode.commands.registerCommand('codebaseVisualizer.openFile', async (filePath) => {
    try {
      const doc = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });
    } catch (e) {
      vscode.window.showErrorMessage(`Could not open file: ${filePath}`);
    }
  });

  context.subscriptions.push(showCommand, refreshCommand, openFileCommand);
}

function deactivate() {}

module.exports = { activate, deactivate };
