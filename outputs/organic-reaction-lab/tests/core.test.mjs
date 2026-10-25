import test from 'node:test';
import assert from 'node:assert/strict';
import {angleDistance, inspectGeometry, gradeLevel, recordAttempt, gradeExam, parseProgress} from '../logic.js';
import {makeModel, dihedral, V} from '../geometry.js';
import {examItems} from '../curriculum.js';
import {newMechanism} from '../electron-flow.js';

test('E2 不能只轉視角或未選 β-H 就取得空間證據', () => {
  assert.equal(inspectGeometry('e2', {torsion: 60, beta: 'HB1'}).ok, false);
  assert.equal(inspectGeometry('e2', {torsion: 180, beta: ''}).ok, false);
  assert.equal(inspectGeometry('e2', {torsion: -180, beta: 'HB1'}).ok, true);
  assert.equal(angleDistance(359, 0), 1);
});
test('椅式 Br 軸向與正確的氫缺一不可', () => {
  assert.equal(inspectGeometry('chair', {chair: 'equatorial', beta: 'H6'}).ok, false);
  assert.equal(inspectGeometry('chair', {chair: 'axial', beta: 'H2'}).ok, false);
  assert.equal(inspectGeometry('chair', {chair: 'axial', beta: 'H6'}).ok, true);
});
test('原型不能以高分掩蓋錯誤機構或缺少三維證據', () => {
  const l = {answer:'SN2', reasons:[{id:'a',correct:true},{id:'b',correct:true},{id:'c',correct:false}], sequenceAnswer:'one',productAnswer:'inversion',competitionAnswer:'minor'};
  const d = {mechanism:'SN2', reasons:['a','b'], sequence:'one',product:'inversion',competition:'minor'};
  assert.equal(gradeLevel(l,d,true).score,10);
  assert.equal(gradeLevel(l,d,true).passed,true);
  assert.equal(gradeLevel(l,d,false).score,8);
  assert.equal(gradeLevel(l,d,false).passed,false);
  assert.equal(gradeLevel(l,{...d,reasons:['a','b','c']},true).checks.reasons,false);
});
test('首次作答與提示紀錄不可被之後的高分覆寫', () => {
  const a=recordAttempt(null,{score:4,passed:false,hints:0});
  const b=recordAttempt(a,{score:10,passed:true,hints:2});
  assert.equal(b.first.score,4); assert.equal(b.first.hints,0);
  assert.equal(b.best,10);assert.equal(b.attempts.length,2); assert.equal(b.passed,true);
});
test('未答題不給分；分項與總分可獨立核對', () => {
  const q=[{id:'a',answer:'x',points:15,dimension:'space'},{id:'b',answer:'y',points:10,dimension:'mechanism'}];
  const r=gradeExam(q,{a:'x'});assert.equal(r.score,15); assert.deepEqual(r.dimensions.space,{earned:15,possible:15});
});
test('受損或不同版本進度不得被當成有效紀錄', () => {
  assert.equal(parseProgress(null).current,0);
  assert.throws(()=>parseProgress('{'));assert.throws(()=>parseProgress('{"version":7}'));
});
test('空間評量：選對答案但沒有幾何證據，只能取得概念分', () => {
  const items=[{id:'s',answer:'1',points:15,dimension:'space',spatial:'e2'}];
  assert.equal(gradeExam(items,{s:'1'},{}).score,10);
  assert.equal(gradeExam(items,{s:'0'},{s:{valid:true}}).score,5);
  assert.equal(gradeExam(items,{s:'1'},{s:{valid:true}}).score,15);
});
test('不可信進度的巢狀紀錄不能使介面失效', () => {
  assert.throws(()=>parseProgress(JSON.stringify({version:1,current:0,levels:{sn2:{attempts:'bad'}},exams:{},drafts:{}})));
  assert.throws(()=>parseProgress(JSON.stringify({version:1,current:0,levels:{},exams:{pre:{}},drafts:{}})));
});
test('E2 幾何由座標決定，整體剛體旋轉不改變二面角',()=>{
  const m=makeModel('e2',{torsion:180,beta:'HB1'}),p=id=>m.atoms.find(a=>a.id===id).p;
  assert.ok(Math.abs(m.measurement-180)<1e-8);
  const rotate=a=>[a[2],a[0],a[1]];
  assert.ok(Math.abs(Math.abs(dihedral(...['HB1','CB','CA','Br'].map(id=>rotate(p(id)))))-180)<1e-8);
  const swapped=makeModel('e2',{torsion:300,beta:'HB2'});
  const original=makeModel('e2',{torsion:180,beta:'HB1'});
  for(const id of ['HB1','HB2','M4']){
    assert.ok(Math.hypot(...V.sub(swapped.atoms.find(a=>a.id===id).p,original.atoms.find(a=>a.id===id).p))<1e-8);
  }
});
test('椅式實際座標支持 H6 anti，排除 C2 的氫',()=>{
  assert.ok(Math.abs(makeModel('chair',{chair:'axial',beta:'H6'}).measurement-180)<1e-8);
  assert.ok(makeModel('chair',{chair:'axial',beta:'H2'}).measurement<90);
  assert.ok(makeModel('chair',{chair:'equatorial',beta:'H6'}).measurement<90);
});
test('SN1 中間體為平面，進攻後恢復四面體且不再與 Br 成鍵',()=>{
  const middle=makeModel('sn1',{step:1,face:'front'});
  assert.ok(middle.atoms.filter(a=>['M1','M2','M3'].includes(a.id)).every(a=>a.p[2]===0));
  const attacked=makeModel('sn1',{step:2,face:'back'});
  assert.ok(attacked.atoms.filter(a=>['M1','M2','M3'].includes(a.id)).every(a=>a.p[2]>0));
  assert.ok(attacked.atoms.find(a=>a.id==='Nu').p[2]<0);
  assert.equal(attacked.bonds.some(b=>b.a==='CA'&&b.b==='Br'),false);
});
test('三份評量各 100 分，操作證據共 10 分且題目識別唯一',()=>{
  for(const form of ['pre','post','delay']){
    const items=examItems(form);assert.equal(items.length,9);assert.equal(new Set(items.map(q=>q.id)).size,9);
    const answers=Object.fromEntries(items.map(q=>[q.id,q.answer]));
    const evidence=Object.fromEntries(items.filter(q=>q.spatial).map(q=>[q.id,{valid:true}]));
    const mechanisms={};
    for(const q of items.filter(q=>q.mechanism)){
      const work=newMechanism(q.mechanism);
      const pairs=q.mechanism==='sn2'?[['lpNu','CA'],['CBr','Br']]:[['lpBase','HB'],['CH','CC'],['CBr','Br']];
      work.steps[0].arrows=pairs.map(([from,to])=>({from,to,electrons:2,bend:45}));work.steps[0].confirmed=true;mechanisms[q.id]=work;
    }
    assert.equal(gradeExam(items,answers,evidence,mechanisms).score,100);
    assert.equal(gradeExam(items,answers,{},mechanisms).score,90);
    assert.equal(gradeExam(items,answers,evidence,{}).score,90);
  }
});
