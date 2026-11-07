// ADDED (Redesign Step 6): unified node search + canvas filter predicate. Pure — no store access.
//
// searchGraph(query, graph, { includeEdges }) returns one result per node (never per edge). Each result lists the
// reasons it matched, written for people:
//   - the node label
//   - collectibles the node grants
//   - flags / statuses the node sets on enter
//   - Choice options: the option label, flags/statuses it sets, flags/statuses it requires
//   - (includeEdges) conditions on edges leaving the node, shown as "→ Target requires …"
// An empty query returns every node with no match lines (the Browse list then shows the filtered set).

/** Route (identity) type used for colours and the type filter. */
export function nodeRouteType(node, collection) {
  if (collection === 'choice') return 'choice';
  if (collection === 'ending') return 'ending';
  if (node?.type === 'hub') return 'hub';
  if (node?.type === 'warp_entrance' || node?.type === 'warp_exit') return 'warp';
  return 'common';
}

export const ROUTE_TYPE_LABELS = { common: 'Common', choice: 'Choice', ending: 'Ending', hub: 'Hub', warp: 'Warp' };

/** Flattens the three node collections into [{ node, collection, routeType }] in insertion order. */
export function listNodes(graph) {
  const out = [];
  ['common', 'choice', 'ending'].forEach(collection => {
    Object.values(graph[collection] || {}).forEach(node => {
      out.push({ node, collection, routeType: nodeRouteType(node, collection) });
    });
  });
  return out;
}

const nameOf = (dict, id, fallback) => (dict && dict[id]?.name) || fallback;

function statusEffectText(se, statusDict) {
  const name = nameOf(statusDict, se.statusId, 'unknown status');
  const amount = Number(se.amount) || 0;
  if ((se.mode || 'add') === 'set') return `${name} = ${amount}`;
  return `${name} ${amount >= 0 ? '+' : '−'}${Math.abs(amount)}`;
}

/**
 * ADDED (2026-11-06): one wording for status conditions everywhere (edge labels, Choice option chips, Browse, Inspector).
 * "affection = 5" (Min = Max), "2 ≤ affection ≤ 8" (both ends included), "affection ≥ 5", "affection ≤ 5", "affection (any value)".
 */
export function formatStatusClause(name, clause) {
  const hasMin = clause.min !== undefined && clause.min !== null && clause.min !== '';
  const hasMax = clause.max !== undefined && clause.max !== null && clause.max !== '';
  if (hasMin && hasMax) return Number(clause.min) === Number(clause.max) ? `${name} = ${clause.min}` : `${clause.min} ≤ ${name} ≤ ${clause.max}`;
  if (hasMin) return `${name} ≥ ${clause.min}`;
  if (hasMax) return `${name} ≤ ${clause.max}`;
  return `${name} (any value)`;
}

/** Human-readable clause: "has_key is true", "affection ≥ 5", "2 ≤ affection ≤ 8", nested groups in brackets. */
export function describeClause(clause, dicts) {
  if (!clause) return '';
  if ('operator' in clause) return `(${describeCondition(clause, dicts)})`;
  if ('status' in clause) {
    return formatStatusClause(nameOf(dicts.status, clause.status, 'unknown status'), clause);
  }
  if ('flag' in clause) return `${nameOf(dicts.flag, clause.flag, 'unknown flag')} is ${clause.state ? 'true' : 'false'}`;
  return '';
}

export function describeCondition(condition, dicts) {
  const parts = (condition?.conditions || []).map(c => describeClause(c, dicts)).filter(Boolean);
  return parts.join(condition?.operator === 'or' ? ' or ' : ' and ');
}

function clauseNames(clause, dicts, acc = []) {
  if (!clause) return acc;
  if ('operator' in clause) (clause.conditions || []).forEach(c => clauseNames(c, dicts, acc));
  else if ('status' in clause) acc.push(nameOf(dicts.status, clause.status, ''));
  else if ('flag' in clause) acc.push(nameOf(dicts.flag, clause.flag, ''));
  return acc;
}

const conditionMentions = (condition, dicts, q) =>
  (condition?.conditions || []).some(c => clauseNames(c, dicts).some(n => n.toLowerCase().includes(q)));

/**
 * @param {string} query
 * @param {object} graph narrativeStore state (common, choice, ending, edges, flag, status, collectible, …)
 * @param {{ includeEdges?: boolean }} [options]
 * @returns {Array<{ nodeId: string, collection: string, routeType: string, label: string, matches: Array<{ kind: string, text: string, targetId?: string }> }>}
 */
export function searchGraph(query, graph, { includeEdges = true } = {}) {
  const q = (query || '').trim().toLowerCase();
  const dicts = { flag: graph.flag || {}, status: graph.status || {} };
  const nodes = listNodes(graph);
  const labelById = {};
  nodes.forEach(({ node }) => { labelById[node.id] = node.data?.label || 'Untitled node'; });

  const edgesBySource = {};
  if (q && includeEdges) {
    (graph.edges || []).forEach(e => { (edgesBySource[e.sourceId] = edgesBySource[e.sourceId] || []).push(e); });
  }

  const results = [];
  nodes.forEach(({ node, collection, routeType }) => {
    const data = node.data || {};
    const label = labelById[node.id];
    if (!q) {
      results.push({ nodeId: node.id, collection, routeType, label, matches: [] });
      return;
    }
    const matches = [];
    const has = (text) => (text || '').toLowerCase().includes(q);

    if (has(label)) matches.push({ kind: 'label', text: label });

    (data.collectibleIds || []).forEach(cid => {
      const name = nameOf(graph.collectible, cid, '');
      if (has(name)) matches.push({ kind: 'collectible', text: `Grants ${name}` });
    });

    (data.flags_set || []).forEach(fid => {
      const name = nameOf(dicts.flag, fid, '');
      if (has(name)) matches.push({ kind: 'flag-set', text: `On enter: ${name} = true` });
    });
    (data.status_set || []).forEach(se => {
      if (has(nameOf(dicts.status, se.statusId, ''))) matches.push({ kind: 'status-set', text: `On enter: ${statusEffectText(se, dicts.status)}` });
    });

    (data.options || []).forEach((opt, i) => {
      const optName = `Option "${opt.label || `Option ${i + 1}`}"`;
      if (has(opt.label)) matches.push({ kind: 'option', text: optName });
      (opt.flags_set || []).forEach(fid => {
        const name = nameOf(dicts.flag, fid, '');
        if (has(name)) matches.push({ kind: 'option-flag', text: `${optName} sets ${name} = true` });
      });
      (opt.status_set || []).forEach(se => {
        if (has(nameOf(dicts.status, se.statusId, ''))) matches.push({ kind: 'option-status', text: `${optName}: ${statusEffectText(se, dicts.status)}` });
      });
      if (conditionMentions(opt.requires, dicts, q)) {
        matches.push({ kind: 'option-requires', text: `${optName} requires ${describeCondition(opt.requires, dicts)}` });
      }
    });

    (edgesBySource[node.id] || []).forEach(e => {
      if (conditionMentions(e.condition, dicts, q)) {
        matches.push({
          kind: 'edge',
          targetId: e.targetId,
          text: `→ ${labelById[e.targetId] || 'missing node'} requires ${describeCondition(e.condition, dicts)}`,
        });
      }
    });

    if (matches.length) results.push({ nodeId: node.id, collection, routeType, label, matches });
  });
  return results;
}

/**
 * Canvas / Browse filter predicate (filters dim, they never hide or delete).
 * @param {object} node
 * @param {string} routeType from nodeRouteType
 * @param {{ chapterId?: string|null, pathId?: string|null, tagIds?: string[], tagsLogic?: 'and'|'or',
 *           collectibleCategoryId?: string|null, nodeType?: string|null }} filters
 * @param {object} collectibleDict narrativeStore.collectible
 */
export function nodeMatchesFilters(node, routeType, filters, collectibleDict = {}) {
  const data = node?.data || {};
  if (filters.nodeType && routeType !== filters.nodeType) return false;
  if (filters.chapterId && data.chapterId !== filters.chapterId) return false;
  if (filters.pathId && data.pathId !== filters.pathId) return false;
  const tagIds = filters.tagIds || [];
  if (tagIds.length) {
    const own = data.tagIds || [];
    const ok = filters.tagsLogic === 'and' ? tagIds.every(t => own.includes(t)) : tagIds.some(t => own.includes(t));
    if (!ok) return false;
  }
  if (filters.collectibleCategoryId) {
    const ids = data.collectibleIds || [];
    if (!ids.some(cid => collectibleDict[cid]?.categoryId === filters.collectibleCategoryId)) return false;
  }
  return true;
}

export function countActiveFilters(filters) {
  return [filters.nodeType, filters.chapterId, filters.pathId, filters.collectibleCategoryId].filter(Boolean).length
    + ((filters.tagIds || []).length ? 1 : 0);
}
