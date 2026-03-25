/**
 * Directed Dependency Graph Builder
 *
 * Produces a structured graph with three layers:
 *   1. flags    – setter/getter separation per flag ID
 *   2. status   – mutator/getter separation per status point ID
 *   3. adjacency – forward & reverse navigation edges between nodes
 *
 * All inputs are plain objects keyed by entity ID.
 * The function is pure — no React, no side-effects.
 */

export function buildDependencyGraph(flags, statusPoints, choices, scenes, endings) {
  // ── Layer 1: Flag dependency ──────────────────────────────────────
  const flagGraph = {};
  for (const flagId of Object.keys(flags || {})) {
    flagGraph[flagId] = {
      setBy: [],
      requiredBy: { choices: [], scenes: [], endings: [] }
    };
  }

  // ── Layer 2: Status dependency ────────────────────────────────────
  const statusGraph = {};
  for (const spId of Object.keys(statusPoints || {})) {
    statusGraph[spId] = {
      mutatedBy: [],
      requiredBy: { choices: [], scenes: [], endings: [] }
    };
  }

  // ── Layer 3: Navigation adjacency ────────────────────────────────
  const forward = {}; // nodeId → Set<targetId>
  const reverse = {}; // targetId → Set<sourceId>

  const addEdge = (sourceId, targetId) => {
    if (!targetId) return;
    if (!forward[sourceId]) forward[sourceId] = new Set();
    forward[sourceId].add(targetId);
    if (!reverse[targetId]) reverse[targetId] = new Set();
    reverse[targetId].add(sourceId);
  };

  // ── Scan choices ──────────────────────────────────────────────────
  for (const choice of Object.values(choices || {})) {
    // Choice-level requires → getters
    if (choice.requires) {
      for (const req of choice.requires) {
        if (req.flag && flagGraph[req.flag]) {
          flagGraph[req.flag].requiredBy.choices.push({ id: choice.id, context: 'choice_requires' });
        }
        if (req.status && statusGraph[req.status]) {
          statusGraph[req.status].requiredBy.choices.push({ id: choice.id, context: 'choice_requires' });
        }
      }
    }

    // Option-level data
    if (choice.options) {
      for (let optIdx = 0; optIdx < choice.options.length; optIdx++) {
        const opt = choice.options[optIdx];

        // Option requires → getters
        if (opt.requires) {
          for (const req of opt.requires) {
            if (req.flag && flagGraph[req.flag]) {
              flagGraph[req.flag].requiredBy.choices.push({ id: choice.id, context: 'option_requires', optionIndex: optIdx });
            }
            if (req.status && statusGraph[req.status]) {
              statusGraph[req.status].requiredBy.choices.push({ id: choice.id, context: 'option_requires', optionIndex: optIdx });
            }
          }
        }

        // flags_set → setters
        if (opt.flags_set) {
          for (const fId of opt.flags_set) {
            if (flagGraph[fId]) {
              flagGraph[fId].setBy.push({ choiceId: choice.id, optionIndex: optIdx });
            }
          }
        }

        // status_set → mutators
        if (opt.status_set) {
          for (const sm of opt.status_set) {
            if (statusGraph[sm.status]) {
              statusGraph[sm.status].mutatedBy.push({ choiceId: choice.id, optionIndex: optIdx, amount: sm.amount });
            }
          }
        }

        // Option next → navigation edges (null/empty next = loop back, skip)
        const nextArr = Array.isArray(opt.next)
          ? opt.next
          : opt.next
            ? [{ requires: [], target: opt.next }]
            : [];
        for (const entry of nextArr) {
          if (entry.target) {
            addEdge(choice.id, entry.target);
          }
          if (entry.requires) {
            for (const req of entry.requires) {
              if (req.flag && flagGraph[req.flag]) {
                flagGraph[req.flag].requiredBy.choices.push({ id: choice.id, context: 'option_next_requires', optionIndex: optIdx });
              }
              if (req.status && statusGraph[req.status]) {
                statusGraph[req.status].requiredBy.choices.push({ id: choice.id, context: 'option_next_requires', optionIndex: optIdx });
              }
            }
          }
        }
      }
    }
  }

  // ── Scan scenes ───────────────────────────────────────────────────
  for (const scene of Object.values(scenes || {})) {
    // Scene requires → getters
    if (scene.requires) {
      for (const req of scene.requires) {
        if (req.flag && flagGraph[req.flag]) {
          flagGraph[req.flag].requiredBy.scenes.push({ id: scene.id, context: 'scene_requires' });
        }
        if (req.status && statusGraph[req.status]) {
          statusGraph[req.status].requiredBy.scenes.push({ id: scene.id, context: 'scene_requires' });
        }
      }
    }

    // Scene next routes → getters (route conditions) + navigation edges
    if (scene.next) {
      for (let routeIdx = 0; routeIdx < scene.next.length; routeIdx++) {
        const route = scene.next[routeIdx];

        // Route requires → getters
        if (route.requires) {
          for (const req of route.requires) {
            if (req.flag && flagGraph[req.flag]) {
              flagGraph[req.flag].requiredBy.scenes.push({ id: scene.id, context: 'scene_next_requires', routeIndex: routeIdx });
            }
            if (req.status && statusGraph[req.status]) {
              statusGraph[req.status].requiredBy.scenes.push({ id: scene.id, context: 'scene_next_requires', routeIndex: routeIdx });
            }
          }
        }

        // Route target → navigation edge
        if (route.target) {
          addEdge(scene.id, route.target);
        }
      }
    }
  }

  // ── Scan endings ──────────────────────────────────────────────────
  for (const ending of Object.values(endings || {})) {
    if (ending.requires) {
      for (const req of ending.requires) {
        if (req.flag && flagGraph[req.flag]) {
          flagGraph[req.flag].requiredBy.endings.push({ id: ending.id });
        }
        if (req.status && statusGraph[req.status]) {
          statusGraph[req.status].requiredBy.endings.push({ id: ending.id });
        }
      }
    }
  }

  // ── Convert Sets to Arrays for serialisability ────────────────────
  const adjacency = {
    forward: {},
    reverse: {}
  };
  for (const [k, v] of Object.entries(forward)) adjacency.forward[k] = [...v];
  for (const [k, v] of Object.entries(reverse)) adjacency.reverse[k] = [...v];

  return { flags: flagGraph, status: statusGraph, adjacency };
}
