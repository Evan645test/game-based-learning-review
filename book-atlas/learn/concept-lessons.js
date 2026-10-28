import {BOOK,STAGES} from './course-path.js';
import {islandNodes,nodeScreens,islandBuildings} from './island-map.js';
import {validWork,validateMechanism} from './electron-flow.js';
import {esc} from './reason-workbench.js';

// Presentation changes keep all existing island/node/screen coordinates intact.
export const LESSON_ORDER=BOOK.flatMap(c=>c.stations.map(s=>s.id)).filter(id=>id!=='final');
export function adjacentLessonLocation(island,pos,direction){
 if(![-1,1].includes(direction))return null;
 const all=LESSON_ORDER.flatMap(id=>islandNodes(id).flatMap((node,n)=>nodeScreens(id,node).map((_,screen)=>({island:id,node:n,screen}))));
 const index=all.findIndex(p=>p.island===island&&p.node===pos.node&&p.screen===pos.screen);
 return index<0?null:all[index+direction]||null;
}

export const CARD_INTRO={
 hybrid:'先分清兩種形狀：四個單鍵的中性飽和碳通常是 sp³ 四面體；雙鍵中的碳通常是 sp² 平面。混成模型用來描述成鍵方向。',
 acidbase:'酸給出 H⁺，鹼接受 H⁺。先找到被轉移的氫，再看接受它的原子有沒有可用的孤對電子。',
 nucleophile:'先找角色：親核劑提供電子對，親電子劑接受電子對。有孤對電子的水也能提供電子，不必一定帶負電。',
 arrows:'彎箭頭從電子對出發，指向電子的去處。起點可以是孤對電子或化學鍵；箭頭描述電子的重新分配。'
};
const frame=(title,formula,text)=>({title,formula,text});
export function introductoryFigures(id,figures){
 if(id!=='reactions')return figures;
 const points=['雙鍵變成單鍵，兩端增加 H 與 Br。','Br 被 OH 換下；碳骨架保留。','相鄰位置失去 H 與 Br，單鍵變成雙鍵。','H 換了連接位置，分子式不變；這是中間體的結構改變。'];
 return figures.map((figure,index)=>({...figure,...(index===3?{title:'④ 重排：連接位置改變，分子式不變'}:{}),panels:[figure.panels[0],figure.panels.at(-1)].map((panel,i)=>({...panel,mol:{...panel.mol,arrows:[]},text:i?points[index]:'先對照反應前後，找出改變的鍵或基團；這裡先辨認反應類型。'}))}));
}
export const FOCUS_LESSONS={
 hybrid:[
  frame('四個方向：sp³','CH₄ · 四面體 · 約 109.5°','四個 C–H 單鍵朝向四面體的四個角；畫在紙面上的十字並不是分子的真實形狀。'),
  frame('一個平面：sp²','CH₂=CH₂ · 每個碳的三個 σ 鍵約 120°','雙鍵碳的三個 σ 鍵在同一平面；垂直於平面的 p 軌域側向重疊形成 π 鍵。'),
  frame('平面碳也可能缺電子','(CH₃)₃C⁺ · sp² · 空 p 軌域','這個碳陽離子的三個 σ 鍵呈平面排列，空 p 軌域可以接受電子對。此處只比較形狀，不討論它如何生成。')
 ],
 acidbase:[
  frame('誰給氫？誰接受？','H₂O ＋ H–Br','HBr 給出 H⁺，是酸；水的氧有孤對電子，可以接受 H⁺，是鹼。'),
  frame('同一次質子轉移的兩對電子','O 的孤對 → H；H–Br 的鍵電子 → Br','新 O–H 鍵形成時，原 H–Br 鍵電子必須回到 Br。兩支箭頭配套，不能讓 H 同時保留兩個一般共價鍵。'),
  frame('檢查轉移後的電荷','H₃O⁺ ＋ Br⁻','水接受 H⁺ 後成為 H₃O⁺，HBr 失去 H⁺ 後成為 Br⁻。總電荷仍為 0。')
 ],
 nucleophile:[
  frame('先找到電子提供者','H₂O ＋ (CH₃)₃C⁺','水的氧有孤對電子，是提供者；帶正電、缺電子的碳是接受者。'),
  frame('只追蹤這一對電子','水 O 的孤對電子 → C⁺','電子對由氧提供，用來形成 O–C 新鍵。箭頭從氧的孤對出發，指向帶正電的碳。'),
  frame('成鍵後，正電在哪裡？','(CH₃)₃C–OH₂⁺','碳得到第四個鍵後不再帶正電；氧現在有三個鍵、一對孤對電子，因此帶正電。總電荷仍為 +1，此處尚未生成中性醇。')
 ],
 arrows:[
  frame('起點是一條鍵','(CH₃)₃C–Br','C–Br 鍵裡有一對成鍵電子。先圈出這條鍵，別從碳的正電符號或 Br 原子開始畫。'),
  frame('鍵電子全部交給 Br','C–Br 鍵 → Br','完整箭頭代表兩個電子。這裡觀察的是異裂：原來共用的鍵電子都留給 Br。'),
  frame('斷鍵後重新記帳','(CH₃)₃C⁺ ＋ Br⁻','碳失去這對成鍵電子而帶正電；Br 帶走電子而成為 Br⁻。原子數與總電荷都守恆。')
 ],
 leaving:[
  frame('先分清離開的是誰','R₃C–OH 與 R₃C–OH₂⁺','–OH 若直接離去會成為 OH⁻，通常是差的脫離基；先質子化後，離開的可以是中性水。'),
  frame('追蹤 C–O 鍵電子','R₃C–OH₂⁺：C–O 鍵 → O','以可形成穩定碳陽離子的三級例子觀察：水離開時，帶走的是 C–O 鍵的整對電子。'),
  frame('離去後檢查電荷','R₃C⁺ ＋ H₂O','氧從三個鍵變成兩個鍵，回到中性水；碳成為碳陽離子。前後總電荷都是 +1。')
 ],
 sterics:[
  frame('先找需要靠近的位置','CH₃–Br：觀察 C–Br 的背面','親核劑需要接近帶脫離基的碳。先看周圍取代基佔了多少空間。'),
  frame('比較空間，不急著播放反應','CH₃–Br　對照　(CH₃)₃C–Br','甲基的三個 H 較小；三級碳周圍的三個甲基更擁擠，背面較難接近。'),
  frame('用空間說明差異','較不擁擠 → 背面較容易接近','其他條件相同時，立體障礙使甲基較適合背面進攻。此比較只判斷接近的難易，不把中途接近當成產物。')
 ],
 basicity:[
  frame('同一電子對，可以找不同目標','EtO⁻ 的氧有孤對電子','先看它要與哪個原子成鍵，再說明此時扮演的角色。'),
  frame('目標是碳，還是氫？','O 的孤對 → Cα　或　O 的孤對 → β-H','與碳成鍵是在此比較中的親核進攻；接受 H⁺ 則是鹼的角色。這是兩種目標的比較，不是兩步連續反應。'),
  frame('角色不能只看負電','進攻碳：親核劑；接受 H⁺：鹼','要判斷取代或消去，還需結合受質、β-H、空間及條件。接受 β-H 只是電子焦點，完整消去還有其他同步電子移動。')
 ],
 inversion:[
  frame('先固定原來三個基團','Cα–Br：記住其餘三個基團的排列','背面是相對於 C–Br 鍵的方向，並不是螢幕固定的左側或右側。'),
  frame('新基團從相反方向進來','背面進攻 → 其餘三個基團的排列翻轉','用雨傘翻面的方式理解幾何反轉；成鍵與離去是同一步，沒有可分離的五鍵碳中間體。'),
  frame('最後才重判 R/S','先畫組態反轉，再排 CIP 優先序','更換基團可能改變優先序，因此不能把所有組態反轉都直接寫成 R 變 S。')
 ],
 anti:[
  frame('先找對那個氫','X–Cα–Cβ–Hβ','先確認 H 連在 β 碳上；不要只挑紙面上離 X 最近的氫。'),
  frame('沿 α–β 鍵觀察','H–Cβ–Cα–X 的二面角約 180°','一般 E2 有利的排列是反向共平面。開鏈受質可以先繞單鍵旋轉，尋找可達的 anti 構形。'),
  frame('構形是反應的幾何條件','找 β-H → 檢查 anti 排列','此處先學會找位置；完整機構再一起看接受氫、形成 π 鍵與離去的同步關係。')
 ]
};

function geometrySVG(index){
 const planar=index>0,angle=.65,turn=.55;
 // Orthographic projection of a tetrahedron or trigonal plane; p is normal to that plane.
 const project=([x,y,z])=>[280+95*(Math.cos(turn)*x+Math.sin(turn)*z),105+95*(Math.sin(angle)*Math.sin(turn)*x+Math.cos(angle)*y-Math.sin(angle)*Math.cos(turn)*z)];
 const points=planar?[[1,0,0],[-.5,Math.sqrt(3)/2,0],[-.5,-Math.sqrt(3)/2,0]]:[[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]].map(v=>v.map(x=>x/Math.sqrt(3)));
 const ends=points.map(project),pTop=project([0,0,1]),pBottom=project([0,0,-1]);
 return `<svg viewBox="0 0 560 220" role="img" aria-label="${planar?'sp² 的三個 σ 鍵在同一平面，p 軌域垂直於此平面':'sp³ 四面體的四個成鍵方向，楔形與虛線表示前後'}"><g stroke="currentColor" fill="none" stroke-width="3">${planar?`<path d="M${ends.map(p=>p.join(' ')).join('L')}Z" fill="#e3eee8" stroke="#aecbbd" stroke-width="1"/>` : ''}${ends.map(([x,y],i)=>!planar&&i===0?`<path d="M280 105L${x-6} ${y}L${x+6} ${y}Z" fill="currentColor"/>`:`<path d="M280 105L${x} ${y}" ${!planar&&i===3?'stroke-dasharray="3 6"':''}/>`).join('')}${planar?`<path d="M${pTop.join(' ')}L${pBottom.join(' ')}" stroke="#92769d" stroke-dasharray="5 5"/><ellipse cx="${(280+pTop[0])/2}" cy="${(105+pTop[1])/2}" rx="15" ry="36" transform="rotate(47 ${(280+pTop[0])/2} ${(105+pTop[1])/2})" fill="#a8bdd8" opacity=".45"/><ellipse cx="${(280+pBottom[0])/2}" cy="${(105+pBottom[1])/2}" rx="15" ry="36" transform="rotate(47 ${(280+pBottom[0])/2} ${(105+pBottom[1])/2})" fill="#d4b590" opacity=".45"/>`:''}</g><circle cx="280" cy="105" r="20" fill="#fffdf9"/><text x="280" y="113" text-anchor="middle" fill="currentColor" font-size="25">C${index===2?'⁺':''}</text><text x="280" y="205" text-anchor="middle" fill="currentColor" font-size="17">${planar?'淺色三角面：三個 σ 鍵；兩瓣：垂直於面的 p 軌域':'四個成鍵方向朝向四面體的角'}</text></svg>`;
}
function nucleophileSVG(index){
 const product=index===2,ox=product?250:130;
 const text=(x,y,t,color='currentColor')=>`<text x="${x}" y="${y}" text-anchor="middle" fill="${color}" font-size="22">${t}</text>`;
 const line=(a,b)=>`<path d="M${a.join(' ')}L${b.join(' ')}"/>`;
 return `<svg viewBox="0 0 560 240" role="img" aria-label="${product?'水氧與碳成鍵後成為帶正電的 R₃C–OH₂⁺，氧剩一對孤對電子':index===1?'完整彎箭頭從水氧的孤對電子指向碳陽離子':'水氧有兩對孤對電子，碳陽離子是接受者'}"><defs><marker id="focus-electron-tip" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#a36a17"/></marker></defs><g fill="none" stroke="currentColor" stroke-width="3">${line([ox-9,102],[ox-40,65])}${line([ox-9,118],[ox-40,155])}${line([360,95],[360,45])}${line([373,114],[425,145])}${line([353,124],[325,169])}${product?line([ox+17,110],[343,110]):''}</g>${text(ox,118,product?'O⁺':'O','#a34c41')}${text(ox-46,63,'H')}${text(ox-46,177,'H')}${text(360,118,product?'C':'C⁺','#315e5c')}${text(360,34,'CH₃')}${text(448,158,'CH₃')}${text(313,196,'CH₃')}<g fill="#a36a17"><circle cx="${ox-6}" cy="84" r="3"/><circle cx="${ox+4}" cy="84" r="3"/>${product?'':`<circle cx="${ox+23}" cy="105" r="3"/><circle cx="${ox+23}" cy="115" r="3"/>`}</g>${index===1?'<path d="M158 100Q248 15 342 96" fill="none" stroke="#a36a17" stroke-width="3" marker-end="url(#focus-electron-tip)"/>':''}${text(280,233,product?'一對電子形成新鍵；正電移到氧':'提供電子對的氧　　　　　　　　　接受電子對的碳')}</svg>`;
}
export function mountConceptFocus(root,{id,initial=0,onChange=()=>{}}){
 const frames=FOCUS_LESSONS[id];if(!frames)throw new RangeError(`未知概念示範：${id}`);
 let index=Number.isInteger(initial)?Math.max(0,Math.min(initial,frames.length-1)):0;
 const abort=new AbortController();
 const draw=()=>{const f=frames[index];root.innerHTML=`<section class="concept-focus" data-concept-focus><p class="section-kicker">現在只看這件事</p><h3 tabindex="-1">${esc(f.title)}</h3>${id==='hybrid'?geometrySVG(index):id==='nucleophile'?nucleophileSVG(index):''}<p class="focus-formula" ${index===frames.length-1?'data-focus-result':''}>${esc(f.formula)}</p><p data-teacher-result>${esc(f.text)}</p><div class="focus-controls"><button type="button" data-focus-prev ${index===0?'disabled':''}>回看重點</button><button type="button" data-focus-next ${index===frames.length-1?'disabled':''}>${index===0?'看關鍵關係':'看結果與檢查'}</button></div></section>`;};
 root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!root.contains(b))return;const delta=b.hasAttribute('data-focus-prev')?-1:b.hasAttribute('data-focus-next')?1:0;if(!delta)return;index=Math.max(0,Math.min(index+delta,frames.length-1));onChange(index);draw();const target=root.querySelector(delta<0?'[data-focus-prev]':'[data-focus-next]');(target?.disabled?root.querySelector('h3'):target)?.focus({preventScroll:true});},{signal:abort.signal});draw();
 return {destroy(){abort.abort();}};
}

export const REACTION_OVERVIEWS={
 addhx:{focus:'雙鍵變單鍵，兩端分別接上 H 與 X。',why:'一般未重排的烷基取代烯，X 通常接在原雙鍵取代較多的碳；先比較碳陽離子穩定性，再檢查是否可能重排。',move:['π 鍵的電子先與誰成鍵？',['HX 的 H','HX 的 X','溶劑中的碳'],0,'π 鍵提供電子給 H；同一次質子化還要讓 H–X 鍵電子回到 X。這裡只辨認電子的第一個接受位置。']},
 rearr:{focus:'碳陽離子旁的 H 或烷基，可以連同原鍵電子移到缺電子碳。',why:'比較位移前後的碳陽離子穩定性；不是所有碳陽離子都必定重排，也可能直接被捕捉。',move:['1,2-氫位移的電子從哪裡出發？',['原 C–H 鍵','正電符號','游離的 H⁺'],0,'H 與原 C–H 鍵的電子對一起移動；原來帶 H 的碳成為新的正電中心。']},
 halo:{focus:'原雙鍵兩端各接上一個鹵素，通常從相反兩面加入。',why:'橋接的鹵鎓離子擋住一面；這與自由碳陽離子的路徑不同，不能直接套用碳陽離子重排。',move:['Br₂ 加成的開環中，Br⁻ 提供電子給哪裡？',['鹵鎓環中的碳','另一個 Br⁻','溶劑的 H'],0,'Br⁻ 從橋接鹵素的相反一面進攻環中的碳；開環時還需配套處理原 C–Br 鍵的電子。']},
 hydration:{focus:'烯加上 H 和 OH，形成醇。',why:'一般未重排的烷基取代烯，OH 通常接在取代較多的原雙鍵碳。酸參與催化，最後會再生。',move:['水接住碳陽離子時，哪裡提供電子？',['水氧的孤對電子','水的 H 原子','碳的正電符號'],0,'氧提供孤對電子與 C⁺ 成鍵，先得到帶正電的 R–OH₂⁺，尚未直接生成中性醇。']},
 sn2:{focus:'親核劑換掉脫離基；新鍵形成與舊鍵斷裂在同一步。',why:'先看背面能否接近，再看親核劑與溶劑。掌性反應中心會組態反轉；2 表示雙分子，並不是兩步。',move:['親核進攻的電子從哪裡出發、到哪裡去？',['親核劑的孤對 → Cα','Cα → 親核劑','Br⁻ → β-H'],0,'電子由親核劑提供給 Cα；同一基元步驟還要有 C–X 鍵電子移向 X，不能留下五鍵碳。']},
 sn1:{focus:'先失去脫離基形成碳陽離子，再由親核劑接住。',why:'先確認碳陽離子足夠穩定。1 指速率決定步驟的分子數，不代表整個反應只有一步。',move:['脫離基離去時，C–Br 鍵電子到哪裡？',['Br','Cα','水的 H'],0,'Br 帶走原 C–Br 鍵的電子對，生成 Br⁻ 與碳陽離子；此時水還沒有與碳成鍵。']},
 e2:{focus:'鹼接受 β-H，受質同時失去脫離基、形成雙鍵。',why:'先找 β-H 和有利的 anti 排列，再比較可能的烯。三組電子在同一步配套移動，沒有碳陽離子中間體。',move:['作為鹼時，氧的孤對電子指向哪裡？',['β-H','Cα','脫離基的負電符號'],0,'鹼接受的是 β-H；完整同一步還包括 C–H 電子形成 π 鍵、C–X 鍵電子移向 X。此題只辨認鹼的目標。']},
 e1:{focus:'先形成碳陽離子，再失去相鄰的 H，生成烯。',why:'加熱是偏向消去的線索；SN1 仍會競爭。先檢查重排，再比較可形成的烯。',move:['形成烯時，原 Cβ–H 鍵的電子到哪裡？',['Cα 與 Cβ 之間，形成 π 鍵','已離開的 Br⁻','鹼的負電符號'],0,'原 C–H 鍵電子形成 π 鍵；同時鹼用孤對接受 H。脫離基已在更早一步離開。']},
 dehydration:{focus:'三級醇在酸催化下失去水，生成烯。',why:'–OH 要先活化成可離去的水。條件改變平衡方向，不能把所有醇的脫水都當成自由碳陽離子的 E1。',move:['醇先接受 H⁺ 時，電子由誰提供？',['醇氧的孤對電子','碳上的正電符號','H⁺ 的孤對電子'],0,'醇氧提供孤對與 H 成鍵，成為 R–OH₂⁺；H⁺ 沒有可提供的電子對，完整質子轉移還需處理供酸的 O–H 鍵。']}
};
export const MECHANISM_KINDS=['sn2','sn1','e2','e1','addhx','halogenation','hydration','rearrangement','dehydration'];
export const reviewStage=kind=>STAGES.find(s=>s.arrowKinds.includes(kind));
export function mechanismProgress(state){
 const records=state.mechanisms?.records||{},done=MECHANISM_KINDS.filter(kind=>{
  const r=records[kind];return state.mechanisms?.done?.[kind]===true&&r?.lastCorrect===true&&validWork(kind,r.work)&&validateMechanism(kind,r.work).ok;
 });
 return {ready:['sn2','sn1','e2','e1'].every(id=>islandBuildings(id).every(b=>state.explore.done[id]?.[b.id]||state.explore.done[id]?.[islandNodes(id)[b.node].id])),completed:done,done:done.length,total:MECHANISM_KINDS.length,complete:done.length===MECHANISM_KINDS.length};
}
