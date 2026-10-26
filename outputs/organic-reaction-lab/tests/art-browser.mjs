import assert from 'node:assert/strict';
const {chromium} = process.env.PLAYWRIGHT_MODULE
  ? await import(process.env.PLAYWRIGHT_MODULE)
  : await import('playwright');
import {ARCHIPELAGOS} from '../island-map.js';
import {PREP} from '../course-path.js';

const base = process.env.ORGANIC_URL || 'http://127.0.0.1:8768/academy.html';
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const context = await browser.newContext({viewport: {width: 1280, height: 900}});
const page = await context.newPage();
const errors = [];
page.on('pageerror', err => errors.push(String(err)));
page.setDefaultTimeout(12000);

const view = name => page.locator(`[data-learning-path][data-view="${name}"]`);

async function noOverflow(label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `${label} overflow ${overflow}px`);
}

async function noButtonOverlap(selector, label) {
  const rects = await page.locator(selector).evaluateAll(nodes => nodes.map(node => {
    const box = node.getBoundingClientRect();
    return {x: box.x, y: box.y, w: box.width, h: box.height, label: node.getAttribute('aria-label')};
  }));
  for (const row of rects) assert.ok(row.w >= 44 && row.h >= 44, `${label} touch target too small`);
  for (let i = 0; i < rects.length; i += 1) {
    for (let j = i + 1; j < rects.length; j += 1) {
      const a = rects[i];
      const b = rects[j];
      const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      assert.ok(w <= 1 || h <= 1, `${label} overlap: ${a.label} / ${b.label}`);
    }
  }
}

async function ensureWorld() {
  if (await view('name').count()) await page.locator('[data-name-skip]').click();
  if (await view('learn').count()) await page.locator('[data-exit-learn]').click();
  if (await view('book').count()) await page.locator('[data-book-close]').click();
  if (await view('island').count()) {
    await page.locator('[data-go-world]').click();
    await view('archipelago').waitFor();
  }
  if (await view('archipelago').count()) await page.locator('[data-go-world]').click();
  await view('world').waitFor();
}

try {
  await page.goto(base);
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto(base);
  await ensureWorld();
  assert.equal(await page.locator('[data-archipelago]').count(), 4);

  for (const width of [320, 390, 900, 1280, 1600]) {
    await page.setViewportSize({width, height: width < 900 ? 844 : 900});
    await ensureWorld();
    await noOverflow(`world-${width}`);
    await noButtonOverlap('[data-arch-world] [data-archipelago], [data-lighthouse]', `world-${width}`);
  }

  for (const arch of ARCHIPELAGOS) {
    await page.locator(`[data-archipelago="${arch.id}"]`).click();
    await view('archipelago').waitFor();
    assert.equal(await page.locator('[data-island]').count(), arch.islands.length);
    await noOverflow(`archipelago-${arch.id}`);
    await noButtonOverlap('[data-archipelago-panel] [data-island], [data-go-world]', `archipelago-${arch.id}`);
    await page.locator('[data-go-world]').click();
    await view('world').waitFor();
  }

  await page.locator('[data-archipelago="prep"]').click();
  await view('archipelago').waitFor();
  await page.locator('[data-island="w1"]').click();
  await view('island').waitFor();
  assert.equal(await page.locator('[data-node]').count(), PREP[0].cards.length);
  await noOverflow('island-w1');
  await noButtonOverlap('[data-node]', 'island-w1');

  await page.locator('.island-brief [data-node-go]').click();
  await view('learn').waitFor();
  assert.equal(await page.locator('button[data-art-motion]').count(), 1);
  await noOverflow('learn');
  await page.locator('button[data-art-motion]').click();
  assert.equal(await page.locator('body').getAttribute('data-art-motion'), 'paused');
  await page.reload();
  await view('learn').waitFor();
  assert.equal(await page.locator('body').getAttribute('data-art-motion'), 'paused');

  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.reload();
  await ensureWorld();
  assert.equal(await page.locator('button[data-art-motion]').isDisabled(), true);

  assert.deepEqual(errors, []);
  console.log('ALL PASSED');
} finally {
  await browser.close();
}
