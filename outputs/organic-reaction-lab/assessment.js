import {examItems3,EXAM_POINTS} from './exam-items.js';
import {TYPES,shuffled} from './course-path.js';
import {newMechanism,validWork} from './electron-flow.js';
import {mountArrowEditor} from './arrow-editor.js';
import {esc} from './reason-workbench.js';
import {completeAssessment,FORMS} from './assessment-store.js';

const names={post:'課後後測',delay:'延後測驗'},plain=o=>Boolean(o&&typeof o==='object'&&!Array.isArray(o));
export const DRAFT_KEY='organic-assessment-v3:draft';
const date=s=>new Date(s).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false});
function draftValid(d){return plain(d)&&FORMS.includes(d.form)&&Number.isInteger(d.index)&&d.index>=0&&d.index<examItems3(d.form).length&&plain(d.answers)&&plain(d.mechanisms)&&Object.values(d.mechanisms).every(m=>plain(m)&&TYPES[m.kind]&&validWork(m.kind,m.work));}

export function mountAssessment(root,{store,initialTab='post',onDone=()=>{},onActive=()=>{},onNotice=()=>{},exportAll=()=>{}}={}){
 let tab=['post','delay','results'].includes(initialTab)?initialTab:'post',exam=null,children=[],blockedDraft=false;
 try{const raw=localStorage.getItem(DRAFT_KEY);if(raw){const d=JSON.parse(raw);if(!draftValid(d))throw new Error();exam=d;tab=d.form;}}catch{blockedDraft=true;onNotice('未完成評量草稿無法讀取；可開始新一次作答。');}
 const $=s=>root.querySelector(s),clear=()=>{children.forEach(c=>c.destroy());children=[];};
 function saveDraft(){if(blockedDraft||!exam)return;try{localStorage.setItem(DRAFT_KEY,JSON.stringify(exam));}catch{onNotice('目前評量草稿無法保存，請完成提交或匯出紀錄後再離開。');}}
 function show(focus=false){
  clear();onActive(Boolean(exam));
  root.innerHTML=`<section class="page assessment-page"><p class="course-part">獨立作答 · 選做</p><h1 tabindex="-1" data-assess-title>不看提示，能分辨幾種反應？</h1><p>評量不影響學習路徑，也不提供 AI 或正誤提示。每題都要判斷反應類型、說出依據、預測產物，並畫出電子箭頭；起始物都是課程沒出現過的分子。</p><nav class="subnav" aria-label="評量階段">${[['post',names.post],['delay',names.delay],['results','紀錄與比較']].map(([id,label])=>`<button data-exam-tab="${id}" ${tab===id?'aria-current="page" class="active"':''} ${exam?'disabled':''}>${label}</button>`).join('')}</nav><div id="assessment-body"></div></section>`;
  root.querySelectorAll('[data-exam-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.examTab;show(true);});
  if(exam)question();else if(tab==='results')results();else start();
  if(focus){$('[data-assess-title]').focus({preventScroll:true});root.scrollIntoView({block:'start',behavior:'instant'});}
 }
 function start(){
  const records=store.records().filter(r=>r.form===tab),n=examItems3(tab).length;
  $('#assessment-body').innerHTML=`<section class="assessment-card"><h2>${names[tab]}</h2><p>${n} 題，100 分，建議約 40 分鐘，不倒數。每題：反應類型 ${EXAM_POINTS.mech} 分、依據 ${EXAM_POINTS.reason} 分、產物 ${EXAM_POINTS.product} 分、電子箭頭 ${EXAM_POINTS.arrows} 分。</p><p>箭頭會依你選的反應類型提供模板；類型選錯時箭頭不計分。提早結束仍會保存，未完成項目以 0 分計。</p><p class="teacher-note">分數依固定規則計算；題本尚未經學生試測校準。同一瀏覽器共用紀錄，不辨識不同學生。</p><button class="primary" id="start-exam">${records.length?'重新作答，保留首次':'開始個人作答'}</button>${records.length?`<p>首次：${records[0].score}／100；最近：${records.at(-1).score}／100。</p>`:''}</section><button type="button" data-back-learning>返回學習課程</button>`;
  $('#start-exam').onclick=()=>{exam={form:tab,index:0,answers:{},mechanisms:{},startedAt:new Date().toISOString()};saveDraft();show(true);};
  $('[data-back-learning]').onclick=onDone;
 }
 function question(){
  const items=examItems3(exam.form),q=items[exam.index],a=exam.answers[q.id]||={},m=exam.mechanisms[q.id];
  const opts=(name,list,seed)=>shuffled(list,seed).map(({v,i})=>`<label class="choice"><input type="radio" name="${name}" value="${i}" ${a[name]===i?'checked':''}><span>${esc(v)}</span></label>`).join('');
  $('#assessment-body').innerHTML=`<section><div class="exam-progress"><span>${names[exam.form]} · 第 ${exam.index+1}／${items.length} 題</span><span>已完成 ${items.filter(x=>exam.answers[x.id]?.mech&&Number.isInteger(exam.answers[x.id]?.reason)&&Number.isInteger(exam.answers[x.id]?.product)).length}／${items.length}</span></div><div class="assessment-card" data-exam-item="${q.id}"><section class="reaction-card"><p><strong>起始物：</strong>${esc(q.substrate)}</p><p><strong>試劑：</strong>${esc(q.reagent)}</p><p><strong>條件：</strong>${esc(q.conditions)}</p></section><fieldset><legend>1. 反應類型</legend>${Object.entries(TYPES).map(([t,v])=>`<label class="choice"><input type="radio" name="mech" value="${t}" ${a.mech===t?'checked':''}><span>${esc(v.label)}<small>　${esc(v.name)}</small></span></label>`).join('')}</fieldset><fieldset><legend>2. 主要判斷依據</legend>${opts('reason',q.reasons,q.id+'r')}</fieldset><fieldset><legend>3. 主要產物</legend>${opts('product',q.products,q.id+'p')}</fieldset><h3>4. 電子箭頭</h3><div id="exam-arrows">${a.mech?'':'<p class="teacher-note">先選反應類型，才會出現對應的箭頭模板。</p>'}</div></div><div class="exam-bottom"><button id="end-exam">提早結束</button><div><button id="exam-prev" ${exam.index===0?'disabled':''}>上一題</button><button id="exam-next" class="primary">${exam.index===items.length-1?'提交評量':'下一題'}</button></div></div><div id="exam-submit-confirm" class="feedback-box error" hidden role="status"><p>尚有未回答的題目或未保存的箭頭。提早提交仍會留存結果。</p><button id="confirm-exam">保存未完成紀錄</button><button id="cancel-exam-submit">繼續作答</button></div><p class="teacher-note">作答草稿會自動保存。</p></section>`;
  root.querySelectorAll('[name=mech]').forEach(n=>n.onchange=()=>{a.mech=n.value;if(exam.mechanisms[q.id]?.kind!==n.value)exam.mechanisms[q.id]={kind:n.value,work:newMechanism(n.value)};saveDraft();show();});
  for(const key of ['reason','product'])root.querySelectorAll(`[name=${key}]`).forEach(n=>n.onchange=()=>{a[key]=Number(n.value);saveDraft();});
  if(a.mech){const rec=exam.mechanisms[q.id]?.kind===a.mech?exam.mechanisms[q.id]:(exam.mechanisms[q.id]={kind:a.mech,work:newMechanism(a.mech)});children.push(mountArrowEditor($('#exam-arrows'),{kind:a.mech,work:rec.work,assessment:true,allowAI:false,revealProducts:false,onChange:w=>{rec.work=w;saveDraft();}}));}
  $('#exam-prev').onclick=()=>{exam.index--;saveDraft();show(true);};
  $('#exam-next').onclick=()=>{if(exam.index<items.length-1){exam.index++;saveDraft();show(true);}else if(completeAssessment(exam.form,exam))finish();else $('#exam-submit-confirm').hidden=false;};
  $('#end-exam').onclick=()=>{$('#exam-submit-confirm').hidden=false;};$('#cancel-exam-submit').onclick=()=>{$('#exam-submit-confirm').hidden=true;};$('#confirm-exam').onclick=finish;
 }
 function finish(){
  const r=store.submit(exam.form,exam),form=exam.form;exam=null;onActive(false);if(!blockedDraft)try{localStorage.removeItem(DRAFT_KEY);}catch{}clear();
  root.innerHTML=`<section class="assessment-page"><h1 tabindex="-1">本次評量已保存</h1>${report(r)}${review(form,r)}<div class="course-actions"><button class="primary" data-back-learning>返回學習課程</button><button data-view-records>查看評量紀錄</button></div></section>`;
  $('[data-back-learning]').onclick=onDone;$('[data-view-records]').onclick=()=>{tab='results';show(true);};
 }
 function report(r){return `<section class="assessment-card"><h2>${names[r.form]} · ${r.score}／100</h2><p>${date(r.at)} · ${r.completed?'完整提交':'提早結束'}</p><dl class="assessment-dimensions">${Object.entries(r.dimensions).map(([n,d])=>`<div><dt>${esc(n)}</dt><dd>${d.earned}／${d.possible}</dd></div>`).join('')}</dl></section>`;}
 function review(form,r){return `<section class="assessment-card"><h2>逐題對照</h2><ol class="exam-review">${examItems3(form).map(q=>{const x=r.items[q.id];return `<li><strong>${esc(q.substrate)} ＋ ${esc(q.reagent)}</strong>：${esc(TYPES[q.type].label)}　${['mech','reason','product','arrows'].map(k=>`${({mech:'類型',reason:'依據',product:'產物',arrows:'箭頭'})[k]}${x[k]?'✓':'✗'}`).join(' ')}<br><small>${esc(q.products[0])}。${esc(q.explain)}</small></li>`;}).join('')}</ol></section>`;}
 function results(){
  const all=store.records(),first=form=>all.find(r=>r.form===form&&r.completed),post=first('post'),delay=first('delay');
  $('#assessment-body').innerHTML=`<section class="assessment-card"><h2>個人學習證據</h2><p>以後測與延後測的首次完整提交比較；提早結束另列。${post&&delay?`首次後測至延後測變化：${delay.score-post.score>=0?'+':''}${delay.score-post.score} 分。`:'完成後測與延後測後可比較。'}</p><p>個人分數變化不能單獨證明 AI 或三維功能的因果效果。</p><div class="table-wrap"><table><thead><tr><th>評量</th><th>分數</th><th>狀態</th><th>時間</th></tr></thead><tbody>${all.map(r=>`<tr><td>${names[r.form]}</td><td>${r.score}／100</td><td>${r.completed?'完整':'未完成'}</td><td>${date(r.at)}</td></tr>`).join('')||'<tr><td colspan="4">尚無紀錄。</td></tr>'}</tbody></table></div><button data-export-all>匯出全部學習紀錄</button></section>`;
  $('[data-export-all]').onclick=exportAll;
 }
 const unload=e=>{if(exam){saveDraft();e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',unload);show();
 return {destroy(){saveDraft();clear();window.removeEventListener('beforeunload',unload);},get active(){return Boolean(exam);}};
}
