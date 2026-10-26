import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out='/private/tmp/organic-alignment-verification';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[],checks=[];
page.on('pageerror',e=>errors.push(String(e)));
const ok=s=>{checks.push(s);console.log('✓',s);};
try{
 await page.goto(process.env.ORGANIC_URL||'http://127.0.0.1:8768/academy.html');
 await page.evaluate(async()=>{
  const root=document.createElement('main');document.body.replaceChildren(root);window.fixture={root,...await import('./spotlight-demo.js'),...await import('./reaction-examples.js')};
  fixture.mount=(kind,id,mode='overview',step=0)=>{fixture.player?.destroy();const spec=fixture.exampleSpec(kind,fixture.REACTION_EXAMPLES[kind].find(e=>e.id===id)),frames=fixture.spotlightFrames(kind,spec);fixture.player=fixture.mountSpotlight(root,{kind,specOverride:spec,initialState:{version:1,frame:frames.findIndex(f=>f.mode===mode&&f.step===step)}});};
  fixture.mount('sn2','sn2-secondary','focus');
 });
 const alignment=()=>page.evaluate(()=>{
  const model=id=>{const n=document.querySelector(`[data-demo-node="${id}"] circle`);return {x:+n.getAttribute('cx'),y:+n.getAttribute('cy')};},paper=id=>{const n=document.querySelector(`[data-paper-atom="${id}"]`);return {x:+n.dataset.x,y:+n.dataset.y};};
  const result=[];for(const id of ['Br','CB','Me','Nu']){const a=model(id),b=paper(id),c=model('CA'),d=paper('CA'),u={x:a.x-c.x,y:a.y-c.y},v={x:b.x-d.x,y:b.y-d.y};result.push({id,cosine:(u.x*v.x+u.y*v.y)/Math.hypot(u.x,u.y)/Math.hypot(v.x,v.y)});}return result;
 });
 for(const a of await alignment())assert.ok(a.cosine>.98,`${a.id} 相對 Cα 的方向不同：${a.cosine}`);
 ok('使用者的二級 SN2 案例：Br、Cβ、CH₃、親核劑與固定三維視角同向');
 await page.screenshot({path:out+'/sn2-aligned.png',fullPage:true});
 const paperBefore=await page.locator('.paper-canvas').innerHTML();
 await page.locator('.spotlight-canvas').focus();await page.keyboard.press('ArrowRight');
 assert.equal(await page.locator('.paper-canvas').innerHTML(),paperBefore,'自由旋轉不轉動書面式');
 await page.locator('[data-align-paper]').click();
 for(const a of await alignment())assert.ok(a.cosine>.98);
 ok('自由旋轉保留固定書面視角，對齊視角按鈕恢復相對位置');
 await page.evaluate(()=>fixture.mount('sn2','sn2-secondary','together'));
 for(const progress of ['0','50','100']){await page.locator('[data-seek]').evaluate((n,v)=>{n.value=v;n.dispatchEvent(new Event('input'));},progress);for(const a of await alignment())assert.ok(a.cosine>.98,`${progress}% ${a.id}`);}
 ok('SN2 反應進行中及產物端點仍同向，書面移動同步');
 await page.evaluate(()=>fixture.mount('sn1','sn1-water','product'));
 const directions=await page.evaluate(()=>{
  const center=document.querySelector('[data-paper-atom=CA]'),c={x:+center.dataset.x,y:+center.dataset.y},arms=['CB','Me','Me3'].map(id=>{const n=document.querySelector(`[data-paper-atom="${id}"]`);return {x:+n.dataset.x-c.x,y:+n.dataset.y-c.y};});
  return arms.map((v,i)=>{const w=arms[(i+1)%3];return Math.acos((v.x*w.x+v.y*w.y)/Math.hypot(v.x,v.y)/Math.hypot(w.x,w.y))*180/Math.PI;});
 });assert.ok(directions.every(x=>Math.abs(x-120)<.01));
 await page.screenshot({path:out+'/sn1-planar-aligned.png',fullPage:true});
 ok('SN1 平面中間體保留 120°，不因對照退回四面體');
 assert.deepEqual(errors,[]);await fs.writeFile(out+'/report.json',JSON.stringify({checks,errors},null,2));console.log('ALL PASSED');
}catch(e){await page.screenshot({path:out+'/failure.png',fullPage:true}).catch(()=>{});await fs.writeFile(out+'/report.json',JSON.stringify({checks,errors,failure:String(e)},null,2));throw e;}finally{await browser.close();}
