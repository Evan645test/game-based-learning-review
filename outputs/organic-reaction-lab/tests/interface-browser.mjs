import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {WARMUP,COMPETENCIES} from '../course-path.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out='/private/tmp/organic-interface-verification';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[],checks=[];
page.on('pageerror',e=>errors.push(String(e)));page.setDefaultTimeout(10000);
const ok=name=>{checks.push(name);console.log('✓',name);};
const seek=async value=>page.locator('[data-seek]').evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},value);
const pathState=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('organic-path-v3')));
const overflow=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)<=1);
// Reach a card through the explorer's handbook, stay there, then step to the wanted screen ('' read, '三維', '圖解', '即時檢查').
async function cardScreen(id,part=''){
 const lp=page.locator('[data-learning-path]');await lp.waitFor();
 if(await lp.getAttribute('data-view')==='name')await page.locator('[data-name-skip]').click();
 if(await lp.getAttribute('data-view')==='learn')await page.locator('[data-exit-learn]').click();
 await page.locator('[data-book]').click();
 const comp=COMPETENCIES.find(c=>c.cards.includes(id)).id,h=page.locator(`[data-comp-toggle="${comp}"]`);if(await h.getAttribute('aria-expanded')!=='true')await h.click();
 await page.locator(`[data-map-card="${id}"]`).click();await page.locator(`[data-competency] [data-map-go="${id}"]`).click();await page.locator("[data-review-dismiss]").click();
 if(part)while(!(await page.locator('[data-path-panel] .course-part').first().innerText()).includes(part))await page.locator('[data-continue-screen]').click();
}
try{
 await page.goto(process.env.ORGANIC_URL||'http://127.0.0.1:8768/academy.html');
 await cardScreen('hybrid','三維');await page.locator('.spotlight-player').waitFor();
 assert.equal(await page.locator('.spotlight-player').getAttribute('data-view-mode'),'compare');await seek('42');
 await page.locator('[data-continue-screen]').click();await page.locator('[name=warm]').first().check();await page.locator('[data-warm-check] button[type=submit]').click();
 await page.screenshot({path:out+'/student-desktop.png',fullPage:true});
 await page.locator('[data-exit-learn]').click();await page.locator('[data-learning-path][data-view="island"]').waitFor();
 const before=await pathState(),bookmarks=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.startsWith('organic-demo-view-v3:'))));
 assert.equal(await page.locator('.course-header').isVisible(),true,'模式切換在地圖畫面');
 await page.locator('[data-mode=teacher]').click();
 await cardScreen('hybrid');assert.equal(await page.locator('[data-teaching-controls]').count(),1);
 assert.equal(await page.locator('[data-teacher-hint]').first().isVisible(),false);assert.equal(await page.locator('.concept-example').isVisible(),false);
 await page.locator('[data-teach-hint]').click();assert.equal(await page.locator('[data-teacher-hint]').first().isVisible(),true);assert.equal(await page.locator('.concept-example').isVisible(),false);
 await page.locator('[data-teach-result]').click();assert.equal(await page.locator('.concept-example').isVisible(),true);
 await page.locator('[data-continue-screen]').click();await page.locator('.spotlight-player').waitFor();assert.equal(await page.locator('[data-seek]').inputValue(),'0','教師示範不讀學生的觀看進度');
 await page.locator('[data-continue-screen]').click();assert.equal(await page.locator('.concept-quiz').isVisible(),false,'教師示範隱藏學生的檢查表單');
 assert.deepEqual(await pathState(),before);
 await page.locator('[data-exit-learn]').click();await page.locator('[data-go-world]').click();await page.locator('[data-island="s1"]').click();await page.locator('[data-fog-go]').click();
 await page.locator('[data-node="7"]').click();await page.locator('[data-node-sheet] [data-node-go]').click();
 assert.equal(await page.locator('.spotlight-player').count(),1);
 assert.equal(await page.locator('.contrast-answer').first().isVisible(),false);
 assert.equal(await page.locator('[data-predict]').first().isVisible(),false);
 assert.equal(await page.locator('.spotlight-player').getAttribute('data-frame-mode'),'overview');
 await page.screenshot({path:out+'/teacher-question-desktop.png',fullPage:true});
 await page.locator('[data-teach-result]').click();assert.equal(await page.locator('.contrast-answer').first().isVisible(),true);
 await page.locator('[data-watch="1"]').click();assert.equal(await page.locator('.contrast-answer').first().isVisible(),false);
 assert.deepEqual(await pathState(),before);
 const afterBookmarks=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.startsWith('organic-demo-view-v3:'))));assert.deepEqual(afterBookmarks,bookmarks);
 await page.locator('[data-exit-learn]').click();await page.locator('[data-mode=student]').click();const after=await pathState();assert.equal(after.stage,'s1');assert.deepEqual(after.explore.pos.s1,{node:2,screen:0});assert.deepEqual(after.warm.checks,before.warm.checks);assert.deepEqual(after.attempts,before.attempts);assert.deepEqual(after.stages.s1.predictions,{});
 ok('學生／教師共用位置；教師示範、提示、揭示與觀看不覆寫學生答案和書籤');
 await page.locator('[data-mode=teacher]').click();await page.locator('[data-page=assess]').click();assert.equal(await page.locator('[data-assess-student]').count(),1);assert.equal(await page.locator('[data-assessment-host]').count(),0);
 await page.locator('[data-page=learn]').click();assert.equal(await page.locator('[data-learning-path]').getAttribute('data-stage'),'s1');assert.equal(await page.locator('[data-learning-path]').getAttribute('data-view'),'island');
 await page.locator('[data-mode=student]').click();await cardScreen('hybrid','三維');
 assert.equal(await page.locator('[data-seek]').inputValue(),'42');
 ok('教師評量入口不讀取學生答案；返回課程保留位置，學生恢復原觀看進度');
 for(const width of [390,320]){
  await page.setViewportSize({width,height:844});await page.waitForFunction(()=>document.querySelector('.spotlight-player').dataset.viewMode==='three');
  assert.equal(await page.locator('.molecule-stage').isVisible(),true);assert.equal(await page.locator('.paper-stage').isVisible(),false);
  const p=await page.locator('[data-seek]').inputValue();
  await page.locator('[data-display=paper]').click();assert.equal(await page.locator('.molecule-stage').isVisible(),false);assert.equal(await page.locator('.paper-stage').isVisible(),true);assert.equal(await page.locator('[data-seek]').inputValue(),p);
  const labelSize=await page.locator('.paper-canvas').evaluate(svg=>{const t=svg.querySelector('[data-paper-atom] text');return +t.getAttribute('font-size')*svg.getBoundingClientRect().width/650;});assert.ok(labelSize>=13.9,'書面式標示至少14px');
  if(width===390){
   await page.setViewportSize({width:320,height:844});
   await page.waitForFunction(()=>{const svg=document.querySelector('.paper-canvas'),t=svg.querySelector('[data-paper-atom] text');return +t.getAttribute('font-size')*svg.getBoundingClientRect().width/650>=13.9;});
   await page.setViewportSize({width:390,height:844});
  }
  await overflow();await page.locator('.spotlight-player').screenshot({path:out+`/paper-${width}.png`});
  await page.locator('[data-display=compare]').click();const a=await page.locator('.molecule-stage').boundingBox(),b=await page.locator('.paper-stage').boundingBox();assert.ok(b.y>=a.y+a.height-1);await overflow();
  await page.locator('[data-display=three]').click();await page.locator('button[data-representation=orbital]').click();await page.reload();
  assert.equal(await page.locator('.spotlight-player').getAttribute('data-view-mode'),'three');assert.equal(await page.locator('.spotlight-canvas').getAttribute('data-representation'),'orbital');assert.equal(await page.locator('[data-seek]').inputValue(),p);
  await page.locator('.spotlight-player').screenshot({path:out+`/three-${width}.png`});await overflow();
 }
 ok('320／390px 單圖分頁、上下對照、軌域切換與重載保留時間；無水平溢出');
 await page.setViewportSize({width:1280,height:1000});await page.locator('[data-display=compare]').click();
 const a=await page.locator('.molecule-stage').boundingBox(),b=await page.locator('.paper-stage').boundingBox();assert.ok(b.x>=a.x+a.width-1&&Math.abs(a.y-b.y)<1);
 await page.locator('[data-expand]').click();assert.equal(await page.locator('.spotlight-dialog').getAttribute('open'),'');await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement?.matches('[data-expand]'));assert.equal(await page.locator('[data-expand]').evaluate(e=>e===document.activeElement),true);
 ok('桌機並排大圖；放大及 Esc 返回焦點正常');
 // Deterministic animation clock: execute real RAF callbacks without wall-clock sleeps.
 await page.evaluate(async()=>{
  const f={...await import('./spotlight-demo.js'),...await import('./reaction-examples.js')};window.fixture=f;
  const root=document.createElement('main');root.id='interface-fixture';document.body.replaceChildren(root);document.body.dataset.mode='student';f.root=root;
  let serial=0,now=performance.now();const queue=new Map();window.requestAnimationFrame=fn=>{queue.set(++serial,fn);return serial;};window.cancelAnimationFrame=id=>queue.delete(id);
  f.advance=n=>{for(let i=0;i<n;i++){now+=100;const pending=[...queue.values()];queue.clear();pending.forEach(fn=>fn(now));}};
  f.mount=(kind,mode='overview',progress=0)=>{f.player?.destroy();const ex=f.REACTION_EXAMPLES[kind][0],spec=f.exampleSpec(kind,ex);f.frames=f.spotlightFrames(kind,spec);const frame=f.frames.findIndex(x=>x.mode===mode);f.player=f.mountSpotlight(root,{kind,specOverride:spec,initialState:{version:1,frame,progress},onStateChange:s=>{f.state=s;}});};
  f.mount('sn1');
 });
 await page.locator('[data-play]').click();await page.evaluate(()=>fixture.advance(500));
 assert.equal(await page.locator('.spotlight-player').getAttribute('data-frame-mode'),'product');assert.equal(await page.locator('[data-play]').getAttribute('aria-pressed'),'false');
 const checkpoint=await page.evaluate(()=>fixture.state.frame);await page.evaluate(()=>fixture.advance(100));assert.equal(await page.evaluate(()=>fixture.state.frame),checkpoint);
 const angles=await page.locator('.paper-canvas').evaluate(svg=>{
  const pos=id=>{const n=svg.querySelector(`[data-paper-atom="${id}"]`);return {x:+n.dataset.x,y:+n.dataset.y};},c=pos('CA'),arms=['CB','Me','Me3'].map(id=>{const p=pos(id);return {x:p.x-c.x,y:p.y-c.y};});
  return arms.map((v,i)=>{const w=arms[(i+1)%3];return Math.acos(Math.max(-1,Math.min(1,(v.x*w.x+v.y*w.y)/Math.hypot(v.x,v.y)/Math.hypot(w.x,w.y))))*180/Math.PI;});
 });assert.ok(angles.every(x=>Math.abs(x-120)<.1),JSON.stringify(angles));
 await page.locator('.spotlight-player').screenshot({path:out+'/planar-checkpoint.png'});
 await page.locator('[data-play]').click();assert.equal(await page.locator('.spotlight-player').getAttribute('data-frame-mode'),'overview');await page.locator('[data-play]').click();
 ok('SN1 在實際中間體暫停、書面三鍵 120°，繼續進入下一實際步驟');
 await page.evaluate(()=>fixture.mount('sn2','focus',.99));await page.locator('[data-play]').click();await page.evaluate(()=>fixture.advance(3));assert.equal(await page.locator('[data-play]').getAttribute('aria-pressed'),'true');assert.notEqual(await page.locator('.spotlight-player').getAttribute('data-frame-mode'),'product');
 await page.evaluate(()=>fixture.advance(300));assert.equal(await page.locator('.spotlight-player').getAttribute('data-frame-mode'),'product');assert.equal(await page.locator('[data-play]').getAttribute('aria-pressed'),'false');
 await page.evaluate(()=>fixture.mount('sn1','transform',.99));await page.locator('[data-continuous]').check();await page.locator('[data-play]').click();await page.evaluate(()=>fixture.advance(30));assert.equal(await page.locator('[data-play]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('.spotlight-canvas').getAttribute('data-step'),'1');
 ok('SN2 解說焦點不當中間體；連續播放可跨過真實結構端點');
 await page.evaluate(()=>fixture.mount('sn1'));await page.locator('.spotlight-canvas').focus();await page.keyboard.press('ArrowRight');await page.locator('[data-play]').click();await seek('65');await page.evaluate(()=>fixture.advance(100));assert.equal(await page.locator('[data-play]').getAttribute('aria-pressed'),'false');assert.equal(await page.locator('[data-seek]').inputValue(),'65');
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('[data-play]').click();assert.equal(await page.locator('[data-play]').getAttribute('aria-pressed'),'false');
 ok('視角復位中拖動進度會取消播放；減少動態設定維持逐段閱讀');
 assert.deepEqual(errors,[]);await fs.writeFile(out+'/report.json',JSON.stringify({checks,errors},null,2));console.log('ALL PASSED');
}catch(error){await page.screenshot({path:out+'/failure.png',fullPage:true}).catch(()=>{});await fs.writeFile(out+'/report.json',JSON.stringify({checks,errors,failure:String(error),stack:error.stack},null,2));throw error;}finally{await browser.close();}
