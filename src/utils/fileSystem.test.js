import { describe, it, expect, vi } from 'vitest';
import { importProject } from './fileSystem.js';

describe('importProject', () => {
  it('should import and sanitize commonType and endingType correctly', async () => {
    const mockFileContent = {
      schemaVersion: 4,
      meta: {
        title: "Test Graph",
        commonNodeTypes: ["ct-1"],
        endingTypes: ["et-1"]
      },
      commonType: {
        "ct-1": { id: "ct-1", name: "Combat" }
      },
      endingType: {
        "et-1": { id: "et-1", name: "Victory" }
      },
      tag: {
        "tag-1": { id: "tag-1", name: "Main Quest" }
      },
      common: {},
      choice: {},
      ending: {},
      edges: [],
      flag: {},
      status: {},
      path: {},
      chapter: {},
      editorSeenNodeIds: [],
      editorSeenOptionIds: []
    };

    // Mock showOpenFilePicker
    global.window = {
      showOpenFilePicker: vi.fn().mockResolvedValue([{
        getFile: async () => ({
          name: 'test.json',
          text: async () => JSON.stringify(mockFileContent)
        })
      }])
    };

    const result = await importProject();
    expect(result).not.toBeNull();
    expect(result.graphData.commonType).toEqual({
      "ct-1": { id: "ct-1", name: "Combat" }
    });
    expect(result.graphData.endingType).toEqual({
      "et-1": { id: "et-1", name: "Victory" }
    });
    expect(result.graphData.tag).toEqual({
      "tag-1": { id: "tag-1", name: "Main Quest" }
    });
    expect(result.graphData.meta.commonNodeTypes).toEqual(["ct-1"]);
    expect(result.graphData.meta.endingTypes).toEqual(["et-1"]);
  });

  it('should throw invalid_project_structure if file is missing node collections or edges array', async () => {
    const invalidContent = {
      schemaVersion: 4,
      foo: "bar"
    };

    global.window = {
      showOpenFilePicker: vi.fn().mockResolvedValue([{
        getFile: async () => ({
          name: 'invalid.json',
          text: async () => JSON.stringify(invalidContent)
        })
      }])
    };

    await expect(importProject()).rejects.toThrow('invalid_project_structure');
  });
});
