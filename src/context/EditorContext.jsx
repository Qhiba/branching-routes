import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const EditorContext = createContext();

export function EditorProvider({ children }) {
  // --- Core Entities ---
  const [flags, setFlags] = useState({});
  const [choices, setChoices] = useState({});
  const [scenes, setScenes] = useState({});
  
  // --- New Structural Entities ---
  const [paths, setPaths] = useState({});
  const [chapters, setChapters] = useState({});
  const [statusPoints, setStatusPoints] = useState({});

  // --- ID Generation ---
  const generateId = (prefix, collection) => {
    const existingIds = Object.keys(collection)
      .filter(id => id.startsWith(prefix))
      .map(id => parseInt(id.replace(prefix, ''), 10))
      .filter(num => !isNaN(num));
    
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    return `${prefix}${(maxId + 1).toString().padStart(3, '0')}`;
  };

  const sanitizeName = (name) => name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

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

  const getFlagReferences = useCallback((flagId) => {
    const refs = { choices: [], scenes: [] };
    Object.values(choices).forEach(choice => {
      const usesFlag = (choice.requires && choice.requires.some(r => r.flag === flagId)) || choice.options.some(opt => 
        (opt.flags_set && opt.flags_set.includes(flagId)) || 
        (opt.requires && opt.requires.some(r => r.flag === flagId))
      );
      if (usesFlag) refs.choices.push(choice.id);
    });
    Object.values(scenes).forEach(scene => {
      const usesFlag = (scene.requires && scene.requires.some(r => r.flag === flagId)) ||
        (scene.next && scene.next.some(n => n.requires && n.requires.some(r => r.flag === flagId)));
      if (usesFlag) refs.scenes.push(scene.id);
    });
    return refs;
  }, [choices, scenes]);

  const deleteFlag = useCallback((id) => {
    setFlags(prev => {
      const newFlags = { ...prev };
      delete newFlags[id];
      return newFlags;
    });

    setChoices(prev => {
      const newChoices = { ...prev };
      let changed = false;
      for (const chId in newChoices) {
        const choice = newChoices[chId];
        const newChoiceReqs = (choice.requires || []).filter(r => r.flag !== id);
        if (newChoiceReqs.length !== (choice.requires || []).length) changed = true;

        const newOptions = (choice.options || []).map(opt => {
          const newReqs = (opt.requires || []).filter(r => r.flag !== id);
          const newFlagsSet = (opt.flags_set || []).filter(f => f !== id);
          if (newReqs.length !== (opt.requires || []).length || newFlagsSet.length !== (opt.flags_set || []).length) changed = true;
          return { ...opt, requires: newReqs, flags_set: newFlagsSet };
        });
        if (changed) newChoices[chId] = { ...choice, requires: newChoiceReqs, options: newOptions };
      }
      return changed ? newChoices : prev;
    });

    setScenes(prev => {
      const newScenes = { ...prev };
      let changed = false;
      for (const scId in newScenes) {
        const scene = newScenes[scId];
        const newReqs = (scene.requires || []).filter(r => r.flag !== id);
        if (newReqs.length !== (scene.requires || []).length) changed = true;
        
        const newNext = (scene.next || []).map(nxt => {
          const nxtReqs = (nxt.requires || []).filter(r => r.flag !== id);
          if (nxtReqs.length !== (nxt.requires || []).length) changed = true;
          return { ...nxt, requires: nxtReqs };
        });

        if (changed) newScenes[scId] = { ...scene, requires: newReqs, next: newNext };
      }
      return changed ? newScenes : prev;
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
    // Remove cascading path references from choices and scenes
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
      return { ...prev, [id]: { id, name: sanitizeName(name), value: Number(value) } };
    });
  }, []);

  const updateStatusPoint = useCallback((id, updates) => {
    setStatusPoints(prev => {
      if (!prev[id]) return prev;
      return { ...prev, [id]: { ...prev[id], ...updates } };
    });
  }, []);

  const deleteStatusPoint = useCallback((id) => {
    setStatusPoints(prev => {
      const s = { ...prev };
      delete s[id];
      return s;
    });

    // Clean conditions and status_sets across editors referencing this deleted SP
    setChoices(prev => {
      const newChoices = { ...prev };
      let changed = false;
      for (const chId in newChoices) {
        const choice = newChoices[chId];
        const newChoiceReqs = (choice.requires || []).filter(r => r.status !== id);
        if (newChoiceReqs.length !== (choice.requires || []).length) changed = true;

        const newOptions = (choice.options || []).map(opt => {
          const newReqs = (opt.requires || []).filter(r => r.status !== id);
          const newStatusSet = (opt.status_set || []).filter(s => s.status !== id);
          if (newReqs.length !== (opt.requires || []).length || newStatusSet.length !== (opt.status_set || []).length) changed = true;
          return { ...opt, requires: newReqs, status_set: newStatusSet };
        });
        if (changed) newChoices[chId] = { ...choice, requires: newChoiceReqs, options: newOptions };
      }
      return changed ? newChoices : prev;
    });

    setScenes(prev => {
      const newScenes = { ...prev };
      let changed = false;
      for (const scId in newScenes) {
        const scene = newScenes[scId];
        const newReqs = (scene.requires || []).filter(r => r.status !== id);
        if (newReqs.length !== (scene.requires || []).length) changed = true;
        
        const newNext = (scene.next || []).map(nxt => {
          const nxtReqs = (nxt.requires || []).filter(r => r.status !== id);
          if (nxtReqs.length !== (nxt.requires || []).length) changed = true;
          return { ...nxt, requires: nxtReqs };
        });

        if (changed) newScenes[scId] = { ...scene, requires: newReqs, next: newNext };
      }
      return changed ? newScenes : prev;
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

  const addChoiceOption = useCallback((choiceId, optionLabel = "New Option") => {
    setChoices(prev => {
      if (!prev[choiceId]) return prev;
      const choice = prev[choiceId];
      return {
        ...prev,
        [choiceId]: {
          ...choice,
          options: [...(choice.options || []), { label: optionLabel, requires: [], flags_set: [], status_set: [], next: null }]
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
    setScenes(prev => {
      const newScenes = { ...prev };
      delete newScenes[id];
      return newScenes;
    });
  }, []);

  // --- Load / Clear ---
  const loadData = useCallback(({ flags: f, choices: c, scenes: s, paths: p, chapters: ch, status: sp }) => {
    if (f) setFlags(f);
    if (c) setChoices(c);
    if (s) setScenes(s);
    if (p) setPaths(p);
    if (ch) setChapters(ch);
    if (sp) setStatusPoints(sp);
  }, []);

  const clearData = useCallback(() => {
    if(window.confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      setFlags({});
      setChoices({});
      setScenes({});
      setPaths({});
      setChapters({});
      setStatusPoints({});
    }
  }, []);

  const value = useMemo(() => ({
    // state maps
    flags, choices, scenes, paths, chapters, statusPoints,
    
    // actions
    addFlag, updateFlagName, toggleFlagState, deleteFlag, getFlagReferences,
    addPath, updatePathName, deletePath,
    addChapter, updateChapterName, deleteChapter,
    addStatusPoint, updateStatusPoint, deleteStatusPoint,
    addChoice, updateChoice, addChoiceOption, updateChoiceOption, deleteChoiceOption, deleteChoice,
    addScene, updateScene, deleteScene,
    
    loadData, clearData
  }), [
    flags, choices, scenes, paths, chapters, statusPoints,
    addFlag, updateFlagName, toggleFlagState, deleteFlag, getFlagReferences,
    addPath, updatePathName, deletePath,
    addChapter, updateChapterName, deleteChapter,
    addStatusPoint, updateStatusPoint, deleteStatusPoint,
    addChoice, updateChoice, addChoiceOption, updateChoiceOption, deleteChoiceOption, deleteChoice,
    addScene, updateScene, deleteScene,
    loadData, clearData
  ]);

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}

export const useEditor = () => useContext(EditorContext);
