import { useGraphStore } from '../src/store/graphStore.js';
import { exportProject, importProject } from '../src/utils/fileSystem.js';
import * as assert from 'assert';

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res.then(() => {
        console.log(`PASS: ${name}`);
        passed++;
      }).catch((err) => {
        console.log(`FAIL: ${name}`);
        console.error(`  -> ${err.stack || err.message || err}`);
        failed++;
      });
    } else {
      console.log(`PASS: ${name}`);
      passed++;
    }
  } catch (err) {
    console.log(`FAIL: ${name}`);
    console.error(`  -> ${err.stack || err.message || err}`);
    failed++;
  }
}

let userFileContent = "";
global.window = {
  showOpenFilePicker: async () => [{
    getFile: async () => ({
      text: async () => userFileContent
    })
  }],
  showSaveFilePicker: async () => ({
    createWritable: async () => {
      let content = '';
      return {
        write: async (c) => { content += c; },
        close: async () => { global.mockSaveResult = content; }
      };
    }
  })
};

async function testPhase06() {
  console.log("=== Phase 06 Tests ===");

  runTest("exportGraph serialises state to schema version 1 and formats dates to DD-MM-YYYY", () => {
    useGraphStore.setState({
      meta: { title: 'Test Export', createdAt: new Date('2026-04-09T10:00:00Z').getTime(), updatedAt: new Date('2026-04-09T10:00:00Z').getTime() },
      nodes: [{ id: 'n1', type: 'common', data: { isStartNode: true }, position: { x: 0, y: 0 } }],
      edges: [],
      flags: []
    });

    const exported = useGraphStore.getState().exportGraph();
    assert.strictEqual(exported.schemaVersion, 1);
    assert.strictEqual(exported.meta.title, 'Test Export');
    assert.strictEqual(typeof exported.meta.createdAt, 'string');
    assert.ok(exported.meta.createdAt.match(/^\d{2}-\d{2}-\d{4}$/), `Should format date to DD-MM-YYYY, got: ${exported.meta.createdAt}`);
  });

  runTest("loadGraph accurately restores nodes, edges, flags, and meta", () => {
    const fixture = {
      meta: { title: 'Imported', createdAt: '09-04-2026', updatedAt: '09-04-2026' },
      nodes: [{ id: 'n1', type: 'common', data: { isStartNode: true }, position: { x: 0, y: 0 }, sideEffects: [] }],
      edges: [{ id: 'e1', sourceId: 'n1', targetId: 'n2', condition: null, sideEffects: [] }],
      flags: [{ id: 'f1', name: 'has_key', type: 'boolean', defaultValue: false }]
    };
    
    useGraphStore.getState().loadGraph(fixture);
    const state = useGraphStore.getState();
    assert.strictEqual(state.meta.title, 'Imported');
    assert.strictEqual(state.nodes.length, 1);
    assert.strictEqual(state.edges.length, 1);
    assert.strictEqual(state.flags.length, 1);
  });

  runTest("newGraph clears the workspace", () => {
    assert.strictEqual(useGraphStore.getState().nodes.length > 0, true);
    
    useGraphStore.getState().newGraph();
    const state = useGraphStore.getState();
    
    assert.strictEqual(state.nodes.length, 0);
    assert.strictEqual(state.edges.length, 0);
    assert.strictEqual(state.flags.length, 0);
    assert.strictEqual(state.meta.title, 'Untitled Graph');
  });

  await runTest("importProject throws on unsupported schemaVersion", async () => {
    userFileContent = JSON.stringify({ schemaVersion: 2, meta: {} });
    await assert.rejects(
      async () => { await importProject(); },
      /unsupported_schema_version/
    );
  });

  console.log(`\nSummary: ${passed} passed, ${failed} failed.`);
}

testPhase06().catch(err => console.error(err));
