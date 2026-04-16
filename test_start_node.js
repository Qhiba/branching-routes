import { useNarrativeStore } from './src/store/narrativeStore.js';

const store = useNarrativeStore.getState();
store.addNode({x:0, y:0}, 'common');
const state1 = useNarrativeStore.getState();
const id1 = Object.keys(state1.common)[0];
console.log("after add1:", state1.common[id1].data.isStartNode);

store.addNode({x:10, y:10}, 'choice');
const state2 = useNarrativeStore.getState();
const id2 = Object.keys(state2.choice)[0];
console.log("after add2:", state2.choice[id2].data.isStartNode);

store.setStartNode(id2);
const state3 = useNarrativeStore.getState();
console.log("node 1 isStartNode:", state3.common[id1].data.isStartNode);
console.log("node 2 isStartNode:", state3.choice[id2].data.isStartNode);
