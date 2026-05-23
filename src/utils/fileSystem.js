import { generateId } from './uuid.js';
import JSZip from 'jszip';

const DB_NAME = 'BranchingRoutesDB';
const STORE_NAME = 'graphs';
const DB_VERSION = 2;

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = (e) => reject(e.target.error);
    request.onsuccess = (e) => resolve(e.target.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      // PROTECTED: existing graphs object store creation logic preserved
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (e.oldVersion < 2 && !db.objectStoreNames.contains('campaigns')) {
        db.createObjectStore('campaigns');
      }
    };
  });
}

export async function saveToIndexedDB(graphData) {
  try {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    await new Promise((resolve, reject) => {
      const request = store.put(graphData, 'autosave');
      request.onsuccess = resolve;
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.error('Failed to save to IndexedDB:', error);
  }
}

export async function loadFromIndexedDB() {
  try {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    return await new Promise((resolve, reject) => {
      const request = store.get('autosave');
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.error('Failed to load from IndexedDB:', error);
    return null;
  }
}
export async function clearIndexedDB() {
  try {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    await new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = resolve;
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.error('Failed to clear IndexedDB:', error);
  }
}

export async function saveCampaignsToIndexedDB(campaignsPayload) {
  try {
    const db = await initDB();
    const transaction = db.transaction('campaigns', 'readwrite');
    const store = transaction.objectStore('campaigns');
    await new Promise((resolve, reject) => {
      const request = store.put(campaignsPayload, 'campaigns');
      request.onsuccess = resolve;
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.error('Failed to save campaigns to IndexedDB:', error);
  }
}

export async function loadCampaignsFromIndexedDB() {
  try {
    const db = await initDB();
    const transaction = db.transaction('campaigns', 'readonly');
    const store = transaction.objectStore('campaigns');
    return await new Promise((resolve, reject) => {
      const request = store.get('campaigns');
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.error('Failed to load campaigns from IndexedDB:', error);
    return null;
  }
}

export async function clearCampaignsIndexedDB() {
  try {
    const db = await initDB();
    const transaction = db.transaction('campaigns', 'readwrite');
    const store = transaction.objectStore('campaigns');
    await new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = resolve;
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.error('Failed to clear campaigns from IndexedDB:', error);
  }
}

export async function exportProject(graphData, campaigns = {}, defaultTitle = 'graph') {
  // ZIP export for projects with campaigns; plain JSON fallback.
  const jsonString = JSON.stringify(graphData, null, 2);
  const safeTitle = defaultTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'graph';

  const hasCampaigns = Object.keys(campaigns).length > 0;
  
  let exportBlob;
  let defaultExtension = '.json';
  let fileTypeDescription = 'JSON Files';
  let acceptMime = { 'application/json': ['.json'] };
  let suggestedName = `${safeTitle}.json`;

  if (hasCampaigns) {
    const zip = new JSZip();
    zip.file("datamodel.json", jsonString);
    const campaignsFolder = zip.folder("campaigns");
    for (const [id, campaign] of Object.entries(campaigns)) {
      campaignsFolder.file(`${campaign.name}.json`, JSON.stringify(campaign, null, 2));
    }
    // AR-10: browser side only
    exportBlob = await zip.generateAsync({ type: "blob" });
    
    defaultExtension = '.zip';
    fileTypeDescription = 'ZIP Archives';
    acceptMime = { 'application/zip': ['.zip'] };
    suggestedName = `${safeTitle}.zip`;
  } else {
    exportBlob = new Blob([jsonString], { type: 'application/json' });
  }

  if (typeof window.showSaveFilePicker === 'function') {
    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: suggestedName,
        types: [{
          description: fileTypeDescription,
          accept: acceptMime,
        }],
      });
      const writable = await fileHandle.createWritable();
      await writable.write(exportBlob);
      await writable.close();
      return;
    } catch (err) {
      if (err.name !== 'AbortError') throw err;
      return;
    }
  }

  // Fallback
  const url = URL.createObjectURL(exportBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName;
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
        types: [
          {
            description: 'Branching Routes Project',
            accept: { 
              'application/json': ['.json'],
              'application/zip': ['.zip']
            },
          }
        ],
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
      input.accept = '.json,.zip';
      input.onchange = (e) => resolve(e.target.files[0]);
      input.click();
    });
  }

  if (!file) return null;

  let data;
  let campaigns = {};

  if (file.name.endsWith('.zip')) {
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(file);
    
    const datamodelFile = loadedZip.file("datamodel.json");
    if (!datamodelFile) {
        throw new Error('unsupported_schema_version');
    }
    const text = await datamodelFile.async("text");
    data = JSON.parse(text);
    
    // Extract campaigns if folder exists
    for (const relativePath in loadedZip.files) {
      if (relativePath.startsWith('campaigns/') && relativePath.endsWith('.json')) {
        const fileObj = loadedZip.files[relativePath];
        if (!fileObj.dir) {
          try {
            const campText = await fileObj.async("text");
            const campData = JSON.parse(campText);
            if (campData.campaignSchemaVersion === 1 && campData.id && campData.id.startsWith('camp-') && typeof campData.snapshot === 'object') {
              campaigns[campData.id] = campData;
            } else {
              console.warn(`Skipping invalid campaign file: ${fileObj.name}`);
            }
          } catch (err) {
            console.warn(`Failed to parse campaign file: ${fileObj.name}`, err);
          }
        }
      }
    }
  } else {
    const text = await file.text();
    data = JSON.parse(text);
  }


  if (![1, 2, 3, 4].includes(data.schemaVersion)) {
    throw new Error('unsupported_schema_version');
  }

  const generateTypedCollections = (flagsArray) => {
    const flag = {};
    const status = {};
    (flagsArray || []).forEach(f => {
      if (f.type === 'boolean') {
        flag[f.id] = { id: f.id, name: f.name, state: !!f.defaultValue }; 
      } else if (f.type === 'number') {
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
          flags_set.push(se.flagId); 
        } else if (referencedFlag?.type === 'number') {
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
            conditions.push({
              id: generateId('cond'),
              status: clause.flagId,
              ...minMax
            }); 
          }
        });
        edge.condition = {
          operator: (edge.condition.operator || 'AND').toLowerCase(), 
          conditions
        };
        delete edge.condition.clauses;
      }
    });
  };

  if (data.schemaVersion === 1) {
    // MIGRATION: v1 to v3 data model schema migration    
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
    // MIGRATION: v2 to v3 data model schema migration
    const baseFlags = data.flags || [];
    const { flag, status } = generateTypedCollections(baseFlags);

    migrateNodesPayloads(data.common || {}, baseFlags);
    migrateNodesPayloads(data.choice || {}, baseFlags);
    migrateNodesPayloads(data.ending || {}, baseFlags);

    migrateEdgeConditions(data.edges || [], baseFlags);

    delete data.flags;
    data.flag = flag;
    data.status = status;
    data.schemaVersion = 3;
  }

  if (data.schemaVersion === 3) {
    // MIGRATION: v3 to v4 schema migration - guarantees path and chapter collections
    data.path = data.path || {};
    data.chapter = data.chapter || {};
    data.schemaVersion = 4;
  }

  const sanitizedData = {
    schemaVersion: data.schemaVersion,
    meta: {
      title: data.meta?.title || 'Untitled Graph',
      createdAt: data.meta?.createdAt || Date.now(),
      updatedAt: data.meta?.updatedAt || Date.now(),
      commonNodeTypes: Array.isArray(data.meta?.commonNodeTypes) ? data.meta.commonNodeTypes : [],
      endingTypes: Array.isArray(data.meta?.endingTypes) ? data.meta.endingTypes : []
    },
    common: {},
    choice: {},
    ending: {},
    edges: Array.isArray(data.edges) ? data.edges : [],
    flag: typeof data.flag === 'object' && data.flag !== null ? data.flag : {},
    status: typeof data.status === 'object' && data.status !== null ? data.status : {},
    path: typeof data.path === 'object' && data.path !== null ? data.path : {},
    chapter: typeof data.chapter === 'object' && data.chapter !== null ? data.chapter : {},
    editorSeenNodeIds: Array.isArray(data.editorSeenNodeIds) ? data.editorSeenNodeIds : [],
    editorSeenOptionIds: Array.isArray(data.editorSeenOptionIds) ? data.editorSeenOptionIds : []
  };

  const sanitizeNodes = (sourceCol, targetCol, type) => {
    if (!sourceCol || typeof sourceCol !== 'object') return;
    Object.entries(sourceCol).forEach(([id, node]) => {
      if (!node || typeof node !== 'object') return;
      targetCol[id] = {
        id: node.id || id,
        type: node.type || type,
        position: node.position || { x: 0, y: 0 },
        data: node.data || {}
      };
    });
  };

  sanitizeNodes(data.common, sanitizedData.common, 'common');
  sanitizeNodes(data.choice, sanitizedData.choice, 'choice');
  sanitizeNodes(data.ending, sanitizedData.ending, 'ending');

  return { graphData: sanitizedData, campaigns };
}
