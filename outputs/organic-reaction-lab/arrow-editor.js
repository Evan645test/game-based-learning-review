import {mechanismSpec,newMechanism,validWork,validateStep,validateMechanism,changeArrows,undoArrows} from './electron-flow.js';
const NS='http://www.w3.org/2000/svg';
const el=(tag,attrs={})=>{const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;};
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let serial=0;

export function mountArrowEditor(root,{kind,work,onChange,onAI,assessment=false,graded=false,spec:specOverride=null,readOnly=false,allowAI=true,revealProducts=true}) {
  // graded: practice without inline answers; the host shows tiered hints instead.
  const spec=specOverride||mechanismSpec(kind);if(!validWork(kind,work))work=newMechanism(kind);
  const prefix='flow-'+(++serial);let selectedSource='',selectedArrow=-1,feedback=null,drag=null,ghost=null,destroyed=false;
  const controller=new AbortController(),signal=controller.signal;
  const step=()=>work.steps[work.current];
  const notify=()=>{onChange(work);};
  function addArrow(from,to){
    if(!from||!to||from===to){showMessage('請選擇不同的電子來源與去向。');return;}
    if(step().arrows.length>=12){showMessage('此步已有 12 支箭頭，請先刪除不需要的箭頭。');return;}
    const electrons=Number(root.querySelector('[data-arrow-electrons]').value);
    changeArrows(work,[...step().arrows,{from,to,electrons,bend:45}]);selectedSource='';selectedArrow=step().arrows.length-1;feedback=null;notify();render();
  }
  function showMessage(message){const box=root.querySelector('[data-arrow-feedback]');box.hidden=false;box.textContent=message;}
  function chooseSite(id){if(selectedSource){const from=selectedSource;selectedSource='';addArrow(from,id);}else{selectedSource=id;root.querySelector('[data-arrow-from]').value=id;draw();root.querySelector('[data-drawing-status]').textContent='已選電子來源；再選去向，或按取消。';}}
  function render(){
    if(destroyed)return;
    const current=spec.steps[work.current],s=step(),complete=validateMechanism(kind,work).ok;
    const accessibleOptions=current.nodes.map(p=>`<option value="${p.id}">${escape(p.label)}${p.role==='bond'?'（鍵）':p.role==='lonepair'?'（電子對）':'（原子）'}</option>`).join('');
    root.innerHTML=`<section class="arrow-editor"><div class="arrow-heading"><div><h2>彎箭頭機構工作台</h2><p>從孤對電子或化學鍵出發，指向接受電子的原子或新鍵位置。</p></div><span class="mode-label">${assessment?'獨立作答':graded?'分級提示練習':'電子對移動'}</span></div><nav class="arrow-steps" aria-label="機構步驟">${spec.steps.map((s,i)=>`<button type="button" data-flow-step="${i}" class="${i===work.current?'active':''}" ${i>0&&!work.steps.slice(0,i).every(s=>s.confirmed)?'disabled':''}>${i+1}. ${escape(s.title)}${work.steps[i].confirmed?' ✓':''}</button>`).join('')}</nav><div class="arrow-canvas-wrap"><svg class="arrow-canvas" viewBox="0 0 650 340" aria-label="電子移動繪圖區。可拖曳或依序點選來源與去向，也可使用下方選單。"></svg></div><p class="arrow-caption">${escape(current.description)}</p><p class="drawing-status" data-drawing-status aria-live="polite">${assessment&&s.confirmed?'此步作答已保存。':complete?'完整機構已確認；修改任一步會重新檢查後續步驟。':'拖曳一條彎箭頭，或依序點選兩個位置。虛線圓為化學鍵選取點。'}</p><div class="arrow-form"><label>電子來源<select data-arrow-from><option value="">選擇來源</option>${accessibleOptions}</select></label><label>電子去向<select data-arrow-to><option value="">選擇去向</option>${accessibleOptions}</select></label><label>箭頭<select data-arrow-electrons><option value="2">完整箭頭（2e⁻）</option><option value="1">魚鉤箭頭（1e⁻）</option></select></label><button type="button" data-add-arrow>畫出箭頭</button></div><div class="arrow-tools"><button type="button" data-arrow-undo ${!s.history?.length?'disabled':''}>復原</button><button type="button" data-arrow-redo ${!s.redo?.length?'disabled':''}>重做</button><button type="button" data-arrow-cancel>取消選點</button><button type="button" data-arrow-clear ${!s.arrows.length?'disabled':''}>清除此步</button><button type="button" data-arrow-export>下載機構圖</button></div><ol class="arrow-list">${s.arrows.map((a,i)=>`<li><button type="button" data-select-arrow="${i}" class="${selectedArrow===i?'active':''}">${i+1}. ${escape(current.nodes.find(n=>n.id===a.from)?.label||a.from)} → ${escape(current.nodes.find(n=>n.id===a.to)?.label||a.to)} <small>${a.electrons}e⁻</small></button><button type="button" data-delete-arrow="${i}" aria-label="刪除第 ${i+1} 支箭頭">刪除</button></li>`).join('')}</ol>${selectedArrow>=0&&s.arrows[selectedArrow]?`<label class="curve-control">第 ${selectedArrow+1} 支箭頭的彎曲方向與幅度<input data-arrow-bend type="range" min="-110" max="110" value="${s.arrows[selectedArrow].bend}" aria-label="調整彎箭頭曲度"></label>`:''}<div class="arrow-bottom">${assessment||graded?'':`<button type="button" data-check-arrows>檢查電子移動</button><button type="button" data-ai-arrows>請 AI 提示修正位置</button>`}<button type="button" class="primary" data-confirm-arrows>${assessment?'保存此步機構':graded?(work.current===spec.steps.length-1?'保存最後一步':'保存此步，建立下一結構'):work.current===spec.steps.length-1?'確認完整機構':'確認此步並建立下一結構'}</button></div><div class="arrow-feedback" data-arrow-feedback role="status" aria-live="polite" ${feedback?'':'hidden'}></div><div class="arrow-product" ${s.confirmed&&revealProducts?'':'hidden'}>此步結構結果：${escape(current.product)}${assessment?'（作答結構框架；不表示箭頭正確）':''}</div></section>`;
    const q=s=>root.querySelector(s);
    root.querySelectorAll('[data-flow-step]').forEach(b=>b.onclick=()=>{work.current=Number(b.dataset.flowStep);feedback=null;selectedArrow=-1;selectedSource='';notify();render();});
    q('[data-add-arrow]').onclick=()=>addArrow(q('[data-arrow-from]').value,q('[data-arrow-to]').value);
    q('[data-arrow-undo]').onclick=()=>{undoArrows(work);feedback=null;selectedArrow=-1;notify();render();};
    q('[data-arrow-redo]').onclick=()=>{undoArrows(work,true);feedback=null;selectedArrow=-1;notify();render();};
    q('[data-arrow-cancel]').onclick=()=>{selectedSource='';draw();q('[data-drawing-status]').textContent='已取消選點。';};
    q('[data-arrow-clear]').onclick=()=>{changeArrows(work,[]);feedback=null;selectedArrow=-1;notify();render();};
    root.querySelectorAll('[data-delete-arrow]').forEach(b=>b.onclick=()=>{changeArrows(work,s.arrows.filter((_,i)=>i!==Number(b.dataset.deleteArrow)));selectedArrow=-1;feedback=null;notify();render();});
    root.querySelectorAll('[data-select-arrow]').forEach(b=>b.onclick=()=>{selectedArrow=Number(b.dataset.selectArrow);render();});
    const bend=q('[data-arrow-bend]');if(bend){let original=null;bend.oninput=()=>{original ||= structuredClone(s.arrows);s.arrows[selectedArrow].bend=Number(bend.value);draw();};bend.onchange=()=>{if(original){const changed=structuredClone(s.arrows);s.arrows=original;changeArrows(work,changed);original=null;notify();render();}};}
    if(!assessment&&!graded){q('[data-check-arrows]').onclick=()=>{feedback=validateStep(spec,work.current,s.arrows);render();};q('[data-ai-arrows]').onclick=()=>{feedback=validateStep(spec,work.current,s.arrows);render();onAI?.();};}
    q('[data-confirm-arrows]').onclick=()=>{
      const result=validateStep(spec,work.current,s.arrows);
      if(!assessment&&!graded&&!result.ok){feedback=result;render();return;}
      s.confirmed=true;s.confirmedAt=new Date().toISOString();selectedSource='';selectedArrow=-1;
      const advanced=work.current<spec.steps.length-1;
      if(advanced)work.current++;
      feedback=assessment||graded||advanced?null:result;notify();render();if(graded)showMessage(advanced?'已保存這一步並建立下一個結構；全部畫完後按「檢查箭頭」取得分級提示。':'已保存最後一步；按「檢查箭頭」取得分級提示。');else if(assessment)showMessage('機構作答已保存，提交評量後才檢查正確性。');else if(advanced)showMessage('前一步已確認，已建立下一個結構；請繪製這一步的電子移動。');
    };
    q('[data-arrow-export]').onclick=()=>{const svg=q('svg').cloneNode(true);svg.setAttribute('xmlns',NS);const blob=new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${kind}_step${work.current+1}_mechanism.svg`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
    if(feedback){const box=q('[data-arrow-feedback]');box.classList.toggle('correct',feedback.ok);if(feedback.ok)box.textContent=`此步 ${feedback.matched} 組電子移動完整。${complete?'完整機構已完成。':'請確認此步以建立下一結構。'}`;else{const ul=document.createElement('ul');for(const issue of feedback.issues){const li=document.createElement('li');li.textContent=issue.message;ul.append(li);}box.replaceChildren(ul);}}
    if(readOnly){
      root.querySelector('.arrow-heading h2').textContent='老師示範：電子如何移動';
      for(const selector of ['.arrow-form','.arrow-tools','.arrow-list','.curve-control','.arrow-bottom','.arrow-feedback','.arrow-product','.arrow-steps']){const item=root.querySelector(selector);if(item)item.hidden=true;}
      q('[data-drawing-status]').textContent='這是教學示範，不會寫入你的挑戰答案或評量分數。';
    }
    if(!allowAI&&q('[data-ai-arrows]'))q('[data-ai-arrows]').hidden=true;
    draw();
    if(readOnly)return;
    const svg=q('svg');
    const position=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse());};
    svg.addEventListener('pointerdown',e=>{const id=e.target.closest('[data-arrow-node]')?.dataset.arrowNode;if(!id)return;drag={id,x:e.clientX,y:e.clientY};svg.setPointerCapture(e.pointerId);},{signal});
    svg.addEventListener('pointermove',e=>{if(!drag)return;ghost={from:drag.id,p:position(e)};draw();},{signal});
    svg.addEventListener('pointerup',e=>{if(!drag)return;const start=drag;drag=null;ghost=null;if(Math.hypot(e.clientX-start.x,e.clientY-start.y)<6){chooseSite(start.id);return;}const p=position(e),target=current.nodes.map(n=>({id:n.id,d:Math.hypot(n.x-p.x,n.y-p.y)})).filter(n=>n.id!==start.id&&n.d<=28).sort((a,b)=>a.d-b.d)[0];if(target)addArrow(start.id,target.id);else{draw();showMessage('箭頭終點請放在原子或化學鍵的選取位置。');}},{signal});
    svg.addEventListener('pointercancel',()=>{drag=null;ghost=null;draw();},{signal});
    svg.addEventListener('keydown',e=>{const id=e.target.closest('[data-arrow-node]')?.dataset.arrowNode;if(id&&['Enter',' '].includes(e.key)){e.preventDefault();chooseSite(id);}if(e.key==='Escape'){selectedSource='';ghost=null;draw();}},{signal});
  }
  function draw(){
    if(destroyed)return;const svg=root.querySelector('svg');if(!svg)return;svg.replaceChildren();const stage=spec.steps[work.current],s=step(),nodes=new Map(stage.nodes.map(n=>[n.id,n]));
    const defs=el('defs');for(const [name,color]of [['normal','#955018'],['selected','#285c4d'],['wrong','#a43d32']])for(const electrons of [1,2]){const marker=el('marker',{id:`${prefix}-${name}-${electrons}`,viewBox:'0 0 12 12',refX:10,refY:6,markerWidth:8,markerHeight:8,orient:'auto-start-reverse'});marker.append(el('path',{'d':electrons===2?'M 1 1 L 11 6 L 1 11 Z':'M 1 1 L 11 6',fill:electrons===2?color:'none',stroke:color,'stroke-width':1.4}));defs.append(marker);}svg.append(defs);
    for(const[a,b]of stage.bonds){const p=nodes.get(a),q=nodes.get(b);if(!p||!q)continue;svg.append(el('line',{x1:p.x,y1:p.y,x2:q.x,y2:q.y,stroke:'#61736d','stroke-width':2.5}));}
    for(const n of stage.nodes){const g=el('g',{'data-arrow-node':n.id,...(readOnly?{}:{role:'button',tabindex:'0'}),'aria-label':n.label,class:'electron-site'});const title=el('title');title.textContent=n.label;g.append(title);
      g.append(el('circle',{cx:n.x,cy:n.y,r:n.role==='atom'?21:18,fill:n.role==='atom'?'#fffefa':'#f4f0df',stroke:selectedSource===n.id?'#a45c11':n.role==='atom'?'#c3cfc6':'#b4b899','stroke-width':selectedSource===n.id?3:1,'stroke-dasharray':n.role==='bond'?'3 3':'none'}));
      if(n.role==='lonepair'){for(const dx of[-4,4])g.append(el('circle',{cx:n.x+dx,cy:n.y,r:2.7,fill:'#285c4d'}));}
      else {const text=el('text',{x:n.x,y:n.y+(n.role==='atom'?5:4),'text-anchor':'middle','font-size':n.role==='atom'?13:10,fill:'#253f36','font-weight':600});text.textContent=n.role==='bond'?'σ':n.label;g.append(text);}svg.append(g);
    }
    function path(from,to,bend,electrons,name,dashed=false){const p=nodes.get(from),q=typeof to==='string'?nodes.get(to):to;if(!p||!q)return;const dx=q.x-p.x,dy=q.y-p.y,length=Math.hypot(dx,dy)||1,ux=dx/length,uy=dy/length,end=typeof to==='string'&&nodes.get(to).role==='atom'?24:10;const control={x:(p.x+q.x)/2-uy*bend,y:(p.y+q.y)/2+ux*bend};svg.append(el('path',{d:`M ${p.x} ${p.y} Q ${control.x} ${control.y} ${q.x-ux*end} ${q.y-uy*end}`,fill:'none',stroke:name==='wrong'?'#a43d32':name==='selected'?'#285c4d':'#955018','stroke-width':name==='selected'?3:2.4,'marker-end':`url(#${prefix}-${name}-${electrons})`,'stroke-dasharray':dashed?'5 4':'none','pointer-events':'none'}));}
    s.arrows.forEach((a,i)=>path(a.from,a.to,a.bend,a.electrons,feedback?.issues.some(issue=>issue.arrow===i)?'wrong':selectedArrow===i?'selected':'normal'));
    if(ghost)path(ghost.from,ghost.p,45,2,'selected',true);
  }
  render();return {get work(){return work;},destroy(){destroyed=true;controller.abort();}};
}
