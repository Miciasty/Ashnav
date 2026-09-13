/* Interactive illustrations of finite inputs, not a browser port of Ashnav. */
(() => {
  'use strict';
  const M=window.ASHNAV_MODELS;
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=value=>Number.isInteger(value)?String(value):Number(value.toFixed(3)).toString();
  const vector=p=>`(${p.map(fmt).join(', ')})`;
  const text=(x,y,value,cls='')=>`<text x="${x}" y="${y}" text-anchor="middle" class="${cls}">${esc(value)}</text>`;
  const button=(action,label)=>`<button type="button" data-action="${action}">${label}</button>`;
  const select=(key,label,options,value)=>`<label>${label}<select data-key="${key}">${options.map(option=>{
    const [v,t]=Array.isArray(option)?option:[option,option];
    return `<option value="${v}" ${String(v)===String(value)?'selected':''}>${t}</option>`;
  }).join('')}</select></label>`;
  const range=(key,label,min,max,step,value)=>`<label>${label} <output data-value="${key}">${value}</output><input aria-label="${label}" data-key="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;
  const check=(key,label,checked=false)=>`<label class="lab-check"><input data-key="${key}" type="checkbox" ${checked?'checked':''}>${label}</label>`;
  const number=(host,key)=>Number(host.querySelector(`[data-key="${key}"]`).value);
  const value=(host,key)=>host.querySelector(`[data-key="${key}"]`).value;
  const checked=(host,key)=>host.querySelector(`[data-key="${key}"]`).checked;
  const set=(host,key,v)=>{const input=host.querySelector(`[data-key="${key}"]`); if(input.type==='checkbox') input.checked=v; else input.value=v;};
  function shell(host,title,prompt,controls,caption) {
    host.innerHTML=`<figure class="nav-lab diagram-component"><div class="lab-heading"><span class="lab-eyebrow">Interactive example</span><h3>${title}</h3><p>${prompt}</p></div><div class="lab-controls">${controls}${button('reset','Reset')}</div><div class="lab-stage"><svg viewBox="0 0 600 290" role="img" aria-label="${title}"></svg></div><div class="lab-results" role="status" aria-live="polite" aria-atomic="true"></div><div class="lab-detail"></div><figcaption>${caption} This finite browser illustration does not execute Java; the Java examples on this page use Ashnav.</figcaption></figure>`;
  }
  function display(host,svg,stats,detail) {
    host.querySelector('svg').innerHTML=svg;
    host.querySelector('.lab-results').innerHTML=stats.map(([label,value])=>`<div><span>${label}</span><strong>${esc(value)}</strong></div>`).join('');
    host.querySelector('.lab-detail').innerHTML=detail;
    for(const output of host.querySelectorAll('[data-value]')) output.textContent=value(host,output.dataset.value);
  }
  function bind(host,render,actions={}) {
    host.addEventListener('input',render);
    host.addEventListener('click',event=>{
      const action=event.target.closest('[data-action]')?.dataset.action;
      if(actions[action]) {actions[action](); render();}
    });
    render();
  }
  const resultStats=r=>[['Result',r.status],['totalCost',r.cost===null?'—':fmt(r.cost)],['Path',r.path.length?r.path.join(' → '):'No route']];
  const poly=(points,cls)=>`<polygon points="${points.map(p=>p.join(',')).join(' ')}" class="${cls}"/>`;
  const line=(a,b,cls='lab-edge')=>`<path d="M${a.join(',')} L${b.join(',')}" class="${cls}"/>`;
  function cube(x,y,w,label,cls='',height=24) {
    const top=[[x,y],[x+w,y-w*.45],[x+2*w,y],[x+w,y+w*.45]];
    return `<g class="lab-cube ${cls}">${poly([top[0],top[3],[x+w,y+w*.45+height],[x,y+height]],'cube-side')}${poly([top[3],top[2],[x+2*w,y+height],[x+w,y+w*.45+height]],'cube-side')}${poly(top,'cube-top')}${text(x+w,y+5,label)}</g>`;
  }
  function floorGrid(g,r,{entry={},start=0,goal=2,expanded=[],showRoute=true,oneWay=false}={}) {
    const w=Math.min(138,480/g.width), left=(600-w*g.width)/2, top=44;
    const center=id=>{const p=g.points[id]; return [left+(p[0]+.5)*w,top+(p[2]+.5)*w];};
    let svg='';
    for(let z=0;z<g.depth;z++) for(let x=0;x<g.width;x++) {
      const node=g.node(x,0,z), index=x+g.width*z, px=left+x*w, py=top+z*w;
      const state=node<0?'is-blocked':node===start?'is-start':node===goal?'is-goal':entry[index]?'is-expensive':expanded.includes(node)?'is-expanded':'';
      svg+=`<g class="lab-tile ${state}"><rect x="${px+4}" y="${py+4}" width="${w-8}" height="${w-8}" rx="7"/>${text(px+w/2,py+w*.43,node<0?'×':`node ${node}`)}${text(px+w/2,py+w*.7,node===start?'START':node===goal?'GOAL':entry[index]?`entry ${entry[index]}`:`(${x},0,${z})`,'lab-small')}</g>`;
    }
    if(showRoute && r.path.length>1) svg+=`<polyline points="${r.path.map(center).map(p=>p.join(',')).join(' ')}" class="lab-route"/>`;
    if(oneWay) svg+=text(300,top+w*g.depth+26,'X → only · Z ↕ both directions','lab-small');
    return svg;
  }

  function corridor(host) {
    shell(host,'From three cells to one route','Block the source cell, then rebuild the snapshot. Watch which node IDs survive.',
      check('blocked','Block middle source cell')+button('capture','Rebuild snapshot')+button('restart','Restart search')+button('step','Next expansion'),
      'An isometric view of the quick-start 3 × 1 × 1 corridor. Cell width is 2 world units. The cyan line joins cell centers. Search steps reveal processed nodes, not elapsed time. Reset restores the Java example.');
    let blocked=false,step=3;
    const render=()=>{
      const g=M.grid(3,1,1,blocked?[1]:[]),r=M.search(g.edges,0,g.node(2,0,0));
      const complete=step>=r.trace.length, seen=r.trace.slice(0,step);
      host.querySelector('svg').setAttribute('viewBox','0 0 600 350');
      let svg=text(300,28,'Grid snapshot · N6 · origin (−4, 8, 16)','lab-small');
      for(let x=2;x>=0;x--) {
        const id=g.node(x,0,0), cx=100+x*100;
        svg+=cube(cx,190-x*45,100,id<0?'blocked':`node ${id}`,id<0?'is-blocked':x===0?'is-start':x===2?'is-goal':seen.includes(id)?'is-expanded':'',30);
        svg+=text(cx+100,297,`X = ${-3+2*x}`,'lab-small');
      }
      if(complete && r.path.length) svg+=line([200,205],[400,115],'lab-route');
      svg+=text(200,324,'START','lab-start-label')+text(400,324,'GOAL','lab-goal-label');
      const pending=checked(host,'blocked')!==blocked;
      display(host,svg,[['Snapshot',blocked?'2 nodes':'3 nodes'],['Search',complete?r.status:`${step} / ${r.trace.length} expanded`],['Cost',complete&&r.cost!==null?`${r.cost} cell units`:'—']],
        `<p class="${pending?'lab-notice':''}">${pending?'Source changed. The current graph still uses its old snapshot. Click Rebuild snapshot.':blocked?'The blocked cell has no ID. The goal is now node 1, but no edge connects it to node 0.':'The path is [0, 1, 2]: two edges cost 2, while the centers are 4 world units apart.'}</p><pre>expanded: [${seen.join(', ')}]\npath: ${complete?`[${r.path.join(', ')}]`:'search in progress'}</pre>`);
      host.querySelector('[data-action="step"]').disabled=complete;
    };
    bind(host,render,{capture:()=>{blocked=checked(host,'blocked');step=0;},restart:()=>{step=0;},step:()=>{step++;},reset:()=>{blocked=false;step=3;set(host,'blocked',false);}});
  }

  function directed(host) {
    shell(host,'A door is not a return ticket','Inspect an outgoing row, reverse the query, then add the missing return edges.',
      select('node','Inspect node',[[0,'0 · Entrance'],[1,'1 · Hall'],[2,'2 · Exit']],0)+check('reverse','Query Exit → Entrance')+check('both','Add reverse edges'),
      'A schematic room graph. Arrows are permitted moves; screen positions and room names are application data. Reset matches the adjacency rows in the Java excerpt.');
    const render=()=>{
      const both=checked(host,'both'), reverse=checked(host,'reverse'), chosen=number(host,'node');
      const rows=both?[[1],[0,2],[1]]:[[1],[2],[]], edges=rows.map(row=>row.map(to=>({to,cost:1})));
      const r=M.search(edges,reverse?2:0,reverse?0:2,'BFS');
      let svg='';
      for(let i=0;i<2;i++) {
        svg+=line([135+i*175,125],[263+i*175,125],r.path.length?'lab-route':'lab-edge');
        svg+=text(208+i*175,111,'→','lab-arrow');
        if(both) svg+=text(208+i*175,157,'←','lab-arrow');
      }
      ['Entrance','Hall','Exit'].forEach((name,i)=>{
        const x=57+i*175;
        svg+=`<g class="lab-tile ${chosen===i?'is-selected':''}"><rect x="${x}" y="82" width="102" height="90" rx="12"/>${text(x+51,119,i)}${text(x+51,147,name,'lab-small')}</g>`;
        svg+=text(x+51,214,`[${rows[i].join(', ')}]`,'lab-mono');
      });
      svg+=text(300,258,'Outgoing rows · IDs stay 0, 1, 2','lab-small');
      display(host,svg,resultStats(r),`<pre>neighbors(${chosen}) = [${rows[chosen].join(', ')}]\nfindPath(${reverse?'2, 0':'0, 2'})</pre><p>${rows[chosen].length?`Node ${chosen} can leave through ${rows[chosen].length} directed edge${rows[chosen].length===1?'':'s'}.`:'An empty row means no outgoing moves, even when another node can reach this room.'}</p>`);
    };
    bind(host,render,{reset:()=>{set(host,'node',0);set(host,'reverse',false);set(host,'both',false);}});
  }

  function neighborhood(host) {
    shell(host,'Which neighbors exist in 3D?','Compare face, edge, and corner moves. Separate the layers to see cells hidden behind the center.',
      select('kind','Neighborhood',['N6','N18','N26'],'N6')+select('layer','Visible Y layers',[['all','All · exploded'],[-1,'Y = −1'],[0,'Y = 0'],[1,'Y = +1']],'all'),
      'Three isometric XZ slices, separated along Y for readability. C is (0,0,0). Labels give offset length and edge cost, not IDs. Every candidate cell is walkable. Layer selection changes the view only.');
    const render=()=>{
      const kind=value(host,'kind'), offsets=M.offsets(kind), layer=value(host,'layer'), layers=layer==='all'?[-1,0,1]:[Number(layer)];
      let svg='';
      layers.forEach((y,i)=>{
        const base=layers.length===1?171:15+i*198, w=layers.length===1?43:30;
        svg+=text(base+3*w,36,`Y = ${y>0?'+':''}${y}`,'lab-mono');
        for(let z=-1;z<=1;z++) for(let x=-1;x<=1;x++) {
          const active=offsets.some(p=>p[0]===x&&p[1]===y&&p[2]===z), center=x===0&&y===0&&z===0;
          const axes=Math.abs(x)+Math.abs(y)+Math.abs(z);
          svg+=cube(base+(x-z+2)*w,94+(x+z+2)*w*.45,w-2,center?'C':active?['','1','√2','√3'][axes]:'·',center?'is-start':active?axes===1?'is-expanded':axes===2?'is-edge-neighbor':'is-corner-neighbor':'is-muted',10);
        }
        svg+=text(base+3*w,245,'X ↘   Z ↙','lab-small');
      });
      display(host,svg,[['Neighbors',offsets.length],['Face · cost 1',6],['Edge · cost √2',kind==='N6'?0:12],['Corner · cost √3',kind==='N26'?8:0]],
        `<p>${kind==='N6'?'N6 keeps moves on one axis.':kind==='N18'?'N18 adds moves along two axes at once.':'N26 also permits moves along all three axes at once.'} Connectivity tests endpoints only; the diagonal example below shows why this matters near obstacles.</p>`);
    };
    bind(host,render,{reset:()=>{set(host,'kind','N6');set(host,'layer','all');}});
  }

  function policy(host) {
    shell(host,'The shorter corridor can cost more','Raise the entry cost of node 1. Then reverse the query while the one-way rule is enabled.',
      range('penalty','Entry cost of node 1',1,9,1,5)+check('oneway','Forbid decreasing X',true)+check('reverse','Reverse start and goal'),
      'Top-down XZ cells at Y = 0. Cyan is the chosen Dijkstra route; amber marks the cell whose entry cost you control. The policy replaces the entry cost and preserves IDs. Reset matches the cost-4 detour in the Java example.');
    const render=()=>{
      const penalty=number(host,'penalty'), oneWay=checked(host,'oneway'), reverse=checked(host,'reverse');
      const g=M.grid(3,1,2,[],'N6',{1:penalty},oneWay), start=reverse?2:0, goal=reverse?0:2, r=M.search(g.edges,start,goal);
      host.querySelector('svg').setAttribute('viewBox','0 0 600 380');
      display(host,floorGrid(g,r,{entry:{1:penalty},start,goal,oneWay}),resultStats(r),
        `<pre>accept: ${oneWay?'to.x >= from.x':'true'}\ncost: to == 1 ? ${penalty} : baseCost</pre><p>${reverse&&oneWay?'No route can return to X = 0: each step toward decreasing X is rejected.':`Direct route: ${penalty+1}. Detour: 4. ${penalty===3?'Both costs tie; this example uses the deterministic Dijkstra result.':'The search minimizes the sum of accepted edge costs.'}`}</p>`);
    };
    bind(host,render,{reset:()=>{set(host,'penalty',5);set(host,'oneway',true);set(host,'reverse',false);}});
  }

  function mapping(host) {
    shell(host,'Move a world point across a cell boundary','Drag any coordinate. The containing cell changes at its boundary, while the returned center stays fixed inside the cell.',
      range('x','World X',-5,3,.1,-3)+range('y','World Y',7,11,.1,9)+range('z','World Z',15,19,.1,17)+select('size','Cell size',[1,2],2)+button('boundary','Upper X boundary'),
      'An isometric world-space view with a separate X-axis section below. The point and dashed vertical projection use the selected world coordinates. Origin is (−4,8,16). Coordinates are world units. Inputs cover ordinary finite values; see numeric limits below.');
    const render=()=>{
      const p=['x','y','z'].map(k=>number(host,k)), size=number(host,'size'), origin=[-4,8,16], c=p.map((n,i)=>M.cell(n,origin[i],size));
      const node=c[0]>=0&&c[0]<3&&c[1]===0&&c[2]===0?c[0]:-1, project=x=>68+(x+5)*56;
      host.querySelector('svg').setAttribute('viewBox','0 0 600 460');
      const project3=([x,y,z])=>[190+40*(x+4)-24*(z-16),150+12*(x+4)+20*(z-16)-35*(y-8)];
      let svg=text(300,26,`World point ${vector(p)}`,'lab-mono');
      for(let i=0;i<3;i++) {
        const x=-4+i*size;
        const bottom=[[x,8,16],[x+size,8,16],[x+size,8,16+size],[x,8,16+size]].map(project3);
        const top=[[x,8+size,16],[x+size,8+size,16],[x+size,8+size,16+size],[x,8+size,16+size]].map(project3);
        const center=project3([x+size/2,8+size,16+size/2]);
        svg+=`<g class="lab-cube ${node===i?'is-expanded':''}">${poly([bottom[1],bottom[2],top[2],top[1]],'cube-side')}${poly([bottom[2],bottom[3],top[3],top[2]],'cube-side')}${poly(top,'cube-top')}${text(center[0],center[1]+5,`node ${i}`,'lab-small')}</g>`;
      }
      const dot=project3(p),ground=project3([p[0],8,p[2]]),o=[80,205];
      svg+=line(dot,ground,'lab-projection')+`<circle cx="${dot[0]}" cy="${dot[1]}" r="10" class="lab-point" opacity=".16"/><circle cx="${dot[0]}" cy="${dot[1]}" r="5" class="lab-point"/>`;
      for(const [end,label,cls] of [[[120,217],'X','lab-axis-x'],[[80,170],'Y','lab-axis-y'],[[56,225],'Z','lab-axis-z']]) {
        svg+=line(o,end,cls)+text(end[0],end[1]-9,label,'lab-small');
      }
      svg+=text(300,340,'X-axis section · cells include their minimum edge','lab-small');
      for(let i=0;i<3;i++) {
        const x=project(-4+i*size), width=56*size;
        svg+=`<g class="lab-tile ${node===i?'is-selected':''}"><rect x="${x}" y="358" width="${width}" height="37"/>${text(x+width/2,382,i)}</g>`;
        svg+=text(x,418,-4+i*size,'lab-small');
      }
      svg+=text(project(-4+3*size),418,-4+3*size,'lab-small');
      svg+=`<circle cx="${project(p[0])}" cy="350" r="4" class="lab-point"/>`+line([project(p[0]),350],[project(p[0]),358],'lab-projection');
      svg+=text(300,448,`Y: [8, ${8+size}) → ${c[1]===0?'inside':'outside'}     Z: [16, ${16+size}) → ${c[2]===0?'inside':'outside'}`,'lab-mono');
      display(host,svg,[['Cell',vector(c)],['Node ID',node],['Returned center',node<0?'No node':vector([-4+(node+.5)*size,8+size/2,16+size/2])]],
        `<pre>${p.map((n,i)=>`${'XYZ'[i]}: floor((${fmt(n)} − (${origin[i]})) / ${size}) = ${c[i]}`).join('\n')}</pre><p>${node<0?'At least one axis is outside the grid. The navigator returns UNREACHABLE without starting a search.':'The cyan dot is your input point. The highlighted cell keeps the same returned center until you cross a boundary.'} An N6 edge still costs 1 at either cell size.</p>`);
    };
    bind(host,render,{boundary:()=>set(host,'x',-4+3*number(host,'size')),reset:()=>{set(host,'x',-3);set(host,'y',9);set(host,'z',17);set(host,'size',2);}});
  }

  function frames(host) {
    shell(host,'Move the platform; keep the captured frame','Rotate or translate the live platform. Recreate the navigator to bring its captured coordinates up to date.',
      range('x','Live translation X',8,14,.5,10)+range('yaw','Live Y rotation (degrees)',-90,90,15,0)+button('capture','Recreate navigator')+select('camera','Camera view',[['iso','Isometric'],['top','Top-down XZ']],'iso'),
      'Three unit cells along local X, with translation Z = 20 and Y = 0. Solid cells use the captured transform; the dashed outline is the live frame. Camera controls change only the projection. Reset matches the translation-only Java example.');
    let captured={x:10,z:20,yaw:0};
    const render=()=>{
      const live={x:number(host,'x'),z:20,yaw:number(host,'yaw')}, top=value(host,'camera')==='top';
      host.querySelector('svg').setAttribute('viewBox','0 0 600 360');
      const project=p=>top?[80+(p[0]-8)*47,180+(p[2]-20)*30]:[180+(p[0]-10)*43-(p[2]-20)*25,180+(p[0]-10)*13+(p[2]-20)*20-p[1]*35];
      const corners=x=>[[x,0,0],[x+1,0,0],[x+1,0,1],[x,0,1]];
      let svg='';
      for(let i=0;i<3;i++) {
        const base=corners(i).map(p=>project(M.transform(p,captured)));
        const lid=corners(i).map(p=>project(M.transform([p[0],1,p[2]],captured)));
        svg+=`<g class="lab-cube ${i===0?'is-start':i===2?'is-goal':''}">${poly([base[0],base[1],lid[1],lid[0]],'cube-side')}${poly([base[1],base[2],lid[2],lid[1]],'cube-side')}${poly(lid,'cube-top')}${text(...project(M.transform([i+.5,1,.5],captured)),i)}</g>`;
      }
      svg+=poly([[0,1.06,0],[3,1.06,0],[3,1.06,1],[0,1.06,1]].map(p=>project(M.transform(p,live))),'lab-live-frame');
      const o=project(M.transform([0,0,0],captured));
      for(const [p,label,cls] of [[[4,0,0],'local X','lab-axis-x'],[[0,2,0],'Y ↑','lab-axis-y'],[[0,0,2],'local Z','lab-axis-z']]) {
        if(top && label==='Y ↑') continue;
        const end=project(M.transform(p,captured)); svg+=line(o,end,cls)+text(end[0],end[1]+18,label,'lab-small');
      }
      svg+=text(300,27,'Solid: captured grid · Dashed: live frame','lab-small');
      const center=M.transform([.5,.5,.5],captured),liveCenter=M.transform([.5,.5,.5],live),local=M.inverse(liveCenter,captured),c=local.map(n=>M.cell(n,0,1));
      const node=c[0]>=0&&c[0]<3&&c[1]===0&&c[2]===0?c[0]:-1;
      const changed=live.x!==captured.x||live.yaw!==captured.yaw;
      display(host,svg,[['Captured node 0 center',vector(center)],['Live node 0 center',vector(liveCenter)],['Route cost',2]],
        `<div class="lab-legend"><span class="legend-captured">Captured</span><span class="legend-live">Live</span></div><p class="${changed?'lab-notice':''}">${changed?'The frame has moved. The old navigator still uses its captured pose.':'The navigator and live frame agree.'}</p><pre>captured pose: translation (${captured.x}, 0, 20), Y rotation ${captured.yaw}°\noldNavigator.nodeOfWorldPoint(liveCenter) → ${node}\nlocal path: [0, 1, 2] · cost: 2</pre>`);
    };
    bind(host,render,{capture:()=>{captured={x:number(host,'x'),z:20,yaw:number(host,'yaw')};},reset:()=>{captured={x:10,z:20,yaw:0};set(host,'x',10);set(host,'yaw',0);set(host,'camera','iso');}});
  }

  function solvers(host) {
    shell(host,'One crossing or two cheaper moves?','Choose an objective, then test what happens when A* overestimates the remaining cost at A.',
      select('solver','Highlighted solver',['BFS','Dijkstra','A*'],'Dijkstra')+range('estimate','A* estimate h(A)',0,12,1,0),
      'A schematic directed network: S=0, A=1, G=2. Distances on screen do not define weights. A* uses h(S)=h(G)=0 and the selected h(A). Reset matches the weighted Java example with a zero heuristic.');
    const render=()=>{
      const chosen=value(host,'solver'), h=number(host,'estimate'), edges=M.triangle();
      const results=['BFS','Dijkstra','A*'].map(algorithm=>({algorithm,...M.search(edges,0,2,algorithm,node=>node===1?h:0)})), r=results.find(r=>r.algorithm===chosen);
      const positions=[[95,185],[300,69],[505,185]];
      let svg='';
      for(const [a,b,cost] of [[0,2,10],[0,1,1],[1,2,1]]) {
        const on=r.path.some((node,i)=>node===a&&r.path[i+1]===b);
        svg+=line(positions[a],positions[b],on?'lab-route':'lab-edge');
        const mid=positions[a].map((p,i)=>(p+positions[b][i])/2);
        svg+=text(mid[0],mid[1]+(a===0&&b===2?35:-13),`${cost} →`,'lab-edge-label');
      }
      ['S · 0','A · 1','G · 2'].forEach((name,i)=>{const p=positions[i];svg+=`<g class="lab-tile ${i===0?'is-start':i===2?'is-goal':''}"><circle cx="${p[0]}" cy="${p[1]}" r="33"/>${text(p[0],p[1]+5,name)}</g>`;});
      svg+=text(300,268,`${chosen} chooses ${r.path.join(' → ')}`,'lab-mono');
      display(host,svg,results.map(r=>[r.algorithm,`totalCost ${r.cost} · ${r.path.length-1} edge${r.path.length===2?'':'s'}`]),
        `<p class="${h>1?'lab-notice':''}">${h<=1?'h(A) is a valid lower bound: the cheapest remaining cost from A is 1.':`h(A) = ${h} exceeds the real remaining cost 1. ${results[2].cost===10?'A* now returns the cost-10 crossing and misses the cheaper route.':'This run still finds cost 2, but the optimality guarantee no longer applies.'}`}</p><pre>${chosen}: path [${r.path.join(', ')}]\nreported totalCost = ${r.cost}; sum of supplied weights = ${r.weight}\nprocessed nodes: [${r.trace.join(', ')}]</pre><p>BFS reports an edge count. The other two report a sum of weights.</p>`);
    };
    bind(host,render,{reset:()=>{set(host,'solver','Dijkstra');set(host,'estimate',0);}});
  }

  function playground(host) {
    shell(host,'Design a route through a small warehouse','Select a brush and edit cells. Compare the route and explored nodes, then copy the corresponding Java graph.',
      select('preset','Scene',[['warehouse','Warehouse'],['open','Open floor'],['sealed','Sealed wall']],'warehouse')+select('brush','Cell brush',[['wall','Wall / clear'],['cost','Entry cost 5 / 1'],['start','Place start'],['goal','Place goal']],'wall')+select('solver','Pathfinder',['BFS','Dijkstra','A*'],'Dijkstra')+select('kind','Neighborhood',['N6','N18'],'N6')+button('restart','Restart search')+button('step','Next expansion')+button('finish','Show result'),
      'Editable 7 × 1 × 5 grid, viewed from above: X runs right and Z down. Every edit builds a fresh graph. N18 permits diagonals through blocked corners; it does not model clearance. A* uses Euclidean cell distance, a lower bound for these costs. Search steps reveal processed nodes; ties may produce other equally good paths.');
    const stage=host.querySelector('.lab-stage');
    stage.innerHTML='<div class="lab-board-wrap"><div class="lab-board" role="group" aria-label="Warehouse cells; each button gives coordinates and node ID"></div><svg class="lab-board-route" viewBox="0 0 700 500" preserveAspectRatio="none" role="img" aria-label="Route connecting the selected cell centers"></svg></div><div class="lab-legend"><span class="legend-start">S · Start</span><span class="legend-goal">G · Goal</span><span class="legend-route">Route</span><span class="legend-expanded">Explored</span><span>× Wall · 5 Entry cost</span></div>';
    let scene=structuredClone(M.presets.warehouse),preset='warehouse',step=Infinity,source='';
    const render=()=>{
      if(value(host,'preset')!==preset) {preset=value(host,'preset');scene=structuredClone(M.presets[preset]);step=Infinity;}
      const g=M.grid(7,1,5,scene.blocked,value(host,'kind'),scene.entry);
      const start=g.node(scene.start%7,0,Math.floor(scene.start/7)),goal=g.node(scene.goal%7,0,Math.floor(scene.goal/7));
      const algorithm=value(host,'solver'),r=M.search(g.edges,start,goal,algorithm,(n,end)=>Math.hypot(...g.points[n].map((v,i)=>v-g.points[end][i])));
      const complete=step>=r.trace.length, seen=r.trace.slice(0,step),board=host.querySelector('.lab-board');
      if(!board.children.length) board.innerHTML=Array.from({length:35},(_,i)=>`<button type="button" data-cell="${i}"></button>`).join('');
      for(const tile of board.children) {
        const index=Number(tile.dataset.cell),x=index%7,z=Math.floor(index/7),node=g.node(x,0,z);
        const blocked=node<0, isStart=index===scene.start,isGoal=index===scene.goal,onRoute=complete&&r.path.includes(node);
        tile.className=`lab-cell ${blocked?'is-blocked':isStart?'is-start':isGoal?'is-goal':onRoute?'is-route':scene.entry[index]?'is-expensive':seen.includes(node)?'is-expanded':''}`;
        tile.innerHTML=`<strong>${isStart?'S':isGoal?'G':blocked?'×':scene.entry[index]?'5':'·'}</strong><span>${blocked?'—':node}</span>`;
        tile.setAttribute('aria-label',`Cell (${x}, 0, ${z}), ${blocked?'blocked':`node ${node}`}${isStart?', start':isGoal?', goal':''}, ${onRoute?'on route, ':''}entry cost ${scene.entry[index]||'base'}`);
      }
      host.querySelector('.lab-results').innerHTML=[['Status',complete?r.status:`${step} / ${r.trace.length} expanded`],['Nodes',g.points.length],['totalCost',complete&&r.cost!==null?fmt(r.cost):'—'],['Expanded',seen.length]].map(([label,value])=>`<div><span>${label}</span><strong>${value}</strong></div>`).join('');
      host.querySelector('.lab-board-route').innerHTML=complete?`<polyline points="${r.path.map(node=>{const p=g.points[node];return `${(p[0]+.5)*100},${(p[2]+.5)*100}`;}).join(' ')}" class="lab-route"/>`:'';
      source=M.javaGraph(g,start,goal,algorithm);
      const detail=host.querySelector('.lab-detail');
      if(!detail.children.length) detail.innerHTML='<p class="lab-board-reading" role="status" aria-live="polite"></p><details><summary>WarehouseRoute.java · current scene</summary><button type="button" data-action="copy">Copy Java</button><pre class="lab-source"></pre></details>';
      detail.querySelector('.lab-board-reading').textContent=`${complete?'Path: '+(r.path.length?r.path.join(' → '):'no route'):'Search in progress.'} Numbers below the symbols are node IDs; edits may renumber them.`;
      detail.querySelector('.lab-source').textContent=source;
      detail.querySelector('[data-action="copy"]').textContent='Copy Java';
      host.querySelector('[data-action="step"]').disabled=complete;
    };
    host.addEventListener('click',event=>{
      const tile=event.target.closest('[data-cell]');
      if(!tile) return;
      const index=Number(tile.dataset.cell),brush=value(host,'brush');
      if(brush==='start'||brush==='goal') {
        if(index===scene[brush==='start'?'goal':'start']) return;
        scene[brush]=index;scene.blocked=scene.blocked.filter(i=>i!==index);
      } else if(index!==scene.start&&index!==scene.goal) {
        if(brush==='wall') scene.blocked=scene.blocked.includes(index)?scene.blocked.filter(i=>i!==index):[...scene.blocked,index];
        else {scene.blocked=scene.blocked.filter(i=>i!==index);if(scene.entry[index])delete scene.entry[index];else scene.entry[index]=5;}
      }
      step=Infinity;render();
    });
    host.addEventListener('input',event=>{if(['solver','kind'].includes(event.target.dataset.key))step=Infinity;});
    bind(host,render,{restart:()=>{step=0;},step:()=>{step++;},finish:()=>{step=Infinity;},reset:()=>{scene=structuredClone(M.presets.warehouse);preset='warehouse';step=Infinity;set(host,'preset','warehouse');set(host,'brush','wall');set(host,'solver','Dijkstra');set(host,'kind','N6');},copy:()=>{
      navigator.clipboard.writeText(source).then(()=>{const b=host.querySelector('[data-action="copy"]');if(b)b.textContent='Copied';}).catch(()=>{const b=host.querySelector('[data-action="copy"]');if(b)b.textContent='Select the code to copy';});
    }});
  }
  const renderers={'corridor':corridor,'directed-graph':directed,'neighborhood':neighborhood,'policy-detour':policy,'world-mapping':mapping,'frame-capture':frames,'solver-comparison':solvers,'route-playground':playground};
  window.WikiDiagrams={mount(root){for(const host of root.querySelectorAll('[data-diagram]'))renderers[host.dataset.diagram]?.(host);return ()=>{};}};
})();
