import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out='/private/tmp/organic-academy-verification';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(String(e)));const base='http://127.0.0.1:8768';
try{
 await page.goto(base+'/academy.html#part1');assert.equal(await page.locator('.course-header [data-page]').count(),2);assert.equal(await page.locator('.course-section').count(),3);
 await page.locator('[data-concept-group="0"]>summary').click();await page.screenshot({path:out+'/06-integrated-course.png',fullPage:false});
 await page.locator('[data-demo-type]').selectOption('sn2');await page.locator('[data-example]').selectOption('3');
 while(!await page.locator('svg[data-mode=together]').count())await page.locator('[data-demo-next]').click();
 await page.locator('[data-seek]').fill('50');const oldBond=Number(await page.locator('[data-library-player] [data-bond=CBr]').getAttribute('opacity')),newBond=Number(await page.locator('[data-library-player] [data-bond=newCN]').getAttribute('opacity'));assert.ok(oldBond>0&&oldBond<1&&newBond>0&&newBond<1);
 await page.locator('#part2').screenshot({path:out+'/07-approach-and-bond-change.png'});
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await page.locator('#part2').screenshot({path:out+'/08-animation-mobile.png'});await page.setViewportSize({width:1440,height:1000});
 await page.locator('[data-practice-case]').selectOption('3');await page.locator('[data-reason-step="4"]').click();
 const block=page.locator('[data-mechanism-kind=e2]');await block.locator('[data-arrow-from]').selectOption('CBr');await block.locator('[data-arrow-to]').selectOption('CA');await block.locator('[data-add-arrow]').click();
 await page.locator('[data-reason-hint="4"]').click();await page.waitForFunction(()=>{const text=document.querySelector('[data-hint-box="4"]')?.textContent;return text&&!text.startsWith('正在');},null,{timeout:55000});
 const hint=await page.locator('[data-hint-box="4"]').innerText();assert.match(hint,/^本機 AI（/);assert.match(hint,/Br|離去|電子來源|第 1 支/);await fs.writeFile(out+'/course-live-ai.txt',hint);
 const bad=await browser.newContext();await bad.addInitScript(()=>localStorage.setItem('organic-course-v1','{"version":1,"topics":[],"practice":2,"demos":{},"exit":[]}'));
 const corrupted=await bad.newPage();await corrupted.goto(base+'/academy.html#part1');assert.match(await corrupted.locator('#course-notice').innerText(),/原資料保留/);assert.equal(await corrupted.locator('.course-section').count(),3);assert.equal(await corrupted.evaluate(()=>JSON.parse(localStorage.getItem('organic-course-v1')).practice),2);await bad.close();
 assert.deepEqual(errors,[]);const report={passed:true,checks:['單頁三大內容區，僅課程與PK兩個主入口','試劑接近後才成斷鍵，過渡區新舊鍵透明度均介於0與1','390px動畫與內容無溢出','新推理工作台實際本機AI指出錯誤電子移動','損毀的新課程紀錄原樣保留並可繼續練習'],liveAI:hint,pageErrors:errors};await fs.writeFile(out+'/academy-details-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
