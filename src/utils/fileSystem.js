import { generateId } from './uuid.js';

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
  let data = JSON.parse(text);


  if (![1, 2, 3].includes(data.schemaVersion)) {
    throw new Error('unsupported_schema_version');
  }

  const generateTypedCollections = (flagsArray) => {
    const flag = {};
    const status = {};
    (flagsArray || []).forEach(f => {
      if (f.type === 'boolean') {
        // CHANGED: flags[] -> flag{}
        flag[f.id] = { id: f.id, name: f.name, state: !!f.defaultValue }; 
      } else if (f.type === 'number') {
        // CHANGED: flags[] -> status{}
        status[f.id] = { id: f.id, name: f.name, value: typeof f.defaultValue === 'number' ? f.defaultValue : 0, minValue: null, maxValue: null }; 
      }
    });
    return { flag, status };
  };

  const migrateNodesPayloads = (collection, originalFlagsArray) => {
    Object.values(collection).forEach(node => {
      if (!node.data) node.data = {};
      const flags_set = [];
      const status_set = [];
      (node.data.sideEffects || []).forEach(se => {
        const referencedFlag = (originalFlagsArray || []).find(f => f.id === se.flagId);
        if (referencedFlag?.type === 'boolean') {
          // CHANGED: sideEffects[] -> flags_set[]
          flags_set.push(se.flagId); 
        } else if (referencedFlag?.type === 'number') {
          // CHANGED: sideEffects[] -> status_set[]
          status_set.push({
            statusId: se.flagId,
            amount: se.operation === 'subtract' ? -se.value : se.value
          }); 
        }
      });
      node.data.flags_set = flags_set;
      node.data.status_set = status_set;
      delete node.data.sideEffects;
    });
  };

  const migrateEdgeConditions = (edges, originalFlagsArray) => {
    edges.forEach(edge => {
      if (edge.condition && edge.condition.clauses) {
        const conditions = [];
        edge.condition.clauses.forEach(clause => {
          const referencedFlag = (originalFlagsArray || []).find(f => f.id === clause.flagId);
          if (referencedFlag?.type === 'boolean') {
            // CHANGED: clause -> typed condition (boolean)
            conditions.push({
              id: generateId('cond'),
              flag: clause.flagId,
              state: clause.value
            }); 
          } else if (referencedFlag?.type === 'number') {
            const minMax = {};
            if (clause.comparator === '>=' || clause.comparator === '>') minMax.min = clause.value;
            if (clause.comparator === '<=' || clause.comparator === '<') minMax.max = clause.value;
            if (clause.comparator === '==') { minMax.min = clause.value; minMax.max = clause.value; }
            // CHANGED: clause -> typed condition (numeric)
            conditions.push({
              id: generateId('cond'),
              status: clause.flagId,
              ...minMax
            }); 
          }
        });
        edge.condition = {
          // CHANGED: operator uppercase -> lowercase
          operator: (edge.condition.operator || 'AND').toLowerCase(), 
          conditions
        };
        delete edge.condition.clauses;
      }
    });
  };

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

    // MIGRATION: v1->v2 extended to output flag/status directly
    const baseFlags = data.flags || [];
    const { flag, status } = generateTypedCollections(baseFlags);
    
    migrateNodesPayloads(common, baseFlags);
    migrateNodesPayloads(choice, baseFlags);
    migrateNodesPayloads(ending, baseFlags);
    migrateEdgeConditions(edges, baseFlags);

    data = {
      common,
      choice,
      ending,
      edges,
      flag,
      status,
      meta,
      schemaVersion: 3
    };
  } else if (data.schemaVersion === 2) {
    // MIGRATION: Parallel Support strategy for flags
    const baseFlags = data.flags || [];
    const { flag, status } = generateTypedCollections(baseFlags);

    // MIGRATION: In-place Migration for data.sideEffects[] -> flags_set[] + status_set[]
    migrateNodesPayloads(data.common || {}, baseFlags);
    migrateNodesPayloads(data.choice || {}, baseFlags);
    migrateNodesPayloads(data.ending || {}, baseFlags);

    // MIGRATION: In-place Migration for Edge condition clause shape
    migrateEdgeConditions(data.edges || [], baseFlags);

    delete data.flags;
    data.flag = flag;
    data.status = status;
    data.schemaVersion = 3;
  }


  return data;
}
