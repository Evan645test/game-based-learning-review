import assert from 'node:assert/strict';
import {CARD_STATIONS, STAGES} from '../course-path.js';
import {PATH_KEY} from '../learning-path.js';
import {islandNodes, nodeScreens} from '../island-map.js';
import {view, resetCourse, openStation, ensureMap, readPath, nextScreen, answerCard, noOverflow, seedScreen} from './book-navigation.mjs';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true});
const page = await browser.newPage({viewport:{width:390, height:844}});
const errors = [];
page.on('pageerror', err => errors.push(String(err)));
page.setDefaultTimeout(12000);

try {
  await page.goto(process.env.ORGANIC_URL || 'http://127.0.0.1:8768/academy.html');
  await resetCourse(page);
  const card = CARD_STATIONS[0];
  await openStation(page, card.id);
  const screens = nodeScreens(card.id, islandNodes(card.id)[0]);
  for (const screen of screens) {
    if (screen.type === 'check') {
      await answerCard(page, card, false);
      break;
    }
    await nextScreen(page);
  }
  const beforeTeacher = await readPath(page);
  await ensureMap(page);
  await page.locator('button[data-mode="teacher"]').click();
  assert.equal(await page.locator('button[data-mode="teacher"]').getAttribute('aria-pressed'), 'true');
  await openStation(page, card.id);
  assert.equal(await page.locator('[data-teaching-controls]').count(), 1);
  await page.locator('[data-teach-hint]').click();
  await page.locator('[data-teach-result]').click();
  await nextScreen(page);
  const afterTeacher = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), PATH_KEY);
  assert.deepEqual(afterTeacher.warm.checks, beforeTeacher.warm.checks);
  assert.deepEqual(afterTeacher.attempts, beforeTeacher.attempts);
  assert.deepEqual(afterTeacher.explore.done, beforeTeacher.explore.done);
  await ensureMap(page);
  await page.locator('[data-page="assess"]').click();
  assert.equal(await page.locator('[data-assess-student]').count(), 1);
  await page.locator('[data-assess-student]').click();
  assert.equal(await page.locator('button[data-mode="student"]').getAttribute('aria-pressed'), 'true');
  await page.locator('[data-page="learn"]').click();
  await ensureMap(page);

  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({width, height:width < 900 ? 844 : 900});
    await noOverflow(page, `book-${width}`);
    await page.locator('[data-book]').click();
    await view(page, 'book').waitFor();
    await noOverflow(page, `handbook-${width}`);
    await page.locator('[data-book-close]').click();
    await openStation(page, card.id);
    await noOverflow(page, `learn-${width}`);
    await ensureMap(page);
  }
  // The first concept of every reaction station embeds a real representative mechanism.
  for (const stage of STAGES) {
    await seedScreen(page, stage.id, 'concepts');
    await page.locator('[data-concept-mechanism] .spotlight-player').waitFor();
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({width, height:width < 900 ? 844 : 900});
      await noOverflow(page, `${stage.id}-mechanism-${width}`);
    }
  }
  assert.deepEqual(errors, []);
  console.log('ALL PASSED');
} finally {
  await browser.close();
}
