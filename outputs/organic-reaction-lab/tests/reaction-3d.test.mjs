import test from 'node:test';
import assert from 'node:assert/strict';
import {reactionScene3D,projectPoint,electronCurve3D} from '../reaction-3d.js';
import {REACTION_EXAMPLES,exampleSpec} from '../reaction-examples.js';
import {V,bondAngle,dihedral} from '../geometry.js';
const atom=(s,id)=>s.atoms.find(a=>a.id===id),p=(s,id)=>atom(s,id).p;
const distance=(s,a,b)=>Math.hypot(...V.sub(p(s,a),p(s,b)));
const volume=(s,center,ids)=>{const a=ids.map(id=>V.sub(p(s,id),p(s,center)));return V.dot(a[0],V.cross(a[1],a[2]));};
const ids=s=>s.atoms.map(a=>a.id).sort();
const counts=s=>s.atoms.reduce((counts,a)=>({...counts,[a.element]:(counts[a.element]||0)+1}),{});

test('三維接近維持試劑內部鍵長、尚未成鍵；SN2沿背面180度接近',()=>{
 const spec=exampleSpec('sn2',REACTION_EXAMPLES.sn2[0]),a=reactionScene3D('sn2',0,'approach',0,spec),b=reactionScene3D('sn2',0,'approach',1,spec);
 assert.ok(distance(a,'Nu','CA')>distance(b,'Nu','CA'));assert.equal(b.bonds.some(b=>b.id==='newCN'),false);
 assert.ok(Math.abs(distance(a,'Nu','Nu-H')-distance(b,'Nu','Nu-H'))<1e-9);assert.equal(bondAngle(p(b,'Nu'),p(b,'CA'),p(b,'Br')),180);
 const water=exampleSpec('sn1',REACTION_EXAMPLES.sn1[0]);for(const id of ['HN','Hkeep']){const far=reactionScene3D('sn1',1,'approach',0,water),near=reactionScene3D('sn1',1,'approach',1,water);assert.ok(Math.abs(distance(far,'Nu',id)-distance(near,'Nu',id))<1e-9);}
});
test('SN2反轉三維有向體積；SN1和E1離解後三個取代基共平面',()=>{
 const a=reactionScene3D('sn2',0,'overview',0),b=reactionScene3D('sn2',0,'product',1);assert.ok(volume(a,'CA',['Me','CB','CA-H0'])*volume(b,'CA',['Me','CB','CA-H0'])<0);
 for(const [kind,groups]of [['sn1',['CB','Me','Me3']],['e1',['CB','Me','Me2']]]){
  const start=reactionScene3D(kind,0,'overview',0),ion=reactionScene3D(kind,0,'product',1);assert.ok(Math.abs(volume(start,'CA',groups))>1);assert.ok(Math.abs(volume(ion,'CA',groups))<1e-8);assert.equal(atom(ion,'CA').charge,1);
 }
});
test('E2反應物anti，雙鍵產物為平面，氫實際轉移到鹼；椅式保留雙軸向',()=>{
 for(const kind of ['e2','chair']){
  const start=reactionScene3D(kind,0,'approach',1),end=reactionScene3D(kind,0,'product',1);assert.ok(Math.abs(Math.abs(dihedral(p(start,'HB'),p(start,'CB'),p(start,'CA'),p(start,'Br')))-180)<1e-6);
  assert.ok(end.bonds.some(b=>b.id==='formingOH'&&b.a==='Base'&&b.b==='HB'));assert.ok(distance(end,'Base','HB')<1.1);assert.ok(!end.bonds.some(b=>['CBr','CH'].includes(b.id)));assert.ok(end.bonds.some(b=>b.id==='CC'&&b.order===2&&b.piOpacity===1));assert.equal(atom(end,'CA').charge,0);
 }
 const end=reactionScene3D('e2',0,'product',1);for(const id of ['CA','CB','Me','Me4','CA-H0','CB-H0'])assert.ok(Math.abs(p(end,id)[1])<1e-8,id);
});
test('16例每個實際步驟守恆原子與電荷，端點價數正確，尋找進度不改變原子集合',()=>{
 const expected={
 'sn2-methyl':{C:1,H:4,O:1,Br:1},'sn2-ethyl':{C:2,H:5,Br:1,I:1},'sn2-cyanide':{C:4,H:7,Br:1,N:1},'sn2-secondary':{C:4,H:9,Br:1,I:1},
 'sn1-water':{C:4,H:13,O:2},'sn1-tertamyl':{C:5,H:15,O:2},'sn1-methanol':{C:6,H:17,O:2},'sn1-benzylic':{C:9,H:15,O:2},
 'e1-tertbutyl':{C:6,H:15,O:1},'e1-tertamyl':{C:7,H:17,O:1},'e1-methylpentane':{C:8,H:19,O:1},'e1-3methylpentane':{C:8,H:19,O:1},
 'e2-butane':{C:6,H:14,O:1,Br:1},'e2-propane':{C:5,H:12,O:1,Br:1},'e2-tertamyl':{C:7,H:16,O:1,Br:1},'e2-primary':{C:8,H:18,O:1,Br:1}
 };
 for(const[kind,examples]of Object.entries(REACTION_EXAMPLES).filter(([k])=>['sn2','sn1','e1','e2'].includes(k)))for(const example of examples){const spec=exampleSpec(kind,example);
  for(const [i]of spec.steps.entries()){
   const start=reactionScene3D(kind,i,'overview',0,spec),end=reactionScene3D(kind,i,'product',1,spec);assert.deepEqual(ids(start),ids(end),example.id);assert.equal(start.atoms.reduce((s,a)=>s+a.charge,0),end.atoms.reduce((s,a)=>s+a.charge,0),example.id);
   assert.ok(new Set(ids(start)).size===start.atoms.length);for(const a of end.atoms){assert.ok(a.p.every(Number.isFinite));const valence=end.bonds.filter(b=>b.a===a.id||b.b===a.id).reduce((s,b)=>s+b.order,0);if(a.element==='H')assert.equal(valence,1,a.id);if(a.element==='C')assert.equal(valence,a.charge===1?3:4,a.id);if(a.element==='O')assert.equal(valence,2+a.charge,a.id);}
   for(const t of [0,.25,.75,1])assert.deepEqual(ids(reactionScene3D(kind,i,'together',t,spec)),ids(start));
  }
  assert.deepEqual(counts(reactionScene3D(kind,spec.steps.length-1,'product',1,spec)),expected[example.id],example.id);
 }
});
test('電子曲線與投影使用XYZ；不同攝影機不改變化學座標，成斷鍵同步漸變',()=>{
 const a=[0,0,0],b=[2,1,1];assert.deepEqual(electronCurve3D(a,b,0),a);assert.deepEqual(electronCurve3D(a,b,1),b);assert.notEqual(electronCurve3D(a,b,.5)[2],.5);
 assert.notDeepEqual(projectPoint([1,1,2],{yaw:0,pitch:0,zoom:1}),projectPoint([1,1,2],{yaw:.5,pitch:0,zoom:1}));
 const s=reactionScene3D('e2',0,'together',.5);assert.equal(s.bonds.find(b=>b.id==='CBr').opacity,.5);assert.equal(s.bonds.find(b=>b.id==='CH').opacity,.5);assert.equal(s.bonds.find(b=>b.id==='formingOH').opacity,.5);assert.equal(s.bonds.find(b=>b.id==='CC').piOpacity,.5);
 const before=JSON.stringify(s.atoms);s.atoms.forEach(a=>projectPoint(a.p,{yaw:.7,pitch:.5,zoom:1.2}));assert.equal(JSON.stringify(s.atoms),before);
});
test('加成、重排與脫水十例：每步原子與電荷守恆、端點價數正確、電子錨點齊全',()=>{
 for(const kind of ['addhx','hydration','halogenation','rearrangement','dehydration'])for(const example of REACTION_EXAMPLES[kind]){
  const spec=exampleSpec(kind,example);
  spec.steps.forEach((step,i)=>{
   const start=reactionScene3D(kind,i,'overview',0,spec),end=reactionScene3D(kind,i,'product',1,spec),mid=reactionScene3D(kind,i,'together',.5,spec);
   assert.deepEqual(ids(start),ids(end),example.id);assert.deepEqual(ids(mid),ids(end));assert.deepEqual(counts(start),counts(end));
   assert.equal(start.atoms.reduce((s,a)=>s+a.charge,0),end.atoms.reduce((s,a)=>s+a.charge,0),example.id+i);
   for(const [scene,label] of [[start,'start'],[end,'end']])for(const a of scene.atoms){
    const valence=scene.bonds.filter(b=>(b.a===a.id||b.b===a.id)&&b.opacity>0&&(label==='start'?!b.forming:true)).reduce((s,b)=>s+b.order,0);
    if(a.element==='H')assert.equal(valence,1,`${example.id} ${i} ${label} ${a.id}`);
    if(a.element==='C')assert.equal(valence,a.charge===1?3:4,`${example.id} ${i} ${label} ${a.id}`);
    if(a.element==='O')assert.equal(valence,2+a.charge,`${example.id} ${i} ${label} ${a.id}`);
    if(['Br','Cl'].includes(a.element))assert.equal(valence,1+a.charge,`${example.id} ${i} ${label} ${a.id}`);
   }
   for(const r of step.required){assert.ok(mid.anchors.has(r.from),`${example.id} ${r.from}`);assert.ok(mid.anchors.has(r.to),`${example.id} ${r.to}`);}
  });
 }
});
test('馬可尼可夫：H 加到 C1、正電在 C2；鹵素加成兩個 X 在雙鍵兩側（反式）；重排後取代基接到 C2、正電移到 C3',()=>{
 const hx=exampleSpec('addhx',REACTION_EXAMPLES.addhx[1]),cation=reactionScene3D('addhx',0,'product',1,hx);assert.ok(distance(cation,'H','C1')<1.2);assert.equal(atom(cation,'C2').charge,1);
 for(const ex of REACTION_EXAMPLES.halogenation){const spec=exampleSpec('halogenation',ex),bridge=reactionScene3D('halogenation',0,'product',1,spec),end=reactionScene3D('halogenation',1,'product',1,spec);assert.equal(atom(bridge,'Ba').charge,1);assert.ok(p(end,'Ba')[1]>0&&p(end,'Bb')[1]<0);assert.ok(distance(end,'Ba','C1')<2.1&&distance(end,'Bb','C2')<2.1);}
 for(const ex of REACTION_EXAMPLES.rearrangement){const spec=exampleSpec('rearrangement',ex),end=reactionScene3D('rearrangement',1,'product',1,spec);assert.equal(atom(end,'C3').charge,1);assert.equal(atom(end,'C2').charge,0);assert.ok(end.bonds.some(b=>b.id==='newCSh'));assert.ok(!end.bonds.some(b=>b.id==='C3Sh'));}
 const dehyd=exampleSpec('dehydration',REACTION_EXAMPLES.dehydration[1]),ion=reactionScene3D('dehydration',1,'product',1,dehyd),alkene=reactionScene3D('dehydration',2,'product',1,dehyd);assert.equal(atom(ion,'CA').charge,1);assert.ok(alkene.bonds.some(b=>b.id==='CC'&&b.order===2));assert.ok(distance(alkene,'Ob','HB')<1.1);
});
