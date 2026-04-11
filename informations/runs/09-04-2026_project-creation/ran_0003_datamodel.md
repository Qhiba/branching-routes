# Data Model

## Entity Types

### Node
Represents a single story beat or scene.

| Field | Type | Description |
|---|---|---|
| `id` | `string` (UUID v4) | Unique identifier, immutable after creation |
| `type` | `"common" \| "ending"` | Node variant; determines visual rendering and behaviour |
| `label` | `string` | Display name shown on the canvas |
| `content` | `string` | Narrative text / dialogue body (may be empty) |
| `sideEffects` | `SideEffect[]` | State mutations that fire when this node is entered |
| `isStartNode` | `boolean` | Exactly one node per graph may have this set to `true` |
| `isEndNode` | `boolean` | Derived from `type === 'ending'`; no outgoing edges are permitted |
| `position` | `{ x: number, y: number }` | Canvas coordinates managed by React Flow |

#### Node Types

| Type | Description |
|---|---|
| `common` | Default story beat. Has narrative content, side effects, and outgoing edges. |
| `ending` | Terminal node. Has optional ending text. The UI must block creation of outgoing edges. Signals simulation termination. |

### Edge (Choice/Path)
Represents a directed connection between two nodes.

| Field | Type | Description |
|---|---|---|
| `id` | `string` (UUID v4) | Unique identifier |
| `sourceId` | `string` | ID of the originating node |
| `targetId` | `string` | ID of the destination node |
| `label` | `string` | Choice text shown to the player (may be empty for unconditional paths) |
| `condition` | `Condition \| null` | Logical gate that must pass for this edge to be traversable; `null` means always traversable |
| `sideEffects` | `SideEffect[]` | State mutations that fire when the player **traverses this edge**, before the destination node's side effects fire |

### Condition
The logical gate applied to an edge.

| Field | Type | Description |
|---|---|---|
| `operator` | `"AND" \| "OR"` | How multiple clauses are combined |
| `clauses` | `Clause[]` | One or more individual flag checks |

### Clause
A single flag check within a condition.

| Field | Type | Description |
|---|---|---|
| `flagId` | `string` | References a `Flag.id` |
| `comparator` | `"==" \| "!=" \| ">" \| ">=" \| "<" \| "<="` | Comparison operator |
| `value` | `boolean \| number` | The value to compare against |

### Flag
A designer-defined variable that tracks story state.

| Field | Type | Description |
|---|---|---|
| `id` | `string` (UUID v4) | Unique identifier |
| `name` | `string` | Designer-chosen name; alphanumeric + underscore only |
| `type` | `"boolean" \| "number"` | Determines valid values and comparators |
| `defaultValue` | `boolean \| number` | Value at simulation start |

### SideEffect
A flag mutation. Used by both **nodes** (fires on enter) and **edges** (fires on traversal, before the destination node's side effects).

| Field | Type | Description |
|---|---|---|
| `flagId` | `string` | References a `Flag.id` |
| `operation` | `"set" \| "add" \| "subtract"` | `"add"`/`"subtract"` only valid for `number` flags |
| `value` | `boolean \| number` | Value operand for the operation |

---

## Relationships

```
Graph
 ├── nodes: Node[]          (1 graph → many nodes)
 ├── edges: Edge[]          (1 graph → many edges)
 └── flags: Flag[]          (1 graph → many flags)

Edge.sourceId         →  Node.id
Edge.targetId         →  Node.id
Clause.flagId         →  Flag.id
Node.sideEffects[].flagId → Flag.id
Edge.sideEffects[].flagId → Flag.id

Constraint: An edge may not have sourceId pointing to a node where type === 'ending'.
```

---

## Export / Save Format (JSON)

> **Note:** Node objects use a `data` sub-object to hold designer-editable fields (`label`, `content`, `isStartNode`, `sideEffects`). This nesting is required for React Flow compatibility — React Flow expects custom node data inside a `data` property. Timestamps are formatted as `DD-MM-YYYY` strings for human readability.

```json
{
  "schemaVersion": 1,
  "meta": {
    "title": "string",
    "createdAt": "DD-MM-YYYY",
    "updatedAt": "DD-MM-YYYY"
  },
  "flags": [
    {
      "id": "uuid",
      "name": "string",
      "type": "boolean | number",
      "defaultValue": "boolean | number"
    }
  ],
  "nodes": [
    {
      "id": "uuid",
      "type": "common | ending",
      "position": { "x": "number", "y": "number" },
      "data": {
        "label": "string",
        "content": "string",
        "isStartNode": "boolean",
        "sideEffects": [
          {
            "flagId": "uuid",
            "operation": "set | add | subtract",
            "value": "boolean | number"
          }
        ]
      }
    }
  ],
  "edges": [
    {
      "id": "uuid",
      "sourceId": "uuid",
      "targetId": "uuid",
      "label": "string",
      "condition": {
        "operator": "AND | OR",
        "clauses": [
          {
            "flagId": "uuid",
            "comparator": "== | != | > | >= | < | <=",
            "value": "boolean | number"
          }
        ]
      },
      "sideEffects": [
        {
          "flagId": "uuid",
          "operation": "set | add | subtract",
          "value": "boolean | number"
        }
      ]
    }
  ]
}
```

---

## Minimal Valid File Example

```json
{
  "schemaVersion": 1,
  "meta": {
    "title": "Untitled Story",
    "createdAt": "09-04-2026",
    "updatedAt": "09-04-2026"
  },
  "flags": [],
  "nodes": [
    {
      "id": "a1b2c3d4-0000-0000-0000-000000000001",
      "type": "common",
      "position": { "x": 100, "y": 100 },
      "data": {
        "label": "Start",
        "content": "The story begins.",
        "isStartNode": true,
        "sideEffects": []
      }
    }
  ],
  "edges": []
}
```
