import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAM_FORMS} from '../exam-items.js';
import {newMechanism,mechanismSpec} from '../electron-flow.js';
import {makeAssessmentRecord,completeAssessment,createAssessmentStore,ASSESS_PREFIX,validAssessmentRecord} from '../assessment-store.js';

function draft(form,{correct=true,wrongMech=null}={}){
 const d={answers:{},mechanisms:{}};
 for(const q of EXAM_FORMS[form]){
  const kind=wrongMech&&q.id===wrongMech?(q.type==='sn2'?'sn1':'sn2'):q.type,w=newMechanism(kind);
  mechanismSpec(kind).steps.forEach((s,i)=>{w.steps[i].arrows=correct?structuredClone(s.required):[{from:'X',to:'Y',electrons:1,bend:20}];w.steps[i].confirmed=true;});
  d.answers[q.id]={mech:kind,reason:correct?0:1,product:correct?0:2};d.mechanisms[q.id]={kind,work:w};
 }
 return d;
}
function storage(){const m=new Map();return {get length(){return m.size;},key:i=>[...m.keys()][i],getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};}

test('完整且正確得 100；完整但錯誤仍是完整紀錄；空白箭頭不能冒充完整',()=>{
 for(const form of ['post','delay']){const r=makeAssessmentRecord(form,draft(form));assert.equal(r.score,100);assert.equal(r.completed,true);assert.equal(validAssessmentRecord(r),true);}
 const wrong=makeAssessmentRecord('post',draft('post',{correct:false}));assert.equal(wrong.completed,true);assert.equal(wrong.score,30);
 const d=draft('post');d.mechanisms['p-sn2'].work.steps[0].arrows=[];assert.equal(completeAssessment('post',d),false);
 delete d.answers['p-halo'];assert.equal(makeAssessmentRecord('post',d).completed,false);
});
test('選錯反應類型時，依該模板畫對的箭頭也不給箭頭分',()=>{
 const r=makeAssessmentRecord('post',draft('post',{wrongMech:'p-sn2'}));assert.equal(r.items['p-sn2'].mech,false);assert.equal(r.items['p-sn2'].arrows,false);assert.equal(r.score,94);
});
test('每次評量獨立鍵保存，交錯提交不遺失；偽造分數與受損資料不列入',()=>{
 const s=storage(),a=createAssessmentStore(s),b=createAssessmentStore(s);
 const first=a.submit('post',draft('post')),second=b.submit('delay',draft('delay',{correct:false}));assert.equal(a.records().length,2);assert.notEqual(first.id,second.id);
 s.setItem(ASSESS_PREFIX+'broken','{bad');const fake=makeAssessmentRecord('post',draft('post',{correct:false}));fake.score=100;s.setItem(ASSESS_PREFIX+fake.id,JSON.stringify(fake));
 const notes=[];assert.equal(createAssessmentStore(s,n=>notes.push(n)).records().length,2);assert.ok(notes.length);assert.equal(s.getItem(ASSESS_PREFIX+'broken'),'{bad');
 const blocked={get length(){return 0;},key:()=>null,getItem:()=>null,setItem:()=>{throw new Error('quota');}},c=createAssessmentStore(blocked,()=>{});c.submit('post',draft('post'));assert.equal(c.records().length,1);
});
