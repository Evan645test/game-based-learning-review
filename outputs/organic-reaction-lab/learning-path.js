import {PREP,DIAGNOSED,CARBOCATION_TYPES,itemType,shiftUnlocked,JUDGE_TABLE,TABLE_REVIEW,TYPES,WARMUP,PATH_GOALS,PATH_TASKS,REVIEW_BY_TYPE,ARROW_REVIEW,COMPETENCIES,STAGES,FLOW,ITEMS,stageIndex,unlockedTypes,pickItem,mastery,shuffled} from './course-path.js';
import {REACTION_EXAMPLES,exampleSpec} from './reaction-examples.js';
import {mountSpotlight} from './spotlight-demo.js';
import {mountArrowEditor} from './arrow-editor.js';
import {mountVisual,degreeHTML,skeletalHTML} from './concept-visuals.js';
import {mountCationCloud} from './cation-cloud.js';
import {leavingHTML} from './leaving-visual.js';
import {energyHTML} from './energy-visual.js';
import {newMechanism,validWork} from './electron-flow.js';
import {gradedHint,firstArrowResult,aiArrowHint} from './graded-hints.js';
import {esc,sourceLinks} from './reason-workbench.js';
import {ISLANDS,FINAL_COUNT,islandNodes,nodeScreens,cardLocation,ARCHIPELAGOS,islandViewHTML,chemistSVG,spotFor,motionToggleHTML,ambientHTML,islandBuildings,currentBuilding,walkingRoute,compareLocation} from './island-map.js';
import {comparisonHTML,mountComparison} from './comparison-view.js';
import {COMPARISONS} from './comparisons.js';
import {worldMapHTML,archipelagoHTML} from './archipelago-art.js';

export const PATH_KEY='organic-path-v4';
const ORDER=ISLANDS.map(i=>i.id);
const freshStage=()=>({step:0,concept:0,pair:0,predictions:{},revealed:{},branches:{},arrowKind:0,arrows:{},mixed:{done:0,current:null}});
// explore: where the learner stands on each island, which landmarks are walked, and which islands were visited.
const freshExplore=()=>({pos:Object.fromEntries(ISLANDS.map(i=>[i.id,{node:0,screen:0}])),done:Object.fromEntries(ISLANDS.map(i=>[i.id,{}])),seen:{[ISLANDS[0].id]:true},buildings:1});
// diag: per diagnosed card, the first diagnosis (pre) and the follow-up after reading (post): {choice,right}.
export const freshPath=()=>({version:4,stage:ISLANDS[0].id,explore:freshExplore(),warm:{index:0,checks:{}},diag:{},stages:Object.fromEntries(STAGES.map(s=>[s.id,freshStage()])),final:{current:null},table:freshTable(),attempts:[]});
function freshTable(){return {cells:{},checks:0,first:null};}
const plain=o=>Boolean(o&&typeof o==='object'&&!Array.isArray(o));
const validExplore=(e,current)=>plain(e)&&plain(e.pos)&&plain(e.done)&&plain(e.seen)&&ISLANDS.every(i=>plain(e.pos[i.id])&&Number.isInteger(e.pos[i.id].node)&&e.pos[i.id].node>=0&&(!current||e.pos[i.id].node<islandNodes(i.id).length)&&Number.isInteger(e.pos[i.id].screen)&&e.pos[i.id].screen>=0&&plain(e.done[i.id]));
export function validPath(s){
 if(s?.version!==4||!validExplore(s.explore,true)||(s.diag!==undefined&&!plain(s.diag))||!ORDER.includes(s.stage)||!plain(s.warm)||!Number.isInteger(s.warm.index)||!plain(s.stages)||!Array.isArray(s.attempts)||!plain(s.final)||(s.table!==undefined&&!plain(s.table?.cells)))return false;
 return STAGES.every(st=>{const r=s.stages[st.id];return plain(r)&&Number.isInteger(r.step)&&r.step>=0&&r.step<=4&&Number.isInteger(r.concept)&&Number.isInteger(r.pair)&&['predictions','revealed','branches','arrows','mixed'].every(k=>plain(r[k]))&&Object.entries(r.arrows).every(([k,a])=>plain(a)&&validWork(k,a.work));})&&s.attempts.every(a=>plain(a)&&typeof a.item==='string'&&typeof a.type==='string'&&typeof a.mech==='boolean');
}
// v4 (textbook-order islands) starts everyone fresh; earlier saved paths are cleared by legacy-data.js.
const validReview=v=>plain(v)&&plain(v.from)&&ISLANDS.some(i=>i.id===v.from.stage)&&plain(v.from.pos)&&ISLANDS.every(i=>plain(v.from.pos[i.id])&&Number.isInteger(v.from.pos[i.id].node)&&Number.isInteger(v.from.pos[i.id].screen));
export function exampleById(id){for(const [kind,list] of Object.entries(REACTION_EXAMPLES)){const e=list.find(e=>e.id===id);if(e)return {kind,example:e};}return null;}
export function itemSpec(item){const found=item.example&&exampleById(item.example);return found&&found.kind===item.type?exampleSpec(found.kind,found.example):null;}

/** HTML for the decision flow as unlocked at `stageId`. */
export function flowHTML(stageId,{highlight=[],pending=[]}={}){
 const cur=stageIndex(stageId),open=st=>stageIndex(st)<=cur,nodes=new Map(FLOW.map(n=>[n.id,n]));
 const resolve=(to,branch)=>{
  if(to==='addhx|hydration')return '回到 HX 加成或酸催化加水，直接被接住';
  if(to==='slow')return '<span class="flow-type">幾乎不反應</span>';
  if(TYPES[to])return `<span class="flow-type">${esc(TYPES[to].label)}</span>`;
  const n=nodes.get(to);if(n&&open(n.stage))return `下一題：${esc(n.question)}`;
  const fallback={cation:'sn1',shift:branch==='el-hx'?'addhx':'hydration'}[to];return resolve(fallback,branch);
 };
 const cards=FLOW.filter(n=>open(n.stage)).map(n=>{const rows=n.branches.filter(b=>open(b.stage)).map(b=>{const hidden=pending.includes(b.id),lit=highlight.includes(b.id);return `<li class="flow-branch${lit?' lit':''}${hidden?' pending':''}" data-flow-branch="${b.id}">${hidden?'<span>？待你補上這條分支</span>':`<span>${esc(b.label)}</span><span class="flow-to">→ ${resolve(b.to,b.id)}</span>`}</li>`;}).join('');return `<section class="flow-node${n.branches.some(b=>highlight.includes(b.id))?' lit':''}" data-flow-node="${n.id}"><h4>${esc(n.question)}</h4><ul>${rows}</ul></section>`;}).join('');
 return `<div class="flow-chart" aria-label="反應類型判斷流程圖">${cards}</div>`;
}

// Every check card by id: warm-up cards and stage entry primers.
const CARDS=new Map([...PREP.flatMap(p=>p.cards.map((c,i)=>[c.id,{card:c,stage:p.id,at:i,prep:true}])),...STAGES.flatMap(st=>[...(st.primers||[]),...st.concepts.flatMap(c=>c.details||[])].map((p,j)=>[p.id,{card:p,stage:st.id,at:j}]))]);
export const cardTitle=id=>CARDS.get(id).card.title.replace(/^選讀：/,'').split('：')[0];
/** 'right' or 'wrong' from the latest answer to a card's check; null when unanswered. */
const CELL_KEYS=JUDGE_TABLE.rows.flatMap(r=>JUDGE_TABLE.cols.map(c=>`${r.id}|${c.id}`));
/** Wrong or missing table cells: a cell is right when its reaction type is an accepted answer. */
export function tableResult(table){
 const missing=[],wrong=[];
 for(const key of CELL_KEYS){const a=table?.cells?.[key],want=JUDGE_TABLE.cells[key];if(!a?.type)missing.push(key);else if(!want.type.includes(a.type))wrong.push(key);}
 return {missing,wrong,right:CELL_KEYS.length-missing.length-wrong.length,total:CELL_KEYS.length};
}
export const tableSolved=state=>{const r=tableResult(state.table);return r.missing.length===0&&r.wrong.length===0;};
export function checkStatus(state,id){
 if(DIAGNOSED.has(id)){const d=state.diag?.[id],last=d?.post||d?.pre;return last?(last.right?'right':'wrong'):null;}
 const a=state.warm.checks[id],c=CARDS.get(id)?.card;return a&&c?(a.choice===c.check.answer?'right':'wrong'):null;
}
/** Prerequisite badge for a diagnosed island: ready when every card is right, review when any is wrong. */
export function prepBadge(state,islandId){const p=PREP.find(x=>x.id===islandId);if(!p)return null;const s=p.cards.map(c=>checkStatus(state,c.id));return s.includes('wrong')?'review':s.every(x=>x==='right')?'ready':null;}
const COMP_OF=new Map(COMPETENCIES.flatMap(c=>c.cards.map(id=>[id,c])));
const COMP_STATUS={mastered:'已掌握',review:'需回看',active:'進行中',todo:'未開始'},CHECK_TEXT={right:'已做對',wrong:'需回看'};
export function competencyStatus(state,comp){const s=comp.cards.map(id=>checkStatus(state,id));return s.includes('wrong')?'review':s.every(x=>x==='right')?'mastered':s.includes('right')?'active':'todo';}
const islandName=id=>ISLANDS.find(i=>i.id===id).name;
const cardPlace=id=>{const loc=cardLocation(id);return `${islandName(loc.island)}・${islandNodes(loc.island)[loc.node].label}`;};

/** Landmarks of an island with walking state; a red flag marks a landmark whose card was last answered wrong. */
export function islandProgress(state,id){
 const nodes=islandNodes(id),done=state.explore.done[id]||{},next=nodes.findIndex(n=>!done[n.id]);
 return nodes.map((n,i)=>({id:n.id,label:n.label,state:done[n.id]?'done':i===next?'next':'todo',flag:(n.cards||[]).some(c=>checkStatus(state,c)==='wrong'),wrong:(n.cards||[]).filter(c=>checkStatus(state,c)==='wrong')}));
}
export function buildingProgress(state,id){
 const buildings=islandBuildings(id),nodes=islandNodes(id),done=state.explore.done[id]||{},pos=state.explore.pos[id];
 const visited=b=>Boolean(done[nodes[b.node].id]||done[b.id]||(state.explore.buildings!==1&&pos.node===b.node&&pos.screen>b.end));
 const next=buildings.findIndex(b=>!visited(b));
 return buildings.map((b,i)=>{const wrong=b.cards.filter(c=>checkStatus(state,c)==='wrong');return {...b,state:visited(b)?'done':i===next?'next':'todo',flag:wrong.length>0,wrong};});
}
export function upgradeBuildingVisits(state){
 if(state.explore.buildings===1)return false;
 for(const island of ISLANDS)for(const b of buildingProgress(state,island.id))if(b.state==='done')state.explore.done[island.id][b.id]=true;
 state.explore.buildings=1;return true;
}
export function completeBuilding(state,id,index){
 const buildings=islandBuildings(id),b=buildings[index];if(!b)throw new RangeError('Unknown concept building');
 state.explore.done[id][b.id]=true;
 const done=buildingProgress(state,id);
 if(done.filter(x=>x.node===b.node).every(x=>x.state==='done'))state.explore.done[id][islandNodes(id)[b.node].id]=true;
 return done.findIndex(x=>x.state!=='done');
}
export const islandDone=(state,id)=>islandNodes(id).every(n=>state.explore.done[id]?.[n.id]);
/** World map: an island comes out of the fog once the previous island is walked, or once it has been visited. */
export function worldProgress(state){
 return ISLANDS.map((isl,i)=>{const done=islandDone(state,isl.id),open=i===0||done||Boolean(state.explore.seen[isl.id])||islandDone(state,ISLANDS[i-1].id);return {...isl,state:done?'done':open?'open':'fog',flag:islandProgress(state,isl.id).some(n=>n.flag),current:state.stage===isl.id};});
}

/** Archipelagos for the world map: walked islands, fog, flags and the current one. */
export function archipelagoProgress(state){
 const w=worldProgress(state);
 return ARCHIPELAGOS.map(a=>{const isl=w.filter(i=>a.islands.includes(i.id)),done=isl.filter(i=>i.state==='done').length;return {...a,state:done===isl.length?'done':isl.some(i=>i.state!=='fog')?'open':'fog',flag:isl.some(i=>i.flag),current:isl.some(i=>i.current),progress:{done,total:isl.length},islands:isl.map(i=>({...i,prep:prepBadge(state,i.id)}))};});
}
export const snapshot=state=>({stage:state.stage,pos:structuredClone(state.explore.pos)});
const screenAt=f=>{const nodes=islandNodes(f.stage),p=f.pos[f.stage],node=nodes[Math.min(p.node,nodes.length-1)],screens=nodeScreens(f.stage,node);return {node,screen:screens[Math.min(p.screen,screens.length-1)]};};
/** The check card shown at a location snapshot, or null on a non-card screen. */
export function locationCard(f){return screenAt(f).screen?.card||null;}
/** A short label for a location snapshot: island, landmark and, for card screens, the card. */
export function locationLabel(f){const {node,screen}=screenAt(f);return `${islandName(f.stage)}・${node.label}${screen?.card?`：${cardTitle(screen.card)}`:''}`;}

/** Six competencies; a row expands in place and a card is previewed before any jump. */
export function competencyListHTML(state,{open=null,pick=null,hereCard=null,hereLabel=''}={}){
 const mark=s=>s==='right'?'✓ ':s==='wrong'?'！':'';
 const rows=COMPETENCIES.map((c,n)=>{
  const status=competencyStatus(state,c),right=c.cards.filter(id=>checkStatus(state,id)==='right').length,isOpen=open===c.id,picked=isOpen&&c.cards.includes(pick)?pick:null,s=picked&&checkStatus(state,picked);
  const chips=c.cards.map(id=>{const cs=checkStatus(state,id);return `<button type="button" class="tree-chip${CARDS.get(id).prep?'':' primer'}${cs==='wrong'?' review':''}" data-map-card="${id}" aria-pressed="${id===picked}" aria-label="${esc(cardTitle(id))}（${CHECK_TEXT[cs]||'未做'}）">${mark(cs)}${esc(cardTitle(id))}</button>`;}).join('');
  const preview=picked?`<div class="card-preview" data-card-preview="${picked}"><p class="card-preview-head"><strong>${esc(CARDS.get(picked).card.title)}</strong><span>位於：${esc(cardPlace(picked))}</span></p><p>${s==='wrong'?'最近一次答錯，建議回看。':s==='right'?'已做對，可以再複習。':'還沒做過這張卡的檢查。'}${picked===hereCard?'你現在就在這張卡。':`會記住你現在在「${esc(hereLabel)}」，看完一鍵回來。`}</p>${picked===hereCard?'':`<button type="button" class="primary" data-map-go="${picked}">前往這張卡</button>`}</div>`:'';
  return `<li class="competency" data-competency="${c.id}"><button type="button" class="competency-head" data-comp-toggle="${c.id}" aria-expanded="${isOpen}" aria-controls="competency-${c.id}"><span class="competency-name">${n+1}．${esc(c.title)}</span><span class="competency-meter"><span class="competency-bar" aria-hidden="true"><i style="width:${Math.round(right/c.cards.length*100)}%"></i></span><span class="competency-count">${right}／${c.cards.length}</span><span class="competency-status" data-competency-status="${status}">${COMP_STATUS[status]}</span></span></button>${isOpen?`<div class="competency-body" id="competency-${c.id}"><p>${esc(c.ability)}</p><p class="competency-task"><strong>檢核任務：</strong>${esc(c.task)}</p><div class="tree-chips">${chips}</div>${preview}</div>`:''}</li>`;
 }).join('');
 return `<ol class="competency-list" role="list">${rows}</ol>`;
}

let memory=null,teacherMemory=null,blocked=false;
// Only navigation crosses the mode boundary. Answers and attempts never do.
export function copyPathLocation(from,to){to.stage=from.stage;to.explore.pos=structuredClone(from.explore.pos);return to;}
export const pathSnapshot=()=>memory?structuredClone(memory):null;
export const EXPLORER_KEY='organic-explorer-v1';
/** The explorer's name and guide preference; null until the learner names the chemist (or skips). */
export function readExplorer(){try{const v=JSON.parse(localStorage.getItem(EXPLORER_KEY));if(plain(v)&&typeof v.name==='string')return {name:v.name.trim().slice(0,10)||'探險家',guide:v.guide!==false};}catch{}return null;}
// Guide lines are fixed sentence templates; chemistry wording only ever comes from the checked course text.
const LINES={diag:'先試一題！答對就代表你已經會了，可以直接跳過。',diagReady:'太好了，這張卡你已具備！',compare:'同一組受質和試劑，兩條路一起播。看看輸的那條路卡在哪裡！',table:'把學過的線索整理成一張表！每格選出反應類型。',tableWrong:'紅框的格子看看提示，改完再檢查一次。',tableRight:'整張表都對了！你已經能自己判斷這四種反應。',read:'我們先讀這段，等一下會用到！',figure:'看這張圖，對照剛才讀到的重點。',demo:'拖曳轉一轉；播放時注意電子從哪裡出發。',check:'換你判斷！選好再按「檢查」。',checkRight:'答對了！我們往下走。',checkWrong:'差一點！看看下面的提示，也可以先回看再回來。',concept:'這是這座島的新反應，先把重點讀熟。',conceptFigure:'用這張圖比一比，看出差別在哪裡。',pair:'先猜甲、乙各是哪一種反應，再揭曉。',pairShown:'選一張卡片看動畫，比一比差在哪裡。',branch:'把剛學到的判斷補進流程圖。',branchDone:'補好了！流程圖又長大一點。',branchWrong:'還不對，再對照剛才的對比想一想。',arrow:'先畫完每一步再檢查；箭頭要從電子出發。',arrowRight:'電子都走對了！',arrowWrong:'有一步要修，照提示找找看。',item:'這題是哪一種反應？先看受質、試劑和條件。',itemRight:'全對！這種反應你抓到訣竅了。',itemWrong:'沒關係，看看哪裡想錯了，也可以先回看。'};

export function mountLearningPath(root,{onNotice=()=>{},onAssessment=()=>{},loadView=()=>null,saveView=()=>{},onView=()=>{},mode='student'}={}){
 let state=memory||freshPath(),children=[],request=null,timers=[],walkRequest=null;
 try{if(!memory){const raw=localStorage.getItem(PATH_KEY);if(raw){const v=JSON.parse(raw);if(!validPath(v))throw new Error();state=v;}}}catch{blocked=true;onNotice('學習進度無法讀取，本頁暫以記憶體保存。');}
 upgradeBuildingVisits(state);
 let studentState=state;
 if(mode==='teacher')state=teacherMemory||copyPathLocation(studentState,{...freshPath(),explore:structuredClone(studentState.explore)});
 memory=studentState;
 // A reload resumes the last map or learning screen.
 let prefs=readExplorer(),view=mode==='student'&&!prefs?'name':['world','archipelago','island','learn'].includes(state.explore.at)?state.explore.at:'island',anim=null,nodePick=null,fogPick=null,archPick=null,book={open:null,pick:null,back:'island'},gate=null,nameBack='world';
 const readView=id=>mode==='teacher'?null:loadView(id),writeView=(id,value)=>{if(mode==='student')saveView(id,value);};
 const save=()=>{if(mode==='teacher'){teacherMemory=state;return;}memory=state;if(blocked)return;try{localStorage.setItem(PATH_KEY,JSON.stringify(state));}catch{blocked=true;onNotice('學習進度暫存於本頁，重新整理後可能無法保留。');}};
 const savePrefs=()=>{try{localStorage.setItem(EXPLORER_KEY,JSON.stringify(prefs));}catch{}};
 const $=s=>root.querySelector(s),clear=()=>{if(walkRequest!==null){cancelAnimationFrame(walkRequest);walkRequest=null;}children.forEach(c=>c.destroy());children=[];request?.abort();request=null;timers.forEach(clearTimeout);timers=[];};
 const explorer=()=>prefs?.name||'探險家',guideOn=()=>prefs?prefs.guide!==false:true;
 const later=(fn,ms)=>timers.push(setTimeout(fn,ms));
 const motion=()=>document.body.dataset.artMotion!=='paused'&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
 const radios=(name,list,checked)=>list.map(({v,i},n)=>`<label class="choice"><input type="radio" name="${name}" value="${i}" ${checked===i?'checked':''}><span>${esc(v)}</span></label>`).join('');

 // Review detour: snapshot every location and the view, jump to the card, and come back (also with the browser Back button).
 const where=()=>({...snapshot(state),view:view==='book'?book.back:view==='learn'||view==='island'||view==='world'?view:'island'});
 const reviewLinks=ids=>ids?.length?`<p class="review-links" data-review-links><span>建議回看：</span>${ids.map(id=>`<button type="button" class="tree-chip${CARDS.get(id).prep?'':' primer'}" data-review="${id}">${esc(cardTitle(id))}</button>`).join('')}</p>`:'';
 // Clue cards open with what they help decide; reaction concepts list clues as 看到 → 偏向 → 回看 instead of re-explaining them.
 const judgeLine=c=>c.judge?`<p class="judge-line" data-judge-line><span class="judge-tag">${esc(c.cue==='產物'?'產物細節':c.cue?`線索：${c.cue}`:'判斷準備')}</span>${esc(c.judge)}</p>`:'';
 const cueList=c=>c.cues?.length?`<ul class="cue-list" data-cue-list aria-label="判斷線索">${c.cues.map(q=>`<li><span class="cue-see">${esc(q.see)}</span><span class="cue-arrow" aria-hidden="true">→</span><span class="cue-lean">${esc(q.lean)}</span>${q.review.map(id=>`<button type="button" class="tree-chip${CARDS.get(id).prep?'':' primer'}" data-review="${id}">回看${esc(cardTitle(id))}</button>`).join('')}</li>`).join('')}</ul>`:'';
 // via: 'map' for jumps from the explorer's handbook, 'review' for links after a wrong answer.
 function startReview(id,via='review'){
  const loc=cardLocation(id)||compareLocation(id);if(!loc)return;
  // Only the first jump of a detour adds a history entry, so one Back (or one return button) always lands on the source.
  const fresh=!validReview(state.review);if(fresh)state.review={from:where(),via};
  state.stage=loc.island;state.explore.pos[loc.island]={node:loc.node,screen:loc.screen};state.explore.seen[loc.island]=true;view='learn';
  save();if(fresh)try{history.pushState({organicReview:true},'');}catch{}draw(true);
 }
 function endReview(){
  const f=validReview(state.review)?state.review.from:null;state.review=null;
  if(f){state.stage=f.stage;state.explore.pos=structuredClone(f.pos);view=f.view||'island';}
  save();draw(true);
 }
 function detourBar(){
  if(!validReview(state.review))return '';
  const from=locationLabel(state.review.from),card=view==='learn'?locationCard(snapshot(state)):null,comp=card&&COMP_OF.get(card);
  const crumbs=state.review.via==='map'?[`<li><button type="button" data-crumb-book>探險手冊</button></li>`,...(comp?[`<li><button type="button" data-crumb-comp="${comp.id}">${esc(comp.title)}</button></li>`,`<li aria-current="page">${esc(cardTitle(card))}</li>`]:[`<li aria-current="page">${esc(locationLabel(snapshot(state)))}</li>`])]:[`<li>回看</li>`,`<li aria-current="page">${esc(card?cardTitle(card):locationLabel(snapshot(state)))}</li>`];
  return `<div class="location-bar detour" data-location-bar data-review-banner role="region" aria-label="跳轉來源與返回"><p><strong>${state.review.via==='map'?'從探險手冊跳來':'回看中'}</strong></p><button type="button" data-review-dismiss>留在這裡</button><button type="button" class="primary" data-review-return>回到 ${esc(from)}</button></div><nav class="breadcrumb" aria-label="目前所在"><ol>${crumbs.join('')}</ol></nav>`;
 }
 const guideRow=(text,live=false)=>guideOn()?`<div class="explore-guide" data-guide><span class="explore-avatar">${chemistSVG(40,'observe')}</span><p class="explore-bubble" data-guide-line ${live?'aria-live="polite"':''}><strong>${esc(explorer())}：</strong><span>${esc(text)}</span></p></div>`:'';
 const say=text=>{const s=$('[data-guide-line] span');if(s)s.textContent=text;};
 const topBar=(left,title,right='')=>`<div class="explore-bar">${left}<h1 tabindex="-1">${title}</h1>${right}</div>`;
 const guideToggle=()=>`<button type="button" data-guide-toggle aria-pressed="${guideOn()}">${guideOn()?'引導：開':'引導：關'}</button>${motionToggleHTML()}`;

 function nameView(){
  return `<section class="explore-name" data-explore-name><div class="explore-hero">${chemistSVG(110)}</div><h1 tabindex="-1">幫你的小化學家取個名字</h1><p>不必填真實姓名，名字只存在這台裝置。</p><form data-name-form novalidate><label for="explorer-name">小化學家的名字</label><input id="explorer-name" name="name" maxlength="10" autocomplete="off" placeholder="探險家" value="${esc(prefs?.name&&prefs.name!=='探險家'?prefs.name:'')}"><p class="field-error" data-name-error role="alert" hidden></p><div class="explore-actions"><button type="button" data-name-skip>先叫探險家</button><button type="submit" class="primary">開始探險</button></div></form></section>`;
 }
 function worldView(){
  const arch=archipelagoProgress(state),cur=arch.find(a=>a.current)||arch[0];
  const line=anim?.type==='reveal'?'下一座島出現了！':`我們在「${cur.name}」。點一個群島看看吧！`;
  return `${detourBar()}${topBar('',`${esc(explorer())}的探險`,`<span class="explore-tools"><button type="button" data-book>探險手冊</button>${guideToggle()}</span>`)}${guideRow(line,true)}${worldMapHTML({archipelagos:arch,boat:cur.id})}<div class="explore-actions arch-extra"><button type="button" data-lighthouse>評量燈塔：選做後測與延後測</button></div>`;
 }
 function archipelagoView(){
  const arch=archipelagoProgress(state),a=arch.find(x=>x.id===archPick)||arch.find(x=>x.current)||arch[0],w=worldProgress(state);
  const line=a.id==='prep'?'先確認先備：每張卡先答一題，會的直接過。':`${a.chapters}：點一座島看看吧！`;
  return `${detourBar()}${topBar('',esc(a.name),`<span class="explore-tools"><button type="button" data-book>探險手冊</button>${guideToggle()}</span>`)}${guideRow(line,true)}${archipelagoHTML({archipelago:a,islands:a.islands,boat:state.stage})}${fogPick?`<div class="explore-sheet" data-fog-sheet role="dialog" aria-label="霧中的島"><p>這座島還在霧裡。建議先完成「${esc(w[Math.max(0,ISLANDS.findIndex(i=>i.id===fogPick)-1)].full)}」，這裡會用到它的觀念。</p><div class="explore-actions"><button type="button" data-fog-cancel>先不要</button><button type="button" class="primary" data-fog-go>仍要前往</button></div></div>`:''}`;
 }
 function islandView(){
  const isl=state.stage,info=ISLANDS.find(i=>i.id===isl),p=buildingProgress(state,isl),next=p.findIndex(n=>n.state==='next'),done=next<0,walk=anim?.type==='walk'?anim:null;
  const st=STAGES.find(s=>s.id===isl),goal=!st&&isl!=='final'?PATH_GOALS.prep:isl==='final'?PATH_GOALS.final:st.goal,task=!st&&isl!=='final'?PATH_TASKS.prep:isl==='final'?PATH_TASKS.final:st.task;
  const line=done?'整座島走完了！回世界地圖，看看下一座島。':walk?'走吧，下一站！':p.some(n=>n.flag)?'紅旗代表有觀念要回看，點那棟房子就能補。':next===0?'從第一棟開始吧！點房子可以先看看裡面有什麼。':'走得很穩！準備好就繼續。';
  const pick=nodePick!==null?p[nodePick]:null;
  return `${detourBar()}${topBar('<button type="button" data-go-world>‹ 世界地圖</button>',esc(info.full),'<button type="button" data-book>手冊</button>')}${guideRow(line,true)}${islandViewHTML({island:isl,nodes:p,hero:walk?walk.from:done?p.length-1:next})}${pick?nodeSheet(isl,nodePick,pick):''}<section class="island-brief"><p><strong>這座島要學會：</strong>${esc(goal)}</p><p><strong>短任務：</strong>${esc(task)}</p><button type="button" class="primary" data-node-go="${done?p.length-1:next}">${done?'再走一次最後一站':`前往下一站：${esc(p[next].label)}`}</button></section>`;
 }
 function nodeSheet(isl,i,n){
  const building=islandBuildings(isl)[i],what=building.card?cardTitle(building.card):`${building.end-building.screen+1} 個畫面，一次一件事`;
  return `<div class="explore-sheet" data-node-sheet="${i}" role="dialog" aria-label="${esc(n.label)}"><p class="sheet-head"><strong>${esc(n.label)}</strong><span>${n.state==='done'?'已走過':n.state==='next'?'下一站':'還沒到'}</span></p><p>${esc(what)}</p>${n.flag?`<p class="sheet-flag">⚑ 需回看：${n.wrong.map(id=>esc(cardTitle(id))).join('、')}</p>`:''}<div class="explore-actions"><button type="button" data-node-close>關閉</button><button type="button" class="primary" data-node-go="${i}">${n.state==='done'?'再走一次':'開始'}</button></div></div>`;
 }
 function completeView(){
  const isl=state.stage,info=ISLANDS.find(i=>i.id===isl),st=STAGES.find(s=>s.id===isl);
  return `<section class="explore-complete" data-island-complete="${isl}"><div class="explore-hero">${chemistSVG(110)}</div><h1 tabindex="-1">${esc(info.full)} 走完了！</h1>${guideRow(ISLANDS.at(-1).id===isl?'九種反應都練過一輪了！還想練可以再進來。':'下一座島的霧要散開了，我們搭船過去吧！',true)}${st?masteryHTML(unlockedTypes(st.id)):''}<div class="explore-actions"><button type="button" class="primary" data-complete-world>回世界地圖</button></div></section>`;
 }
 function bookView(){
  const flags=[...CARDS.keys()].filter(id=>checkStatus(state,id)==='wrong'),here=book.back==='learn'?snapshot(state):null;
  return `${topBar('<button type="button" data-book-close aria-label="關閉探險手冊">✕</button>','探險手冊',guideToggle())}<section class="explore-book" data-explore-book><h2 tabindex="-1">紅旗（需回看）</h2>${flags.length?`<ul class="flag-list">${flags.map(id=>`<li><p><span class="legend-flag" aria-hidden="true">⚑</span> <strong>${esc(cardTitle(id))}</strong>　<span>${esc(cardPlace(id))}</span></p><p class="flag-note">會記住你現在的位置，看完一鍵回來。</p><button type="button" data-map-go="${id}">前往回看</button></li>`).join('')}</ul>`:'<p>目前沒有紅旗。</p>'}<h2>六項能力</h2><p class="map-hint">點能力在原地展開；點觀念卡先預覽，按「前往」才跳過去。</p>${competencyListHTML(state,{open:book.open,pick:book.pick,hereCard:here&&locationCard(here),hereLabel:locationLabel(snapshot(state))})}<h2>小化學家</h2><p>名字：<strong>${esc(explorer())}</strong>　<button type="button" data-rename>改名字</button></p></section>`;
 }
 function learnView(){
  const isl=state.stage,nodes=islandNodes(isl),pos=state.explore.pos[isl],node=nodes[Math.min(pos.node,nodes.length-1)],screens=nodeScreens(isl,node),i=Math.min(pos.screen,screens.length-1);
  const building=islandBuildings(isl)[currentBuilding(isl,pos)],final=node.kind==='final',total=final?FINAL_COUNT:building.end-building.screen+1,cur=final?Math.min(finalCount()+1,FINAL_COUNT):i-building.screen+1,last=!final&&i===building.end;
  return `${detourBar()}<div class="learn-top"><button type="button" class="learn-exit" data-exit-learn aria-label="回到島上">✕</button><div class="learn-progress" role="progressbar" aria-label="這個據點的進度" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${cur}"><i style="width:${Math.round(cur/total*100)}%"></i></div><span class="learn-count">${cur}／${total}</span>${motionToggleHTML()}</div><p class="learn-where">${esc(ISLANDS.find(x=>x.id===isl).full)}・${esc(building.short)}</p>${guideRow('',true)}<article class="guide-panel learn-panel" data-path-panel></article><div class="learn-next"><p class="learn-gate" data-learn-gate role="status" hidden></p><button type="button" class="primary" data-continue-screen>${final?'下一題':last?'完成這個據點':'繼續'}</button></div>`;
 }
 const finalCount=()=>state.attempts.filter(a=>a.stage==='final').length;

 function draw(focus=false){
  clear();gate=null;onView(view);
  if(['world','archipelago','island','learn'].includes(view)&&state.explore.at!==view){state.explore.at=view;save();}
  const html={name:nameView,world:worldView,archipelago:archipelagoView,island:islandView,learn:learnView,book:bookView,complete:completeView}[view]();
  root.innerHTML=`<section class="guided-lesson learning-path explore" data-learning-path data-stage="${state.stage}" data-view="${view}" data-arrival="${anim?.type==='reveal'?'reveal':'none'}">${ambientHTML()}${html}</section>`;
  if(view==='learn')renderScreen();
  if(view==='name')bindName();
  if(mode==='teacher'&&view==='learn')teachingControls($('[data-path-panel]'));
  if(anim?.type==='walk'){
   const a=anim,el=$('[data-hero]'),n=islandBuildings(state.stage).length,points=walkingRoute(n,a.from,a.to);anim=null;
   if(el&&motion()){
    el.classList.add('is-walking');const distances=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.y-points[i].y)),total=distances.reduce((x,y)=>x+y,0),start=performance.now();
    const tick=now=>{let d=(motion()?Math.min(1,(now-start)/1100):1)*total,k=0;while(k<distances.length-1&&d>distances[k])d-=distances[k++];const t=distances[k]?d/distances[k]:1,p=points[k],q=points[Math.min(k+1,points.length-1)];el.style.left=((p.x+(q.x-p.x)*t)/720*100).toFixed(2)+'%';el.style.top=((p.y+(q.y-p.y)*t)/840*100).toFixed(2)+'%';if(motion()&&now-start<1100&&el.isConnected)walkRequest=requestAnimationFrame(tick);else{walkRequest=null;el.classList.remove('is-walking');}};
    walkRequest=requestAnimationFrame(tick);
   }else if(el){const p=spotFor(n,a.to);el.style.left=p.left;el.style.top=p.top;}
   later(()=>say('到了！準備好就按下面的按鈕開始。'),motion()?1150:0);
  }
  else if(anim?.type==='reveal')anim=null;
  if(focus){root.querySelector('h1,h2')?.focus({preventScroll:true});root.scrollIntoView({block:'start',behavior:'instant'});}
 }
 const go=v=>{view=v;nodePick=null;fogPick=null;draw(true);};
 function bindName(){
  const form=$('[data-name-form]'),input=form.querySelector('input'),err=$('[data-name-error]');
  input.oninput=()=>{err.hidden=true;err.textContent='';};
  form.onsubmit=e=>{e.preventDefault();const v=input.value.trim();if([...v].length>10){err.hidden=false;err.textContent='名字最多 10 個字';input.focus();return;}prefs={name:v||'探險家',guide:prefs?.guide!==false};savePrefs();go(nameBack);};
 }
 function enterNode(i){
  const isl=state.stage,pos=state.explore.pos[isl],building=islandBuildings(isl)[i];if(!building)return;
  const node=islandNodes(isl)[building.node],done=buildingProgress(state,isl)[i].state==='done';
  if(pos.node!==building.node||pos.screen<building.screen||pos.screen>building.end||done){pos.node=building.node;pos.screen=building.screen;}
  if(node.kind==='mixed'){const m=state.stages[isl].mixed;if(done){m.done=0;m.current=null;}pos.screen=Math.min(m.done,nodeScreens(isl,node).length-1);}
  state.explore.seen[isl]=true;save();go('learn');
 }
 function finishNode(){
  const isl=state.stage,pos=state.explore.pos[isl],from=currentBuilding(isl,pos),building=islandBuildings(isl)[from];
  // The judgment table never blocks the way on, but it only counts as walked once all cells are right.
  if(building.kind==='table'&&!tableSolved(state)){const b=islandBuildings(isl)[from+1];pos.node=b.node;pos.screen=b.screen;anim={type:'walk',from,to:from+1};save();go('island');return;}
  const next=completeBuilding(state,isl,from);
  if(next<0){pos.screen=0;save();go('complete');return;}
  const b=islandBuildings(isl)[next];pos.node=b.node;pos.screen=b.screen;anim={type:'walk',from,to:next};save();go('island');
 }
 function advance(){
  const ok=gate?.()??true;
  if(ok!==true&&mode==='student'){const g=$('[data-learn-gate]');g.hidden=false;g.textContent=ok;return;}
  const isl=state.stage,nodes=islandNodes(isl),pos=state.explore.pos[isl],node=nodes[pos.node],screens=nodeScreens(isl,node);
  if(node.kind==='final'){state.final.current=null;if(finalCount()>=FINAL_COUNT)state.explore.done.final.final=true;save();draw(true);return;}
  if(node.kind==='mixed'){const m=state.stages[isl].mixed;m.done++;m.current=null;}
  const b=islandBuildings(isl)[currentBuilding(isl,pos)],scr=screens[pos.screen];
  if(scr?.type==='diagnose'&&state.diag[scr.card]?.pre?.right){pos.screen=b.end;finishNode();return;}
  if(pos.screen<b.end){pos.screen++;save();draw(true);return;}
  finishNode();
 }

 // --- One screen at a time inside a landmark.
 function renderScreen(){
  const panel=$('[data-path-panel]'),isl=state.stage,nodes=islandNodes(isl),pos=state.explore.pos[isl],node=nodes[pos.node],screens=nodeScreens(isl,node),scr=screens[Math.min(pos.screen,screens.length-1)],st=STAGES.find(s=>s.id===isl),r=st&&state.stages[st.id];
  const head=(tag,title)=>`<p class="course-part">${esc(tag)}</p><h2 tabindex="-1">${esc(title)}</h2>`;
  if(scr.card){
   const c=CARDS.get(scr.card).card,tag=`${node.label}${scr.concept!==undefined?' · 產物細節':''}${c.optional?'（選讀）':''}`;
   if(scr.type==='read'){panel.innerHTML=`${head(tag,c.title)}${judgeLine(c)}${c.body.map(p=>`<p data-teacher-hint>${esc(p)}</p>`).join('')}<p class="concept-example" data-teacher-result>${esc(c.example)}</p><details class="learning-sources"><summary>原文來源</summary>${sourceLinks(c.pages)}</details>`;say(LINES.read);}
   else if(scr.type==='figure'){panel.innerHTML=`${head(tag+' · 圖解',c.title)}${c.visual?'<div class="concept-visual guide-concept" data-path-visual></div>':''}${c.widget?'<div class="concept-widget" data-cation-host></div>':''}`;if(c.visual)mountVisual($('[data-path-visual]'),c.visual);mountWidget(c);say(LINES.figure);}
   else if(scr.type==='demo'){panel.innerHTML=`${head(tag+' · 三維',c.title)}<section class="concept-3d" data-concept-3d><p class="teacher-note">三維模型：拖曳旋轉、加減鍵縮放，可逐段播放電子移動。</p>${c.demos.length>1?`<div class="check-tools">${c.demos.map((d,k)=>`<button type="button" data-concept-demo="${k}" aria-pressed="${k===0}">${esc(d.label)}</button>`).join('')}</div>`:''}<div data-concept-player></div></section>`;mountDemos(c);say(LINES.demo);}
   else if(scr.type==='diagnose'||scr.type==='recheck'){const which=scr.type==='diagnose'?'pre':'post';panel.innerHTML=`${head(tag+(which==='pre'?' · 先備診斷':' · 讀完再確認'),c.title)}${diagForm(c,which)}`;bindDiag(c,which);const r=state.diag[c.id]?.[which];say(r?(r.right?(which==='pre'?LINES.diagReady:LINES.checkRight):LINES.checkWrong):which==='pre'?LINES.diag:LINES.check);gate=()=>state.diag[c.id]?.[which]?true:'先選一個答案，按「檢查」後再繼續。';}
   else{panel.innerHTML=`${head(tag+' · 即時檢查',c.title)}${checkForm(c)}`;bindCheck(c);const a=state.warm.checks[c.id];say(a?(a.choice===c.check.answer?LINES.checkRight:LINES.checkWrong):LINES.check);gate=()=>state.warm.checks[c.id]?true:'先選一個答案，按「檢查」後再繼續。';}
   return;
  }
  if(scr.type==='concept'||scr.type==='concept-figure'){
   const c=st.concepts[scr.index];
   if(scr.type==='concept'){panel.innerHTML=`${head(`概念 ${scr.index+1}／${st.concepts.length}`,c.title)}${c.body.map(p=>`<p data-teacher-hint>${esc(p)}</p>`).join('')}${cueList(c)}<p class="concept-example" data-teacher-result>${esc(c.example)}</p><details class="learning-sources"><summary>原文來源</summary>${sourceLinks(c.pages)}</details>`;say(LINES.concept);}
   else{panel.innerHTML=`${head(`概念 ${scr.index+1} · 圖解`,c.title)}<div class="concept-widget" data-cation-host></div>`;mountWidget(c);say(LINES.conceptFigure);}
   return;
  }
  if(scr.type==='compare'){panel.innerHTML=comparisonHTML(scr.id);const stop=mountComparison(panel);children.push({destroy:stop});say(LINES.compare);return;}
  if(scr.type==='table'){judgeTable(panel);return;}
  if(scr.type==='pair'){r.pair=scr.index;contrast(panel,st,r);return;}
  if(scr.type==='branch'){branches(panel,st,r,scr.index);return;}
  if(scr.type==='arrow'){r.arrowKind=scr.index;arrows(panel,st,r);return;}
  if(scr.type==='item'){practiceItem(panel,{types:unlockedTypes(st.id),slot:r.mixed,stageId:st.id,progress:`混合練習 ${scr.index+1}／${st.mixCount}　·　題型：${unlockedTypes(st.id).map(t=>TYPES[t].label).join('、')}`});return;}
  finalPractice(panel);
 }
 const checkForm=c=>{const answered=state.warm.checks[c.id];return `<form class="concept-quiz" data-warm-check><fieldset><legend>即時檢查：${esc(c.check.prompt)}</legend>${radios('warm',shuffled(c.check.options,c.id),answered?.choice)}</fieldset><button type="submit">檢查</button><p class="feedback-box" data-warm-feedback role="status" ${answered?'':'hidden'}>${answered?esc((answered.choice===c.check.answer?'正確。':'再想想。')+c.check.feedback):''}</p><div data-check-review>${answered&&answered.choice!==c.check.answer?reviewLinks(c.review):''}</div></form><p class="teacher-note">不計分，只幫你確認有沒有讀懂。</p>`;};
 // Diagnosis: the first item is asked before reading; a different item confirms after reading. Each answer is kept once.
 const diagItem=(c,which)=>which==='pre'?c.diagnose[0]:c.diagnose[1+(c.id.length%Math.max(1,c.diagnose.length-1))]||c.diagnose[1];
 const diagForm=(c,which)=>{const item=diagItem(c,which),rec=state.diag[c.id]?.[which];return `<form class="concept-quiz" data-diag-form${rec?` data-diag-result="${rec.right?'right':'wrong'}"`:''}><fieldset><legend>${which==='pre'?'先備診斷':'讀完再確認'}：${esc(item.prompt)}</legend>${radios('diag',shuffled(item.options,c.id+which),rec?.choice).replaceAll('type="radio"',rec?'type="radio" disabled':'type="radio"')}</fieldset>${rec?'':'<button type="submit">檢查</button>'}<p class="feedback-box${rec?.right?' correct':''}" data-diag-feedback role="status" ${rec?'':'hidden'}>${rec?esc(diagFeedback(item,which,rec.right)):''}</p><div data-check-review>${rec&&!rec.right&&which==='post'?reviewLinks(c.review):''}</div></form><p class="teacher-note">${which==='pre'?'答對就代表你已具備，可以直接跳過這張卡。':'不計分，答錯會插紅旗提醒你之後回看。'}</p>`;};
 const diagFeedback=(item,which,right)=>which==='pre'?(right?`答對了！${item.feedback} 這張卡你已具備，按「繼續」直接跳過。`:`${item.feedback} 我們讀一下這張卡，讀完換一題再確認。`):(right?`正確。${item.feedback}`:`再想想。${item.feedback}`);
 const bindDiag=(c,which)=>{const form=$('[data-diag-form]');if(!form||state.diag[c.id]?.[which])return;form.onsubmit=e=>{e.preventDefault();const v=new FormData(e.target).get('diag');if(v===null)return;const item=diagItem(c,which),choice=Number(v),right=choice===item.answer;(state.diag[c.id]||={})[which]={choice,right};save();draw();};};
 // Warm-up and entry-primer checks share state.warm.checks, keyed by card id.
 const bindCheck=c=>{$('[data-warm-check]').onsubmit=e=>{e.preventDefault();const v=new FormData(e.target).get('warm');if(v===null)return;const choice=Number(v),right=choice===c.check.answer,first=state.warm.checks[c.id]?.first??right;state.warm.checks[c.id]={choice,first};save();const box=$('[data-warm-feedback]');box.hidden=false;box.textContent=(right?'正確。':'再想想。')+c.check.feedback;$('[data-check-review]').innerHTML=right?'':reviewLinks(c.review);$('[data-learn-gate]').hidden=true;say(right?LINES.checkRight:LINES.checkWrong);};};
 const mountDemos=c=>{if(!c.demos)return;let spot=null;const play=k=>{if(spot){spot.destroy();children=children.filter(x=>x!==spot);}root.querySelectorAll('[data-concept-demo]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.conceptDemo)===k)));const d=c.demos[k],found=exampleById(d.example),key='warm:'+c.id+':'+k;spot=mountSpotlight($('[data-concept-player]'),{kind:d.kind,specOverride:exampleSpec(d.kind,found.example),segment:Number.isInteger(d.step)?{step:d.step}:null,initialState:readView(key),onStateChange:s=>writeView(key,s)});children.push(spot);if(mode==='teacher'&&$('[data-teaching-controls]'))resetTeaching();};root.querySelectorAll('[data-concept-demo]').forEach(b=>b.onclick=()=>play(Number(b.dataset.conceptDemo)));play(0);};
 const mountWidget=c=>{const host=$('[data-cation-host]');if(!host||!c.widget)return;if(c.widget.kind==='skeletal')host.innerHTML=skeletalHTML();if(c.widget.kind==='degree')host.innerHTML=degreeHTML();if(c.widget.kind==='energy')host.innerHTML=energyHTML();if(c.widget.kind==='leaving')host.innerHTML=leavingHTML();if(c.widget.kind==='cation-cloud')children.push(mountCationCloud(host,{initial:c.widget.initial}));};

 // --- Capstone: fill the substrate × reagent table, then check it all at once.
 function judgeTable(panel){
  const T=JUDGE_TABLE,t=state.table||=freshTable(),label=(list,id)=>list.find(x=>x.id===id).label;
  const options=(list,value,ph)=>`<option value="">${ph}</option>${list.map(o=>`<option value="${o.id}"${o.id===value?' selected':''}>${esc(o.label)}</option>`).join('')}`;
  const cellHTML=(row,col)=>{const key=`${row.id}|${col.id}`,a=t.cells[key]||{},name=`${row.label}＋${col.label}`;return `<td data-cell="${key}"><span class="judge-col-label" aria-hidden="true">${esc(col.label)}</span><select data-cell-type="${key}" aria-label="${esc(name)}：反應類型">${options(T.types,a.type,'反應類型')}</select><div class="judge-feedback" data-cell-feedback="${key}" hidden></div></td>`;};
  panel.innerHTML=`<p class="course-part">總混合・判斷表</p><h2 tabindex="-1">自己完成這張判斷表</h2><p class="guide-bridge">看受質級數（列）和試劑（欄），每格選出反應類型。全部填完再一起檢查。</p><div class="judge-table-wrap"><table class="judge-table"><thead><tr><th scope="col">受質＼試劑</th>${T.cols.map(c=>`<th scope="col">${esc(c.label)}<small>${esc(c.eg)}</small></th>`).join('')}</tr></thead><tbody>${T.rows.map(r=>`<tr><th scope="row">${esc(r.label)}<small>${esc(r.formula)}</small></th>${T.cols.map(c=>cellHTML(r,c)).join('')}</tr>`).join('')}</tbody></table></div><div class="explore-actions"><button type="button" class="primary" data-table-check>檢查整張表</button></div><p class="judge-status" data-table-status role="status"></p><details class="learning-sources"><summary>原文來源</summary>${sourceLinks(T.pages)}</details>`;
  const mark=()=>{
   const res=tableResult(t),bad=new Set(res.wrong);
   panel.querySelectorAll('[data-cell]').forEach(td=>{
    const key=td.dataset.cell,box=td.querySelector('[data-cell-feedback]'),want=T.cells[key],isBad=bad.has(key);
    td.classList.toggle('wrong',isBad);td.classList.toggle('right',!isBad&&!res.missing.includes(key));
    box.hidden=!isBad;if(!isBad)return;
    const compare=want.compare&&COMPARISONS.find(c=>c.id===want.compare);
    box.innerHTML=`<p>${esc(want.note)}</p><p class="review-links"><span>回看：</span>${TABLE_REVIEW[want.type[0]].map(id=>`<button type="button" class="tree-chip" data-review="${id}">${esc(cardTitle(id))}</button>`).join('')}${compare?`<button type="button" class="tree-chip primer" data-review="${compare.id}">比較動畫</button>`:''}</p>`;
   });
   const status=$('[data-table-status]');
   status.textContent=res.wrong.length?`對了 ${res.right}／${res.total} 格。紅框的格子看提示再改，改完再檢查一次。`:`整張表 ${res.total} 格都對了！按「繼續」前往總混合練習。`;
   say(res.wrong.length?LINES.tableWrong:LINES.tableRight);
  };
  panel.querySelectorAll('select').forEach(sel=>sel.onchange=()=>{const key=sel.dataset.cellType;t.cells[key]={type:sel.value||undefined};save();const td=sel.closest('td');td.classList.remove('wrong','right');td.querySelector('[data-cell-feedback]').hidden=true;});
  $('[data-table-check]').onclick=()=>{
   const res=tableResult(t),status=$('[data-table-status]');
   if(res.missing.length){status.textContent=`還有 ${res.missing.length} 格沒填完，全部填完再檢查。`;return;}
   t.checks++;if(!t.first)t.first={right:res.right,total:res.total,at:new Date().toISOString()};save();mark();
  };
  if(t.checks>0&&tableResult(t).missing.length===0)mark();else say(LINES.table);
 }
 function contrast(panel,st,r){
  const k=Math.min(r.pair,st.pairs.length-1),pair=st.pairs[k],key=String(k),cards=[pair.a,pair.b].map(id=>{const e=exampleById(id);return {id,...e,answer:e.kind==='rearrangement'?'addhx':e.kind};}),types=unlockedTypes(st.id),pred=r.predictions[key]||{},revealed=mode==='teacher'||Boolean(r.revealed[key]);
  panel.innerHTML=`<p class="course-part">對比 ${k+1}／${st.pairs.length}</p><h2 tabindex="-1">先預測，再看動畫揭曉</h2><p class="guide-bridge">${esc(pair.diff)}</p><div class="contrast-pair">${cards.map((c,j)=>`<section class="contrast-card${revealed&&mode==='student'?(pred[j]===c.answer?' right':' wrong'):''}" data-contrast-card="${j}"><h3>${j?'乙':'甲'}：${esc(c.example.substrate)}</h3><p><strong>試劑：</strong>${esc(c.example.reagent)}</p><p><strong>條件：</strong>${esc(c.example.conditions)}</p><label data-student-only>我預測<select data-predict="${j}" ${revealed?'disabled':''}><option value="">選擇反應類型</option>${types.map(t=>`<option value="${t}" ${pred[j]===t?'selected':''}>${esc(TYPES[t].label)}</option>`).join('')}</select></label>${revealed?`<p class="contrast-answer" data-teacher-result>答案：<strong>${esc(TYPES[c.answer].label)}${c.kind==='rearrangement'?'（經碳陽離子重排）':''}</strong>${mode==='teacher'?'':pred[j]===c.answer?'（你預測對了）':`（你預測 ${esc(TYPES[pred[j]]?.label||'—')}）`}</p><p data-teacher-result>${esc(c.example.note)}</p><p class="teacher-note" data-teacher-result>產物：${esc(c.example.product)}</p>`:''}</section>`).join('')}</div>${revealed?`<div class="contrast-watch"><p>選一張卡片觀看三維機構：</p><div class="check-tools">${cards.map((c,j)=>`<button type="button" data-watch="${j}" aria-pressed="false">${j?'乙':'甲'}：${mode==='teacher'?'觀察反應':esc(TYPES[c.kind].label)}</button>`).join('')}</div><div data-contrast-player></div></div>`:'<p class="teacher-note">兩張卡片都選好才揭曉；預測不計分，但會保留第一次的判斷。</p>'}${revealed?'':`<div class="guide-actions"><button type="button" class="primary" data-reveal ${pred[0]&&pred[1]?'':'disabled'}>揭曉答案</button></div>`}<details class="learning-sources"><summary>原文來源</summary>${sourceLinks([...new Set(cards.flatMap(c=>c.example.pages))])}</details>`;
  root.querySelectorAll('[data-predict]').forEach(s=>s.onchange=()=>{(r.predictions[key]||={})[s.dataset.predict]=s.value;save();const p=r.predictions[key];const b=$('[data-reveal]');if(b)b.disabled=!(p[0]&&p[1]);});
  $('[data-reveal]')?.addEventListener('click',()=>{r.revealed[key]=true;save();draw();});
  root.querySelectorAll('[data-watch]').forEach(b=>b.onclick=()=>{children.forEach(c=>c.destroy());children=[];root.querySelectorAll('[data-watch]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));const c=cards[Number(b.dataset.watch)];children.push(mountSpotlight($('[data-contrast-player]'),{kind:c.kind,specOverride:exampleSpec(c.kind,c.example),initialState:readView(c.id),onStateChange:s=>writeView(c.id,s)}));if(mode==='teacher')resetTeaching();});
  if(mode==='teacher')$('[data-watch]')?.click();
  say(revealed?LINES.pairShown:LINES.pair);gate=()=>r.revealed[key]?true:'兩張卡片都預測後，先按「揭曉答案」。';
 }
 function branches(panel,st,r,k){
  const tasks=st.branches,t=tasks[k],rec=r.branches[k],pending=tasks.flatMap((x,i)=>r.branches[i]?.done?[]:x.ids);
  panel.innerHTML=`<p class="course-part">流程圖 ${k+1}／${tasks.length}</p><h2 tabindex="-1">把新學到的判斷補進流程圖</h2><p>流程圖會隨每個階段長出新分支。${rec?.done?'這條分支補好了。':'選出最合適的分支內容，補上虛線框。'}</p>${flowHTML(st.id,{pending})}${rec?.done?'':`<form data-branch-form><fieldset><legend>${esc(t.prompt)}</legend>${radios('branch',shuffled(t.options,st.id+k),rec?.choice)}</fieldset><button type="submit">補上這條分支</button><p class="feedback-box" data-branch-feedback role="status" hidden></p><div data-branch-review></div></form>`}`;
  $('[data-branch-form]')?.addEventListener('submit',e=>{e.preventDefault();const v=new FormData(e.target).get('branch');if(v===null)return;const choice=Number(v),rec=r.branches[k]||={tries:0};rec.tries++;rec.choice=choice;rec.first??=choice===t.answer;const box=$('[data-branch-feedback]');box.hidden=false;if(choice===t.answer){rec.done=true;save();draw();}else{save();box.textContent='還不對：'+t.feedback;$('[data-branch-review]').innerHTML=reviewLinks(st.needs);say(LINES.branchWrong);}});
  say(rec?.done?LINES.branchDone:LINES.branch);gate=()=>r.branches[k]?.done?true:'先補上這條分支，再繼續。';
 }
 function gradedPanel(host,{kind,spec=null,record,onFirst=()=>{},persist}){
  // record: {work, first, hints, level}
  if(!validWork(kind,record.work))record.work=newMechanism(kind);
  host.innerHTML=`<div data-graded-editor></div><div class="course-actions"><button type="button" data-graded-check>檢查箭頭</button><button type="button" data-graded-more hidden>再給更明確的提示</button><button type="button" data-graded-ai hidden>請本機 AI 換句話說</button></div><p class="feedback-box" data-graded-feedback role="status" hidden></p><div data-graded-review></div>`;
  const q=s=>host.querySelector(s),editor=mountArrowEditor(q('[data-graded-editor]'),{kind,work:record.work,graded:true,spec,allowAI:false,revealProducts:true,onChange:w=>{record.work=w;record.level=0;persist();}});
  const show=(h)=>{const box=q('[data-graded-feedback]');box.hidden=false;box.classList.toggle('correct',h.ok);box.textContent=h.text;q('[data-graded-more]').hidden=h.ok||h.level>=2;q('[data-graded-ai]').hidden=h.ok||h.level<2;q('[data-graded-review]').innerHTML=h.ok?'':reviewLinks(ARROW_REVIEW);say(h.ok?LINES.arrowRight:LINES.arrowWrong);$('[data-learn-gate]').hidden=true;};
  q('[data-graded-check]').onclick=()=>{if(record.first===null||record.first===undefined){record.first=firstArrowResult(kind,record.work);onFirst(record.first);}record.level=1;const h=gradedHint(kind,record.work,1,spec);if(!h.ok)record.hints=(record.hints||0)+1;persist();show(h);};
  q('[data-graded-more]').onclick=()=>{record.level=2;record.hints=(record.hints||0)+1;persist();show(gradedHint(kind,record.work,2,spec));};
  q('[data-graded-ai]').onclick=async()=>{const b=q('[data-graded-ai]'),box=q('[data-graded-feedback]');b.disabled=true;request?.abort();request=new AbortController();const timer=setTimeout(()=>request?.abort(),50000);box.textContent='正在取得核對過的提示…';try{box.textContent=await aiArrowHint(kind,record.work,request.signal);}catch{box.textContent=gradedHint(kind,record.work,2,spec).text+'（本機 AI 未連接，以上為內建提示）';}finally{clearTimeout(timer);b.disabled=false;}};
  return editor;
 }
 function arrows(panel,st,r){
  const k=Math.min(r.arrowKind,st.arrowKinds.length-1),kind=st.arrowKinds[k],rec=r.arrows[kind]||={work:newMechanism(kind),first:null,hints:0,level:0};
  panel.innerHTML=`<p class="course-part">機構 ${k+1}／${st.arrowKinds.length}</p><h2 tabindex="-1">畫出電子箭頭：${esc(TYPES[kind].label)}</h2><p>先自己畫完每一步並保存，再按「檢查箭頭」。第一次只告訴你哪一步要修，第二次才指出哪一支箭頭；第一次檢查的結果會記錄下來。</p><div data-graded-host></div>`;
  children.push(gradedPanel($('[data-graded-host]'),{kind,record:rec,persist:save}));
  say(LINES.arrow);gate=()=>rec.first===null||rec.first===undefined?'畫完箭頭後，至少按一次「檢查箭頭」。':true;
 }
 function practiceItem(panel,{types,slot,stageId,progress=''}){
  if(!slot.current){const it=pickItem(types,state.attempts,Math.random,{shift:shiftUnlocked(stageId)});slot.current={item:it.id,answers:{},submitted:false,arrow:{work:newMechanism(it.type),first:null,hints:0,level:0}};save();}
  const cur=slot.current,item=ITEMS.find(i=>i.id===cur.item);if(!item){slot.current=null;save();return practiceItem(panel,{types,slot,stageId,progress});}
  const reasons=shuffled(item.reasons,item.id+'r'),products=shuffled(item.products,item.id+'p'),done=cur.submitted,a=cur.answers,want=itemType(item),askShift=shiftUnlocked(stageId)&&CARBOCATION_TYPES.includes(want),shiftAnswer=item.type==='rearrangement'?'yes':'no',allRight=a.mech===want&&a.reason===0&&a.product===0&&(!askShift||a.shift===shiftAnswer);
  const verdict=(ok,label,answer)=>`<li class="${ok?'right':'wrong'}">${ok?'✓':'✗'} ${label}${ok?'':`：應為「${esc(answer)}」`}</li>`;
  panel.innerHTML=`<p class="course-part">${progress}</p><h2 tabindex="-1">這是哪一種反應？</h2><section class="reaction-card"><p><strong>起始物：</strong>${esc(item.substrate)}</p><p><strong>試劑：</strong>${esc(item.reagent)}</p><p><strong>條件：</strong>${esc(item.conditions)}</p></section><form data-mixed-form><fieldset><legend>1. 反應類型</legend>${types.map(t=>`<label class="choice"><input type="radio" name="mech" value="${t}" ${a.mech===t?'checked':''} ${done?'disabled':''}><span>${esc(TYPES[t].label)}<small>　${esc(TYPES[t].name)}</small></span></label>`).join('')}</fieldset><fieldset><legend>2. 主要判斷依據</legend>${radios('reason',reasons,a.reason).replaceAll('type="radio"',done?'type="radio" disabled':'type="radio"')}</fieldset><fieldset><legend>3. 主要產物</legend>${radios('product',products,a.product).replaceAll('type="radio"',done?'type="radio" disabled':'type="radio"')}</fieldset>${askShift?`<fieldset data-shift-question><legend>4. 碳陽離子會不會重排？</legend>${[['no','不會：直接被接住'],['yes','會：H 或甲基位移成更穩定的碳陽離子']].map(([v,t])=>`<label class="choice"><input type="radio" name="shift" value="${v}" ${a.shift===v?'checked':''} ${done?'disabled':''}><span>${t}</span></label>`).join('')}</fieldset>`:''}${done?'':'<button type="submit">提交判斷</button>'}</form><details class="flow-peek" ${done?'open':''}><summary>${done?'流程圖：這題走過的路徑':'對照流程圖'}</summary>${flowHTML(stageId,{highlight:done?item.path:[]})}</details>${done?`<section class="mixed-feedback"><ul>${verdict(a.mech===want,'反應類型',TYPES[want].label)}${verdict(a.reason===0,'判斷依據',item.reasons[0])}${verdict(a.product===0,'主要產物',item.products[0])}${askShift?verdict(a.shift===shiftAnswer,'會不會重排',shiftAnswer==='yes'?'會重排':'不會重排'):''}</ul><p>${esc(item.explain)}</p>${allRight?'':reviewLinks(REVIEW_BY_TYPE[item.type])}</section><h3>4. 畫出電子箭頭（${esc(TYPES[item.type].label)}）</h3><p class="teacher-note">${itemSpec(item)?'模板依相近的例子標示。':'以反應中心的通用模板作答；取代基可能與題目不同。'}</p><div data-mixed-arrows></div>`:''}`;
  if(!done)$('[data-mixed-form]').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);if(!f.get('mech')||f.get('reason')===null||f.get('product')===null||askShift&&!f.get('shift')){onNotice('每個問題都回答後再提交。');return;}onNotice('');cur.answers={mech:f.get('mech'),reason:Number(f.get('reason')),product:Number(f.get('product')),...(askShift?{shift:f.get('shift')}:{})};cur.submitted=true;state.attempts.push({item:item.id,type:want,mech:cur.answers.mech===want,shift:askShift?cur.answers.shift===shiftAnswer:null,reason:cur.answers.reason===0,product:cur.answers.product===0,arrows:null,hints:0,stage:stageId,at:new Date().toISOString()});if(state.attempts.length>600)state.attempts.splice(0,state.attempts.length-600);cur.attempt=state.attempts.length-1;save();draw();};
  else{const record=cur.arrow,attempt=()=>state.attempts.findLast(x=>x.item===item.id);children.push(gradedPanel($('[data-mixed-arrows]'),{kind:item.type,spec:itemSpec(item),record,persist:()=>{const at=attempt();if(at)at.hints=record.hints||0;save();},onFirst:ok=>{const at=attempt();if(at)at.arrows=ok;}}));}
  say(done?(allRight?LINES.itemRight:LINES.itemWrong):LINES.item);gate=()=>slot.current?.submitted?true:'每個問題都回答並提交後，再到下一題。';
 }
 function masteryHTML(types){const m=mastery(types,state.attempts);return `<div class="table-wrap"><table class="mastery"><thead><tr><th>反應類型</th><th>最近正確</th><th>狀態</th></tr></thead><tbody>${types.map(t=>`<tr data-mastery="${t}"><th>${esc(TYPES[t].label)}</th><td>${m[t].recent?`${m[t].right}／${m[t].recent}`:'—'}</td><td>${m[t].level}</td></tr>`).join('')}</tbody></table></div>`;}
 function finalPractice(panel){
  const types=unlockedTypes('final');
  practiceItem(panel,{types,slot:state.final,stageId:'final',progress:`總混合練習 · 已作答 ${finalCount()} 題`});
  panel.insertAdjacentHTML('beforeend',`<details class="learning-sources"><summary>各反應類型的精熟度（依最近 5 題）</summary>${masteryHTML(types)}<p class="teacher-note">答錯較多的類型會較常出現；同一類型盡量不連續出現。隨時可以按 ✕ 結束。</p></details>`);
 }

 // Delegated clicks: map, landmarks, handbook, detours and the continue button.
 const onClick=e=>{
  const t=e.target.closest?.('button');if(!t||!root.contains(t))return;const d=t.dataset;
  if(d.archipelago){archPick=d.archipelago;go('archipelago');return;}
  if(d.island){const w=worldProgress(state).find(x=>x.id===d.island);if(w.state==='fog'){fogPick=d.island;draw();$('[data-fog-go]')?.focus();return;}state.stage=d.island;state.explore.seen[d.island]=true;save();go('island');return;}
  if(t.hasAttribute('data-fog-go')){state.stage=fogPick;state.explore.seen[fogPick]=true;save();go('island');return;}
  if(t.hasAttribute('data-fog-cancel')){const id=fogPick;fogPick=null;draw();$(`[data-island="${id}"]`)?.focus();return;}
  if(t.hasAttribute('data-lighthouse')){onAssessment();return;}
  if(d.node!==undefined){nodePick=Number(d.node);draw();$('[data-node-sheet] [data-node-go]')?.focus();return;}
  if(t.hasAttribute('data-node-close')){const i=nodePick;nodePick=null;draw();$(`[data-node="${i}"]`)?.focus();return;}
  if(d.nodeGo!==undefined){enterNode(Number(d.nodeGo));return;}
  if(t.hasAttribute('data-go-world')){if(view==='island')archPick=ISLANDS.find(x=>x.id===state.stage).archipelago;return go(view==='island'?'archipelago':'world');}
  if(t.hasAttribute('data-exit-learn'))return go('island');
  if(t.hasAttribute('data-continue-screen'))return advance();
  if(t.hasAttribute('data-complete-world')){const i=ISLANDS.findIndex(x=>x.id===state.stage);if(i<ISLANDS.length-1){state.stage=ISLANDS[i+1].id;anim={type:'reveal'};}archPick=ISLANDS.find(x=>x.id===state.stage).archipelago;save();go('archipelago');return;}
  if(t.hasAttribute('data-book')){book.back=view;go('book');return;}
  if(t.hasAttribute('data-book-close'))return go(book.back);
  if(t.hasAttribute('data-guide-toggle')){prefs={name:explorer(),guide:!guideOn()};savePrefs();draw();$('[data-guide-toggle]')?.focus();return;}
  if(t.hasAttribute('data-name-skip')){prefs={name:'探險家',guide:prefs?.guide!==false};savePrefs();go(nameBack);return;}
  if(t.hasAttribute('data-rename')){nameBack='book';go('name');return;}
  if(d.compToggle){book.open=book.open===d.compToggle?null:d.compToggle;book.pick=null;draw();$(`[data-comp-toggle="${d.compToggle}"]`)?.focus();return;}
  if(d.mapCard){book.pick=d.mapCard;draw();$(`[data-map-card="${d.mapCard}"]`)?.focus();return;}
  if(d.mapGo){startReview(d.mapGo,'map');return;}
  if(t.hasAttribute('data-crumb-book')||d.crumbComp){const card=locationCard(snapshot(state));book={open:d.crumbComp||(card?COMP_OF.get(card).id:null),pick:card,back:view};go('book');return;}
  if(d.review){startReview(d.review);return;}
  if(t.hasAttribute('data-review-return')){if(history.state?.organicReview)history.back();else endReview();return;}
  if(t.hasAttribute('data-review-dismiss')){state.review=null;save();draw();}
 };
 const onPop=()=>{if(validReview(state.review))endReview();};
 root.addEventListener('click',onClick);window.addEventListener('popstate',onPop);

 function resetTeaching(){
  const panel=$('[data-path-panel]');if(!panel)return;panel.dataset.teachingPhase='question';
  const hint=$('[data-teach-hint]'),result=$('[data-teach-result]'),play=$('[data-teach-play]');
  if(hint){hint.disabled=false;hint.textContent='顯示提示';}if(result){result.disabled=false;result.textContent='揭示結果';}
  if(play)play.disabled=!panel.querySelector('[data-play]');
 }
 function teachingControls(panel){
  panel.dataset.teachingPhase='question';
  panel.querySelectorAll('.concept-quiz,[data-student-only]').forEach(n=>n.hidden=true);
  const title=panel.querySelector('h2');if(!title)return;
  const f=snapshot(state),card=locationCard(f),c=card?CARDS.get(card).card:null;
  const prompt=c?.check?.prompt||'先觀察起始結構與條件：電子從哪裡出發？哪些鍵可能改變？';
  title.insertAdjacentHTML('afterend',`<section class="teaching-controls" data-teaching-controls aria-label="教師示範控制"><p><strong>一起想一想</strong> ${esc(prompt)}</p><div><button type="button" data-teach-hint>顯示提示</button><button type="button" class="primary" data-teach-play>播放變化</button><button type="button" data-teach-result>揭示結果</button></div><small>教師示範不寫入學生作答。播放會呈現結構變化；文字答案由你揭示。</small><p class="teaching-answer" data-teacher-result>${c?.check?esc(c.check.feedback):'請對照下方結果與解說，說明電子移動的依據。'}</p></section>`);
  $('[data-teach-hint]').onclick=e=>{panel.dataset.teachingPhase='hint';e.target.disabled=true;e.target.textContent='提示已顯示';};
  $('[data-teach-result]').onclick=e=>{panel.dataset.teachingPhase='result';e.target.disabled=true;e.target.textContent='結果已揭示';$('[data-teach-hint]').disabled=true;};
  $('[data-teach-play]').onclick=()=>panel.querySelector('[data-play]')?.click();
  resetTeaching();
 }
 draw();
 return {setMode(next){
  if(next===mode)return;clear();save();
  if(next==='teacher'){studentState=state;state=copyPathLocation(studentState,teacherMemory||{...freshPath(),explore:structuredClone(studentState.explore)});}
  else{teacherMemory=state;state=copyPathLocation(state,studentState);}
  mode=next;if(view==='name')view='island';save();draw();
 },destroy({discard=false}={}){root.removeEventListener('click',onClick);window.removeEventListener('popstate',onPop);clear();onView(null);if(discard){memory=null;teacherMemory=null;}else save();}};
}
