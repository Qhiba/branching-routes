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


  if (data.schemaVersion !== 1 && data.schemaVersion !== 2) {
    throw new Error('unsupported_schema_version');
  }

  if (data.schemaVersion === 1) {

    
    const meta = {
      ...data.meta,
      commonNodeTypes: data.meta?.commonNodeTypes || [],
      endingTypes: data.meta?.endingTypes || [],
    };

    const common = {};
    const choice = {};
    const ending = {};

    (data.nodes || []).forEach(node => {
      if (node.type === 'choice') {
        choice[node.id] = node;
      } else if (node.type === 'ending') {
        ending[node.id] = node;
      } else {
        if (node.type !== 'common') {
          console.log(`Legacy node type mapped to common. ID: ${node.id}`);
        }
        common[node.id] = node;
      }
    });

    const affectedEdgeIds = [];
    let discardedEffectsCount = 0;

    const edges = (data.edges || []).map(edge => {
      if (edge.sideEffects && edge.sideEffects.length > 0) {
        affectedEdgeIds.push(edge.id);
        discardedEffectsCount += edge.sideEffects.length;
      }
      const { sideEffects, ...cleanEdge } = edge;
      return cleanEdge;
    });

    if (affectedEdgeIds.length > 0) {
      console.warn(`Removed ${discardedEffectsCount} edge sideEffects from ${affectedEdgeIds.length} edges. Affected edge IDs: ${affectedEdgeIds.join(', ')}`);
    }

    return {
      common,
      choice,
      ending,
      edges,
      flags: data.flags || [],
      meta
    };
  }


  return data;
}
