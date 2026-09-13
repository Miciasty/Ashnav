/* Finite surface-navigation example. The application supplies terrain and step rules. */
(() => {
  'use strict';
  const size=16, volumeHeight=9;
  const startCell=[12,1,13], goalCell=[4,6,4];
  const crates=[[10,10],[11,10],[12,10],[10,9],[7,12],[7,13],[7,14],[12,5],[13,5],[13,6],[2,8],[2,9],[2,10]];
  const barriers={
    south:{label:'South stairs blocked',cells:[[4,10],[5,10]]},
    east:{label:'East stairs blocked',cells:[[10,4],[10,5]]},
    parked:{label:'Barrier parked',cells:[[13,7],[13,8]]}
  };
  function terrain() {
    const heights=Array(size*size).fill(1);
    for(let z=3;z<=6;z++)for(let x=3;x<=6;x++)heights[x+size*z]=6;
    for(let step=0;step<4;step++)for(let lane=4;lane<=5;lane++) {
      heights[lane+size*(7+step)]=5-step;
      heights[(7+step)+size*lane]=5-step;
    }
    return heights;
  }
  function build(position='south',maxStep=1) {
    if(!barriers[position]||![0,1].includes(maxStep))throw new Error('Invalid tower scene input');
    const M=window.ASHNAV_MODELS,heights=terrain();
    const obstacles=new Set([...crates,...barriers[position].cells].map(([x,z])=>x+size*z));
    const moving=new Set(barriers[position].cells.map(([x,z])=>x+size*z));
    const solidHeight=heights.map((y,i)=>y+(obstacles.has(i)?3:0));
    const solid=(x,y,z)=>x>=0&&x<size&&z>=0&&z<size&&y>=0&&y<solidHeight[x+size*z];
    const blocked=[];
    for(let z=0;z<size;z++)for(let y=0;y<volumeHeight;y++)for(let x=0;x<size;x++) {
      // Only terrain surfaces become nodes; obstacle roofs are excluded.
      if(y!==heights[x+size*z]||solid(x,y,z)||solid(x,y+1,z)||!solid(x,y-1,z)) blocked.push(x+size*(y+volumeHeight*z));
    }
    const g=M.grid(size,volumeHeight,size,blocked,'N18');
    g.edges=g.edges.map((row,from)=>row.filter(({to})=>{
      const a=g.points[from],b=g.points[to];
      return Math.abs(a[0]-b[0])+Math.abs(a[2]-b[2])===1&&Math.abs(a[1]-b[1])<=maxStep;
    }));
    const start=g.node(...startCell),goal=g.node(...goalCell);
    return {g,start,goal,heights,solidHeight,obstacles,moving,position,maxStep,solid};
  }
  function find(scene,algorithm='A*') {
    const {g,start,goal}=scene;
    const result=window.ASHNAV_MODELS.search(g.edges,start,goal,algorithm,(node,end)=>{
      const a=g.points[node],b=g.points[end];
      return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
    });
    const points=result.path.map(node=>[...g.points[node]]);
    const ascent=points.slice(1).reduce((sum,p,i)=>sum+Math.max(0,p[1]-points[i][1]),0);
    return {...result,points,ascent};
  }
  window.ASHNAV_TOWER={size,volumeHeight,startCell,goalCell,crates,barriers,terrain,build,find};
})();
