import assert from 'node:assert/strict';
import {BOOK, CARD_STATIONS, STAGES, JUDGE_TABLE} from '../course-path.js';
import {islandNodes, nodeScreens, cardLocation} from '../island-map.js';
import {PATH_KEY, EXPLORER_KEY, freshPath, spreadOf} from '../learning-path.js';
import {DATA_VERSION_KEY, DATA_VERSION} from '../legacy-data.js';

export const allCards = new Map([...CARD_STATIONS, ...STAGES.flatMap(s => [
  ...(s.primers || []), ...s.concepts.flatMap(c => c.details || []),
])].map(c => [c.id, c]));
export const view = (page, name) => page.locator(`[data-learning-path][data-view="${name}"]`);
export const readPath = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), PATH_KEY);
export const nextScreen = page => page.locator('[data-continue-screen]').click();

export async function resetCourse(page) {
  await page.evaluate(() => {
    for (const storage of [localStorage, sessionStorage]) {
      for (const key of Object.keys(storage)) if (key.startsWith('organic-')) storage.removeItem(key);
    }
  });
  await page.reload();
  await view(page, 'name').waitFor();
  await page.locator('[data-name-skip]').click();
  await view(page, 'map').waitFor();
}

export async function ensureMap(page) {
  const root = page.locator('[data-learning-path]');
  await root.waitFor();
  if (await root.getAttribute('data-view') === 'name') await page.locator('[data-name-skip]').click();
  if (await root.getAttribute('data-view') === 'book') await page.locator('[data-book-close]').click();
  if (await root.getAttribute('data-view') === 'learn') await page.locator('[data-exit-learn]').click();
  await view(page, 'map').waitFor();
}

export async function turnPage(page, direction) {
  const before = await page.locator('[data-book-spread]').getAttribute('data-book-spread');
  const side = await page.locator('[data-book-spread]').getAttribute('data-book-side');
  await page.locator(`[data-book-page="${direction}"]`).click();
  await page.waitForFunction(({before, side}) => {
    return document.querySelector('[data-book-spread]')?.dataset.bookSpread !== before ||
      document.querySelector('[data-book-spread]')?.dataset.bookSide !== side;
  }, {before, side});
}

export async function openStation(page, id) {
  await ensureMap(page);
  const target = spreadOf(id);
  assert.ok(target >= 0, `Unknown station: ${id}`);
  for (let count = 0; count < BOOK.length * 2; count++) {
    const current = Number(await page.locator('[data-book-index]').getAttribute('data-book-index'));
    if (current === target) break;
    await turnPage(page, current < target ? 'next' : 'prev');
  }
  assert.equal(await page.locator('[data-book-spread]').getAttribute('data-book-spread'), BOOK[target].id);
  const stationIndex = BOOK[target].stations.findIndex(s => s.id === id);
  const desiredSide = stationIndex < Math.ceil(BOOK[target].stations.length / 2) ? 'left' : 'right';
  if (page.viewportSize().width < 760 && await page.locator('[data-book-spread]').getAttribute('data-book-side') !== desiredSide) {
    await turnPage(page, desiredSide === 'right' ? 'next' : 'prev');
  }
  await page.locator(`[data-station="${id}"]`).click();
  await view(page, 'learn').waitFor();
  assert.equal(await page.locator('[data-learning-path]').getAttribute('data-stage'), id);
}

// Isolated states are used for targeted rendering/mode tests; the path suite walks real stations.
export async function seedPath(page, state) {
  await page.evaluate(({state, pathKey, explorerKey, versionKey, version}) => {
    localStorage.setItem(versionKey, version);
    localStorage.setItem(pathKey, JSON.stringify(state));
    localStorage.setItem(explorerKey, JSON.stringify({name:'測試探險家', guide:true}));
  }, {state, pathKey:PATH_KEY, explorerKey:EXPLORER_KEY, versionKey:DATA_VERSION_KEY, version:DATA_VERSION});
  await page.reload();
  await view(page, state.explore.at || 'map').waitFor();
}

export async function seedScreen(page, station, node, screen = 0) {
  const state = freshPath();
  state.stage = station;
  state.explore.at = 'learn';
  state.explore.spread = spreadOf(station);
  state.explore.seen[station] = true;
  const index = islandNodes(station).findIndex(n => n.id === node);
  assert.ok(index >= 0, `${station}/${node}`);
  assert.ok(nodeScreens(station, islandNodes(station)[index])[screen], `${station}/${node}/${screen}`);
  state.explore.pos[station] = {node:index, screen};
  await seedPath(page, state);
}

export async function cardScreen(page, id, type = 'read') {
  await ensureMap(page);
  await page.locator('[data-book]').click();
  const {COMPETENCIES} = await import('../course-path.js');
  const comp = COMPETENCIES.find(c => c.cards.includes(id));
  assert.ok(comp, id);
  await page.locator(`[data-comp-toggle="${comp.id}"]`).click();
  await page.locator(`[data-map-card="${id}"]`).click();
  await page.locator(`[data-competency] [data-map-go="${id}"]`).click();
  await view(page, 'learn').waitFor();
  await page.locator('[data-review-dismiss]').click();
  const loc = cardLocation(id);
  const screens = nodeScreens(loc.island, islandNodes(loc.island)[loc.node]);
  const destination = screens.findIndex(s => s.card === id && s.type === type);
  assert.ok(destination >= loc.screen, `${id} has no ${type} screen`);
  for (let i = loc.screen; i < destination; i++) await nextScreen(page);
  const state = await readPath(page);
  assert.deepEqual(state.explore.pos[loc.island], {node:loc.node, screen:destination});
}

export async function answerCard(page, card, correct = true) {
  const answer = correct ? card.check.answer : card.check.options.findIndex((_, i) => i !== card.check.answer);
  const form = page.locator('[data-warm-check]');
  await form.locator(`input[name="warm"][value="${answer}"]`).check();
  await form.locator('button[type="submit"]').click();
  await page.locator('[data-warm-feedback]').waitFor();
}

export async function fillTable(page, wrongKey = null) {
  for (const [key, cell] of Object.entries(JUDGE_TABLE.cells)) {
    const answer = key === wrongKey ? JUDGE_TABLE.types.find(t => !cell.type.includes(t.id)).id : cell.type[0];
    await page.locator(`[data-cell-type="${key}"]`).selectOption(answer);
  }
  await page.locator('[data-table-check]').click();
}

export async function noOverflow(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `${label}: overflow ${overflow}px`);
}
