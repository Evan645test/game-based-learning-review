// Run against the loopback preview. Every check uses isolated browser storage.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out='/private/tmp/organic-art-verification',base=process.env.ORGANIC_URL||'http://127.0.0.1:8768/academy.html';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const context=await browser.newContext({viewport:{width:1280,height:1000}}),page=await context.newPage(),errors=[],checks=[];
page.on('pageerror',e=>errors.push(String(e)));
const ok=s=>{checks.push(s);console.log('✓',s);};
const view=v=>page.locator(`[data-learning-path][data-view="${v}"]`);
async function settled(){await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(150);}
async function overflow(){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no page overflow');}
async function noButtonOverlap(selector){
 const rects=await page.locator(selector).evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,label:n.getAttribute('aria-label')};}));
 for(const r of rects){assert.ok(r.w>=44&&r.h>=44,`touch target ${r.label}`);}
 for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){
  const a=rects[i],b=rects[j],w=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x),h=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);
  assert.ok(w<=1||h<=1,`overlapping targets ${a.label} / ${b.label}: ${w} x ${h}`);
 }
}
try{
 const response=await page.request.get(new URL('hex-village-atlas.png',base).href);assert.equal(response.status(),200);assert.match(response.headers()['content-type'],/^image\/png/);
 const css=await page.request.get(new URL('village-art.css',base).href);assert.equal(css.status(),200);
 await page.goto(base);await page.locator('[data-explore-name]').waitFor();await settled();await page.screenshot({path:out+'/name-1280.png',fullPage:true});
 await page.locator('[data-name-skip]').click();await view('world').waitFor();await settled();await page.screenshot({path:out+'/world-initial-1280.png',fullPage:true});
 assert.equal(await page.locator('.wide-art').isVisible(),true);assert.equal(await page.locator('.tall-art').isVisible(),false);
 await page.evaluate(async()=>{
  const {freshPath}=await import('./learning-path.js'),s=freshPath();s.explore.at='world';s.warm.checks.skeletal={choice:1,first:true};
  s.explore.seen=Object.fromEntries(['warmup','s1','s2','s3','s4','s5','final'].map(id=>[id,true]));
  localStorage.setItem('organic-path-v3',JSON.stringify(s));
 });
 await page.reload();await view('world').waitFor();await settled();
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('organic-path-v3')));
 for(const width of [320,390,768,899,900,1280,1600]){
  await page.setViewportSize({width,height:width<900?844:1000});await settled();await overflow();
  await noButtonOverlap('[data-island],[data-lighthouse]');
  assert.equal(await page.locator('.wide-art').isVisible(),width>=900);
  const r=await page.locator('[data-world-map]').boundingBox();assert.equal(r.width>r.height,width>=900);
  if([320,390,1280].includes(width))await page.screenshot({path:out+`/world-${width}.png`,fullPage:true});
 }
 ok('七島與燈塔：320–1600px 無水平溢出、點擊區不重疊；900px 切換桌機全景並保留同一組按鈕');
 await page.locator('button[data-art-motion]').click();assert.equal(await page.locator('body').getAttribute('data-art-motion'),'paused');
 assert.equal(await page.locator('.sea-ripple').first().evaluate(n=>getComputedStyle(n).animationName),'none');
 await page.reload();assert.equal(await page.locator('body').getAttribute('data-art-motion'),'paused');await page.locator('button[data-art-motion]').click();
 assert.equal(await page.locator('body').getAttribute('data-art-motion'),'running');
 assert.notEqual(await page.locator('.sea-ripple').first().evaluate(n=>getComputedStyle(n).animationName),'none');
 ok('環境動態可暫停、重載保留偏好，重新開啟後正常動作');
 for(const island of ['warmup','s1','s2','s3','s4','s5','final']){
  await page.setViewportSize({width:320,height:844});await page.locator(`[data-island="${island}"]`).click();await view('island').waitFor();await overflow();await noButtonOverlap('[data-node]');
  const count=await page.locator('[data-concept-building]').count();assert.ok(count>=1);
  const onLand=await page.locator('.hex-island>svg').evaluate(svg=>{const road=svg.querySelector('.village-road'),land=[...svg.querySelectorAll('polygon')],length=road.getTotalLength();for(let i=0;i<=500;i++){const p=road.getPointAtLength(length*i/500);if(!land.some(hex=>hex.isPointInFill(p)))return {at:i,x:p.x,y:p.y};}return true;});
  assert.equal(onLand,true,`行走道路必須全程位於六角地面：${JSON.stringify(onLand)}`);
  const labels=await page.locator('.concept-building .node-label').allTextContents();assert.equal(new Set(labels).size,labels.length,'每個概念都有可區分的建築標籤');
  if(island==='s1'){await page.setViewportSize({width:390,height:844});await settled();await page.screenshot({path:out+'/stage1-390.png',fullPage:true});}
  await page.locator('[data-go-world]').click();
 }
 ok('七島的每個概念／活動各有建築；320px 全部建築點擊區不重疊');
 await page.locator('[data-island="warmup"]').click();await view('island').waitFor();await noButtonOverlap('[data-node]');
 await page.setViewportSize({width:390,height:844});await settled();await overflow();await noButtonOverlap('[data-node]');await page.screenshot({path:out+'/island-390.png',fullPage:true});
 await page.locator('[data-book]').click();await view('book').waitFor();await settled();await overflow();await page.screenshot({path:out+'/book-390.png',fullPage:true});
 await page.locator('[data-book-close]').click();await page.locator('.island-brief [data-node-go]').click();await view('learn').waitFor();
 await settled();await overflow();assert.equal(await page.locator('.village-ambient').count(),1);
 assert.notEqual(await page.locator('.village-ambient i').first().evaluate(n=>getComputedStyle(n).animationName),'none');
 assert.equal(await page.locator('button[data-art-motion]').count(),1);await page.screenshot({path:out+'/learn-390.png',fullPage:true});
 await page.locator('button[data-art-motion]').click();assert.equal(await page.locator('.village-ambient i').first().evaluate(n=>getComputedStyle(n).animationName),'none');
 await page.locator('[data-exit-learn]').click();await page.locator('[data-go-world]').click();
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('organic-path-v3')));assert.deepEqual(after.warm,before.warm);assert.deepEqual(after.stages,before.stages);assert.deepEqual(after.attempts,before.attempts);assert.deepEqual(after.explore.pos,before.explore.pos);assert.equal(after.layout,before.layout);
 ok('概念建築、手冊、學習畫面可正常進出；閱讀保留環境動態，答題與位置資料未被換膚重設');
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();assert.equal(await page.locator('button[data-art-motion]').isDisabled(),true);assert.equal(await page.locator('.sea-ripple').first().evaluate(n=>getComputedStyle(n).animationName),'none');
 ok('系統減少動態時自動停用裝飾動畫，保留完整導航');
 assert.deepEqual(errors,[]);await fs.writeFile(out+'/report.json',JSON.stringify({checks,errors,passed:true,at:new Date().toISOString()},null,2));console.log('ALL PASSED');
}catch(e){await page.screenshot({path:out+'/failure.png',fullPage:true}).catch(()=>{});throw e;}
finally{await browser.close();}
