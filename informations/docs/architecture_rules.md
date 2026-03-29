# Architecture Rules

## Core Data Structure Rules

### Rule 1. Entity IDs follow strict prefix conventions
**Rationale**: Consistent ID patterns enable reliable entity identification and prevent collisions across different entity types.
**Evidence**: `generateId` function in `EditorContext.jsx` (lines 12-20) enforces prefix conventions, and reorder functions rely on these patterns.

### Rule 2. All `requires` fields must be condition groups
**Rationale**: Uniform condition structure simplifies evaluation logic and prevents type errors in condition processing.
**Evidence**: Migration functions in `EditorContext.jsx` (lines 84-168) convert all `requires` to `{ operator, conditions }` format, and `conditionUtils.js` expects this structure.

### Rule 3. All `next` fields must be arrays of `{ requires, target }` objects
**Rationale**: Consistent routing structure enables reliable path traversal and condition evaluation for narrative flow.
**Evidence**: Migration functions in `EditorContext.jsx` (lines 25-50) enforce this structure, and virtually all graph and simulation code expects this format.

### Rule 4. Entity names are sanitized to lowercase with underscores
**Rationale**: Consistent naming prevents lookup failures and ensures cross-reference reliability.
**Evidence**: `sanitizeName` function in `EditorContext.jsx` (line 22) and `sanitizeCollection` function (lines 171-182) enforce this convention.

## State Management Rules

### Rule 5. Auto-save occurs every 500ms after state changes
**Rationale**: Debounced persistence prevents excessive writes while ensuring data safety.
**Evidence**: Auto-save `useEffect` in `EditorContext.jsx` (lines 257-269) uses 500ms debounce timer.

### Rule 6. All CRUD operations trigger a single debounced save
**Rationale**: Atomic state changes prevent partial saves and ensure data consistency.
**Evidence**: All CRUD operations in `EditorContext.jsx` assume single debounced save captures complete state.

### Rule 7. IndexedDB is the primary persistence layer
**Rationale**: Client-side storage provides offline capability and fast access to narrative data.
**Evidence**: `localforage` usage throughout `EditorContext.jsx` for all data persistence operations.

## Graph Visualization Rules

### Rule 8. Node positions are persisted with manual drag overrides
**Rationale**: User-customized layouts should be preserved across sessions while maintaining automatic layout capabilities.
**Evidence**: Position persistence logic in `RouteViewer.jsx` (lines 104-115) and `computeLayoutWithPositions` function.

### Rule 9. Edge IDs follow specific format conventions
**Rationale**: Consistent edge ID formats enable reliable simulation highlighting and graph operations.
**Evidence**: Edge generation in `graphLayout.js` (lines 142-196) and taken-edge detection in `useSimulator.js` (lines 221-261).

## Simulation Rules

### Rule 10. Simulation evaluates conditions in real-time
**Rationale**: Accurate condition evaluation is essential for correct narrative flow and user experience.
**Evidence**: `useSimulator.js` hook evaluates conditions on every state change and provides real-time feedback.

### Rule 11. Entry node can only be Scene or Choice, never Ending
**Rationale**: Starting simulation on a terminal node provides no meaningful user experience.
**Evidence**: Entry node dropdown in `NavBar.jsx` only offers scenes and choices (line 214-217 of `App.jsx`).

## Data Migration Rules

### Rule 12. Legacy data formats are silently upgraded on hydration
**Rationale**: Backward compatibility ensures users can load older projects without data loss.
**Evidence**: Migration functions in `EditorContext.jsx` (lines 25-168) run on every hydration and import.

### Rule 13. Missing fields are added with safe defaults
**Rationale**: Prevents undefined property errors and ensures consistent data structures.
**Evidence**: Migration functions add default values for missing fields like `type`, `flags_set`, `status_set`, `path`, `chapter`.

## Form and UI Rules

### Rule 14. Forms use consistent validation and error handling
**Rationale**: Uniform user experience and data integrity across all entity creation/editing operations.
**Evidence**: All form components in `src/components/layout/forms/` follow consistent validation patterns.

### Rule 15. Modal state is managed centrally
**Rationale**: Prevents modal conflicts and ensures consistent user experience across the application.
**Evidence**: Modal state management in `App.jsx` (lines 39-50) coordinates all modal operations.

## Performance Rules

### Rule 16. Complex computations are memoized
**Rationale**: Prevents unnecessary recalculations and improves application responsiveness.
**Evidence**: `useMemo` usage in `App.jsx` for route trace computation (lines 24-28) and other performance-critical areas.

### Rule 17. Debounced input prevents excessive re-renders
**Rationale**: Improves typing performance and reduces unnecessary state updates.
**Evidence**: `DebouncedInput.jsx` and `DebouncedTextarea.jsx` components used throughout forms.

## Error Handling Rules

### Rule 18. Errors are caught and handled gracefully
**Rationale**: Prevents application crashes and provides user-friendly error messages.
**Evidence**: `ErrorBoundary.jsx` component and try-catch blocks throughout the codebase.

### Rule 19. IndexedDB errors are silently caught
**Rationale**: Prevents application crashes due to storage failures, though this creates data loss risks.
**Evidence**: `.catch(() => {})` patterns in `EditorContext.jsx` for all IndexedDB operations.

## Security and Data Integrity Rules

### Rule 20. No external API calls or server dependencies
**Rationale**: Client-side architecture ensures offline capability and data privacy.
**Evidence**: Entire application runs in browser with no network requests except for static assets.

### Rule 21. Data validation is minimal but sufficient
**Rationale**: Balances user flexibility with data integrity requirements.
**Evidence**: Import validation checks basic structure but not cross-references (lines 126-211 of `App.jsx`).

## Development Rules

### Rule 22. Code follows React 19+ patterns
**Rationale**: Modern React features provide better performance and developer experience.
**Evidence**: Use of hooks, functional components, and React 19-specific patterns throughout codebase.

### Rule 23. TypeScript is not used
**Rationale**: JavaScript with PropTypes provides sufficient type safety for this application.
**Evidence**: No TypeScript files or type annotations in the codebase.

## Testing Rules

### Rule 24. Core utilities have comprehensive test coverage
**Rationale**: Ensures reliability of critical functions that power the entire application.
**Evidence**: Test files for `conditionUtils.js`, `dependencyGraph.js`, and `routeTracer.js`.

### Rule 25. No component testing
**Rationale**: Focus on utility testing provides better ROI for this application's architecture.
**Evidence**: No test files for React components, only utility functions.

## Build and Deployment Rules

### Rule 26. Vite is used for development and production builds
**Rationale**: Modern build tool provides fast development experience and optimized production bundles.
**Evidence**: `vite.config.js` and package.json scripts for dev/build/preview.

### Rule 27. No environment-specific configurations
**Rationale**: Client-side application doesn't require different configurations for different environments.
**Evidence**: No `.env` files or environment variable usage in the codebase.

## Browser Compatibility Rules

### Rule 28. Requires modern browser features
**Rationale**: Application relies on modern web APIs for functionality.
**Evidence**: Use of IndexedDB, ES modules, HTML5 File API, and modern JavaScript features.

### Rule 29. No polyfills or fallbacks for modern features
**Rationale**: Focus on modern browsers provides better development experience and performance.
**Evidence**: No polyfill usage or feature detection for modern APIs.

## Data Structure Evolution Rules

### Rule 30. New fields are added with backward compatibility
**Rationale**: Prevents breaking existing projects when adding new features.
**Evidence**: Migration functions add new fields with default values rather than requiring immediate updates.

### Rule 31. Export format includes implementation details
**Rationale**: Preserves user experience elements like node positions across sessions.
**Evidence**: Export includes `_position` and `_id` fields that are implementation details.

## User Experience Rules

### Rule 32. Visual feedback is provided for all user actions
**Rationale**: Clear feedback improves user confidence and prevents confusion.
**Evidence**: Simulation highlighting, reachability warnings, and form validation messages throughout the application.

### Rule 33. Undo/redo is not implemented
**Rationale**: Complexity of narrative state makes full undo/redo impractical for this application.
**Evidence**: No undo/redo functionality in the codebase.

## Performance Optimization Rules

### Rule 34. Large lists use virtualization
**Rationale**: Prevents performance issues with large numbers of entities.
**Evidence**: `react-virtuoso` usage for virtualized lists in components.

### Rule 35. Conditional rendering is used for complex components
**Rationale**: Improves initial load performance by deferring non-critical rendering.
**Evidence**: Conditional rendering in `LeftSidebar.jsx` based on simulation state.

## Accessibility Rules

### Rule 36. Basic accessibility features are implemented
**Rationale**: Ensures application is usable by people with disabilities.
**Evidence**: Semantic HTML, ARIA labels, and keyboard navigation in interactive components.

### Rule 37. No comprehensive accessibility testing
**Rationale**: Focus on core functionality over comprehensive accessibility compliance.
**Evidence**: No accessibility testing or detailed ARIA implementation beyond basics.

## Documentation Rules

### Rule 38. Code is self-documenting with clear naming
**Rationale**: Reduces need for external documentation and improves maintainability.
**Evidence**: Clear function and variable names throughout the codebase.

### Rule 39. No inline documentation comments
**Rationale**: Focus on code clarity over extensive comments.
**Evidence**: Minimal inline documentation, relying on clear naming and structure.

## Architecture Evolution Rules

### Rule 40. New features follow existing patterns
**Rationale**: Maintains consistency and reduces learning curve for developers.
**Evidence**: New components and features consistently follow established patterns and conventions.

### Rule 41. Breaking changes are avoided when possible
**Rationale**: Preserves user data and prevents migration pain.
**Evidence**: Migration functions and backward compatibility patterns throughout the codebase.

## Data Privacy Rules

### Rule 42. All data stays client-side
**Rationale**: Ensures user privacy and eliminates server-side data concerns.
**Evidence**: No server communication, all data stored locally in IndexedDB.

### Rule 43. No user tracking or analytics
**Rationale**: Respects user privacy and keeps application simple.
**Evidence**: No analytics libraries or tracking code in the codebase.

## Error Recovery Rules

### Rule 44. Data corruption is not automatically repaired
**Rationale**: Automatic repair could hide underlying issues and create inconsistent states.
**Evidence**: No automatic data repair or corruption detection mechanisms.

### Rule 45. User is responsible for data backup
**Rationale**: Client-side architecture makes server-side backup impractical.
**Evidence**: Only export/import functionality for data backup, no automatic backup.

## Future-Proofing Rules

### Rule 46. Dependencies are kept minimal
**Rationale**: Reduces maintenance burden and compatibility issues.
**Evidence**: Small dependency set focused on core functionality.

### Rule 47. No experimental features in production
**Rationale**: Ensures stability and reliability for end users.
**Evidence**: No experimental APIs or unstable features in the codebase.

## Community and Support Rules

### Rule 48. No built-in help or documentation system
**Rationale**: Focus on intuitive design over comprehensive documentation.
**Evidence**: No help system or in-app documentation beyond basic tooltips.

### Rule 49. Error messages are user-friendly
**Rationale**: Helps users understand and recover from issues without technical knowledge.
**Evidence**: Clear error messages and user-friendly error handling throughout the application.

## Quality Assurance Rules

### Rule 50. Manual testing is the primary QA method
**Rationale**: Application complexity makes comprehensive automated testing challenging.
**Evidence**: No automated testing framework or test automation beyond unit tests for utilities.

These rules represent the implicit architecture that has evolved in this codebase. They guide development decisions and ensure consistency across the application. Understanding these rules is essential for any developer working on this system.