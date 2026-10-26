import {projectPoint,electronCurve3D} from './reaction-3d.js';
import {V} from './geometry.js';
const NS='http://www.w3.org/2000/svg';
const el=(tag,attrs={},text)=>{const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;return n;};
const colors={C:['#b3bec6','#536575','#293642'],H:['#fff','#e7ebee','#8c9aa1'],O:['#ffb1a6','#d2514c','#762c2a'],N:['#b1d1ff','#4a82d0','#263f79'],Br:['#e9b898','#ae623f','#5c3221'],Cl:['#bfe3a3','#6d9b48','#39562b'],I:['#d8c1ee','#9773bd','#4e345f']};
const radius={C:17,H:10,O:18,N:17,Br:22,Cl:20,I:23};
export const FOCUS_ZOOM=1.6;
/** Endpoint valence-bond models only; a transition state is never assigned a hybridization. */
export function carbonOrbitals(scene){
 const atoms=new Map(scene.atoms.map(a=>[a.id,a]));
 const singleCenter=['sn1','sn2'].includes(scene.kind)||scene.kind==='e1'&&scene.step===0;
 return scene.atoms.filter(a=>a.element==='C'&&a.reactive&&(!singleCenter||a.id==='CA')).flatMap(a=>{
  const links=scene.bonds.filter(b=>b.opacity>.999&&(b.a===a.id||b.b===a.id));
  const orders=links.map(b=>b.piOpacity===0?1:b.order),valence=orders.reduce((s,n)=>s+n,0);
  const hybrid=links.length===4&&valence===4?'sp³':links.length===3&&(valence===4||a.charge===1&&valence===3)?'sp²':links.length===2&&valence>=3&&orders.some(n=>n===3)?'sp':null;
  if(!hybrid)return [];
  const directions=links.map(b=>V.unit(V.sub(atoms.get(b.a===a.id?b.b:b.a).p,a.p)));
  const pAxes=[];
  if(hybrid==='sp²'){
   let normal=[0,0,0];
   for(let i=0;i<directions.length;i++)for(let j=i+1;j<directions.length;j++){const n=V.cross(directions[i],directions[j]);if(Math.hypot(...n)>Math.hypot(...normal))normal=n;}
   pAxes.push(V.unit(normal));
  }else if(hybrid==='sp'){
   const axis=directions[0],normal=V.unit(V.cross(axis,Math.abs(axis[2])<.8?[0,0,1]:[0,1,0]));
   pAxes.push(normal,V.unit(V.cross(axis,normal)));
  }
  return [{id:a.id,label:a.id==='CA'?'Cα':a.id==='CB'?'Cβ':a.tag?.replace('{q}','')||a.id,hybrid,directions,pAxes,empty:a.charge===1&&hybrid==='sp²'}];
 });
}
function orbitalLobes(scene,models){
 const out=[],atoms=new Map(scene.atoms.map(a=>[a.id,a]));
 for(const model of models){const center=atoms.get(model.id)?.p;if(!center)continue;
  const lobe=(axis,length,width,color,type)=>{
   const side=V.unit(V.cross(axis,Math.abs(axis[2])<.8?[0,0,1]:[0,1,0])),other=V.cross(axis,side),points=[];
   for(let i=0;i<=12;i++){const t=i/12,r=width*Math.sin(Math.PI*t);for(let j=0;j<16;j++){const angle=j*Math.PI/8;points.push(V.add(center,V.add(V.mul(axis,length*t),V.add(V.mul(side,r*Math.cos(angle)),V.mul(other,r*Math.sin(angle))))));}}
   out.push({points,color,type,weight:model.weight,id:model.id,hybrid:model.hybrid,empty:model.empty});
  };
  for(const axis of model.directions){lobe(axis,1.22,.36,'#288168','hybrid-major');lobe(V.mul(axis,-1),.38,.14,'#a38ab9','hybrid-minor');}
  for(const axis of model.pAxes){lobe(axis,1.42,.39,'#377dae','p-positive');lobe(V.mul(axis,-1),1.42,.39,'#d68940','p-negative');}
 }
 return out;
}
function hull(points){
 const sorted=[...points].sort((a,b)=>a.x-b.x||a.y-b.y),cross=(o,a,b)=>(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x),half=ps=>{const h=[];for(const p of ps){while(h.length>=2&&cross(h.at(-2),h.at(-1),p)<=0)h.pop();h.push(p);}return h;};
 return [...half(sorted).slice(0,-1),...half(sorted.reverse()).slice(0,-1)];
}
export function drawReaction3D(svg,scene,{id,frame,required,progress,spot,camera,hydrogens=false,chloride=false,viewHeight=410,focus=0,orbitals=false,orbitalModels=[]}){
 const lobes=orbitals?orbitalLobes(scene,orbitalModels):[];
 let raw=p=>projectPoint(p,{...camera,zoom:1}),extent=[...scene.bounds.filter(b=>hydrogens||orbitals||!b.spectator).map(b=>raw(b.p)),...lobes.flatMap(l=>l.points.map(raw))],xs=extent.map(p=>p.x),ys=extent.map(p=>p.y),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2,fit=Math.min(viewHeight>410?2.4:orbitals?1.8:1.2,550/Math.max(1,Math.max(...xs)-Math.min(...xs)),(viewHeight-(viewHeight>410?140:110))/Math.max(1,Math.max(...ys)-Math.min(...ys)));
 // Electron-flow frames zoom toward the arrows' sources and targets (focus 0→1 blends in).
 const flowPoints=frame.arrows.flatMap(i=>[required[i]?.from,required[i]?.to]).map(k=>scene.anchors.get(k)).filter(Boolean).map(raw);
 if(focus>0&&flowPoints.length){const fx=flowPoints.reduce((t,p)=>t+p.x,0)/flowPoints.length,fy=flowPoints.reduce((t,p)=>t+p.y,0)/flowPoints.length;cx+=(fx-cx)*focus;cy+=(fy-cy)*focus;fit*=1+(FOCUS_ZOOM-1)*focus;}
 svg.dataset.focus=focus.toFixed(2);
 const project=p=>{const q=raw(p);return {...q,x:325+(q.x-cx)*fit*camera.zoom,y:viewHeight/2+(q.y-cy)*fit*camera.zoom,scale:q.scale*fit};},points=new Map(scene.atoms.map(a=>[a.id,project(a.p)])),anchors=new Map([...scene.anchors].map(([id,p])=>[id,project(p)]));
 svg.replaceChildren();Object.assign(svg.dataset,{renderer:'xyz-ball-stick',representation:orbitals?'orbital':'ball',mode:frame.mode,step:String(frame.step),yaw:String(camera.yaw),pitch:String(camera.pitch),zoom:String(camera.zoom)});
 const defs=el('defs');
 for(const[element,cs]of Object.entries(colors)){const g=el('radialGradient',{id:id+'-sphere-'+element,cx:'32%',cy:'25%',r:'72%'});cs.forEach((c,i)=>g.append(el('stop',{offset:[0,.5,1][i],'stop-color':c})));defs.append(g);}
 const marker=el('marker',{id:id+'-arrow3d',viewBox:'0 0 10 10',refX:8,refY:5,markerWidth:6,markerHeight:6,orient:'auto'});marker.append(el('path',{d:'M0 0 L10 5 L0 10Z',fill:'#aa6416'}));defs.append(marker);
 const focuses=new Set();
 for(const i of frame.arrows){const a=required[i];for(const key of[a.from,a.to,...(a.from==='lpNu'?['Nu']:a.from==='lpBase'?['Base']:a.from==='CBr'?['CA','Br']:a.from==='CH'?['CA','CB','HB']:[])])focuses.add(key);}
 if(frame.mode==='approach'){const a=required.find(a=>['lpNu','lpBase'].includes(a.from));if(a)for(const key of[a.from,a.from==='lpNu'?'Nu':'Base',a.to])focuses.add(key);}
 if(!focuses.size)for(const a of scene.atoms.filter(a=>a.reactive))focuses.add(a.id);
 const mask=el('mask',{id:id+'-mask3d'});mask.append(el('rect',{width:650,height:viewHeight,fill:'white'}));for(const key of focuses){const p=anchors.get(key);if(p)mask.append(el('circle',{cx:p.x,cy:p.y,r:43*camera.zoom,fill:'black'}));}
 const paths=[];
 for(const i of frame.arrows){const a=required[i],from=scene.anchors.get(a.from),target=scene.anchors.get(a.to);if(!from||!target)continue;const atom=scene.atoms.find(n=>n.id===a.to),distance=Math.hypot(...target.map((v,j)=>v-from[j]))||1,to=atom?target.map((v,j)=>v-(v-from[j])/distance*(atom.element==='H'?.24:.45)):target;
  const samples=Array.from({length:33},(_,j)=>project(electronCurve3D(from,to,j/32)));const d=samples.map((p,j)=>(j?'L':'M')+p.x+','+p.y).join(' ');mask.append(el('path',{d,fill:'none',stroke:'black','stroke-width':46}));paths.push({i,from,to,d});
 }
 defs.append(mask);svg.append(defs,el('rect',{width:650,height:viewHeight,fill:'#f1f6f4',rx:12}));
 // A fixed spatial floor helps the viewer distinguish molecular motion from camera motion.
 const floor=el('g',{opacity:.22,'pointer-events':'none'});for(let i=-4;i<=4;i++){const a=project([-5,-3,i]),b=project([5,-3,i]),c=project([i,-3,-5]),d=project([i,-3,5]);for(const[p,q]of[[a,b],[c,d]])floor.append(el('line',{x1:p.x,y1:p.y,x2:q.x,y2:q.y,stroke:'#9bb3a6','stroke-width':.8}));}svg.append(floor);
 const visible=a=>hydrogens||!a.spectator||orbitals&&orbitalModels.some(m=>a.id.startsWith(m.id+'-H')),shown=new Set(scene.atoms.filter(visible).map(a=>a.id)),items=[];
 for(const lobe of lobes){const ps=lobe.points.map(project),outline=hull(ps),node=el('polygon',{points:outline.map(p=>`${p.x},${p.y}`).join(' '),fill:lobe.color,'fill-opacity':.26,stroke:lobe.color,'stroke-width':1.2,opacity:lobe.weight,'data-orbital':lobe.type,'data-orbital-atom':lobe.id,'data-hybrid':lobe.hybrid,'pointer-events':'none'});
  node.append(el('title',{},`${lobe.id} ${lobe.type.startsWith('p-')?(lobe.empty?'空的 p 軌域':'未混成 p 軌域'):lobe.hybrid+' 混成軌域'}`));items.push({z:ps.reduce((s,p)=>s+p.z,0)/ps.length,node});
 }
 for(const b of scene.bonds){if(!shown.has(b.a)||!shown.has(b.b))continue;const a=points.get(b.a),p=points.get(b.b),dx=p.x-a.x,dy=p.y-a.y,L=Math.hypot(dx,dy)||1,off=[-dy/L*3.6*fit*camera.zoom,dx/L*3.6*fit*camera.zoom];
  const g=el('g',{'data-bond':b.id,opacity:b.opacity}),mid={x:(a.x+p.x)/2,y:(a.y+p.y)/2},gradientId=id+'-stick-'+b.id;
  const gradient=el('linearGradient',{id:gradientId,gradientUnits:'userSpaceOnUse',x1:mid.x-off[0],y1:mid.y-off[1],x2:mid.x+off[0],y2:mid.y+off[1]});['#4c5e69','#d9e3e3','#607780'].forEach((c,i)=>gradient.append(el('stop',{offset:i/2,'stop-color':c})));defs.append(gradient);
  const radii=[b.a,b.b].map((key,i)=>(radius[scene.atoms.find(n=>n.id===key).element]||17)*(i?p:a).scale*camera.zoom*.85),trim=Math.min(1,L/Math.max(1,radii[0]+radii[1]));
  const draw=(shift,pi=false)=>g.append(el('line',{x1:a.x+dx/L*radii[0]*trim+off[0]*shift,y1:a.y+dy/L*radii[0]*trim+off[1]*shift,x2:p.x-dx/L*radii[1]*trim+off[0]*shift,y2:p.y-dy/L*radii[1]*trim+off[1]*shift,stroke:pi||b.forming||['newCN','formingOH'].includes(b.id)?'#36866a':b.changing?'#bd7350':`url(#${gradientId})`,'stroke-width':Math.max(2,6*fit*camera.zoom),'stroke-linecap':'round','stroke-dasharray':b.changing?'7 4':'none',...(pi?{'data-pi-bond':b.id,opacity:b.piOpacity??1}:{})}));
  draw(0);if(b.order>=2)draw(1.8,true);if(b.order===3)draw(-1.8,true);items.push({z:(a.z+p.z)/2+.01,node:g});
 }
 for(const a of scene.atoms.filter(visible)){
  const p=points.get(a.id),element=a.id==='Br'&&chloride?'Cl':a.element,r=(radius[element]||13)*p.scale*camera.zoom,g=el('g',{'data-demo-node':a.id,'data-xyz':JSON.stringify(a.p),...(a.spectator?{'data-spectator-h':'true'}:{})});
  g.append(el('title',{},`${a.id==='CA'?'親電中心 Cα':a.id==='CB'?'β 碳':a.id==='Nu'?'親核劑':a.id==='Base'?'鹼':a.id==='HB'?'轉移的 β-H':element}${a.charge>0?'，正電':a.charge<0?'，負電':''}`));
  g.append(el('circle',{cx:p.x,cy:p.y,r,fill:`url(#${id}-sphere-${element})`,stroke:focuses.has(a.id)?'#b87c26':'#ffffff99','stroke-width':focuses.has(a.id)?1.8:.6}));
  const label=a.id==='CA'?'Cα':a.id==='CB'?'Cβ':element;
  if(!a.spectator&&!a.reactive&&element!=='C')g.append(el('text',{x:p.x,y:p.y+3.8,'text-anchor':'middle',fill:element==='H'?'#364c59':'#fff','font-size':10,'font-weight':700,'pointer-events':'none',class:'atom-symbol'},label));

  items.push({z:p.z,node:g});
 }
 items.sort((a,b)=>b.z-a.z).forEach(i=>svg.append(i.node));
 if(spot&&!orbitals)svg.append(el('rect',{width:650,height:viewHeight,fill:'#0c2d29',opacity:['focus','together','transform'].includes(frame.mode)?.36:.12,mask:`url(#${id}-mask3d)`,class:'spotlight-shade','pointer-events':'none'}));
 for(const {i,from,to,d}of paths){svg.append(el('path',{d,fill:'none',stroke:'#aa6416','stroke-width':2.6,'marker-end':`url(#${id}-arrow3d)`,'pointer-events':'none'}));const p=project(electronCurve3D(from,to,Math.min(.99,progress)));for(const delta of[-4.6,4.6])svg.append(el('circle',{cx:p.x+delta,cy:p.y,r:5.4,fill:'#ffe36c',stroke:'#76501b','stroke-width':1,'data-electron':i}));}
 // Critical labels are rendered in a separate HTML layer, so SVG shrinking never shrinks their font.
 const roles={CA:'Cα',CB:'Cβ',Br:chloride?'Cl':null,Nu:'親核',Base:'鹼',HB:'β-H',HN:'轉移H'};
 return scene.atoms.filter(a=>a.reactive||a.element==='N').map(a=>{const point=points.get(a.id),element=a.id==='Br'&&chloride?'Cl':a.element,charge=a.charge>0?'⁺':a.charge<0?'⁻':'';
  const label=a.tag?a.label:['Nu','Base'].includes(a.id)?element+charge+' '+roles[a.id]:['CA','CB','HB','HN'].includes(a.id)?roles[a.id]+charge:element+charge;
  return {id:a.id,text:label,x:point.x,y:point.y,r:(radius[element]||13)*point.scale*camera.zoom,active:focuses.has(a.id)};
 });
}
