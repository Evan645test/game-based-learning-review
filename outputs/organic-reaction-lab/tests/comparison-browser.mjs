// In-memory test page at ORGANIC_URL; every module and stylesheet is served by
// this worktree's real whitelist server. No course screen is modified or mounted.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.ORGANIC_URL || 'http://127.0.0.1:8770/academy.html';
const out = '/private/tmp/organic-compare-verification';
await fs.mkdir(out, {recursive: true});
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true
});
const context = await browser.newContext({viewport: {width: 1280, height: 1000}});
const page = await context.newPage(), errors = [], checks = [];
page.on('pageerror', error => errors.push(String(error)));
const ok = name => {checks.push(name); console.log('✓', name);};
const host = () => page.locator('[data-comparison]').first();
const button = () => host().locator('[data-comparison-play]');
const pending = () => page.evaluate(() => window.rafAudit.pending.size);
const stats = () => page.evaluate(() => ({
  requested: window.rafAudit.requested, executed: window.rafAudit.executed,
  pending: window.rafAudit.pending.size
}));
async function load(id, count = 1) {
  await page.evaluate(({id, count}) => {
    window.cleanupComparison?.();
    document.querySelector('main').innerHTML = Array.from({length: count},
      () => window.comparisonModule.comparisonHTML(id)).join('');
    window.cleanupComparison = window.comparisonModule.mountComparison(document.querySelector('main'));
  }, {id, count});
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(80);
}
async function noOverflow() {
  const overflow = await page.evaluate(() => ({
    page: document.documentElement.scrollWidth > innerWidth,
    components: [...document.querySelectorAll('[data-comparison], .comparison-panel')].some(e => e.scrollWidth > e.clientWidth + 1)
  }));
  assert.deepEqual(overflow, {page: false, components: false});
}
async function stable() {
  const before = await stats();
  await page.waitForTimeout(180);
  assert.deepEqual(await stats(), before);
  assert.equal(before.pending, 0);
}
try {
  for (const file of ['comparisons.js', 'comparison-view.js', 'comparison.css']) {
    const response = await page.request.get(new URL(file, base).href);
    assert.equal(response.status(), 200, `${file} is whitelisted`);
  }
  await page.route(base, route => route.fulfill({status: 200, contentType: 'text/html', body:
    '<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>比較動畫獨立驗收</title><link rel="stylesheet" href="./academy.css"><link rel="stylesheet" href="./comparison.css"></head><body class="academy"><main></main><div style="height:1200px" aria-hidden="true"></div></body></html>'}));
  await page.goto(base);
  await page.evaluate(async () => {
    const request = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window);
    window.rafAudit = {requested: 0, executed: 0, pending: new Set()};
    window.requestAnimationFrame = callback => {
      window.rafAudit.requested++;
      const id = request(time => {
        window.rafAudit.pending.delete(id); window.rafAudit.executed++; callback(time);
      });
      window.rafAudit.pending.add(id); return id;
    };
    window.cancelAnimationFrame = id => {window.rafAudit.pending.delete(id); cancel(id);};
    window.comparisonModule = await import('./comparison-view.js');
    window.comparisonIds = (await import('./comparisons.js')).COMPARISONS.map(c => c.id);
  });
  const ids = await page.evaluate(() => window.comparisonIds);
  ok('新模組與 CSS 由白名單提供；獨立記憶體測試頁成功載入');

  for (const id of ids) {
    await load(id);
    await button().click();
    await page.waitForFunction(() => Number(document.querySelector('[data-comparison]').dataset.comparisonProgress) >= .45, null, {polling: 50});
    const progress = await host().locator('[data-comparison-model]').evaluateAll(nodes => nodes.map(n => n.dataset.comparisonProgress));
    assert.equal(progress[0], progress[1], 'one clock drives both scenes');
    const loser = host().locator('[data-comparison-model="loser"]');
    assert.equal(await loser.locator('[data-bond="newCN"],[data-bond="formingOH"],[data-pi-bond]').count(), 0);
    await host().screenshot({path: `${out}/${id}-attempt-1280.png`});
    await page.waitForFunction(() => document.querySelector('[data-comparison]').dataset.comparisonProgress === '1.0000', null, {polling: 50});
    assert.equal(await pending(), 0);
    assert.match(await host().locator('[data-comparison-panel="winner"] [data-comparison-caption]').innerText(), /Br⁻/);
    await host().screenshot({path: `${out}/${id}-final-1280.png`});
    ok(`${id}：同步完整播放；嘗試不成鍵；終態停止 RAF`);
  }

  await page.emulateMedia({reducedMotion: 'reduce'});
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({width, height: 1000});
    for (const id of ids) {
      await load(id);
      const before = await stats();
      await button().click();
      assert.deepEqual(await stats(), before, 'reduced motion must not request RAF');
      assert.equal(await host().getAttribute('data-comparison-progress'), '1.0000');
      await noOverflow();
      const rect = await button().boundingBox();
      assert.ok(rect.width >= 44 && rect.height >= 44);
      const panels = await host().locator('[data-comparison-panel]').evaluateAll(nodes =>
        nodes.map(n => {const r = n.getBoundingClientRect(); return {x: r.x, y: r.y};}));
      if (width <= 390) assert.ok(panels[1].y > panels[0].y && panels[1].x === panels[0].x);
      else assert.ok(panels[1].x > panels[0].x && panels[1].y === panels[0].y);
      await host().screenshot({path: `${out}/${id}-reduced-${width}.png`});
    }
    ok(`${width}px：四組無水平溢出、面板排列正確、觸控 ≥44px、減少動態零 RAF`);
  }
  await stable();
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.setViewportSize({width: 1280, height: 1000});
  await load(ids[1]);
  await button().click();
  await page.waitForTimeout(160);
  assert.ok((await stats()).executed > 0);
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.waitForTimeout(100);
  assert.equal(await host().getAttribute('data-comparison-progress'), '1.0000');
  await stable();
  ok('播放中切換系統減少動態：取消 RAF 並直接顯示關鍵幀');

  await page.emulateMedia({reducedMotion: 'no-preference'});
  await load(ids[2]);
  await button().click();
  await page.waitForTimeout(120);
  await page.evaluate(() => {document.body.dataset.artMotion = 'paused';});
  await page.waitForTimeout(80);
  assert.equal(await host().getAttribute('data-comparison-progress'), '1.0000');
  const pausedStats = await stats();
  await button().click();
  assert.deepEqual(await stats(), pausedStats);
  await stable();
  await load(ids[3]);
  await stable();
  assert.equal(await host().getAttribute('data-comparison-progress'), '1.0000');
  ok('body 動態暫停：播放中取消、掛載直接顯示終態、按鍵不請求 RAF');

  await page.evaluate(() => {delete document.body.dataset.artMotion;});
  await load(ids[0]);
  await button().click();
  await page.waitForTimeout(100);
  await button().click();
  const pausedProgress = await host().getAttribute('data-comparison-progress');
  await stable();
  await button().click();
  await page.waitForTimeout(100);
  assert.ok(Number(await host().getAttribute('data-comparison-progress')) > Number(pausedProgress));
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(120);
  assert.equal(await host().getAttribute('data-comparison-playing'), 'false');
  await stable();
  ok('播放／暫停／繼續有效；捲出畫面取消 RAF');

  await load(ids[0]);
  await page.evaluate(() => {
    window.cleanupComparison = window.comparisonModule.mountComparison(document.querySelector('main'));
  });
  await button().click();
  assert.equal(await host().getAttribute('data-comparison-playing'), 'true');
  assert.equal(await pending(), 1, 'remount must have exactly one loop');
  await page.evaluate(() => {window.cleanupComparison(); window.cleanupComparison();});
  await stable();
  await button().click();
  await stable();
  ok('重複掛載只有一個播放迴圈；cleanup 可重複呼叫並移除事件');

  await load(ids[0]);
  await button().click();
  await page.evaluate(() => document.querySelector('main').replaceChildren());
  await page.waitForTimeout(80);
  await stable();
  ok('DOM 移除後自動清理，沒有殘留 RAF');

  await load(ids[0]);
  await button().click();
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {configurable: true, value: true});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await stable();
  await page.evaluate(() => {delete document.hidden;});
  ok('頁面隱藏事件停止播放');

  await load(ids[1], 2);
  const svgIds = await page.locator('[data-comparison-model] [id]').evaluateAll(nodes => nodes.map(n => n.id));
  assert.equal(new Set(svgIds).size, svgIds.length);
  await page.evaluate(() => window.cleanupComparison());
  assert.deepEqual(errors, []);
  ok('同組多實例的 SVG ID 不衝突；pageerror 為空');
  await fs.writeFile(`${out}/results.json`, JSON.stringify({checks, errors, screenshots: out}, null, 2));
  console.log(`Passed ${checks.length} checks; screenshots: ${out}`);
} finally {
  await context.close();
  await browser.close();
}
