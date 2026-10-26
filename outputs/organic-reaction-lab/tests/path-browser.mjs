import assert from 'node:assert/strict';
const {chromium} = process.env.PLAYWRIGHT_MODULE
  ? await import(process.env.PLAYWRIGHT_MODULE)
  : await import('playwright');
import {ARCHIPELAGOS, islandNodes} from '../island-map.js';
import {PREP, STAGES, ITEMS, itemType, JUDGE_TABLE} from '../course-path.js';
import {PATH_KEY, EXPLORER_KEY, freshPath} from '../learning-path.js';
import {newMechanism} from '../electron-flow.js';

const base = process.env.ORGANIC_URL || 'http://127.0.0.1:8768/academy.html';
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const context = await browser.newContext({viewport: {width: 390, height: 844}, hasTouch: true, isMobile: true});
const page = await context.newPage();
const errors = [];
page.on('pageerror', err => errors.push(String(err)));
page.on('dialog', dialog => dialog.accept());
page.setDefaultTimeout(12000);

const view = name => page.locator(`[data-learning-path][data-view="${name}"]`);
const pick = text => new RegExp(`^${String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);

async function noOverflow(tag) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `${tag} overflow ${overflow}px`);
}

async function ensureReady() {
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

async function chooseByText(scope, name, text) {
  const label = scope.locator('label.choice').filter({hasText: text}).first();
  await label.locator(`input[name="${name}"]`).check();
}

function diagnoseItem(card, phase) {
  if (phase === 'pre') return card.diagnose[0];
  return card.diagnose[1 + (card.id.length % Math.max(1, card.diagnose.length - 1))] || card.diagnose[1];
}

async function submitDiagnose(card, phase, {correct}) {
  const item = diagnoseItem(card, phase);
  const wrong = item.options.find(opt => opt !== item.options[item.answer]);
  await chooseByText(page.locator('[data-diag-form]'), 'diag', correct ? item.options[item.answer] : wrong);
  await page.locator('[data-diag-form] button[type="submit"]').click();
}

async function seedMixed(itemId) {
  const item = ITEMS.find(row => row.id === itemId);
  assert.ok(item, itemId);
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
  await page.evaluate(([pathState, nameState, pathKey, explorerKey]) => {
    localStorage.setItem(pathKey, JSON.stringify(pathState));
    localStorage.setItem(explorerKey, JSON.stringify(nameState));
  }, [state, {name: '探險家', guide: true}, PATH_KEY, EXPLORER_KEY]);
  await page.reload();
  await view('learn').waitFor();
  return item;
}

async function submitMixed(item, shiftAnswer) {
  const form = page.locator('[data-mixed-form]');
  await form.locator(`[name="mech"][value="${itemType(item)}"]`).check();
  await chooseByText(form.locator('fieldset').nth(1), 'reason', item.reasons[0]);
  await chooseByText(form.locator('fieldset').nth(2), 'product', item.products[0]);
  await form.locator(`[name="shift"][value="${shiftAnswer}"]`).check();
  await form.locator('button[type="submit"]').click();
  await page.locator('.mixed-feedback').waitFor();
}

try {
  await page.goto(base);
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto(base);
  await ensureReady();
  await view('world').waitFor();
  await noOverflow('world');

  assert.equal(await page.locator('[data-archipelago]').count(), 4);
  assert.equal(await page.locator('[data-lighthouse]').count(), 1);

  for (const arch of ARCHIPELAGOS) {
    await page.locator(`[data-archipelago="${arch.id}"]`).click();
    await view('archipelago').waitFor();
    await page.locator(`[data-archipelago-panel="${arch.id}"]`).waitFor();
    assert.equal(await page.locator('[data-island]').count(), arch.islands.length, arch.id);
    await noOverflow(`archipelago-${arch.id}`);
    await page.locator('[data-go-world]').click();
    await view('world').waitFor();
  }

  await page.locator('[data-archipelago="prep"]').click();
  await view('archipelago').waitFor();
  await page.locator('[data-island="w1"]').click();
  await view('island').waitFor();
  await noOverflow('island-w1');
  assert.equal(await page.locator('[data-node]').count(), PREP[0].cards.length);

  await page.locator('.island-brief [data-node-go]').click();
  await view('learn').waitFor();

  const cardA = PREP[0].cards[0];
  await submitDiagnose(cardA, 'pre', {correct: true});
  await page.locator('[data-continue-screen]').click();
  await view('island').waitFor();
  assert.equal(await page.locator('[data-node="0"]').getAttribute('data-node-state'), 'done');

  await page.locator('[data-node="1"]').click();
  await page.locator('[data-node-sheet] [data-node-go]').click();
  await view('learn').waitFor();
  const cardB = PREP[0].cards[1];
  await submitDiagnose(cardB, 'pre', {correct: false});
  await page.locator('[data-continue-screen]').click();
  await view('learn').waitFor();
  assert.equal(await page.locator('[data-diag-form]').count(), 0, '答錯 pre 不可直接跳過');
  while ((await page.locator('[data-diag-form]').count()) === 0) await page.locator('[data-continue-screen]').click();
  await submitDiagnose(cardB, 'post', {correct: true});
  await page.locator('[data-continue-screen]').click();
  await view('island').waitFor();

  await page.locator('[data-node="2"]').click();
  await page.locator('[data-node-sheet] [data-node-go]').click();
  await view('learn').waitFor();
  const cardC = PREP[0].cards[2];
  await submitDiagnose(cardC, 'pre', {correct: false});
  await page.locator('[data-continue-screen]').click();
  while ((await page.locator('[data-diag-form]').count()) === 0) await page.locator('[data-continue-screen]').click();
  await submitDiagnose(cardC, 'post', {correct: false});
  await page.locator('[data-continue-screen]').click();
  await view('island').waitFor();
  assert.ok((await page.locator('.node-flag').count()) >= 1);

  await page.locator('[data-book]').click();
  await view('book').waitFor();
  assert.equal(await page.locator('.flag-list [data-map-go]').count() >= 1, true);
  await page.locator('.flag-list [data-map-go]').first().click();
  await view('learn').waitFor();
  await page.locator('[data-review-banner]').waitFor();
  await page.locator('[data-review-return]').click();
  await view('island').waitFor();

  const rearrItem = await seedMixed('rearr-a');
  assert.equal(await page.locator('[data-shift-question]').count(), 1);
  await submitMixed(rearrItem, 'yes');
  assert.match(await page.locator('.mixed-feedback').innerText(), /會不會重排/);
  assert.equal(await page.locator('.mixed-feedback li.wrong').count(), 0);

  const addhxItem = await seedMixed('addhx-a');
  assert.equal(await page.locator('[data-shift-question]').count(), 1);
  await submitMixed(addhxItem, 'no');
  assert.equal(await page.locator('.mixed-feedback li.wrong').count(), 0);

  {
    const state = freshPath();
    state.stage = 'sn1';
    state.explore.at = 'learn';
    state.explore.seen.sn1 = true;
    state.explore.pos.sn1 = {node: islandNodes('sn1').findIndex(node => node.id === 'contrast'), screen: 0};
    await page.evaluate(([pathState, pathKey]) => localStorage.setItem(pathKey, JSON.stringify(pathState)), [state, PATH_KEY]);
    await page.reload();
    await view('learn').waitFor();
    const compareIds = STAGES.find(stage => stage.id === 'sn1').compare;
    await page.locator(`[data-comparison="${compareIds[0]}"]`).waitFor();
    await page.locator('[data-continue-screen]').click();
    await page.locator(`[data-comparison="${compareIds[1]}"]`).waitFor();
    await page.locator('[data-continue-screen]').click();
    assert.equal(await page.locator('[data-predict]').count(), 2);
  }

  {
    const state = freshPath();
    state.stage = 'final';
    state.explore.at = 'learn';
    state.explore.seen.final = true;
    state.explore.pos.final = {node: islandNodes('final').findIndex(node => node.id === 'table'), screen: 0};
    await page.evaluate(([pathState, pathKey]) => localStorage.setItem(pathKey, JSON.stringify(pathState)), [state, PATH_KEY]);
    await page.reload();
    await view('learn').waitFor();
    for (const [key, cell] of Object.entries(JUDGE_TABLE.cells)) {
      const wrong = key === 'tertiary|protic';
      await page.locator(`[data-cell-type="${key}"]`).selectOption(wrong ? 'e1' : cell.type[0]);
    }
    await page.locator('[data-table-check]').click();
    assert.match(await page.locator('[data-table-status]').innerText(), /15／16|15\/16/);
    assert.equal(await page.locator('td.wrong').count(), 1);
    if (await page.locator('td.wrong [data-review]').count()) {
      await page.locator('td.wrong [data-review]').first().click();
      await page.locator('[data-review-return]').click();
      await page.locator('.judge-table').waitFor();
    }
    await page.locator('[data-cell-type="tertiary|protic"]').selectOption('sn1');
    await page.locator('[data-table-check]').click();
    assert.match(await page.locator('[data-table-status]').innerText(), /16 格都對了/);
  }

  await page.goto(base);
  await ensureReady();
  await page.locator('button[data-mode="teacher"]').click();
  assert.equal(await page.locator('button[data-mode="teacher"]').getAttribute('aria-pressed'), 'true');
  await page.locator('[data-page="assess"]').click();
  assert.equal(await page.locator('[data-assess-student]').count(), 1);

  await page.evaluate(() => {
    localStorage.setItem('organic-temp-reset', '1');
    localStorage.setItem('other-temp-reset', 'keep');
  });
  await page.locator('[data-clear-learning]').click();
  await page.locator('[data-reset-dialog][open]').waitFor();
  await page.locator('[data-reset-cancel]').click();
  assert.equal(await page.evaluate(() => localStorage.getItem('organic-temp-reset')), '1');

  await page.locator('[data-clear-learning]').click();
  await Promise.all([
    page.waitForEvent('load'),
    page.locator('[data-reset-confirm]').click(),
  ]);
  await view('name').waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('organic-temp-reset')), null);
  assert.equal(await page.evaluate(() => localStorage.getItem('other-temp-reset')), 'keep');

  assert.deepEqual(errors, []);
  console.log('ALL PASSED');
} finally {
  await browser.close();
}
