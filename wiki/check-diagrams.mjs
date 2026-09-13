import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {diagramCases} from './diagram-cases.mjs';
const context = vm.createContext({window:{}});
vm.runInContext(await readFile(new URL('./assets/diagram-models.js', import.meta.url), 'utf8'), context);
const {offsets, cell} = context.window.ASHNAV_MODELS;
for (const [name, count] of [['N6',6],['N18',18],['N26',26]]) {
  const neighbors = offsets(name);
  assert.equal(neighbors.length, count);
  assert.equal(new Set(neighbors.map(p => p.join(','))).size, count);
  assert.ok(neighbors.every(p => p.some(x => x !== 0)));
}
assert.equal(offsets('N6').some(p => p.join(',') === '1,0,1'), false);
assert.equal(offsets('N18').some(p => p.join(',') === '1,0,1'), true);
assert.equal(offsets('N18').some(p => p.join(',') === '1,1,1'), false);
assert.equal(offsets('N26').some(p => p.join(',') === '1,1,1'), true);
for (const [world, origin, size, expected] of [[-3,-4,2,0],[1,-4,2,2],[2,-4,2,3],[-4.1,-4,2,-1],[-0.2,0,1,-1],[0,0,1,0]]) {
  assert.equal(cell(world,origin,size),expected);
}
console.log('Diagram checks passed: N6/N18/N26 counts, diagonals, cell centers, and half-open boundaries.');
const M=context.window.ASHNAV_MODELS;
const cases=diagramCases(M);
for(const test of cases) {
  const {r,g,start,goal}=test;
  if(r.path.length) {
    assert.equal(r.path[0],start,test.name);
    assert.equal(r.path.at(-1),goal,test.name);
    assert.equal(new Set(r.path).size,r.path.length,test.name);
    const weight=r.path.slice(1).reduce((sum,to,i)=>{
      const edge=g.edges[r.path[i]].find(e=>e.to===to);assert.ok(edge,test.name);return sum+edge.cost;
    },0);
    assert.ok(Math.abs(r.cost-(test.algorithm==='BFS'?r.path.length-1:weight))<1e-10,test.name);
  } else assert.equal(r.status,'UNREACHABLE',test.name);
}
assert.equal(M.search(M.triangle(),0,2,'BFS').cost,1);
assert.equal(M.search(M.triangle(),0,2,'Dijkstra').cost,2);
assert.equal(M.search(M.triangle(),0,2,'A*',n=>n===1?12:0).cost,10);
assert.equal(cases.find(c=>c.name==='policy-5-true-false').r.path.join(','),'0,3,4,5,2');
assert.equal(cases.find(c=>c.name==='policy-5-true-true').r.status,'UNREACHABLE');
assert.equal(cases.find(c=>c.name==='corridor-1').r.status,'UNREACHABLE');
for(const yaw of [-90,-45,0,45,90]) {
  const p=[.5,.5,.5],pose={x:10,z:20,yaw};
  const back=M.inverse(M.transform(p,pose),pose);
  assert.ok(back.every((n,i)=>Math.abs(n-p[i])<1e-12));
}
console.log(`Checked ${cases.length} search scenarios, route validity, costs, snapshot IDs, and rigid transforms.`);
