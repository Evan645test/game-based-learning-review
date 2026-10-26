import assert from 'node:assert/strict';
const {chromium} = process.env.PLAYWRIGHT_MODULE
  ? await import(process.env.PLAYWRIGHT_MODULE)
  : await import('playwright');
import {ARCHIPELAGOS, islandNodes} from '../island-map.js';
import {PREP, ITEMS, itemType} from '../course-path.js';
import {PATH_KEY, EXPLORER_KEY, freshPath} from '../learning-path.js';
import {newMechanism} from '../electron-flow.js';

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const page = await browser.newPage({viewport: {width: 390, height: 844}});
const errors = [];
page.on('pageerror', err => errors.push(String(err)));
page.setDefaultTimeout(12000);

const base = process.env.ORGANIC_URL || 'http://127.0.0.1:8768/academy.html';
const view = name => page.locator(`[data-learning-path][data-view="${name}"]`);
async function noOverflow(label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `${label} overflow ${overflow}px`);
}

async function chooseByText(scope, name, text) {
  const label = scope.locator('label.choice').filter({hasText: text}).first();
  await label.locator(`input[name="${name}"]`).check();
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

function seedMixed(itemId) {
  const item = ITEMS.find(row => row.id === itemId);
  const state = freshPath();
  state.stage = 'rearr';
  state.explore.at = 'learn';
  state.explore.seen.rearr = true;
  state.explore.pos.rearr = {node: islandNodes('rearr').findIndex(node => node.id === 'mixed'), screen: 0};
  state.stages.rearr.mixed.current = {
    item: item.id,
    answers: {},
    submitted: false,
    arrow: {work: newMechanism(item.type), first: null, hints: 0, level: 0},
  };
  return {state, item};
}

try {
  await page.goto(base);
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto(base);
  await ensureWorld();
  await noOverflow('world-390');
  assert.equal(await page.locator('[data-archipelago]').count(), 4);

  for (const arch of ARCHIPELAGOS) {
    await page.locator(`[data-archipelago="${arch.id}"]`).click();
    await view('archipelago').waitFor();
    assert.equal(await page.locator('[data-island]').count(), arch.islands.length);
    await page.locator('[data-go-world]').click();
    await view('world').waitFor();
  }

  await page.locator('[data-archipelago="prep"]').click();
  await view('archipelago').waitFor();
  await page.locator('[data-island="w1"]').click();
  await view('island').waitFor();
  assert.equal(await page.locator('[data-node]').count(), PREP[0].cards.length);
  await noOverflow('island-w1-390');

  await page.locator('.island-brief [data-node-go]').click();
  await view('learn').waitFor();
  assert.equal(await page.locator('[data-diag-form]').count(), 1, 'PREP 卡第一屏為診斷');
  const card = PREP[0].cards[0];
  const wrong = card.diagnose[0].options.find(opt => opt !== card.diagnose[0].options[card.diagnose[0].answer]);
  await chooseByText(page.locator('[data-diag-form]'), 'diag', wrong);
  await page.locator('[data-diag-form] button[type="submit"]').click();
  await page.locator('[data-continue-screen]').click();
  await view('learn').waitFor();
  assert.equal(await page.locator('[data-diag-form]').count(), 0, 'pre 答錯會進入 read，不會跳過');
  const beforeTeacher = await page.evaluate(pathKey => JSON.parse(localStorage.getItem(pathKey)), PATH_KEY);
  await page.locator('[data-exit-learn]').click();
  await view('island').waitFor();

  await page.locator('button[data-mode="teacher"]').click();
  assert.equal(await page.locator('button[data-mode="teacher"]').getAttribute('aria-pressed'), 'true');
  await page.locator('.island-brief [data-node-go]').click();
  await view('learn').waitFor();
  assert.equal(await page.locator('[data-teaching-controls]').count(), 1);
  assert.equal(await page.locator('[data-diag-form]').count(), 0, '教師模式隱藏學生作答表單');
  await page.locator('[data-teach-hint]').click();
  await page.locator('[data-teach-result]').click();
  const afterTeacher = await page.evaluate(pathKey => JSON.parse(localStorage.getItem(pathKey)), PATH_KEY);
  assert.deepEqual(afterTeacher.diag, beforeTeacher.diag);
  assert.deepEqual(afterTeacher.attempts, beforeTeacher.attempts);
  await page.locator('[data-exit-learn]').click();
  await view('island').waitFor();

  await page.locator('[data-page="assess"]').click();
  assert.equal(await page.locator('[data-assess-student]').count(), 1);
  await page.locator('[data-assess-student]').click();
  assert.equal(await page.locator('button[data-mode="student"]').getAttribute('aria-pressed'), 'true');
  await page.locator('[data-page="learn"]').click();
  await view('island').waitFor();

  {
    const {state, item} = seedMixed('rearr-a');
    await page.evaluate(([pathState, pathKey, explorerKey]) => {
      localStorage.setItem(pathKey, JSON.stringify(pathState));
      localStorage.setItem(explorerKey, JSON.stringify({name: '探險家', guide: true}));
    }, [state, PATH_KEY, EXPLORER_KEY]);
    await page.reload();
    await view('learn').waitFor();
    assert.equal(await page.locator('[data-shift-question]').count(), 1);
    await page.locator(`[name="mech"][value="${itemType(item)}"]`).check();
    await chooseByText(page.locator('[data-mixed-form] fieldset').nth(1), 'reason', item.reasons[0]);
    await chooseByText(page.locator('[data-mixed-form] fieldset').nth(2), 'product', item.products[0]);
    await page.locator('[name="shift"][value="yes"]').check();
    await page.locator('[data-mixed-form] button[type="submit"]').click();
    assert.equal(await page.locator('.mixed-feedback li.wrong').count(), 0);
  }

  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({width, height: width < 900 ? 844 : 900});
    await noOverflow(`viewport-${width}`);
    await ensureWorld();
    if (width === 320) {
      await page.locator('[data-archipelago="prep"]').click();
      await view('archipelago').waitFor();
      await noOverflow('arch-320');
      await page.locator('[data-go-world]').click();
      await view('world').waitFor();
    }
  }

  assert.deepEqual(errors, []);
  console.log('ALL PASSED');
} finally {
  await browser.close();
}
