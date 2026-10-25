import {mountVisual,CONCEPT_VISUALS} from './concept-visuals.js';
import {mountSpotlight,spotlightSegmentFrames} from './spotlight-demo.js';
import {REACTION_EXAMPLES,exampleSpec} from './reaction-examples.js';
import {esc,sourceLinks} from './reason-workbench.js';
import {termList,glossaryHTML} from './terminology.js';

export const GUIDE_KEY='organic-guided-lesson-v1';
export const LESSONS=[
 {id:'charge',concept:'polarity',title:'從部分電荷到真正帶電',kind:'sn1',example:0,step:0,
  context:'(CH₃)₃CBr 在富水環境；只分析 SN1 的第一步。水是極性質子性溶劑（polar protic solvent），可穩定分離後的離子。',
  predict:'若 C–Br 鍵在這一步斷裂，原本這一對鍵電子會去哪裡？',options:['兩個原子各拿一個電子','整對移到 Br','整對移到碳'],answer:1,
  bridge:'圖解中的 R 各代表一個碳基團；現在換成三個 CH₃。三維片段只看第一步斷 C–Br，還沒有水進攻。',
  inference:'這一步完成後，哪組結構與電荷合理？',products:['(CH₃)₃C⁻ ＋ Br⁺','(CH₃)₃COH ＋ Br⁻','(CH₃)₃C⁺ ＋ Br⁻'],product:2,
  reason:'為什麼碳會成為陽離子？',reasons:['鍵電子對隨 Br 離開，碳少了一個鍵','Br 把一對電子送給碳','部分電荷 δ⁺ 本來就是整數 +1'],reasonAnswer:0,
  explanation:'部分電荷（partial charge）不等於離子的整數電荷。不勻分裂（heterolysis）後才形成碳陽離子（carbocation）與 Br⁻；這是中間體，還不是中性醇產物。',
  hint:'先比對 C–Br 鍵的電子對最後停在哪一個原子，再數碳的鍵數。',terms:['partial charge','bond polarity','heterolysis','carbocation','protic solvent','solvation']},
 {id:'donor',concept:'nucleophile',title:'找到電子的提供者',kind:'sn2',example:3,step:0,
  context:'CH₃CHBrCH₂CH₃ ＋ I⁻；acetone，25 °C。此題分析 SN2 取代路徑。acetone 是極性非質子性溶劑（polar aprotic solvent），不像水一樣以氫鍵包圍陰離子。',
  predict:'I⁻ 應該從哪裡靠近，才能和帶 Br 的碳成鍵？',options:['沿 C–Br 鍵的背面靠近碳','直接靠近 Br','先等碳陽離子形成'],answer:0,
  bridge:'先用水進攻碳陽離子的圖理解「氧提供電子」。接下來換成 I⁻ 的 SN2：提供電子的角色相同，但它從背面接近，且不先形成碳陽離子；兩種機構不可混成一步。',
  inference:'沿此 SN2 路徑，哪個產物合理？',products:['2-butanol ＋ I⁻','2-iodobutane ＋ Br⁻','2-butene ＋ HI ＋ Br⁻'],product:1,
  reason:'哪一個解釋符合三維觀察？',reasons:['碳先游離，再由 I⁻ 進攻','I⁻ 的原子核提供新鍵電子','I⁻ 提供電子對，成 C–I 與斷 C–Br 協同發生'],reasonAnswer:2,
  explanation:'親核劑（nucleophile）提供電子對；受質（substrate）的碳接受電子。SN2 是雙分子親核取代作用（bimolecular nucleophilic substitution），背面進攻伴隨瓦登反轉（Walden inversion）；R/S 名稱仍須重排優先序。',
  hint:'把新形成的鍵與消失的鍵各列一條；不要把水圖解中的試劑抄到碘離子這個題目。',terms:['nucleophile','electrophile','substrate','lone pair electrons','aprotic solvent','bimolecular nucleophilic substitution','Walden inversion']},
 {id:'target',concept:'base',title:'先分清楚碳與氫',kind:'e2',example:0,step:0,
  context:'2-bromobutane ＋ EtO⁻；ethanol，加熱。只分析 C2–C3 的 E2 路徑；先確認 β-H 與 Br 為反疊構形（antiperiplanar conformation）。',
  predict:'在 E2 的第一支彎箭頭中，EtO⁻ 的電子對應指向哪裡？',options:['Br 原子','帶 Br 的 α 碳','β-H'],answer:2,
  bridge:'圖解把「進攻碳」和「接受氫」放在一起比較；三維現在只追蹤 E2 接受 β-H 的路徑。接著兩組鍵電子必須同步配合。',
  inference:'若沿圖中 C2–C3 路徑消去，哪組產物正確？',products:['2-butene ＋ EtOH ＋ Br⁻','2-ethoxybutane ＋ Br⁻','2-butanol ＋ EtO⁻'],product:0,
  reason:'新的 C=C 中，π 鍵的電子來自哪裡？',reasons:['Br⁻ 的孤對電子','原來的 Cβ–H 鍵','鹼的氧原子本身'],reasonAnswer:1,
  explanation:'EtO⁻ 接受 β-H、Cβ–H 的電子形成 π 鍵、C–Br 的電子移向 Br，三組移動為協同反應（concerted reaction）。這裡只分析指定路徑；仍可有其他區位與取代產物。',
  hint:'沿三支箭頭依序找出：鹼→H、C–H→C–C、C–Br→Br。π 鍵不是由 Br 提供。',terms:['nucleophilicity','basicity','antiperiplanar conformation','concerted reaction','elimination reaction']},
 {id:'product',concept:'pathway',title:'由結構變化推回產物',kind:'e1',example:1,step:1,
  context:'2-bromo-2-methylbutane 在乙醇加熱；題目已觀察到烯類，現分析 E1 的乙基側 β-H 分支。先前 C–Br 已斷裂；Br⁻ 仍在溶液中。加熱本身不保證唯一 E1。',
  predict:'碳陽離子形成後，乙醇若以鹼的角色作用，接下來會做什麼？',options:['接受 β-H，使 C–H 的電子形成 C=C','重新把 Br 接回碳','以氧成鍵而直接得到烯類'],answer:0,
  bridge:'圖解先比較取代和消去的結構差異；三維換成五個碳的受質，只看 E1 第二步。碳陽離子先形成，這次脫離基不再與接受氫同步離開。',
  inference:'沿題目指定的乙基側 β-H 路徑，哪組產物正確？',products:['2-methyl-2-butanol ＋ Br⁻','2-methyl-1-butene 是唯一可能','2-methyl-2-butene ＋ EtOH₂⁺ ＋ Br⁻'],product:2,
  reason:'為什麼這個片段與 E2 不同？',reasons:['所有 E1 都不需要鹼','C–Br 已在前一步斷裂，本步才失去 β-H','E1 的雙鍵電子由 Br⁻ 提供'],reasonAnswer:1,
  explanation:'E1 是單分子消去反應（unimolecular elimination）：先有碳陽離子，再失去 β-H 形成烯類。SN1 可競爭，其他 β 位也可反應；動畫不提供實測產物比例。',
  hint:'先把「上一步已發生」與「本步正在發生」分開，再找兩個形成雙鍵的碳。',terms:['substitution reaction','elimination reaction','unimolecular elimination','carbocation','reaction mechanism']}
];
const phases=['先預測','看概念圖','觀察三維','推理產物','對照證據'];
const fresh=()=>({version:1,lesson:0,records:Object.fromEntries(LESSONS.map(l=>[l.id,{phase:0,prediction:null,diagram:false,observed:false,first:null,latest:null,done:false}]))});
export function validGuide(s){
 if(s?.version!==1||!Number.isInteger(s.lesson)||s.lesson<0||s.lesson>=LESSONS.length||!s.records||Array.isArray(s.records))return false;
 return LESSONS.every(l=>{const r=s.records[l.id],choice=v=>Number.isInteger(v)&&v>=0&&v<3,pair=v=>v===null||Boolean(v&&choice(v.product)&&choice(v.reason));return r&&Number.isInteger(r.phase)&&r.phase>=0&&r.phase<=4&&(r.prediction===null||choice(r.prediction))&&['diagram','observed','done'].every(k=>typeof r[k]==='boolean')&&pair(r.first)&&pair(r.latest)&&(r.phase===0||r.prediction!==null)&&(r.phase<2||r.diagram)&&(r.phase<3||r.observed)&&(r.phase<4||r.first!==null&&r.latest?.product===l.product&&r.latest?.reason===l.reasonAnswer)&&(!r.done||r.phase===4);});
}
let memory=null,storageBlocked=false;
export function mountGuidedLesson(root,{onPractice=()=>{}}={}){
 let state=memory||fresh(),child=null,destroyed=false;
 try{if(!memory){const raw=localStorage.getItem(GUIDE_KEY);if(raw){const s=JSON.parse(raw);if(!validGuide(s))throw new Error('invalid');state=s;}}}catch{storageBlocked=true;}
 const save=()=>{memory=state;if(storageBlocked)return;try{localStorage.setItem(GUIDE_KEY,JSON.stringify(state));}catch{storageBlocked=true;const n=root.querySelector('[data-guide-storage]');if(n){n.hidden=false;n.textContent='進度暫存於本頁，重新整理後可能無法保留；既有資料未刪除。';}}};
 const q=s=>root.querySelector(s);
 function draw(focus=false){
  child?.destroy();child=null;const l=LESSONS[state.lesson],r=state.records[l.id];
  root.innerHTML=`<section class="guided-lesson" data-guided-lesson><header class="guide-header"><p class="course-part">四個觀念，一次專心一件事</p><h1>先猜，再看，說出產物的理由</h1><label>學習任務<select data-guide-lesson>${LESSONS.map((m,i)=>`<option value="${i}" ${i===state.lesson?'selected':''}>${i+1}. ${esc(m.title)}${state.records[m.id].done?' ✓':''}</option>`).join('')}</select></label><ol class="guide-progress" aria-label="本任務學習流程">${phases.map((p,i)=>`<li ${i===r.phase?'aria-current="step"':''}>${i+1}<span>${p}</span></li>`).join('')}</ol></header><p class="teacher-note" data-guide-storage ${storageBlocked?'':'hidden'}>紀錄無法讀寫，原資料保留，本頁暫存進度。</p><article class="guide-panel" data-guide-panel><p class="course-part">任務 ${state.lesson+1}／4 · ${phases[r.phase]}</p><h2 tabindex="-1" data-guide-heading>${esc(l.title)}</h2><p class="guide-context">${esc(l.context)}</p><div data-guide-content></div></article>${glossaryHTML()}</section>`;
  q('[data-guide-lesson]').onchange=e=>{save();state.lesson=Number(e.target.value);save();draw(true);};
  const panel=q('[data-guide-content]');
  const choices=(name,options)=>options.map((s,i)=>`<label class="choice"><input required type="radio" name="${name}" value="${i}">${esc(s)}</label>`).join('');
  const next=(label,disabled=false)=>`<button class="primary" data-guide-next type="button" ${disabled?'disabled':''}>${label}</button>`;
  if(r.phase===0){
   panel.innerHTML=`<form data-prediction><fieldset><legend>${esc(l.predict)}</legend>${choices('prediction',l.options)}</fieldset><p class="teacher-note">先保留你的想法，觀察後再比對。不計速度，也不影響六關或 PK 分數。</p><button class="primary" type="submit">記下預測，開始觀察</button></form>`;
   q('[data-prediction]').onsubmit=e=>{e.preventDefault();const value=new FormData(e.target).get('prediction');if(value===null)return;r.prediction=Number(value);r.phase=1;save();draw(true);};
  }else if(r.phase===1){
   panel.innerHTML=`<p class="guide-recall">你的預測：${esc(l.options[r.prediction])}。先看圖，暫不判定對錯。</p><div class="concept-visual guide-concept" data-guide-visual></div><div class="guide-actions">${next('把這個觀念放進三維模型',!r.diagram)}</div>`;
   mountVisual(q('[data-guide-visual]'),l.concept,{onLast:()=>{r.diagram=true;save();q('[data-guide-next]').disabled=false;}});
   q('[data-guide-next]').onclick=()=>{r.phase=2;save();draw(true);};
  }else if(r.phase===2){
   const example=REACTION_EXAMPLES[l.kind][l.example],spec=exampleSpec(l.kind,example),segment={step:l.step,includeProduct:false},count=spotlightSegmentFrames(l.kind,spec,segment).length,visited=new Set();
   panel.innerHTML=`<p class="guide-bridge">${esc(l.bridge)}</p><div data-guide-player></div><p data-observation-status role="status">播放到本步片段結束，或逐段閱讀後將最後一段進度拉到 100%。</p><div class="guide-actions">${next('用觀察到的電子移動推理產物',!r.observed)}</div>`;
   child=mountSpotlight(q('[data-guide-player]'),{kind:l.kind,specOverride:spec,segment,onFrameChange:i=>visited.add(i),onStateChange:s=>{if(!r.observed&&visited.size===count&&s.frame===count-1&&s.progress>=.999){r.observed=true;save();q('[data-guide-next]').disabled=false;q('[data-observation-status]').textContent='本步片段已完成。接下來由你判斷結構與電子來源。';}}});
   if(r.observed)q('[data-observation-status]').textContent='已完成這個觀察片段，可重看或繼續推理。';
   q('[data-guide-next]').onclick=()=>{r.phase=3;save();draw(true);};
  }else if(r.phase===3){
   panel.innerHTML=`<p>先離開動畫，用鍵結與電荷判斷；不把機構名稱當成答案。</p><form data-inference><fieldset><legend>${esc(l.inference)}</legend>${choices('product',l.products)}</fieldset><fieldset><legend>${esc(l.reason)}</legend>${choices('reason',l.reasons)}</fieldset><button class="primary" type="submit">提交產物與理由</button><p class="feedback-box" data-guide-feedback hidden role="status"></p></form><button type="button" class="quiet" data-guide-review>回看本步三維證據</button>`;
   q('[data-guide-review]').onclick=()=>{r.phase=2;save();draw(true);};
   q('[data-inference]').onsubmit=e=>{e.preventDefault();const data=new FormData(e.target);if(data.get('product')===null||data.get('reason')===null)return;const a={product:Number(data.get('product')),reason:Number(data.get('reason'))};r.first||={...a};r.latest=a;
    if(a.product===l.product&&a.reason===l.reasonAnswer){r.done=true;r.phase=4;save();draw(true);}else{save();const box=q('[data-guide-feedback]');box.hidden=false;box.textContent=l.hint;}
   };
  }else{
   panel.innerHTML=`<p class="guide-recall">最初預測：${esc(l.options[r.prediction])}。${r.prediction===l.answer?'與機構證據一致。':'觀察後需要修正。'}</p><p class="guide-result">${esc(l.products[l.product])}</p><p>${esc(l.explanation)}</p><p class="teacher-note">首次推理：產物${r.first.product===l.product?'正確':'需修正'}、理由${r.first.reason===l.reasonAnswer?'正確':'需修正'}。目前兩項皆正確；首次紀錄保留，這是引導練習。</p><div class="guide-actions">${state.lesson<3?next('下一個觀念，先做預測'):'<button class="primary" data-independent type="button">進入六關獨立產物推理</button>'}<button type="button" data-guide-review>重看圖解與三維</button></div>`;
   q('[data-guide-review]').onclick=()=>{r.phase=1;r.done=false;save();draw(true);};
   if(state.lesson<3)q('[data-guide-next]').onclick=()=>{state.lesson++;save();draw(true);};else q('[data-independent]').onclick=onPractice;
  }
  if(r.phase>0){const terms=document.createElement('details');terms.className='guide-terms';terms.innerHTML=`<summary>本步中英術語</summary>${termList(l.terms)}`;panel.append(terms);const sources=document.createElement('div');sources.innerHTML=sourceLinks(CONCEPT_VISUALS[l.concept].pages);panel.append(sources);}
  if(focus){q('[data-guide-heading]').focus({preventScroll:true});root.scrollIntoView({block:'start',behavior:'instant'});}
 }
 draw();return {destroy(){if(destroyed)return;destroyed=true;child?.destroy();save();}};
}
