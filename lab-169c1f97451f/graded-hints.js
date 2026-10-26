import {mechanismSpec,validateStep,validateMechanism,arrowContext} from './electron-flow.js';

/** Tiered arrow feedback: level 1 names the step, level 2 names the arrow and why. */
export function gradedHint(kind,work,level=1,spec=null){
 const s=spec||mechanismSpec(kind),steps=work?.steps||[];
 const results=s.steps.map((_,i)=>validateStep(s,i,steps[i]?.arrows||[]));
 const bad=results.findIndex(r=>!r.ok);
 if(bad<0){
  const open=steps.findIndex(x=>!x?.confirmed);
  if(open>=0)return {ok:false,step:open,level:1,text:`箭頭都正確；請保存第 ${open+1} 步，才算完成整個機構。`,issues:[]};
  return {ok:true,step:-1,level,text:'全部電子移動正確：起點、終點與步驟順序都符合本機構。',issues:[]};
 }
 const r=results[bad],drawn=(steps[bad]?.arrows||[]).length,wrongArrow=r.issues.some(i=>Number.isInteger(i.arrow));
 const where=`第 ${bad+1} 步「${s.steps[bad].title}」`;
 if(level<=1)return {ok:false,step:bad,level:1,text:`${where}需要修正：${drawn===0?'還沒有畫箭頭':wrongArrow?'有箭頭的起點或終點不對':'還少了箭頭'}。先只檢查這一步的電子從哪裡來、到哪裡去。`,issues:[]};
 return {ok:false,step:bad,level:2,text:`${where}：`+r.issues.map(i=>i.message).join(' '),issues:r.issues.map(i=>i.message)};
}
export const firstArrowResult=(kind,work)=>validateMechanism(kind,work).ok;

/** Optional local-AI wording of the same approved diagnosis; falls back to level 2. */
export async function aiArrowHint(kind,work,signal){
 const flow=arrowContext(kind,work);
 const response=await fetch('/api/hint',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({level:kind,context:{electronFlow:flow}}),signal});
 const result=await response.json();if(!response.ok||!result.grounded||typeof result.text!=='string')throw new Error('ai');
 return `本機 AI（${result.model}）：${result.text}`;
}
