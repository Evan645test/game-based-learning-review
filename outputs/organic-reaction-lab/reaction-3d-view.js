import {projectPoint,electronCurve3D} from './reaction-3d.js';
const NS='http://www.w3.org/2000/svg';
const el=(tag,attrs={},text)=>{const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;return n;};
const colors={C:['#b3bec6','#536575','#293642'],H:['#fff','#e7ebee','#8c9aa1'],O:['#ffb1a6','#d2514c','#762c2a'],N:['#b1d1ff','#4a82d0','#263f79'],Br:['#e9b898','#ae623f','#5c3221'],Cl:['#bfe3a3','#6d9b48','#39562b'],I:['#d8c1ee','#9773bd','#4e345f']};
const radius={C:17,H:10,O:18,N:17,Br:22,Cl:20,I:23};
export function drawReaction3D(svg,scene,{id,frame,required,progress,spot,camera,hydrogens=false,chloride=false,viewHeight=410}){
 const raw=p=>projectPoint(p,{...camera,zoom:1}),extent=scene.bounds.filter(b=>hydrogens||!b.spectator).map(b=>raw(b.p)),xs=extent.map(p=>p.x),ys=extent.map(p=>p.y),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2,fit=Math.min(viewHeight>410?2.4:1.2,550/Math.max(1,Math.max(...xs)-Math.min(...xs)),(viewHeight-(viewHeight>410?140:110))/Math.max(1,Math.max(...ys)-Math.min(...ys)));
 const project=p=>{const q=raw(p);return {...q,x:325+(q.x-cx)*fit*camera.zoom,y:viewHeight/2+(q.y-cy)*fit*camera.zoom,scale:q.scale*fit};},points=new Map(scene.atoms.map(a=>[a.id,project(a.p)])),anchors=new Map([...scene.anchors].map(([id,p])=>[id,project(p)]));
 svg.replaceChildren();Object.assign(svg.dataset,{renderer:'xyz-ball-stick',mode:frame.mode,step:String(frame.step),yaw:String(camera.yaw),pitch:String(camera.pitch),zoom:String(camera.zoom)});
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
 const visible=a=>hydrogens||!a.spectator,shown=new Set(scene.atoms.filter(visible).map(a=>a.id)),items=[];
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
 if(spot)svg.append(el('rect',{width:650,height:viewHeight,fill:'#0c2d29',opacity:.52,mask:`url(#${id}-mask3d)`,class:'spotlight-shade','pointer-events':'none'}));
 for(const {i,from,to,d}of paths){svg.append(el('path',{d,fill:'none',stroke:'#aa6416','stroke-width':2.6,'marker-end':`url(#${id}-arrow3d)`,'pointer-events':'none'}));const p=project(electronCurve3D(from,to,Math.min(.99,progress)));for(const delta of[-3.4,3.4])svg.append(el('circle',{cx:p.x+delta,cy:p.y,r:4,fill:'#ffe36c',stroke:'#76501b','stroke-width':1,'data-electron':i}));}
 // Critical labels are rendered in a separate HTML layer, so SVG shrinking never shrinks their font.
 const roles={CA:'Cα',CB:'Cβ',Br:chloride?'Cl':null,Nu:'親核',Base:'鹼',HB:'β-H',HN:'轉移H'};
 return scene.atoms.filter(a=>a.reactive||a.element==='N').map(a=>{const point=points.get(a.id),element=a.id==='Br'&&chloride?'Cl':a.element,charge=a.charge>0?'⁺':a.charge<0?'⁻':'';
  const label=a.tag?a.label:['Nu','Base'].includes(a.id)?element+charge+' '+roles[a.id]:['CA','CB','HB','HN'].includes(a.id)?roles[a.id]+charge:element+charge;
  return {id:a.id,text:label,x:point.x,y:point.y,r:(radius[element]||13)*point.scale*camera.zoom,active:focuses.has(a.id)};
 });
}
