// Full walkthrough of the progressive path in Chrome: legacy clearing, warm-up, five stages, final practice, assessment.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {WARMUP,STAGES,ITEMS} from '../course-path.js';
import {REACTION_EXAMPLES} from '../reaction-examples.js';
import {mechanismSpec} from '../electron-flow.js';
import {EXAM_FORMS} from '../exam-items.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.ORGANIC_URL||'http://127.0.0.1:8768/academy.html',out='/private/tmp/organic-path-verification';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),errors=[],report={checks:[]};
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
async function answerItem({wrongMech=false,arrows=true}={}){
 // Match each field exactly: substring matching confused 丙烯 with 2-甲基丙烯 and Cl₂ with CH₂Cl₂.
 const fields=await page.locator('.reaction-card p').evaluateAll(ps=>ps.map(p=>p.textContent.replace(/^[^：]*：/,'').trim())),matches=ITEMS.filter(i=>i.substrate===fields[0]&&i.reagent===fields[1]&&i.conditions===fields[2]);assert.equal(matches.length,1,'題目應唯一對應：'+fields.join(' | '));const item=matches[0];
 const types=await page.locator('[name=mech]').evaluateAll(n=>n.map(x=>x.value)),mech=wrongMech?types.find(t=>t!==item.type):item.type;
 await page.locator(`[name=mech][value="${mech}"]`).check();await choose(page.locator('[data-mixed-form] fieldset').nth(1),item.reasons[0]);await choose(page.locator('[data-mixed-form] fieldset').nth(2),item.products[0]);
 await page.locator('[data-mixed-form] button[type=submit]').click();
 assert.ok(await page.locator('.flow-branch.lit').count()>=1,'答後流程圖應標出路徑');
 assert.equal(await page.locator('.mixed-feedback li.right').count(),wrongMech?2:3);
 if(arrows){await drawArrows(page.locator('[data-mixed-arrows]'),item.type);await page.locator('[data-graded-feedback]').filter({hasText:'全部電子移動正確'}).waitFor();}
 await page.locator('[data-mixed-next]').click();return item;
}

// On failure keep the stack, the last passed check and a screenshot so intermittent timeouts can be diagnosed.
try{
// 1. Legacy data is cleared on first load of the new version; unrelated keys survive.
await page.goto(base);await page.evaluate(()=>{localStorage.clear();localStorage.setItem('organic-course-v1','{"version":1}');localStorage.setItem('organic-assessment-v2:attempt:x','{}');localStorage.setItem('organic-pk-v1:ROOM','{}');localStorage.setItem('unrelated','keep');});
await page.reload();await page.locator('#course-notice').filter({hasText:'舊的課程進度'}).waitFor();
const keys=await page.evaluate(()=>Object.keys(localStorage).sort());assert.ok(!keys.some(k=>['organic-course-v1','organic-assessment-v2:attempt:x','organic-pk-v1:ROOM'].includes(k)));assert.ok(keys.includes('unrelated'));
assert.equal(await page.locator('[data-page=pk]').count(),0);ok('舊課程／評量／PK 紀錄清除，其他資料保留；PK 入口已移除');
await page.reload();assert.equal(await page.locator('#course-notice').isHidden(),true);ok('清除只執行一次');

// 2. Warm-up: eight concepts with instant checks; first answer wrong on card 1.
assert.equal(await page.locator('[data-learning-path]').getAttribute('data-stage'),'warmup');await overflow('暖身 390px');await page.screenshot({path:out+'/01-warmup-390.png',fullPage:false});
for(const [i,c] of WARMUP.entries()){
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
 if(c.demos){
  const svg=page.locator('[data-concept-player] svg.spotlight-canvas');await svg.waitFor();assert.equal(await svg.getAttribute('data-renderer'),'xyz-ball-stick');
  await svg.scrollIntoViewIfNeeded();const box=await svg.boundingBox(),yaw=Number(await svg.getAttribute('data-yaw'));await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+80,box.y+box.height/2,{steps:6});await page.mouse.up();
  assert.notEqual(Number(await svg.getAttribute('data-yaw')),yaw,c.id+' 拖曳應改變視角');
  if(c.demos.length>1){await page.locator('[data-concept-demo="1"]').click();await page.locator('[data-concept-player] [data-physical-step]').filter({hasText:'E2'}).waitFor();}
  if(c.id==='nucleophile'){await overflow('暖身三維 390px');await page.screenshot({path:out+'/01b-warmup-3d-390.png'});}
  ok(`暖身「${c.title}」三維可拖曳旋轉`);
 }
 if(i===0){await choose(page.locator('[data-warm-check]'),c.check.options[(c.check.answer+1)%3]);await page.locator('[data-warm-check] button').click();await page.locator('[data-warm-feedback]').filter({hasText:'再想想'}).waitFor();}
 await choose(page.locator('[data-warm-check]'),c.check.options[c.check.answer]);await page.locator('[data-warm-check] button').click();await page.locator('[data-warm-feedback]').filter({hasText:'正確'}).waitFor();
 if(i<WARMUP.length-1)await page.locator('[data-warm-next]').click();else await page.locator('[data-warm-done]').click();
}
ok('暖身八個觀念與即時檢查（含答錯回饋）');

// 3. Five stages.
for(const [si,st] of STAGES.entries()){
 await page.locator(`[data-learning-path][data-stage="${st.id}"]`).waitFor();
 for(let i=0;i<st.concepts.length;i++){if(st.concepts[i].widget)await page.locator('[data-cation-svg]').first().waitFor();await page.locator('[data-concept-next]').click();}
 for(const [pi,pair] of st.pairs.entries()){
  await page.locator('[data-predict="0"]').selectOption(kindOf.get(pair.a));await page.locator('[data-predict="1"]').selectOption(kindOf.get(pair.b));await page.locator('[data-reveal]').click();
  assert.equal(await page.locator('.contrast-card.right').count(),2);
  if(pi===0){await page.locator('[data-watch="1"]').click();await page.locator('[data-contrast-player] svg[data-renderer="xyz-ball-stick"]').waitFor();if(si===0){const svg=page.locator('[data-contrast-player] svg.spotlight-canvas');await svg.scrollIntoViewIfNeeded();const b=await svg.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2+120,b.y+b.height/2+40,{steps:6});await page.mouse.up();assert.notEqual(await svg.getAttribute('data-yaw'),'-0.3');await page.locator('[data-contrast-player] [data-play]').click();await page.waitForFunction(()=>{const s=document.querySelector('[data-contrast-player] svg.spotlight-canvas');return Math.abs(Number(s.dataset.yaw)+0.3)<1e-6&&Math.abs(Number(s.dataset.pitch)-0.36)<1e-6;});await page.locator('[data-contrast-player] [data-play]').filter({hasText:'暫停'}).waitFor();await page.locator('[data-contrast-player] [data-play]').click();ok('播放前先轉回建議視角，再開始播放');await page.locator('[data-contrast-player] [data-replay]').click();assert.equal(await svg.getAttribute('data-focus'),'0.00');let guard=0;while(!['focus'].includes(await svg.getAttribute('data-mode'))&&guard++<8)await page.locator('[data-contrast-player] [data-demo-next]').click();assert.equal(await svg.getAttribute('data-focus'),'1.00');await page.locator('[data-contrast-player] .molecule-stage').screenshot({path:out+'/02b-electron-focus.png'});ok('電子移動段落自動拉近（總覽段不拉近）');const paper=page.locator('[data-contrast-player] .paper-canvas');assert.equal(await paper.getAttribute('data-mode'),'focus');assert.ok(await paper.locator('[data-paper-arrow]').count()>=1);assert.ok(await paper.locator('[data-paper-atom]').count()>=3);await page.locator('[data-contrast-player] [data-demo-next]').click();assert.equal(await paper.getAttribute('data-mode'),await svg.getAttribute('data-mode'));ok('書面結構式與三維同步（同一段、彎箭頭、原子標示）');}for(let k=0;k<3;k++)await page.locator('[data-contrast-player] [data-demo-next]').click();assert.ok(Number(await page.locator('[data-contrast-player] svg.spotlight-canvas').getAttribute('data-step'))>=0);await overflow(`${st.id} 對比 390px`);if(si===3)await page.screenshot({path:out+'/02-contrast-addition-390.png'});}
  if(pi<st.pairs.length-1)await page.locator('[data-pair-next]').click();
 }
 await page.locator('[data-to-branch]').click();
 for(const [ti,t] of st.branches.entries()){
  assert.ok(await page.locator('.flow-branch.pending').count()>=1,'應有待補分支');
  if(ti===0&&si===0){await choose(page.locator('[data-branch-form]'),t.options[(t.answer+1)%3]);await page.locator('[data-branch-form] button[type=submit]').click();await page.locator('[data-branch-feedback]').filter({hasText:'還不對'}).waitFor();}
  await choose(page.locator('[data-branch-form]'),t.options[t.answer]);await page.locator('[data-branch-form] button[type=submit]').click();
 }
 assert.equal(await page.locator('.flow-branch.pending').count(),0);if(si===4)await page.screenshot({path:out+'/03-flow-complete-390.png',fullPage:true});
 await page.locator('[data-to-arrows]').click();
 for(const [ki,kind] of st.arrowKinds.entries()){
  await page.locator(`[data-arrow-kind="${ki}"]`).click();const root=page.locator('[data-graded-host]');
  if(si===0&&ki===0){
   await drawArrows(root,kind,{correct:false});const tier1=await page.locator('[data-graded-feedback]').innerText();assert.match(tier1,/第 1 步/);assert.doesNotMatch(tier1,/第 1 支箭頭/);
   await page.locator('[data-graded-more]').click();assert.match(await page.locator('[data-graded-feedback]').innerText(),/第 1 支箭頭/);
   await clearArrows(root,kind);await drawArrows(root,kind);await page.locator('[data-graded-feedback]').filter({hasText:'全部電子移動正確'}).waitFor();
  }else{await drawArrows(root,kind);await page.locator('[data-graded-feedback]').filter({hasText:'全部電子移動正確'}).waitFor();}
 }
 await page.locator('[data-to-mixed]').click();
 for(let n=0;n<st.mixCount;n++)await answerItem({wrongMech:si===2&&n===0,arrows:n===0});
 await page.locator('[data-next-stage]').waitFor();assert.ok(await page.locator('table.mastery tr[data-mastery]').count()===new Set(STAGES.slice(0,si+1).flatMap(s=>s.newTypes)).size);
 ok(`階段 ${si+1}：概念 ${st.concepts.length}、對比 ${st.pairs.length}、補分支 ${st.branches.length}、箭頭 ${st.arrowKinds.length}、混合 ${st.mixCount}`);
 await page.locator('[data-next-stage]').click();
}
ok('階段 1 的箭頭先錯：第一層只指出步驟，第二層才指出箭頭');

// 4. Final interleaved practice with mastery; reload keeps the position.
await page.locator('[data-learning-path][data-stage="final"]').waitFor();
const seen=[];for(let n=0;n<4;n++)seen.push((await answerItem({arrows:false})).type);
assert.ok(new Set(seen).size>=2,'總混合練習應交錯出現不同類型');assert.equal(await page.locator('table.mastery tr[data-mastery]').count(),9);await overflow('總混合練習 390px');await page.screenshot({path:out+'/04-final-390.png',fullPage:true});
await page.reload();assert.equal(await page.locator('[data-path-stage]').inputValue(),'final');ok('總混合練習交錯、九類精熟度、重新整理保留位置');

// 5. Assessment: complete post-test correctly → 100; delay ends early → incomplete.
await page.locator('[data-page=assess]').click();await page.locator('#start-exam').click();assert.equal(await page.locator('[data-page=learn]').isDisabled(),true);
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

// 6. Other widths.
for(const w of [320,1280]){await page.setViewportSize({width:w,height:w===320?700:800});await page.locator('[data-back-learning]').click();await page.locator('[data-path-stage]').selectOption('s4');await page.locator('[data-goto-step="1"]').click();await overflow(`對比 ${w}px`);await page.locator('[data-goto-step="2"]').click();await overflow(`流程圖 ${w}px`);if(w===1280)await page.screenshot({path:out+'/06-flow-1280.png',fullPage:true});await page.locator('[data-page=assess]').click();}
ok('320／1280px 無水平溢出');

}catch(error){await fs.writeFile(out+'/failure.txt',[String(error.stack||error),'last passed: '+report.checks.at(-1),'url: '+page.url(),'pageerrors: '+JSON.stringify(errors)].join('\n'));await page.screenshot({path:out+'/failure.png',fullPage:true}).catch(()=>{});await browser.close();throw error;}
assert.deepEqual(errors,[]);report.errors=errors;report.passed=true;report.at=new Date().toISOString();await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log('ALL PASSED');await browser.close();
