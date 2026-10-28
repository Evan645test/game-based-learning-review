"use strict";
(() => {
  const data = window.BOOK_ATLAS;
  const svg = document.getElementById("map");
  const panel = document.getElementById("panel");
  const workspace = document.getElementById("workspace");
  const tooltip = document.getElementById("tooltip");
  const search = document.getElementById("search");
  const results = document.getElementById("results");
  const jump = document.getElementById("chapter-jump");
  const NS = "http://www.w3.org/2000/svg";
  const W = 3300, H = 2160;
  const all = [...data.regions, ...data.chapters, ...data.sections];
  const nodes = new Map(all.map(n => [n.id, {...n}]));
  const groups = new Map();
  const typeNames = {core:"核心基礎", support:"輔助基礎", application:"相關反應基礎"};
  const state = {selected:null, hovered:null, backbone:false, reading:false, camera:{x:0,y:0,w:W,h:H}, drag:null, suppressClick:false};
  const s = (tag, attrs = {}, text) => {
    const node = document.createElementNS(NS, tag);
    for (const [k,v] of Object.entries(attrs)) node.setAttribute(k,String(v));
    if (text !== undefined) node.textContent=text;
    return node;
  };
  const el = (tag, className, text) => {
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(text!==undefined)node.textContent=text;
    return node;
  };
  const button = (label, action, className) => {
    const b=el("button",className,label);b.type="button";b.addEventListener("click",action);return b;
  };
  const announce = text => {document.getElementById("announcement").textContent=text;};
  const label = n => n.kind==="chapter" ? `第${n.number}章 ${n.title}` : n.kind==="section" ? `${n.id} ${n.title}` : n.title;
  // Selecting a concept looks back at its own foundations. Never reverse an
  // outgoing dependency or a peer comparison into a prerequisite.
  const edgesFor = id => data.edges.filter(e=>e.target===id&&e.type!=="comparison");
  const sectionBaseCount=data.edges.filter(e=>e.level==="section"&&e.type!=="comparison").length;
  const chapterOf = n => n.kind==="chapter"?n:n.kind==="section"?nodes.get(`c${n.chapter}`):null;
  const colorOf = n => nodes.get(n.kind==="region"?n.id:n.region).color;

  function layout() {
    for(const r of data.regions){
      const n=nodes.get(r.id),index=r.number-1;
      Object.assign(n,{x:60+(index%3)*1060,y:45+Math.floor(index/3)*700,w:1020,h:650});
      n.cx=n.x+n.w/2;n.cy=n.y+n.h/2;
      const chapters=data.chapters.filter(c=>c.region===r.id);
      chapters.forEach((c,i)=>{
        const cn=nodes.get(c.id),count=chapters.length;
        let cx,cy,radius;
        if(count===2){cx=n.x+270+i*480;cy=n.y+360;radius=158;}
        else if(count===3){cx=n.x+190+i*320;cy=n.y+360;radius=137;}
        else {const row=Math.floor(i/3),col=i%3;const lastCount=count-3;
          cx=n.x+(row===1&&lastCount===2?350+col*320:190+col*320);cy=n.y+270+row*235;radius=103;}
        Object.assign(cn,{cx,cy,radius});
        cn.sections.forEach((id,j)=>{
          const sn=nodes.get(id),angle=j*.64+cn.number*.7;
          const distance=radius*(.51+.46*Math.sqrt(j/Math.max(1,cn.sections.length-1)));
          Object.assign(sn,{cx:cx+Math.cos(angle)*distance,cy:cy+Math.sin(angle)*distance*.87,radius:12});
        });
      });
    }
  }

  const defs=s("defs");
  for(const [type,color] of Object.entries({core:"#9bd4d0",support:"#b3bedb",application:"#b4d5a3",route:"#dcba7e"})){
    const marker=s("marker",{id:`arrow-${type}`,markerWidth:8,markerHeight:8,viewBox:"0 0 8 8",refX:7,refY:4,orient:"auto",markerUnits:"userSpaceOnUse"});
    marker.append(s("path",{d:"M0 1 L7 4 L0 7",fill:"none",stroke:color,"stroke-width":1.25}));defs.append(marker);
  }
  svg.append(defs);
  const regionLayer=s("g",{"aria-label":"主題區"});
  const dustLayer=s("g",{"aria-hidden":"true", "pointer-events":"none"});
  const routeLayer=s("g",{"aria-hidden":"true", "pointer-events":"none"});
  const edgeLayer=s("g",{"aria-hidden":"true", "pointer-events":"none"});
  const nodeLayer=s("g",{"aria-label":"章節與小節"});
  svg.append(regionLayer,dustLayer,routeLayer,edgeLayer,nodeLayer);
  layout();

  function interactive(n, group) {
    group.dataset.node=n.id;
    group.setAttribute("role","button");group.setAttribute("tabindex",n.id==="c1"?"0":"-1");
    group.setAttribute("aria-label",label(n));group.setAttribute("aria-pressed","false");
    group.addEventListener("pointerenter",()=>{state.hovered=n.id;updateTooltip();});
    group.addEventListener("pointerleave",()=>{state.hovered=null;updateTooltip();});
    group.addEventListener("focus",()=>{state.hovered=n.id;updateTooltip();});
    group.addEventListener("blur",()=>{state.hovered=null;updateTooltip();});
    group.addEventListener("click",event=>{
      event.stopPropagation();if(state.suppressClick)return;
      select(n.id,{focus:n.kind!=="section"});
    });
    group.addEventListener("keydown",event=>nodeKey(event,n));
    groups.set(n.id,group);
  }

  for(const r of data.regions){
    const n=nodes.get(r.id),g=s("g");
    const fill=s("radialGradient",{id:`mist-${n.id}`});
    fill.append(s("stop",{offset:0,"stop-color":n.color,"stop-opacity":.07}),s("stop",{offset:1,"stop-color":n.color,"stop-opacity":0}));defs.append(fill);
    g.append(s("ellipse",{cx:n.cx,cy:n.cy+45,rx:520,ry:320,fill:`url(#mist-${n.id})`,"pointer-events":"none"}));
    const title=s("g",{transform:`translate(${n.x+35} ${n.y+64})`});
    title.append(s("rect",{x:-12,y:-40,width:980,height:112,fill:"transparent"}),s("text",{class:"region-title",x:0,y:0},`${String(n.number).padStart(2,"0")}  ${n.title}`));
    const ch=data.chapters.filter(c=>c.region===n.id),count=ch.reduce((sum,c)=>sum+c.sections.length,0);
    title.append(s("text",{class:"region-meta",x:0,y:60},`第 ${n.start}–${n.end} 章 · ${count} 小節`));
    interactive(n,title);g.append(title);regionLayer.append(g);
  }
  for(const original of data.chapters){
    const n=nodes.get(original.id),color=colorOf(n),g=s("g");
    // Faint local arcs are decorative galaxy texture, never concept edges.
    const cloud=s("g",{transform:`translate(${n.cx} ${n.cy}) rotate(${n.number*17%90-45})`});
    cloud.append(s("ellipse",{rx:n.radius+20,ry:n.radius*.72,fill:"none",stroke:color,"stroke-opacity":.055,"stroke-width":25}),
      s("ellipse",{rx:n.radius*.8,ry:n.radius*.55,fill:"none",stroke:color,"stroke-opacity":.13,"stroke-width":1}));dustLayer.append(cloud);
    g.append(s("circle",{class:"galaxy-halo",cx:n.cx,cy:n.cy,r:48,fill:color}),s("circle",{class:"chapter-disc",cx:n.cx,cy:n.cy,r:27}),
      s("circle",{class:"node-focus",cx:n.cx,cy:n.cy,r:34}),s("text",{class:"chapter-number",x:n.cx,y:n.cy},String(n.number).padStart(2,"0")));
    interactive(n,g);nodeLayer.append(g);
  }
  for(const original of data.sections){
    const n=nodes.get(original.id),g=s("g");
    g.append(s("circle",{class:"star-hit",cx:n.cx,cy:n.cy,r:18,fill:"transparent"}),s("circle",{class:"selected-ring",cx:n.cx,cy:n.cy,r:14}),s("circle",{class:"node-focus",cx:n.cx,cy:n.cy,r:17}),s("circle",{class:"star-core",cx:n.cx,cy:n.cy,r:6}));
    interactive(n,g);nodeLayer.append(g);
  }

  function scale() {const r=svg.getBoundingClientRect();return Math.min(r.width/state.camera.w,r.height/state.camera.h)||1;}
  function applyCamera() {
    const c=state.camera;svg.setAttribute("viewBox",`${c.x} ${c.y} ${c.w} ${c.h}`);
    const sc=scale();
    svg.querySelectorAll(".region-title").forEach(t=>t.setAttribute("font-size",14/sc));
    svg.querySelectorAll(".region-meta").forEach(t=>{t.setAttribute("font-size",10/sc);t.setAttribute("y",23/sc);});
    svg.querySelectorAll(".chapter-number").forEach(t=>t.setAttribute("font-size",13/sc));
    svg.querySelectorAll(".chapter-disc").forEach(c=>c.setAttribute("r",Math.max(19,16/sc)));
    svg.querySelectorAll(".galaxy-halo").forEach(c=>c.setAttribute("r",Math.max(36,26/sc)));
    svg.querySelectorAll("[data-node^='c'] .node-focus").forEach(c=>c.setAttribute("r",Math.max(26,21/sc)));
    svg.querySelectorAll(".star-core").forEach(c=>c.setAttribute("r",Math.min(8,3.1/sc)));
    svg.querySelectorAll(".selected-ring").forEach(c=>c.setAttribute("r",Math.min(18,8/sc)));
    svg.querySelectorAll(".star-hit").forEach(c=>c.setAttribute("r",Math.min(25,10/sc)));
    defs.querySelectorAll("marker").forEach(m=>{m.setAttribute("markerWidth",8/sc);m.setAttribute("markerHeight",8/sc);});
    for(const path of [...edgeLayer.children,...routeLayer.children])path.setAttribute("d",pathBetween(nodes.get(path.dataset.source),nodes.get(path.dataset.target)));
    document.getElementById("zoom-label").value=`${Math.round(W/c.w*100)}%`;
    document.getElementById("zoom-out").disabled=c.w>=W*1.49;
    document.getElementById("zoom-in").disabled=c.w<=W/11.99;
    updateTooltip();
  }
  function setCamera(camera) {
    camera.w=Math.max(W/12,Math.min(W*1.5,camera.w));camera.h=camera.w*H/W;
    camera.x=Math.max(-W*.6,Math.min(W*1.2-camera.w*.2,camera.x));
    camera.y=Math.max(-H*.6,Math.min(H*1.2-camera.h*.2,camera.y));
    state.camera=camera;applyCamera();
  }
  function zoom(factor,point) {
    const c=state.camera,w=Math.max(W/12,Math.min(W*1.5,c.w/factor));
    const p=point||{x:c.x+c.w/2,y:c.y+c.h/2};
    const ratio=w/c.w;setCamera({x:p.x-(p.x-c.x)*ratio,y:p.y-(p.y-c.y)*ratio,w,h:w*H/W});
  }
  function frame(list,padding=110) {
    if(!list.length)return;
    const minX=Math.min(...list.map(n=>n.kind==="region"?n.x:n.cx-(n.kind==="chapter"?n.radius+35:24)))-padding;
    const maxX=Math.max(...list.map(n=>n.kind==="region"?n.x+n.w:n.cx+(n.kind==="chapter"?n.radius+35:24)))+padding;
    const minY=Math.min(...list.map(n=>n.kind==="region"?n.y:n.cy-(n.kind==="chapter"?n.radius+35:24)))-padding;
    const maxY=Math.max(...list.map(n=>n.kind==="region"?n.y+n.h:n.cy+(n.kind==="chapter"?n.radius+35:24)))+padding;
    const w=Math.max(maxX-minX,(maxY-minY)*W/H,450),h=w*H/W;
    setCamera({x:(minX+maxX-w)/2,y:(minY+maxY-h)/2,w,h});
  }
  function updateTooltip() {
    const n=nodes.get(state.hovered||state.selected);
    if(!n||n.kind==="region"){tooltip.hidden=true;return;}
    const matrix=svg.getScreenCTM();if(!matrix){tooltip.hidden=true;return;}
    const p=new DOMPoint(n.cx,n.cy).matrixTransform(matrix),rect=svg.parentElement.getBoundingClientRect();
    if(p.x<rect.left||p.x>rect.right||p.y<rect.top||p.y>rect.bottom){tooltip.hidden=true;return;}
    tooltip.replaceChildren(el("span",null,label(n)),el("small",null,n.kind==="chapter"?`${n.sections.length} 小節 · 點選聚焦本章`:`第${n.chapter}章 · PDF ${n.page}`));tooltip.hidden=false;
    const width=tooltip.offsetWidth,height=tooltip.offsetHeight;
    tooltip.style.left=`${Math.max(8,Math.min(rect.width-width-8,p.x-rect.left+17))}px`;
    tooltip.style.top=`${Math.max(45,Math.min(rect.height-height-70,p.y-rect.top-height-17))}px`;
  }
  function pathBetween(a,b) {
    const dx=b.cx-a.cx,dy=b.cy-a.cy,len=Math.hypot(dx,dy)||1;
    const offset=Math.min(90,len*.14),mx=(a.cx+b.cx)/2-dy/len*offset,my=(a.cy+b.cy)/2+dx/len*offset;
    const sc=scale(),radius=n=>n.kind==="chapter"?Math.max(19,16/sc)+4/sc:Math.min(8,3.1/sc)+4/sc;
    const ar=Math.min(radius(a),len*.27),br=Math.min(radius(b),len*.27);
    const al=Math.hypot(mx-a.cx,my-a.cy)||1,bl=Math.hypot(b.cx-mx,b.cy-my)||1;
    const ax=a.cx+(mx-a.cx)/al*ar,ay=a.cy+(my-a.cy)/al*ar;
    const bx=b.cx-(b.cx-mx)/bl*br,by=b.cy-(b.cy-my)/bl*br;
    return `M${ax} ${ay} Q${mx} ${my} ${bx} ${by}`;
  }
  function renderEdges() {
    edgeLayer.replaceChildren();routeLayer.replaceChildren();
    const direct=state.selected?edgesFor(state.selected):[];
    const shown=new Map();
    if(state.backbone&&!state.selected)data.edges.filter(e=>e.level==="chapter").forEach(e=>shown.set(e.id,e));
    direct.forEach(e=>shown.set(e.id,e));
    const neighborIDs=new Set(direct.flatMap(e=>[e.source,e.target]));
    for(const [id,g] of groups){g.classList.toggle("is-selected",id===state.selected);g.classList.toggle("is-neighbor",id!==state.selected&&neighborIDs.has(id));g.setAttribute("aria-pressed",String(id===state.selected));}
    for(const edge of shown.values()){
      const directEdge=direct.some(e=>e.id===edge.id);
      const attrs={d:pathBetween(nodes.get(edge.source),nodes.get(edge.target)),class:`edge ${edge.type}${directEdge?" direct":""}`,"data-edge":edge.id,"data-source":edge.source,"data-target":edge.target};
      if(edge.type!=="comparison")attrs["marker-end"]=`url(#arrow-${edge.type})`;
      edgeLayer.append(s("path",attrs));
    }
    if(state.reading){
      for(let i=1;i<data.chapters.length;i++)routeLayer.append(s("path",{d:pathBetween(nodes.get(data.chapters[i-1].id),nodes.get(data.chapters[i].id)),class:"reading-edge","data-reading":"chapter","data-source":data.chapters[i-1].id,"data-target":data.chapters[i].id,"marker-end":"url(#arrow-route)"}));
      const selected=nodes.get(state.selected),chapter=selected&&chapterOf(selected);
      if(chapter)for(let i=1;i<chapter.sections.length;i++)routeLayer.append(s("path",{d:pathBetween(nodes.get(chapter.sections[i-1]),nodes.get(chapter.sections[i])),class:"reading-edge","data-reading":"section","data-source":chapter.sections[i-1],"data-target":chapter.sections[i],"marker-end":"url(#arrow-route)"}));
    }
    document.getElementById("legend").hidden=!(shown.size||state.reading);
  }

  function makeNodeList(ids) {
    const list=el("ol","section-list");
    for(const id of ids){const n=nodes.get(id),li=el("li"),b=button("",()=>select(id,{focus:true}));
      b.append(el("span","section-code",n.kind==="chapter"?String(n.number).padStart(2,"0"):n.id),el("span",null,n.title));li.append(b);list.append(li);}
    return list;
  }
  function relationGroups(n,body) {
    const related=edgesFor(n.id);body.append(el("h3",null,`理解${n.kind==="section"?"本節":"本章"}需要的底層知識`));
    if(n.entry_reason){body.append(el("p","entry-basis",n.entry_reason));return;}
    if(!related.length){body.append(el("p","coverage",n.kind==="chapter"?"章間主幹未另列此章的基礎；請選本章小節查看逐節整理的底層知識。":"此處的底層資料未載入，請重新整理頁面。"));return;}
    if(n.kind==="section"&&related.length>1)body.append(el("p","coverage",`本節需搭配下列${related.length}項基礎；各項提供的觀念分別列在連結理由中。`));
    const groups=[["展開底層知識",related]];
    for(const [title,edges] of groups){if(!edges.length)continue;
      const details=el("details","relation-group"),summary=el("summary",null,`${title}（${edges.length}）`);details.append(summary);
      for(const e of edges){
        const other=nodes.get(e.source),item=el("div","relation-item");
        item.append(el("span","relation-type",typeNames[e.type]),button(label(other),()=>select(other.id,{focus:true})),el("p",null,e.reason),el("small",null,`原書定位：${e.source.startsWith("c")?`第${nodes.get(e.source).number}章`:e.source} / PDF ${e.source_page}；${e.target.startsWith("c")?`第${nodes.get(e.target).number}章`:e.target} / PDF ${e.target_page}`));
        details.append(item);
      }
      body.append(details);
    }
  }
  function renderPanel(n) {
    const head=el("div","panel-header");head.append(el("span",null,n.kind==="region"?"主題區":n.kind==="chapter"?"章星系":"小節恆星"));
    const close=button("×",()=>{clearSelection();svg.focus();});close.setAttribute("aria-label","關閉選取資訊");head.append(close);
    const body=el("div","panel-body");body.append(el("h2",null,label(n)));
    if(n.english)body.append(el("p","english",n.english.replace(/^Chapter \d+ /,"")));
    if(n.kind==="region"){
      const chapters=data.chapters.filter(c=>c.region===n.id);body.append(el("p","location",`第${n.start}–${n.end}章 · ${chapters.length}個星系`));
      body.append(makeNodeList(chapters.map(c=>c.id)));
    }else{
      const chapter=chapterOf(n);
      body.append(el("p","location",`${nodes.get(n.region).title}\n${n.kind==="section"?`第${n.chapter}章 · `:""}PDF 第${n.page}頁（含封面）`));
      const actions=el("div","panel-actions");actions.append(button("聚焦本章",()=>frame([chapter])));
      const edges=edgesFor(n.id);
      if(edges.length)actions.append(button("查看底層連結",()=>frame([n,...edges.map(e=>nodes.get(e.source))])));
      if(n.kind==="section")actions.append(button("本章小節",()=>select(chapter.id,{focus:false})));
      body.append(actions);
      if(n.kind==="chapter"){body.append(el("h3",null,`本章小節 · ${n.sections.length}`),makeNodeList(n.sections));}
      relationGroups(n,body);
    }
    body.append(el("p","coverage",`306小節均已整理，共${sectionBaseCount}條小節底層連結。這裡只列直接使用的基礎，可點進去繼續向底層追溯。`));
    panel.replaceChildren(head,body);panel.scrollTop=0;
  }
  function select(id,{focus=false}={}) {
    const n=nodes.get(id);if(!n)return;
    state.selected=id;state.hovered=null;
    results.hidden=true;search.setAttribute("aria-expanded","false");
    workspace.classList.add("has-panel");panel.hidden=false;renderPanel(n);renderEdges();
    jump.value=n.kind==="chapter"?n.id:n.kind==="section"?`c${n.chapter}`:"";
    document.getElementById("view-label").textContent=label(n);
    announce(`已選取${label(n)}。${n.kind==="region"?"":`${edgesFor(id).length}項已整理的直接底層知識。`}`);
    requestAnimationFrame(()=>{if(focus)frame([n.kind==="section"?chapterOf(n):n]);else applyCamera();});
  }
  function clearSelection() {
    state.selected=null;state.hovered=null;workspace.classList.remove("has-panel");panel.hidden=true;panel.replaceChildren();tooltip.hidden=true;jump.value="";
    document.getElementById("view-label").textContent="全書概覽";renderEdges();requestAnimationFrame(applyCamera);
  }
  function fitAll() {clearSelection();state.camera={x:0,y:0,w:W,h:H};requestAnimationFrame(applyCamera);}
  function nodeKey(event,n) {
    if(event.key==="Enter"||event.key===" "){event.preventDefault();select(n.id,{focus:n.kind!=="section"});return;}
    if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(event.key))return;
    event.preventDefault();event.stopPropagation();let target;
    if(event.key==="ArrowUp"||event.key==="ArrowDown"){
      const current=n.kind==="region"?n.start:n.kind==="chapter"?n.number:n.chapter;
      target=nodes.get(`c${Math.max(1,Math.min(31,current+(event.key==="ArrowUp"?-1:1)))}`);
    }else{
      const order=data.chapters.flatMap(c=>[c.id,...c.sections]),index=order.indexOf(n.id);
      const id=order[Math.max(0,Math.min(order.length-1,index+(event.key==="ArrowLeft"?-1:1)))];target=nodes.get(id);
    }
    if(target){for(const g of groups.values())g.setAttribute("tabindex","-1");const g=groups.get(target.id);g.setAttribute("tabindex","0");
      const rect=g.getBoundingClientRect(),canvas=svg.getBoundingClientRect();
      if(rect.left<canvas.left||rect.right>canvas.right||rect.top<canvas.top||rect.bottom>canvas.bottom)frame([chapterOf(target)||target]);
      g.focus();updateTooltip();}
  }

  for(const c of data.chapters){const option=el("option",null,`${String(c.number).padStart(2,"0")} ${c.title}`);option.value=c.id;jump.append(option);}
  jump.addEventListener("change",()=>{if(jump.value)select(jump.value,{focus:true});});
  function showSearch() {
    const value=search.value.trim().toLocaleLowerCase();results.replaceChildren();
    if(!value){results.hidden=true;search.setAttribute("aria-expanded","false");return;}
    let matches;
    if(/^\d+\.\d+$/.test(value))matches=data.sections.filter(n=>n.id===value);
    else if(/^(?:第)?\d+(?:章)?$/.test(value)){const number=Number(value.replace(/\D/g,""));matches=data.chapters.filter(n=>n.number===number);}
    else matches=[...data.chapters,...data.sections].filter(n=>`${label(n)} ${n.english}`.toLocaleLowerCase().includes(value));
    for(const n of matches.slice(0,12)){const b=button("",()=>{select(n.id,{focus:true});search.blur();});b.append(el("span",null,label(n)),el("small",null,n.kind==="chapter"?`${n.sections.length}小節`:`第${n.chapter}章 · PDF ${n.page}`));results.append(b);}
    if(!matches.length)results.append(el("p",null,"找不到符合的章節或小節。"));
    else if(matches.length>12)results.append(el("p",null,`顯示前12項，共${matches.length}項；可輸入更完整名稱。`));
    results.hidden=false;search.setAttribute("aria-expanded","true");
  }
  search.addEventListener("input",showSearch);search.addEventListener("focus",()=>{if(search.value)showSearch();});
  search.addEventListener("keydown",event=>{if(event.key==="ArrowDown"){event.preventDefault();results.querySelector("button")?.focus();}if(event.key==="Enter"&&!results.hidden){event.preventDefault();results.querySelector("button")?.click();}});
  document.addEventListener("click",event=>{if(!event.target.closest(".search-wrap")){results.hidden=true;search.setAttribute("aria-expanded","false");}});
  for(const id of ["backbone","reading"]){document.getElementById(id).addEventListener("click",()=>{state[id]=!state[id];document.getElementById(id).setAttribute("aria-pressed",String(state[id]));if(id==="backbone"&&state[id]&&state.selected)fitAll();renderEdges();announce(`${id==="backbone"?"概念主幹":"原書閱讀順序"}${state[id]?"已顯示":"已隱藏"}`);});}
  document.getElementById("zoom-in").addEventListener("click",()=>zoom(1.4));
  document.getElementById("zoom-out").addEventListener("click",()=>zoom(1/1.4));
  document.getElementById("fit").addEventListener("click",fitAll);
  function pan(direction){const c=state.camera,step=c.w*.13;setCamera({...c,x:c.x+({left:-step,right:step}[direction]||0),y:c.y+({up:-step,down:step}[direction]||0)});}
  document.querySelectorAll("[data-pan]").forEach(b=>b.addEventListener("click",()=>pan(b.dataset.pan)));
  svg.addEventListener("keydown",event=>{
    if(event.target!==svg)return;
    const directions={ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down"};
    if(directions[event.key]){event.preventDefault();pan(directions[event.key]);}
    else if(["+","="].includes(event.key)){event.preventDefault();zoom(1.4);}
    else if(event.key==="-"){event.preventDefault();zoom(1/1.4);}
    else if(event.key==="Home"){event.preventDefault();fitAll();}
  });
  document.addEventListener("keydown",event=>{if(event.key==="Escape"){
    if(!results.hidden){results.hidden=true;search.setAttribute("aria-expanded","false");search.focus();return;}
    if(state.selected){clearSelection();svg.focus();}
  }});
  svg.addEventListener("wheel",event=>{
    event.preventDefault();const matrix=svg.getScreenCTM();if(!matrix)return;
    const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());zoom(Math.exp(-Math.max(-150,Math.min(150,event.deltaY))*.003),p);
  },{passive:false});
  svg.addEventListener("pointerdown",event=>{
    if(event.button!==0)return;
    state.drag={x:event.clientX,y:event.clientY,camera:{...state.camera},moved:false,id:event.pointerId};state.suppressClick=false;
  });
  svg.addEventListener("pointermove",event=>{
    const drag=state.drag;if(!drag||drag.id!==event.pointerId)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(!drag.moved&&Math.hypot(dx,dy)>5){drag.moved=true;svg.setPointerCapture(event.pointerId);svg.classList.add("dragging");state.hovered=null;}
    if(drag.moved){state.suppressClick=true;const sc=scale();setCamera({...drag.camera,x:drag.camera.x-dx/sc,y:drag.camera.y-dy/sc});}
  });
  function endDrag(event){const drag=state.drag;if(!drag||drag.id!==event.pointerId)return;state.drag=null;svg.classList.remove("dragging");if(svg.hasPointerCapture(event.pointerId))svg.releasePointerCapture(event.pointerId);if(drag.moved)setTimeout(()=>{state.suppressClick=false;},0);}
  svg.addEventListener("pointerup",endDrag);svg.addEventListener("pointercancel",endDrag);
  svg.addEventListener("click",event=>{if(!event.target.closest("[data-node]")&&!state.suppressClick)clearSelection();});
  const observer=new ResizeObserver(()=>requestAnimationFrame(applyCamera));observer.observe(svg.parentElement);
  document.getElementById("scope").textContent=`306／306小節底層已整理 · ${sectionBaseCount}條直接連結 · ${data.entry_sections.length}個書內起點 · 只往底層追溯`;
  renderEdges();applyCamera();
})();
