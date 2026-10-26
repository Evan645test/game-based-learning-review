// Island exploration: course stations are islands, their steps are landmarks, and a small chemist walks them.
import {BOOK,CARD_STATIONS,STAGES} from './course-path.js';
import {FIGURES} from './figures-v3.js';
import {esc} from './reason-workbench.js';

// Stations in book order. Each keeps the "island" data shape (landmarks → screens) so progress and detours work unchanged.
const CARD_IDS=new Set(CARD_STATIONS.map(c=>c.id));
export const ISLANDS=BOOK.flatMap(sp=>sp.stations.map(st=>{
 const stage=STAGES.find(s=>s.id===st.id),c=CARD_STATIONS.find(x=>x.id===st.id);
 const name=stage?stage.short:st.id==='final'?'判斷表':c.title.split('：')[0];
 return {id:st.id,section:st.section,spread:sp.id,name,full:stage?stage.title:st.id==='final'?'總複習：判斷表':c.title,kind:stage?'reaction':st.id==='final'?'review':'card'};
}));
const isCardStation=id=>CARD_IDS.has(id);
// The final island never runs out of items; it counts as walked after one round of the nine reaction types.
export const FINAL_COUNT=9;

// Check cards: warm-up cards, stage entry primers, and product-detail cards shown inside a reaction concept.
const detailsOf=st=>st.concepts.flatMap(c=>c.details||[]);
const CARD=new Map([...CARD_STATIONS,...STAGES.flatMap(s=>[...(s.primers||[]),...detailsOf(s)])].map(c=>[c.id,c]));
const stageOf=id=>STAGES.find(s=>s.id===id);

/** Landmarks on an island, in walking order. */
export function islandNodes(id){
 if(isCardStation(id))return [{id:'card',kind:'cards',label:CARD.get(id).title.split('：')[0],cards:[id]}];
 if(id==='final')return [{id:'table',kind:'table',label:'完成判斷表'}];
 const st=stageOf(id);
 return [...(st.primers?.length?[{id:'primers',kind:'cards',label:'入口小暖身',cards:st.primers.map(p=>p.id)}]:[]),
  {id:'concepts',kind:'concepts',label:'概念'},{id:'contrast',kind:'contrast',label:'對比觀察'},{id:'branches',kind:'branches',label:'補流程圖'},{id:'arrows',kind:'arrows',label:'畫電子箭頭'},...(st.mixCount?[{id:'mixed',kind:'mixed',label:'混合練習'}]:[])];
}

/** One screen per thing: read, figure, 3D, check for a card; one pair, branch, mechanism or item per screen elsewhere. */
export function nodeScreens(islandId,node){
 const st=stageOf(islandId);
 // Every card: read → figure (its own diagram or model) → 3D demos → check.
 const cardScreens=c=>[{type:'read',card:c.id},...(c.widget||c.visual||FIGURES[c.id]?[{type:'figure',card:c.id}]:[]),...(c.demos?[{type:'demo',card:c.id}]:[]),...(c.check?[{type:'check',card:c.id}]:[])];
 switch(node.kind){
  case 'cards':return node.cards.flatMap(id=>cardScreens(CARD.get(id)));
  case 'concepts':return st.concepts.flatMap((c,i)=>[{type:'concept',index:i},...(c.widget?[{type:'concept-figure',index:i}]:[]),...(c.details||[]).flatMap(d=>cardScreens(d).map(s=>({...s,concept:i})))]);
  // Why-not comparisons open the contrast landmark, before the prediction pairs.
  case 'contrast':return [...(st.compare||[]).map((id,i)=>({type:'compare',index:i,id})),...st.pairs.map((_,i)=>({type:'pair',index:i}))];
  case 'table':return [{type:'table'}];
  case 'branches':return st.branches.map((_,i)=>({type:'branch',index:i}));
  case 'arrows':return st.arrowKinds.map((_,i)=>({type:'arrow',index:i}));
  case 'mixed':return Array.from({length:st.mixCount},(_,i)=>({type:'item',index:i}));
  default:return [{type:'final'}];
 }
}

/** Where a check card lives: its island, landmark index and the index of its first screen. */
/** Where a why-not comparison is shown: its island, the contrast landmark and the screen. */
export function compareLocation(id){
 const st=STAGES.find(s=>(s.compare||[]).includes(id));if(!st)return null;
 const nodes=islandNodes(st.id),node=nodes.findIndex(n=>n.kind==='contrast');
 return {island:st.id,node,screen:nodeScreens(st.id,nodes[node]).findIndex(s=>s.id===id)};
}
export function cardLocation(id){
 const c=CARD.get(id);if(!c)return null;
const island=isCardStation(id)?id:STAGES.find(s=>(s.primers||[]).includes(c)||detailsOf(s).includes(c)).id,nodes=islandNodes(island),node=nodes.findIndex(n=>n.cards?.includes(id)||n.kind==='concepts'&&detailsOf(stageOf(island)).includes(c));
 return {island,node,screen:nodeScreens(island,nodes[node]).findIndex(s=>s.card===id)};
}

// Presentation landmarks point into existing node/screen coordinates, so saved course positions remain valid.
export function islandBuildings(id){
 const st=stageOf(id);
 return islandNodes(id).flatMap((node,ni)=>{
  const screens=nodeScreens(id,node),groups=[];
  screens.forEach((s,i)=>{
   // Product-detail screens belong to their reaction concept's building.
   const key=s.concept!==undefined?'concept-'+s.concept:s.card||(['concept','concept-figure'].includes(s.type)?'concept-'+s.index:node.id);
   let b=groups.at(-1);
   if(!b||b.key!==key){
    const title=s.card?CARD.get(s.card).title:s.type.startsWith('concept')?st.concepts[s.index].title:node.label;
    b={id:node.cards||node.kind==='concepts'?`${node.id}/${key}`:node.id,key,node:ni,screen:i,end:i,kind:node.kind,card:s.card||null,cards:[],label:title,short:SHORT_CARD[s.card]||title.split(/[：:]/)[0]};groups.push(b);
   }else b.end=i;
   if(s.card&&!b.cards.includes(s.card))b.cards.push(s.card);
  });return groups;
 });
}
const SHORT_CARD={lewis:'路易士結構',formal:'形式電荷',polarity:'鍵極性',hybrid:'混成與形狀',resonance:'共振',acidbase:'酸鹼與 pKa',functional:'官能基',naming:'烷類命名',skeletal:'讀結構式',degree:'碳的級數',conformation:'構形',chair:'椅式',chirality:'掌性與 R/S',reactions:'反應類型',nucleophile:'親核與親電',arrows:'彎箭頭',energy:'能量圖','alkene-name':'烯的命名',carbocation:'碳陽離子','alcohol-name':'醇的命名','halide-name':'鹵烷命名',leaving:'脫離基',sterics:'立體障礙',solvent:'溶劑',basicity:'進攻碳或拔氫',heat:'加熱',equilibrium:'平衡移動'};
export function currentBuilding(id,pos){const all=islandBuildings(id),i=all.findIndex(b=>b.node===pos.node&&pos.screen>=b.screen&&pos.screen<=b.end);return i>=0?i:all.findLastIndex(b=>b.node===pos.node);}

// --- Art: hand-drawn-looking shapes built from seeded wobbly curves, so every island keeps its outline.
export function blobPath(cx,cy,r,seed,sx=1.25,sy=.8){
 const n=9,p=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2,k=r*(.82+.22*Math.sin(seed*3.1+i*2.3));p.push([cx+Math.cos(a)*k*sx,cy+Math.sin(a)*k*sy]);}
 const f=v=>v.toFixed(1);let d=`M${f((p[0][0]+p[n-1][0])/2)} ${f((p[0][1]+p[n-1][1])/2)}`;
 for(let i=0;i<n;i++){const a=p[i],b=p[(i+1)%n];d+=`Q${f(a[0])} ${f(a[1])} ${f((a[0]+b[0])/2)} ${f((a[1]+b[1])/2)}`;}
 return d+'Z';
}
export function chemistSVG(size=44,pose='idle'){
 return `<svg class="chemist pose-${pose}" width="${size}" height="${Math.round(size*1.25)}" viewBox="0 0 100 125" aria-hidden="true" focusable="false"><ellipse cx="50" cy="116" rx="28" ry="5" fill="#314f40" opacity=".13"/><g class="chemist-body"><rect x="66" y="59" width="19" height="38" rx="8" fill="#bd8153"/><path d="M75 52v11l-6 11q-4 13 9 13t9-13l-6-11V52z" fill="#bce8d3" stroke="#568f79" stroke-width="2"/><path d="M70 76h16q5 10-8 10t-8-10" fill="#61b9a0"/><g class="chemist-leg left"><path d="M36 93v17" stroke="#5d7770" stroke-width="12" stroke-linecap="round"/><path d="M36 111h-9" stroke="#765442" stroke-width="11" stroke-linecap="round"/></g><g class="chemist-leg right"><path d="M62 93v17" stroke="#5d7770" stroke-width="12" stroke-linecap="round"/><path d="M62 111h9" stroke="#765442" stroke-width="11" stroke-linecap="round"/></g><g class="chemist-arm left"><path d="M30 67L21 86" stroke="#eeeade" stroke-width="13" stroke-linecap="round"/><circle cx="20" cy="89" r="6" fill="#efbc94"/></g><g class="chemist-arm right"><path d="M69 68L79 84" stroke="#fffdf3" stroke-width="13" stroke-linecap="round"/><circle cx="81" cy="87" r="6" fill="#efbc94"/></g><path d="M32 60Q50 51 68 60L73 98Q50 106 27 98Z" fill="#fffdf4" stroke="#e0d5bc" stroke-width="1.5"/><path d="M43 59h14v35H43z" fill="#6caba0"/><path d="M37 58l11 9-9 12-5-15m29-6-11 9 9 12 5-15" fill="#f1ecda"/><path d="M58 83h10v9H58z" fill="#d6e7df"/><circle cx="52" cy="86" r="1.5" fill="#c2b69a"/><g class="chemist-head"><ellipse cx="49" cy="37" rx="28" ry="27" fill="#edb18a"/><circle cx="22" cy="40" r="5" fill="#efbc94"/><circle cx="77" cy="40" r="5" fill="#efbc94"/><path d="M22 34Q14 6 43 6Q66-2 77 19l-1 16-7-14q-10 10-25 2-5 8-16 7l-5 13z" fill="#73513c"/><path d="M29 15q14-10 32-1" stroke="#916a4c" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M23 29h51" stroke="#a47c4b" stroke-width="5"/><rect x="25" y="23" width="22" height="16" rx="7" fill="#d5efea" stroke="#c89d59" stroke-width="3"/><rect x="52" y="23" width="22" height="16" rx="7" fill="#d5efea" stroke="#c89d59" stroke-width="3"/><path d="M47 29h5m-20-1h8m19 0h8" stroke="#fffdf4" stroke-width="2" stroke-linecap="round"/><g class="chemist-eyes" fill="#4a4636"><ellipse cx="38" cy="44" rx="2.7" ry="3.4"/><ellipse cx="61" cy="44" rx="2.7" ry="3.4"/></g><ellipse cx="30" cy="50" rx="5" ry="2.5" fill="#e7967d" opacity=".65"/><ellipse cx="69" cy="50" rx="5" ry="2.5" fill="#e7967d" opacity=".65"/><path d="M44 52q6 6 12 0" fill="none" stroke="#9d6449" stroke-width="2" stroke-linecap="round"/></g></g></svg>`;
}

// Close-up island accents (cycled for thirteen islands); the world map itself lives in archipelago-art.js.
const VILLAGES=[{color:'#c9795a'},{color:'#5d899b'},{color:'#b88232'},{color:'#8c739d'},{color:'#558a7f'},{color:'#93704e'},{color:'#b36e51'}];
const pct=(v,t)=>`${(v/t*100).toFixed(2)}%`;
const atlasDefs=(id,src='hex-village-atlas.png')=>`<defs><image id="${id}" href="${src}" width="1024" height="512" preserveAspectRatio="none"/><radialGradient id="${id}-water"><stop stop-color="#c5e7da"/><stop offset="1" stop-color="#7dc8c8"/></radialGradient></defs>`;
function tile(id,i,x,y,w,h,extra=''){return `<svg class="village-tile ${extra}" x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${i%4*256} ${Math.floor(i/4)*256} 256 256" preserveAspectRatio="xMidYMid slice" overflow="hidden"><use href="#${id}"/></svg>`;}
function waves(w,h){return Array.from({length:36},(_,i)=>`<path class="sea-ripple" style="--delay:${i%7*-1}s" d="M${(i*113)%Math.max(w-25,1)+8} ${(i*173)%Math.max(h-20,1)+10}q7 -4 14 0t14 0" stroke="#e2f5e8" stroke-width="2" opacity=".6" fill="none"/>`).join('');}

export function motionToggleHTML(){const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true,paused=reduced||globalThis.document?.body?.dataset.artMotion==='paused';return `<button type="button" class="art-motion-toggle" data-art-motion aria-pressed="${!paused}" aria-label="${reduced?'已依系統設定減少環境動態':`${paused?'開啟':'暫停'}環境動態`}" ${reduced?'disabled':''}><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3v10m8-10v10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg><span>${reduced?'減少動態':`動態：${paused?'關':'開'}`}</span></button>`;}
export function ambientHTML(){return '<div class="village-ambient" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>';}


// Island close-up (viewBox 360 × 470): landmark spots along a winding path.
const ISLAND={w:720,h:840};
export function buildingLayout(count){
 if(count===1)return [{x:360,y:420}];
 const rows=Math.ceil(count/3),out=[];
 for(let row=rows-1;row>=0;row--){
  const cols=Math.min(3,count-row*3),line=Array.from({length:cols},(_,col)=>({x:rows===1?360+(col-(cols-1)/2)*173:152+col*173+(row%2?86:0),y:(840-(rows-1)*150)/2+row*150}));
  const previous=out.at(-1);if(previous&&Math.abs(previous.x-line[0].x)>Math.abs(previous.x-line.at(-1).x))line.reverse();out.push(...line);
 }return out;
}
export const spotFor=(count,i)=>{const p=buildingLayout(count)[Math.max(0,Math.min(i,count-1))];return {left:pct(p.x-40,ISLAND.w),top:pct(p.y+40,ISLAND.h)};};
// Roads run along hex edges like a board game: each building joins the road by a short spur from its front yard to its lower-left corner.
const HEX_R=100,foot=p=>({x:p.x-40,y:p.y+40}),corner=(p,k)=>{const a=(k*60-90)*Math.PI/180;return {x:+(p.x+Math.cos(a)*HEX_R).toFixed(1),y:+(p.y+Math.sin(a)*HEX_R).toFixed(1)};};
function edgeWalk(cells,from,to){
 // Neighbouring tiles sit 173 apart (not exactly √3·r), so shared corners are snapped together.
 const known=[],owners=[],key=v=>{let k=known.findIndex(u=>Math.hypot(u.x-v.x,u.y-v.y)<3);if(k<0){k=known.push(v)-1;owners.push([]);}return k;},shared=new Map();
 for(const c of cells)for(let k=0;k<6;k++){const u=key(corner(c,k)),v=key(corner(c,(k+1)%6)),e=Math.min(u,v)+'-'+Math.max(u,v);owners[u].push(c);shared.set(e,(shared.get(e)||0)+1);}
 // Seams between two tiles are preferred; a coastline edge would hang half over the water.
 const cost=(u,v)=>shared.get(Math.min(u,v)+'-'+Math.max(u,v))>1?1:6,next=new Map();
 for(const e of shared.keys()){const [u,v]=e.split('-').map(Number);for(const [x,y] of [[u,v],[v,u]]){if(!next.has(x))next.set(x,[]);next.get(x).push(y);}}
 // A building joins the road at its lower-left or bottom corner, where its own dirt path reaches the tile edge.
 const entry=c=>{const [l,b]=[4,3].map(k=>key(corner(c,k)));return owners[b].length>owners[l].length?b:l;};
 const start=entry(cells[from]),goal=entry(cells[to]),dist=new Map([[start,0]]),prev=new Map(),open=new Set([start]);
 while(open.size){
  const u=[...open].reduce((a,b)=>dist.get(a)<=dist.get(b)?a:b);open.delete(u);if(u===goal)break;
  for(const v of next.get(u)){const d=dist.get(u)+cost(u,v);if(d<(dist.get(v)??Infinity)){dist.set(v,d);prev.set(v,u);open.add(v);}}
 }
 // Corners on the coast are pulled a few units inland so the road never overhangs the water.
 const inland=u=>{const o=owners[u],p=known[u];if(o.length>2)return p;const m={x:o.reduce((s,c)=>s+c.x,0)/o.length,y:o.reduce((s,c)=>s+c.y,0)/o.length},d=Math.hypot(m.x-p.x,m.y-p.y);return {x:+(p.x+(m.x-p.x)*8/d).toFixed(1),y:+(p.y+(m.y-p.y)*8/d).toFixed(1)};};
 const out=[];for(let u=goal;u!==undefined;u=prev.get(u))out.unshift(inland(u));return out;
}
export function walkingRoute(count,from=0,to=count-1){
 const cells=buildingLayout(count),route=[foot(cells[from])],step=to>=from?1:-1;
 for(let i=from;i!==to;i+=step)route.push(...edgeWalk(cells,i,i+step),foot(cells[i+step]));
 return route;
}
function hexPoints(x,y,r){return Array.from({length:6},(_,i)=>{const a=(i*60-90)*Math.PI/180;return `${(x+Math.cos(a)*r).toFixed(1)},${(y+Math.sin(a)*r).toFixed(1)}`;}).join(' ');}

/** nodes: [{id,label,state:'done'|'next'|'todo',flag}], hero: landmark index. */
export function islandViewHTML({island,nodes,hero}){
 if(nodes[0]?.node===undefined)nodes=islandBuildings(island).map(b=>({...nodes[b.node],...b,short:b.short}));
 const pts=buildingLayout(nodes.length),path=walkingRoute(nodes.length).map((p,i)=>(i?'L':'M')+`${p.x} ${p.y}`).join(' '),v=ISLANDS.findIndex(x=>x.id===island),id='hex-close';
 const grounds=pts.map((p,i)=>`<polygon points="${hexPoints(p.x,p.y+5,100)}" fill="#a48f61" stroke="#a48f61" stroke-width="3"/><polygon points="${hexPoints(p.x,p.y,100)}" fill="${['#cad99e','#d2dba4','#c0d3a3'][i%3]}" stroke="#ede2bb" stroke-width="3"/>`).join('');
 const buildings=pts.map((p,i)=>tile(id,(v+i)%7,p.x-105,p.y-110,210,210)).join('');
 const buttons=nodes.map((n,i)=>{const p=pts[i],status=n.state==='done'?'已走過':n.state==='next'?'下一站':'還沒到';return `<button type="button" class="node-btn concept-building" data-node="${i}" data-concept-building="${esc(n.id)}" data-node-state="${n.state}" style="left:${pct(p.x,ISLAND.w)};top:${pct(p.y,ISLAND.h)}" aria-label="${esc(n.label)}（${status}${n.flag?'；紅旗：需回看':''}）"><span class="node-dot">${n.state==='done'?'✓':i+1}</span><span class="node-label">${esc(n.short||n.label)}</span>${n.flag?'<span class="node-flag" aria-hidden="true">⚑</span>':''}</button>`;}).join('');
 const h=spotFor(nodes.length,Math.min(hero,nodes.length-1));
 return `<div class="island-view hex-island" data-island-view="${island}" style="--village-accent:${VILLAGES[v%VILLAGES.length].color}"><svg viewBox="0 0 ${ISLAND.w} ${ISLAND.h}" aria-hidden="true" focusable="false">${atlasDefs(id,'hex-village-atlas.png')}<rect width="720" height="840" fill="url(#${id}-water)"/>${waves(720,840)}${grounds}${buildings}<path class="village-road" d="${path}" stroke="#9a7a4c" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path class="village-road" d="${path}" stroke="#dcbd84" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg><span class="village-sign" aria-hidden="true">${esc(ISLANDS[v].full)}</span>${buttons}<div class="voyager walker" data-hero style="left:${h.left};top:${h.top}">${chemistSVG(48)}</div></div>`;
}
