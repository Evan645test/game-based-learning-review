import test from 'node:test';
import assert from 'node:assert/strict';
import * as map from '../island-map.js';
import * as path from '../learning-path.js';
import {PREP} from '../course-path.js';

test('w1 每張卡都有獨立建築，島圖按建築渲染可點擊節點', () => {
  const state = path.freshPath();
  const island = PREP[0];
  const buildings = map.islandBuildings(island.id);
  assert.equal(buildings.length, island.cards.length);
  for (let i = 0; i < island.cards.length; i += 1) {
    assert.equal(buildings[i].card, island.cards[i].id);
  }

  const nodes = path.buildingProgress(state, island.id);
  const html = map.islandViewHTML({island: island.id, nodes, hero: 0});
  assert.equal((html.match(/data-concept-building=/g) || []).length, island.cards.length);
});

test('建築可逐棟完成，未完成前不會把整個 cards 節點標 done', () => {
  const state = path.freshPath();
  const island = PREP[0].id;
  const buildings = map.islandBuildings(island);
  assert.equal(buildings.length >= 3, true);

  const second = buildings[1];
  state.explore.pos[island] = {node: second.node, screen: second.end};
  path.completeBuilding(state, island, 1);
  const progress = path.buildingProgress(state, island);
  assert.equal(progress[1].state, 'done');
  assert.equal(progress[0].state, 'next');
  assert.equal(state.explore.done[island].cards, undefined);

  for (let i = 0; i < buildings.length; i += 1) {
    state.explore.pos[island] = {node: buildings[i].node, screen: buildings[i].end};
    path.completeBuilding(state, island, i);
  }
  assert.equal(state.explore.done[island].cards, true);
});

test('buildingProgress 會把診斷答錯卡標紅旗，完成後旗標消失', () => {
  const state = path.freshPath();
  const island = PREP[0];
  const cardId = island.cards[0].id;
  const building = map.islandBuildings(island.id).find(row => row.card === cardId);
  assert.ok(building, cardId);

  state.diag[cardId] = {pre: {choice: 1, right: false}};
  const flagged = path.buildingProgress(state, island.id).find(row => row.card === cardId);
  assert.equal(flagged.flag, true);
  assert.deepEqual(flagged.wrong, [cardId]);

  state.diag[cardId].post = {choice: 0, right: true};
  const cleared = path.buildingProgress(state, island.id).find(row => row.card === cardId);
  assert.equal(cleared.flag, false);
});

test('upgradeBuildingVisits：v2 done 標記可升級為 v1 建築標記，且不改位置與診斷記錄', () => {
  const state = path.freshPath();
  const island = PREP[0].id;
  const buildings = map.islandBuildings(island);

  state.explore.buildings = 2;
  state.explore.pos[island] = {node: buildings[1].node, screen: buildings[1].end + 1};
  state.explore.done[island].cards = true;
  state.diag[PREP[0].cards[0].id] = {pre: {choice: 0, right: true}};
  const before = structuredClone({pos: state.explore.pos, diag: state.diag});

  assert.equal(path.upgradeBuildingVisits(state), true);
  assert.equal(path.upgradeBuildingVisits(state), false);
  assert.equal(state.explore.buildings, 1);
  assert.equal(path.validPath(state), true);
  assert.deepEqual({pos: state.explore.pos, diag: state.diag}, before);
});
