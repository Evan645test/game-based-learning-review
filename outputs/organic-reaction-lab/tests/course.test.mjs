import test from 'node:test';
import assert from 'node:assert/strict';
import {COURSE_CASES,newReasoning,gradeReasoning,reasoningComplete,geometryCorrect,TOPICS} from '../course-content.js';
import {mechanismSpec} from '../electron-flow.js';
import {spotlightFrames,productScene,curvePoint,animationScene,spotlightFocus} from '../spotlight-demo.js';
import {REACTION_EXAMPLES,exampleSpec} from '../reaction-examples.js';

function correct(c){const d=newReasoning(c);c.questions.forEach((q,i)=>d.answers[i]=q.answer);for(const k of c.kinds){d.work[k].steps.forEach((s,i)=>{s.arrows=structuredClone(mechanismSpec(k).steps[i].required);s.confirmed=true;});const e=d.geometry[k];e.captured=true;Object.assign(e.state,{approach:180,torsion:180,step:['sn1','e1'].includes(k)?1:0,beta:k==='chair'?'H6':k==='e1'?'Hethyl':'HB1',chair:'axial'});}return d;}

test('六關必須同時以完整箭頭、空間證據與判斷取得100分',()=>{
 assert.equal(COURSE_CASES.length,6);
 for(const c of COURSE_CASES){const d=correct(c);assert.ok(reasoningComplete(c,d),c.id);assert.equal(gradeReasoning(c,d).score,100,c.id);d.work[c.kinds[0]].steps[0].arrows=[];assert.ok(gradeReasoning(c,d).score<100);}
});
test('分段題不以只作答選擇題當完成；提示不扣分，首次報告保留證據快照',()=>{
 const c=COURSE_CASES[0],d=newReasoning(c);c.questions.forEach((q,i)=>d.answers[i]=q.answer);assert.equal(reasoningComplete(c,d),false);assert.equal(gradeReasoning(c,d).score,80);
 const good=correct(c);good.hints=5;const report=gradeReasoning(c,good);assert.equal(report.score,100);good.answers[0]=0;assert.notEqual(report.evidence.answers[0],0);
});
test('錯誤的E2角度／椅式氫或不合法儲存狀態不能通過空間評量',()=>{
 for(const k of ['e2','chair']){const c=COURSE_CASES.find(c=>c.id===k),d=correct(c);assert.ok(geometryCorrect(k,d.geometry[k]));if(k==='e2')d.geometry[k].state.torsion=60;else d.geometry[k].state.beta='H2';assert.equal(geometryCorrect(k,d.geometry[k]),false);d.geometry[k].state.beta='unknown';assert.equal(geometryCorrect(k,d.geometry[k]),false);}
});
test('協同動畫的解說焦點不建立中間體；E1和SN1保留真正分步',()=>{
 for(const k of ['sn2','e2','chair']){const f=spotlightFrames(k);assert.ok(f.every(f=>f.step===0));const together=f.find(f=>f.mode==='together');assert.equal(together.arrows.length,k==='sn2'?2:3);assert.equal(f.filter(f=>f.mode==='product').length,1);}
 assert.equal(spotlightFrames('sn1').filter(f=>f.mode==='product').length,3);assert.equal(spotlightFrames('e1').filter(f=>f.mode==='product').length,2);
});
test('動畫產物反映離去、新鍵、π鍵與去質子化，不創造E2碳正離子',()=>{
 const sn2=productScene('sn2',0);assert.ok(!sn2.bonds.some(b=>b[2]==='CBr'));assert.ok(sn2.bonds.some(b=>b[2]==='newCN'));assert.equal(sn2.nodes.find(n=>n.id==='Nu').label,'I');
 assert.equal(productScene('sn1',0).nodes.find(n=>n.id==='CA').label,'Cα⁺');assert.equal(productScene('sn1',1).nodes.find(n=>n.id==='Nu').label,'OH₂⁺');
 const last=productScene('sn1',2);assert.ok(!last.nodes.some(n=>n.id==='HN'));assert.equal(last.nodes.find(n=>n.id==='Nu').label,'O');assert.equal(last.nodes.find(n=>n.id==='Base').label,'H₃O⁺');
 const e2=productScene('e2',0);assert.equal(e2.nodes.find(n=>n.id==='CA').label,'Cα');assert.ok(e2.bonds.some(b=>b[2]==='CC'&&b[3]===2));assert.ok(!e2.bonds.some(b=>b[2]==='CH'||b[2]==='CBr'));
});
test('電子動畫沿同一條二次曲線前進，端點有界且不同時間位置不同',()=>{
 const a={x:0,y:0},b={x:100,y:0};assert.equal(curvePoint(a,b,40,0).x,0);assert.equal(curvePoint(a,b,40,1).x,100);assert.equal(curvePoint(a,b,40,.5).y,20);assert.ok(curvePoint(a,b,40,.7).x>curvePoint(a,b,40,.2).x);
});
test('教材引用與測驗索引完整，保留溶劑、角色與競爭路徑',()=>{
 assert.equal(new Set(TOPICS.map(t=>t.id)).size,TOPICS.length);for(const q of TOPICS){assert.ok(q.pages.length);assert.ok(q.options[q.answer]);}for(const c of COURSE_CASES){assert.ok(c.source.length);for(const q of c.questions)assert.ok(q.options[q.answer]);}
});

test('每種反應至少四個完整例子，電子錨點、產物與離去原子一致',()=>{
 const ids=new Set();
 for(const[k,list]of Object.entries(REACTION_EXAMPLES).filter(([k])=>['sn2','sn1','e1','e2'].includes(k))){
  assert.ok(list.length>=4,k);
  for(const example of list){assert.ok(!ids.has(example.id));ids.add(example.id);assert.ok(example.pages.length);const spec=exampleSpec(k,example);for(const [i,s]of spec.steps.entries()){for(const a of s.required){assert.ok(s.nodes.some(n=>n.id===a.from));assert.ok(s.nodes.some(n=>n.id===a.to));}const product=productScene(k,i,spec);assert.ok(product.nodes.every(n=>Number.isFinite(n.x)&&Number.isFinite(n.y)));}assert.equal(spec.steps.at(-1).product,example.product);}
 }
 assert.ok(ids.size>=16);
 const methyl=exampleSpec('sn2',REACTION_EXAMPLES.sn2[0]);assert.ok(!methyl.steps[0].nodes.some(n=>['CB','Me','Me4'].includes(n.id)));assert.equal(productScene('sn2',0,methyl).nodes.find(n=>n.id==='CA').label,'CH₃');
 const ether=exampleSpec('sn1',REACTION_EXAMPLES.sn1[2]);assert.equal(ether.steps[2].nodes.find(n=>n.id==='Hkeep').label,'Me');assert.equal(productScene('sn1',2,ether).nodes.find(n=>n.id==='Base').label,'MeOH₂⁺');
 const chloride=exampleSpec('sn1',REACTION_EXAMPLES.sn1[3]);assert.equal(productScene('sn1',0,chloride).nodes.find(n=>n.id==='Br').label,'Cl⁻');
});

test('試劑先接近正確原子但尚不成鍵，化學變化階段才漸變成斷鍵',()=>{
 const point=(s,id)=>s.nodes.find(n=>n.id===id),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const far=animationScene('sn2',0,'approach',0),near=animationScene('sn2',0,'approach',1);
 assert.ok(distance(point(near,'Nu'),point(near,'CA'))<distance(point(far,'Nu'),point(far,'CA')));assert.ok(!near.bonds.some(b=>b[2]==='newCN'));
 const t0=animationScene('sn2',0,'together',0),t1=animationScene('sn2',0,'together',.7);
 assert.ok(t0.bonds.find(b=>b[2]==='CBr')[4]>t1.bonds.find(b=>b[2]==='CBr')[4]);assert.ok(t1.bonds.find(b=>b[2]==='newCN')[4]>0);
 assert.ok(distance(point(t1,'Br'),point(t1,'CA'))>distance(point(t0,'Br'),point(t0,'CA')));
 const base=animationScene('e2',0,'approach',1);assert.ok(distance(point(base,'Base'),point(base,'HB'))<distance(point(base,'Base'),point(base,'CA')));
 assert.equal(spotlightFrames('sn1').filter(f=>f.mode==='approach').length,2);
});


test('精簡觀察重點區分SN1離解與親核成鍵，不把所有單箭頭都說成離去',()=>{
 const depart=spotlightFocus('sn1',{step:0,mode:'transform',arrows:[0]}),capture=spotlightFocus('sn1',{step:1,mode:'transform',arrows:[0]});assert.match(depart,/離解/);assert.match(capture,/成鍵/);assert.doesNotMatch(capture,/離解後形成/);
 const base=spotlightFocus('e2',{step:0,mode:'focus',arrows:[0]}),pi=spotlightFocus('e2',{step:0,mode:'focus',arrows:[1]});assert.match(base,/β-H/);assert.match(pi,/π 鍵/);assert.match(spotlightFocus('e2',{step:0,mode:'together',arrows:[0,1,2]}),/3 組電子同步/);
});
