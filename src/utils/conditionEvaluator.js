export function evaluateClause(clause, flagState) {
  // CHANGED: Evaluates based on key presence (operator for nested, status for range, flag for boolean) instead of legacy comparator switch.
  if ('operator' in clause) {
    return evaluateCondition(clause, flagState);
  }

  if ('status' in clause) {
    const value = flagState[clause.status];
    if (value === undefined) return false;
    
    // CHANGED: Replaced explicit >, >=, <, <= with min/max range checks.
    if ('min' in clause && clause.min !== null && value < clause.min) return false;
    if ('max' in clause && clause.max !== null && value > clause.max) return false;
    return true;
  }

  if ('flag' in clause) {
    // CHANGED: Simplified boolean check instead of evaluating against multiple legacy comparators.
    return flagState[clause.flag] === clause.state;
  }

  return false;
}

export function evaluateCondition(condition, flagState) {
  // PRESERVED: Edge condition evaluation produces a boolean (returns true for null/empty pass-through).
  // PRESERVED: AR-07 (Condition Evaluation in Evaluator)
  if (!condition) return true;
  
  // CHANGED: Renamed clauses to conditions.
  if (!condition.conditions || condition.conditions.length === 0) return true;

  // CHANGED: Matches lowercase 'or' and 'and' instead of uppercase 'OR'.
  if (condition.operator === 'or') {
    return condition.conditions.some(clause => evaluateClause(clause, flagState));
  }
  
  // default to 'and'
  return condition.conditions.every(clause => evaluateClause(clause, flagState));
}
