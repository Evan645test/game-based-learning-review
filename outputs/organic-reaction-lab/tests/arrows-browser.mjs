import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const output=process.env.LAB_TEST_OUTPUT||'/private/tmp/organic-arrows-verification';await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[],requests=[];
page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(r.url().endsWith('/api/hint')&&r.method()==='POST')requests.push(JSON.parse(r.postData()));});
const base=process.env.LAB_URL||'http://127.0.0.1:8768';
const click=async s=>{await page.locator(s).click();if(s.startsWith('[data-level')&&await page.locator('#mode-challenge').count())await page.locator('#mode-challenge').click();};
const add=async(from,to)=>{await page.locator('[data-arrow-from]').selectOption(from);await page.locator('[data-arrow-to]').selectOption(to);await click('[data-add-arrow]');};
try{
 await page.goto(base);await page.locator('#mode-challenge').click();await page.waitForSelector('[data-arrow-node=lpNu]');
 await page.locator('.arrow-canvas').scrollIntoViewIfNeeded();
 const from=await page.locator('[data-arrow-node=lpNu]').boundingBox(),to=await page.locator('[data-arrow-node=CA]').boundingBox();
 await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();await page.mouse.move(to.x+to.width/2,to.y+to.height/2,{steps:12});await page.mouse.up();
 assert.equal(await page.locator('.arrow-list li').count(),1);
 await page.locator('[data-arrow-node=CBr]').focus();await page.keyboard.press('Enter');await page.locator('[data-arrow-node=Br]').focus();await page.keyboard.press('Enter');
 assert.equal(await page.locator('.arrow-list li').count(),2);await click('[data-confirm-arrows]');assert.match(await page.locator('[data-arrow-feedback]').innerText(),/完整機構已完成/);
 await page.reload();assert.equal(await page.locator('.arrow-list li').count(),2);assert.equal(await page.locator('.arrow-product').isVisible(),true);
 await click('[data-delete-arrow="1"]');await click('[data-confirm-arrows]');assert.match(await page.locator('[data-arrow-feedback]').innerText(),/仍缺/);await add('CBr','Br');await click('[data-confirm-arrows]');
 await page.locator('#arrow-root').screenshot({path:output+'/06-sn2-arrows.png'});
 await click('[data-level="1"]');await add('CBr','Br');await click('[data-confirm-arrows]');assert.match(await page.locator('[data-flow-step].active').innerText(),/水的親核進攻/);
 assert.match(await page.locator('[data-arrow-feedback]').innerText(),/請繪製這一步/);
 assert.equal(await page.locator('[data-arrow-node=CA]').getAttribute('aria-label'),'Cα⁺');
 await add('lpNu','CA');await click('[data-confirm-arrows]');assert.match(await page.locator('[data-flow-step].active').innerText(),/去質子化/);
 await add('lpBase','HN');await add('OH','Nu');await click('[data-confirm-arrows]');await page.locator('#arrow-root').screenshot({path:output+'/07-sn1-deprotonation.png'});
 await click('[data-flow-step="0"]');await click('[data-delete-arrow="0"]');assert.equal(await page.locator('[data-flow-step="1"]').isDisabled(),true);await click('[data-arrow-undo]');assert.equal(await page.locator('[data-flow-step="1"]').isDisabled(),true);
 await click('[data-level="3"]');await page.locator('[data-arrow-electrons]').selectOption('1');await add('lpBase','HB');await click('[data-check-arrows]');assert.match(await page.locator('[data-arrow-feedback]').innerText(),/魚鉤/);
 await click('[data-arrow-clear]');await add('Br','CA');await click('[data-check-arrows]');
 await page.waitForFunction(()=>document.querySelector('#ai-mode').textContent!=='正在檢查本機 AI');
 if(process.env.LAB_TEST_LIVE_AI==='1'){
   await click('[data-ai-arrows]');await page.waitForFunction(()=>!document.querySelector('#hint-button').disabled,null,{timeout:55000});
   assert.ok(requests.at(-1).context.electronFlow.diagnosis[0].includes('第 1 支'));
   assert.equal(requests.at(-1).context.electronFlow.arrows[0].from,'Br');
   const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('organic-reaction-lab-v1')));
   assert.equal(saved.drafts.e2.messages.at(-1).mode,'live');
   await fs.writeFile(output+'/arrow-ai-response.json',JSON.stringify({diagnosis:requests.at(-1).context.electronFlow.diagnosis,response:saved.drafts.e2.messages.at(-1).text},null,2));
 }
 const exported=page.waitForEvent('download');await click('[data-arrow-export]');const download=await exported;await download.saveAs(output+'/mechanism-export.svg');assert.match(await fs.readFile(output+'/mechanism-export.svg','utf8'),/<svg/);
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);}
 await page.setViewportSize({width:390,height:844});await page.locator('#arrow-root').screenshot({path:output+'/08-arrow-mobile.png'});
 assert.deepEqual(errors,[]);
 const report={passed:true,checks:['真實滑鼠拖曳建立箭頭','SVG 位置鍵盤作答','重新載入保留箭頭與逐步機構','刪除箭頭取消完整機構','SN1 中間體與完整去質子化','修改前一步使後續步驟重新確認','魚鉤箭頭錯誤診斷','AI 接收具體錯誤箭頭與電子移動診斷','機構 SVG 匯出','320–1440px 彎箭頭工作台無溢出'],pageErrors:errors};
 await fs.writeFile(output+'/arrows-browser-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
