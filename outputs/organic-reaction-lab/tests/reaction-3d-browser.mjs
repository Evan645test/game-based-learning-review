import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {REACTION_EXAMPLES} from '../reaction-examples.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out='/private/tmp/organic-reaction-3d-verification';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const ctx=await browser.newContext({viewport:{width:1440,height:1100}}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
const checkVisible=async()=>{const positions=await svg.locator('[data-demo-node]>circle').evaluateAll(ns=>ns.map(n=>({x:Number(n.getAttribute('cx')),y:Number(n.getAttribute('cy')),r:Number(n.getAttribute('r'))})));for(const p of positions)assert.ok(p.x-p.r>0&&p.x+p.r<650&&p.y-p.r>0&&p.y+p.r<410,JSON.stringify(p));};
let svg;
try{
 await page.goto('http://127.0.0.1:8768/academy.html#part1');await page.locator('[data-jump="demo"]').click();
 assert.equal(await page.locator('#part2 [data-view-reset]').count(),1,'動畫需提供三維攝影機重設');
 svg=page.locator('#part2 svg.spotlight-canvas');assert.equal(await svg.getAttribute('data-renderer'),'xyz-ball-stick');
 const xyz=await svg.locator('[data-demo-node]').evaluateAll(ns=>ns.map(n=>JSON.parse(n.dataset.xyz)));assert.ok(xyz.some(p=>Math.abs(p[2])>.1));
 await page.locator('[data-demo-next]').click();const atom=svg.locator('[data-demo-node=Nu] circle').first(),far=await atom.getAttribute('cx');await page.locator('[data-seek]').fill('100');assert.notEqual(await atom.getAttribute('cx'),far);
 await page.locator('[data-demo-next]').click();const e0=await svg.locator('[data-electron]').first().getAttribute('cx');await page.locator('[data-play]').click();await page.waitForTimeout(400);await page.locator('[data-play]').click();assert.notEqual(await svg.locator('[data-electron]').first().getAttribute('cx'),e0);await page.locator('[data-replay]').click();await page.locator('[data-demo-next]').click();await page.locator('[data-seek]').fill('100');
 await page.locator('#part2 [data-view-settings]>summary').click();const before=await svg.locator('[data-demo-node=Br] circle').first().getAttribute('cx');await page.locator('#part2 [data-view-orbit="right"]').click();assert.notEqual(await svg.locator('[data-demo-node=Br] circle').first().getAttribute('cx'),before);assert.equal(await page.locator('[data-seek]').inputValue(),'100');await page.locator('#part2 [data-view-reset]').click();
 await svg.focus();const camera=await svg.getAttribute('data-yaw');await page.keyboard.press('ArrowRight');assert.notEqual(await svg.getAttribute('data-yaw'),camera);
 await svg.scrollIntoViewIfNeeded();const box=await svg.boundingBox();await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.65,box.y+box.height*.6,{steps:6});await page.mouse.up();await page.locator('#part2 [data-view-reset]').click();
 for(const [kind,examples]of Object.entries(REACTION_EXAMPLES))for(const [exampleIndex,example] of examples.entries()){
  await page.locator('[data-demo-type]').selectOption(kind);await page.locator('[data-example]').selectOption(String(exampleIndex));await page.locator('[data-replay]').click();
  await checkVisible();let frames=0;while(!await page.locator('[data-demo-next]').isDisabled()){
   if(['together','transform'].includes(await svg.getAttribute('data-mode'))){await page.locator('[data-seek]').fill('50');const n=await svg.locator('[data-electron]').count();assert.ok(n>=2,example.id);const ps=await svg.locator('[data-electron]').evaluateAll(ns=>ns.map(n=>n.getAttribute('cx')));await page.locator('[data-seek]').fill('80');assert.notDeepEqual(await svg.locator('[data-electron]').evaluateAll(ns=>ns.map(n=>n.getAttribute('cx'))),ps);}
   await page.locator('[data-demo-next]').click();await checkVisible();frames++;
  }
  assert.match(await page.locator('[data-current-focus]').innerText(),new RegExp(example.product.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));assert.ok(frames>=5);assert.equal(await svg.locator('[data-bond=CBr]').count(),0);
 }
 await page.locator('[data-demo-type]').selectOption('e2');await page.locator('[data-replay]').click();while(await svg.getAttribute('data-mode')!=='together')await page.locator('[data-demo-next]').click();await page.locator('[data-seek]').fill('50');assert.equal(await svg.locator('[data-electron]').count(),6);assert.ok(Number(await svg.locator('[data-bond=CBr]').first().getAttribute('opacity'))<1);await page.locator('#part2').screenshot({path:out+'/01-e2-3d.png'});
 await page.locator('[data-demo-next]').click();assert.equal(await svg.locator('[data-demo-node=HB]').count(),1);assert.equal(await svg.locator('[data-bond=formingOH]').count(),1);assert.equal(await svg.locator('[data-pi-bond=CC]').count(),1);
 await page.locator('#part2 [data-view-settings]>summary').click();await page.locator('#part2 [data-show-hydrogens]').check();await checkVisible();assert.ok(await svg.locator('[data-spectator-h]').count()>5);
 await page.setViewportSize({width:390,height:844});await page.locator('#part2').screenshot({path:out+'/02-mobile-3d.png'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('[data-replay]').click();await page.locator('[data-play]').click();assert.equal(await svg.getAttribute('data-mode'),'approach');assert.match(await page.locator('[data-play]').innerText(),/播放/);
 assert.deepEqual(errors,[]);await fs.writeFile(out+'/report.json',JSON.stringify({passed:true,examples:16,errors,checks:['XYZ球棍','接近','鍵結漸變','電子動畫','質子轉移','旋轉拖曳鍵盤','16例','手機','減少動態']},null,2));
}finally{await browser.close();}
