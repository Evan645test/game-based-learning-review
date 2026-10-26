import test from 'node:test';
import assert from 'node:assert/strict';
import * as map from '../island-map.js';
import * as path from '../learning-path.js';
import {WARMUP} from '../course-path.js';

test('暖身每個概念都是一棟可進入的據點建築',()=>{
 const state=path.freshPath(),nodes=path.islandProgress(state,'warmup');
 const html=map.islandViewHTML({island:'warmup',nodes,hero:0});
 assert.equal((html.match(/data-concept-building=/g)||[]).length,WARMUP.length);
});
test('概念建築可分別完成，跳過一棟不會誤標整組完成',()=>{
 const s=path.freshPath(),buildings=map.islandBuildings('warmup');
 const first=buildings[0],second=buildings[1];assert.equal(first.node,second.node);
 s.explore.pos.warmup={node:second.node,screen:second.end};
 path.completeBuilding(s,'warmup',1);
 assert.equal(path.buildingProgress(s,'warmup')[0].state,'next');
 assert.equal(path.buildingProgress(s,'warmup')[1].state,'done');
 assert.equal(s.explore.done.warmup['g-structure'],undefined);
 s.explore.pos.warmup={node:first.node,screen:first.end};path.completeBuilding(s,'warmup',0);
 assert.equal(s.explore.done.warmup['g-structure'],true);
});
test('舊版已走過的卡與整組完成狀態接續，答案與目前位置不變',()=>{
 const s=path.freshPath();delete s.explore.buildings;
 s.explore.pos.warmup={node:0,screen:3};s.warm.checks.skeletal={choice:1,first:false};
 s.explore.done.s1.primers=true;const before=structuredClone({pos:s.explore.pos,checks:s.warm.checks});
 assert.equal(path.upgradeBuildingVisits(s),true);assert.equal(path.upgradeBuildingVisits(s),false);
 assert.equal(path.buildingProgress(s,'warmup')[0].state,'done');assert.equal(path.buildingProgress(s,'warmup')[1].state,'next');
 assert.ok(path.buildingProgress(s,'s1').filter(b=>b.node===0).every(b=>b.state==='done'));
 assert.deepEqual({pos:s.explore.pos,checks:s.warm.checks},before);assert.equal(path.validPath(s),true);
});
