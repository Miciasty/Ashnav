import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
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
