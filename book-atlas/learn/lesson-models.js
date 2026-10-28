import {FIGURES} from './figures-v3.js';
import {moleculeDiagramHTML,mountFigure} from './figure-view.js';
import {REACTION_EXAMPLES,exampleSpec} from './reaction-examples.js';
import {reactionScene3D,projectPoint,REFERENCE_VIEW} from './reaction-3d.js';
import {esc} from './reason-workbench.js';

const Q=Math.sqrt(3)/2;
const A=(id,el,x,y,extra={})=>({id,el,x,y,...extra});
const B=(a,b,order=1,style)=>({a,b,order,...(style?{style}:{})});
const chain=(n,doubleAt=0)=>({atoms:Array.from({length:n},(_,i)=>A('c'+(i+1),'C',i*Q,i%2?-.5:0)),bonds:Array.from({length:n-1},(_,i)=>B('c'+(i+1),'c'+(i+2),i+1===doubleAt?2:1))});
const attach=(mol,id,el,{hydrogen=el==='O',charge=0,lp=el==='O'?2:3}={})=>{
 const c=mol.atoms.find(a=>a.id===id),name=el.toLowerCase();
 mol.atoms.push(A(name,el,c.x,c.y-1,{lp,charge}));mol.bonds.push(B(id,name));
 if(hydrogen){mol.atoms.push(A(name+'h','H',c.x+Q,c.y-1.5));mol.bonds.push(B(name,name+'h'));}return mol;
};
const water=(h=2,charge=0)=>({atoms:[A('o','O',0,0,{lp:4-h,charge}),...Array.from({length:h},(_,i)=>A('h'+i,'H',Math.cos((h===2?-142.25+i*104.5:-30-i*120)*Math.PI/180),Math.sin((h===2?-142.25+i*104.5:-30-i*120)*Math.PI/180)))],bonds:Array.from({length:h},(_,i)=>B('o','h'+i))});
const methane=()=>({atoms:[A('c','C',0,0),A('h1','H',0,-1),A('h2','H',1,.3),A('h3','H',-.8,.6),A('h4','H',-.8,-.5)],bonds:[B('c','h1'),B('c','h2'),B('c','h3',1,'wedge'),B('c','h4',1,'dash')]});
const ammonia=()=>({atoms:[A('n','N',0,0,{lp:1}),A('h1','H',0,1),A('h2','H',Q,-.5),A('h3','H',-Q,-.5)],bonds:[B('n','h1'),B('n','h2'),B('n','h3')]});
const ion=(el,charge,lp)=>({atoms:[A('ion',el,0,0,{charge,lp})],bonds:[]});
const ring=()=>{const atoms=Array.from({length:6},(_,i)=>A('c'+(i+1),'C',Math.cos(i*Math.PI/3),Math.sin(i*Math.PI/3)));return {atoms,bonds:atoms.map((a,i)=>B(a.id,atoms[(i+1)%6].id))};};
function center(n,{cation=false,halide=false}={}){
 const atoms=[A('center','C',0,0,{charge:cation?1:0})],bonds=[],slots=cation?3:4;
 for(let i=0;i<slots;i++){const t=i*2*Math.PI/slots,el=i<n?'C':halide&&i===slots-1?'Br':'H';atoms.push(A('g'+i,el,Math.cos(t),Math.sin(t),el==='Br'?{lp:3}:{}));bonds.push(B('center','g'+i));}return {atoms,bonds};
}
function acid(){return {atoms:[A('m','C',-1,0),A('c','C',0,0),A('o','O',.5,-Q,{lp:2}),A('oh','O',.5,Q,{lp:2}),A('h','H',1.5,Q)],bonds:[B('m','c'),B('c','o',2),B('c','oh'),B('oh','h')]};}
function ketone(){return {atoms:[A('c1','C',-Q,.5),A('c2','C',0,0),A('c3','C',Q,.5),A('o','O',0,-1,{lp:2})],bonds:[B('c1','c2'),B('c2','c3'),B('c2','o',2)]};}
function groupR(el='O'){const atoms=[A('r','R',-1,0,{label:'R'}),A('x',el,0,0,{lp:el==='O'?2:3})],bonds=[B('r','x')];if(el==='O'){atoms.push(A('h','H',.7,-.7));bonds.push(B('x','h'));}return {atoms,bonds};}
function alkyl(n){const m=chain(n);m.atoms.unshift(A('r','R',-Q,-.5,{label:'R'}));m.bonds.unshift(B('r','c1'));return m;}
const fig=id=>[].concat(FIGURES[id]||[]);
const V=(title,mol,caption,highlights=[],extra={})=>({title,mol,caption,highlights,...extra});
function fromFigure(id){
 return fig(id).flatMap(f=>{
  if(f.items)return f.items.map(x=>V(x.name,x.mol,(x.highlight||[]).map(h=>h.label).join('；'),(x.highlight||[]).flatMap(h=>h.atoms||[]),{highlightEntries:x.highlight||[]}));
  if(f.mols)return f.mols.map(m=>V(f.title,m,f.steps?.[0]?.note||f.title));
  if(f.panels)return f.panels.filter(p=>p.mol).map(p=>V(p.caption,p.mol,p.text));
  return [];
 });
}
const G=(views,selected=0,focus='')=>({views,selected,focus});
const spatial=(title,mol,figure,caption)=>V(title,mol,caption,[],{figure});
const waters=[V('H₂O：兩鍵、兩對孤對',water(),'氧有兩個 O–H 鍵與兩對孤對；對照氧側與氫側的電子分布差異。',['o']),V('OH⁻：一鍵、三對孤對',water(1,-1),'氧有三對孤對；− 是形式電荷，需與 ESP 的偏負區域分開閱讀。',['o']),V('H₃O⁺：三鍵、一對孤對',water(3,1),'接受 H⁺ 後氧有三鍵與一對孤對，形式電荷為 +1。',['o'])];
const basics=[V('CH₄：四對成鍵電子',methane(),'每條 C–H 線代表一對成鍵電子；四個成鍵方向呈四面體。',['c']),V('NH₃：三鍵與一對孤對',ammonia(),'氮周圍有三對成鍵電子及一對孤對，合計八個電子。',['n']),waters[0],...fromFigure('lewis')];
const functional=[{...fromFigure('functional')[2],caption:'金色標出 C=C，兩端是雙鍵碳，對應烯的官能基；ESP 配色不表示鍵的電子對數。'},{...fromFigure('functional')[0],caption:'氧連著飽和碳與 H，形成 C–O–H；兩對孤對電子也在氧旁，因此辨認成醇。'},{...fromFigure('functional')[3],caption:'Cl 直接接在飽和碳上，是鹵烷；C–Cl 共用電子偏向 Cl，但兩者形式電荷仍為 0。'}];
const functionalExceptions=[fromFigure('functional')[1],V('羰基：C=O',ketone(),'先看 C=O；雙鍵把電子分布拉向氧，這個丙酮的羰基碳沒有接 OH。',['c2','o']),V('羧酸：C(=O)–OH',acid(),'同一個碳同時連 C=O 與 OH，才是這裡的羧酸；不能只看到 OH 就判成醇。',['c','o','oh','h'])];
const alkylViews=[V('甲基：R–CH₃',alkyl(1),'末端短線是與其餘分子 R 的連接；沒有 −1 電荷。',['c1']),V('乙基：R–CH₂CH₃',alkyl(2),'原乙烷少一個 H 的位置接上 R；乙基含兩個碳。',['c1','c2'])];
const rViews=[V('R–OH：R 接在氧旁',groupR(),'R 代表未指定的有機基團；本課程通常以烷基為例。',['x','h']),V('R–Br：R 接在鹵素旁',groupR('Br'),'R 是其餘有機部分；Br 是明確的鹵素原子，兩者不是同一種符號。',['x'])];
const degrees=[0,1,2,3,4].map(n=>V(n===0?'甲基型中心':n+'°：直接接 '+n+' 個碳',center(n,{halide:n===0}),`金色圈住判斷的中心碳；只數它直接連的 ${n} 個碳，H 不列入。`,['center',...Array.from({length:n},(_,i)=>'g'+i)]));
const alkene=fromFigure('alkene-name');
const alcohols=fromFigure('alcohol-name');
const halides=fromFigure('halide-name');
const sterics=[0,1,2,3].map(n=>V(n===0?'甲基鹵化物':n+'° 鹵烷',center(n,{halide:true}),'比較帶 Br 的碳旁有多少烷基；價電子雲不是硬球邊界，周圍基團仍造成空間阻礙。',['center']));
const cations=[0,1,2,3].map(n=>V(n===0?'甲基碳陽離子':n+'° 碳陽離子',center(n,{cation:true}),'正電中心有三個 σ 鍵；空 p 軌域沒有電子，不能畫成充滿電子的雲。',['center'],{chart:'empty-p'}));
const newman=spatial('丁烷：沿 C2→C3 看',chain(4),fig('conformation')[1],'先辨認四碳連接；切到空間模型可旋轉，前碳與後碳仍是不同原子。');
const chairs=fig('chair').map((f,i)=>spatial(i?'反式二甲基環己烷':'甲基環己烷',ring(),f,'ESP 圖的六角形只表示環的連接；軸向／赤道向與上／下請切到空間模型判讀。'));
const chirality=spatial('2-丁醇的四種基團',alcohols[1].mol,fig('chirality')[0],'OH、H、甲基與乙基是四種不同基團；電子雲分布不決定 R/S，需看空間方向。');
const ether=fromFigure('functional')[1];
const solvents=fromFigure('solvent');
const zaitsev=fromFigure('zaitsev');
const heat=fromFigure('heat').map(v=>({...v,chart:'entropy'}));
const equilibrium=fromFigure('equilibrium').map(v=>({...v,chart:'equilibrium'}));
const explicitEthene={atoms:[A('c1','C',-.5,0),A('c2','C',.5,0),A('h1','H',-1,Q),A('h2','H',-1,-Q),A('h3','H',1,Q),A('h4','H',1,-Q)],bonds:[B('c1','c2',2),B('c1','h1'),B('c1','h2'),B('c2','h3'),B('c2','h4')]};
const hybrid=[basics[0],V('sp²：乙烯的 C=C',explicitEthene,'兩個雙鍵碳都呈平面；C=C 含一個 σ 鍵與一個 π 鍵，不能從 ESP 顏色讀出電子對數。',['c1','c2']),cations[3]];
const donor=[waters[0],waters[1],V('I⁻：四對孤對',ion('I',-1,4),'親核劑可由孤對提供電子；中性水也能提供電子，並非只有負離子可以。',['ion'])];
const acidbase=[waters[0],waters[2],waters[1],V('HBr：H 接受鹼的電子對',{atoms:[A('h','H',0,0,{partial:'δ+'}),A('br','Br',1,0,{lp:3,partial:'δ−'})],bonds:[B('h','br')]},'H–Br 鍵電子偏向 Br；質子轉移時，這對鍵電子最後留給 Br。',['h','br'])];
const bromide=V('C–Br：共用電子偏向 Br',FIGURES.polarity.mols[0],'δ 表示部分電荷；鍵還存在，不能因此把碳與 Br 直接畫成分離離子。',['c','x']);
const alkoxide=V('EtO⁻：氧有三對孤對',attach(chain(2),'c2','O',{hydrogen:false,charge:-1,lp:3}),'同一氧可以用電子對與碳成鍵，或接受 H⁺；要看目標原子與條件。',['o']);
const sourceReactionFigures=fig('reactions');
const reactionTypes=sourceReactionFigures.map((f,i)=>V(['加成：雙鍵兩端加入基團','取代：一個基團換掉另一個','消去：失去基團、形成雙鍵','重排：連接位置改變'][i],f.panels.at(-1).mol,'這裡只比較反應前後的連接；電子雲不是多步機構或反應時間軸。'));
const resonance=V('乙酸根：O–C–O 的離域分布',fig('resonance')[1].mols[0],'兩個 O 共同分擔淨負電；此圖畫 σ 骨架與離域區，不把兩條 C–O 當成兩個普通單鍵的完整路易士式。',['ot','c','ob'],{cloudGroups:[['ot','c','ob']],netCharge:-1,figure:fig('resonance')});
const anti=spatial('沿 α–β 鍵找 anti',attach(chain(4),'c2','Br'),{kind:'newman',title:'沿 Cα→Cβ 觀察',front:['Br','CH₃','H'],back:['H','CH₃','H'],frames:[{dihedral:180,label:'H 與 Br：180°',note:'先確認背面標出的 H 確實在 β 碳上。'},{dihedral:60,label:'轉動到 60°',note:'開鏈可旋轉；要再找能達到 anti 的構形。'}]},'電子雲顯示電子分布；反向共平面的條件須切到空間模型看 H–Cβ–Cα–Br。');
const chairE2=spatial('環上的 α／β 與雙軸向',attach(ring(),'c1','Cl'),FIGURES['chair-e2'],'環的連接與 Cl 位置先看清楚，再切到空間模型找與 Cl 一上一下的軸向 β-H。');
const energy=[V('能量峰與成鍵中的結構',cations[3].mol,'圖上的峰頂是過渡態，不能當成可分離的穩定物種；電子雲小圖只是中間體對照。',[],{chart:'energy'}),{...cations[3],chart:'energy'}];

// One explicitly matched guide per source paragraph, including collapsed exceptions.
export const CARD_MODEL_GUIDES={
 lewis:[G(basics,0,'先對照元素與它常見的鍵／孤對數。'),G(basics,1,'點是孤對電子，線是共用電子對。'),G(basics,2,'用鍵與孤對一起檢查八隅體。')],
 hybrid:[G(hybrid),G(hybrid,1),G(hybrid,2),G(hybrid,0)],
 skeletal:[G([halides[0]],0,'轉折點是碳，Br 與孤對電子另行標出。'),G([functional[0],halides[0]],0,'雙鍵算兩個鍵級，不能把兩條線當成兩個碳。'),G([waters[0],basics[1],bromide],0,'省略孤對不表示它不存在。')],
 polarity:[G([bromide]),G([bromide,waters[0]],0,'部分電荷與形式電荷分開讀。'),G([bromide],0,'保留 C–Br 鍵，避免把極性當成已離解。')],
 formal:[G(waters),G(waters,1),G(waters,2)],
 resonance:[G([resonance]),G([resonance]),G([resonance])],
 acidbase:[G(acidbase,0),G(acidbase,3),G(acidbase,2),G(acidbase,1)],
 functional:[G(functional),G(functionalExceptions),G(alkylViews),G(rViews)],
 degree:[G(degrees,2),G([halides[0]],0,'帶 Br 的碳是 α，與它相鄰的碳才是 β。')],
 naming:[G([1,2,3,4,5,6,7,8,9,10].map(n=>V(n+' 個碳的連續鏈',n===1?methane():chain(n),'先沿實際相連的碳逐一數；支鏈不會自動變成主鏈的一部分。'))),G(fromFigure('naming')),G(fromFigure('naming')),G([V('環己烷：六碳單鍵成環',ring(),'平面六角形只表示連接；椅式才描述它常見的空間構形。')])],
 'alcohol-name':[G(alcohols),G(alcohols,1),G([V('2-丙醇',attach(chain(3),'c2','O'),'OH 在第 2 個碳；此碳直接接兩個碳。',['c2','o','oh'])])],
 conformation:[G([newman]),G([newman]),G([newman])],
 chair:[G(chairs),G(chairs),G(chairs),G(chairs),G(chairs),G(chairs,1),G(chairs,1),G([chairE2])],
 chirality:[G([chirality]),G([chirality]),G([chirality]),G([chirality])],
 reactions:[G(reactionTypes),G([bromide,waters[0]]),G([V('Cl–Cl：兩原子共用一對電子',{atoms:[A('a','Cl',0,0,{lp:3}),A('b','Cl',1,0,{lp:3})],bonds:[B('a','b')]},'此圖是斷鍵前；均裂各分一個電子，異裂則一側拿走整對，不能用同一個箭頭混畫。')])],
 nucleophile:[G(donor),G([cations[3],bromide,acidbase[3]]),G([waters[0],cations[3]])],
 arrows:[G([bromide,waters[0]]),G([bromide,V('Br⁻：帶走 C–Br 鍵的電子',ion('Br',-1,4),'斷鍵後 Br⁻ 有四對孤對；別把箭頭從原子運動的方向畫起。')])],
 energy:[G(energy),G(energy,1),G(energy)],
 'alkene-name':[G(alkene,1),G([V('環己烯：環上的 1、2 號是雙鍵',{...ring(),bonds:ring().bonds.map((b,i)=>({...b,order:i===0?2:1}))},'先編雙鍵，再處理環上的其他支鏈。',['c1','c2'])]),G(alkene),G(alkene,1),G(alkene,2)],
 carbocation:[G(cations,3),G(cations,3),G(cations),G(cations,1)],
 'halide-name':[G([sterics[0],halides[0]]),G(halides),G(halides,1)],
 sterics:[G(sterics),G(sterics,3),G([alkoxide,sterics[3]])],
 leaving:[G([V('I⁻',ion('I',-1,4),'離去後能穩定攜帶電子的物種，是這裡比較的對象。'),V('Br⁻',ion('Br',-1,4),'離去基帶走原鍵的一對電子。'),V('Cl⁻',ion('Cl',-1,4),'離去能力與電子雲的繪圖大小不是同一個量。')]),G([waters[1],waters[0]])],
 solvent:[G([waters[0],...solvents]),G(solvents,1)],
 inversion:[G([chirality]),G([chirality]),G([chirality,cations[3]])],
 basicity:[G([alkoxide,donor[2]]),G([alkoxide,donor[2],waters[0]]),G([alkoxide,sterics[2]])],
 anti:[G([anti]),G([anti])],
 zaitsev:[G(zaitsev,1),G(zaitsev),G(zaitsev,2)],
 'chair-e2':[G([chairE2]),G([chairE2])],
 heat:[G(heat,0),G(heat,1)],
 equilibrium:[G(equilibrium),G(equilibrium,1),G(equilibrium)]
};

const NARRATIVE_EXAMPLES={sn2:'sn2-ethyl',sn1:'sn1-water',e2:'e2-butane',e1:'e1-tertamyl',addhx:'addhx-isobutylene',halogenation:'halo-cyclopentene',hydration:'hyd-isobutylene',rearrangement:'rearr-hydride',dehydration:'dehyd-tertamyl'};
export function reactionEndpointModel(kind,example=REACTION_EXAMPLES[kind]?.find(e=>e.id===NARRATIVE_EXAMPLES[kind])){
 if(!example)throw new RangeError('反應例子不存在：'+kind);
 const spec=exampleSpec(kind,example);
 const convert=(index,mode)=>{
  const scene=reactionScene3D(kind,index,mode,mode==='product'?1:0,spec),visible=new Set(scene.atoms.filter(a=>!a.spectator).map(a=>a.id));
  const atoms=scene.atoms.filter(a=>visible.has(a.id)).map(a=>{const p=projectPoint(a.p,REFERENCE_VIEW),el=a.element,charge=a.charge||0,lp=el==='O'?2-charge:['F','Cl','Br','I'].includes(el)?3-charge:el==='N'?Math.max(0,1-charge):el==='C'&&charge<0?1:0;return A(a.id,el,p.x/70,p.y/70,{charge,lp});});
  const bonds=scene.bonds.filter(b=>visible.has(b.a)&&visible.has(b.b)&&b.opacity>.99).map(b=>B(b.a,b.b,b.piOpacity===0?1:b.order||1));
  if(kind==='halogenation'&&mode==='product'){let face=0;for(const bond of bonds){const a=atoms.find(x=>x.id===bond.a),b=atoms.find(x=>x.id===bond.b);if(['Br','Cl'].includes(a?.el)||['Br','Cl'].includes(b?.el)){if(['Br','Cl'].includes(a.el))[bond.a,bond.b]=[bond.b,bond.a];bond.style=face++===0?'wedge':'dash';}}}
  const components=[],remaining=new Set(atoms.map(a=>a.id));
  while(remaining.size){const seen=new Set(),queue=[remaining.values().next().value];while(queue.length){const id=queue.pop();if(seen.has(id))continue;seen.add(id);remaining.delete(id);for(const b of bonds){if(b.a===id&&!seen.has(b.b))queue.push(b.b);if(b.b===id&&!seen.has(b.a))queue.push(b.a);}}components.push(seen);}
  const chosen=components.sort((a,b)=>atoms.filter(x=>b.has(x.id)&&x.el==='C').length-atoms.filter(x=>a.has(x.id)&&x.el==='C').length)[0];
  return {atoms:atoms.filter(a=>chosen.has(a.id)),bonds:bonds.filter(b=>chosen.has(b.a)&&chosen.has(b.b))};
 };
 return G([V('起始有機物：'+example.substrate,convert(0,'overview'),'先看有機物的反應中心；試劑、溶劑與條件依旁邊文字判斷，圖中未列出的物種仍參與反應。'),V('主要有機產物：'+example.product,convert(spec.steps.length-1,'product'),'這張只畫主要有機產物，未列副產物；與起始結構對照鍵結，完整機構留到最後複習。')]);
}

function bromobutaneR(){
 const m=structuredClone(fig('chirality')[1].panels[0].mol);m.atoms=m.atoms.filter(a=>a.id!=='oh');m.bonds=m.bonds.filter(b=>b.a!=='oh'&&b.b!=='oh');const o=m.atoms.find(a=>a.id==='o');o.el='Br';o.lp=3;return m;
}
function protonatedAlcohol(){
 const m=structuredClone(alcohols[2].mol),o=m.atoms.find(a=>a.el==='O');o.charge=1;o.lp=1;m.atoms.push(A('newh','H',o.x-Q,o.y-.5));m.bonds.push(B(o.id,'newh'));return m;
}
export const EXAMPLE_MODEL_GUIDES={
 lewis:G(fromFigure('lewis')),hybrid:G([sterics[0],cations[3]]),skeletal:G([halides[0]]),polarity:G([bromide,waters[2]]),formal:G(waters),resonance:G([resonance]),acidbase:G([waters[0],acidbase[3],waters[2],V('Br⁻',ion('Br',-1,4),'H–Br 鍵的電子留給 Br，總電荷前後守恆。')]),
 functional:G([functional[1],ether,functional[0]]),degree:G([halides[0]]),naming:G(fromFigure('naming')),'alcohol-name':G([alcohols[1]]),conformation:G([newman]),chair:G([chairs[0]]),chirality:G([chirality]),reactions:G([reactionTypes[1],reactionTypes[0]]),nucleophile:G([waters[0],cations[3],donor[2],bromide]),arrows:G([bromide,cations[0],V('Br⁻',ion('Br',-1,4),'原 C–Br 鍵的一對電子成為 Br 的非鍵結電子。')]),energy:G(energy),
 'alkene-name':G([alkene[2]]),carbocation:G([cations[3],cations[1]]),'halide-name':G([halides[1]]),sterics:G([sterics[0],sterics[3]]),leaving:G([alcohols[2],V('質子化醇',protonatedAlcohol(),'氧有三鍵、一對孤對，形式電荷 +1。'),cations[3],waters[0]]),solvent:G(solvents),inversion:G([V('(R)-2-溴丁烷',bromobutaneR(),'此例 Br 是第一優先，與後來 OH 的順位相同；先比較其餘三個基團的空間方向。'),fromFigure('chirality')[1]]),basicity:G([alkoxide,sterics[2]]),anti:G([anti]),zaitsev:G(zaitsev,1),'chair-e2':G([chairE2]),heat:G(heat),equilibrium:G(equilibrium,1)
};

const guides=new Map();
export function explanationHTML(text,{id,index=0,example=false,reactionKind=null,phase='hint'}={}){
 const key=(reactionKind?'reaction:'+reactionKind:'card:'+id)+':'+(example?'example':index);
 const guide=reactionKind?reactionEndpointModel(reactionKind):(example?EXAMPLE_MODEL_GUIDES[id]:CARD_MODEL_GUIDES[id]?.[index]);
 if(!guide?.views?.length)throw new RangeError('缺少段落模型：'+key);
 guides.set(key,guide);
 return `<section class="model-explanation" data-explanation-row="${esc(key)}"><div class="model-explanation-text"><p data-teacher-${phase}>${esc(text)}</p></div><figure class="explanation-model" data-explanation-model="${esc(key)}"></figure></section>`;
}
function chartHTML(kind){
 if(kind==='energy')return '<svg class="model-concept-chart" viewBox="0 0 360 170" role="img" aria-label="定性能量圖，峰是過渡態，谷是中間體，橫軸是反應進程"><path d="M25 15V140H345" fill="none" stroke="#708177"/><path d="M35 115C55 115 65 35 95 35S125 100 160 100S200 55 225 55S275 125 335 125" fill="none" stroke="#496a67" stroke-width="3"/><text x="27" y="14">能量</text><text x="245" y="163">反應進程 →</text><text x="62" y="26">過渡態 ‡</text><text x="141" y="121">中間體</text></svg>';
 if(kind==='entropy')return '<svg class="model-concept-chart" viewBox="0 0 360 140" role="img" aria-label="當ΔS為正，升高T會使負TΔS項更負；不能只用粒子數決定速率或產物比例"><text x="180" y="35" text-anchor="middle">ΔG = ΔH − TΔS</text><text x="30" y="78">若 ΔS &gt; 0</text><path d="M150 75H225" stroke="#496a67" stroke-width="3"/><text x="180" y="65" text-anchor="middle">T ↑</text><text x="235" y="80">−TΔS 更負</text><text x="180" y="120" text-anchor="middle">仍須一起比較溶劑與競爭途徑</text></svg>';
 if(kind==='equilibrium')return '<svg class="model-concept-chart" viewBox="0 0 360 110" role="img" aria-label="醇與烯加水可逆，增加水偏向醇，移走烯促進脫水"><text x="55" y="45">醇</text><text x="235" y="45">烯＋水</text><path d="M105 37H222M105 52H222" stroke="#496a67" stroke-width="2"/><path d="M217 32L224 37L217 42M111 47L104 52L111 57" fill="none" stroke="#496a67" stroke-width="2"/><text x="180" y="90" text-anchor="middle">加水 ←　　→ 移走烯</text></svg>';
 if(kind==='empty-p')return '<svg class="model-concept-chart" viewBox="0 0 360 110" role="img" aria-label="碳陽離子的空p軌域沒有電子，虛線輪廓不能當成電子密度"><ellipse cx="180" cy="32" rx="16" ry="22" fill="none" stroke="#8d7eac" stroke-dasharray="4 4"/><ellipse cx="180" cy="78" rx="16" ry="22" fill="none" stroke="#8d7eac" stroke-dasharray="4 4"/><text x="180" y="62" text-anchor="middle">C⁺</text><text x="220" y="60">空 p：不填電子雲</text></svg>';
 return '';
}
export function mountExplanationModels(root){
 const abort=new AbortController(),stops=[];
 const labelFigureControls=host=>{
  host.querySelectorAll('[data-figure-prev]').forEach(b=>{b.textContent='上一圖';b.setAttribute('aria-label','圖解上一個重點');});
  host.querySelectorAll('[data-figure-next]').forEach(b=>{b.textContent='下一圖';b.setAttribute('aria-label','圖解下一個重點');});
 };
 for(const host of root.querySelectorAll('[data-explanation-model]')){
  const guide=guides.get(host.dataset.explanationModel);if(!guide)continue;
  let selected=Math.min(guide.selected,guide.views.length-1),mode='esp',stop=()=>{};
  const render=()=>{
   stop();stop=()=>{};const v=guide.views[selected];
   host.innerHTML=`<figcaption>${esc(v.title)}</figcaption>${guide.views.length>1?`<div class="model-variants" role="group" aria-label="對照模型">${guide.views.map((x,i)=>`<button type="button" data-model-variant="${i}" aria-pressed="${i===selected}">${esc(x.title.split('：')[0])}</button>`).join('')}</div>`:''}<div class="model-modes" role="group" aria-label="模型顯示方式"><button type="button" data-model-mode="esp" aria-pressed="${mode==='esp'}">靜電位圖 ESP</button><button type="button" data-model-mode="structure" aria-pressed="${mode==='structure'}">${v.figure?'空間／結構模型':'鍵結結構'}</button></div><div data-inline-model>${mode==='structure'&&v.figure?'':chartHTML(v.chart)+moleculeDiagramHTML(v.mol,{label:v.title+'；'+v.caption,highlights:v.highlights,highlightEntries:v.highlightEntries,electronCloud:false,cloudGroups:v.cloudGroups,electrostaticPotential:mode==='esp',netCharge:v.netCharge})}</div><p class="model-caption" data-model-caption>${esc(guide.focus?guide.focus+' '+v.caption:v.caption)}</p><p class="cloud-legend" data-cloud-legend ${mode==='esp'?'':'hidden'}><span class="cloud-scale esp-scale" aria-hidden="true"></span>紅：靜電位偏負；藍：偏正。定性圖解，非量子計算。</p><details class="cloud-reading"><summary>如何讀這張圖</summary><p>${mode==='esp'?'整片彩色表面包覆分子，紅→黃→綠→青→藍表示由偏負到偏正的定性過渡；輪廓並非計算的等電子密度面，顏色不能直接讀成電子數或密度。ESP 圖會補出常見碳上的 H。':'鍵結模型用來看原子連接、鍵級、孤對與電荷；空間模型用來看成鍵方向與立體排列。鍵結圖可省略 C–H。'}R 是未指定基團，不預設其極性。點是孤對電子，金色圈出本段重點；＋／− 是形式電荷，δ 是部分電荷。共振、π 鍵與空 p 軌域仍在對應小節以專用圖解說明。這些圖未經電子結構計算，不能讀出定量電子密度或電位，也不能只憑顏色比較反應速率。</p><p>配色原理：<a href="https://people.chem.ucsb.edu/laverman/leroy/Freeman/ESP.html" target="_blank" rel="noopener noreferrer">UCSB 靜電位視覺化說明</a>。</p></details>`;
   if(mode==='structure'&&v.figure){stop=mountFigure(host.querySelector('[data-inline-model]'),v.figure);labelFigureControls(host);}
  };
  host.addEventListener('click',e=>{if(e.target.closest('[data-figure-item]'))labelFigureControls(host);},{signal:abort.signal});
  host.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!host.contains(b))return;if(b.dataset.modelVariant!==undefined){const n=Number(b.dataset.modelVariant);if(!Number.isInteger(n)||n<0||n>=guide.views.length)return;selected=n;render();host.querySelector(`[data-model-variant="${n}"]`)?.focus({preventScroll:true});}else if(['esp','structure'].includes(b.dataset.modelMode)){mode=b.dataset.modelMode;render();host.querySelector(`[data-model-mode="${mode}"]`)?.focus({preventScroll:true});}},{signal:abort.signal});
  render();stops.push(()=>stop());
 }
 return {destroy(){abort.abort();stops.forEach(stop=>stop());}};
}
