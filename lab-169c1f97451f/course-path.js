// Course content for the progressive, interleaved path: warm-up → SN2/SN1 → E2 → E1 → additions → rearrangement/dehydration.
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

const check=(prompt,options,answer,feedback)=>({prompt,options,answer,feedback});
export const WARMUP=[
{id:'skeletal',group:'tools',widget:{kind:'skeletal'},judge:'補回 H 與孤對電子，才找得到受質的級數、β-H，以及箭頭從哪裡出發。',title:'讀結構式：補回省略的碳、氫與孤對電子',pages:[44,75],body:['骨架式（skeletal structure）省略了大部分原子：每個轉折點與線段末端都是一個碳；連在碳上的氫不畫出來；碳與氫以外的原子（O、N、Br 等）一定會寫出來。','碳總共形成四個鍵，所以看到一個碳畫了幾條線，就用 4 減去線數，補回它帶的 H：末端只有一條線的碳是 CH₃，中間兩條線的是 CH₂。','孤對電子也常常省略，但箭頭就是從它們出發。中性時：兩個鍵的氧有兩對孤對電子，三個鍵的氮有一對，一個鍵的鹵素有三對。'],example:'2-溴丁烷的骨架式是一條四個碳的鋸齒線，Br 接在第二個碳上：兩端是 CH₃，第三個碳是 CH₂，連著 Br 的第二個碳只剩一個 H；Br 上有三對孤對電子。',check:check('2-溴丁烷骨架式中，線段末端的碳有幾個 H？Br 上有幾對孤對電子？',['3 個 H；3 對孤對電子','1 個 H；1 對孤對電子','3 個 H；沒有孤對電子'],0,'末端碳只畫一條線，4 − 1 = 3 個 H；只形成一個鍵的中性 Br 還有三對孤對電子。')},
{id:'formal',review:['skeletal'],group:'tools',judge:'每畫一步箭頭都靠它驗算；也靠它認出碳陽離子與質子化的氧。',title:'形式電荷：先學會替電子記帳',pages:[60,61],body:['形式電荷 = 價電子數 −（孤對電子的電子數 ＋ 鍵數）。每條鍵只算一個電子給這個原子。','常見情況：氧有三個鍵、一對孤對電子 → +1（H₃O⁺、R–OH₂⁺）；氧有一個鍵、三對孤對電子 → −1（OH⁻）；碳只有三個鍵、沒有孤對電子 → +1（碳陽離子）。','斷鍵時，原本共用的那對電子整對歸給其中一個原子：拿到電子對的原子變得更負，失去的變得更正。之後畫完每一步箭頭，都要回來重算一次，並確認整步的總電荷不變。'],example:'比較三個氧：H₂O（2 鍵、2 對）6 −（4＋2）= 0；OH⁻（1 鍵、3 對）6 −（6＋1）= −1；H₃O⁺（3 鍵、1 對）6 −（2＋3）= +1。',check:check('R–OH₂⁺ 中的氧，形式電荷為什麼是 +1？',['三個鍵與一對孤對電子：6 −（2＋3）= +1','氧多得到一個電子','氧沒有任何孤對電子'],0,'價電子 6，減去孤對電子的 2 個電子與三條鍵的 3，得到 +1。')},
{id:'polarity',review:['formal'],group:'tools',judge:'找出受質上缺電子的碳，就是親核劑或鹼要接近的地方。',title:'鍵極性：部分電荷不是形式電荷',pages:[56,60],body:['電負度較大的原子會把共用電子拉向自己：C–Br 中 Br 帶部分負電（δ−）、碳帶部分正電（δ+）；H–Br 中 H 帶 δ+；C–O、O–H 也一樣，氧那端是 δ−。','部分電荷（δ+、δ−）描述共用電子偏向哪一邊，原子仍然是中性的，形式電荷是 0；形式電荷（+1、−1）則是用電子記帳算出來的整數。兩者不要混用：C–Br 的碳是 δ+，但形式電荷是 0。','δ+ 的原子缺電子，是電子對常見的去處；δ− 的原子或孤對電子較多的地方富電子，是電子對常見的來源。'],example:'CH₃–Br：碳 δ+、Br δ−，兩者形式電荷都是 0；H₃O⁺ 的氧形式電荷是 +1，這是整個離子真的少了一個電子。',check:check('CH₃–Br 中的碳帶什麼電荷？',['部分正電 δ+，形式電荷仍是 0','形式電荷 +1','部分負電 δ−'],0,'Br 電負度較大，把鍵電子拉過去，碳只帶部分正電；碳有四個鍵、沒有孤對電子，形式電荷是 0。')},
{id:'arrows',review:['skeletal','formal'],group:'tools',judge:'四種反應的差別最後都寫成箭頭：幾支箭頭、同時動還是分步動。',title:'彎箭頭：追蹤電子對',pages:[194,199,200],visual:'polarity',demos:[{label:'C–Br 斷鍵（SN1 第一步）',kind:'sn1',example:'sn1-water',step:0}],body:['有機反應是電子對的重新分配。彎箭頭從一對電子出發：孤對電子，或一條化學鍵；箭頭指向電子要去的地方：缺電子的原子，或兩原子之間即將形成的新鍵。','完整箭頭搬兩個電子。原子本身不會「飛過去」；我們只記錄電子對往哪裡走，再看鍵怎麼形成、怎麼斷裂，以及電荷如何改變。'],example:'C–Br 鍵斷裂時，箭頭從 C–Br 鍵指向 Br：Br 帶走這對電子成為 Br⁻，碳少了電子變成 C⁺。',check:check('彎箭頭的起點應該畫在哪裡？',['可提供的孤對電子或化學鍵','帶正電的原子','產物的位置'],0,'箭頭永遠從一對電子出發；帶正電的原子通常是電子的去處。')},
{id:'degree',review:['skeletal'],group:'substrate',widget:{kind:'degree'},judge:'受質級數是判斷 SN2／SN1／E2／E1 的第一條線索；有沒有 β-H 決定能不能消去。',title:'數級數，找 α 碳與 β 碳',pages:[101,375,378],body:['碳的級數看「它直接連了幾個碳」：連一個碳是一級（1°），兩個是二級（2°），三個是三級（3°）；甲基碳不連任何碳。','α 碳是帶脫離基（或帶正電）的碳；β 碳是緊鄰 α 碳的碳，β 碳上的氫叫 β-H。消去反應移走的就是 β-H。'],example:'2-溴丁烷 CH₃CH(Br)CH₂CH₃：帶 Br 的碳連兩個碳，是二級 α 碳；它兩側的 CH₃ 與 CH₂ 都是 β 碳。',check:check('(CH₃)₃C–Br 中帶 Br 的碳是幾級？',['一級','二級','三級'],2,'它直接連了三個甲基碳，所以是三級。')},
{id:'hybrid',review:['skeletal'],group:'substrate',judge:'形狀決定進攻方向：四面體碳只能從背面進攻（SN2），平面的碳陽離子上下兩面都能被接住（SN1）。',title:'混成與形狀：四面體、平面與 π 鍵',pages:[35,37],demos:[{label:'sp³ 四面體碳：從背面進攻（SN2）',kind:'sn2',example:'sn2-methyl'},{label:'C–Br 斷裂後變成 sp² 平面（SN1 第一步）',kind:'sn1',example:'sn1-water',step:0}],body:['形成四個單鍵的飽和碳通常是 sp³ 混成，四個鍵指向正四面體的四個角，鍵角約 109.5°。脫離基正對面的那一側，就是 SN2 親核劑進攻的位置。','烯碳與本課程的碳陽離子中心通常是 sp² 混成：三個 σ 鍵在同一平面、約 120°，另留一個垂直於平面的未混成 p 軌域（有上、下兩個葉瓣）。碳陽離子的 p 軌域是空的；烯的兩個 p 軌域重疊成 π 鍵。'],example:'CH₃Br 的碳是 sp³ 四面體；(CH₃)₃C⁺ 的碳是 sp² 平面，空的 p 軌域垂直於這個平面。',check:check('碳陽離子的中心碳是什麼形狀？',['sp² 平面三角形，上下有一個空的 p 軌域','sp³ 四面體','直線形'],0,'只有三個鍵的碳是 sp² 平面，空的 p 軌域垂直於這個平面。')},
{id:'nucleophile',review:['polarity','skeletal'],group:'reagent',judge:'看試劑：誰提供電子。良好的親核劑會去進攻缺電子的碳（取代）。',title:'親核劑與親電子劑：誰給電子、誰接受',pages:[73,74,199],visual:'nucleophile',demos:[{label:'水進攻碳陽離子（SN1 第二步）',kind:'sn1',example:'sn1-water',step:1}],body:['親核劑（nucleophile）提供電子對，常見的是帶負電或有孤對電子的原子，例如 I⁻、OH⁻、CN⁻、H₂O 的氧、醇的氧。烯的 π 鍵電子也能當親核劑。','親電子劑（electrophile）接受電子對：帶正電或部分正電、缺電子的原子，例如碳陽離子、C–X 中的碳、HBr 的氫。','判斷反應的第一步：找出誰提供電子、誰接受電子，箭頭就從前者指向後者。'],example:'水的氧有兩對孤對電子，可以進攻帶正電的碳；I⁻ 可以進攻 C–Br 中帶部分正電的碳。',check:check('下列哪一個可以當親核劑？',['H₂O 的氧（有孤對電子）','碳陽離子 (CH₃)₃C⁺','HBr 中的 H'],0,'有孤對電子的氧能提供電子對；碳陽離子與 HBr 的 H 是接受電子的一方。')},
{id:'acidbase',review:['arrows','formal'],group:'reagent',judge:'看試劑是不是強鹼：強鹼會去拔 β-H（消去）；強酸的共軛鹼很弱，所以是好脫離基。',title:'酸鹼：質子轉移與 pKa',pages:[66,67,68,69,74,75],demos:[{label:'酸把 H⁺ 給醇的氧（醇脫水第 1 步）',kind:'dehydration',example:'dehyd-tertbutanol',step:0},{label:'水拔走 R–OH₂⁺ 的 H⁺（SN1 第三步）',kind:'sn1',example:'sn1-water',step:2}],body:['布忍斯特–洛瑞定義：酸給出 H⁺，鹼接受 H⁺；酸失去 H⁺ 後剩下的部分，是它的共軛鹼。質子轉移是最簡單的電子移動：鹼用一對孤對電子接住酸的 H⁺。','照五步畫：① 找出鹼上要送出的孤對電子；② 第一支箭頭從孤對電子指向 H；③ 第二支箭頭從原本的 H–A 鍵指向 A，這對電子留給 A；④ 畫出新鍵與產物；⑤ 重算形式電荷：鹼的原子多一個鍵、變得更正，A 多一對孤對電子、變得更負，整步總電荷不變。','pKa 越小，酸越強；酸越強，它的共軛鹼越弱、越穩定。HI、HBr、HCl 都是強酸，所以 I⁻、Br⁻、Cl⁻ 都是弱鹼；水的 pKa 約 15.7，所以 OH⁻ 是強鹼。'],example:'(CH₃)₃C–OH ＋ H₃O⁺：醇的氧用孤對電子接住 H，H–O 鍵的電子回到水的氧，得到 (CH₃)₃C–OH₂⁺ ＋ H₂O；醇的氧由 0 變 +1，H₃O⁺ 的氧由 +1 變 0。',check:check('HBr 是強酸，這代表 Br⁻ 是？',['很弱的鹼，因此是好的脫離基','很強的鹼','無法存在的離子'],0,'酸越強，共軛鹼越弱、越穩定；離開後穩定的弱鹼就是好脫離基。')},
{id:'leaving',review:['acidbase'],group:'leaving',judge:'看脫離基：沒有好的脫離基，取代與消去都不會開始；–OH 要先質子化。',title:'好脫離基：離開後要穩定',pages:[365,366],widget:{kind:'leaving'},demos:[{label:'水帶著電子離開，留下碳陽離子（醇脫水第 2 步）',kind:'dehydration',example:'dehyd-tertbutanol',step:1}],body:['脫離基帶著鍵電子離開，離開後越穩定（越弱的鹼）越容易離開：I⁻ > Br⁻ > Cl⁻。','OH⁻ 是強鹼，所以 –OH 是很差的脫離基。醇要先被酸質子化成 –OH₂⁺，才能以中性水的形式離開——醇的脫水就是這樣開始的。'],example:'(CH₃)₃C–OH 加強酸後變成 (CH₃)₃C–OH₂⁺，水離開後得到 (CH₃)₃C⁺。',check:check('為什麼醇要先質子化才會離開？',['OH⁻ 是強鹼、差的脫離基；質子化後能以中性水離開','因為氧沒有孤對電子','因為碳太穩定'],0,'弱鹼才是好脫離基；–OH₂⁺ 離開時帶走的是中性的水。')}
];

// Warm-up groups follow the clues used to judge a reaction type: tools first, then substrate, reagent and leaving group.
export const WARM_GROUPS=[
 {id:'tools',title:'1．基本工具',hint:'結構、電荷與箭頭'},
 {id:'substrate',title:'2．看受質',hint:'級數、β-H 與形狀'},
 {id:'reagent',title:'3．看試劑',hint:'親核劑還是強鹼'},
 {id:'leaving',title:'4．看脫離基',hint:'離開後要穩定'}
];
export const PATH_GOALS={
 warmup:'還不用背反應：先備好判斷工具，再學會看受質、看試劑、看脫離基——之後每座島都用這幾條線索判斷反應類型。',
 final:'先自己完成整張「受質 × 試劑」判斷表，再在混在一起的題目中說出反應類型與依據，寫出產物並畫對箭頭。',
 assessment:'確認學過的判斷，遇到沒看過的受質也用得上。'
};

// Handbook groups use the same clues as the warm-up: every warm-up card, entry primer and product-detail card belongs to exactly one.
// uses: course stations where the clue is put to work (shown as "現在正在用" there).
export const COMPETENCIES=[
 {id:'tools',title:'基本工具',hint:'結構、電荷與箭頭',ability:'補回 H 與孤對電子，算形式電荷，畫出電子對往哪裡走。',task:'補出指定原子的 H 與孤對電子；畫完箭頭後驗算電荷。',cards:['skeletal','formal','polarity','arrows'],uses:['warmup','s1','s2','s3','s4','s5','final']},
 {id:'substrate',title:'看受質',hint:'級數、形狀、立體障礙與碳陽離子',ability:'看受質級數與形狀，判斷背面能不能接近、碳陽離子穩不穩定。',task:'判斷帶脫離基的碳是幾級；比較碳陽離子的穩定性。',cards:['degree','hybrid','sterics','carbocation'],uses:['warmup','s1','s2','s3','s4','s5']},
 {id:'reagent',title:'看試劑',hint:'親核劑還是強鹼',ability:'分清試劑是良好親核劑、強鹼，還是弱親核也弱鹼的溶劑。',task:'把 I⁻、EtO⁻、t-BuO⁻、H₂O 分成親核劑、強鹼與溶劑。',cards:['nucleophile','acidbase','basicity'],uses:['warmup','s1','s2','s3','s4','final']},
 {id:'leaving',title:'看脫離基',hint:'離開後要穩定',ability:'判斷脫離基好不好，知道 –OH 要先質子化。',task:'排出 I⁻、Br⁻、Cl⁻、OH⁻ 的離去能力。',cards:['leaving'],uses:['warmup','s1','s5']},
 {id:'conditions',title:'看條件與路徑',hint:'溶劑、溫度、平衡與能量圖',ability:'依溶劑、溫度與平衡判斷路徑，讀懂一步或兩步的能量圖。',task:'說出溶劑與加熱各偏向哪一種反應。',cards:['energy','solvent','heat','equilibrium'],uses:['s1','s2','s3','s5','final']},
 {id:'product',title:'預測產物',hint:'構形、anti 與 Zaitsev／Hofmann',ability:'預測構形反轉、anti 消去與主要的烯。',task:'寫出 SN2 的構形與 E2 的主要烯。',cards:['rs','newman','alkene','chair'],uses:['s1','s2','s3','s5','final']}
];

// The short task that shows a station was understood (the map shows it next to the goal).
export const PATH_TASKS={
 warmup:'每張卡完成一題即時檢查；全部答對才算完成。',
 final:'判斷表 16 格全部填對；九種反應交錯出題：選出反應類型與依據、寫出產物、畫出箭頭。',
 assessment:'後測或延後測：不提示、不給正誤，遇到沒看過的受質也要能判斷。'
};
// Concepts to revisit when a mixed-practice item of this type, or an arrow check, goes wrong.
export const REVIEW_BY_TYPE={
 sn2:['sterics','nucleophile','solvent'],sn1:['carbocation','leaving','solvent'],e2:['basicity','newman','alkene'],e1:['carbocation','basicity','heat'],
 addhx:['nucleophile','carbocation'],hydration:['carbocation','acidbase'],halogenation:['nucleophile','polarity'],rearrangement:['carbocation','energy'],dehydration:['acidbase','leaving']
};
export const ARROW_REVIEW=['arrows','formal','acidbase'];

export const STAGES=[
 {id:'s1',task:'判斷 SN2／SN1 對照、補上「受質是哪一級」分支、畫出兩種機構的箭頭，並完成 6 題混合練習。',title:'取代的兩條路：SN2 與 SN1',short:'SN2／SN1',goal:'看受質級數、親核劑與溶劑，判斷是 SN2 還是 SN1，畫出箭頭，並預測構形（反轉，或從兩面進攻）。',needs:['degree','hybrid','nucleophile','leaving'],
  primers:[
    {id:'sterics',review:['hybrid'],cue:'受質',judge:'SN2 還是 SN1：受質的背面擋不擋得住親核劑。',title:'立體障礙：周圍越擠，越難靠近',pages:[363],demos:[{label:'甲基：背面很空',kind:'sn2',example:'sn2-methyl'},{label:'二級：背面較擠',kind:'sn2',example:'sn2-secondary'}],body:['原子與原子團都會佔據空間。反應中心周圍的取代基越多、越大，試劑就越難靠近要進攻的位置，這叫立體障礙（steric hindrance）。','SN2 的親核劑必須從背面直接靠近 α 碳，所以速率是甲基 > 一級 > 二級，三級幾乎不反應。','試劑本身也會擠：t-BuO⁻ 很大，難以靠近碳，卻仍能拔取外側容易接近的氫，所以常當作鹼。'],example:'CH₃Br 的背面只有三個小小的 H；(CH₃)₃CBr 的背面被三個甲基擋住。',check:check('為什麼三級鹵烷幾乎不走 SN2？',['三個烷基擋住背面，親核劑無法靠近 α 碳','三級碳沒有脫離基','三級碳帶負電'],0,'SN2 需要從背面進攻；三個烷基造成的立體障礙把這條路擋住了。')},
    {id:'carbocation',review:['hybrid','formal'],cue:'受質',judge:'SN1／E1 走不走得通：受質形成的碳陽離子穩不穩定。',title:'碳陽離子：平面、缺電子、有穩定順序',pages:[244,245,252],widget:{kind:'cation-cloud',initial:'methyl'},body:['碳陽離子是只有三個鍵、帶正電的碳；它的平面形狀與空的 p 軌域見暖身「混成與形狀」。','穩定性：三級 > 二級 > 一級 > 甲基。相連的烷基越多，越能透過超共軛與誘導效應分散正電。越穩定的碳陽離子越容易形成。','用下面四個模型驗證：甲基、一級、二級、三級並排，中心碳的藍色（缺電子程度）逐格變淡；打開「空 p 軌域與超共軛」可看到能分享電子的鄰近 C–H 鍵變多。','本課程有五種反應會經過碳陽離子：SN1、E1、HX 加成、酸催化加水、醇的脫水；重排也是碳陽離子的行為。'],example:'(CH₃)₃C⁺ 是三級碳陽離子，比 CH₃CH₂⁺（一級）穩定得多。',check:check('哪一個碳陽離子最穩定？',['(CH₃)₃C⁺（三級）','(CH₃)₂CH⁺（二級）','CH₃CH₂⁺（一級）'],0,'相連烷基越多，正電被分散得越好：三級 > 二級 > 一級。')},
    {id:'energy',review:['carbocation'],cue:'路徑',judge:'一步完成（SN2、E2），還是經過中間體（SN1、E1）。',title:'能量圖：過渡態與中間體',pages:[207,208,210],widget:{kind:'energy'},body:['反應進行時，能量先升後降。能量的最高點是過渡態（transition state，‡）：鍵正在斷、也正在形成，無法分離出來。','兩個過渡態之間的谷底是中間體（intermediate），例如碳陽離子：它短暫存在，可以被接住或繼續反應。','一步反應只有一個過渡態、沒有中間體（SN2、E2）；兩步反應中間有中間體（SN1、E1、HX 加成）。能障最高的那一步最慢，叫速率決定步驟。'],example:'SN1 的第一步（C–Br 斷裂、形成碳陽離子）能障最高，所以速率只取決於受質，與親核劑無關。',check:check('碳陽離子在能量圖上位在哪裡？',['兩個過渡態之間的谷底（中間體）','能量最高點（過渡態）','反應物的起點'],0,'中間體在谷底、可以短暫存在；過渡態是最高點，無法分離。')},
    {id:'solvent',review:['polarity'],cue:'條件',judge:'SN2 還是 SN1：溶劑讓親核劑裸露，還是幫忙穩定離子。',title:'溶劑：質子性與非質子性',pages:[76,77,367],body:['質子性溶劑（水、甲醇、乙醇）有 O–H，可以用氫鍵包住陰離子、穩定離子，也常同時當弱親核劑——有利碳陽離子路徑。','極性非質子性溶劑（acetone、DMSO、DMF）沒有 O–H／N–H，陰離子親核劑不被氫鍵包住、比較「裸露」，有利 SN2。'],example:'NaI 在 acetone 中進行 SN2；三級溴烷在水中走 SN1。',check:check('acetone 有 C–H，為什麼仍算非質子性溶劑？',['它沒有 O–H 或 N–H 氫鍵供體','它完全不含氫','含氧的溶劑都是非質子性'],0,'「非質子性」看的是有沒有能形成氫鍵的 O–H／N–H。')}
  ],
  newTypes:['sn2','sn1'],
  concepts:[
   {title:'SN2：一步完成，從背面進攻',pages:[361,363,367],body:['親核劑從脫離基的正背面進攻 α 碳，新鍵形成與舊鍵斷裂在同一步，沒有中間體。'],cues:[{see:'甲基、一級（二級較慢）',lean:'SN2 快',review:['sterics']},{see:'三級',lean:'不走 SN2：背面被擋住',review:['sterics']},{see:'良好親核劑（I⁻、CN⁻、OH⁻）',lean:'有利 SN2',review:['nucleophile']},{see:'極性非質子性溶劑（acetone、DMSO）',lean:'有利 SN2',review:['solvent']}],example:'CH₃CH₂Br ＋ I⁻（acetone）→ CH₃CH₂I ＋ Br⁻',details:[{id:'rs',review:['hybrid'],cue:'產物',judge:'SN2 從背面進攻，構形反轉。',title:'R/S 與構形反轉',pages:[161,361],demos:[{label:'背面進攻後構形反轉（SN2）',kind:'sn2',example:'sn2-secondary'}],body:['R/S：依 CIP 規則排出四個取代基的優先序，讓最低優先序朝向遠離你的方向，1→2→3 順時針是 R、逆時針是 S。','背面進攻時，另外三個取代基會翻到另一側，像雨傘被風吹翻，這叫構形反轉（瓦登反轉）。新基團與舊脫離基的優先序位置相同時，R 會變成 S。','對照：SN1 經過平面碳陽離子，親核劑從上下兩面進攻，常得到兩種構形的混合物。'],example:'(R)-2-溴丁烷經 SN2 得到 (S)-2-丁醇：OH 與 Br 都是優先序最高的基團，位置翻到另一側。',check:check('立體中心經 SN2 反應後，構形會怎麼變？',['反轉：另外三個基團翻到另一側','保持不變','一定變成兩種構形各半'],0,'親核劑從背面進攻，構形反轉；兩種構形的混合是 SN1 經平面碳陽離子才會出現。')}]},
   {title:'SN1：先離開，再接住',pages:[375,385],body:['脫離基先離開，形成平面碳陽離子；接著弱親核劑（常是溶劑本身，如水、甲醇）從上下兩面進攻；若進攻的是中性分子，最後還要去質子化。親核劑強弱不影響速率。'],cues:[{see:'三級（能形成穩定碳陽離子）',lean:'SN1',review:['carbocation']},{see:'弱親核的質子性溶劑（水、甲醇）',lean:'有利 SN1',review:['solvent']},{see:'經過中間體、有兩個過渡態',lean:'分步反應',review:['energy']},{see:'平面碳陽離子兩面都能接',lean:'兩種構形的混合',review:['rs']}],example:'(CH₃)₃CBr ＋ H₂O → (CH₃)₃COH ＋ HBr（經 (CH₃)₃C⁺）'}
  ],
  pairs:[{a:'sn2-ethyl',b:'sn1-water',diff:'換了受質（一級 → 三級）與親核劑／溶劑（I⁻／acetone → 水）'},{a:'sn2-secondary',b:'sn1-tertamyl',diff:'二級＋良好親核劑 對 三級＋水'},{a:'sn2-methyl',b:'sn1-methanol',diff:'甲基＋OH⁻ 對 三級＋甲醇'},{a:'sn2-cyanide',b:'sn1-benzylic',diff:'一級＋CN⁻／DMSO 對 能形成穩定碳陽離子的三級苄基＋水'}],
  branches:[{node:'degree',ids:['degree-low','degree-high'],prompt:'依剛才的對比，「受質是哪一級？」這一格底下該寫什麼？',options:['甲基／1°／2° 搭配良好親核劑 → SN2；3° 搭配弱親核溶劑 → SN1','有鹵素就 SN1，有負電就 SN2','加熱就 SN1，室溫就 SN2'],answer:0,feedback:'受質能不能被背面接近、能不能形成穩定碳陽離子，是分流 SN2 與 SN1 的第一把尺；再搭配親核劑與溶劑。'}],
  compare:['primary-sn2-vs-sn1','tertiary-sn1-vs-sn2'],arrowKinds:['sn2','sn1'],mixCount:6},
 {id:'s2',task:'找出與脫離基 anti 的 β-H 並判斷主要的烯，畫出 E2 的三支箭頭，完成 6 題混合練習。',title:'加入消去：E2',short:'＋E2',goal:'遇到強鹼就考慮 E2：找出與脫離基 anti 的 β-H，再用 Zaitsev 規則選出主要的烯。',needs:['degree','acidbase'],
  primers:[
    {id:'basicity',review:['nucleophile','acidbase'],cue:'試劑',judge:'取代還是消去：試劑去進攻碳，還是去拔 β-H。',title:'同一個試劑：進攻碳，還是拔氫？',pages:[365,380,381],visual:'base',demos:[{label:'OH⁻ 進攻碳（取代）',kind:'sn2',example:'sn2-methyl'},{label:'EtO⁻ 拔 β-H（消去）',kind:'e2',example:'e2-butane'}],body:['親核性描述「進攻碳」的能力，鹼性描述「接受質子」的能力。同一個試劑可能兩者都有。','強鹼：OH⁻、RO⁻（如 EtO⁻）、體積大的 t-BuO⁻。良好親核劑但弱鹼：I⁻、Br⁻、CN⁻、HS⁻。弱親核也弱鹼：H₂O、ROH。','強鹼遇到可拔 β-H 的受質，消去（E2）就成為重要選項；弱鹼弱親核的溶劑則讓碳陽離子路徑有機會發生。'],example:'EtO⁻ 的電子對指向 Cα 就是親核進攻；指向 β-H 就是鹼。',check:check('下列哪一個是良好親核劑但弱鹼？',['I⁻','t-BuO⁻','EtO⁻'],0,'I⁻ 很容易進攻碳，卻很難拔走質子；t-BuO⁻ 與 EtO⁻ 都是強鹼。')}
  ],
  newTypes:['e2'],
  concepts:[
   {title:'E2：鹼拔 β-H，三組電子同時動',pages:[380,381,382],body:['強鹼的孤對電子接受 β-H，C–H 鍵電子形成 C=C 的 π 鍵，C–X 鍵電子帶著脫離基離開——三件事在同一步完成，沒有碳陽離子。'],cues:[{see:'強鹼（OH⁻、EtO⁻、t-BuO⁻）＋有 β-H',lean:'考慮 E2',review:['basicity']},{see:'三級＋強鹼',lean:'E2（背面被擋住，無法 SN2）',review:['sterics']},{see:'β-H 能和脫離基 anti',lean:'E2 才容易發生',review:['newman']},{see:'有多種 β-H',lean:'Zaitsev：取代較多的烯；t-BuO⁻ 得取代較少的烯（Hofmann）',review:['alkene']}],example:'2-溴丁烷 ＋ NaOEt（乙醇、加熱）→ 2-丁烯（主要）',details:[{id:'newman',review:['degree'],cue:'產物',judge:'E2 要拔哪一個 β-H——和脫離基 anti 的那一個。',title:'Newman 投影與 anti 構形',pages:[108,381,382],demos:[{label:'β-H 與 Br 呈 anti 時拔氫（E2）',kind:'e2',example:'e2-butane'}],body:['Newman 投影：沿一條 C–C 鍵看過去，前碳的三個鍵交會於圓心，後碳的三個鍵畫在圓外。轉動這條鍵，就能看到兩個碳上的基團怎麼相對。','E2 中被拔的 β-H 與脫離基最好在同一平面、方向相反（anti-periplanar，Newman 投影中相隔 180°），C–H 鍵的電子才能直接從背面推走 C–X 鍵。'],example:'沿 2-溴丁烷的 C2–C3 看：轉到 H 與 Br 相隔 180° 的構形，E2 才容易發生。',check:check('E2 最容易發生時，β-H 與脫離基在 Newman 投影中相隔幾度？',['180°（anti-periplanar）','60°（gauche）','0°（完全重疊）'],0,'兩者在同一平面、方向相反時，電子能從背面推走脫離基。')},
    {id:'alkene',review:['degree'],cue:'產物',judge:'有多種 β-H 時，主要得到哪一個烯。',title:'烯的穩定性與 Zaitsev 規則',pages:[235,378,399],body:['雙鍵碳上的烷基越多，烯越穩定：四取代 > 三取代 > 雙取代 > 單取代。','Zaitsev 規則：有多種 β-H 可以拔時，消去通常得到取代較多、較穩定的烯。','體積大的鹼（t-BuO⁻）是常見的例外：它較會拔取代較少、較容易接近的 β-H，得到取代較少的烯。（教學補充）這種取代較少的烯常被稱為 Hofmann 產物；原文習題 11-74 的 Hofmann 消去（戊胺得到 1-戊烯）也得到取代較少的烯。'],example:'2-溴丁烷消去時，2-丁烯（雙取代）通常比 1-丁烯（單取代）多。',check:check('依 Zaitsev 規則，2-溴-2-甲基丁烷消去的主要烯是？',['2-methyl-2-butene（三取代）','2-methyl-1-butene（雙取代）','1-butene'],0,'取代較多的雙鍵較穩定，通常是主要產物。')},
    {id:'chair',optional:true,cue:'產物',judge:'選讀：環上的 anti 消去。',title:'選讀：椅式環己烷上的 E2',pages:[133,383],body:['椅式環己烷的每個碳都有一個軸向（axial，上下直立）與一個赤道（equatorial，向外伸出）位置。','在環上，只有脫離基與 β-H 都在軸向、一上一下時（trans-diaxial），兩者才相隔 180°，E2 才容易發生；脫離基在赤道位置時，要先翻環。'],example:'氯在軸向時，相鄰碳上同樣在軸向、方向相反的 H 才能被拔走。',check:check('在椅式環己烷上，E2 需要脫離基與 β-H 在什麼位置？',['兩者都在軸向、方向相反（trans-diaxial）','兩者都在赤道位置','脫離基在赤道、H 在軸向'],0,'只有 trans-diaxial 時兩者才相隔 180°，符合 anti-periplanar。')}]},
   {title:'同一個受質，換試劑就換路徑',pages:[365,381,387],body:['I⁻ 是良好親核劑但弱鹼，遇到二級鹵烷走 SN2；EtO⁻ 是強鹼，遇到同一個二級鹵烷、加熱時以 E2 為主（SN2 仍可競爭）。'],example:'判斷時先問：試劑是不是強鹼？'}
  ],
  pairs:[{a:'sn2-secondary',b:'e2-butane',diff:'同一個受質 2-溴丁烷，只換試劑與溫度（NaI／acetone → NaOEt／乙醇加熱）'},{a:'sn1-tertamyl',b:'e2-tertamyl',diff:'同一個三級受質，只換試劑（水 → EtO⁻）'},{a:'sn2-cyanide',b:'e2-primary',diff:'一級受質：CN⁻（良好親核劑）對 t-BuO⁻（體積大的強鹼）'}],
  branches:[{node:'base',ids:['base-strong','base-weak'],prompt:'在「受質級數」之前，要先多問哪一個問題？',options:['試劑是不是強鹼？強鹼＋2°／3°（或體積大的鹼）→ E2','試劑有沒有鈉離子？有就 E2','溶劑是不是水？是就 E2'],answer:0,feedback:'強鹼會改變反應方向：先確認鹼性，再看受質級數。'}],
  compare:['bulky-e2-vs-sn2'],arrowKinds:['e2'],mixCount:6},
 {id:'s3',task:'比較碳陽離子被接住或失去 β-H，畫出 E1 的箭頭，完成 8 題混合練習。',title:'碳陽離子的另一條路：E1',short:'＋E1',goal:'碳陽離子形成後，依溫度與試劑判斷它被接住（SN1）還是失去 β-H（E1）。',needs:['carbocation','energy','acidbase'],
  primers:[
   {id:'heat',review:['energy'],cue:'條件',judge:'SN1 還是 E1：加熱讓消去的比例提高。',title:'為什麼加熱有利消去',pages:[204,205,387],body:['ΔG = ΔH − TΔS。ΔS 描述反應後分子變得多「自由」：粒子數變多時，ΔS 為正。','（教學補充）消去把一個受質變成烯、質子化的鹼與脫離基等更多粒子，ΔS 通常比取代大。溫度 T 越高，−TΔS 這一項越負，消去就越有利；所以 E1 常寫「加熱」，室溫下則 SN1 較多。'],example:'2-溴-2-甲基丁烷在乙醇中：室溫多得 SN1 的醚，加熱後烯的比例提高。',check:check('依 ΔG = ΔH − TΔS，為什麼升溫有利消去？',['消去的 ΔS 較大，T 越大，−TΔS 越負','升溫讓 ΔH 變成零','升溫讓碳陽離子無法形成'],0,'消去產生較多粒子、ΔS 較大；乘上溫度後，對 ΔG 的影響更大。')}
  ],
  newTypes:['e1'],
  concepts:[
   {title:'E1：和 SN1 共用同一個碳陽離子',pages:[385,387],body:['先和 SN1 一樣離解形成碳陽離子；接著不是被親核劑接住，而是由弱鹼（溶劑）拔走相鄰的 β-H，形成雙鍵。','SN1 幾乎總是同時競爭；加熱只改變比例，不保證唯一產物。'],cues:[{see:'三級＋弱鹼溶劑（乙醇）',lean:'先形成碳陽離子（和 SN1 相同）',review:['carbocation']},{see:'加熱',lean:'E1 比例提高',review:['heat']},{see:'有多種 β-H',lean:'Zaitsev：取代較多的烯',review:['alkene']}],example:'2-溴-2-甲基丁烷在乙醇中加熱 → 2-methyl-2-butene（主要）＋SN1 醚'}
  ],
  pairs:[{a:'sn1-tertamyl',b:'e1-tertamyl',diff:'同一個受質、同一個碳陽離子：水／室溫 對 乙醇／加熱'},{a:'e1-tertamyl',b:'e2-tertamyl',diff:'同一個受質：乙醇（弱鹼）加熱 對 EtO⁻（強鹼）'},{a:'sn1-water',b:'e1-tertbutyl',diff:'同一個第三丁基溴：水捕捉 對 乙醇加熱消去'},{a:'e1-methylpentane',b:'e2-propane',diff:'三級＋弱鹼加熱 對 二級＋強鹼'},{a:'e1-3methylpentane',b:'sn1-methanol',diff:'加熱求烯 對 室溫溶劑解'}],
  branches:[{node:'cation',ids:['cation-capture','cation-heat'],prompt:'碳陽離子形成以後，怎麼決定是 SN1 還是 E1？',options:['溶劑捕捉（如水、甲醇、室溫）→ SN1；弱鹼溶劑加熱、得到烯 → E1（兩者常競爭）','碳陽離子只會走 SN1','只要是三級就一定 E1'],answer:0,feedback:'SN1 與 E1 分享同一個中間體；條件（加熱、溶劑角色）改變的是兩者的比例。'}],
  compare:['heat-e1-vs-sn1'],arrowKinds:['e1'],mixCount:8},
 {id:'s4',task:'寫出三種加成的中間體與產物位置，畫出加成的箭頭，完成 8 題混合練習。',title:'烯當親核劑：三種加成',short:'加成',goal:'把 π 鍵當作電子來源，判斷中間體是碳陽離子還是鹵鎓離子，依馬可尼可夫規則或反式加成寫出產物。',needs:['nucleophile','carbocation','hybrid'],
  newTypes:['addhx','hydration','halogenation'],
  concepts:[
   {title:'π 鍵也能提供電子：HX 加成與馬可尼可夫規則',pages:[237,238,240,241,245],widget:{kind:'cation-cloud',initial:'primary'},body:['烯的 π 鍵電子比較鬆散，可以進攻 HX 的氫（親電子劑），形成碳陽離子；接著 X⁻ 接住碳陽離子。','馬可尼可夫規則：H 加到取代較少的雙鍵碳，X 接在取代較多的碳。原因是這樣形成的碳陽離子比較穩定（碳陽離子穩定性決定方向）。'],example:'(CH₃)₂C=CH₂ ＋ HBr → (CH₃)₃CBr'},
   {title:'酸催化加水：同一個碳陽離子，換水來接',pages:[267,268],body:['稀酸、大量水時，H₃O⁺ 先把質子給烯形成碳陽離子，水當親核劑接住，再去質子化得到醇；酸只是催化劑，最後再生。','方向和 HX 加成一樣（馬可尼可夫）：OH 接在取代較多的碳。'],example:'(CH₃)₂C=CH₂ ＋ H₂O（H₃O⁺）→ (CH₃)₃COH'},
   {title:'X₂ 加成：鹵鎓離子造成反式加成',pages:[263,264,265],body:['Br₂ 靠近 π 鍵時，形成三元環的溴鎓離子，而不是開放的碳陽離子。','第二個 Br⁻ 只能從溴鎓離子的背面進攻，所以兩個 Br 來自雙鍵的相反兩面：環烯得到反式（trans）產物。這也是為什麼 X₂ 加成不會有碳陽離子重排。'],example:'環戊烯 ＋ Br₂ → trans-1,2-二溴環戊烷'}
  ],
  pairs:[{a:'addhx-isobutylene',b:'e1-tertbutyl',diff:'起始物不同：烯＋HBr（加成）對 鹵烷在乙醇加熱（消去）——產物方向相反'},{a:'addhx-propene',b:'hyd-isobutylene',diff:'同樣經碳陽離子：HX 由 X⁻ 接住，稀酸水由水接住'},{a:'hyd-methylbutene',b:'halo-cyclopentene',diff:'H₃O⁺（碳陽離子）對 Br₂（溴鎓離子、反式）'},{a:'halo-ethene',b:'addhx-isobutylene',diff:'X₂ 對 HX：三元環中間體 對 碳陽離子'}],
  branches:[{node:'start',ids:['start-alkene'],prompt:'流程圖最上面要先分「起始物是什麼」。烯要接到哪一條？',options:['起始物是烯（C=C）而沒有脫離基 → 看試劑是 X₂、HX 還是稀酸水：加成','烯也要先數受質級數再選 SN1／SN2','烯加 HBr 一定是 E2'],answer:0,feedback:'烯沒有脫離基，π 鍵當親核劑：這是加成的入口。'},{node:'electrophile',ids:['el-x2','el-hx','el-h3o'],prompt:'烯遇到不同試劑時，怎麼分？',options:['X₂ → 鹵鎓離子、反式加成；HX → 碳陽離子、X 接取代多的碳；稀酸＋大量水 → 碳陽離子、加水得醇','三種試劑機構完全相同','X₂ 也經開放碳陽離子，所以可能重排'],answer:0,feedback:'先認出親電子劑，再判斷中間體：鹵鎓離子還是碳陽離子。'}],
  arrowKinds:['addhx','hydration','halogenation'],mixCount:8},
 {id:'s5',task:'判斷碳陽離子是否位移、醇脫水需要先質子化，畫出重排與脫水的箭頭，完成 8 題混合練習。',title:'碳陽離子的變身與逆反應：重排與脫水',short:'重排／脫水',goal:'判斷碳陽離子能否靠位移變得更穩定；把醇的脫水看成加水的逆反應，由條件決定方向。',needs:['leaving','acidbase','carbocation'],
  primers:[
   {id:'equilibrium',review:['acidbase'],cue:'條件',judge:'加水還是脫水：同一組平衡往哪個方向。',title:'平衡移動：同一組反應的兩個方向',pages:[204,205,604],body:['平衡常數告訴我們反應最後停在哪裡：ΔG° 為負，平衡偏向產物。','（教學補充）勒沙特列原理：增加某一邊的物質，平衡往另一邊移動；把產物移走，反應會繼續往產物方向進行。','烯＋水 ⇌ 醇：大量水、稀酸時往醇（加水）；濃酸、加熱並把生成的烯蒸出時，往烯（脫水）。'],example:'2-甲基-2-丁醇加 H₂SO₄ 加熱並蒸出烯，平衡持續往 2-methyl-2-butene 的方向移動。',check:check('想讓醇脫水得到烯，下列哪個做法最有幫助？',['用濃酸、加熱，並把生成的烯蒸出','加入大量的水','降溫並稀釋酸'],0,'移走產物、減少水，平衡就往脫水的方向移動。')}
  ],
  newTypes:['rearrangement','dehydration'],
  concepts:[
   {title:'碳陽離子重排：1,2-氫或甲基位移',pages:[245,248,249],widget:{kind:'cation-cloud',initial:'secondary'},body:['若先形成的碳陽離子旁邊的碳上有 H 或烷基，它可以帶著鍵電子對移到帶正電的碳，讓正電轉到相鄰碳。當這樣能把二級變成三級碳陽離子時，重排就會發生。','重排是碳陽離子中間體存在的證據；不經碳陽離子的 X₂ 加成、SN2、E2 不會重排。原文的兩個例子都得到重排與未重排產物的混合物。'],example:'3-甲基-1-丁烯 ＋ HCl → 2-chloro-2-methylbutane（重排）＋ 2-chloro-3-methylbutane'},
   {title:'醇的酸催化脫水：加水的逆反應',pages:[262,604,605],body:['醇在濃酸、加熱下：OH 先質子化成好脫離基 –OH₂⁺，水離開形成碳陽離子，再由水拔 β-H 形成烯——這是 E1。三級醇最容易。','它和酸催化加水是同一組平衡的兩個方向：大量水、稀酸 → 加水；濃酸、加熱、把烯蒸出 → 脫水。產物和 E1 一樣依 Zaitsev 規則。'],example:'2-甲基-2-丁醇（H₂SO₄、加熱）→ 2-methyl-2-butene（主要）'}
  ],
  pairs:[{a:'rearr-hydride',b:'addhx-propene',diff:'都是烯＋HCl：先得到的二級碳陽離子旁邊，有沒有能讓它變三級的 H'},{a:'rearr-methyl',b:'halo-ethene',diff:'經碳陽離子會重排；經溴鎓離子不會'},{a:'dehyd-tertbutanol',b:'hyd-isobutylene',diff:'互為逆反應：醇＋濃酸加熱 對 烯＋稀酸大量水'},{a:'dehyd-tertamyl',b:'e2-tertamyl',diff:'同樣得到 2-methyl-2-butene：醇經碳陽離子（E1）對 鹵烷＋強鹼（E2）'}],
  branches:[{node:'shift',ids:['shift-yes','shift-no'],prompt:'碳陽離子形成以後，還要多檢查哪一件事？',options:['旁邊的 H 或甲基移過來能不能得到更穩定的碳陽離子？能 → 重排後再被接住','所有碳陽離子一定重排','只有 SN2 會重排'],answer:0,feedback:'重排的動力是「變得更穩定」，例如二級 → 三級。'},{node:'start',ids:['start-alcohol'],prompt:'起始物是醇＋濃酸、加熱時，接到哪裡？',options:['醇的酸催化脫水（E1）：質子化 → 失水 → 失 β-H','醇的 OH 直接被 SN2 取代','醇＋酸一定加水'],answer:0,feedback:'OH 先質子化才能離開；加熱、濃酸讓平衡偏向烯。'}],
  arrowKinds:['rearrangement','dehydration'],mixCount:8}
];

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
 {id:'start',stage:'s1',question:'起始物是什麼？',branches:[{id:'start-halide',stage:'s1',label:'鹵烷（C–X，有脫離基）',to:'base'},{id:'start-alkene',stage:'s4',label:'烯（C=C），遇到親電子劑',to:'electrophile'},{id:'start-alcohol',stage:'s5',label:'醇＋濃酸、加熱',to:'dehydration'}]},
 {id:'base',stage:'s2',question:'試劑是強鹼嗎？',branches:[{id:'base-strong',stage:'s2',label:'是：EtO⁻、OH⁻、t-BuO⁻ 等強鹼，受質為 2°／3°，或鹼體積很大',to:'e2'},{id:'base-weak',stage:'s2',label:'否：良好親核劑但弱鹼（I⁻、CN⁻），或弱親核溶劑（H₂O、ROH）',to:'degree'}]},
 {id:'degree',stage:'s1',question:'受質是哪一級？',branches:[{id:'degree-low',stage:'s1',label:'甲基、1° 或 2°，搭配良好親核劑（非質子性溶劑更有利）',to:'sn2'},{id:'degree-high',stage:'s1',label:'3°（或能形成穩定碳陽離子），弱親核劑、質子性溶劑',to:'cation'}]},
 {id:'cation',stage:'s3',question:'碳陽離子形成後，條件偏向哪邊？',branches:[{id:'cation-capture',stage:'s3',label:'溶劑捕捉（H₂O、MeOH，室溫）',to:'sn1'},{id:'cation-heat',stage:'s3',label:'弱鹼溶劑、加熱，得到烯',to:'e1'}]},
 {id:'electrophile',stage:'s4',question:'試劑是哪一種親電子劑？',branches:[{id:'el-x2',stage:'s4',label:'X₂（Br₂、Cl₂）：鹵鎓離子，反式加成',to:'halogenation'},{id:'el-hx',stage:'s4',label:'HX：碳陽離子，X 接取代較多的碳',to:'shift'},{id:'el-h3o',stage:'s4',label:'稀酸＋大量水（H₃O⁺）：碳陽離子，加水得醇',to:'shift'}]},
 {id:'shift',stage:'s5',question:'碳陽離子旁的 H 或甲基移過來，能得到更穩定的碳陽離子嗎？',branches:[{id:'shift-yes',stage:'s5',label:'能（例如二級旁接三級碳）→ 重排',to:'rearrangement'},{id:'shift-no',stage:'s5',label:'不能 → 直接被接住',to:'addhx|hydration'}]}
];
export const stageIndex=id=>id==='warmup'?-1:id==='final'?STAGES.length:STAGES.findIndex(s=>s.id===id);
export const unlockedTypes=stageId=>STAGES.slice(0,Math.min(STAGES.length,stageIndex(stageId)+1)).flatMap(s=>s.newTypes);

const item=(id,type,substrate,reagent,conditions,reasons,products,path,explain,example=null)=>({id,type,substrate,reagent,conditions,reasons,products,path,explain,example});
// reasons[0] and products[0] are correct; the UI shuffles with a fixed seed per item.
export const ITEMS=[
 item('sn2-a','sn2','CH₃Br（溴甲烷）','NaCN','DMSO，25 °C',['甲基受質位阻最小，CN⁻ 是良好親核劑，DMSO 為極性非質子性溶劑','甲基碳陽離子很穩定','CN⁻ 是強鹼，會拔 β-H'],['CH₃C≡N（acetonitrile）＋ Br⁻','CH₂=CH₂','CH₃OH'],['start-halide','base-weak','degree-low'],'甲基沒有 β-H 也幾乎不形成碳陽離子；CN⁻ 從背面一步取代。','sn2-cyanide'),
 item('sn2-b','sn2','1-溴丁烷','NaI','acetone，25 °C',['一級受質、I⁻ 良好親核劑且弱鹼、acetone 非質子性','一級碳陽離子穩定，先離解','I⁻ 是強鹼，走消去'],['1-iodobutane ＋ Br⁻','1-butene','1-butanol'],['start-halide','base-weak','degree-low'],'一級、背面暢通、親核劑好：典型 SN2。','sn2-ethyl'),
 item('sn2-c','sn2','(S)-2-溴戊烷','NaI','acetone，25 °C',['二級受質搭配良好親核劑與非質子性溶劑，背面進攻造成構形反轉','二級一定先形成碳陽離子','I⁻ 會拔 β-H 形成烯'],['(R)-2-iodopentane（構形反轉）','(S)-2-iodopentane（構形保留）','2-pentene'],['start-halide','base-weak','degree-low'],'背面進攻翻轉構形；本例 I 與 Br 的優先序位置相同，所以 S 變 R。','sn2-secondary'),
 item('sn2-d','sn2','CH₃Cl（氯甲烷）','NaI','acetone',['甲基受質最適合背面進攻，I⁻ 是良好親核劑','甲基只能走 SN1','沒有 β-H 所以走 E2'],['CH₃I ＋ Cl⁻','CH₃OH','不反應'],['start-halide','base-weak','degree-low'],'甲基鹵化物只能被取代；I⁻ 在 acetone 中親核性強。','sn2-ethyl'),
 item('sn2-e','sn2','1-溴丙烷','NaCN','DMF',['一級受質，CN⁻ 良好親核劑，DMF 非質子性溶劑','一級碳陽離子容易形成','DMF 是質子性溶劑，有利 SN1'],['butanenitrile（CH₃CH₂CH₂CN）','propene','1-propanol'],['start-halide','base-weak','degree-low'],'新的 C–C 鍵讓碳鏈多一個碳；電子由 CN⁻ 的碳端提供。','sn2-cyanide'),
 item('sn1-a','sn1','(CH₃)₃CBr（第三丁基溴）','CH₃OH（溶劑）','室溫，溶劑解',['三級受質形成穩定碳陽離子，甲醇是弱親核的質子性溶劑','三級背面最容易接近','甲醇是強鹼'],['tert-butyl methyl ether（(CH₃)₃COCH₃）','2-methylpropene（唯一產物）','(CH₃)₃COH'],['start-halide','base-weak','degree-high','cation-capture'],'甲醇的氧接住碳陽離子後再去質子化；E1 可少量競爭。','sn1-methanol'),
 item('sn1-b','sn1','2-氯-2-甲基丁烷','H₂O','室溫，含水溶劑',['三級受質、弱親核的質子性溶劑：先離解再被水捕捉','水是強親核劑，背面進攻','水會拔 β-H，只得烯'],['2-methyl-2-butanol','2-methyl-2-butene（唯一）','1-chloro-2-methylbutane'],['start-halide','base-weak','degree-high','cation-capture'],'碳陽離子被水接住，最後去質子化得到醇。','sn1-tertamyl'),
 item('sn1-c','sn1','3-溴-3-甲基戊烷','CH₃CH₂OH（溶劑）','室溫，分析取代產物',['三級受質在弱親核、質子性的乙醇中離解，乙醇捕捉碳陽離子','乙醇是強鹼，走 E2','三級受質走 SN2'],['3-ethoxy-3-methylpentane','3-methyl-2-pentene（唯一）','3-methylpentane'],['start-halide','base-weak','degree-high','cation-capture'],'室溫溶劑解以取代為主；加熱才會讓 E1 比例明顯提高。'),
 item('sn1-d','sn1','PhCH(Cl)CH₃（1-氯-1-苯基乙烷）','H₂O／acetone','室溫',['苄基碳陽離子有共振穩定，水是弱親核的質子性溶劑','二級受質一定 SN2','水是強鹼'],['1-phenylethanol（兩面進攻，接近外消旋）','styrene（唯一）','(R)-1-phenylethanol（完全反轉）'],['start-halide','base-weak','degree-high','cation-capture'],'苄基雖是二級，但正電可分散到苯環，SN1 可行；平面碳陽離子兩面都能被接近。'),
 item('sn1-e','sn1','(CH₃)₃CBr','H₂O','室溫',['三級受質、水為弱親核質子性溶劑','三級受質背面暢通','水會把 Br 氧化'],['tert-butanol ＋ HBr','isobutane','1-bromo-2-methylpropane'],['start-halide','base-weak','degree-high','cation-capture'],'與本課程 SN1 例子相同的三步：離解、水進攻、去質子化。','sn1-water'),
 item('e2-a','e2','2-溴丙烷','NaOEt','乙醇，加熱',['二級受質＋強鹼 EtO⁻＋加熱：鹼拔 β-H，一步消去','EtO⁻ 是弱鹼，走 SN1','二級碳陽離子先形成'],['propene','2-ethoxypropane（唯一）','2-propanol'],['start-halide','base-strong'],'強鹼使 E2 為主；SN2 仍可能少量競爭。','e2-propane'),
 item('e2-b','e2','2-溴-2-甲基丁烷','KOH','乙醇，加熱',['三級受質無法 SN2，強鹼 OH⁻ 直接拔 β-H','三級受質一定 SN1','OH⁻ 是良好脫離基'],['2-methyl-2-butene（主要）與 2-methyl-1-butene','2-methyl-2-butanol（唯一）','2-methylbutane'],['start-halide','base-strong'],'原文習題指出會得到兩種烯；取代較多者為主（Zaitsev）。','e2-tertamyl'),
 item('e2-c','e2','1-溴-2-甲基丙烷','KOtBu（t-BuO⁻）','t-BuOH，加熱',['體積大的強鹼難以進攻碳，改拔 β-H','一級受質只能 SN2','t-BuO⁻ 是弱鹼'],['2-methylpropene','1-tert-butoxy-2-methylpropane（主要）','2-methyl-1-propanol'],['start-halide','base-strong'],'一級受質通常偏 SN2，但體積大的強鹼讓 E2 成為主要路徑。','e2-primary'),
 item('e2-d','e2','溴環己烷','NaOEt','乙醇，加熱',['二級受質＋強鹼＋加熱，需 β-H 與 Br 反式雙軸向','溴環己烷形成穩定三級碳陽離子','EtO⁻ 只會當親核劑'],['cyclohexene','ethoxycyclohexane（唯一）','cyclohexanol'],['start-halide','base-strong'],'環己烷 E2 需要 Br 在軸向、β-H 反式雙軸向。','e2-butane'),
 item('e2-e','e2','(CH₃)₃CBr','NaOEt','乙醇，加熱',['三級受質背面被擋住，強鹼 EtO⁻ 直接拔 β-H','三級＋強鹼走 SN2','EtO⁻ 先形成碳陽離子'],['2-methylpropene','tert-butyl ethyl ether（主要）','isobutane'],['start-halide','base-strong'],'與 E1 不同：強鹼使消去在一步內完成，不等碳陽離子。','e2-tertamyl'),
 item('e1-a','e1','(CH₃)₃CBr','CH₃CH₂OH（溶劑，無強鹼）','加熱',['三級受質在弱鹼溶劑中先離解，加熱使失去 β-H 的比例提高','乙醇是強鹼，一步消去','三級受質走 SN2'],['2-methylpropene（另有 SN1 醚競爭）','只有 tert-butyl ethyl ether','isobutane'],['start-halide','base-weak','degree-high','cation-heat'],'E1 與 SN1 共用碳陽離子；加熱有利消去但不保證唯一產物。','e1-tertbutyl'),
 item('e1-b','e1','3-溴-3-甲基戊烷','CH₃CH₂OH（溶劑）','加熱，得到烯',['三級受質離解成碳陽離子，弱鹼溶劑拔 β-H；產物依 Zaitsev','強鹼一步消去','二級受質 SN2'],['3-methyl-2-pentene（主要，含 E/Z）','3-methyl-1-pentene（唯一）','3-ethoxy-3-methylpentane（唯一）'],['start-halide','base-weak','degree-high','cation-heat'],'碳陽離子可自由旋轉，E/Z 都可能生成。','e1-3methylpentane'),
 item('e1-c','e1','2-氯-2-甲基丁烷','CH₃OH（溶劑）','加熱，得到烯',['三級受質在弱鹼溶劑中加熱：先形成碳陽離子，再失去 β-H','CH₃OH 是強鹼','氯是差的脫離基，所以不反應'],['2-methyl-2-butene（主要）','2-methyl-2-butanol','1-chloro-2-methylbutane'],['start-halide','base-weak','degree-high','cation-heat'],'與 SN1 同一個中間體，加熱提高消去比例。','e1-tertamyl'),
 item('e1-d','e1','1-溴-1-甲基環己烷','CH₃CH₂OH（溶劑）','加熱',['三級受質、弱鹼溶劑、加熱：E1，Zaitsev 得到取代較多的烯','強鹼一步 E2','一級受質 SN2'],['1-methylcyclohexene（主要）','methylenecyclohexane（唯一）','1-ethoxy-1-methylcyclohexane（唯一）'],['start-halide','base-weak','degree-high','cation-heat'],'環內三取代雙鍵比環外雙取代雙鍵穩定。'),
 item('e1-e','e1','2-溴-2,3-二甲基丁烷','CH₃CH₂OH（溶劑）','加熱',['三級受質在乙醇中加熱，碳陽離子失去 β-H，主要得到四取代烯','乙醇是強鹼','受質無 β-H'],['2,3-dimethyl-2-butene（主要）','2,3-dimethyl-1-butene（唯一）','2,3-dimethylbutane'],['start-halide','base-weak','degree-high','cation-heat'],'四取代雙鍵最穩定（Zaitsev）。'),
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
 item('rearr-a','rearrangement','3-甲基-1-丁烯','HBr','醚類溶劑',['先形成二級碳陽離子，相鄰 C–H 帶電子對移過來得到三級碳陽離子','直接形成三級碳陽離子','溴鎓離子不重排'],['2-bromo-2-methylbutane（重排）與 2-bromo-3-methylbutane','只有 1-bromo-3-methylbutane','2-methylbutane'],['start-alkene','el-hx','shift-yes'],'1,2-氫位移讓正電從二級移到三級碳。','rearr-hydride'),
 item('rearr-b','rearrangement','3,3-二甲基-1-丁烯','HBr','醚類溶劑',['二級碳陽離子旁的甲基帶著鍵電子移過來，形成三級碳陽離子','氫位移','不經碳陽離子'],['2-bromo-2,3-dimethylbutane（重排）與 3-bromo-2,2-dimethylbutane','只有 1-bromo-3,3-dimethylbutane','2,3-dimethylbutane'],['start-alkene','el-hx','shift-yes'],'相鄰碳沒有 H 可移，移動的是甲基。','rearr-methyl'),
 item('rearr-c','rearrangement','3-甲基-1-丁烯','HCl','醚類溶劑',['先得二級碳陽離子，1,2-氫位移變成三級碳陽離子，再被 Cl⁻ 接住','形成一級碳陽離子','Cl₂ 反式加成'],['2-chloro-2-methylbutane（重排）與 2-chloro-3-methylbutane 約等量','只有 1-chloro-3-methylbutane','2-methylbutane'],['start-alkene','el-hx','shift-yes'],'原文例子：重排與未重排產物約等量。','rearr-hydride'),
 item('rearr-d','rearrangement','乙烯基環己烷 C₆H₁₁CH=CH₂','HBr','醚類溶劑',['質子化得到二級碳陽離子，環上相鄰 C–H 位移，正電移到三級的環碳','直接得到三級碳陽離子','溴鎓離子'],['1-bromo-1-ethylcyclohexane（重排）','只有 (1-bromoethyl)cyclohexane','bromocyclohexane'],['start-alkene','el-hx','shift-yes'],'遠遷移：環上的氫也能 1,2-位移。重排與未重排產物都可能生成。','rearr-hydride'),
 item('rearr-e','rearrangement','3,3-二甲基-1-丁烯','H₂O，H₂SO₄（催化）','稀酸、大量水',['加水同樣經碳陽離子，二級碳陽離子經甲基位移變三級，再被水捕捉','鹵鎓離子不重排','醇的脫水'],['2,3-dimethyl-2-butanol（重排產物為主）','只有 3,3-dimethyl-1-butanol','只有 3,3-dimethyl-2-butanol（不重排）'],['start-alkene','el-h3o','shift-yes'],'只要經過碳陽離子就要檢查重排，加水也不例外。','rearr-methyl'),
 item('dehyd-a','dehydration','(CH₃)₃COH（第三丁醇）','H₂SO₄','加熱',['OH 質子化成好脫離基，失水成三級碳陽離子，再失去 β-H（E1）','OH⁻ 直接離開','稀酸大量水，所以加水'],['2-methylpropene ＋ H₂O','tert-butyl hydrogen sulfate（主要）','isobutane'],['start-alcohol'],'三級醇最容易脫水。','dehyd-tertbutanol'),
 item('dehyd-b','dehydration','2-甲基-2-丁醇','H₂SO₄','加熱',['三級醇經 E1 脫水，Zaitsev 得到取代較多的烯','強鹼一步 E2','醇被 SN2 取代'],['2-methyl-2-butene（主要）','2-methyl-1-butene（唯一）','2-methylbutane'],['start-alcohol'],'原文：得到 2-methyl-2-butene 而不是 2-methyl-1-butene 為主。','dehyd-tertamyl'),
 item('dehyd-c','dehydration','1-甲基環己醇','H₂SO₄','加熱',['質子化、失水、失 β-H；環內三取代烯最穩定','形成二級碳陽離子','加水'],['1-methylcyclohexene（主要）','methylenecyclohexane（唯一）','1-methylcyclohexanol（不變）'],['start-alcohol'],'原文以 1-甲基環己醇說明脫水。','dehyd-tertamyl'),
 item('dehyd-d','dehydration','3-甲基-3-戊醇','H₂SO₄','加熱',['三級醇經碳陽離子失去 β-H；可得 E/Z 混合','一步 E2','SN1 得到醚'],['3-methyl-2-pentene（主要，E/Z）','3-methyl-1-pentene（唯一）','3-methylpentane'],['start-alcohol'],'碳陽離子路徑沒有單一 anti 要求，E/Z 都會形成。','dehyd-tertamyl'),
 item('dehyd-e','dehydration','2,3-二甲基-2-丁醇','H₃PO₄','加熱',['三級醇 E1 脫水，Zaitsev 得到四取代烯','醇直接當親核劑','稀酸加水'],['2,3-dimethyl-2-butene（主要）','2,3-dimethyl-1-butene（唯一）','2,3-dimethylbutane'],['start-alcohol'],'四取代雙鍵最穩定。','dehyd-tertamyl')
];
export const itemsFor=types=>ITEMS.filter(i=>types.includes(i.type));

/** Weakness-weighted, interleaved pick. history: [{item,type,mech}] newest last. */
export function pickItem(types,history,random=Math.random){
 const pool=itemsFor(types);if(!pool.length)return null;
 const recent=t=>history.filter(h=>h.type===t).slice(-3),last=history.at(-1)?.type;
 const weights=types.map(t=>{const r=recent(t);let w=1+(r.length?0:1.5)+3*r.filter(h=>!h.mech).length;if(t===last&&types.length>1)w*=.25;return w;});
 let x=random()*weights.reduce((a,b)=>a+b,0),type=types.at(-1);for(let i=0;i<types.length;i++){x-=weights[i];if(x<=0){type=types[i];break;}}
 const seen=new Map(history.map((h,i)=>[h.item,i])),options=pool.filter(i=>i.type===type).sort((a,b)=>(seen.get(a.id)??-1)-(seen.get(b.id)??-1));
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
