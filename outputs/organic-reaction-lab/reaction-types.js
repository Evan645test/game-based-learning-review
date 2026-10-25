// Alkene addition, carbocation rearrangement and alcohol dehydration.
// 2D specs feed the arrow editor; 3D step states feed the ball-and-stick player.
// Geometry is a teaching model, not a computed trajectory.

export const ADDED_KINDS=['addhx','hydration','halogenation','rearrangement','dehydration'];
export const KIND_LABELS={sn2:'SN2',sn1:'SN1',e1:'E1',e2:'E2',chair:'椅式 E2',addhx:'HX 加成',hydration:'酸催化加水',halogenation:'X₂ 加成',rearrangement:'碳陽離子重排',dehydration:'醇的酸催化脫水'};

const P=(id,label,x,y,role='atom',element='C')=>({id,label,x,y,role,element});
const A=(from,to,explain,focus)=>({from,to,electrons:2,bend:45,explain,focus});
const make=(title,nodes,bonds,required,product,description,extra={})=>({title,nodes,bonds,required,product,description,...extra});
const el=label=>label==='H'?'H':label==='Br'?'Br':label==='Cl'?'Cl':'C';

const DEFAULTS={
 addhx:{c2:['Me','Me'],c1:[],X:'Br',cation:'三級碳陽離子',product:'2-bromo-2-methylpropane'},
 hydration:{c2:['Me','Me'],c1:[],cation:'三級碳陽離子',product:'tert-butanol'},
 halogenation:{ring:false,X:'Br',product:'1,2-dibromoethane'},
 rearrangement:{shift:'H',X:'Cl',product:'2-chloro-2-methylbutane'},
 dehydration:{cb:[],product:'2-methylpropene + H₃O⁺'}
};

function protonation(ex,acid){
 const g=ex.c2,hx=acid==='HX',X=ex.X||'Br';
 const nodes=[P('C1','C1',300,190),P('C2','C2',420,190),P('G1',g[0],490,110,'atom',el(g[0])),P('G2',g[1],490,270,'atom',el(g[1])),P('PI','C1=C2 π 鍵',360,190,'bond'),P('H','H',280,85,'atom','H')];
 const bonds=[['C1','C2','CC'],['C2','G1','CG1'],['C2','G2','CG2']];
 if(ex.c1?.length){nodes.push(P('M1',ex.c1[0],230,270));bonds.push(['C1','M1','CM1']);}
 if(hx){nodes.push(P('X',X,150,55,'atom',X),P('HX',`H–${X} 鍵`,215,70,'bond'));bonds.push(['H','X','HXb']);}
 else{nodes.push(P('Oa','O（H₃O⁺）',170,60,'atom','O'),P('OH','O–H 鍵',225,72,'bond'),P('Ha1','H',115,110,'atom','H'),P('Ha2','H',115,25,'atom','H'));bonds.push(['H','Oa','HOa'],['Oa','Ha1','OHa1'],['Oa','Ha2','OHa2']);}
 const required=[A('PI','H','烯的 π 鍵電子對是親核端，指向酸上的氫，形成新的 C1–H 鍵；不是氫去「攻擊」雙鍵。','追蹤 π 鍵電子：目標是酸的 H。'),hx?A('HX','X',`H–${X} 鍵斷裂時，鍵電子回到 ${X}，生成 ${X}⁻。`,`追蹤 H–${X} 鍵電子：回到 ${X}。`):A('OH','Oa','H₃O⁺ 的 O–H 鍵電子回到氧，留下中性水；酸只提供一個質子。','追蹤 O–H 鍵電子：回到氧。')];
 const wrong={PI:'π 鍵電子應指向酸上的氫（H），形成新的 C–H 鍵；碳陽離子在另一個雙鍵碳上產生。',HX:`H–${X} 鍵電子應回到 ${X}，不是留在 H。`,OH:'H₃O⁺ 的 O–H 鍵電子應回到氧。'};
 return {nodes,bonds,required,wrong};
}
function capture(ex,nu){
 const g=ex.c2,X=ex.X||'Br',nodes=[P('C1','C1',300,190),P('C2','C2⁺',420,190),P('G1',g[0],500,130,'atom',el(g[0])),P('G2',g[1],500,260,'atom',el(g[1]))],bonds=[['C1','C2','CC'],['C2','G1','CG1'],['C2','G2','CG2']];
 if(ex.c1?.length){nodes.push(P('M1',ex.c1[0],230,270));bonds.push(['C1','M1','CM1']);}
 if(nu==='X'){nodes.push(P('X',X+'⁻',420,55,'atom',X),P('lpX',X+'⁻ 的孤對電子',420,92,'lonepair'));return {nodes,bonds,required:[A('lpX','C2',`${X}⁻ 用孤對電子與缺電子的 C2⁺ 成鍵；平面碳陽離子可從上下兩面被接近。`,`追蹤 ${X}⁻ 的孤對電子：目標是 C2⁺。`)],wrong:{lpX:`${X}⁻ 的孤對電子應指向帶正電的 C2。`}};}
 nodes.push(P('Ow','O（H₂O）',420,55,'atom','O'),P('lpOw','水 O 的孤對電子',420,92,'lonepair'),P('Hw1','H',365,30,'atom','H'),P('Hw2','H',475,30,'atom','H'));bonds.push(['Ow','Hw1','OHw1'],['Ow','Hw2','OHw2']);
 return {nodes,bonds,required:[A('lpOw','C2','水分子用氧的孤對電子與 C2⁺ 成鍵，先得到帶正電的氧（R–OH₂⁺）。','追蹤水的孤對電子：目標是 C2⁺。')],wrong:{lpOw:'水的孤對電子應指向 C2⁺。'}};
}
function deprotonate(center='C2',groups=['C1','G1','G2'],labels=['C1','Me','Me']){
 const nodes=[P(center,center==='CA'?'Cα':'C2',420,210),P('O','O⁺',420,115,'atom','O'),P('Hd','H',505,75,'atom','H'),P('OHd','O–H 鍵',462,95,'bond'),P('Hk','H',335,75,'atom','H'),P('Ob','O（H₂O）',590,140,'atom','O'),P('lpOb','水 O 的孤對電子',555,122,'lonepair'),P('Hb1','H',615,200,'atom','H'),P('Hb2','H',620,90,'atom','H')];
 const pos=[[310,250],[470,300],[530,250]];groups.forEach((id,i)=>nodes.push(P(id,labels[i],...pos[i],'atom',el(labels[i]))));
 return {nodes,bonds:[[center,'O','CO'],['O','Hd','OHdb'],['O','Hk','OHk'],['Ob','Hb1','OHb1'],['Ob','Hb2','OHb2'],...groups.map(id=>[center,id,'C'+id])],required:[A('lpOb','Hd','另一個水分子用孤對電子接受氧陽離子上的氫，生成 H₃O⁺，酸催化劑因此再生。','追蹤水的孤對電子：接受 O⁺ 上的 H。'),A('OHd','O','原 O–H 鍵電子回到氧，得到中性的醇。','追蹤 O–H 鍵電子：回到氧。')],wrong:{lpOb:'水的孤對電子應指向要移走的氫（O⁺ 上的 H）。',OHd:'斷裂的 O–H 鍵電子應回到氧。'}};
}

function addhxSpec(ex){
 const s1=protonation(ex,'HX'),s2=capture(ex,'X');
 return [make('π 鍵接受質子',s1.nodes,s1.bonds,s1.required,`${ex.cation} + ${ex.X}⁻`,'烯的 π 鍵當親核劑，接受 H–X 的質子。H 加到取代較少的碳，正電留在能形成較穩定碳陽離子的碳。',{wrong:s1.wrong,approach:'HX 帶著可給出的質子靠近 π 鍵上方；接近尚未成鍵。'}),
  make('鹵離子接住碳陽離子',s2.nodes,s2.bonds,s2.required,ex.product,'第二步很快：鹵離子的孤對電子與碳陽離子成鍵，得到中性加成產物。',{wrong:s2.wrong,approach:`${ex.X}⁻ 靠近平面碳陽離子；可從上下任一面接近。`,motionFocus:`看 ${ex.X}⁻ 與 C2⁺ 成鍵，平面碳變回四面體。`})];
}
function hydrationSpec(ex){
 const s1=protonation(ex,'H3O'),s2=capture(ex,'O'),s3=deprotonate('C2',['C1','G1','G2'],['C1',ex.c2[0],ex.c2[1]]);
 return [make('π 鍵接受 H₃O⁺ 的質子',s1.nodes,s1.bonds,s1.required,`${ex.cation} + H₂O`,'和 HX 加成相同：質子加到取代較少的雙鍵碳，形成較穩定的碳陽離子。',{wrong:s1.wrong,approach:'H₃O⁺ 靠近 π 鍵上方；接近尚未成鍵。'}),
  make('水分子進攻碳陽離子',s2.nodes,s2.bonds,s2.required,'R–OH₂⁺','大量存在的水當親核劑，與碳陽離子成鍵，先得到氧陽離子。',{wrong:s2.wrong,approach:'水分子帶著氧的孤對電子靠近平面碳陽離子。',motionFocus:'看水的氧與 C2⁺ 成鍵；氧暫時帶正電。'}),
  make('去質子化得到醇',s3.nodes,s3.bonds,s3.required,ex.product+' + H₃O⁺','另一個水分子接受質子，得到中性的醇並再生 H₃O⁺；酸是催化劑。',{wrong:s3.wrong,approach:'另一個水分子靠近 O⁺ 上的氫。'})];
}
function halogenationSpec(ex){
 const ring=ex.ring,X=ex.X||'Br',nodes1=[P('C1','C1',280,200),P('C2','C2',420,200),P('PI','C1=C2 π 鍵',350,200,'bond'),P('Ba',X,350,110,'atom',X),P('lpBa',X+' 的孤對電子',398,128,'lonepair'),P('Bb',X,350,30,'atom',X),P('BB',`${X}–${X} 鍵`,350,70,'bond')],bonds1=[['C1','C2','CC'],['Ba','Bb','BBb']];
 const nodes2=[P('C1','C1',280,180),P('C2','C2',420,180),P('Ba',X+'⁺',350,90,'atom',X),P('CBa2',`C2–${X}⁺ 鍵`,385,135,'bond'),P('Bb',X+'⁻',545,290,'atom',X),P('lpBb',X+'⁻ 的孤對電子',512,262,'lonepair')],bonds2=[['C1','C2','CC'],['C1','Ba','CBa1'],['C2','Ba','CBa2b']];
 if(ring)for(const [nodes,bonds,y] of [[nodes1,bonds1,0],[nodes2,bonds2,-20]]){nodes.push(P('R3','C',470,290+y),P('R4','C',350,325+y),P('R5','C',230,290+y));bonds.push(['C2','R3','R23'],['R3','R4','R34'],['R4','R5','R45'],['R5','C1','R51']);}
 return [make(`形成${X==='Br'?'溴':'氯'}鎓離子`,nodes1,bonds1,[A('PI','Ba',`π 鍵電子對指向靠近的 ${X}，形成 C1–${X} 鍵。`,`追蹤 π 鍵電子：目標是靠近的 ${X}。`),A('BB','Bb',`${X}–${X} 鍵電子移向遠端的 ${X}，生成 ${X}⁻。`,`追蹤 ${X}–${X} 鍵電子：移向遠端 ${X}。`),A('lpBa','C2',`靠近的 ${X} 同時用孤對電子與 C2 成鍵，形成三元環的鹵鎓離子；沒有自由旋轉的碳陽離子。`,`追蹤 ${X} 的孤對電子：目標是 C2。`)],`三元環鹵鎓離子 + ${X}⁻`,'三組電子在同一步移動，形成橋接的鹵鎓離子。此為常見教學畫法（教學補充）；原文以鹵鎓離子中間體解釋反式加成。',{wrong:{PI:`π 鍵電子應指向靠近的 ${X}（Ba）。`,BB:`斷裂的 ${X}–${X} 鍵電子應移向遠端的 ${X}。`,lpBa:`靠近的 ${X} 的孤對電子應指向另一個雙鍵碳 C2，形成三元環。`},approach:`${X}₂ 從雙鍵平面的上方靠近 π 電子雲。`}),
  make(`${X}⁻ 從背面打開三元環`,nodes2,bonds2,[A('lpBb','C2',`${X}⁻ 從鹵鎓離子的另一面（背面）進攻 C2；第一個 ${X} 擋住了上方。`,`追蹤 ${X}⁻ 的孤對電子：從背面指向 C2。`),A('CBa2','Ba',`C2–${X}⁺ 鍵電子回到橋接的 ${X}，三元環打開，${X} 變回中性。`,`追蹤 C2–${X}⁺ 鍵電子：回到橋接的 ${X}。`)],ex.product,`兩個 ${X} 來自雙鍵的相反兩面，得到反式（anti）加成產物。`,{wrong:{lpBb:`${X}⁻ 的孤對電子應指向 C2（從橋接 ${X} 的背面）。`,CBa2:`斷裂的 C2–${X}⁺ 鍵電子應回到橋接的 ${X}。`},approach:`${X}⁻ 從三元環的背面靠近 C2。`,motionFocus:''})];
}
function rearrangementSpec(ex){
 const X=ex.X||'Cl',sh=ex.shift,shLabel=sh==='H'?'H':'Me',bondLabel=sh==='H'?'C3–H 鍵':'C3–CH₃ 鍵';
 const n1=[P('C1','C1',200,190),P('C2','C2',320,190),P('C3','C3',440,190),P('G1','Me',510,115),P('G2','Me',510,265),P('Sh',shLabel,440,300,'atom',el(shLabel)),P('PI','C1=C2 π 鍵',260,190,'bond'),P('H','H',180,85,'atom','H'),P('X',X,55,55,'atom',X),P('HX',`H–${X} 鍵`,118,70,'bond')];
 const b=[['C2','C3','C23'],['C3','G1','C3G1'],['C3','G2','C3G2']];
 const n2=[P('C1','C1',200,190),P('C2','C2⁺',320,190),P('C3','C3',440,190),P('G1','Me',520,120),P('G2','Me',520,260),P('Sh',shLabel,380,85,'atom',el(shLabel)),P('C3Sh',bondLabel,412,137,'bond')];
 const n3=[P('C1','C1',200,190),P('C2','C2',320,190),P('C3','C3⁺',440,190),P('G1','Me',520,120),P('G2','Me',520,260),P('Sh',shLabel,320,85,'atom',el(shLabel)),P('X',X+'⁻',440,55,'atom',X),P('lpX',X+'⁻ 的孤對電子',440,92,'lonepair')];
 return [make('π 鍵接受質子（先得二級碳陽離子）',n1,[['C1','C2','CC'],...b,['C3','Sh','C3Shb'],['H','X','HXb']],[A('PI','H','π 鍵電子指向 H–X 的氫，H 加到末端 C1，C2 成為二級碳陽離子。','追蹤 π 鍵電子：目標是酸的 H。'),A('HX','X',`H–${X} 鍵電子回到 ${X}，生成 ${X}⁻。`,`追蹤 H–${X} 鍵電子：回到 ${X}。`)],'二級碳陽離子（C2⁺） + '+X+'⁻','第一步與一般 HX 加成相同，先得到二級碳陽離子。',{wrong:{PI:'π 鍵電子應指向酸上的氫。',HX:`H–${X} 鍵電子應回到 ${X}。`},approach:`H${X} 靠近 π 鍵上方。`}),
  make(sh==='H'?'1,2-氫位移':'1,2-甲基位移',n2,[['C1','C2','CC'],...b,['C3','Sh','C3Shb']],[A('C3Sh','C2',`${bondLabel}的電子對連同${sh==='H'?'氫':'甲基'}一起移到相鄰的 C2⁺；正電轉到 C3，成為較穩定的三級碳陽離子。`,`追蹤${bondLabel}電子：連同${sh==='H'?'氫':'甲基'}移向 C2⁺。`)],'三級碳陽離子（C3⁺）',`${sh==='H'?'氫':'甲基'}帶著鍵電子對移到相鄰的帶正電碳。重排讓較不穩定的二級碳陽離子變成較穩定的三級碳陽離子。`,{wrong:{C3Sh:`${bondLabel}的電子應連同${sh==='H'?'氫':'甲基'}指向相鄰的 C2⁺。`},motionFocus:`看${sh==='H'?'氫':'甲基'}帶著鍵電子移到 C2；正電轉到 C3。`}),
  make(`${X}⁻ 接住三級碳陽離子`,n3,[['C1','C2','CC'],...b,['C2','Sh','C2Shb']],[A('lpX','C3',`${X}⁻ 的孤對電子與重排後的 C3⁺ 成鍵，得到重排產物。`,`追蹤 ${X}⁻ 的孤對電子：目標是 C3⁺。`)],ex.product,'鹵離子接住重排後的碳陽離子。實際上未重排的 C2⁺ 也會被捕捉，原文指出兩種產物都會生成。',{wrong:{lpX:`${X}⁻ 的孤對電子應指向重排後帶正電的 C3。`},approach:`${X}⁻ 靠近 C3⁺。`,motionFocus:`看 ${X}⁻ 與 C3⁺ 成鍵。`})];
}
function dehydrationSpec(ex){
 const cb=ex.cb||[];
 const n1=[P('CA','Cα',330,200),P('O','O',330,110,'atom','O'),P('lpO','O 的孤對電子',378,100,'lonepair'),P('Ho','H',270,70,'atom','H'),P('Hp','H',470,70,'atom','H'),P('Oa','O（H₃O⁺）',580,60,'atom','O'),P('HO','O–H 鍵',525,65,'bond'),P('G1','Me',230,250),P('G2','Me',330,300),P('CB','Cβ',440,250)];
 const b1=[['CA','O','COb'],['O','Ho','OHo'],['Hp','Oa','HpOa'],['CA','G1','CG1'],['CA','G2','CG2'],['CA','CB','CC']];
 const n2=[P('CA','Cα',330,200),P('O','O⁺',330,95,'atom','O'),P('Ho','H',270,60,'atom','H'),P('Hp','H',390,60,'atom','H'),P('CO','Cα–O 鍵',330,148,'bond'),P('G1','Me',230,250),P('G2','Me',330,300),P('CB','Cβ',440,250)];
 const n3=[P('CA','Cα⁺',300,190),P('CB','Cβ',430,190),P('HB','Hβ',430,85,'atom','H'),P('CH','Cβ–H 鍵',430,137,'bond'),P('CC','Cα–Cβ 鍵',365,190,'bond'),P('Ob','O（H₂O）',565,60,'atom','O'),P('lpOb','水 O 的孤對電子',528,78,'lonepair'),P('G1','Me',230,110),P('G2','Me',230,270)];
 const b3=[['CA','CB','CCb'],['CB','HB','CHb'],['CA','G1','CG1'],['CA','G2','CG2']];
 if(cb.length){n3.push(P('M4',cb[0],505,270));b3.push(['CB','M4','CBM4']);}
 return [make('OH 接受質子',n1,b1,[A('lpO','Hp','醇的氧用孤對電子接受酸的質子，–OH 變成 –OH₂⁺；這讓脫離基變成中性水。','追蹤氧的孤對電子：接受酸的 H。'),A('HO','Oa','H₃O⁺ 的 O–H 鍵電子回到氧，留下水。','追蹤 O–H 鍵電子：回到酸的氧。')],'R–OH₂⁺ + H₂O','OH⁻ 是差的脫離基，必須先質子化。',{wrong:{lpO:'醇氧的孤對電子應指向酸上的氫。',HO:'H₃O⁺ 斷裂的 O–H 鍵電子應回到氧。'},approach:'H₃O⁺ 靠近醇氧的孤對電子。'}),
  make('水離去，形成碳陽離子',n2,[['CA','O','COb'],['O','Ho','OHo'],['O','Hp','OHp'],['CA','G1','CG1'],['CA','G2','CG2'],['CA','CB','CC']],[A('CO','O','Cα–O 鍵電子回到氧，中性水離開，Cα 成為平面碳陽離子。','追蹤 Cα–O 鍵電子：回到氧，水離開。')],'碳陽離子 + H₂O','與 E1、SN1 的離解步驟相同；三級醇最容易。',{wrong:{CO:'Cα–O 鍵電子應回到氧，讓水帶走電子離開。'},motionFocus:'看 Cα–O 鍵斷裂，水帶著電子離開，Cα 變平面。'}),
  make('水接受 β-H，形成雙鍵',n3,b3,[A('lpOb','HB','水分子用孤對電子接受與碳陽離子相鄰的 β-H。','追蹤水的孤對電子：目標是 β-H。'),A('CH','CC','Cβ–H 鍵電子移到 Cα–Cβ 之間，形成新的 π 鍵。','追蹤 Cβ–H 鍵電子：形成 Cα=Cβ π 鍵。')],ex.product,'失去 β-H 形成烯；有多個 β 位時通常得到取代較多的烯（Zaitsev）。',{wrong:{lpOb:'水的孤對電子應指向 β-H。',CH:'Cβ–H 鍵電子應移到 Cα–Cβ 之間形成 π 鍵。'},approach:'水分子靠近與 Cα⁺ 相鄰的 β-H。'})];
}

export function typeSpec(kind,example=null){
 const ex={...DEFAULTS[kind],...(example||{})},builders={addhx:addhxSpec,hydration:hydrationSpec,halogenation:halogenationSpec,rearrangement:rearrangementSpec,dehydration:dehydrationSpec};
 if(!builders[kind])throw new Error('不支援的機構');
 const steps=builders[kind](ex);for(const step of steps)step.afterLabels={};
 return {kind,label:KIND_LABELS[kind],steps,...(example?{example}:{})};
}

// ---------- 3D step states ----------
const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),mul=(a,k)=>a.map(x=>x*k),unit=a=>{const d=Math.hypot(...a);return d?a.map(x=>x/d):[0,0,0];};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const at=(c,dir,len)=>add(c,mul(unit(dir),len));
const atom=(id,el,p,q=0,tag=null,reactive=false)=>({id,el,p,q,tag,reactive});
const len={C:1.52,H:1.09,O:1.43,Br:1.94,Cl:1.78};
const group=(id,label,p)=>label==='H'?null:atom(id,'C',p);
function state(atoms,bonds){return {atoms:atoms.filter(Boolean),bonds:bonds.filter(b=>b&&atoms.some(a=>a?.id===b[0])&&atoms.some(a=>a?.id===b[1]))};}
function clone(s){return structuredClone(s);}
function moveAtoms(s,ids,delta){for(const a of s.atoms)if(ids.includes(a.id))a.p=add(a.p,delta);}
function setAtom(s,id,patch){const a=s.atoms.find(a=>a.id===id);if(a)Object.assign(a,patch);}
// Positions three bonds of an sp3 centre whose fourth bond points along `up`.
const pyr=(c,radial,up,l)=>add(c,mul(add(mul(unit(radial),.9428),mul(unit(up),-1/3)),l));
const water=(id,o,away,q=0,tag=null)=>{const a=unit(away),side=unit(cross(a,Math.abs(a[2])<.9?[0,0,1]:[0,1,0]));return [atom(id,'O',o,q,tag,true),atom(id+'h1','H',add(o,mul(add(mul(a,.55),mul(side,.8)),.97))),atom(id+'h2','H',add(o,mul(add(mul(a,.55),mul(side,-.8)),.97)))];};
const waterBonds=id=>[[id,id+'h1',1],[id,id+'h2',1]];
const hydronium=(o,h,q=1)=>{const a=unit(sub(o,h)),side=unit(cross(a,[0,1,0]));return [atom('Oa','O',o,q,'O{q}',true),atom('Ha1','H',add(o,mul(add(mul(a,.4),mul(side,.9)),.97))),atom('Ha2','H',add(o,mul(add(mul(a,.4),mul(side,-.9)),.97)))];};

function alkeneBase(ex){
 // C2 at origin, C1 on -x; the alkene plane is xy so π lobes point along z.
 const g=ex.c2||['Me','Me'],c1=[-1.34,0,0],atoms=[atom('C1','C',c1,0,'C1',true),atom('C2','C',[0,0,0],0,'C2',true),group('G1',g[0],at([0,0,0],[.5,.866,0],1.5)),group('G2',g[1],at([0,0,0],[.5,-.866,0],1.5))];
 if(ex.c1?.length)atoms.push(atom('M1','C',at(c1,[-.5,.866,0],1.5)));
 return state(atoms,[['C1','C2',2,'PI'],['C2','G1',1],['C2','G2',1],['C1','M1',1]]);
}
function protonated(base){
 // After protonation C1 is sp3 (new H up) and C2⁺ stays planar.
 const s=clone(base);s.atoms.push(atom('H','H',at([-1.34,0,0],[-.33,0,.94],1.09),0,'H',true));s.bonds=s.bonds.map(b=>b[3]==='PI'?['C1','C2',1,'PI']:b);s.bonds.push(['C1','H',1]);
 setAtom(s,'M1',{p:at([-1.34,0,0],[-.5,.75,-.43],1.52)});setAtom(s,'C2',{q:1});return s;
}
function pyramidalize(s,center,ids,up,dependents={}){
 // Bends planar neighbours away from a new bond along `up`, carrying their substituents.
 const c=s.atoms.find(a=>a.id===center).p;
 for(const id of ids){const a=s.atoms.find(a=>a.id===id);if(!a)continue;const radial=sub(a.p,c),flat=sub(radial,mul(unit(up),radial.reduce((t,x,i)=>t+x*unit(up)[i],0))),p=pyr(c,flat,up,len[a.el]||1.52),delta=sub(p,a.p);a.p=p;moveAtoms(s,dependents[id]||[],delta);}
}
function hxProtonationStep(ex){
 const base=alkeneBase(ex),X=ex.X||'Br',start=state([...base.atoms,atom('H','H',[-1.34,0,2.2],0,'H',true),atom('X',X,[-1.34,0,2.2+(X==='Cl'?1.27:1.41)],0,X+'{q}',true)],[...base.bonds,['H','X',1,'HX']]);
 const end=protonated(state(base.atoms,base.bonds));end.atoms.push(atom('X',X,[-1.34,0,4.4],-1,X+'{q}',true));
 return {start,end,actor:['H','X'],approach:[0,0,1.8]};
}
function hxCaptureStep(ex){
 const X=ex.X||'Br',p=protonated(alkeneBase(ex)),start=state([...p.atoms,atom('X',X,[0,0,3.2],-1,X+'{q}',true)],p.bonds),end=clone(start);
 pyramidalize(end,'C2',['C1','G1','G2'],[0,0,1],{C1:['H','M1']});setAtom(end,'X',{p:[0,0,len[X]],q:0});setAtom(end,'C2',{q:0});end.bonds.push(['C2','X',1,'newCX']);
 return {start,end,actor:['X'],approach:[0,0,1.5]};
}
function hydroniumStep(ex){
 const base=alkeneBase(ex),h=[-1.34,0,2.2],o=[-1.34,0,3.18],start=state([...base.atoms,atom('H','H',h,0,'H',true),...hydronium(o,h)],[...base.bonds,['H','Oa',1,'OH'],['Oa','Ha1',1],['Oa','Ha2',1]]);
 const end=protonated(state(base.atoms,base.bonds));end.atoms.push(...hydronium([-1.34,0,4.3],[-1.34,0,3.3],0));end.bonds.push(['Oa','Ha1',1],['Oa','Ha2',1]);
 return {start,end,actor:['H','Oa','Ha1','Ha2'],approach:[0,0,1.8]};
}
function waterCaptureStep(ex){
 const p=protonated(alkeneBase(ex));p.atoms=p.atoms.filter(a=>a.id!=='H');p.bonds=p.bonds.filter(b=>b[1]!=='H');
 const start=state([...p.atoms,...water('Ow',[0,0,3.0],[0,0,1],0,'O{q} 親核')],[...p.bonds,...waterBonds('Ow')]),end=clone(start);
 pyramidalize(end,'C2',['C1','G1','G2'],[0,0,1],{C1:['M1']});moveAtoms(end,['Ow','Owh1','Owh2'],[0,0,-1.57]);setAtom(end,'Ow',{q:1});setAtom(end,'C2',{q:0});end.bonds.push(['C2','Ow',1,'newCO']);
 return {start,end,actor:['Ow','Owh1','Owh2'],approach:[0,0,1.5]};
}
function hydrationStep3(ex){
 // Water removes a proton from R–OH₂⁺; the acid catalyst is regenerated.
 const g=ex.c2,up=[0,0,1],c1=pyr([0,0,0],[-1,0,0],up,1.52),o=[0,0,1.43],hd=at(o,[.94,0,.33],.97),hk=at(o,[-.94,0,.33],.97),ob=add(hd,[1.55,0,.55]);
 const start=state([atom('C2','C',[0,0,0],0,'C2',true),atom('C1','C',c1,0,'C1'),group('G1',g[0],pyr([0,0,0],[.5,.866,0],up,1.52)),group('G2',g[1],pyr([0,0,0],[.5,-.866,0],up,1.52)),ex.c1?.length?atom('M1','C',at(c1,[-.5,.75,-.43],1.52)):null,atom('O','O',o,1,'O{q}',true),atom('Hd','H',hd,0,'H',true),atom('Hk','H',hk),...water('Ob',ob,[1,0,.3],0,'O{q} 鹼')],[['C2','C1',1],['C2','G1',1],['C2','G2',1],['C1','M1',1],['C2','O',1],['O','Hd',1,'OHd'],['O','Hk',1],...waterBonds('Ob')]);
 const end=clone(start);setAtom(end,'Hd',{p:at(ob,sub(hd,ob),.97)});setAtom(end,'O',{q:0});setAtom(end,'Ob',{q:1});end.bonds=end.bonds.filter(b=>b[3]!=='OHd');end.bonds.push(['Ob','Hd',1,'formOH']);
 return {start,end,actor:['Ob','Obh1','Obh2'],approach:[1.3,0,.4]};
}
function halogenSteps(ex){
 const X=ex.X||'Br',xx=X==='Cl'?1.99:2.28,ring=ex.ring;
 const carbons=[atom('C1','C',[-.67,0,0],0,'C1',true),atom('C2','C',[.67,0,0],0,'C2',true)],ringAtoms=ring?[atom('R3','C',[1.1,1.38,0]),atom('R4','C',[0,2.2,0]),atom('R5','C',[-1.1,1.38,0])]:[],ringBonds=ring?[['C2','R3',1],['R3','R4',1],['R4','R5',1],['R5','C1',1]]:[];
 const s1=state([...carbons,...ringAtoms,atom('Ba',X,[0,0,2.35],0,X+'{q}',true),atom('Bb',X,[0,0,2.35+xx],0,X+'{q}',true)],[['C1','C2',2,'PI'],...ringBonds,['Ba','Bb',1,'BB']]);
 const e1=clone(s1);setAtom(e1,'Ba',{p:[0,0,1.75],q:1});setAtom(e1,'Bb',{p:[0,0,4.9],q:-1});e1.bonds=e1.bonds.map(b=>b[3]==='PI'?['C1','C2',1,'PI']:b).filter(b=>b[3]!=='BB');e1.bonds.push(['C1','Ba',1,'CBa1'],['C2','Ba',1,'CBa2']);
 const s2=clone(e1);s2.bonds=s2.bonds.filter(b=>b[3]!=='BB');setAtom(s2,'Bb',{p:[2.0,0,-2.5]});
 const e2=clone(s2);setAtom(e2,'Bb',{p:at([.67,0,0],[.45,0,-.9],len[X]),q:0});setAtom(e2,'Ba',{p:at([-.67,0,0],[-.45,0,.9],len[X]),q:0});e2.bonds=e2.bonds.filter(b=>b[3]!=='CBa2');e2.bonds.push(['C2','Bb',1,'newCX']);
 return [{start:s1,end:e1,actor:['Ba','Bb'],approach:[0,0,1.6]},{start:s2,end:e2,actor:['Bb'],approach:[.8,0,-1.4]}];
}
function rearrangementSteps(ex){
 const X=ex.X||'Cl',sh=ex.shift,c3=at([0,0,0],[.5,.866,0],1.52),d0=unit(sub([0,0,0],c3)),side=unit(cross(d0,[0,0,1])),shDir=add(mul(d0,-1/3),[0,0,.9428]),gDir=s=>add(mul(d0,-1/3),add(mul([0,0,1],-.4714),mul(side,s*.8165)));
 const shStart=at(c3,shDir,len[sh==='H'?'H':'C']),chain=[atom('C2','C',[0,0,0],0,'C2',true),atom('C3','C',c3,0,'C3',true),atom('G1','C',at(c3,gDir(1),1.52)),atom('G2','C',at(c3,gDir(-1),1.52)),atom('Sh',sh==='H'?'H':'C',shStart,0,sh==='H'?'H 位移':'CH₃ 位移',true)];
 const chainBonds=[['C2','C3',1],['C3','G1',1],['C3','G2',1],['C3','Sh',1,'C3Sh']];
 const s1=state([atom('C1','C',[-1.34,0,0],0,'C1',true),...chain,atom('H','H',[-1.34,0,2.2],0,'H',true),atom('X',X,[-1.34,0,2.2+(X==='Cl'?1.27:1.41)],0,X+'{q}',true)],[['C1','C2',2,'PI'],...chainBonds,['H','X',1,'HX']]);
 const e1=clone(s1);e1.bonds=e1.bonds.map(b=>b[3]==='PI'?['C1','C2',1,'PI']:b).filter(b=>b[3]!=='HX');e1.bonds.push(['C1','H',1]);setAtom(e1,'H',{p:at([-1.34,0,0],[-.33,0,.94],1.09)});setAtom(e1,'X',{p:[-1.34,0,4.4],q:-1});setAtom(e1,'C2',{q:1});
 const s2=state([atom('C1','C',[-1.34,0,0],0,'C1'),...clone(chain)],[['C1','C2',1],...chainBonds]);setAtom(s2,'C2',{q:1});
 const e2=clone(s2),rot=(v,deg)=>{const r=deg*Math.PI/180;return [v[0]*Math.cos(r)-v[1]*Math.sin(r),v[0]*Math.sin(r)+v[1]*Math.cos(r),0];};
 setAtom(e2,'Sh',{p:at([0,0,0],[.2,.25,.95],len[sh==='H'?'H':'C'])});setAtom(e2,'G1',{p:at(c3,rot(d0,120),1.5)});setAtom(e2,'G2',{p:at(c3,rot(d0,-120),1.5)});setAtom(e2,'C2',{q:0});setAtom(e2,'C3',{q:1});setAtom(e2,'C1',{p:pyr([0,0,0],[-1,0,0],[0,0,1],1.52)});e2.bonds=e2.bonds.filter(b=>b[3]!=='C3Sh');e2.bonds.push(['C2','Sh',1,'newCSh']);
 const s3=clone(e2);s3.atoms.push(atom('X',X,add(c3,[0,0,3.2]),-1,X+'{q}',true));
 const e3=clone(s3);pyramidalize(e3,'C3',['C2','G1','G2'],[0,0,1],{C2:['C1','Sh']});setAtom(e3,'X',{p:add(c3,[0,0,len[X]]),q:0});setAtom(e3,'C3',{q:0});e3.bonds.push(['C3','X',1,'newCX']);
 return [{start:s1,end:e1,actor:['H','X'],approach:[0,0,1.8]},{start:s2,end:e2,actor:[],approach:[0,0,0]},{start:s3,end:e3,actor:['X'],approach:[0,0,1.5]}];
}
function dehydrationSteps(ex){
 const up=[0,0,1],o=[0,0,1.43],ca=[0,0,0],cbStart=pyr(ca,[1,0,0],up,1.52),groups=[atom('G1','C',pyr(ca,[-.5,.866,0],up,1.52)),atom('G2','C',pyr(ca,[-.5,-.866,0],up,1.52))];
 const hb=at(cbStart,[.2,-.6,-.77],1.09),cbMe=ex.cb?.length?atom('M4','C',at(cbStart,[.55,.75,-.37],1.52)):null;
 const core=[atom('CA','C',ca,0,'Cα',true),...groups,atom('CB','C',cbStart,0,'Cβ',true),atom('HB','H',hb),cbMe].filter(Boolean),coreBonds=[['CA','G1',1],['CA','G2',1],['CA','CB',1,'CC'],['CB','HB',1,'CH'],['CB','M4',1]];
 const ho=at(o,[-.94,0,.33],.97),hp=[1.2,0,2.25];
 const s1=state([...core,atom('O','O',o,0,'O{q}',true),atom('Ho','H',ho),atom('Hp','H',hp,0,'H',true),...hydronium(add(hp,[.75,0,.62]),hp)],[...coreBonds,['CA','O',1,'CO'],['O','Ho',1],['Hp','Oa',1,'HO'],['Oa','Ha1',1],['Oa','Ha2',1]]);
 const e1=clone(s1);setAtom(e1,'Hp',{p:at(o,[.94,0,.33],.97)});setAtom(e1,'O',{q:1});moveAtoms(e1,['Oa','Ha1','Ha2'],[.9,0,.8]);setAtom(e1,'Oa',{q:0});e1.bonds=e1.bonds.filter(b=>b[3]!=='HO');e1.bonds.push(['O','Hp',1,'OHp']);
 const s2=state([...clone(core),atom('O','O',o,1,'O{q}',true),atom('Ho','H',ho),atom('Hp','H',at(o,[.94,0,.33],.97))],[...coreBonds,['CA','O',1,'CO'],['O','Ho',1],['O','Hp',1]]);
 const e2=clone(s2);e2.bonds=e2.bonds.filter(b=>b[3]!=='CO');moveAtoms(e2,['O','Ho','Hp'],[0,0,1.7]);setAtom(e2,'O',{q:0});setAtom(e2,'CA',{q:1});
 for(const [id,dir] of [['G1',[-.5,.866,0]],['G2',[-.5,-.866,0]],['CB',[1,0,0]]]){const a=e2.atoms.find(a=>a.id===id),p=at(ca,dir,1.5),delta=sub(p,a.p);a.p=p;if(id==='CB')moveAtoms(e2,['HB','M4'],delta);}
 const cb=[1.5,0,0],hb3=at(cb,[.333,0,.943],1.09),me3=cbMe?atom('M4','C',at(cb,[.333,.816,-.471],1.52)):null,ob=add(hb3,[.35,0,1.55]);
 const s3=state([atom('CA','C',ca,1,'Cα',true),atom('G1','C',at(ca,[-.5,.866,0],1.5)),atom('G2','C',at(ca,[-.5,-.866,0],1.5)),atom('CB','C',cb,0,'Cβ',true),atom('HB','H',hb3,0,'β-H',true),me3,...water('Ob',ob,[0,0,1],0,'O{q} 鹼')].filter(Boolean),[['CA','G1',1],['CA','G2',1],['CA','CB',1,'CC'],['CB','HB',1,'CH'],['CB','M4',1],...waterBonds('Ob')]);
 const e3=clone(s3);setAtom(e3,'HB',{p:at(ob,sub(hb3,ob),.97)});setAtom(e3,'CA',{q:0});setAtom(e3,'Ob',{q:1});if(me3)setAtom(e3,'M4',{p:at(cb,[.5,.866,0],1.5)});e3.bonds=e3.bonds.map(b=>b[3]==='CC'?['CA','CB',2,'CC']:b).filter(b=>b[3]!=='CH');e3.bonds.push(['Ob','HB',1,'formOH']);
 return [{start:s1,end:e1,actor:['Hp','Oa','Ha1','Ha2'],approach:[1.2,0,.7]},{start:s2,end:e2,actor:[],approach:[0,0,0]},{start:s3,end:e3,actor:['Ob','Obh1','Obh2'],approach:[.4,0,1.4]}];
}

export function typeSteps3D(kind,example=null){
 const ex={...DEFAULTS[kind],...(example||{})};
 if(kind==='addhx')return [hxProtonationStep(ex),hxCaptureStep(ex)];
 if(kind==='hydration')return [hydroniumStep(ex),waterCaptureStep(ex),hydrationStep3(ex)];
 if(kind==='halogenation')return halogenSteps(ex);
 if(kind==='rearrangement')return rearrangementSteps(ex);
 if(kind==='dehydration')return dehydrationSteps(ex);
 throw new Error('不支援的三維機構');
}

const order=(bonds,a,b)=>bonds.find(x=>x[0]===a&&x[1]===b||x[0]===b&&x[1]===a)?.[2]||0;
function implicitHydrogens(s){
 // Returns {carbonId:[unit directions]} so start/end use the same hydrogen ids.
 const out={},pos=new Map(s.atoms.map(a=>[a.id,a.p]));
 for(const a of s.atoms.filter(a=>a.el==='C')){
  const links=s.bonds.filter(b=>b[0]===a.id||b[1]===a.id),valence=links.reduce((t,b)=>t+b[2],0),trig=a.q===1||links.some(b=>b[2]===2),count=(a.q===1?3:4)-valence;
  if(count<0)throw new Error('三維價數超過上限：'+a.id);
  const others=links.map(b=>b[0]===a.id?b[1]:b[0]),n=others.map(id=>unit(sub(pos.get(id),a.p))),sum=unit(mul(n.reduce((t,x)=>add(t,x),[0,0,0]),-1));let dirs=[];
  if(count===0)dirs=[];
  else if(trig&&count===2){const partner=others[0],m=s.bonds.filter(b=>(b[0]===partner||b[1]===partner)&&b[0]!==a.id&&b[1]!==a.id).map(b=>b[0]===partner?b[1]:b[0])[0];let normal=m?unit(cross(n[0],sub(pos.get(m),pos.get(partner)))):[0,0,1];if(Math.hypot(...normal)<.1)normal=[0,0,1];const perp=unit(cross(normal,n[0]));dirs=[1,-1].map(k=>add(mul(n[0],-.5),mul(perp,.866*k)));}
  else if(count===1)dirs=[Math.hypot(...sum)>.1?sum:[0,0,1]];
  else if(count===2&&n.length===2){const normal=unit(cross(n[0],n[1]));dirs=[add(mul(sum,.577),mul(normal,.816)),sub(mul(sum,.577),mul(normal,.816))];}
  else if(count===3&&n.length===1){const u=unit(n[0]),v=unit(cross(u,Math.abs(u[2])<.8?[0,0,1]:[0,1,0])),w=cross(u,v);dirs=[0,1,2].map(i=>{const phi=i*2*Math.PI/3+.5;return add(mul(u,-1/3),mul(add(mul(v,Math.cos(phi)),mul(w,Math.sin(phi))),.9428));});}
  else throw new Error('無法補齊三維氫：'+a.id);
  out[a.id]=dirs;
 }
 return out;
}
const ease=t=>{t=Math.max(0,Math.min(1,Number(t)||0));return t*t*(3-2*t);};
const mixv=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t);

/** Generic interpolating scene with the same shape as reactionScene3D. */
export function typeScene3D(kind,index,mode,progress,spec){
 const step=typeSteps3D(kind,spec?.example)[index],specStep=spec.steps[index];if(!step||!specStep)throw new RangeError('反應步驟不存在');
 const changing=['together','transform','product'].includes(mode),u=mode==='product'?1:changing?ease(progress):0,approach=mode==='overview'?0:mode==='approach'?ease(progress):1;
 const {start,end}=step,endMap=new Map(end.atoms.map(a=>[a.id,a]));
 if(start.atoms.length!==end.atoms.length||start.atoms.some(a=>!endMap.has(a.id)))throw new Error('三維步驟原子不守恆：'+kind+index);
 const hs=implicitHydrogens(start),he=implicitHydrogens(end),atoms=[],bonds=[],reagent=new Set(step.actor);
 // States are authored with the reaction axis on z; the player's camera shows y as screen-up.
 const view=v=>[v[0],v[2],-v[1]];
 for(const a of start.atoms){const b=endMap.get(a.id);atoms.push({id:a.id,element:a.el,p0:view(a.p),p1:view(b.p),charge:u>.5?b.q:a.q,reactive:a.reactive||b.reactive,tag:b.tag||a.tag});}
 for(const [id,dirs] of Object.entries(hs)){if((he[id]||[]).length!==dirs.length)throw new Error('三維氫數不一致：'+id);const c0=start.atoms.find(a=>a.id===id).p,c1=endMap.get(id).p;dirs.forEach((d,i)=>{const hid=id+'-H'+i;atoms.push({id:hid,element:'H',p0:view(add(c0,mul(d,1.09))),p1:view(add(c1,mul(he[id][i],1.09))),charge:0,spectator:true});if(reagent.has(id))reagent.add(hid);});}
 const keys=new Map();for(const [s,which] of [[start,'s'],[end,'e']])for(const b of s.bonds){const k=[b[0],b[1]].sort().join('|'),e=keys.get(k)||{a:b[0],b:b[1],id:b[3]||k,s:0,e:0};e[which]=b[2];if(b[3])e.id=b[3];keys.set(k,e);}
 for(const e of keys.values()){
  if(e.s&&e.e)bonds.push({a:e.a,b:e.b,id:e.id,order:e.s===e.e?e.s:u>=1?e.e:u<=0?e.s:Math.max(e.s,e.e),opacity:1,...(e.s!==e.e?{piOpacity:e.e>e.s?u:1-u}:{})});
  else if(e.s)bonds.push({a:e.a,b:e.b,id:e.id,order:e.s,opacity:1-u,changing:true});
  else bonds.push({a:e.a,b:e.b,id:e.id,order:e.e,opacity:u,changing:u<1,forming:true});
 }
 for(const h of atoms.filter(a=>a.spectator))bonds.push({a:h.id.split('-H')[0],b:h.id,id:h.id+'-bond',order:1,opacity:1});
 const displacement=view(step.approach||[0,0,0]);
 for(const a of atoms){a.p=mixv(a.p0,a.p1,u);if(reagent.has(a.id))a.p=add(a.p,mul(displacement,1-approach));const q=a.charge>0?'⁺':a.charge<0?'⁻':'';a.label=a.tag?a.tag.includes('{q}')?a.tag.replace('{q}',q):a.tag+q:a.element+q;}
 const nodes=new Map(atoms.map(a=>[a.id,a])),anchors=new Map(atoms.map(a=>[a.id,a.p]));
 for(const b of bonds){const p=mixv(nodes.get(b.a).p,nodes.get(b.b).p,.5);anchors.set(b.id,b.id==='PI'?add(p,view([0,0,.35])):p);}
 for(const r of specStep.required)if(r.from.startsWith('lp')){const owner=nodes.get(r.from.slice(2)),target=anchors.get(r.to);if(owner&&target)anchors.set(r.from,add(owner.p,mul(unit(sub(target,owner.p)),.42)));}
 const bounds=atoms.flatMap(a=>[a.p0,a.p1,reagent.has(a.id)?add(a.p0,displacement):a.p0].map(p=>({p,spectator:!!a.spectator})));
 return {atoms,bonds:bonds.filter(b=>b.opacity>0),anchors,bounds,progress:u,kind,step:index};
}
