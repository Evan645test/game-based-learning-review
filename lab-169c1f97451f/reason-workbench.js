import {REASON_STEPS,reasoningComplete,gradeReasoning,geometryCorrect} from './course-content.js';
import {mountArrowEditor} from './arrow-editor.js';
import {MoleculeViewer,makeModel} from './geometry.js';
import {arrowContext} from './electron-flow.js';

export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function sourceLinks(pages){return `<div class="source-links"><span>原文依據（PDF 頁碼）</span>${pages.map(p=>`<a href="source/${p}" target="_blank" rel="noopener">第 ${p} 頁</a>`).join('')}</div>`;}
export function reportHTML(c,report){
 const names={roles:'角色辨識',conditions:'環境判讀',pathway:'機構判別',mechanism:'電子與空間',product:'產物推理'};
 return `<section class="feedback-box"><h2>本次推理：<span class="report-total">${report.score}／100</span></h2><div class="score-grid">${Object.entries(names).map(([k,n])=>`<div>${n}<strong>${report.dimensions[k]}</strong><small>／20</small></div>`).join('')}</div><p>${esc(c.conclusion)}</p><ul class="report-list">${c.questions.map((q,i)=>`<li>${report.evidence.answers[i]===q.answer?'✓':'需修正'} ${esc(q.why)}</li>`).join('')}<li>電子機構 ${report.flow}／10；空間證據 ${report.space}／10。${report.flow<10?'請檢查每一步完整電子來源與去向。':''}${report.space<10?'請重新操作並保存符合此路徑的空間證據。':''}</li></ul><p>提示使用 ${report.hints} 次，不扣分。這是練習表現，正式成效請使用個人評量。</p>${sourceLinks(c.source)}</section>`;
}

export function mountReasoning(root,{caseData:c,draft:d,onSave=()=>{},onSubmit,label='提交本次推理',feedback=null}){
 const children=[];let destroyed=false,busy=false,request=null;
 const save=()=>onSave(d);
 root.innerHTML=`<div class="reaction-ticket"><h2>${esc(c.title)}</h2><div class="reaction-expression">A：${esc(c.a)} ＋ B：${esc(c.b)} → C？</div><p>${esc(c.condition)}</p></div><div class="integrated-reasoning">${REASON_STEPS.map((name,stage)=>{
  const qi=stage===5?4:stage,q=c.questions[qi];
  return `<details class="reason-section" data-reason-section="${stage}" ${stage===d.step?'open':''}><summary data-reason-step="${stage}"><span>${stage+1}</span>${esc(name)}<small data-section-status="${stage}"></small></summary><div class="reason-content">${stage===4?`<p>${esc(c.geometry)} Me 表示 CH₃；二維連接圖不取代三維構形證據。</p>${c.kinds.map(k=>`<section class="mechanism-block" data-mechanism-kind="${k}"><h3>${c.kinds.length>1?(k==='sn2'?'甲：NaI／acetone':'乙：NaOEt／ethanol'):esc(c.a)}</h3><div data-editor="${k}"></div><div data-geometry="${k}" class="geometry-work"></div></section>`).join('')}`:`<fieldset><legend>${esc(q.prompt)}</legend>${q.options.map((s,i)=>`<label class="choice"><input type="radio" data-question="${qi}" name="reason-${stage}" value="${i}" ${d.answers[qi]===i?'checked':''}><span>${esc(s)}</span></label>`).join('')}</fieldset>`}<div class="reason-tools"><button type="button" data-reason-hint="${stage}">${stage===4?'請 AI 提示電子移動':'取得推理提示'}</button>${stage<5?`<button type="button" data-continue="${stage+1}">接著：${esc(REASON_STEPS[stage+1])}</button>`:''}</div><div class="feedback-box" data-hint-box="${stage}" role="status" hidden></div></div></details>`;
 }).join('')}</div><p data-hint-count>已用提示 ${d.hints} 次；不扣分</p><div class="course-actions"><p data-reason-progress></p><button type="button" class="primary" data-reason-submit>${esc(label)}</button></div><div class="feedback-box error" data-submit-error hidden role="alert"></div>${feedback?reportHTML(c,feedback):''}`;
 const $=s=>root.querySelector(s);
 function ready(){
  const complete=reasoningComplete(c,d);$('[data-reason-progress]').textContent=complete?'所有證據已保存，可提交。':'完成五個判斷、全部機構及空間證據後提交。';$('[data-reason-submit]').disabled=!complete||busy;
  for(let stage=0;stage<6;stage++){
   const qi=stage===5?4:stage,done=stage===4?c.kinds.every(k=>d.work[k].steps.every(s=>s.confirmed)&&d.geometry[k].captured):Number.isInteger(d.answers[qi]);
   $(`[data-section-status="${stage}"]`).textContent=done?'已保存':'待完成';
  }
 }
 root.querySelectorAll('input[data-question]').forEach(input=>input.onchange=()=>{d.answers[input.dataset.question]=Number(input.value);save();ready();});
 root.querySelectorAll('[data-reason-section]').forEach(section=>section.addEventListener('toggle',()=>{if(section.open){d.step=Number(section.dataset.reasonSection);save();}}));
 root.querySelectorAll('[data-continue]').forEach(b=>b.onclick=()=>{const section=$(`[data-reason-section="${b.dataset.continue}"]`);section.open=true;section.scrollIntoView({block:'start'});});
 $('[data-reason-submit]').onclick=async()=>{
  if(busy||!reasoningComplete(c,d))return;busy=true;ready();
  try{await onSubmit(gradeReasoning(c,d));}
  catch(error){if(destroyed)return;const box=$('[data-submit-error]');box.hidden=false;box.textContent=error.message||'提交失敗，答案仍保留。';}
  finally{busy=false;if(!destroyed)ready();}
 };
 root.querySelectorAll('[data-reason-hint]').forEach(button=>button.onclick=async()=>{
  const stage=Number(button.dataset.reasonHint),box=$(`[data-hint-box="${stage}"]`);button.disabled=true;d.hints++;save();$('[data-hint-count]').textContent=`已用提示 ${d.hints} 次；不扣分`;box.hidden=false;
  if(stage!==4){const prompts=['先找到與脫離基直接相連的碳，再數它直接連接幾個碳。','找出 B 可提供電子的原子，再比較它接受質子與攻擊碳的可能性。','一起列出受質、試劑、溶劑與溫度；不要只靠一條線索。','先問是否需要碳陽離子，再問電子移動是協同還是分步。','','沿自己畫的箭頭追蹤成鍵與斷鍵，核對電荷、價數及旁觀離子。'];box.textContent='內建推理提示：'+prompts[stage];button.disabled=false;return;}
  const kind=c.kinds.find(k=>!gradeReasoning({...c,kinds:[k]},d).flow)||c.kinds[0],flow=arrowContext(kind,d.work[kind]),offline='離線電子診斷：'+(flow.diagnosis[0]||'目前這一步符合規則；請確認其他步驟與空間證據。');
  box.textContent='正在檢查本機 AI…';request=new AbortController();const timer=setTimeout(()=>request?.abort(),50000);
  try{const response=await fetch('/api/hint',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({level:c.id,context:{electronFlow:flow}}),signal:request.signal});const result=await response.json();if(!response.ok||!result.grounded||typeof result.text!=='string')throw new Error('unavailable');if(!destroyed)box.textContent=`本機 AI（${result.model}，核對過的電子診斷）：${result.text}`;}
  catch{if(!destroyed)box.textContent=offline+'（本機 AI 未連接或未完成，已使用內建規則。）';}
  finally{clearTimeout(timer);if(!destroyed)button.disabled=false;}
 });
 for(const kind of c.kinds){children.push(mountArrowEditor($(`[data-editor="${kind}"]`),{kind,work:d.work[kind],assessment:true,allowAI:false,onChange:work=>{d.work[kind]=work;save();ready();}}));children.push(mountGeometry($(`[data-geometry="${kind}"]`),kind,d.geometry[kind],()=>{save();ready();}));}
 ready();return {destroy(){destroyed=true;request?.abort();children.forEach(child=>child.destroy());}};
}

export function mountGeometry(root,kind,evidence,onChange){
 const s=evidence.state,isPlanar=['sn1','e1'].includes(kind),isChair=kind==='chair';
 root.innerHTML=`<h3>三維構形證據</h3><div class="geometry-controls">${isPlanar?`<label>反應結構<select data-geo-step><option value="0">未離解受質</option><option value="1">離解後碳陽離子</option></select></label>${kind==='sn1'?'<label>進攻面<select data-geo-face><option value="front">前面</option><option value="back">背面</option></select></label>':'<label>β-H<select data-geo-beta><option value="Hmethyl">甲基側 Hβ</option><option value="Hethyl">乙基側 Hβ</option></select></label>'}`:isChair?'<label>椅式構形<select data-geo-chair><option value="equatorial">Br 赤道向</option><option value="axial">Br 軸向</option></select></label><label>β-H<select data-geo-beta><option value="H2">H2</option><option value="H6">H6</option><option value="H6b">H6′</option></select></label>':kind==='sn2'?'<label>Nu–Cα–Br 進攻角<input data-geo-approach type="range" min="0" max="180" step="5"></label>':'<label>H–Cβ–Cα–Br 二面角<input data-geo-torsion type="range" min="0" max="360" step="5"></label><label>β-H<select data-geo-beta><option value="HB1">Hβ1</option><option value="HB2">Hβ2</option></select></label>'}</div><div class="geometry-host"></div><div class="geometry-controls"><button type="button" data-rotate-left>視角向左</button><button type="button" data-rotate-up>視角向上</button>${!isPlanar&&!isChair?'<button type="button" data-newman>切換 Newman／球棍</button>':''}<button type="button" data-view-reset>重設視角</button><button type="button" class="primary" data-capture>保存空間證據</button></div><p class="geometry-measure" data-geo-measure></p><p class="evidence-status" data-evidence-status></p>`;
 const $=selector=>root.querySelector(selector),viewer=new MoleculeViewer($('.geometry-host'),id=>{if(!['H2','H6','H6b','HB1','HB2','Hethyl','Hmethyl'].includes(id))return;s.beta=id;evidence.captured=false;update();onChange();});
 function update(){
  for(const key of ['step','face','chair','beta','approach','torsion']){const input=$(`[data-geo-${key}]`);if(input)input.value=String(s[key]);}
  const m=makeModel(kind,s);viewer.set(m,s.beta);$('[data-geo-measure]').textContent=`${m.measurementLabel}：${m.measurement.toFixed(1)}°。${m.note}`;
  $('[data-evidence-status]').textContent=evidence.captured?'已保存目前構形。提交後才檢查是否支持你的路徑。':'尚未保存；旋轉視角不會改變構形，請使用上方控制調整。';
 }
 for(const key of ['step','face','chair','beta','approach','torsion']){const input=$(`[data-geo-${key}]`);if(input)input.oninput=()=>{s[key]=['step','approach','torsion'].includes(key)?Number(input.value):input.value;evidence.captured=false;update();onChange();};}
 $('[data-capture]').onclick=()=>{evidence.captured=true;update();onChange();};$('[data-rotate-left]').onclick=()=>viewer.rotate(.3,0);$('[data-rotate-up]').onclick=()=>viewer.rotate(0,.3);$('[data-view-reset]').onclick=()=>viewer.reset();if($('[data-newman]'))$('[data-newman]').onclick=()=>{viewer.view=viewer.view==='ball'?'newman':'ball';viewer.render();};
 update();return {destroy(){viewer.destroy();}};
}
