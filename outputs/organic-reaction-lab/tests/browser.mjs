import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const out=process.env.LAB_TEST_OUTPUT || '/private/tmp/organic-lab-verification';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
const base=process.env.LAB_URL || 'http://127.0.0.1:8768';
const checks=[];
const capture=async name=>{await page.screenshot({path:out+'/'+name+'.png',fullPage:true});};
const click=async selector=>{await page.locator(selector).click();if(selector.startsWith('[data-level')&&await page.locator('#mode-challenge').count())await page.locator('#mode-challenge').click();};
async function angle(value){const el=page.locator('[data-angle-number]');await el.fill(String(value));await el.press('Tab');}
async function flowArrow(from,to){
  await page.locator('[data-arrow-from]').selectOption(from);await page.locator('[data-arrow-to]').selectOption(to);await click('[data-add-arrow]');
}
async function drawFlow(kind){
  const stages=kind==='sn1'?[[['CBr','Br']],[['lpNu','CA']],[['lpBase','HN'],['OH','Nu']]]:kind==='e1'?[[['CBr','Br']],[['lpBase','HB'],['CH','CC']]]:kind==='sn2'?[[['lpNu','CA'],['CBr','Br']]]:[[['lpBase','HB'],['CH','CC'],['CBr','Br']]];
  for(const stage of stages){for(const[from,to]of stage)await flowArrow(from,to);await click('[data-confirm-arrows]');}
}
async function answer(values){
  const index=Number(await page.locator('.level-button.active').getAttribute('data-level'));await drawFlow(['sn2','sn1','e1','e2','chair','e2'][index]);
  for(const [name,value]of Object.entries(values)){
    for(const option of Array.isArray(value)?value:[value]) await page.locator(`#answer-form input[name="${name}"][value="${option}"]`).check();
  }
  await click('#answer-form button[type=submit]');
  assert.match(await page.locator('#grade-response').innerText(),/任務完成.*10／10/);
}
try{
  await page.goto(base);await page.locator('#mode-challenge').click();await page.waitForSelector('.molecule-svg');
  await page.waitForFunction(()=>document.querySelector('#ai-mode').textContent!=='正在檢查本機 AI');
  if((await page.locator('#ai-mode').innerText()).includes('本機 AI 已連接')){
    await page.locator('.ai-panel summary').click();await click('#connect-ai');await page.locator('.ai-panel summary').click();
  }
  assert.equal(await page.locator('[data-level]').count(),6);
  await capture('01-desktop');
  await flowArrow('Br','CA');await click('[data-check-arrows]');assert.match(await page.locator('[data-arrow-feedback]').innerText(),/第 1 支.*電子來源/);
  await click('[data-arrow-undo]');assert.equal(await page.locator('.arrow-list li').count(),0);await click('[data-arrow-redo]');assert.equal(await page.locator('.arrow-list li').count(),1);await click('[data-arrow-clear]');
  checks.push('彎箭頭錯誤來源診斷、復原重做與清除');
  await click('[data-capture]');assert.equal(await page.locator('[data-spatial-error]').isVisible(),true);
  const before=await page.locator('[data-measure]').innerText();await click('[data-rotate=left]');assert.equal(await page.locator('[data-measure]').innerText(),before);
  await click('#hint-button');assert.match(await page.locator('#hint-count').innerText(),/1\/3/);assert.match(await page.locator('#ai-mode').innerText(),/離線/);
  await angle(180);await click('[data-capture]');
  await answer({mechanism:'SN2',reasons:['nuc','solvent'],sequence:'concerted-sub',product:'inversion',competition:'minor'});
  checks.push('SN2：無效幾何阻擋、旋轉視角不改構形、提示與成功過關');
  await click('[data-level="1"]');await click('[data-step="1"]');await click('[data-face=back]');await click('[data-capture]');
  await answer({mechanism:'SN1',reasons:['tertiary','water'],sequence:'cation-sub',product:'alcohol',competition:'e1'});
  await click('[data-level="2"]');await click('[data-step="1"]');await click('[data-beta=Hethyl]');await click('[data-capture]');
  await answer({mechanism:'E1',reasons:['cation','weak'],sequence:'cation-elim',product:'more',competition:'sn1'});
  await click('[data-level="3"]');await click('[data-beta=HB1]');await angle(180);await click('[data-view=newman]');
  await capture('02-newman');await click('[data-capture]');
  await answer({mechanism:'E2',reasons:['base','secondary'],sequence:'concerted-elim',product:'butenes',competition:'sn2'});
  await click('[data-level="4"]');await click('[data-chair=axial]');await click('[data-beta=H2]');await click('[data-capture]');assert.equal(await page.locator('[data-spatial-error]').isVisible(),true);
  await click('[data-beta=H6]');await click('[data-capture]');await capture('03-chair');
  await answer({mechanism:'E2',reasons:['axial','occupied'],sequence:'concerted-elim',product:'three',competition:'geometry'});
  await click('[data-level="5"]');await angle(180);await click('[data-capture]');await drawFlow('sn2');await click('#case-b');await click('[data-beta=HB1]');await angle(180);await click('[data-capture]');
  await answer({mechanism:'SN2 → E2',reasons:['a','b'],sequence:'two',product:'different',competition:'limited'});
  checks.push('六關 10/10；SN1 雙面觀察、E1 指定 β-H、椅式錯誤氫阻擋、比較關雙證據');
  await page.reload();assert.equal(await page.locator('.level-button.passed').count(),6);
  assert.match(await page.locator('.sidebar-foot').innerText(),/6／6/);
  await click('[data-level="0"]');assert.match(await page.locator('#hint-count').innerText(),/1\/3/);
  checks.push('重新載入保留六關過關、草稿、提示及首次紀錄');
  for(const width of [320,375,390,768,1024,1440]){
    await page.setViewportSize({width,height:960});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`水平溢出 ${width}`);
  }
  await page.setViewportSize({width:390,height:844});await capture('04-mobile');await page.setViewportSize({width:1440,height:1000});
  checks.push('320–1440px 無水平溢出，桌面／手機與 Newman／椅式截圖');
  await click('#nav-assess');await click('#start-exam');
  const expected=['1','1','1','0','1','1','1','1','1'];
  for(let i=0;i<9;i++){
    if(i===4)await drawFlow('sn2');if(i===5)await drawFlow('e2');
    if(i===6){await angle(180);await click('[data-capture]');}
    if(i===7){await click('[data-beta=HB1]');await angle(180);await click('[data-capture]');}
    await page.locator(`[name=exam-answer][value="${expected[i]}"]`).check();await click('#exam-next');
  }
  assert.match(await page.locator('.result-big').innerText(),/100/);
  await click('#start-exam');await click('#end-exam');await click('#confirm-exam');
  assert.match(await page.locator('.result-big').innerText(),/0/);
  await click('[data-exam-tab=results]');const table=await page.locator('.scores-table').first().innerText();assert.match(table,/課前前測\s+100\s+0\s+2/);
  await capture('05-assessment-results');
  checks.push('獨立前測 100 分、未答 0 分、重測不覆寫首次成績、結果分項');
  await click('[data-exam-tab=post]');await click('#start-exam');
  for(let i=0;i<9;i++){
    if(i===4)await drawFlow('sn2');if(i===5)await drawFlow('e2');
    if(i===6){await click('[data-capture]');assert.equal(await page.locator('[data-spatial-error]').isVisible(),false);assert.equal(await page.locator('[data-status]').innerText(),'已保存觀察紀錄');}
    if(i===7){await click('[data-beta=HB1]');await angle(180);await click('[data-capture]');}
    await page.locator(`[name=exam-answer][value="${expected[i]}"]`).check();await click('#exam-next');
  }
  assert.match(await page.locator('.result-big').innerText(),/95/);
  await click('[data-exam-tab=delay]');await click('#start-exam');
  for(let i=0;i<9;i++){
    if(i===4)await drawFlow('sn2');if(i===5)await drawFlow('e2');
    if(i===6){await angle(180);await click('[data-capture]');}
    if(i===7){await click('[data-beta=HB1]');await angle(180);await click('[data-capture]');}
    await page.locator(`[name=exam-answer][value="${expected[i]}"]`).check();await click('#exam-next');
  }
  assert.match(await page.locator('.result-big').innerText(),/100/);
  checks.push('後測與延後測可獨立完成；錯誤空間證據不即時洩漏正誤，提交後扣操作分');
  await click('#nav-lab');await page.locator('.ai-panel summary').click();
  if(!(await page.locator('#ai-mode').innerText()).includes('本機 AI 已連接')){
    await click('#connect-ai');await page.waitForFunction(()=>!document.querySelector('#connect-ai').disabled);
  }
  assert.match(await page.locator('#ai-mode').innerText(),/本機 AI 已連接|離線分層提示/);
  if(process.env.LAB_TEST_LIVE_AI==='1'){
    assert.match(await page.locator('#ai-mode').innerText(),/本機 AI 已連接/);
    await click('#hint-button');await page.waitForFunction(()=>!document.querySelector('#hint-button').disabled,{timeout:55000});
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('organic-reaction-lab-v1')));
    assert.equal(saved.drafts.sn2.messages.at(-1).mode,'live');
    checks.push('真實本機 Ollama 提示成功，生成文字與離線模式分開標示');
  }
  checks.push('本機 AI 狀態檢查與離線備援介面');
  await click('#nav-guide');const downloadPromise=page.waitForEvent('download');await click('#export-data');const download=await downloadPromise;await download.saveAs(out+'/export.json');
  const exported=JSON.parse(await fs.readFile(out+'/export.json','utf8'));assert.equal(exported.progress.exams.pre[0].score,100);assert.equal(exported.progress.levels.sn2.first.hints,1);
  checks.push('完整 JSON 匯出包含首次答案、提示與評量紀錄');
  const corrupt=await browser.newContext();await corrupt.addInitScript(()=>{localStorage.setItem('organic-reaction-lab-v1','{broken');localStorage.setItem('unrelated-user-data','preserve');});
  const brokenPage=await corrupt.newPage();await brokenPage.goto(base);await brokenPage.locator('#mode-challenge').click();await brokenPage.waitForSelector('.molecule-svg');
  assert.equal(await brokenPage.locator('#storage-notice').isVisible(),true);
  assert.equal(await brokenPage.evaluate(()=>localStorage.getItem('organic-reaction-lab-v1')),'{broken');
  assert.equal(await brokenPage.evaluate(()=>localStorage.getItem('unrelated-user-data')),'preserve');await corrupt.close();
  const blocked=await browser.newContext();await blocked.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new DOMException('blocked','SecurityError');};});
  const blockedPage=await blocked.newPage();await blockedPage.goto(base);await blockedPage.locator('#mode-challenge').click();await blockedPage.waitForSelector('.molecule-svg');
  await blockedPage.waitForFunction(()=>document.querySelector('#ai-mode').textContent!=='正在檢查本機 AI');
  if((await blockedPage.locator('#ai-mode').innerText()).includes('本機 AI 已連接')){
    await blockedPage.locator('.ai-panel summary').click();await blockedPage.locator('#connect-ai').click();
  }
  await blockedPage.locator('#hint-button').click();
  assert.equal(await blockedPage.locator('#storage-notice').isVisible(),true);assert.match(await blockedPage.locator('#ai-message').innerText(),/親核/);await blocked.close();
  checks.push('受損進度保留原始資料；儲存被拒時仍可操作與使用提示');
  assert.deepEqual(errors,[]);
  const result={passed:true,checks,browser:'Chrome / Playwright',screenshots:out,pageErrors:errors};await fs.writeFile(out+'/browser-report.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}
