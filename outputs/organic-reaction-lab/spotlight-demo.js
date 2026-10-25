import {mechanismSpec} from './electron-flow.js';
import {reactionScene3D} from './reaction-3d.js';
import {drawReaction3D} from './reaction-3d-view.js';
import {KIND_LABELS} from './reaction-types.js';

let serial=0;
const explanations={
 'CBr>Br':'C–脫離基鍵的電子對移向鹵素。鹵素帶著這對電子離開，成為鹵離子；不要把箭頭從鹵素畫向碳。',
 'lpNu>CA':'親核劑用孤對電子與缺電子的 α 碳形成新鍵。電子從親核劑出發，指向親電中心。',
 'lpBase>HB':'鹼的氧以孤對電子接受 β-H。這裡攻擊的是氫；β 碳不是這支箭頭的終點。',
 'CH>CC':'原 Cβ–H 的鍵電子移到 Cα–Cβ 之間，形成新的 π 鍵；不是把氫的原子搬到雙鍵上。',
 'lpBase>HN':'另一個溶劑分子的氧用孤對電子接受氧陽離子上的氫，形成該溶劑的共軛酸。',
 'OH>Nu':'原 O–H 鍵的電子回到原氧，使氧陽離子去質子化，得到中性的醇或醚。'
};

export function spotlightFrames(kind,specOverride=null){
 const spec=specOverride||mechanismSpec(kind),concerted=['sn2','e2','chair'].includes(kind);
 return spec.steps.flatMap((s,step)=>[
  {step,mode:'overview',arrows:[],text:`實際機構第 ${step+1} 步：${s.title}。${concerted?(kind==='sn2'?'兩組':'三組')+'電子移動在同一步發生。先逐支解說，再同步播放；解說片段不代表中間體。':s.description}`},
  ...(s.approach?[{step,mode:'approach',arrows:[],text:`反應物接近：${s.approach}`}]:s.required.some(a=>a.from==='lpNu'||a.from==='lpBase')?[{step,mode:'approach',arrows:[],text:`${concerted?'同一步之前的接近':'反應物接近'}：${s.required.some(a=>a.from==='lpNu')?'親核劑帶著孤對電子，靠近親電碳；SN2 從脫離基背面接近，SN1 則接近平面碳陽離子。':'鹼帶著孤對電子，靠近本步要接受的氫；不是靠近脫離基或直接攻擊 α 碳。'} 接近尚未代表已形成新共價鍵。`}]:[]),
  ...s.required.map((a,index)=>({step,mode:'focus',arrows:[index],text:`${concerted?'同一步的解說焦點':'本步的電子移動'} ${index+1}：${a.explain||explanations[a.from+'>'+a.to]}`})),
  {step,mode:s.required.length>1?'together':'transform',arrows:s.required.map((_,i)=>i),text:`${s.required.length>1?'一起看：'+s.required.length+' 組電子同時移動。':'電子移動帶動結構改變。'}觀察原鍵逐漸斷裂、新鍵逐漸形成及電荷變化；虛線表示正在變化的鍵，不是可分離的中間體。`},
  {step,mode:'product',arrows:[],text:`本步完成：${s.product}。${step<spec.steps.length-1?'接下來以這個中間體進入下一步。':'此處只顯示所分析路徑；真實產物仍須考慮競爭反應。'}`}
 ]);
}

export function spotlightSegmentFrames(kind,specOverride=null,segment=null){
 const frames=spotlightFrames(kind,specOverride);if(!segment)return frames;
 if(!Number.isInteger(segment.step))throw new RangeError('觀察片段必須指定有效機構步驟。');
 const selected=frames.filter(f=>f.step===segment.step&&(segment.includeProduct!==false||f.mode!=='product'));
 if(!selected.length)throw new RangeError('找不到指定的機構步驟。');return selected;
}

export function productScene(kind,index,specOverride=null){
 const step=(specOverride||mechanismSpec(kind)).steps[index],scene=structuredClone(step);
 const n=id=>scene.nodes.find(n=>n.id===id),remove=new Set();
 for(const a of step.required){
  if(a.from==='CBr'){scene.bonds=scene.bonds.filter(b=>b[2]!=='CBr');n('Br').label='Br⁻';n('Br').x=565;n('Br').y=58;if(['sn1','e1'].includes(kind))n('CA').label='Cα⁺';}
  if(a.from==='lpNu'){scene.bonds.push(['CA','Nu','newCN']);n('CA').label='Cα';n('Nu').label=kind==='sn2'?'I':'OH₂⁺';n('Nu').x=175;n('Nu').y=150;}
  if(a.from==='CH'){scene.bonds=scene.bonds.map(b=>b[2]==='CC'?[...b.slice(0,3),2]:b).filter(b=>b[2]!=='CH');n('CA').label='Cα';}
  if(a.from==='lpBase'){remove.add(a.to);n('Base').label=a.to==='HN'?'H₃O⁺':kind==='e1'?'EtOH₂⁺':'EtOH';}
  if(a.from==='OH'){scene.bonds=scene.bonds.filter(b=>b[2]!=='OH');n('Nu').label='O';}
 }
 scene.nodes=scene.nodes.filter(n=>n.role==='atom'&&!remove.has(n.id));
 for(const n of scene.nodes)if(step.afterLabels?.[n.id])n.label=step.afterLabels[n.id];
 scene.bonds=scene.bonds.filter(b=>!remove.has(b[0])&&!remove.has(b[1]));
 return scene;
}

export function animationScene(kind,index,mode,t,specOverride=null){
 const spec=specOverride||mechanismSpec(kind),start=structuredClone(spec.steps[index]),at=id=>start.nodes.find(n=>n.id===id);
 const positions=kind==='sn2'?{CA:[310,165],Br:[470,165],CBr:[390,165],Nu:[70,165],lpNu:[110,160],Me:[310,55],CB:[400,265],CC:[355,215],Me4:[530,265]}:kind==='e2'?{HB:[455,255],CH:[455,202],Base:[110,275],lpBase:[145,260]}:{};
 for(const[id,p]of Object.entries(positions)){const n=at(id);if(n)[n.x,n.y]=p;}
 const near=structuredClone(start),get=id=>near.nodes.find(n=>n.id===id),actor=spec.steps[index].required.find(a=>['lpNu','lpBase'].includes(a.from));
 if(actor){
  const id=actor.from==='lpNu'?'Nu':'Base',atom=get(id),lp=get(actor.from),target=get(actor.to),old={x:atom.x,y:atom.y},right=atom.x>target.x;
  const destination=id==='Nu'?{x:target.x-140,y:target.y}:{x:target.x+(right?100:-100),y:target.y+(right?-15:30)};
  atom.x=destination.x;atom.y=destination.y;lp.x+=atom.x-old.x;lp.y+=atom.y-old.y;
 }
 const mix=(a,b,x)=>a+(b-a)*x,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
 if(mode==='overview')return start;
 if(mode==='approach'){const u=ease(t/.8);start.nodes.forEach(n=>{const p=get(n.id);n.x=mix(n.x,p.x,u);n.y=mix(n.y,p.y,u);});return start;}
 if(!['product','together','transform'].includes(mode))return near;
 const end=productScene(kind,index,spec),endMap=new Map(end.nodes.map(n=>[n.id,n]));
 for(const n of end.nodes){const p=get(n.id);if(p){n.x=p.x;n.y=p.y;}if(n.id==='Nu'&&spec.steps[index].required.some(a=>a.from==='lpNu'))n.x=get('CA').x-90;}
 if(spec.steps[index].required.some(a=>a.from==='CBr')){const br=endMap.get('Br'),p=get('Br'),ca=get('CA'),L=Math.hypot(p.x-ca.x,p.y-ca.y)||1;br.x=Math.min(595,Math.max(30,p.x+(p.x-ca.x)/L*70));br.y=Math.min(305,Math.max(30,p.y+(p.y-ca.y)/L*70));}
 if(mode==='product')return end;
 const u=ease(t),result=structuredClone(near);
 result.nodes=result.nodes.filter(n=>n.role!=='atom'||endMap.has(n.id)||u<1);
 for(const n of result.nodes){
  const p=endMap.get(n.id);
  if(p){n.x=mix(n.x,p.x,u);n.y=mix(n.y,p.y,u);if(u>.98)n.label=p.label;}
  else if(['HB','HN'].includes(n.id)){const base=get('Base');if(base){n.x=mix(n.x,base.x+(base.x<n.x?35:-35),u);n.y=mix(n.y,base.y,u);n.opacity=u>.8?(1-u)*5:1;}}
 }
 const rn=id=>result.nodes.find(n=>n.id===id);
 if(actor){const id=actor.from==='lpNu'?'Nu':'Base',a=rn(id),p=get(id),lp=rn(actor.from);if(a&&lp){lp.x+=a.x-p.x;lp.y+=a.y-p.y;}}
 for(const[id,a,b]of [['CH','CB','HB'],['CBr','CA','Br'],['OH','Nu','HN']]){const n=rn(id),p=rn(a),q=rn(b);if(n&&p&&q){n.x=(p.x+q.x)/2;n.y=(p.y+q.y)/2;}}
 const after=new Map(end.bonds.map(b=>[b[2],b])),before=new Set(near.bonds.map(b=>b[2]));
 result.bonds=near.bonds.map(b=>after.has(b[2])?[...b.slice(0,3),after.get(b[2])[3]||1,1,false,b[3]!==after.get(b[2])[3]?u:1]:[...b.slice(0,3),1,1-u,true]);
 for(const b of end.bonds)if(!before.has(b[2]))result.bonds.push([...b.slice(0,3),b[3]||1,u,u<1]);
 if(actor?.from==='lpBase'&&rn(actor.to))result.bonds.push(['Base',actor.to,'formingOH',1,u,u<1]);
 return result;
}

export function curvePoint(a,b,bend,t){const dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,c={x:(a.x+b.x)/2-dy/L*bend,y:(a.y+b.y)/2+dx/L*bend};return {x:(1-t)**2*a.x+2*(1-t)*t*c.x+t*t*b.x,y:(1-t)**2*a.y+2*(1-t)*t*c.y+t*t*b.y,c};}

export function spotlightFocus(kind,frame,specOverride=null){
 const step=(specOverride||mechanismSpec(kind)).steps[frame.step];
 const focus={'CBr>Br':'追蹤 C–脫離基鍵電子：回到鹵素。','lpNu>CA':'追蹤親核劑的孤對電子：目標是 Cα。','lpBase>HB':'追蹤鹼的孤對電子：目標是 β-H。','CH>CC':'追蹤 Cβ–H 鍵電子：形成 Cα=Cβ 的 π 鍵。','lpBase>HN':'追蹤另一個溶劑的孤對電子：接受氧陽離子上的氫。','OH>Nu':'追蹤原 O–H 鍵電子：回到原氧。'};
 if(frame.mode==='product')return '本步得到：'+step.product+'。';
 if(frame.mode==='approach'&&step.approach)return '看試劑靠近：這段尚未形成新鍵。';
 if(frame.mode==='approach')return step.required.some(a=>a.from==='lpNu')?'看試劑靠近 Cα：這段尚未形成新鍵。':'看鹼靠近本步要接受的氫：這段尚未成鍵。';
 if(frame.mode==='focus'){const arrow=step.required[frame.arrows[0]];return arrow.focus||focus[arrow.from+'>'+arrow.to];}
 if(['together','transform'].includes(frame.mode)){if(step.motionFocus)return step.motionFocus;if(step.required.length>1)return `看 ${step.required.length} 組電子同步移動，帶動成鍵與斷鍵。`;return step.required[0].from==='lpNu'?'看親核劑與 Cα 成鍵；碳陽離子被接住，氧先形成正電。':'看鍵電子移向脫離基，碳陽離子在離解後形成。';}
 return '先看'+step.title+'：辨認本步開始時的鍵與電荷。';
}

export function normalizePlaybackState(value,count,fallbackFrame=0){
 const n=(x,f,min,max)=>Number.isFinite(x)?Math.max(min,Math.min(max,x)):f;
 const base={version:1,frame:Math.max(0,Math.min(count-1,Math.floor(Number(fallbackFrame)||0))),progress:0,camera:{yaw:-.3,pitch:.36,zoom:1},speed:1,spot:true,hydrogens:false};
 if(!value||value.version!==1||typeof value!=='object')return base;
 return {version:1,frame:Math.floor(n(value.frame,base.frame,0,count-1)),progress:n(value.progress,0,0,1),camera:{yaw:n(value.camera?.yaw,-.3,-10000,10000),pitch:n(value.camera?.pitch,.36,-1.35,1.35),zoom:n(value.camera?.zoom,1,.65,1.5)},speed:[.75,1,1.5].includes(value.speed)?value.speed:1,spot:typeof value.spot==='boolean'?value.spot:true,hydrogens:value.hydrogens===true};
}

export function mountSpotlight(root,{kind='sn2',frame=0,chloride=false,specOverride=null,initialState=null,segment=null,onStateChange=()=>{},onFrameChange=()=>{},onComplete=()=>{}}={}){
 const spec=specOverride||mechanismSpec(kind),frames=spotlightSegmentFrames(kind,spec,segment),id='spot-'+(++serial),abort=new AbortController(),saved=normalizePlaybackState(initialState,frames.length,frame);
 let current=saved.frame,progress=saved.progress,playing=false,speed=saved.speed,spot=saved.spot,raf=0,last=0,destroyed=false,completed=false,lastSaved=0,drag=null,hydrogens=saved.hydrogens;
 const camera={...saved.camera},reduced=matchMedia('(prefers-reduced-motion: reduce)'),NS='http://www.w3.org/2000/svg';
 let viewport={width:650,height:410},viewHeight=410;
 const snapshot=()=>({version:1,frame:current,progress,camera:{...camera},speed,spot,hydrogens});
 const persist=()=>{lastSaved=performance.now();onStateChange(snapshot());};
 root.innerHTML=`<section class="spotlight-player" aria-label="聚光燈反應機構動畫">
  <div class="spotlight-meta"><div><strong data-physical-step></strong><span data-frame-count></span></div><button type="button" data-expand aria-expanded="false">放大觀察</button></div>
  <div class="spotlight-layout"><div class="spotlight-main">
   <div class="molecule-stage"><svg viewBox="0 0 650 410" class="spotlight-canvas" role="img" tabindex="0" aria-roledescription="可旋轉三維分子模型" aria-label="三維球棍反應動畫；拖曳或方向鍵旋轉，加減鍵縮放，Home 重設視角" aria-describedby="${id}-focus ${id}-legend"></svg><svg class="annotation-lines" aria-hidden="true"></svg><div class="molecule-annotations" aria-hidden="true"></div><span class="molecule-stage-hint">拖曳旋轉 · 操作時暫停</span></div>
   <div class="spotlight-transport"><div class="spotlight-controls"><button type="button" data-demo-prev>上一段</button><button type="button" class="primary" data-play>播放動畫</button><button type="button" data-demo-next>下一段</button></div><label class="spotlight-seek">本段進度<input type="range" min="0" max="100" step="1" value="0" data-seek><output data-progress-value>0%</output></label><div class="player-feedback"><p class="player-status" role="status" data-player-status></p><button type="button" class="quiet" data-replay>從頭重播</button></div></div>
  </div><aside class="spotlight-side" aria-label="本段解說與觀察設定">
   <p class="spotlight-kicker">現在只看這件事</p><p class="spotlight-focus" id="${id}-focus" data-current-focus aria-live="polite"></p><details class="spotlight-explanation"><summary>為什麼這樣移動？</summary><p class="spotlight-caption" id="${id}-caption" data-demo-caption></p></details><p class="spotlight-charge" data-charge-note></p>
   <div class="mechanism-legend" id="${id}-legend" aria-label="電子與鍵結圖例"><span><i class="legend-pair" aria-hidden="true"></i>金色光點：電子對</span><span><i class="legend-breaking" aria-hidden="true"></i>橙色虛線：鍵斷裂</span><span><i class="legend-forming" aria-hidden="true"></i>綠色：新鍵／π 鍵</span></div>
   <details class="view-settings" data-view-settings><summary>視角與播放設定</summary><div class="molecule-camera" aria-label="三維視角操作"><button type="button" data-view-orbit="left" aria-label="向左旋轉">左轉</button><button type="button" data-view-orbit="right" aria-label="向右旋轉">右轉</button><button type="button" data-view-orbit="up" aria-label="向上旋轉">上轉</button><button type="button" data-view-orbit="down" aria-label="向下旋轉">下轉</button><button type="button" data-view-side>反應平面</button><button type="button" data-view-reset>重設視角</button><label class="camera-zoom">縮放<input type="range" min="65" max="150" value="100" data-view-zoom></label><label class="camera-hydrogens"><input type="checkbox" data-show-hydrogens>顯示所有氫</label></div><div class="spotlight-secondary"><label>速度<select data-speed><option value="0.75">0.75 倍</option><option value="1" selected>1 倍</option><option value="1.5">1.5 倍</option></select></label><button type="button" data-spot aria-pressed="true">聚光燈：開</button></div>
   <div class="molecule-legend" aria-label="原子色彩"><span><i class="atom-c" aria-hidden="true"></i>C 碳</span><span><i class="atom-h" aria-hidden="true"></i>H 氫</span><span><i class="atom-o" aria-hidden="true"></i>O 氧</span><span><i class="atom-n" aria-hidden="true"></i>N 氮</span><span><i class="atom-halogen" aria-hidden="true"></i>Br／Cl／I 鹵素</span></div></details>
  </aside></div><details class="spotlight-model-note"><summary>模型與電子符號說明</summary><p class="spotlight-note">${chloride?'類比示範使用氯代物；推理題使用溴代物。離去能力不同，不由動畫推算速率。':'碳骨架、試劑及轉移的氫以球棍呈現；可展開設定顯示所有氫。'} 三維幾何與電子曲線用於機構解說，並非分子動力學計算；光點表示電子對，不是電子的實測路徑。<span data-motion-note></span></p></details>
 </section><dialog class="spotlight-dialog" aria-label="放大觀察反應機構"></dialog>`;
 const q=s=>root.querySelector(s),svg=q('.spotlight-canvas'),player=q('.spotlight-player'),dialog=q('dialog'),annotationLayer=q('.molecule-annotations'),lines=q('.annotation-lines');
 const displayLabel=s=>chloride||spec.example?.leaving==='Cl'?s.replaceAll('Br','Cl'):s;
 function labelLayer(labels){
  const {width:w,height:h}=viewport,scale=Math.min(w/650,h/viewHeight),ox=(w-650*scale)/2,oy=(h-viewHeight*scale)/2;
  lines.setAttribute('viewBox',`0 0 ${w} ${h}`);lines.replaceChildren();
  const existing=new Map([...annotationLayer.children].map(n=>[n.dataset.moleculeLabel,n])),rects=[];
  const targets=labels.map(a=>({...a,x:a.x*scale+ox,y:a.y*scale+oy,r:a.r*scale}));
  const priority=['CA','HB','HN','Nu','Base','Br','CB'];targets.sort((a,b)=>(priority.indexOf(a.id)<0?9:priority.indexOf(a.id))-(priority.indexOf(b.id)<0?9:priority.indexOf(b.id)));
  const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
  for(const a of targets){
   const bw=Math.min(w-12,[...a.text].reduce((sum,c)=>sum+(/[\u2e80-\u9fff]/.test(c)?14:8),16)),bh=28,gap=a.r+8,left=a.x<w/2;
   const candidate=[[left?a.x-gap-bw:a.x+gap,a.y-bh/2],[left?a.x+gap:a.x-gap-bw,a.y-bh/2],[a.x-bw/2,a.y-gap-bh],[a.x-bw/2,a.y+gap]];
   for(const x of [5,w-bw-5])for(let y=8;y<h-bh;y+=34)candidate.push([x,y]);
   const choices=candidate.map(([x,y],i)=>{const box={x:Math.max(4,Math.min(w-bw-4,x)),y:Math.max(4,Math.min(h-bh-4,y)),w:bw,h:bh};let cost=i*.8+Math.hypot(box.x+bw/2-a.x,box.y+bh/2-a.y)*.2;for(const r of rects)cost+=overlap({...box,x:box.x-3,y:box.y-3,w:bw+6,h:bh+6},r)*50;for(const t of targets)cost+=overlap(box,{x:t.x-t.r-2,y:t.y-t.r-2,w:t.r*2+4,h:t.r*2+4})*5;return {box,cost};}).sort((a,b)=>a.cost-b.cost);
   const box=choices[0].box;rects.push(box);let badge=existing.get(a.id);if(!badge){badge=document.createElement('span');badge.dataset.moleculeLabel=a.id;annotationLayer.append(badge);}existing.delete(a.id);badge.className='molecule-label'+(a.active?' active':'');badge.textContent=a.text;Object.assign(badge.style,{left:box.x+'px',top:box.y+'px',width:bw+'px'});
   const line=document.createElementNS(NS,'line');for(const[k,v]of Object.entries({x1:a.x,y1:a.y,x2:Math.max(box.x,Math.min(box.x+bw,a.x)),y2:Math.max(box.y,Math.min(box.y+bh,a.y))}))line.setAttribute(k,String(v));lines.append(line);
  }
  existing.forEach(n=>n.remove());
 }
 function progressUI(){const value=Math.round(progress*100);q('[data-seek]').value=value;q('[data-progress-value]').value=value+'%';q('[data-progress-value]').textContent=value+'%';q('[data-seek]').setAttribute('aria-valuetext',`解說第 ${current+1} 段，共 ${frames.length} 段；本段 ${value}%`);}
 function draw(){
  const f=frames[current],scene=reactionScene3D(kind,f.step,f.mode,progress,spec);
  viewHeight=dialog.open?Math.max(410,650*viewport.height/viewport.width):410;svg.setAttribute('viewBox',`0 0 650 ${viewHeight}`);
  labelLayer(drawReaction3D(svg,scene,{id,frame:f,required:spec.steps[f.step].required,progress,spot,camera,hydrogens,chloride,viewHeight}));
 }
 function status(text){q('[data-player-status]').textContent=text;}
 function show(){
  const f=frames[current];q('[data-physical-step]').textContent=`${KIND_LABELS[kind]||kind.toUpperCase()}｜實際機構第 ${f.step+1}／${spec.steps.length} 步`;
  q('[data-frame-count]').textContent=`解說 ${current+1}／${frames.length}`;q('[data-demo-caption]').textContent=displayLabel(f.text);q('[data-current-focus]').textContent=displayLabel(spotlightFocus(kind,f,spec));
  q('[data-demo-prev]').disabled=current===0;q('[data-demo-next]').disabled=current===frames.length-1;q('[data-play]').textContent=playing?'暫停':'播放動畫';q('[data-play]').setAttribute('aria-pressed',String(playing));progressUI();
  q('[data-charge-note]').textContent=f.step>0&&['sn1','e1'].includes(kind)?displayLabel('前一步離去的 Br⁻ 仍在溶液中，此步不重畫；總電荷須連同該離子一起計算。'):'';
  draw();onFrameChange(current);persist();
  if(current===frames.length-1&&!completed){completed=true;onComplete();}
 }
 function stop(reason=''){playing=false;cancelAnimationFrame(raf);last=0;q('[data-play]').textContent='播放動畫';q('[data-play]').setAttribute('aria-pressed','false');if(reason)status(reason);persist();}
 function interact(){if(playing)stop('操作視角時已暫停，按播放動畫繼續。');}
 function move(n){stop();current=Math.max(0,Math.min(frames.length-1,n));progress=0;status('逐段觀察中，可播放本段。');show();}
 function tick(now){
  if(!playing||destroyed)return;
  const dt=last?Math.min(now-last,100):0;last=now;progress+=dt*speed/(frames[current].mode==='product'?2400:4000);
  if(progress>=1){if(current===frames.length-1){progress=1;stop('已看完本例，可重播或換一個例子。');show();return;}current++;progress=0;show();}
  else{progressUI();draw();if(now-lastSaved>1000)persist();}raf=requestAnimationFrame(tick);
 }
 q('[data-demo-prev]').onclick=()=>move(current-1);q('[data-demo-next]').onclick=()=>move(current+1);q('[data-replay]').onclick=()=>move(0);
 q('[data-play]').onclick=()=>{if(playing){stop('已暫停，可旋轉模型查看。');return;}if(reduced.matches){q('[data-motion-note]').textContent=' 已啟用減少動態：以逐段切換閱讀。';if(segment&&current===frames.length-1){progress=1;show();}else move(current===frames.length-1?0:current+1);status('減少動態模式：已切到下一段。');return;}if(current===frames.length-1&&progress>=1){current=0;progress=0;}playing=true;last=0;status('播放中；旋轉或調整視角會暫停。');show();raf=requestAnimationFrame(tick);};
 q('[data-speed]').onchange=e=>{speed=Number(e.target.value);persist();};q('[data-spot]').onclick=e=>{spot=!spot;e.target.textContent=`聚光燈：${spot?'開':'關'}`;e.target.setAttribute('aria-pressed',String(spot));draw();persist();};q('[data-seek]').oninput=e=>{stop('已停在指定位置，可旋轉查看。');progress=Number(e.target.value)/100;progressUI();draw();persist();};
 const orbit=(dx,dy=0,save=true)=>{interact();camera.yaw+=dx;camera.pitch=Math.max(-1.35,Math.min(1.35,camera.pitch+dy));draw();if(save)persist();};
 const rotations={left:[-.3,0],right:[.3,0],up:[0,-.2],down:[0,.2]};for(const button of root.querySelectorAll('[data-view-orbit]'))button.onclick=()=>orbit(...rotations[button.dataset.viewOrbit]);
 q('[data-view-reset]').onclick=()=>{interact();Object.assign(camera,{yaw:-.3,pitch:.36,zoom:1});q('[data-view-zoom]').value=100;draw();persist();};
 q('[data-view-side]').onclick=()=>{interact();Object.assign(camera,{yaw:0,pitch:kind==='chair'?1.05:0});draw();persist();};
 q('[data-view-zoom]').oninput=e=>{interact();camera.zoom=Number(e.target.value)/100;draw();persist();};q('[data-show-hydrogens]').onchange=e=>{interact();hydrogens=e.target.checked;draw();persist();};
 svg.addEventListener('pointerdown',e=>{if(e.button!==0)return;interact();drag={id:e.pointerId,x:e.clientX,y:e.clientY};svg.setPointerCapture(e.pointerId);svg.focus({preventScroll:true});},{signal:abort.signal});
 svg.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;orbit(dx*.009,dy*.009,false);},{signal:abort.signal});
 const release=()=>{if(drag){drag=null;persist();}};for(const event of ['pointerup','pointercancel','lostpointercapture'])svg.addEventListener(event,release,{signal:abort.signal});
 svg.addEventListener('keydown',e=>{const moves={ArrowLeft:[-.15,0],ArrowRight:[.15,0],ArrowUp:[0,-.15],ArrowDown:[0,.15]};if(moves[e.key]){e.preventDefault();orbit(...moves[e.key]);}else if(['+','=','-','Home'].includes(e.key)){e.preventDefault();if(e.key==='Home')q('[data-view-reset]').click();else{interact();camera.zoom=Math.max(.65,Math.min(1.5,camera.zoom+(e.key==='-'?-.1:.1)));q('[data-view-zoom]').value=camera.zoom*100;draw();persist();}}},{signal:abort.signal});
 const restore=focus=>{if(player.parentNode===dialog)root.insertBefore(player,dialog);q('[data-expand]').textContent='放大觀察';q('[data-expand]').setAttribute('aria-expanded','false');if(focus&&!destroyed)q('[data-expand]').focus({preventScroll:true});};
 q('[data-expand]').onclick=()=>{interact();if(dialog.open){dialog.close();restore(true);}else{dialog.append(player);dialog.showModal();q('[data-expand]').textContent='回到課程';q('[data-expand]').setAttribute('aria-expanded','true');}};
 dialog.addEventListener('close',()=>restore(true),{signal:abort.signal});
 const observer=new ResizeObserver(entries=>{const r=entries[0].contentRect;if(r.width>0&&r.height>0){viewport={width:r.width,height:r.height};if(!destroyed)draw();}});observer.observe(svg);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop('頁面離開前已暫停。');},{signal:abort.signal});window.addEventListener('pagehide',persist,{signal:abort.signal});reduced.addEventListener('change',()=>{if(reduced.matches)stop('減少動態模式：請逐段觀察。');},{signal:abort.signal});
 if(matchMedia('(pointer: coarse)').matches)q('.molecule-stage-hint').textContent='左右拖曳旋轉 · 上下滑動捲頁';
 q('[data-speed]').value=String(speed);q('[data-show-hydrogens]').checked=hydrogens;q('[data-view-zoom]').value=camera.zoom*100;q('[data-spot]').textContent=`聚光燈：${spot?'開':'關'}`;q('[data-spot]').setAttribute('aria-pressed',String(spot));
 const initialBox=svg.getBoundingClientRect();if(initialBox.width>0&&initialBox.height>0)viewport={width:initialBox.width,height:initialBox.height};
 status(initialState?'已回到上次觀看位置，按播放動畫繼續。':'先逐段觀察，或播放完整示範。');show();
 return {destroy(){destroyed=true;stop();observer.disconnect();if(dialog.open){dialog.close();restore(false);}abort.abort();}};
}
