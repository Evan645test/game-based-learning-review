// Textbook-style 2D view drawn from each step's arrow-editor layout and kept in step with the 3D frame:
// start structure → curved arrows → bonds break/form → product with updated charges.
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

export function drawPaper(svg,spec,{frame,progress}){
 const step=spec.steps[frame.step],g=paperStep(step),u=frame.mode==='product'?1:['together','transform'].includes(frame.mode)?ease(progress):0,after=frame.mode==='product'||u>.5,arrows=frame.mode==='product'?[]:frame.arrows,id=svg.dataset.paperId;
 svg.replaceChildren();svg.setAttribute('viewBox','0 0 650 340');Object.assign(svg.dataset,{mode:frame.mode,step:String(frame.step)});
 const defs=el('defs'),marker=el('marker',{id:'paper-arrow-'+id,viewBox:'0 0 10 10',refX:8,refY:5,markerWidth:7,markerHeight:7,orient:'auto'});marker.append(el('path',{d:'M0 0L10 5L0 10Z',fill:'#aa6416'}));defs.append(marker);svg.append(defs,el('rect',{width:650,height:340,fill:'#fffdf8',rx:12}));
 // In the product frame, a long new bond pulls the smaller fragment next to its partner, as a textbook would redraw it.
 const moved=new Map();
 if(frame.mode==='product'){
  const comp=new Map();let next=0;for(const id of g.atoms.keys()){if(comp.has(id))continue;const stack=[id];comp.set(id,next);while(stack.length){const x=stack.pop();for(const b of g.bonds.values())if(b.order>0&&(b.a===x||b.b===x)){const y=b.a===x?b.b:b.a;if(!comp.has(y)){comp.set(y,next);stack.push(y);}}}next++;}
  const size=c=>[...comp.values()].filter(v=>v===c).length;
  for(const c of g.changes.values()){if(c.start||!c.end)continue;const A=g.atoms.get(c.a),B=g.atoms.get(c.b),L=Math.hypot(A.x-B.x,A.y-B.y);if(L<=120)continue;
   const [m,p]=size(comp.get(c.a))<=size(comp.get(c.b))?[A,B]:[B,A],base=Math.atan2(m.y-p.y,m.x-p.x),others=[...g.atoms.values()].filter(n=>comp.get(n.id)!==comp.get(m.id)&&n.id!==p.id).map(n=>moved.get(n.id)||n);
   // Try directions around the partner; keep the one farthest from other atoms (ties favour the original side).
   let best=null;for(let k=0;k<12;k++){const ang=base+(k%2?1:-1)*Math.ceil(k/2)*Math.PI/6,x=p.x+Math.cos(ang)*85,y=p.y+Math.sin(ang)*85;if(x<40||x>610||y<30||y>300)continue;const room=Math.min(...others.map(o=>Math.hypot(o.x-x,o.y-y)));if(!best||room>best.room+8)best={x,y,room};}
   const dx=(best?best.x:p.x+Math.cos(base)*85)-m.x,dy=(best?best.y:p.y+Math.sin(base)*85)-m.y;
   for(const [id,v] of comp)if(v===comp.get(m.id)&&!moved.has(id)){const n=g.atoms.get(id);moved.set(id,{...n,x:n.x+dx,y:n.y+dy});}}
 }
 const P=id=>moved.get(id)||g.atoms.get(id)||step.nodes.find(n=>n.id===id),hot=new Set(arrows.flatMap(i=>[step.required[i].from,step.required[i].to]));
 const drawBond=(a,b,order,{opacity=1,color='#2b3a40',dash='none',piOpacity=1,changing=false}={})=>{const p=P(a),q=P(b),dx=q.x-p.x,dy=q.y-p.y,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,t=Math.min(L/2-2,21),x1=p.x+ux*t,y1=p.y+uy*t,x2=q.x-ux*t,y2=q.y-uy*t,gr=el('g',{'data-paper-bond':key(a,b),opacity,...(changing?{'data-changing':'true'}:{})});
  gr.append(el('line',{x1,y1,x2,y2,stroke:color,'stroke-width':3,'stroke-dasharray':dash,'stroke-linecap':'round'}));
  if(order>=2)gr.append(el('line',{x1:x1-uy*7,y1:y1+ux*7,x2:x2-uy*7,y2:y2+ux*7,stroke:piOpacity<1||color!=='#2b3a40'?'#2f8a62':color,'stroke-width':3,opacity:piOpacity,'data-paper-pi':key(a,b)}));svg.append(gr);};
 const keys=new Set([...g.bonds.keys(),...g.changes.keys()]);
 for(const k of keys){const b=g.bonds.get(k),c=g.changes.get(k),start=c?c.start:b.order,end=c?c.end:b.order,a=c?c.a:b.a,bb=c?c.b:b.b;
  if(start===end){if(start)drawBond(a,bb,start);continue;}
  if(frame.mode==='product'){if(end)drawBond(a,bb,end);continue;}
  if(start===0)drawBond(a,bb,1,{opacity:u,color:'#2f8a62',dash:u<1?'7 5':'none',changing:true});
  else if(end===0)drawBond(a,bb,1,{opacity:Math.max(.12,1-u),color:'#c06a3c',dash:'7 5',changing:true});
  else drawBond(a,bb,Math.max(start,end),{piOpacity:end>start?u:1-u,changing:true});}
 for(const n0 of g.atoms.values()){const n=P(n0.id),charge=chargeOf(n.label)+(after?g.delta.get(n.id)||0:0),text=label(n,charge),w=Math.max(30,[...text].length*14+10),gr=el('g',{'data-paper-atom':n.id});
  gr.append(el('rect',{x:n.x-w/2,y:n.y-17,width:w,height:34,rx:8,fill:hot.has(n.id)?'#fff2d6':'#fffdf8'}));
  gr.append(el('text',{x:n.x,y:n.y+8,'text-anchor':'middle','font-size':24,'font-weight':700,fill:n.element==='O'?'#b33a2e':['Br','Cl','I'].includes(n.element)?'#8a4b23':n.element==='N'?'#2f5ea8':'#1f2f36'},text));
  const caption=speciesCaption(n0,after?g.delta.get(n0.id)||0:0);if(caption)gr.append(el('text',{x:n.x,y:n.y+32,'text-anchor':'middle','font-size':13,fill:'#6b6250'},caption));svg.append(gr);}
 // Lone pairs that the arrows use are drawn until they become bonds.
 if(!after)for(const n of step.nodes.filter(n=>n.role==='lonepair'&&step.required.some(r=>r.from===n.id))){const a=P(n.id.slice(2))||n,dx=n.x-a.x,dy=n.y-a.y,L=Math.hypot(dx,dy)||1,cx=a.x+dx/L*24,cy=a.y+dy/L*24;for(const s of[-5,5])svg.append(el('circle',{cx:cx-dy/L*s,cy:cy+dx/L*s,r:3.6,fill:'#1f2f36','data-paper-lp':n.id}));}
 for(const i of arrows){const r=step.required[i],p=step.nodes.find(n=>n.id===r.from),q=step.nodes.find(n=>n.id===r.to),dx=q.x-p.x,dy=q.y-p.y,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,end=g.atoms.has(r.to)?24:10,bend=45,c={x:(p.x+q.x)/2-uy*bend,y:(p.y+q.y)/2+ux*bend},tx=q.x-ux*end,ty=q.y-uy*end;
  svg.append(el('path',{d:`M ${p.x} ${p.y} Q ${c.x} ${c.y} ${tx} ${ty}`,fill:'none',stroke:'#aa6416','stroke-width':2.8,'marker-end':`url(#paper-arrow-${id})`,'data-paper-arrow':i}));
  const t=frame.mode==='focus'?Math.min(.99,progress):Math.min(.99,u),x=(1-t)**2*p.x+2*(1-t)*t*c.x+t*t*tx,y=(1-t)**2*p.y+2*(1-t)*t*c.y+t*t*ty;for(const s of[-4.5,4.5])svg.append(el('circle',{cx:x+s,cy:y,r:4.6,fill:'#ffe36c',stroke:'#76501b','stroke-width':1}));}
 svg.append(el('text',{x:630,y:328,'text-anchor':'end','font-size':13,fill:'#6b6250'},frame.mode==='product'?'本步產物：'+step.product:`第 ${frame.step+1} 步：${step.title}`));
}
