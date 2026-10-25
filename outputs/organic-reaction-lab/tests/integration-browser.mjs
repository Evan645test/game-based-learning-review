import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {examItems} from '../curriculum.js';
import {mechanismSpec} from '../electron-flow.js';
import {REACTION_EXAMPLES} from '../reaction-examples.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('dialog',d=>d.accept());page.setDefaultTimeout(10000);
const out='/private/tmp/organic-integration-verification';await fs.mkdir(out,{recursive:true});
async function arrows(root,kind,correct=true){
 const steps=mechanismSpec(kind).steps;
 for(let i=0;i<steps.length;i++){
  await root.locator(`[data-flow-step="${i}"]`).click();
  for(const a of correct?steps[i].required:[{from:'CBr',to:'CA',electrons:1}]){await root.locator('[data-arrow-from]').selectOption(a.from);await root.locator('[data-arrow-to]').selectOption(a.to);await root.locator('[data-arrow-electrons]').selectOption(String(a.electrons||2));await root.locator('[data-add-arrow]').click();}
  await root.locator('[data-confirm-arrows]').click();
 }
}
async function assessment(form,correct){
 await page.locator('#start-exam').click();
 assert.equal(await page.locator('[data-page=learn]').isDisabled(),true);
 const items=examItems(form);
 for(let i=0;i<items.length;i++){
  const q=items[i];await page.locator(`[name=exam-answer][value="${correct?q.answer:'0'}"]`).check();
  if(q.mechanism){await arrows(page.locator('#exam-arrows'),q.mechanism,correct);assert.equal(await page.locator('#exam-arrows .arrow-product').isVisible(),false);assert.equal(await page.locator('[data-ai-arrows]').count(),0);}
  if(q.spatial){if(correct){await page.locator('[data-angle-number]').fill('180');await page.locator('[data-angle-number]').press('Tab');if(q.spatial==='e2')await page.locator('[data-beta=HB1]').click();}await page.locator('[data-capture]').click();assert.equal(await page.locator('[data-spatial-error]').isVisible(),false);}
  await page.locator('#exam-next').click();
 }
 assert.ok(await page.locator('[data-back-learning]').isVisible());
}
try{
 await page.goto('http://127.0.0.1:8768/index.html');
 await page.waitForURL('**/academy.html');assert.ok(page.url().includes('academy.html'),'舊網址應導向同一套課程，不能留下另一套六關');
 assert.equal(await page.locator('[data-pre-gate]').count(),0,'現在不再要求前測');
 assert.ok(await page.locator('[data-guided-lesson]').isVisible(),'依學習路徑直接提供教材');
 await page.screenshot({path:out+'/01-mobile-learning-entry.png',fullPage:true});
 const legacyRaw=JSON.stringify({version:1,current:0,levels:{},drafts:{},exams:{pre:[{score:43,dimensions:{},answers:{},gradingVersion:'arrows-v1'}]}});
 await page.evaluate(raw=>localStorage.setItem('organic-reaction-lab-v1',raw),legacyRaw);
 assert.equal(await page.locator('[data-pre-gate]').count(),0);
 await page.emulateMedia({reducedMotion:'reduce'});const host=page.locator('[data-guided-lesson]'),topics=[],kinds=['sn1','sn2','e2','e1'];
 for(let unit=0;unit<4;unit++){
  assert.equal(await page.locator('.level-button,[data-practice-case],[data-demo-type],[data-topic-quiz]').count(),0,'不可留下另一份教學或六關入口');
  assert.equal(await host.locator('[data-prediction]').count(),0,'新單元先說明再預測');assert.match(await host.locator('[aria-current=step]').innerText(),/1.*說明/s);
  while(await host.locator('[data-course-topic]').count()){
   const id=await host.locator('[data-course-topic]').getAttribute('data-course-topic');topics.push(id);
   if(id==='solvent'){await host.locator('[data-ion]').selectOption('cation');await host.locator('[data-solvent]').selectOption('aprotic');assert.match(await host.locator('[data-solvation-text]').innerText(),/陽離子/);}
   await host.locator('[data-guide-next]').click();
  }
  while(!await host.locator('[data-concept-next]').isDisabled())await host.locator('[data-concept-next]').click();await host.locator('[data-guide-next]').click();
  assert.match(await host.locator('[aria-current=step]').innerText(),/2.*預測/s);
  if(unit===0){await page.reload();assert.ok(await host.locator('[data-prediction]').isVisible());await host.locator('[data-return-explanation]').click();assert.ok(await host.locator('[data-guide-visual]').isVisible());await host.locator('[data-guide-next]').click();}
  await host.locator('[name=prediction][value="0"]').check();await host.locator('[data-prediction] button').click();assert.match(await host.locator('[aria-current=step]').innerText(),/3.*觀察/s);
  assert.ok(await host.locator('[data-guide-next]').isDisabled());const player=host.locator('[data-guide-player]');
  for(let n=0;n<20&&await host.locator('[data-guide-next]').isDisabled();n++)await player.locator('[data-play]').click();
  assert.equal(await player.locator('svg[data-mode=product]').count(),0);await host.locator('[data-guide-next]').click();
  await host.locator('[name=product][value="0"]').check();await host.locator('[name=reason][value="0"]').check();await host.locator('[data-inference] button').click();assert.ok(await host.locator('[data-course-check]').isVisible());
  if(unit===0){
   await host.locator('[data-evidence-check]').click();assert.ok(await host.locator('[data-check-feedback]').isVisible());await arrows(host.locator('[data-check-work]'),'sn1');await host.locator('[data-evidence-check]').click();assert.match(await host.locator('[data-check-feedback]').innerText(),/符合/);
   await page.route('**/api/hint',r=>r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline"}'}));await host.locator('[data-check-ai]').click();await host.locator('[data-check-feedback]').filter({hasText:'內建電子提示'}).waitFor();await page.unroute('**/api/hint');
   await host.locator('[data-check-tool="1"]').click();await host.locator('[data-geo-step]').selectOption('1');await host.locator('[data-capture]').click();await host.locator('[data-evidence-check]').click();assert.match(await host.locator('[data-check-feedback]').innerText(),/支持/);await page.waitForTimeout(80);const labels=await host.locator('.geometry-host svg g>text').evaluateAll(ns=>ns.map(n=>parseFloat(getComputedStyle(n).fontSize)*Math.hypot(n.ownerSVGElement.getScreenCTM().a,n.ownerSVGElement.getScreenCTM().b)));assert.ok(labels.length&&labels.every(f=>f>=13.99));const rects=await host.locator('.geometry-host svg g>text').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}));for(let a=0;a<rects.length;a++)for(let b=a+1;b<rects.length;b++){const x=rects[a],y=rects[b];assert.ok(Math.max(0,Math.min(x.x+x.w,y.x+y.w)-Math.max(x.x,y.x))*Math.max(0,Math.min(x.y+x.h,y.y+y.h)-Math.max(x.y,y.y))<1,'手機模型標籤不應互相遮蓋');}await host.screenshot({path:out+'/02-mobile-embedded-check.png'});
  }
  if(unit===2){await host.locator('[data-check-application]').selectOption('extension');assert.equal(await host.locator('[data-course-check]').getAttribute('data-course-check'),'chair');await host.locator('[data-check-tool="1"]').click();await host.locator('[data-geo-chair]').selectOption('axial');await host.locator('[data-geo-beta]').selectOption('H6');await host.locator('[data-capture]').click();await host.locator('[data-evidence-check]').click();assert.match(await host.locator('[data-check-feedback]').innerText(),/支持/);}
  if(unit===3){await host.locator('[data-check-application]').selectOption('extension');assert.ok(await host.locator('[data-condition-check]').isVisible());await host.locator('[name=condition-check][value="0"]').check();await host.locator('[data-compare-check]').click();assert.ok(await host.locator('[data-compare-feedback]').isVisible());}
  await host.locator('[data-guide-next]').click();assert.ok(await host.locator('.guide-result').isVisible());
  await host.locator('[data-browse-examples]').click();assert.equal(await host.locator('[data-unit-example] option').count(),4);
  for(let j=0;j<4;j++){
   await host.locator('[data-unit-example]').selectOption(String(j));await host.locator('[data-replay]').click();let n=0;
   while(!await host.locator('[data-demo-next]').isDisabled()&&n++<30)await host.locator('[data-demo-next]').click();
   assert.ok((await host.locator('[data-current-focus]').innerText()).includes(REACTION_EXAMPLES[kinds[unit]][j].product));
   assert.equal(await host.locator('.spotlight-player').count(),1);
  }
  if(unit===2){
   await host.locator('[data-replay]').click();await host.locator('[data-play]').click();const normal=await host.locator('[data-demo-node=CA] circle').boundingBox();await host.locator('[data-expand]').click();await page.waitForTimeout(150);const larger=await host.locator('[data-demo-node=CA] circle').boundingBox();await fs.writeFile(out+'/magnification.json',JSON.stringify({normal:normal.width,enlarged:larger.width,ratio:larger.width/normal.width}));assert.ok(larger.width>normal.width*1.35);await page.keyboard.press('Escape');assert.equal(await host.locator('dialog').evaluate(n=>n.open),false);
   await host.locator('[data-guide-player]').screenshot({path:out+'/03-mobile-observe.png'});
  }
  await host.locator('[data-guide-next]').click();if(unit<3)await host.locator('[data-guide-next]').click();
 }
 assert.equal(topics.length,8);assert.equal(new Set(topics).size,8);
 await page.reload();assert.ok(await host.locator('.guide-result').isVisible());assert.equal(await page.evaluate(()=>localStorage.getItem('organic-reaction-lab-v1')),legacyRaw);
 for(const[w,h]of [[320,740],[390,844],[844,390],[1280,800]]){await page.setViewportSize({width:w,height:h});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const heights=await host.locator('button:visible').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().height));assert.ok(heights.every(v=>v>=44));}
 await page.setViewportSize({width:390,height:844});await host.locator('[data-course-post]').click();await assessment('post',true);await page.locator('[data-view-records]').click();await page.locator('[data-exam-tab=delay]').click();await assessment('delay',true);await page.locator('[data-view-records]').click();
 const downloaded=page.waitForEvent('download');await page.locator('[data-export-all]').click();const file=await downloaded;await file.saveAs(out+'/export.json');const data=JSON.parse(await fs.readFile(out+'/export.json','utf8'));assert.equal(data.schema,2);assert.equal(data.assessments.filter(r=>r.score===100).length,2);assert.equal(data.browserRecords['organic-reaction-lab-v1'].value.exams.pre[0].score,43);assert.ok(data.selfChecks.sn1);assert.ok(data.learning);
 assert.deepEqual(errors,[]);const report={passed:true,checks:['兩網址直接共用課程入口，不要求前測','學習路徑與進度保留，後測與延後測可選做','四單元均先說明與圖解再預測，八概念唯一位置；回看說明及重載續學可用','四類各四例可用；單一播放器與放大返回','課內SN1實際繪製／空間檢核、AI離線備援、椅式與換條件延伸','後測與延後測各100，評量期間無提示與產物揭曉','首次／未完成分開，舊紀錄原文保留，匯出包括所有版本','320–1280無溢出、主要操作44px，沒有頁面例外'],errors};await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
