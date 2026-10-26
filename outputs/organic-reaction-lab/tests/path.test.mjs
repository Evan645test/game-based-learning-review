import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOOK,
  CARD_STATIONS,
  COMPETENCIES,
  STAGES,
  TYPES,
  FLOW,
  ITEMS,
  CARBOCATION_TYPES,
  itemType,
  itemsFor,
  shiftUnlocked,
  unlockedTypes,
  pickItem,
  mastery,
  shuffled,
  JUDGE_TABLE,
} from '../course-path.js';
import {ISLANDS, islandNodes, nodeScreens, compareLocation, cardLocation} from '../island-map.js';
import {
  PATH_KEY,
  freshPath,
  validPath,
  checkStatus,
  bookProgress,
  spreadOf,
  snapshot,
  locationCard,
  competencyStatus,
  competencyListHTML,
  tableResult,
  tableSolved,
} from '../learning-path.js';
import {COMPARISONS} from '../comparisons.js';

test('FLOW 路徑：每題路徑連通，終點對上 itemType（或 shift-yes 的 rearrangement）', () => {
  const branchById = new Map(FLOW.flatMap(node => node.branches.map(branch => [branch.id, branch])));
  for (const item of ITEMS) {
    assert.ok(item.path.length >= 1, `${item.id} path too short`);
    assert.ok(branchById.has(item.path[0]), `${item.id} first branch missing`);
    for (let i = 1; i < item.path.length; i += 1) {
      const prev = branchById.get(item.path[i - 1]);
      const next = branchById.get(item.path[i]);
      assert.ok(next, `${item.id} missing branch ${item.path[i]}`);
      const nextNode = FLOW.find(node => node.branches.some(branch => branch.id === item.path[i]))?.id;
      assert.equal(nextNode, prev.to, `${item.id} path disconnected at ${item.path[i]}`);
    }

    const last = branchById.get(item.path.at(-1));
    const outcome = last.to === 'addhx|hydration'
      ? (item.path.includes('el-hx') ? 'addhx' : 'hydration')
      : last.to;
    if (outcome === 'rearrangement') {
      assert.equal(item.type, 'rearrangement', `${item.id} shift-yes 只能對應重排題`);
    } else {
      assert.equal(outcome, itemType(item), `${item.id} outcome mismatch`);
    }
  }
});

test('重排第 4 題池：shift 鎖定前不出現重排，解鎖後題池含 yes/no', () => {
  assert.equal(shiftUnlocked('addhx'), false);
  assert.equal(shiftUnlocked('rearr'), true);

  const lockedPool = itemsFor(['addhx', 'hydration'], {shift: false});
  assert.equal(lockedPool.some(item => item.type === 'rearrangement'), false);

  const openPool = itemsFor(['addhx', 'hydration'], {shift: true});
  assert.equal(openPool.some(item => item.type === 'rearrangement'), true);

  const shiftAnswers = openPool
    .filter(item => CARBOCATION_TYPES.includes(itemType(item)))
    .map(item => (item.type === 'rearrangement' ? 'yes' : 'no'));
  assert.ok(shiftAnswers.includes('yes'));
  assert.ok(shiftAnswers.includes('no'));
});

test('pickItem 與 mastery：錯誤類型加權、避免重複、精熟度看最近五題', () => {
  const types = ['sn2', 'sn1', 'e2'];
  const history = [
    {item: 'e2-a', type: 'e2', mech: false},
    {item: 'e2-b', type: 'e2', mech: false},
    {item: 'e2-c', type: 'e2', mech: false},
    {item: 'sn2-a', type: 'sn2', mech: true},
    {item: 'sn1-a', type: 'sn1', mech: true},
  ];
  let seed = 1;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const counts = {};
  for (let i = 0; i < 600; i += 1) {
    const picked = pickItem(types, history, rand);
    counts[picked.type] = (counts[picked.type] || 0) + 1;
  }
  assert.ok(counts.e2 > counts.sn2 * 2, JSON.stringify(counts));

  const notRepeat = pickItem(types, [...history, {item: 'e2-d', type: 'e2', mech: true}], () => 0);
  assert.notEqual(notRepeat.id, 'e2-d');

  const m = mastery(
    ['sn2', 'e2', 'sn1'],
    [...Array(4)].map((_, idx) => ({item: `x-${idx}`, type: 'sn2', mech: true})).concat([{item: 'y', type: 'e2', mech: false}]),
  );
  assert.equal(m.sn2.level, '精熟');
  assert.equal(m.e2.level, '練習中');
  assert.equal(m.sn1.level, '尚未練習');
  assert.deepEqual(shuffled(['a', 'b', 'c'], 'seed').map(x => x.v), shuffled(['a', 'b', 'c'], 'seed').map(x => x.v));
});

test('比較動畫 ID：位置在對應島，且兩條反應都已解鎖', () => {
  assert.deepEqual(STAGES.find(stage => stage.id === 'sn1').compare, ['primary-sn2-vs-sn1', 'tertiary-sn1-vs-sn2']);
  assert.deepEqual(STAGES.find(stage => stage.id === 'e2').compare, ['bulky-e2-vs-sn2']);
  assert.deepEqual(STAGES.find(stage => stage.id === 'e1').compare, ['heat-e1-vs-sn1']);

  for (const stage of STAGES) {
    for (const id of stage.compare || []) {
      const loc = compareLocation(id);
      assert.equal(loc.island, stage.id);
      const cmp = COMPARISONS.find(row => row.id === id);
      assert.ok(cmp, id);
      const unlocked = new Set(unlockedTypes(stage.id));
      assert.ok(unlocked.has(cmp.winner.type), `${id} winner not unlocked`);
      assert.ok(unlocked.has(cmp.loser.type), `${id} loser not unlocked`);
    }
  }
});

test('final 判斷表固定 16 格：全對才 solved，slow 仍屬有效類型', () => {
  const keys = JUDGE_TABLE.rows.flatMap(row => JUDGE_TABLE.cols.map(col => `${row.id}|${col.id}`));
  assert.equal(keys.length, 16);
  assert.deepEqual(Object.keys(JUDGE_TABLE.cells).sort(), keys.sort());

  const state = freshPath();
  assert.equal(tableSolved(state), false);
  assert.equal(tableResult(state.table).missing.length, 16);

  for (const key of keys) state.table.cells[key] = {type: JUDGE_TABLE.cells[key].type[0]};
  assert.equal(tableSolved(state), true);

  state.table.cells['secondary|protic'] = {type: 'sn1'};
  assert.deepEqual(tableResult(state.table).wrong, ['secondary|protic']);
  assert.ok(JUDGE_TABLE.types.some(type => type.id === 'slow'));
});


import {FIGURES} from '../figures-v3.js';
import {bookHTML} from '../book-map.js';
import {DATA_VERSION} from '../legacy-data.js';
import {REACTION_EXAMPLES} from '../reaction-examples.js';
import fs from 'node:fs';

const cards = [...CARD_STATIONS, ...STAGES.flatMap(s => [
  ...(s.primers || []), ...s.concepts.flatMap(c => c.details || []),
])];
const stationIndex = id => ISLANDS.findIndex(s => s.id === id);
const completeStation = (state, id) => {
  for (const node of islandNodes(id)) state.explore.done[id][node.id] = true;
};

test('v5：六跨頁、31 個唯一站點；正文節次遞增（提前站除外），醇脫水在取代與消去章末，判斷表在卷末複習', () => {
  assert.equal(PATH_KEY, 'organic-path-v5');
  assert.equal(DATA_VERSION, '5');
  assert.equal(freshPath().version, 5);
  assert.deepEqual(BOOK.map(s => s.id), ['sp1','sp2','sp3','sp4','sp5','sp6']);
  assert.equal(BOOK[4].stations.at(-1).id, 'dehydration');
  assert.deepEqual(BOOK[1].stations.filter(s => s.early).map(s => s.id), ['alcohol-name']);
  const stations = BOOK.flatMap(s => s.stations);
  assert.equal(stations.length, 31);
  assert.equal(new Set(stations.map(s => s.id)).size, 31);
  assert.deepEqual(ISLANDS.map(s => s.id), stations.map(s => s.id));
  // Stations marked early (alcohol naming on the naming spread) are taught ahead on purpose.
  const sections = BOOK.slice(0, -1).flatMap(s => s.stations).filter(s => !s.early).map(s => {
    const match = /^(\d+)\.(\d+)(?:–\d+\.\d+)?$/.exec(s.section);
    assert.ok(match, s.section);
    return [Number(match[1]), Number(match[2])];
  });
  for (let i = 1; i < sections.length; i++) {
    const [chapter, section] = sections[i], [prevChapter, prevSection] = sections[i - 1];
    assert.ok(chapter > prevChapter || chapter === prevChapter && section >= prevSection,
      `${sections[i - 1]} → ${sections[i]}`);
  }
  assert.deepEqual(BOOK.at(-1).stations, [{id:'final', section:'11.12'}]);
  assert.deepEqual(ISLANDS.filter(s => s.kind === 'reaction').map(s => s.id), STAGES.map(s => s.id));
  assert.deepEqual(ISLANDS.filter(s => s.kind === 'card').map(s => s.id), CARD_STATIONS.map(c => c.id));
  assert.deepEqual(ISLANDS.filter(s => s.kind === 'review').map(s => s.id), ['final']);
  assert.deepEqual(new Set(unlockedTypes('final')), new Set(Object.keys(TYPES).filter(t => t !== 'rearrangement')));
  BOOK.forEach((sp, i) => sp.stations.forEach(s => assert.equal(spreadOf(s.id), i)));
  assert.equal(spreadOf('missing'), -1);
});

test('單卡站、反應站與總複習畫面順序；沒有診斷或 mixed 節點', () => {
  for (const card of CARD_STATIONS) {
    assert.deepEqual(islandNodes(card.id).map(n => n.id), ['card']);
    assert.deepEqual(islandNodes(card.id)[0].cards, [card.id]);
  }
  for (const stage of STAGES) {
    assert.deepEqual(islandNodes(stage.id).map(n => n.id), [
      ...(stage.primers.length ? ['primers'] : []), 'concepts','contrast','branches','arrows',
    ]);
    const screens = kind => nodeScreens(stage.id, islandNodes(stage.id).find(n => n.id === kind));
    assert.equal(screens('contrast').length, stage.pairs.length + (stage.compare || []).length);
    assert.equal(screens('branches').length, stage.branches.length);
    assert.equal(screens('arrows').length, stage.arrowKinds.length);
    assert.equal(screens('concepts')[0].type, 'concept');
    assert.equal(screens('concepts')[0].index, 0);
  }
  assert.deepEqual(islandNodes('final').map(n => n.id), ['table']);
  assert.deepEqual(nodeScreens('final', islandNodes('final')[0]), [{type:'table'}]);
  for (const card of cards) {
    const loc = cardLocation(card.id);
    assert.ok(loc, card.id);
    const screens = nodeScreens(loc.island, islandNodes(loc.island)[loc.node]);
    assert.equal(screens[loc.screen].type, 'read', card.id);
    assert.deepEqual(screens.filter(s => s.card === card.id).map(s => s.type), [
      'read', ...(FIGURES[card.id] || card.widget || card.visual ? ['figure'] : []),
      ...(card.demos?.length ? ['demo'] : []), 'check',
    ], card.id);
  }
});

test('圖解覆蓋：每張站點卡、primer、detail 都有可用的圖解或模型', () => {
  assert.equal(new Set(cards.map(c => c.id)).size, cards.length, '卡片只能有一個教學位置');
  for (const card of cards) {
    const figures = [].concat(FIGURES[card.id] || []);
    assert.ok(figures.length || card.widget || card.visual || card.demos?.length, `${card.id} 缺圖解或模型`);
    for (const figure of figures) assert.ok(figure && typeof figure.kind === 'string', card.id);
    for (const demo of card.demos || []) {
      assert.ok(REACTION_EXAMPLES[demo.kind]?.some(e => e.id === demo.example), `${card.id}: ${demo.example}`);
    }
    assert.ok(card.body.length && card.pages.length, card.id);
    assert.ok(Number.isInteger(card.check.answer) && card.check.answer >= 0 && card.check.answer < card.check.options.length, card.id);
  }
});

test('書本進度：只有最早未完成站為 next，走完一站後換下一站', () => {
  const state = freshPath();
  const nodes = () => bookProgress(state).flatMap(sp => sp.nodes);
  for (const [index, station] of ISLANDS.entries()) {
    const before = nodes();
    assert.deepEqual(before.map(n => n.state), ISLANDS.map((_, i) => i < index ? 'done' : i === index ? 'next' : 'todo'));
    completeStation(state, station.id);
  }
  assert.ok(nodes().every(n => n.state === 'done'));
  assert.equal(nodes().filter(n => n.state === 'next').length, 0);
  assert.equal(validPath(state), true);
});

test('跳讀與部分完成不推進 next；書本保留錯答紅旗，改正後消失', () => {
  const state = freshPath(), last = ISLANDS.at(-1).id;
  state.explore.seen[last] = true;
  completeStation(state, last);
  const reaction = STAGES.find(s => s.primers.length);
  state.explore.done[reaction.id][islandNodes(reaction.id)[0].id] = true;
  let nodes = bookProgress(state).flatMap(sp => sp.nodes);
  assert.equal(nodes.find(n => n.id === last).state, 'done');
  assert.equal(nodes.find(n => n.id === reaction.id).state, 'todo');
  assert.equal(nodes.filter(n => n.state === 'next')[0].id, ISLANDS[0].id);
  const card = CARD_STATIONS[0];
  assert.equal(checkStatus(state, card.id), null);
  state.warm.checks[card.id] = {choice:(card.check.answer + 1) % card.check.options.length, first:false};
  assert.equal(checkStatus(state, card.id), 'wrong');
  assert.equal(bookProgress(state)[0].nodes[0].flag, true);
  state.warm.checks[card.id].choice = card.check.answer;
  assert.equal(checkStatus(state, card.id), 'right');
  assert.equal(bookProgress(state)[0].nodes[0].flag, false);
  assert.equal(state.warm.checks[card.id].first, false);
});

test('書本 HTML 使用同順序站點、狀態與前後翻頁控制', () => {
  const state = freshPath(), spreads = bookProgress(state);
  for (let i = 0; i < BOOK.length; i++) {
    const html = bookHTML({spreads, spread:i, hero:state.stage});
    assert.deepEqual([...html.matchAll(/data-station="([^"]+)"/g)].map(m => m[1]), BOOK[i].stations.map(s => s.id));
    assert.match(html, /data-book-page="prev"/);
    assert.match(html, /data-book-page="next"/);
    assert.match(html, new RegExp(`data-book-spread="${BOOK[i].id}"`));
  }
});

test('卡片回看只指向同站或更早；概念 cue 可指向後站且目標必須存在', () => {
  for (const card of cards) {
    const from = stationIndex(cardLocation(card.id).island);
    for (const id of card.review || []) {
      const to = cardLocation(id);
      assert.ok(to, `${card.id} → ${id}`);
      assert.ok(stationIndex(to.island) <= from, `${card.id} 不得回看後站 ${id}`);
    }
  }
  let previews = 0;
  for (const stage of STAGES) for (const concept of stage.concepts) for (const cue of concept.cues || []) {
    for (const id of cue.review) {
      const to = cardLocation(id);
      assert.ok(to, `${stage.id} cue → ${id}`);
      if (stationIndex(to.island) > stationIndex(stage.id)) previews++;
    }
  }
  assert.ok(previews > 0, '後站 cue 由 path-browser 驗證下一節預告標示');
});

test('v5 位置快照獨立；拒絕舊版、不存在的站點及越界節點', () => {
  const state = freshPath(), before = snapshot(state);
  assert.equal(validPath(state), true);
  assert.equal(locationCard(before), CARD_STATIONS[0].id);
  state.explore.pos[state.stage].screen++;
  assert.equal(before.pos[state.stage].screen, 0);
  for (const version of [3, 4, 6]) assert.equal(validPath({...state, version}), false);
  assert.equal(validPath({...state, stage:'missing'}), false);
  state.explore.pos[state.stage].node = islandNodes(state.stage).length;
  assert.equal(validPath(state), false);
});

test('手冊每卡恰有一個能力分組；預覽不直接跳轉，最近錯答標需回看', () => {
  assert.deepEqual(COMPETENCIES.flatMap(c => c.cards).sort(), cards.map(c => c.id).sort());
  const state = freshPath(), comp = COMPETENCIES[0], card = cards.find(c => c.id === comp.cards[0]);
  assert.equal(competencyStatus(state, comp), 'todo');
  const closed = competencyListHTML(state);
  assert.equal((closed.match(/data-comp-toggle=/g) || []).length, COMPETENCIES.length);
  assert.doesNotMatch(closed, /data-map-go=/);
  const open = competencyListHTML(state, {open:comp.id, pick:card.id});
  assert.match(open, new RegExp(`data-card-preview="${card.id}"`));
  assert.match(open, new RegExp(`data-map-go="${card.id}"`));
  for (const id of comp.cards) state.warm.checks[id] = {choice:cards.find(c => c.id === id).check.answer, first:true};
  assert.equal(competencyStatus(state, comp), 'mastered');
  state.warm.checks[card.id].choice = (card.check.answer + 1) % card.check.options.length;
  assert.equal(competencyStatus(state, comp), 'review');
});

test('全部卡片與概念原文頁碼都有伺服器白名單', () => {
  const source = fs.readFileSync(new URL('../server.py', import.meta.url), 'utf8');
  const allowed = new Set(source.match(/SOURCE_PAGES = \{([^}]*)\}/)[1].split(',').map(Number));
  const missing = [...new Set([...cards, ...STAGES.flatMap(s => s.concepts)]
    .flatMap(card => card.pages).filter(page => !allowed.has(page)))].sort((a, b) => a - b);
  assert.deepEqual(missing, [], 'server.py SOURCE_PAGES 缺少課程引用頁碼');
});
