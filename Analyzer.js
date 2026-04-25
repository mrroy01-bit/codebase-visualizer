const fs = require('fs');
const path = require('path');

// Import regex patterns per language
const IMPORT_PATTERNS = {
  js: [
    /import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /export\s+.*\s+from\s+['"]([^'"]+)['"]/g,
  ],
  py: [
    /^import\s+([\w.]+)/gm,
    /^from\s+([\w.]+)\s+import/gm,
  ],
  go: [
    /import\s+"([^"]+)"/g,
    /import\s+\w+\s+"([^"]+)"/g,
  ],
  rs: [
    /use\s+([\w:]+)/g,
    /mod\s+(\w+)/g,
  ],
  java: [
    /import\s+([\w.]+);/g,
  ],
  cs: [
    /using\s+([\w.]+);/g,
  ],
  rb: [
    /require\s+['"]([^'"]+)['"]/g,
    /require_relative\s+['"]([^'"]+)['"]/g,
  ],
  php: [
    /require(?:_once)?\s*\(?['"]([^'"]+)['"]\)?/g,
    /include(?:_once)?\s*\(?['"]([^'"]+)['"]\)?/g,
    /use\s+([\w\\]+)/g,
  ],
};

const EXT_TO_LANG = {
  '.js': 'js', '.jsx': 'js', '.ts': 'js', '.tsx': 'js',
  '.mjs': 'js', '.cjs': 'js', '.vue': 'js', '.svelte': 'js',
  '.py': 'py', '.go': 'go', '.rs': 'rs',
  '.java': 'java', '.cs': 'cs', '.rb': 'rb', '.php': 'php',
  '.cpp': 'js', '.c': 'js', '.h': 'js',
};

const FILE_TYPE_COLORS = {
  '.js': '#f7df1e', '.jsx': '#61dafb', '.ts': '#3178c6', '.tsx': '#61dafb',
  '.py': '#3572a5', '.go': '#00add8', '.rs': '#dea584', '.java': '#b07219',
  '.cs': '#178600', '.rb': '#701516', '.php': '#4f5d95', '.vue': '#41b883',
  '.svelte': '#ff3e00', '.css': '#563d7c', '.scss': '#c6538c', '.html': '#e34c26',
  '.json': '#292929', '.md': '#083fa1', '.yaml': '#cb171e', '.toml': '#9c4221',
  default: '#6b7280'
};

const RESOLVABLE_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.py', '.vue', '.svelte', '.go', '.rs',
  '.java', '.cs', '.rb', '.php'
];

function shouldExclude(filePath, excludePatterns) {
  const normalized = filePath.replace(/\\/g, '/');
  return excludePatterns.some(pattern => {
    const regex = new RegExp(`(^|/)${pattern.replace(/\./g, '\\.').replace(/\*/g, '.*')}(/|$)`);
    return regex.test(normalized);
  });
}

function getAllFiles(dirPath, excludePatterns, includeExtensions, maxFiles, allFiles = []) {
  if (allFiles.length >= maxFiles) return allFiles;

  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (e) {
    return allFiles;
  }

  for (const entry of entries) {
    if (allFiles.length >= maxFiles) break;
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = fullPath.replace(dirPath, '').replace(/^[/\\]/, '');

    if (shouldExclude(fullPath, excludePatterns)) continue;

    if (entry.isDirectory()) {
      getAllFiles(fullPath, excludePatterns, includeExtensions, maxFiles, allFiles);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (includeExtensions.includes(ext)) {
        allFiles.push(fullPath);
      }
    }
  }

  return allFiles;
}

function packageNameFromImport(importPath) {
  if (!importPath || importPath.startsWith('.') || importPath.startsWith('/')) {
    return null;
  }

  if (importPath.startsWith('@')) {
    const [scope, name] = importPath.split('/');
    return name ? `${scope}/${name}` : scope;
  }

  return importPath.split('/')[0];
}

function extractImports(content, filePath, lang) {
  const patterns = IMPORT_PATTERNS[lang] || [];
  const imports = new Set();

  for (const pattern of patterns) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (match[1]) imports.add(match[1]);
    }
  }

  return [...imports];
}

function resolveCandidate(candidatePath, allFilePathSet) {
  if (allFilePathSet.has(candidatePath)) return candidatePath;

  for (const ext of RESOLVABLE_EXTENSIONS) {
    if (allFilePathSet.has(candidatePath + ext)) return candidatePath + ext;
  }

  for (const ext of RESOLVABLE_EXTENSIONS) {
    const indexPath = path.join(candidatePath, 'index' + ext);
    if (allFilePathSet.has(indexPath)) return indexPath;
  }

  return null;
}

function resolveImport(importPath, fromFile, allFilePathSet, rootPath) {
  const candidatePaths = [];

  if (importPath.startsWith('.') || importPath.startsWith('/')) {
    candidatePaths.push(path.resolve(path.dirname(fromFile), importPath));
  } else {
    candidatePaths.push(path.resolve(rootPath, importPath));

    if (importPath.startsWith('@/')) {
      candidatePaths.push(path.resolve(rootPath, 'src', importPath.slice(2)));
    }

    if (importPath.startsWith('~/')) {
      candidatePaths.push(path.resolve(rootPath, importPath.slice(2)));
    }
  }

  for (const candidate of candidatePaths) {
    const resolved = resolveCandidate(candidate, allFilePathSet);
    if (resolved) return resolved;
  }

  return null;
}

function getFileStats(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').length;
    return { lines, size: content.length, content };
  } catch (e) {
    return { lines: 0, size: 0, content: '' };
  }
}

function detectFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const base = path.basename(filePath).toLowerCase();

  if (base.includes('test') || base.includes('spec')) return 'test';
  if (base.includes('config') || base.includes('.config.') || base === 'package.json') return 'config';
  if (base.includes('index') || base.includes('main') || base.includes('app') || base.includes('entry')) return 'entry';
  if (['.css', '.scss', '.sass', '.less', '.styl'].includes(ext)) return 'style';
  if (['.md', '.mdx', '.txt', '.rst'].includes(ext)) return 'docs';
  return 'module';
}

async function analyzeWorkspace(rootPath, options = {}) {
  const {
    excludePatterns = ['node_modules', '.git', 'dist', 'build'],
    maxFiles = 500,
    includeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py', '.vue', '.svelte'],
    onProgress = () => {}
  } = options;

  onProgress('Scanning directory tree...');
  const allFiles = getAllFiles(rootPath, excludePatterns, includeExtensions, maxFiles);
  const allFilePathSet = new Set(allFiles);

  onProgress(`Found ${allFiles.length} files. Analyzing dependencies...`);

  const nodes = [];
  const edges = [];
  const edgeSet = new Set();
  const externalDeps = new Map(); // external module name -> count

  for (let i = 0; i < allFiles.length; i++) {
    const filePath = allFiles[i];
    const relPath = path.relative(rootPath, filePath).replace(/\\/g, '/');
    const ext = path.extname(filePath).toLowerCase();
    const lang = EXT_TO_LANG[ext];

    if (i % 20 === 0) {
      onProgress(`Analyzing ${i + 1}/${allFiles.length} files...`);
    }

    const { lines, size, content } = getFileStats(filePath);
    const fileType = detectFileType(filePath);

    nodes.push({
      id: filePath,
      label: path.basename(filePath),
      path: filePath,
      relativePath: relPath,
      ext,
      lang,
      fileType,
      lines,
      size,
      color: FILE_TYPE_COLORS[ext] || FILE_TYPE_COLORS.default,
      folder: path.dirname(relPath),
      imports: [],
      importedBy: [],
    });

    if (lang && content) {
      const imports = extractImports(content, filePath, lang);
      const resolvedNode = nodes[nodes.length - 1];

      for (const imp of imports) {
        const resolved = resolveImport(imp, filePath, allFilePathSet, rootPath);
        if (resolved) {
          const edgeKey = `${filePath}→${resolved}`;
          if (!edgeSet.has(edgeKey)) {
            edgeSet.add(edgeKey);
            edges.push({ source: filePath, target: resolved, type: 'import' });
          }
          resolvedNode.imports.push(resolved);
        } else {
          const pkgName = packageNameFromImport(imp);
          if (pkgName) {
            externalDeps.set(pkgName, (externalDeps.get(pkgName) || 0) + 1);
          }
        }
      }
    }
  }

  // Compute importedBy
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  for (const edge of edges) {
    const target = nodeMap.get(edge.target);
    if (target && !target.importedBy.includes(edge.source)) {
      target.importedBy.push(edge.source);
    }
  }

  // Build folder structure
  const folders = new Map();
  for (const node of nodes) {
    const folder = node.folder || '.';
    if (!folders.has(folder)) {
      folders.set(folder, { name: folder, files: 0, lines: 0 });
    }
    const f = folders.get(folder);
    f.files++;
    f.lines += node.lines;
  }

  // Compute stats
  const stats = {
    totalFiles: nodes.length,
    totalEdges: edges.length,
    totalLines: nodes.reduce((s, n) => s + n.lines, 0),
    averageDependencies: nodes.length ? Math.round((edges.length / nodes.length) * 10) / 10 : 0,
    orphanFiles: nodes.filter(n => n.imports.length === 0 && n.importedBy.length === 0).length,
    entryPoints: nodes.filter(n => n.fileType === 'entry').length,
    languages: [...new Set(nodes.map(n => n.lang).filter(Boolean))],
    topImported: nodes
      .filter(n => n.importedBy.length > 0)
      .sort((a, b) => b.importedBy.length - a.importedBy.length)
      .slice(0, 10)
      .map(n => ({ label: n.label, count: n.importedBy.length, path: n.relativePath })),
    externalDeps: [...externalDeps.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, count]) => ({ name, count })),
    fileTypes: Object.fromEntries(
      ['entry', 'module', 'test', 'config', 'style', 'docs'].map(t => [
        t, nodes.filter(n => n.fileType === t).length
      ])
    ),
    folders: [...folders.values()].sort((a, b) => b.files - a.files).slice(0, 20),
  };

  return { nodes, edges, stats, rootPath };
}

module.exports = { analyzeWorkspace };
