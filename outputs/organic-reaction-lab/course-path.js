// Course structure in textbook order: prerequisites (ch. 1–6) → alkene additions (ch. 7–8) → substitution and elimination (ch. 11) → alcohol dehydration (ch. 17).
// Text marked 教學補充 is the author's bridging explanation; everything else follows the cited textbook pages.

export const TYPES={
 sn2:{label:'SN2',name:'雙分子親核取代（一步）'},
 sn1:{label:'SN1',name:'單分子親核取代（經碳陽離子）'},
 e2:{label:'E2',name:'雙分子消去（一步）'},
 e1:{label:'E1',name:'單分子消去（經碳陽離子）'},
 addhx:{label:'HX 加成',name:'烯的 HX 親電加成（碳陽離子）'},
 hydration:{label:'酸催化加水',name:'烯的酸催化加水（碳陽離子）'},
 halogenation:{label:'X₂ 加成',name:'烯的鹵素加成（鹵鎓離子，反式）'},
 rearrangement:{label:'碳陽離子重排',name:'加成中的 1,2-氫／甲基位移'},
 dehydration:{label:'醇的脫水',name:'醇的酸催化脫水（E1）'}
};

// Card and concept text comes from cards-v2.js; this file arranges it into islands in textbook order.
import {CARDS_V2,CONCEPTS_V2} from './cards-v2.js';
const card=id=>{const c=CARDS_V2[id];if(!c)throw new Error(`missing card ${id}`);return c;};

// Three prerequisite islands (textbook chapters 1–6). Every card starts with a diagnosis; a learner who answers it is ready.
export const PREP=[
 {id:'w1',name:'結構與電子',chapters:'第 1–2 章',cards:['lewis','formal','polarity','hybrid','resonance','acidbase'].map(card)},
 {id:'w2',name:'命名與空間',chapters:'第 3–5 章',cards:['functional','naming','skeletal','degree','conformation','chair','chirality'].map(card)},
 {id:'w3',name:'反應語言',chapters:'第 6 章',cards:['reactions','nucleophile','arrows','energy'].map(card)}
];
export const WARMUP=PREP.flatMap(i=>i.cards);
// Cards whose first screen is a diagnosis: all prerequisite cards and the naming primers.
export const DIAGNOSED=new Set([...WARMUP.map(c=>c.id),'alkene-name','alcohol-name','halide-name']);
export const PATH_GOALS={
 prep:'還不用背反應：先確認讀得懂結構、名稱、空間與反應語言。會的直接過，不會的再讀卡。',
 final:'先自己完成整張「受質 × 試劑」判斷表，再在混在一起的題目中說出反應類型與依據，寫出產物並畫對箭頭。',
 assessment:'確認學過的判斷，遇到沒看過的受質也用得上。'
};
// Handbook groups: every prerequisite card, entry primer and product-detail card belongs to exactly one.
// uses: islands where the group is put to work (shown as "現在正在用" there).
export const COMPETENCIES=[
 {id:'structure',title:'結構與電子',hint:'路易士結構、電荷、極性、共振、酸鹼',ability:'畫出路易士結構，算形式電荷，判斷極性、共振與酸鹼強弱。',task:'完成「結構與電子」島的診斷。',cards:['lewis','formal','polarity','hybrid','resonance','acidbase'],uses:['w1','addhx','sn1','e2','dehydration']},
 {id:'naming',title:'命名與空間',hint:'官能基、命名、構形與立體',ability:'由名稱畫出結構，判斷級數、構形、椅式與 R/S。',task:'完成「命名與空間」島的診斷，以及各島入口的命名卡。',cards:['functional','naming','skeletal','degree','conformation','chair','chirality','alkene-name','alcohol-name','halide-name'],uses:['w2','addhx','hydration','sn2','sn1','e2']},
 {id:'language',title:'反應語言',hint:'反應類型、親核親電、箭頭、能量圖',ability:'說出誰提供電子、誰接受，畫彎箭頭並讀懂能量圖。',task:'完成「反應語言」島的診斷。',cards:['reactions','nucleophile','arrows','energy'],uses:['w3','addhx','rearr','halo','hydration','sn2','sn1','e2','e1','dehydration','final']},
 {id:'substrate',title:'看受質',hint:'碳陽離子、立體障礙',ability:'判斷碳陽離子穩不穩定、背面擋不擋得住。',task:'比較碳陽離子穩定性與 SN2 速率。',cards:['carbocation','sterics'],uses:['addhx','rearr','sn2','sn1','e1']},
 {id:'reagent',title:'看試劑與脫離基',hint:'強鹼、良好親核劑、脫離基',ability:'分清試劑是親核劑還是強鹼，判斷脫離基好不好。',task:'把 I⁻、EtO⁻、t-BuO⁻、H₂O 分類；排出脫離基能力。',cards:['leaving','basicity'],uses:['sn2','sn1','e2','e1','dehydration','final']},
 {id:'conditions',title:'看條件',hint:'溶劑、溫度、平衡',ability:'依溶劑、溫度與平衡判斷路徑。',task:'說出溶劑與加熱各偏向哪一種反應。',cards:['solvent','heat','equilibrium'],uses:['sn2','sn1','e1','dehydration','final']},
 {id:'product',title:'預測產物',hint:'組態反轉、anti、Zaitsev／Hofmann',ability:'預測組態反轉、anti 消去與主要的烯。',task:'寫出 SN2 的組態與 E2 的主要烯。',cards:['inversion','anti','zaitsev','chair-e2'],uses:['sn2','e2','e1','dehydration','final']}
];

// The short task that shows a station was understood (the map shows it next to the goal).
export const PATH_TASKS={
 prep:'每張卡先答一題診斷；答對就過，答錯讀卡後再換一題確認。',
 final:'判斷表 16 格全部填對；九種反應交錯出題：選出反應類型與依據、寫出產物、畫出箭頭。',
 assessment:'後測或延後測：不提示、不給正誤，遇到沒看過的受質也要能判斷。'
};
// Concepts to revisit when a mixed-practice item of this type, or an arrow check, goes wrong.
export const REVIEW_BY_TYPE={
 sn2:['sterics','nucleophile','solvent'],sn1:['carbocation','leaving','solvent'],e2:['basicity','anti','zaitsev'],e1:['carbocation','basicity','heat'],
 addhx:['nucleophile','carbocation'],hydration:['carbocation','acidbase'],halogenation:['nucleophile','polarity'],rearrangement:['carbocation','energy'],dehydration:['acidbase','leaving']
};
export const ARROW_REVIEW=['arrows','formal','acidbase'];

// Reaction islands in textbook order (chapters 7, 8, 11, 17). Concept text and product details come from cards-v2.js.
const concepts=id=>CONCEPTS_V2[id].map(c=>({...c,details:(c.details||[]).map(card)}));
const stage=(id,o)=>({id,...o,primers:(o.primers||[]).map(card),concepts:concepts(id)});
export const STAGES=[
 stage('addhx',{title:'烯的親電加成：HX 與馬可尼可夫規則',short:'HX 加成',chapter:'7.7–7.9',goal:'把 π 鍵當作電子來源，依碳陽離子穩定性判斷 X 接在哪個碳（馬可尼可夫規則）。',task:'比較兩個 HX 加成、補上「烯遇到 HX」分支、畫出 HX 加成的箭頭，完成 4 題混合練習。',needs:['nucleophile','arrows','energy'],
  primers:['alkene-name','carbocation'],newTypes:['addhx'],
  pairs:[{a:'addhx-isobutylene',b:'addhx-propene',diff:'都是烯＋HX：比較兩個烯先形成的碳陽離子是幾級，X 接在哪個碳'}],
  branches:[{node:'start',ids:['start-alkene'],prompt:'流程圖最上面先分「起始物是什麼」。烯要接到哪一條？',options:['起始物是烯（C=C）而沒有脫離基 → 看試劑是哪一種親電子劑：加成','烯也要先數受質級數再選 SN1／SN2','烯加 HBr 一定是 E2'],answer:0,feedback:'烯沒有脫離基，π 鍵當親核劑：這是加成的入口。'},{node:'electrophile',ids:['el-hx'],prompt:'烯遇到 HX 時，中間體與方向怎麼判斷？',options:['HX 的 H 先加上去形成碳陽離子，X 接在取代較多（碳陽離子較穩定）的碳','HX 一步加上去，沒有中間體','X 一定接在取代較少的碳'],answer:0,feedback:'先形成較穩定的碳陽離子，X⁻ 再接上去：這就是馬可尼可夫規則的原因。'}],
  arrowKinds:['addhx'],mixCount:4}),
 stage('rearr',{title:'碳陽離子重排：1,2-氫或甲基位移',short:'重排',chapter:'7.11',goal:'碳陽離子形成後多檢查一步：旁邊的 H 或甲基移過來，能不能變成更穩定的碳陽離子？',task:'比較會不會重排、補上「重排」分支、畫出重排的箭頭，完成 4 題混合練習（每題多問「會不會重排？」）。',needs:['carbocation','arrows'],
  newTypes:[],shift:true,
  pairs:[{a:'rearr-hydride',b:'addhx-propene',diff:'都是烯＋HX：先得到的二級碳陽離子旁邊，有沒有能讓它變三級的 H'},{a:'rearr-methyl',b:'addhx-isobutylene',diff:'甲基位移變成三級 對 一開始就是三級碳陽離子'}],
  branches:[{node:'shift',ids:['shift-yes','shift-no'],prompt:'碳陽離子形成以後，還要多檢查哪一件事？',options:['旁邊的 H 或甲基移過來能不能得到更穩定的碳陽離子？能 → 重排後再被接住','所有碳陽離子一定重排','只有 SN2 會重排'],answer:0,feedback:'重排的動力是「變得更穩定」，例如二級 → 三級。'}],
  arrowKinds:['rearrangement'],mixCount:4}),
 stage('halo',{title:'X₂ 加成：鹵鎓離子造成反式加成',short:'X₂ 加成',chapter:'8.2',goal:'判斷 Br₂、Cl₂ 加成經過鹵鎓離子而不是開放碳陽離子，所以反式加成、不重排。',task:'比較 X₂ 與 HX、補上「烯遇到 X₂」分支、畫出 X₂ 加成的箭頭，完成 4 題混合練習。',needs:['nucleophile','chirality'],
  newTypes:['halogenation'],
  pairs:[{a:'halo-ethene',b:'addhx-isobutylene',diff:'X₂ 對 HX：三元環中間體 對 碳陽離子'},{a:'halo-cyclopentene',b:'addhx-propene',diff:'環烯＋Br₂ 得反式產物 對 烯＋HX 依馬可尼可夫'}],
  branches:[{node:'electrophile',ids:['el-x2'],prompt:'烯遇到 X₂（Br₂、Cl₂）時，中間體是什麼？',options:['三元環的鹵鎓離子；第二個 X⁻ 從背面進攻，反式加成','開放的碳陽離子，可能重排','不經任何中間體'],answer:0,feedback:'鹵鎓離子擋住一面，X⁻ 只能從背面進攻。'}],
  arrowKinds:['halogenation'],mixCount:4}),
 stage('hydration',{title:'酸催化加水：同一個碳陽離子，換水來接',short:'加水',chapter:'8.4',goal:'稀酸與大量水時，H₃O⁺ 先質子化烯形成碳陽離子，水接住後去質子化得到醇。',task:'比較加水與 HX、X₂、補上「稀酸水」分支、畫出加水的箭頭，完成 6 題混合練習。',needs:['acidbase','carbocation'],
  primers:['alcohol-name'],newTypes:['hydration'],
  pairs:[{a:'addhx-propene',b:'hyd-isobutylene',diff:'同樣經碳陽離子：HX 由 X⁻ 接住，稀酸水由水接住'},{a:'hyd-methylbutene',b:'halo-cyclopentene',diff:'H₃O⁺（碳陽離子）對 Br₂（溴鎓離子、反式）'}],
  branches:[{node:'electrophile',ids:['el-h3o'],prompt:'烯在稀酸、大量水中會怎樣？',options:['H₃O⁺ 先給 H⁺ 形成碳陽離子，水接住、去質子化得醇（馬可尼可夫方向）','水直接進攻 C=C','酸催化只會讓烯消失'],answer:0,feedback:'酸只是催化劑：質子化 → 水進攻 → 去質子化。'}],
  arrowKinds:['hydration'],mixCount:6}),
 stage('sn2',{title:'取代的第一條路：SN2',short:'SN2',chapter:'11.2–11.3',goal:'看受質級數、親核劑與溶劑，判斷 SN2 能不能發生，並預測組態反轉。',task:'比較 SN2 的速率、補上「鹵烷遇到良好親核劑」分支、畫出 SN2 的箭頭，完成 6 題混合練習。',needs:['degree','nucleophile','chirality'],
  primers:['halide-name','leaving','sterics','solvent'],newTypes:['sn2'],
  pairs:[{a:'sn2-methyl',b:'sn2-secondary',diff:'甲基 對 二級：背面越擠越慢'},{a:'sn2-ethyl',b:'sn2-cyanide',diff:'一級受質：I⁻／acetone 對 CN⁻／DMSO，都是良好親核劑＋非質子性溶劑'}],
  branches:[{node:'start',ids:['start-halide'],prompt:'起始物是鹵烷（C–X）時，接到哪一題？',options:['鹵烷有脫離基 → 下一步先看試劑是哪一類','鹵烷一定走 SN1','先看溶劑顏色'],answer:0,feedback:'鹵烷是取代與消去的起點：先分試劑。'},{node:'reagent',ids:['r-nuc'],prompt:'試劑是良好親核劑、弱鹼（I⁻、CN⁻）時，下一步看什麼？',options:['看受質級數：甲基、1°、2° → SN2；3° 背面被擋住','一律 SN1','一律 E2'],answer:0,feedback:'良好親核劑要從背面進攻：級數決定擋不擋得住。'},{node:'degree-nuc',ids:['dn-low'],prompt:'良好親核劑遇到甲基、1° 或 2° 受質？',options:['SN2：背面進攻、組態反轉','SN1：先形成碳陽離子','不反應'],answer:0,feedback:'背面夠空，親核劑一步進攻。'}],
  arrowKinds:['sn2'],mixCount:6}),
 stage('sn1',{title:'取代的第二條路：SN1',short:'SN1',chapter:'11.4–11.5',goal:'三級受質在弱親核的質子性溶劑中先形成碳陽離子，再被接住；和 SN2 比較，說出為何走這條路。',task:'看兩組比較動畫、比較 SN2 與 SN1、補上「只有溶劑」分支、畫出 SN1 的箭頭，完成 6 題混合練習。',needs:['carbocation','solvent','energy'],
  newTypes:['sn1'],compare:['primary-sn2-vs-sn1','tertiary-sn1-vs-sn2'],
  pairs:[{a:'sn2-ethyl',b:'sn1-water',diff:'換了受質（一級 → 三級）與親核劑／溶劑（I⁻／acetone → 水）'},{a:'sn2-secondary',b:'sn1-tertamyl',diff:'二級＋良好親核劑 對 三級＋水'},{a:'sn2-methyl',b:'sn1-methanol',diff:'甲基＋OH⁻ 對 三級＋甲醇'},{a:'sn2-cyanide',b:'sn1-benzylic',diff:'一級＋CN⁻／DMSO 對 能形成穩定碳陽離子的三級苄基＋水'}],
  branches:[{node:'reagent',ids:['r-solvent'],prompt:'試劑只有弱親核的質子性溶劑（H₂O、ROH）時，下一步看什麼？',options:['看受質能不能形成穩定碳陽離子：3°（或烯丙、苄基）才行','一律 SN2','一律 E2'],answer:0,feedback:'溶劑太弱無法背面進攻，只能等脫離基先離開。'},{node:'degree-solv',ids:['ds-low','ds-high'],prompt:'只有質子性溶劑時，不同級數怎麼分？',options:['甲基、1°、一般 2° 幾乎不反應；3°（或烯丙、苄基）形成碳陽離子','所有級數都走 SN1','1° 最快'],answer:0,feedback:'原文：三級在中性條件下走 SN1；一般二級很慢。'},{node:'cation',ids:['cation-capture'],prompt:'碳陽離子形成後，室溫時溶劑會怎麼做？',options:['溶劑（H₂O、MeOH）從兩面接住：SN1','一定失去 β-H','碳陽離子回到原料'],answer:0,feedback:'平面碳陽離子兩面都能被接住。'}],
  arrowKinds:['sn1'],mixCount:6}),
 stage('e2',{title:'加入消去：E2 與 Zaitsev 規則',short:'E2',chapter:'11.7–11.9',goal:'遇到強鹼就考慮 E2：找出與脫離基 anti 的 β-H，再用 Zaitsev 規則選出主要的烯。',task:'看比較動畫、比較取代與消去、補上「強鹼」分支、畫出 E2 的箭頭，完成 8 題混合練習。',needs:['degree','acidbase','conformation'],
  primers:['basicity'],newTypes:['e2'],compare:['bulky-e2-vs-sn2'],
  pairs:[{a:'sn2-secondary',b:'e2-butane',diff:'同一個受質 2-溴丁烷，只換試劑與溫度（NaI／acetone → NaOEt／乙醇加熱）'},{a:'sn1-tertamyl',b:'e2-tertamyl',diff:'同一個三級受質，只換試劑（水 → EtO⁻）'},{a:'sn2-cyanide',b:'e2-primary',diff:'一級受質：CN⁻（良好親核劑）對 t-BuO⁻（體積大的強鹼）'}],
  branches:[{node:'reagent',ids:['r-strong'],prompt:'試劑是強鹼（OH⁻、EtO⁻、t-BuO⁻）時，下一步看什麼？',options:['看受質：有沒有 β-H、級數多少、鹼的體積大不大','一律 SN2','一律 SN1'],answer:0,feedback:'強鹼會去拔 β-H；甲基沒有 β-H 只能取代。'},{node:'degree-base',ids:['db-low','db-high'],prompt:'強鹼遇到不同受質怎麼分？',options:['甲基，或 1° 遇到體積小的強鹼 → SN2；2°、3°，或 1° 遇到 t-BuO⁻ → E2','所有受質都 E2','所有受質都 SN2'],answer:0,feedback:'與判斷表（原文 11.12）一致：背面空又沒有障礙時取代，否則拔 β-H。'},{node:'degree-nuc',ids:['dn-high'],prompt:'良好親核劑遇到 3° 受質呢？',options:['背面被擋住無法 SN2；原文：三級遇到鹼以 E2 為主','SN2 最快','一定不反應'],answer:0,feedback:'CN⁻ 鹼性不強，實際也可能伴隨 SN1／E1。'}],
  arrowKinds:['e2'],mixCount:8}),
 stage('e1',{title:'碳陽離子的另一條路：E1',short:'E1',chapter:'11.10',goal:'碳陽離子形成後，依溫度與試劑判斷它被接住（SN1）還是失去 β-H（E1）。',task:'看比較動畫、比較 SN1 與 E1、補上「加熱」分支、畫出 E1 的箭頭，完成 8 題混合練習。',needs:['carbocation','energy','zaitsev'],
  primers:['heat'],newTypes:['e1'],compare:['heat-e1-vs-sn1'],
  pairs:[{a:'sn1-tertamyl',b:'e1-tertamyl',diff:'同一個受質、同一個碳陽離子：水／室溫 對 乙醇／加熱'},{a:'e1-tertamyl',b:'e2-tertamyl',diff:'同一個受質：乙醇（弱鹼）加熱 對 EtO⁻（強鹼）'},{a:'sn1-water',b:'e1-tertbutyl',diff:'同一個第三丁基溴：水捕捉 對 乙醇加熱消去'},{a:'e1-methylpentane',b:'e2-propane',diff:'三級＋弱鹼加熱 對 二級＋強鹼'},{a:'e1-3methylpentane',b:'sn1-methanol',diff:'加熱求烯 對 室溫溶劑解'}],
  branches:[{node:'cation',ids:['cation-heat'],prompt:'碳陽離子形成後加熱，會偏向哪邊？',options:['弱鹼溶劑拔 β-H 形成烯：E1（SN1 仍競爭）','一定 SN1','回到原料'],answer:0,feedback:'SN1 與 E1 分享同一個中間體；加熱改變兩者的比例。'}],
  arrowKinds:['e1'],mixCount:8}),
 stage('dehydration',{title:'醇的酸催化脫水：加水的逆反應',short:'醇脫水',chapter:'17.6',goal:'把醇的脫水看成加水的逆反應：–OH 先質子化才能離開，由條件決定平衡方向。',task:'比較脫水與加水、補上「醇＋濃酸」分支、畫出脫水的箭頭，完成 8 題混合練習。',needs:['leaving','acidbase','zaitsev'],
  primers:['equilibrium'],newTypes:['dehydration'],
  pairs:[{a:'dehyd-tertbutanol',b:'hyd-isobutylene',diff:'互為逆反應：醇＋濃酸加熱 對 烯＋稀酸大量水'},{a:'dehyd-tertamyl',b:'e2-tertamyl',diff:'同樣得到 2-methyl-2-butene：醇經碳陽離子（E1）對 鹵烷＋強鹼（E2）'}],
  branches:[{node:'start',ids:['start-alcohol'],prompt:'起始物是醇＋濃酸、加熱時，接到哪裡？',options:['醇的酸催化脫水（E1）：質子化 → 失水 → 失 β-H','醇的 OH 直接被 SN2 取代','醇＋酸一定加水'],answer:0,feedback:'OH 先質子化才能離開；加熱、濃酸讓平衡偏向烯。'}],
  arrowKinds:['dehydration'],mixCount:8})
];
// Carbocation reactions get an extra "does it rearrange?" question once the rearrangement island is reached.
export const CARBOCATION_TYPES=['addhx','hydration','sn1','e1','dehydration'];

// Capstone judgment table on the final island: substrate degree × reagent → reaction type.
// Cells follow the textbook summary (§11.12, p. 387); `note` explains each cell after checking, `compare` names a why-not comparison.
const cell=(type,note,compare=null)=>({type:[].concat(type),note,compare});
export const JUDGE_TABLE={
 pages:[387],
 rows:[{id:'methyl',label:'甲基',formula:'CH₃–X'},{id:'primary',label:'一級',formula:'RCH₂–X'},{id:'secondary',label:'二級',formula:'R₂CH–X'},{id:'tertiary',label:'三級',formula:'R₃C–X'}],
 cols:[{id:'bulky',label:'體積大的強鹼',eg:'t-BuO⁻（t-BuOK）'},{id:'small',label:'體積小的強鹼',eg:'EtO⁻（EtONa）'},{id:'nuc',label:'良好親核劑、弱鹼',eg:'CN⁻（NaCN，DMSO）'},{id:'protic',label:'只有質子性溶劑',eg:'CH₃OH，室溫'}],
 types:[{id:'sn2',label:'SN2'},{id:'sn1',label:'SN1'},{id:'e2',label:'E2'},{id:'e1',label:'E1'},{id:'slow',label:'幾乎不反應'}],
 cells:{
  'methyl|bulky':cell('sn2','甲基沒有 β-H，不能消去，只剩 SN2（體積大的鹼較慢）。'),
  'methyl|small':cell('sn2','甲基背面最空，良好親核劑直接 SN2。'),
  'methyl|nuc':cell('sn2','甲基背面最空，良好親核劑直接 SN2。'),
  'methyl|protic':cell('slow','甲醇是弱親核劑，甲基又無法形成穩定的碳陽離子：幾乎不反應。'),
  'primary|bulky':cell('e2','體積大的強鹼擠不進碳，改拔外側的 β-H（原文：一級遇到體積大的強鹼走 E2）；一級只有一種 β-H，只得到一種烯。','bulky-e2-vs-sn2'),
  'primary|small':cell('sn2','原文：一級受質遇到良好親核劑走 SN2；EtO⁻ 既是強鹼也是良好親核劑，背面又很空。','primary-sn2-vs-sn1'),
  'primary|nuc':cell('sn2','一級背面很空，良好親核劑走 SN2；一級碳陽離子太不穩定，不走 SN1。','primary-sn2-vs-sn1'),
  'primary|protic':cell('slow','只有弱親核的溶劑：一級無法形成穩定碳陽離子，溶劑又太弱，幾乎不反應。','primary-sn2-vs-sn1'),
  'secondary|bulky':cell('e2','強鹼遇到二級以 E2 為主；體積大的鹼較會拔取代較少一側的 β-H。','bulky-e2-vs-sn2'),
  'secondary|small':cell('e2','原文：二級遇到強鹼，以 E2 為主；主要得到取代較多的烯。'),
  'secondary|nuc':cell('sn2','原文：弱鹼的良好親核劑在極性非質子性溶劑中，讓二級走 SN2。'),
  'secondary|protic':cell('slow','原文：一般二級在純醇中很慢；只有烯丙或苄基的二級，才會在質子性溶劑中走 SN1／E1。'),
  'tertiary|bulky':cell('e2','三級背面被擋住，無法 SN2；體積大的強鹼拔取代較少一側的 β-H。','bulky-e2-vs-sn2'),
  'tertiary|small':cell('e2','原文：三級遇到鹼，以 E2 為主；主要得到取代較多的烯。'),
  'tertiary|nuc':cell('e2','三級無法 SN2；原文：三級遇到鹼，以 E2 為主。CN⁻ 鹼性不強，實際也可能伴隨 SN1／E1。'),
  'tertiary|protic':cell('sn1','原文：三級在中性條件（純醇或水）下 SN1 與 E1 一起發生；室溫以 SN1 較多，平面碳陽離子兩面都能被接住。','tertiary-sn1-vs-sn2'),
 }
};
// Concepts to revisit when a table cell of this reaction type is wrong.
export const TABLE_REVIEW={sn2:['sterics','nucleophile'],sn1:['carbocation','solvent'],e2:['basicity','alkene'],e1:['heat','carbocation'],slow:['nucleophile','carbocation']};

// Decision flow. Each branch unlocks in the stage that teaches it; outcomes are type ids or node ids.
export const FLOW=[
 {id:'start',stage:'addhx',question:'起始物是什麼？',branches:[{id:'start-alkene',stage:'addhx',label:'烯（C=C），遇到親電子劑',to:'electrophile'},{id:'start-halide',stage:'sn2',label:'鹵烷（C–X，有脫離基）',to:'reagent'},{id:'start-alcohol',stage:'dehydration',label:'醇＋濃酸、加熱',to:'dehydration'}]},
 {id:'electrophile',stage:'addhx',question:'試劑是哪一種親電子劑？',branches:[{id:'el-hx',stage:'addhx',label:'HX：碳陽離子，X 接取代較多的碳',to:'shift'},{id:'el-x2',stage:'halo',label:'X₂（Br₂、Cl₂）：鹵鎓離子，反式加成',to:'halogenation'},{id:'el-h3o',stage:'hydration',label:'稀酸＋大量水（H₃O⁺）：碳陽離子，加水得醇',to:'shift'}]},
 {id:'shift',stage:'rearr',question:'碳陽離子旁的 H 或甲基移過來，能得到更穩定的碳陽離子嗎？',branches:[{id:'shift-yes',stage:'rearr',label:'能（例如二級旁接三級碳）→ 先重排再被接住',to:'rearrangement'},{id:'shift-no',stage:'rearr',label:'不能 → 直接被接住',to:'addhx|hydration'}]},
 {id:'reagent',stage:'sn2',question:'試劑是哪一類？',branches:[{id:'r-nuc',stage:'sn2',label:'良好親核劑、弱鹼（I⁻、CN⁻）',to:'degree-nuc'},{id:'r-solvent',stage:'sn1',label:'只有弱親核的質子性溶劑（H₂O、ROH）',to:'degree-solv'},{id:'r-strong',stage:'e2',label:'強鹼（OH⁻、EtO⁻；體積大的 t-BuO⁻）',to:'degree-base'}]},
 {id:'degree-nuc',stage:'sn2',question:'受質是哪一級？',branches:[{id:'dn-low',stage:'sn2',label:'甲基、1°、2°',to:'sn2'},{id:'dn-high',stage:'e2',label:'3°：背面被擋住（原文：遇到鹼以 E2 為主）',to:'e2'}]},
 {id:'degree-solv',stage:'sn1',question:'受質能形成穩定的碳陽離子嗎？',branches:[{id:'ds-low',stage:'sn1',label:'甲基、1°、一般 2°：幾乎不反應',to:'slow'},{id:'ds-high',stage:'sn1',label:'3°（或烯丙、苄基）：先形成碳陽離子',to:'cation'}]},
 {id:'degree-base',stage:'e2',question:'受質與鹼的組合？',branches:[{id:'db-low',stage:'e2',label:'甲基（沒有 β-H），或 1° 遇到體積小的強鹼',to:'sn2'},{id:'db-high',stage:'e2',label:'2°、3°，或 1° 遇到 t-BuO⁻',to:'e2'}]},
 {id:'cation',stage:'sn1',question:'碳陽離子形成後，條件偏向哪邊？',branches:[{id:'cation-capture',stage:'sn1',label:'室溫，溶劑（H₂O、MeOH）接住',to:'sn1'},{id:'cation-heat',stage:'e1',label:'加熱，弱鹼溶劑拔 β-H 得到烯',to:'e1'}]}
];
export const stageIndex=id=>PREP.some(p=>p.id===id)?-1:id==='final'?STAGES.length:STAGES.findIndex(s=>s.id===id);
/** Whether the rearrangement check is part of practice at this island. */
export const shiftUnlocked=stageId=>stageIndex(stageId)>=STAGES.findIndex(s=>s.shift);
export const unlockedTypes=stageId=>STAGES.slice(0,Math.min(STAGES.length,stageIndex(stageId)+1)).flatMap(s=>s.newTypes);

// base: for rearrangement items, the reaction type the learner names (the rearrangement itself is asked separately).
const item=(id,type,substrate,reagent,conditions,reasons,products,path,explain,example=null,extra={})=>({id,type,substrate,reagent,conditions,reasons,products,path,explain,example,...extra});
/** The reaction type a learner should name for an item. */
export const itemType=i=>i.base||i.type;
// reasons[0] and products[0] are correct; the UI shuffles with a fixed seed per item.
export const ITEMS=[
 item('sn2-a','sn2','CH₃Br（溴甲烷）','NaCN','DMSO，25 °C',['甲基受質位阻最小，CN⁻ 是良好親核劑，DMSO 為極性非質子性溶劑','甲基碳陽離子很穩定','CN⁻ 是強鹼，會拔 β-H'],['CH₃C≡N（acetonitrile）＋ Br⁻','CH₂=CH₂','CH₃OH'],['start-halide','r-nuc','dn-low'],'甲基沒有 β-H 也幾乎不形成碳陽離子；CN⁻ 從背面一步取代。','sn2-cyanide'),
 item('sn2-b','sn2','1-溴丁烷','NaI','acetone，25 °C',['一級受質、I⁻ 良好親核劑且弱鹼、acetone 非質子性','一級碳陽離子穩定，先離解','I⁻ 是強鹼，走消去'],['1-iodobutane ＋ Br⁻','1-butene','1-butanol'],['start-halide','r-nuc','dn-low'],'一級、背面暢通、親核劑好：典型 SN2。','sn2-ethyl'),
 item('sn2-c','sn2','(S)-2-溴戊烷','NaI','acetone，25 °C',['二級受質搭配良好親核劑與非質子性溶劑，背面進攻造成構形反轉','二級一定先形成碳陽離子','I⁻ 會拔 β-H 形成烯'],['(R)-2-iodopentane（構形反轉）','(S)-2-iodopentane（構形保留）','2-pentene'],['start-halide','r-nuc','dn-low'],'背面進攻翻轉構形；本例 I 與 Br 的優先序位置相同，所以 S 變 R。','sn2-secondary'),
 item('sn2-d','sn2','CH₃Cl（氯甲烷）','NaI','acetone',['甲基受質最適合背面進攻，I⁻ 是良好親核劑','甲基只能走 SN1','沒有 β-H 所以走 E2'],['CH₃I ＋ Cl⁻','CH₃OH','不反應'],['start-halide','r-nuc','dn-low'],'甲基鹵化物只能被取代；I⁻ 在 acetone 中親核性強。','sn2-ethyl'),
 item('sn2-e','sn2','1-溴丙烷','NaCN','DMF',['一級受質，CN⁻ 良好親核劑，DMF 非質子性溶劑','一級碳陽離子容易形成','DMF 是質子性溶劑，有利 SN1'],['butanenitrile（CH₃CH₂CH₂CN）','propene','1-propanol'],['start-halide','r-nuc','dn-low'],'新的 C–C 鍵讓碳鏈多一個碳；電子由 CN⁻ 的碳端提供。','sn2-cyanide'),
 item('sn1-a','sn1','(CH₃)₃CBr（第三丁基溴）','CH₃OH（溶劑）','室溫，溶劑解',['三級受質形成穩定碳陽離子，甲醇是弱親核的質子性溶劑','三級背面最容易接近','甲醇是強鹼'],['tert-butyl methyl ether（(CH₃)₃COCH₃）','2-methylpropene（唯一產物）','(CH₃)₃COH'],['start-halide','r-solvent','ds-high','cation-capture'],'甲醇的氧接住碳陽離子後再去質子化；E1 可少量競爭。','sn1-methanol'),
 item('sn1-b','sn1','2-氯-2-甲基丁烷','H₂O','室溫，含水溶劑',['三級受質、弱親核的質子性溶劑：先離解再被水捕捉','水是強親核劑，背面進攻','水會拔 β-H，只得烯'],['2-methyl-2-butanol','2-methyl-2-butene（唯一）','1-chloro-2-methylbutane'],['start-halide','r-solvent','ds-high','cation-capture'],'碳陽離子被水接住，最後去質子化得到醇。','sn1-tertamyl'),
 item('sn1-c','sn1','3-溴-3-甲基戊烷','CH₃CH₂OH（溶劑）','室溫，分析取代產物',['三級受質在弱親核、質子性的乙醇中離解，乙醇捕捉碳陽離子','乙醇是強鹼，走 E2','三級受質走 SN2'],['3-ethoxy-3-methylpentane','3-methyl-2-pentene（唯一）','3-methylpentane'],['start-halide','r-solvent','ds-high','cation-capture'],'室溫溶劑解以取代為主；加熱才會讓 E1 比例明顯提高。'),
 item('sn1-d','sn1','PhCH(Cl)CH₃（1-氯-1-苯基乙烷）','H₂O／acetone','室溫',['苄基碳陽離子有共振穩定，水是弱親核的質子性溶劑','二級受質一定 SN2','水是強鹼'],['1-phenylethanol（兩面進攻，接近外消旋）','styrene（唯一）','(R)-1-phenylethanol（完全反轉）'],['start-halide','r-solvent','ds-high','cation-capture'],'苄基雖是二級，但正電可分散到苯環，SN1 可行；平面碳陽離子兩面都能被接近。'),
 item('sn1-e','sn1','(CH₃)₃CBr','H₂O','室溫',['三級受質、水為弱親核質子性溶劑','三級受質背面暢通','水會把 Br 氧化'],['tert-butanol ＋ HBr','isobutane','1-bromo-2-methylpropane'],['start-halide','r-solvent','ds-high','cation-capture'],'與本課程 SN1 例子相同的三步：離解、水進攻、去質子化。','sn1-water'),
 item('e2-a','e2','2-溴丙烷','NaOEt','乙醇，加熱',['二級受質＋強鹼 EtO⁻＋加熱：鹼拔 β-H，一步消去','EtO⁻ 是弱鹼，走 SN1','二級碳陽離子先形成'],['propene','2-ethoxypropane（唯一）','2-propanol'],['start-halide','r-strong','db-high'],'強鹼使 E2 為主；SN2 仍可能少量競爭。','e2-propane'),
 item('e2-b','e2','2-溴-2-甲基丁烷','KOH','乙醇，加熱',['三級受質無法 SN2，強鹼 OH⁻ 直接拔 β-H','三級受質一定 SN1','OH⁻ 是良好脫離基'],['2-methyl-2-butene（主要）與 2-methyl-1-butene','2-methyl-2-butanol（唯一）','2-methylbutane'],['start-halide','r-strong','db-high'],'原文習題指出會得到兩種烯；取代較多者為主（Zaitsev）。','e2-tertamyl'),
 item('e2-c','e2','1-溴-2-甲基丙烷','KOtBu（t-BuO⁻）','t-BuOH，加熱',['體積大的強鹼難以進攻碳，改拔 β-H','一級受質只能 SN2','t-BuO⁻ 是弱鹼'],['2-methylpropene','1-tert-butoxy-2-methylpropane（主要）','2-methyl-1-propanol'],['start-halide','r-strong','db-high'],'一級受質通常偏 SN2，但體積大的強鹼讓 E2 成為主要路徑。','e2-primary'),
 item('e2-d','e2','溴環己烷','NaOEt','乙醇，加熱',['二級受質＋強鹼＋加熱，需 β-H 與 Br 反式雙軸向','溴環己烷形成穩定三級碳陽離子','EtO⁻ 只會當親核劑'],['cyclohexene','ethoxycyclohexane（唯一）','cyclohexanol'],['start-halide','r-strong','db-high'],'環己烷 E2 需要 Br 在軸向、β-H 反式雙軸向。','e2-butane'),
 item('e2-e','e2','(CH₃)₃CBr','NaOEt','乙醇，加熱',['三級受質背面被擋住，強鹼 EtO⁻ 直接拔 β-H','三級＋強鹼走 SN2','EtO⁻ 先形成碳陽離子'],['2-methylpropene','tert-butyl ethyl ether（主要）','isobutane'],['start-halide','r-strong','db-high'],'與 E1 不同：強鹼使消去在一步內完成，不等碳陽離子。','e2-tertamyl'),
 item('e1-a','e1','(CH₃)₃CBr','CH₃CH₂OH（溶劑，無強鹼）','加熱',['三級受質在弱鹼溶劑中先離解，加熱使失去 β-H 的比例提高','乙醇是強鹼，一步消去','三級受質走 SN2'],['2-methylpropene（另有 SN1 醚競爭）','只有 tert-butyl ethyl ether','isobutane'],['start-halide','r-solvent','ds-high','cation-heat'],'E1 與 SN1 共用碳陽離子；加熱有利消去但不保證唯一產物。','e1-tertbutyl'),
 item('e1-b','e1','3-溴-3-甲基戊烷','CH₃CH₂OH（溶劑）','加熱，得到烯',['三級受質離解成碳陽離子，弱鹼溶劑拔 β-H；產物依 Zaitsev','強鹼一步消去','二級受質 SN2'],['3-methyl-2-pentene（主要，含 E/Z）','3-methyl-1-pentene（唯一）','3-ethoxy-3-methylpentane（唯一）'],['start-halide','r-solvent','ds-high','cation-heat'],'碳陽離子可自由旋轉，E/Z 都可能生成。','e1-3methylpentane'),
 item('e1-c','e1','2-氯-2-甲基丁烷','CH₃OH（溶劑）','加熱，得到烯',['三級受質在弱鹼溶劑中加熱：先形成碳陽離子，再失去 β-H','CH₃OH 是強鹼','氯是差的脫離基，所以不反應'],['2-methyl-2-butene（主要）','2-methyl-2-butanol','1-chloro-2-methylbutane'],['start-halide','r-solvent','ds-high','cation-heat'],'與 SN1 同一個中間體，加熱提高消去比例。','e1-tertamyl'),
 item('e1-d','e1','1-溴-1-甲基環己烷','CH₃CH₂OH（溶劑）','加熱',['三級受質、弱鹼溶劑、加熱：E1，Zaitsev 得到取代較多的烯','強鹼一步 E2','一級受質 SN2'],['1-methylcyclohexene（主要）','methylenecyclohexane（唯一）','1-ethoxy-1-methylcyclohexane（唯一）'],['start-halide','r-solvent','ds-high','cation-heat'],'環內三取代雙鍵比環外雙取代雙鍵穩定。'),
 item('e1-e','e1','2-溴-2,3-二甲基丁烷','CH₃CH₂OH（溶劑）','加熱',['三級受質在乙醇中加熱，碳陽離子失去 β-H，主要得到四取代烯','乙醇是強鹼','受質無 β-H'],['2,3-dimethyl-2-butene（主要）','2,3-dimethyl-1-butene（唯一）','2,3-dimethylbutane'],['start-halide','r-solvent','ds-high','cation-heat'],'四取代雙鍵最穩定（Zaitsev）。'),
 item('addhx-a','addhx','2-甲基丙烯 (CH₃)₂C=CH₂','HCl','醚類溶劑',['烯的 π 鍵進攻 H，形成三級碳陽離子，Cl⁻ 接在取代較多的碳','HCl 是強鹼','Cl 接在取代較少的碳'],['2-chloro-2-methylpropane','1-chloro-2-methylpropane','2-methylpropane'],['start-alkene','el-hx','shift-no'],'原文：只得到 2-chloro-2-methylpropane（馬可尼可夫）。','addhx-isobutylene'),
 item('addhx-b','addhx','1-甲基環己烯','HBr','醚類溶劑',['質子加到取代較少的雙鍵碳，形成三級碳陽離子，Br⁻ 接在該碳','形成二級碳陽離子','Br₂ 反式加成'],['1-bromo-1-methylcyclohexane','1-bromo-2-methylcyclohexane','trans-1,2-dibromo-1-methylcyclohexane'],['start-alkene','el-hx','shift-no'],'三級碳陽離子比二級穩定，決定加成方向。','addhx-isobutylene'),
 item('addhx-c','addhx','丙烯 CH₃CH=CH₂','HBr','無過氧化物',['質子加到末端 CH₂，形成二級碳陽離子，Br 接中間碳','形成一級碳陽離子','HBr 拔 β-H'],['2-bromopropane','1-bromopropane','propane'],['start-alkene','el-hx','shift-no'],'二級碳陽離子比一級穩定。','addhx-propene'),
 item('addhx-d','addhx','2-甲基-2-丁烯 (CH₃)₂C=CHCH₃','HBr','醚類溶劑',['質子加到只帶一個甲基的碳，正電落在三級碳','正電落在二級碳','Br 加到兩個碳各一半'],['2-bromo-2-methylbutane','2-bromo-3-methylbutane','2-methylbutane'],['start-alkene','el-hx','shift-no'],'正電位在連三個碳的碳上最穩定。','addhx-isobutylene'),
 item('addhx-e','addhx','2-甲基-1-丁烯 CH₂=C(CH₃)CH₂CH₃','HCl','醚類溶劑',['質子加到末端 CH₂，直接形成三級碳陽離子，不需重排','先形成一級碳陽離子再重排','Cl₂ 加成'],['2-chloro-2-methylbutane','1-chloro-2-methylbutane','2-methyl-2-butanol'],['start-alkene','el-hx','shift-no'],'已經是三級碳陽離子，旁邊沒有更穩定的選擇。','addhx-isobutylene'),
 item('hyd-a','hydration','2-甲基丙烯','H₂O，H₂SO₄（催化）','稀酸、大量水',['H₃O⁺ 質子化烯形成三級碳陽離子，水接住後去質子化','醇在濃酸下脫水','水直接加到雙鍵，不經中間體'],['tert-butanol','2-methyl-1-propanol','2-methylpropene（不反應）'],['start-alkene','el-h3o','shift-no'],'馬可尼可夫方向：OH 接在取代較多的碳；酸再生。','hyd-isobutylene'),
 item('hyd-b','hydration','1-甲基環己烯','H₂O，H₃O⁺','稀酸、大量水',['形成三級碳陽離子，水進攻再去質子化','形成二級碳陽離子','鹵鎓離子反式加成'],['1-methylcyclohexanol','2-methylcyclohexanol','1-methylcyclohexene（脫水）'],['start-alkene','el-h3o','shift-no'],'與 HX 加成相同的方向規則，只是接住碳陽離子的是水。','hyd-isobutylene'),
 item('hyd-c','hydration','丙烯','H₂O，H₂SO₄（催化）','稀酸、大量水',['質子加到末端碳，形成二級碳陽離子，水接住','形成一級碳陽離子','水當強鹼拔氫'],['2-propanol','1-propanol','propane'],['start-alkene','el-h3o','shift-no'],'OH 接在中間碳（馬可尼可夫）。','hyd-methylbutene'),
 item('hyd-d','hydration','2-甲基-2-丁烯','H₂O，H₃O⁺','稀酸、大量水',['質子加到只帶一個甲基的碳，三級碳陽離子被水捕捉','正電落在二級碳','醇的脫水'],['2-methyl-2-butanol','3-methyl-2-butanol','2-methyl-2-butene（不變）'],['start-alkene','el-h3o','shift-no'],'與本課程 2-甲基-2-丁烯例子相同。','hyd-methylbutene'),
 item('hyd-e','hydration','1-甲基環戊烯','H₂O，H₂SO₄（催化）','稀酸、大量水',['三級碳陽離子由水捕捉，再去質子化','二級碳陽離子','溴鎓離子'],['1-methylcyclopentanol','2-methylcyclopentanol','cyclopentanol'],['start-alkene','el-h3o','shift-no'],'方向依碳陽離子穩定性決定。','hyd-isobutylene'),
 item('halo-a','halogenation','環己烯','Br₂','CH₂Cl₂',['Br₂ 形成溴鎓離子，Br⁻ 從背面打開，得到反式產物','形成開放碳陽離子，得到順反混合物','HBr 加成'],['trans-1,2-dibromocyclohexane','cis-1,2-dibromocyclohexane','bromocyclohexane'],['start-alkene','el-x2'],'兩個 Br 來自雙鍵相反兩面。','halo-cyclopentene'),
 item('halo-b','halogenation','丙烯','Cl₂','CH₂Cl₂',['Cl₂ 形成氯鎓離子，Cl⁻ 從背面打開','形成碳陽離子並重排','Cl 只加到一個碳'],['1,2-dichloropropane','2-chloropropane','1-chloropropane'],['start-alkene','el-x2'],'X₂ 加成把兩個 X 分別加到原雙鍵的兩個碳。','halo-ethene'),
 item('halo-c','halogenation','環戊烯','Cl₂','CH₂Cl₂',['氯鎓離子中間體使兩個 Cl 從相反兩面加入','開放碳陽離子使兩面皆可','HCl 加成'],['trans-1,2-dichlorocyclopentane（外消旋）','cis-1,2-dichlorocyclopentane','chlorocyclopentane'],['start-alkene','el-x2'],'環上無法旋轉，反式關係直接看得到。','halo-cyclopentene'),
 item('halo-d','halogenation','乙烯','Cl₂','液相',['Cl₂ 與 π 鍵形成三元環氯鎓離子，再被 Cl⁻ 打開','乙烯經一級碳陽離子','Cl₂ 只取代 H'],['1,2-dichloroethane','chloroethane','chloroethene'],['start-alkene','el-x2'],'原文：大量 1,2-二氯乙烷以 Cl₂ 加到乙烯製得。','halo-ethene'),
 item('halo-e','halogenation','2-甲基丙烯','Br₂','CH₂Cl₂',['形成溴鎓離子，Br⁻ 打開三元環，兩個 Br 加在原雙鍵兩個碳','經碳陽離子重排','只加一個 Br'],['1,2-dibromo-2-methylpropane','2-bromo-2-methylpropane','1-bromo-2-methylpropane'],['start-alkene','el-x2'],'X₂ 加成不需馬可尼可夫判斷「H 去哪」，兩個碳各得一個 Br。','halo-ethene'),
 item('rearr-a','rearrangement','3-甲基-1-丁烯','HBr','醚類溶劑',['先形成二級碳陽離子，相鄰 C–H 帶電子對移過來得到三級碳陽離子','直接形成三級碳陽離子','溴鎓離子不重排'],['2-bromo-2-methylbutane（重排）與 2-bromo-3-methylbutane','只有 1-bromo-3-methylbutane','2-methylbutane'],['start-alkene','el-hx','shift-yes'],'1,2-氫位移讓正電從二級移到三級碳。','rearr-hydride',{base:'addhx'}),
 item('rearr-b','rearrangement','3,3-二甲基-1-丁烯','HBr','醚類溶劑',['二級碳陽離子旁的甲基帶著鍵電子移過來，形成三級碳陽離子','氫位移','不經碳陽離子'],['2-bromo-2,3-dimethylbutane（重排）與 3-bromo-2,2-dimethylbutane','只有 1-bromo-3,3-dimethylbutane','2,3-dimethylbutane'],['start-alkene','el-hx','shift-yes'],'相鄰碳沒有 H 可移，移動的是甲基。','rearr-methyl',{base:'addhx'}),
 item('rearr-c','rearrangement','3-甲基-1-丁烯','HCl','醚類溶劑',['先得二級碳陽離子，1,2-氫位移變成三級碳陽離子，再被 Cl⁻ 接住','形成一級碳陽離子','Cl₂ 反式加成'],['2-chloro-2-methylbutane（重排）與 2-chloro-3-methylbutane 約等量','只有 1-chloro-3-methylbutane','2-methylbutane'],['start-alkene','el-hx','shift-yes'],'原文例子：重排與未重排產物約等量。','rearr-hydride',{base:'addhx'}),
 item('rearr-d','rearrangement','乙烯基環己烷 C₆H₁₁CH=CH₂','HBr','醚類溶劑',['質子化得到二級碳陽離子，環上相鄰 C–H 位移，正電移到三級的環碳','直接得到三級碳陽離子','溴鎓離子'],['1-bromo-1-ethylcyclohexane（重排）','只有 (1-bromoethyl)cyclohexane','bromocyclohexane'],['start-alkene','el-hx','shift-yes'],'遠遷移：環上的氫也能 1,2-位移。重排與未重排產物都可能生成。','rearr-hydride',{base:'addhx'}),
 item('rearr-e','rearrangement','3,3-二甲基-1-丁烯','H₂O，H₂SO₄（催化）','稀酸、大量水',['加水同樣經碳陽離子，二級碳陽離子經甲基位移變三級，再被水捕捉','鹵鎓離子不重排','醇的脫水'],['2,3-dimethyl-2-butanol（重排產物為主）','只有 3,3-dimethyl-1-butanol','只有 3,3-dimethyl-2-butanol（不重排）'],['start-alkene','el-h3o','shift-yes'],'只要經過碳陽離子就要檢查重排，加水也不例外。','rearr-methyl',{base:'hydration'}),
 item('dehyd-a','dehydration','(CH₃)₃COH（第三丁醇）','H₂SO₄','加熱',['OH 質子化成好脫離基，失水成三級碳陽離子，再失去 β-H（E1）','OH⁻ 直接離開','稀酸大量水，所以加水'],['2-methylpropene ＋ H₂O','tert-butyl hydrogen sulfate（主要）','isobutane'],['start-alcohol'],'三級醇最容易脫水。','dehyd-tertbutanol'),
 item('dehyd-b','dehydration','2-甲基-2-丁醇','H₂SO₄','加熱',['三級醇經 E1 脫水，Zaitsev 得到取代較多的烯','強鹼一步 E2','醇被 SN2 取代'],['2-methyl-2-butene（主要）','2-methyl-1-butene（唯一）','2-methylbutane'],['start-alcohol'],'原文：得到 2-methyl-2-butene 而不是 2-methyl-1-butene 為主。','dehyd-tertamyl'),
 item('dehyd-c','dehydration','1-甲基環己醇','H₂SO₄','加熱',['質子化、失水、失 β-H；環內三取代烯最穩定','形成二級碳陽離子','加水'],['1-methylcyclohexene（主要）','methylenecyclohexane（唯一）','1-methylcyclohexanol（不變）'],['start-alcohol'],'原文以 1-甲基環己醇說明脫水。','dehyd-tertamyl'),
 item('dehyd-d','dehydration','3-甲基-3-戊醇','H₂SO₄','加熱',['三級醇經碳陽離子失去 β-H；可得 E/Z 混合','一步 E2','SN1 得到醚'],['3-methyl-2-pentene（主要，E/Z）','3-methyl-1-pentene（唯一）','3-methylpentane'],['start-alcohol'],'碳陽離子路徑沒有單一 anti 要求，E/Z 都會形成。','dehyd-tertamyl'),
 item('dehyd-e','dehydration','2,3-二甲基-2-丁醇','H₃PO₄','加熱',['三級醇 E1 脫水，Zaitsev 得到四取代烯','醇直接當親核劑','稀酸加水'],['2,3-dimethyl-2-butene（主要）','2,3-dimethyl-1-butene（唯一）','2,3-dimethylbutane'],['start-alcohol'],'四取代雙鍵最穩定。','dehyd-tertamyl')
];
// Rearrangement items join the pool only once the rearrangement island is reached (shift).
export const itemsFor=(types,{shift=false}={})=>ITEMS.filter(i=>types.includes(itemType(i))&&(shift||i.type!=='rearrangement'));

/** Weakness-weighted, interleaved pick. history: [{item,type,mech}] newest last. */
export function pickItem(types,history,random=Math.random,{shift=false}={}){
 const pool=itemsFor(types,{shift});if(!pool.length)return null;
 const recent=t=>history.filter(h=>h.type===t).slice(-3),last=history.at(-1)?.type;
 const weights=types.map(t=>{const r=recent(t);let w=1+(r.length?0:1.5)+3*r.filter(h=>!h.mech).length;if(t===last&&types.length>1)w*=.25;return w;});
 let x=random()*weights.reduce((a,b)=>a+b,0),type=types.at(-1);for(let i=0;i<types.length;i++){x-=weights[i];if(x<=0){type=types[i];break;}}
 const seen=new Map(history.map((h,i)=>[h.item,i])),options=pool.filter(i=>itemType(i)===type).sort((a,b)=>(seen.get(a.id)??-1)-(seen.get(b.id)??-1));
 return options[0];
}
export function mastery(types,history){
 return Object.fromEntries(types.map(t=>{const r=history.filter(h=>h.type===t).slice(-5),right=r.filter(h=>h.mech).length;return [t,{attempts:history.filter(h=>h.type===t).length,recent:r.length,right,level:r.length>=3&&right>=Math.min(4,r.length)?'精熟':r.length?'練習中':'尚未練習'}];}));
}
/** Deterministic shuffle so a learner sees a stable option order for each item. */
export function shuffled(list,seed){
 let h=0;for(const c of seed)h=(h*31+c.charCodeAt(0))>>>0;
 const order=list.map((v,i)=>({v,i,k:(h=(h*1103515245+12345)>>>0)}));return order.sort((a,b)=>a.k-b.k);
}
