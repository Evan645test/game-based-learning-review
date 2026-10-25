import test from 'node:test';
import assert from 'node:assert/strict';
import {LEARNING_UNITS,validLearningCourse,upgradeLearningCourse} from '../learning-course.js';

const legacy=()=>({version:2,unit:0,records:Object.fromEntries(LEARNING_UNITS.map(u=>[u.id,{phase:0,concept:0,prediction:null,diagram:false,observed:false,first:null,latest:null,done:false}]))});

test('舊版尚未作答的預測位置改為說明，不改變輸入資料',()=>{
 const old=legacy(),raw=JSON.stringify(old),next=upgradeLearningCourse(old);
 assert.equal(JSON.stringify(old),raw);assert.equal(next.flowVersion,2);
 for(const u of LEARNING_UNITS){assert.equal(next.records[u.id].phase,1);assert.equal(next.records[u.id].prediction,null);}
 assert.equal(validLearningCourse(next),true);assert.deepEqual(upgradeLearningCourse(next),next);
});

test('舊版說明、三維觀看、首次與最近推理及完成狀態完整接續',()=>{
 const old=legacy();old.unit=2;
 Object.assign(old.records.charge,{phase:1,concept:2,prediction:1});
 Object.assign(old.records.donor,{phase:2,concept:2,prediction:2,diagram:true,seenFrames:[0,1]});
 Object.assign(old.records.target,{phase:4,concept:2,prediction:0,diagram:true,observed:true,first:{product:1,reason:0},latest:{product:0,reason:2}});
 Object.assign(old.records.product,{phase:5,concept:1,prediction:2,diagram:true,observed:true,first:{product:2,reason:1},latest:{product:1,reason:0},done:true});
 const next=upgradeLearningCourse(old);assert.equal(next.unit,2);assert.deepEqual(next.records,old.records);assert.equal(validLearningCourse(next),true);
});

test('新流程說明可尚無答案，圖解完成才進預測，預測完成才進觀察',()=>{
 const s=upgradeLearningCourse(legacy()),r=s.records.charge;
 r.phase=0;assert.equal(validLearningCourse(s),false);
 r.diagram=true;r.concept=3;assert.equal(validLearningCourse(s),true);
 r.phase=2;assert.equal(validLearningCourse(s),false);
 r.prediction=0;assert.equal(validLearningCourse(s),true);
 r.phase=3;assert.equal(validLearningCourse(s),false);
 r.observed=true;assert.equal(validLearningCourse(s),true);
});

test('壞資料與未知流程版本不遷移，以便保留原始資料',()=>{
 assert.throws(()=>upgradeLearningCourse({version:2}),TypeError);
 const s=legacy();s.flowVersion=99;assert.throws(()=>upgradeLearningCourse(s),TypeError);
});
