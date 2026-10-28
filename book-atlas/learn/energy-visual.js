// Energy diagrams: one-step (SN2/E2) vs two-step (SN1/E1) reactions, transition states and the intermediate (textbook pp. 207–210).
const W=300,H=200,BASE=150;
// Each curve is a list of [x,y] anchors joined by smooth quadratic segments; peaks are transition states, valleys intermediates.
const CURVES={
 one:{title:'一步反應（SN2、E2）',pts:[[20,120],[150,40],[280,140]],ts:[1],int:[],labels:['反應物','產物'],note:'只有一個過渡態，沒有中間體。'},
 two:{title:'兩步反應（SN1、E1）',pts:[[20,120],[100,30],[160,95],[210,65],[280,140]],ts:[1,3],int:[2],labels:['反應物','產物'],note:'兩個過渡態之間是中間體；虛線標出最高的能障，這一步最慢，是速率決定步驟。'}
};
function path(pts){
 // Horizontal tangents at every anchor give flat peaks and valleys.
 let d=`M${pts[0][0]} ${pts[0][1]}`;
 for(let i=1;i<pts.length;i++){const [x0,y0]=pts[i-1],[x1,y1]=pts[i],mx=(x0+x1)/2;d+=` C${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`;}
 return d;
}
function diagram(id){
 const c=CURVES[id],[sx,sy]=c.pts[0],[ex,ey]=c.pts.at(-1);
 const ts=c.ts.map((k,n)=>{const [x,y]=c.pts[k];return `<g data-energy-ts><circle cx="${x}" cy="${y}" r="5" fill="#b0362c"/><text x="${x}" y="${y-12}" text-anchor="middle" font-size="13" font-weight="700" fill="#8a2a22">過渡態${c.ts.length>1?n+1:''} ‡</text></g>`;}).join('');
 const ints=c.int.map(k=>{const [x,y]=c.pts[k];return `<g data-energy-int><circle cx="${x}" cy="${y}" r="5" fill="#2f6f8f"/><text x="${x}" y="${y+22}" text-anchor="middle" font-size="13" font-weight="700" fill="#1f5470">中間體</text><text x="${x}" y="${y+38}" text-anchor="middle" font-size="12" fill="#1f5470">（碳陽離子）</text></g>`;}).join('');
 const barrier=id==='two'?`<line x1="100" y1="120" x2="100" y2="36" stroke="#aa6416" stroke-width="1.5" stroke-dasharray="4 3"/>`:'';
 return `<figure class="energy-panel" data-energy-diagram="${id}"><figcaption>${c.title}</figcaption><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${c.title}能量圖：${c.note}"><line x1="10" y1="${BASE+20}" x2="10" y2="12" stroke="#6c7d86" stroke-width="1.5"/><text x="16" y="18" font-size="12" fill="#3f5b4d">能量</text><line x1="10" y1="${BASE+20}" x2="${W-10}" y2="${BASE+20}" stroke="#6c7d86" stroke-width="1.5"/><text x="${W-12}" y="${BASE+36}" text-anchor="end" font-size="12" fill="#3f5b4d">反應進行 →</text>${barrier}<path d="${path(c.pts)}" fill="none" stroke="#2f5f4a" stroke-width="3"/><text x="${sx+4}" y="${sy+18}" font-size="12" fill="#3f5b4d">${c.labels[0]}</text><text x="${ex-4}" y="${ey+18}" text-anchor="end" font-size="12" fill="#3f5b4d">${c.labels[1]}</text>${ts}${ints}</svg><p>${c.note}</p></figure>`;
}
export function energyHTML(){
 return `<section class="energy-visual" data-energy-visual><div class="energy-grid">${diagram('one')}${diagram('two')}</div><ul class="energy-key"><li><span class="energy-dot ts"></span>過渡態：能量最高點，鍵正在斷也正在形成，無法分離。</li><li><span class="energy-dot int"></span>中間體：谷底，可以短暫存在。</li></ul></section>`;
}

/** Qualitative comparison only. Attempts end before products; shared ionization
 * retains the same barrier, with the lower illustrated barrier only after branching. */
export function comparisonEnergyHTML(comparison){
 const {energy,winner,loser}=comparison;
 const shared=[[24,138],[85,38],[139,104]];
 const win=energy.shared?[...shared,[200,78],[276,155]]:
  energy.winner==='two'?[[24,138],[92,66],[155,114],[210,94],[276,155]]:
  [[24,138],[142,82],[276,155]];
 const lose=energy.shared?[...shared,[211,56],[246,90]]:
  [[24,138],[142,32],[182,49]];
 const note=energy.shared?
  '第一步能障相同；圖中只比較分岔後的定性能障，不以熵推算速率或產物比例。SN1 仍可競爭。':
  '實線為有利路徑；虛線為高能障的嘗試，未延伸至產物，不代表實際反應軌跡。';
 return `<figure class="comparison-energy" data-comparison-energy>
  <figcaption>兩條路的定性能量比較</figcaption>
  <svg viewBox="0 0 300 200" role="img" aria-label="${winner.type.toUpperCase()} 與 ${loser.type.toUpperCase()} 的定性能量圖，示意，非計算值">
   <path class="comparison-axis" d="M12 12 V174 H290" fill="none"/>
   <text x="18" y="22">能量</text><text x="286" y="194" text-anchor="end">反應進行 →</text>
   <path data-energy-curve="winner" class="comparison-curve winner" d="${path(win)}" fill="none"/>
   <path data-energy-curve="loser" class="comparison-curve loser" d="${path(lose)}" fill="none"/>
   <text x="25" y="160">反應物</text><text x="274" y="171" text-anchor="end">產物</text>
   ${energy.shared?'<circle cx="139" cy="104" r="4" class="comparison-intermediate"/><text x="139" y="128" text-anchor="middle">共用碳陽離子</text>':''}
  </svg>
  <div class="comparison-energy-key"><span class="winner">實線：${winner.type.toUpperCase()}，${energy.shared?'分岔後':''}能障較低</span><span class="loser">虛線：${loser.type.toUpperCase()} 嘗試</span></div>
  <p><strong>示意，非計算值。</strong>${note}</p>
 </figure>`;
}
