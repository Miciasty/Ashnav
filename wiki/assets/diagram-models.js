/* Small, finite teaching models. Contract checks also run the Java library. */
(() => {
  'use strict';
  const offsets = neighborhood => {
    if (!['N6', 'N18', 'N26'].includes(neighborhood)) throw new Error('Unknown neighborhood');
    if (neighborhood === 'N6') return [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
    const values = [];
    for (let z = -1; z <= 1; z++) for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) {
      const axes = Math.abs(x) + Math.abs(y) + Math.abs(z);
      if (axes && (neighborhood === 'N26' || axes <= (neighborhood === 'N18' ? 2 : 1))) values.push([x, y, z]);
    }
    return values;
  };
  const cell = (world, origin, size) => {
    if (![world, origin, size].every(Number.isFinite) || size <= 0) throw new Error('Finite values and positive cell size required');
    return Math.floor((world - origin) / size);
  };
  function grid(width, height, depth, blocked=[], kind='N6', entry={}, oneWay=false) {
    const points=[], ids=new Map(), excluded=new Set(blocked);
    for (let z=0; z<depth; z++) for (let y=0; y<height; y++) for (let x=0; x<width; x++) {
      const index=x+width*(y+height*z);
      if (!excluded.has(index)) { ids.set([x,y,z].join(','),points.length); points.push([x,y,z]); }
    }
    const node = (x,y,z) => ids.get([x,y,z].join(',')) ?? -1;
    const edges=points.map(([x,y,z]) => offsets(kind).flatMap(([dx,dy,dz]) => {
      const to=node(x+dx,y+dy,z+dz);
      if (to<0 || (oneWay && dx<0)) return [];
      const index=(x+dx)+width*((y+dy)+height*(z+dz));
      return [{to,cost:entry[index] ?? Math.hypot(dx,dy,dz)}];
    }));
    return {points,edges,node,width,height,depth};
  }
  function search(edges, start, goal, algorithm='Dijkstra', heuristic=()=>0) {
    const trace=[], n=edges.length, distance=Array(n).fill(Infinity), parent=Array(n).fill(-1);
    const closed=Array(n).fill(false), discovered=Array(n).fill(false);
    if (start<0 || goal<0 || start>=n || goal>=n) return {path:[],cost:null,weight:null,trace,status:'UNREACHABLE'};
    const bfs=algorithm==='BFS', astar=algorithm==='A*';
    let sequence=0;
    const queue=[];
    const enqueue=(node,d) => queue.push({node,d,priority:d+(astar?heuristic(node,goal):0),sequence:sequence++});
    distance[start]=0; discovered[start]=true; enqueue(start,0);
    while (queue.length) {
      if (!bfs) queue.sort((a,b) => a.priority-b.priority || (astar?a.d-b.d:0) || a.node-b.node || a.sequence-b.sequence);
      const current=queue.shift(), from=current.node;
      if (closed[from] || current.d>distance[from]) continue;
      closed[from]=true; trace.push(from);
      if (from===goal) {
        const path=[];
        for(let at=goal; at!==-1; at=parent[at]) path.unshift(at);
        const weight=path.slice(1).reduce((sum,to,i) => sum+edges[path[i]].find(edge=>edge.to===to).cost,0);
        return {path,cost:distance[goal],weight,trace,status:'FOUND'};
      }
      for (const edge of edges[from]) {
        const to=edge.to, candidate=distance[from]+(bfs?1:edge.cost);
        if (bfs ? discovered[to] : !astar && closed[to]) continue;
        if (candidate>distance[to]) continue;
        if (candidate===distance[to] && (astar || parent[to]!==-1 && from>=parent[to])) continue;
        distance[to]=candidate; parent[to]=from; discovered[to]=true; closed[to]=false; enqueue(to,candidate);
      }
    }
    return {path:[],cost:null,weight:null,trace,status:'UNREACHABLE'};
  }
  const triangle=()=>[[{to:2,cost:10},{to:1,cost:1}],[{to:2,cost:1}],[]];
  function transform(point, pose) {
    const angle=pose.yaw*Math.PI/180, c=Math.cos(angle), s=Math.sin(angle);
    return [pose.x+c*point[0]+s*point[2], point[1], pose.z-s*point[0]+c*point[2]];
  }
  function inverse(point, pose) {
    const angle=pose.yaw*Math.PI/180, c=Math.cos(angle), s=Math.sin(angle);
    const x=point[0]-pose.x, z=point[2]-pose.z;
    return [c*x-s*z,point[1],s*x+c*z];
  }
  const presets={
    warehouse: {blocked:[3,10,17,24], entry:{15:5,16:5,18:5,19:5}, start:14, goal:20},
    open: {blocked:[],entry:{},start:14,goal:20},
    sealed: {blocked:[3,10,17,24,31],entry:{},start:14,goal:20}
  };
  function javaGraph(g,start,goal,algorithm,className='WarehouseRoute') {
    const rows=g.edges.map(row=>`{${row.map(e=>e.to).join(', ')}}`).join(',\n            ');
    const costs=g.edges.map(row=>`{${row.map(e=>e.cost).join(', ')}}`).join(',\n            ');
    const solver=algorithm==='A*'?`double[][] centers = {${g.points.map(p=>`{${p.join(', ')}}`).join(', ')}};
        var solver = new AStarPathfinder(graph, (node, target) -> {
            double dx = centers[node][0] - centers[target][0];
            double dz = centers[node][2] - centers[target][2];
            return Math.hypot(dx, dz);
        });`:`var solver = new ${algorithm==='BFS'?'Bfs':'Dijkstra'}Pathfinder(graph);`;
    return `import java.util.Arrays;
import nsk.nu.ashnav.api.path.PathStatus;
import nsk.nu.ashnav.implementation.graph.WeightedAdjacencyIntGraph;
import nsk.nu.ashnav.implementation.path.${algorithm==='A*'?'AStar':algorithm==='BFS'?'Bfs':'Dijkstra'}Pathfinder;

// Generated from the current 7 x 1 x 5 scene. IDs follow accepted cells.
public final class ${className} {
    public static void main(String[] args) {
        var graph = new WeightedAdjacencyIntGraph(
            new int[][] {${rows}},
            new double[][] {${costs}}
        );
        ${solver}
        var result = solver.findPath(${start}, ${goal});
        System.out.println(result.status());
        if (result.status() == PathStatus.FOUND) {
            System.out.println(Arrays.toString(result.path().nodes()));
            System.out.println("totalCost=" + result.path().totalCost());
        }
    }
}`;
  }
  window.ASHNAV_MODELS = {offsets,cell,grid,search,triangle,transform,inverse,presets,javaGraph};
})();
