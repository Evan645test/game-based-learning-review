import test from 'node:test';
import assert from 'node:assert/strict';
import {islandNodes, islandBuildings, currentBuilding} from '../island-map.js';
import {freshPath, validPath, buildingProgress, completeBuilding, islandDone, upgradeBuildingVisits} from '../learning-path.js';
import {CARD_STATIONS, STAGES} from '../course-path.js';

test('每張單卡站只有一個學習單位，位置涵蓋 read 到 check', () => {
  for (const card of CARD_STATIONS) {
    const buildings = islandBuildings(card.id);
    assert.equal(buildings.length, 1);
    assert.equal(buildings[0].card, card.id);
    assert.equal(buildings[0].screen, 0);
    assert.ok(buildings[0].end >= 2, card.id);
    for (let screen = 0; screen <= buildings[0].end; screen++) {
      assert.equal(currentBuilding(card.id, {node:0, screen}), 0);
    }
    const state = freshPath();
    assert.equal(completeBuilding(state, card.id, 0), -1);
    assert.equal(islandDone(state, card.id), true);
  }
});

test('反應站各單位依序完成；節點內尚有卡片時不提早標記整段完成', () => {
  for (const stage of STAGES) {
    const state = freshPath(), buildings = islandBuildings(stage.id), nodes = islandNodes(stage.id);
    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      assert.equal(buildingProgress(state, stage.id)[i].state, 'next');
      const next = completeBuilding(state, stage.id, i);
      assert.equal(next, i + 1 < buildings.length ? i + 1 : -1);
      assert.equal(Boolean(state.explore.done[stage.id][nodes[b.node].id]),
        buildings.every((other, j) => other.node !== b.node || j <= i));
    }
    assert.equal(islandDone(state, stage.id), true);
    assert.equal(validPath(state), true);
  }
});

test('錯答旗標來自最近卡片檢查，走完仍保留，改正後清除', () => {
  const state = freshPath(), stage = STAGES.find(s => s.primers.length), card = stage.primers[0];
  const index = islandBuildings(stage.id).findIndex(b => b.card === card.id);
  state.warm.checks[card.id] = {choice:(card.check.answer + 1) % card.check.options.length, first:false};
  completeBuilding(state, stage.id, index);
  const flagged = buildingProgress(state, stage.id)[index];
  assert.equal(flagged.state, 'done');
  assert.equal(flagged.flag, true);
  assert.deepEqual(flagged.wrong, [card.id]);
  state.warm.checks[card.id].choice = card.check.answer;
  assert.equal(buildingProgress(state, stage.id)[index].flag, false);
});

test('概念 detail 與母概念共用學習單位，detail 的錯答有旗標', () => {
  for (const stage of STAGES) for (const concept of stage.concepts) for (const card of concept.details || []) {
    const state = freshPath(), building = islandBuildings(stage.id).find(b => b.cards.includes(card.id));
    assert.ok(building, card.id);
    assert.equal(building.kind, 'concepts');
    assert.equal(building.label, concept.title);
    state.warm.checks[card.id] = {choice:(card.check.answer + 1) % card.check.options.length, first:false};
    assert.deepEqual(buildingProgress(state, stage.id).find(b => b.id === building.id).wrong, [card.id]);
  }
});

test('upgradeBuildingVisits 保留位置與檢查，且重複執行無副作用', () => {
  const state = freshPath(), stage = STAGES.find(s => s.primers.length > 1), buildings = islandBuildings(stage.id);
  state.explore.buildings = 2;
  state.explore.pos[stage.id] = {node:buildings[1].node, screen:buildings[1].end + 1};
  const card = stage.primers[0];
  state.warm.checks[card.id] = {choice:card.check.answer, first:true};
  const before = structuredClone({pos:state.explore.pos, checks:state.warm.checks});
  assert.equal(upgradeBuildingVisits(state), true);
  assert.equal(upgradeBuildingVisits(state), false);
  assert.equal(state.explore.buildings, 1);
  assert.deepEqual({pos:state.explore.pos, checks:state.warm.checks}, before);
  assert.equal(buildingProgress(state, stage.id)[1].state, 'done');
  assert.equal(validPath(state), true);
});

test('不存在的學習單位不得更動完成狀態', () => {
  const state = freshPath(), id = CARD_STATIONS[0].id, before = structuredClone(state);
  for (const index of [-1, islandBuildings(id).length]) assert.throws(() => completeBuilding(state, id, index), RangeError);
  assert.deepEqual(state, before);
});
