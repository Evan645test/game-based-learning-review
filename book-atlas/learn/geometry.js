export const V = {
  add:(a,b)=>a.map((x,i)=>x+b[i]), sub:(a,b)=>a.map((x,i)=>x-b[i]),
  mul:(a,k)=>a.map(x=>x*k), dot:(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),
  cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
  unit:a=>{const d=Math.hypot(...a);return d?a.map(x=>x/d):[0,0,0];}
};
const rad=d=>d*Math.PI/180;
export function bondAngle(a,b,c) {
  return Math.acos(Math.max(-1,Math.min(1,V.dot(V.unit(V.sub(a,b)),V.unit(V.sub(c,b))))))*180/Math.PI;
}
export function dihedral(a,b,c,d) {
  const axis=V.unit(V.sub(c,b));
  const p=V.sub(a,b),q=V.sub(d,c);
  const u=V.sub(p,V.mul(axis,V.dot(p,axis))),v=V.sub(q,V.mul(axis,V.dot(q,axis)));
  return Math.atan2(V.dot(V.cross(axis,u),v),V.dot(u,v))*180/Math.PI;
}
const polar=(x,length,phi)=>[x,length*Math.cos(rad(phi)),length*Math.sin(rad(phi))];
function atom(id,el,label,p,selectable=false) {return {id,el,label,p,selectable};}

export function makeModel(kind,state) {
  const atoms=[],bonds=[];
  const add=(id,el,label,p,sel=false)=>{atoms.push(atom(id,el,label,p,sel));return p;};
  const bond=(a,b,order=1,dashed=false)=>bonds.push({a,b,order,dashed});
  if(kind==='chair') {
    const active=state.chair==='axial';
    for(let i=0;i<6;i++) {
      const phi=rad(30+i*60),z=(i%2===0?1:-1)*(active?0.25:-0.25);
      add('C'+(i+1),'C','C'+(i+1),[1.4*Math.cos(phi),1.4*Math.sin(phi),z]);
      bond('C'+(i+1),'C'+((i+1)%6+1));
    }
    function substituent(c,id,el,label,up,length,sel=false) {
      const p=atoms.find(a=>a.id===c).p,sign=p[2]>0?1:-1;
      const isAxial=up===sign;
      const dir=isAxial?[0,0,up]:[Math.cos(Math.atan2(p[1],p[0]))*Math.sqrt(8/9),Math.sin(Math.atan2(p[1],p[0]))*Math.sqrt(8/9),up/3];
      add(id,el,label,V.add(p,V.mul(dir,length)),sel);bond(c,id);
    }
    substituent('C1','Br','Br','Br',1,1.94);
    substituent('C1','H1','H','H1',-1,1.09);
    substituent('C2','Me','C','Me',-1,1.54);
    substituent('C2','H2','H','H2',1,1.09,true);
    substituent('C6','H6','H','H6',-1,1.09,true);
    substituent('C6','H6b','H','H6′',1,1.09,true);
    const p=id=>atoms.find(a=>a.id===id).p;
    const measured=dihedral(p(state.beta==='H2'?'H2':state.beta==='H6b'?'H6b':'H6'),p(state.beta==='H2'?'C2':'C6'),p('C1'),p('Br'));
    return {atoms,bonds,measurement:Math.abs(measured),measurementLabel:'H–Cβ–C1–Br 二面角',note:active?'雙軸向椅式：Br 向上、Me 向下。':'雙赤道向椅式：Br 向上、Me 向下。',kind};
  }
  if(kind==='sn1'||kind==='e1') {
    const step=Number(state.step||0),ionized=step>=1,planar=step===1;
    const incomingFace=state.face==='back'?-1:1;
    add('CA','C',planar?'Cα⁺':'Cα',[0,0,0]);
    const groups=kind==='sn1'?[['M1','Me'],['M2','Me'],['M3','Me']]:[['M1','Me'],['M2','Me'],['CB','CH₂']];
    groups.forEach(([id,label],i)=>{
      const p=planar?[1.54*Math.cos(rad(i*120)),1.54*Math.sin(rad(i*120)),0]:[1.452*Math.cos(rad(i*120)),1.452*Math.sin(rad(i*120)),-0.513*(step>=2?incomingFace:1)];
      add(id,'C',label,p);bond('CA',id);
    });
    add('Br','Br',ionized?'Br⁻':'Br',[0,0,ionized?3.6:1.94]);if(!ionized)bond('CA','Br');
    if(kind==='e1') {
      const cb=atoms.find(a=>a.id==='CB').p;
      add('Hethyl','H','Hβ（乙基側）',V.add(cb,[-0.3,-0.3,1.05]),true);bond('CB','Hethyl');
      add('M4','C','Me',V.add(cb,[-0.8,-1.25,-0.4]));bond('CB','M4');
      const m=atoms.find(a=>a.id==='M1').p;
      add('Hmethyl','H','Hβ（甲基側）',V.add(m,[.8,.1,.8]),true);bond('M1','Hmethyl');
    } else {
      const face=state.face==='back'?-1:1;
      add('Nu','O',step>=2?'H₂O⁺':'H₂O',[0,0,face*(step>=2?1.6:3.2)]);
      if(step>=2)bond('CA','Nu',1,false);else if(planar)bond('CA','Nu',1,true);
    }
    return {atoms,bonds,measurement:planar?120:109.5,measurementLabel:'中心鍵角（教學理想值）',note:planar?'平面碳陽離子；各 Me 為縮合甲基。':'四面體受質；先觀察離去與進攻的先後。',kind};
  }
  const t=Number(state.torsion??60),choice=state.beta||'HB1';
  add('CA','C','Cα',[0,0,0]);add('CB','C','Cβ',[1.54,0,0]);bond('CA','CB');
  const br=polar(-1.94/3,1.94*Math.sqrt(8/9),0);
  add('Br','Br','Br',br);bond('CA','Br');
  add('M1','C','Me',polar(-1.54/3,1.54*Math.sqrt(8/9),120));bond('CA','M1');
  add('HA','H','Hα',polar(-1.09/3,1.09*Math.sqrt(8/9),240));bond('CA','HA');
  const shift=choice==='HB2'?-120:0;
  [['HB1','H','Hβ1',1.09,0],['HB2','H','Hβ2',1.09,120],['M4','C','Me',1.54,240]].forEach(([id,el,label,len,off])=>{
    add(id,el,label,V.add([1.54,0,0],polar(len/3,len*Math.sqrt(8/9),t+shift+off)),el==='H');bond('CB',id);
  });
  if(kind==='sn2') {
    const a=rad(Number(state.approach??70)),n=V.unit(br),orth=[0,0,1];
    const direction=V.add(V.mul(n,Math.cos(a)),V.mul(orth,Math.sin(a)));
    add('Nu','I','I⁻',V.mul(direction,3.2));bond('CA','Nu',1,true);
  }
  const p=id=>atoms.find(a=>a.id===id).p;
  const measured=kind==='sn2'?bondAngle(p('Nu'),p('CA'),p('Br')):Math.abs(dihedral(p(choice),p('CB'),p('CA'),p('Br')));
  return {atoms,bonds,measurement:measured,measurementLabel:kind==='sn2'?'Nu–Cα–Br 進攻角':'H–Cβ–Cα–Br 二面角',note:'局部反應模型：Me 表示 CH₃；球棍用於觀察幾何。',kind};
}

const NS='http://www.w3.org/2000/svg';
const svgEl=(tag,attrs={})=>{const el=document.createElementNS(NS,tag);for(const [key,val]of Object.entries(attrs))el.setAttribute(key,String(val));return el;};
const colors={C:'#485a64',H:'#e5eaec',Br:'#a75135',I:'#71609e',O:'#bb4552'};

export class MoleculeViewer {
  constructor(host,onSelect) {
    this.host=host;this.onSelect=onSelect;this.yaw=-0.45;this.pitch=0.45;this.zoom=1;this.view='ball';this.selected='';this.destroyed=false;
    this.svg=svgEl('svg',{viewBox:'0 0 640 420',role:'img','aria-label':'可旋轉的三維分子。使用下方按鈕旋轉視角與構形控制。'});
    this.svg.classList.add('molecule-svg');this.caption=document.createElement('p');this.caption.className='geometry-caption';this.caption.hidden=true;host.replaceChildren(this.svg,this.caption);
    this.labelObserver=new ResizeObserver(()=>this.sizeLabels());this.labelObserver.observe(this.svg);
    this.controller=new AbortController();const signal=this.controller.signal;
    let drag=null;
    this.svg.addEventListener('pointerdown',e=>{if(e.target.closest('[data-atom]'))return;drag={x:e.clientX,y:e.clientY};this.svg.setPointerCapture(e.pointerId);},{signal});
    this.svg.addEventListener('pointermove',e=>{if(!drag)return;this.yaw+=(e.clientX-drag.x)*.012;this.pitch+=(e.clientY-drag.y)*.012;drag={x:e.clientX,y:e.clientY};this.render();},{signal});
    const stop=()=>{drag=null;};this.svg.addEventListener('pointerup',stop,{signal});this.svg.addEventListener('pointercancel',stop,{signal});
    this.svg.addEventListener('click',e=>{const id=e.target.closest('[data-atom]')?.dataset.atom;if(id)this.onSelect(id);},{signal});
  }
  set(model,selected=''){this.model=model;this.selected=selected;this.render();}
  rotate(x,y){this.yaw+=x;this.pitch+=y;this.render();}
  reset(){this.yaw=-.45;this.pitch=.45;this.zoom=1;this.render();}
  project(p) {
    const cy=Math.cos(this.yaw),sy=Math.sin(this.yaw),cx=Math.cos(this.pitch),sx=Math.sin(this.pitch);
    const x=p[0]*cy+p[2]*sy,z=-p[0]*sy+p[2]*cy,y=p[1]*cx-z*sx,zz=p[1]*sx+z*cx;
    const scale=67*this.zoom*(9/(9+zz));return {x:320+x*scale,y:205-y*scale,z:zz,scale};
  }
  render() {
    if(this.destroyed||!this.model)return;
    this.svg.replaceChildren();this.caption.hidden=this.view!=='newman';
    const defs=svgEl('defs');
    Object.entries(colors).forEach(([el,col])=>{const g=svgEl('radialGradient',{id:'sphere-'+el,cx:'30%',cy:'24%',r:'75%'});g.append(svgEl('stop',{offset:'0%','stop-color':el==='H'?'#ffffff':'#e2e9e9'}),svgEl('stop',{offset:'36%','stop-color':col}),svgEl('stop',{offset:'100%','stop-color':el==='H'?'#adb9bf':col}));defs.append(g);});this.svg.append(defs);
    if(this.view==='newman'&&['sn2','e2'].includes(this.model.kind)){this.renderNewman();this.sizeLabels();return;}
    const pts=Object.fromEntries(this.model.atoms.map(a=>[a.id,this.project(a.p)]));
    const items=this.model.bonds.map(b=>({...b,type:'bond',depth:(pts[b.a].z+pts[b.b].z)/2})).concat(this.model.atoms.map(a=>({...a,type:'atom',depth:pts[a.id].z}))).sort((a,b)=>a.type!==b.type?(a.type==='bond'?-1:1):b.depth-a.depth);
    for(const item of items){
      if(item.type==='bond'){
        const a=pts[item.a],b=pts[item.b];
        this.svg.append(svgEl('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:item.dashed?'#8c83a2':'#a0adb3','stroke-width':item.dashed?2.3:8,'stroke-linecap':'round','stroke-dasharray':item.dashed?'6 7':'none'}));
      }else{
        const p=pts[item.id],r=(item.el==='H'?11:item.el==='C'?20:24)*(p.scale/67);
        const g=svgEl('g',{'data-atom':item.selectable?item.id:'',class:item.selectable?'selectable-atom':''});
        if(item.id===this.selected)g.append(svgEl('circle',{cx:p.x,cy:p.y,r:r+7,fill:'none',stroke:'#bd640d','stroke-width':3,'stroke-dasharray':'5 3'}));
        g.append(svgEl('circle',{cx:p.x,cy:p.y,r,fill:`url(#sphere-${item.el})`,stroke:item.el==='H'?'#87989f':'#ffffff','stroke-width':1.3}));
        const label=svgEl('text',{x:p.x,y:p.y+(item.el==='H'?r+16:5),'data-anchor-x':p.x,'data-anchor-y':p.y,'data-anchor-r':r,'text-anchor':'middle',fill:item.el==='H'?'#374c58':'#ffffff','font-size':item.el==='H'?12:13,'font-weight':650});label.textContent=item.label;g.append(label);this.svg.append(g);
      }
    }
    this.sizeLabels();
  }
  sizeLabels(){
    if(this.destroyed)return;const matrix=this.svg.getScreenCTM();if(!matrix)return;
    const scale=Math.hypot(matrix.a,matrix.b);if(!scale)return;
    const labels=[...this.svg.querySelectorAll('g>text')];
    for(const text of labels){text.style.fontSize=14/scale+'px';text.style.fill='#203e32';text.style.paintOrder='stroke';text.style.stroke='#f4f7f2';text.style.strokeWidth=3/scale+'px';text.style.strokeLinejoin='round';}
    this.svg.querySelector('[data-label-leaders]')?.remove();const leaders=svgEl('g',{'data-label-leaders':'','aria-hidden':'true'});this.svg.insertBefore(leaders,this.svg.firstChild);
    const anchors=labels.map(text=>({text,x:Number(text.dataset.anchorX),y:Number(text.dataset.anchorY),r:Number(text.dataset.anchorR)})),placed=[],overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
    anchors.sort((a,b)=>(a.text.textContent.includes('Cα')?-1:0)-(b.text.textContent.includes('Cα')?-1:0));
    for(const a of anchors){const w=a.text.getComputedTextLength()+8/scale,h=20/scale,gap=a.r+6/scale,candidates=[[a.x+gap,a.y-h/2],[a.x-gap-w,a.y-h/2],[a.x-w/2,a.y-gap-h],[a.x-w/2,a.y+gap],[a.x+gap,a.y-gap-h],[a.x-gap-w,a.y+gap]];
      for(const x of [8/scale,640-w-8/scale])for(let y=10/scale;y<420-h;y+=24/scale)candidates.push([x,y]);
      const best=candidates.map(([x,y],i)=>{const box={x:Math.max(4,Math.min(636-w,x)),y:Math.max(4,Math.min(416-h,y)),w,h};let cost=Math.hypot(box.x+w/2-a.x,box.y+h/2-a.y)*.15+i*.2;for(const b of placed)cost+=overlap(box,b)*100;for(const b of anchors)cost+=overlap(box,{x:b.x-b.r-2,y:b.y-b.r-2,w:2*b.r+4,h:2*b.r+4})*10;return {box,cost};}).sort((a,b)=>a.cost-b.cost)[0].box;
      placed.push(best);a.text.setAttribute('x',best.x+w/2);a.text.setAttribute('y',best.y+h*.72);leaders.append(svgEl('line',{x1:a.x,y1:a.y,x2:Math.max(best.x,Math.min(best.x+w,a.x)),y2:Math.max(best.y,Math.min(best.y+h,a.y)),stroke:'#7b9384','stroke-width':1/scale}));
    }
  }
  renderNewman() {
    const at=id=>this.model.atoms.find(a=>a.id===id);const center=[320,205],length=100;
    this.svg.append(svgEl('circle',{cx:320,cy:205,r:42,fill:'#edf2ef',stroke:'#687a82','stroke-width':2}));
    for(const [front,ids]of [[false,['HB1','HB2','M4']],[true,['Br','M1','HA']]]){
      for(const id of ids){const a=at(id),angle=Math.atan2(a.p[2],a.p[1]),x=center[0]+length*Math.cos(angle),y=center[1]-length*Math.sin(angle),sx=front?320:320+42*Math.cos(angle),sy=front?205:205-42*Math.sin(angle);
        const g=svgEl('g',{'data-atom':a.selectable?a.id:'',class:a.selectable?'selectable-atom':''});
        g.append(svgEl('line',{x1:sx,y1:sy,x2:x,y2:y,stroke:front?'#425760':'#94a6ab','stroke-width':front?6:4}));
        g.append(svgEl('circle',{cx:x,cy:y,r:22,fill:colors[a.el],stroke:id===this.selected?'#bd640d':'#d0dcdf','stroke-width':id===this.selected?4:1}));
        const t=svgEl('text',{x,y:y+5,'data-anchor-x':x,'data-anchor-y':y,'data-anchor-r':22,'text-anchor':'middle',fill:a.el==='H'?'#253c46':'#fff','font-size':13,'font-weight':650});t.textContent=a.label;g.append(t);this.svg.append(g);
      }
    }
    this.svg.append(svgEl('circle',{cx:320,cy:205,r:8,fill:'#425760'}));
    this.caption.textContent='沿 Cα → Cβ 觀察；點為前碳，圓為後碳。';
  }
  destroy(){this.destroyed=true;this.controller.abort();this.labelObserver.disconnect();}
}
