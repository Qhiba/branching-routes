// INVARIANT: DC-05
// MIGRATION: Parallel Support S03
export const generateId = (prefix) => `${prefix}-${crypto.randomUUID()}`;
