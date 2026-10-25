import {ADDED_KINDS,typeSpec} from './reaction-types.js';

const point=(id,label,x,y,role='atom',element='')=>({id,label,x,y,role,element});
const arrow=(from,to)=>({from,to,electrons:2,bend:45});
const pair=(from,to)=>`${from}>${to}`;

export function mechanismSpec(kind) {
  if(ADDED_KINDS.includes(kind))return typeSpec(kind);
  const path=kind==='chair'?'e2':kind;
  if(!['sn2','sn1','e1','e2'].includes(path))throw new Error('不支援的機構');
  const isChair=kind==='chair',elim=path==='e1'||path==='e2';
  const shared=[point('CA','Cα',310,150,'atom','C'),point('CB',isChair?'C6':'Cβ',455,150,'atom','C'),point('Br','Br',310,55,'atom','Br'),point('CC','Cα–Cβ 鍵',382,150,'bond'),point('CBr','Cα–Br 鍵',310,102,'bond'),point('Me','Me',255,247,'atom','C')];
  const base=[point('Base',path==='e1'?'O（EtOH）':'OEt⁻',110,70,'atom','O'),point('lpBase','鹼 O 的孤對電子',145,85,'lonepair')];
  const hydrogen=[point('HB','Hβ',455,45,'atom','H'),point('CH','Cβ–Hβ 鍵',455,97,'bond')];
  const nu=[point('Nu',path==='sn2'?'I⁻':'O（H₂O）',100,150,'atom',path==='sn2'?'I':'O'),point('lpNu','親核劑的孤對電子',143,145,'lonepair')];
  const commonBonds=[['CA','CB','CC'],['CA','Me','CMe']];
  if(path==='sn2'||path==='e2'&&!isChair){shared.push(point('Me4','Me',535,235,'atom','C'));commonBonds.push(['CB','Me4','CBMe4']);}
  const make=(title,nodes,bonds,required,product,description)=>({title,nodes,bonds,required,product,description});
  const depart=make('脫離基離開',shared,[...commonBonds,['CA','Br','CBr']], [arrow('CBr','Br')], '碳陽離子 + Br⁻','先由 C–Br 鍵提供電子，檢查離去後的電荷。');
  if(path==='sn2')return {kind,steps:[make('協同取代',[...shared,...nu],[...commonBonds,['CA','Br','CBr']], [arrow('lpNu','CA'),arrow('CBr','Br')], '2-iodobutane + Br⁻','成鍵與離去必須放在同一步；此二維圖表達連接關係，立體反轉請與三維觀察一起判斷。')]};
  if(path==='sn1') {
    const captureNodes=[...shared.filter(p=>!['Br','CBr'].includes(p.id)).map(p=>p.id==='CA'?{...p,label:'Cα⁺'}:p),...nu];
    const deprotonation=[point('CA','Cα',310,150,'atom','C'),point('Nu','O⁺',180,150,'atom','O'),point('HN','H',180,55,'atom','H'),point('OH','O–H 鍵',180,102,'bond'),point('Hkeep','H',113,210,'atom','H'),point('Base','O（H₂O）',455,60,'atom','O'),point('lpBase','水 O 的孤對電子',420,78,'lonepair'),point('Me1','Me',310,55,'atom','C'),point('Me2','Me',390,210,'atom','C'),point('Me3','Me',275,247,'atom','C')];
    // This SN1 case has three methyl groups, not the secondary skeleton used in SN2.
    const tertiaryNodes=nodes=>nodes.map(p=>p.id==='CB'?{...p,label:'Me'}:p).concat(point('Me3','Me',385,235,'atom','C'));
    return {kind,steps:[
      {...depart,nodes:tertiaryNodes(shared),bonds:[...depart.bonds,['CA','Me3','CMe3']]},
      make('水的親核進攻',tertiaryNodes(captureNodes),[...commonBonds,['CA','Me3','CMe3']],[arrow('lpNu','CA')],'R–OH₂⁺','親核劑提供電子對，碳陽離子接受；此步先得到氧陽離子。'),
      make('氧陽離子去質子化',deprotonation,[['CA','Nu','CO'],['Nu','HN','OH'],['Nu','Hkeep','OHkeep'],['CA','Me1','CM1'],['CA','Me2','CM2'],['CA','Me3','CM3']],[arrow('lpBase','HN'),arrow('OH','Nu')],'tert-butanol + H₃O⁺','另一個水分子接受質子，原 O–H 鍵電子回到原氧。')
    ]};
  }
  const elimNodes=[...shared,...base,...hydrogen];
  const elimBonds=[...commonBonds,['CA','Br','CBr'],['CB','HB','CH']];
  if(path==='e1') {
    const nodes=elimNodes.filter(p=>!['Br','CBr'].includes(p.id)).map(p=>p.id==='CA'?{...p,label:'Cα⁺'}:p);
    const tertiary=[point('Me2','Me',385,235,'atom','C'),point('Me4','Me',535,220,'atom','C')];
    return {kind,steps:[{...depart,nodes:[...depart.nodes,...tertiary],bonds:[...depart.bonds,['CA','Me2','CMe2'],['CB','Me4','CBMe4']]},make('失去 β-H 並形成雙鍵',[...nodes,...tertiary],[...commonBonds,['CB','HB','CH'],['CA','Me2','CMe2'],['CB','Me4','CBMe4']],[arrow('lpBase','HB'),arrow('CH','CC')],'2-methyl-2-butene + EtOH₂⁺','脫離基已在前一步離開；此步由鹼接受 β-H，C–H 電子形成 π 鍵。')]};
  }
  if(isChair){
    elimNodes.splice(elimNodes.findIndex(p=>p.id==='Me'),1);elimBonds.splice(elimBonds.findIndex(b=>b[2]==='CMe'),1);
    elimNodes.push(point('C2','C2',205,230,'atom','C'),point('C3','C3',285,290,'atom','C'),point('C4','C4',430,290,'atom','C'),point('C5','C5',520,230,'atom','C'),point('Me','Me',115,180,'atom','C'),point('H2','H2',115,260,'atom','H'),point('C2H','C2–H2 鍵',160,245,'bond'));
    elimBonds.push(['CA','C2','CAC2'],['C2','C3','C2C3'],['C3','C4','C3C4'],['C4','C5','C4C5'],['C5','CB','C5C6'],['C2','Me','C2Me'],['C2','H2','C2H']);
  }
  return {kind,steps:[make('協同消去',elimNodes,elimBonds,[arrow('lpBase','HB'),arrow('CH','CC'),arrow('CBr','Br')],isChair?'3-methylcyclohexene + EtOH + Br⁻':'2-butene（E/Z 依反應構形） + EtOH + Br⁻','三組電子移動在同一步：接受 β-H、形成 π 鍵、離去。此圖省略旁觀基團；anti 幾何另由三維證據判定。')]};
}

export function newMechanism(kind){return {version:1,kind,current:0,steps:mechanismSpec(kind).steps.map(()=>({arrows:[],confirmed:false,history:[],redo:[]}))};}
export function validateStep(spec,index,arrows) {
  const step=spec.steps[index];if(!step)return {ok:false,issues:[{code:'step',message:'目前步驟不存在。'}],matched:0,required:0};
  const issues=[],used=new Set(),nodes=new Map(step.nodes.map(n=>[n.id,n]));
  if(!Array.isArray(arrows)||arrows.length>20)return {ok:false,issues:[{code:'format',message:'箭頭資料格式不符。'}],matched:0,required:step.required.length};
  arrows.forEach((a,i)=>{
    const prefix=`第 ${i+1} 支箭頭：`,source=nodes.get(a?.from),target=nodes.get(a?.to),key=pair(a?.from,a?.to);
    if(!source||!target){issues.push({arrow:i,code:'site',message:prefix+'電子來源或去向不屬於這一步的結構。'});return;}
    if(a.electrons!==2){issues.push({arrow:i,code:'electron-count',message:prefix+'這是電子對移動，請用完整箭頭；魚鉤箭頭只表示一個電子。'});return;}
    if(source.role==='atom'){issues.push({arrow:i,code:'source',message:prefix+`目前從「${source.label}」原子出發；請選孤對電子或化學鍵作為電子來源。`});return;}
    if(used.has(key)){issues.push({arrow:i,code:'duplicate',message:prefix+'重複搬移同一對電子；請刪除重複箭頭。'});return;}
    const match=step.required.some(r=>r.from===a.from&&r.to===a.to);
    if(!match){
      let message;
      if(step.wrong?.[a.from])message=step.wrong[a.from];
      else if(a.from==='CBr')message='C–Br 鍵斷裂時，鍵電子應回到 Br；請修正箭頭的去向。';
      else if(a.from==='CH'||a.from==='C2H')message='檢查這條 C–H 鍵是否能提供形成 Cα=Cβ 的電子；電子去向應對應新 π 鍵。';
      else if(a.from==='lpNu')message='親核劑的電子對應流向接受電子的反應中心；請確認目標原子。';
      else if(a.from==='lpBase')message='鹼的電子對應指向本步要移走的氫，並與斷裂的 X–H 鍵配對。';
      else if(a.from==='OH')message='去質子化時，原 O–H 鍵電子應回到原氧。';
      else message='這組電子來源與去向不符合目前步驟，請核對先後順序及電子接受位置。';
      issues.push({arrow:i,code:'target',message:prefix+message});return;
    }
    used.add(key);
  });
  const missing=step.required.filter(r=>!used.has(pair(r.from,r.to)));
  if(missing.length)issues.push({code:'missing',message:`此步仍缺 ${missing.length} 組必要電子移動。請檢查成鍵、斷鍵是否完整。`});
  return {ok:issues.length===0,issues,matched:used.size,required:step.required.length};
}

export function validateMechanism(kind,work) {
  const spec=mechanismSpec(kind);
  if(!work||work.version!==1||work.kind!==kind||!Array.isArray(work.steps)||work.steps.length!==spec.steps.length)return {ok:false,issues:[{code:'incomplete',message:'尚未完成此機構的彎箭頭。'}]};
  const results=spec.steps.map((_,i)=>validateStep(spec,i,work.steps[i]?.arrows));
  return {ok:results.every((r,i)=>r.ok&&work.steps[i].confirmed===true),issues:results.flatMap((r,i)=>r.issues.map(issue=>({...issue,step:i}))),results};
}

export function validWork(kind,work){
  if(!work||work.version!==1||work.kind!==kind||!Array.isArray(work.steps)||work.steps.length!==mechanismSpec(kind).steps.length||!Number.isInteger(work.current)||work.current<0||work.current>=work.steps.length)return false;
  return work.steps.every(s=>s&&Array.isArray(s.arrows)&&s.arrows.length<=20&&s.arrows.every(a=>a&&typeof a.from==='string'&&typeof a.to==='string'&&[1,2].includes(a.electrons)&&Number.isFinite(a.bend)&&Math.abs(a.bend)<=120)&&typeof s.confirmed==='boolean');
}

export function changeArrows(work,arrows){
  const step=work.steps[work.current];step.history ||= [];step.redo ||= [];
  step.history.push(structuredClone(step.arrows));if(step.history.length>30)step.history.shift();step.redo=[];step.arrows=structuredClone(arrows);
  for(let i=work.current;i<work.steps.length;i++)work.steps[i].confirmed=false;
}
export function undoArrows(work,redo=false){
  const step=work.steps[work.current];step.history ||= [];step.redo ||= [];
  const source=redo?step.redo:step.history,target=redo?step.history:step.redo;if(!source.length)return false;
  target.push(structuredClone(step.arrows));step.arrows=source.pop();for(let i=work.current;i<work.steps.length;i++)work.steps[i].confirmed=false;return true;
}
export function arrowContext(kind,work){
  const spec=mechanismSpec(kind),index=work?.current||0,step=spec.steps[index];
  const result=validateStep(spec,index,work?.steps?.[index]?.arrows||[]);
  return {kind,step:index+1,stage:step.title,arrows:(work?.steps?.[index]?.arrows||[]).map((a,i)=>({number:i+1,from:step.nodes.find(n=>n.id===a.from)?.label||a.from,to:step.nodes.find(n=>n.id===a.to)?.label||a.to,electrons:a.electrons})),diagnosis:result.issues.map(i=>i.message),stepCorrect:result.ok,completed:validateMechanism(kind,work).ok};
}
