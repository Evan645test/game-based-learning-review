import {TYPES,WARMUP,STAGES,FLOW,ITEMS,stageIndex,unlockedTypes,pickItem,mastery,shuffled} from './course-path.js';
import {REACTION_EXAMPLES,exampleSpec} from './reaction-examples.js';
import {mountSpotlight} from './spotlight-demo.js';
import {mountArrowEditor} from './arrow-editor.js';
import {mountVisual} from './concept-visuals.js';
import {newMechanism,validWork} from './electron-flow.js';
import {gradedHint,firstArrowResult,aiArrowHint} from './graded-hints.js';
import {esc,sourceLinks} from './reason-workbench.js';

export const PATH_KEY='organic-path-v3';
const STEP_LABELS=['概念說明','對比觀察','補上流程圖','畫電子箭頭','混合練習'];
const ORDER=['warmup',...STAGES.map(s=>s.id),'final'];
const freshStage=()=>({step:0,concept:0,pair:0,predictions:{},revealed:{},branches:{},arrowKind:0,arrows:{},mixed:{done:0,current:null}});
export const freshPath=()=>({version:3,stage:'warmup',warm:{index:0,checks:{}},stages:Object.fromEntries(STAGES.map(s=>[s.id,freshStage()])),final:{current:null},attempts:[]});
const plain=o=>Boolean(o&&typeof o==='object'&&!Array.isArray(o));
export function validPath(s){
 if(s?.version!==3||!ORDER.includes(s.stage)||!plain(s.warm)||!Number.isInteger(s.warm.index)||!plain(s.stages)||!Array.isArray(s.attempts)||!plain(s.final))return false;
 return STAGES.every(st=>{const r=s.stages[st.id];return plain(r)&&Number.isInteger(r.step)&&r.step>=0&&r.step<=4&&Number.isInteger(r.concept)&&Number.isInteger(r.pair)&&['predictions','revealed','branches','arrows','mixed'].every(k=>plain(r[k]))&&Object.entries(r.arrows).every(([k,a])=>plain(a)&&validWork(k,a.work));})&&s.attempts.every(a=>plain(a)&&typeof a.item==='string'&&typeof a.type==='string'&&typeof a.mech==='boolean');
}
export function exampleById(id){for(const [kind,list] of Object.entries(REACTION_EXAMPLES)){const e=list.find(e=>e.id===id);if(e)return {kind,example:e};}return null;}
export function itemSpec(item){const found=item.example&&exampleById(item.example);return found&&found.kind===item.type?exampleSpec(found.kind,found.example):null;}

/** HTML for the decision flow as unlocked at `stageId`. */
export function flowHTML(stageId,{highlight=[],pending=[]}={}){
 const cur=stageIndex(stageId),open=st=>stageIndex(st)<=cur,nodes=new Map(FLOW.map(n=>[n.id,n]));
 const resolve=(to,branch)=>{
  if(to==='addhx|hydration')return '回到 HX 加成或酸催化加水，直接被接住';
  if(TYPES[to])return `<span class="flow-type">${esc(TYPES[to].label)}</span>`;
  const n=nodes.get(to);if(n&&open(n.stage))return `下一題：${esc(n.question)}`;
  const fallback={base:'degree',cation:'sn1',shift:branch==='el-hx'?'addhx':'hydration'}[to];return resolve(fallback,branch);
 };
 const cards=FLOW.filter(n=>open(n.stage)).map(n=>{const rows=n.branches.filter(b=>open(b.stage)).map(b=>{const hidden=pending.includes(b.id),lit=highlight.includes(b.id);return `<li class="flow-branch${lit?' lit':''}${hidden?' pending':''}" data-flow-branch="${b.id}">${hidden?'<span>？待你補上這條分支</span>':`<span>${esc(b.label)}</span><span class="flow-to">→ ${resolve(b.to,b.id)}</span>`}</li>`;}).join('');return `<section class="flow-node${n.branches.some(b=>highlight.includes(b.id))?' lit':''}" data-flow-node="${n.id}"><h4>${esc(n.question)}</h4><ul>${rows}</ul></section>`;}).join('');
 return `<div class="flow-chart" aria-label="反應類型判斷流程圖">${cards}</div>`;
}

let memory=null,blocked=false;
export const pathSnapshot=()=>memory?structuredClone(memory):null;
export function mountLearningPath(root,{onNotice=()=>{},onAssessment=()=>{},loadView=()=>null,saveView=()=>{}}={}){
 let state=memory||freshPath(),children=[],request=null;
 try{if(!memory){const raw=localStorage.getItem(PATH_KEY);if(raw){const v=JSON.parse(raw);if(!validPath(v))throw new Error();state=v;}}}catch{blocked=true;onNotice('學習進度無法讀取，本頁暫以記憶體保存。');}
 const save=()=>{memory=state;if(blocked)return;try{localStorage.setItem(PATH_KEY,JSON.stringify(state));}catch{blocked=true;onNotice('學習進度暫存於本頁，重新整理後可能無法保留。');}};
 const $=s=>root.querySelector(s),clear=()=>{children.forEach(c=>c.destroy());children=[];request?.abort();request=null;};
 const radios=(name,list,checked)=>list.map(({v,i},n)=>`<label class="choice"><input type="radio" name="${name}" value="${i}" ${checked===i?'checked':''}><span>${esc(v)}</span></label>`).join('');
 function header(){
  const i=ORDER.indexOf(state.stage),names=['暖身：反應的語言',...STAGES.map((s,k)=>`階段 ${k+1}：${s.title}`),'總混合練習'];
  const st=STAGES.find(s=>s.id===state.stage),steps=st?`<ol class="guide-progress" aria-label="本階段步驟">${STEP_LABELS.map((l,k)=>`<li ${k===state.stages[st.id].step?'aria-current="step"':''}><button type="button" data-goto-step="${k}">${k+1}<span>${l}</span></button></li>`).join('')}</ol>`:'';
  return `<header class="guide-header"><p class="course-part">有機反應 · 從零到能分辨反應類型</p><h1>先懂語言，再一種一種加入，最後混在一起分辨</h1><label>學習路徑<select data-path-stage>${ORDER.map((id,k)=>`<option value="${id}" ${k===i?'selected':''}>${esc(names[k])}</option>`).join('')}</select></label><p class="learning-goal">${st?`本階段新增：${st.newTypes.map(t=>TYPES[t].label).join('、')}；已學會分辨：${unlockedTypes(st.id).map(t=>TYPES[t].label).join('、')}`:state.stage==='warmup'?'先熟悉之後每個階段都會用到的詞與觀念；可以跳過，之後隨時回來。':'九種反應類型交錯出現；系統依你的弱點多出題，不設門檻。'}</p>${steps}</header>`;
 }
 function draw(focus=false){
  clear();root.innerHTML=`<section class="guided-lesson learning-path" data-learning-path data-stage="${state.stage}">${header()}<article class="guide-panel" data-path-panel></article></section>`;
  $('[data-path-stage]').onchange=e=>{state.stage=e.target.value;save();draw(true);};
  root.querySelectorAll('[data-goto-step]').forEach(b=>b.onclick=()=>{state.stages[state.stage].step=Number(b.dataset.gotoStep);save();draw(true);});
  const panel=$('[data-path-panel]');
  if(state.stage==='warmup')warmup(panel);else if(state.stage==='final')finalPractice(panel);else stage(panel,STAGES.find(s=>s.id===state.stage));
  if(focus){root.querySelector('h2')?.focus({preventScroll:true});root.scrollIntoView({block:'start',behavior:'instant'});}
 }
 const go=(stageId)=>{state.stage=stageId;save();draw(true);};
 function conceptCard(c,{index,total}){return `<p class="course-part">${index}／${total}</p><h2 tabindex="-1">${esc(c.title)}</h2>${c.body.map(p=>`<p>${esc(p)}</p>`).join('')}${c.visual?'<div class="concept-visual guide-concept" data-path-visual></div>':''}<p class="concept-example">${esc(c.example)}</p>`;}

 function warmup(panel){
  const i=Math.min(state.warm.index,WARMUP.length-1),c=WARMUP[i],answered=state.warm.checks[c.id];
  const opts=shuffled(c.check.options,c.id);
  panel.innerHTML=`${conceptCard(c,{index:i+1,total:WARMUP.length})}<form class="concept-quiz" data-warm-check><fieldset><legend>即時檢查：${esc(c.check.prompt)}</legend>${radios('warm',opts,answered?.choice)}</fieldset><button type="submit">檢查</button><p class="feedback-box" data-warm-feedback role="status" ${answered?'':'hidden'}>${answered?esc((answered.choice===c.check.answer?'正確。':'再想想。')+c.check.feedback):''}</p></form><p class="teacher-note">不計分，只幫你確認有沒有讀懂。</p><div class="guide-actions">${i?'<button type="button" data-warm-prev>上一個</button>':''}${i<WARMUP.length-1?'<button type="button" class="primary" data-warm-next>下一個觀念</button>':'<button type="button" class="primary" data-warm-done>完成暖身，進入階段 1</button>'}<button type="button" data-warm-skip>跳過暖身</button></div><details class="learning-sources"><summary>原文來源</summary>${sourceLinks(c.pages)}</details>`;
  if(c.visual)mountVisual($('[data-path-visual]'),c.visual);
  $('[data-warm-check]').onsubmit=e=>{e.preventDefault();const v=new FormData(e.target).get('warm');if(v===null)return;const choice=Number(v),first=state.warm.checks[c.id]?.first??choice===c.check.answer;state.warm.checks[c.id]={choice,first};save();const box=$('[data-warm-feedback]');box.hidden=false;box.textContent=(choice===c.check.answer?'正確。':'再想想。')+c.check.feedback;};
  $('[data-warm-prev]')?.addEventListener('click',()=>{state.warm.index=i-1;save();draw(true);});
  $('[data-warm-next]')?.addEventListener('click',()=>{state.warm.index=i+1;save();draw(true);});
  $('[data-warm-done]')?.addEventListener('click',()=>go('s1'));
  $('[data-warm-skip]').onclick=()=>go('s1');
 }

 function stage(panel,st){
  const r=state.stages[st.id],next=()=>{r.step=Math.min(4,r.step+1);save();draw(true);};
  if(r.step===0)concepts(panel,st,r,next);else if(r.step===1)contrast(panel,st,r,next);else if(r.step===2)branches(panel,st,r,next);else if(r.step===3)arrows(panel,st,r,next);else mixed(panel,st,r);
 }
 function concepts(panel,st,r,next){
  const i=Math.min(r.concept,st.concepts.length-1),c=st.concepts[i];
  panel.innerHTML=`${conceptCard(c,{index:i+1,total:st.concepts.length})}<div class="guide-actions">${i?'<button type="button" data-concept-prev>上一個</button>':''}<button type="button" class="primary" data-concept-next>${i<st.concepts.length-1?'下一個概念':'用對比案例觀察差異'}</button></div><details class="learning-sources"><summary>原文來源</summary>${sourceLinks(c.pages)}</details>`;
  $('[data-concept-prev]')?.addEventListener('click',()=>{r.concept=i-1;save();draw(true);});
  $('[data-concept-next]').onclick=()=>{if(i<st.concepts.length-1){r.concept=i+1;save();draw(true);}else next();};
 }
 function contrast(panel,st,r,next){
  const k=Math.min(r.pair,st.pairs.length-1),pair=st.pairs[k],key=String(k),cards=[pair.a,pair.b].map(id=>({id,...exampleById(id)})),types=unlockedTypes(st.id),pred=r.predictions[key]||{},revealed=Boolean(r.revealed[key]);
  panel.innerHTML=`<p class="course-part">對比 ${k+1}／${st.pairs.length}</p><h2 tabindex="-1">先預測，再看動畫揭曉</h2><p class="guide-bridge">${esc(pair.diff)}</p><div class="contrast-pair">${cards.map((c,j)=>`<section class="contrast-card${revealed?(pred[j]===c.kind?' right':' wrong'):''}" data-contrast-card="${j}"><h3>${j?'乙':'甲'}：${esc(c.example.substrate)}</h3><p><strong>試劑：</strong>${esc(c.example.reagent)}</p><p><strong>條件：</strong>${esc(c.example.conditions)}</p><label>我預測<select data-predict="${j}" ${revealed?'disabled':''}><option value="">選擇反應類型</option>${types.map(t=>`<option value="${t}" ${pred[j]===t?'selected':''}>${esc(TYPES[t].label)}</option>`).join('')}</select></label>${revealed?`<p class="contrast-answer">答案：<strong>${esc(TYPES[c.kind].label)}</strong>${pred[j]===c.kind?'（你預測對了）':`（你預測 ${esc(TYPES[pred[j]]?.label||'—')}）`}</p><p>${esc(c.example.note)}</p><p class="teacher-note">產物：${esc(c.example.product)}</p>`:''}</section>`).join('')}</div>${revealed?`<div class="contrast-watch"><p>選一張卡片觀看三維機構：</p><div class="check-tools">${cards.map((c,j)=>`<button type="button" data-watch="${j}" aria-pressed="false">${j?'乙':'甲'}：${esc(TYPES[c.kind].label)}</button>`).join('')}</div><div data-contrast-player></div></div>`:'<p class="teacher-note">兩張卡片都選好才揭曉；預測不計分，但會保留第一次的判斷。</p>'}<div class="guide-actions">${revealed?'':`<button type="button" class="primary" data-reveal ${pred[0]&&pred[1]?'':'disabled'}>揭曉答案</button>`}${k?'<button type="button" data-pair-prev>上一組</button>':''}${revealed&&k<st.pairs.length-1?'<button type="button" class="primary" data-pair-next>下一組對照</button>':''}<button type="button" ${revealed&&k===st.pairs.length-1?'class="primary"':''} data-to-branch>前往流程圖</button></div><details class="learning-sources"><summary>原文來源</summary>${sourceLinks([...new Set(cards.flatMap(c=>c.example.pages))])}</details>`;
  root.querySelectorAll('[data-predict]').forEach(s=>s.onchange=()=>{(r.predictions[key]||={})[s.dataset.predict]=s.value;save();const p=r.predictions[key];const b=$('[data-reveal]');if(b)b.disabled=!(p[0]&&p[1]);});
  $('[data-reveal]')?.addEventListener('click',()=>{r.revealed[key]=true;save();draw();});
  $('[data-pair-prev]')?.addEventListener('click',()=>{r.pair=k-1;save();draw(true);});
  $('[data-pair-next]')?.addEventListener('click',()=>{r.pair=k+1;save();draw(true);});
  $('[data-to-branch]').onclick=next;
  root.querySelectorAll('[data-watch]').forEach(b=>b.onclick=()=>{children.forEach(c=>c.destroy());children=[];root.querySelectorAll('[data-watch]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));const c=cards[Number(b.dataset.watch)];children.push(mountSpotlight($('[data-contrast-player]'),{kind:c.kind,specOverride:exampleSpec(c.kind,c.example),initialState:loadView(c.id),onStateChange:s=>saveView(c.id,s)}));});
 }
 function branches(panel,st,r,next){
  const tasks=st.branches,pendingTask=tasks.findIndex((t,i)=>!r.branches[i]?.done),t=tasks[pendingTask];
  const pending=tasks.flatMap((x,i)=>r.branches[i]?.done?[]:x.ids);
  panel.innerHTML=`<h2 tabindex="-1">把新學到的判斷補進流程圖</h2><p>流程圖會隨每個階段長出新分支。${t?'選出最合適的分支內容，補上虛線框。':'本階段的分支都補好了。'}</p>${flowHTML(st.id,{pending})}${t?`<form data-branch-form><fieldset><legend>${esc(t.prompt)}</legend>${radios('branch',shuffled(t.options,st.id+pendingTask),r.branches[pendingTask]?.choice)}</fieldset><button type="submit" class="primary">補上這條分支</button><p class="feedback-box" data-branch-feedback role="status" hidden></p></form>`:''}<div class="guide-actions"><button type="button" ${t?'':'class="primary"'} data-to-arrows>前往畫電子箭頭</button></div>`;
  $('[data-branch-form]')?.addEventListener('submit',e=>{e.preventDefault();const v=new FormData(e.target).get('branch');if(v===null)return;const choice=Number(v),rec=r.branches[pendingTask]||={tries:0};rec.tries++;rec.choice=choice;rec.first??=choice===t.answer;const box=$('[data-branch-feedback]');box.hidden=false;if(choice===t.answer){rec.done=true;save();draw();}else{save();box.textContent='還不對：'+t.feedback;}});
  $('[data-to-arrows]').onclick=next;
 }
 function gradedPanel(host,{kind,spec=null,record,onFirst=()=>{},persist}){
  // record: {work, first, hints, level}
  if(!validWork(kind,record.work))record.work=newMechanism(kind);
  host.innerHTML=`<div data-graded-editor></div><div class="course-actions"><button type="button" class="primary" data-graded-check>檢查箭頭</button><button type="button" data-graded-more hidden>再給更明確的提示</button><button type="button" data-graded-ai hidden>請本機 AI 換句話說</button></div><p class="feedback-box" data-graded-feedback role="status" hidden></p>`;
  const q=s=>host.querySelector(s),editor=mountArrowEditor(q('[data-graded-editor]'),{kind,work:record.work,graded:true,spec,allowAI:false,revealProducts:true,onChange:w=>{record.work=w;record.level=0;persist();}});
  const show=(h)=>{const box=q('[data-graded-feedback]');box.hidden=false;box.classList.toggle('correct',h.ok);box.textContent=h.text;q('[data-graded-more]').hidden=h.ok||h.level>=2;q('[data-graded-ai]').hidden=h.ok||h.level<2;};
  q('[data-graded-check]').onclick=()=>{if(record.first===null||record.first===undefined){record.first=firstArrowResult(kind,record.work);onFirst(record.first);}record.level=1;const h=gradedHint(kind,record.work,1,spec);if(!h.ok)record.hints=(record.hints||0)+1;persist();show(h);};
  q('[data-graded-more]').onclick=()=>{record.level=2;record.hints=(record.hints||0)+1;persist();show(gradedHint(kind,record.work,2,spec));};
  q('[data-graded-ai]').onclick=async()=>{const b=q('[data-graded-ai]'),box=q('[data-graded-feedback]');b.disabled=true;request?.abort();request=new AbortController();const timer=setTimeout(()=>request?.abort(),50000);box.textContent='正在取得核對過的提示…';try{box.textContent=await aiArrowHint(kind,record.work,request.signal);}catch{box.textContent=gradedHint(kind,record.work,2,spec).text+'（本機 AI 未連接，以上為內建提示）';}finally{clearTimeout(timer);b.disabled=false;}};
  return editor;
 }
 function arrows(panel,st,r,next){
  const k=Math.min(r.arrowKind,st.arrowKinds.length-1),kind=st.arrowKinds[k],rec=r.arrows[kind]||={work:newMechanism(kind),first:null,hints:0,level:0};
  panel.innerHTML=`<h2 tabindex="-1">畫出電子箭頭：${esc(TYPES[kind].label)}</h2><p>先自己畫完每一步並保存，再按「檢查箭頭」。第一次只告訴你哪一步要修，第二次才指出哪一支箭頭；第一次檢查的結果會記錄下來。</p><nav class="check-tools" aria-label="本階段機構">${st.arrowKinds.map((t,i)=>`<button type="button" data-arrow-kind="${i}" aria-pressed="${i===k}">${esc(TYPES[t].label)}${r.arrows[t]?.first===true?' ✓':''}</button>`).join('')}</nav><div data-graded-host></div><div class="guide-actions"><button type="button" class="primary" data-to-mixed>前往混合練習</button></div>`;
  root.querySelectorAll('[data-arrow-kind]').forEach(b=>b.onclick=()=>{r.arrowKind=Number(b.dataset.arrowKind);save();draw();});
  children.push(gradedPanel($('[data-graded-host]'),{kind,record:rec,persist:save}));
  $('[data-to-mixed]').onclick=next;
 }
 function practiceItem(panel,{types,slot,stageId,onNext,progress=''}){
  if(!slot.current){const it=pickItem(types,state.attempts);slot.current={item:it.id,answers:{},submitted:false,arrow:{work:newMechanism(it.type),first:null,hints:0,level:0}};save();}
  const cur=slot.current,item=ITEMS.find(i=>i.id===cur.item);if(!item){slot.current=null;save();return practiceItem(panel,{types,slot,stageId,onNext,progress});}
  const reasons=shuffled(item.reasons,item.id+'r'),products=shuffled(item.products,item.id+'p'),done=cur.submitted,a=cur.answers;
  const verdict=(ok,label,answer)=>`<li class="${ok?'right':'wrong'}">${ok?'✓':'✗'} ${label}${ok?'':`：應為「${esc(answer)}」`}</li>`;
  panel.innerHTML=`<p class="course-part">${progress}</p><h2 tabindex="-1">這是哪一種反應？</h2><section class="reaction-card"><p><strong>起始物：</strong>${esc(item.substrate)}</p><p><strong>試劑：</strong>${esc(item.reagent)}</p><p><strong>條件：</strong>${esc(item.conditions)}</p></section><form data-mixed-form><fieldset><legend>1. 反應類型</legend>${types.map(t=>`<label class="choice"><input type="radio" name="mech" value="${t}" ${a.mech===t?'checked':''} ${done?'disabled':''}><span>${esc(TYPES[t].label)}<small>　${esc(TYPES[t].name)}</small></span></label>`).join('')}</fieldset><fieldset><legend>2. 主要判斷依據</legend>${radios('reason',reasons,a.reason).replaceAll('type="radio"',done?'type="radio" disabled':'type="radio"')}</fieldset><fieldset><legend>3. 主要產物</legend>${radios('product',products,a.product).replaceAll('type="radio"',done?'type="radio" disabled':'type="radio"')}</fieldset>${done?'':'<button type="submit" class="primary">提交判斷</button>'}</form><details class="flow-peek" ${done?'open':''}><summary>${done?'流程圖：這題走過的路徑':'對照流程圖'}</summary>${flowHTML(stageId,{highlight:done?item.path:[]})}</details>${done?`<section class="mixed-feedback"><ul>${verdict(a.mech===item.type,'反應類型',TYPES[item.type].label)}${verdict(a.reason===0,'判斷依據',item.reasons[0])}${verdict(a.product===0,'主要產物',item.products[0])}</ul><p>${esc(item.explain)}</p></section><h3>4. 畫出電子箭頭（${esc(TYPES[item.type].label)}）</h3><p class="teacher-note">${itemSpec(item)?'模板依相近的例子標示。':'以反應中心的通用模板作答；取代基可能與題目不同。'}</p><div data-mixed-arrows></div>`:''}<div class="guide-actions">${done?'<button type="button" class="primary" data-mixed-next>下一題</button>':''}</div>`;
  if(!done)$('[data-mixed-form]').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);if(!f.get('mech')||f.get('reason')===null||f.get('product')===null){onNotice('三個問題都回答後再提交。');return;}onNotice('');cur.answers={mech:f.get('mech'),reason:Number(f.get('reason')),product:Number(f.get('product'))};cur.submitted=true;state.attempts.push({item:item.id,type:item.type,mech:cur.answers.mech===item.type,reason:cur.answers.reason===0,product:cur.answers.product===0,arrows:null,hints:0,stage:stageId,at:new Date().toISOString()});if(state.attempts.length>600)state.attempts.splice(0,state.attempts.length-600);cur.attempt=state.attempts.length-1;save();draw();};
  else{const record=cur.arrow,attempt=()=>state.attempts.findLast(x=>x.item===item.id);children.push(gradedPanel($('[data-mixed-arrows]'),{kind:item.type,spec:itemSpec(item),record,persist:()=>{const at=attempt();if(at)at.hints=record.hints||0;save();},onFirst:ok=>{const at=attempt();if(at)at.arrows=ok;}}));$('[data-mixed-next]').onclick=()=>{slot.current=null;onNext();save();draw(true);};}
 }
 function mixed(panel,st,r){
  const m=r.mixed,types=unlockedTypes(st.id),idx=STAGES.indexOf(st);
  if(m.done>=st.mixCount&&!m.current){const recent=state.attempts.filter(a=>a.stage===st.id).slice(-st.mixCount),right=recent.filter(a=>a.mech).length;panel.innerHTML=`<h2 tabindex="-1">本階段混合練習完成</h2><p>最近 ${recent.length} 題中，反應類型判斷正確 ${right} 題。混合練習不擋關；想多練可以繼續。</p>${masteryHTML(types)}<div class="guide-actions"><button type="button" data-more-mixed>再練 ${st.mixCount} 題</button><button type="button" class="primary" data-next-stage>${idx<STAGES.length-1?`進入階段 ${idx+2}`:'進入總混合練習'}</button></div>`;$('[data-more-mixed]').onclick=()=>{m.done=0;save();draw(true);};$('[data-next-stage]').onclick=()=>go(idx<STAGES.length-1?STAGES[idx+1].id:'final');return;}
  practiceItem(panel,{types,slot:m,stageId:st.id,progress:`混合練習 ${Math.min(m.done+1,st.mixCount)}／${st.mixCount}　·　題型：${types.map(t=>TYPES[t].label).join('、')}`,onNext:()=>{m.done++;}});
  panel.insertAdjacentHTML('beforeend',`<p class="teacher-note">不擋關：<button type="button" class="quiet" data-skip-stage>跳到${idx<STAGES.length-1?`階段 ${idx+2}`:'總混合練習'}</button></p>`);
  $('[data-skip-stage]').onclick=()=>go(idx<STAGES.length-1?STAGES[idx+1].id:'final');
 }
 function masteryHTML(types){const m=mastery(types,state.attempts);return `<div class="table-wrap"><table class="mastery"><thead><tr><th>反應類型</th><th>最近正確</th><th>狀態</th></tr></thead><tbody>${types.map(t=>`<tr data-mastery="${t}"><th>${esc(TYPES[t].label)}</th><td>${m[t].recent?`${m[t].right}／${m[t].recent}`:'—'}</td><td>${m[t].level}</td></tr>`).join('')}</tbody></table></div>`;}
 function finalPractice(panel){
  const types=unlockedTypes('final');
  practiceItem(panel,{types,slot:state.final,stageId:'final',progress:`總混合練習 · 已作答 ${state.attempts.filter(a=>a.stage==='final').length} 題`,onNext:()=>{}});
  panel.insertAdjacentHTML('beforeend',`<details class="learning-sources" open><summary>各反應類型的精熟度（依最近 5 題）</summary>${masteryHTML(types)}<p class="teacher-note">答錯較多的類型會較常出現；同一類型盡量不連續出現。隨時可以結束。</p></details><div class="guide-actions"><button type="button" data-final-assess>選做學習評量</button></div>`);
  $('[data-final-assess]').onclick=onAssessment;
 }
 draw();
 return {destroy(){clear();save();}};
}
