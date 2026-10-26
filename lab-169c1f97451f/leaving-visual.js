// Leaving-group diagrams: halide size/charge spreading, and why –OH must be protonated (textbook p. 366).
const IONS=[{id:'Cl',label:'Cl⁻',size:56,alpha:.85,note:'負電較集中'},{id:'Br',label:'Br⁻',size:68,alpha:.6,note:'居中'},{id:'I',label:'I⁻',size:84,alpha:.38,note:'負電最分散'}];
function bondSVG(protonated){
 // R–O bond with a curved arrow from the bond to O; charges follow the row.
 const hs=protonated?'<circle cx="150" cy="22" r="10" fill="#fff" stroke="#9aa8b0"/><text x="150" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="#41535d">H</text><line x1="129" y1="40" x2="143" y2="29" stroke="#6c7d86" stroke-width="3"/><circle cx="150" cy="78" r="10" fill="#fff" stroke="#9aa8b0"/><text x="150" y="82" text-anchor="middle" font-size="12" font-weight="700" fill="#41535d">H</text><line x1="129" y1="60" x2="143" y2="71" stroke="#6c7d86" stroke-width="3"/>':'<circle cx="155" cy="50" r="10" fill="#fff" stroke="#9aa8b0"/><text x="155" y="54" text-anchor="middle" font-size="12" font-weight="700" fill="#41535d">H</text><line x1="135" y1="50" x2="145" y2="50" stroke="#6c7d86" stroke-width="3"/>';
 return `<svg viewBox="0 0 175 100" class="lg-bond" aria-hidden="true"><defs><marker id="lg-arrow-${protonated?1:0}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#aa6416"/></marker></defs><line x1="45" y1="50" x2="105" y2="50" stroke="#6c7d86" stroke-width="4"/><circle cx="35" cy="50" r="18" fill="#4f6170"/><text x="35" y="55" text-anchor="middle" font-size="14" font-weight="700" fill="#fff">R</text><circle cx="118" cy="50" r="17" fill="#d2514c"/><text x="118" y="55" text-anchor="middle" font-size="14" font-weight="700" fill="#fff">O${protonated?'⁺':''}</text>${hs}<path d="M72 44 Q 90 8 112 30" fill="none" stroke="#aa6416" stroke-width="2.4" marker-end="url(#lg-arrow-${protonated?1:0})"/></svg>`;
}
export function leavingHTML(){
 return `<section class="leaving-visual" data-leaving-visual>
 <h3>圖 1｜鹵離子：負電越分散，越容易離開</h3>
 <div class="lg-ions">${IONS.map(i=>`<figure data-ion="${i.id}"><span class="lg-ion" style="--size:${i.size}px;--alpha:${i.alpha}">${i.label}</span><figcaption>${i.note}</figcaption></figure>`).join('')}</div>
 <p class="lg-scale"><span>較差的脫離基</span><span>→</span><span>較好的脫離基</span></p>
 <p>脫離基離開時帶走一對電子而帶負電。離子越大，同樣的負電分布在越大的空間，越穩定，也就是越弱的鹼；共軛酸酸性 HCl &lt; HBr &lt; HI 反映了同一個順序。<small>（離子大小的說法為教學補充；圓的大小只表示大小順序，紅色深淺表示負電集中程度，兩者都不是實際比例。）</small></p>
 <h3>圖 2｜為什麼 –OH 要先質子化？</h3>
 <div class="lg-row bad" data-leaving-row="hydroxide">${bondSVG(false)}<span class="lg-to">→</span><span class="lg-products"><b>R⁺</b> ＋ <b class="lg-strong">OH⁻</b></span><span class="lg-verdict">✗ 很難發生：OH⁻ 是強鹼，離開後不穩定</span></div>
 <p class="lg-step">先加上酸的 H⁺：–OH → –OH₂⁺</p>
 <div class="lg-row good" data-leaving-row="water">${bondSVG(true)}<span class="lg-to">→</span><span class="lg-products"><b>R⁺</b> ＋ <b class="lg-neutral">H₂O</b></span><span class="lg-verdict">✓ 容易：離開的是中性水，很穩定</span></div>
 <p class="teacher-note">橘色彎箭頭：C–O 鍵的電子對回到氧，脫離基帶著這對電子離開。依據原文第 366 頁：能穩定負電的基團是弱鹼、好脫離基；OH⁻ 是強鹼、差的脫離基。</p>
</section>`;
}
