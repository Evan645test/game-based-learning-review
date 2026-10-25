import test from 'node:test';
import assert from 'node:assert/strict';
import {TYPES,WARMUP,WARM_GROUPS,PATH_GOALS,STAGES,FLOW,ITEMS,unlockedTypes,stageIndex,pickItem,mastery,shuffled} from '../course-path.js';
import {REACTION_EXAMPLES} from '../reaction-examples.js';
import {mechanismSpec,newMechanism} from '../electron-flow.js';
import {gradedHint} from '../graded-hints.js';
import {EXAM_FORMS} from '../exam-items.js';

const examples=new Map(Object.entries(REACTION_EXAMPLES).flatMap(([kind,list])=>list.map(e=>[e.id,{kind,e}])));
const branches=new Map(FLOW.flatMap(n=>n.branches.map(b=>[b.id,{...b,node:n.id}])));
const typeStage=Object.fromEntries(STAGES.flatMap(s=>s.newTypes.map(t=>[t,s.id])));

test('暖身十二個觀念分四個分支、各有即時檢查；五階段依序加入九種反應類型',()=>{
 assert.equal(WARMUP.length,12);for(const c of WARMUP){assert.ok(c.body.length&&c.pages.length);assert.ok(c.check.answer>=0&&c.check.answer<c.check.options.length);}
 assert.deepEqual(WARM_GROUPS.map(g=>WARMUP.filter(c=>c.group===g.id).length),[3,3,4,2]);assert.ok(WARMUP.every(c=>WARM_GROUPS.some(g=>g.id===c.group)));
 // A group's cards stay together so the tree order matches the card order.
 assert.deepEqual(WARMUP.map(c=>c.group),WARM_GROUPS.flatMap(g=>WARMUP.filter(c=>c.group===g.id).map(()=>g.id)));
 assert.deepEqual(STAGES.map(s=>s.newTypes),[['sn2','sn1'],['e2'],['e1'],['addhx','hydration','halogenation'],['rearrangement','dehydration']]);
 assert.deepEqual(unlockedTypes('s1'),['sn2','sn1']);assert.equal(unlockedTypes('s3').length,4);assert.deepEqual(new Set(unlockedTypes('final')),new Set(Object.keys(TYPES)));
 assert.equal(stageIndex('warmup'),-1);assert.equal(unlockedTypes('warmup').length,0);
});
test('每組對比只用已學類型；26 個例子都出現在對比中，新類型每類至少兩例',()=>{
 const used=new Set();
 for(const s of STAGES)for(const p of s.pairs)for(const id of [p.a,p.b]){const x=examples.get(id);assert.ok(x,id);assert.ok(unlockedTypes(s.id).includes(x.kind),`${s.id} ${id}`);used.add(id);}
 assert.equal(used.size,examples.size);
 for(const k of ['addhx','hydration','halogenation','rearrangement','dehydration'])assert.ok(REACTION_EXAMPLES[k].length>=2,k);
});
test('流程圖分支任務對應本階段新增分支；題目路徑都走得到正確類型',()=>{
 for(const s of STAGES)for(const t of s.branches){assert.ok(t.answer>=0&&t.answer<t.options.length);for(const id of t.ids){assert.ok(branches.has(id),id);assert.equal(branches.get(id).stage,s.id,id);}}
 const claimed=new Set(STAGES.flatMap(s=>s.branches.flatMap(t=>t.ids)));for(const b of branches.values())if(b.stage!=='s1'||b.node==='degree')assert.ok(claimed.has(b.id)||b.id==='start-halide',b.id);
 for(const it of ITEMS){
  const last=branches.get(it.path.at(-1));assert.ok(last,it.id);
  const outcome=last.to==='addhx|hydration'?(it.path.includes('el-hx')?'addhx':'hydration'):last.to;assert.equal(outcome,it.type,it.id);
  // Paths are full chains from the top question; locked questions are skipped when drawn.
  assert.equal(branches.get(it.path[0]).node,'start',it.id);for(let i=1;i<it.path.length;i++)assert.equal(branches.get(it.path[i-1]).to,branches.get(it.path[i]).node,`${it.id} ${it.path[i]}`);
  assert.ok(stageIndex(typeStage[it.type])>=0);
 }
});
test('題庫每類至少五題，選項與正解完整；例子模板與類型一致',()=>{
 const n={};for(const it of ITEMS){n[it.type]=(n[it.type]||0)+1;assert.equal(it.reasons.length,3);assert.equal(it.products.length,3);assert.equal(new Set(it.products).size,3,it.id);if(it.example){assert.ok(examples.has(it.example),it.id);}}
 for(const t of Object.keys(TYPES))assert.ok(n[t]>=5,t);
 assert.equal(new Set(ITEMS.map(i=>i.id)).size,ITEMS.length);
 assert.equal(new Set(ITEMS.map(i=>[i.substrate,i.reagent,i.conditions].join('|'))).size,ITEMS.length,'題目卡片內容必須可區分');
});
test('混合練習交錯且依弱點加權；精熟度依最近五題',()=>{
 const types=['sn2','sn1','e2'],history=[{item:'e2-a',type:'e2',mech:false},{item:'e2-b',type:'e2',mech:false},{item:'e2-c',type:'e2',mech:false},{item:'sn2-a',type:'sn2',mech:true},{item:'sn1-a',type:'sn1',mech:true}];
 let seed=1;const rand=()=>((seed=seed*16807%2147483647)-1)/2147483646,counts={};
 for(let i=0;i<600;i++){const it=pickItem(types,history,rand);counts[it.type]=(counts[it.type]||0)+1;}
 assert.ok(counts.e2>counts.sn2*2,JSON.stringify(counts));
 const after=pickItem(types,[...history,{item:'e2-d',type:'e2',mech:true}],()=>0);assert.notEqual(after.id,'e2-d');
 const fresh=pickItem(['sn2'],[{item:'sn2-a',type:'sn2',mech:true}],()=>0);assert.notEqual(fresh.id,'sn2-a');
 const m=mastery(['sn2','e2','sn1'],[...Array(4)].map((_,i)=>({item:'x'+i,type:'sn2',mech:true})).concat([{item:'y',type:'e2',mech:false}]));
 assert.equal(m.sn2.level,'精熟');assert.equal(m.e2.level,'練習中');assert.equal(m.sn1.level,'尚未練習');
 assert.deepEqual(shuffled(['a','b','c'],'k').map(x=>x.v),shuffled(['a','b','c'],'k').map(x=>x.v));
});
test('分級提示：第一層只指出哪一步，第二層才指出哪支箭頭；全部正確才通過',()=>{
 for(const kind of ['sn1','addhx','halogenation','rearrangement','dehydration']){
  const spec=mechanismSpec(kind),work=newMechanism(kind);
  const h1=gradedHint(kind,work,1);assert.equal(h1.ok,false);assert.match(h1.text,/第 1 步/);assert.match(h1.text,/還沒有畫箭頭/);
  work.steps[0].arrows=[{from:spec.steps[0].required[0].to,to:spec.steps[0].required[0].from,electrons:2,bend:45}];
  const l1=gradedHint(kind,work,1),l2=gradedHint(kind,work,2);assert.doesNotMatch(l1.text,/第 1 支箭頭/);assert.match(l2.text,/第 1 支箭頭/);
  spec.steps.forEach((s,i)=>{work.steps[i].arrows=structuredClone(s.required);work.steps[i].confirmed=i<spec.steps.length-1;});
  assert.match(gradedHint(kind,work,1).text,/請保存/);work.steps.at(-1).confirmed=true;assert.equal(gradedHint(kind,work,1).ok,true);
 }
});
test('後測與延後測各十題涵蓋九類，起始物都不是課程中出現過的分子',()=>{
 const norm=s=>s.replace(/\(([RS])\)-/g,'').replace(/（.*?）/g,'').trim();
 const course=new Set([...ITEMS.map(i=>norm(i.substrate).split(' ')[0]),...[...examples.values()].flatMap(({e})=>[norm(e.substrate),norm(e.title).replace(/(的.*|＋.*)$/,'')])]);
 for(const [form,list] of Object.entries(EXAM_FORMS)){assert.equal(list.length,10);assert.deepEqual(new Set(list.map(q=>q.type)),new Set(Object.keys(TYPES)));for(const q of list){assert.ok(!course.has(norm(q.substrate)),`${form} ${q.substrate}`);assert.equal(new Set(q.products).size,3);}}
});
import {clearLegacyData,DATA_VERSION_KEY} from '../legacy-data.js';
test('新版第一次載入清除所有舊 organic- 紀錄與 PK 資料庫，其他網站資料保留，只清一次',()=>{
 const make=entries=>{const m=new Map(entries);return {m,get length(){return m.size;},key:i=>[...m.keys()][i],getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
 const local=make([['organic-course-v1','{}'],['organic-assessment-v2:attempt:x','{}'],['organic-pk-v1:AB','{}'],['other-app','keep']]),session=make([['organic-assessment-tab-v2','t'],['x','keep']]),deleted=[];
 assert.equal(clearLegacyData([local,session],n=>deleted.push(n)),true);
 assert.deepEqual([...local.m.keys()].sort(),[DATA_VERSION_KEY,'other-app'].sort());assert.deepEqual([...session.m.keys()],['x']);assert.deepEqual(deleted,['organic-reaction-pk-v1']);
 local.setItem('organic-path-v3','{"version":3}');assert.equal(clearLegacyData([local,session],n=>deleted.push(n)),false);assert.equal(local.getItem('organic-path-v3'),'{"version":3}');
});
import {CATIONS,cationModel} from '../cation-cloud.js';
test('碳陽離子電子雲：取代越多中心碳越不缺電子；鄰近 C–H 數 0/3/6/9，平行於空 p 軌域的會隨轉動改變',()=>{
 const models=CATIONS.map(c=>cationModel(c.id));
 for(let i=1;i<models.length;i++)assert.ok(models[i].cation.blue<models[i-1].cation.blue);
 assert.deepEqual(models.map(m=>m.neighborCH),[0,3,6,9]);assert.deepEqual(models.map(m=>m.parallel),[0,2,4,6]);
 assert.ok(cationModel('primary',Math.PI/6).parallel<2);
 for(const m of models){const c=m.atoms.find(a=>a.center);assert.equal(m.bonds.filter(b=>b[0]==='C').length,3);for(const a of m.atoms)if(a.el==='C'&&!a.center)assert.equal(m.bonds.filter(b=>b.includes(a.id)).length,4);assert.ok(m.atoms.filter(a=>a.id!=='C'&&m.bonds.some(b=>b[0]==='C'&&b[1]===a.id)).every(a=>Math.abs(a.p[1])<1e-9),'陽離子平面');}
 for(const s of [STAGES[3].concepts[0],STAGES[4].concepts[0],WARMUP.find(c=>c.id==='carbocation')])assert.equal(s.widget.kind,'cation-cloud');
});
import {paperStep} from '../paper-view.js';
import {reactionScene3D} from '../reaction-3d.js';
import {exampleSpec} from '../reaction-examples.js';
test('書面結構式：每步依箭頭推得的總電荷守恆，且形成的鍵數與三維模型一致',()=>{
 for(const [kind,list] of Object.entries(REACTION_EXAMPLES))for(const ex of list){const spec=exampleSpec(kind,ex);spec.steps.forEach((st,i)=>{
  const g=paperStep(st),sum=[...g.delta.values()].reduce((a,b)=>a+b,0);assert.equal(sum,0,`${ex.id} ${i}`);
  const formed2d=[...g.changes.values()].filter(c=>c.start===0&&c.end>0).length,scene=reactionScene3D(kind,i,'together',.5,spec);
  const formed3d=scene.bonds.filter(b=>b.forming||['newCN','formingOH'].includes(b.id)).length;
  if(!['sn2','sn1','e1','e2','chair'].includes(kind))assert.equal(formed2d,formed3d,`${ex.id} ${i}`);
  assert.ok(formed2d+[...g.changes.values()].filter(c=>c.end<c.start).length>=1,`${ex.id} ${i} 至少一處鍵結改變`);
 });}
});

import {pathTreeHTML,freshPath} from '../learning-path.js';
import {energyHTML} from '../energy-visual.js';
import fs from 'node:fs';
test('立體卡拆成階段入口小暖身；每階段有目標與先備暖身卡，所有卡片 id 唯一',()=>{
 assert.equal(WARMUP.find(c=>c.id==='stereo'),undefined);
 assert.deepEqual(STAGES.map(s=>(s.primers||[]).map(p=>p.id)),[['rs'],['newman','alkene','chair'],['heat'],[],['equilibrium']]);
 const primers=STAGES.flatMap(s=>s.primers||[]),ids=[...WARMUP,...primers].map(c=>c.id);assert.equal(new Set(ids).size,ids.length);
 for(const p of primers){assert.ok(p.body.length&&p.pages.length&&p.example,p.id);assert.ok(p.check.answer>=0&&p.check.answer<p.check.options.length,p.id);for(const d of p.demos||[]){const x=examples.get(d.example);assert.ok(x&&x.kind===d.kind,p.id);}}
 assert.deepEqual(primers.filter(p=>p.optional).map(p=>p.id),['chair']);
 for(const s of STAGES){assert.ok(s.goal.length>10,s.id);assert.ok(s.needs.length);for(const n of s.needs)assert.ok(WARMUP.some(c=>c.id===n),`${s.id} ${n}`);}
 for(const k of ['warmup','final','assessment'])assert.ok(PATH_GOALS[k]);
 for(const c of WARMUP)for(const d of c.demos||[]){const x=examples.get(d.example);assert.ok(x&&x.kind===d.kind,c.id);if(Number.isInteger(d.step))assert.ok(d.step<mechanismSpec(d.kind).steps.length,c.id);}
});
test('所有引用的原文頁碼都在伺服器白名單內',()=>{
 const src=fs.readFileSync(new URL('../server.py',import.meta.url),'utf8'),allowed=new Set(src.match(/SOURCE_PAGES = \{([^}]*)\}/)[1].split(',').map(Number));
 const cards=[...WARMUP,...STAGES.flatMap(s=>[...(s.primers||[]),...s.concepts])];
 for(const c of cards)for(const p of c.pages)assert.ok(allowed.has(p),`${c.title} 第 ${p} 頁`);
});
test('學習路徑樹：標出目前位置、完成狀態，並連到暖身卡與入口小暖身',()=>{
 const st=freshPath(),h=pathTreeHTML(st);
 assert.equal((h.match(/data-tree-node=/g)||[]).length,STAGES.length+3);
 assert.equal((h.match(/data-tree-primer=/g)||[]).length,6);assert.equal((h.match(/data-tree-group=/g)||[]).length,4);
 assert.match(h,/class="tree-node current" data-tree-node="warmup"/);assert.match(h,/<details class="path-tree" data-path-tree open>/);
 for(const s of STAGES)assert.ok(h.includes(s.goal),s.id);
 st.stage='s2';for(const c of WARMUP)st.warm.checks[c.id]={choice:c.check.answer,first:true};Object.assign(st.stages.s1,{step:4,mixed:{done:6,current:null}});
 const h2=pathTreeHTML(st);
 assert.match(h2,/class="tree-node done" data-tree-node="warmup"/);assert.match(h2,/class="tree-node done" data-tree-node="s1"/);assert.match(h2,/class="tree-node current" data-tree-node="s2"/);assert.doesNotMatch(h2,/data-path-tree open/);
 assert.equal((h2.match(/✓ /g)||[]).length,WARMUP.length+STAGES[0].needs.length+STAGES.slice(1).reduce((n,s)=>n+s.needs.length,0)+2+1,'暖身卡、先備連結、兩個完成節點與圖例');
});
test('能量圖：一步反應一個過渡態；兩步反應兩個過渡態夾一個中間體',()=>{
 const h=energyHTML(),one=h.split('data-energy-diagram="two"')[0],two=h.split('data-energy-diagram="two"')[1];
 assert.equal((one.match(/data-energy-ts/g)||[]).length,1);assert.equal((one.match(/data-energy-int/g)||[]).length,0);
 assert.equal((two.match(/data-energy-ts/g)||[]).length,2);assert.equal((two.match(/data-energy-int/g)||[]).length,1);
 assert.equal(WARMUP.find(c=>c.id==='energy').widget.kind,'energy');
});
