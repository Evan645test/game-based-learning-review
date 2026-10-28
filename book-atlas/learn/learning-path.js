import {BOOK,CARBOCATION_TYPES,itemType,shiftUnlocked,JUDGE_TABLE,TABLE_REVIEW,TYPES,WARMUP,PATH_GOALS,PATH_TASKS,REVIEW_BY_TYPE,ARROW_REVIEW,STAGES,FLOW,ITEMS,stageIndex,unlockedTypes,pickItem,mastery,shuffled} from './course-path.js';
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
import {ISLANDS,FINAL_COUNT,islandNodes,nodeScreens,cardLocation,motionToggleHTML,islandBuildings,currentBuilding,walkingRoute,compareLocation} from './island-map.js';
import {comparisonHTML,mountComparison} from './comparison-view.js';
import {COMPARISONS} from './comparisons.js';
import {constellationHTML,mountConstellation} from './constellation-view.js';
import {STATION_INFO} from './stations-v4.js';
import {figureHTML,mountFigure} from './figure-view.js';
import {FIGURES} from './figures-v3.js';
import {knowledgeProgress,KNOWLEDGE_IDS,stationActivities,recordActivity} from './knowledge-model.js';
import {CARD_INTRO,mountConceptFocus,introductoryFigures,REACTION_OVERVIEWS,adjacentLessonLocation,MECHANISM_KINDS,mechanismProgress,reviewStage} from './concept-lessons.js';
import {explanationHTML,mountExplanationModels} from './lesson-models.js';

export const PATH_KEY='organic-path-v5';
const ORDER=ISLANDS.map(i=>i.id);
const freshStage=()=>({step:0,concept:0,pair:0,predictions:{},revealed:{},branches:{},arrowKind:0,arrows:{},mixed:{done:0,current:null}});
// explore: where the learner stands on each island, which landmarks are walked, and which islands were visited.
const freshExplore=()=>({pos:Object.fromEntries(ISLANDS.map(i=>[i.id,{node:0,screen:0}])),done:Object.fromEntries(ISLANDS.map(i=>[i.id,{}])),seen:{[ISLANDS[0].id]:true},buildings:1});
export const freshPath=()=>({version:5,stage:ISLANDS[0].id,explore:freshExplore(),warm:{index:0,checks:{}},stages:Object.fromEntries(STAGES.map(s=>[s.id,freshStage()])),final:{current:null},table:freshTable(),navigation:{forward:[]},drafts:{cards:{},branches:{}},conceptChecks:{},mechanisms:{index:0,phase:0,done:{},records:{}},attempts:[]});
function freshTable(){return {cells:{},checks:0,first:null};}
const plain=o=>Boolean(o&&typeof o==='object'&&!Array.isArray(o));
const validExplore=(e,current)=>plain(e)&&plain(e.pos)&&plain(e.done)&&plain(e.seen)&&ISLANDS.every(i=>plain(e.pos[i.id])&&Number.isInteger(e.pos[i.id].node)&&e.pos[i.id].node>=0&&(!current||e.pos[i.id].node<islandNodes(i.id).length)&&Number.isInteger(e.pos[i.id].screen)&&e.pos[i.id].screen>=0&&plain(e.done[i.id]));
export function validPath(s){
 if(s?.version!==5||!validExplore(s.explore,true)||!ORDER.includes(s.stage)||!plain(s.warm)||!Number.isInteger(s.warm.index)||!plain(s.stages)||!Array.isArray(s.attempts)||!plain(s.final)||(s.table!==undefined&&!plain(s.table?.cells)))return false;
 if(s.navigation!==undefined&&(!plain(s.navigation)||!Array.isArray(s.navigation.forward)||s.navigation.forward.length>1000||!s.navigation.forward.every(p=>plain(p)&&KNOWLEDGE_IDS.includes(p.island)&&Number.isInteger(p.node)&&p.node>=0&&p.node<islandNodes(p.island).length&&Number.isInteger(p.screen)&&p.screen>=0&&Boolean(nodeScreens(p.island,islandNodes(p.island)[p.node])[p.screen]))))return false;
 if(s.drafts!==undefined&&(!plain(s.drafts)||!plain(s.drafts.cards)||!plain(s.drafts.branches)))return false;
 if(s.conceptChecks!==undefined&&(!plain(s.conceptChecks)||!Object.entries(s.conceptChecks).every(([id,a])=>Boolean(REACTION_OVERVIEWS[id])&&plain(a)&&Number.isInteger(a.choice)&&a.choice>=0&&a.choice<REACTION_OVERVIEWS[id].move[1].length&&typeof a.first==='boolean')))return false;
 if(s.mechanisms!==undefined){const m=s.mechanisms;if(!plain(m)||!Number.isInteger(m.index)||m.index<0||m.index>=MECHANISM_KINDS.length||!Number.isInteger(m.phase)||m.phase<0||m.phase>2||!plain(m.done)||!plain(m.records)||!Object.entries(m.records).every(([kind,r])=>MECHANISM_KINDS.includes(kind)&&plain(r)&&validWork(kind,r.work)))return false;}
 return STAGES.every(st=>{const r=s.stages[st.id];return plain(r)&&Number.isInteger(r.step)&&r.step>=0&&r.step<=4&&Number.isInteger(r.concept)&&Number.isInteger(r.pair)&&['predictions','revealed','branches','arrows','mixed'].every(k=>plain(r[k]))&&Object.entries(r.arrows).every(([k,a])=>plain(a)&&validWork(k,a.work));})&&s.attempts.every(a=>plain(a)&&typeof a.item==='string'&&typeof a.type==='string'&&typeof a.mech==='boolean');
}
// v5 (the book map) starts everyone fresh; earlier saved paths are cleared by legacy-data.js.
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
const CARDS=new Map([...WARMUP.map((c,i)=>[c.id,{card:c,stage:c.id,at:i,prep:true}]),...STAGES.flatMap(st=>[...(st.primers||[]),...st.concepts.flatMap(c=>c.details||[])].map((p,j)=>[p.id,{card:p,stage:st.id,at:j}]))]);
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
 const a=state.warm.checks[id],c=CARDS.get(id)?.card;return a&&c?(a.choice===c.check.answer?'right':'wrong'):null;
}
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

// Station preview: the kinds of screens inside, in order, and a rough time (about a minute per screen).
const STEP_LABEL={read:'說明',figure:'圖解',demo:'概念觀察',check:'即時檢查',concept:'反應概念','concept-figure':'圖解',compare:'比較動畫',pair:'對比觀察',branch:'補流程圖',arrow:'畫箭頭',table:'判斷表'};
function stationSteps(id){
 const screens=islandNodes(id).flatMap(n=>nodeScreens(id,n)),labels=[];
 for(const sc of screens){const l=STEP_LABEL[sc.type];if(l&&labels.at(-1)!==l)labels.push(l);}
 return {steps:[...new Set(labels)],minutes:Math.max(2,Math.round(screens.length*1.2))};
}
const stationIndex=id=>ISLANDS.findIndex(i=>i.id===id);
/** The learning path: chapters in book order with their stations; finished chapters collapse unless opened. */
export function pathProgress(state,{opened={},visibleOnly=false}={}){
 if(visibleOnly)return knowledgeProgress(state);
 const w=worldProgress(state),current=w.find(i=>i.state!=='done')?.id;
 const chapters=BOOK.map(sp=>{
  const stations=sp.stations.map(st=>{const x=w.find(i=>i.id===st.id),info=STATION_INFO[st.id];
   return {id:st.id,section:st.section,hideSection:Boolean(st.early),short:info.short,title:x.full,goal:info.goal,note:info.note,...stationSteps(st.id),
    finished:x.state==='done',state:st.id===current?'current':x.flag?'review':x.state==='done'?'done':'todo'};});
  const done=stations.filter(s=>s.state==='done').length;
  return {id:sp.id,title:sp.title,chapters:sp.chapters,done,total:stations.length,collapsed:opened[sp.id]??(done===stations.length),stations};
 });
 const all=chapters.flatMap(c=>c.stations);
 return {summary:{done:all.filter(s=>s.finished).length,total:all.length,review:all.filter(s=>s.state==='review').map(s=>({id:s.id,short:s.short}))},chapters};
}
export const snapshot=state=>({stage:state.stage,pos:structuredClone(state.explore.pos)});
const screenAt=f=>{const nodes=islandNodes(f.stage),p=f.pos[f.stage],node=nodes[Math.min(p.node,nodes.length-1)],screens=nodeScreens(f.stage,node);return {node,screen:screens[Math.min(p.screen,screens.length-1)]};};
/** The check card shown at a location snapshot, or null on a non-card screen. */
export function locationCard(f){return screenAt(f).screen?.card||null;}
/** A short label for a location snapshot: island, landmark and, for card screens, the card. */
export function locationLabel(f){const {node,screen}=screenAt(f);return `${islandName(f.stage)}・${node.label}${screen?.card?`：${cardTitle(screen.card)}`:''}`;}


let memory=null,teacherMemory=null,blocked=false;
// Only navigation crosses the mode boundary. Answers and attempts never do.
export function copyPathLocation(from,to){to.stage=from.stage;to.explore.pos=structuredClone(from.explore.pos);to.navigation={forward:[]};return to;}
export function courseCompletion(state){const concepts=knowledgeProgress(state).summary,mechanisms=mechanismProgress(state);return {concepts,mechanisms,complete:concepts.done===concepts.total&&mechanisms.complete};}
export const pathSnapshot=()=>memory?structuredClone(memory):null;
export const EXPLORER_KEY='organic-explorer-v1';
/** Read legacy display names without showing them; keep the learning-hint preference compatible. */
export function readExplorer(){try{const v=JSON.parse(localStorage.getItem(EXPLORER_KEY));if(plain(v)&&(typeof v.name==='string'||typeof v.guide==='boolean'))return {...(typeof v.name==='string'?{name:v.name.trim().slice(0,10)||'探險家'}:{}),guide:v.guide!==false};}catch{}return null;}
// Guide lines are fixed sentence templates; chemistry wording only ever comes from the checked course text.
const LINES={compare:'同一組受質和試劑，兩條路一起播。看看輸的那條路卡在哪裡！',table:'把學過的線索整理成一張表！每格選出反應類型。',tableWrong:'紅框的格子看看提示，改完再檢查一次。',tableRight:'整張表都對了！你已經能自己判斷這四種反應。',read:'我們先讀這段，等一下會用到！',figure:'看這張圖，對照剛才讀到的重點。',demo:'拖曳轉一轉；播放時注意電子從哪裡出發。',check:'換你判斷！選好再按「檢查」。',checkRight:'答對了！我們往下走。',checkWrong:'差一點！看看下面的提示，也可以先回看再回來。',concept:'先閱讀本小節的反應重點，再觀察結構與電子的變化。',conceptFigure:'用這張圖比一比，看出差別在哪裡。',pair:'先猜甲、乙各是哪一種反應，再揭曉。',pairShown:'對照反應角色、條件與產物，比一比差在哪裡。',branch:'把剛學到的判斷補進流程圖。',branchDone:'補好了！流程圖又長大一點。',branchWrong:'還不對，再對照剛才的對比想一想。',arrow:'先畫完每一步再檢查；箭頭要從電子出發。',arrowRight:'電子都走對了！',arrowWrong:'有一步要修，照提示找找看。',item:'這題是哪一種反應？先看受質、試劑和條件。',itemRight:'全對！這種反應你抓到訣竅了。',itemWrong:'沒關係，看看哪裡想錯了，也可以先回看。'};

export function mountLearningPath(root,{onNotice=()=>{},onAssessment=()=>{},loadView=()=>null,saveView=()=>{},onView=()=>{},mode='student'}={}){
 let state=memory||freshPath(),children=[],request=null,timers=[],walkRequest=null;
 let skyModel=null,mapShown=false,returningFromCourse=false;
 try{if(!memory){const raw=localStorage.getItem(PATH_KEY);if(raw){const v=JSON.parse(raw);if(!validPath(v))throw new Error();state=v;}}}catch{blocked=true;onNotice('學習進度無法讀取，本頁暫以記憶體保存。');}
 upgradeBuildingVisits(state);
 state.navigation||={forward:[]};
 state.drafts||={cards:{},branches:{}};state.conceptChecks||={};state.mechanisms||={index:0,phase:0,done:{},records:{}};
 let studentState=state;
 if(mode==='teacher')state=teacherMemory||copyPathLocation(studentState,{...freshPath(),explore:structuredClone(studentState.explore)});
 memory=studentState;
 // A reload resumes the last map or learning screen.
 let prefs=readExplorer(),view=['map','learn','mechanisms'].includes(state.explore.at)?state.explore.at:'map',anim=null,nodePick=null,fogPick=null,book={open:null,pick:null,back:'map'},gate=null;
 const readView=id=>mode==='teacher'?null:loadView(id),writeView=(id,value)=>{if(mode==='student')saveView(id,value);};
 const save=()=>{if(mode==='teacher'){teacherMemory=state;return;}memory=state;if(blocked)return;try{localStorage.setItem(PATH_KEY,JSON.stringify(state));}catch{blocked=true;onNotice('學習進度暫存於本頁，重新整理後可能無法保留。');}};
 // Resume a legacy final-table session on the map without removing its saved answers or position.
 if(state.stage==='final'){state.stage=knowledgeProgress(state).active;state.explore.at='map';view='map';save();}
 const savePrefs=()=>{try{localStorage.setItem(EXPLORER_KEY,JSON.stringify(prefs));}catch{}};
 const $=s=>root.querySelector(s),clear=()=>{if(walkRequest!==null){cancelAnimationFrame(walkRequest);walkRequest=null;}children.forEach(c=>c.destroy());children=[];request?.abort();request=null;timers.forEach(clearTimeout);timers=[];};
 const guideOn=()=>prefs?prefs.guide!==false:true;
 const later=(fn,ms)=>timers.push(setTimeout(fn,ms));
 const motion=()=>document.body.dataset.artMotion!=='paused'&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
 const radios=(name,list,checked)=>list.map(({v,i},n)=>`<label class="choice"><input type="radio" name="${name}" value="${i}" ${checked===i?'checked':''}><span>${esc(v)}</span></label>`).join('');

 // Review detour: snapshot every location and the view, jump to the card, and come back (also with the browser Back button).
 const where=()=>({...snapshot(state),view,forward:structuredClone(state.navigation.forward)});
 const reviewLinks=ids=>ids?.length?`<p class="review-links" data-review-links><span>建議回看：</span>${ids.map(id=>`<button type="button" class="tree-chip${CARDS.get(id).prep?'':' primer'}" data-review="${id}">${esc(cardTitle(id))}</button>`).join('')}</p>`:'';
 // Clue cards open with what they help decide; reaction concepts list clues as 看到 → 偏向 → 回看 instead of re-explaining them.
 const judgeLine=c=>c.judge?`<p class="judge-line" data-judge-line><span class="judge-tag">${esc(c.cue==='產物'?'產物細節':c.cue?`線索：${c.cue}`:'判斷準備')}</span>${esc(c.judge)}</p>`:'';
 const cueList=c=>c.cues?.length?`<ul class="cue-list" data-cue-list aria-label="判斷線索">${c.cues.map(q=>`<li><span class="cue-see">${esc(q.see)}</span><span class="cue-arrow" aria-hidden="true">→</span><span class="cue-lean">${esc(q.lean)}</span>${q.review.map(id=>{const ahead=stationIndex(cardLocation(id).island)>stationIndex(state.stage);return `<button type="button" class="tree-chip${CARDS.get(id).prep?'':' primer'}" data-review="${id}">${ahead?'下一節預告：':'回看'}${esc(cardTitle(id))}</button>`;}).join('')}</li>`).join('')}</ul>`:'';
 // via: 'map' for jumps from the explorer's handbook, 'review' for links after a wrong answer.
 function startReview(id,via='review'){
  const loc=cardLocation(id)||compareLocation(id);if(!loc)return;
  // Only the first jump of a detour adds a history entry, so one Back (or one return button) always lands on the source.
  const fresh=!validReview(state.review);if(fresh)state.review={from:where(),via};
  state.navigation.forward=[];state.stage=loc.island;state.explore.pos[loc.island]={node:loc.node,screen:loc.screen};state.explore.seen[loc.island]=true;view='learn';
  save();if(fresh)try{history.pushState({organicReview:true},'');}catch{}draw(true);
 }
 function endReview(){
  const f=validReview(state.review)?state.review.from:null;state.review=null;
  if(f){state.stage=f.stage;state.explore.pos=structuredClone(f.pos);view=['learn','mechanisms'].includes(f.view)?f.view:'map';state.navigation.forward=structuredClone(f.forward||[]);}
  save();draw(true);
 }
 function detourBar(){
  if(!validReview(state.review))return '';
  const from=state.review.from.view==='mechanisms'?'機構複習':locationLabel(state.review.from),card=view==='learn'?locationCard(snapshot(state)):null;
  const crumbs=[`<li>回看</li>`,`<li aria-current="page">${esc(card?cardTitle(card):locationLabel(snapshot(state)))}</li>`];
  return `<div class="location-bar detour" data-location-bar data-review-banner role="region" aria-label="跳轉來源與返回"><p><strong>回看中</strong></p><button type="button" data-review-dismiss>留在這裡</button><button type="button" class="primary" data-review-return>回到 ${esc(from)}</button></div><nav class="breadcrumb" aria-label="目前所在"><ol>${crumbs.join('')}</ol></nav>`;
 }
 const guideRow=(text,live=false)=>guideOn()?`<div class="explore-guide learning-hint" data-guide><p class="explore-bubble" data-guide-line ${live?'aria-live="polite"':''}><strong>學習提示：</strong><span>${esc(text)}</span></p></div>`:'';
 const say=text=>{const s=$('[data-guide-line] span');if(s)s.textContent=text;};
 const topBar=(left,title,right='')=>`<div class="explore-bar">${left}<h1 tabindex="-1">${title}</h1>${right}</div>`;
 const guideToggle=()=>`<button type="button" data-guide-toggle aria-pressed="${guideOn()}">${guideOn()?'學習提示：開':'學習提示：關'}</button>${motionToggleHTML()}`;

 function mapView(){
  skyModel=knowledgeProgress(state);
  return `${detourBar()}${topBar('','知識星圖',`<span class="explore-tools">${guideToggle()}</span>`)}${completionHTML()}${constellationHTML(skyModel)}`;
 }
 function completionHTML(){
  const p=courseCompletion(state),m=p.mechanisms;
  return `<section class="course-completion" data-course-status aria-label="整套課程進度"><div><strong>${p.complete?'整套課程已完成':'整套課程尚未完成'}</strong><p>概念小節 ${p.concepts.done}／${p.concepts.total} · 最後必修：機構複習 ${m.done}／${m.total}</p><small>${m.ready?'把電子移動串成完整機構；全部概念小節與機構複習完成後，才算結束全課。':'先完成 SN2、SN1、E2、E1 小節，再進入完整機構複習。'}</small></div><button type="button" data-mechanisms-open ${m.ready?'':'disabled'}>${m.complete?'回看機構複習':'進入機構複習'}</button></section>`;
 }
 function mechanismView(){
  const m=state.mechanisms,kind=MECHANISM_KINDS[m.index],label=TYPES[kind].label,total=MECHANISM_KINDS.length;
  return `<details class="mechanism-picker"><summary>選擇複習機構</summary><div>${MECHANISM_KINDS.map((k,i)=>`<button type="button" data-mechanism-pick="${i}" aria-pressed="${i===m.index}">${mechanismProgress(state).completed.includes(k)?'✓ ':''}${esc(TYPES[k].label)}</button>`).join('')}</div></details><div class="learn-top"><button type="button" class="learn-exit" data-exit-learn aria-label="回到星圖">✕</button><p>最後必修 · 機構複習 ${m.index+1}／${total}</p></div><h1>把概念串成完整機構：${esc(label)}</h1><nav class="mechanism-tabs" aria-label="複習階段">${['先抓重點','觀察完整機構','自己畫並檢查'].map((t,i)=>`<span ${m.phase===i?'aria-current="step"':''}>${i+1} ${t}</span>`).join('')}</nav><article class="guide-panel learn-panel" data-path-panel></article><div class="learn-next"><p class="learn-gate" data-learn-gate role="status" hidden></p><div class="lesson-navigation"><button type="button" data-previous-screen ${m.index===0&&m.phase===0?'disabled':''}>上一步</button><button type="button" class="primary" data-continue-screen>${m.phase===2?'完成這個機構':'繼續'}</button></div></div>`;
 }
 function learnView(){
  const isl=state.stage,nodes=islandNodes(isl),pos=state.explore.pos[isl],node=nodes[Math.min(pos.node,nodes.length-1)],screens=nodeScreens(isl,node),i=Math.min(pos.screen,screens.length-1);
  const building=islandBuildings(isl)[currentBuilding(isl,pos)],final=node.kind==='final',total=final?FINAL_COUNT:building.end-building.screen+1,cur=final?Math.min(finalCount()+1,FINAL_COUNT):i-building.screen+1,last=!final&&i===building.end;
  return `${detourBar()}<div class="learn-top"><button type="button" class="learn-exit" data-exit-learn aria-label="回到星圖">✕</button><div class="learn-progress" role="progressbar" aria-label="這個活動的進度" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${cur}"><i style="width:${Math.round(cur/total*100)}%"></i></div><span class="learn-count">${cur}／${total}</span></div><p class="learn-where">${esc(ISLANDS.find(x=>x.id===isl).full)}・${esc(building.short)}</p>${guideRow('',true)}<article class="guide-panel learn-panel" data-path-panel></article><div class="learn-next"><p class="learn-gate" data-learn-gate role="status" hidden></p><div class="lesson-navigation"><button type="button" data-previous-screen ${adjacentLessonLocation(isl,pos,-1)?'':'disabled'}>上一步</button><button type="button" class="primary" data-continue-screen>${final?'下一題':last?'完成這個活動':'繼續'}</button></div></div>`;
 }
 const finalCount=()=>state.attempts.filter(a=>a.stage==='final').length;

 function draw(focus=false){
  clear();gate=null;onView(view);
  if(['map','learn','mechanisms'].includes(view)&&state.explore.at!==view){state.explore.at=view;save();}
  const html={map:mapView,learn:learnView,mechanisms:mechanismView}[view]();
  root.innerHTML=`<section class="guided-lesson learning-path explore" data-learning-path data-stage="${state.stage}" data-view="${view}" data-arrival="${anim?.type==='reveal'?'reveal':'none'}">${html}</section>`;
  if(view==='learn')renderScreen();
  if(view==='mechanisms')renderMechanism();
  if(view==='map'){
   const stop=mountConstellation(root,skyModel,{loadViewport:()=>state.explore.sky||null,
    saveViewport:camera=>{state.explore.sky=camera;save();},onNotice,
    returning:mapShown||returningFromCourse});
   mapShown=true;returningFromCourse=false;children.push({destroy:stop});
  }
  if(mode==='teacher'&&['learn','mechanisms'].includes(view))teachingControls($('[data-path-panel]'));
  if(anim?.type==='walk'){anim=null;later(()=>say('到了！點這一節就能開始。'),motion()?600:0);}
  else if(anim?.type==='reveal')anim=null;
  if(focus){root.querySelector('h1,h2')?.focus({preventScroll:true});root.scrollIntoView({block:'start',behavior:'instant'});}
 }
 const go=v=>{state.navigation.forward=[];if(v==='map'&&view==='learn')returningFromCourse=true;view=v;nodePick=null;fogPick=null;draw(true);};
 function enterNode(i){
  const isl=state.stage,pos=state.explore.pos[isl],building=islandBuildings(isl)[i];if(!building)return;
  const node=islandNodes(isl)[building.node],done=buildingProgress(state,isl)[i].state==='done';
  if(pos.node!==building.node||pos.screen<building.screen||pos.screen>building.end||done){pos.node=building.node;pos.screen=building.screen;}
  if(node.kind==='mixed'){const m=state.stages[isl].mixed;if(done){m.done=0;m.current=null;}pos.screen=Math.min(m.done,nodeScreens(isl,node).length-1);}
  state.explore.seen[isl]=true;save();go('learn');
 }
 function enterStation(id){
  if(!KNOWLEDGE_IDS.includes(id))return;
  state.stage=id;state.explore.seen[id]=true;
  const p=buildingProgress(state,id),i=p.findIndex(b=>b.state!=='done');enterNode(i<0?0:i);
 }
 function finishNode(){
  const isl=state.stage,pos=state.explore.pos[isl],from=currentBuilding(isl,pos),building=islandBuildings(isl)[from];
  // A jump to the last activity must not complete the unread parts of its group.
  const missing=stationActivities(state,isl).find(task=>task.building===building.id&&!task.done);
  if(missing){pos.node=missing.node;pos.screen=missing.screen;save();go('learn');return;}
  // The judgment table never blocks the way on, but it only counts as walked once all cells are right.
  const next=building.kind==='table'&&!tableSolved(state)?-1:completeBuilding(state,isl,from);
  const following=adjacentLessonLocation(isl,pos,1);
  if(following?.island===isl){pos.node=following.node;pos.screen=following.screen;save();go('learn');return;}
  pos.screen=0;const i=KNOWLEDGE_IDS.indexOf(isl);if(i>=0&&i<KNOWLEDGE_IDS.length-1){state.stage=KNOWLEDGE_IDS[i+1];}anim={type:'walk'};save();go('map');
 }
 function previous(){
  if(view==='mechanisms'){const m=state.mechanisms;if(m.phase>0)m.phase--;else if(m.index>0){m.index--;m.phase=2;}else return;save();draw(true);return;}
  const p=adjacentLessonLocation(state.stage,state.explore.pos[state.stage],-1);if(!p)return;
  state.navigation.forward.push({island:state.stage,...state.explore.pos[state.stage]});
  state.stage=p.island;state.explore.pos[p.island]={node:p.node,screen:p.screen};state.explore.seen[p.island]=true;save();draw(true);
 }
 function advance(){
  if(view==='learn'&&state.navigation.forward.length){const p=state.navigation.forward.pop();state.stage=p.island;state.explore.pos[p.island]={node:p.node,screen:p.screen};save();draw(true);return;}
  const ok=gate?.()??true;
  if(ok!==true&&mode==='student'){const g=$('[data-learn-gate]');g.hidden=false;g.textContent=ok;return;}
  if(view==='mechanisms'){const m=state.mechanisms;if(m.phase<2){m.phase++;save();draw(true);return;}m.done[MECHANISM_KINDS[m.index]]=true;if(m.index<MECHANISM_KINDS.length-1){m.index++;m.phase=0;save();draw(true);}else{save();go('map');}return;}
  const isl=state.stage,nodes=islandNodes(isl),pos=state.explore.pos[isl],node=nodes[pos.node],screens=nodeScreens(isl,node);
  recordActivity(state,isl,pos.node,pos.screen);
  if(node.kind==='final'){state.final.current=null;if(finalCount()>=FINAL_COUNT)state.explore.done.final.final=true;save();draw(true);return;}
  if(node.kind==='mixed'){const m=state.stages[isl].mixed;m.done++;m.current=null;}
  const b=islandBuildings(isl)[currentBuilding(isl,pos)],scr=screens[pos.screen];
  if(pos.screen<b.end){pos.screen++;save();draw(true);return;}
  finishNode();
 }

 // --- One screen at a time inside a landmark.
 function renderScreen(){
  const panel=$('[data-path-panel]'),isl=state.stage,nodes=islandNodes(isl),pos=state.explore.pos[isl],node=nodes[pos.node],screens=nodeScreens(isl,node),scr=screens[Math.min(pos.screen,screens.length-1)],st=STAGES.find(s=>s.id===isl),r=st&&state.stages[st.id];
  const head=(tag,title)=>`<p class="course-part">${esc(tag)}</p><h2 tabindex="-1">${esc(title)}</h2>`;
  if(scr.card){
   const c=CARDS.get(scr.card).card,tag=`${node.label}${scr.concept!==undefined?' · 產物細節':''}${c.optional?'（選讀）':''}`;
   if(scr.type==='read'){panel.dataset.modelLesson='true';panel.innerHTML=`${head(tag,c.title)}${judgeLine(c)}${explanationHTML(CARD_INTRO[c.id]||c.body[0],{id:c.id,index:0})}${c.body.length>1?`<details class="concept-more" data-model-disclosure><summary>再看細節與例外</summary>${c.body.slice(1).map((p,i)=>({text:p,index:i+1})).filter(p=>!p.text.includes('下方動畫預覽親核取代')&&!p.text.includes('為了看下方預覽')).map(p=>explanationHTML(p.text,{id:c.id,index:p.index})).join('')}</details>`:''}<details class="concept-example model-example" data-model-disclosure data-teacher-result><summary>用一個例子對照</summary>${explanationHTML(c.example,{id:c.id,example:true,phase:'result'})}</details><details class="learning-sources"><summary>原文來源</summary>${sourceLinks(c.pages)}</details>`;children.push(mountExplanationModels(panel));say('對照文字與旁邊模型；可切換靜電位圖與鍵結／空間模型，觀察本段標出的部位。');}
   else if(scr.type==='figure'){const figs=introductoryFigures(c.id,[].concat(FIGURES[c.id]||[]));panel.innerHTML=`${head(tag+' · 圖解',c.title)}${figs.map((f,k)=>c.id==='reactions'?`<details class="concept-more" name="reaction-types" ${k===0?'open':''}><summary>${esc(f.title)}</summary><div class="concept-figure" data-figure-host="${k}">${figureHTML(f)}</div></details>`:`<div class="concept-figure" data-figure-host="${k}">${figureHTML(f)}</div>`).join('')}${c.visual?'<div class="concept-visual guide-concept" data-path-visual></div>':''}${c.widget?'<div class="concept-widget" data-cation-host></div>':''}`;figs.forEach((f,k)=>{const stop=mountFigure($(`[data-figure-host="${k}"]`),f);children.push({destroy:stop});});if(c.visual)mountVisual($('[data-path-visual]'),c.visual);mountWidget(c);say(LINES.figure);}
   else if(scr.type==='demo'){panel.innerHTML=`${head(tag+' · 概念觀察',c.title)}<div data-concept-player></div>`;children.push(mountConceptFocus($('[data-concept-player]'),{id:c.id,initial:readView('focus:'+c.id)?.frame,onChange:frame=>writeView('focus:'+c.id,{frame})}));say('先辨認角色或位置，再觀察這一個概念的變化。');}
   else{panel.innerHTML=`${head(tag+' · 即時檢查',c.title)}${checkForm(c)}`;bindCheck(c);const a=state.warm.checks[c.id];say(a?(a.choice===c.check.answer?LINES.checkRight:LINES.checkWrong):LINES.check);gate=()=>state.warm.checks[c.id]?true:'先選一個答案，按「檢查」後再繼續。';}
   return;
  }
  if(scr.type==='concept'||scr.type==='concept-figure'){
   const c=st.concepts[scr.index];
   if(scr.type==='concept'){const overview=REACTION_OVERVIEWS[st.id],kind=st.arrowKinds[0];panel.dataset.modelLesson='true';panel.innerHTML=`${head(`概念 ${scr.index+1}／${st.concepts.length}`,c.title)}<section data-reaction-overview>${explanationHTML(scr.index===0?overview.focus:c.body[0],{reactionKind:kind,index:scr.index})}<details class="concept-more" data-model-disclosure><summary>判斷時再看</summary>${explanationHTML(overview.why,{reactionKind:kind,index:100+scr.index})}${cueList(c)}</details><details class="concept-example model-example" data-model-disclosure data-teacher-result><summary>用一個例子對照</summary>${explanationHTML(c.example,{reactionKind:kind,example:true,phase:'result'})}</details><p class="teacher-note">完整多步機構集中在最後的必修複習區。</p></section><details class="learning-sources"><summary>原文來源</summary>${sourceLinks(c.pages)}</details>`;children.push(mountExplanationModels(panel));say('先從結構與靜電位配色辨認角色，再對照反應前後改變了什麼。');}
   else{panel.innerHTML=`${head(`概念 ${scr.index+1} · 圖解`,c.title)}<div class="concept-widget" data-cation-host></div>`;mountWidget(c);say(LINES.conceptFigure);}
   return;
  }
  if(scr.type==='compare'){const c=COMPARISONS.find(c=>c.id===scr.id);panel.innerHTML=`${head('路徑比較',c.title)}<section data-comparison="${esc(c.id)}">${c.why.map(t=>`<p>${esc(t.replaceAll('右圖','另一條路徑').replaceAll('左圖','這條路徑'))}</p>`).join('')}<p class="teacher-note">兩條路徑的同步動畫留到機構複習時再展開。</p></section>`;say('先比較受質、試劑與條件帶來的差異。');return;}
  if(scr.type==='table'){judgeTable(panel);return;}
  if(scr.type==='pair'){r.pair=scr.index;contrast(panel,st,r);return;}
  if(scr.type==='branch'){branches(panel,st,r,scr.index);return;}
  if(scr.type==='arrow'){r.arrowKind=scr.index;arrows(panel,st,r);return;}
  if(scr.type==='item'){practiceItem(panel,{types:unlockedTypes(st.id),slot:r.mixed,stageId:st.id,progress:`混合練習 ${scr.index+1}／${st.mixCount}　·　題型：${unlockedTypes(st.id).map(t=>TYPES[t].label).join('、')}`});return;}
  finalPractice(panel);
 }
 const checkForm=c=>{const answered=state.warm.checks[c.id];return `<form class="concept-quiz" data-warm-check><fieldset><legend>即時檢查：${esc(c.check.prompt)}</legend>${radios('warm',shuffled(c.check.options,c.id),state.drafts.cards[c.id]??answered?.choice)}</fieldset><button type="submit">檢查</button><p class="feedback-box" data-warm-feedback role="status" ${answered?'':'hidden'}>${answered?esc((answered.choice===c.check.answer?'正確。':'再想想。')+c.check.feedback):''}</p><div data-check-review>${answered&&answered.choice!==c.check.answer?reviewLinks(c.review):''}</div></form><p class="teacher-note">不計分，只幫你確認有沒有讀懂。</p>`;};
 // Warm-up and entry-primer checks share state.warm.checks, keyed by card id.
 const bindCheck=c=>{const form=$('[data-warm-check]');form.onchange=()=>{const v=new FormData(form).get('warm');if(v!==null){state.drafts.cards[c.id]=Number(v);save();}};form.onsubmit=e=>{e.preventDefault();const v=new FormData(e.target).get('warm');if(v===null)return;const choice=Number(v),right=choice===c.check.answer,first=state.warm.checks[c.id]?.first??right;state.warm.checks[c.id]={choice,first};delete state.drafts.cards[c.id];save();const box=$('[data-warm-feedback]');box.hidden=false;box.textContent=(right?'正確。':'再想想。')+c.check.feedback;$('[data-check-review]').innerHTML=right?'':reviewLinks(c.review);$('[data-learn-gate]').hidden=true;say(right?LINES.checkRight:LINES.checkWrong);};};
 // A reaction's representative example: the first example of its mechanism kind.
 const conceptExample=st=>{const kind=st.newTypes[0]||st.arrowKinds[0],example=REACTION_EXAMPLES[kind]?.[0];return example?{kind,example}:null;};

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
  panel.innerHTML=`<p class="course-part">對比 ${k+1}／${st.pairs.length}</p><h2 tabindex="-1">先預測，再比較結果</h2><p class="guide-bridge">${esc(pair.diff)}</p><div class="contrast-pair">${cards.map((c,j)=>`<section class="contrast-card${revealed&&mode==='student'?(pred[j]===c.answer?' right':' wrong'):''}" data-contrast-card="${j}"><h3>${j?'乙':'甲'}：${esc(c.example.substrate)}</h3><p><strong>試劑：</strong>${esc(c.example.reagent)}</p><p><strong>條件：</strong>${esc(c.example.conditions)}</p><label data-student-only>我預測<select data-predict="${j}" ${revealed?'disabled':''}><option value="">選擇反應類型</option>${types.map(t=>`<option value="${t}" ${pred[j]===t?'selected':''}>${esc(TYPES[t].label)}</option>`).join('')}</select></label>${revealed?`<p class="contrast-answer" data-teacher-result>答案：<strong>${esc(TYPES[c.answer].label)}${c.kind==='rearrangement'?'（經碳陽離子重排）':''}</strong>${mode==='teacher'?'':pred[j]===c.answer?'（你預測對了）':`（你預測 ${esc(TYPES[pred[j]]?.label||'—')}）`}</p><p data-teacher-result>${esc(c.example.note)}</p><p class="teacher-note" data-teacher-result>產物：${esc(c.example.product)}</p>`:''}</section>`).join('')}</div>${revealed?'<p class="teacher-note">先比較反應角色與產物；完整動畫集中在最後的機構複習。</p>':'<p class="teacher-note">兩張卡片都選好才揭曉；預測不計分，但會保留第一次的判斷。</p>'}${revealed?'':`<div class="guide-actions"><button type="button" class="primary" data-reveal ${pred[0]&&pred[1]?'':'disabled'}>揭曉答案</button></div>`}<details class="learning-sources"><summary>原文來源</summary>${sourceLinks([...new Set(cards.flatMap(c=>c.example.pages))])}</details>`;
  root.querySelectorAll('[data-predict]').forEach(s=>s.onchange=()=>{(r.predictions[key]||={})[s.dataset.predict]=s.value;save();const p=r.predictions[key];const b=$('[data-reveal]');if(b)b.disabled=!(p[0]&&p[1]);});
  $('[data-reveal]')?.addEventListener('click',()=>{r.revealed[key]=true;save();draw();});

  say(revealed?LINES.pairShown:LINES.pair);gate=()=>r.revealed[key]?true:'兩張卡片都預測後，先按「揭曉答案」。';
 }
 function branches(panel,st,r,k){
  const tasks=st.branches,t=tasks[k],rec=r.branches[k],pending=tasks.flatMap((x,i)=>r.branches[i]?.done?[]:x.ids);
  panel.innerHTML=`<p class="course-part">流程圖 ${k+1}／${tasks.length}</p><h2 tabindex="-1">把新學到的判斷補進流程圖</h2><p>流程圖會隨每個階段長出新分支。${rec?.done?'這條分支補好了。':'選出最合適的分支內容，補上虛線框。'}</p><details class="concept-more"><summary>查看目前的流程圖</summary>${flowHTML(st.id,{pending})}</details>${rec?.done?'':`<form data-branch-form><fieldset><legend>${esc(t.prompt)}</legend>${radios('branch',shuffled(t.options,st.id+k),state.drafts.branches[st.id+':'+k]??rec?.choice)}</fieldset><button type="submit">補上這條分支</button><p class="feedback-box" data-branch-feedback role="status" hidden></p><div data-branch-review></div></form>`}`;
  const form=$('[data-branch-form]');if(form)form.onchange=()=>{const v=new FormData(form).get('branch');if(v!==null){state.drafts.branches[st.id+':'+k]=Number(v);save();}};
  $('[data-branch-form]')?.addEventListener('submit',e=>{e.preventDefault();const v=new FormData(e.target).get('branch');if(v===null)return;const choice=Number(v),rec=r.branches[k]||={tries:0};delete state.drafts.branches[st.id+':'+k];rec.tries++;rec.choice=choice;rec.first??=choice===t.answer;const box=$('[data-branch-feedback]');box.hidden=false;if(choice===t.answer){rec.done=true;save();draw();}else{save();box.textContent='還不對：'+t.feedback;$('[data-branch-review]').innerHTML=reviewLinks(st.needs);say(LINES.branchWrong);}});
  say(rec?.done?LINES.branchDone:LINES.branch);gate=()=>r.branches[k]?.tries>0?true:'先提交一次判斷並閱讀回饋，再繼續。';
 }
 function gradedPanel(host,{kind,spec=null,record,onFirst=()=>{},persist}){
  // record: {work, first, hints, level}
  if(!validWork(kind,record.work))record.work=newMechanism(kind);
  host.innerHTML=`<div data-graded-editor></div><div class="course-actions"><button type="button" data-graded-check>檢查箭頭</button><button type="button" data-graded-more hidden>再給更明確的提示</button><button type="button" data-graded-ai hidden>請本機 AI 換句話說</button></div><p class="feedback-box" data-graded-feedback role="status" hidden></p><div data-graded-review></div>`;
  const q=s=>host.querySelector(s),editor=mountArrowEditor(q('[data-graded-editor]'),{kind,work:record.work,graded:true,spec,allowAI:false,revealProducts:true,onChange:w=>{record.work=w;record.level=0;record.lastCorrect=false;const feedback=q('[data-graded-feedback]');if(feedback)feedback.hidden=true;persist();}});
  const show=(h)=>{const box=q('[data-graded-feedback]');box.hidden=false;box.classList.toggle('correct',h.ok);box.textContent=h.text;q('[data-graded-more]').hidden=h.ok||h.level>=2;q('[data-graded-ai]').hidden=h.ok||h.level<2;q('[data-graded-review]').innerHTML=h.ok?'':reviewLinks(ARROW_REVIEW);say(h.ok?LINES.arrowRight:LINES.arrowWrong);$('[data-learn-gate]').hidden=true;};
  if(record.level>0)show(gradedHint(kind,record.work,record.level,spec));
  q('[data-graded-check]').onclick=()=>{if(record.first===null||record.first===undefined){record.first=firstArrowResult(kind,record.work);onFirst(record.first);}record.level=1;const h=gradedHint(kind,record.work,1,spec);record.lastCorrect=h.ok;if(!h.ok)record.hints=(record.hints||0)+1;persist();show(h);};
  q('[data-graded-more]').onclick=()=>{record.level=2;record.hints=(record.hints||0)+1;persist();show(gradedHint(kind,record.work,2,spec));};
  q('[data-graded-ai]').onclick=async()=>{const b=q('[data-graded-ai]'),box=q('[data-graded-feedback]');b.disabled=true;request?.abort();request=new AbortController();const timer=setTimeout(()=>request?.abort(),50000);box.textContent='正在取得核對過的提示…';try{box.textContent=await aiArrowHint(kind,record.work,request.signal);}catch{box.textContent=gradedHint(kind,record.work,2,spec).text+'（本機 AI 未連接，以上為內建提示）';}finally{clearTimeout(timer);b.disabled=false;}};
  return editor;
 }
 function arrows(panel,st,r){
  const q=REACTION_OVERVIEWS[st.id].move,key=st.id,rec=state.conceptChecks[key],draft=state.drafts.branches['electron:'+key];
  panel.innerHTML=`<p class="course-part">只判斷這一次電子移動</p><h2 tabindex="-1">${esc(q[0])}</h2><form data-concept-check><fieldset><legend>選出電子的來源或去向</legend>${radios('concept-choice',shuffled(q[1],key),draft??rec?.choice)}</fieldset><button type="submit">檢查這個概念</button></form><p class="feedback-box" data-concept-feedback role="status" ${rec?'':'hidden'}>${rec?esc((rec.choice===q[2]?'正確。':'再想想。')+q[3]):''}</p><p class="teacher-note">完整多步箭頭練習集中在最後必修的機構複習；先前的機構作答紀錄保留。</p>`;
  const form=$('[data-concept-check]');form.onchange=()=>{const v=new FormData(form).get('concept-choice');if(v!==null){state.drafts.branches['electron:'+key]=Number(v);save();}};
  form.onsubmit=e=>{e.preventDefault();const v=new FormData(form).get('concept-choice');if(v===null)return;state.conceptChecks[key]={choice:Number(v),first:rec?.first??(Number(v)===q[2])};delete state.drafts.branches['electron:'+key];save();draw();};
  gate=()=>state.conceptChecks[key]?true:'先提交這個概念的判斷，再繼續。';say('先判斷一對電子的來源或去向，不必一次處理整個機構。');
 }
 function renderMechanism(){
  const m=state.mechanisms,kind=MECHANISM_KINDS[m.index],st=reviewStage(kind),panel=$('[data-path-panel]');
  if(m.phase===0){panel.innerHTML=`<p class="course-part">先抓重點</p><h2 tabindex="-1">${esc(st.short)}：把前面學過的概念接起來</h2>${st.concepts.map(c=>`<section class="mechanism-reading"><h3>${esc(c.title)}</h3>${c.body.map((t,index)=>explanationHTML(t,{reactionKind:kind,index:200+index})).join('')}</section>`).join('')}<p class="teacher-note">接著觀察完整機構，最後自己畫完並檢查；九種機構都是必修。</p>`;panel.dataset.modelLesson='true';children.push(mountExplanationModels(panel));return;}
  if(m.phase===1){
   const examples=REACTION_EXAMPLES[kind],selected=examples.find(e=>e.id===m.example)||examples[0];
   panel.innerHTML=`<h2 tabindex="-1">觀察完整機構：${esc(TYPES[kind].label)}</h2><label class="review-example">比較其他例子<select data-review-example>${examples.map(e=>`<option value="${esc(e.id)}" ${e.id===selected.id?'selected':''}>${esc(e.substrate)} · ${esc(e.reagent)}</option>`).join('')}</select></label><div data-review-player></div><p class="teacher-note">播放器的「上一段」只控制動畫；頁面下方「上一步」返回學習畫面。</p>${st.compare?.length?`<details class="concept-more" data-review-comparisons><summary>展開路徑比較動畫</summary><div data-review-comparison-host></div></details>`:''}<details class="concept-more"><summary>回看本節的對比資料</summary>${st.pairs.map(p=>`<p>${esc(p.diff)}</p>`).join('')}</details>`;
   children.push(mountSpotlight($('[data-review-player]'),{kind,specOverride:exampleSpec(kind,selected),initialState:readView(selected.id)||readView('concept:'+st.id),onStateChange:v=>writeView(selected.id,v)}));
   $('[data-review-example]').onchange=e=>{m.example=e.target.value;save();draw();};
   const comparisons=$('[data-review-comparisons]');if(comparisons){let mounted=false;comparisons.ontoggle=()=>{if(!comparisons.open||mounted)return;mounted=true;const host=$('[data-review-comparison-host]');host.innerHTML=st.compare.map(id=>comparisonHTML(id)).join('');for(const el of host.querySelectorAll('[data-comparison]'))children.push({destroy:mountComparison(el)});};}return;
  }
  const old=state.stages[st.id].arrows[kind];
  const rec=m.records[kind]||={work:validWork(kind,old?.work)?structuredClone(old.work):newMechanism(kind),first:null,hints:0,level:0};
  panel.innerHTML=`<h2 tabindex="-1">自己畫出完整機構：${esc(TYPES[kind].label)}</h2><p>請以這頁的結構與原子標籤為準，逐步畫出並保存，再按「檢查箭頭」。全部步驟正確後，才能完成這個必修機構；第一次檢查的結果會保留。</p><div data-graded-host></div>`;
  children.push(gradedPanel($('[data-graded-host]'),{kind,record:rec,persist:save}));
  gate=()=>rec.lastCorrect===true&&firstArrowResult(kind,rec.work)?true:'請完成並保存所有步驟，再檢查到全部正確，才能完成這個機構。';
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
  if(d.taskGo){
   const task=stationActivities(state,d.taskGo).find(task=>task.id===d.taskId);if(!task)return;
   state.stage=d.taskGo;state.explore.seen[d.taskGo]=true;
   state.explore.pos[d.taskGo]={node:task.node,screen:task.screen};save();go('learn');return;
  }
  if(d.stationGo){enterStation(d.stationGo);return;}
  // Opening previews, collapsing chapters and the review list are handled inside the path component (mountPath).
  if(t.hasAttribute('data-lighthouse')){onAssessment();return;}
  if(d.node!==undefined){nodePick=Number(d.node);draw();$('[data-node-sheet] [data-node-go]')?.focus();return;}
  if(t.hasAttribute('data-node-close')){const i=nodePick;nodePick=null;draw();$(`[data-node="${i}"]`)?.focus();return;}
  if(d.nodeGo!==undefined){enterNode(Number(d.nodeGo));return;}
  if(t.hasAttribute('data-go-world'))return go('map');
  if(t.hasAttribute('data-exit-learn'))return go('map');
  if(t.hasAttribute('data-mechanisms-open')){const progress=mechanismProgress(state);if(!progress.ready)return;if(!progress.complete&&progress.completed.includes(MECHANISM_KINDS[state.mechanisms.index])){state.mechanisms.index=MECHANISM_KINDS.findIndex(k=>!progress.completed.includes(k));state.mechanisms.phase=0;}view='mechanisms';save();draw(true);return;}
  if(d.mechanismPick!==undefined&&view==='mechanisms'){const index=Number(d.mechanismPick);if(!Number.isInteger(index)||index<0||index>=MECHANISM_KINDS.length)return;state.mechanisms.index=index;state.mechanisms.phase=0;save();draw(true);return;}
  if(t.hasAttribute('data-previous-screen'))return previous();
  if(t.hasAttribute('data-continue-screen'))return advance();
  if(t.hasAttribute('data-guide-toggle')){prefs={...prefs,guide:!guideOn()};savePrefs();draw();$('[data-guide-toggle]')?.focus();return;}
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
 return {openMaterial(id){
  if(typeof id!=='string')return false;
  const loc=CARDS.has(id)?cardLocation(id):null;
  if(!loc&&!KNOWLEDGE_IDS.includes(id))return false;
  state.navigation.forward=[];state.review=null;
  if(loc){
   state.stage=loc.island;state.explore.pos[loc.island]={node:loc.node,screen:loc.screen};
   state.explore.seen[loc.island]=true;view='learn';save();draw(true);
  }else enterStation(id);
  return true;
 },setMode(next){
  if(next===mode)return;clear();save();
  if(next==='teacher'){studentState=state;state=copyPathLocation(studentState,teacherMemory||{...freshPath(),explore:structuredClone(studentState.explore)});}
  else{teacherMemory=state;state=copyPathLocation(state,studentState);}
  mode=next;save();draw();
 },destroy({discard=false}={}){root.removeEventListener('click',onClick);window.removeEventListener('popstate',onPop);clear();onView(null);if(discard){memory=null;teacherMemory=null;}else save();}};
}
