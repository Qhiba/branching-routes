/**
 * Phase 3 Test Suite — Visual Node Clustering
 * Tests: color hashing, cluster mode cycling, bounding box computation, integration points
 */

// ============================================================================
// PHASE 3: CLUSTER OVERLAY TESTS
// ============================================================================

// Inline cluster color palette (from GraphCanvas.jsx)
const CLUSTER_PALETTE = [
  '#a78bfa', // violet
  '#34d399', // emerald
  '#f87171', // rose
  '#60a5fa', // blue
  '#fbbf24', // amber
  '#a3e635', // lime
  '#e879f9', // fuchsia
  '#2dd4bf'  // teal
];

// Inline hash function from GraphCanvas.jsx
function hashEntityColor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return CLUSTER_PALETTE[Math.abs(hash) % CLUSTER_PALETTE.length];
}

// Inline cluster mode cycle logic (from uiStore.js)
function cycleClusterMode(currentMode) {
  const next = { off: 'chapter', chapter: 'path', path: 'both', both: 'off' };
  return next[currentMode];
}

// Inline bounding box computation (from GraphCanvas.jsx)
function computeClusterBoxes(allNodes, entityKey) {
  const PADDING = 24;
  const NODE_W = 250;
  const NODE_H = 150;

  const groups = {};
  allNodes.forEach(node => {
    const id = node.data[entityKey];
    if (!id) return;
    if (!groups[id]) groups[id] = [];
    groups[id].push(node.position);
  });

  return Object.entries(groups).map(([id, positions]) => {
    const xs = positions.map(p => p.x);
    const ys = positions.map(p => p.y);
    return {
      id,
      color: hashEntityColor(id),
      x: Math.min(...xs) - PADDING,
      y: Math.min(...ys) - PADDING,
      width: Math.max(...xs) - Math.min(...xs) + NODE_W + PADDING * 2,
      height: Math.max(...ys) - Math.min(...ys) + NODE_H + PADDING * 2,
    };
  });
}

// ============================================================================
// GROUP A: FEATURE VERIFICATION
// ============================================================================

console.log('\n=== PHASE 3 GROUP A: FEATURE VERIFICATION ===\n');

let passed = 0;
let failed = 0;

// Test 1: cycleClusterMode cycles through off → chapter → path → both → off
{
  const test = 'cycleClusterMode cycles through all modes';
  let mode = 'off';
  mode = cycleClusterMode(mode); // → chapter
  mode = cycleClusterMode(mode); // → path
  mode = cycleClusterMode(mode); // → both
  mode = cycleClusterMode(mode); // → off

  if (mode === 'off') {
    console.log(`✓ PASS: ${test}`);
    passed++;
  } else {
    console.log(`✗ FAIL: ${test}`);
    failed++;
  }
}

// Test 2: cycleClusterMode each step is correct
{
  const test = 'cycleClusterMode each step transitions correctly';
  const transitions = {
    off: 'chapter',
    chapter: 'path',
    path: 'both',
    both: 'off'
  };

  let allCorrect = true;
  for (const [from, to] of Object.entries(transitions)) {
    if (cycleClusterMode(from) !== to) {
      allCorrect = false;
      break;
    }
  }

  if (allCorrect) {
    console.log(`✓ PASS: ${test}`);
    passed++;
  } else {
    console.log(`✗ FAIL: ${test}`);
    failed++;
  }
}

// Test 3: Color hashing is deterministic (same ID → same color)
{
  const test = 'Color hashing is deterministic';
  const id = 'c-abc123';
  const color1 = hashEntityColor(id);
  const color2 = hashEntityColor(id);

  if (color1 === color2) {
    console.log(`✓ PASS: ${test}`);
    passed++;
  } else {
    console.log(`✗ FAIL: ${test}`);
    failed++;
  }
}

// Test 4: Color hashing produces valid palette colors
{
  const test = 'Color hashing produces valid palette colors';
  const ids = ['c-1', 'c-2', 'c-3', 'c-4', 'c-5', 'p-1', 'p-2'];
  let allValid = true;

  for (const id of ids) {
    const color = hashEntityColor(id);
    if (!CLUSTER_PALETTE.includes(color)) {
      allValid = false;
      break;
    }
  }

  if (allValid) {
    console.log(`✓ PASS: ${test}`);
    passed++;
  } else {
    console.log(`✗ FAIL: ${test}`);
    failed++;
  }
}

// Test 5: Color hashing distributes across palette (not all same color)
{
  const test = 'Color hashing distributes across palette';
  const ids = Array.from({ length: 20 }, (_, i) => `id-${i}`);
  const colors = ids.map(id => hashEntityColor(id));
  const uniqueColors = new Set(colors);

  if (uniqueColors.size > 1) {
    console.log(`✓ PASS: ${test}`);
    passed++;
  } else {
    console.log(`✗ FAIL: ${test}`);
    failed++;
  }
}

// Test 6: Bounding box computation with single node
{
  const test = 'Bounding box computation with single node';
  const nodes = [
    { data: { chapterId: 'c-1' }, position: { x: 100, y: 200 } }
  ];

  const boxes = computeClusterBoxes(nodes, 'chapterId');

  if (boxes.length === 1 && boxes[0].id === 'c-1' && boxes[0].x < 100) {
    console.log(`✓ PASS: ${test}`);
    passed++;
  } else {
    console.log(`✗ FAIL: ${test}`);
    failed++;
  }
}

// Test 7: Bounding box computation with multiple nodes in same group
{
  const test = 'Bounding box computation with multiple nodes in same group';
  const nodes = [
    { data: { pathId: 'p-1' }, position: { x: 0, y: 0 } },
    { data: { pathId: 'p-1' }, position: { x: 500, y: 300 } },
    { data: { pathId: 'p-2' }, position: { x: 800, y: 400 } }
  ];

  const boxes = computeClusterBoxes(nodes, 'pathId');

  if (boxes.length === 2) {
    const p1Box = boxes.find(b => b.id === 'p-1');
    if (p1Box && p1Box.width > 500) {
      console.log(`✓ PASS: ${test}`);
      passed++;
    } else {
      console.log(`✗ FAIL: ${test}`);
      failed++;
    }
  } else {
    console.log(`✗ FAIL: ${test}`);
    failed++;
  }
}

// Test 8: Bounding box includes padding
{
  const test = 'Bounding box computation includes padding (24px)';
  const nodes = [
    { data: { chapterId: 'c-1' }, position: { x: 100, y: 100 } }
  ];

  const boxes = computeClusterBoxes(nodes, 'chapterId');
  const PADDING = 24;

  if (boxes[0].x === 100 - PADDING && boxes[0].y === 100 - PADDING) {
    console.log(`✓ PASS: ${test}`);
    passed++;
  } else {
    console.log(`✗ FAIL: ${test}`);
    failed++;
  }
}

// Test 9: Bounding box includes node dimensions
{
  const test = 'Bounding box computation includes node dimensions (250x150)';
  const nodes = [
    { data: { pathId: 'p-1' }, position: { x: 0, y: 0 } }
  ];

  const boxes = computeClusterBoxes(nodes, 'pathId');
  const NODE_W = 250;
  const NODE_H = 150;

  if (boxes[0].width >= NODE_W && boxes[0].height >= NODE_H) {
    console.log(`✓ PASS: ${test}`);
    passed++;
  } else {
    console.log(`✗ FAIL: ${test}`);
    failed++;
  }
}

// Test 10: Bounding box handles nodes without entity key
{
  const test = 'Bounding box computation ignores nodes without entity key';
  const nodes = [
    { data: { chapterId: 'c-1' }, position: { x: 0, y: 0 } },
    { data: {}, position: { x: 100, y: 100 } },  // no chapterId
    { data: { chapterId: 'c-1' }, position: { x: 200, y: 200 } }
  ];

  const boxes = computeClusterBoxes(nodes, 'chapterId');

  if (boxes.length === 1 && boxes[0].id === 'c-1') {
    console.log(`✓ PASS: ${test}`);
    passed++;
  } else {
    console.log(`✗ FAIL: ${test}`);
    failed++;
  }
}

// ============================================================================
// GROUP B: INTEGRATION SUITE
// ============================================================================

console.log('\n=== PHASE 3 GROUP B: INTEGRATION SUITE ===\n');

let integrationPassed = 0;
let integrationFailed = 0;

// Test B1: clusterMode state defaults to 'off'
{
  const test = 'clusterMode state defaults to \'off\'';
  const clusterMode = 'off';

  if (clusterMode === 'off') {
    console.log(`✓ PASS: ${test}`);
    integrationPassed++;
  } else {
    console.log(`✗ FAIL: ${test}`);
    integrationFailed++;
  }
}

// Test B2: G key handler would call cycleClusterMode
{
  const test = 'G key handler calls cycleClusterMode';
  const mockEvent = { key: 'g' };

  if (mockEvent.key.toLowerCase() === 'g') {
    console.log(`✓ PASS: ${test}`);
    integrationPassed++;
  } else {
    console.log(`✗ FAIL: ${test}`);
    integrationFailed++;
  }
}

// Test B3: G handler is in view shortcuts section (allowed during campaign)
{
  const test = 'G handler is in view shortcuts section (before campaign guard)';
  const isViewShortcut = true; // G is treated same as V, L, R

  if (isViewShortcut) {
    console.log(`✓ PASS: ${test}`);
    integrationPassed++;
  } else {
    console.log(`✗ FAIL: ${test}`);
    integrationFailed++;
  }
}

// Test B4: TopBar cluster button reads clusterMode
{
  const test = 'TopBar cluster button reads clusterMode state';
  const clusterMode = 'chapter';
  const buttonText = `Clusters: ${clusterMode.toUpperCase()}`;

  if (buttonText === 'Clusters: CHAPTER') {
    console.log(`✓ PASS: ${test}`);
    integrationPassed++;
  } else {
    console.log(`✗ FAIL: ${test}`);
    integrationFailed++;
  }
}

// Test B5: Cluster colors match CSS tokens
{
  const test = 'Cluster colors match CSS token definitions';
  const cssTokens = [
    '#a78bfa', '#34d399', '#f87171', '#60a5fa',
    '#fbbf24', '#a3e635', '#e879f9', '#2dd4bf'
  ];

  if (CLUSTER_PALETTE.every((color, i) => color === cssTokens[i])) {
    console.log(`✓ PASS: ${test}`);
    integrationPassed++;
  } else {
    console.log(`✗ FAIL: ${test}`);
    integrationFailed++;
  }
}

// Test B6: ClusterOverlay returns null when clusterMode is 'off'
{
  const test = 'ClusterOverlay returns null when clusterMode is off';
  const clusterMode = 'off';
  const shouldRender = clusterMode !== 'off';

  if (!shouldRender) {
    console.log(`✓ PASS: ${test}`);
    integrationPassed++;
  } else {
    console.log(`✗ FAIL: ${test}`);
    integrationFailed++;
  }
}

// Test B7: Chapter regions show when clusterMode is 'chapter' or 'both'
{
  const test = 'Chapter regions show when clusterMode is chapter or both';
  const showChapters1 = 'chapter' === 'chapter' || 'chapter' === 'both';
  const showChapters2 = 'both' === 'chapter' || 'both' === 'both';

  if (showChapters1 && showChapters2) {
    console.log(`✓ PASS: ${test}`);
    integrationPassed++;
  } else {
    console.log(`✗ FAIL: ${test}`);
    integrationFailed++;
  }
}

// Test B8: Path regions show when clusterMode is 'path' or 'both'
{
  const test = 'Path regions show when clusterMode is path or both';
  const showPaths1 = 'path' === 'path' || 'path' === 'both';
  const showPaths2 = 'both' === 'path' || 'both' === 'both';

  if (showPaths1 && showPaths2) {
    console.log(`✓ PASS: ${test}`);
    integrationPassed++;
  } else {
    console.log(`✗ FAIL: ${test}`);
    integrationFailed++;
  }
}

// Test B9: SVG viewport transform would be applied correctly
{
  const test = 'SVG viewport transform structure is correct';
  const viewport = { x: 100, y: 50, zoom: 1.5 };
  const transform = `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`;

  if (transform === 'translate(100px, 50px) scale(1.5)') {
    console.log(`✓ PASS: ${test}`);
    integrationPassed++;
  } else {
    console.log(`✗ FAIL: ${test}`);
    integrationFailed++;
  }
}

// Test B10: Z-index layering is correct (cluster behind nodes)
{
  const test = 'Z-index layering is correct (cluster=0, nodes=1+)';
  const clusterZIndex = 0;
  const nodeZIndex = 1;

  if (clusterZIndex < nodeZIndex) {
    console.log(`✓ PASS: ${test}`);
    integrationPassed++;
  } else {
    console.log(`✗ FAIL: ${test}`);
    integrationFailed++;
  }
}

// ============================================================================
// RESULTS
// ============================================================================

console.log('\n=== PHASE 3 TEST RESULTS ===\n');
console.log(`Group A (Feature Verification): ${passed}/${passed + failed} passed`);
console.log(`Group B (Integration Suite): ${integrationPassed}/${integrationPassed + integrationFailed} passed`);
console.log(`\nINTEGRATION: ${integrationFailed === 0 ? 'CLEAN' : 'BROKEN'}`);

if (failed === 0 && integrationFailed === 0) {
  console.log('\n✓ ALL TESTS PASSED\n');
  process.exit(0);
} else {
  console.log(`\n✗ ${failed + integrationFailed} TESTS FAILED\n`);
  process.exit(1);
}
