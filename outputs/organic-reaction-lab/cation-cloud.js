import {projectPoint} from './reaction-3d.js';

// Carbocation electron-cloud comparison. Colours follow the trend of the textbook's
// electrostatic potential maps (p. 245); they are a teaching illustration, not computed charges.
export const CATIONS=[
 {id:'methyl',label:'甲基 CH₃⁺',methyls:0,blue:1,note:'沒有烷基分擔正電，中心碳最缺電子；沒有鄰近 C–H 可超共軛。'},
 {id:'primary',label:'一級 CH₃CH₂⁺',methyls:1,blue:.76,note:'一個甲基把電子密度推向中心碳；鄰近 C–H 中約兩條大致平行於空 p 軌域。'},
 {id:'secondary',label:'二級 (CH₃)₂CH⁺',methyls:2,blue:.56,note:'兩個甲基分擔正電，中心碳的藍色變淡。'},
 {id:'tertiary',label:'三級 (CH₃)₃C⁺',methyls:3,blue:.4,note:'三個甲基：電子密度移向正電碳最多、可超共軛的 C–H 最多，最穩定。'}
];
const add=(a,b)=>a.map((x,i)=>x+b[i]),mul=(a,k)=>a.map(x=>x*k),unit=a=>{const d=Math.hypot(...a);return a.map(x=>x/d);},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const P_AXIS=[0,1,0];

/** Atoms and bonds for one cation; the planar cation lies in the xz plane, the empty p orbital along y. */
export function cationModel(id,twist=0){
 const c=CATIONS.find(c=>c.id===id)||CATIONS[0],atoms=[{id:'C',el:'C',p:[0,0,0],blue:c.blue,center:true}],bonds=[];
 for(let i=0;i<3;i++){
  const d=[Math.cos(i*2*Math.PI/3),0,Math.sin(i*2*Math.PI/3)];
  if(i<c.methyls){
   const m='M'+i,mc=mul(d,1.48),v=unit(cross(P_AXIS,d));atoms.push({id:m,el:'C',p:mc,blue:.3});bonds.push(['C',m]);
   for(let k=0;k<3;k++){const phi=k*2*Math.PI/3+twist,dir=add(mul(d,1/3),mul(add(mul(v,Math.cos(phi)),mul(P_AXIS,Math.sin(phi))),.9428)),h=m+'H'+k,hp=add(mc,mul(dir,1.09)),align=Math.abs(dir[1]);atoms.push({id:h,el:'H',p:hp,blue:.22,neighborCH:true,parallel:align>.5});bonds.push([m,h]);}
  }else{atoms.push({id:'H'+i,el:'H',p:mul(d,1.09),blue:c.blue*.55});bonds.push(['C','H'+i]);}
 }
 return {cation:c,atoms,bonds,parallel:atoms.filter(a=>a.parallel).length,neighborCH:atoms.filter(a=>a.neighborCH).length};
}
const blueFill=b=>`rgba(${Math.round(255-170*b)},${Math.round(255-110*b)},255,${.25+.45*b})`;

export function mountCationCloud(root,{initial='tertiary'}={}){
 let id=initial,cloud=true,orbital=true,twist=0,camera={yaw:-.5,pitch:.42},drag=null;const abort=new AbortController(),NS='http://www.w3.org/2000/svg';
 root.innerHTML=`<section class="cation-cloud" data-cation-cloud><div class="check-tools" role="group" aria-label="選擇碳陽離子">${CATIONS.map(c=>`<button type="button" data-cation="${c.id}" aria-pressed="${c.id===id}">${c.label}</button>`).join('')}</div><div class="cation-stage"><svg viewBox="0 0 650 340" role="img" tabindex="0" aria-label="碳陽離子三維模型；拖曳或方向鍵旋轉" data-cation-svg></svg></div><div class="cation-controls"><label><input type="checkbox" data-show-cloud checked>電子雲（藍＝缺電子）</label><label><input type="checkbox" data-show-orbital checked>空 p 軌域與超共軛</label><label class="cation-twist">轉動甲基<input type="range" min="0" max="120" value="0" data-twist></label><button type="button" data-cation-reset>重設視角</button></div><div class="cation-legend" aria-hidden="true"><span class="swatch strong"></span>較缺電子<span class="swatch weak"></span>較不缺電子<span class="swatch parallel"></span>與空 p 軌域大致平行的鄰近 C–H</div><p class="cation-readout" data-cation-readout role="status"></p><p class="teacher-note">顏色依教科書靜電位圖的趨勢製作（原文第 245 頁），用來比較「誰比較缺電子」，不是量子化學計算出的電荷。</p></section>`;
 const $=s=>root.querySelector(s),svg=$('[data-cation-svg]');
 function draw(){
  const m=cationModel(id,twist),raw=p=>projectPoint(p,{...camera,zoom:1}),pts=m.atoms.map(a=>raw(a.p)),xs=pts.map(p=>p.x),ys=pts.map(p=>p.y),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2,fit=Math.min(2.1,560/Math.max(1,Math.max(...xs)-Math.min(...xs)),250/Math.max(1,Math.max(...ys)-Math.min(...ys)));
  const proj=p=>{const q=raw(p);return {x:325+(q.x-cx)*fit,y:170+(q.y-cy)*fit,z:q.z,s:q.scale*fit};},P=new Map(m.atoms.map(a=>[a.id,proj(a.p)])),items=[];
  svg.replaceChildren();svg.dataset.current=id;svg.dataset.yaw=String(camera.yaw);svg.dataset.parallel=String(m.parallel);
  const el=(tag,attrs)=>{const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));return n;};
  svg.append(el('rect',{width:650,height:340,rx:12,fill:'#f1f6f4'}));
  if(orbital){for(const sign of [1,-1]){const a=proj([0,0,0]),b=proj(mul(P_AXIS,1.9*sign)),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,ang=Math.atan2(dy,dx)*180/Math.PI;items.push({z:proj(mul(P_AXIS,.9*sign)).z,node:el('ellipse',{cx:(a.x+b.x)/2,cy:(a.y+b.y)/2,rx:len/2+6,ry:24*fit,transform:`rotate(${ang} ${(a.x+b.x)/2} ${(a.y+b.y)/2})`,fill:'rgba(255,255,255,.35)',stroke:'#6b7f9a','stroke-width':2,'stroke-dasharray':'6 4','data-p-lobe':sign})});}}
  for(const [a,b] of m.bonds){const p=P.get(a),q=P.get(b),atom=m.atoms.find(x=>x.id===b),hot=orbital&&atom.parallel;items.push({z:(p.z+q.z)/2+.01,node:el('line',{x1:p.x,y1:p.y,x2:q.x,y2:q.y,stroke:hot?'#c9851f':'#5d6f78','stroke-width':hot?7:5,'stroke-linecap':'round',...(hot?{'data-parallel-bond':b}:{})})});}
  for(const a of m.atoms){const p=P.get(a.id),r=(a.el==='C'?17:10)*p.s,g=el('g',{'data-cation-atom':a.id});
   if(cloud)g.append(el('circle',{cx:p.x,cy:p.y,r:(a.el==='C'?46:26)*p.s,fill:blueFill(a.blue),'data-cloud':a.blue.toFixed(2)}));
   g.append(el('circle',{cx:p.x,cy:p.y,r,fill:a.el==='C'?'#536575':'#eef1f2',stroke:'#fff',...(a.center?{'stroke-width':2.5}:{})}));
   if(a.center){const t=el('text',{x:p.x,y:p.y+5,'text-anchor':'middle',fill:'#fff','font-size':14,'font-weight':700});t.textContent='C⁺';g.append(t);}
   items.push({z:p.z,node:g});}
  items.sort((a,b)=>b.z-a.z).forEach(i=>svg.append(i.node));
  $('[data-cation-readout]').textContent=`${m.cation.label}：中心碳缺電子程度（示意）${'●'.repeat(Math.round(m.cation.blue*5))}${'○'.repeat(5-Math.round(m.cation.blue*5))}。鄰近 C–H 共 ${m.neighborCH} 條，目前大致平行於空 p 軌域的有 ${m.parallel} 條。${m.cation.note}`;
 }
 root.querySelectorAll('[data-cation]').forEach(b=>b.onclick=()=>{id=b.dataset.cation;root.querySelectorAll('[data-cation]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));draw();});
 $('[data-show-cloud]').onchange=e=>{cloud=e.target.checked;draw();};$('[data-show-orbital]').onchange=e=>{orbital=e.target.checked;draw();};
 $('[data-twist]').oninput=e=>{twist=Number(e.target.value)*Math.PI/180;draw();};$('[data-cation-reset]').onclick=()=>{camera={yaw:-.5,pitch:.42};draw();};
 const orbit=(dx,dy)=>{camera.yaw+=dx;camera.pitch=Math.max(-1.35,Math.min(1.35,camera.pitch+dy));draw();};
 svg.addEventListener('pointerdown',e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY};svg.setPointerCapture(e.pointerId);},{signal:abort.signal});
 svg.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;orbit((e.clientX-drag.x)*.009,(e.clientY-drag.y)*.009);drag.x=e.clientX;drag.y=e.clientY;},{signal:abort.signal});
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])svg.addEventListener(ev,()=>{drag=null;},{signal:abort.signal});
 svg.addEventListener('keydown',e=>{const k={ArrowLeft:[-.15,0],ArrowRight:[.15,0],ArrowUp:[0,-.15],ArrowDown:[0,.15]}[e.key];if(k){e.preventDefault();orbit(...k);}},{signal:abort.signal});
 draw();return {destroy(){abort.abort();}};
}
