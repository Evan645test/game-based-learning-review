import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {cardScreen} from './book-navigation.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out='/private/tmp/organic-orbital-verification';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:1000}});
const errors=[],checks=[];
page.on('pageerror',e=>errors.push(String(e)));
const ok=name=>{checks.push(name);console.log('✓',name);};
try{
 await page.goto(process.env.ORGANIC_URL||'http://127.0.0.1:8768/academy.html');
 await cardScreen(page,'hybrid','demo');
 await page.locator('[data-representation="orbital"]').first().click();
 const model=page.locator('.spotlight-canvas').first();
 assert.equal(await model.getAttribute('data-representation'),'orbital');
 assert.equal(await model.locator('[data-hybrid="sp³"][data-orbital="hybrid-major"]').count(),4);
 await page.reload();
 assert.equal(await model.getAttribute('data-representation'),'orbital');
 await page.locator('[data-representation="ball"]').first().click();
 assert.equal(await model.locator('[data-orbital]').count(),0);
 ok('真實暖身入口切換球棍／軌域，重載保留模式');
 await cardScreen(page,'degree','figure');
 await page.locator('.degree-diagram').waitFor();
 for(const width of [320,390,1280]){
  await page.setViewportSize({width,height:1000});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)<=1);
  if(width===390)await page.locator('.degree-diagram').screenshot({path:out+'/degree-390.png'});
 }
 await page.locator('.degree-diagram').screenshot({path:out+'/degree-1280.png'});
 ok('α／β／β-H 與級數圖解可見；320–1280px 無頁面溢出');
 await page.evaluate(async()=>{
  const root=document.createElement('main');root.id='orbital-fixture';document.body.replaceChildren(root);
  window.fixture={root,...await import('./spotlight-demo.js'),...await import('./reaction-examples.js'),...await import('./reaction-3d.js'),...await import('./paper-view.js')};
  window.fixture.mount=(kind,example,step=0,mode='overview')=>{
   const f=window.fixture;f.player?.destroy();const ex=f.REACTION_EXAMPLES[kind].find(e=>e.id===example),spec=f.exampleSpec(kind,ex),frames=f.spotlightFrames(kind,spec);
   const index=frames.findIndex(x=>x.step===step&&x.mode===mode);
   f.player=f.mountSpotlight(f.root,{kind,specOverride:spec,initialState:{version:1,frame:index,orbitals:true},onStateChange:s=>{f.saved=s;}});
  };
  window.fixture.mount('sn1','sn1-water');
 });
 const paper=page.locator('.paper-canvas');
 assert.ok(await paper.locator('[data-paper-stereo="front"]').count()>0);
 assert.ok(await paper.locator('[data-paper-stereo="back"]').count()>0);
 await page.locator('.spotlight-player').screenshot({path:out+'/sp3-wedges.png'});
 const polygon=await model.locator('[data-orbital]').first().getAttribute('points');
 await model.focus();await page.keyboard.press('ArrowRight');
 assert.notEqual(await model.locator('[data-orbital]').first().getAttribute('points'),polygon);
 await page.evaluate(()=>window.fixture.mount('sn1','sn1-water',0,'transform'));
 const atom=paper.locator('[data-paper-atom="Br"]'),before=await atom.getAttribute('data-x');
 const seek=async value=>page.locator('[data-seek]').evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},value);
 await seek('50');const middle=await atom.getAttribute('data-x');await seek('100');
 const end=await atom.getAttribute('data-x');
 assert.notEqual(before,middle);assert.notEqual(middle,end);
 assert.equal(await paper.locator('[data-paper-stereo][data-stereo-from="CA"]').count(),0);
 assert.equal(await model.locator('[data-orbital-atom="CA"][data-hybrid="sp²"][data-orbital^="p-"]').count(),2);
 assert.match(await page.locator('[data-orbital-note]').textContent(),/空 p/);
 assert.equal(await paper.locator('[data-paper-atom="CA"] text').first().textContent(),'Cα⁺');
 await seek('50');assert.match(await page.locator('[data-orbital-note]').textContent(),/過渡態不指定單一混成/);
 const arrow=await paper.locator('[data-paper-arrow]').first().getAttribute('d');await seek('75');
 assert.notEqual(await paper.locator('[data-paper-arrow]').first().getAttribute('d'),arrow);
 await page.evaluate(()=>window.fixture.mount('sn1','sn1-water',0,'product'));
 await page.locator('.spotlight-player').screenshot({path:out+'/sp2-empty-p.png'});
 ok('軌域跟隨旋轉；離解連續移動、彎箭頭跟隨；產物平面化並顯示空 p');
 await page.evaluate(()=>window.fixture.mount('sn2','sn2-secondary',0,'together'));
 await seek('0');const sn2before=await paper.locator('[data-paper-atom="Nu"]').getAttribute('data-x');
 const paperHandedness=async last=>paper.evaluate((svg,last)=>{
  const ids=['Me','CB','CA-H0',last],points=ids.map(id=>{
   const n=svg.querySelector(`[data-paper-atom="${id}"]`),bond=[...svg.querySelectorAll('[data-paper-stereo][data-stereo-from="CA"]')].find(b=>b.dataset.paperBond.split('|').includes(id));
   return [+n.dataset.x,-n.dataset.y,bond?(bond.dataset.paperStereo==='front'?1:-1):0];
  });
  const [a,b,c]=points.slice(0,3).map(p=>p.map((x,i)=>x-points[3][i]));
  return Math.sign(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]));
 },last);
 const handBefore=await paperHandedness('Br');assert.notEqual(handBefore,0);
 await seek('100');const sn2end=await paper.locator('[data-paper-atom="Nu"]').getAttribute('data-x');
 assert.notEqual(sn2before,sn2end);
 assert.equal(await paperHandedness('Nu'),-handBefore,'將離去基換成親核劑後，完整書面構形必須反轉');
 const endPositions=await paper.locator('[data-paper-atom]').evaluateAll(nodes=>nodes.map(n=>[n.dataset.paperAtom,n.dataset.x,n.dataset.y]));
 await page.locator('[data-demo-next]').click();
 assert.deepEqual(await paper.locator('[data-paper-atom]').evaluateAll(nodes=>nodes.map(n=>[n.dataset.paperAtom,n.dataset.x,n.dataset.y])),endPositions,'結構變化 100% 與產物位置應連續');
 ok('SN2 親核劑連續靠近，100% 到產物段落不跳位');
 await page.evaluate(()=>window.fixture.mount('e2','e2-butane',0,'product'));
 assert.equal(await model.locator('[data-orbital^="p-"]').count(),4);
 await page.locator('.spotlight-player').screenshot({path:out+'/alkene-p.png'});
 await page.locator('[data-expand]').click();
 await page.locator('[data-representation="ball"]').click();
 assert.equal(await model.locator('[data-orbital]').count(),0);
 await page.keyboard.press('Escape');
 await page.waitForFunction(()=>document.querySelector('[data-expand]').getAttribute('aria-expanded')==='false');
 assert.equal(await page.locator('[data-expand]').getAttribute('aria-expanded'),'false');
 ok('烯的兩個 p 軌域、放大內切換與 Esc 返回可用');
 const inventory=await page.evaluate(()=>{
  const f=window.fixture;f.player.destroy();f.root.replaceChildren();
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.dataset.paperId='matrix';f.root.append(svg);const checked=[],outside=[];
  for(const width of [270,324,650]){svg.style.width=width+'px';svg.style.height='340px';
  for(const [kind,examples]of Object.entries(f.REACTION_EXAMPLES))for(const ex of examples){
   const spec=f.exampleSpec(kind,ex);
   for(const frame of f.spotlightFrames(kind,spec))for(const progress of [0,.5,1]){
    const scene=f.reactionScene3D(kind,frame.step,frame.mode,progress,spec);f.drawPaper(svg,spec,{frame,progress,scene});
    if(/NaN|Infinity/.test(svg.innerHTML))throw new Error(`${ex.id}/${frame.step}/${frame.mode}: 非有限座標`);
    const bonds=[...svg.querySelectorAll('[data-paper-bond]')];if(new Set(bonds.map(n=>n.dataset.paperBond)).size!==bonds.length)throw new Error('重複書面鍵');
    for(const n of svg.querySelectorAll('[data-paper-atom]')){const b=n.getBBox();if(b.x<0||b.y<0||b.x+b.width>650||b.y+b.height>490)outside.push(`${ex.id}/${frame.step}/${frame.mode}/${progress}:${n.dataset.paperAtom}`);}
    checked.push(`${ex.id}/${frame.step}/${frame.mode}/${progress}`);
   }
  }}return {count:checked.length,outside};
 });
 assert.ok(inventory.count>300);assert.deepEqual(inventory.outside,[],'書面原子與標籤不能超出繪圖區');
 ok(`全部例子／步驟／三個時間點／三種寬度書面式可繪製（${inventory.count} 次）`);
 assert.deepEqual(errors,[]);
 await fs.writeFile(out+'/report.json',JSON.stringify({checks,errors,renderedFrames:inventory.count},null,2));
 console.log('ALL PASSED');
}catch(error){await page.screenshot({path:out+'/failure.png',fullPage:true}).catch(()=>{});throw error;}
finally{await browser.close();}
