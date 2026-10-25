import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}),ctx=await browser.newContext({viewport:{width:390,height:844}}),page=await ctx.newPage(),errors=[];
page.on('pageerror',e=>errors.push(String(e)));page.setDefaultTimeout(7000);
try{
 await page.goto('http://127.0.0.1:8768/index.html');await page.waitForURL('**/academy.html');
 assert.equal(await page.locator('[data-pre-gate]').count(),0,'取消前測後不得擋住學習路徑');
 assert.ok(await page.locator('[data-guided-lesson]').isVisible());
 const out='/private/tmp/organic-no-pre-verification';await fs.mkdir(out,{recursive:true});
 assert.equal(await page.locator('[data-guide-lesson] option').count(),4);assert.match(await page.locator('[data-guide-lesson] option').first().innerText(),/電荷與反應角色/);
 await page.screenshot({path:out+'/01-direct-learning.png',fullPage:true});
 assert.ok(await page.locator('[data-course-topic=polarity]').isVisible(),'先說明鍵極性，再讓學生預測');assert.equal(await page.locator('[data-prediction]').count(),0);await page.locator('[data-guide-next]').click();await page.reload();assert.ok(await page.locator('[data-course-topic=electrophile]').isVisible(),'概念說明進度須保留');
 const old=JSON.stringify({form:'pre',index:3,answers:{},evidence:{},scenes:{},mechanisms:{},notes:{},startedAt:'2026-10-25T12:00:00Z'});
 await page.evaluate(raw=>{sessionStorage.setItem('organic-assessment-tab-v2','cancelled-pre');localStorage.setItem('organic-assessment-v2:draft:cancelled-pre',raw);},old);
 await page.locator('[data-page=assess]').click();assert.equal(await page.locator('[data-exam-tab=pre]').count(),0);assert.equal(await page.locator('.exam-progress').count(),0,'已取消的前測草稿不能再次強迫續作');assert.ok(await page.locator('[data-back-learning]').isVisible());
 await page.locator('#start-exam').click();await page.locator('[name=exam-answer][value="0"]').check();await page.locator('#end-exam').click();await page.locator('#confirm-exam').click();await page.locator('[data-back-learning]').click();assert.ok(await page.locator('[data-course-topic=electrophile]').isVisible());assert.equal(await page.evaluate(()=>localStorage.getItem('organic-assessment-v2:draft:cancelled-pre')),old);
 await page.locator('[data-page=pk]').click();await page.locator('[data-create-room]').waitFor({state:'visible'});assert.ok(await page.locator('[data-create-room]').isVisible(),'PK也不應要求前測');await page.locator('[data-page=learn]').click();
 for(const [width,height]of [[320,740],[390,844],[1280,800]]){await page.setViewportSize({width,height});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('organic-assessment-v2:attempt:')).map(k=>JSON.parse(localStorage[k])).some(r=>r.form==='pre')),false);
 assert.deepEqual(errors,[]);const report={passed:true,checks:['全新瀏覽器兩入口直接進入四單元學習，沒有前測門檻','先概念說明、後預測，重載保留說明位置','取消前測入口；先前前測草稿保留且不強迫恢復','選做後測可提早結束並返回課程，不影響進度','未做前測亦可使用PK；320–1280無溢出'],errors};await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
