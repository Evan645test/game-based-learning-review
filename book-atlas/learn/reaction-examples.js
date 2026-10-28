import {mechanismSpec} from './electron-flow.js';
import {ADDED_KINDS,typeSpec} from './reaction-types.js';

// These are teaching adaptations of the cited textbook principles, not reported yields.
export const REACTION_EXAMPLES={
 sn2:[
  {id:'sn2-methyl',title:'溴甲烷＋氫氧根',substrate:'CH₃Br',reagent:'OH⁻',conditions:'水溶液中的親核取代；甲基沒有可供 E2 的 β 碳',product:'CH₃OH + Br⁻',shape:'methyl',nu:'OH⁻',nuAfter:'OH',element:'O',pages:[365,366,367],note:'OH⁻ 在這裡以氧成鍵；甲基受質不能走一般 β 消去。'},
  {id:'sn2-ethyl',title:'溴乙烷＋碘離子',substrate:'CH₃CH₂Br',reagent:'I⁻（NaI）',conditions:'acetone；一級受質、良好親核劑',product:'CH₃CH₂I + Br⁻',shape:'ethyl',nu:'I⁻',nuAfter:'I',element:'I',pages:[363,365,367],note:'從脫離基背面接近；此反應碳不手性，不需宣稱產物變成另一個對映異構物。'},
  {id:'sn2-cyanide',title:'1-溴丙烷＋氰離子',substrate:'CH₃CH₂CH₂Br',reagent:'CN⁻（NaCN，碳端進攻）',conditions:'DMSO；分析碳端親核取代',product:'CH₃CH₂CH₂C≡N + Br⁻（butanenitrile）',shape:'propyl',nu:'N≡C⁻',nuAfter:'N≡C',element:'C',pages:[365,367],note:'電子由氰離子的碳端提供，新 C–C 鍵使碳鏈增加一個碳。'},
  {id:'sn2-secondary',title:'2-溴丁烷＋碘離子',substrate:'CH₃CHBrCH₂CH₃',reagent:'I⁻（NaI）',conditions:'acetone，25 °C；簡單二級受質',product:'2-iodobutane + Br⁻',shape:'secondary',nu:'I⁻',nuAfter:'I',element:'I',pages:[361,363,367],note:'反應中心發生瓦登反轉；R/S 名稱須重新按優先序判定，不能一概說 R 必變 S。'}
 ],
 sn1:[
  {id:'sn1-water',title:'第三丁基溴＋水',substrate:'(CH₃)₃CBr',reagent:'H₂O',conditions:'富水極性質子性溶劑環境；分析取代分支',product:'tert-butanol + H₃O⁺ + Br⁻',groups:['Me','Me','Me'],solvent:'H₂O',kept:'H',baseAfter:'H₃O⁺',pages:[375,385],note:'先形成三級碳陽離子，再由水進攻及去質子化；E1 可競爭。'},
  {id:'sn1-tertamyl',title:'2-溴-2-甲基丁烷＋水',substrate:'(CH₃)₂C(Br)CH₂CH₃',reagent:'H₂O',conditions:'富水環境；分析三級受質取代分支',product:'2-methyl-2-butanol + H₃O⁺ + Br⁻',groups:['Et','Me','Me'],solvent:'H₂O',kept:'H',baseAfter:'H₃O⁺',pages:[375,387],note:'用 Et 與兩個 Me 辨認三級受質；不把乙基省略成甲基，也不排除消去。'},
  {id:'sn1-methanol',title:'第三丁基溴＋甲醇',substrate:'(CH₃)₃CBr',reagent:'MeOH',conditions:'甲醇溶劑解；分析形成醚的取代分支',product:'tert-butyl methyl ether + MeOH₂⁺ + Br⁻',groups:['Me','Me','Me'],solvent:'MeOH',kept:'Me',baseAfter:'MeOH₂⁺',pages:[375,387],note:'中性甲醇提供氧的孤對電子，先得到質子化醚，再去質子化；E1 仍可競爭。'},
  {id:'sn1-benzylic',title:'三級苄基氯＋水',substrate:'PhC(Cl)(CH₃)₂',reagent:'H₂O',conditions:'極性質子性溶劑環境；分析取代分支',product:'2-phenyl-2-propanol + H₃O⁺ + Cl⁻',groups:['Ph','Me','Me'],solvent:'H₂O',kept:'H',baseAfter:'H₃O⁺',leaving:'Cl',pages:[375,387],note:'Ph 表示苯基；苄基共振及三級取代可穩定碳陽離子。本例仍保留消去競爭。'}
 ],
 e1:[
  {id:'e1-tertbutyl',title:'第三丁基溴的消去分支',substrate:'(CH₃)₃CBr',reagent:'EtOH',conditions:'乙醇、加熱；解釋已觀察到的烯類分支',product:'2-methylpropene + EtOH₂⁺ + Br⁻',shape:'tertbutyl',pages:[385,387],note:'先離解，再由乙醇接受 β-H。SN1 會競爭，不能由加熱推定唯一產物。'},
  {id:'e1-tertamyl',title:'2-溴-2-甲基丁烷的消去',substrate:'(CH₃)₂C(Br)CH₂CH₃',reagent:'EtOH',conditions:'乙醇、加熱；分析乙基側 β-H 路徑',product:'2-methyl-2-butene + EtOH₂⁺ + Br⁻',shape:'tertamyl',pages:[385,387],note:'另可能形成 2-methyl-1-butene 與 SN1 產物；本動畫不代表產物比例。'},
  {id:'e1-methylpentane',title:'2-溴-2-甲基戊烷的消去',substrate:'(CH₃)₂C(Br)CH₂CH₂CH₃',reagent:'EtOH',conditions:'極性質子性溶劑環境、加熱；分析丙基側 β-H 路徑',product:'2-methyl-2-pentene + EtOH₂⁺ + Br⁻',shape:'methylpentane',pages:[385,387],note:'β 碳外側以 Et 縮合，保留正確碳數；其他 β 位與取代分支仍需考慮。'},
  {id:'e1-3methylpentane',title:'3-溴-3-甲基戊烷的消去',substrate:'CH₃CH₂C(Br)(CH₃)CH₂CH₃',reagent:'EtOH',conditions:'極性質子性溶劑環境、加熱；分析乙基側 β-H 路徑',product:'3-methyl-2-pentene + EtOH₂⁺ + Br⁻',shape:'3methylpentane',pages:[385,387],note:'可有 E/Z 烯類與其他區位產物。E1 中間體可旋轉，不套用 E2 的單一反式雙軸向規則。'}
 ],
 e2:[
  {id:'e2-butane',title:'2-溴丁烷＋乙氧根',substrate:'CH₃CHBrCH₂CH₃',reagent:'EtO⁻',conditions:'ethanol，加熱；分析 C2–C3 消去',product:'2-butene + EtOH + Br⁻',shape:'secondary',base:'OEt⁻',baseAfter:'EtOH',pages:[380,381,382],note:'常見 anti 路徑；E/Z 依構形判斷，也可能形成 1-butene 或取代產物。'},
  {id:'e2-propane',title:'2-溴丙烷＋乙氧根',substrate:'(CH₃)₂CHBr',reagent:'EtO⁻',conditions:'ethanol，加熱；強鹼支持消去',product:'propene + EtOH + Br⁻',shape:'propane',base:'OEt⁻',baseAfter:'EtOH',pages:[380,381,387],note:'兩個甲基側等價，得到相同連接的 propene；仍不虛構與取代競爭的比例。'},
  {id:'e2-tertamyl',title:'三級鹵化物＋乙氧根',substrate:'(CH₃)₂C(Br)CH₂CH₃',reagent:'EtO⁻',conditions:'ethanol；分析乙基側的 anti 消去',product:'2-methyl-2-butene + EtOH + Br⁻',shape:'tertamyl',base:'OEt⁻',baseAfter:'EtOH',pages:[380,381,387],note:'三級受質不適合一般 SN2；強鹼支持 E2，也須檢查其他可用 β-H。'},
  {id:'e2-primary',title:'1-溴丁烷＋體積大強鹼',substrate:'BrCH₂CH₂CH₂CH₃',reagent:'t-BuO⁻（KOtBu）',conditions:'t-BuOH、加熱；分析一級受質的 E2 分支',product:'1-butene + t-BuOH + Br⁻',shape:'primary',base:'OtBu⁻',baseAfter:'t-BuOH',pages:[380,381,387],note:'一級受質通常有利 SN2，但體積大強鹼可支持 E2；本例不可簡化為「一級只能 SN2」。'}
 ],
 addhx:[
  {id:'addhx-isobutylene',title:'2-甲基丙烯＋溴化氫',substrate:'(CH₃)₂C=CH₂',reagent:'HBr',conditions:'醚類溶劑；烯與強酸 HX，沒有脫離基',product:'2-bromo-2-methylpropane',c2:['Me','Me'],c1:[],X:'Br',cation:'三級碳陽離子',pages:[237,238,240,241],note:'H 加到取代較少的 C1，正電留在可形成三級碳陽離子的 C2（馬可尼可夫規則）。'},
  {id:'addhx-propene',title:'丙烯＋氯化氫',substrate:'CH₃CH=CH₂',reagent:'HCl',conditions:'烯與 HX；比較兩個雙鍵碳的取代程度',product:'2-chloropropane',c2:['Me','H'],c1:[],X:'Cl',cation:'二級碳陽離子',pages:[240,241,244],note:'質子加到末端 CH₂，形成二級而不是一級碳陽離子，因此 Cl 接在中間碳。'}
 ],
 hydration:[
  {id:'hyd-isobutylene',title:'2-甲基丙烯的酸催化加水',substrate:'(CH₃)₂C=CH₂',reagent:'H₂O（H₂SO₄ 催化，H₃O⁺）',conditions:'稀酸、大量水；烯而非醇',product:'tert-butanol（2-methyl-2-propanol）',c2:['Me','Me'],c1:[],cation:'三級碳陽離子',pages:[267,268],note:'與 HX 加成同樣先形成三級碳陽離子，再由水進攻並去質子化；酸只作催化劑。'},
  {id:'hyd-methylbutene',title:'2-甲基-2-丁烯的酸催化加水',substrate:'(CH₃)₂C=CHCH₃',reagent:'H₂O（H₃O⁺ 催化）',conditions:'稀酸、大量水',product:'2-methyl-2-butanol',c2:['Me','Me'],c1:['Me'],cation:'三級碳陽離子',pages:[240,267,268],note:'質子加到只帶一個甲基的雙鍵碳，正電落在三級碳；OH 接在取代較多的碳。'}
 ],
 halogenation:[
  {id:'halo-ethene',title:'乙烯＋溴',substrate:'CH₂=CH₂',reagent:'Br₂',conditions:'CH₂Cl₂ 等惰性溶劑；沒有酸或水',product:'1,2-dibromoethane',ring:false,X:'Br',pages:[263,264],note:'中間體是三元環溴鎓離子，不是開放的碳陽離子；第二個溴從背面打開環。'},
  {id:'halo-cyclopentene',title:'環戊烯＋溴',substrate:'環戊烯',reagent:'Br₂',conditions:'CH₂Cl₂ 等惰性溶劑',product:'trans-1,2-dibromocyclopentane（外消旋）',ring:true,X:'Br',pages:[264,265],note:'兩個 Br 來自雙鍵相反兩面，只得到反式產物；這是溴鎓離子中間體的證據。'}
 ],
 rearrangement:[
  {id:'rearr-hydride',title:'3-甲基-1-丁烯＋HCl（氫位移）',substrate:'CH₂=CHCH(CH₃)₂',reagent:'HCl',conditions:'烯與 HX；先得到的碳陽離子旁有可移動的 H',product:'2-chloro-2-methylbutane（重排）；另有約等量未重排的 2-chloro-3-methylbutane',shift:'H',X:'Cl',pages:[248,249],note:'二級碳陽離子旁的 C3–H 帶著電子對移到 C2⁺，形成較穩定的三級碳陽離子。'},
  {id:'rearr-methyl',title:'3,3-二甲基-1-丁烯＋HCl（甲基位移）',substrate:'CH₂=CHC(CH₃)₃',reagent:'HCl',conditions:'烯與 HX；相鄰碳只有甲基可移動',product:'2-chloro-2,3-dimethylbutane（重排）與 3-chloro-2,2-dimethylbutane 約等量',shift:'Me',X:'Cl',pages:[249],note:'C3 上的甲基帶著鍵電子移到 C2⁺；二級碳陽離子變成三級碳陽離子。'}
 ],
 dehydration:[
  {id:'dehyd-tertbutanol',title:'第三丁醇的酸催化脫水',substrate:'(CH₃)₃COH',reagent:'H₂SO₄',conditions:'酸催化、加熱；三級醇，產物烯離開反應',product:'2-methylpropene + H₃O⁺',cb:[],pages:[262,604,605],note:'三步 E1：OH 質子化成好脫離基水 → 失水成碳陽離子 → 失去 β-H。'},
  {id:'dehyd-tertamyl',title:'2-甲基-2-丁醇的酸催化脫水',substrate:'(CH₃)₂C(OH)CH₂CH₃',reagent:'H₂SO₄',conditions:'酸催化、加熱',product:'2-methyl-2-butene（主要，Zaitsev）＋少量 2-methyl-1-butene',cb:['Me'],pages:[604,605],note:'有兩種 β-H；失去 CH₂ 上的 H 得到取代較多的 2-methyl-2-butene。'}
 ]
};

const remove=(step,ids)=>{const set=new Set(ids);step.nodes=step.nodes.filter(n=>!set.has(n.id));step.bonds=step.bonds.filter(([a,b])=>!set.has(a)&&!set.has(b));};
const rename=(step,id,label)=>{const n=step.nodes.find(n=>n.id===id);if(n)n.label=label;};
export function exampleSpec(kind,example){
 if(ADDED_KINDS.includes(kind)){const spec=typeSpec(kind,example);for(const step of spec.steps)step.description=example.note+' '+step.description;return spec;}
 const spec=structuredClone(mechanismSpec(kind));
 for(const step of spec.steps){step.afterLabels={};step.description=example.note;}
 if(kind==='sn2'){
  const step=spec.steps[0];
  if(example.shape!=='secondary'){remove(step,['CB','Me4','CC']);rename(step,'CA',example.shape==='methyl'?'CH₃':'CH₂');if(example.shape==='methyl')remove(step,['Me']);else rename(step,'Me',example.shape==='ethyl'?'Me':'Et');}
  rename(step,'Nu',example.nu);step.nodes.find(n=>n.id==='Nu').element=example.element;
  step.afterLabels.Nu=example.nuAfter;step.afterLabels.CA=step.nodes.find(n=>n.id==='CA').label;step.product=example.product;
 }
 if(kind==='sn1'){
  for(let i=0;i<3;i++){
   const step=spec.steps[i];
   for(let j=0;j<3;j++)rename(step,i===2?['Me1','Me2','Me3'][j]:['CB','Me','Me3'][j],example.groups[j]);
   if(i===1){rename(step,'Nu',example.solvent);step.title='中性親核劑進攻';step.afterLabels.Nu=example.kept==='H'?'OH₂⁺':'O(H)Me⁺';step.product=example.kept==='H'?'R–OH₂⁺':'R–O(H)Me⁺';}
   if(i===2){rename(step,'Hkeep',example.kept);step.nodes.find(n=>n.id==='Hkeep').element=example.kept==='H'?'H':'C';rename(step,'Base',example.solvent);step.afterLabels.Base=example.baseAfter;step.product=example.product;}
   if(example.leaving){rename(step,'Br',example.leaving);const leaving=step.nodes.find(n=>n.id==='Br');if(leaving)leaving.element=example.leaving;step.afterLabels.Br=example.leaving+'⁻';}
  }
 }
 if(kind==='e1'){
  for(const step of spec.steps){
   if(example.shape==='tertbutyl')remove(step,['Me4']);
   if(example.shape==='methylpentane')rename(step,'Me4','Et');
   if(example.shape==='3methylpentane')rename(step,'Me2','Et');
  }
  spec.steps[1].product=example.product;
 }
 if(kind==='e2'){
  const step=spec.steps[0];rename(step,'Base',example.base);step.afterLabels.Base=example.baseAfter;
  if(example.shape==='propane')remove(step,['Me4']);
  if(example.shape==='primary'){remove(step,['Me']);rename(step,'Me4','Et');}
  if(example.shape==='tertamyl'){step.nodes.push({id:'ExtraMe',label:'Me',x:365,y:250,role:'atom',element:'C'});step.bonds.push(['CA','ExtraMe','CXMe']);}
  step.product=example.product;
 }
 spec.example=example;return spec;
}
