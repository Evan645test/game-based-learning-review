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

test('暖身十個觀念分六層、各有即時檢查；五階段依序加入九種反應類型',()=>{
 assert.equal(WARMUP.length,10);for(const c of WARMUP){assert.ok(c.body.length&&c.pages.length);assert.ok(c.check.answer>=0&&c.check.answer<c.check.options.length);}
 assert.deepEqual(WARM_GROUPS.map(g=>WARMUP.filter(c=>c.group===g.id).length),[2,1,1,1,2,3]);assert.ok(WARMUP.every(c=>WARM_GROUPS.some(g=>g.id===c.group)));
 // A group's cards stay together so the tree order matches the card order.
 assert.deepEqual(WARMUP.map(c=>c.group),WARM_GROUPS.flatMap(g=>WARMUP.filter(c=>c.group===g.id).map(()=>g.id)));
 // Formal charge is learned before the first arrow; the first arrow practice is a proton transfer.
 assert.deepEqual(WARMUP.map(c=>c.id),['skeletal','degree','formal','hybrid','polarity','arrows','proton','nucleophile','acidbase','leaving']);
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
 for(const s of [STAGES[3].concepts[0],STAGES[4].concepts[0],STAGES[0].primers.find(c=>c.id==='carbocation')])assert.equal(s.widget.kind,'cation-cloud');
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

import {competencyListHTML,competencyStatus,locationLabel,locationCard,snapshot,freshPath,migratePath,validPath,checkStatus,worldProgress,islandProgress,islandDone,buildingProgress} from '../learning-path.js';
import {ISLANDS,islandNodes,nodeScreens,cardLocation,worldMapHTML,islandViewHTML} from '../island-map.js';
import {PATH_TASKS,REVIEW_BY_TYPE,ARROW_REVIEW,COMPETENCIES} from '../course-path.js';
import {skeletalHTML} from '../concept-visuals.js';
import {energyHTML} from '../energy-visual.js';
import fs from 'node:fs';
test('進階先備放在階段入口；每階段的先備指向暖身卡或更早的入口小暖身，所有卡片 id 唯一',()=>{
 assert.equal(WARMUP.find(c=>c.id==='stereo'),undefined);
 assert.deepEqual(STAGES.map(s=>(s.primers||[]).map(p=>p.id)),[['sterics','carbocation','energy','solvent','rs'],['basicity','newman','alkene','chair'],['heat'],[],['equilibrium']]);
 const primers=STAGES.flatMap(s=>s.primers||[]),ids=[...WARMUP,...primers].map(c=>c.id);assert.equal(new Set(ids).size,ids.length);
 for(const p of primers){assert.ok(p.body.length&&p.pages.length&&p.example,p.id);assert.ok(p.check.answer>=0&&p.check.answer<p.check.options.length,p.id);for(const d of p.demos||[]){const x=examples.get(d.example);assert.ok(x&&x.kind===d.kind,p.id);}}
 assert.deepEqual(primers.filter(p=>p.optional).map(p=>p.id),['chair']);
 for(const s of STAGES){assert.ok(s.goal.length>10,s.id);assert.ok(s.needs.length);const earlier=STAGES.slice(0,STAGES.indexOf(s)+1).flatMap(x=>x.primers||[]);for(const n of s.needs)assert.ok(WARMUP.some(c=>c.id===n)||earlier.some(c=>c.id===n),`${s.id} ${n}`);}
 for(const k of ['warmup','final','assessment'])assert.ok(PATH_GOALS[k]);
 for(const c of WARMUP)for(const d of c.demos||[]){const x=examples.get(d.example);assert.ok(x&&x.kind===d.kind,c.id);if(Number.isInteger(d.step))assert.ok(d.step<mechanismSpec(d.kind).steps.length,c.id);}
});
test('所有引用的原文頁碼都在伺服器白名單內',()=>{
 const src=fs.readFileSync(new URL('../server.py',import.meta.url),'utf8'),allowed=new Set(src.match(/SOURCE_PAGES = \{([^}]*)\}/)[1].split(',').map(Number));
 const cards=[...WARMUP,...STAGES.flatMap(s=>[...(s.primers||[]),...s.concepts])];
 for(const c of cards)for(const p of c.pages)assert.ok(allowed.has(p),`${c.title} 第 ${p} 頁`);
});
test('探險手冊的六項能力：原地展開、觀念卡先預覽，狀態依最近一次作答',()=>{
 const all=[...WARMUP,...STAGES.flatMap(s=>s.primers||[])].map(c=>c.id),got=COMPETENCIES.flatMap(c=>c.cards);
 assert.equal(COMPETENCIES.length,6);assert.deepEqual([...got].sort(),[...all].sort(),'每張觀念卡剛好屬於一項能力');
 const st=freshPath(),here=snapshot(st),opts={hereCard:locationCard(here),hereLabel:locationLabel(here)},h=competencyListHTML(st,opts);
 assert.equal((h.match(/data-comp-toggle=/g)||[]).length,6);assert.equal((h.match(/aria-expanded="true"/g)||[]).length,0,'預設全部收合');
 assert.equal((h.match(/data-map-card=/g)||[]).length,0);assert.doesNotMatch(h,/data-map-go/);
 const o=competencyListHTML(st,{...opts,open:'space'});assert.equal((o.match(/data-map-card=/g)||[]).length,5);assert.doesNotMatch(o,/data-card-preview/);
 const p=competencyListHTML(st,{...opts,open:'space',pick:'sterics'});assert.match(p,/data-card-preview="sterics"/);assert.match(p,/data-map-go="sterics"/);assert.match(p,/位於：階段 1・入口小暖身/);assert.match(p,/會記住你現在在「暖身・看懂結構：讀結構式」/);
 assert.doesNotMatch(competencyListHTML(st,{...opts,open:'read',pick:'skeletal'}),/data-map-go/,'目前所在的卡不提供前往');
 const comp=id=>COMPETENCIES.find(c=>c.id===id);
 assert.equal(competencyStatus(st,comp('read')),'todo');
 for(const id of ['skeletal','degree'])st.warm.checks[id]={choice:WARMUP.find(c=>c.id===id).check.answer,first:true};
 assert.equal(competencyStatus(st,comp('read')),'mastered');
 st.warm.checks.hybrid={choice:WARMUP.find(c=>c.id==='hybrid').check.answer,first:true};assert.equal(competencyStatus(st,comp('space')),'active');
 const formal=WARMUP.find(c=>c.id==='formal');st.warm.checks.formal={choice:(formal.check.answer+1)%3,first:false};assert.equal(competencyStatus(st,comp('count')),'review');
 const w=competencyListHTML(st,{...opts,open:'count'});assert.match(w,/class="tree-chip review" data-map-card="formal"/);assert.match(w,/data-competency-status="review">需回看/);
});
test('島嶼：七座島依課程順序，每座島的據點與一次一件事的畫面',()=>{
 assert.deepEqual(ISLANDS.map(i=>i.id),['warmup','s1','s2','s3','s4','s5','final']);
 assert.deepEqual(islandNodes('warmup').map(n=>n.label),['看懂結構','電子記帳','空間與軌域','電子分布','電子移動','角色與原因']);
 assert.deepEqual(islandNodes('warmup').flatMap(n=>n.cards),WARMUP.map(c=>c.id),'暖身據點依六層包含全部卡片');
 assert.deepEqual(islandNodes('s1').map(n=>n.id),['primers','concepts','contrast','branches','arrows','mixed']);
 assert.deepEqual(islandNodes('s4').map(n=>n.id),['concepts','contrast','branches','arrows','mixed'],'沒有入口小暖身的島不放空據點');
 assert.equal(islandNodes('final').length,1);
 // A card splits into read → figure → 3D → check, keeping only the parts it has.
 const warm=islandNodes('warmup');assert.deepEqual(nodeScreens('warmup',warm[0]).map(x=>x.type+':'+x.card),['read:skeletal','figure:skeletal','check:skeletal','read:degree','figure:degree','check:degree']);
 assert.deepEqual(nodeScreens('warmup',warm[3]).map(x=>x.type),['read','check'],'鍵極性沒有圖或三維');
 assert.deepEqual(nodeScreens('warmup',warm[2]).map(x=>x.type),['read','demo','check']);
 for(const st of STAGES){const n=Object.fromEntries(islandNodes(st.id).map(x=>[x.id,nodeScreens(st.id,x).length]));assert.equal(n.contrast,st.pairs.length);assert.equal(n.branches,st.branches.length);assert.equal(n.arrows,st.arrowKinds.length);assert.equal(n.mixed,st.mixCount);}
 for(const c of [...WARMUP,...STAGES.flatMap(s=>s.primers||[])]){const loc=cardLocation(c.id),node=islandNodes(loc.island)[loc.node];assert.deepEqual(nodeScreens(loc.island,node)[loc.screen],{type:'read',card:c.id},c.id);}
});
test('世界地圖：下一座島在前一座走完後才出霧；走過的島留著；紅旗標在有錯卡的據點與島上',()=>{
 const st=freshPath(),states=()=>worldProgress(st).map(w=>w.state);
 assert.deepEqual(states(),['open','fog','fog','fog','fog','fog','fog']);
 for(const n of islandNodes('warmup'))st.explore.done.warmup[n.id]=true;
 assert.ok(islandDone(st,'warmup'));assert.deepEqual(states().slice(0,3),['done','open','fog']);
 st.explore.seen.s3=true;assert.equal(states()[3],'open','走進霧中的島後就不再藏起來');
 assert.deepEqual(islandProgress(st,'s1').map(n=>n.state),['next','todo','todo','todo','todo','todo']);
 st.explore.done.s1.primers=true;assert.deepEqual(islandProgress(st,'s1').map(n=>n.state).slice(0,2),['done','next']);
 const sterics=STAGES[0].primers[0];st.warm.checks.sterics={choice:(sterics.check.answer+1)%3,first:false};
 assert.deepEqual(islandProgress(st,'s1')[0].wrong,['sterics']);assert.equal(worldProgress(st)[1].flag,true);assert.equal(worldProgress(st)[0].flag,false);
 const w=worldMapHTML({islands:worldProgress(st),boat:1});
 assert.equal((w.match(/data-island=/g)||[]).length,7);assert.match(w,/data-lighthouse/);assert.match(w,/aria-label="霧中的島（霧中，尚未出現）"/);assert.match(w,/有紅旗需回看/);
 const i=islandViewHTML({island:'s1',nodes:buildingProgress(st,'s1'),hero:1});
 assert.equal((i.match(/data-node="/g)||[]).length,11);assert.match(i,/立體障礙[^"]*已走過；紅旗：需回看/);assert.match(i,/data-hero/);assert.match(i,/class="node-flag"/);
});
test('位置標籤：島、據點與目前的觀念卡',()=>{
 const st=freshPath();assert.equal(locationLabel(snapshot(st)),'暖身・看懂結構：讀結構式');assert.equal(locationCard(snapshot(st)),'skeletal');
 st.explore.pos.warmup={node:0,screen:3};assert.equal(locationCard(snapshot(st)),'degree');
 st.stage='s1';assert.equal(locationLabel(snapshot(st)),'階段 1・入口小暖身：立體障礙');
 st.explore.pos.s1={node:1,screen:0};assert.equal(locationLabel(snapshot(st)),'階段 1・概念');assert.equal(locationCard(snapshot(st)),null);
 st.explore.pos.s1={node:4,screen:0};assert.equal(locationLabel(snapshot(st)),'階段 1・畫電子箭頭');
 st.stage='final';assert.equal(locationLabel(snapshot(st)),'總混合・總混合練習');
});
test('能量圖：一步反應一個過渡態；兩步反應兩個過渡態夾一個中間體',()=>{
 const h=energyHTML(),one=h.split('data-energy-diagram="two"')[0],two=h.split('data-energy-diagram="two"')[1];
 assert.equal((one.match(/data-energy-ts/g)||[]).length,1);assert.equal((one.match(/data-energy-int/g)||[]).length,0);
 assert.equal((two.match(/data-energy-ts/g)||[]).length,2);assert.equal((two.match(/data-energy-int/g)||[]).length,1);
 assert.equal(STAGES[0].primers.find(c=>c.id==='energy').widget.kind,'energy');
});

test('舊版進度移到六層暖身與島嶼地圖：位置對到同一張卡與據點，入口小暖身前插不改變目前概念',()=>{
 const old=(index,s1=0,s2=0)=>{const s=freshPath();delete s.layout;s.warm.index=index;s.stages.s1.concept=s1;s.stages.s2.concept=s2;s.warm.checks={hybrid:{choice:0,first:true}};return s;};
 const at=s=>WARMUP[s.warm.index].id;
 let s=old(0);assert.equal(migratePath(s),true);assert.equal(at(s),'skeletal','從第一張開始的人看到新的第一張');assert.equal(s.layout,3);assert.ok(validPath(s));assert.deepEqual(s.explore.pos.warmup,{node:0,screen:0});
 for(const [index,id] of [[1,'degree'],[3,'arrows'],[4,'formal'],[5,'nucleophile'],[6,'acidbase'],[7,'leaving']]){s=old(index);migratePath(s);assert.equal(at(s),id,`舊第 ${index} 張`);}
 s=old(2);migratePath(s);assert.equal(at(s),'arrows','立體障礙移走後接到下一張仍在暖身的卡');
 for(const index of [8,9,10,11]){s=old(index);migratePath(s);assert.equal(s.warm.index,WARMUP.length-1,`舊第 ${index} 張移到入口後停在暖身最後一張`);}
 s=old(0,1,1);migratePath(s);
 assert.equal([...STAGES[0].primers,...STAGES[0].concepts][s.stages.s1.concept].title,'SN2：一步完成，從背面進攻');
 assert.equal([...STAGES[1].primers,...STAGES[1].concepts][s.stages.s2.concept].id,'alkene');
 assert.deepEqual(s.warm.checks,{hybrid:{choice:0,first:true}},'檢查紀錄以卡片 id 保存，不受位置影響');
 assert.equal(migratePath(s),false,'只遷移一次');assert.equal(s.stages.s1.concept,1+4);
 assert.equal(freshPath().layout,3);
 // Layout 3 turns old steps into landmarks: the s1 concept stays the current landmark and earlier ones count as walked.
 assert.equal(islandNodes('s1')[s.explore.pos.s1.node].id,'concepts');assert.equal(s.explore.done.s1.primers,true);assert.equal(s.explore.seen.s1,true);
 assert.equal(nodeScreens('s2',islandNodes('s2')[0])[s.explore.pos.s2.screen].card,'alkene');
 s=old(4);migratePath(s);assert.equal(islandNodes('warmup')[s.explore.pos.warmup.node].label,'電子記帳');assert.equal(s.explore.done.warmup['g-structure'],true);
 const later=freshPath();delete later.explore;later.layout=2;Object.assign(later.stages.s2,{step:4,mixed:{done:6,current:null}});migratePath(later);
 assert.ok(islandDone(later,'s2'),'舊版已完成的階段在地圖上也算走完');assert.ok(validPath(later));
});
test('讀結構式圖解：鋸齒線補回 CH₃、CH、CH₂、CH₃，Br 上三對孤對電子',()=>{
 const h=skeletalHTML();
 for(const t of ['>CH₃<','>CH<','>CH₂<'])assert.ok(h.includes(t),t);
 assert.equal((h.match(/<circle/g)||[]).length,6);assert.match(h,/data-lone-pairs="3"/);
 assert.equal(WARMUP[0].widget.kind,'skeletal');
});

test('答錯時的回看連結都指向存在的觀念卡，且每種反應類型都有',()=>{
 const ids=new Set([...WARMUP,...STAGES.flatMap(s=>s.primers||[])].map(c=>c.id));
 assert.deepEqual(Object.keys(REVIEW_BY_TYPE).sort(),Object.keys(TYPES).sort());
 for(const id of [...Object.values(REVIEW_BY_TYPE).flat(),...ARROW_REVIEW,...[...ids].flatMap(i=>[...WARMUP,...STAGES.flatMap(s=>s.primers||[])].find(c=>c.id===i).review||[])])assert.ok(ids.has(id),id);
 assert.ok(WARMUP.slice(1).every(c=>c.review?.length),'第一張以外的暖身卡都有回看去處');
});
