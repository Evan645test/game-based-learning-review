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
const halo=b=>`rgba(${Math.round(235-180*b)},${Math.round(240-130*b)},255,${.2+.65*b})`;

/** Four cations side by side; dragging any panel turns all of them together. */
export function mountCationCloud(root,{initial='methyl'}={}){
 let orbital=false,twist=0,camera={yaw:-.5,pitch:.42},drag=null;const abort=new AbortController(),NS='http://www.w3.org/2000/svg';
 root.innerHTML=`<section class="cation-cloud" data-cation-cloud><p class="cation-howto"><strong>怎麼看：</strong>中心碳 C⁺ 外圍的藍色光暈越深，代表它越缺電子、越不穩定。比較四格，看藍色怎麼隨著連接的甲基（CH₃）變多而變淡。</p><div class="cation-grid">${CATIONS.map(c=>`<figure class="cation-panel${c.id===initial?' focus':''}" data-cation-panel="${c.id}"><figcaption>${c.label}</figcaption><svg viewBox="0 0 300 240" role="img" tabindex="0" aria-label="${c.label} 三維模型；拖曳或方向鍵旋轉" data-cation-svg></svg><div class="cation-meter" aria-label="缺電子程度（示意）"><span>缺電子</span><i style="--level:${Math.round(c.blue*100)}%"></i></div><p data-cation-count></p></figure>`).join('')}</div><p class="cation-scale" aria-hidden="true"><span>較不穩定</span><span>→</span><span>較穩定</span></p><div class="cation-controls"><label><input type="checkbox" data-show-orbital>顯示空 p 軌域與超共軛</label><label class="cation-twist" hidden>轉動甲基<input type="range" min="0" max="120" value="0" data-twist></label><button type="button" data-cation-reset>重設視角</button></div><p class="cation-orbital-note" hidden>虛線兩瓣是 C⁺ 上空的 p 軌域；橘色是大致與它平行的鄰近 C–H 鍵，可以把電子分享給空軌域（超共軛）。轉動甲基時，平行的鍵數會改變。</p><p class="teacher-note">藍色深淺依教科書靜電位圖的趨勢繪製（原文第 245 頁），用來比較「誰比較缺電子」，不是計算出的電荷。拖曳任一格可同時旋轉四個模型。</p></section>`;
 const $=s=>root.querySelector(s),el=(tag,attrs,text)=>{const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text)n.textContent=text;return n;};
 function drawPanel(panel){
  const id=panel.dataset.cationPanel,m=cationModel(id,twist),svg=panel.querySelector('svg'),raw=p=>projectPoint(p,{...camera,zoom:1});
  const extent=[...m.atoms.map(a=>a.p),[0,1.5,0],[0,-1.5,0],[2.15,0,0],[-2.15,0,0],[0,0,2.15],[0,0,-2.15]].map(raw),xs=extent.map(p=>p.x),ys=extent.map(p=>p.y),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2,fit=Math.min(270/(Math.max(...xs)-Math.min(...xs)),215/(Math.max(...ys)-Math.min(...ys)));
  const proj=p=>{const q=raw(p);return {x:150+(q.x-cx)*fit,y:122+(q.y-cy)*fit,z:q.z,s:q.scale*fit};},P=new Map(m.atoms.map(a=>[a.id,proj(a.p)])),items=[],c=P.get('C');
  svg.replaceChildren();Object.assign(svg.dataset,{current:id,yaw:String(camera.yaw),parallel:String(m.parallel)});svg.append(el('rect',{width:300,height:240,rx:10,fill:'#f7faf8'}));
  svg.append(el('circle',{cx:c.x,cy:c.y,r:46*c.s,fill:halo(m.cation.blue),'data-cloud':m.cation.blue.toFixed(2),'data-halo':'C'}));
  if(orbital)for(const sign of [1,-1]){const a=proj(mul(P_AXIS,.25*sign)),b=proj(mul(P_AXIS,1.45*sign)),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,ang=Math.atan2(dy,dx)*180/Math.PI;items.push({z:proj(mul(P_AXIS,.8*sign)).z,node:el('ellipse',{cx:(a.x+b.x)/2,cy:(a.y+b.y)/2,rx:len/2+4,ry:16*c.s,transform:`rotate(${ang} ${(a.x+b.x)/2} ${(a.y+b.y)/2})`,fill:'rgba(255,255,255,.55)',stroke:'#5b6f8c','stroke-width':1.6,'stroke-dasharray':'5 3','data-p-lobe':sign})});}
  for(const [a,b] of m.bonds){const p=P.get(a),q=P.get(b),hot=orbital&&m.atoms.find(x=>x.id===b).parallel;items.push({z:(p.z+q.z)/2+.01,node:el('line',{x1:p.x,y1:p.y,x2:q.x,y2:q.y,stroke:hot?'#c9851f':'#6c7d86','stroke-width':hot?7:5,'stroke-linecap':'round',...(hot?{'data-parallel-bond':b}:{})})});}
  for(const a of m.atoms){const p=P.get(a.id),g=el('g',{'data-cation-atom':a.id}),r=(a.center?21:a.el==='C'?15:8)*p.s;g.append(el('circle',{cx:p.x,cy:p.y,r,fill:a.el==='C'?'#4f6170':'#ffffff',stroke:a.el==='C'?'#fff':'#9aa8b0','stroke-width':1.2}));
   const label=a.center?'C⁺':a.el==='C'?'CH₃':a.id.includes('H')&&a.neighborCH?'':'H';if(label)g.append(el('text',{x:p.x,y:p.y+(a.el==='C'?6:-(r+4)),'text-anchor':'middle','font-size':a.el==='C'?17:15,'font-weight':700,fill:a.el==='C'?'#fff':'#41535d'},label));items.push({z:p.z,node:g});}
  items.sort((a,b)=>b.z-a.z).forEach(i=>svg.append(i.node));
  panel.querySelector('[data-cation-count]').textContent=orbital?`與空 p 軌域大致平行的 C–H：${m.parallel} 條`:(m.cation.methyls?`連接 ${m.cation.methyls} 個甲基`:'沒有連接碳');
 }
 const draw=()=>root.querySelectorAll('[data-cation-panel]').forEach(drawPanel);
 $('[data-show-orbital]').onchange=e=>{orbital=e.target.checked;$('.cation-twist').hidden=!orbital;$('.cation-orbital-note').hidden=!orbital;draw();};
 $('[data-twist]').oninput=e=>{twist=Number(e.target.value)*Math.PI/180;draw();};$('[data-cation-reset]').onclick=()=>{camera={yaw:-.5,pitch:.42};draw();};
 const orbit=(dx,dy)=>{camera.yaw+=dx;camera.pitch=Math.max(-1.35,Math.min(1.35,camera.pitch+dy));draw();};
 for(const svg of root.querySelectorAll('[data-cation-svg]')){
  svg.addEventListener('pointerdown',e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY};svg.setPointerCapture(e.pointerId);},{signal:abort.signal});
  svg.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;orbit((e.clientX-drag.x)*.012,(e.clientY-drag.y)*.012);drag.x=e.clientX;drag.y=e.clientY;},{signal:abort.signal});
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])svg.addEventListener(ev,()=>{drag=null;},{signal:abort.signal});
  svg.addEventListener('keydown',e=>{const k={ArrowLeft:[-.15,0],ArrowRight:[.15,0],ArrowUp:[0,-.15],ArrowDown:[0,.15]}[e.key];if(k){e.preventDefault();orbit(...k);}},{signal:abort.signal});
 }
 draw();return {destroy(){abort.abort();}};
}
