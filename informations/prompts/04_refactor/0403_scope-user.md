## REFACTOR SCOPE

### What is being restructured
[NAME THE AREA — be specific]

### Current state (the problem)
[ONE SENTENCE — what is wrong with the current structure]

### Target state (the goal)
[ONE SENTENCE — what the structure looks like after]

### What changes structurally
[LIST — at least 3 specific structural changes]

### What must not change externally
[LIST — behaviors, data contracts, formats that users/engine depend on]

### Audit First verdict accepted
[ ] SAFE TO PROCEED
[ ] PROCEED WITH CAUTION — risks acknowledged: [LIST THEM]

### Hard stops I am setting
If any of these happen during execution, work stops immediately:
[ ] Export format changes
[ ] ID format changes
[ ] Condition format changes
[ ] Data model becomes non-additive
[ ] [ADD YOUR OWN]

### Rollback plan
If this goes wrong mid-execution:
[HOW DO YOU RECOVER — git reset? feature flag? 
parallel implementation?]

### Definition of done
[ ] Condition 1
[ ] Condition 2
[ ] Condition 3
[ ] All behavioral invariants from Audit First confirmed passing