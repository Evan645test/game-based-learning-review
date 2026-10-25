import test from 'node:test';
import assert from 'node:assert/strict';
import {mechanismSpec,newMechanism,validateStep,validateMechanism,changeArrows,undoArrows,arrowContext} from '../electron-flow.js';
import {gradeLevel} from '../logic.js';
const a=(from,to,electrons=2)=>({from,to,electrons,bend:40});
test('SN2 必須同一步提供兩組電子移動，顛倒箭頭會指出來源錯誤',()=>{
 const spec=mechanismSpec('sn2');
 assert.equal(validateStep(spec,0,[a('lpNu','CA')]).ok,false);
 assert.equal(validateStep(spec,0,[a('lpNu','CA'),a('CBr','Br')]).ok,true);
 const bad=validateStep(spec,0,[a('lpNu','CA'),a('Br','CBr')]);
 assert.equal(bad.ok,false);assert.equal(bad.issues[0].code,'source');assert.match(bad.issues[0].message,/第 2 支/);
});
test('E2 不能漏斷鍵、重複搬電子或使用單電子魚鉤',()=>{
 const spec=mechanismSpec('e2'),correct=[a('lpBase','HB'),a('CH','CC'),a('CBr','Br')];
 assert.equal(validateStep(spec,0,correct).ok,true);
 assert.equal(validateStep(spec,0,correct.slice(0,2)).ok,false);
 assert.ok(validateStep(spec,0,[...correct,correct[0]]).issues.some(i=>i.code==='duplicate'));
 assert.ok(validateStep(spec,0,[{...correct[0],electrons:1},...correct.slice(1)]).issues.some(i=>i.code==='electron-count'));
});
test('SN1 三步含去質子化，不能把離去與進攻放同一步',()=>{
 const spec=mechanismSpec('sn1'),w=newMechanism('sn1');assert.equal(spec.steps.length,3);
 assert.equal(validateStep(spec,0,[a('CBr','Br'),a('lpNu','CA')]).ok,false);
 w.steps[0].arrows=[a('CBr','Br')];w.steps[0].confirmed=true;
 w.steps[1].arrows=[a('lpNu','CA')];w.steps[1].confirmed=true;
 assert.equal(validateMechanism('sn1',w).ok,false);
 w.steps[2].arrows=[a('lpBase','HN'),a('OH','Nu')];w.steps[2].confirmed=true;
 assert.equal(validateMechanism('sn1',w).ok,true);
});
test('E1 第二步無 C–Br，椅式錯誤 H2 不能當成 H6',()=>{
 assert.equal(validateStep(mechanismSpec('e1'),1,[a('lpBase','HB'),a('CH','CC')]).ok,true);
 assert.equal(validateStep(mechanismSpec('e1'),1,[a('lpBase','HB'),a('CH','CC'),a('CBr','Br')]).ok,false);
 assert.equal(validateStep(mechanismSpec('chair'),0,[a('lpBase','H2'),a('C2H','CC'),a('CBr','Br')]).ok,false);
});
test('編輯已確認步驟會取消之後的確認，復原不會偷偷恢復過關',()=>{
 const w=newMechanism('sn1');w.steps.forEach(s=>s.confirmed=true);
 changeArrows(w,[a('CBr','Br')]);assert.ok(w.steps.every(s=>!s.confirmed));
 assert.equal(undoArrows(w),true);assert.deepEqual(w.steps[0].arrows,[]);
 assert.equal(undoArrows(w,true),true);assert.equal(w.steps[0].arrows.length,1);
});
test('AI 上下文包括箭頭編號、電子來源及具體診斷',()=>{
 const w=newMechanism('sn2');w.steps[0].arrows=[a('Br','CA')];
 const context=arrowContext('sn2',w);assert.equal(context.arrows[0].number,1);assert.match(context.diagnosis[0],/第 1 支/);assert.equal(context.completed,false);
});
test('過關必須檢查實際彎箭頭，不能只選對機構敘述',()=>{
 const l={answer:'SN2',reasons:[{id:'a',correct:true},{id:'b',correct:true}],sequenceAnswer:'one',productAnswer:'p',competitionAnswer:'c'};
 const d={mechanism:'SN2',reasons:['a','b'],sequence:'one',product:'p',competition:'c'};
 assert.equal(gradeLevel(l,d,true,false).passed,false);
 assert.equal(gradeLevel(l,d,true,true).passed,true);
});
