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
 assert.equal(s.explore.done.warmup['g-tools'],undefined);
 s.explore.pos.warmup={node:first.node,screen:first.end};path.completeBuilding(s,'warmup',0);
 for(const i of [2,3])path.completeBuilding(s,'warmup',i);
 assert.equal(s.explore.done.warmup['g-tools'],true);
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
test('版面 4 遷移：舊島位置對到同一畫面，合併的建築任一走過就算走過，質子轉移答案承接到酸鹼',()=>{
 const s=path.freshPath();s.layout=3;
 // Old warm-up: g-flow held arrows and proton; the learner stood on proton's first screen (screen 4) with arrows walked.
 s.explore.pos.warmup={node:4,screen:4};s.explore.done.warmup={'g-structure':true,'g-flow/arrows':true};
 s.explore.pos.s1={node:0,screen:13};s.explore.done.s1={'primers/rs':true};
 s.explore.pos.s2={node:1,screen:0};s.explore.done.s2={primers:true};
 s.warm.checks.proton={choice:0,first:true};
 assert.equal(path.validPath(s),true,'舊位置在遷移前不會被當成壞資料');
 assert.equal(path.migratePath(s),true);assert.equal(s.layout,4);assert.equal(path.migratePath(s),false);
 const at=(isl,pos)=>{const n=map.islandNodes(isl)[pos.node];return map.nodeScreens(isl,n)[pos.screen];};
 assert.equal(at('warmup',s.explore.pos.warmup).card,'acidbase');
 const b=id=>path.buildingProgress(s,id);
 assert.equal(b('warmup').find(x=>x.card==='arrows').state,'done');assert.equal(b('warmup').find(x=>x.card==='skeletal').state,'done');
 assert.equal(b('s1').find(x=>x.id==='concepts/concept-0').state,'done','R/S 走過就算 SN2 概念建築走過');
 assert.deepEqual(at('s1',s.explore.pos.s1),{type:'check',card:'rs',concept:0},'停在 R/S 檢查的人接著停在同一題');
 assert.ok(b('s2').filter(x=>x.id==='primers'||x.id==='concepts/concept-0').every(x=>x.state==='done'),'Newman 等走過就算 E2 建築走過');
 assert.deepEqual(at('s2',s.explore.pos.s2),{type:'concept',index:0});
 assert.deepEqual(s.warm.checks.acidbase,{choice:0,first:true});assert.equal(path.validPath(s),true);
});
