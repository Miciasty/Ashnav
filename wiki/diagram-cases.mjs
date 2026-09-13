// Shared inputs for model invariants and comparison against the real Java API.
export function diagramCases(M) {
  const cases=[];
  const addGrid=(name,w,h,d,blocked,kind,entry,oneWay,startCell,goalCell,algorithm='Dijkstra')=>{
    const g=M.grid(w,h,d,blocked,kind,entry,oneWay),start=g.node(...startCell),goal=g.node(...goalCell);
    const r=M.search(g.edges,start,goal,algorithm,(n,end)=>Math.hypot(...g.points[n].map((v,i)=>v-g.points[end][i])));
    cases.push({name,g,start,goal,algorithm,r,grid:{w,h,d,blocked,kind,entry,oneWay},heuristic:g.points.map(p=>Math.hypot(...p.map((v,i)=>v-g.points[goal][i])))});
  };
  for(const blocked of [[],[1]]) addGrid(`corridor-${blocked.length}`,3,1,1,blocked,'N6',{},false,[0,0,0],[2,0,0]);
  for(const kind of ['N6','N18','N26']) addGrid(`diagonal-${kind}`,2,1,2,[1,2],kind,{},false,[0,0,0],[1,0,1]);
  for(let penalty=1;penalty<=9;penalty++) for(const oneWay of [false,true]) for(const reverse of [false,true]) {
    addGrid(`policy-${penalty}-${oneWay}-${reverse}`,3,1,2,[],'N6',{1:penalty},oneWay,reverse?[2,0,0]:[0,0,0],reverse?[0,0,0]:[2,0,0]);
  }
  for(const [name,scene] of Object.entries(M.presets)) for(const kind of ['N6','N18']) for(const algorithm of ['BFS','Dijkstra','A*']) {
    addGrid(`${name}-${kind}-${algorithm}`,7,1,5,scene.blocked,kind,scene.entry,false,[scene.start%7,0,Math.floor(scene.start/7)],[scene.goal%7,0,Math.floor(scene.goal/7)],algorithm);
  }
  for(let h=0;h<=12;h++) for(const algorithm of ['BFS','Dijkstra','A*']) {
    const g={edges:M.triangle()},r=M.search(g.edges,0,2,algorithm,node=>node===1?h:0);
    cases.push({name:`triangle-${h}-${algorithm}`,g,start:0,goal:2,algorithm,r,heuristic:[0,h,0]});
  }
  for(const both of [false,true]) for(const reverse of [false,true]) {
    const g={edges:(both?[[1],[0,2],[1]]:[[1],[2],[]]).map(row=>row.map(to=>({to,cost:1})))},start=reverse?2:0,goal=reverse?0:2;
    cases.push({name:`directed-${both}-${reverse}`,g,start,goal,algorithm:'BFS',r:M.search(g.edges,start,goal,'BFS'),heuristic:[0,0,0]});
  }
  return cases;
}

const array=values=>`{${values.join(',')}}`;
const matrix=rows=>array(rows.map(array));
export function javaDiagramOracle(M) {
  const cases=diagramCases(M);
  const methods=cases.map((test,i)=>{
    const rows=matrix(test.g.edges.map(row=>row.map(edge=>edge.to))),costs=matrix(test.g.edges.map(row=>row.map(edge=>edge.cost)));
    const input=test.grid;
    const graph=input?`grid(${input.w},${input.h},${input.d},new int[]${array(input.blocked)},GridNeighborhood3.${input.kind},new int[]${array(Object.keys(input.entry))},new double[]${array(Object.values(input.entry))},${input.oneWay})`:`new WeightedAdjacencyIntGraph(new int[][]${rows},new double[][]${costs})`;
    const solver=test.algorithm==='A*'?`new AStarPathfinder(g, (node, goal) -> estimates[node])`:`new ${test.algorithm==='BFS'?'Bfs':'Dijkstra'}Pathfinder(g)`;
    return `static void scenario${i}() {
      WeightedIntGraph g=${graph};
      verifyEdges(g,new int[][]${rows},new double[][]${costs});
      double[] estimates=new double[]${array(test.heuristic)};
      var r=${solver}.findPath(${test.start},${test.goal});
      if (r.status()!=PathStatus.${test.r.status}) throw new AssertionError("${test.name}: status");
      ${test.r.cost===null?'':`near(r.path().totalCost(),${test.r.cost},"${test.name}");`}
    }`;
  }).join('\n');
  return `import nsk.nu.ashcore.api.math.*;
import nsk.nu.ashgrid.implementation.grid.indexing.SquareXZChunkScheme;
import nsk.nu.ashnav.api.graph.*;
import nsk.nu.ashnav.api.grid.*;
import nsk.nu.ashnav.api.path.*;
import nsk.nu.ashnav.implementation.graph.*;
import nsk.nu.ashnav.implementation.grid.*;
import nsk.nu.ashnav.implementation.path.*;
import nsk.nu.ashspace.api.grid.GridSpaceMapper3;
import nsk.nu.ashspace.api.frame.*;
import nsk.nu.ashspace.api.transform.RigidTransform3;
public final class WikiDiagramOracle {
  static void near(double actual,double expected,String label) {
    if(!Double.isFinite(actual)||Math.abs(actual-expected)>1e-10) throw new AssertionError(label+": "+actual+" != "+expected);
  }
  static WeightedIntGraph grid(int w,int h,int d,int[] blocked,GridNeighborhood3 kind,int[] expensive,double[] costs,boolean oneWay) {
    IntArrayGrid3i cells=new IntArrayGrid3i(w,h,d);
    for(int z=0;z<d;z++)for(int y=0;y<h;y++)for(int x=0;x<w;x++)cells.set(x,y,z,1);
    for(int i:blocked)cells.set(i%w,(i/w)%h,i/(w*h),0);
    GridWalkabilityGraph3 nodes=new GridWalkabilityGraph3(cells,v->v==1,kind);
    return new PolicyWeightedIntGraph(nodes,
      (from,to)->!oneWay||nodes.cellOfNode(to).x()>=nodes.cellOfNode(from).x(),
      (from,to,base)->{var p=nodes.cellOfNode(to);int index=p.x()+w*(p.y()+h*p.z());for(int i=0;i<expensive.length;i++)if(expensive[i]==index)return costs[i];return base;});
  }
  static void verifyEdges(WeightedIntGraph g,int[][] neighbors,double[][] costs) {
    if(g.nodeCount()!=neighbors.length)throw new AssertionError("node count");
    for(int row=0;row<neighbors.length;row++) {
      int from=row;int[] index={0};
      g.forEachEdge(from,(to,cost)->{int j=index[0]++;if(to!=neighbors[from][j])throw new AssertionError("neighbor order");near(cost,costs[from][j],"edge cost");});
      if(index[0]!=neighbors[from].length)throw new AssertionError("edge count");
    }
  }
  ${methods}
  static void frame(double x,double degrees,double ex,double ey,double ez) {
    var g=new GridWalkabilityGraph3(new IntArrayGrid3i(3,1,1),v->true,GridNeighborhood3.N6);
    var frames=FrameGraph3.worldRoot();var vehicle=new FrameId("vehicle");
    frames.define(vehicle,frames.root(),RigidTransform3.translation(10,0,20));
    var mapper=new GridSpaceMapper3(1,Vector3.ZERO,new SquareXZChunkScheme(16));
    var old=new FrameMappedGridNavigator3(g,mapper,frames,vehicle);
    var rotation=Quaternion.fromAxisAngle(new Vector3(0,1,0),Math.toRadians(degrees));
    frames.define(vehicle,frames.root(),new RigidTransform3(rotation,new Vector3(x,0,20)));
    near(old.worldCenterOfNode(0).x(),10.5,"old capture");
    var fresh=new FrameMappedGridNavigator3(g,mapper,frames,vehicle);
    var p=fresh.worldCenterOfNode(0);near(p.x(),ex,"frame X");near(p.y(),ey,"frame Y");near(p.z(),ez,"frame Z");
    if(fresh.nodeOfWorldPoint(p)!=0)throw new AssertionError("center lookup");
    near(new DijkstraPathfinder(g).findPath(0,2).path().totalCost(),2,"frame cost");
  }
  public static void main(String[] args) {
    ${cases.map((_,i)=>`scenario${i}();`).join('\n    ')}
    ${[8,10,14].flatMap(x=>[-90,-45,0,45,90].map(yaw=>`frame(${x},${yaw},${M.transform([.5,.5,.5],{x,z:20,yaw}).join(',')});`)).join('\n    ')}
    System.out.println("PASS ${cases.length} visualization search scenarios, full adjacency/weight parity, and 15 frame captures against Java.");
  }
}`;
}
