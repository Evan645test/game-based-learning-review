import assert from 'node:assert/strict';
import {BOOK, CARD_STATIONS, STAGES, JUDGE_TABLE, ITEMS, itemType, unlockedTypes} from '../course-path.js';
import {ISLANDS, islandNodes, nodeScreens, cardLocation} from '../island-map.js';
import {bookProgress, exampleById, freshPath} from '../learning-path.js';
import {FIGURES} from '../figures-v3.js';
import {
  allCards, view, readPath, resetCourse, openStation, seedPath, seedScreen,
  nextScreen, answerCard, fillTable, noOverflow, ensureMap,
} from './book-navigation.mjs';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true});
const context = await browser.newContext({viewport:{width:390, height:844}, hasTouch:true, isMobile:true});
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
page.setDefaultTimeout(12000);
const base = process.env.ORGANIC_URL || 'http://127.0.0.1:8768/academy.html';

async function assertCues(stage, concept) {
  const links = page.locator('[data-cue-list] [data-review]');
  assert.equal(await links.count(), (concept.cues || []).flatMap(c => c.review).length);
  for (let i = 0; i < await links.count(); i++) {
    const link = links.nth(i), id = await link.getAttribute('data-review');
    const ahead = ISLANDS.findIndex(s => s.id === cardLocation(id).island) > ISLANDS.findIndex(s => s.id === stage.id);
    assert.equal((await link.innerText()).startsWith('下一節預告：'), ahead, `${stage.id} → ${id}`);
  }
}

async function handleScreen(station, screen) {
  const stage = STAGES.find(s => s.id === station.id);
  if (screen.card) {
    const card = allCards.get(screen.card);
    if (screen.type === 'read') assert.equal(await page.locator('[data-path-panel] h2').innerText(), card.title);
    if (screen.type === 'figure') {
      assert.equal(await page.locator('[data-figure-host]').count(), [].concat(FIGURES[card.id] || []).length);
      if (card.widget) assert.equal(await page.locator('[data-cation-host]').count(), 1);
      if (card.visual) assert.equal(await page.locator('[data-path-visual]').count(), 1);
    }
    if (screen.type === 'demo') await page.locator('[data-concept-player] .spotlight-player').waitFor();
    if (screen.type === 'check') {
      await nextScreen(page);
      assert.equal(await page.locator('[data-learn-gate]').isVisible(), true, `未檢查不可繼續：${station.id}/${screen.card}`);
      await answerCard(page, card);
    }
  } else if (screen.type === 'concept') {
    await assertCues(stage, stage.concepts[screen.index]);
    assert.equal(await page.locator('[data-concept-mechanism]').count(), screen.index === 0 ? 1 : 0);
    if (screen.index === 0) await page.locator('[data-concept-mechanism] .spotlight-player').waitFor();
  } else if (screen.type === 'compare') {
    await page.locator(`[data-comparison="${screen.id}"]`).waitFor();
  } else if (screen.type === 'pair') {
    const pair = stage.pairs[screen.index];
    for (const [index, id] of [pair.a, pair.b].entries()) {
      const {kind} = exampleById(id);
      const available = unlockedTypes(stage.id);
      const answers = available.includes(kind) ? [kind] : [...new Set(ITEMS
        .filter(item => item.example === id && item.type === kind)
        .map(itemType).filter(type => available.includes(type)))];
      assert.equal(answers.length, 1, `${stage.id}/${id}: expected an unambiguous module answer`);
      await page.locator(`[data-predict="${index}"]`).selectOption(answers[0]);
    }
    await page.locator('[data-reveal]').click();
    assert.equal(await page.locator('.contrast-card.wrong').count(), 0);
  } else if (screen.type === 'branch') {
    const task = stage.branches[screen.index];
    await page.locator(`[data-branch-form] input[value="${task.answer}"]`).check();
    await page.locator('[data-branch-form] button[type="submit"]').click();
    assert.equal(await page.locator('[data-branch-form]').count(), 0);
  } else if (screen.type === 'arrow') {
    // A hint attempt permits continuing; it must not falsely mark an empty mechanism correct.
    await page.locator('[data-graded-check]').click();
    assert.equal(await page.locator('[data-graded-feedback]').isVisible(), true);
    assert.equal(await page.locator('[data-graded-feedback]').evaluate(el => el.classList.contains('correct')), false);
  } else if (screen.type === 'table') {
    await fillTable(page);
    assert.equal(await page.locator('td.wrong').count(), 0);
  }
  await nextScreen(page);
}

try {
  await page.goto(base);
  await resetCourse(page);
  await noOverflow(page, 'fresh book');
  assert.equal(await page.locator('[data-station]').count(), BOOK[0].stations.length);
  // Walk every actual screen, including direct continuation between units within a reaction station.
  for (const [index, station] of ISLANDS.entries()) {
    await openStation(page, station.id);
    for (const node of islandNodes(station.id)) for (const screen of nodeScreens(station.id, node)) {
      await view(page, 'learn').waitFor();
      await handleScreen(station, screen);
    }
    await view(page, 'map').waitFor();
    const state = await readPath(page), nodes = bookProgress(state).flatMap(s => s.nodes);
    assert.equal(nodes.find(s => s.id === station.id).state, 'done');
    assert.deepEqual(nodes.filter(s => s.state === 'next').map(s => s.id), ISLANDS[index + 1] ? [ISLANDS[index + 1].id] : []);
    if (ISLANDS[index + 1]) assert.equal(state.stage, ISLANDS[index + 1].id);
    await noOverflow(page, `completed ${station.id}`);
  }
  const completed = await readPath(page);
  await page.reload();
  await view(page, 'map').waitFor();
  assert.deepEqual((await readPath(page)).explore.done, completed.explore.done);

  // Wrong card → earlier-card detour → browser Back restores the exact check screen and answer.
  const card = CARD_STATIONS.find(c => c.review?.some(id => id !== c.id));
  assert.ok(card);
  const loc = cardLocation(card.id), screens = nodeScreens(loc.island, islandNodes(loc.island)[loc.node]);
  await seedScreen(page, loc.island, islandNodes(loc.island)[loc.node].id, screens.findIndex(s => s.type === 'check' && s.card === card.id));
  await answerCard(page, card, false);
  const before = await readPath(page);
  const target = card.review.find(id => id !== card.id);
  await page.locator(`[data-check-review] [data-review="${target}"]`).click();
  await page.locator('[data-review-banner]').waitFor();
  await page.goBack();
  await page.locator('[data-warm-check]').waitFor();
  assert.deepEqual((await readPath(page)).explore.pos, before.explore.pos);
  assert.deepEqual((await readPath(page)).warm.checks, before.warm.checks);
  await nextScreen(page);
  await view(page, 'map').waitFor();
  await openStation(page, card.id);
  await ensureMap(page);
  assert.equal(await page.locator(`[data-station="${card.id}"]`).getAttribute('data-flag'), 'true');
  await page.locator('[data-book]').click();
  await view(page, 'book').waitFor();
  await page.locator(`.flag-list [data-map-go="${card.id}"]`).click();
  await page.locator('[data-review-return]').click();
  await view(page, 'map').waitFor();

  // The review station has only the table; an incomplete submission does not count as completed.
  await seedScreen(page, 'final', 'table');
  const wrongKey = Object.keys(JUDGE_TABLE.cells).find(key => JUDGE_TABLE.cells[key].type.includes('sn1'));
  await fillTable(page, wrongKey);
  assert.equal(await page.locator('td.wrong').count(), 1);
  await page.locator('td.wrong [data-review]').first().click();
  await page.locator('[data-review-return]').click();
  await page.locator('.judge-table').waitFor();
  await nextScreen(page);
  await view(page, 'map').waitFor();
  assert.equal((await readPath(page)).explore.done.final.table, undefined);
  await openStation(page, 'final');
  await fillTable(page);
  await nextScreen(page);
  await view(page, 'map').waitFor();
  assert.equal((await readPath(page)).explore.done.final.table, true);

  // Desktop flipping must change spreads in both directions.
  await page.setViewportSize({width:1280, height:900});
  await seedPath(page, freshPath());
  await openStation(page, ISLANDS.at(-1).id);
  await openStation(page, ISLANDS[0].id);
  await ensureMap(page);
  await page.locator('button[data-mode="teacher"]').click();
  await page.locator('[data-page="assess"]').click();
  assert.equal(await page.locator('[data-assess-student]').count(), 1);

  await page.evaluate(() => {
    localStorage.setItem('organic-temp-reset', '1');
    localStorage.setItem('other-temp-reset', 'keep');
  });
  await page.locator('[data-clear-learning]').click();
  await page.locator('[data-reset-cancel]').click();
  assert.equal(await page.evaluate(() => localStorage.getItem('organic-temp-reset')), '1');
  await page.locator('[data-clear-learning]').click();
  await Promise.all([page.waitForEvent('load'), page.locator('[data-reset-confirm]').click()]);
  await view(page, 'name').waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('organic-temp-reset')), null);
  assert.equal(await page.evaluate(() => localStorage.getItem('other-temp-reset')), 'keep');
  assert.deepEqual(errors, []);
  console.log('ALL PASSED');
} finally {
  await browser.close();
}
