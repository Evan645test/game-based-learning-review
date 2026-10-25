import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.LAB_TEST_OUTPUT||'/private/tmp/organic-teaching-verification';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
const base=process.env.LAB_URL||'http://127.0.0.1:8768';
async function demoCaption(){const details=page.locator('[data-teaching-demo] .spotlight-explanation');if(!await details.evaluate(n=>n.open))await details.locator('summary').click();return page.locator('[data-demo-caption]').innerText();}
try{
 await page.goto(base);await page.waitForSelector('.lesson');assert.equal(await page.locator('.work-grid').isVisible(),false);
 assert.match(await page.locator('.reaction-summary').innerText(),/取代/);assert.equal(await page.locator('.reaction-table tbody tr').count(),4);
 await page.screenshot({path:out+'/01-teaching-start.png',fullPage:true});
 await page.locator('[data-teach-stage="1"]').click();const basic=await page.locator('#lesson-content').innerText();
 for(const topic of ['電子','親核劑','親電中心','脫離基','鹼性','I⁻'])assert.ok(basic.includes(topic),topic);
 await page.locator('[data-teach-stage="2"]').click();const solvent=await page.locator('#lesson-content').innerText();
 for(const topic of ['質子性溶劑','非質子性溶劑','acetone','氫鍵','DMSO','DMF'])assert.ok(solvent.includes(topic),topic);
 await page.screenshot({path:out+'/02-solvent-lesson.png',fullPage:true});
 await page.locator('[data-teach-stage="3"]').click();assert.equal(await page.locator('[data-teaching-demo] .arrow-form').isVisible(),false);
 await page.locator('[data-demo-next]').click();assert.match(await demoCaption(),/同一步/);
 await page.locator('[data-demo-next]').click();
 const empty=await page.evaluate(()=>JSON.parse(localStorage.getItem('organic-reaction-lab-v1')));
 assert.equal(empty.drafts.sn2.arrowWorks,undefined);assert.equal(empty.levels.sn2,undefined);
 await page.locator('[data-teach-stage="4"]').click();assert.equal(await page.locator('[data-start-independent]').isDisabled(),true);
 const teaching=page.locator('#teaching-root');
 await teaching.locator('[name=family][value="消去"]').check();await teaching.locator('[name=role][value="與 Cα 成鍵"]').check();await teaching.locator('[name=solvent][value="不像質子性溶劑以強氫鍵包覆 I⁻"]').check();
 await teaching.locator('[data-teaching-check] button[type=submit]').click();assert.match(await teaching.locator('.lesson-check-feedback').innerText(),/脫離基被新的基團取代/);
 await teaching.locator('[data-arrow-from]').selectOption('CBr');await teaching.locator('[data-arrow-to]').selectOption('Br');await teaching.locator('[data-add-arrow]').click();await teaching.locator('[data-confirm-arrows]').click();
 assert.equal(await page.locator('[data-start-independent]').isDisabled(),true);
 await teaching.locator('[name=family][value="取代"]').check();await teaching.locator('[data-teaching-check] button[type=submit]').click();assert.equal(await page.locator('[data-start-independent]').isDisabled(),false);
 await page.screenshot({path:out+'/03-guided-ready.png',fullPage:true});
 await teaching.locator('[data-start-independent]').click();assert.equal(await page.locator('.work-grid').isVisible(),true);assert.equal(await page.locator('#arrow-root .arrow-list li').count(),0);
 let stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('organic-reaction-lab-v1')));assert.equal(stored.levels.sn2,undefined);assert.ok(stored.lessons.sn2.completedAt);
 await page.reload();assert.equal(await page.locator('.work-grid').isVisible(),true);await page.locator('#mode-teach').click();assert.equal(await page.locator('[data-start-independent]').isDisabled(),false);
 for(let i=1;i<6;i++){
   await page.locator(`[data-level="${i}"]`).click();assert.equal(await page.locator('.lesson').isVisible(),true);assert.equal(await page.locator('.work-grid').isVisible(),false);
   await page.locator('[data-teach-stage="2"]').click();assert.match(await page.locator('#lesson-content').innerText(),/溶劑/);
 }
 await page.locator('[data-teach-stage="3"]').click();await page.locator('[data-demo-case="A"]').click();await page.locator('[data-demo-next]').click();assert.match(await demoCaption(),/孤對電子/);
 await page.locator('[data-demo-case="B"]').click();assert.match(await demoCaption(),/三組電子移動/);
 for(const width of [320,390,768,1024,1440]){
   await page.setViewportSize({width,height:1000});for(const stage of [0,1,2,3,4]){await page.locator(`[data-teach-stage="${stage}"]`).click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${width}px stage ${stage}`);}
 }
 await page.setViewportSize({width:390,height:844});await page.locator('[data-teach-stage="0"]').click();await page.screenshot({path:out+'/04-teaching-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);
 const report={passed:true,checks:['新使用者先看到教學與四反應分類','電子／試劑／溶劑概念與各關條件說明','唯讀逐支示範不寫入挑戰答案或得分','概念判斷與引導機構雙條件完成後可進入挑戰','錯誤判斷有解釋，完成機構也不能掩蓋概念錯誤','引導紀錄保留，獨立挑戰維持空白作答','六關均先進入對應教學，A/B 示範可切換','320–1440px 所有教學步驟無水平溢出'],pageErrors:errors};
 await fs.writeFile(out+'/teaching-browser-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
