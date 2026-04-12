import fs from 'fs';
import path from 'path';
import url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runTests() {
  console.log("Running Refactor Phase 1 Tests...");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  console.log("\n--- Group B: Data Contract Verification ---");
  
  // TEST_DC_07
  const tokensPath = path.resolve(__dirname, '../src/styles/tokens.css');
  let tokensContent = '';
  try {
    tokensContent = fs.readFileSync(tokensPath, 'utf8');
  } catch (e) {
    console.error(`  [FAIL] Could not read tokens.css at ${tokensPath}`);
    failed++;
    return;
  }

  const expectedVars = [
    '--color-bg-base', '--color-bg-surface', '--color-bg-elevated', '--color-bg-hover',
    '--color-text-primary', '--color-text-secondary', '--color-text-muted',
    '--color-accent', '--color-active', '--color-visited', '--color-reachable', '--color-danger', '--color-border',
    '--color-canvas-bg', '--color-canvas-dot',
    '--space-1', '--space-2', '--space-3', '--space-4', '--space-5', '--space-6', '--space-7', '--space-8',
    '--font-family-base', '--font-size-xs', '--font-size-sm', '--font-size-md', '--font-size-lg',
    '--font-weight-normal', '--font-weight-medium', '--font-weight-bold', '--line-height-base',
    '--radius-sm', '--radius-md', '--radius-lg', '--radius-full',
    '--shadow-sm', '--shadow-md', '--shadow-lg',
    '--transition-fast', '--transition-normal'
  ];

  let missing = [];
  for (let v of expectedVars) {
    if (!tokensContent.includes(v + ':')) {
        missing.push(v);
    }
  }

  assert(missing.length === 0, `TEST_DC_07: All exactly expected CSS variable names must be preserved. Missing: ${missing.length ? missing.join(', ') : 'none'}`);

  console.log("\n--- Group C: Migration Verification ---");
  console.log("  (No migration step in Phase 1)");

  console.log(`\n${passed} passed, ${failed} failed`);
  console.log(`PARITY: ${failed === 0 ? 'CONFIRMED' : 'BROKEN'}`);
}

runTests();
