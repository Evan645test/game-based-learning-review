import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{
 const context=await browser.newContext(),pages=[];
 for(let i=0;i<12;i++){const p=await context.newPage();await p.goto('http://127.0.0.1:8768/academy.html');pages.push(p);}
 const call=(page,id,action,options)=>page.evaluate(async({id,action,options})=>{const {writeRoom}=await import('./pk-state.js');return writeRoom(id,action,options);},{id,action,options});
 const snapshot=(page,id)=>page.evaluate(async id=>(await import('./pk-state.js')).loadRoom(id),id);
 for(let attempt=0;attempt<2;attempt++){
  const id='RACE0'+attempt;let room=await call(pages[0],id,null,{create:true,size:6});await call(pages[0],id,{type:'start'});
  for(let round=0;round<6;round++){
   await Promise.all(pages.map((p,i)=>call(p,id,{type:'seen',seat:room.seats[i]})));
   await call(pages[0],id,{type:'individual'});
   const reports=await pages[0].evaluate(async round=>{const {COURSE_CASES,newReasoning,gradeReasoning}=await import('./course-content.js'),{mechanismSpec}=await import('./electron-flow.js'),c=COURSE_CASES[round],d=newReasoning(c);c.questions.forEach((q,i)=>d.answers[i]=q.answer);for(const k of c.kinds){d.work[k].steps.forEach((s,i)=>{s.arrows=mechanismSpec(k).steps[i].required;s.confirmed=true;});d.geometry[k].captured=true;}return gradeReasoning(c,d);},round);
   await Promise.all(pages.map((p,i)=>call(p,id,{type:'submit',seat:room.seats[i],report:reports})));
   room=await snapshot(pages[0],id);assert.equal(Object.keys(room.individual[round]).length,12);
   await call(pages[0],id,{type:'consensus'});await Promise.all([call(pages[0],id,{type:'team',seat:'A1',report:reports}),call(pages[6],id,{type:'team',seat:'B1',report:reports})]);
   room=await snapshot(pages[0],id);assert.equal(Object.keys(room.consensus[round]).length,2);await call(pages[0],id,{type:'reveal'});await call(pages[0],id,{type:'next'});
  }
  assert.equal((await snapshot(pages[0],id)).phase,'finished');
 }
 await pages[0].evaluate(async()=>{const {createRoom,loadRoom,writeRoom}=await import('./pk-state.js'),legacy=createRoom('OLD001',1);localStorage.setItem('organic-pk-v1:OLD001',JSON.stringify(legacy));const loaded=await loadRoom('OLD001');if(loaded.phase!=='lobby')throw new Error('migration failed');await writeRoom('OLD001',{type:'start'});if((await loadRoom('OLD001')).phase!=='demo')throw new Error('migrated transaction failed');if(!localStorage.getItem('organic-pk-v1:OLD001'))throw new Error('legacy copy removed');});
 const report={passed:true,checks:['12個分頁並行、兩間房各六回合，示範確認、個人首次與共識提交無遺漏','舊localStorage教室可匯入IndexedDB並接續，不刪除原副本']};await fs.writeFile('/private/tmp/organic-academy-verification/pk-concurrency-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
