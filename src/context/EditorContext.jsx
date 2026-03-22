import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import localforage from 'localforage';
import { buildDependencyGraph } from '../utils/dependencyGraph';

const STORAGE_KEY = 'branching-routes-data';

const DataContext = createContext();
const ActionsContext = createContext();

// --- Helpers (defined outside component for stability) ---
const generateId = (prefix, collection) => {
  const existingIds = Object.keys(collection)
    .filter(id => id.startsWith(prefix))
    .map(id => parseInt(id.replace(prefix, ''), 10))
    .filter(num => !isNaN(num));
  
  const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
  return `${prefix}${(maxId + 1).toString().padStart(3, '0')}`;
};

const sanitizeName = (name) => name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

// Sanitize all entity names in a collection
const sanitizeCollection = (collection) => {
  if (!collection || typeof collection !== 'object') return collection;
  const result = {};
  for (const [key, val] of Object.entries(collection)) {
    if (val && typeof val === 'object' && typeof val.name === 'string') {
      result[key] = { ...val, name: sanitizeName(val.name) };
    } else {
      result[key] = val;
    }
  }
  return result;
};

// Configure localforage to use IndexedDB
localforage.config({
  driver: localforage.INDEXEDDB,
  name: 'branching-routes',
  storeName: 'editor_data',
});

export function EditorProvider({ children }) {
  // --- Loading state for async IndexedDB hydration ---
  const [isLoading, setIsLoading] = useState(true);

  // --- Core Entities ---
  const [flags, setFlags] = useState({});
  const [choices, setChoices] = useState({});
  const [scenes, setScenes] = useState({});
  
  // --- Structural Entities ---
  const [paths, setPaths] = useState({});
  const [chapters, setChapters] = useState({});
  const [statusPoints, setStatusPoints] = useState({});
  const [quests, setQuests] = useState({});
  const [endings, setEndings] = useState({});
  const [entryNode, setEntryNode] = useState(null);

  // --- Hydrate state from IndexedDB on mount ---
  useEffect(() => {
    let cancelled = false;
    localforage.getItem(STORAGE_KEY)
      .then(saved => {
        if (cancelled || !saved) return;
        if (saved.flags) setFlags(saved.flags);
        if (saved.choices) setChoices(saved.choices);
        if (saved.scenes) setScenes(saved.scenes);
        if (saved.paths) setPaths(saved.paths);
        if (saved.chapters) setChapters(saved.chapters);
        if (saved.statusPoints) setStatusPoints(saved.statusPoints);
        if (saved.quests) setQuests(saved.quests);
        if (saved.endings) setEndings(saved.endings);
        if (saved.entryNode !== undefined) setEntryNode(saved.entryNode);
      })
      .catch(() => { /* IndexedDB unavailable — start fresh */ })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // --- Live refs for stable callbacks (avoids stale closure bugs) ---
  const flagsRef = useRef(flags);
  const choicesRef = useRef(choices);
  const scenesRef = useRef(scenes);
  const endingsRef = useRef(endings);
  const statusPointsRef = useRef(statusPoints);
  const entryNodeRef = useRef(entryNode);
  useEffect(() => { flagsRef.current = flags; }, [flags]);
  useEffect(() => { choicesRef.current = choices; }, [choices]);
  useEffect(() => { scenesRef.current = scenes; }, [scenes]);
  useEffect(() => { endingsRef.current = endings; }, [endings]);
  useEffect(() => { statusPointsRef.current = statusPoints; }, [statusPoints]);
  useEffect(() => { entryNodeRef.current = entryNode; }, [entryNode]);

  // --- IndexedDB auto-save with debounce (#16) ---
  const saveTimerRef = useRef(null);
  const isInitialMount = useRef(true);
  useEffect(() => {
    // Skip saving while still loading from IndexedDB
    if (isLoading) return;
    // Skip the first render after hydration to avoid a redundant write
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      localforage.setItem(STORAGE_KEY, {
        flags, choices, scenes, paths, chapters, statusPoints, quests, endings, entryNode
      }).catch(() => { /* storage error — silent */ });
    }, 500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [isLoading, flags, choices, scenes, paths, chapters, statusPoints, quests, endings, entryNode]);

  // --- On-Demand reference maps (#7) ---
  const getFlagReferenceMap = useCallback(() => {
    const map = {};
    const fls = flagsRef.current;
    for (const flagId of Object.keys(fls)) {
      map[flagId] = { choices: [], scenes: [], endings: [] };
    }
    Object.values(choicesRef.current).forEach(choice => {
      const referencedFlags = new Set();
      if (choice.requires) choice.requires.forEach(r => { if (r.flag) referencedFlags.add(r.flag); });
      if (choice.options) choice.options.forEach(opt => {
        if (opt.flags_set) opt.flags_set.forEach(f => referencedFlags.add(f));
        if (opt.requires) opt.requires.forEach(r => { if (r.flag) referencedFlags.add(r.flag); });
      });
      referencedFlags.forEach(fId => {
        if (map[fId]) map[fId].choices.push(choice.id);
      });
    });
    Object.values(scenesRef.current).forEach(scene => {
      const referencedFlags = new Set();
      if (scene.requires) scene.requires.forEach(r => { if (r.flag) referencedFlags.add(r.flag); });
      if (scene.next) scene.next.forEach(n => {
        if (n.requires) n.requires.forEach(r => { if (r.flag) referencedFlags.add(r.flag); });
      });
      referencedFlags.forEach(fId => {
        if (map[fId]) map[fId].scenes.push(scene.id);
      });
    });
    Object.values(endingsRef.current).forEach(ending => {
      const referencedFlags = new Set();
      if (ending.requires) ending.requires.forEach(r => { if (r.flag) referencedFlags.add(r.flag); });
      referencedFlags.forEach(fId => {
        if (map[fId]) map[fId].endings.push(ending.id);
      });
    });
    return map;
  }, []);

  const getStatusReferenceMap = useCallback(() => {
    const map = {};
    const sts = statusPointsRef.current;
    for (const spId of Object.keys(sts)) {
      map[spId] = { choices: [], scenes: [] };
    }
    Object.values(choicesRef.current).forEach(choice => {
      const referencedStatus = new Set();
      if (choice.requires) choice.requires.forEach(r => { if (r.status) referencedStatus.add(r.status); });
      if (choice.options) choice.options.forEach(opt => {
        if (opt.status_set) opt.status_set.forEach(f => referencedStatus.add(f.status));
        if (opt.requires) opt.requires.forEach(r => { if (r.status) referencedStatus.add(r.status); });
      });
      referencedStatus.forEach(spId => {
        if (map[spId]) map[spId].choices.push(choice.id);
      });
    });
    Object.values(scenesRef.current).forEach(scene => {
      const referencedStatus = new Set();
      if (scene.requires) scene.requires.forEach(r => { if (r.status) referencedStatus.add(r.status); });
      if (scene.next) scene.next.forEach(n => {
        if (n.requires) n.requires.forEach(r => { if (r.status) referencedStatus.add(r.status); });
      });
      referencedStatus.forEach(spId => {
        if (map[spId]) map[spId].scenes.push(scene.id);
      });
    });
    return map;
  }, []);

  // --- On-Demand directed dependency graph (Phase 4 prep) ---
  const getDependencyGraph = useCallback(() => {
    return buildDependencyGraph(
      flagsRef.current,
      statusPointsRef.current,
      choicesRef.current,
      scenesRef.current,
      endingsRef.current
    );
  }, []);

  // --- Flags ---
  const addFlag = useCallback((name) => {
    const snakeName = sanitizeName(name);
    setFlags(prev => {
      const id = generateId('F', prev);
      return { ...prev, [id]: { id, name: snakeName, state: false } };
    });
  }, []);

  const updateFlagName = useCallback((id, name) => {
    setFlags(prev => {
      if (!prev[id]) return prev;
      return { ...prev, [id]: { ...prev[id], name: sanitizeName(name) } };
    });
  }, []);

  const toggleFlagState = useCallback((id) => {
    setFlags(prev => {
      if (!prev[id]) return prev;
      return { ...prev, [id]: { ...prev[id], state: !prev[id].state } };
    });
  }, []);

  const deleteFlag = useCallback((id) => {
    setFlags(prev => {
      const newFlags = { ...prev };
      delete newFlags[id];
      return newFlags;
    });

    setChoices(prev => {
      const newChoices = { ...prev };
      let anyChanged = false;
      for (const chId in newChoices) {
        let itemDirty = false;
        const choice = newChoices[chId];
        const newChoiceReqs = (choice.requires || []).filter(r => r.flag !== id);
        if (newChoiceReqs.length !== (choice.requires || []).length) itemDirty = true;

        const newOptions = (choice.options || []).map(opt => {
          const newReqs = (opt.requires || []).filter(r => r.flag !== id);
          const newFlagsSet = (opt.flags_set || []).filter(f => f !== id);
          if (newReqs.length !== (opt.requires || []).length || newFlagsSet.length !== (opt.flags_set || []).length) itemDirty = true;
          return { ...opt, requires: newReqs, flags_set: newFlagsSet };
        });
        if (itemDirty) {
          newChoices[chId] = { ...choice, requires: newChoiceReqs, options: newOptions };
          anyChanged = true;
        }
      }
      return anyChanged ? newChoices : prev;
    });

    setScenes(prev => {
      const newScenes = { ...prev };
      let anyChanged = false;
      for (const scId in newScenes) {
        let itemDirty = false;
        const scene = newScenes[scId];
        const newReqs = (scene.requires || []).filter(r => r.flag !== id);
        if (newReqs.length !== (scene.requires || []).length) itemDirty = true;
        
        const newNext = (scene.next || []).map(nxt => {
          const nxtReqs = (nxt.requires || []).filter(r => r.flag !== id);
          if (nxtReqs.length !== (nxt.requires || []).length) itemDirty = true;
          return { ...nxt, requires: nxtReqs };
        });

        if (itemDirty) {
          newScenes[scId] = { ...scene, requires: newReqs, next: newNext };
          anyChanged = true;
        }
      }
      return anyChanged ? newScenes : prev;
    });
  }, []);

  // --- Paths ---
  const addPath = useCallback((name) => {
    setPaths(prev => {
      const id = generateId('P', prev);
      return { ...prev, [id]: { id, name: sanitizeName(name) } };
    });
  }, []);

  const updatePathName = useCallback((id, name) => {
    setPaths(prev => {
      if (!prev[id]) return prev;
      return { ...prev, [id]: { ...prev[id], name: sanitizeName(name) } };
    });
  }, []);

  const deletePath = useCallback((id) => {
    setPaths(prev => {
      const p = { ...prev };
      delete p[id];
      return p;
    });
    setChoices(prev => {
      let changed = false;
      const next = { ...prev };
      for (const k in next) {
        if (next[k].path === id) { next[k] = { ...next[k], path: null }; changed = true; }
      }
      return changed ? next : prev;
    });
    setScenes(prev => {
      let changed = false;
      const next = { ...prev };
      for (const k in next) {
        if (next[k].path === id) { next[k] = { ...next[k], path: null }; changed = true; }
      }
      return changed ? next : prev;
    });
  }, []);

  // --- Chapters ---
  const addChapter = useCallback((name) => {
    setChapters(prev => {
      const id = generateId('C', prev);
      return { ...prev, [id]: { id, name: sanitizeName(name) } };
    });
  }, []);

  const updateChapterName = useCallback((id, name) => {
    setChapters(prev => {
      if (!prev[id]) return prev;
      return { ...prev, [id]: { ...prev[id], name: sanitizeName(name) } };
    });
  }, []);

  const deleteChapter = useCallback((id) => {
    setChapters(prev => {
      const c = { ...prev };
      delete c[id];
      return c;
    });
    setChoices(prev => {
      let changed = false;
      const next = { ...prev };
      for (const k in next) {
        if (next[k].chapter === id) { next[k] = { ...next[k], chapter: null }; changed = true; }
      }
      return changed ? next : prev;
    });
    setScenes(prev => {
      let changed = false;
      const next = { ...prev };
      for (const k in next) {
        if (next[k].chapter === id) { next[k] = { ...next[k], chapter: null }; changed = true; }
      }
      return changed ? next : prev;
    });
  }, []);

  // --- Status Points ---
  const addStatusPoint = useCallback((name, value = 0) => {
    setStatusPoints(prev => {
      const id = generateId('SP', prev);
      return { ...prev, [id]: { id, name: sanitizeName(name), value: Number(value), minValue: 0 } };
    });
  }, []);

  const updateStatusPoint = useCallback((id, updates) => {
    setStatusPoints(prev => {
      if (!prev[id]) return prev;
      // Enforce sanitizeName on name updates (#13)
      const sanitized = updates.name !== undefined
        ? { ...updates, name: sanitizeName(updates.name) }
        : updates;
      return { ...prev, [id]: { ...prev[id], ...sanitized } };
    });
  }, []);

  const deleteStatusPoint = useCallback((id) => {
    setStatusPoints(prev => {
      const s = { ...prev };
      delete s[id];
      return s;
    });

    setChoices(prev => {
      const newChoices = { ...prev };
      let anyChanged = false;
      for (const chId in newChoices) {
        let itemDirty = false;
        const choice = newChoices[chId];
        const newChoiceReqs = (choice.requires || []).filter(r => r.status !== id);
        if (newChoiceReqs.length !== (choice.requires || []).length) itemDirty = true;

        const newOptions = (choice.options || []).map(opt => {
          const newReqs = (opt.requires || []).filter(r => r.status !== id);
          const newStatusSet = (opt.status_set || []).filter(s => s.status !== id);
          if (newReqs.length !== (opt.requires || []).length || newStatusSet.length !== (opt.status_set || []).length) itemDirty = true;
          return { ...opt, requires: newReqs, status_set: newStatusSet };
        });
        if (itemDirty) {
          newChoices[chId] = { ...choice, requires: newChoiceReqs, options: newOptions };
          anyChanged = true;
        }
      }
      return anyChanged ? newChoices : prev;
    });

    setScenes(prev => {
      const newScenes = { ...prev };
      let anyChanged = false;
      for (const scId in newScenes) {
        let itemDirty = false;
        const scene = newScenes[scId];
        const newReqs = (scene.requires || []).filter(r => r.status !== id);
        if (newReqs.length !== (scene.requires || []).length) itemDirty = true;
        
        const newNext = (scene.next || []).map(nxt => {
          const nxtReqs = (nxt.requires || []).filter(r => r.status !== id);
          if (nxtReqs.length !== (nxt.requires || []).length) itemDirty = true;
          return { ...nxt, requires: nxtReqs };
        });

        if (itemDirty) {
          newScenes[scId] = { ...scene, requires: newReqs, next: newNext };
          anyChanged = true;
        }
      }
      return anyChanged ? newScenes : prev;
    });
  }, []);

  // --- Quests ---
  const addQuest = useCallback((name) => {
    setQuests(prev => {
      const id = generateId('Q', prev);
      return { ...prev, [id]: { id, name: sanitizeName(name) } };
    });
  }, []);

  const updateQuestName = useCallback((id, name) => {
    setQuests(prev => {
      if (!prev[id]) return prev;
      return { ...prev, [id]: { ...prev[id], name: sanitizeName(name) } };
    });
  }, []);

  const deleteQuest = useCallback((id) => {
    setQuests(prev => {
      const p = { ...prev };
      delete p[id];
      return p;
    });
    setChoices(prev => {
      let changed = false;
      const next = { ...prev };
      for (const k in next) {
        if (next[k].quest === id) { next[k] = { ...next[k], quest: null }; changed = true; }
      }
      return changed ? next : prev;
    });
    setScenes(prev => {
      let changed = false;
      const next = { ...prev };
      for (const k in next) {
        if (next[k].quest === id) { next[k] = { ...next[k], quest: null }; changed = true; }
      }
      return changed ? next : prev;
    });
  }, []);

  // --- Endings ---
  const addEnding = useCallback((name = "new_ending") => {
    setEndings(prev => {
      const id = generateId('E', prev);
      return { ...prev, [id]: { id, name: sanitizeName(name), requires: [] } };
    });
  }, []);

  const updateEnding = useCallback((id, updates) => {
    setEndings(prev => {
      if (!prev[id]) return prev;
      // Enforce sanitizeName on name updates (#13)
      const sanitized = updates.name !== undefined
        ? { ...updates, name: sanitizeName(updates.name) }
        : updates;
      return { ...prev, [id]: { ...prev[id], ...sanitized } };
    });
  }, []);

  const deleteEnding = useCallback((id) => {
    const currentScenes = scenesRef.current;
    const currentChoices = choicesRef.current;
    const referencingScenes = Object.values(currentScenes).filter(s => s.next && s.next.some(route => route.target === id)).map(s => s.id);
    const referencingChoices = Object.values(currentChoices).filter(c => c.options && c.options.some(opt => opt.next === id)).map(c => c.id);

    if (referencingScenes.length > 0 || referencingChoices.length > 0) {
      const allRefs = [...referencingScenes, ...referencingChoices].join(', ');
      alert(`${id} is referenced as a next target in: ${allRefs}. Remove those references first.`);
      return;
    }

    setEndings(prev => {
      const e = { ...prev };
      delete e[id];
      return e;
    });
  }, []);

  // --- Choices ---
  const addChoice = useCallback((text = "New Choice") => {
    setChoices(prev => {
      const id = generateId('CH', prev);
      return {
        ...prev,
        [id]: { id, text, chapter: null, path: null, requires: [], options: [] }
      };
    });
  }, []);

  const updateChoice = useCallback((id, updates) => {
    setChoices(prev => {
      if (!prev[id]) return prev;
      return { ...prev, [id]: { ...prev[id], ...updates } };
    });
  }, []);

  const addChoiceOption = useCallback((choiceId, optionLabel = "") => {
    setChoices(prev => {
      if (!prev[choiceId]) return prev;
      const choice = prev[choiceId];
      const optId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      return {
        ...prev,
        [choiceId]: {
          ...choice,
          options: [...(choice.options || []), { id: optId, label: optionLabel, requires: [], flags_set: [], status_set: [], next: null }]
        }
      };
    });
  }, []);

  const updateChoiceOption = useCallback((choiceId, optionIndex, newOptionData) => {
    setChoices(prev => {
      if (!prev[choiceId]) return prev;
      const choice = prev[choiceId];
      const newOptions = [...(choice.options || [])];
      newOptions[optionIndex] = newOptionData;
      return { ...prev, [choiceId]: { ...choice, options: newOptions } };
    });
  }, []);
  
  const deleteChoiceOption = useCallback((choiceId, optionIndex) => {
    setChoices(prev => {
      if (!prev[choiceId]) return prev;
      const choice = prev[choiceId];
      const newOptions = (choice.options || []).filter((_, idx) => idx !== optionIndex);
      return { ...prev, [choiceId]: { ...choice, options: newOptions } };
    });
  }, []);

  const deleteChoice = useCallback((id) => {
    const currentScenes = scenesRef.current;
    const currentChoices = choicesRef.current;
    const referencingScenes = Object.values(currentScenes).filter(s => s.next && s.next.some(route => route.target === id)).map(s => s.id);
    const referencingChoices = Object.values(currentChoices).filter(c => c.options && c.options.some(opt => opt.next === id)).map(c => c.id);
    
    if (referencingScenes.length > 0 || referencingChoices.length > 0) {
      const allRefs = [...referencingScenes, ...referencingChoices].join(', ');
      alert(`${id} is referenced as a next target in: ${allRefs}. Remove those references first.`);
      return;
    }

    if (entryNodeRef.current === id) setEntryNode(null);

    setChoices(prev => {
      const newChoices = { ...prev };
      delete newChoices[id];
      return newChoices;
    });
  }, []);

  // --- Scenes ---
  const addScene = useCallback((name = "New Scene", description = "") => {
    setScenes(prev => {
      const id = generateId('S', prev);
      return {
        ...prev,
        [id]: { id, name, description, chapter: null, path: null, requires: [], next: [] }
      };
    });
  }, []);

  const updateScene = useCallback((id, updates) => {
    setScenes(prev => {
      if (!prev[id]) return prev;
      return { ...prev, [id]: { ...prev[id], ...updates } };
    });
  }, []);

  const deleteScene = useCallback((id) => {
    const currentScenes = scenesRef.current;
    const currentChoices = choicesRef.current;
    const referencingScenes = Object.values(currentScenes).filter(s => s.next && s.next.some(route => route.target === id)).map(s => s.id);
    const referencingChoices = Object.values(currentChoices).filter(c => c.options && c.options.some(opt => opt.next === id)).map(c => c.id);
    
    if (referencingScenes.length > 0 || referencingChoices.length > 0) {
      const allRefs = [...referencingScenes, ...referencingChoices].join(', ');
      alert(`${id} is referenced as a next target in: ${allRefs}. Remove those references first.`);
      return;
    }

    if (entryNodeRef.current === id) setEntryNode(null);

    setScenes(prev => {
      const newScenes = { ...prev };
      delete newScenes[id];
      return newScenes;
    });
  }, []);

  // --- Load / Clear ---
  const loadData = useCallback(({ metadata, flags: f, choices: c, scenes: s, paths: p, chapters: ch, status: sp, quests: q, endings: e }) => {
    if (metadata && metadata.entry_node) setEntryNode(metadata.entry_node);
    else setEntryNode(null);
    // Sanitize entity names on import (#12)
    if (f) setFlags(sanitizeCollection(f));
    if (c) setChoices(c);
    if (s) setScenes(s);
    if (p) setPaths(sanitizeCollection(p));
    if (ch) setChapters(sanitizeCollection(ch));
    if (sp) setStatusPoints(sanitizeCollection(sp));
    if (q) setQuests(sanitizeCollection(q));
    if (e) setEndings(sanitizeCollection(e));
  }, []);

  const clearData = useCallback(() => {
    if(window.confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      setEntryNode(null);
      setFlags({});
      setChoices({});
      setScenes({});
      setPaths({});
      setChapters({});
      setStatusPoints({});
      setQuests({});
      setEndings({});
      localforage.removeItem(STORAGE_KEY).catch(() => { /* silent */ });
    }
  }, []);

  // --- Split contexts (#6): data is reactive, actions are stable ---
  const dataValue = useMemo(() => ({
    flags, choices, scenes, paths, chapters, statusPoints, quests, endings, entryNode,
    isLoading
  }), [flags, choices, scenes, paths, chapters, statusPoints, quests, endings, entryNode, isLoading]);

  const actionsValue = useMemo(() => ({
    getFlagReferenceMap, getStatusReferenceMap, getDependencyGraph,
    setEntryNode,
    addFlag, updateFlagName, toggleFlagState, deleteFlag,
    addPath, updatePathName, deletePath,
    addChapter, updateChapterName, deleteChapter,
    addQuest, updateQuestName, deleteQuest,
    addEnding, updateEnding, deleteEnding,
    addStatusPoint, updateStatusPoint, deleteStatusPoint,
    addChoice, updateChoice, addChoiceOption, updateChoiceOption, deleteChoiceOption, deleteChoice,
    addScene, updateScene, deleteScene,
    loadData, clearData
  }), [
    getFlagReferenceMap, getStatusReferenceMap, getDependencyGraph,
    setEntryNode,
    addFlag, updateFlagName, toggleFlagState, deleteFlag,
    addPath, updatePathName, deletePath,
    addChapter, updateChapterName, deleteChapter,
    addQuest, updateQuestName, deleteQuest,
    addEnding, updateEnding, deleteEnding,
    addStatusPoint, updateStatusPoint, deleteStatusPoint,
    addChoice, updateChoice, addChoiceOption, updateChoiceOption, deleteChoiceOption, deleteChoice,
    addScene, updateScene, deleteScene,
    loadData, clearData
  ]);

  return (
    <DataContext.Provider value={dataValue}>
      <ActionsContext.Provider value={actionsValue}>
        {children}
      </ActionsContext.Provider>
    </DataContext.Provider>
  );
}

// Convenience hooks
export const useEditorData = () => useContext(DataContext);
export const useEditorActions = () => useContext(ActionsContext);
export const useEditor = () => ({ ...useContext(DataContext), ...useContext(ActionsContext) });
