export function evaluateClause(clause, flagState) {
  if (!(clause.flagId in flagState)) return false;
  const value = flagState[clause.flagId];
  const compareTo = clause.value;

  switch (clause.comparator) {
    case '==': return value === compareTo;
    case '!=': return value !== compareTo;
    case '>': return value > compareTo;
    case '>=': return value >= compareTo;
    case '<': return value < compareTo;
    case '<=': return value <= compareTo;
    default: return false;
  }
}

export function evaluateCondition(condition, flagState) {
  if (!condition) return true;
  if (!condition.clauses || condition.clauses.length === 0) return true;

  if (condition.operator === 'OR') {
    return condition.clauses.some(clause => evaluateClause(clause, flagState));
  }
  
  // default to AND
  return condition.clauses.every(clause => evaluateClause(clause, flagState));
}
