// Teaching adaptations of the textbook sections linked beside each topic.
export const CONCEPT_VISUALS={
 polarity:{pages:[194,199,375],title:'看圖理解：部分電荷與斷鍵有何不同？',note:'此圖 R 代表碳基團，以三級烷基溴的離解為例。鍵有極性，不表示所有 C–Br 都會先離解。',steps:['先找 C–Br 鍵：這對電子仍屬於同一條共價鍵。','電子分布偏向 Br；δ＋／δ− 是部分電荷，鍵仍存在。','不勻分裂時，這對鍵電子移到 Br，才得到 C⁺ 與 Br⁻。']},
 nucleophile:{pages:[73,74,375],title:'看圖理解：水的氧如何提供電子？',note:'此圖 R 代表碳基團。這是 SN1 中水進攻碳陽離子的觀察焦點。氧陽離子仍須去質子化，才得到中性醇。',steps:['先猜：中性的 H₂O，哪個原子可以提供電子對？','水的氧帶著孤對電子靠近 C⁺；接近尚未代表已成鍵。','氧的孤對電子形成 C–O 鍵；碳恢復四個鍵，氧成為 O⁺。']},
 base:{pages:[365,380,381],title:'看圖比較：進攻碳，還是接受氫？',note:'同一個 EtO⁻ 可有不同角色。實際路徑還須看受質、溶劑及構形；完整空間條件在三維演示觀察。',steps:['先猜：EtO⁻ 的電子對要指向 Cα，還是 β-H？','指向 Cα 是親核進攻；SN2 的進攻與離去在同一步。','指向 β-H 是鹼接受質子；E2 的三組電子移動同步發生。']},
 pathway:{pages:[375,380,385],title:'看圖比較：取代與消去哪裡不同？',note:'圖中 Nu⁻ 與 B⁻ 代表不同角色；這是結構變化對照，不是僅由一項條件預測唯一反應。',steps:['取代：Br 被 Nu 換下，碳骨架保留。','消去：移去 β-H 與 Br，原本的 C–C 形成 C=C。']}
};

export function visualDisclosure(id){const spec=CONCEPT_VISUALS[id];return spec?`<details class="concept-visual" data-concept-visual="${id}"><summary>${spec.title}</summary><div data-concept-visual-host></div></details>`:'';}
let serial=0;
const tags=(items)=>items.map(([id,text,x,y])=>`<span class="concept-atom-tag" data-cv-label="${id}" style="left:${x/3.6}%;top:${y/2.1}%">${text}</span>`).join('');
const bond=(x1,y1,x2,y2,extra='')=>{const name=extra.replaceAll('class="','').replaceAll('"','');return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="cv-bond ${name}"/>`;};
const ball=(x,y,color,r=14)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" stroke="#fff" stroke-width="1.5"/>`;
const pair=(x,y)=>`<circle cx="${x-4}" cy="${y}" r="4"/><circle cx="${x+4}" cy="${y}" r="4"/>`;
const core=(x,y)=>bond(x,y,x-55,y-45)+bond(x,y,x-55,y+45)+bond(x,y,x,y-70);
function illustration(id,uid){
 const tip=`marker-end="url(#${uid}-tip)"`,defs=`<defs><marker id="${uid}-tip" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill="#8b5214"/></marker></defs>`;
 let graphic='',labels='';
 if(id==='polarity'){
  graphic=core(130,105)+bond(130,105,245,105,'class="cv-leaving-bond"')+ball(130,105,'#536575')+`<g class="cv-halogen">${ball(245,105,'#ae623f',18)}</g><g class="cv-pair cv-polarity-pair">${pair(180,94)}</g><path class="cv-flow cv-break-flow" d="M180 85 Q225 35 260 85" ${tip}/>`;
  labels=tags([['carbon','C',130,128],['halogen','Br',245,132],['r1','R',75,60],['r2','R',75,151],['r3','R',130,30]]);
 }else if(id==='nucleophile'){
  graphic=core(225,105)+ball(225,105,'#536575')+`<g class="cv-water">${bond(70,105,43,75)+bond(70,105,43,135)+ball(70,105,'#be493e')+ball(43,75,'#edf1f3',9)+ball(43,135,'#edf1f3',9)}<g class="cv-pair cv-water-pair">${pair(91,100)}</g></g>`+bond(179,105,211,105,'class="cv-new-bond"')+`<path class="cv-flow cv-capture-flow" d="M178 87 Q202 60 221 87" ${tip}/>`;
  labels=tags([['oxygen','O',70,127],['h1','H',43,61],['h2','H',43,151],['carbon','C⁺',225,131],['r1','R',170,61],['r2','R',170,151],['r3','R',225,30]]);
 }else if(id==='base'){
  graphic=bond(205,70,205,145)+bond(205,70,280,40)+bond(205,145,280,145)+bond(205,70,157,30)+bond(205,70,218,18)+bond(205,145,180,190)+bond(205,145,235,190)+ball(205,70,'#536575')+ball(205,145,'#536575')+ball(280,40,'#ae623f',17)+ball(280,145,'#edf1f3',10)+ball(65,112,'#be493e')+`<g class="cv-pair">${pair(87,103)}</g><path class="cv-flow cv-sub-flow" d="M92 96 Q135 40 192 65" ${tip}/><path class="cv-flow cv-base-flow" d="M91 116 Q165 200 267 146" ${tip}/><path class="cv-flow cv-beta-flow" d="M245 135 Q258 93 216 105" ${tip}/><path class="cv-flow cv-depart-flow" d="M240 47 Q244 11 268 32" ${tip}/>`;
  labels=tags([['base','EtO⁻',65,139],['ca','Cα',199,91],['cb','Cβ',197,164],['br','Br',295,25],['hb','β-H',296,165],['r1','R',148,21],['ha','H',220,20],['r2','R',180,190],['h2','H',242,190]]);
 }else return '<div class="concept-products" data-cv-products></div>';
 return `<div class="concept-scene" data-cv-scene role="img"><svg viewBox="0 0 360 210" aria-hidden="true">${defs}${graphic}</svg><div class="concept-tags" aria-hidden="true">${labels}</div></div>`;
}

export function mountVisual(host,id,{onLast=()=>{}}={}){
 const spec=CONCEPT_VISUALS[id],uid='concept-'+(++serial);let index=0;
 host.innerHTML=`<figure class="concept-figure" data-concept-figure="${id}">${illustration(id,uid)}<figcaption data-concept-focus aria-live="polite"></figcaption></figure><div class="concept-visual-controls"><button type="button" data-concept-prev>上一張</button><span data-concept-count></span><button type="button" data-concept-next>下一張</button></div><p class="concept-visual-note">${spec.note}</p>`;
 const q=s=>host.querySelector(s),label=(id,text)=>{const n=q(`[data-cv-label="${id}"]`);if(n)n.textContent=text;},position=(id,x)=>{const n=q(`[data-cv-label="${id}"]`);if(n)n.style.left=x/3.6+'%';};
 function draw(){
  host.dataset.phase=index;q('[data-concept-focus]').textContent=spec.steps[index];q('[data-concept-count]').textContent=`圖解 ${index+1}／${spec.steps.length}`;q('[data-concept-prev]').disabled=index===0;q('[data-concept-next]').disabled=index===spec.steps.length-1;if(index===spec.steps.length-1)onLast();
  const scene=q('[data-cv-scene]');if(scene)scene.setAttribute('aria-label',spec.steps[index]);
  if(id==='polarity'){label('carbon',index===0?'C':index===1?'Cδ⁺':'C⁺');label('halogen',index===0?'Br':index===1?'Brδ⁻':'Br⁻');position('halogen',index===2?280:245);}
  if(id==='nucleophile'){const dx=[0,55,95][index];host.style.setProperty('--water-x',dx+'px');for(const[id,x]of [['oxygen',70],['h1',43],['h2',43]])position(id,x+dx);label('carbon',index===2?'C':'C⁺');label('oxygen',index===2?'O⁺':'O');}
  if(id==='pathway'){q('[data-cv-products]').innerHTML=index===0?'<div><span>反應物</span><strong>CH₃–CH(<em>Br</em>)–CH₃</strong><small>＋ Nu⁻</small></div><b aria-hidden="true">↓</b><div><span>取代產物</span><strong>CH₃–CH(<em>Nu</em>)–CH₃</strong><small>另有 Br⁻</small></div>':'<div><span>反應物</span><strong>CH₃–CH(<em>Br</em>)–CH₃</strong><small>＋ B⁻；移除末端碳上的 β-H</small></div><b aria-hidden="true">↓</b><div><span>消去產物</span><strong><em>CH₂=CH</em>–CH₃</strong><small>另有 B–H 與 Br⁻</small></div>';}
 }
 q('[data-concept-prev]').onclick=()=>{index=Math.max(0,index-1);draw();};q('[data-concept-next]').onclick=()=>{index=Math.min(spec.steps.length-1,index+1);draw();};draw();
}

export function mountConceptVisuals(root){
 const abort=new AbortController(),views=[...root.querySelectorAll('[data-concept-visual]')],mounted=new Set();
 for(const details of views)details.addEventListener('toggle',()=>{if(!details.open)return;for(const other of views)if(other!==details)other.open=false;if(!mounted.has(details)){mountVisual(details.querySelector('[data-concept-visual-host]'),details.dataset.conceptVisual);mounted.add(details);}},{signal:abort.signal});
 return {destroy(){abort.abort();}};
}
