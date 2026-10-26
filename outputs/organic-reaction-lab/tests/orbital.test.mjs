import test from 'node:test';
import assert from 'node:assert/strict';
import {carbonOrbitals} from '../reaction-3d-view.js';
import {reactionScene3D} from '../reaction-3d.js';
import {paperStep,paperStereo,planarPaperPositions} from '../paper-view.js';
import {mechanismSpec} from '../electron-flow.js';
import {REACTION_EXAMPLES,exampleSpec} from '../reaction-examples.js';
import {V} from '../geometry.js';
test('碳陽離子書面式逐漸展成 120°；進攻後返回立體配置；SN2 不建立平面中間體',()=>{
 const angle=(p,c,q)=>Math.acos(Math.max(-1,Math.min(1,((p.x-c.x)*(q.x-c.x)+(p.y-c.y)*(q.y-c.y))/(Math.hypot(p.x-c.x,p.y-c.y)*Math.hypot(q.x-c.x,q.y-c.y)))))*180/Math.PI;
 const spec=mechanismSpec('sn1'),graph=paperStep(spec.steps[0]),positions=new Map([...graph.atoms].map(([id,n])=>[id,{...n}]));
 const scene=reactionScene3D('sn1',0,'product',1),end=planarPaperPositions(graph,positions,scene,1),ids=['CB','Me','Me3'];
 for(let i=0;i<3;i++)assert.ok(Math.abs(angle(end.get(ids[i]),end.get('CA'),end.get(ids[(i+1)%3]))-120)<1e-7);
 const mid=planarPaperPositions(graph,positions,scene,.5);
 for(const id of ids)assert.ok(Math.abs(mid.get(id).x-(positions.get(id).x+end.get(id).x)/2)<1e-8);
 const capture=paperStep(spec.steps[1]),p=new Map([...capture.atoms].map(([id,n])=>[id,{...n}]));
 assert.deepEqual(planarPaperPositions(capture,p,reactionScene3D('sn1',1,'product',1),1),p);
 const concerted=paperStep(mechanismSpec('sn2').steps[0]),cp=new Map(concerted.atoms);
 assert.deepEqual(planarPaperPositions(concerted,cp,reactionScene3D('sn2',0,'together',.5),.5),cp);
});

test('SN1 離解後三個 sp² 方向與一個垂直空 p 軌域；E2 的兩個碳成 sp²',()=>{
 const start=carbonOrbitals(reactionScene3D('sn1',0,'overview',0)).find(a=>a.id==='CA');
 assert.equal(start.hybrid,'sp³');assert.equal(start.directions.length,4);assert.equal(start.pAxes.length,0);
 const ion=carbonOrbitals(reactionScene3D('sn1',0,'product',1)).find(a=>a.id==='CA');
 assert.equal(ion.hybrid,'sp²');assert.equal(ion.empty,true);assert.equal(ion.directions.length,3);assert.equal(ion.pAxes.length,1);
 for(const d of ion.directions)assert.ok(Math.abs(V.dot(d,ion.pAxes[0]))<1e-8,'p 應垂直於三個 σ 鍵');
 for(const id of ['CA','CB']){
  const alkene=carbonOrbitals(reactionScene3D('e2',0,'product',1)).find(a=>a.id===id);
  assert.equal(alkene.hybrid,'sp²');assert.equal(alkene.empty,false);
  for(const d of alkene.directions)assert.ok(Math.abs(V.dot(d,alkene.pAxes[0]))<1e-7);
 }
});
test('端點軌域所有方向有效且為單位向量，不改動反應資料',()=>{
 for(const [kind,examples]of Object.entries(REACTION_EXAMPLES))for(const ex of examples){
  const spec=exampleSpec(kind,ex);
  for(let step=0;step<spec.steps.length;step++)for(const mode of ['overview','product']){
   const scene=reactionScene3D(kind,step,mode,1,spec),before=JSON.stringify(scene.atoms);
   for(const m of carbonOrbitals(scene))for(const d of [...m.directions,...m.pAxes]){assert.ok(d.every(Number.isFinite));assert.ok(Math.abs(Math.hypot(...d)-1)<1e-8,`${ex.id}/${step}/${m.id}`);}
   assert.equal(JSON.stringify(scene.atoms),before);
  }
 }
});
test('平面碳陽離子不畫立體楔形，四面體的前後鍵與實際有向體積一致',()=>{
 const graph=paperStep(mechanismSpec('sn1').steps[0]),positions=new Map([...graph.atoms].map(([id,n])=>[id,{...n}]));
 const ion=reactionScene3D('sn1',0,'product',1),flat=paperStereo(graph,positions,ion);
 assert.ok(![...flat.values()].some(w=>w.from==='CA'));
 const start=reactionScene3D('sn1',0,'overview',0),wedges=paperStereo(graph,positions,start);
 const ca=[...wedges.values()].filter(w=>w.from==='CA');
 assert.equal(ca.length,2);assert.equal(ca[0].depth,-ca[1].depth);
 const mirrored={...start,atoms:start.atoms.map(a=>({...a,p:[-a.p[0],a.p[1],a.p[2]]}))};
 const flipped=paperStereo(graph,positions,mirrored);
 for(const [key,w]of wedges)if(w.from==='CA')assert.equal(flipped.get(key).depth,-w.depth,'鏡像必須交換實心／虛線');
});
