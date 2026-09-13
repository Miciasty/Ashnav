/* Orthographic voxel scene: local SVG geometry, explicit model captures, no runtime dependencies. */
(() => {
  'use strict';
  const T=window.ASHNAV_TOWER;
  const fmt=n=>Number(n.toFixed(3)).toString();
  let sequence=0;
  function geometry(scene) {
    const faces=[];
    const face=(points,material,normal)=>faces.push({points,material,normal});
    const height=(x,z)=>x<0||z<0||x>=16||z>=16?0:scene.solidHeight[x+16*z];
    for(let z=0;z<16;z++)for(let x=0;x<16;x++) {
      const i=x+16*z,top=height(x,z),base=scene.heights[i];
      const material=y=>y>=base?(scene.moving.has(i)?'barrier':'crate'):base>1?'structure':'floor';
      const topMaterial=scene.moving.has(i)?'barrier':scene.obstacles.has(i)?'crate':base>1?'structure':'floor';
      face([[x,top,z],[x+1,top,z],[x+1,top,z+1],[x,top,z+1]],topMaterial,[0,1,0]);
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        for(let y=height(x+dx,z+dz);y<top;y++) {
          const points=dx?[[x+(dx>0?1:0),y,z],[x+(dx>0?1:0),y+1,z],[x+(dx>0?1:0),y+1,z+1],[x+(dx>0?1:0),y,z+1]]:
            [[x,y,z+(dz>0?1:0)],[x,y+1,z+(dz>0?1:0)],[x+1,y+1,z+(dz>0?1:0)],[x+1,y,z+(dz>0?1:0)]];
          face(points,material(y),[dx,0,dz]);
        }
      }
    }
    return faces;
  }
  function mount(host) {
    const uid=`tower-${++sequence}`;
    host.innerHTML=`<figure class="nav-lab tower-lab diagram-component">
      <div class="lab-heading"><span class="lab-eyebrow">3D pathfinding · 16 × 16</span><h3>Find a way to the tower roof</h3><p>Two staircases reach the same roof. Move the barrier to close an entrance, then follow the new route as it climbs five blocks.</p></div>
      <div class="lab-controls tower-model-controls">
        <label>Barrier position<select data-tower="barrier"><option value="south">South stairs blocked</option><option value="east">East stairs blocked</option><option value="parked">Barrier parked</option></select></label>
        <label>Pathfinder<select data-tower="solver"><option>A*</option><option>Dijkstra</option><option>BFS</option></select></label>
        <label class="lab-check"><input type="checkbox" data-tower="steps" checked>Allow one-block steps</label>
        <div class="tower-actions"><button type="button" data-tower-action="move">Move barrier</button><button type="button" data-tower-action="animate" aria-pressed="false">Animate barrier</button><button type="button" data-tower-action="reset">Reset scene</button></div>
      </div>
      <div class="lab-stage tower-stage" tabindex="0" role="region" aria-label="3D tower scene. Arrow keys rotate the camera; Home resets the view.">
        <div class="tower-stage-heading"><span class="tower-capture">Snapshot 1</span><span class="tower-view-label">Orthographic 3D</span></div>
        <svg viewBox="0 0 840 610" role="img" aria-label="Path through a 16 by 16 voxel platform to the roof of a tower"></svg>
        <div class="tower-scene-hint">Drag to orbit · arrow keys rotate · Home resets the view</div>
      </div>
      <div class="tower-camera" aria-label="Camera controls">
        <span class="tower-control-title">Camera</span>
        <label>Rotation<input aria-label="Camera rotation" data-tower="yaw" type="range" min="-180" max="180" step="1" value="45"></label>
        <label>Elevation<input aria-label="Camera elevation" data-tower="pitch" type="range" min="15" max="70" step="1" value="32"></label>
        <label>Zoom<input aria-label="Camera zoom" data-tower="zoom" type="range" min="80" max="150" step="5" value="100"></label>
        <button type="button" data-tower-action="view">Reset view</button>
      </div>
      <div class="tower-legend"><span class="tower-key route">Current route</span><span class="tower-key start">S · start</span><span class="tower-key goal">G · roof</span><span class="tower-key crate">Collision blocks</span><span class="tower-key barrier">Moving barrier</span><label><input type="checkbox" data-tower="previous" checked>Previous route · dashed overlay</label></div>
      <div class="lab-results" role="status" aria-live="polite" aria-atomic="true"></div>
      <div class="tower-profile"><div class="tower-profile-heading"><strong>Route height</strong><span>Foot-cell Y · platform 1 → roof 6</span></div><div class="tower-height-bars" role="group" aria-label="Select a route step to inspect its height"></div><label class="tower-inspect">Inspect route step <output></output><input aria-label="Inspect route step" data-tower="inspect" type="range" min="0" max="0" value="0"></label><p class="tower-point-reading"></p></div>
      <div class="lab-detail"><p class="tower-explanation"></p><details><summary>Cell coordinates along this route</summary><pre class="tower-coordinates"></pre></details></div>
      <figcaption>Orthographic view of a 16 × 9 × 16 grid. The line joins foot-cell centers; it is not an entity animation. Barrier playback cycles through three discrete positions, captures a new graph, and searches again. The dashed previous route is only a comparison overlay. This browser model is checked against the runnable Java example below.</figcaption>
    </figure>`;
    const get=key=>host.querySelector(`[data-tower="${key}"]`),svg=host.querySelector('svg'),stage=host.querySelector('.tower-stage');
    let scene,result,faces,previous=[],revision=0,selected=0,timer=null,playing=false,disposed=false,drag=null;
    let camera={yaw:45,pitch:32,zoom:1};
    const resetView=()=>{camera={yaw:45,pitch:32,zoom:1};syncCamera();};
    const syncCamera=()=>{get('yaw').value=camera.yaw;get('pitch').value=camera.pitch;get('zoom').value=Math.round(camera.zoom*100);};
    function projectors() {
      const yaw=camera.yaw*Math.PI/180,pitch=camera.pitch*Math.PI/180,sy=Math.sin(yaw),cy=Math.cos(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch);
      const raw=([x,y,z])=>[(x-8)*cy-(z-8)*sy,((x-8)*sy+(z-8)*cy)*sp-y*cp];
      const depth=([x,y,z])=>((x-8)*sy+(z-8)*cy)*cp+y*sp;
      const points=faces.flatMap(face=>face.points.map(raw));
      const minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0])),minY=Math.min(...points.map(p=>p[1])),maxY=Math.max(...points.map(p=>p[1]));
      const scale=Math.min(744/(maxX-minX),474/(maxY-minY))*camera.zoom;
      const project=p=>{const r=raw(p);return [420+(r[0]-(minX+maxX)/2)*scale,322+(r[1]-(minY+maxY)/2)*scale];};
      return {project,depth,direction:[sy*cp,sp,cy*cp]};
    }
    const center=p=>[p[0]+.5,p[1]+.5,p[2]+.5];
    const polyline=points=>points.map(p=>p.map(n=>n.toFixed(2)).join(',')).join(' ');
    function draw() {
      if(disposed)return;
      const {project,depth,direction}=projectors(),items=[];
      const average=points=>points.reduce((sum,p)=>sum+depth(p),0)/points.length;
      for(const face of faces) {
        if(face.normal.reduce((sum,v,i)=>sum+v*direction[i],0)<.001)continue;
        const shade=face.normal[1]?'top':face.normal[0]?'side-x':'side-z';
        items.push({depth:average(face.points),html:`<polygon class="tower-voxel tower-${face.material} ${shade}" points="${polyline(face.points.map(project))}"/>`});
      }
      for(let i=1;i<result.points.length;i++) {
        const points=[center(result.points[i-1]),center(result.points[i])];
        const coords=polyline(points.map(project));
        items.push({depth:average(points)+.02,html:`<polyline class="tower-route-halo" points="${coords}"/><polyline class="tower-route-line" points="${coords}"/>`});
      }
      items.sort((a,b)=>a.depth-b.depth);
      let html=`<title>16 by 16 platform: ${result.status}, height gain ${result.ascent} blocks</title><defs><pattern id="${uid}-dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".65" fill="var(--border)"/></pattern></defs><rect width="840" height="610" fill="url(#${uid}-dots)"/><g>${items.map(item=>item.html).join('')}</g>`;
      if(get('previous').checked&&previous.length)html+=`<polyline class="tower-previous-line" points="${polyline(previous.map(p=>project(center(p))))}"/>`;
      for(const [point,label,kind] of [[T.startCell,'S','start'],[T.goalCell,'G','goal']]) {
        const base=project(center(point));
        html+=`<g class="tower-beacon ${kind}"><path d="M${base[0]} ${base[1]} v-26"/><circle cx="${base[0]}" cy="${base[1]}" r="5"/><rect x="${base[0]-17}" y="${base[1]-60}" width="34" height="34" rx="8"/><text x="${base[0]}" y="${base[1]-35}" text-anchor="middle">${label}</text></g>`;
      }
      if(result.points.length) {
        const point=result.points[selected],p=project(center(point));
        html+=`<circle class="tower-inspected-halo" cx="${p[0]}" cy="${p[1]}" r="11"/><circle class="tower-inspected" cx="${p[0]}" cy="${p[1]}" r="5"/>`;
      }
      const origin=[72,542],worldOrigin=project([0,0,0]);
      for(const [vector,label,cls] of [[[1,0,0],'X','x'],[[0,1,0],'Y','y'],[[0,0,1],'Z','z']]) {
        const projected=project(vector),dx=projected[0]-worldOrigin[0],dy=projected[1]-worldOrigin[1],length=Math.hypot(dx,dy)||1;
        const end=[origin[0]+dx/length*33,origin[1]+dy/length*33];
        html+=`<g class="tower-axis ${cls}"><path d="M${origin.join(',')} L${end.join(',')}"/><text x="${end[0]+dx/length*12}" y="${end[1]+dy/length*12+5}" text-anchor="middle">${label}</text></g>`;
      }
      svg.innerHTML=html;
      host.querySelector('.tower-capture').textContent=`Snapshot ${revision} · ${T.barriers[scene.position].label}`;
      host.querySelector('.tower-view-label').textContent=`${Math.round(camera.yaw)}° / ${Math.round(camera.pitch)}° · ${Math.round(camera.zoom*100)}%`;
    }
    function inspect(index) {
      selected=Math.max(0,Math.min(result.points.length-1,index))||0;
      get('inspect').value=selected;
      const p=result.points[selected];
      host.querySelector('.tower-inspect output').textContent=p?`${selected} / ${result.points.length-1}`:'No route';
      host.querySelector('.tower-point-reading').textContent=p?`Node ${result.path[selected]} · cell (${p.join(', ')}) · center (${center(p).join(', ')})`:'Enable one-block steps to reach the roof.';
      for(const bar of host.querySelectorAll('[data-route-step]'))bar.setAttribute('aria-pressed',String(Number(bar.dataset.routeStep)===selected));
      draw();
    }
    function replan(capture=true,remember=true) {
      if(remember&&result?.points.length)previous=result.points.map(p=>[...p]);
      if(capture) {scene=T.build(get('barrier').value,get('steps').checked?1:0);faces=geometry(scene);revision++;}
      result=T.find(scene,get('solver').value);
      const values=[['Result',result.status],['Height gain',result.path.length?`+${result.ascent} blocks`:'—'],[get('solver').value==='BFS'?'Cost · edges':'Cost · cell units',result.cost===null?'—':fmt(result.cost)],['Route',`${result.path.length} nodes`]];
      host.querySelector('.lab-results').innerHTML=values.map(([key,v])=>`<div><span>${key}</span><strong>${v}</strong></div>`).join('');
      host.querySelector('.tower-height-bars').innerHTML=result.points.length?result.points.map((p,i)=>`<button type="button" data-route-step="${i}" aria-pressed="false" aria-label="Step ${i}, cell ${p.join(', ')}, foot height ${p[1]}" style="--height:${p[1]/6*100}%"><span>${p[1]}</span></button>`).join(''):'<p>No connected route from platform Y = 1 to roof Y = 6.</p>';
      get('inspect').max=Math.max(0,result.points.length-1);get('inspect').disabled=!result.points.length;
      host.querySelector('.tower-coordinates').textContent=result.points.length?result.points.map((p,i)=>`${i.toString().padStart(2,' ')}  node ${result.path[i].toString().padStart(3,' ')}  (${p.join(', ')})`).join('\n'):'UNREACHABLE';
      host.querySelector('.tower-explanation').textContent=!get('steps').checked?'The roof has valid nodes, but the current policy rejects every change in Y. A valid goal does not imply a connected route.':`The ${scene.position==='south'?'east':scene.position==='east'?'south':'open'} staircase leads to the roof. Flat moves cost 1; a move that changes one horizontal axis and Y costs √2. ${previous.length?'The previous route is retained as coordinates from its original snapshot.':''}`;
      inspect(0);
    }
    function stop() {playing=false;clearTimeout(timer);timer=null;const b=host.querySelector('[data-tower-action="animate"]');b.textContent='Animate barrier';b.setAttribute('aria-pressed','false');}
    function move() {const keys=Object.keys(T.barriers);get('barrier').value=keys[(keys.indexOf(get('barrier').value)+1)%keys.length];replan();}
    function schedule() {
      timer=setTimeout(()=>{if(disposed||!playing)return;if(!document.hidden)move();schedule();},2200);
    }
    host.addEventListener('input',event=>{
      const key=event.target.dataset.tower;
      if(['barrier','steps'].includes(key)){stop();replan();}
      else if(key==='solver')replan(false);
      else if(key==='inspect')inspect(Number(get('inspect').value));
      else if(key==='previous')draw();
      else if(['yaw','pitch','zoom'].includes(key)){camera={yaw:Number(get('yaw').value),pitch:Number(get('pitch').value),zoom:Number(get('zoom').value)/100};draw();}
    });
    host.addEventListener('click',event=>{
      const action=event.target.closest('[data-tower-action]')?.dataset.towerAction;
      const step=event.target.closest('[data-route-step]')?.dataset.routeStep;
      if(step!==undefined)inspect(Number(step));
      if(action==='move'){stop();move();}
      if(action==='animate') {if(playing)stop();else{playing=true;event.target.textContent='Pause barrier';event.target.setAttribute('aria-pressed','true');schedule();}}
      if(action==='view'){resetView();draw();}
      if(action==='reset'){stop();get('barrier').value='south';get('steps').checked=true;get('solver').value='A*';get('previous').checked=true;previous=[];revision=0;resetView();replan(true,false);}
    });
    stage.addEventListener('keydown',event=>{
      if(event.target!==stage)return;
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return;
      event.preventDefault();
      if(event.key==='Home')resetView();
      else {camera.yaw=((camera.yaw+(event.key==='ArrowLeft'?-15:event.key==='ArrowRight'?15:0)+540)%360)-180;camera.pitch=Math.max(15,Math.min(70,camera.pitch+(event.key==='ArrowUp'?5:event.key==='ArrowDown'?-5:0)));syncCamera();}
      draw();
    });
    svg.addEventListener('pointerdown',event=>{if(event.pointerType!=='mouse'||event.button!==0)return;drag={x:event.clientX,y:event.clientY,yaw:camera.yaw,pitch:camera.pitch};svg.setPointerCapture(event.pointerId);});
    svg.addEventListener('pointermove',event=>{if(!drag)return;camera.yaw=((drag.yaw+(event.clientX-drag.x)*.4+540)%360)-180;camera.pitch=Math.max(15,Math.min(70,drag.pitch-(event.clientY-drag.y)*.25));syncCamera();draw();});
    const endDrag=()=>{drag=null;};svg.addEventListener('pointerup',endDrag);svg.addEventListener('pointercancel',endDrag);svg.addEventListener('lostpointercapture',endDrag);
    replan(true,false);
    return ()=>{disposed=true;stop();};
  }
  window.WikiTower={mount};
})();
