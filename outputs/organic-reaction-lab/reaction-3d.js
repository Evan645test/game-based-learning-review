import {mechanismSpec} from './electron-flow.js';
import {V} from './geometry.js';
import {ADDED_KINDS,typeScene3D} from './reaction-types.js';

const mix=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t);
const clamp=t=>Math.max(0,Math.min(1,Number(t)||0));
const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
const polar=(x,r,phi)=>[x,r*Math.cos(phi),r*Math.sin(phi)];
const tetra=Math.sqrt(8/9),tau=2*Math.PI;
function basis(direction){const u=V.unit(direction),v=V.unit(V.cross(u,Math.abs(u[2])<.8?[0,0,1]:[0,1,0]));return [u,v,V.cross(u,v)];}
function cone(axis,i,count=3){const [u,v,w]=basis(axis),phi=i*tau/count;return V.add(V.mul(u,-1/3),V.mul(V.add(V.mul(v,Math.cos(phi)),V.mul(w,Math.sin(phi))),tetra));}

/** Teaching geometries in Å-like units. Atom identities are conserved within each actual step.
 * These interpolations explain a mechanism; they are not calculated reaction trajectories. */
export function reactionScene3D(kind,index,mode,progress,specOverride=null){
 const spec=specOverride||mechanismSpec(kind),step=spec.steps[index];
 if(ADDED_KINDS.includes(kind))return typeScene3D(kind,index,mode,progress,spec);
 if(!step)throw new RangeError('反應步驟不存在');
 const changing=['together','transform','product'].includes(mode),u=mode==='product'?1:changing?ease(progress):0;
 const atoms=[],bonds=[],map=new Map(),paths=step.required;
 const has=from=>paths.some(a=>a.from===from),substitution=kind==='sn1'||kind==='sn2';
 const add=(id,element,label,p0,p1=p0,extra={})=>{const a={id,element,label,p0:[...p0],p1:[...p1],charge:0,...extra};atoms.push(a);map.set(id,a);return a;};
 const addBond=(a,b,id,order=1,extra={})=>bonds.push({a,b,id,order,opacity:1,...extra});
 const p=id=>map.get(id).p0,ep=id=>map.get(id).p1;
 const leaving=spec.example?.leaving||step.nodes.find(n=>n.id==='Br')?.element||'Br';
 const core=new Map();
 function place(id,a,b=a){core.set(id,[a,b]);}
 if(substitution){
  place('CA',[0,0,0]);place('Br',[1.94,0,0],[3.8,0,0]);
  const groups=kind==='sn2'?['Me','CB']:index===2?['Me1','Me2','Me3']:['CB','Me','Me3'];
  const planar=kind==='sn1'&&index===1,depart=kind==='sn1'&&index===0;
  groups.forEach((id,i)=>{const phi=i*tau/3;place(id,polar(planar?0:-1.54/3,planar?1.54:1.54*tetra,phi),polar(depart?0:1.54/3,depart?1.54:1.54*tetra,phi));});
  if(kind==='sn1'&&index===2)groups.forEach((id,i)=>place(id,polar(1.54/3,1.54*tetra,i*tau/3)));
  if(index===2){
   place('Nu',[-1.45,0,0]);place('HN',[-1.8,1.0,0],[-2.0,2.1,.1]);place('Hkeep',[-1.85,-.65,.72]);
   place('Base',[-2.15,3.1,.15]);
  }else{
   const bondLength=step.nodes.find(n=>n.id==='Nu')?.element==='I'?2.14:1.45;
   place('Nu',[-3.2,0,0],[-bondLength,0,0]);
  }
  if(core.has('CB')&&step.nodes.some(n=>n.id==='Me4')){const[a,b]=core.get('CB');place('Me4',V.add(a,[.65,1.22,.68]),V.add(b,[-.65,1.22,.68]));}
 }else if(kind==='chair'){
  const ids=['CA','C2','C3','C4','C5','CB'];
  ids.forEach((id,i)=>{const a=i*tau/6;place(id,[1.4*Math.cos(a),1.4*Math.sin(a),i%2===0?.25:-.25]);});
  const ca=core.get('CA')[0],cb=core.get('CB')[0],c2=core.get('C2')[0];
  place('Br',V.add(ca,[0,0,1.94]),V.add(ca,[0,0,3.8]));
  const h=V.add(cb,[0,0,-1.09]),base=V.add(h,[0,0,-2.0]);place('Base',base);place('HB',h,V.add(base,[0,0,1.0]));
  place('Me',V.add(c2,[0,0,-1.54]));place('H2',V.add(c2,[.8,.5,.53]));
  // Flatten the four atoms adjacent to the new double bond, retaining a puckered ring.
  core.get('CA')[1]=[...ca.slice(0,2),0];core.get('CB')[1]=[...cb.slice(0,2),0];core.get('C2')[1]=[...c2.slice(0,2),0];core.get('C5')[1]=[...core.get('C5')[0].slice(0,2),0];
 }else{
  const ca=[-.77,0,0],cb=[.77,0,0],ion=kind==='e1'&&index===1;
  place('CA',ca);place('CB',cb,[.57,0,0]);
  place('Br',V.add(ca,polar(-1.94/3,1.94*tetra,0)),V.add(ca,polar(-3.8/3,3.8*tetra,0)));
  ['Me','Me2','ExtraMe'].forEach((id,i)=>{const slot=id==='Me'?1:2,sign=slot===1?1:-1;place(id,V.add(ca,ion?[-.77,0,sign*1.334]:polar(-1.54/3,1.54*tetra,slot*tau/3)),V.add(ca,[-.77,0,sign*1.334]));});
  const hb=V.add(cb,polar(1.09/3,1.09*tetra,Math.PI)),base=V.add(hb,[.4,-2,0]);
  place('Base',base);place('HB',hb,V.add(base,[-.2,1,0]));
  place('Me4',V.add(cb,polar(1.54/3,1.54*tetra,Math.PI/3)),[1.34,0,1.334]);
  // Departure makes only Cα planar; Cβ and its branches remain tetrahedral until elimination.
  if(kind==='e1'&&index===0){core.get('CB')[1]=cb;core.get('Me4')[1]=core.get('Me4')[0];}
 }
 // Build the canonical graph first. Every C/H and solvent branch added below has a stable id.
 for(const n of step.nodes.filter(n=>n.role==='atom')){const coords=core.get(n.id);if(!coords)throw new Error('缺少三維原子座標：'+n.id);add(n.id,n.id==='Br'?leaving:n.element||'C',n.label,...coords,{reactive:['CA','CB','Nu','Base','HB','HN','Br'].includes(n.id)});}
 for(const[a,b,id]of step.bonds){if(map.has(a)&&map.has(b))addBond(a,b,id);}
 const rootCarbon=(id,label)=>{
  if(!map.has(id))return;
  if(label==='Et'){
   const parent=bonds.find(b=>b.b===id||b.a===id),other=parent&&(parent.a===id?parent.b:parent.a);
   const dir=other?V.unit(V.sub(p(id),p(other))):[1,0,0],endDir=other?V.unit(V.sub(ep(id),ep(other))):dir;
   add(id+'-C2','C','C',V.add(p(id),V.mul(dir,1.54)),V.add(ep(id),V.mul(endDir,1.54)));addBond(id,id+'-C2',id+'-ethyl');
  }else if(label==='Ph'){
   const parent=bonds.find(b=>b.a===id||b.b===id),other=parent.a===id?parent.b:parent.a;
   const ring=(pos,prev)=>{const d=V.unit(V.sub(pos,prev)),side=basis(d)[1],center=V.add(pos,V.mul(d,1.4));return Array.from({length:6},(_,i)=>V.add(center,V.add(V.mul(d,-1.4*Math.cos(i*tau/6)),V.mul(side,1.4*Math.sin(i*tau/6)))));};
   const before=ring(p(id),p(other)),after=ring(ep(id),ep(other));
   for(let i=1;i<6;i++)add(id+'-Ph'+i,'C','C',before[i],after[i]);
   for(let i=0;i<6;i++)addBond(i?id+'-Ph'+i:id,i===5?id:id+'-Ph'+(i+1),id+'-aromatic'+i,i%2===0?2:1);
  }
 };
 for(const n of step.nodes.filter(n=>n.role==='atom'&&n.element==='C'&&n.id!=='CA'))rootCarbon(n.id,n.label);
 function append(id,el,label,offset,suffix,order=1){const child=id+'-'+suffix;add(child,el,label,V.add(p(id),offset),V.add(ep(id),offset));addBond(id,child,id+'-'+suffix+'-bond',order);return child;}
 function alcohol(id,form,protonated=false){
  const away=id==='Base'?[1,0,0]:[-1,0,0];
  if(form==='water'){
   if(!map.has('HN')||id!=='Nu')append(id,'H','H',V.mul(cone(V.mul(away,-1),0),.97),'H1');
   if(!map.has('Hkeep')||id!=='Nu')append(id,'H','H',V.mul(cone(V.mul(away,-1),1),.97),'H2');
  }else{
   const c=append(id,'C','C',V.mul(away,1.43),'C');
   if(form==='ethyl')append(c,'C','C',V.mul(V.unit(id==='Base'?[.5,.75,.43]:[.8,-.7,.3]),1.54),'C2');
   if(form==='tertbutyl')for(let i=0;i<3;i++)append(c,'C','C',V.mul(cone(V.mul(away,-1),i),1.54),'Me'+i);
   if(protonated)append(id,'H','H',V.mul(cone(V.mul(away,-1),1),.97),'H1');
  }
 }
 if(map.has('Nu')&&kind==='sn2'){
  const n=map.get('Nu');n.charge=-1;
  if(n.element==='O')append('Nu','H','H',[-.4,.85,.2],'H');
  if(n.element==='C')append('Nu','N','N',[-1.16,0,0],'N',3);
 }
 if(map.has('Nu')&&kind==='sn1'){
  if(index===1){
   const methanol=spec.example?.kept==='Me';add('HN','H','H',V.add(p('Nu'),[-.35,1,0]),V.add(ep('Nu'),[-.35,1,0]),{reactive:true});addBond('Nu','HN','OH');
   add('Hkeep',methanol?'C':'H',methanol?'Me':'H',V.add(p('Nu'),[-.4,-.65,.72]),V.add(ep('Nu'),[-.4,-.65,.72]));addBond('Nu','Hkeep','OHkeep');
  }else if(index===2)map.get('Nu').charge=1;
 }
 if(map.has('Base')){
  if(kind==='sn1')alcohol('Base',spec.example?.kept==='Me'?'methyl':'water',true);
  else if(kind==='e1')alcohol('Base','ethyl',true);
  else{alcohol('Base',spec.example?.base==='OtBu⁻'?'tertbutyl':'ethyl');map.get('Base').charge=-1;}
 }
 // Assign final charges and bond changes without deleting atoms (notably the transferred proton).
 if(has('CBr')){const b=bonds.find(b=>b.id==='CBr');b.opacity=1-u;b.changing=true;map.get('Br').charge=u===1?-1:0;if(['sn1','e1'].includes(kind))map.get('CA').charge=u===1?1:0;}
 if(kind==='sn1'&&index===1||kind==='e1'&&index===1)map.get('CA').charge=u===1?0:1;
 if(has('lpNu')){addBond('CA','Nu','newCN',1,{opacity:u,changing:u<1});if(u===1)map.get('Nu').charge=kind==='sn1'?1:0;}
 if(has('CH')){const b=bonds.find(b=>b.id==='CH');b.opacity=1-u;b.changing=true;const cc=bonds.find(b=>b.id==='CC');cc.order=2;cc.piOpacity=u;}
 if(has('lpBase')){const target=paths.find(a=>a.from==='lpBase').to;addBond('Base',target,'formingOH',1,{opacity:u,changing:u<1});if(u===1)map.get('Base').charge=kind==='sn1'||kind==='e1'?1:0;}
 if(has('OH')){const b=bonds.find(b=>b.id==='OH');b.opacity=1-u;b.changing=true;if(u===1)map.get('Nu').charge=0;}
 // Fill spectator C–H bonds from starting valence; both geometries use the same hydrogen ids.
 const hPositions=(a,end,count,adjacency)=>{
  const position=end?a.p1:a.p0;
  const neighbors=adjacency.filter(b=>b.a===a.id||b.b===a.id).map(b=>V.unit(V.sub(end?ep(b.a===a.id?b.b:b.a):p(b.a===a.id?b.b:b.a),position)));
  if(end&&count===2&&endBonds.some(b=>(b.a===a.id||b.b===a.id)&&b.order===2))return [[neighbors[0][0]>0?-.5:.5,0,.8660254],[neighbors[0][0]>0?-.5:.5,0,-.8660254]];
  if(count===3&&neighbors.length===1)return [0,1,2].map(i=>cone(neighbors[0],i));
  const sum=V.unit(V.mul(neighbors.reduce((s,n)=>V.add(s,n),[0,0,0]),-1));
  if(count===1)return [Math.hypot(...sum)>.1?sum:[0,1,0]];
  const normal=neighbors.length>=2?V.unit(V.cross(neighbors[0],neighbors[1])):[0,0,1];
  return [V.unit(V.add(V.mul(sum,.577),V.mul(normal,.816))),V.unit(V.sub(V.mul(sum,.577),V.mul(normal,.816)))].slice(0,count);
 };
 // Freeze connectivity at each endpoint rather than allowing the opacity to alter valence.
 const startBonds=bonds.filter(b=>!['newCN','formingOH'].includes(b.id));
 const endBonds=bonds.filter(b=>!(has('CBr')&&b.id==='CBr')&&!(has('CH')&&b.id==='CH')&&!(has('OH')&&b.id==='OH'));
 for(const a of [...atoms].filter(a=>a.element==='C')){
  const valence=startBonds.filter(b=>b.a===a.id||b.b===a.id).reduce((s,b)=>s+(b.id==='CC'?1:b.order),0),cation=a.id==='CA'&&((kind==='sn1'&&index===1)||(kind==='e1'&&index===1));
  const count=Math.max(0,(cation||a.id==='Nu'&&kind==='sn2'&&a.element==='C'?3:4)-valence);if(count>3)throw new Error('三維碳原子缺少連接：'+a.id);
  // Derive missing directions from endpoint adjacency, independent of seek progress.
  const before=hPositions(a,false,count,startBonds),after=hPositions(a,true,count,endBonds);
  for(let i=0;i<count;i++){const id=a.id+'-H'+i;add(id,'H','H',V.add(a.p0,V.mul(before[i],1.09)),V.add(a.p1,V.mul(after[i],1.09)),{spectator:true});addBond(a.id,id,id+'-bond');}
 }
 // Approach translates the entire reagent, keeping its internal structure intact.
 const actor=has('lpNu')?'Nu':has('lpBase')?'Base':null;
 const reagent=new Set();
 if(actor){const queue=[actor];while(queue.length){const id=queue.pop();if(reagent.has(id))continue;reagent.add(id);for(const b of startBonds){if(b.a===id&&!(actor==='Nu'?['CA']:['CA','HB','HN']).includes(b.b))queue.push(b.b);if(b.b===id&&!(actor==='Nu'?['CA']:['CA','HB','HN']).includes(b.a))queue.push(b.a);}}
  // Include the spectator hydrogens attached after the initial graph was captured.
  for(const a of atoms)if(a.spectator&&reagent.has(a.id.split('-H')[0]))reagent.add(a.id);
 }
 const approach=mode==='overview'?0:mode==='approach'?ease(progress):1;
 const displacement=actor==='Nu'&&index!==2?[-1.6,0,0]:actor==='Base'?kind==='chair'?[0,0,-2]:[0,1.3,.4]:[0,0,0];
 if(actor==='Base'&&kind!=='sn1'&&kind!=='chair')displacement[1]=-1.3;
 for(const a of atoms){a.p=mix(a.p0,a.p1,u);if(reagent.has(a.id))a.p=V.add(a.p,V.mul(displacement,1-approach));a.label=a.element+(a.charge>0?'⁺':a.charge<0?'⁻':'');}
 const nodes=new Map(atoms.map(a=>[a.id,a]));
 const midpoint=(a,b)=>mix(nodes.get(a).p,nodes.get(b).p,.5);
 const anchors=new Map(atoms.map(a=>[a.id,a.p]));
 for(const[a,b,id]of step.bonds)anchors.set(id,midpoint(a,b));
 for(const[from,atom]of [['lpNu','Nu'],['lpBase','Base']])if(nodes.has(atom)){
  const target=paths.find(a=>a.from===from)?.to,dir=target?V.unit(V.sub(anchors.get(target),nodes.get(atom).p)):[1,0,0];anchors.set(from,V.add(nodes.get(atom).p,V.mul(dir,.42)));
 }
 const bounds=atoms.flatMap(a=>[a.p0,a.p1,V.add(a.p0,reagent.has(a.id)?displacement:[0,0,0])].map(p=>({p,spectator:!!a.spectator})));
 return {atoms,bonds:bonds.filter(b=>b.opacity>0),anchors,bounds,progress:u,kind,step:index};
}

export const REFERENCE_VIEW=Object.freeze({yaw:-.85,pitch:-.1,zoom:1});

export function projectPoint(p,{yaw=REFERENCE_VIEW.yaw,pitch=REFERENCE_VIEW.pitch,zoom=1}={}){
 const x=p[0]*Math.cos(yaw)+p[2]*Math.sin(yaw),z=-p[0]*Math.sin(yaw)+p[2]*Math.cos(yaw),y=p[1]*Math.cos(pitch)-z*Math.sin(pitch),depth=p[1]*Math.sin(pitch)+z*Math.cos(pitch),scale=1/(1+depth/22);
 return {x:325+x*49*zoom*scale,y:205-y*49*zoom*scale,z:depth,scale};
}
export function electronCurve3D(a,b,t,bend=1.05){
 const d=V.sub(b,a),perp=V.unit(V.cross(d,Math.abs(d[2])<.8?[0,0,1]:[0,1,0])),c=V.add(mix(a,b,.5),V.add(V.mul(perp,bend),[0,0,.35]));
 return V.add(V.add(V.mul(a,(1-t)**2),V.mul(c,2*t*(1-t))),V.mul(b,t*t));
}
