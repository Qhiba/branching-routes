// ============================================================
// importExport.js — JSON/ZIP import and export
// ============================================================
// Handles JSON and ZIP file import/export for the Branching
// Routes V2 data model. JSON export/import operates on the
// narrative data model only. ZIP bundles include the data model
// plus campaign files.
//
// Architecture rules enforced:
//   AR-03: all requires fields validated as condition groups
//   AR-04: all next fields validated as arrays
//   AR-05: all array fields default to []
//   AR-07: entity names sanitized on import
//   AR-08: errors surfaced (no .catch(() => {}))
// ============================================================

import JSZip from 'jszip';
import { toRuntimeIds } from '../utils/idTransform.js';
import { sanitizeName } from '../utils/sanitizeName.js';
import { useNarrativeStore } from '../store/useNarrativeStore.js';
import { useCampaignStore } from '../store/useCampaignStore.js';

// ── JSON Export ─────────────────────────────────────────────

/**
 * Export the current narrative store state as a JSON Blob.
 * Applies hierarchical ID transformation for human-readable export.
 *
 * @returns {Blob} JSON Blob ready for download.
 */
export function exportJSON() {
  const exportData = useNarrativeStore.getState().toExportJSON();
  const jsonString = JSON.stringify(exportData, null, 2);
  return new Blob([jsonString], { type: 'application/json' });
}

/**
 * Trigger a browser download for a Blob with a given filename.
 *
 * @param {Blob} blob — The file content.
 * @param {string} filename — The download filename.
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export and download the narrative model as a .json file.
 *
 * @param {string} [filename] — Optional filename override.
 *   Defaults to `branching_routes_<timestamp>.json`.
 */
export function exportAndDownloadJSON(filename) {
  const blob = exportJSON();
  const name =
    filename ??
    `branching_routes_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  downloadBlob(blob, name);
}

// ── JSON Import ─────────────────────────────────────────────

/**
 * Import a JSON file into the narrative store.
 *
 * Steps:
 * 1. Read file as text
 * 2. Parse JSON
 * 3. Validate basic structure
 * 4. Apply toRuntimeIds (fresh sub-element IDs)
 * 5. Sanitize entity names (AR-07)
 * 6. Enforce data structure rules (AR-03, AR-04, AR-05)
 * 7. Load into narrative store
 *
 * @param {File} file — The .json File object from a file input.
 * @returns {Promise<object>} The imported narrative data (post-transform).
 * @throws {Error} If file is invalid, unparseable, or missing required structure.
 */
export async function importJSON(file) {
  const text = await file.text();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (parseError) {
    throw new Error(`Invalid JSON file: ${parseError.message}`);
  }

  // Validate minimal structure
  validateDataModelStructure(parsed);

  // Apply runtime ID transformation (fresh sub-element IDs)
  const withRuntimeIds = toRuntimeIds(parsed);

  // Sanitize all entity names on import (AR-07)
  sanitizeAllEntityNames(withRuntimeIds);

  // Enforce data structure invariants (AR-03, AR-04, AR-05)
  enforceDataStructureRules(withRuntimeIds);

  // Load into the narrative store
  useNarrativeStore.getState().loadFromJSON(withRuntimeIds);

  return withRuntimeIds;
}

// ── ZIP Export ───────────────────────────────────────────────

/**
 * Export the narrative model and all campaigns as a ZIP file.
 *
 * ZIP structure:
 *   datamodel.json            — The narrative data model (hierarchical IDs)
 *   campaigns/                — Campaign directory
 *     <campaign_name>.json    — Individual campaign files
 *
 * @returns {Promise<Blob>} ZIP Blob ready for download.
 */
export async function exportZIP() {
  const zip = new JSZip();

  // Add data model
  const exportData = useNarrativeStore.getState().toExportJSON();
  zip.file('datamodel.json', JSON.stringify(exportData, null, 2));

  // Add campaigns
  const campaignState = useCampaignStore.getState();
  const campaigns = campaignState.campaigns;

  if (Object.keys(campaigns).length > 0) {
    const campaignsFolder = zip.folder('campaigns');
    for (const [campaignId, campaign] of Object.entries(campaigns)) {
      const campaignData = {
        ...campaign,
        // Mark which campaign was active at export time
        _wasActive: campaignId === campaignState.activeCampaignId,
      };
      const filename = `${campaign.name || campaignId}.json`;
      campaignsFolder.file(filename, JSON.stringify(campaignData, null, 2));
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  return blob;
}

/**
 * Export and download the full project as a .zip file.
 *
 * @param {string} [filename] — Optional filename override.
 *   Defaults to `branching_routes_<timestamp>.zip`.
 */
export async function exportAndDownloadZIP(filename) {
  const blob = await exportZIP();
  const name =
    filename ??
    `branching_routes_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
  downloadBlob(blob, name);
}

// ── ZIP Import ──────────────────────────────────────────────

/**
 * Import a ZIP file containing a data model and optional campaigns.
 *
 * Steps:
 * 1. Load and parse the ZIP archive
 * 2. Validate that `datamodel.json` exists (R-04 mitigation)
 * 3. Parse and validate the data model
 * 4. Parse any campaign files from `campaigns/` folder
 * 5. Apply runtime ID transformation + sanitization + structure rules
 * 6. Load into narrative and campaign stores
 *
 * @param {File} file — The .zip File object from a file input.
 * @returns {Promise<{ narrativeData: object, campaigns: object }>}
 *   The imported data after all transformations.
 * @throws {Error} If ZIP is invalid, missing datamodel.json, or corrupt.
 */
export async function importZIP(file) {
  let zip;
  try {
    const arrayBuffer = await file.arrayBuffer();
    zip = await JSZip.loadAsync(arrayBuffer);
  } catch (zipError) {
    throw new Error(`Invalid ZIP file: ${zipError.message}`);
  }

  // ── Validate datamodel.json exists (R-04, spec §6.2) ─────
  const dataModelFile = zip.file('datamodel.json');
  if (!dataModelFile) {
    throw new Error(
      'Invalid archive: missing datamodel.json. ' +
      'The ZIP file must contain a datamodel.json at its root.'
    );
  }

  // ── Parse data model ──────────────────────────────────────
  let narrativeData;
  try {
    const dataModelText = await dataModelFile.async('string');
    narrativeData = JSON.parse(dataModelText);
  } catch (parseError) {
    throw new Error(`Failed to parse datamodel.json: ${parseError.message}`);
  }

  // Validate structure
  validateDataModelStructure(narrativeData);

  // Apply runtime ID transformation
  narrativeData = toRuntimeIds(narrativeData);

  // Sanitize names (AR-07)
  sanitizeAllEntityNames(narrativeData);

  // Enforce data structure invariants
  enforceDataStructureRules(narrativeData);

  // ── Parse campaign files ──────────────────────────────────
  const campaigns = {};
  let activeCampaignId = null;

  const campaignsFolder = zip.folder('campaigns');
  if (campaignsFolder) {
    const campaignFiles = [];
    campaignsFolder.forEach((relativePath, file) => {
      if (relativePath.endsWith('.json') && !file.dir) {
        campaignFiles.push(file);
      }
    });

    for (const campaignFile of campaignFiles) {
      try {
        const campaignText = await campaignFile.async('string');
        const campaignData = JSON.parse(campaignText);

        // Ensure campaign has an ID
        if (!campaignData.id) {
          // AMBIGUOUS: campaign file without an id — generate one from filename
          const baseName = campaignFile.name
            .split('/')
            .pop()
            .replace(/\.json$/, '');
          campaignData.id = `campaign_imported_${baseName}`;
        }

        // Sanitize campaign name (AR-07)
        if (campaignData.name) {
          campaignData.name = sanitizeName(campaignData.name);
        }

        // Track which campaign was active at export time
        if (campaignData._wasActive) {
          activeCampaignId = campaignData.id;
        }
        delete campaignData._wasActive;

        // Ensure campaign state fields exist with safe defaults
        campaignData.nodeStates = campaignData.nodeStates ?? {};
        campaignData.flagOverrides = campaignData.flagOverrides ?? {};
        campaignData.statusOverrides = campaignData.statusOverrides ?? {};

        campaigns[campaignData.id] = campaignData;
      } catch (campaignError) {
        // Skip corrupt campaign files but continue loading
        // AMBIGUOUS: whether to throw or skip — skipping with a console warning
        // since the data model is the critical payload
        console.warn(
          `Skipped corrupt campaign file ${campaignFile.name}: ${campaignError.message}`
        );
      }
    }
  }

  // ── Load into stores ──────────────────────────────────────
  useNarrativeStore.getState().loadFromJSON(narrativeData);
  useCampaignStore.getState().loadCampaigns(campaigns, activeCampaignId);

  return { narrativeData, campaigns };
}

// ── Validation helpers ──────────────────────────────────────

/**
 * Validate that a parsed object has the minimal structure of a
 * Branching Routes V2 data model.
 *
 * Required: `metadata` with `version`.
 * Expected collections: path, chapter, flag, status, common, choice, ending.
 *
 * @param {object} data — The parsed data model.
 * @throws {Error} If validation fails.
 */
function validateDataModelStructure(data) {
  if (data == null || typeof data !== 'object') {
    throw new Error('Invalid data model: expected an object');
  }

  if (!data.metadata || typeof data.metadata !== 'object') {
    throw new Error('Invalid data model: missing or invalid metadata');
  }

  if (!data.metadata.version) {
    throw new Error('Invalid data model: missing metadata.version');
  }

  // Ensure all expected collections exist (default to empty objects if missing)
  const requiredCollections = [
    'path', 'chapter', 'flag', 'status', 'common', 'choice', 'ending',
  ];
  for (const key of requiredCollections) {
    if (data[key] == null) {
      data[key] = {};
    }
    if (typeof data[key] !== 'object' || Array.isArray(data[key])) {
      throw new Error(
        `Invalid data model: "${key}" must be an object (keyed by entity ID)`
      );
    }
  }

  // Ensure quest exists (reserved, always empty object)
  if (data.quest == null) {
    data.quest = {};
  }
}

/**
 * Sanitize all entity names in a data model in-place (AR-07).
 *
 * @param {object} dataModel — The data model to sanitize.
 */
function sanitizeAllEntityNames(dataModel) {
  const namedCollections = ['path', 'chapter', 'flag', 'status', 'common', 'ending'];
  for (const key of namedCollections) {
    if (!dataModel[key]) continue;
    for (const entity of Object.values(dataModel[key])) {
      if (entity.name != null) {
        entity.name = sanitizeName(entity.name);
      }
    }
  }
  // Choice has `text`, not `name` — no sanitization needed per data model
}

/**
 * Enforce AR-03, AR-04, AR-05 data structure invariants on all
 * entities in a data model. Modifies in-place.
 *
 * @param {object} dataModel — The data model to enforce rules on.
 */
function enforceDataStructureRules(dataModel) {
  // Common nodes
  if (dataModel.common) {
    for (const node of Object.values(dataModel.common)) {
      // AR-03: requires must be a condition group
      node.requires = ensureConditionGroup(node.requires);
      // AR-04: next must be an array of { id, target, requires }
      node.next = ensureNextArray(node.next);
      // AR-05: array fields default to []
      node.flags_set = ensureArray(node.flags_set);
      node.status_set = ensureArray(node.status_set);
      node.variants = ensureArray(node.variants);
      // Enforce rules on variants
      for (const variant of node.variants) {
        variant.requires = ensureConditionGroup(variant.requires);
      }
      // Enforce rules on next entries
      for (const ne of node.next) {
        ne.requires = ensureConditionGroup(ne.requires);
      }
      // Ensure _position exists (AR-10)
      node._position = node._position ?? { x: 0, y: 0 };
    }
  }

  // Choices
  if (dataModel.choice) {
    for (const choice of Object.values(dataModel.choice)) {
      // AR-03
      choice.requires = ensureConditionGroup(choice.requires);
      // AR-05
      choice.options = ensureArray(choice.options);
      // Enforce rules on options
      for (const opt of choice.options) {
        opt.requires = ensureConditionGroup(opt.requires);
        opt.flags_set = ensureArray(opt.flags_set);
        opt.status_set = ensureArray(opt.status_set);
        opt.next = ensureNextArray(opt.next);
        for (const ne of opt.next) {
          ne.requires = ensureConditionGroup(ne.requires);
        }
      }
      // AR-10
      choice._position = choice._position ?? { x: 0, y: 0 };
    }
  }

  // Endings
  if (dataModel.ending) {
    for (const ending of Object.values(dataModel.ending)) {
      // AR-03
      ending.requires = ensureConditionGroup(ending.requires);
      // AR-10
      ending._position = ending._position ?? { x: 0, y: 0 };
    }
  }
}

/**
 * Ensure a value is a valid condition group (AR-03).
 * Returns a safe default if the value is null, undefined, or malformed.
 *
 * @param {*} value — The value to check.
 * @returns {{ operator: string, conditions: Array }}
 */
function ensureConditionGroup(value) {
  if (
    value != null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (value.operator === 'and' || value.operator === 'or') &&
    Array.isArray(value.conditions)
  ) {
    return value;
  }
  return { operator: 'and', conditions: [] };
}

/**
 * Ensure a value is an array (AR-05).
 *
 * @param {*} value — The value to check.
 * @returns {Array}
 */
function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

/**
 * Ensure a value is a valid next array (AR-04).
 * Each entry must have at minimum { id, target, requires }.
 *
 * @param {*} value — The value to check.
 * @returns {Array}
 */
function ensureNextArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry) =>
      entry != null &&
      typeof entry === 'object' &&
      entry.id != null &&
      entry.target != null
  ).map((entry) => ({
    ...entry,
    requires: ensureConditionGroup(entry.requires),
  }));
}
