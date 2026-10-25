import {LESSONS} from './guided-lesson.js';
import {TOPICS,COURSE_CASES} from './course-content.js';
import {mountVisual,CONCEPT_VISUALS} from './concept-visuals.js';
import {mountSpotlight,spotlightSegmentFrames} from './spotlight-demo.js';
import {REACTION_EXAMPLES,exampleSpec} from './reaction-examples.js';
import {mountCourseCheck} from './course-checks.js';
import {mountSolvation} from './solvent-visual.js';
import {esc,sourceLinks} from './reason-workbench.js';

export const COURSE_KEY='organic-learning-course-v2';
export const LEARNING_UNITS=[
 {id:'charge',title:'電荷與反應角色',goal:'辨認鍵極性、親電子位置與電荷分離',topics:['polarity','electrophile','leaving'],check:'sn1'},
 {id:'donor',title:'試劑與溶劑作用',goal:'用親核劑與溶劑說明取代反應的電子來源',topics:['nucleophile','solvent'],check:'sn2'},
 {id:'target',title:'消去反應與構形',goal:'以鹼的目標及三維構形解釋 E2',topics:['base','space'],check:'e2',extension:'chair'},
 {id:'product',title:'步驟、條件與產物',goal:'從步驟與條件推理產物，辨識競爭路徑',topics:['pathway'],check:'e1',extension:'compare'}
];
// Keep stored phase IDs stable so existing answers and observation bookmarks remain valid.
const phaseNames=['再做預測','概念說明','觀察反應','推理產物','動手檢核','對照證據'];
const phaseOrder=[1,0,2,3,4,5],phaseLabels=['預測','說明','觀察','推理','檢核','對照'];
const fresh=()=>({version:2,flowVersion:2,unit:0,records:Object.fromEntries(LEARNING_UNITS.map(u=>[u.id,{phase:1,concept:0,prediction:null,diagram:false,observed:false,first:null,latest:null,done:false}]))});
export function validLearningCourse(s){
 if(s?.version!==2||(s.flowVersion!==undefined&&s.flowVersion!==2)||!Number.isInteger(s.unit)||s.unit<0||s.unit>=4)return false;
 const choice=n=>Number.isInteger(n)&&n>=0&&n<=2,pair=r=>r===null||Boolean(r&&choice(r.product)&&choice(r.reason));
 return LEARNING_UNITS.every(u=>{const r=s.records?.[u.id];return r&&Number.isInteger(r.phase)&&r.phase>=0&&r.phase<=5&&Number.isInteger(r.concept)&&r.concept>=0&&r.concept<=u.topics.length&&(r.seenFrames===undefined||Array.isArray(r.seenFrames)&&r.seenFrames.every(n=>Number.isInteger(n)&&n>=0&&n<30))&&(r.prediction===null||choice(r.prediction))&&pair(r.first)&&pair(r.latest)&&['diagram','observed','done'].every(k=>typeof r[k]==='boolean')&&(s.flowVersion===2?(r.phase===1||r.phase===0&&r.diagram&&r.concept===u.topics.length||r.phase>=2&&r.prediction!==null):(r.phase===0||r.prediction!==null))&&(r.phase<2||r.diagram)&&(r.phase<3||r.observed)&&(r.phase<4||r.first!==null&&r.latest!==null)&&(!r.done||r.first!==null&&r.latest!==null);});
}
export function upgradeLearningCourse(value){
 if(!validLearningCourse(value))throw new TypeError('Invalid learning course');
 const state=structuredClone(value);
 if(state.flowVersion!==2){
  for(const u of LEARNING_UNITS)if(state.records[u.id].phase===0)state.records[u.id].phase=1;
  state.flowVersion=2;
 }
 return state;
}
let memory=null,blocked=false;
export const learningSnapshot=()=>memory?structuredClone(memory):null;
export function mountLearningCourse(root,{onNotice=()=>{},onAssessment=()=>{},loadView=()=>null,saveView=()=>{}}={}){
 let state=memory||fresh(),child=null,browsing=false,exampleIndex=0,extended=false;
 try{if(!memory){const raw=localStorage.getItem(COURSE_KEY);if(raw)state=upgradeLearningCourse(JSON.parse(raw));}}catch{blocked=true;onNotice('課程進度無法讀取，原資料保留，本頁暫存。');}
 const $=s=>root.querySelector(s),save=()=>{memory=state;if(blocked)return;try{localStorage.setItem(COURSE_KEY,JSON.stringify(state));}catch{blocked=true;onNotice('課程進度暫存於本頁，重新整理後可能無法保留。');}};
 function draw(focus=false){
  child?.destroy();child=null;const u=LEARNING_UNITS[state.unit],l=LESSONS[state.unit],r=state.records[u.id];
  root.innerHTML=`<section class="guided-lesson" data-guided-lesson data-learning-unit="${u.id}"><header class="guide-header"><p class="course-part">有機反應 · 學習課程</p><h1>從電子與空間，解釋產物怎麼形成</h1><label>學習路徑<select data-guide-lesson>${LEARNING_UNITS.map((v,i)=>`<option value="${i}" ${i===state.unit?'selected':''}>${i+1}. ${esc(v.title)}${state.records[v.id].done?' · 已學習':''}</option>`).join('')}</select></label><p class="learning-goal">本單元目標：${esc(u.goal)}</p><ol class="guide-progress" aria-label="學習過程">${phaseOrder.map((phase,i)=>`<li ${phase===r.phase?'aria-current="step"':''}>${i+1}<span>${phaseLabels[phase]}</span></li>`).join('')}</ol></header><article class="guide-panel" data-guide-panel><p class="course-part">${browsing?'延伸比較':phaseNames[r.phase]}</p><h2 tabindex="-1" data-guide-heading>${esc(l.title)}</h2><div data-guide-content></div></article></section>`;
  $('[data-guide-lesson]').onchange=e=>{state.unit=Number(e.target.value);browsing=false;extended=false;save();draw(true);};
  const panel=$('[data-guide-content]'),next=(label,disabled=false)=>`<button type="button" class="primary" data-guide-next ${disabled?'disabled':''}>${label}</button>`,move=phase=>{r.phase=phase;save();draw(true);};
  const options=(name,items)=>items.map((text,i)=>`<label class="choice"><input required name="${name}" type="radio" value="${i}"><span>${esc(text)}</span></label>`).join('');
  if(r.phase===0){
   panel.innerHTML=`<p class="guide-context">${esc(l.context)}</p><form data-prediction><fieldset><legend>${esc(l.predict)}</legend>${options('prediction',l.options)}</fieldset><p class="teacher-note">用剛才的概念說明留下預測，接著以三維觀察檢查；不計分、不設通關。</p><button class="primary" type="submit">記下預測，觀察反應</button></form><button type="button" data-return-explanation>回看概念說明</button>`;
   $('[data-prediction]').onsubmit=e=>{e.preventDefault();const v=new FormData(e.target).get('prediction');if(v===null)return;r.prediction??=Number(v);move(2);};
   if(r.prediction!==null)$(`[name=prediction][value="${r.prediction}"]`).checked=true;
   $('[data-return-explanation]').onclick=()=>move(1);
  }else if(r.phase===1){
   if(r.concept<u.topics.length){const topic=TOPICS.find(t=>t.id===u.topics[r.concept]);panel.innerHTML=`<p class="course-part">概念 ${r.concept+1}／${u.topics.length}</p><h3 data-course-topic="${topic.id}">${esc(topic.title)}</h3><p>${esc(topic.id==='space'?'常見 E2 需讓 β-H 與脫離基呈反疊構形（antiperiplanar conformation）。環己烷需檢查反式雙軸向（trans-diaxial）：翻環交換軸向／赤道向，保留 up／down。':topic.body)}</p>${topic.id==='solvent'?'<div data-solvation class="solvation"></div>':`<p class="concept-example">${esc(topic.example)}</p>`}<div class="guide-actions">${r.concept?'<button data-concept-back>上一個概念</button>':''}${next(r.concept===u.topics.length-1?'用圖解連起來':'下一個概念')}</div>`;
    if(topic.id==='solvent')mountSolvation($('[data-solvation]'));
    $('[data-guide-next]').onclick=()=>{r.concept++;save();draw(true);};$('[data-concept-back]')?.addEventListener('click',()=>{r.concept--;save();draw(true);});
   }else{panel.innerHTML=`<p class="guide-bridge">先用圖解整理剛才的概念，再預測這些分子會如何反應。</p><div class="concept-visual guide-concept" data-guide-visual></div><div class="guide-actions"><button data-concept-back>回看概念</button>${next('用概念做預測',!r.diagram)}</div>`;mountVisual($('[data-guide-visual]'),l.concept,{onLast:()=>{r.diagram=true;save();$('[data-guide-next]').disabled=false;}});$('[data-concept-back]').onclick=()=>{r.concept=Math.max(0,u.topics.length-1);save();draw(true);};$('[data-guide-next]').onclick=()=>move(0);}
  }else if(r.phase===2){
   const isBrowsing=browsing,examples=REACTION_EXAMPLES[l.kind],example=examples[browsing?exampleIndex:l.example],spec=exampleSpec(l.kind,example),segment=browsing?null:{step:l.step,includeProduct:false},frames=spotlightSegmentFrames(l.kind,spec,segment),viewKey=isBrowsing?example.id:example.id+':guided:'+l.step,visited=new Set(isBrowsing?[]:(r.seenFrames||[]));
   panel.innerHTML=`${browsing?`<label class="library-select">${l.kind.toUpperCase()} · 四個例子<select data-unit-example>${examples.map((e,i)=>`<option value="${i}" ${i===exampleIndex?'selected':''}>${i+1}. ${esc(e.title)}</option>`).join('')}</select></label><p>${esc(example.substrate)} ＋ ${esc(example.reagent)} · ${esc(example.conditions)}</p>`:`<p class="guide-bridge">${esc(l.bridge)}</p>`}<div data-guide-player></div>${browsing?`<p class="teacher-note">${esc(example.note)}</p>${next('回到本單元對照證據')}`:`<p data-observation-status role="status">播放完本步，或逐段閱讀後將最後一段進度拉至 100%。</p>${next('推理產物與理由',!r.observed)}`}`;
   if(browsing)$('[data-unit-example]').onchange=e=>{exampleIndex=Number(e.target.value);draw();};
   child=mountSpotlight($('[data-guide-player]'),{kind:l.kind,specOverride:spec,segment,initialState:loadView(viewKey),onFrameChange:i=>{visited.add(i);if(!isBrowsing){r.seenFrames=[...visited];save();}},onStateChange:s=>{saveView(viewKey,s);if(isBrowsing)return;if(!r.observed&&visited.size===frames.length&&s.frame===frames.length-1&&s.progress>=.999){r.observed=true;save();$('[data-guide-next]').disabled=false;$('[data-observation-status]').textContent='本步已觀察完畢，接著用電子與鍵結推理產物。';}}});
   $('[data-guide-next]').onclick=()=>{if(browsing){browsing=false;move(5);}else move(3);};
  }else if(r.phase===3){
   panel.innerHTML=`<p>依這個片段，提出產物與電子理由。</p><form data-inference><fieldset><legend>${esc(l.inference)}</legend>${options('product',l.products)}</fieldset><fieldset><legend>${esc(l.reason)}</legend>${options('reason',l.reasons)}</fieldset><button type="submit" class="primary">保留推理，動手檢核</button></form><button data-return-observe>回看觀察片段</button>`;
   $('[data-return-observe]').onclick=()=>move(2);$('[data-inference]').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);if(f.get('product')===null||f.get('reason')===null)return;r.latest={product:Number(f.get('product')),reason:Number(f.get('reason'))};r.first||={...r.latest};move(4);};
  }else if(r.phase===4){
   panel.innerHTML=`<p>把推理轉成電子箭頭與構形證據。自我檢核供你修正理解，沒有通關門檻。</p>${u.extension?`<label class="library-select">本單元的應用<select data-check-application><option value="core" ${extended?'':'selected'}>本例電子與空間</option><option value="extension" ${extended?'selected':''}>${u.extension==='chair'?'延伸：環己烷的空間限制':'延伸：同一受質換條件'}</option></select></label>`:''}<div data-embedded-check></div><div class="guide-actions">${next('對照產物與證據')}</div>`;
   $('[data-check-application]')?.addEventListener('change',e=>{extended=e.target.value==='extension';draw();});
   if(extended&&u.extension==='compare')mountComparison($('[data-embedded-check]'));else child=mountCourseCheck($('[data-embedded-check]'),{caseId:extended?u.extension:u.check,onNotice});
   $('[data-guide-next]').onclick=()=>{r.done=true;move(5);};
  }else{
   const correct=r.latest.product===l.product&&r.latest.reason===l.reasonAnswer;
   panel.innerHTML=`<p class="guide-recall">原先預測：${esc(l.options[r.prediction])}。${r.prediction===l.answer?'與電子證據一致。':'可用下方證據修正。'}</p><p>你的產物：${esc(l.products[r.latest.product])}。</p><p class="guide-result">本路徑產物：${esc(l.products[l.product])}</p><p>${esc(l.explanation)}</p><p class="teacher-note">${correct?'產物與理由皆符合本路徑。':'請比對電子來源與成斷鍵，回看並修正推理。'} 首次推理保留；自我檢核不加入正式評量分數。</p><div class="guide-actions"><button data-return-infer>修正我的推理</button><button data-return-check>回看動手檢核</button><button data-browse-examples>比較 ${l.kind.toUpperCase()} 四個例子</button>${state.unit<3?next('下一個學習單元'):'<button class="primary" data-course-post>選做學習評量</button>'}</div>`;
   $('[data-return-infer]').onclick=()=>move(3);$('[data-return-check]').onclick=()=>move(4);$('[data-browse-examples]').onclick=()=>{browsing=true;exampleIndex=l.example;move(2);};
   if(state.unit<3)$('[data-guide-next]').onclick=()=>{state.unit++;extended=false;save();draw(true);};else $('[data-course-post]').onclick=onAssessment;
  }
  const pages=[...new Set([...CONCEPT_VISUALS[l.concept].pages,...u.topics.flatMap(id=>TOPICS.find(t=>t.id===id).pages),...REACTION_EXAMPLES[l.kind][l.example].pages])];panel.insertAdjacentHTML('beforeend',`<details class="learning-sources"><summary>原文與本單元來源（${pages.length} 頁）</summary>${sourceLinks(pages)}</details>`);
  if(focus){$('[data-guide-heading]').focus({preventScroll:true});root.scrollIntoView({block:'start',behavior:'instant'});}
 }
 draw();return {destroy(){child?.destroy();save();}};
}

function mountComparison(root){
 const c=COURSE_CASES.find(c=>c.id==='compare'),questions=c.questions.slice(1),key='organic-course-check-v2:compare';let answers={},index=0,blocked=false;
 try{const raw=localStorage.getItem(key);if(raw){const v=JSON.parse(raw);if(v?.version!==2||!v.answers||typeof v.answers!=='object'||Array.isArray(v.answers)||Object.entries(v.answers).some(([i,a])=>!questions[Number(i)]||!Number.isInteger(a)||a<0||a>=questions[Number(i)].options.length))throw new Error();answers=v.answers;}}catch{blocked=true;}
 function draw(){const q=questions[index];root.innerHTML=`<section data-condition-check><p>同一受質 2-bromobutane：甲為 NaI／acetone／25 °C；乙為 NaOEt／ethanol／加熱。先比較試劑角色，再推回路徑與產物；電子操作可回看前面的單元。</p><p>比較 ${index+1}／${questions.length}</p><fieldset><legend>${esc(q.prompt)}</legend>${q.options.map((s,i)=>`<label class="choice"><input type="radio" name="condition-check" value="${i}" ${answers[index]===i?'checked':''}>${esc(s)}</label>`).join('')}</fieldset><button data-compare-check>檢查這個判斷</button><p class="feedback-box" data-compare-feedback hidden role="status"></p><div class="guide-actions"><button data-compare-prev ${index===0?'disabled':''}>上一項</button><button data-compare-next ${index===questions.length-1?'disabled':''}>下一項</button></div></section>`;
  root.querySelectorAll('input').forEach(n=>n.onchange=()=>{answers[index]=Number(n.value);if(!blocked)try{localStorage.setItem(key,JSON.stringify({version:2,answers}));}catch{blocked=true;}});root.querySelector('[data-compare-check]').onclick=()=>{const box=root.querySelector('[data-compare-feedback]');box.hidden=false;box.textContent=answers[index]===undefined?'先留下你的判斷。':(answers[index]===q.answer?'判斷符合條件。':'請再比較條件。')+q.why;};root.querySelector('[data-compare-prev]').onclick=()=>{index--;draw();};root.querySelector('[data-compare-next]').onclick=()=>{index++;draw();};
 }draw();
}
