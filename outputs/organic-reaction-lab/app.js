import {LEVELS, examItems, SOURCES} from './curriculum.js';
import {inspectGeometry, gradeLevel, recordAttempt, gradeExam, parseProgress} from './logic.js';
import {makeModel, MoleculeViewer} from './geometry.js';
import {mountArrowEditor} from './arrow-editor.js';
import {mountTeaching} from './teaching.js';
import {mechanismSpec,newMechanism,validWork,validateMechanism,arrowContext} from './electron-flow.js';

const $=(selector,root=document)=>root.querySelector(selector);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='organic-reaction-lab-v1';
let storageWritable=true,brokenRaw='',state,screen='lab',scenes=[],exam=null,examTab='pre',aiEnabled=false,aiConfig=null,aiBusy=false,aiController=null;
try {state=parseProgress(localStorage.getItem(KEY));}catch(error){state=parseProgress(null);storageWritable=false;try{brokenRaw=localStorage.getItem(KEY)||'';}catch{}showStorage('既有進度無法讀取，本次先使用暫存模式；原紀錄未覆寫。請在使用指南匯出備份後重設。');}
function showStorage(text){const el=$('#storage-notice');el.textContent=text;el.hidden=false;}
function save(){if(!storageWritable)return;try{localStorage.setItem(KEY,JSON.stringify(state));}catch{storageWritable=false;showStorage('瀏覽器無法保存進度，目前使用暫存模式。離開前請到使用指南匯出學習紀錄。');}}
let labMode=state.viewMode==='challenge'?'challenge':'teach';
let toastTimer;
function toast(text){const el=$('#toast');el.textContent=text;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{el.hidden=true;},3300);}
function sceneState(){return {approach:65,torsion:60,beta:'',chair:'equatorial',step:0,face:'front',faceSeen:[],view:'ball'};}
function draftFor(level){return state.drafts[level.id] ||= {mechanism:'',reasons:[],sequence:'',product:'',competition:'',note:'',hints:0,messages:[],scene:sceneState(),compareScene:sceneState(),compareCase:'A',evidence:{}};}
function cleanScenes(){scenes.forEach(x=>x.destroy());scenes=[];if(aiController)aiController.abort();aiController=null;aiBusy=false;}
function setScreen(next){
  if(exam&&screen==='assess'&&next!=='assess'){toast('評量進行中；可先完成或使用「結束本次作答」保留未完成紀錄。');return;}
  screen=next;render();
}
$('#nav-lab').onclick=()=>setScreen('lab');$('#nav-assess').onclick=()=>setScreen('assess');$('#nav-guide').onclick=()=>setScreen('guide');
function render(){
  cleanScenes();
  for(const [id,name]of [['nav-lab','lab'],['nav-assess','assess'],['nav-guide','guide']]){$('#'+id).classList.toggle('active',screen===name);$('#'+id).setAttribute('aria-current',screen===name?'page':'false');}
  if(screen==='lab')renderLab();else if(screen==='assess')renderAssessment();else renderGuide();
}
function options(name,values,current,type='radio'){
  return values.map(([value,text])=>`<label class="option-row"><input type="${type}" name="${name}" value="${esc(value)}" ${type==='checkbox'?(current||[]).includes(value)?'checked':'':current===value?'checked':''}><span>${esc(text)}</span></label>`).join('');
}
function selectedValues(form,name){return [...form.querySelectorAll(`[name="${name}"]:checked`)].map(el=>el.value);}

function renderLab(){
  const level=LEVELS[state.current],draft=draftFor(level),completed=Object.values(state.levels).filter(r=>r.passed).length;
  $('#main').innerHTML=`<div class="lab-layout"><aside class="sidebar"><div class="sidebar-heading"><h2>反應任務</h2><span>六個關卡</span></div><nav class="level-nav" aria-label="關卡選擇">${LEVELS.map((l,i)=>`<button class="level-button ${i===state.current?'active':''} ${state.levels[l.id]?.passed?'passed':''}" data-level="${i}" aria-current="${i===state.current?'step':'false'}"><span class="level-number">${state.levels[l.id]?.passed?'✓':String(i+1).padStart(2,'0')}</span><span><strong>${esc(l.name)}</strong><small>${esc(l.mechanism)}${state.levels[l.id]?' ／ '+state.levels[l.id].best+' 分':''}</small></span></button>`).join('')}</nav><div class="sidebar-foot"><h3>探索進度</h3><div class="progress-track" role="progressbar" aria-label="已通過關卡" aria-valuenow="${completed}" aria-valuemin="0" aria-valuemax="6"><span style="width:${completed/6*100}%"></span></div><p>${completed}／6 關通過</p><p style="margin-top:14px">先觀察，再推論。<br>每個判斷，都留下一份證據。</p><button class="small quiet" id="sidebar-assess">前往學習評量</button></div></aside><section class="workarea"><div class="chapter-label"><span></span>第 ${state.current+1} 關 ／ ${esc(level.subtitle)}</div><div class="level-heading"><div><h1>${esc(level.name)}</h1><p>${esc(level.brief)}</p></div><span class="mechanism-tag">${esc(level.mechanism)}</span></div><div class="case-strip">${[['受質',level.substrate],['試劑',level.reagent],['溶劑',level.solvent],['條件',level.temperature]].map(([title,text])=>`<dl><dt>${title}</dt><dd>${esc(text)}</dd></dl>`).join('')}</div><div class="work-grid"><div class="stage-column"><div id="scene-root"></div><div id="arrow-root"></div><section class="ai-panel" aria-labelledby="ai-title"><div class="ai-heading"><h2 id="ai-title">AI 學習夥伴</h2><span id="ai-mode" class="mode-label">離線分層提示</span></div><p id="ai-description">${esc(level.objective)}</p><div id="ai-message" class="ai-message" aria-live="polite">${esc(draft.messages.at(-1)?.text||'先提出自己的判斷。卡住時，我會引導你檢查條件與空間證據。')}</div><div class="ai-actions"><button id="hint-button">給我一個提示 <span id="hint-count">${draft.hints}/3</span></button><button id="diagnose-button">檢查目前思路</button></div><details><summary>提示模式與本機 AI</summary><p>偵測到可用的本機 Ollama 時，提示會即時生成；否則使用本活動內建的三層提示。按提示按鈕才會傳送本關答案、觀察數值及文字筆記，可在此停用即時 AI。</p><button id="connect-ai" class="small">${aiEnabled?'停用即時 AI':'檢查並連接本機 AI'}</button><p id="ai-connect-status"></p></details></section><details class="walkthrough"><summary>這一關怎麼操作？</summary><p>① 調整下方構形控制。② 選取可反應的位置。③ 按「保存空間證據」。④ 完成彎箭頭：依序點來源與去向或直接拖曳。⑤ 確認各步機構，再完成右側判斷並提交。可點模型上的氫，也可用文字按鈕選取。</p><p>球棍模型為反應中心的簡化幾何。Me＝CH₃。動畫步驟不代表真實時間，角度不直接換算成速率或產率。</p></details></div><section class="answer-column" aria-labelledby="answer-title"><div class="answer-heading"><h2 id="answer-title">建立你的反應報告</h2><span>共 10 分</span></div><form id="answer-form"><fieldset class="question-section"><legend>1. 哪條路徑較合理？</legend><div class="option-grid">${level.mechanisms.map(m=>`<label class="option-pill"><input type="radio" name="mechanism" value="${esc(m)}" ${draft.mechanism===m?'checked':''}><span>${esc(m)}</span></label>`).join('')}</div></fieldset><fieldset class="question-section"><legend>2. 選出兩項支持條件</legend>${options('reasons',level.reasons.map(r=>[r.id,r.text]),draft.reasons,'checkbox')}</fieldset><fieldset class="question-section"><legend>3. 機構敘述（須同時完成左側彎箭頭）</legend>${options('sequence',level.sequences,draft.sequence)}</fieldset><fieldset class="question-section"><legend>4. 產物與立體化學</legend>${options('product',level.products,draft.product)}</fieldset><fieldset class="question-section"><legend>5. 競爭路徑與限制</legend>${options('competition',level.competitions,draft.competition)}</fieldset><div class="question-section"><label class="choice-label" for="reason-note">你的證據說明 <small>供自己與教師檢視，不自動評分</small></label><textarea id="reason-note" maxlength="2000" placeholder="我觀察到……，所以認為……">${esc(draft.note)}</textarea></div><div id="form-error" class="inline-error" role="alert" hidden></div><div class="submit-row"><button class="primary" type="submit">提交反應報告</button><button type="button" id="next-level" ${state.current===5?'hidden':''}>下一關</button></div><p class="report-note">8 分以上，且路徑、彎箭頭機構、產物與空間證據正確才過關。提示不扣分；首次作答另行保留。各關可自由探索。</p><div id="grade-response" aria-live="polite"></div></form></section></div></section></div>`;
  document.querySelectorAll('[data-level]').forEach(button=>button.onclick=()=>{state.current=Number(button.dataset.level);labMode='teach';state.viewMode='teach';save();render();});
  $('#sidebar-assess').onclick=()=>setScreen('assess');
  $('#next-level').onclick=()=>{state.current++;labMode='teach';state.viewMode='teach';save();render();window.scrollTo({top:0,behavior:'instant'});};
  const form=$('#answer-form');
  function sync(){draft.mechanism=form.elements.mechanism?.value||'';draft.reasons=selectedValues(form,'reasons');draft.sequence=form.elements.sequence?.value||'';draft.product=form.elements.product?.value||'';draft.competition=form.elements.competition?.value||'';draft.note=$('#reason-note').value;save();}
  form.addEventListener('change',sync);$('#reason-note').addEventListener('input',sync);
  form.onsubmit=e=>{e.preventDefault();sync();if(!draft.mechanism||draft.reasons.length!==2||!draft.sequence||!draft.product||!draft.competition){$('#form-error').textContent='請完成五個判斷，並恰好選擇兩項支持條件。';$('#form-error').hidden=false;return;}
    $('#form-error').hidden=true;
    const spatial=level.kind==='compare'?draft.evidence.A?.valid&&draft.evidence.B?.valid:draft.evidence.main?.valid;
    const arrowComplete=level.kind==='compare'?validateMechanism('sn2',draft.arrowWorks?.A).ok&&validateMechanism('e2',draft.arrowWorks?.B).ok:validateMechanism(level.kind,draft.arrowWorks?.main).ok;
    const result=gradeLevel(level,draft,spatial,arrowComplete),attempt={...result,hints:draft.hints,aiUsed:draft.messages.some(m=>m.mode==='live'),at:new Date().toISOString(),draft:structuredClone(draft)};
    state.levels[level.id]=recordAttempt(state.levels[level.id],attempt);save();showGrade(level,result);
    const button=$(`[data-level="${state.current}"]`);button.classList.toggle('passed',state.levels[level.id].passed);$('.level-number',button).textContent=state.levels[level.id].passed?'✓':String(state.current+1).padStart(2,'0');$('small',button).textContent=level.mechanism+' ／ '+state.levels[level.id].best+' 分';const done=Object.values(state.levels).filter(r=>r.passed).length;$('.sidebar-foot .progress-track').setAttribute('aria-valuenow',done);$('.sidebar-foot .progress-track span').style.width=(done/6*100)+'%';$('.sidebar-foot p').textContent=done+'／6 關通過';
  };
  const workGrid=$('.work-grid');
  workGrid.insertAdjacentHTML('beforebegin','<nav class="learning-modes" aria-label="教學與挑戰"><button id="mode-teach" class="'+(labMode==='teach'?'active':'')+'">先學這一關</button><button id="mode-challenge" class="'+(labMode==='challenge'?'active':'')+'">獨立挑戰</button><span>先認識反應、電子與條件，再動手畫機構。</span></nav><div id="teaching-root"></div>');
  const changeMode=mode=>{labMode=mode;state.viewMode=mode;save();render();};
  $('#mode-teach').onclick=()=>changeMode('teach');$('#mode-challenge').onclick=()=>changeMode('challenge');
  workGrid.hidden=labMode==='teach';
  if(labMode==='teach'){
    state.lessons ||= {};state.lessons[level.id] ||= {stage:0,answers:{}};
    scenes.push(mountTeaching($('#teaching-root'),{level,progress:state.lessons[level.id],onSave:save,onChallenge:()=>changeMode('challenge')}));
  }else{mountLabScene(level,draft);mountLabArrows(level,draft,sync);}

  $('#hint-button').onclick=()=>requestHint(level,draft,false,sync);
  $('#diagnose-button').onclick=()=>requestHint(level,draft,true,sync);
  $('#connect-ai').onclick=async()=>{
    if(aiEnabled){aiEnabled=false;updateAiMode();return;}
    const button=$('#connect-ai');button.disabled=true;$('#ai-connect-status').textContent='正在檢查本機服務……';
    try{const r=await fetch('/api/config',{signal:AbortSignal.timeout(5000)});if(!r.ok)throw new Error();aiConfig=await r.json();if(!aiConfig.available){$('#ai-connect-status').textContent=aiConfig.message||'尚未啟動 Ollama；目前仍可使用離線提示。';return;}aiEnabled=true;$('#ai-connect-status').textContent=`已連接 ${aiConfig.model}。生成回饋供參考，評分仍依內建規則。`;updateAiMode();}catch{$('#ai-connect-status').textContent='目前未連接 AI 伺服器。請以 python3 server.py 啟動；離線提示仍可使用。';}finally{if(button.isConnected)button.disabled=false;}
  };
  updateAiMode();
  if(state.levels[level.id]?.attempts.length)showGrade(level,state.levels[level.id].attempts.at(-1));
}
function showGrade(level,result){
  const labels={arrows:'彎箭頭機構',mechanism:'路徑判斷',reasons:'條件證據',steps:'機構步驟',spatial:'三維證據',product:'產物判斷',competition:'競爭與限制'};
  const record=state.levels[level.id];
  $('#grade-response').innerHTML=`<div class="response ${result.passed?'':'retry'}"><h3>${result.passed?'任務完成':'再檢查一下'}　${result.score}／10</h3><div class="check-list">${Object.entries(result.checks).map(([k,ok])=>`<span>${ok?'✓':'○'} ${labels[k]}</span>`).join('')}</div><p>${esc(level.explanation)}</p><p><small>首次 ${record?.first.score??result.score} 分 ／ 最佳 ${record?.best??result.score} 分。這是本關練習結果，正式成效請看個人評量。</small></p></div>`;
}
function arrowWorkFor(level,draft){
  const key=level.kind==='compare'?draft.compareCase:'main';
  const kind=level.kind==='compare'?(key==='A'?'sn2':'e2'):level.kind;
  draft.arrowWorks ||= {};
  if(!validWork(kind,draft.arrowWorks[key])){
    if(draft.arrowWorks[key]){draft.arrowRecovery ||= {};draft.arrowRecovery[key]=draft.arrowWorks[key];}
    draft.arrowWorks[key]=newMechanism(kind);
  }
  return {key,kind,work:draft.arrowWorks[key]};
}
function mountLabArrows(level,draft,sync){
  const {key,kind,work}=arrowWorkFor(level,draft);
  const root=$('#arrow-root');
  if(level.kind==='compare'){root.innerHTML='<p class="control-help" style="margin-bottom:10px">此處繪製案件 '+key+' 的機構；案件 A、B 各自保存，兩者都要完成。</p><div data-editor-host></div>';}
  const editor=mountArrowEditor(level.kind==='compare'?$('[data-editor-host]',root):root,{kind,work,onChange:next=>{draft.arrowWorks[key]=next;save();},onAI:()=>{requestHint(level,draft,true,sync);}});
  scenes.push(editor);
}
function mountLabScene(level,draft){
  const root=$('#scene-root');
  if(level.kind==='compare'){
    root.innerHTML=`<div class="subnav" style="margin-top:0"><button id="case-a" class="${draft.compareCase==='A'?'active':''}">案件 A：NaI</button><button id="case-b" class="${draft.compareCase==='B'?'active':''}">案件 B：NaOEt</button></div><div id="comparison-scene"></div>`;
    $('#case-a').onclick=()=>{draft.compareCase='A';save();render();};$('#case-b').onclick=()=>{draft.compareCase='B';save();render();};
    const key=draft.compareCase,kind=key==='A'?'sn2':'e2';
    mountScene($('#comparison-scene'),kind,key==='A'?draft.scene:draft.compareScene,draft.evidence[key],snap=>{draft.evidence[key]=snap;save();},save);
    const status=document.createElement('p');status.className='control-help';status.textContent=`A 證據：${draft.evidence.A?.valid?'已保存':'待完成'}　／　B 證據：${draft.evidence.B?.valid?'已保存':'待完成'}`;root.append(status);
  }else mountScene(root,level.kind,draft.scene,draft.evidence.main,snap=>{draft.evidence.main=snap;save();},save);
}

function mountScene(root,kind,s,saved,onSave,onChange,assessment=false){
  const id='scene-'+Math.random().toString(36).slice(2,9),isAngular=['sn2','e2'].includes(kind),isSN2=kind==='sn2';
  root.innerHTML=`<section class="stage" aria-label="分子觀察台"><div class="stage-top"><h2>三維觀察台</h2>${isAngular?`<div class="segmented"><button data-view="ball" class="${s.view==='ball'?'active':''}">球棍</button><button data-view="newman" class="${s.view==='newman'?'active':''}">Newman</button></div>`:'<small>球棍模型</small>'}</div><div class="molecule-host"></div><div class="viewer-actions"><button type="button" data-rotate="left" aria-label="向左旋轉視角">↶ 左轉</button><button type="button" data-rotate="right" aria-label="向右旋轉視角">右轉 ↷</button><button type="button" data-rotate="up" aria-label="向上旋轉視角">仰視</button><button type="button" data-rotate="down" aria-label="向下旋轉視角">俯視</button><button type="button" data-zoom="in" aria-label="放大分子">＋</button><button type="button" data-zoom="out" aria-label="縮小分子">−</button><button type="button" data-reset>重設視角</button></div></section><p class="stage-note">拖曳模型可旋轉視角。下方控制才會改變進攻方向或分子構形。Me＝CH₃；虛線表示進攻方向，非已形成的鍵。</p><div class="controls">${isAngular?`<label class="control-title" for="${id}-angle">${isSN2?'進攻角 Nu–Cα–Br':'單鍵構形 H–Cβ–Cα–Br'}<output data-angle-output></output></label><div class="range-row"><input id="${id}-angle" data-angle type="range" min="0" max="${isSN2?180:360}" step="1" value="${isSN2?s.approach:s.torsion}" aria-label="${isSN2?'進攻角':'單鍵構形二面角'}"><input data-angle-number type="number" min="0" max="${isSN2?180:360}" step="1" value="${isSN2?s.approach:s.torsion}" aria-label="${isSN2?'輸入進攻角度':'輸入構形二面角'}"></div><div class="range-ends"><span>0°</span><span>${isSN2?'180°':'360°'}</span></div>`:''}${kind==='sn1'||kind==='e1'?`<div class="control-title">機構步驟 <output data-step-label></output></div><div class="step-buttons"><button type="button" data-step="0">受質</button><button type="button" data-step="1">脫離基離開</button>${kind==='sn1'?'<button type="button" data-step="2">親核進攻</button>':''}</div>${kind==='sn1'?'<div class="atom-picks"><button type="button" data-face="front">前面進攻</button><button type="button" data-face="back">背面進攻</button></div><p class="control-help">先建立中間體，再比較兩面；tert-butyl 本身不具手性。第 3 步模型呈現水進攻的氧陽離子階段，後續仍需去質子化。</p>':''}`:''}${kind==='chair'?'<div class="control-title">椅式構形 <output data-chair-label></output></div><div class="step-buttons"><button type="button" data-chair="equatorial">雙赤道向椅式</button><button type="button" data-chair="axial">翻至雙軸向椅式</button></div><p class="control-help">Br 始終向上、Me 始終向下；翻環不改變 cis／trans。</p>':''}${kind==='e2'?'<div class="atom-picks"><button type="button" data-beta="HB1">選 Hβ1</button><button type="button" data-beta="HB2">選 Hβ2</button></div>':kind==='chair'?'<div class="atom-picks"><button type="button" data-beta="H2">選 C2 的 H2</button><button type="button" data-beta="H6">選 C6 的 H6（向下）</button><button type="button" data-beta="H6b">選 C6 的 H6′（向上）</button></div>':kind==='e1'?'<div class="atom-picks"><button type="button" data-beta="Hethyl">選乙基側 β-H</button><button type="button" data-beta="Hmethyl">選甲基側 β-H</button></div>':''}<p class="control-help" data-measure></p><div class="evidence-row"><span class="evidence-status ${saved?.valid&&!assessment?'saved':''}" data-status>${saved?(assessment?'已保存觀察紀錄':saved.valid?'✓ 已保存有效空間證據':'尚未保存空間證據'):'尚未保存空間證據'}</span><button type="button" data-capture>保存空間證據</button></div><p class="evidence-snapshot" data-snapshot>${saved?esc(snapshotText(saved)):''}</p><p class="inline-error" data-spatial-error role="status" hidden></p></div>`;
  function chooseBeta(beta){if(kind==='e2'&&s.beta!==beta){const old=s.beta==='HB2'?120:0;const next=beta==='HB2'?120:0;s.torsion=(s.torsion+next-old+360)%360;const range=$('[data-angle]',root),number=$('[data-angle-number]',root);if(range)range.value=s.torsion;if(number)number.value=s.torsion;}s.beta=beta;refresh();onChange();}
  const viewer=new MoleculeViewer($('.molecule-host',root),atom=>{if(['HB1','HB2','H2','H6','H6b','Hethyl','Hmethyl'].includes(atom))chooseBeta(atom);});scenes.push(viewer);
  function refresh(){
    const model=makeModel(kind,s);viewer.view=s.view;viewer.set(model,s.beta);
    const out=$('[data-angle-output]',root);if(out)out.textContent=`${Math.round(model.measurement)}°`;
    const measure=$('[data-measure]',root);measure.textContent=`${model.measurementLabel}：${Math.round(model.measurement)}°${s.beta?'；目前選取 '+s.beta:''}。${kind==='e2'||kind==='chair'?'角度由模型內部座標計算。':''}`;
    for(const button of root.querySelectorAll('[data-beta]'))button.classList.toggle('active',s.beta===button.dataset.beta);
    for(const button of root.querySelectorAll('[data-step]'))button.classList.toggle('active',s.step===Number(button.dataset.step));
    for(const button of root.querySelectorAll('[data-face]')){button.classList.toggle('active',s.face===button.dataset.face);button.disabled=s.step<1;}
    for(const button of root.querySelectorAll('[data-chair]'))button.classList.toggle('active',s.chair===button.dataset.chair);
    const step=$('[data-step-label]',root);if(step)step.textContent=s.step===0?'四面體受質':s.step===1?'平面碳陽離子':'親核進攻階段';
    const chair=$('[data-chair-label]',root);if(chair)chair.textContent=s.chair==='axial'?'Br 軸向':'Br 赤道向';
    for(const button of root.querySelectorAll('[data-view]'))button.classList.toggle('active',s.view===button.dataset.view);
  }
  root.querySelectorAll('[data-rotate]').forEach(button=>button.onclick=()=>{const dirs={left:[-.3,0],right:[.3,0],up:[0,-.3],down:[0,.3]};viewer.rotate(...dirs[button.dataset.rotate]);});
  root.querySelectorAll('[data-zoom]').forEach(button=>button.onclick=()=>{viewer.zoom=Math.max(.65,Math.min(1.5,viewer.zoom+(button.dataset.zoom==='in'?.1:-.1)));viewer.render();});
  $('[data-reset]',root).onclick=()=>viewer.reset();
  root.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>{s.view=button.dataset.view;refresh();onChange();});
  function changeAngle(value){const num=Number(value);if(!Number.isFinite(num))return;const angle=Math.max(0,Math.min(isSN2?180:360,num));s[isSN2?'approach':'torsion']=angle;$('[data-angle]',root).value=angle;$('[data-angle-number]',root).value=angle;refresh();onChange();}
  if(isAngular){$('[data-angle]',root).oninput=e=>changeAngle(e.target.value);$('[data-angle-number]',root).onchange=e=>changeAngle(e.target.value);}
  root.querySelectorAll('[data-beta]').forEach(button=>button.onclick=()=>{chooseBeta(button.dataset.beta);});
  root.querySelectorAll('[data-step]').forEach(button=>button.onclick=()=>{s.step=Number(button.dataset.step);if(kind==='sn1'&&s.step>=1&&!s.faceSeen.includes(s.face))s.faceSeen.push(s.face);refresh();onChange();});
  root.querySelectorAll('[data-face]').forEach(button=>button.onclick=()=>{s.face=button.dataset.face;if(s.step>=1&&!s.faceSeen.includes(s.face))s.faceSeen.push(s.face);refresh();onChange();});
  root.querySelectorAll('[data-chair]').forEach(button=>button.onclick=()=>{s.chair=button.dataset.chair;refresh();onChange();});
  $('[data-capture]',root).onclick=()=>{
    const result=inspectGeometry(kind,s),model=makeModel(kind,s);
    const geometric=kind==='sn2'||kind==='e2'?Math.abs(model.measurement-180)<=12:kind==='chair'?Math.abs(model.measurement-180)<=12:true;
    if(!assessment&&(!result.ok||!geometric)){const error=$('[data-spatial-error]',root);error.textContent=assessment?'目前觀察尚未符合所選反應的空間條件，請重新檢查並操作。':result.reason;error.hidden=false;return;}
    const snap={valid:result.ok&&geometric,kind,at:new Date().toISOString(),state:structuredClone(s),measurement:model.measurement,view:{yaw:viewer.yaw,pitch:viewer.pitch,zoom:viewer.zoom}};
    onSave(snap);$('[data-status]',root).textContent=assessment?'已保存觀察紀錄':'✓ 已保存有效空間證據';if(!assessment)$('[data-status]',root).classList.add('saved');$('[data-snapshot]',root).textContent=snapshotText(snap);$('[data-spatial-error]',root).hidden=true;toast('已保存這個構形與觀察數值。');
  };
  refresh();
}
function snapshotText(snap){return `${snap.kind.toUpperCase()} ｜ ${Math.round(snap.measurement)}°${snap.state.beta?' ｜ '+snap.state.beta:''}${snap.kind==='sn1'?' ｜ 已比較兩面進攻':''}${snap.kind==='chair'?' ｜ Br 軸向':''}`;}
function updateAiMode(){const el=$('#ai-mode');if(el)el.textContent=aiEnabled?'本機 AI 已連接':'離線分層提示';const button=$('#connect-ai');if(button)button.textContent=aiEnabled?'停用即時 AI':'檢查並連接本機 AI';}
async function requestHint(level,draft,diagnose,sync){
  if(aiBusy)return;sync();
  const flow=arrowWorkFor(level,draft),electronFlow=arrowContext(flow.kind,flow.work);
  let fallback;
  if(diagnose){const r=inspectGeometry(level.kind==='compare'?(draft.compareCase==='A'?'sn2':'e2'):level.kind,level.kind==='compare'&&draft.compareCase==='B'?draft.compareScene:draft.scene);fallback=electronFlow.diagnosis.length?electronFlow.diagnosis[0]:!draft.mechanism?'先選擇一個你認為合理的路徑，再提出條件理由。':!r.ok?r.reason:draft.reasons.length!==2?'空間觀察已有進展。接著挑選兩項真正支持你判斷的條件，留意親核性與鹼性的差別。':'請核對機構先後順序，並用自己的話說明：目前的證據能排除哪條路徑，還有哪些競爭反應？';}
  else {const i=Math.min(draft.hints,2);fallback=electronFlow.arrows.length&&electronFlow.diagnosis.length?electronFlow.diagnosis[0]:level.hints[i];draft.hints=Math.min(draft.hints+1,3);}
  $('#hint-count').textContent=`${draft.hints}/3`;
  let text=fallback,mode='offline';
  if(aiEnabled){
    aiBusy=true;aiController=new AbortController();const controller=aiController;$('#hint-button').disabled=true;$('#diagnose-button').disabled=true;$('#ai-message').textContent='正在根據你的觀察提出追問……';const timeout=setTimeout(()=>controller.abort(),50000);
    try{const r=await fetch('/api/hint',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({level:level.id,question:diagnose?'診斷目前思路':'提供下一層提示',hintLevel:draft.hints,context:{mechanism:draft.mechanism,reasons:draft.reasons,sequence:draft.sequence,product:draft.product,note:draft.note.slice(0,1000),scene:draft.scene,compareScene:draft.compareScene,electronFlow},fallback}),signal:controller.signal});if(!r.ok)throw new Error();const data=await r.json();if(typeof data.text!=='string'||!data.text.trim())throw new Error();text=data.text.slice(0,1800);mode='live';}catch{if(controller.signal.aborted&&aiController!==controller)return;if(screen!=='lab'||LEVELS[state.current].id!==level.id||!$('#ai-message'))return;text=`即時 AI 暫時無法回應，改用離線提示：\n${fallback}`;}finally{clearTimeout(timeout);if(aiController===controller){aiBusy=false;aiController=null;if($('#hint-button')){$('#hint-button').disabled=false;$('#diagnose-button').disabled=false;}}}
  }
  if(screen!=='lab'||LEVELS[state.current].id!==level.id)return;
  draft.messages.push({text,mode,at:new Date().toISOString(),hintLevel:draft.hints});if(draft.messages.length>60)draft.messages.shift();save();if($('#ai-message'))$('#ai-message').textContent=text;
}

const examNames={pre:'課前前測',post:'課後後測',delay:'一週後延後測驗'};
function renderAssessment(){
  const tabs=[['pre','課前前測'],['post','課後後測'],['delay','延後測驗'],['results','成效總覽']];
  $('#main').innerHTML=`<section class="page"><div class="chapter-label"><span></span>個人學習證據</div><h1>把過關，轉成真正的理解</h1><p class="page-intro">練習可以合作，評量請獨立完成。保留每次測驗，並分開檢視條件判斷、機構與空間推理。</p><nav class="subnav" aria-label="評量類型">${tabs.map(([id,label])=>`<button data-exam-tab="${id}" class="${examTab===id?'active':''}" ${exam?'disabled':''}>${label}</button>`).join('')}</nav><div id="assessment-body"></div></section>`;
  $('[data-exam-tab="'+examTab+'"]')?.setAttribute('aria-current','page');
  document.querySelectorAll('[data-exam-tab]').forEach(button=>button.onclick=()=>{examTab=button.dataset.examTab;render();});
  if(exam)renderExamQuestion();else if(examTab==='results')renderResults();else renderExamStart();
}
function renderExamStart(){
  const records=state.exams[examTab]||[],latest=records.at(-1);
  $('#assessment-body').innerHTML=`<div class="assess-layout"><div><section class="assessment-card"><h2>${examNames[examTab]}</h2><p class="page-intro">9 題，100 分。建議 30 分鐘，不設強制倒數。三份題本使用不同受質或條件，空間題保留相同工具。</p><ul class="summary-list"><li>條件整合：40 分</li><li>機構與電子移動：20 分</li><li>三維空間推理：30 分（各題含操作證據 5 分）</li><li>證據與限制：10 分</li></ul><p class="report-note">原型採選擇題、三維構形與彎箭頭操作。機構理解 20 分中，10 分為實際箭頭；文字論證另由教師評閱。題本尚未經學生試測校準。</p><button class="primary" id="start-exam" style="margin-top:18px">${records.length?'開始新一次作答':'開始個人作答'}</button></section>${latest?resultMarkup(latest,examNames[examTab]+'最近一次'):''}${records.length?`<div class="history-list">${records.map((r,i)=>`<span>第 ${i+1} 次：${r.score} 分 ／ ${formatTime(r.at)}${r.incomplete?' ／ 提早結束':''}</span>`).join('')}</div>`:''}</div><aside class="assessment-info"><h2>作答約定</h2><p>評量期間不提供 AI 或正誤提示。每題可返回修改，提交後才看結果。</p><ul><li>三維證據會記錄角度與所選原子。</li><li>空間題選對但未保存證據，可得概念分，操作分為 0。</li><li>首次成績會一直保留，重測另列。</li><li>學習紀錄僅存於此瀏覽器，可匯出備份。</li></ul></aside></div>`;
  $('#start-exam').onclick=()=>{exam={form:examTab,index:0,answers:{},evidence:{},scenes:{},mechanisms:{},startedAt:new Date().toISOString()};render();};
}
function renderExamQuestion(){
  const items=examItems(exam.form),q=items[exam.index];
  $('#assessment-body').innerHTML=`<div class="assess-layout"><section><div class="exam-progress"><span>${examNames[exam.form]} ／ 第 ${exam.index+1} 題，共 ${items.length} 題</span><span>已回答 ${Object.keys(exam.answers).length}／${items.length}</span></div><div class="assessment-card"><p class="question-meta">${esc(q.dimension)} ／ ${q.points} 分</p><fieldset><legend>${esc(q.prompt)}</legend>${options('exam-answer',q.options,exam.answers[q.id])}</fieldset>${q.spatial?'<div class="exam-viewer" id="exam-scene"></div>':''}${q.mechanism?'<div class="exam-arrow-editor" id="exam-arrows"></div>':''}<label class="choice-label" for="exam-note" style="margin-top:15px">推理筆記 <small>不自動評分</small></label><textarea id="exam-note" maxlength="1500">${esc(exam.notes?.[q.id]||'')}</textarea></div><div class="exam-bottom"><button id="end-exam" class="quiet">結束本次作答</button><div><button id="exam-prev" ${exam.index===0?'disabled':''}>上一題</button><button id="exam-next" class="primary">${exam.index===items.length-1?'提交評量':'下一題'}</button></div></div><div id="exam-submit-confirm" class="response retry" hidden><p>尚有未回答題目、未保存的機構或空間證據。未完成項目以 0 分計，確定提交？</p><button id="confirm-exam" style="margin-top:10px">確定提交並保留紀錄</button><button id="cancel-exam-submit">繼續作答</button></div></section><aside class="assessment-info"><h2>獨立作答中</h2><p>AI 與練習回饋已關閉。請用同一組工具，呈現自己的判斷。</p><div class="progress-track"><span style="width:${(exam.index+1)/items.length*100}%"></span></div><p>已用時 <span id="exam-elapsed">${Math.floor((Date.now()-Date.parse(exam.startedAt))/60000)}</span> 分鐘。離開或重新整理前請先提交；尚未提交的測驗不會存成成績。</p><p>角度、模型位置與筆記不會換算成真實產率。</p></aside></div>`;
  document.querySelectorAll('[name="exam-answer"]').forEach(input=>input.onchange=()=>{exam.answers[q.id]=input.value;});
  $('#exam-note').oninput=e=>{exam.notes ||= {};exam.notes[q.id]=e.target.value;};
  if(q.spatial){const s=exam.scenes[q.id] ||= {...sceneState(),approach:exam.form==='pre'?55:exam.form==='post'?85:110,torsion:exam.form==='pre'?60:exam.form==='post'?100:250};mountScene($('#exam-scene'),q.spatial,s,exam.evidence[q.id],snapshot=>{exam.evidence[q.id]=snapshot;},()=>{},true);}
  if(q.mechanism){const work=exam.mechanisms[q.id] ||= newMechanism(q.mechanism);scenes.push(mountArrowEditor($('#exam-arrows'),{kind:q.mechanism,work,onChange:w=>{exam.mechanisms[q.id]=w;},assessment:true}));}
  $('#exam-prev').onclick=()=>{exam.index--;render();};
  $('#exam-next').onclick=()=>{if(exam.index<items.length-1){exam.index++;render();}else finishOrConfirm();};
  $('#end-exam').onclick=()=>{$('#exam-submit-confirm').hidden=false;};$('#confirm-exam').onclick=()=>finishExam();$('#cancel-exam-submit').onclick=()=>{$('#exam-submit-confirm').hidden=true;};
}
function finishOrConfirm(){const items=examItems(exam.form);if(items.some(q=>!Object.hasOwn(exam.answers,q.id)||q.spatial&&!exam.evidence[q.id]||q.mechanism&&!exam.mechanisms[q.id]?.steps.every(s=>s.confirmed))){$('#exam-submit-confirm').hidden=false;return;}finishExam();}
function finishExam(){const items=examItems(exam.form),result={...gradeExam(items,exam.answers,exam.evidence,exam.mechanisms),gradingVersion:'arrows-v1',mechanisms:exam.mechanisms,answers:exam.answers,evidence:exam.evidence,notes:exam.notes||{},at:new Date().toISOString(),startedAt:exam.startedAt,incomplete:items.some(q=>!Object.hasOwn(exam.answers,q.id)),durationSeconds:Math.round((Date.now()-Date.parse(exam.startedAt))/1000)};(state.exams[exam.form] ||= []).push(result);const form=exam.form;exam=null;examTab=form;save();render();toast('評量已保存，首次成績與歷次紀錄都會保留。');}
function resultMarkup(result,label){return `<section class="assessment-card"><h2>${esc(label)}</h2><div class="result-big"><strong>${result.score}</strong><span>／100 分</span></div><div class="score-bars">${Object.entries(result.dimensions).map(([label,d])=>`<div><div class="bar-title"><span>${esc(label)}</span><span>${d.earned}／${d.possible}</span></div><div class="scorebar"><span style="width:${d.earned/d.possible*100}%"></span></div></div>`).join('')}</div><p class="report-note">${formatTime(result.at)}${result.incomplete?'；本次提早結束，未答項目以 0 分計。':''}</p></section>`;}
function renderResults(){
  const first={};for(const key of ['pre','post','delay'])first[key]=state.exams[key]?.[0];
  const gain=first.pre&&first.post?first.post.score-first.pre.score:null;
  $('#assessment-body').innerHTML=`<div class="two-col"><section class="assessment-card"><h2>首次評量比較</h2><p class="page-intro">以下固定使用各階段第一次紀錄；重測不覆寫。舊版未含彎箭頭的評量，與本版分數不能直接比較。</p><div class="table-wrap"><table class="scores-table"><thead><tr><th>階段</th><th>首次</th><th>最近一次</th><th>次數</th></tr></thead><tbody>${['pre','post','delay'].map(k=>`<tr><td>${examNames[k]}</td><td>${first[k]?.score??'尚未作答'}</td><td>${state.exams[k]?.at(-1)?.score??'—'}</td><td>${state.exams[k]?.length||0}</td></tr>`).join('')}</tbody></table></div><p style="margin-top:18px">${gain===null?'完成前測與後測後，這裡會顯示分數變化。':`首次前後測變化：${gain>=0?'+':''}${gain} 分。`}</p><p class="report-note">這是個人分數變化，不代表 AI 或三維功能的因果效果；題本尚未校準，請配合教師檢視推理筆記。</p><button id="export-results" style="margin-top:18px">匯出完整學習紀錄</button></section><section class="assessment-card"><h2>六關練習軌跡</h2><div class="table-wrap"><table class="scores-table"><thead><tr><th>關卡</th><th>首次</th><th>最佳</th><th>提示／次數</th></tr></thead><tbody>${LEVELS.map(l=>{const r=state.levels[l.id];return `<tr><td>${esc(l.name)}</td><td>${r?.first.score??'—'}</td><td>${r?.best??'—'}</td><td>${r?`${r.attempts.at(-1).hints}／${r.attempts.length}`:'—'}</td></tr>`;}).join('')}</tbody></table></div><p class="report-note">提示欄為最近一次提交時使用的提示層級。自由文字未自動評分；首次作答、各次答案及空間快照均包含於匯出檔。</p></section></div>${first.post?resultMarkup(first.post,'後測首次分項'):''}`;
  $('#export-results').onclick=exportProgress;
}
function formatTime(value){const d=new Date(value);return Number.isNaN(d.getTime())?'時間格式無法辨識':d.toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false});}
function download(filename,content,type){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function exportProgress(){download('反應分流局_學習紀錄_'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify({exportedAt:new Date().toISOString(),notice:'本機學習紀錄；文字筆記不自動評分，非經校準的正式測驗。',progress:state},null,2),'application/json');}
function renderGuide(){
  $('#main').innerHTML=`<section class="page guide-content"><div class="chapter-label"><span></span>開始之前</div><h1>讓每個判斷，都有化學證據</h1><p class="page-intro">兩人合作完成六關，前後測獨立作答。三維模型協助觀察幾何，提示協助修正推論。</p><h2>怎麼開始？</h2><ol><li>先到「學習評量」完成課前前測。</li><li>回到工作台，從第 1 關開始。各關也可直接點選預覽。</li><li>用模型控制改變進攻方向、單鍵構形或椅式；保存空間證據。</li><li>完成五項反應判斷，卡住時使用提示。每關交換操作與解釋角色。</li><li>完成後測，一週後再進行延後測驗。</li></ol><h2>三維操作</h2><p>拖曳或使用左轉、右轉、仰視、俯視按鈕，只會改變視角。進攻角、單鍵二面角、椅式按鈕才改變反應幾何。可點模型上的氫，也可用文字按鈕選取。</p><p>模型為反應中心的縮合表示，Me＝CH₃。未顯示每一個氫，鍵長為教學幾何，非量子化學最佳化。SN1 親核進攻階段只畫出氧原子代表的水，後續仍需去質子化；彎箭頭工作台支援拖曳、點選與選單作答，並逐步檢查電子來源、去向與電荷變化。</p><h2>AI 提示的界線</h2><p>頁面啟動時會檢查本機 Ollama；有可用模型就啟用即時 AI，否則使用明確標示的離線分層提示。可在提示面板停用或重新連接。生成文字僅供追問參考，關卡與測驗評分依固定規則；使用者筆記不送往本網站以外的伺服器，但本機模型的實際運算位置取決於 Ollama 設定。</p><h2>紀錄與資料管理</h2><p>進度存於這個網址的瀏覽器儲存區，不需登入。同一台電腦的不同瀏覽器或不同網址不會自動同步。請勿在筆記中輸入姓名或敏感資料。</p><div class="subnav"><button id="export-data">匯出學習紀錄</button><button id="backup-raw">匯出原始儲存備份</button><button id="reset-data" class="danger">重設本原型紀錄</button></div><div id="reset-confirm" class="response retry" hidden><p>這會清除此原型的六關與評量紀錄，其他網站資料不受影響。請先匯出備份。</p><button id="confirm-reset" style="margin-top:10px">確認清除本原型紀錄</button><button id="cancel-reset">取消</button></div><h2>評量怎麼解讀？</h2><p>選擇題反映條件判斷與機構辨識；空間題另記操作證據。彎箭頭依目前案件規則檢查；自由說明與口頭論證仍需教師評閱。原型分數未經信效度校準，單人分數變化不能證明 AI 的因果效果。</p><h2>化學內容核對來源</h2><ul>${SOURCES.map(([label,url])=>`<li><a href="${url}" target="_blank" rel="noreferrer">${esc(label)}</a></li>`).join('')}</ul><p class="report-note">案件、題目與提示為本活動原創整理；連結供教師核對概念，原書內容未作為即時 AI 的知識庫。</p></section>`;
  $('#export-data').onclick=exportProgress;
  $('#backup-raw').onclick=()=>{let raw=brokenRaw;try{raw ||= localStorage.getItem(KEY)||'';}catch{}download('反應分流局_原始紀錄備份.txt',raw||JSON.stringify(state,null,2),'text/plain');};
  $('#reset-data').onclick=()=>{$('#reset-confirm').hidden=false;};$('#cancel-reset').onclick=()=>{$('#reset-confirm').hidden=true;};
  $('#confirm-reset').onclick=()=>{try{localStorage.removeItem(KEY);storageWritable=true;$('#storage-notice').hidden=true;}catch{storageWritable=false;}state=parseProgress(null);brokenRaw='';save();render();toast('已重設此原型紀錄。');};
}
window.addEventListener('beforeunload',e=>{if(exam){e.preventDefault();e.returnValue='';}});
render();
async function discoverLocalAi(){
  const badge=$('#ai-mode');if(badge)badge.textContent='正在檢查本機 AI';
  try{
    const response=await fetch('/api/config',{signal:AbortSignal.timeout(4000)});
    if(!response.ok)throw new Error();
    const config=await response.json();
    if(config.available){aiConfig=config;aiEnabled=true;const status=$('#ai-connect-status');if(status)status.textContent=`已偵測到 ${config.model}。按提示按鈕才會傳送本關作答與觀察；生成文字不參與評分。`;}
  }catch{aiEnabled=false;}
  updateAiMode();
}
discoverLocalAi();
