import test from 'node:test';
import assert from 'node:assert/strict';
import {LESSONS,REACTION_TYPES,guidedMechanism,demonstrationFrames,teachingReady} from '../teaching.js';
import {mechanismSpec,validateMechanism} from '../electron-flow.js';

test('四種反應依結構變化分類，名稱數字不誤當步驟數',()=>{
 assert.equal(REACTION_TYPES.find(t=>t.id==='SN2').family,'取代');
 assert.equal(REACTION_TYPES.find(t=>t.id==='E1').family,'消去');
 assert.match(REACTION_TYPES.find(t=>t.id==='SN1').number,/不是/);
});
test('引導練習預填部分箭頭，不能因此自動取得完成狀態',()=>{
 for(const lesson of Object.values(LESSONS)){
  const work=guidedMechanism(lesson.kind);
  assert.equal(validateMechanism(lesson.kind,work).ok,false);
  assert.equal(work.steps.at(-1).arrows.length,1);
  assert.equal(work.steps.at(-1).confirmed,false);
 }
});
test('獨立挑戰準備度同時檢查概念與實際機構，不以看過頁面替代',()=>{
 const lesson=LESSONS.sn1,practice=guidedMechanism('sn1');
 const progress={answers:{family:'取代',role:'水的氧孤對電子',solvent:'溶劑化並穩定離子'},practice};
 assert.equal(teachingReady('sn1',progress),false);
 practice.steps[2].arrows=structuredClone(mechanismSpec('sn1').steps[2].required);practice.steps[2].confirmed=true;
 assert.equal(teachingReady('sn1',progress),true);
 progress.answers.role='碳正離子的正電荷';assert.equal(teachingReady('sn1',progress),false);
});
test('協同反應逐支展示時，保留同一步而非捏造中間體',()=>{
 for(const kind of ['sn2','e2','chair']){
  const frames=demonstrationFrames(kind);assert.ok(frames.every(f=>f.step===0));
  assert.ok(frames.filter(f=>f.count>0).every(f=>f.text.includes('同一步')));
 }
 assert.deepEqual([...new Set(demonstrationFrames('sn1').map(f=>f.step))],[0,1,2]);
});
test('示範框架與學生引導作答使用獨立資料',()=>{
 const before=JSON.stringify(mechanismSpec('sn2'));
 const a=guidedMechanism('sn2'),b=guidedMechanism('sn2');a.steps[0].arrows[0].to='Br';
 assert.equal(b.steps[0].arrows[0].to,'CA');assert.equal(JSON.stringify(mechanismSpec('sn2')),before);
});
