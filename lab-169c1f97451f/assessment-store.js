import {examItems3,EXAM_POINTS} from './exam-items.js';
import {validWork,validateMechanism} from './electron-flow.js';
import {TYPES} from './course-path.js';

export const ASSESS_PREFIX='organic-assessment-v3:attempt:';
export const FORMS=['post','delay'];
const plain=o=>Boolean(o&&typeof o==='object'&&!Array.isArray(o));
const DIMENSIONS={mech:'反應類型判斷',reason:'判斷依據',product:'產物預測',arrows:'電子箭頭'};
const answered=(d,id,key,n)=>Number.isInteger(d?.answers?.[id]?.[key])&&d.answers[id][key]>=0&&d.answers[id][key]<n;
// Arrows are drawn on the template of the type the learner chose; they score only when that type is right.
export function arrowsComplete(d,id){const m=d?.mechanisms?.[id];return Boolean(plain(m)&&TYPES[m.kind]&&validWork(m.kind,m.work)&&m.work.steps.every(s=>s.confirmed&&s.arrows.length>0));}
export function completeAssessment(form,d){
 if(!FORMS.includes(form)||!plain(d))return false;
 return examItems3(form).every(q=>TYPES[d.answers?.[q.id]?.mech]&&answered(d,q.id,'reason',q.reasons.length)&&answered(d,q.id,'product',q.products.length)&&arrowsComplete(d,q.id)&&d.mechanisms[q.id].kind===d.answers[q.id].mech);
}
export function gradeAssessment(form,d){
 const dimensions=Object.fromEntries(Object.entries(DIMENSIONS).map(([k,name])=>[name,{earned:0,possible:0}])),items={};let score=0;
 for(const q of examItems3(form)){
  const a=d?.answers?.[q.id]||{},m=d?.mechanisms?.[q.id],r={mech:a.mech===q.type,reason:a.reason===0,product:a.product===0,arrows:a.mech===q.type&&m?.kind===q.type&&validateMechanism(q.type,m.work).ok};
  for(const [k,ok] of Object.entries(r)){const dim=dimensions[DIMENSIONS[k]];dim.possible+=EXAM_POINTS[k];if(ok){dim.earned+=EXAM_POINTS[k];score+=EXAM_POINTS[k];}}
  items[q.id]=r;
 }
 return {score,dimensions,items};
}
export function makeAssessmentRecord(form,d,id=crypto.randomUUID()){
 if(!FORMS.includes(form))throw new Error('無效的評量種類。');
 const answers={},mechanisms={};
 for(const q of examItems3(form)){const a=d?.answers?.[q.id];if(plain(a))answers[q.id]={...(TYPES[a.mech]?{mech:a.mech}:{}),...(answered(d,q.id,'reason',q.reasons.length)?{reason:a.reason}:{}),...(answered(d,q.id,'product',q.products.length)?{product:a.product}:{})};const m=d?.mechanisms?.[q.id];if(plain(m)&&TYPES[m.kind]&&validWork(m.kind,m.work))mechanisms[q.id]=structuredClone(m);}
 const clean={answers,mechanisms},completed=completeAssessment(form,clean);
 return {schema:3,id,form,gradingVersion:'path-assessment-v3',...gradeAssessment(form,clean),completed,answers,mechanisms,at:new Date().toISOString(),startedAt:d?.startedAt||new Date().toISOString()};
}
export function validAssessmentRecord(r){
 if(r?.schema!==3||typeof r.id!=='string'||!FORMS.includes(r.form)||r.gradingVersion!=='path-assessment-v3'||typeof r.completed!=='boolean'||!Number.isFinite(r.score)||!Number.isFinite(Date.parse(r.at))||!plain(r.answers)||!plain(r.mechanisms))return false;
 try{const actual=makeAssessmentRecord(r.form,r,r.id);return actual.completed===r.completed&&actual.score===r.score;}catch{return false;}
}
export function createAssessmentStore(storage,onNotice=()=>{}){
 const memory=new Map();let canWrite=true;
 function records(){
  const found=new Map(memory);try{for(let i=0;i<storage.length;i++){const key=storage.key(i);if(!key?.startsWith(ASSESS_PREFIX))continue;try{const r=JSON.parse(storage.getItem(key));if(!validAssessmentRecord(r)||key!==ASSESS_PREFIX+r.id)throw new Error();found.set(r.id,r);}catch{onNotice('有評量紀錄無法讀取，原資料保留，不列入比較。');}}}catch{canWrite=false;onNotice('無法讀取瀏覽器儲存區；本次紀錄暫存於本頁。');}
  return [...found.values()].sort((a,b)=>a.at.localeCompare(b.at)||a.id.localeCompare(b.id));
 }
 return {records,submit(form,d){const r=makeAssessmentRecord(form,d);if(canWrite){try{const key=ASSESS_PREFIX+r.id;if(storage.getItem(key)!==null)throw new Error('duplicate');storage.setItem(key,JSON.stringify(r));}catch{canWrite=false;onNotice('評量已暫存本頁，瀏覽器無法保存；可先匯出紀錄。');}}memory.set(r.id,r);return structuredClone(r);}};
}
