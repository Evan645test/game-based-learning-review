import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.setDefaultTimeout(5000);
try{
 await page.goto('http://127.0.0.1:8768/academy.html#learn');
 assert.equal(await page.locator('[data-guided-lesson]').count(),1,'學習入口應提供預測→觀察→推理的引導教學');
 assert.equal(await page.locator('[data-guide-panel]:visible').count(),1);
 assert.equal(await page.locator('[data-guide-panel] .spotlight-canvas').count(),0,'預測前不能看到動畫或產物');
 const out='/private/tmp/organic-guided-verification';await fs.mkdir(out,{recursive:true});
 const host=page.locator('[data-guided-lesson]');
 const before=await page.evaluate(()=>localStorage.getItem('organic-course-v1'));
 await host.screenshot({path:out+'/mobile-predict.png'});
 const keys=['charge','donor','target','product'],predictions=[1,0,2,0],products=[2,1,0,2],reasons=[0,2,1,1];
 for(let i=0;i<4;i++){
  assert.ok(await host.locator('[data-prediction]').isVisible());
  await host.locator(`[name=prediction][value="${i===0?0:predictions[i]}"]`).check();await host.locator('[data-prediction] button').click();
  assert.ok(await host.locator('[data-guide-next]').isDisabled());
  while(!await host.locator('[data-concept-next]').isDisabled())await host.locator('[data-concept-next]').click();
  await host.locator('[data-guide-next]').click();
  const player=host.locator('[data-guide-player]'),canvas=player.locator('.spotlight-canvas');
  assert.ok(await host.locator('[data-guide-next]').isDisabled());assert.equal(await host.locator('[data-inference]').count(),0);assert.ok((await player.locator('[data-physical-step]').innerText()).startsWith(['SN1','SN2','E2','E1'][i]));
  if(i===0){
   await player.locator('[data-play]').click();await host.locator('[data-guide-next]').waitFor({state:'visible'});
   await page.waitForFunction(()=>!document.querySelector('[data-guide-next]').disabled,null,{timeout:20000});
  }else{
   await page.emulateMedia({reducedMotion:'reduce'});
   for(let n=0;n<12&&await host.locator('[data-guide-next]').isDisabled();n++)await player.locator('[data-play]').click();
  }
  assert.equal(await canvas.getAttribute('data-mode')==='product',false,'觀察片段不得提前揭曉產物名稱');
  if(i===1){
   await player.locator('[data-expand]').click();assert.ok(await player.locator('dialog').evaluate(n=>n.open));await page.keyboard.press('Escape');assert.equal(await player.locator('dialog').evaluate(n=>n.open),false);
   await player.locator('.spotlight-player').screenshot({path:out+'/mobile-observe.png'});
  }
  await host.locator('[data-guide-next]').click();assert.equal(await host.locator('.spotlight-canvas').count(),0);
  if(i===0){
   await page.reload();assert.ok(await host.locator('[data-inference]').isVisible());
   await host.locator('[name=product][value="0"]').check();await host.locator('[name=reason][value="1"]').check();await host.locator('[data-inference] button').click();assert.ok(await host.locator('[data-guide-feedback]').isVisible());
  }
  await host.locator(`[name=product][value="${products[i]}"]`).check();await host.locator(`[name=reason][value="${reasons[i]}"]`).check();await host.locator('[data-inference] button').click();
  assert.ok(await host.locator('.guide-result').isVisible());
  const record=await page.evaluate(k=>JSON.parse(localStorage.getItem('organic-guided-lesson-v1')).records[k],keys[i]);assert.ok(record.done);if(i===0){assert.equal(record.prediction,0);assert.deepEqual(record.first,{product:0,reason:1});assert.deepEqual(record.latest,{product:2,reason:0});}
  if(i<3)await host.locator('[data-guide-next]').click();
 }
 assert.equal(await page.evaluate(()=>localStorage.getItem('organic-course-v1')),before,'引導歷程不能改動六關或PK成績');
 await host.locator('[data-independent]').click();assert.ok(await page.locator('[data-practice-case]').isVisible());assert.equal(await page.locator('[data-guided-lesson]').count(),0);
 await page.locator('[data-learning-mode=guide]').click();assert.ok(await host.locator('.guide-result').isVisible());
 for(const[w,h]of [[320,740],[390,844],[844,390],[1280,800]]){
  await page.setViewportSize({width:w,height:h});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const sizes=await host.locator('button:visible,select:visible').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().height));assert.ok(sizes.every(h=>h>=44));
 }
 await page.setViewportSize({width:390,height:844});await host.screenshot({path:out+'/mobile-reflect.png'});
 const glossary=host.locator('.course-glossary');await glossary.locator('summary').click();assert.ok((await glossary.innerText()).includes('nucleophile'));assert.ok((await glossary.innerText()).includes('親核劑'));
 await page.evaluate(()=>localStorage.setItem('organic-guided-lesson-v1','{broken'));await page.reload();assert.ok(await host.locator('[data-prediction]').isVisible());await host.locator('[name=prediction][value="0"]').check();await host.locator('[data-prediction] button').click();assert.equal(await page.evaluate(()=>localStorage.getItem('organic-guided-lesson-v1')),'{broken');assert.ok(await host.locator('[data-guide-storage]').isVisible());
 assert.deepEqual(errors,[]);await fs.writeFile(out+'/report.json',JSON.stringify({passed:true,checks:['四任務預測→圖解→指定三維片段→產物及理由','完整播放與減少動態可解鎖，預測前無模型','錯誤提示、首次與修正分開','重載續學、壞資料保留','獨立六關／PK成績不變','放大Escape返回、320–1280無溢出及44px控制','中英詞條來源可查閱'],errors},null,2));console.log('guided flow passed');
}finally{await browser.close();}
