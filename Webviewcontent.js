const vscode = require('vscode');

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function getWebviewContent(webview, extensionUri, graphData, rootPath, isLoading) {
  const nonce = getNonce();
  const graphDataJson = graphData ? JSON.stringify(graphData) : 'null';
  const rootPathJson = rootPath ? JSON.stringify(rootPath) : 'null';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}' https://cdnjs.cloudflare.com; style-src 'unsafe-inline'; img-src data: blob:; font-src https://fonts.gstatic.com; connect-src 'none';">
  <title>CodeAtlas</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=DM+Sans:wght@300;400;500;600&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --bg: #0d1117;
      --surface: #161b22;
      --surface2: #21262d;
      --border: #30363d;
      --text: #e6edf3;
      --text-muted: #8b949e;
      --accent: #58a6ff;
      --accent2: #3fb950;
      --accent3: #d2a8ff;
      --accent4: #ffa657;
      --danger: #f85149;
      --glow: rgba(88, 166, 255, 0.15);
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'DM Sans', sans-serif;
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* ── TOP BAR ── */
    #topbar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
      z-index: 100;
    }

    #topbar .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 14px;
      color: var(--accent);
      letter-spacing: -0.3px;
    }

    #topbar .logo svg { flex-shrink: 0; }

    #search-wrap {
      flex: 1;
      max-width: 360px;
      position: relative;
    }

    #search {
      width: 100%;
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text);
      padding: 6px 12px 6px 34px;
      font-size: 13px;
      font-family: 'DM Sans', sans-serif;
      outline: none;
      transition: border-color 0.2s;
    }

    #search:focus { border-color: var(--accent); }

    #search-wrap .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
    }

    #search-results {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      max-height: 240px;
      overflow-y: auto;
      z-index: 200;
      display: none;
    }

    #search-results.visible { display: block; }

    .search-result-item {
      padding: 8px 12px;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid var(--border);
    }

    .search-result-item:last-child { border-bottom: none; }
    .search-result-item:hover { background: var(--surface2); }

    .search-result-item .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .search-result-item .name { font-weight: 500; }
    .search-result-item .rpath { color: var(--text-muted); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .controls { display: flex; gap: 6px; margin-left: auto; }

    .btn {
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text);
      padding: 6px 12px;
      font-size: 12px;
      cursor: pointer;
      font-family: 'DM Sans', sans-serif;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s;
      white-space: nowrap;
    }

    .btn:hover { background: var(--border); border-color: var(--accent); }
    .btn.active { background: var(--accent); border-color: var(--accent); color: #000; }
    .btn.danger:hover { border-color: var(--danger); color: var(--danger); }

    .separator { width: 1px; background: var(--border); align-self: stretch; margin: 0 4px; }

    /* ── FILTER BAR ── */
    #filterbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
      flex-wrap: wrap;
    }

    .filter-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }

    #filter-chips {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      overflow-x: auto;
      scrollbar-width: thin;
    }

    .filter-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 3px 10px;
      border-radius: 20px;
      border: 1px solid var(--border);
      background: var(--surface2);
      font-size: 11px;
      cursor: pointer;
      transition: all 0.15s;
      user-select: none;
      white-space: nowrap;
    }

    .filter-chip .chip-dot { width: 6px; height: 6px; border-radius: 50%; }
    .filter-chip.active { border-color: currentColor; }
    .filter-chip:hover { opacity: 0.8; }

    #stats-mini {
      margin-left: auto;
      display: flex;
      gap: 16px;
      font-size: 11px;
      color: var(--text-muted);
    }

    #stats-mini span { display: flex; align-items: center; gap: 4px; }
    #stats-mini strong { color: var(--text); font-weight: 600; }

    #flowbar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 16px;
      background:
        linear-gradient(90deg, rgba(255,166,87,0.08), rgba(88,166,255,0.08), rgba(63,185,80,0.08), rgba(210,168,255,0.08));
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
      overflow-x: auto;
    }

    .flow-stage-card {
      min-width: 180px;
      background: rgba(13, 17, 23, 0.55);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.02);
    }

    .flow-stage-accent {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      flex-shrink: 0;
    }

    .flow-stage-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
    }

    .flow-stage-count {
      font-size: 15px;
      font-weight: 700;
      color: var(--text);
      margin-top: 2px;
    }

    .flow-stage-arrow {
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      flex-shrink: 0;
    }

    /* ── LAYOUT ── */
    #main {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* ── CANVAS AREA ── */
    #canvas-wrap {
      flex: 1;
      position: relative;
      overflow: hidden;
    }

    #graph-canvas {
      position: absolute;
      top: 0; left: 0;
      width: 100%;
      height: 100%;
      cursor: grab;
    }

    #graph-canvas:active { cursor: grabbing; }

    /* ── ZOOM CONTROLS ── */
    #zoom-controls {
      position: absolute;
      bottom: 16px;
      left: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .zoom-btn {
      width: 32px;
      height: 32px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      transition: all 0.15s;
    }

    .zoom-btn:hover { background: var(--surface2); border-color: var(--accent); }

    #zoom-level {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 4px 6px;
      font-size: 10px;
      color: var(--text-muted);
      text-align: center;
      font-family: 'JetBrains Mono', monospace;
    }

    /* ── LEGEND ── */
    #legend {
      position: absolute;
      bottom: 16px;
      right: 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 11px;
      max-width: 220px;
    }

    #legend h4 { color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; font-size: 10px; margin-bottom: 8px; }
    .legend-section + .legend-section { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border); }
    .legend-item { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

    /* ── MINIMAP ── */
    #minimap {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 160px;
      height: 110px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }

    #minimap canvas { width: 100%; height: 100%; }

    /* ── SIDE PANEL ── */
    #side-panel {
      width: 300px;
      background: var(--surface);
      border-left: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: width 0.25s ease;
    }

    #side-panel.collapsed { width: 0; }

    #panel-tabs {
      display: flex;
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }

    .panel-tab {
      flex: 1;
      padding: 10px;
      font-size: 12px;
      text-align: center;
      cursor: pointer;
      color: var(--text-muted);
      border-bottom: 2px solid transparent;
      transition: all 0.15s;
      white-space: nowrap;
    }

    .panel-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
    .panel-tab:hover:not(.active) { color: var(--text); }

    #panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }

    #panel-content::-webkit-scrollbar { width: 4px; }
    #panel-content::-webkit-scrollbar-track { background: transparent; }
    #panel-content::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

    /* Node Detail */
    .node-detail-header {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 14px;
    }

    .node-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      flex-shrink: 0;
    }

    .node-detail-header h3 {
      font-size: 14px;
      font-weight: 600;
      line-height: 1.3;
      word-break: break-all;
    }

    .node-detail-header .node-path {
      font-size: 11px;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
      margin-top: 2px;
    }

    .node-stage-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      padding: 4px 8px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: var(--surface2);
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .node-stage-badge .dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
    }

    .meta-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 10px 0 14px;
    }

    .meta-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: var(--surface2);
      font-size: 10px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .meta-pill strong {
      color: var(--text);
      font-weight: 600;
      letter-spacing: 0;
    }

    .stat-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 14px;
    }

    .stat-card {
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 8px 10px;
    }

    .stat-card .stat-val {
      font-size: 18px;
      font-weight: 600;
      font-family: 'JetBrains Mono', monospace;
      color: var(--accent);
    }

    .stat-card .stat-lbl { font-size: 10px; color: var(--text-muted); margin-top: 2px; }

    .section-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
      margin: 12px 0 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .section-title .count {
      background: var(--surface2);
      border-radius: 20px;
      padding: 1px 6px;
      font-size: 10px;
    }

    .insight-card {
      background: linear-gradient(135deg, rgba(88,166,255,0.08), rgba(63,185,80,0.04));
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px 12px;
      margin-bottom: 12px;
    }

    .insight-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 6px;
    }

    .insight-title strong {
      font-size: 13px;
      color: var(--text);
    }

    .insight-title span {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
    }

    .insight-copy {
      font-size: 12px;
      line-height: 1.55;
      color: var(--text-muted);
    }

    .mini-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      margin-top: 10px;
    }

    .mini-stat {
      background: rgba(13,17,23,0.45);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px;
    }

    .mini-stat strong {
      display: block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: var(--text);
    }

    .mini-stat span {
      display: block;
      margin-top: 3px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
    }

    .dep-list { display: flex; flex-direction: column; gap: 3px; }

    .dep-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 8px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 12px;
      transition: background 0.1s;
    }

    .dep-item:hover { background: var(--surface2); }
    .dep-item .dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .dep-item .name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .dep-item .open-btn { opacity: 0; font-size: 10px; color: var(--accent); transition: opacity 0.1s; }
    .dep-item:hover .open-btn { opacity: 1; }

    /* Stats panel */
    .stat-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border); font-size: 12px; }
    .stat-row:last-child { border-bottom: none; }
    .stat-row .label { color: var(--text-muted); }
    .stat-row .value { font-weight: 600; font-family: 'JetBrains Mono', monospace; }

    .bar-item { margin-bottom: 8px; }
    .bar-item .bar-label { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px; }
    .bar-item .bar-track { height: 4px; background: var(--surface2); border-radius: 2px; overflow: hidden; }
    .bar-item .bar-fill { height: 100%; border-radius: 2px; transition: width 0.3s; }

    .ext-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 500;
      margin: 2px;
      cursor: pointer;
    }

    /* ── VIEW MODE ── */
    #view-mode { min-width: 140px; }

    /* ── HEALTH SCORE ── */
    .health-score-ring {
      width: 72px; height: 72px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; font-weight: 700; font-family: 'JetBrains Mono', monospace;
      border: 4px solid; flex-shrink: 0;
      margin: 0 auto 12px;
    }
    .health-score-ring.good { border-color: #3fb950; color: #3fb950; }
    .health-score-ring.ok { border-color: #58a6ff; color: #58a6ff; }
    .health-score-ring.warn { border-color: #ffa657; color: #ffa657; }
    .health-score-ring.bad { border-color: #f85149; color: #f85149; }

    .health-stat-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 12px;
      cursor: pointer; transition: background 0.1s;
    }
    .health-stat-row:hover { background: var(--surface2); }
    .health-stat-row:last-child { border-bottom: none; }
    .health-stat-row .label { display: flex; align-items: center; gap: 8px; color: var(--text-muted); }
    .health-stat-row .label .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .health-stat-row .value { font-weight: 600; font-family: 'JetBrains Mono', monospace; }

    .dead-file-item, .circular-item {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 8px; border-radius: 5px; cursor: pointer;
      font-size: 12px; transition: background 0.1s;
    }
    .dead-file-item:hover, .circular-item:hover { background: var(--surface2); }
    .dead-file-item .dead-icon { color: #f85149; font-size: 14px; }
    .dead-file-item .dead-path { color: var(--text-muted); font-size: 10px; font-family: 'JetBrains Mono', monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .hotspot-item {
      padding: 8px 10px; border-radius: 6px; background: var(--surface2);
      border: 1px solid var(--border); margin-bottom: 6px; cursor: pointer; transition: background 0.1s;
    }
    .hotspot-item:hover { background: var(--border); }
    .hotspot-item .hs-top { display: flex; justify-content: space-between; align-items: center; }
    .hotspot-item .hs-label { font-size: 12px; font-weight: 500; }
    .hotspot-item .hs-score { font-size: 14px; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
    .hotspot-item .hs-meta { display: flex; gap: 12px; margin-top: 4px; font-size: 10px; color: var(--text-muted); }
    .hotspot-item .hs-level { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; padding: 1px 6px; border-radius: 4px; }
    .hs-critical .hs-level { background: rgba(248,81,73,0.2); color: #f85149; }
    .hs-high .hs-level { background: rgba(255,166,87,0.2); color: #ffa657; }
    .hs-medium .hs-level { background: rgba(88,166,255,0.2); color: #58a6ff; }
    .hs-low .hs-level { background: rgba(63,185,80,0.2); color: #3fb950; }

    /* ── DEAD CODE WARNING BANNER ── */
    #deadcode-warning {
      display: none; align-items: center; gap: 8px;
      padding: 8px 16px;
      background: rgba(248,81,73,0.1);
      border-bottom: 1px solid rgba(248,81,73,0.3);
      flex-shrink: 0; font-size: 12px; color: #f85149;
    }
    #deadcode-warning strong { color: #f85149; }

    /* ── HOTSPOT MODE LEGEND ── */
    #hotspot-legend { display: none; }
    #hotspot-legend .hl-item { display: flex; align-items: center; gap: 6px; font-size: 10px; margin-bottom: 2px; }
    #hotspot-legend .hl-dot { width: 8px; height: 8px; border-radius: 50%; }

    /* Loading */
    #loading {
      position: absolute;
      inset: 0;
      background: var(--bg);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      gap: 16px;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 3px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .loading-text { font-size: 14px; color: var(--text-muted); }
    .loading-sub { font-size: 12px; color: var(--text-muted); opacity: 0.6; }

    /* Tooltip */
    #tooltip {
      position: fixed;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 12px;
      pointer-events: none;
      z-index: 500;
      max-width: 280px;
      display: none;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    }

    #tooltip h4 { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
    #tooltip .tt-path { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--text-muted); margin-bottom: 6px; word-break: break-all; }
    #tooltip .tt-stats { display: flex; gap: 12px; }
    #tooltip .tt-stat { font-size: 11px; }
    #tooltip .tt-stat span { color: var(--text-muted); }

    /* Empty state */
    #empty-state {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: var(--text-muted);
      display: none;
    }

    #empty-state h3 { font-size: 16px; color: var(--text); }
    #empty-state p { font-size: 13px; max-width: 300px; text-align: center; line-height: 1.5; }

    .placeholder-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 10px;
      color: var(--text-muted);
      text-align: center;
      padding: 20px;
    }

    .placeholder-panel h3 { font-size: 14px; color: var(--text); }
    .placeholder-panel p { font-size: 12px; line-height: 1.5; }

    .open-file-btn {
      background: var(--accent);
      color: #000;
      border: none;
      border-radius: 6px;
      padding: 6px 14px;
      font-size: 12px;
      font-family: 'DM Sans', sans-serif;
      font-weight: 600;
      cursor: pointer;
      margin-top: 6px;
      transition: opacity 0.15s;
    }

    .open-file-btn:hover { opacity: 0.85; }

    /* Layout toggle */
    .layout-select {
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text);
      padding: 5px 8px;
      font-size: 12px;
      font-family: 'DM Sans', sans-serif;
      outline: none;
      cursor: pointer;
    }
  </style>
</head>
<body>

<!-- TOP BAR -->
<div id="topbar">
  <div class="logo">
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="4" r="2.5" fill="#58a6ff"/>
      <circle cx="3" cy="16" r="2.5" fill="#3fb950"/>
      <circle cx="17" cy="16" r="2.5" fill="#d2a8ff"/>
      <line x1="10" y1="6.5" x2="3" y2="13.5" stroke="#58a6ff" stroke-width="1.5" opacity="0.6"/>
      <line x1="10" y1="6.5" x2="17" y2="13.5" stroke="#58a6ff" stroke-width="1.5" opacity="0.6"/>
      <line x1="3" y1="16" x2="17" y2="16" stroke="#3fb950" stroke-width="1.5" opacity="0.4"/>
    </svg>
    CodeAtlas
  </div>

  <div id="search-wrap">
    <svg class="search-icon" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04-.707.708-3.393-3.688zm-5.44.26a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"/>
    </svg>
    <input type="text" id="search" placeholder="Search files..." autocomplete="off" spellcheck="false">
    <div id="search-results"></div>
  </div>

  <select class="layout-select" id="layout-select">
    <option value="force">Force Layout</option>
    <option value="flow">Flow Layout</option>
    <option value="radial">Radial Layout</option>
    <option value="folder">Folder Groups</option>
  </select>

  <select class="layout-select" id="view-mode">
    <option value="normal">View: Normal</option>
    <option value="hotspots">View: Hotspots</option>
    <option value="deadcode">View: Dead Code</option>
  </select>

  <div class="separator"></div>

  <div class="controls">
    <button class="btn" id="btn-fit" title="Fit to screen">⊡ Fit</button>
    <button class="btn" id="btn-labels" title="Change label density">Labels: Smart</button>
    <button class="btn" id="btn-export" title="Export graph JSON">⇩ Export</button>
    <button class="btn" id="btn-toggle-panel" title="Toggle side panel">≡ Panel</button>
    <button class="btn" onclick="vscodeApi.postMessage({command:'refresh'})" title="Re-analyze workspace">↺ Refresh</button>
  </div>
</div>

<!-- FILTER BAR -->
<div id="filterbar">
  <span class="filter-label">Show:</span>
  <div id="filter-chips"></div>
  <div id="stats-mini">
    <span><strong id="stat-nodes">0</strong> files</span>
    <span><strong id="stat-edges">0</strong> connections</span>
    <span><strong id="stat-lines">0</strong> lines</span>
  </div>
</div>

<div id="deadcode-warning">⚠ <strong id="deadcode-count">0</strong> files appear unused &mdash; <span id="deadcode-hint">switch to Dead Code view</span></div>
<div id="flowbar"></div>
<div id="summary-banner" style="display:flex;gap:10px;padding:10px 16px;background:rgba(88,166,255,0.06);border-bottom:1px solid var(--border);flex-wrap:wrap"></div>

<!-- MAIN -->
<div id="main">
  <div id="canvas-wrap">
    <canvas id="graph-canvas"></canvas>

    <!-- Loading overlay -->
    <div id="loading">
      <div class="spinner"></div>
      <div class="loading-text">Analyzing codebase...</div>
      <div class="loading-sub" id="loading-sub">Scanning files</div>
    </div>

    <!-- Empty state -->
    <div id="empty-state">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect x="8" y="8" width="32" height="32" rx="6" stroke="#8b949e" stroke-width="2"/>
        <path d="M16 20h16M16 28h10" stroke="#8b949e" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <h3>No files found</h3>
      <p>Try adjusting your file extension settings or exclude patterns in VS Code settings.</p>
    </div>

    <!-- Zoom controls -->
    <div id="zoom-controls">
      <button class="zoom-btn" id="zoom-in" title="Zoom in">+</button>
      <div id="zoom-level">100%</div>
      <button class="zoom-btn" id="zoom-out" title="Zoom out">−</button>
    </div>

    <!-- Legend -->
    <div id="legend">
      <h4>Atlas Legend</h4>
      <div id="legend-items"></div>
      <div id="hotspot-legend"></div>
    </div>

    <!-- Minimap -->
    <div id="minimap">
      <canvas id="minimap-canvas"></canvas>
    </div>
  </div>

  <!-- SIDE PANEL -->
  <div id="side-panel">
    <div id="panel-tabs">
      <div class="panel-tab active" data-tab="details">Details</div>
      <div class="panel-tab" data-tab="stats">Stats</div>
      <div class="panel-tab" data-tab="health">Health</div>
      <div class="panel-tab" data-tab="deps">Top Files</div>
    </div>
    <div id="panel-content">
      <div class="placeholder-panel">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="18" stroke="#30363d" stroke-width="2"/>
          <circle cx="20" cy="20" r="4" fill="#58a6ff" opacity="0.5"/>
          <path d="M20 8v4M20 28v4M8 20h4M28 20h4" stroke="#58a6ff" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
        </svg>
        <h3>Select a Node</h3>
        <p>Click any file in the graph to see its details, imports, and connections.</p>
      </div>
    </div>
  </div>
</div>

<!-- Tooltip -->
<div id="tooltip"></div>

<script nonce="${nonce}">
const vscodeApi = acquireVsCodeApi();
const GRAPH_DATA = ${graphDataJson};
const ROOT_PATH = ${rootPathJson};

// ── GRAPH ENGINE ──────────────────────────────────────────────────────────────

class GraphEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.nodes = [];
    this.edges = [];
    this.filteredNodes = new Set();
    this.filteredEdges = [];
    this.selectedNode = null;
    this.hoveredNode = null;
    this.highlightedNodes = new Set();
    this.labelMode = 'smart';

    // Viewport
    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1;

    // Interaction
    this.isDragging = false;
    this.dragStart = null;
    this.dragNode = null;
    this.lastMouse = null;

    // Physics
    this.simulation = null;
    this.animFrame = null;
    this.isSimulating = false;

    // Layout
    this.layout = 'force';
    this.flowOrder = ['start', 'main', 'core', 'helpers'];
    this.flowColumns = [];

    // View mode
    this.viewMode = 'normal';

    this.resize();
    this.bindEvents();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    // Reset transform so repeated resizes don't multiply scaling.
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = rect.width;
    this.H = rect.height;
  }

  loadData(nodes, edges) {
    const degreeMap = new Map();
    for (const edge of edges) {
      degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1);
      degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1);
    }

    // Assign positions
    const cx = this.W / 2, cy = this.H / 2;
    this.nodes = nodes.map((n, i) => ({
      ...n,
      x: cx + (Math.random() - 0.5) * Math.min(this.W, this.H) * 0.8,
      y: cy + (Math.random() - 0.5) * Math.min(this.W, this.H) * 0.8,
      vx: 0,
      vy: 0,
      r: this.nodeRadius(n),
      degree: degreeMap.get(n.id) || 0,
      labelPriority: 0,
    }));
    this.edges = edges;
    this.filteredNodes = new Set(this.nodes.map(n => n.id));
    this.filteredEdges = [...edges];
    this.nodeMap = new Map(this.nodes.map(n => [n.id, n]));
    const rankedNodes = [...this.nodes].sort((a, b) => b.degree - a.degree);
    rankedNodes.forEach((node, index) => {
      node.labelPriority = index;
    });
    this.startSimulation();
  }

  nodeRadius(n) {
    if (this.viewMode === 'hotspots') {
      const base = 5;
      const score = n.hotspotScore || 0;
      return Math.min(base + score * 0.15, 22);
    }
    const base = 5;
    const importedBy = (n.importedBy || []).length;
    return Math.min(base + Math.sqrt(importedBy) * 2, 18);
  }

  startSimulation() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.isSimulating = true;
    this.tick = 0;
    this.loop();
  }

  loop() {
    this.tick++;
    if (this.isSimulating && this.tick < 300) {
      this.simulate();
    }
    this.draw();
    this.animFrame = requestAnimationFrame(() => this.loop());
  }

  simulate() {
    const alpha = Math.max(0.01, 1 - this.tick / 250);
    const nodeArr = this.nodes.filter(n => this.filteredNodes.has(n.id));

    // Repulsion
    for (let i = 0; i < nodeArr.length; i++) {
      for (let j = i + 1; j < nodeArr.length; j++) {
        const a = nodeArr[i], b = nodeArr[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        const minDist = (a.r + b.r) * 3.5 + 20;
        if (dist < minDist) {
          const force = (minDist - dist) / dist * 0.15 * alpha;
          a.vx -= dx * force; a.vy -= dy * force;
          b.vx += dx * force; b.vy += dy * force;
        }
      }
    }

    // Attraction along edges
    for (const e of this.filteredEdges) {
      const a = this.nodeMap.get(e.source), b = this.nodeMap.get(e.target);
      if (!a || !b) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.sqrt(dx*dx + dy*dy) || 1;
      const targetDist = 100;
      const force = (dist - targetDist) / dist * 0.04 * alpha;
      a.vx += dx * force; a.vy += dy * force;
      b.vx -= dx * force; b.vy -= dy * force;
    }

    // Center gravity
    const cx = this.W / 2, cy = this.H / 2;
    for (const n of nodeArr) {
      n.vx += (cx - n.x) * 0.002 * alpha;
      n.vy += (cy - n.y) * 0.002 * alpha;
    }

    // Apply velocity with damping
    for (const n of nodeArr) {
      if (n === this.dragNode) continue;
      n.vx *= 0.85; n.vy *= 0.85;
      n.x += n.vx; n.y += n.vy;
    }
  }

  setLayout(type) {
    this.layout = type;
    this.isSimulating = false;

    if (type === 'flow') {
      this.applyFlowLayout();
    } else if (type === 'radial') {
      this.applyRadialLayout();
    } else if (type === 'folder') {
      this.applyFolderLayout();
    } else {
      this.isSimulating = true;
      this.tick = 0;
    }
  }

  pickInitialLayout() {
    const nodeCount = this.nodes.length;
    if (nodeCount >= 320) return 'folder';
    if (nodeCount >= 140) return 'radial';
    if (nodeCount >= 70) return 'flow';
    return 'force';
  }

  shouldShowLabel(n) {
    const isSelected = this.selectedNode === n;
    const isHovered = this.hoveredNode === n;
    const isHighlighted = this.highlightedNodes.has(n.id);

    if (isSelected || isHovered) return true;
    if (this.labelMode === 'focus') return false;
    if (this.labelMode === 'all') return true;

    const visibleCount = this.filteredNodes.size;
    if (visibleCount <= 80) return true;
    if (isHighlighted) return true;
    if (this.layout === 'flow') return n.labelPriority < Math.min(visibleCount * 0.3, 50);
    if (this.scale >= 1.1) return n.labelPriority < Math.min(visibleCount * 0.2, 40);
    return n.labelPriority < Math.min(visibleCount * 0.08, 18);
  }

  applyFlowLayout() {
    const visible = this.nodes
      .filter(n => this.filteredNodes.has(n.id))
      .sort((a, b) => {
        const stageDiff = this.flowOrder.indexOf(a.stage || 'main') - this.flowOrder.indexOf(b.stage || 'main');
        if (stageDiff !== 0) return stageDiff;
        const strengthA = (a.importedBy?.length || 0) + (a.imports?.length || 0);
        const strengthB = (b.importedBy?.length || 0) + (b.imports?.length || 0);
        return strengthB - strengthA;
      });

    const laneWidth = Math.max(220, (this.W - 120) / this.flowOrder.length);
    const topPad = 90;
    const bottomPad = 60;
    const usableHeight = Math.max(120, this.H - topPad - bottomPad);
    this.flowColumns = [];

    this.flowOrder.forEach((stage, index) => {
      const stageNodes = visible.filter(n => (n.stage || 'main') === stage);
      const x = 80 + laneWidth * index + laneWidth / 2;
      const gap = usableHeight / Math.max(stageNodes.length, 1);

      this.flowColumns.push({
        stage,
        label: stage.toUpperCase(),
        x: 80 + laneWidth * index,
        width: laneWidth - 18,
        color: stageNodes[0]?.stageColor || stageColor(stage),
      });

      stageNodes.forEach((node, nodeIndex) => {
        node.x = x;
        node.y = topPad + gap * nodeIndex + gap / 2;
        node.vx = 0;
        node.vy = 0;
      });
    });
  }

  applyRadialLayout() {
    const visible = this.nodes.filter(n => this.filteredNodes.has(n.id));
    // Find hub nodes (most connected)
    visible.sort((a, b) => (b.importedBy?.length || 0) - (a.importedBy?.length || 0));
    const cx = this.W / 2, cy = this.H / 2;
    const rings = [1, 6, 18, 42, 100, 200];
    let ringIdx = 0, posInRing = 0;
    let ringTotal = rings[ringIdx];

    for (const n of visible) {
      if (ringIdx === 0) {
        n.x = cx; n.y = cy;
      } else {
        const r = ringIdx * 100;
        const angle = (posInRing / ringTotal) * Math.PI * 2;
        n.x = cx + Math.cos(angle) * r;
        n.y = cy + Math.sin(angle) * r;
      }
      posInRing++;
      if (posInRing >= ringTotal && ringIdx < rings.length - 1) {
        ringIdx++;
        posInRing = 0;
        ringTotal = rings[ringIdx];
      }
    }
  }

  applyFolderLayout() {
    const folders = new Map();
    for (const n of this.nodes) {
      if (!this.filteredNodes.has(n.id)) continue;
      const f = n.folder || '.';
      if (!folders.has(f)) folders.set(f, []);
      folders.get(f).push(n);
    }
    const folderArr = [...folders.entries()];
    const cols = Math.ceil(Math.sqrt(folderArr.length));
    const cw = (this.W - 100) / cols;
    const rh = (this.H - 100) / Math.ceil(folderArr.length / cols);

    folderArr.forEach(([, nodes], fi) => {
      const col = fi % cols, row = Math.floor(fi / cols);
      const fx = 60 + col * cw + cw / 2;
      const fy = 60 + row * rh + rh / 2;
      nodes.forEach((n, i) => {
        const angle = (i / nodes.length) * Math.PI * 2;
        const r = Math.min(40, nodes.length * 5);
        n.x = fx + Math.cos(angle) * r;
        n.y = fy + Math.sin(angle) * r;
      });
    });
  }

  // ── DRAWING ────────────────────────────────────────────────────────────────

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    if (this.layout === 'flow') {
      this.drawFlowLanes(ctx);
    }
    this.drawEdges(ctx);
    this.drawNodes(ctx);
    this.drawLabels(ctx);

    ctx.restore();
    this.drawMinimap();
  }

  drawFlowLanes(ctx) {
    for (const column of this.flowColumns) {
      ctx.save();
      ctx.fillStyle = column.color + '14';
      ctx.strokeStyle = column.color + '55';
      ctx.lineWidth = 1;
      roundRect(ctx, column.x, 28, column.width, this.H - 56, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#e6edf3';
      ctx.font = '600 13px DM Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(column.label, column.x + column.width / 2, 50);
      ctx.restore();
    }
  }

  drawEdges(ctx) {
    const hasHighlight = this.highlightedNodes.size > 0;
    const densityFade = this.filteredNodes.size > 260 ? 0.65 : this.filteredNodes.size > 140 ? 0.78 : 1;

    for (const e of this.filteredEdges) {
      const a = this.nodeMap.get(e.source), b = this.nodeMap.get(e.target);
      if (!a || !b) continue;

      const isConnected = !hasHighlight || (this.highlightedNodes.has(e.source) && this.highlightedNodes.has(e.target));

      ctx.save();
      ctx.globalAlpha = (isConnected ? 0.6 : 0.06) * densityFade;
      ctx.strokeStyle = isConnected ? (a.stageColor || '#58a6ff') : '#8b949e';
      ctx.lineWidth = isConnected ? (this.layout === 'flow' ? 1.6 : 1.2) : 0.8;

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);

      // Curved edges
      const mx = this.layout === 'flow'
        ? (a.x + b.x) / 2
        : (a.x + b.x) / 2 + (b.y - a.y) * 0.1;
      const my = this.layout === 'flow'
        ? (a.y + b.y) / 2
        : (a.y + b.y) / 2 - (b.x - a.x) * 0.1;
      ctx.quadraticCurveTo(mx, my, b.x, b.y);
      ctx.stroke();

      // Arrow
      if (isConnected) {
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        const angle = Math.atan2(dy, dx);
        const arrowX = b.x - (dx/dist) * (b.r + 2);
        const arrowY = b.y - (dy/dist) * (b.r + 2);

        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX - 6 * Math.cos(angle - 0.4), arrowY - 6 * Math.sin(angle - 0.4));
        ctx.lineTo(arrowX - 6 * Math.cos(angle + 0.4), arrowY - 6 * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fillStyle = a.stageColor || '#58a6ff';
        ctx.fill();
      }

      ctx.restore();
    }
  }

  drawNodes(ctx) {
    const hasHighlight = this.highlightedNodes.size > 0;
    const hotspotColors = { critical: '#f85149', high: '#ffa657', medium: '#58a6ff', low: '#3fb950' };

    for (const n of this.nodes) {
      if (!this.filteredNodes.has(n.id)) continue;

      const isHighlighted = !hasHighlight || this.highlightedNodes.has(n.id);
      const isSelected = this.selectedNode === n;
      const isHovered = this.hoveredNode === n;

      // View mode color override
      let nodeColor;
      if (this.viewMode === 'hotspots') {
        nodeColor = hotspotColors[n.hotspotLevel] || n.color;
      } else if (this.viewMode === 'deadcode') {
        if (n.isDeadCode) nodeColor = '#f85149';
        else if (n.isOrphan) nodeColor = '#ffa657';
        else nodeColor = n.stageColor || n.color;
      } else {
        nodeColor = n.stageColor || n.color;
      }

      ctx.save();
      ctx.globalAlpha = isHighlighted ? 1 : 0.2;

      // Glow for selected/hovered
      if (isSelected || isHovered) {
        ctx.shadowColor = nodeColor;
        ctx.shadowBlur = isSelected ? 16 : 8;
      } else if (this.viewMode === 'deadcode' && n.isDeadCode) {
        ctx.shadowColor = '#f85149';
        ctx.shadowBlur = 6;
      }

      // Outer ring for selected
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      if (this.layout === 'flow') {
        const width = Math.max(104, Math.min(170, n.label.length * 7 + 44));
        const height = 34;
        n.cardWidth = width;
        n.cardHeight = height;
        roundRect(ctx, n.x - width / 2, n.y - height / 2, width, height, 12);
        ctx.fillStyle = nodeColor + '22';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#fff' : nodeColor;
        ctx.lineWidth = isSelected ? 2 : 1.1;
        ctx.stroke();

        ctx.fillStyle = nodeColor;
        ctx.beginPath();
        ctx.arc(n.x - width / 2 + 14, n.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Node circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);

        // Gradient fill
        const grad = ctx.createRadialGradient(n.x - n.r*0.3, n.y - n.r*0.3, 0, n.x, n.y, n.r);
        grad.addColorStop(0, nodeColor + 'ff');
        grad.addColorStop(1, nodeColor + '99');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#fff' : nodeColor + 'cc';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  drawLabels(ctx) {
    const minScaleForLabels = 0.4;
    if (this.scale < minScaleForLabels) return;

    for (const n of this.nodes) {
      if (!this.filteredNodes.has(n.id)) continue;
      if (!this.shouldShowLabel(n)) continue;

      const isSelected = this.selectedNode === n;
      const isHovered = this.hoveredNode === n;
      const isHighlighted = this.highlightedNodes.size === 0 || this.highlightedNodes.has(n.id);

      if (!isSelected && !isHovered && this.layout !== 'flow' && this.scale < 0.7 && n.r < 8 && this.labelMode !== 'all') continue;

      ctx.save();
      ctx.globalAlpha = isHighlighted ? (isSelected || isHovered ? 1 : 0.75) : 0.2;
      ctx.font = (isSelected ? 600 : 400) + ' ' + Math.min(12 / this.scale, 12) + 'px DM Sans, sans-serif';
      ctx.fillStyle = isSelected ? '#fff' : '#e6edf3';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Background for label
      const label = n.label;
      const tw = ctx.measureText(label).width;
      if (this.layout === 'flow') {
        ctx.fillStyle = isSelected ? '#fff' : '#e6edf3';
        ctx.textAlign = 'left';
        ctx.fillText(label, n.x - (n.cardWidth || 110) / 2 + 26, n.y);
      } else {
        const lx = n.x, ly = n.y + n.r + 8 / this.scale;

        ctx.fillStyle = 'rgba(13,17,23,0.7)';
        ctx.fillRect(lx - tw/2 - 2, ly - 6/this.scale, tw + 4, 12/this.scale);

        ctx.fillStyle = isSelected ? '#fff' : '#e6edf3';
        ctx.fillText(label, lx, ly);
      }
      ctx.restore();
    }
  }

  drawMinimap() {
    const mc = document.getElementById('minimap-canvas');
    const mCtx = mc.getContext('2d');
    const mW = mc.offsetWidth, mH = mc.offsetHeight;
    const dpr = window.devicePixelRatio || 1;
    mc.width = mW * dpr;
    mc.height = mH * dpr;
    mCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mCtx.clearRect(0, 0, mW, mH);

    if (this.nodes.length === 0) return;

    // Find bounds
    const visible = this.nodes.filter(n => this.filteredNodes.has(n.id));
    if (visible.length === 0) return;

    const xs = visible.map(n => n.x), ys = visible.map(n => n.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1, rangeY = maxY - minY || 1;

    const pad = 8;
    const scaleX = (mW - pad*2) / rangeX;
    const scaleY = (mH - pad*2) / rangeY;
    const s = Math.min(scaleX, scaleY);

    const toMX = x => pad + (x - minX) * s;
    const toMY = y => pad + (y - minY) * s;

    // Draw edges
    mCtx.strokeStyle = '#58a6ff33';
    mCtx.lineWidth = 0.5;
    for (const e of this.filteredEdges) {
      const a = this.nodeMap.get(e.source), b = this.nodeMap.get(e.target);
      if (!a || !b) continue;
      mCtx.beginPath();
      mCtx.moveTo(toMX(a.x), toMY(a.y));
      mCtx.lineTo(toMX(b.x), toMY(b.y));
      mCtx.stroke();
    }

    // Draw nodes
    for (const n of visible) {
      mCtx.beginPath();
      mCtx.arc(toMX(n.x), toMY(n.y), Math.max(1.5, n.r * s * 0.5), 0, Math.PI * 2);
      mCtx.fillStyle = n.color;
      mCtx.globalAlpha = 0.8;
      mCtx.fill();
      mCtx.globalAlpha = 1;
    }

    // Viewport indicator
    const vpX = (-this.offsetX / this.scale - minX) * s + pad;
    const vpY = (-this.offsetY / this.scale - minY) * s + pad;
    const vpW = (this.W / this.scale) * s;
    const vpH = (this.H / this.scale) * s;

    mCtx.strokeStyle = '#58a6ff';
    mCtx.lineWidth = 1;
    mCtx.strokeRect(vpX, vpY, vpW, vpH);
  }

  // ── INTERACTION ────────────────────────────────────────────────────────────

  screenToWorld(sx, sy) {
    return {
      x: (sx - this.offsetX) / this.scale,
      y: (sy - this.offsetY) / this.scale,
    };
  }

  nodeAt(sx, sy) {
    const { x, y } = this.screenToWorld(sx, sy);
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const n = this.nodes[i];
      if (!this.filteredNodes.has(n.id)) continue;
      if (this.layout === 'flow') {
        const width = n.cardWidth || 120;
        const height = n.cardHeight || 34;
        if (
          x >= n.x - width / 2 &&
          x <= n.x + width / 2 &&
          y >= n.y - height / 2 &&
          y <= n.y + height / 2
        ) {
          return n;
        }
      } else {
        const dx = n.x - x, dy = n.y - y;
        if (dx*dx + dy*dy <= (n.r + 4) * (n.r + 4)) return n;
      }
    }
    return null;
  }

  bindEvents() {
    const c = this.canvas;

    c.addEventListener('mousedown', e => {
      const node = this.nodeAt(e.offsetX, e.offsetY);
      if (node) {
        this.dragNode = node;
        this.isSimulating = false;
      } else {
        this.isDragging = true;
        this.dragStart = { x: e.offsetX - this.offsetX, y: e.offsetY - this.offsetY };
      }
    });

    c.addEventListener('mousemove', e => {
      const node = this.nodeAt(e.offsetX, e.offsetY);
      
      if (this.dragNode) {
        const w = this.screenToWorld(e.offsetX, e.offsetY);
        this.dragNode.x = w.x;
        this.dragNode.y = w.y;
        this.dragNode.vx = 0;
        this.dragNode.vy = 0;
      } else if (this.isDragging && this.dragStart) {
        this.offsetX = e.offsetX - this.dragStart.x;
        this.offsetY = e.offsetY - this.dragStart.y;
      }

      if (node !== this.hoveredNode) {
        this.hoveredNode = node;
        this.canvas.style.cursor = node ? 'pointer' : (this.isDragging ? 'grabbing' : 'grab');
        if (node) this.showTooltip(e, node);
        else this.hideTooltip();
      } else if (node) {
        this.moveTooltip(e);
      }
    });

    c.addEventListener('mouseup', e => {
      const wasDragging = this.isDragging || !!this.dragNode;
      const movedFar = this.dragNode && (
        Math.abs(this.dragNode.vx) > 2 || Math.abs(this.dragNode.vy) > 2
      );

      if (!movedFar && !this.isDragging) {
        const node = this.nodeAt(e.offsetX, e.offsetY);
        if (node) this.selectNode(node);
        else this.deselectNode();
      }

      this.isDragging = false;
      this.dragNode = null;
      this.dragStart = null;
    });

    c.addEventListener('wheel', e => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const mx = e.offsetX, my = e.offsetY;
      this.scale = Math.max(0.1, Math.min(4, this.scale * factor));
      this.offsetX = mx - (mx - this.offsetX) * factor;
      this.offsetY = my - (my - this.offsetY) * factor;
      this.updateZoomLabel();
    }, { passive: false });

    c.addEventListener('dblclick', e => {
      const node = this.nodeAt(e.offsetX, e.offsetY);
      if (node) {
        vscodeApi.postMessage({ command: 'openFile', filePath: node.path });
      }
    });

    window.addEventListener('resize', () => this.resize());
  }

  selectNode(node) {
    this.selectedNode = node;
    // Highlight connected nodes
    this.highlightedNodes = new Set([node.id]);
    for (const e of this.filteredEdges) {
      if (e.source === node.id) this.highlightedNodes.add(e.target);
      if (e.target === node.id) this.highlightedNodes.add(e.source);
    }
    onNodeSelected(node);
  }

  deselectNode() {
    this.selectedNode = null;
    this.highlightedNodes = new Set();
    onNodeDeselected();
  }

  showTooltip(e, node) {
    const tt = document.getElementById('tooltip');
    tt.innerHTML = \`
      <h4>\${escHtml(node.label)}</h4>
      <div class="tt-path">\${escHtml(node.relativePath)}</div>
      <div class="tt-stats">
        <div class="tt-stat"><strong>\${node.lines}</strong> <span>lines</span></div>
        <div class="tt-stat"><strong>\${node.imports?.length || 0}</strong> <span>imports</span></div>
        <div class="tt-stat"><strong>\${node.importedBy?.length || 0}</strong> <span>imported by</span></div>
      </div>
    \`;
    tt.style.display = 'block';
    this.moveTooltip(e);
  }

  moveTooltip(e) {
    const tt = document.getElementById('tooltip');
    const x = e.clientX + 14, y = e.clientY - 10;
    tt.style.left = Math.min(x, window.innerWidth - tt.offsetWidth - 10) + 'px';
    tt.style.top = Math.min(y, window.innerHeight - tt.offsetHeight - 10) + 'px';
  }

  hideTooltip() {
    document.getElementById('tooltip').style.display = 'none';
  }

  fitToScreen() {
    const visible = this.nodes.filter(n => this.filteredNodes.has(n.id));
    if (visible.length === 0) return;

    const xs = visible.map(n => n.x), ys = visible.map(n => n.y);
    const minX = Math.min(...xs) - 30, maxX = Math.max(...xs) + 30;
    const minY = Math.min(...ys) - 30, maxY = Math.max(...ys) + 30;

    const scaleX = this.W / (maxX - minX);
    const scaleY = this.H / (maxY - minY);
    this.scale = Math.min(scaleX, scaleY, 1.5);
    this.offsetX = (this.W - (minX + maxX) * this.scale) / 2;
    this.offsetY = (this.H - (minY + maxY) * this.scale) / 2;
    this.updateZoomLabel();
  }

  zoom(factor) {
    const cx = this.W / 2, cy = this.H / 2;
    this.scale = Math.max(0.1, Math.min(4, this.scale * factor));
    this.offsetX = cx - (cx - this.offsetX) * factor;
    this.offsetY = cy - (cy - this.offsetY) * factor;
    this.updateZoomLabel();
  }

  updateZoomLabel() {
    document.getElementById('zoom-level').textContent = Math.round(this.scale * 100) + '%';
  }

  recalculateRadii() {
    for (const n of this.nodes) {
      n.r = this.nodeRadius(n);
    }
  }

  filterByExtensions(activeExts) {
    if (activeExts.size === 0) {
      this.filteredNodes = new Set(this.nodes.map(n => n.id));
    } else {
      this.filteredNodes = new Set(this.nodes.filter(n => activeExts.has(n.ext)).map(n => n.id));
    }
    this.filteredEdges = this.edges.filter(e => this.filteredNodes.has(e.source) && this.filteredNodes.has(e.target));

    // Update stats
    document.getElementById('stat-nodes').textContent = this.filteredNodes.size;
    document.getElementById('stat-edges').textContent = this.filteredEdges.length;
    document.getElementById('stat-lines').textContent = fmtNum(
      this.nodes
        .filter(n => this.filteredNodes.has(n.id))
        .reduce((sum, n) => sum + (n.lines || 0), 0)
    );
    if (this.layout === 'flow') this.applyFlowLayout();
    if (this.layout === 'radial') this.applyRadialLayout();
    if (this.layout === 'folder') this.applyFolderLayout();
    updateSummaryBanner();
    updateEmptyState();
  }

  focusNode(node) {
    const wx = node.x * this.scale + this.offsetX;
    const wy = node.y * this.scale + this.offsetY;
    const dx = this.W / 2 - node.x * this.scale;
    const dy = this.H / 2 - node.y * this.scale;
    this.offsetX = dx;
    this.offsetY = dy;
    this.selectNode(node);
  }
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtNum(n) {
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n/1000).toFixed(1) + 'K';
  return n.toString();
}

function stageColor(stage) {
  const COLORS = {
    start: '#ffa657',
    main: '#58a6ff',
    core: '#3fb950',
    helpers: '#d2a8ff',
  };
  return COLORS[stage] || COLORS.main;
}

function stageLabel(stage) {
  const LABELS = {
    start: 'Start',
    main: 'Main',
    core: 'Core',
    helpers: 'Helpers',
  };
  return LABELS[stage] || 'Main';
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function extColor(ext) {
  const COLORS = {
    '.js':'#f7df1e','.jsx':'#61dafb','.ts':'#3178c6','.tsx':'#61dafb',
    '.py':'#3572a5','.go':'#00add8','.rs':'#dea584','.java':'#b07219',
    '.cs':'#178600','.rb':'#701516','.php':'#4f5d95','.vue':'#41b883',
    '.svelte':'#ff3e00','.css':'#563d7c','.scss':'#c6538c','.html':'#e34c26',
  };
  return COLORS[ext] || '#6b7280';
}

function extLabel(ext) {
  if (!ext) return 'Other';
  return ext.replace('.', '').toUpperCase();
}

function languageLabel(lang, ext) {
  if (ext === '.ts' || ext === '.tsx') return 'TypeScript';
  if (ext === '.js' || ext === '.jsx' || ext === '.mjs' || ext === '.cjs') return 'JavaScript';
  const LABELS = {
    py: 'Python',
    go: 'Go',
    rs: 'Rust',
    java: 'Java',
    cs: 'C#',
    rb: 'Ruby',
    php: 'PHP',
  };
  return LABELS[lang] || extLabel(ext);
}

function collaborationTheme(status) {
  const THEMES = {
    isolated: { label: 'Uncollab', color: '#f85149', bg: 'rgba(248,81,73,0.12)' },
    connected: { label: 'Connected', color: '#58a6ff', bg: 'rgba(88,166,255,0.12)' },
    active: { label: 'Active', color: '#ffa657', bg: 'rgba(255,166,87,0.12)' },
    collaborative: { label: 'Collaborative', color: '#3fb950', bg: 'rgba(63,185,80,0.12)' },
  };
  return THEMES[status] || THEMES.connected;
}

function impactTheme(kind) {
  const THEMES = {
    solo: { label: 'Solo', color: '#f85149' },
    leaf: { label: 'Focused', color: '#58a6ff' },
    orchestrator: { label: 'Orchestrator', color: '#ffa657' },
    bridge: { label: 'Bridge', color: '#3fb950' },
    hub: { label: 'Hub', color: '#d2a8ff' },
  };
  return THEMES[kind] || THEMES.leaf;
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────

let engine = null;
let graphData = GRAPH_DATA;
let currentTab = 'details';

function init() {
  if (!graphData) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('empty-state').style.display = 'flex';
    return;
  }

  document.getElementById('loading').style.display = 'none';

  const canvas = document.getElementById('graph-canvas');
  engine = new GraphEngine(canvas);
  engine.loadData(graphData.nodes, graphData.edges);
  const initialLayout = engine.pickInitialLayout();
  engine.setLayout(initialLayout);
  document.getElementById('layout-select').value = initialLayout;

  setupStats();
  setupFlowBar();
  updateSummaryBanner();
  setupFilterChips();
  setupLegend();
  setupSearch();
  setupControls();
  setupSidePanel();
  setupTabs();
  setupViewMode();
  updateDeadCodeWarning();

  // Initial fit after simulation settles
  setTimeout(() => engine.fitToScreen(), 800);

  // Stats
  document.getElementById('stat-nodes').textContent = graphData.nodes.length;
  document.getElementById('stat-edges').textContent = graphData.edges.length;
  document.getElementById('stat-lines').textContent = fmtNum(graphData.stats?.totalLines || 0);
  updateEmptyState();
}

function setupFilterChips() {
  const container = document.getElementById('filter-chips');
  const sorted = (graphData.stats?.extensions || [])
    .filter(item => item.ext)
    .slice(0, 12);

  for (const item of sorted) {
    const ext = item.ext;
    const count = item.count;
    const chip = document.createElement('div');
    chip.className = 'filter-chip active';
    chip.style.color = extColor(ext);
    chip.innerHTML = \`<div class="chip-dot" style="background:\${extColor(ext)}"></div>.\${extLabel(ext).toLowerCase()} <span style="opacity:.5">\${count}</span>\`;
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      const active = new Set(
        [...container.querySelectorAll('.filter-chip.active')].map(c => c.dataset.ext)
      );
      engine.filterByExtensions(active.size === sorted.length ? new Set() : active);
    });
    chip.dataset.ext = ext;
    container.appendChild(chip);
  }
}

function setupViewMode() {
  const sel = document.getElementById('view-mode');
  sel.addEventListener('change', () => {
    if (!engine) return;
    engine.viewMode = sel.value;
    if (sel.value === 'hotspots') {
      engine.recalculateRadii();
      engine.isSimulating = false;
    } else if (sel.value === 'deadcode') {
      engine.recalculateRadii();
      engine.isSimulating = false;
    } else {
      engine.recalculateRadii();
      if (engine.layout === 'force') {
        engine.isSimulating = true;
        engine.tick = 0;
      }
    }
    updateHotspotLegend();
    updateDeadCodeWarning();
    updateSummaryBanner();
  });
}

function updateDeadCodeWarning() {
  const warning = document.getElementById('deadcode-warning');
  const count = graphData?.stats?.deadFiles || 0;
  if (count > 0) {
    document.getElementById('deadcode-count').textContent = count;
    document.getElementById('deadcode-hint').textContent =
      engine?.viewMode === 'deadcode' ? 'shown with red highlights' : 'switch to Dead Code view';
    warning.style.display = 'flex';
  } else {
    warning.style.display = 'none';
  }
}

function updateHotspotLegend() {
  const hl = document.getElementById('hotspot-legend');
  if (!engine || engine.viewMode !== 'hotspots') {
    hl.style.display = 'none';
    return;
  }
  hl.style.display = 'block';
  hl.innerHTML = \`
    <div class="legend-section" style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">
      <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Hotspots</div>
      <div class="hl-item"><span class="hl-dot" style="background:#f85149"></span>Critical 60+</div>
      <div class="hl-item"><span class="hl-dot" style="background:#ffa657"></span>High 31-60</div>
      <div class="hl-item"><span class="hl-dot" style="background:#58a6ff"></span>Medium 11-30</div>
      <div class="hl-item"><span class="hl-dot" style="background:#3fb950"></span>Low 0-10</div>
    </div>
  \`;
}

function setupLegend() {
  const stageItems = [
    { label: 'Start', color: '#ffa657' },
    { label: 'Main', color: '#58a6ff' },
    { label: 'Core', color: '#3fb950' },
    { label: 'Helpers', color: '#d2a8ff' },
  ];
  const container = document.getElementById('legend-items');
  const topExtensions = (graphData.stats?.extensions || []).slice(0, 5);

  container.innerHTML = \`
    <div class="legend-section">
      \${stageItems.map(item => \`<div class="legend-item"><div class="legend-dot" style="background:\${item.color}"></div><span style="font-size:11px;color:#8b949e">\${item.label}</span></div>\`).join('')}
    </div>
    <div class="legend-section">
      \${topExtensions.map(item => \`<div class="legend-item"><div class="legend-dot" style="background:\${item.color || extColor(item.ext)}"></div><span style="font-size:11px;color:#8b949e">.\${extLabel(item.ext).toLowerCase()} <span style="opacity:.6">\${item.count}</span></span></div>\`).join('')}
    </div>
  \`;

  updateHotspotLegend();
}

function setupFlowBar() {
  const flowBar = document.getElementById('flowbar');
  const stages = graphData?.stats?.flowStages || {};
  const order = ['start', 'main', 'core', 'helpers'];

  flowBar.innerHTML = order.map((stage, index) =>
    '<div class="flow-stage-card">' +
      '<div class="flow-stage-accent" style="background:' + stageColor(stage) + '"></div>' +
      '<div>' +
        '<div class="flow-stage-title">' + stageLabel(stage) + '</div>' +
        '<div class="flow-stage-count">' + fmtNum(stages[stage] || 0) + ' files</div>' +
      '</div>' +
    '</div>' +
    (index < order.length - 1 ? '<div class="flow-stage-arrow">→</div>' : '')
  ).join('');
}

function setupSearch() {
  const input = document.getElementById('search');
  const results = document.getElementById('search-results');

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { results.classList.remove('visible'); return; }

    const matches = graphData.nodes.filter(n =>
      n.label.toLowerCase().includes(q) || n.relativePath.toLowerCase().includes(q)
    ).slice(0, 10);

    results.innerHTML = matches.map(n => \`
      <div class="search-result-item" data-id="\${escHtml(n.id)}">
        <div class="dot" style="background:\${n.color}"></div>
        <span class="name">\${escHtml(n.label)}</span>
        <span class="rpath">\${escHtml(n.relativePath)}</span>
      </div>
    \`).join('') || '<div class="search-result-item" style="color:#8b949e">No results</div>';

    results.classList.add('visible');

    results.querySelectorAll('.search-result-item[data-id]').forEach(el => {
      el.addEventListener('click', () => {
        const node = engine.nodeMap.get(el.dataset.id);
        if (node) { engine.focusNode(node); input.value = ''; results.classList.remove('visible'); }
      });
    });
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#search-wrap')) results.classList.remove('visible');
  });
}

function setupControls() {
  document.getElementById('btn-fit').addEventListener('click', () => engine.fitToScreen());
  document.getElementById('btn-labels').addEventListener('click', cycleLabelMode);
  document.getElementById('btn-export').addEventListener('click', exportGraph);
  document.getElementById('zoom-in').addEventListener('click', () => engine.zoom(1.2));
  document.getElementById('zoom-out').addEventListener('click', () => engine.zoom(0.8));

  document.getElementById('btn-toggle-panel').addEventListener('click', () => {
    document.getElementById('side-panel').classList.toggle('collapsed');
  });

  document.getElementById('layout-select').addEventListener('change', e => {
    engine.setLayout(e.target.value);
    updateSummaryBanner();
    setTimeout(() => engine.fitToScreen(), 500);
  });

  updateLabelButton();
}

function cycleLabelMode() {
  if (!engine) return;
  engine.labelMode = engine.labelMode === 'smart'
    ? 'focus'
    : engine.labelMode === 'focus'
      ? 'all'
      : 'smart';
  updateLabelButton();
}

function updateLabelButton() {
  const btn = document.getElementById('btn-labels');
  if (!btn || !engine) return;
  btn.textContent = engine.labelMode === 'focus'
    ? 'Labels: Focus'
    : engine.labelMode === 'all'
      ? 'Labels: All'
      : 'Labels: Smart';
}

function updateSummaryBanner() {
  const banner = document.getElementById('summary-banner');
  if (!banner || !graphData || !engine) return;

  const visibleNodes = graphData.nodes.filter(n => engine.filteredNodes.has(n.id));
  const visibleEdges = engine.filteredEdges.length;
  const visibleLines = visibleNodes.reduce((sum, n) => sum + (n.lines || 0), 0);
  const crowdedHint = visibleNodes.length > 250
    ? 'Large graph: folder and radial layouts will usually read better than force.'
    : visibleNodes.length > 120
      ? 'Medium graph: smart labels keep the canvas cleaner while keeping important files visible.'
      : 'Smaller graph: force layout should stay readable and useful for local exploration.';

  banner.innerHTML = [
    { label: 'Visible files', value: fmtNum(visibleNodes.length) },
    { label: 'Visible edges', value: fmtNum(visibleEdges) },
    { label: 'Visible lines', value: fmtNum(visibleLines) },
    { label: 'Layout', value: document.getElementById('layout-select')?.value || 'force' },
  ].map(item => \`
    <div class="stat-card" style="min-width:140px;margin:0">
      <div class="stat-val" style="font-size:16px">\${item.value}</div>
      <div class="stat-lbl">\${item.label}</div>
    </div>
  \`).join('') + \`
    <div style="display:flex;align-items:center;color:var(--text-muted);font-size:12px;line-height:1.5;max-width:520px;padding:0 2px">
      \${crowdedHint}
    </div>
  \`;
}

function exportGraph() {
  if (!graphData) return;
  const payload = {
    exportedAt: new Date().toISOString(),
    rootPath: ROOT_PATH,
    summary: graphData.stats || {},
    nodes: graphData.nodes,
    edges: graphData.edges,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'codeatlas-graph.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function setupSidePanel() {
  // Show stats panel by default if no node selected
  renderStatsPanel();
}

function setupTabs() {
  document.querySelectorAll('.panel-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;
      if (currentTab === 'health') {
        renderHealthPanel();
      } else if (engine?.selectedNode) {
        renderNodePanel(engine.selectedNode);
      } else {
        if (currentTab === 'stats') renderStatsPanel();
        else if (currentTab === 'deps') renderTopFilesPanel();
        else renderPlaceholder();
      }
    });
  });
}

function renderPlaceholder() {
  const stages = graphData?.stats?.flowStages || {};
  document.getElementById('panel-content').innerHTML = \`
    <div class="placeholder-panel">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="18" stroke="#30363d" stroke-width="2"/>
        <circle cx="20" cy="20" r="4" fill="#58a6ff" opacity="0.5"/>
      </svg>
      <h3>Follow the Code Flow</h3>
      <p>Use <strong>Flow Layout</strong> to read the project from <strong>Start</strong> to <strong>Main</strong> to <strong>Core</strong> to <strong>Helpers</strong>. Click any file to inspect how it connects.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%;margin-top:8px">
        \${['start', 'main', 'core', 'helpers'].map(stage => \`
          <div class="stat-card" style="text-align:left">
            <div class="node-stage-badge" style="margin-top:0">
              <span class="dot" style="background:\${stageColor(stage)}"></span>
              \${stageLabel(stage)}
            </div>
            <div style="margin-top:8px;font-size:12px;color:#e6edf3">\${fmtNum(stages[stage] || 0)} files</div>
          </div>
        \`).join('')}
      </div>
    </div>
  \`;
}

function onNodeSelected(node) {
  renderNodePanel(node);
}

function onNodeDeselected() {
  if (currentTab === 'health') renderHealthPanel();
  else if (currentTab === 'stats') renderStatsPanel();
  else if (currentTab === 'deps') renderTopFilesPanel();
  else renderPlaceholder();
}

function renderNodePanel(node) {
  if (currentTab === 'health') { renderHealthPanel(); return; }
  if (currentTab === 'stats') { renderStatsPanel(); return; }
  if (currentTab === 'deps') { renderTopFilesPanel(); return; }

  const imports = (node.imports || []).map(id => engine.nodeMap.get(id)).filter(Boolean);
  const importedBy = (node.importedBy || []).map(id => engine.nodeMap.get(id)).filter(Boolean);
  const collaboration = node.collaboration || { status: 'connected', impact: 'leaf', summary: 'Part of the local code flow.' };
  const collabUI = collaborationTheme(collaboration.status);
  const impactUI = impactTheme(collaboration.impact);
  const touchStages = [...new Set(
    [...imports, ...importedBy]
      .map(n => n?.stage)
      .filter(Boolean)
      .filter(stage => stage !== node.stage)
  )];

  const fileTypeIcons = { entry: '🚀', module: '📦', test: '🧪', config: '⚙️', style: '🎨', docs: '📄' };

  document.getElementById('panel-content').innerHTML = \`
    <div class="node-detail-header">
      <div class="node-icon" style="background:\${node.color}22;color:\${node.color}">
        \${fileTypeIcons[node.fileType] || '📄'}
      </div>
      <div>
        <h3>\${escHtml(node.label)}</h3>
        <div class="node-path">\${escHtml(node.relativePath)}</div>
        <div class="node-stage-badge">
          <span class="dot" style="background:\${stageColor(node.stage)}"></span>
          \${escHtml(stageLabel(node.stage))}
        </div>
      </div>
    </div>

    <div class="meta-strip">
      <div class="meta-pill"><strong>.\${escHtml(extLabel(node.ext).toLowerCase())}</strong></div>
      <div class="meta-pill"><strong>\${escHtml(languageLabel(node.lang, node.ext))}</strong></div>
      <div class="meta-pill" style="color:\${collabUI.color};background:\${collabUI.bg};border-color:\${collabUI.color}33"><strong style="color:\${collabUI.color}">\${collabUI.label}</strong></div>
      <div class="meta-pill" style="color:\${impactUI.color};border-color:\${impactUI.color}33"><strong style="color:\${impactUI.color}">\${impactUI.label}</strong></div>
      \${node.hotspotLevel ? \`<div class="meta-pill" style="color:\${{critical:'#f85149',high:'#ffa657',medium:'#58a6ff',low:'#3fb950'}[node.hotspotLevel]};border-color:\${{critical:'#f85149',high:'#ffa657',medium:'#58a6ff',low:'#3fb950'}[node.hotspotLevel]}33"><strong style="color:\${{critical:'#f85149',high:'#ffa657',medium:'#58a6ff',low:'#3fb950'}[node.hotspotLevel]}">\${node.hotspotLevel.toUpperCase()} \${Math.round(node.hotspotScore)}</strong></div>\` : ''}
      \${node.isDeadCode ? \`<div class="meta-pill" style="color:#f85149;border-color:#f8514933"><strong style="color:#f85149">DEAD</strong></div>\` : ''}
      \${node.isOrphan && !node.isDeadCode ? \`<div class="meta-pill" style="color:#ffa657;border-color:#ffa65733"><strong style="color:#ffa657">ORPHAN</strong></div>\` : ''}
      \${node.isCircular ? \`<div class="meta-pill" style="color:#d2a8ff;border-color:#d2a8ff33"><strong style="color:#d2a8ff">CIRCULAR</strong></div>\` : ''}
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-val">\${fmtNum(node.lines)}</div>
        <div class="stat-lbl">Lines</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">\${fmtNum(Math.round(node.size/1024*10)/10)}</div>
        <div class="stat-lbl">KB</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">\${imports.length}</div>
        <div class="stat-lbl">Imports</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">\${importedBy.length}</div>
        <div class="stat-lbl">Used by</div>
      </div>
      \${node.hotspotScore != null ? \`
      <div class="stat-card">
        <div class="stat-val" style="color:\${{critical:'#f85149',high:'#ffa657',medium:'#58a6ff',low:'#3fb950'}[node.hotspotLevel]}">\${Math.round(node.hotspotScore)}</div>
        <div class="stat-lbl">Hotspot Score</div>
      </div>
      \` : ''}
    </div>

    <div class="insight-card">
      <div class="insight-title">
        <strong>Impact Snapshot</strong>
        <span>\${impactUI.label}</span>
      </div>
      <div class="insight-copy">
        \${escHtml(collaboration.summary || 'Part of the local code flow.')}
        \${touchStages.length ? \` It reaches across <strong style="color:var(--text)">\${touchStages.map(stageLabel).join(', ')}</strong>.\` : ''}
      </div>
      <div class="mini-grid">
        <div class="mini-stat">
          <strong>\${imports.length + importedBy.length}</strong>
          <span>Total links</span>
        </div>
        <div class="mini-stat">
          <strong>\${node.crossStageLinks || 0}</strong>
          <span>Cross-stage</span>
        </div>
        <div class="mini-stat">
          <strong>\${node.impactScore || 0}</strong>
          <span>Impact score</span>
        </div>
      </div>
    </div>

    <div class="section-title">
      Role In Flow
    </div>
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:12px;line-height:1.55;color:var(--text-muted)">
      This file is grouped in <strong style="color:\${stageColor(node.stage)}">\${escHtml(stageLabel(node.stage))}</strong>.
      \${node.stage === 'start' ? 'It looks like an entry point that starts or wires the app.' : ''}
      \${node.stage === 'main' ? 'It looks like an orchestration file that connects the app to core logic.' : ''}
      \${node.stage === 'core' ? 'It looks like part of the main business logic or engine of the project.' : ''}
      \${node.stage === 'helpers' ? 'It looks like support code such as utils, config, client adapters, or shared helpers.' : ''}
    </div>

    <div class="section-title">
      AI Summary
    </div>
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:12px;line-height:1.55;color:var(--text-muted)">
      \${escHtml(node.summary || 'No summary available yet.')}
    </div>

    <button class="open-file-btn" onclick="vscodeApi.postMessage({command:'openFile',filePath:\${JSON.stringify(node.path)}})">
      Open File ↗
    </button>

    \${(node.functions?.length || node.classes?.length || node.exports?.length) ? \`
      <div class="section-title">
        Symbols
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        \${(node.functions || []).slice(0, 10).map(name => \`<span class="ext-badge" style="background:#3fb95018;color:#3fb950;border:1px solid #3fb95033">fn \${escHtml(name)}</span>\`).join('')}
        \${(node.classes || []).slice(0, 8).map(name => \`<span class="ext-badge" style="background:#d2a8ff18;color:#d2a8ff;border:1px solid #d2a8ff33">class \${escHtml(name)}</span>\`).join('')}
        \${(node.exports || []).slice(0, 8).map(name => \`<span class="ext-badge" style="background:#58a6ff18;color:#58a6ff;border:1px solid #58a6ff33">export \${escHtml(name)}</span>\`).join('')}
      </div>
    \` : ''}

    <div class="section-title">
      Imports <span class="count">\${imports.length}</span>
    </div>
    <div class="dep-list">
      \${imports.length === 0 ? '<div style="color:#8b949e;font-size:12px;padding:4px 0">No local imports</div>' :
        imports.map(n => \`
          <div class="dep-item" onclick="engine.focusNode(engine.nodeMap.get(\${JSON.stringify(n.id)}))">
            <div class="dot" style="background:\${n.color}"></div>
            <span class="name">\${escHtml(n.label)}</span>
            <span class="open-btn" onclick="event.stopPropagation();vscodeApi.postMessage({command:'openFile',filePath:\${JSON.stringify(n.path)}})">↗</span>
          </div>
        \`).join('')
      }
    </div>

    <div class="section-title">
      Imported by <span class="count">\${importedBy.length}</span>
    </div>
    <div class="dep-list">
      \${importedBy.length === 0 ? '<div style="color:#8b949e;font-size:12px;padding:4px 0">Not imported by any file</div>' :
        importedBy.map(n => \`
          <div class="dep-item" onclick="engine.focusNode(engine.nodeMap.get(\${JSON.stringify(n.id)}))">
            <div class="dot" style="background:\${n.color}"></div>
            <span class="name">\${escHtml(n.label)}</span>
            <span class="open-btn" onclick="event.stopPropagation();vscodeApi.postMessage({command:'openFile',filePath:\${JSON.stringify(n.path)}})">↗</span>
          </div>
        \`).join('')
      }
    </div>
  \`;
}

function renderStatsPanel() {
  if (!graphData) return;
  const s = graphData.stats || {};
  const recommendedLayout = engine?.pickInitialLayout?.() || 'force';
  const topExtensions = s.extensions || [];
  const collaboration = s.collaboration || {};

  document.getElementById('panel-content').innerHTML = \`
    <div style="background:linear-gradient(135deg, rgba(88,166,255,0.14), rgba(63,185,80,0.08));border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:14px">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted)">Graph Guide</div>
      <div style="font-size:14px;font-weight:600;color:var(--text);margin-top:6px">Best view for this repo: \${escHtml(recommendedLayout)}</div>
      <div style="font-size:12px;line-height:1.55;color:var(--text-muted);margin-top:6px">
        \${recommendedLayout === 'folder' ? 'This workspace is dense enough that folder groups will usually be easier to read than a force map.' : ''}
        \${recommendedLayout === 'radial' ? 'This workspace has enough connections that radial layout gives a clearer center-to-edge shape.' : ''}
        \${recommendedLayout === 'flow' ? 'This workspace is a good fit for flow layout when you want a start-to-core reading path.' : ''}
        \${recommendedLayout === 'force' ? 'This workspace is small enough that the free-force layout should stay readable.' : ''}
      </div>
    </div>

    <div class="section-title">Overview</div>
    <div class="stat-row"><span class="label">Total Files</span><span class="value">\${s.totalFiles || 0}</span></div>
    <div class="stat-row"><span class="label">Total Lines</span><span class="value">\${fmtNum(s.totalLines || 0)}</span></div>
    <div class="stat-row"><span class="label">Dependencies</span><span class="value">\${s.totalEdges || 0}</span></div>
    <div class="stat-row"><span class="label">Languages</span><span class="value">\${(s.languages || []).join(', ') || '—'}</span></div>

    \${s.projectIndex ? \`
      <div class="section-title" style="margin-top:16px">AI Context Index</div>
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:12px;line-height:1.55;color:var(--text-muted)">
        CodeAtlas saved a compact project map for AI-friendly context reuse.
        <div style="margin-top:8px;color:var(--text);font-family:'JetBrains Mono',monospace;font-size:11px;word-break:break-all">\${escHtml(s.projectIndex.relativePath || s.projectIndex.path)}</div>
        <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
          <span class="ext-badge" style="background:#58a6ff18;color:#58a6ff;border:1px solid #58a6ff33">\${fmtNum(s.projectIndex.fileCount || 0)} files</span>
          <span class="ext-badge" style="background:#3fb95018;color:#3fb950;border:1px solid #3fb95033">saved locally</span>
        </div>
      </div>
      <button class="open-file-btn" style="margin-bottom:4px" onclick="vscodeApi.postMessage({command:'openFile',filePath:\${JSON.stringify(s.projectIndex.path)}})">
        Open Index JSON ↗
      </button>
    \` : ''}

    <div class="section-title" style="margin-top:16px">Architecture Flow</div>
    \${['start', 'main', 'core', 'helpers'].map(stage => \`
      <div class="stat-row">
        <span class="label" style="display:flex;align-items:center;gap:8px">
          <span class="legend-dot" style="background:\${stageColor(stage)}"></span>
          \${stageLabel(stage)}
        </span>
        <span class="value">\${s.flowStages?.[stage] || 0}</span>
      </div>
    \`).join('')}

    \${topExtensions.length ? \`
      <div class="section-title" style="margin-top:16px">Extension Mix</div>
      \${topExtensions.map(item => {
        const pct = Math.round(item.count / (s.totalFiles || 1) * 100);
        return \`<div class="bar-item">
          <div class="bar-label"><span>.\${extLabel(item.ext).toLowerCase()}</span><span>\${item.count} (\${pct}%)</span></div>
          <div class="bar-track"><div class="bar-fill" style="width:\${pct}%;background:\${item.color || extColor(item.ext)}"></div></div>
        </div>\`;
      }).join('')}
    \` : ''}

    <div class="section-title" style="margin-top:16px">Collaboration Shape</div>
    \${[
      ['collaborative', 'Collaborative'],
      ['active', 'Active'],
      ['connected', 'Connected'],
      ['isolated', 'Uncollab'],
    ].map(([key, label]) => \`
      <div class="stat-row">
        <span class="label">\${label}</span>
        <span class="value">\${collaboration[key] || 0}</span>
      </div>
    \`).join('')}

    <div class="section-title" style="margin-top:16px">File Roles</div>
    \${Object.entries(s.fileTypes || {}).filter(([,v])=>v>0).map(([t,v]) => {
      const pct = Math.round(v / (s.totalFiles || 1) * 100);
      const colors = {entry:'#ffa657',module:'#58a6ff',test:'#3fb950',config:'#d2a8ff',style:'#f778ba',docs:'#8b949e'};
      return \`<div class="bar-item">
        <div class="bar-label"><span>\${t}</span><span>\${v} (\${pct}%)</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:\${pct}%;background:\${colors[t]||'#58a6ff'}"></div></div>
      </div>\`;
    }).join('')}

    \${s.externalDeps?.length ? \`
      <div class="section-title" style="margin-top:16px">External Packages <span class="count">\${s.externalDeps.length}</span></div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">
        \${s.externalDeps.map(d => \`
          <span class="ext-badge" style="background:#58a6ff18;color:#58a6ff;border:1px solid #58a6ff33">\${escHtml(d.name)} <span style="opacity:.5">\${d.count}</span></span>
        \`).join('')}
      </div>
    \` : ''}

    \${s.folders?.length ? \`
      <div class="section-title" style="margin-top:16px">Top Folders</div>
      \${s.folders.slice(0,8).map(f => \`
        <div class="stat-row">
          <span class="label" style="overflow:hidden;text-overflow:ellipsis;max-width:180px" title="\${escHtml(f.name)}">\${escHtml(f.name)}</span>
          <span class="value">\${f.files} files</span>
        </div>
      \`).join('')}
    \` : ''}
  \`;
}

function renderTopFilesPanel() {
  if (!graphData) return;
  const s = graphData.stats || {};

  document.getElementById('panel-content').innerHTML = \`
    <div class="section-title">Most Imported Files <span class="count">\${s.topImported?.length || 0}</span></div>
    \${(s.topImported || []).map((f, i) => {
      const node = engine?.nodes.find(n => n.relativePath === f.path);
      return \`<div class="dep-item" onclick="\${node ? \`engine.focusNode(engine.nodeMap.get(\${JSON.stringify(node?.id)}))\` : ''}">
        <span style="font-weight:600;color:#8b949e;font-size:11px;width:16px">\${i+1}</span>
        <div class="dot" style="background:\${node?.color || '#6b7280'}"></div>
        <div style="flex:1;overflow:hidden">
          <div class="name">\${escHtml(f.label)}</div>
          <div style="font-size:10px;color:#8b949e;font-family:'JetBrains Mono',monospace;overflow:hidden;text-overflow:ellipsis">\${escHtml(f.path)}</div>
        </div>
        <span style="font-size:11px;color:#58a6ff;white-space:nowrap">\${f.count}×</span>
      </div>\`;
    }).join('') || '<div style="color:#8b949e;font-size:12px">No import data</div>'}
  \`;
}

function renderHealthPanel() {
  if (!graphData) return;
  const s = graphData.stats || {};
  const healthScore = s.healthScore ?? 100;
  const healthClass = healthScore >= 70 ? 'good' : healthScore >= 40 ? 'ok' : healthScore >= 20 ? 'warn' : 'bad';

  document.getElementById('panel-content').innerHTML = \`
    <div style="text-align:center;padding:8px 0 16px">
      <div class="health-score-ring \${healthClass}">\${healthScore}</div>
      <div style="font-size:12px;color:var(--text-muted)">Project Health Score</div>
    </div>

    <div class="section-title">Code Health</div>
    \${[
      { label: 'Dead Files', count: s.deadFiles || 0, dot: '#f85149', action: 'deadcode' },
      { label: 'Orphans', count: s.orphanFiles || 0, dot: '#ffa657', action: null },
      { label: 'Circular Imports', count: s.circularGroupCount || 0, dot: '#d2a8ff', action: null },
      { label: 'Critical Hotspots', count: s.hotspotLevels?.critical || 0, dot: '#f85149', action: 'hotspots' },
      { label: 'High Hotspots', count: s.hotspotLevels?.high || 0, dot: '#ffa657', action: 'hotspots' },
    ].map(item => \`
      <div class="health-stat-row" data-action="\${item.action || ''}">
        <span class="label"><span class="dot" style="background:\${item.dot}"></span>\${item.label}</span>
        <span class="value">\${item.count}</span>
      </div>
    \`).join('')}

    \${(s.deadCodeNodes?.length || 0) > 0 ? \`
      <div class="section-title" style="margin-top:12px">Dead Files <span class="count">\${s.deadCodeNodes.length}</span></div>
      \${s.deadCodeNodes.slice(0, 15).map(n => \`
        <div class="dead-file-item" data-id="\${escHtml(n.id)}">
          <span class="dead-icon">⚠</span>
          <div style="flex:1;overflow:hidden">
            <div>\${escHtml(n.label)}</div>
            <div class="dead-path">\${escHtml(n.path)}</div>
          </div>
        </div>
      \`).join('')}
      \${(s.deadFiles || 0) > 15 ? '<div style="font-size:11px;color:var(--text-muted);padding:4px 0">...and ' + ((s.deadFiles || 0) - 15) + ' more</div>' : ''}
    \` : ''}

    \${(s.circularNodes?.length || 0) > 0 ? \`
      <div class="section-title" style="margin-top:12px">Circular Dependencies <span class="count">\${s.circularNodes.length}</span></div>
      \${s.circularNodes.slice(0, 10).map(n => \`
        <div class="circular-item" data-id="\${escHtml(n.id)}">
          <span style="color:#d2a8ff">↺</span>
          <div style="flex:1;overflow:hidden">
            <div>\${escHtml(n.label)}</div>
            <div style="font-size:10px;color:var(--text-muted);font-family:'JetBrains Mono',monospace;overflow:hidden;text-overflow:ellipsis">\${escHtml(n.path)}</div>
          </div>
        </div>
      \`).join('')}
    \` : ''}

    \${(s.topHotspots?.length || 0) > 0 ? \`
      <div class="section-title" style="margin-top:12px">Top Hotspots</div>
      \${s.topHotspots.slice(0, 8).map((h, i) => \`
        <div class="hotspot-item hs-\${h.level}" data-id="\${escHtml(h.id)}">
          <div class="hs-top">
            <span class="hs-label">\${i+1}. \${escHtml(h.label)}</span>
            <span class="hs-score">\${h.score}</span>
          </div>
          <div class="hs-meta">
            <span>\${h.imports} imports</span>
            <span>\${h.importedBy} dependents</span>
            <span>\${fmtNum(h.lines)} lines</span>
            <span class="hs-level">\${h.level}</span>
          </div>
        </div>
      \`).join('')}
    \` : ''}

    \${(s.topImported?.length || 0) > 0 ? \`
      <div class="section-title" style="margin-top:12px">Most Imported Files</div>
      \${s.topImported.slice(0, 8).map((f, i) => {
        const node = engine?.nodes.find(n => n.relativePath === f.path);
        return \`<div class="dep-item" \${node ? \`onclick="engine.focusNode(engine.nodeMap.get(\${JSON.stringify(node.id)}))"\` : ''}>
          <span style="font-weight:600;color:#8b949e;font-size:11px;width:16px">\${i+1}</span>
          <div class="dot" style="background:\${node?.color || '#6b7280'}"></div>
          <div style="flex:1;overflow:hidden">
            <div class="name">\${escHtml(f.label)}</div>
            <div style="font-size:10px;color:#8b949e;font-family:'JetBrains Mono',monospace">\${escHtml(f.path)}</div>
          </div>
          <span style="font-size:11px;color:#58a6ff">\${f.count}×</span>
        </div>\`;
      }).join('')}
    \` : ''}

    <div class="section-title" style="margin-top:12px">Breakdown</div>
    \${[
      { label: 'Total Files', value: s.totalFiles || 0 },
      { label: 'Total Lines', value: fmtNum(s.totalLines || 0) },
      { label: 'Total Connections', value: s.totalEdges || 0 },
      { label: 'Avg Dependencies', value: s.averageDependencies || 0 },
    ].map(item => \`
      <div class="stat-row"><span class="label">\${item.label}</span><span class="value">\${item.value}</span></div>
    \`).join('')}
  \`;

  // Wire up health stats clicks
  document.querySelectorAll('.health-stat-row[data-action]').forEach(el => {
    el.addEventListener('click', () => {
      const action = el.dataset.action;
      if (action === 'deadcode') {
        document.getElementById('view-mode').value = 'deadcode';
        document.getElementById('view-mode').dispatchEvent(new Event('change'));
      } else if (action === 'hotspots') {
        document.getElementById('view-mode').value = 'hotspots';
        document.getElementById('view-mode').dispatchEvent(new Event('change'));
      }
    });
  });

  document.querySelectorAll('.dead-file-item[data-id]').forEach(el => {
    el.addEventListener('click', () => {
      const node = engine?.nodeMap.get(el.dataset.id);
      if (node) engine.focusNode(node);
    });
  });

  document.querySelectorAll('.circular-item[data-id]').forEach(el => {
    el.addEventListener('click', () => {
      const node = engine?.nodeMap.get(el.dataset.id);
      if (node) engine.focusNode(node);
    });
  });

  document.querySelectorAll('.hotspot-item[data-id]').forEach(el => {
    el.addEventListener('click', () => {
      const node = engine?.nodeMap.get(el.dataset.id);
      if (node) engine.focusNode(node);
    });
  });
}

function setupStats() {
  // Already done inline
}

function updateEmptyState() {
  const emptyState = document.getElementById('empty-state');

  if (!graphData?.nodes?.length) {
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = engine && engine.filteredNodes.size === 0 ? 'flex' : 'none';
}

// ── MESSAGE HANDLER ───────────────────────────────────────────────────────────

window.addEventListener('message', event => {
  const msg = event.data;
  switch (msg.command) {
    case 'setLoading':
      document.getElementById('loading').style.display = msg.isLoading ? 'flex' : 'none';
      break;
  }
});

// ── BOOT ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  init();
  vscodeApi.postMessage({ command: 'ready' });
});
</script>
</body>
</html>`;
}

module.exports = { getWebviewContent };
