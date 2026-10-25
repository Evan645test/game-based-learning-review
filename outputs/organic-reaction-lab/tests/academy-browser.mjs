import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {COURSE_CASES} from '../course-content.js';
import {mechanismSpec} from '../electron-flow.js';
import {REACTION_EXAMPLES} from '../reaction-examples.js';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.LAB_TEST_OUTPUT||'/private/tmp/organic-academy-verification';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}}),errors=[];
context.on('page',p=>p.on('pageerror',e=>errors.push(String(e))));
const base=process.env.LAB_URL||'http://127.0.0.1:8768',page=await context.newPage();
page.setDefaultTimeout(10000);
const checks=[];
async function nextToEnd(host){while(!await host.locator('[data-demo-next]').isDisabled())await host.locator('[data-demo-next]').click();}
async function openSection(page,stage){const section=page.locator(`[data-reason-section="${stage}"]`);if(!await section.getAttribute('open')&&await section.getAttribute('open')!== '')await page.locator(`[data-reason-step="${stage}"]`).click();}
async function answer(page,c,{wrong=false,submit=true}={}){
 for(const stage of [0,1,2,3,5]){
  await openSection(page,stage);const i=stage===5?4:stage,value=wrong&&stage===0?0:c.questions[i].answer;
  await page.locator(`input[name="reason-${stage}"][value="${value}"]`).check();
 }
 await openSection(page,4);
 for(const kind of c.kinds){
  const block=page.locator(`[data-mechanism-kind="${kind}"]`),spec=mechanismSpec(kind);
  for(let s=0;s<spec.steps.length;s++){
   await block.locator(`[data-flow-step="${s}"]`).click();
   const existing=await block.locator('.arrow-list li').count();
   if(existing){await block.locator('[data-arrow-clear]').click();}
   for(const a of spec.steps[s].required){await block.locator('[data-arrow-from]').selectOption(a.from);await block.locator('[data-arrow-to]').selectOption(a.to);await block.locator('[data-add-arrow]').click();}
   await block.locator('[data-confirm-arrows]').click();
  }
  if(kind==='sn2')await block.locator('[data-geo-approach]').fill('180');
  else if(kind==='e2')await block.locator('[data-geo-torsion]').fill('180');
  else if(kind==='chair'){await block.locator('[data-geo-chair]').selectOption('axial');await block.locator('[data-geo-beta]').selectOption('H6');}
  else{await block.locator('[data-geo-step]').selectOption('1');if(kind==='e1')await block.locator('[data-geo-beta]').selectOption('Hethyl');}
  await block.locator('[data-capture]').click();
 }
 await openSection(page,5);
 assert.equal(await page.locator('[data-reason-submit]').isEnabled(),true);
 if(submit)await page.locator('[data-reason-submit]').click();
}
try{
 await page.goto(base+'/academy.html#part1');await page.waitForSelector('[data-topic]');
 assert.equal(await page.locator('[data-topic]').count(),8);
 await page.locator('[data-concept-group="1"]>summary').click();assert.match(await page.locator('[data-topic="5"]').innerText(),/非質子/);
 await page.locator('[data-ion]').selectOption('cation');assert.match(await page.locator('[data-solvation-text]').innerText(),/氧端/);
 await page.locator('[data-solvent]').selectOption('aprotic');assert.match(await page.locator('[data-solvation-text]').innerText(),/陽離子/);
 await page.locator('[data-topic="5"] .concept-check>summary').click();await page.locator('[data-topic-quiz="5"] [name=topic-answer][value="1"]').check();await page.locator('[data-topic-quiz="5"] button').click();assert.match(await page.locator('[data-topic-quiz="5"] [data-topic-feedback]').innerText(),/正確/);
 const source=await context.newPage();await source.goto(base+'/source/367');await source.locator('img').waitFor();assert.ok(await source.locator('img').evaluate(img=>img.complete&&img.naturalWidth>0));await source.close();
 await page.locator('[data-topic="5"]').screenshot({path:out+'/01-source-learning.png'});checks.push('原文八單元、溶劑交互作用、理解題與原頁圖像');

 await page.locator('[data-jump="demo"]').click();await page.locator('[data-demo-next]').click();await page.bringToFront();
 const donor=page.locator('[data-demo-node=Nu] circle').first(),far=await donor.getAttribute('cx');await page.locator('[data-play]').click();await page.waitForTimeout(450);await page.locator('[data-play]').click();assert.notEqual(await donor.getAttribute('cx'),far);await page.locator('[data-demo-next]').click();
 const before=await page.locator('[data-electron]').first().getAttribute('cx');await page.locator('[data-play]').click();await page.waitForTimeout(450);const after=await page.locator('[data-electron]').first().getAttribute('cx');assert.notEqual(before,after);
 await page.locator('[data-play]').click();const paused=await page.locator('[data-electron]').first().getAttribute('cx');await page.waitForTimeout(150);assert.equal(await page.locator('[data-electron]').first().getAttribute('cx'),paused);
 await page.locator('#part2 [data-view-settings]>summary').click();await page.locator('[data-spot]').click();assert.equal(await page.locator('.spotlight-shade').count(),0);await page.locator('[data-spot]').click();assert.equal(await page.locator('.spotlight-shade').count(),1);
 await page.locator('#part2').screenshot({path:out+'/02-spotlight-electrons.png'});
 await page.locator('[data-demo-type]').selectOption('e2');while(!await page.locator('svg[data-mode=together]').count())await page.locator('[data-demo-next]').click();assert.equal(await page.locator('svg[data-mode=together] [data-electron]').count(),6);
 await page.locator('[data-demo-next]').click();assert.equal(await page.locator('[data-pi-bond]').count(),1);assert.equal(await page.locator('[data-bond=CBr]').count(),0);
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('[data-replay]').click();await page.locator('[data-play]').click();assert.match(await page.locator('[data-play]').innerText(),/播放/);await page.emulateMedia({reducedMotion:'no-preference'});checks.push('電子移動、暫停、聚光燈開關、E2同步與產物鍵、減少動態');

 for(const[k,examples]of Object.entries(REACTION_EXAMPLES)){
  await page.locator('[data-demo-type]').selectOption(k);assert.equal(await page.locator('[data-example] option').count(),4);
  for(let i=0;i<examples.length;i++){
   await page.locator('[data-example]').selectOption(String(i));await nextToEnd(page.locator('[data-library-player]'));
   assert.ok((await page.locator('[data-current-focus]').innerText()).includes(examples[i].product),examples[i].id);
  }
 }
 checks.push('SN1／SN2／E1／E2 各四例共16例逐段播放到正確產物，例子由下拉切換');

 await page.locator('[data-jump="reason"]').click();
 await openSection(page,4);await page.route('**/api/hint',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'}));
 await page.locator('[data-reason-hint="4"]').click();await page.waitForFunction(()=>document.querySelector('[data-hint-box="4"]')?.textContent.includes('離線電子診斷'));await page.unroute('**/api/hint');
 for(let i=0;i<6;i++){
  await page.locator('[data-practice-case]').selectOption(String(i));await answer(page,COURSE_CASES[i]);assert.match(await page.locator('.report-total').innerText(),/100/);
 }
 await page.locator('[data-reasoning] .feedback-box').last().screenshot({path:out+'/03-reasoning-report.png'});
 await page.locator('[data-practice-case]').selectOption('0');await openSection(page,4);const svgBefore=await page.locator('.geometry-host svg').innerHTML();await page.locator('[data-rotate-left]').click();assert.notEqual(await page.locator('.geometry-host svg').innerHTML(),svgBefore);
 await page.reload();assert.match(await page.locator('.report-total').innerText(),/100/);checks.push('六關以真實選單繪製完整機構與三維保存取得100，視角旋轉及重載保留');
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:1000});
  for(const view of ['learn','pk']){await page.locator(`[data-page="${view}"]`).click();if(view==='learn')await openSection(page,4);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${width} ${view}`);}
 }
 await page.setViewportSize({width:1440,height:1000});await page.locator('[data-page="pk"]').click();await page.locator('[name=size]').selectOption('1');await page.locator('[data-create-room]').click();await page.waitForSelector('[data-open-seat="A1"]');assert.equal(await page.locator('[data-open-seat]').count(),2);
 const host=page,id=new URL(host.url()).searchParams.get('room'),students=[];
 for(const s of ['A1','B1']){const p=await context.newPage();p.setDefaultTimeout(10000);await p.goto(base+`/academy.html?room=${id}&seat=${s}`);students.push(p);}
 await host.locator('[data-action=start]').click();
 for(let round=0;round<6;round++){
  const c=COURSE_CASES[round];
  for(const p of students){await p.waitForSelector('[data-seen]');for(const demo of await p.locator('[data-student-demo]').all())await nextToEnd(demo);await p.locator('[data-seen]').click();}
  await host.locator('[data-action=individual]').waitFor({state:'visible'});await host.locator('[data-action=individual]').click();
  await Promise.all(students.map(async(p,i)=>{await p.waitForSelector('[data-reason-step]');await answer(p,c,{wrong:round===0&&i===0,submit:false});}));
  await Promise.all(students.map(p=>p.locator('[data-reason-submit]').click()));
  await host.locator('[data-action=consensus]').click();
  await Promise.all(students.map(async p=>{await p.waitForSelector('[data-consensus-work] [data-reason-step]');await answer(p,c,{submit:false});}));
  assert.equal(await host.locator('.pk-results').count(),0);
  await Promise.all(students.map(p=>p.locator('[data-reason-submit]').click()));await Promise.all(students.map(p=>p.getByText('小組首次共識已提交，等待另一隊與教師共同揭曉。',{exact:true}).waitFor()));await host.locator('[data-action=reveal]').click();
  await students[0].waitForSelector('.pk-results');
  if(round===0){
   assert.match(await host.locator('.pk-results').innerText(),/94\.0/);assert.match(await host.locator('.pk-results').innerText(),/100\.0/);
   await students[0].locator('[data-correct]').click();await openSection(students[0],0);await students[0].locator('[name="reason-0"][value="1"]').check();await openSection(students[0],5);await students[0].locator('[data-reason-submit]').click();await students[0].waitForSelector('.achievement');
   const r=await host.evaluate(async id=>(await import('./pk-state.js')).loadRoom(id),id);assert.equal(r.individual[0].A1.score,90);assert.equal(r.corrections[0].A1.score,100);assert.match(await host.locator('.pk-results').innerText(),/94\.0/);
   await host.screenshot({path:out+'/04-pk-reveal.png',fullPage:true});
  }
  await host.locator('[data-action=next]').click();
 }
 await host.getByText('六關活動已完成。',{exact:true}).waitFor();assert.match(await host.locator('.pk-results').innerText(),/594\.0/);assert.match(await host.locator('.pk-results').innerText(),/600\.0/);
 const data=await host.evaluate(async id=>(await import('./pk-state.js')).loadRoom(id),id);assert.equal(data.phase,'finished');assert.equal(Object.keys(data.individual).length,6);
 for(let i=0;i<students.length;i++){const p=students[i];await p.locator('[data-pk-exit] summary').click();for(let q=0;q<3;q++)await p.locator(`[name="exit-${q}"][value="${i===0?[0,1,1][q]:[1,0,0][q]}"]`).check();await p.locator('[data-exit-form] button').click();await p.waitForFunction(()=>document.querySelector('[data-exit-result]')?.textContent.includes('首次'));}
 const exits=await host.evaluate(async id=>(await (await import('./pk-state.js')).loadRoom(id)).exits,id);assert.equal(exits.A1.score,3);assert.equal(exits.B1.score,0);
 checks.push('兩學生與教師多分頁：六關同步、並發提交、60/40計分、揭曉前隱藏分數、修正不回灌、個別出口題');
 const dl=host.waitForEvent('download');await host.locator('[data-export-room]').click();const download=await dl;await download.saveAs(out+'/pk-export.json');assert.equal(JSON.parse(await fs.readFile(out+'/pk-export.json','utf8')).exits.A1.score,3);
 await host.reload();assert.match(await host.locator('.pk-results').innerText(),/594\.0/);await host.setViewportSize({width:390,height:844});assert.equal(await host.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await host.screenshot({path:out+'/05-pk-mobile.png',fullPage:true});
 const isolated=await browser.newContext();await isolated.addInitScript(()=>{Object.defineProperty(Storage.prototype,'setItem',{value(){throw new Error('denied');}});});const blocked=await isolated.newPage();await blocked.goto(base+'/academy.html#pk');await blocked.locator('[data-create-room]').click();await blocked.locator('#course-notice').waitFor({state:'visible'});assert.match(await blocked.locator('#course-notice').innerText(),/denied|儲存|storage/i);await isolated.close();
 assert.deepEqual(errors,[]);checks.push('匯出、重載、320–1440px、儲存失敗、無頁面例外');
 const report={passed:true,checks,pageErrors:errors,pkRoom:id};await fs.writeFile(out+'/academy-browser-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}catch(error){await page.screenshot({path:out+'/failure.png',fullPage:true}).catch(()=>{});const diagnostic=[];for(const p of context.pages()){diagnostic.push({url:p.url(),body:await p.locator('body').innerText().catch(()=>''),storage:await p.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('organic-pk')).map(k=>[k,localStorage.getItem(k)]))).catch(()=>({}))});}await fs.writeFile(out+'/failure-state.json',JSON.stringify(diagnostic,null,2));throw error;}
finally{await browser.close();}
