import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

export async function towerModels() {
  const context=vm.createContext({window:{}});
  for(const file of ['diagram-models.js','tower-model.js']) {
    vm.runInContext(await readFile(new URL(`./assets/${file}`,import.meta.url),'utf8'),context);
  }
  return context.window.ASHNAV_TOWER;
}
export function towerCases(T) {
  const cases=[];
  for(const position of Object.keys(T.barriers))for(const maxStep of [0,1])for(const algorithm of ['BFS','Dijkstra','A*']) {
    const scene=T.build(position,maxStep),result=T.find(scene,algorithm);
    cases.push({position,maxStep,algorithm,scene,result});
  }
  return cases;
}
export function javaTowerOracle(T) {
  const cases=towerCases(T);
  const calls=cases.map(({position,maxStep,algorithm,scene,result})=>{
    const points=scene.g.points.map(p=>p.join(',')).join(';');
    const edges=scene.g.edges.map((row,from)=>row.map(e=>`${from}>${e.to}:${Math.round(e.cost*1e6)};`).join('')).join('');
    return `check("${position}",${maxStep},"${algorithm}",${result.cost??-1},"${points}","${edges}");`;
  }).join('\n    ');
  return `import nsk.nu.ashnav.api.path.*;
import nsk.nu.ashnav.implementation.path.*;
public final class WikiTowerOracle {
  static void check(String pose,int step,String algorithm,double cost,String points,String edges) {
    var snapshot=TowerRouteExample.capture(pose,step);
    StringBuilder actualPoints=new StringBuilder(),actualEdges=new StringBuilder();
    for(int id=0;id<snapshot.nodes().nodeCount();id++) {
      var p=snapshot.nodes().cellOfNode(id);
      if(id>0)actualPoints.append(';');
      actualPoints.append(p.x()).append(',').append(p.y()).append(',').append(p.z());
      int from=id;
      snapshot.graph().forEachEdge(id,(to,weight)->actualEdges.append(from).append('>').append(to).append(':').append(Math.round(weight*1000000)).append(';'));
    }
    if(!points.contentEquals(actualPoints))throw new AssertionError("Cell/ID mismatch: "+pose);
    if(!edges.contentEquals(actualEdges))throw new AssertionError("Edge mismatch: "+pose+" / "+step);
    PathSearchResult result=switch(algorithm) {
      case "BFS" -> new BfsPathfinder(snapshot.graph()).findPath(snapshot.start(),snapshot.goal());
      case "Dijkstra" -> new DijkstraPathfinder(snapshot.graph()).findPath(snapshot.start(),snapshot.goal());
      default -> TowerRouteExample.solver(snapshot).findPath(snapshot.start(),snapshot.goal());
    };
    if(cost<0) {if(result.status()!=PathStatus.UNREACHABLE)throw new AssertionError("Unexpected route");}
    else if(result.status()!=PathStatus.FOUND||Math.abs(result.path().totalCost()-cost)>1e-10)throw new AssertionError("Route cost: "+pose+" / "+algorithm);
  }
  public static void main(String[] args) {
    ${calls}
    System.out.println("PASS ${cases.length} tower scenarios against Java: surface IDs, directed edges, costs, and reachability.");
  }
}`;
}

async function main() {
  const T=await towerModels(),cases=towerCases(T);
  for(const {position,maxStep,algorithm,scene,result} of cases) {
    const label=`${position}/${maxStep}/${algorithm}`;
    assert.equal(scene.heights.length,256);
    assert.equal(scene.g.width,16);assert.equal(scene.g.height,9);assert.equal(scene.g.depth,16);
    assert.equal(result.status,maxStep?'FOUND':'UNREACHABLE',label);
    assert.equal(scene.g.points[scene.start].join(','),'12,1,13');
    assert.equal(scene.g.points[scene.goal].join(','),'4,6,4');
    for(const p of scene.g.points) {
      assert.ok(scene.solid(p[0],p[1]-1,p[2]),label);
      assert.ok(!scene.solid(...p),label);
      assert.ok(!scene.solid(p[0],p[1]+1,p[2]),label);
      assert.equal(p[1],scene.heights[p[0]+16*p[2]],'No obstacle-roof nodes');
    }
    if(!maxStep)continue;
    assert.equal(result.ascent,5,label);
    assert.equal(result.points[0].join(','),'12,1,13');
    assert.equal(result.points.at(-1).join(','),'4,6,4');
    for(let i=1;i<result.points.length;i++) {
      const a=result.points[i-1],b=result.points[i];
      assert.equal(Math.abs(a[0]-b[0])+Math.abs(a[2]-b[2]),1,label);
      assert.ok(Math.abs(a[1]-b[1])<=1,label);
      assert.ok(scene.g.edges[result.path[i-1]].some(e=>e.to===result.path[i]),label);
    }
    const expectedMoves=position==='south'?19:17;
    assert.ok(Math.abs(result.cost-(algorithm==='BFS'?expectedMoves:expectedMoves-5+5*Math.SQRT2))<1e-10,label);
  }
  const south=T.build('south'),old=T.find(south),east=T.find(T.build('east'));
  assert.notEqual(old.points.map(p=>p.join(',')).join(';'),east.points.map(p=>p.join(',')).join(';'));
  assert.equal(T.find(south).points.map(p=>p.join(',')).join(';'),old.points.map(p=>p.join(',')).join(';'),'Old snapshot is stable');
  assert.ok(old.points.some(p=>p[0]===9&&p[1]===3),'East stairs');
  assert.ok(east.points.some(p=>p[2]===9&&p[1]===3),'South stairs');
  console.log(`Checked ${cases.length} 3D tower scenarios: support, headroom, collision exclusion, step limits, 5-block ascent, rerouting, and snapshot stability.`);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error);process.exitCode=1;});
