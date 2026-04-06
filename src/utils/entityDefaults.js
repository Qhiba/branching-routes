// ============================================================
// entityDefaults.js — Factory functions for all entity types
// ============================================================
// Each factory returns a new entity with all fields set to safe
// defaults per architecture rules AR-03 through AR-05, AR-06,
// AR-07, and AR-10.
//
// Field ordering follows the data model principle (§2.1):
//   Identity → Classification → Content → Prerequisites →
//   Side Effects → Routing → Internal Metadata
//
// Every `requires` field defaults to { operator: 'and', conditions: [] }
// Every array field defaults to []
// Names are sanitized via sanitizeName (AR-07)
// Sub-element IDs use generateId (AR-06)
// ============================================================

import { generateId } from './generateId.js';
import { sanitizeName } from './sanitizeName.js';

/**
 * Create a Common Node entity (replaces V1 "Scene").
 *
 * @param {object} [overrides] — Partial fields to override defaults.
 * @returns {object} A new Common Node entity.
 */
export function createCommonNode(overrides = {}) {
  const id = overrides.id ?? generateId('node');

  return {
    // Identity
    id,
    name: sanitizeName(overrides.name ?? ''),

    // Classification
    type: overrides.type ?? null,
    chapter: overrides.chapter ?? null,
    path: overrides.path ?? null,

    // Content
    description: overrides.description ?? '',
    variants: overrides.variants ?? [],

    // Prerequisites (AR-03)
    requires: overrides.requires ?? { operator: 'and', conditions: [] },

    // Side Effects (AR-05)
    flags_set: overrides.flags_set ?? [],
    status_set: overrides.status_set ?? [],

    // Routing (AR-04, AR-05)
    next: overrides.next ?? [],

    // Internal Metadata (AR-10)
    _position: overrides._position ?? { x: 0, y: 0 },
  };
}

/**
 * Create a Choice entity.
 *
 * @param {object} [overrides] — Partial fields to override defaults.
 * @returns {object} A new Choice entity.
 */
export function createChoice(overrides = {}) {
  const id = overrides.id ?? generateId('choice');

  return {
    // Identity
    id,
    text: overrides.text ?? '',

    // Classification
    chapter: overrides.chapter ?? null,
    path: overrides.path ?? null,

    // Prerequisites (AR-03)
    requires: overrides.requires ?? { operator: 'and', conditions: [] },

    // Options (AR-05) — each option has its own requires, flags_set, status_set, next
    options: overrides.options ?? [],

    // Internal Metadata (AR-10)
    _position: overrides._position ?? { x: 0, y: 0 },
  };
}

/**
 * Create an Ending entity.
 *
 * @param {object} [overrides] — Partial fields to override defaults.
 * @returns {object} A new Ending entity.
 */
export function createEnding(overrides = {}) {
  const id = overrides.id ?? generateId('ending');

  return {
    // Identity
    id,
    name: sanitizeName(overrides.name ?? ''),

    // Classification
    type: overrides.type ?? null,
    chapter: overrides.chapter ?? null,
    path: overrides.path ?? null,

    // Prerequisites (AR-03)
    requires: overrides.requires ?? { operator: 'and', conditions: [] },

    // Internal Metadata (AR-10)
    _position: overrides._position ?? { x: 0, y: 0 },
  };
}

/**
 * Create a Flag entity.
 *
 * @param {object} [overrides] — Partial fields to override defaults.
 * @returns {object} A new Flag entity.
 */
export function createFlag(overrides = {}) {
  const id = overrides.id ?? generateId('flag');

  return {
    // Identity
    id,
    name: sanitizeName(overrides.name ?? ''),

    // State — default is always false (flags start unset)
    state: overrides.state ?? false,

    // Classification (optional grouping)
    path: overrides.path ?? null,
    chapter: overrides.chapter ?? null,
  };
}

/**
 * Create a Status Point entity.
 *
 * @param {object} [overrides] — Partial fields to override defaults.
 * @returns {object} A new Status Point entity.
 */
export function createStatusPoint(overrides = {}) {
  const id = overrides.id ?? generateId('status');

  return {
    // Identity
    id,
    name: sanitizeName(overrides.name ?? ''),

    // Value
    value: overrides.value ?? 0,
    minValue: overrides.minValue ?? null,
    maxValue: overrides.maxValue ?? null,

    // Classification (optional grouping)
    path: overrides.path ?? null,
    chapter: overrides.chapter ?? null,
  };
}

/**
 * Create a Path entity.
 *
 * @param {object} [overrides] — Partial fields to override defaults.
 * @returns {object} A new Path entity.
 */
export function createPath(overrides = {}) {
  const id = overrides.id ?? generateId('path');

  return {
    // Identity
    id,
    name: sanitizeName(overrides.name ?? ''),
  };
}

/**
 * Create a Chapter entity.
 *
 * @param {object} [overrides] — Partial fields to override defaults.
 * @returns {object} A new Chapter entity.
 */
export function createChapter(overrides = {}) {
  const id = overrides.id ?? generateId('chapter');

  return {
    // Identity
    id,
    name: sanitizeName(overrides.name ?? ''),
  };
}
