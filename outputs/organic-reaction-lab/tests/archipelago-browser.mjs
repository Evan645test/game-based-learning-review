import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');

const out = '/private/tmp/organic-archipelago-verification';
const base = process.env.ORGANIC_URL || 'http://127.0.0.1:8792/archipelago-preview.html';

await fs.mkdir(out, {recursive: true});

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});

const context = await browser.newContext({viewport: {width: 1280, height: 900}});
const page = await context.newPage();
const errors = [];
const checks = [];

page.on('pageerror', error => errors.push(String(error)));

const ok = note => {
  checks.push(note);
  console.log('✓', note);
};

const html = String.raw`<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Archipelago Fixture</title>
  <link rel="stylesheet" href="./archipelago.css" />
  <style>
    body{margin:0;background:#f2f4ea;color:#364b41;font-family:"PingFang TC","Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif}
    main{box-sizing:border-box;width:100%;max-width:1320px;margin:0 auto;padding:10px;display:grid;gap:10px}
    .panel-title{margin:0 0 8px;font-size:.95rem;color:#4e6359}
  </style>
</head>
<body>
  <main>
    <section>
      <p class="panel-title">第一層</p>
      <div id="world"></div>
    </section>
    <section>
      <p class="panel-title">第二層</p>
      <div id="archipelago"></div>
    </section>
  </main>
  <script type="module">
    import {worldMapHTML, archipelagoHTML} from './archipelago-art.js';
    const archipelagos = [
      {id:'prep',name:'先備群島',theme:'prep',state:'done',flag:false,current:false,progress:{done:3,total:3}},
      {id:'alkene',name:'烯的加成群島',theme:'alkene',state:'open',flag:true,current:false,progress:{done:2,total:4}},
      {id:'subelim',name:'取代與消去群島',theme:'subelim',state:'open',flag:false,current:true,progress:{done:1,total:4}},
      {id:'summit',name:'醇與總整理群島',theme:'summit',state:'fog',flag:false,current:false,progress:{done:0,total:2}},
    ];
    const islands = [
      {id:'sn2',name:'SN2',full:'11.2–11.3',state:'done',flag:false,current:false,prep:'ready'},
      {id:'sn1',name:'SN1',full:'11.4–11.5',state:'open',flag:true,current:false,prep:'review'},
      {id:'e2',name:'E2 與 Zaitsev',full:'11.7–11.9',state:'open',flag:false,current:true,prep:null},
      {id:'e1',name:'E1',full:'11.10',state:'fog',flag:false,current:false,prep:null},
    ];
    document.getElementById('world').innerHTML = worldMapHTML({archipelagos, boat:'subelim'});
    document.getElementById('archipelago').innerHTML = archipelagoHTML({
      archipelago:{id:'subelim',name:'取代與消去群島',theme:'subelim',state:'open'},
      islands,
      boat:'e2',
    });
  </script>
</body>
</html>`;

await page.route(base, route => {
  route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: html,
  });
});

async function settled() {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(120);
}

async function noHorizontalOverflow() {
  const isValid = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  assert.equal(isValid, true, '頁面不可有水平溢出');
}

async function noButtonOverlap(selector, label) {
  const rects = await page.locator(selector).evaluateAll(nodes =>
    nodes.map(node => {
      const rect = node.getBoundingClientRect();
      return {
        x: rect.x,
        y: rect.y,
        w: rect.width,
        h: rect.height,
        label: node.getAttribute('aria-label') || node.textContent || 'unknown',
      };
    }),
  );
  for (const rect of rects) {
    assert.ok(rect.w >= 44 && rect.h >= 44, `${label} 觸控區需 >= 44px：${rect.label}`);
  }
  for (let i = 0; i < rects.length; i += 1) {
    for (let j = i + 1; j < rects.length; j += 1) {
      const a = rects[i];
      const b = rects[j];
      const overlapW = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const overlapH = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      assert.ok(overlapW <= 1 || overlapH <= 1, `${label} 按鈕不得重疊：${a.label} / ${b.label}`);
    }
  }
}

try {
  await page.goto(base);
  await page.locator('[data-arch-world]').waitFor();
  await page.locator('[data-archipelago-panel]').waitFor();
  await settled();

  assert.equal(await page.locator('[data-archipelago]').count(), 4);
  assert.equal(await page.locator('[data-island]').count(), 4);
  assert.equal(await page.locator('[data-go-world]').count(), 1);
  ok('成功以 in-memory 頁面渲染雙層地圖');

  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({width, height: width >= 900 ? 900 : 844});
    await settled();
    await noHorizontalOverflow();
    await noButtonOverlap('[data-arch-world] [data-archipelago]', `第一層 ${width}px`);
    await noButtonOverlap('[data-archipelago-panel] [data-island], [data-archipelago-panel] [data-go-world]', `第二層 ${width}px`);
    await page.screenshot({path: `${out}/archipelago-${width}.png`, fullPage: true});
  }
  ok('320 / 390 / 1280 無水平溢出，按鈕皆達到觸控大小且不重疊');

  assert.equal(await page.locator('[data-island][data-isle-state="fog"]').count() >= 1, true);
  assert.equal(await page.locator('text=已具備').count() >= 1, true);
  assert.equal(await page.locator('text=待補強').count() >= 1, true);
  ok('霧島與先備徽章狀態皆可見');

  assert.deepEqual(errors, []);
  await fs.writeFile(
    `${out}/report.json`,
    JSON.stringify(
      {
        checks,
        errors,
        passed: true,
        at: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
  console.log('ALL PASSED');
} catch (error) {
  await page.screenshot({path: `${out}/failure.png`, fullPage: true}).catch(() => {});
  throw error;
} finally {
  await browser.close();
}
