export function evaluateClause(clause, flagState) {
  if ('operator' in clause) {
    return evaluateCondition(clause, flagState);
  }

  if ('status' in clause) {
    const value = flagState[clause.status];
    if (value === undefined) return false;
    
    if ('min' in clause && clause.min !== null && value < clause.min) return false;
    if ('max' in clause && clause.max !== null && value > clause.max) return false;
    return true;
  }

  if ('flag' in clause) {
    return flagState[clause.flag] === clause.state;
  }

  return false;
}

export function evaluateCondition(condition, flagState) {
  if (!condition) return true;
  
  if (!condition.conditions || condition.conditions.length === 0) return true;

  if (condition.operator === 'or') {
    return condition.conditions.some(clause => evaluateClause(clause, flagState));
  }
  
  // default to 'and'
  return condition.conditions.every(clause => evaluateClause(clause, flagState));
}
