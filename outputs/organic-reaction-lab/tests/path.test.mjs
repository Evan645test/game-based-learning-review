import test from 'node:test';
import assert from 'node:assert/strict';
import {TYPES,WARMUP,STAGES,FLOW,ITEMS,unlockedTypes,stageIndex,pickItem,mastery,shuffled} from '../course-path.js';
import {REACTION_EXAMPLES} from '../reaction-examples.js';
import {mechanismSpec,newMechanism} from '../electron-flow.js';
import {gradedHint} from '../graded-hints.js';
import {EXAM_FORMS} from '../exam-items.js';

const examples=new Map(Object.entries(REACTION_EXAMPLES).flatMap(([kind,list])=>list.map(e=>[e.id,{kind,e}])));
const branches=new Map(FLOW.flatMap(n=>n.branches.map(b=>[b.id,{...b,node:n.id}])));
const typeStage=Object.fromEntries(STAGES.flatMap(s=>s.newTypes.map(t=>[t,s.id])));

test('暖身八個觀念各有即時檢查；五階段依序加入九種反應類型',()=>{
 assert.equal(WARMUP.length,8);for(const c of WARMUP){assert.ok(c.body.length&&c.pages.length);assert.ok(c.check.answer>=0&&c.check.answer<c.check.options.length);}
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
