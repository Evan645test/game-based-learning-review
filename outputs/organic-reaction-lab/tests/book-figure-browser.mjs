import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const {chromium} = process.env.PLAYWRIGHT_MODULE
  ? await import(process.env.PLAYWRIGHT_MODULE)
  : await import('playwright');

const outDir = '/private/tmp/organic-book-verification';
await fs.mkdir(outDir, {recursive: true});

const base = process.env.ORGANIC_BOOK_URL || 'http://127.0.0.1:8793/__book-figure-browser__';
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true
});
const context = await browser.newContext({viewport: {width: 1280, height: 920}});
const page = await context.newPage();
const errors = [];
page.on('pageerror', err => errors.push(String(err)));
page.setDefaultTimeout(12000);

const html = `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="/figure-view.css">
  <link rel="stylesheet" href="/book-map.css">
  <style>
    body { margin: 0; font-family: "PingFang TC", "Noto Sans TC", sans-serif; background: #f3efe4; }
    .wrap { max-width: 1220px; margin: 0 auto; padding: 12px; display: grid; gap: 14px; }
    .card { background: #fffdf8; border: 1px solid #dbc8aa; border-radius: 14px; padding: 10px; }
    .card h4 { margin: 0 0 8px; font-size: 0.95rem; color: #4d3b26; }
  </style>
</head>
<body>
  <main class="wrap" data-root></main>
  <script type="module">
    import {figureHTML, mountFigure} from '/figure-view.js';
    import {bookHTML} from '/book-map.js';
    import {FIGURES} from '/figures-v3.js';
    const root = document.querySelector('[data-root]');
    const cleanups = [];
    const figureEntries = [];
    for (const [id, raw] of Object.entries(FIGURES)) {
      const list = Array.isArray(raw) ? raw : [raw];
      list.forEach((spec, index) => figureEntries.push({id, index, spec}));
    }
    for (const entry of figureEntries) {
      const card = document.createElement('section');
      card.className = 'card';
      card.setAttribute('data-figure-host', entry.id + '-' + entry.index);
      const title = document.createElement('h4');
      title.textContent = 'FIGURES.' + entry.id + (entry.index ? '[' + entry.index + ']' : '');
      card.append(title);
      const host = document.createElement('div');
      host.innerHTML = figureHTML(entry.spec);
      cleanups.push(mountFigure(host, entry.spec));
      card.append(host);
      root.append(card);
    }

    const makeNodes = prefix => ([
      {id: prefix + '-n1', section: 'A1', title: '節點一', state: 'done', flag: false},
      {id: prefix + '-n2', section: 'A2', title: '節點二', state: 'done', flag: false},
      {id: prefix + '-n3', section: 'A3', title: '節點三', state: 'next', flag: true},
      {id: prefix + '-n4', section: 'A4', title: '節點四', state: 'todo', flag: false},
      {id: prefix + '-n5', section: 'A5', title: '節點五', state: 'todo', flag: false},
      {id: prefix + '-n6', section: 'A6', title: '節點六', state: 'todo', flag: false}
    ]);

    const spreads = Array.from({length: 7}, (_, i) => ({
      id: 'spread-' + (i + 1),
      title: 'Book Spread ' + (i + 1),
      chapters: 'book-spread-' + (i + 1) + '.jpg',
      art: 'book-spread-' + (i + 1) + '.jpg',
      nodes: makeNodes('s' + (i + 1))
    }));

    for (const spread of spreads) {
      for (const side of ['left', 'right']) {
        const card = document.createElement('section');
        card.className = 'card';
        card.setAttribute('data-book-host', spread.id + '-' + side);
        const title = document.createElement('h4');
        title.textContent = spread.title + ' (' + side + ')';
        card.append(title);
        const host = document.createElement('div');
        host.innerHTML = bookHTML({spreads: [spread], spread: 0, hero: spread.nodes[2].id, side});
        card.append(host);
        root.append(card);
      }
    }

    window.__renderInfo = {
      figureIds: Object.keys(FIGURES),
      figureEntries: figureEntries.length,
      spreadCount: spreads.length
    };
    window.__cleanupBookFigure = () => cleanups.forEach(fn => fn());
  </script>
</body>
</html>`;

async function noOverflow(label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `${label} overflow ${overflow}px`);
}

async function noOverlap(selector, label) {
  const boxes = await page.locator(selector).evaluateAll(nodes => nodes.map(node => {
    const r = node.getBoundingClientRect();
    return {x: r.x, y: r.y, w: r.width, h: r.height, label: node.getAttribute('aria-label') || node.textContent || ''};
  }));
  for (const row of boxes) {
    assert.ok(row.w >= 44, `${label} width too small`);
    assert.ok(row.h >= 44, `${label} height too small`);
  }
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      const a = boxes[i];
      const b = boxes[j];
      const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      assert.ok(w <= 1 || h <= 1, `${label} overlap: ${a.label} / ${b.label}`);
    }
  }
}

async function validatePathInsideBook(label) {
  const report = await page.locator('.book-map .book-path').evaluateAll(paths => paths.map(path => {
    const box = path.getBBox();
    return {x: box.x, y: box.y, w: box.width, h: box.height};
  }));
  for (const box of report) {
    assert.ok(box.x >= -1 && box.y >= -1, `${label} path out of bounds (min)`);
    assert.ok(box.x + box.w <= 2401 && box.y + box.h <= 1501, `${label} path out of bounds (max)`);
  }
}

async function dragRotate(kind) {
  const host = page.locator(`[data-figure-kind="${kind}"] [data-figure-3d]`).first();
  if (await host.count() === 0) return;
  const before = await host.getAttribute('data-yaw');
  // A real press lands on a visible model; scroll it into view so the press targets the figure itself.
  await host.scrollIntoViewIfNeeded();
  const box = await host.boundingBox();
  assert.ok(box, `${kind} box missing`);
  await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.72, box.y + box.height * 0.62, {steps: 7});
  await page.mouse.up();
  const after = await host.getAttribute('data-yaw');
  assert.notEqual(after, before, `${kind} yaw should change`);
}

async function collectChairSubstituents(hostSelector) {
  return page.locator(`${hostSelector} [data-chair-substituent]`).evaluateAll(nodes => nodes.map(node => ({
    label: node.getAttribute('data-chair-substituent'),
    carbon: Number(node.getAttribute('data-carbon') || 0),
    requested: node.getAttribute('data-requested'),
    actual: node.getAttribute('data-actual'),
    up: node.getAttribute('data-up')
  })));
}

async function verifyChairFlip(hostSelector, label) {
  const before = await collectChairSubstituents(hostSelector);
  const next = page.locator(`${hostSelector} [data-figure-next]`).first();
  if (await next.count() > 0) await next.click();
  const after = await collectChairSubstituents(hostSelector);
  assert.equal(before.length, after.length, `${label} substituent count mismatch`);
  for (let i = 0; i < before.length; i += 1) {
    const a = before[i];
    const b = after[i];
    assert.equal(a.label, b.label, `${label} label mismatch`);
    assert.equal(a.carbon, b.carbon, `${label} carbon mismatch`);
    assert.equal(a.up, b.up, `${label} up/down should persist`);
    const swapped = a.actual === 'axial' ? 'equatorial' : 'axial';
    assert.equal(b.actual, swapped, `${label} should swap axial/equatorial`);
  }
  const prev = page.locator(`${hostSelector} [data-figure-prev]`).first();
  if (await prev.count() > 0) await prev.click();
}

async function verifyChairE2TransDiaxial() {
  const host = '[data-figure-host="chair-e2-0"]';
  const subs = await collectChairSubstituents(host);
  assert.equal(subs.length, 2, 'chair-e2 substituent count');
  assert.ok(subs.every(item => item.actual === 'axial'), 'chair-e2 must start as diaxial');
  const [first, second] = subs;
  assert.equal(Math.abs(first.carbon - second.carbon), 1, 'chair-e2 carbons should be adjacent');
  assert.notEqual(first.up, second.up, 'chair-e2 must be trans (one up one down)');
}

async function noTagOverlap(hostSelector, label) {
  const report = await page.locator(`${hostSelector} .fv-atom-tag`).evaluateAll(nodes => {
    const boxes = nodes.map(node => {
      const r = node.getBoundingClientRect();
      const text = node.querySelector('text');
      return {
        x: r.x,
        y: r.y,
        w: r.width,
        h: r.height,
        fontSize: Number(text?.getAttribute('font-size') || 0)
      };
    });
    const overlaps = [];
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i];
        const b = boxes[j];
        const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (w > 0.5 && h > 0.5) overlaps.push({i, j, w, h});
      }
    }
    return {
      count: boxes.length,
      minFont: boxes.reduce((min, box) => Math.min(min, box.fontSize || Infinity), Infinity),
      overlaps
    };
  });
  if (!report) return;
  assert.ok(Number.isFinite(report.minFont) && report.minFont >= 12, `${label} font must be >= 12px`);
  assert.equal(report.overlaps.length, 0, `${label} label overlap`);
}

async function chiralityToOrient(hostSelector) {
  const next = page.locator(`${hostSelector} [data-figure-next]`);
  for (let i = 0; i < 2; i += 1) {
    if (await next.count() > 0) await next.first().click();
  }
}

async function verifyChiralityOrientView() {
  const host = '[data-figure-host="chirality-0"]';
  await chiralityToOrient(host);
  const depths = await page.locator(`${host} [data-priority]`).evaluateAll(nodes => nodes
    .map(node => ({priority: Number(node.getAttribute('data-priority')), depth: Number(node.getAttribute('data-depth'))}))
    .filter(item => Number.isFinite(item.priority) && Number.isFinite(item.depth)));
  const p4 = depths.find(item => item.priority === 4);
  assert.ok(p4, 'chirality priority 4 missing');
  const farthestOther = Math.max(...depths.filter(item => item.priority !== 4).map(item => item.depth));
  assert.ok(p4.depth > farthestOther + 0.2, 'chirality orient should place priority 4 away from viewer');
}

async function verifyVsStacking(width) {
  if (width > 560) return;
  const panels = await page.locator('[data-figure-host="chirality-1"] .fv-panel').evaluateAll(nodes => nodes.map(node => {
    const r = node.getBoundingClientRect();
    return {x: r.x, y: r.y, w: r.width, h: r.height};
  }));
  assert.equal(panels.length, 2, 'chirality mirror pair panels');
  assert.ok(panels[0].w > 250 && panels[1].w > 250, `panel width too narrow at ${width}`);
  assert.ok(panels[0].y + panels[0].h <= panels[1].y + 2, `panels should stack vertically at ${width}`);
}

async function screenshotFigure(hostId, width) {
  const selector = `[data-figure-host="${hostId}"]`;
  const node = page.locator(selector).first();
  if (await node.count() === 0) return null;
  await node.scrollIntoViewIfNeeded();
  const path = `${outDir}/figure-${hostId}-${width}.png`;
  await node.screenshot({path});
  return path;
}

try {
  await page.route(base, route => route.fulfill({status: 200, contentType: 'text/html; charset=utf-8', body: html}));
  await page.goto(base);
  await page.waitForSelector('[data-figure-kind]');

  const renderInfo = await page.evaluate(() => window.__renderInfo);
  assert.equal(renderInfo.figureIds.length, 18, 'FIGURES id count mismatch');
  assert.ok(renderInfo.figureEntries >= 18, 'FIGURES entries should include all ids');
  assert.equal(renderInfo.spreadCount, 7, 'spread count mismatch');

  const stepButtons = page.locator('[data-figure-next]');
  if (await stepButtons.count() > 0) {
    const structureNote = page.locator('[data-figure-kind="structure-steps"] [data-figure-note]').first();
    const beforeNote = await structureNote.innerText();
    await page.locator('[data-figure-kind="structure-steps"] [data-figure-next]').first().click();
    const afterNote = await structureNote.innerText();
    assert.notEqual(afterNote, beforeNote, 'structure-steps note should update');
  }

  const newmanNext = page.locator('[data-figure-kind="newman"] [data-figure-next]').first();
  if (await newmanNext.count() > 0) {
    const newmanNote = page.locator('[data-figure-kind="newman"] [data-figure-note]').first();
    const beforeNewman = await newmanNote.innerText();
    await newmanNext.click();
    const afterNewman = await newmanNote.innerText();
    assert.notEqual(afterNewman, beforeNewman, 'newman note should update');
  }

  await dragRotate('newman');
  await dragRotate('chirality');
  await verifyChairFlip('[data-figure-host="chair-0"]', 'chair');
  await verifyChairE2TransDiaxial();
  await verifyChairFlip('[data-figure-host="chair-e2-0"]', 'chair-e2');
  await noTagOverlap('[data-figure-host="chirality-0"]', 'chirality-3d-default');
  await verifyChiralityOrientView();
  await noTagOverlap('[data-figure-host="chirality-0"]', 'chirality-3d-orient');

  const screenshots = [];
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({width, height: width < 600 ? 900 : 940});
    await noOverflow(`viewport-${width}`);
    await noOverlap('[data-figure-prev], [data-figure-next], [data-book-page], [data-station]', `touch-${width}`);
    await validatePathInsideBook(`viewport-${width}`);
    await verifyVsStacking(width);
    screenshots.push(`${outDir}/book-figure-${width}.png`);
    await page.screenshot({path: `${outDir}/book-figure-${width}.png`, fullPage: true});
    for (const hostId of ['chair-0', 'chair-e2-0', 'chirality-0', 'chirality-1']) {
      const shot = await screenshotFigure(hostId, width);
      if (shot) screenshots.push(shot);
    }
  }

  assert.deepEqual(errors, []);
  await fs.writeFile(`${outDir}/book-figure-report.json`, JSON.stringify({
    passed: true,
    screenshots,
    pageErrors: errors
  }, null, 2));
  console.log('ALL PASSED');
} finally {
  await browser.close();
}
