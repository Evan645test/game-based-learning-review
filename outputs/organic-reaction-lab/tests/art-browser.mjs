import assert from 'node:assert/strict';
import {BOOK, CARD_STATIONS} from '../course-path.js';
import {freshPath} from '../learning-path.js';
import {view, resetCourse, seedPath, openStation, nextScreen, noOverflow, turnPage} from './book-navigation.mjs';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true});
const page = await browser.newPage({viewport:{width:1280, height:900}});
const errors = [];
page.on('pageerror', err => errors.push(String(err)));
page.setDefaultTimeout(12000);

async function noButtonOverlap(label) {
  // The other half of a spread is intentionally outside the clipped mobile viewport.
  const rects = await page.locator('[data-station]').evaluateAll(nodes => {
    const viewport = document.querySelector('.book-viewport').getBoundingClientRect();
    return nodes.map(node => {
      const box = node.getBoundingClientRect();
      return {x:box.x, y:box.y, w:box.width, h:box.height, label:node.getAttribute('aria-label')};
    }).filter(box => box.x >= viewport.x && box.x + box.w <= viewport.right);
  });
  assert.ok(rects.length, `${label}: visible stations`);
  for (const row of rects) assert.ok(row.w >= 44 && row.h >= 44, `${label}: touch target ${row.label}`);
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i], b = rects[j];
    const width = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const height = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    assert.ok(width <= 1 || height <= 1, `${label}: overlap ${a.label} / ${b.label}`);
  }
}

try {
  await page.goto(process.env.ORGANIC_URL || 'http://127.0.0.1:8768/academy.html');
  await resetCourse(page);
  for (const width of [320, 390, 900, 1280, 1600]) {
    await page.setViewportSize({width, height:width < 900 ? 844 : 900});
    for (const [index, spread] of BOOK.entries()) {
      const state = freshPath();
      state.explore.at = 'map';
      state.explore.spread = index;
      state.stage = spread.stations[0].id;
      await seedPath(page, state);
      assert.deepEqual(await page.locator('[data-station]').evaluateAll(nodes => nodes.map(n => n.dataset.station)), spread.stations.map(s => s.id));
      await noOverflow(page, `${spread.id}-${width}`);
      await noButtonOverlap(`${spread.id}-${width}-left`);
      if (width < 760 && spread.stations.length > 1) {
        await turnPage(page, 'next');
        await noOverflow(page, `${spread.id}-${width}-right`);
        await noButtonOverlap(`${spread.id}-${width}-right`);
      }
    }
  }
  // Exercise real cross-spread navigation, independently from the layout fixtures above.
  await page.setViewportSize({width:1280, height:900});
  await seedPath(page, freshPath());
  await turnPage(page, 'next');
  assert.equal(await page.locator('[data-book-spread]').getAttribute('data-book-spread'), BOOK[1].id);
  await turnPage(page, 'prev');
  assert.equal(await page.locator('[data-book-spread]').getAttribute('data-book-spread'), BOOK[0].id);
  await openStation(page, CARD_STATIONS[0].id);
  assert.equal(await page.locator('button[data-art-motion]').count(), 1);
  await page.locator('button[data-art-motion]').click();
  assert.equal(await page.locator('body').getAttribute('data-art-motion'), 'paused');
  await page.reload();
  await view(page, 'learn').waitFor();
  assert.equal(await page.locator('body').getAttribute('data-art-motion'), 'paused');
  await nextScreen(page);
  await noOverflow(page, 'figure');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.reload();
  await view(page, 'learn').waitFor();
  assert.equal(await page.locator('button[data-art-motion]').isDisabled(), true);
  assert.deepEqual(errors, []);
  console.log('ALL PASSED');
} finally {
  await browser.close();
}
