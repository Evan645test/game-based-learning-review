export function mountSolvation(root){
 root.innerHTML='<div class="solvation-controls"><label>溶劑<select data-solvent><option value="protic">水 · polar protic solvent</option><option value="aprotic">acetone · polar aprotic solvent</option><option value="low">hexane · 低極性</option></select></label><label>觀察離子<select data-ion><option value="anion">Nu⁻ 陰離子</option><option value="cation">C⁺ 碳陽離子</option></select></label></div><svg viewBox="0 0 540 260" role="img" aria-label="溶劑分子的電荷端朝向離子"></svg><p data-solvation-text aria-live="polite"></p>';
 function draw(){
  const type=root.querySelector('[data-solvent]').value,anion=root.querySelector('[data-ion]').value==='anion',svg=root.querySelector('svg');let shapes=`<circle cx="270" cy="130" r="28" fill="#365c50"/><text x="270" y="137" text-anchor="middle" fill="white" font-size="20">${anion?'Nu⁻':'C⁺'}</text>`;
  for(let i=0;i<4;i++){const a=i*Math.PI/2,x=270+Math.cos(a)*120,y=130+Math.sin(a)*80,rotation=a*180/Math.PI+(anion?0:180);
   shapes+=type==='low'?`<text x="${x}" y="${y}" text-anchor="middle" fill="#365747" font-size="16">hexane</text>`:type==='protic'?`<g transform="translate(${x} ${y}) rotate(${rotation})"><path d="M-26 -18L0 0L-26 18" stroke="#71897a" fill="none" stroke-width="3"/><circle r="13" fill="#a84439"/><circle cx="-26" cy="-18" r="9" fill="#fff" stroke="#71897a"/><circle cx="-26" cy="18" r="9" fill="#fff" stroke="#71897a"/></g>`:`<g transform="translate(${x} ${y}) rotate(${rotation+180})"><circle r="13" fill="#a84439"/><path d="M13 -3H36M13 3H36" stroke="#71897a" stroke-width="2"/><text x="40" y="5" fill="#365747" font-size="14">CMe₂</text></g>`;
  }
  svg.innerHTML=shapes;const text=type==='protic'?(anion?'水的氫端朝向陰離子，形成氫鍵（hydrogen bond）溶劑合作用（solvation），常降低陰離子的 SN2 反應性。':'水的氧端朝向陽離子，以離子–偶極作用穩定電荷。這不是形成新的共價鍵。'):type==='aprotic'?(anion?'acetone 缺少 O–H／N–H 氫鍵供體，不會像水一樣包圍陰離子；仍有其他分子間作用。':'acetone 的氧端可與陽離子作用；非質子性溶劑不代表完全不含氫或沒有極性。'):'低極性溶劑通常不利離子分離；分子仍有分散作用。';root.querySelector('[data-solvation-text]').textContent=text;svg.setAttribute('aria-label',text);
 }
 root.querySelectorAll('select').forEach(n=>n.onchange=draw);draw();
}
