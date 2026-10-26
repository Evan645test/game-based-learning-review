// Textbook-style 2D view drawn from each step's arrow-editor layout and kept in step with the 3D frame:
// Atom motion follows the 3D reaction; the paper keeps its own legible textbook viewpoint.
import {V} from './geometry.js';
import {projectPoint,REFERENCE_VIEW} from './reaction-3d.js';
const NS='http://www.w3.org/2000/svg';
const el=(tag,attrs={},text)=>{const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;return n;};
const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
const CONDENSED={Me:'CH₃',Et:'CH₂CH₃',Ph:'C₆H₅'};
const key=(a,b)=>[a,b].sort().join('|');
const chargeOf=label=>(label.match(/⁺/g)||[]).length-(label.match(/⁻/g)||[]).length;

/** Applies a step's curved arrows to its 2D graph: which bonds break, form or change order, and formal-charge changes. */
export function paperStep(step){
 const atoms=new Map(step.nodes.filter(n=>n.role==='atom').map(n=>[n.id,n])),bonds=new Map(step.bonds.filter(b=>atoms.has(b[0])&&atoms.has(b[1])).map(b=>[key(b[0],b[1]),{a:b[0],b:b[1],order:b[3]||1}]));
 const dist=(p,q)=>Math.hypot(p.x-q.x,p.y-q.y);
 const siteBond=id=>{const n=step.nodes.find(x=>x.id===id);let best=null,d=Infinity;for(const b of bonds.values()){const m={x:(atoms.get(b.a).x+atoms.get(b.b).x)/2,y:(atoms.get(b.a).y+atoms.get(b.b).y)/2},k=dist(n,m);if(k<d){d=k;best=b;}}return d<40?best:null;};
 // Editor layouts draw every bond as one line; a bond site labelled π or = marks the starting double bond.
 for(const n of step.nodes)if(n.role==='bond'&&/π|=/.test(n.label)){const b=siteBond(n.id);if(b)b.order=2;}
 const owner=id=>{const name=id.slice(2);if(atoms.has(name))return name;const n=step.nodes.find(x=>x.id===id);return [...atoms.values()].sort((p,q)=>dist(p,n)-dist(q,n))[0].id;};
 const delta=new Map(),changes=new Map(),bump=(id,k)=>delta.set(id,(delta.get(id)||0)+k);
 const order=(a,b)=>{const k=key(a,b);return changes.has(k)?changes.get(k).end:bonds.get(k)?.order||0;};
 const setOrder=(a,b,end)=>{const k=key(a,b),start=bonds.get(k)?.order||0;changes.set(k,{a,b,start,end});};
 for(const r of step.required){
  const from=step.nodes.find(n=>n.id===r.from),toAtom=atoms.has(r.to);
  if(from.role==='lonepair'){const a=owner(r.from);if(toAtom){setOrder(a,r.to,order(a,r.to)+1);bump(a,1);bump(r.to,-1);}continue;}
  const b=siteBond(r.from);if(!b)continue;
  if(toAtom&&(r.to===b.a||r.to===b.b)){const other=r.to===b.a?b.b:b.a;setOrder(b.a,b.b,order(b.a,b.b)-1);bump(r.to,-1);bump(other,1);}
  else if(toAtom){const ends=[b.a,b.b].sort((p,q)=>(order(p,r.to)?1:0)-(order(q,r.to)?1:0)||dist(atoms.get(p),atoms.get(r.to))-dist(atoms.get(q),atoms.get(r.to))),keep=ends[0],left=ends[1];setOrder(b.a,b.b,order(b.a,b.b)-1);setOrder(keep,r.to,order(keep,r.to)+1);bump(left,1);bump(r.to,-1);}
  else{const t=siteBond(r.to);if(!t)continue;const shared=[b.a,b.b].find(x=>x===t.a||x===t.b),lost=shared===b.a?b.b:b.a,gain=shared===t.a?t.b:t.a;setOrder(b.a,b.b,order(b.a,b.b)-1);setOrder(t.a,t.b,order(t.a,t.b)+1);bump(lost,1);bump(gain,-1);}
 }
 return {atoms,bonds,changes,delta};
}
// Solvent or base molecules drawn as a single O keep a small formula caption that follows the proton transfer.
const AFTER={'H₃O⁺':{'-1':'H₂O'},'H₂O':{'1':'H₃O⁺'},'EtOH':{'1':'EtOH₂⁺'},'MeOH':{'1':'MeOH₂⁺'},'OEt⁻':{'1':'EtOH'},'OtBu⁻':{'1':'t-BuOH'}};
export function speciesCaption(n,delta=0){const raw=n.label.match(/（(.*?)）/)?.[1]||(AFTER[n.label]?n.label:null);if(!raw)return null;return delta?AFTER[raw]?.[String(delta)]||null:raw===n.label?null:raw;}
function label(n,charge){const base=n.label.replace(/[⁺⁻]/g,'').replace(/（.*?）/,'').trim();return (CONDENSED[base]||base)+(charge>0?'⁺':charge<0?'⁻':'');}

/** Textbook front view of trigonal centers. Move whole branches, retaining their internal bonds.
 * Small rings constrain bond angles, so a ring junction is not forced into an ideal 120° layout. */
export function planarPaperPositions(graph,positions,scene,u){
 if(!scene)return positions;
 const keys=new Set([...graph.bonds.keys(),...graph.changes.keys()]);
 const layout=end=>{
  const out=new Map([...positions].map(([id,p])=>[id,{...p}]));
  const bonds=[...keys].map(k=>{const b=graph.bonds.get(k),c=graph.changes.get(k);return {a:c?.a||b.a,b:c?.b||b.b,order:c?(end?c.end:c.start):b.order};}).filter(b=>b.order>0);
  const links=id=>bonds.filter(b=>b.a===id||b.b===id),other=(b,id)=>b.a===id?b.b:b.a;
  for(const center of scene.atoms.filter(a=>a.element==='C'&&a.reactive&&out.has(a.id))){
   const bs=links(center.id),n=graph.atoms.get(center.id),charge=chargeOf(n.label)+(end?graph.delta.get(center.id)||0:0);
   if(bs.length!==3||!(bs.some(b=>b.order===2)||charge===1))continue;
   const branches=bs.map(b=>{
    const id=other(b,center.id),seen=new Set(),stack=[id];
    while(stack.length){const x=stack.pop();if(x===center.id||seen.has(x))continue;seen.add(x);for(const l of links(x))stack.push(other(l,x));}
    return {id,b,seen};
   });
   if(branches.some(b=>branches.some(c=>c!==b&&b.seen.has(c.id))))continue;
   branches.sort((a,b)=>b.b.order-a.b.order||links(b.id).length-links(a.id).length);
   const c=out.get(center.id),anchor=out.get(branches[0].id),angle=Math.atan2(anchor.y-c.y,anchor.x-c.x);
   const wrapped=a=>Math.atan2(Math.sin(a),Math.cos(a));
   const cost=sign=>branches.slice(1).reduce((sum,b,i)=>{const p=out.get(b.id),actual=Math.atan2(p.y-c.y,p.x-c.x);return sum+wrapped(actual-angle-sign*(i? -1:1)*2*Math.PI/3)**2;},0);
   const sign=cost(1)<=cost(-1)?1:-1;
   branches.slice(1).forEach((b,i)=>{
    const p=out.get(b.id),radius=Math.max(70,Math.min(110,Math.hypot(p.x-c.x,p.y-c.y))),theta=angle+sign*(i?-1:1)*2*Math.PI/3;
    const dx=c.x+radius*Math.cos(theta)-p.x,dy=c.y+radius*Math.sin(theta)-p.y;
    for(const id of b.seen){const q=out.get(id);q.x+=dx;q.y+=dy;}
   });
  }
  return out;
 };
 const start=layout(false),end=layout(true);
 return new Map([...positions].map(([id,p])=>[id,{...p,x:start.get(id).x*(1-u)+end.get(id).x*u,y:start.get(id).y*(1-u)+end.get(id).y*u}]));
}

/** Preserve handedness in the authored 2D layout, rather than marking every broken bond as "behind". */
export function paperStereo(graph,positions,scene){
 const result=new Map();if(!scene)return result;
 const atoms=new Map(scene.atoms.map(a=>[a.id,a])),P=id=>positions.get(id)||graph.atoms.get(id);
 for(const center of scene.atoms.filter(a=>a.element==='C'&&a.reactive&&graph.atoms.has(a.id))){
  const changes=b=>{const c=graph.changes.get(key(b.a,b.b));return Boolean(b.changing||b.forming||c&&c.start!==c.end);};
  const links=scene.bonds.filter(b=>b.opacity>.01&&(b.a===center.id||b.b===center.id)).sort((a,b)=>Number(changes(a))-Number(changes(b)));
  const ids=links.map(b=>b.a===center.id?b.b:b.a).filter(id=>graph.atoms.has(id)).slice(0,4);
  if(ids.length<3)continue;
  const xyz=ids.map(id=>V.sub(atoms.get(id).p,center.p));
  const volume=vs=>vs.length===4?V.dot(V.sub(vs[0],vs[3]),V.cross(V.sub(vs[1],vs[3]),V.sub(vs[2],vs[3]))):V.dot(vs[0],V.cross(vs[1],vs[2]));
  // The first three retained substituents flatten continuously even while a leaving bond still fades.
  const actual=V.dot(xyz[0],V.cross(xyz[1],xyz[2]));if(Math.abs(actual)<.025)continue;
  const c=P(center.id),flat=ids.map((id,i)=>{const p=P(id);return [p.x-c.x,c.y-p.y,i===0?1:i===1?-1:0];}),flatVolume=volume(flat);
  if(Math.abs(flatVolume)<1e-6)continue;
  // The 3D renderer sorts increasing z away from the viewer; paper depth is positive toward the viewer.
  const sign=-Math.sign(actual*flatVolume),width=Math.min(1,Math.abs(actual)/1.8);
  for(let i=0;i<2;i++){const id=ids[i],bond=links.find(b=>b.a===id||b.b===id);if((bond.piOpacity??1)>0&&bond.order>1)continue;
   const k=key(center.id,id);if(!result.has(k))result.set(k,{from:center.id,to:id,depth:(i===0?1:-1)*sign,width});
  }
 }
 return result;
}

export function drawPaper(svg,spec,{frame,progress,scene=null}){
 const width=svg.getBoundingClientRect().width||650,fontSize=Math.max(24,Math.min(40,14*650/width));
 const step=spec.steps[frame.step],g=paperStep(step),u=frame.mode==='product'?1:['together','transform'].includes(frame.mode)?ease(progress):0,after=frame.mode==='product'||u>.5,arrows=frame.mode==='product'?[]:frame.arrows,id=svg.dataset.paperId;
 svg.replaceChildren();svg.setAttribute('viewBox','0 0 650 520');Object.assign(svg.dataset,{mode:frame.mode,step:String(frame.step)});
 const defs=el('defs'),marker=el('marker',{id:'paper-arrow-'+id,viewBox:'0 0 10 10',refX:8,refY:5,markerWidth:7,markerHeight:7,orient:'auto'});marker.append(el('path',{d:'M0 0L10 5L0 10Z',fill:'#aa6416'}));defs.append(marker);svg.append(defs,el('rect',{width:650,height:520,fill:'#fffdf8',rx:12}));
 // Show the one implicit H needed to read a tetrahedral reaction center.
 if(scene)for(const c of scene.atoms.filter(a=>a.element==='C'&&a.reactive&&g.atoms.has(a.id))){
  const neighbors=[...g.bonds.values()].filter(b=>b.a===c.id||b.b===c.id).map(b=>g.atoms.get(b.a===c.id?b.b:b.a));
  const h=scene.atoms.filter(a=>a.spectator&&a.id.startsWith(c.id+'-H'));
  if(neighbors.length!==3||h.length!==1)continue;
  const n=g.atoms.get(c.id),angles=neighbors.map(a=>Math.atan2(a.y-n.y,a.x-n.x)).sort((a,b)=>a-b);let best={gap:0,angle:0};
  for(let i=0;i<angles.length;i++){const end=i===angles.length-1?angles[0]+2*Math.PI:angles[i+1],gap=end-angles[i];if(gap>best.gap)best={gap,angle:angles[i]+gap/2};}
  const id=h[0].id;g.atoms.set(id,{id,role:'atom',element:'H',label:'H',x:n.x+Math.cos(best.angle)*75,y:n.y+Math.sin(best.angle)*75});g.bonds.set(key(c.id,id),{a:c.id,b:id,order:1});
 }
 // Both representations share the same reference projection. Free camera motion never
 // enters this layout; only reaction coordinates move, so atom identities stay comparable.
 const spatial=new Map((scene?.atoms||[]).map(a=>[a.id,a]));
 let positions=new Map([...g.atoms].map(([id,n])=>{
  const atom=spatial.get(id);if(!atom)return [id,{...n}];
  const p=projectPoint(atom.p,REFERENCE_VIEW);
  return [id,{...n,x:325+(p.x-325)*1.8,y:260+(p.y-205)*1.8}];
 }));
 positions=planarPaperPositions(g,positions,scene,u);
 // Keep labels at a readable fixed size. Fit the atom centers, reserving space for charges and captions.
 const ps=[...positions.values()],xs=ps.map(p=>p.x),ys=ps.map(p=>p.y),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
 const pad=Math.max(30,...ps.map(n=>[...label(n,1)].length*fontSize*.3+10)),left=18+pad,right=632-pad,top=62,bottom=fontSize>28?420:440;
 const scale=Math.min(1,(right-left)/Math.max(1,xmax-xmin),(bottom-top)/Math.max(1,ymax-ymin)),cx=(xmin+xmax)/2,cy=(ymin+ymax)/2,hx=(xmax-xmin)*scale/2,hy=(ymax-ymin)*scale/2;
 const targetX=Math.max(left+hx,Math.min(right-hx,cx)),targetY=Math.max(top+hy,Math.min(bottom-hy,cy));
 for(const p of ps){p.x=targetX+(p.x-cx)*scale;p.y=targetY+(p.y-cy)*scale;}
 const P=id=>{
  if(positions.has(id))return positions.get(id);
  const n=step.nodes.find(n=>n.id===id);if(!n)return null;
  if(n.role==='lonepair'){const owner=g.atoms.get(id.slice(2))||[...g.atoms.values()].sort((a,b)=>Math.hypot(a.x-n.x,a.y-n.y)-Math.hypot(b.x-n.x,b.y-n.y))[0],p=positions.get(owner.id);return {...n,x:n.x+p.x-owner.x,y:n.y+p.y-owner.y};}
  if(n.role==='bond'){const bond=[...g.bonds.values()].sort((a,b)=>{const distance=c=>{const p=g.atoms.get(c.a),q=g.atoms.get(c.b);return Math.hypot((p.x+q.x)/2-n.x,(p.y+q.y)/2-n.y);};return distance(a)-distance(b);})[0];if(bond){const a=g.atoms.get(bond.a),b=g.atoms.get(bond.b),p=positions.get(a.id),q=positions.get(b.id);return {...n,x:n.x+(p.x+q.x-a.x-b.x)/2,y:n.y+(p.y+q.y-a.y-b.y)/2};}}
  return n;
 },stereo=paperStereo(g,positions,scene),hot=new Set(arrows.flatMap(i=>[step.required[i].from,step.required[i].to]));
 const drawBond=(a,b,order,{opacity=1,color='#2b3a40',dash='none',piOpacity=1,changing=false}={})=>{const p=P(a),q=P(b),dx=q.x-p.x,dy=q.y-p.y,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,t=Math.min(L/2-2,fontSize*.75+3),x1=p.x+ux*t,y1=p.y+uy*t,x2=q.x-ux*t,y2=q.y-uy*t,gr=el('g',{'data-paper-bond':key(a,b),opacity,...(changing?{'data-changing':'true'}:{})});
  const wedge=order===1?stereo.get(key(a,b)):null;
  if(wedge&&!changing){const reverse=wedge.from!==a,A={x:reverse?x2:x1,y:reverse?y2:y1},B={x:reverse?x1:x2,y:reverse?y1:y2},w=9*wedge.width;
   gr.dataset.paperStereo=wedge.depth>0?'front':'back';gr.dataset.stereoFrom=wedge.from;
   if(wedge.depth>0)gr.append(el('path',{d:`M${A.x} ${A.y} L${B.x-uy*w} ${B.y+ux*w} L${B.x+uy*w} ${B.y-ux*w}Z`,fill:color}));
   else for(let i=1;i<=8;i++){const t=i/9,x=A.x+(B.x-A.x)*t,y=A.y+(B.y-A.y)*t;gr.append(el('line',{x1:x-uy*w*t,y1:y+ux*w*t,x2:x+uy*w*t,y2:y-ux*w*t,stroke:color,'stroke-width':1.7}));}
  }else gr.append(el('line',{x1,y1,x2,y2,stroke:color,'stroke-width':3,'stroke-dasharray':dash,'stroke-linecap':'round'}));
  if(order>=2)gr.append(el('line',{x1:x1-uy*7,y1:y1+ux*7,x2:x2-uy*7,y2:y2+ux*7,stroke:piOpacity<1||color!=='#2b3a40'?'#2f8a62':color,'stroke-width':3,opacity:piOpacity,'data-paper-pi':key(a,b)}));svg.append(gr);};
 const keys=new Set([...g.bonds.keys(),...g.changes.keys()]);
 for(const k of keys){const b=g.bonds.get(k),c=g.changes.get(k),start=c?c.start:b.order,end=c?c.end:b.order,a=c?c.a:b.a,bb=c?c.b:b.b;
  if(start===end){if(start)drawBond(a,bb,start);continue;}
  if(frame.mode==='product'||u===1){if(end)drawBond(a,bb,end);continue;}
  if(start===0)drawBond(a,bb,1,{opacity:u,color:'#2f8a62',dash:u<1?'7 5':'none',changing:true});
  else if(end===0)drawBond(a,bb,1,{opacity:1-u,color:u>0?'#c06a3c':'#2b3a40',dash:u>0?'7 5':'none',changing:u>0});
  else drawBond(a,bb,Math.max(start,end),{piOpacity:end>start?u:1-u,changing:true});}
 for(const n0 of g.atoms.values()){const n=P(n0.id),charge=spatial.get(n.id)?.charge??chargeOf(n.label)+(after?g.delta.get(n.id)||0:0),text=label(n,charge),w=Math.max(30,[...text].length*fontSize*.58+10),gr=el('g',{'data-paper-atom':n.id,'data-x':n.x,'data-y':n.y});
  gr.append(el('rect',{x:n.x-w/2,y:n.y-fontSize*.7,width:w,height:fontSize*1.4,rx:8,fill:hot.has(n.id)?'#fff2d6':'#fffdf8'}));
  gr.append(el('text',{x:n.x,y:n.y+fontSize/3,'text-anchor':'middle','font-size':fontSize,'font-weight':700,fill:n.element==='O'?'#b33a2e':['Br','Cl','I'].includes(n.element)?'#8a4b23':n.element==='N'?'#2f5ea8':'#1f2f36'},text));
  const caption=speciesCaption(n0,charge-chargeOf(n0.label));if(caption)gr.append(el('text',{x:n.x,y:n.y+fontSize*.65+16,'text-anchor':'middle','font-size':Math.max(13,fontSize*.57),fill:'#6b6250'},caption));svg.append(gr);}
 // Lone pairs that the arrows use are drawn until they become bonds.
 if(!after)for(const node of step.nodes.filter(n=>n.role==='lonepair'&&step.required.some(r=>r.from===n.id))){const n=P(node.id),a=P(n.id.slice(2))||n,dx=n.x-a.x,dy=n.y-a.y,L=Math.hypot(dx,dy)||1,cx=a.x+dx/L*24,cy=a.y+dy/L*24;for(const s of[-5,5])svg.append(el('circle',{cx:cx-dy/L*s,cy:cy+dx/L*s,r:3.6,fill:'#1f2f36','data-paper-lp':n.id}));}
 for(const i of arrows){const r=step.required[i],p=P(r.from),q=P(r.to),dx=q.x-p.x,dy=q.y-p.y,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,end=g.atoms.has(r.to)?24:10,bend=45,c={x:(p.x+q.x)/2-uy*bend,y:(p.y+q.y)/2+ux*bend},tx=q.x-ux*end,ty=q.y-uy*end;
  svg.append(el('path',{d:`M ${p.x} ${p.y} Q ${c.x} ${c.y} ${tx} ${ty}`,fill:'none',stroke:'#aa6416','stroke-width':2.8,'marker-end':`url(#paper-arrow-${id})`,'data-paper-arrow':i}));
  const t=frame.mode==='focus'?Math.min(.99,progress):Math.min(.99,u),x=(1-t)**2*p.x+2*(1-t)*t*c.x+t*t*tx,y=(1-t)**2*p.y+2*(1-t)*t*c.y+t*t*ty;for(const s of[-4.5,4.5])svg.append(el('circle',{cx:x+s,cy:y,r:4.6,fill:'#ffe36c',stroke:'#76501b','stroke-width':1}));}
}
