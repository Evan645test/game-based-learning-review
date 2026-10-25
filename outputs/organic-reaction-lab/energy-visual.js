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
