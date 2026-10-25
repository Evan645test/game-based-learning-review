import {COURSE_CASES,newReasoning,geometryCorrect,geometryStateValid} from './course-content.js';
import {mountArrowEditor} from './arrow-editor.js';
import {validWork,validateMechanism,arrowContext} from './electron-flow.js';
import {mountGeometry,esc} from './reason-workbench.js';

export const CHECK_PREFIX='organic-course-check-v2:';
const memory=new Map(),blocked=new Set();
export const checkSnapshots=()=>Object.fromEntries([...memory].map(([id,r])=>[id,structuredClone(r)]));
export function mountCourseCheck(root,{caseId,onNotice=()=>{}}){
 const c=COURSE_CASES.find(c=>c.id===caseId);if(!c)throw new Error('找不到課內檢核內容。');
 let record=memory.get(caseId)||{version:2,caseId,draft:newReasoning(c),first:null,latest:null,tool:0},child=null,request=null,destroyed=false;
 try{if(!memory.has(caseId)){const raw=localStorage.getItem(CHECK_PREFIX+caseId);if(raw){const r=JSON.parse(raw);if(r?.version!==2||r.caseId!==caseId||r.draft?.version!==1||![0,1].includes(r.tool)||!c.kinds.every(k=>validWork(k,r.draft?.work?.[k])&&geometryStateValid(k,r.draft?.geometry?.[k]?.state)&&typeof r.draft?.geometry?.[k]?.captured==='boolean')||!Number.isInteger(r.draft.hints)||r.draft.hints<0)throw new Error();record=r;}}}catch{blocked.add(caseId);onNotice('部分自我檢核紀錄無法讀寫，原資料保留，本頁暫存。');}
 const save=()=>{memory.set(caseId,record);if(blocked.has(caseId))return;try{localStorage.setItem(CHECK_PREFIX+caseId,JSON.stringify(record));}catch{blocked.add(caseId);onNotice('自我檢核暫存於本頁，重新整理後可能無法保留。');}};
 const $=s=>root.querySelector(s),kind=c.kinds[0];
 function draw(){
  request?.abort();child?.destroy();root.innerHTML=`<section data-course-check="${caseId}"><p class="teacher-note">自我檢核：${esc(c.a)} ＋ ${esc(c.b)}。先記錄自己的畫法與構形，再檢查；不設通關分數。</p><nav class="check-tools" aria-label="檢核的證據"><button data-check-tool="0" aria-pressed="${record.tool===0}">電子機構</button><button data-check-tool="1" aria-pressed="${record.tool===1}">三維空間</button></nav><div data-check-work></div><div class="course-actions"><button data-evidence-check>檢查這份證據</button><button data-check-ai>請 AI 提示電子修正位置</button></div><p class="feedback-box" data-check-feedback role="status" hidden></p></section>`;
  root.querySelectorAll('[data-check-tool]').forEach(b=>b.onclick=()=>{record.tool=Number(b.dataset.checkTool);save();draw();});
  if(record.tool===0)child=mountArrowEditor($('[data-check-work]'),{kind,work:record.draft.work[kind],assessment:true,allowAI:false,revealProducts:false,onChange:w=>{record.draft.work[kind]=w;save();}});
  else child=mountGeometry($('[data-check-work]'),kind,record.draft.geometry[kind],save);
  $('[data-evidence-check]').onclick=()=>{const flow=validateMechanism(kind,record.draft.work[kind]).ok,space=geometryCorrect(kind,record.draft.geometry[kind]),report={flow,space,evidence:structuredClone(record.draft),at:new Date().toISOString()};record.first||=report;record.latest=report;save();const box=$('[data-check-feedback]');box.hidden=false;box.textContent=record.tool===0?(flow?'目前完整電子機構符合本例。再用三維空間檢查方向。':arrowContext(kind,record.draft.work[kind]).diagnosis.join(' ')):(space?'所保存構形支持本例路徑。請把方向與電子移動連起來。':'目前尚未保存支持本例的構形。'+c.geometry);};
  $('[data-check-ai]').onclick=async()=>{
   const b=$('[data-check-ai]'),box=$('[data-check-feedback]'),flow=arrowContext(kind,record.draft.work[kind]);b.disabled=true;box.hidden=false;box.textContent='正在取得核對過的電子提示…';record.draft.hints++;save();request?.abort();request=new AbortController();const timer=setTimeout(()=>request?.abort(),50000);
   try{const response=await fetch('/api/hint',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({level:c.id,context:{electronFlow:flow}}),signal:request.signal});const result=await response.json();if(!response.ok||!result.grounded||typeof result.text!=='string')throw new Error();if(!destroyed)box.textContent=`本機 AI（${result.model}）：${result.text}`;}
   catch{if(!destroyed)box.textContent='內建電子提示：'+(flow.diagnosis[0]||'請檢查其餘機構步驟與保存的空間證據。')+'（本機 AI 未連接或未完成）';}
   finally{clearTimeout(timer);if(!destroyed)b.disabled=false;}
  };
 }
 draw();return {destroy(){destroyed=true;child?.destroy();request?.abort();save();}};
}
