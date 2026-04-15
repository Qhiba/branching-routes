export async function exportProject(graphData, defaultTitle = 'graph') {
  const jsonString = JSON.stringify(graphData, null, 2);
  const safeTitle = defaultTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'graph';

  if (typeof window.showSaveFilePicker === 'function') {
    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: `${safeTitle}.json`,
        types: [{
          description: 'JSON Files',
          accept: { 'application/json': ['.json'] },
        }],
      });
      const writable = await fileHandle.createWritable();
      await writable.write(jsonString);
      await writable.close();
      return;
    } catch (err) {
      if (err.name !== 'AbortError') throw err;
      return;
    }
  }

  // Fallback
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeTitle}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importProject() {
  let file;

  if (typeof window.showOpenFilePicker === 'function') {
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{
          description: 'JSON Files',
          accept: { 'application/json': ['.json'] },
        }],
      });
      file = await fileHandle.getFile();
    } catch (err) {
      if (err.name !== 'AbortError') throw err;
      return null;
    }
  } else {
    // Fallback
    file = await new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => resolve(e.target.files[0]);
      input.click();
    });
  }

  if (!file) return null;

  const text = await file.text();
  const data = JSON.parse(text);

  // PLAN GAP (Phase 2): This gate currently rejects schemaVersion 2 files, which are
  // produced by exportGraph() after Phase 1. Import of files exported post-Phase-1 is
  // broken until Phase 2 rewrites this to accept schemaVersion 2 and normalize the
  // common/choice/ending shape. Legacy schemaVersion 1 files remain importable until Phase 2.
  if (data.schemaVersion !== 1) {
    throw new Error('unsupported_schema_version');
  }

  return data;
}
