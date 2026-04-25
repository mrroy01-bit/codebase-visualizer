const vscode = require('vscode');
const { getWebviewContent } = require('./Webviewcontent');

class GraphPanel {
  constructor(extensionUri, context) {
    this._extensionUri = extensionUri;
    this._context = context;
    this._disposables = [];
    this._disposeCallbacks = [];

    this._panel = vscode.window.createWebviewPanel(
      'codebaseVisualizer',
      'CodeAtlas',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'media'),
          vscode.Uri.joinPath(extensionUri, 'src'),
        ]
      }
    );

    this._panel.iconPath = {
      light: vscode.Uri.joinPath(extensionUri, 'media', 'icon.svg'),
      dark: vscode.Uri.joinPath(extensionUri, 'media', 'icon.svg'),
    };

    this._panel.webview.html = getWebviewContent(this._panel.webview, extensionUri, null, null, true);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      message => this._handleMessage(message),
      null,
      this._disposables
    );

    this._panel.onDidDispose(
      () => this._dispose(),
      null,
      this._disposables
    );
  }

  _handleMessage(message) {
    switch (message.command) {
      case 'openFile':
        vscode.commands.executeCommand('codebaseVisualizer.openFile', message.filePath);
        break;
      case 'refresh':
        vscode.commands.executeCommand('codebaseVisualizer.refresh');
        break;
      case 'showInfo':
        vscode.window.showInformationMessage(message.text);
        break;
      case 'ready':
        // Webview is ready
        break;
    }
  }

  reveal() {
    this._panel.reveal(vscode.ViewColumn.One);
  }

  setLoading(isLoading) {
    this._panel.webview.postMessage({ command: 'setLoading', isLoading });
  }

  setData(graphData, rootPath) {
    this._panel.webview.html = getWebviewContent(
      this._panel.webview,
      this._extensionUri,
      graphData,
      rootPath,
      false
    );
  }

  onDispose(callback) {
    this._disposeCallbacks.push(callback);
  }

  _dispose() {
    const callbacks = this._disposeCallbacks.splice(0);
    const disposables = this._disposables.splice(0);

    for (const cb of callbacks) cb();
    for (const d of disposables) d.dispose();
  }
}

module.exports = { GraphPanel };
