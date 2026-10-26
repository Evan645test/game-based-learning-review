// Full walkthrough of the island path in Chrome: legacy clearing, naming, world map, every landmark screen, final practice, assessment, reset.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {WARMUP,STAGES,ITEMS,PATH_TASKS,REVIEW_BY_TYPE,ARROW_REVIEW,COMPETENCIES} from '../course-path.js';
import {REACTION_EXAMPLES} from '../reaction-examples.js';
import {mechanismSpec} from '../electron-flow.js';
import {ISLANDS,islandNodes,nodeScreens,spotFor,islandBuildings} from '../island-map.js';
import {EXAM_FORMS} from '../exam-items.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.ORGANIC_URL||'http://127.0.0.1:8768/academy.html',out='/private/tmp/organic-path-verification';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
const page=await context.newPage(),errors=[],report={checks:[]};
page.on('pageerror',e=>errors.push(String(e)));page.on('dialog',d=>d.accept());page.setDefaultTimeout(10000);
const ok=name=>{report.checks.push(name);console.log('✓',name);};
const kindOf=new Map(Object.entries(REACTION_EXAMPLES).flatMap(([k,l])=>l.map(e=>[e.id,k])));
const exact=t=>new RegExp('^'+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$');
const choose=async(scope,text)=>scope.locator('label.choice').filter({has:page.locator('span',{hasText:exact(text)})}).first().click();
async function overflow(label){const w=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);assert.ok(w<=1,`${label} 水平溢出 ${w}px`);}
async function drawArrows(root,kind,{correct=true,check=true}={}){
 const steps=mechanismSpec(kind).steps;
 for(let i=0;i<steps.length;i++){
  await root.locator(`[data-flow-step="${i}"]`).click();
  const arrows=correct?steps[i].required:[{from:steps[i].required[0].to,to:steps[i].required[0].from,electrons:2}];
  for(const a of arrows){await root.locator('[data-arrow-from]').selectOption(a.from);await root.locator('[data-arrow-to]').selectOption(a.to);await root.locator('[data-arrow-electrons]').selectOption(String(a.electrons||2));await root.locator('[data-add-arrow]').click();}
  await root.locator('[data-confirm-arrows]').click();
 }
 if(check)await root.locator('[data-graded-check]').click();
}
async function clearArrows(root,kind){const steps=mechanismSpec(kind).steps;for(let i=0;i<steps.length;i++){const b=root.locator(`[data-flow-step="${i}"]`);if(await b.isDisabled())break;await b.click();if(!(await root.locator('[data-arrow-clear]').isDisabled()))await root.locator('[data-arrow-clear]').click();}}
async function figureExtras(c){
 if(c.widget?.kind==='leaving'){assert.equal(await page.locator('[data-ion]').count(),3);assert.equal(await page.locator('[data-leaving-row]').count(),2);await page.locator('[data-leaving-visual]').scrollIntoViewIfNeeded();await overflow('脫離基圖解 390px');await page.locator('[data-leaving-visual]').screenshot({path:out+'/01d-leaving-390.png'});ok('脫離基圖解：鹵離子比較與 –OH 質子化對照');}
 if(c.widget?.kind==='cation-cloud'){
  await page.locator('[data-cation-cloud]').scrollIntoViewIfNeeded();assert.equal(await page.locator('[data-cation-panel]').count(),4);
  const clouds=await page.locator('[data-halo="C"]').evaluateAll(n=>n.map(x=>Number(x.dataset.cloud)));assert.ok(clouds.every((v,k)=>!k||v<clouds[k-1]),'中心碳藍色應逐格變淡 '+clouds);
  assert.equal(await page.locator('[data-p-lobe]').count(),0);await page.locator('[data-show-orbital]').check();assert.equal(await page.locator('[data-p-lobe]').count(),8);
  const tert=page.locator('[data-cation-panel="tertiary"] svg');assert.equal(await tert.getAttribute('data-parallel'),'6');
  const svg=page.locator('[data-cation-panel="methyl"] svg'),box=await svg.boundingBox(),yaw=await tert.getAttribute('data-yaw');await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+60,box.y+box.height/2,{steps:6});await page.mouse.up();assert.notEqual(await tert.getAttribute('data-yaw'),yaw,'拖曳一格，四格一起轉');
  await page.locator('[data-twist]').fill('30');assert.ok(Number(await tert.getAttribute('data-parallel'))<6);await page.locator('[data-twist]').fill('0');
  await overflow('碳陽離子電子雲 390px');await page.locator('[data-cation-cloud]').screenshot({path:out+'/01c-cation-cloud-390.png'});
  ok('碳陽離子電子雲：四格並排比較、空 p 軌域、超共軛計數、同步拖曳與轉動甲基');
 }
 if(c.widget?.kind==='energy'){const v=page.locator('[data-energy-visual]');await v.scrollIntoViewIfNeeded();assert.equal(await page.locator('[data-energy-diagram="one"] [data-energy-ts]').count(),1);assert.equal(await page.locator('[data-energy-diagram="two"] [data-energy-ts]').count(),2);assert.equal(await page.locator('[data-energy-int]').count(),1);await overflow('能量圖 390px');await v.screenshot({path:out+'/01e-energy-390.png'});ok('能量圖：一步一個過渡態；兩步兩個過渡態夾中間體');}
 if(c.widget?.kind==='skeletal'){const v=page.locator('[data-skeletal-diagram]');await v.scrollIntoViewIfNeeded();assert.equal(await v.locator('[data-lone-pairs="3"] circle').count(),6);await overflow('讀結構式圖解 390px');await v.screenshot({path:out+'/01a-skeletal-390.png'});ok('讀結構式：骨架式與補回 H／孤對電子並排');}
 if(c.visual)await page.locator('[data-path-visual] svg').first().waitFor();
}
async function demoExtras(c){
 if(c.demos){
  const svg=page.locator('[data-concept-player] svg.spotlight-canvas');await svg.waitFor();assert.equal(await svg.getAttribute('data-renderer'),'xyz-ball-stick');
  await svg.scrollIntoViewIfNeeded();const box=await svg.boundingBox(),yaw=Number(await svg.getAttribute('data-yaw'));await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+80,box.y+box.height/2,{steps:6});await page.mouse.up();
  assert.notEqual(Number(await svg.getAttribute('data-yaw')),yaw,c.id+' 拖曳應改變視角');
  if(c.demos.length>1){await page.locator('[data-concept-demo="1"]').click();await page.locator('[data-concept-demo="1"][aria-pressed="true"]').waitFor();await svg.waitFor();if(c.id==='basicity')await page.locator('[data-concept-player] [data-physical-step]').filter({hasText:'E2'}).waitFor();}
  if(c.id==='nucleophile'){await overflow('暖身三維 390px');await page.screenshot({path:out+'/01b-warmup-3d-390.png'});}
  ok(`「${c.title}」三維可拖曳旋轉`);
 }
}
// Follow a review link, confirm the source bar, then come back with the return button or the browser Back button.
async function reviewDetour(scope,{back=false}={}){
 const link=page.locator(`${scope} [data-review]`).first(),id=await link.getAttribute('data-review'),title=await link.innerText(),before=await page.locator('[data-path-panel] h2').first().innerText();
 await link.click();await page.locator('[data-review-banner]').waitFor();assert.match(await page.locator('[data-path-panel] h2').first().innerText(),new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 if(back)await page.goBack();else await page.locator('[data-review-return]').click();
 await page.locator('[data-path-panel] h2').filter({hasText:before}).first().waitFor();assert.equal(await page.locator('[data-review-banner]').count(),0);return id;
}
const view=v=>page.locator(`[data-learning-path][data-view="${v}"]`);
const CARD=new Map([...WARMUP,...STAGES.flatMap(s=>s.primers||[])].map(c=>[c.id,c]));
async function answerItem({wrongMech=false,arrows=true}={}){
 // Match each field exactly: substring matching confused 丙烯 with 2-甲基丙烯 and Cl₂ with CH₂Cl₂.
 const fields=await page.locator('.reaction-card p').evaluateAll(ps=>ps.map(p=>p.textContent.replace(/^[^：]*：/,'').trim())),matches=ITEMS.filter(i=>i.substrate===fields[0]&&i.reagent===fields[1]&&i.conditions===fields[2]);assert.equal(matches.length,1,'題目應唯一對應：'+fields.join(' | '));const item=matches[0];
 const types=await page.locator('[name=mech]').evaluateAll(n=>n.map(x=>x.value)),mech=wrongMech?types.find(t=>t!==item.type):item.type;
 await page.locator(`[name=mech][value="${mech}"]`).check();await choose(page.locator('[data-mixed-form] fieldset').nth(1),item.reasons[0]);await choose(page.locator('[data-mixed-form] fieldset').nth(2),item.products[0]);
 await page.locator('[data-mixed-form] button[type=submit]').click();
 assert.ok(await page.locator('.flow-branch.lit').count()>=1,'答後流程圖應標出路徑');
 assert.equal(await page.locator('.mixed-feedback li.right').count(),wrongMech?2:3);
 assert.equal(await page.locator('.mixed-feedback [data-review]').count(),wrongMech?REVIEW_BY_TYPE[item.type].length:0,'答錯才給回看連結');
 if(wrongMech){await reviewDetour('.mixed-feedback');assert.equal(await page.locator('.mixed-feedback li.right').count(),2,'回來後仍是同一題的作答結果');ok('混合練習答錯：依反應類型給回看連結，回看後回到同一題');}
 if(arrows){await drawArrows(page.locator('[data-mixed-arrows]'),item.type);await page.locator('[data-graded-feedback]').filter({hasText:'全部電子移動正確'}).waitFor();}
 return item;
}
let gateShown=false;
// mode: 'right', 'wrong-then-right' (red flag clears), or 'wrong' (the flag stays).
async function answerCheck(c,mode='right'){
 if(!gateShown){await page.locator('[data-continue-screen]').click();await page.locator('[data-learn-gate]').filter({hasText:'先選一個答案'}).waitFor();gateShown=true;ok('檢查題未作答不能繼續，提示就在繼續按鈕上方');}
 if(mode!=='right'){
  await choose(page.locator('[data-warm-check]'),c.check.options[(c.check.answer+1)%c.check.options.length]);await page.locator('[data-warm-check] button[type=submit]').click();await page.locator('[data-warm-feedback]').filter({hasText:'再想想'}).waitFor();
  assert.match(await page.locator('[data-guide-line]').innerText(),/差一點/);assert.equal(await page.locator('[data-check-review] [data-review]').count(),(c.review||[]).length);
  if(c.id==='formal'){
   assert.equal(await reviewDetour('[data-check-review]'),'skeletal');await page.locator('[data-check-review] [data-review]').waitFor();
   await reviewDetour('[data-check-review]',{back:true});await page.screenshot({path:out+'/01f-review-links-390.png'});
   ok('暖身答錯：引導者提醒、給回看連結；回看列與瀏覽器返回都回到原卡');
  }
  if(mode==='wrong')return;
 }
 await choose(page.locator('[data-warm-check]'),c.check.options[c.check.answer]);await page.locator('[data-warm-check] button[type=submit]').click();await page.locator('[data-warm-feedback]').filter({hasText:'正確'}).waitFor();
}
async function doPair(st,si,scr){
 const pair=st.pairs[scr.index];
 if(si===0&&scr.index===0){await page.locator('[data-continue-screen]').click();await page.locator('[data-learn-gate]').filter({hasText:'揭曉'}).waitFor();}
 await page.locator('[data-predict="0"]').selectOption(kindOf.get(pair.a));await page.locator('[data-predict="1"]').selectOption(kindOf.get(pair.b));await page.locator('[data-reveal]').click();
 assert.equal(await page.locator('.contrast-card.right').count(),2);
 if(scr.index===0){await page.locator('[data-watch="1"]').click();await page.locator('[data-contrast-player] svg[data-renderer="xyz-ball-stick"]').waitFor();if(si===0){const svg=page.locator('[data-contrast-player] svg.spotlight-canvas');await svg.scrollIntoViewIfNeeded();const b=await svg.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2+120,b.y+b.height/2+40,{steps:6});await page.mouse.up();assert.notEqual(await svg.getAttribute('data-yaw'),'-0.85');await page.locator('[data-contrast-player] [data-play]').click();await page.waitForFunction(()=>{const s=document.querySelector('[data-contrast-player] svg.spotlight-canvas');return Math.abs(Number(s.dataset.yaw)+0.85)<1e-6&&Math.abs(Number(s.dataset.pitch)+0.1)<1e-6;});await page.locator('[data-contrast-player] [data-play]').filter({hasText:'暫停'}).waitFor();await page.locator('[data-contrast-player] [data-play]').click();ok('播放前先轉回建議視角，再開始播放');await page.locator('[data-contrast-player] [data-replay]').click();assert.equal(await svg.getAttribute('data-focus'),'0.00');let guard=0;while(!['focus'].includes(await svg.getAttribute('data-mode'))&&guard++<8)await page.locator('[data-contrast-player] [data-demo-next]').click();assert.equal(await svg.getAttribute('data-focus'),'1.00');await page.locator('[data-contrast-player] .molecule-stage').screenshot({path:out+'/02b-electron-focus.png'});ok('電子移動段落自動拉近（總覽段不拉近）');const paper=page.locator('[data-contrast-player] .paper-canvas');assert.equal(await paper.getAttribute('data-mode'),'focus');assert.ok(await paper.locator('[data-paper-arrow]').count()>=1);assert.ok(await paper.locator('[data-paper-atom]').count()>=3);await page.locator('[data-contrast-player] [data-demo-next]').click();assert.equal(await paper.getAttribute('data-mode'),await svg.getAttribute('data-mode'));ok('書面結構式與三維同步（同一段、彎箭頭、原子標示）');}for(let k=0;k<3;k++)await page.locator('[data-contrast-player] [data-demo-next]').click();assert.ok(Number(await page.locator('[data-contrast-player] svg.spotlight-canvas').getAttribute('data-step'))>=0);await overflow(`${st.id} 對比 390px`);if(si===3)await page.screenshot({path:out+'/02-contrast-addition-390.png'});}
}
async function doBranch(st,si,scr){
 const t=st.branches[scr.index];
 assert.ok(await page.locator('.flow-branch.pending').count()>=1,'應有待補分支');
 if(si===0&&scr.index===0){await choose(page.locator('[data-branch-form]'),t.options[(t.answer+1)%3]);await page.locator('[data-branch-form] button[type=submit]').click();await page.locator('[data-branch-feedback]').filter({hasText:'還不對'}).waitFor();assert.ok(await page.locator('[data-branch-review] [data-review]').count()>=1,'補錯分支給先備回看');}
 await choose(page.locator('[data-branch-form]'),t.options[t.answer]);await page.locator('[data-branch-form] button[type=submit]').click();await page.locator('[data-path-panel]').filter({hasText:'這條分支補好了'}).waitFor();
 if(scr.index===st.branches.length-1){assert.equal(await page.locator('.flow-branch.pending').count(),0);if(si===4)await page.screenshot({path:out+'/03-flow-complete-390.png',fullPage:true});}
}
async function doArrow(st,si,scr){
 const kind=st.arrowKinds[scr.index],root=page.locator('[data-graded-host]');
 if(si===0&&scr.index===0){
  await page.locator('[data-continue-screen]').click();await page.locator('[data-learn-gate]').filter({hasText:'檢查箭頭'}).waitFor();
  await drawArrows(root,kind,{correct:false});const tier1=await page.locator('[data-graded-feedback]').innerText();assert.match(tier1,/第 1 步/);assert.doesNotMatch(tier1,/第 1 支箭頭/);
  await page.locator('[data-graded-more]').click();assert.match(await page.locator('[data-graded-feedback]').innerText(),/第 1 支箭頭/);
  assert.equal(await page.locator('[data-graded-review] [data-review]').count(),ARROW_REVIEW.length);await reviewDetour('[data-graded-review]');assert.equal(await page.locator('[data-learning-path]').getAttribute('data-stage'),'s1');ok('箭頭答錯：給彎箭頭／形式電荷／質子轉移回看，回來仍在本島箭頭');
  await clearArrows(root,kind);await drawArrows(root,kind);await page.locator('[data-graded-feedback]').filter({hasText:'全部電子移動正確'}).waitFor();
  ok('階段 1 的箭頭先錯：第一層只指出步驟，第二層才指出箭頭');
 }else{await drawArrows(root,kind);await page.locator('[data-graded-feedback]').filter({hasText:'全部電子移動正確'}).waitFor();}
}
/** Walk every remaining screen of the landmark the learner is in, ending back on the island or its complete screen. */
async function walkNode(islandId,ni,{si=-1,checks={}}={}){
 await view('learn').waitFor();
 const node=islandNodes(islandId)[ni],screens=nodeScreens(islandId,node),st=STAGES.find(s=>s.id===islandId);
 const start=await page.evaluate(id=>JSON.parse(localStorage.getItem('organic-path-v3')).explore.pos[id].screen,islandId);
 for(let i=start;i<screens.length;i++){
  const scr=screens[i];await view('learn').waitFor();
  const building=islandBuildings(islandId).find(b=>b.node===ni&&i>=b.screen&&i<=b.end);
  assert.ok((await page.locator('.learn-where').innerText()).endsWith(building.short));
  assert.equal(await page.locator('.learn-count').innerText(),`${i-building.screen+1}／${building.end-building.screen+1}`);
  const h2=page.locator('[data-path-panel] h2').first();
  if(scr.card){const c=CARD.get(scr.card);await h2.filter({hasText:c.title}).waitFor();
   if(scr.type==='figure')await figureExtras(c);
   if(scr.type==='demo')await demoExtras(c);
   if(scr.type==='check')await answerCheck(c,checks[c.id]);
  }
  if(scr.type==='concept')await h2.filter({hasText:st.concepts[scr.index].title}).waitFor();
  if(scr.type==='concept-figure')await page.locator('[data-cation-svg]').first().waitFor();
  if(scr.type==='pair')await doPair(st,si,scr);
  if(scr.type==='branch')await doBranch(st,si,scr);
  if(scr.type==='arrow')await doArrow(st,si,scr);
  if(scr.type==='item')await answerItem({wrongMech:si===2&&scr.index===0,arrows:scr.index===0});
  await page.locator('[data-continue-screen]').click();
  if(i===building.end&&i<screens.length-1){
   await view('island').waitFor();const next=islandBuildings(islandId).findIndex(b=>b.node===ni&&b.screen===i+1);
   await page.locator(`[data-node="${next}"]`).click();await page.locator('[data-node-sheet] [data-node-go]').click();
  }
 }
}
// The chemist walks from the finished landmark to the next one.
async function heroAt(count,i){const s=spotFor(count,i);await page.waitForFunction(([l,t])=>{const h=document.querySelector('[data-hero]'),near=(a,b)=>Math.abs(parseFloat(a)-parseFloat(b))<0.01;return h&&near(h.style.left,l)&&near(h.style.top,t);},[s.left,s.top]);}
async function finishIsland(id,next){
 await page.locator(`[data-island-complete="${id}"]`).waitFor();await page.locator('[data-complete-world]').click();await view('world').waitFor();
 if(next)await page.locator(`[data-island="${next}"][data-isle-state="open"]`).waitFor();
}

// On failure keep the stack, the last passed check and a screenshot so intermittent timeouts can be diagnosed.
try{
// 1. Legacy data is cleared on first load of the new version; unrelated keys survive.
await page.goto(base);await page.evaluate(()=>{localStorage.clear();localStorage.setItem('organic-course-v1','{"version":1}');localStorage.setItem('organic-assessment-v2:attempt:x','{}');localStorage.setItem('organic-pk-v1:ROOM','{}');localStorage.setItem('unrelated','keep');});
await page.reload();await page.locator('#course-notice').filter({hasText:'舊的課程進度'}).waitFor();
const keys=await page.evaluate(()=>Object.keys(localStorage).sort());assert.ok(!keys.some(k=>['organic-course-v1','organic-assessment-v2:attempt:x','organic-pk-v1:ROOM'].includes(k)));assert.ok(keys.includes('unrelated'));
assert.equal(await page.locator('[data-page=pk]').count(),0);ok('舊課程／評量／PK 紀錄清除，其他資料保留；PK 入口已移除');
await page.reload();assert.equal(await page.locator('#course-notice').isHidden(),true);ok('清除只執行一次');

// 2. Naming the chemist, then the world map with fog, the guide switch and the explorer's handbook.
await view('name').waitFor();await overflow('取名 390px');await page.screenshot({path:out+'/00-name-390.png'});
await page.locator('#explorer-name').fill('小安');await page.locator('[data-name-form] button[type=submit]').click();
await view('world').waitFor();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('organic-explorer-v1')).name),'小安');assert.match(await page.locator('[data-guide-line]').innerText(),/^小安：/);
assert.deepEqual(await page.locator('[data-island]').evaluateAll(b=>b.map(x=>x.dataset.isleState)),['open','fog','fog','fog','fog','fog','fog']);
assert.equal(await page.locator('body').getAttribute('data-explore'),'world');assert.equal(await page.locator('.course-header').isVisible(),true,'地圖畫面保留頁首');
await overflow('世界地圖 390px');await page.screenshot({path:out+'/00-world-390.png',fullPage:true});
await page.locator('[data-island="s2"]').click();await page.locator('[data-fog-sheet]').filter({hasText:'建議先完成「階段 1'}).waitFor();await page.locator('[data-fog-cancel]').click();assert.equal(await page.locator('[data-fog-sheet]').count(),0);assert.equal(await page.evaluate(()=>document.activeElement?.dataset.island),'s2','取消後焦點回到那座島');
await page.locator('[data-guide-toggle]').click();assert.equal(await page.locator('[data-guide]').count(),0);await page.locator('[data-guide-toggle]').click();assert.equal(await page.locator('[data-guide]').count(),1);
ok('取名後進入世界地圖：暖身開放、其餘在霧中，霧中島先提醒，引導可完全關閉');
await page.locator('[data-book]').click();await view('book').waitFor();assert.match(await page.locator('[data-explore-book]').innerText(),/目前沒有紅旗/);assert.equal(await page.locator('[data-comp-toggle]').count(),6);
await page.locator('[data-comp-toggle="space"]').click();assert.equal(await page.locator('[data-competency="space"] [data-map-card]').count(),5);
await page.locator('[data-map-card="sterics"]').click();assert.equal(await view('book').count(),1,'點觀念卡只預覽，不跳走');assert.match(await page.locator('[data-card-preview="sterics"]').innerText(),/階段 1・入口小暖身/);
await overflow('探險手冊 390px');await page.screenshot({path:out+'/00-handbook-390.png',fullPage:true});
await page.locator('[data-map-go="sterics"]').click();await view('learn').waitFor();await page.locator('[data-path-panel] h2').filter({hasText:'立體障礙'}).waitFor();
assert.equal(await page.locator('body').getAttribute('data-explore'),'learn');assert.equal(await page.locator('.course-header').isVisible(),false,'學習畫面只留內容');
const bar=page.locator('[data-location-bar]');assert.match(await bar.innerText(),/從探險手冊跳來/);assert.match(await bar.innerText(),/回到 暖身・看懂結構：讀結構式/);
assert.deepEqual(await page.locator('[data-learning-path] .breadcrumb li').allInnerTexts(),['探險手冊','空間判斷','立體障礙']);await page.screenshot({path:out+'/00-detour-390.png'});
await page.locator('[data-crumb-comp="space"]').click();await view('book').waitFor();assert.equal(await page.locator('[data-comp-toggle="space"]').getAttribute('aria-expanded'),'true');await page.locator('[data-card-preview="sterics"]').waitFor();
await page.locator('[data-map-card="hybrid"]').click();await page.locator('[data-map-go="hybrid"]').click();await page.locator('[data-path-panel] h2').filter({hasText:CARD.get('hybrid').title}).waitFor();assert.match(await bar.innerText(),/回到 暖身・看懂結構：讀結構式/,'連續跳轉仍記得最初的來源');
await page.goBack();await view('world').waitFor();assert.equal(await page.locator('[data-location-bar]').count(),0);
const posNow=await page.evaluate(()=>JSON.parse(localStorage.getItem('organic-path-v3')).explore.pos);assert.deepEqual(posNow.s1,{node:0,screen:0});assert.deepEqual(posNow.warmup,{node:0,screen:0},'返回後所有島都回到原位');
ok('探險手冊：六項能力原地展開、先預覽再前往、來源列與麵包屑、連續跳轉記得來源、瀏覽器返回回到地圖');

// 3. Warm-up island: six landmarks, one thing per screen; leaving keeps the screen; the chemist walks on.
await page.locator('[data-island="warmup"]').click();await view('island').waitFor();
assert.equal(await page.locator('[data-node]').count(),10);assert.equal(await page.locator('[data-node="0"]').getAttribute('data-node-state'),'next');await heroAt(10,0);
await overflow('島嶼 390px');await page.screenshot({path:out+'/00-island-390.png'});
await page.locator('[data-node="3"]').click();await page.locator('[data-node-sheet="3"]').filter({hasText:'混成與形狀'}).waitFor();await page.locator('[data-node-close]').click();assert.equal(await page.locator('[data-node-sheet]').count(),0,'點據點先預覽，不直接進入');
await page.locator('.island-brief [data-node-go]').click();await view('learn').waitFor();await page.screenshot({path:out+'/01-learn-390.png'});
await page.locator('[data-continue-screen]').click();assert.equal(await page.locator('.learn-count').innerText(),'2／3');await page.locator('[data-exit-learn]').click();await view('island').waitFor();
await page.locator('.island-brief [data-node-go]').click();await view('learn').waitFor();assert.equal(await page.locator('.learn-count').innerText(),'2／3');ok('中途離開回到島上，再進來接續同一個畫面');
const warmNodes=islandNodes('warmup');
for(const ni of warmNodes.keys()){
 if(ni>0){await view('island').waitFor();await heroAt(10,islandBuildings('warmup').findIndex(b=>b.node===ni));assert.equal(await page.locator(`[data-node="${islandBuildings('warmup').findIndex(b=>b.node===ni)-1}"]`).getAttribute('data-node-state'),'done');if(ni===1)ok('走完據點後小化學家走到下一站，前一站標成已走過');await page.locator('.island-brief [data-node-go]').click();}
 await walkNode('warmup',ni,{checks:{skeletal:'wrong-then-right',formal:'wrong-then-right'}});
}
await finishIsland('warmup','s1');ok(`暖身島：六個據點 ${warmNodes.map(n=>nodeScreens('warmup',n).length).reduce((a,b)=>a+b)} 個畫面依序走完，船開到下一座島、霧散開`);

// 4. Five stage islands. Stage 1 leaves 立體障礙 wrong so its red flag can be followed from the handbook.
for(const [si,st] of STAGES.entries()){
 await page.locator(`[data-island="${st.id}"]`).click();await view('island').waitFor();
 const nodes=islandNodes(st.id);
 if(si===1){
  const ci=nodes.findIndex(n=>n.id==='concepts'),bi=islandBuildings(st.id).findIndex(b=>b.node===ci);await page.locator(`[data-node="${bi}"]`).click();await page.locator('[data-node-sheet] [data-node-go]').click();await walkNode(st.id,ci,{si});await view('island').waitFor();
  assert.equal(await page.locator(`[data-node="${bi}"]`).getAttribute('data-node-state'),'done');assert.equal(await page.locator('[data-node="0"]').getAttribute('data-node-state'),'next');ok('據點可以跳著走：先走概念，入口小暖身仍是下一站');
 }
 for(const [ni,n] of nodes.entries()){
  await view('island').waitFor();if(await page.evaluate(([id,key])=>Boolean(JSON.parse(localStorage.getItem('organic-path-v3')).explore.done[id][key]),[st.id,n.id]))continue;
  await page.locator('.island-brief [data-node-go]').click();
  await walkNode(st.id,ni,{si,checks:si===0?{sterics:'wrong'}:{}});
  if(si===0&&n.id==='primers'){await view('island').waitFor();assert.equal(await page.locator('[data-node="0"] .node-flag').count(),1,'答錯的觀念在據點插紅旗');}
 }
 await page.locator(`[data-island-complete="${st.id}"]`).waitFor();assert.equal(await page.locator('table.mastery tr[data-mastery]').count(),new Set(STAGES.slice(0,si+1).flatMap(s=>s.newTypes)).size);
 await finishIsland(st.id,ISLANDS[si+2].id);
 if(si===0){
  assert.match(await page.locator('[data-island="s1"]').getAttribute('aria-label'),/紅旗/);
  await page.locator('[data-book]').click();await view('book').waitFor();assert.match(await page.locator('.flag-list').innerText(),/立體障礙/);
  await page.locator('.flag-list [data-map-go="sterics"]').click();await page.locator('[data-path-panel] h2').filter({hasText:'立體障礙'}).waitFor();await page.locator('[data-review-return]').click();await view('world').waitFor();
  ok('紅旗：據點、島嶼與探險手冊都標出需回看，從手冊前往後一鍵回到地圖');
 }
 ok(`階段 ${si+1}：${nodes.map(n=>`${n.label} ${nodeScreens(st.id,n).length}`).join('、')}`);
}

// 5. Final island: interleaved items, mastery of nine types; reload returns to the same island.
await page.locator('[data-island="final"]').click();await view('island').waitFor();await page.locator('.island-brief [data-node-go]').click();
const seen=[];for(let n=0;n<4;n++){await view('learn').waitFor();seen.push((await answerItem({arrows:false})).type);await page.locator('[data-continue-screen]').click();}
await view('learn').waitFor();assert.ok(new Set(seen).size>=2,'總混合練習應交錯出現不同類型');assert.equal(await page.locator('table.mastery tr[data-mastery]').count(),9);await overflow('總混合練習 390px');await page.screenshot({path:out+'/04-final-390.png',fullPage:true});
await page.reload();await view('learn').waitFor();assert.equal(await page.locator('[data-learning-path]').getAttribute('data-stage'),'final');ok('總混合練習交錯、九類精熟度、重新整理回到同一個畫面');await page.locator('[data-exit-learn]').click();await view('island').waitFor();

// 6. Assessment from the lighthouse: complete post-test correctly → 100; delay ends early → incomplete.
await page.locator('[data-go-world]').click();await view('world').waitFor();await page.locator('[data-lighthouse]').click();await page.locator('#start-exam').click();assert.equal(await page.locator('[data-page=learn]').isDisabled(),true);
for(const [i,q] of EXAM_FORMS.post.entries()){
 await page.locator(`[name=mech][value="${q.type}"]`).check();await page.locator('#exam-arrows [data-flow-step="0"]').waitFor();
 await choose(page.locator('.assessment-card fieldset').nth(1),q.reasons[0]);await choose(page.locator('.assessment-card fieldset').nth(2),q.products[0]);
 const root=page.locator('#exam-arrows'),steps=mechanismSpec(q.type).steps;for(let s=0;s<steps.length;s++){await root.locator(`[data-flow-step="${s}"]`).click();for(const a of steps[s].required){await root.locator('[data-arrow-from]').selectOption(a.from);await root.locator('[data-arrow-to]').selectOption(a.to);await root.locator('[data-add-arrow]').click();}await root.locator('[data-confirm-arrows]').click();}
 if(i===0){await overflow('評量 390px');await page.screenshot({path:out+'/05-assessment-390.png'});}
 await page.locator('#exam-next').click();
}
await page.locator('h2').filter({hasText:'100／100'}).waitFor();assert.equal(await page.locator('.exam-review li').count(),10);ok('後測十題全對 100 分，逐題對照');
await page.locator('[data-view-records]').click();await page.locator('[data-exam-tab=delay]').click();await page.locator('#start-exam').click();await page.locator(`[name=mech][value="sn1"]`).check();await page.locator('#end-exam').click();await page.locator('#confirm-exam').click();
await page.locator('text=提早結束').first().waitFor();const recs=await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('organic-assessment-v3:attempt:')).length);assert.equal(recs,2);ok('延後測提早結束仍保存，未完成另列');

// 7. Other widths.
for(const w of [320,1280]){await page.setViewportSize({width:w,height:w===320?700:800});await page.locator('[data-back-learning]').click();await view('world').waitFor();await overflow(`世界地圖 ${w}px`);if(w===1280)await page.screenshot({path:out+'/06-world-1280.png',fullPage:true});await page.locator('[data-island="s4"]').click();await view('island').waitFor();await overflow(`島嶼 ${w}px`);await page.locator(`[data-node="${islandBuildings('s4').findIndex(b=>b.kind==='contrast')}"]`).click();await page.locator('[data-node-sheet] [data-node-go]').click();await view('learn').waitFor();await overflow(`對比 ${w}px`);if(w===1280)await page.screenshot({path:out+'/06-contrast-1280.png',fullPage:true});await page.locator('[data-exit-learn]').click();await view('island').waitFor();await page.locator('[data-go-world]').click();await page.locator('[data-lighthouse]').click();}
ok('320／1280px 地圖、島嶼與學習畫面無水平溢出');

// 8. Explicit reset: opening/exporting/cancelling preserves data; confirmation resets only this app.
await page.evaluate(async()=>{
 localStorage.setItem('organic-demo-view-v3:reset-test','{"step":1}');localStorage.setItem('organic-course-v1','legacy');
 sessionStorage.setItem('organic-session-test','temporary');sessionStorage.setItem('unrelated-session','keep');
 await new Promise((resolve,reject)=>{const request=indexedDB.open('organic-reaction-pk-v1',1);request.onupgradeneeded=()=>request.result.createObjectStore('rooms');request.onsuccess=()=>{request.result.close();resolve();};request.onerror=()=>reject(request.error);});
});
const storageSnapshot=()=>page.evaluate(()=>({local:Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]),session:Object.keys(sessionStorage).sort().map(k=>[k,sessionStorage.getItem(k)])})),beforeReset=await storageSnapshot();
await page.locator('[data-clear-learning]').click();await page.locator('[data-reset-dialog][open]').waitFor();assert.equal(await page.locator('[data-reset-cancel]').evaluate(b=>b===document.activeElement),true);
for(const width of [320,390,1280]){await page.setViewportSize({width,height:844});await overflow(`清空確認 ${width}px`);assert.equal(await page.locator('[data-reset-dialog]').evaluate(d=>d.scrollWidth<=d.clientWidth+1),true);if(width===390)await page.locator('[data-reset-dialog]').screenshot({path:out+'/07-reset-dialog-390.png'});}
const downloadEvent=page.waitForEvent('download');await page.locator('[data-reset-export]').click();const download=await downloadEvent,exported=JSON.parse(await fs.readFile(await download.path(),'utf8'));assert.equal(exported.schema,3);assert.equal(exported.assessments.length,2);assert.equal(exported.learningPath.stage,'s4');
await page.locator('[data-reset-cancel]').click();assert.deepEqual(await storageSnapshot(),beforeReset,'取消或匯出不可刪除紀錄');assert.equal(await page.locator('[data-clear-learning]').evaluate(b=>b===document.activeElement),true);
await page.locator('[data-clear-learning]').click();await page.keyboard.press('Escape');assert.equal(await page.locator('[data-reset-dialog]').getAttribute('open'),null);assert.deepEqual(await storageSnapshot(),beforeReset);
const sibling=await context.newPage();sibling.on('pageerror',e=>errors.push(String(e)));await sibling.goto(base);await sibling.locator('[data-learning-path]').waitFor();await sibling.evaluate(async()=>{sessionStorage.setItem('organic-sibling-test','old');sessionStorage.setItem('unrelated-sibling','keep');await new Promise((resolve,reject)=>{const r=indexedDB.open('organic-reaction-pk-v1',1);r.onsuccess=()=>{window.resetTestDb=r.result;resolve();};r.onerror=()=>reject(r.error);});});
await page.locator('[data-clear-learning]').click();await page.locator('[data-reset-confirm]').click();await page.locator('[data-reset-error]').filter({hasText:'其他分頁使用'}).waitFor();assert.deepEqual(await storageSnapshot(),beforeReset,'資料庫受阻時不刪除課程');await sibling.evaluate(()=>window.resetTestDb.close());await page.locator('[data-reset-cancel]').click();
await page.locator('#start-exam').click();await page.locator('[name=mech][value="sn1"]').check();assert.equal(await page.locator('[data-page=learn]').isDisabled(),true);
await page.locator('[data-clear-learning]').click();await Promise.all([page.waitForEvent('load'),sibling.waitForEvent('load'),page.locator('[data-reset-confirm]').click()]);
await page.locator('[data-learning-path][data-stage="warmup"][data-view="name"]').waitFor();await sibling.locator('[data-learning-path][data-stage="warmup"]').waitFor();await page.locator('#course-notice').filter({hasText:'本機學習紀錄已清空'}).waitFor();
const cleared=await storageSnapshot();assert.deepEqual(cleared.local.map(([k])=>k).filter(k=>k!=='organic-demo-view-v3:warm:hybrid:0'),['organic-data-version','organic-reset-generation','unrelated']);assert.deepEqual(cleared.session,[['unrelated-session','keep']]);
// A newly mounted warm-up player may save its initial view when its tab becomes hidden.
const initialView=cleared.local.find(([key])=>key==='organic-demo-view-v3:warm:hybrid:0');if(initialView){const value=JSON.parse(initialView[1]);assert.equal(value.frame,0);assert.equal(value.progress,0);}
assert.deepEqual(await sibling.evaluate(()=>Object.entries(sessionStorage)),[['unrelated-sibling','keep']]);assert.equal(await page.evaluate(async()=>(await indexedDB.databases()).some(d=>d.name==='organic-reaction-pk-v1')),false);
await page.reload();await page.locator('[data-learning-path][data-stage="warmup"][data-view="name"]').waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('organic-explorer-v1')),null,'小化學家的名字也一起清除');
await sibling.close();ok('清空紀錄：確認前不刪除、可匯出、取消與 Esc 保留、只清本工具兩儲存區及舊 PK 資料庫、其他分頁同步回暖身、名字一併清除、重載不復活');

}catch(error){await fs.writeFile(out+'/failure.txt',[String(error.stack||error),'last passed: '+report.checks.at(-1),'url: '+page.url(),'pageerrors: '+JSON.stringify(errors)].join('\n'));await page.screenshot({path:out+'/failure.png',fullPage:true}).catch(()=>{});await browser.close();throw error;}
assert.deepEqual(errors,[]);report.errors=errors;report.passed=true;report.at=new Date().toISOString();await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log('ALL PASSED');await browser.close();
