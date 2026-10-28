import {BOOK, CARD_STATIONS, STAGES} from './course-path.js';
import {islandNodes, nodeScreens, islandBuildings, cardLocation} from './island-map.js';
import {STATION_INFO} from './stations-v4.js';
import {REACTION_OVERVIEWS} from './concept-lessons.js';

// Keep the legacy final station and its answers in the stored course; hide it only in navigation.
export const KNOWLEDGE_CHAPTERS = BOOK.map(chapter => ({
  ...chapter, stations: chapter.stations.filter(station => station.id !== 'final')
})).filter(chapter => chapter.stations.length);
export const KNOWLEDGE_IDS = KNOWLEDGE_CHAPTERS.flatMap(chapter => chapter.stations.map(station => station.id));
const IDS = new Set(KNOWLEDGE_IDS);
const cards = new Map([...CARD_STATIONS, ...STAGES.flatMap(stage => [
  ...(stage.primers || []), ...stage.concepts.flatMap(concept => concept.details || [])
])].map(card => [card.id, card]));
const stageById = new Map(STAGES.map(stage => [stage.id, stage]));
const plain = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const shortCard = id => cards.get(id)?.title.split('：')[0] || id;
const doneStation = (state, id) => islandNodes(id).every(node => state.explore.done[id]?.[node.id]);
const answered = (state, id) => Number.isInteger(state.warm.checks[id]?.choice);
const wrongCard = (state, id) => answered(state, id) && state.warm.checks[id].choice !== cards.get(id)?.check?.answer;

/** Direct conceptual dependencies, reviewed against the named cards and reaction lessons.
 * A scoped concept borrows only that content, not the entire mechanism of its host station.
 * Source order and review links do not establish conceptual necessity.
 */
const FOUNDATION_GUIDES = {
  lewis: {core: [], support: []},
  hybrid: {core: [
    ['lewis', '共價鍵與成鍵電子對', '路易士結構指出哪些電子參與成鍵；對照這些鍵的軌域方向，可以理解 sp³ 四面體、sp² 平面及 σ、π 鍵的差別。']
  ]},
  skeletal: {core: [
    ['lewis', '常見價數、鍵級與孤對電子', '讀骨架式時，要用常見價數與已畫出的鍵級補回碳上的氫，並把省略的孤對電子算回來。']
  ], support: [
    ['hybrid', '單鍵、雙鍵與空間形狀', '混成與形狀有助把平面畫出的單鍵、雙鍵對應到立體結構；骨架式的折線不代表所有碳都在同一平面。'],
    ['formal', '帶電原子的電子數', '補畫帶電碳、氧或氮時，形式電荷可檢查電子數，避免對帶電結構硬套中性原子的補氫規則。']
  ]},
  polarity: {core: [
    ['lewis', '共用電子對', '先知道一條共價鍵代表共用電子對，才能理解電負度不同時，電子密度為何偏向其中一端，形成部分正、負電。']
  ]},
  formal: {core: [
    ['lewis', '價電子、成鍵與非鍵結電子', '形式電荷要由中性原子的價電子數扣除分配到的電子；必須先分清鍵中的電子與孤對電子，才能正確記帳。']
  ]},
  resonance: {core: [
    ['lewis', '合法的鍵結與孤對電子', '畫共振式時只移動電子的表示，原子連接不變；路易士結構的價數與八隅體規則可排除不合法的畫法。'],
    ['formal', '電荷位置與總電荷', '共振式改變鍵與孤對電子的分配後，要重算各原子的形式電荷，並確認每張畫法的總電荷相同。']
  ], support: [
    ['hybrid', 'π 鍵與 p 軌域', 'π 鍵由 p 軌域側向重疊而成；這個空間模型有助理解為何相鄰的 π 電子或孤對電子可能分散，而非把共振想成原子移動。']
  ]},
  acidbase: {core: [
    ['lewis', '孤對電子與 H–A 鍵', '質子轉移時，鹼用孤對電子與 H 成鍵，原來 H–A 鍵的電子留給 A；先找出這兩對電子才能理解酸、鹼各做了什麼。'],
    ['formal', '接受或失去質子後的電荷', 'H₂O 接受質子會成為 H₃O⁺，失去質子則成為 OH⁻；形式電荷可檢查轉移前後的結構與總電荷。']
  ], support: [
    ['polarity', 'H–A 鍵的電子偏向', '鍵極性有助找出酸中可能接受鹼進攻的 H；酸強弱仍要比較共軛鹼及相同條件下的 pKa，不能只看部分電荷。']
  ]},
  functional: {core: [
    ['skeletal', '完整的原子連接', '辨認醇、醚、羧酸或烯，要先讀出省略的碳、氫與相鄰原子連接；不能只看到一個 O 或 OH 就決定官能基。']
  ], support: [
    ['hybrid', '飽和碳與雙鍵碳', 'sp³ 與 sp² 的區別有助辨認 OH 接在飽和碳上的醇，以及具有 C=O 的羧酸；兩者不能套用同一種反應。']
  ]},
  degree: {core: [
    ['skeletal', '碳骨架與相鄰碳', '碳的級數只數直接連接的碳；先補回骨架式省略的碳，才不會把 H 或 Br 誤算進一級、二級、三級。']
  ], support: [
    ['functional', '官能基與脫離基所在位置', '在鹵烷的取代、消去語境中，先找到帶脫離基的碳，再把它標為 α 碳，並找相鄰的 β 碳與 β-H。']
  ]},
  naming: {core: [
    ['skeletal', '連續碳鏈與支鏈連接', '選主鏈前必須沿真正連接的碳逐一數過，不能把畫得最水平的線或分子的總碳數直接當成最長鏈。'],
    ['functional', '烷基與取代基', '把甲基、乙基等烷基辨認成主鏈上的取代基，才能把支鏈名稱、位置與主鏈名稱組合成烷類名稱。']
  ]},
  'alcohol-name': {core: [
    ['functional', '醇的羥基與相鄰碳', '先確認 OH 接在飽和碳上而屬於醇，再選含帶羥基碳的主鏈，避免把羧酸的 OH 當成醇。'],
    ['naming', '主鏈、編號與支鏈', '醇沿用烷類的碳鏈與支鏈命名，再讓羥基取得較小位置編號，並用醇或 -ol 表示官能基。'],
    ['degree', '帶羥基碳的級數', '一級、二級、三級醇看的是帶 OH 的碳連了幾個碳；這項分類不能改成數氧連了幾個原子。']
  ]},
  conformation: {core: [
    ['hybrid', 'sp³ 四面體與單鍵方向', '沿 C–C 單鍵看 Newman 投影時，前、後碳各有三條朝外的鍵；四面體模型有助理解交錯與重疊的空間排列。'],
    ['skeletal', '指定觀察的 C–C 鍵', '先讀清楚哪兩個碳相連、各接哪些基團，再指定觀察方向，才能把同一結構正確轉成 Newman 投影。']
  ], support: [
    ['naming', '乙烷、丁烷與碳鏈位置', '辨認乙烷、丁烷等名稱及中央碳鏈，有助對照教材中的 anti、gauche 示範；命名本身不決定構形穩定性。']
  ]},
  chair: {core: [
    ['conformation', '空間排列、旋轉與構形能量', '椅式與翻環是在不改變原子連接下改變空間排列；構形概念可用來分清軸向、赤道向交換與順反關係保持不變。']
  ], support: [
    ['naming', '碳環與取代位置編號', '環己烷及 1,2、1,3、1,4 的編號有助定位取代基，再判斷它們朝上、朝下及軸向、赤道向的關係。']
  ]},
  chirality: {core: [
    ['hybrid', '四面體的成鍵方向', '本課程先判斷連著四種不同基團的四面體碳；理解鍵在空間的方向，才能判斷鏡像能否疊合與 R/S 排列。'],
    ['skeletal', '四個基團的完整連接', '比較 CIP 優先序時要沿各基團逐層讀結構，找第一個不同的原子，不能只看骨架式畫在紙面哪一側。']
  ], support: [
    ['conformation', '構形與組態的區分', '單鍵旋轉改變構形，不能因此認定掌性中心的組態反轉；把兩者分開，較容易理解 R/S 描述的是什麼。']
  ]},
  reactions: {core: [
    ['skeletal', '反應前後的原子與鍵結', '先讀出反應物、產物的連接差異，才能判斷是加成、消去、取代，還是原子連接重新安排的重排。'],
    ['functional', '反應部位與官能基變化', '辨認 C=C、C–X、OH 等部位，能把「形成雙鍵」「替換基團」等變化對應到正確的反應位置。']
  ], support: [
    ['polarity', '富電子與缺電子位置', '鍵極性有助理解極性反應中電子對往哪裡移動；同一種加成或取代分類仍可能具有不同機構。']
  ]},
  nucleophile: {core: [
    ['lewis', '孤對電子與 π 電子', '辨認親核劑時要找到可提供的電子對，可能來自孤對電子或 π 鍵；親核劑不一定帶負電。'],
    ['polarity', '可接受電子對的位置', '鍵極性可指出部分缺電子的碳或 H，協助找出親電子位置；是否能反應仍需檢查成斷鍵與空間條件。']
  ], support: [
    ['formal', '形式電荷與部分電荷', '形式電荷可協助辨認帶正、負電的粒子，但中性水也有孤對電子；不能把親核性、親電性完全等同於電荷正負。']
  ]},
  arrows: {core: [
    ['lewis', '電子對的實際來源', '完整彎箭頭必須從孤對電子或化學鍵出發，表示這一對電子形成新鍵或回到原子，不能從正電符號開始畫。'],
    ['formal', '成斷鍵後的電荷檢查', '畫完電子移動後要重新分配鍵與孤對電子，檢查每個原子的形式電荷及整體總電荷是否合理。'],
    ['nucleophile', '電子對的提供者與接受者', '先辨認親核與親電子位置，才能把彎箭頭從提供電子的一端畫向接受電子的一端，並補上必要的斷鍵箭頭。']
  ], support: [
    ['reactions', '成鍵、斷鍵與淨反應變化', '把每支彎箭頭造成的鍵結變化和反應前後對照，可檢查所畫機構是否真的得到題目要求的加成、消去或取代產物。']
  ]},
  energy: {core: [
    ['reactions', '淨反應與反應機構', '能量圖描述機構沿反應進度的變化，而不是只比較反應物與產物；先分清「發生什麼」與「分幾步發生」，才能解讀峰與谷。']
  ], support: [
    ['arrows', '每一步的成鍵與斷鍵', '把電子箭頭的一個基元步驟對照能量圖的一個峰，有助區分短暫的過渡態與可以位在谷底的中間體。']
  ]},
  'alkene-name': {core: [
    ['naming', '主鏈、位置與支鏈名稱', '烯沿用碳鏈命名，再選含雙鍵的主鏈、標出雙鍵位置，避免只按支鏈位置選編號方向。'],
    ['hybrid', '雙鍵與 π 鍵的方向限制', 'C=C 的 π 鍵使雙鍵不能像一般 C–C 單鍵自由旋轉，因此雙鍵兩端的基團安排可能需要 E/Z 區分。'],
    ['chirality', 'CIP 優先序（不要求完整 R/S）', 'E/Z 借用 CIP 規則，在雙鍵兩端各選優先序較高的基團，再比較同側或異側；不必先把這個烯判成具有掌性中心。', ['chirality']]
  ]},
  carbocation: {core: [
    ['hybrid', 'sp² 平面與空 p 軌域', '本課程常見碳陽離子中心是 sp² 平面，空的 p 軌域可接受電子對；這是理解親核捕捉與兩面進攻的空間基礎。'],
    ['formal', '缺電子碳的正電', '三個單鍵且沒有孤對電子的碳可帶 +1 形式電荷；先數電子，才能區分碳陽離子與一般中性四價碳。'],
    ['degree', '帶正電碳的取代程度', '先數帶正電碳直接連接的碳，才能比較一般烷基碳陽離子三級、二級、一級的穩定性趨勢。']
  ], support: [
    ['resonance', '分散正電的共振穩定', '對能與相鄰 π 系統共振的碳陽離子，正電可分散；這提醒我們不能只用三級、二級、一級排序處理所有結構。']
  ]},
  addhx: {core: [
    ['carbocation', '質子化後碳陽離子的穩定性', '比較烯的兩種質子化方向會形成哪個碳陽離子，再由較有利的中間體判斷一般 HX 加成的位置，並留意後續是否重排。'],
    ['nucleophile', 'π 鍵供電子、H 接受電子', 'HX 加成先由烯的 π 電子與 H 成鍵，再由 X⁻ 提供孤對電子捕捉碳陽離子；兩步的提供者與接受者不同。'],
    ['arrows', '質子化、斷 H–X 鍵與捕捉', '第一步配套畫出 π 電子與 H 成鍵、H–X 鍵電子回到 X；第二步再畫 X⁻ 捕捉碳陽離子，不能把兩步誤畫成同步。']
  ], support: [
    ['acidbase', '接受質子與共軛鹼', '把烯接受 H⁺、HX 留下 X⁻ 看作質子轉移，有助分清第一步的質子來源與第二步的親核粒子。'],
    ['energy', '中間體與分步路徑', '能量圖的谷底有助理解碳陽離子是分步機構中的中間體，而不是把所有加成當成同時完成。']
  ]},
  rearr: {core: [
    ['carbocation', '移位前後的穩定性', '先找帶正電的位置，再比較相鄰 H 或烷基移位後的碳陽離子是否更穩定；不能只因出現正電就一律判定重排。'],
    ['arrows', '整條鍵的電子連同基團移動', '重排的箭頭從相鄰 C–H 或 C–C 鍵指向缺電子碳，表示 H 或烷基連同鍵電子移位，不是單獨搬動正電符號。']
  ], support: [
    ['resonance', '移動原子與重畫電子的差別', '共振只改電子的畫法、原子骨架不變；重排會改變原子連接。對照兩者，可避免把重排步驟當成另一張共振式。']
  ]},
  halo: {core: [
    ['nucleophile', 'π 電子、鹵素與鹵離子的角色', '烯先提供 π 電子，後續由鹵離子提供孤對電子打開鹵鎓環；辨認每一步的電子提供者，才能讀懂 X₂ 加成。'],
    ['polarity', '反應中鹵素分子的電子偏移', 'X₂ 靠近富電子的烯時可被極化；先理解電子分布可受環境影響，才不會因 X₂ 原先對稱就判定不能發生極性加成。'],
    ['arrows', '形成鹵鎓環與背面開環', '用電子箭頭追蹤 X–X 斷裂、橋連鹵鎓離子形成及鹵離子開環，可區分此路徑與自由碳陽離子加成。']
  ], support: [
    ['hybrid', 'π 鍵的平面與兩側', '雙鍵碳的平面結構有助理解橋連中間體為何遮住一側，以及後續背面進攻所造成的 anti 加成。'],
    ['alkene-name', '雙鍵附近基團與產物方向', '辨認雙鍵兩端的基團後，較容易追蹤加成後的相對方向；環烯的 trans 產物與起始烯的 E/Z 名稱不能直接當成同一件事。']
  ]},
  hydration: {core: [
    ['acidbase', '質子化、去質子化與酸再生', '酸催化加水先把質子交給烯，水進攻後還要去質子化；追蹤質子的來回，才能理解酸為何在最後再生。'],
    ['carbocation', '加水方向與中間體穩定性', '先比較質子化形成的碳陽離子，再判斷水接在哪裡；若中間體能重排，不能只照原雙鍵的位置直接放 OH。'],
    ['nucleophile', '水用孤對電子成鍵', '水雖然中性，氧仍能提供孤對電子捕捉碳陽離子；成鍵後的氧帶正電，還需失去質子才成為中性醇。'],
    ['arrows', '三階段電子對的去向', '把烯的質子化、水進攻及去質子化各自畫清楚，才能同時檢查碳、氧的鍵數與總電荷。']
  ], support: [
    ['rearr', '水捕捉前的重排檢查', '碳陽離子形成後，先檢查相鄰基團能否移位成更穩定的中間體，再決定最後 OH 所在的碳。'],
    ['alcohol-name', '產物的羥基位置與名稱', '讀出加水產物中 OH 所在的碳，再用醇的編號與命名規則，把機構預測的結構轉成名稱。']
  ]},
  'halide-name': {core: [
    ['naming', '碳鏈、編號與取代位置', '鹵素在命名中作為取代基，要把鹵素位置與碳鏈、其他支鏈一起編號，才能由名稱還原鹵烷結構。'],
    ['functional', '鹵素接在哪一類碳上', '先辨認鹵素與碳的完整連接，才能區分本課程常用的鹵烷與鹵素直接接在雙鍵碳上的結構。'],
    ['degree', '帶鹵素碳的一級、二級、三級', '鹵烷級數看帶鹵素碳直接連幾個碳，不是數分子裡有幾個鹵素；這也為後續反應條件判斷提供結構資訊。']
  ]},
  sn2: {core: [
    ['nucleophile', '提供電子對進攻反應中心', 'SN2 由親核劑的電子對與反應碳成鍵，同時讓脫離基帶走原鍵電子；先辨認兩個角色才能判斷進攻方向。'],
    ['degree', '受質級數與反應中心的擁擠', '先數 α 碳直接連接的碳，再判斷親核劑能否從背面靠近；三級碳的立體阻礙使一般 SN2 非常不利。'],
    ['hybrid', '飽和碳的四面體排列', 'SN2 的背面進攻會讓反應中心另外三個基團的空間排列反轉；四面體模型能把這個變化與平面圖區分。'],
    ['arrows', '同一步的成鍵與斷鍵', 'SN2 的 C–Nu 成鍵與 C–X 斷鍵在同一基元步驟，用兩支配套箭頭表達，不另插入碳陽離子中間體。']
  ], support: [
    ['chirality', '組態反轉後重新判 CIP', '若反應中心或產物具有掌性，可用 CIP 與 R/S 檢查組態；先畫幾何反轉，再排序，不能一律寫成 R 必變 S。'],
    ['acidbase', '親核性與接受質子的差別', '同一試劑可能進攻碳也可能接受 β-H；酸鹼概念可協助判斷消去競爭，而不是只看到負電就認定 SN2。']
  ]},
  sn1: {core: [
    ['carbocation', '可形成且能被捕捉的平面中間體', 'SN1 必須先能形成足夠穩定的碳陽離子，再由親核劑捕捉；平面形狀也解釋具有掌性產物時可能有兩種組態。'],
    ['nucleophile', '中性水或醇也能提供電子對', '碳陽離子形成後，水或醇可用氧的孤對電子成鍵；不能因它們親核性較弱，就認為無法捕捉中間體。'],
    ['arrows', '先離解，再捕捉的電子步驟', 'SN1 先把 C–X 鍵電子交給脫離基，再畫親核捕捉；中性水或醇成鍵後還要補上去質子化。'],
    ['sn2', '脫離基與溶劑（SN2 小節內）', '理解 SN1 的離解條件，需要知道哪些基團離開後較穩定，以及極性質子性溶劑如何穩定離子；這裡借用的是脫離基與溶劑概念，不是 SN2 機構。', ['leaving','solvent']]
  ], support: [
    ['energy', '分步機構的峰與中間體谷底', '能量圖有助分清先離解、再捕捉的分步路徑，並理解 SN1 的慢步驟與速率式不是由整個機構的總步數命名。'],
    ['rearr', '捕捉前的碳陽離子重排', '畫 SN1 產物前，檢查相鄰 H 或烷基移位是否更有利，避免把親核劑直接接到尚未檢查過的原反應碳。'],
    ['chirality', '平面捕捉與產物組態', '若產物仍有掌性中心，從平面中間體兩側進攻可得到兩種組態；原離去陰離子可能遮蔽一側，因此不保證各半。']
  ]},
  e2: {core: [
    ['degree', 'α 碳、β 碳與可用 β-H', '先找到帶脫離基的 α 碳及相鄰 β 碳，再找 β-H；沒有可用的 β-H，就不能套用本課程的一般 β 消去路徑。'],
    ['acidbase', '鹼接受 β-H 的質子', 'E2 中鹼提供孤對電子接受 β-H，原 C–H 鍵電子用來形成 π 鍵；這是接受質子而不是親核劑直接取代脫離基。'],
    ['conformation', '沿 α–β 鍵觀察 anti 排列', '沿 α–β 的 C–C 鍵畫 Newman 投影，才能檢查 C–H 與 C–X 是否具有本課程常用的反向共平面排列。'],
    ['arrows', '同步的拔氫、成 π 鍵與離去', 'E2 的三組電子在同一步配套移動；用三支箭頭共同表達，不能先畫出碳陽離子再讓鹼拔氫。'],
    ['chair', '軸向、赤道向與翻環（限環己烷案例）', '對椅式環己烷的常見 anti E2，脫離基與相鄰 β-H 必須都在軸向且一上一下；必要時先翻環，再檢查是否真的有可用的軸向 H。', ['chair']]
  ], support: [
    ['alkene-name', '烯的取代數、E/Z 與穩定性', '先篩出幾何上能形成的烯，再比較取代程度與空間排列；不能為了較多取代的烯而拔一個無法符合幾何條件的 H。'],
    ['nucleophile', '進攻碳與接受氫的競爭', '區分電子對是與碳成鍵還是與 H 成鍵，有助比較同一試劑在不同受質、溶劑及溫度下的取代與消去競爭。']
  ]},
  e1: {core: [
    ['carbocation', '先形成中間體再失去 β-H', 'E1 先形成碳陽離子，再由鹼接受相鄰 β-H 形成雙鍵；理解中間體才能分清 E1 與同步進行的 E2。'],
    ['degree', '相鄰 β 碳與可消去的氫', '碳陽離子形成後仍要逐一檢查 β 位置是否有 H，才能列出可能的雙鍵位置，不能只看到加熱就直接畫烯。'],
    ['acidbase', '弱鹼接受質子', 'E1 後段由水、醇等鹼接受 β-H，C–H 電子形成雙鍵；它與 SN1 的親核捕捉是同一中間體的不同後續選擇。'],
    ['arrows', '分開表示離解與消去', '先畫脫離基帶走鍵電子，再畫鹼接受 β-H 與 π 鍵形成，才能保持每一步的鍵數與總電荷合理。'],
    ['e2', 'Zaitsev 產物選擇（E2 小節內）', '有多個可失去的 β-H 時，可用一般烷基取代烯的穩定性比較主要產物；借用的是 Zaitsev 概念，不要求 E1 先走一遍 E2 的 anti 機構。', ['zaitsev']]
  ], support: [
    ['energy', '速率決定步驟與中間體', '能量圖可把較慢的離解與後續失去質子分開，幫助理解 E1 的 1 不是代表整個反應只有一步。'],
    ['rearr', '消去前的中間體重排', '若碳陽離子可先重排成更穩定的結構，要依新骨架再找 β-H，才能預測合理的 E1 烯產物。']
  ]},
  dehydration: {core: [
    ['acidbase', '把 OH 質子化並在最後再生酸', '醇先接受 H⁺ 形成可離去的水，消去後再失去質子；追蹤這些酸鹼步驟才能理解酸催化循環。'],
    ['e1', '三級醇的分步消去路徑', '本課程的三級醇酸催化脫水先離水形成碳陽離子，再失去 β-H；可用 E1 的中間體與消去步驟串起來，但不能推成所有醇都走自由碳陽離子機構。'],
    ['sn2', '好脫離基的穩定性（SN2 小節內）', 'OH⁻ 是差脫離基，先質子化成水才較容易離去；這裡使用脫離基概念，不代表醇脫水要先進行 SN2。', ['leaving']]
  ], support: [
    ['alcohol-name', '醇的級數與羥基位置', '先讀出 OH 所在碳的級數，才能判斷教材的三級醇 E1 脫水適用範圍，避免把一級醇也直接套用相同機構。'],
    ['rearr', '失水後的碳陽離子重排', '失水形成碳陽離子後，先檢查是否重排，再依新骨架找可失去的 β-H 與雙鍵位置。'],
    ['e2', 'Zaitsev 趨勢（E2 小節內）', '不同 β 位置都能形成烯時，可借用 Zaitsev 概念比較通常較有利的取代程度；它是產物趨勢，不是只有 E2 才能使用的規則。', ['zaitsev']]
  ]}
};

const COMPARISON_GUIDES = [
  ['polarity','formal','部分電荷描述實際電子密度偏向；形式電荷依電子均分規則記帳。CH₃Br 的碳可帶 δ+，形式電荷仍為 0，兩者不能互相代替。','cards-v2.js:polarity.body;cards-v2.js:formal.body'],
  ['conformation','chirality','單鍵旋轉可改變構形而不改變掌性中心組態；R/S 描述組態，不能因換一個觀察方向或 Newman 投影就認定發生反轉。','cards-v2.js:chirality.body'],
  ['rearr','addhx','HX 加成先形成碳陽離子；重排另檢查相鄰 H 或烷基移位是否更穩定。有重排時要依新骨架寫產物，不能只套原雙鍵的加成位置。','course-path.js:STAGES.rearr.concepts'],
  ['halo','addhx','兩者都把基團加到烯上，但一般 X₂ 加成經橋連鹵鎓離子並背面開環，HX 加成經碳陽離子；中間體不同，位置與立體判斷也不同。','course-path.js:STAGES.halo.concepts'],
  ['addhx','hydration','兩者通常先質子化烯形成碳陽離子；HX 由 X⁻ 捕捉，加水由水捕捉後再去質子化。加水的酸催化劑在最後再生。','course-path.js:STAGES.hydration.concepts'],
  ['hydration','halo','酸催化加水經碳陽離子，可能需要檢查重排；X₂ 加成經橋連鹵鎓離子，常以背面開環理解 anti 加成，不能混用自由碳陽離子的圖。','course-path.js:STAGES.hydration.pairs;course-path.js:STAGES.halo.concepts'],
  ['sn2','sn1','SN2 同步成斷鍵、背面進攻且無中間體；SN1 先離解形成碳陽離子再捕捉。要一起比較受質、親核性與溶劑，不能只靠一項條件或把 1、2 當步數。','course-path.js:STAGES.sn1.concepts;course-path.js:STAGES.sn2.concepts'],
  ['sn2','e2','兩者都可由試劑提供電子對，但 SN2 進攻碳形成取代產物，E2 接受 β-H 並形成雙鍵；還要一起檢查受質、鹼性、體積與可用的空間排列。','course-path.js:STAGES.e2.concepts'],
  ['sn1','e2','同一三級受質可因條件不同而走不同路徑：適合離解、弱鹼條件可考慮 SN1／E1；強鹼且有合適 β-H 時要考慮 E2。三級受質並不自動等於 SN1。','course-path.js:STAGES.e2.pairs;course-path.js:STAGES.sn1.concepts'],
  ['sn1','e1','SN1 與 E1 可共用碳陽離子：親核捕捉形成取代產物，失去 β-H 形成烯。溫度、試劑與結構影響競爭，加熱不保證唯一 E1 產物。','course-path.js:STAGES.e1.concepts'],
  ['e1','e2','E1 先離解再失去 β-H，可能有碳陽離子重排；E2 在同一步拔氫、形成 π 鍵並離去。常見 anti 幾何檢查屬 E2，不能直接搬到 E1 的起始受質。','course-path.js:STAGES.e1.concepts;course-path.js:STAGES.e2.concepts'],
  ['dehydration','hydration','烯加水成醇與醇脫水成烯可視為平衡的兩個方向；水量、溫度及是否移走產物會影響方向，不能只看有酸就決定加水或脫水。','course-path.js:STAGES.dehydration.concepts'],
  ['dehydration','e2','本課程三級醇酸催化脫水經質子化、失水與碳陽離子；鹵烷的 E2 由強鹼促成同步消去。即使得到相同烯，也不能因此套用同一機構。','course-path.js:STAGES.dehydration.pairs;course-path.js:STAGES.e2.concepts']
];
const APPLICATION_GUIDES = [
  ['carbocation','addhx','把碳陽離子穩定性用在 HX 加成產物判斷時，先比較質子化方向，再檢查是否重排，最後才讓 X⁻ 接上；不要只背「X 接取代較多的碳」。','course-path.js:STAGES.addhx.goal;course-path.js:STAGES.rearr.concepts'],
  ['addhx','rearr','從 HX 加成練習找出初生碳陽離子後，可接著比較相鄰 H 或烷基移位前後的穩定性，理解同一加成為何可能得到不同骨架的產物。','course-path.js:STAGES.rearr.concepts'],
  ['carbocation','sn1','用穩定性與平面形狀分析 SN1 案例時，先判斷受質能否合理離解，再考慮重排與捕捉方向；看到三級碳也仍需檢查試劑是否使 E2 競爭。','course-path.js:STAGES.sn1.concepts;course-path.js:STAGES.e2.concepts'],
  ['carbocation','e1','分析 E1 案例時，先找形成或重排後的碳陽離子，再沿新骨架找 β-H；能形成穩定中間體不表示只會消去，SN1 捕捉仍可能競爭。','course-path.js:STAGES.e1.concepts']
];

function buildRelations() {
  const result=[], keys=new Set();
  const add=relation=>{
    if(!IDS.has(relation.from)||!IDS.has(relation.to)||relation.from===relation.to)throw new Error('Invalid concept relation');
    const key=relation.type==='comparison'?[relation.from,relation.to].sort().join('|')+'|comparison':`${relation.from}|${relation.to}|${relation.type}`;
    if(keys.has(key))throw new Error(`Duplicate concept relation: ${key}`);
    keys.add(key);result.push(relation);
  };
  for(const [to,guide] of Object.entries(FOUNDATION_GUIDES))for(const role of ['core','support']){
    for(const [from,concept,label,conceptIds=[]] of guide[role]||[]){
      for(const id of conceptIds)if(cardLocation(id)?.island!==from)throw new Error(`Invalid scoped concept: ${id}`);
      const source=(stageById.has(to)?`course-path.js:STAGES.${to}.concepts`:`cards-v2.js:${to}.body`)+conceptIds.map(id=>`;cards-v2.js:${id}.body`).join('');
      add({from,to,type:'prerequisite',role,concept,label,conceptIds,conceptCards:conceptIds.map(id=>({id,label:cards.get(id).title})),source});
    }
  }
  for(const [from,to,label,source] of COMPARISON_GUIDES)add({from,to,type:'comparison',label,source});
  for(const [from,to,label,source] of APPLICATION_GUIDES)add({from,to,type:'application',label,source});
  return result;
}
export const KNOWLEDGE_RELATIONS = buildRelations();

const ACTIVITY = {
  read: ['reading', '閱讀概念與圖解'], figure: ['reading', '閱讀概念與圖解'],
  concept: ['reading', '閱讀反應概念'], 'concept-figure': ['reading', '閱讀概念與圖解'],
  demo: ['demo', '觀察當節概念'], check: ['check', '完成即時檢查'],
  compare: ['compare', '比較路徑與條件'], pair: ['pair', '預測並揭曉對比'],
  branch: ['branch', '完成流程圖判斷'], arrow: ['arrow', '判斷單次電子移動'], item: ['item', '完成混合練習']
};

/** Complete activities, not a deduplicated list of screen types. Keys use existing node/screen IDs. */
export function stationActivities(state, id) {
  if (!IDS.has(id)) return [];
  const nodes = islandNodes(id), record = state.stages[id];
  const visited = state.explore.done[id] || {};
  const ledger = plain(state.explore.activities?.[id]) ? state.explore.activities[id] : {};
  return islandBuildings(id).flatMap(building => {
    const screens = nodeScreens(id, nodes[building.node]);
    const groups = [];
    for (let index = building.screen; index <= building.end; index++) {
      const screen = screens[index], [kind, label] = ACTIVITY[screen.type] || ['reading', '閱讀活動'];
      let group = groups.at(-1);
      if (!group || group.kind !== kind) {
        const subject = screen.card ? shortCard(screen.card) : building.short;
        group = {id: `${building.id}/${kind}/${index}`, building: building.id, kind,
          label: `${label}：${subject}`, node: building.node, screen: index, end: index, screens: []};
        groups.push(group);
      }
      group.end = index; group.screens.push(screen);
    }
    return groups.map(group => {
      const evidence = group.kind === 'check' ? group.screens.every(screen => answered(state, screen.card))
        : group.kind === 'branch' ? group.screens.every(screen => (record?.branches[screen.index]?.tries || 0) > 0)
        : group.kind === 'pair' ? group.screens.every(screen => record?.revealed[screen.index])
        : group.kind === 'arrow' ? group.screens.every(screen => {
          if(Number.isInteger(state.conceptChecks?.[id]?.choice))return true;
          const answer = record?.arrows[stageById.get(id).arrowKinds[screen.index]];
          return answer?.first !== null && answer?.first !== undefined;
        }) : false;
      return {...group, done: Boolean(ledger[group.id] || visited[building.id] || visited[nodes[building.node].id] || evidence)};
    });
  });
}

/** Record a completed activity only after leaving its final screen and passing the submission gate. */
export function recordActivity(state, id, node, screen) {
  const task = stationActivities(state, id).find(task => task.node === node && task.end === screen);
  if (!task) return false;
  if (!plain(state.explore.activities)) state.explore.activities = {};
  if (!plain(state.explore.activities[id])) state.explore.activities[id] = {};
  state.explore.activities[id][task.id] = true;
  return true;
}

export function stationNeedsReview(state, id) {
  if (islandBuildings(id).some(building => building.cards.some(card => wrongCard(state, card)))) return true;
  const stage = stageById.get(id), record = state.stages[id];
  if (!stage || !record) return false;
  if (Object.values(record.branches).some(answer => answer.tries > 0 && !answer.done)) return true;
  if(Number.isInteger(state.conceptChecks?.[id]?.choice))return state.conceptChecks[id].choice!==REACTION_OVERVIEWS[id].move[2];
  const latest=state.mechanisms?.records?.[stage.arrowKinds[0]];
  if(latest?.first!==undefined&&latest.first!==null)return latest.lastCorrect===false||(latest.lastCorrect===undefined&&latest.first===false);
  return Object.values(record.arrows).some(answer => answer?.lastCorrect === false ||
    (answer?.lastCorrect === undefined && answer?.first === false));
}

/** Pure projection: do not migrate or delete saved data while generating a map or preview. */
export function knowledgeProgress(state) {
  let order = 0;
  const chapters = KNOWLEDGE_CHAPTERS.map(chapter => {
    const stations = chapter.stations.map(station => {
      const info = STATION_INFO[station.id], finished = doneStation(state, station.id);
      const flag = stationNeedsReview(state, station.id);
      return {...station, ...info, order: ++order, hideSection: Boolean(station.early),
        title: stageById.get(station.id)?.title || cards.get(station.id)?.title || info.short,
        finished, flag, state: finished ? 'done' : flag ? 'review' : 'todo',
        tasks: stationActivities(state, station.id)};
    });
    return {...chapter, stations, total: stations.length, done: stations.filter(station => station.finished).length};
  });
  const all = chapters.flatMap(chapter => chapter.stations), byId = new Map(all.map(station => [station.id, station]));
  const current = all.find(station => !station.finished)?.id || null;
  for (const station of all) {
    if (station.id === current) station.state = 'current';
    const dependencies=KNOWLEDGE_RELATIONS.filter(relation=>relation.type==='prerequisite'&&relation.role==='core'&&relation.to===station.id);
    station.missingPrerequisites=dependencies.filter(relation=>{
      if(byId.get(relation.from).finished)return false;
      if(!relation.conceptIds.length)return true;
      const tasks=stationActivities(state,relation.from).filter(task=>task.screens.some(screen=>relation.conceptIds.includes(screen.card)));
      return !tasks.length||tasks.some(task=>!task.done);
    }).map(relation=>({id:relation.from,short:relation.concept,conceptIds:relation.conceptIds}));
  }
  return {chapters, relations: KNOWLEDGE_RELATIONS, current,
    active: IDS.has(state.stage) ? state.stage : current || all.at(-1).id,
    summary: {done: all.filter(station => station.finished).length, total: all.length,
      review: all.filter(station => station.flag).map(station => ({id: station.id, short: station.short}))}};
}
