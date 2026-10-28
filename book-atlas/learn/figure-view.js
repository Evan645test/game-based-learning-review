import {projectPoint} from './reaction-3d.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const MOL_W = 360;
const MOL_H = 232;
const MOL_PAD = 24;
const TAU = Math.PI * 2;
const MODEL_VIEW_W = 760;
const MODEL_VIEW_H = 430;
const MODEL_PAD = 44;
const CHAIR_RING_Z = 0.42;
const CHAIR_AXIAL_LEN = 1.08;
const CHAIR_EQUATORIAL_LEN = 1.08;
const CHAIR_EQUATORIAL_TILT = 0.38;

const CAMERA_PRESETS = Object.freeze({
  default: Object.freeze({yaw: -0.85, pitch: -0.12, zoom: 1.14}),
  newman: Object.freeze({yaw: -0.82, pitch: -0.12, zoom: 1.14}),
  chair: Object.freeze({yaw: 0.35, pitch: -0.32, zoom: 1.5}),
  chirality: Object.freeze({yaw: -1.08, pitch: -0.3, zoom: 1.22}),
  chiralityOrient: Object.freeze({yaw: -2.33, pitch: -0.63, zoom: 1.18})
});

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => (
  ch === '&' ? '&amp;' :
  ch === '<' ? '&lt;' :
  ch === '>' ? '&gt;' :
  ch === '"' ? '&quot;' : '&#39;'
));

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function reducedMotionPreferred() {
  if (typeof document !== 'undefined' && document.body?.dataset?.artMotion === 'paused') return true;
  if (typeof matchMedia === 'function') {
    return matchMedia('(prefers-reduced-motion: reduce)').matches === true;
  }
  return false;
}

function atomMapOf(mol) {
  return new Map((mol?.atoms || []).map(atom => [atom.id, atom]));
}

function screenTransform(mol, surface = false) {
  const atoms = mol?.atoms || [];
  if (!atoms.length) {
    return {
      toScreen: () => ({x: MOL_W / 2, y: MOL_H / 2}),
      bounds: {minX: 0, maxX: 1, minY: 0, maxY: 1, scale: 1}
    };
  }
  const xs = atoms.map(atom => Number(atom.x) || 0);
  const ys = atoms.map(atom => Number(atom.y) || 0);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  let pad = MOL_PAD;
  if(surface){
    const byId=atomMapOf(mol);
    const lengths=(mol.bonds||[]).flatMap(b=>{
      const a=byId.get(b.a),c=byId.get(b.b);return a&&c?[Math.hypot(c.x-a.x,c.y-a.y)]:[];
    }).filter(n=>Number.isFinite(n)&&n>0).sort((a,b)=>a-b);
    const unit=lengths[Math.floor(lengths.length/2)]||1;
    const estimate=Math.min((MOL_W-24)/spanX,(MOL_H-24)/spanY);
    pad=clamp(unit*estimate*.68,17,55)*1.1+10;
  }
  const scale = Math.min((MOL_W - pad * 2) / spanX, (MOL_H - pad * 2) / spanY);
  const originX = surface ? (MOL_W - (maxX - minX) * scale) / 2 : MOL_PAD;
  const originY = surface ? (MOL_H + (maxY - minY) * scale) / 2 : MOL_H - MOL_PAD;
  return {
    toScreen(atom) {
      return {
        x: originX + ((Number(atom.x) || 0) - minX) * scale,
        y: originY - ((Number(atom.y) || 0) - minY) * scale
      };
    },
    bounds: {minX, maxX, minY, maxY, scale}
  };
}

function normalizeLabel(label) {
  return String(label ?? '');
}

function figureItemsOf(specInput) {
  if (Array.isArray(specInput)) {
    return specInput.filter(item => item && typeof item === 'object');
  }
  return [specInput && typeof specInput === 'object' ? specInput : {}];
}

function atomNumberFromId(id) {
  const match = String(id || '').match(/(\d+)(?!.*\d)/);
  return match ? Number(match[1]) : NaN;
}

function bondKey(a, b) {
  return [String(a), String(b)].sort().join('::');
}

function highlightNeedsNumbering(entry) {
  if (!entry || typeof entry !== 'object') return false;
  if (Array.isArray(entry.numbering) && entry.numbering.length > 0) return true;
  const label = String(entry.label || '');
  if (!label) return false;
  return /(主鏈|編|位置|位於|[0-9]+[-－]|\d+號|C\d)/.test(label);
}

// Chain numbers come from one highlight only, in the order its atoms are listed (the data author's chain order):
// an explicit `numbering` list wins, otherwise the first main-chain highlight. Mixing highlights or sorting by id
// would number a branch as part of the chain.
function numberingMapFor(mol, entries) {
  const atomsById = atomMapOf(mol);
  const list = entries || [];
  const source = list.find(e => Array.isArray(e?.numbering) && e.numbering.length > 1)?.numbering
    || list.find(e => highlightNeedsNumbering(e) && (e.atoms || []).filter(id => atomsById.get(id)?.el === 'C').length > 1)?.atoms
    || [];
  const ordered = source.filter(id => atomsById.get(id)?.el === 'C');
  return ordered.length > 1 ? new Map(ordered.map((id, index) => [id, index + 1])) : new Map();
}

function highlightInfoFor(mol, show, highlights, entries) {
  const atoms = new Set([...(show.highlight || []), ...(highlights || [])]);
  const bonds = new Set();
  for (const entry of (entries || [])) {
    if (!entry || typeof entry !== 'object') continue;
    for (const atomId of (entry.atoms || [])) atoms.add(atomId);
    for (const bond of (entry.bonds || [])) {
      if (Array.isArray(bond) && bond.length === 2) {
        bonds.add(bondKey(bond[0], bond[1]));
      }
    }
  }
  for (const bond of (mol?.bonds || [])) {
    if (atoms.has(bond.a) && atoms.has(bond.b)) bonds.add(bondKey(bond.a, bond.b));
  }
  return {atoms, bonds};
}

function vec(from, to) {
  return [to.x - from.x, to.y - from.y];
}

function unit(vector) {
  const length = Math.hypot(vector[0], vector[1]) || 1;
  return [vector[0] / length, vector[1] / length];
}

function midpoint(a, b) {
  return {x: (a.x + b.x) * 0.5, y: (a.y + b.y) * 0.5};
}

function add(a, b) {
  return {x: a.x + b[0], y: a.y + b[1]};
}

function lpDirection(atom, neighbors, pairIndex = 0, pairCount = 1) {
  if (!neighbors.length) {
    const angle = -Math.PI / 2 + (pairIndex - (pairCount - 1) * 0.5) * (Math.PI / 5);
    return [Math.cos(angle), Math.sin(angle)];
  }
  const opposite = neighbors.reduce((sum, pt) => {
    const dx = (Number(atom.x) || 0) - (Number(pt.x) || 0);
    const dy = (Number(atom.y) || 0) - (Number(pt.y) || 0);
    const len = Math.hypot(dx, dy) || 1;
    sum[0] += dx / len;
    sum[1] += dy / len;
    return sum;
  }, [0, 0]);
  let base = Math.atan2(opposite[1], opposite[0]);
  if (!Number.isFinite(base)) base = -Math.PI / 2;
  const spread = Math.PI / 4;
  const angle = base + (pairIndex - (pairCount - 1) * 0.5) * spread;
  return [Math.cos(angle), Math.sin(angle)];
}

function markerDef(id) {
  return `<defs><marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#9c4f11"/></marker></defs>`;
}

function trimBondEnds(a, b, trimA = 0, trimB = 0) {
  const d = vec(a, b);
  const length = Math.hypot(d[0], d[1]) || 1;
  if (trimA + trimB > length - 6) {
    const shrink = Math.max(0, (length - 6) / (trimA + trimB || 1));
    trimA *= shrink;
    trimB *= shrink;
  }
  const ux = d[0] / length;
  const uy = d[1] / length;
  return {
    from: {x: a.x + ux * trimA, y: a.y + uy * trimA},
    to: {x: b.x - ux * trimB, y: b.y - uy * trimB}
  };
}

function drawBondLines(a, b, order = 1, stroke = '#273449', width = 2.2) {
  const d = vec(a, b);
  const u = unit(d);
  const normal = [-u[1], u[0]];
  const lines = [];
  if (order === 1) {
    lines.push(`<line x1="${a.x.toFixed(2)}" y1="${a.y.toFixed(2)}" x2="${b.x.toFixed(2)}" y2="${b.y.toFixed(2)}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"/>`);
  } else if (order === 2) {
    for (const off of [-3, 3]) {
      lines.push(`<line x1="${(a.x + normal[0] * off).toFixed(2)}" y1="${(a.y + normal[1] * off).toFixed(2)}" x2="${(b.x + normal[0] * off).toFixed(2)}" y2="${(b.y + normal[1] * off).toFixed(2)}" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round"/>`);
    }
  } else {
    for (const off of [-4.5, 0, 4.5]) {
      lines.push(`<line x1="${(a.x + normal[0] * off).toFixed(2)}" y1="${(a.y + normal[1] * off).toFixed(2)}" x2="${(b.x + normal[0] * off).toFixed(2)}" y2="${(b.y + normal[1] * off).toFixed(2)}" stroke="${stroke}" stroke-width="1.65" stroke-linecap="round"/>`);
    }
  }
  return lines.join('');
}

function drawWedge(a, b) {
  const d = vec(a, b);
  const u = unit(d);
  const normal = [-u[1], u[0]];
  const maxHalfWidth = 4;
  const tipLeft = {x: b.x + normal[0] * maxHalfWidth, y: b.y + normal[1] * maxHalfWidth};
  const tipRight = {x: b.x - normal[0] * maxHalfWidth, y: b.y - normal[1] * maxHalfWidth};
  return `<polygon points="${a.x.toFixed(2)},${a.y.toFixed(2)} ${tipLeft.x.toFixed(2)},${tipLeft.y.toFixed(2)} ${tipRight.x.toFixed(2)},${tipRight.y.toFixed(2)}" fill="#24354e"/>`;
}

function drawHashedWedge(a, b) {
  const d = vec(a, b);
  const u = unit(d);
  const normal = [-u[1], u[0]];
  const bars = [];
  for (let i = 0; i < 7; i += 1) {
    const t = (i + 1) / 8;
    const center = {x: a.x + d[0] * t, y: a.y + d[1] * t};
    const width = 0.6 + t * 3.4;
    const p1 = {x: center.x + normal[0] * width, y: center.y + normal[1] * width};
    const p2 = {x: center.x - normal[0] * width, y: center.y - normal[1] * width};
    bars.push(`<line x1="${p1.x.toFixed(2)}" y1="${p1.y.toFixed(2)}" x2="${p2.x.toFixed(2)}" y2="${p2.y.toFixed(2)}" stroke="#24354e" stroke-width="1.25" stroke-linecap="round"/>`);
  }
  return bars.join('');
}

function arrowAnchor(descriptor, atomPoints, atoms, bonds) {
  if (!descriptor) return null;
  if (descriptor.atom && atomPoints.has(descriptor.atom)) return atomPoints.get(descriptor.atom);
  if (descriptor.bond && descriptor.bond.length === 2) {
    const a = atomPoints.get(descriptor.bond[0]);
    const b = atomPoints.get(descriptor.bond[1]);
    if (a && b) return midpoint(a, b);
  }
  if (descriptor.lp && atomPoints.has(descriptor.lp)) {
    const atom = atoms.get(descriptor.lp);
    const neighbors = bonds
      .filter(bond => bond.a === descriptor.lp || bond.b === descriptor.lp)
      .map(bond => atoms.get(bond.a === descriptor.lp ? bond.b : bond.a))
      .filter(Boolean);
    const direction = lpDirection(atom, neighbors, 0, Math.max(1, Number(atom.lp) || 1));
    const anchor = atomPoints.get(descriptor.lp);
    return add(anchor, [direction[0] * 13, -direction[1] * 13]);
  }
  return null;
}

function drawArrow(from, to, markerId) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const normal = [-dy / length, dx / length];
  const bend = clamp(length * 0.22, 12, 36);
  const control = {
    x: (from.x + to.x) * 0.5 + normal[0] * bend,
    y: (from.y + to.y) * 0.5 + normal[1] * bend
  };
  const path = `M${from.x.toFixed(2)} ${from.y.toFixed(2)} Q${control.x.toFixed(2)} ${control.y.toFixed(2)} ${to.x.toFixed(2)} ${to.y.toFixed(2)}`;
  return `<path d="${path}" fill="none" stroke="#9c4f11" stroke-width="2.1" marker-end="url(#${markerId})" stroke-linecap="round"/>`;
}

function showAtomLabel(atom) {
  if (atom.label) return true;
  return atom.el !== 'C';
}

function bondTrimForAtom(atom, show) {
  if (showAtomLabel(atom)) return atom.label ? 15 : 11;
  if (show.charges && Number(atom.charge)) return 8;
  if (show.partials && atom.partial) return 7;
  return 0;
}

function atomCentroid(points) {
  const values = [...points.values()];
  if (!values.length) return {x: MOL_W / 2, y: MOL_H / 2};
  const sum = values.reduce((acc, point) => ({x: acc.x + point.x, y: acc.y + point.y}), {x: 0, y: 0});
  return {x: sum.x / values.length, y: sum.y / values.length};
}

// Qualitative valence-electron distribution, separate from electrostatic potential
// and formal-charge bookkeeping. Opacity is a teaching cue, never a computed density.
const ELECTRONEGATIVITY={H:2.20,C:2.55,N:3.04,O:3.44,F:3.98,S:2.58,Cl:3.16,Br:2.96,I:2.66};
function electronCloudSVG(mol,points,gradientId,groups=[]){
  const atoms=atomMapOf(mol),bonds=mol.bonds||[],parts=[];
  for(const bond of bonds){
    const a=atoms.get(bond.a),b=atoms.get(bond.b),p=points.get(bond.a),q=points.get(bond.b);
    if(!a||!b||!p||!q)continue;
    const ea=ELECTRONEGATIVITY[a.el],eb=ELECTRONEGATIVITY[b.el];
    const bias=ea===undefined||eb===undefined?0:Math.max(-.12,Math.min(.12,(eb-ea)*.1)),fraction=.5+bias;
    const x=p.x+(q.x-p.x)*fraction,y=p.y+(q.y-p.y)*fraction,length=Math.hypot(q.x-p.x,q.y-p.y),angle=Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI;
    const order=Number(bond.order)||1;
    parts.push(`<ellipse data-cloud-bond="${esc(bond.a+'|'+bond.b)}" data-enriched-end="${esc(bias>0?bond.b:bias<0?bond.a:'shared')}" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" rx="${Math.max(18,length*.62).toFixed(2)}" ry="${15+order*3}" transform="rotate(${angle.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)})" fill="url(#${gradientId})" opacity="${order>1?.88:.68}"/>`);
  }
  for(const a of mol.atoms||[]){
    const p=points.get(a.id),count=Number(a.lp)||0;if(!p||count<=0)continue;
    const neighbors=bonds.filter(b=>b.a===a.id||b.b===a.id).map(b=>atoms.get(b.a===a.id?b.b:b.a)).filter(Boolean);
    for(let i=0;i<count;i++){
      const d=lpDirection(a,neighbors,i,count),x=p.x+d[0]*18,y=p.y-d[1]*18;
      parts.push(`<ellipse data-cloud-pair="${esc(a.id)}" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" rx="19" ry="15" fill="url(#${gradientId})" opacity=".72"/>`);
    }
  }
  for(const group of groups){
    const ps=group.map(id=>points.get(id)).filter(Boolean);if(ps.length<2)continue;
    const xs=ps.map(p=>p.x),ys=ps.map(p=>p.y),x=(Math.min(...xs)+Math.max(...xs))/2,y=(Math.min(...ys)+Math.max(...ys))/2;
    parts.push(`<ellipse data-cloud-delocalized cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" rx="${(Math.max(...xs)-Math.min(...xs))/2+27}" ry="${(Math.max(...ys)-Math.min(...ys))/2+22}" fill="url(#${gradientId})" opacity=".8"/>`);
  }
  return `<defs><radialGradient id="${gradientId}"><stop offset="0" stop-color="#6350a8" stop-opacity=".72"/><stop offset=".45" stop-color="#8e80c7" stop-opacity=".43"/><stop offset="1" stop-color="#b5ade0" stop-opacity="0"/></radialGradient></defs><g data-electron-cloud data-density-kind="qualitative-valence">${parts.join('')}</g>`;
}
const ESP_PALETTE=[[-1,[237,36,22]],[-.65,[255,138,18]],[-.35,[255,227,52]],[0,[87,210,56]],[.45,[37,197,209]],[1,[34,83,223]]];
const surfaceImageCache=new Map();
const PNG_CRC_TABLE=Uint32Array.from({length:256},(_,n)=>{
  for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;
  return n>>>0;
});
function pngChunk(type,bytes){
  const result=new Uint8Array(bytes.length+12),view=new DataView(result.buffer);
  view.setUint32(0,bytes.length);for(let i=0;i<4;i++)result[i+4]=type.charCodeAt(i);result.set(bytes,8);
  let crc=0xffffffff;for(let i=4;i<result.length-4;i++)crc=PNG_CRC_TABLE[(crc^result[i])&255]^(crc>>>8);
  view.setUint32(result.length-4,(crc^0xffffffff)>>>0);return result;
}
function rgbPNG(width,height,rgb){
  // A small standard PNG with an uncompressed DEFLATE block; no canvas,
  // network, library or asynchronous decode is needed to build the SVG.
  const raw=new Uint8Array((width*3+1)*height);
  for(let y=0;y<height;y++)raw.set(rgb.subarray(y*width*3,(y+1)*width*3),y*(width*3+1)+1);
  const zlib=new Uint8Array(raw.length+11),zv=new DataView(zlib.buffer);
  zlib.set([0x78,0x01,0x01]);zv.setUint16(3,raw.length,true);zv.setUint16(5,(~raw.length)&65535,true);zlib.set(raw,7);
  let a=1,b=0;for(const value of raw){a=(a+value)%65521;b=(b+a)%65521;}zv.setUint32(zlib.length-4,((b<<16)|a)>>>0);
  const header=new Uint8Array(13),hv=new DataView(header.buffer);hv.setUint32(0,width);hv.setUint32(4,height);header[8]=8;header[9]=2;
  const chunks=[new Uint8Array([137,80,78,71,13,10,26,10]),pngChunk('IHDR',header),pngChunk('IDAT',zlib),pngChunk('IEND',new Uint8Array())];
  const png=new Uint8Array(chunks.reduce((n,c)=>n+c.length,0));let offset=0;for(const chunk of chunks){png.set(chunk,offset);offset+=chunk.length;}
  return 'data:image/png;base64,'+btoa(String.fromCharCode(...png));
}
function qualitativeSurfaceImage(points,radius){
  const key=JSON.stringify([radius,points.map(p=>[p.x,p.y,p.sign])]);
  if(surfaceImageCache.has(key))return surfaceImageCache.get(key);
  const width=90,height=58,rgb=new Uint8Array(width*height*3),soft2=(radius*.22)**2;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const px=(x+.5)*MOL_W/width,py=(y+.5)*MOL_H/height;
    let weighted=0,total=0,unknown=0;
    for(const point of points){
      const d2=(px-point.x)**2+(py-point.y)**2+soft2,w=1/(d2*d2);
      weighted+=w*(point.sign==='negative'?-1:point.sign==='positive'?1:0);total+=w;
      if(point.sign==='unspecified')unknown+=w;
    }
    const value=total?clamp(weighted/total,-1,1):0;
    const hi=ESP_PALETTE.findIndex(stop=>stop[0]>=value),upper=ESP_PALETTE[Math.max(1,hi)],lower=ESP_PALETTE[Math.max(0,hi-1)];
    const fraction=clamp((value-lower[0])/(upper[0]-lower[0]),0,1),gray=total?unknown/total:0;
    for(let c=0;c<3;c++)rgb[(y*width+x)*3+c]=Math.round((lower[1][c]+(upper[1][c]-lower[1][c])*fraction)*(1-gray)+[169,177,181][c]*gray);
  }
  const url=rgbPNG(width,height,rgb);if(surfaceImageCache.size>=32)surfaceImageCache.delete(surfaceImageCache.keys().next().value);
  surfaceImageCache.set(key,url);return url;
}
function electrostaticSurfaceSVG(mol,points,prefix,netCharge){
  const total=Number.isFinite(netCharge)?netCharge:mol.atoms.reduce((n,a)=>n+(Number(a.charge)||0),0);
  const atoms=atomMapOf(mol),lengths=(mol.bonds||[]).flatMap(b=>{
    const p=points.get(b.a),q=points.get(b.b);return p&&q?[Math.hypot(p.x-q.x,p.y-q.y)]:[];
  }).filter(n=>n>0).sort((a,b)=>a-b);
  const radius=clamp((lengths[Math.floor(lengths.length/2)]||64)*.68,17,55);
  const blur=clamp(radius*.1,2,5),maskId=prefix+'-envelope',filterId=prefix+'-merge';
  const defs=[],envelope=[],metadata=[],centers=[];
  for(const atom of mol.atoms){
    const p=points.get(atom.id);if(!p)continue;
    const en=ELECTRONEGATIVITY[atom.el],links=mol.bonds.filter(b=>b.a===atom.id||b.b===atom.id);
    const terms=links.flatMap(b=>{
      const other=atoms.get(b.a===atom.id?b.b:b.a),otherEN=ELECTRONEGATIVITY[other?.el];
      if(en===undefined||otherEN===undefined||[atom.el,other.el].sort().join('')==='CH')return [];
      return [otherEN-en];
    });
    // Polarity/charge classes are teaching cues. No physical potential values
    // or electron-density isosurface are inferred from electronegativity.
    const score=en===undefined?0:(terms.length?terms.reduce((n,x)=>n+x,0)/terms.length:0)+(Number(atom.charge)||0)*2.4+total*1.6;
    const sign=en===undefined?'unspecified':score<-.18?'negative':score>.18?'positive':'weak';
    const r=radius*(atom.el==='H'?.88:['Br','I'].includes(atom.el)?1.1:1);
    envelope.push(`<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${r.toFixed(2)}"/>`);
    metadata.push(`<g data-esp-atom="${esc(atom.id)}" data-potential-sign="${sign}"/>`);centers.push({...p,r,sign});
  }
  for(const bond of mol.bonds||[]){
    const p=points.get(bond.a),q=points.get(bond.b);if(!p||!q)continue;
    envelope.push(`<path d="M${p.x.toFixed(2)} ${p.y.toFixed(2)}L${q.x.toFixed(2)} ${q.y.toFixed(2)}" stroke="white" stroke-width="${(radius*1.65).toFixed(2)}" stroke-linecap="round"/>`);
  }
  // Compact connected molecules have a filled projection between their lobes.
  // Separate species retain separate envelopes instead of a false bridge.
  if(centers.length>1&&centers.length<=6&&mol.bonds.length>=centers.length-1){
    const seen=new Set([mol.atoms[0].id]);let changed=true;
    while(changed){changed=false;for(const b of mol.bonds)if(seen.has(b.a)!==seen.has(b.b)){seen.add(b.a);seen.add(b.b);changed=true;}}
    const center=atomCentroid(points),spread=Math.max(...centers.map(p=>Math.hypot(p.x-center.x,p.y-center.y)));
    if(seen.size===centers.length&&spread<radius*2.1){
      const x=(Math.min(...centers.map(p=>p.x))+Math.max(...centers.map(p=>p.x)))/2;
      const y=(Math.min(...centers.map(p=>p.y))+Math.max(...centers.map(p=>p.y)))/2;
      const rx=Math.max(...centers.map(p=>Math.abs(p.x-x)+p.r*.95));
      const ry=Math.max(...centers.map(p=>Math.abs(p.y-y)+p.r*.95));
      envelope.push(`<ellipse cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" rx="${rx.toFixed(2)}" ry="${ry.toFixed(2)}"/>`);
    }
  }
  defs.push(`<filter id="${filterId}" filterUnits="userSpaceOnUse" x="0" y="0" width="${MOL_W}" height="${MOL_H}" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${blur.toFixed(2)}"/><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -11"/></filter>`);
  defs.push(`<mask id="${maskId}" maskUnits="userSpaceOnUse" x="0" y="0" width="${MOL_W}" height="${MOL_H}" style="mask-type:alpha"><g fill="white" filter="url(#${filterId})">${envelope.join('')}</g></mask>`);
  defs.push(`<radialGradient id="${prefix}-light" cx="37%" cy="24%" r="72%"><stop offset="0" stop-color="white" stop-opacity=".18"/><stop offset=".4" stop-color="white" stop-opacity="0"/><stop offset="1" stop-color="#001c33" stop-opacity=".25"/></radialGradient>`);
  const image=qualitativeSurfaceImage(centers,radius);
  return `<defs>${defs.join('')}</defs><g data-electrostatic-potential data-potential-kind="qualitative" data-electron-cloud data-density-kind="qualitative-envelope"><rect data-esp-background width="${MOL_W}" height="${MOL_H}" rx="9" fill="#05090b"/><g data-esp-surface mask="url(#${maskId})"><image href="${image}" width="${MOL_W}" height="${MOL_H}" preserveAspectRatio="none"/><rect width="${MOL_W}" height="${MOL_H}" fill="url(#${prefix}-light)"/></g>${metadata.join('')}</g>`;
}
function molSVG(mol, {
  show = {lp: true, charges: true, partials: true, arrows: true, highlight: []},
  highlights = [],
  highlightEntries = [],
  markerId = 'mol-arrow',
  electronCloud = false,
  cloudGroups = [],
  electrostaticPotential = false,
  netCharge
} = {}) {
  const atoms = atomMapOf(mol);
  const bonds = (mol?.bonds || []).map(bond => ({...bond}));
  const {toScreen} = screenTransform(mol,electrostaticPotential);
  const atomPoints = new Map();
  for (const atom of (mol?.atoms || [])) atomPoints.set(atom.id, toScreen(atom));

  const highlightInfo = highlightInfoFor(mol, show, highlights, highlightEntries);
  const numbering = numberingMapFor(mol, highlightEntries);
  const centroid = atomCentroid(atomPoints);
  const layers = {
    bonds: [],
    under: [],
    labels: [],
    overlays: []
  };

  for (const bond of bonds) {
    const atomA = atoms.get(bond.a);
    const atomB = atoms.get(bond.b);
    const fromRaw = atomPoints.get(bond.a);
    const toRaw = atomPoints.get(bond.b);
    if (!atomA || !atomB || !fromRaw || !toRaw) continue;
    const {from, to} = trimBondEnds(fromRaw, toRaw, bondTrimForAtom(atomA, show), bondTrimForAtom(atomB, show));
    if (highlightInfo.bonds.has(bondKey(bond.a, bond.b))) {
      layers.under.push(`<line x1="${from.x.toFixed(2)}" y1="${from.y.toFixed(2)}" x2="${to.x.toFixed(2)}" y2="${to.y.toFixed(2)}" stroke="#f2af35" stroke-opacity="0.48" stroke-width="9.2" stroke-linecap="round"/>`);
    }
    if (bond.style === 'wedge') layers.bonds.push(drawWedge(from, to));
    else if (bond.style === 'dash') layers.bonds.push(drawHashedWedge(from, to));
    else layers.bonds.push(drawBondLines(from, to, Number(bond.order) || 1));
  }

  for (const atom of (mol?.atoms || [])) {
    const point = atomPoints.get(atom.id);
    if (!point) continue;
    if (highlightInfo.atoms.has(atom.id)) {
      layers.under.push(`<circle cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="10.7" fill="none" stroke="#f2af35" stroke-opacity="0.45" stroke-width="6"/>`);
    }
    if (showAtomLabel(atom)) {
      const label = normalizeLabel(atom.label || atom.el || '');
      layers.labels.push(`<text x="${point.x.toFixed(2)}" y="${(point.y + 4.4).toFixed(2)}" text-anchor="middle" font-size="15" font-weight="650" fill="#21242a">${esc(label)}</text>`);
    }
    if (numbering.has(atom.id)) {
      const dx = point.x - centroid.x;
      const dy = point.y - centroid.y;
      const distance = Math.hypot(dx, dy) || 1;
      const anchor = {
        x: point.x + (dx / distance) * 12,
        y: point.y + (dy / distance) * 12
      };
      layers.overlays.push(`<text x="${anchor.x.toFixed(2)}" y="${(anchor.y + 2.7).toFixed(2)}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#70411c">${numbering.get(atom.id)}</text>`);
    }
    if (show.lp && Number(atom.lp) > 0) {
      const neighbors = bonds
        .filter(bond => bond.a === atom.id || bond.b === atom.id)
        .map(bond => atoms.get(bond.a === atom.id ? bond.b : bond.a))
        .filter(Boolean);
      const pairCount = Number(atom.lp);
      for (let i = 0; i < pairCount; i += 1) {
        const direction = lpDirection(atom, neighbors, i, pairCount);
        const tangent = [-direction[1], direction[0]];
        const center = add(point, [direction[0] * 14, -direction[1] * 14]);
        const first = add(center, [tangent[0] * 2.2, tangent[1] * 2.2]);
        const second = add(center, [-tangent[0] * 2.2, -tangent[1] * 2.2]);
        layers.overlays.push(`<circle cx="${first.x.toFixed(2)}" cy="${first.y.toFixed(2)}" r="1.5" fill="#1d2c3f"/>`);
        layers.overlays.push(`<circle cx="${second.x.toFixed(2)}" cy="${second.y.toFixed(2)}" r="1.5" fill="#1d2c3f"/>`);
      }
    }
    if (show.charges && Number(atom.charge)) {
      const charge = Number(atom.charge) > 0 ? '+' : '−';
      const anchor = add(point, [12.5, -13.5]);
      layers.overlays.push(`<circle cx="${anchor.x.toFixed(2)}" cy="${anchor.y.toFixed(2)}" r="6.8" fill="#fff8ed" stroke="#8f5b2d" stroke-width="1.15"/>`);
      layers.overlays.push(`<text x="${anchor.x.toFixed(2)}" y="${(anchor.y + 3.45).toFixed(2)}" text-anchor="middle" font-size="11.2" font-weight="700" fill="#6a3f1d">${charge}</text>`);
    }
    if (show.partials && atom.partial) {
      const tag = add(point, [11.5, -14]);
      layers.overlays.push(`<text x="${tag.x.toFixed(2)}" y="${tag.y.toFixed(2)}" text-anchor="start" font-size="10.8" font-style="italic" font-weight="650" fill="#1f4f82">${esc(String(atom.partial))}</text>`);
    }
  }

  if (show.arrows && Array.isArray(mol?.arrows)) {
    for (const item of mol.arrows) {
      const from = arrowAnchor(item.from, atomPoints, atoms, bonds);
      const to = arrowAnchor(item.to, atomPoints, atoms, bonds);
      if (from && to) layers.overlays.push(drawArrow(from, to, markerId));
    }
  }

  const structureId=markerId+'-structure';
  const surfaceStyle=electrostaticPotential?`<style>#${structureId} text{stroke:#fffef4;stroke-width:2.3px;stroke-opacity:.92;stroke-linejoin:round;paint-order:stroke fill}</style>`:'';
  return `<svg xmlns="${SVG_NS}" class="fv-mol${electrostaticPotential?' fv-mol-esp':''}" viewBox="0 0 ${MOL_W} ${MOL_H}" role="img" aria-label="分子結構圖">${markerDef(markerId)}${surfaceStyle}${electronCloud&&!electrostaticPotential?electronCloudSVG(mol,atomPoints,markerId+'-density',cloudGroups):''}${electrostaticPotential?electrostaticSurfaceSVG(mol,atomPoints,markerId,netCharge):''}<g id="${structureId}">${layers.under.join('')}${layers.bonds.join('')}${layers.labels.join('')}${layers.overlays.join('')}</g></svg>`;
}

let inlineModelSerial=0;
function withValenceHydrogens(mol,cloudGroups){
  const copy=structuredClone(mol),delocalized=new Set(cloudGroups.flat());
  const gap=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
  for(const carbon of [...copy.atoms]){
    if(carbon.el!=='C'||delocalized.has(carbon.id))continue;
    const links=copy.bonds.filter(b=>b.a===carbon.id||b.b===carbon.id);
    const valence=links.reduce((n,b)=>n+(Number(b.order)||1),0),target=carbon.charge?3:4;
    const missing=Math.max(0,Math.min(4,target-valence));if(!Number.isInteger(missing))continue;
    if(missing&&/^(CH|CH₂|CH₃|CH2|CH3|Me|Et)$/.test(carbon.label||''))carbon.label='C';
    const occupied=links.map(b=>copy.atoms.find(a=>a.id===(b.a===carbon.id?b.b:b.a))).filter(Boolean).map(a=>Math.atan2(a.y-carbon.y,a.x-carbon.x));
    for(let i=0;i<missing;i++){
      const candidates=Array.from({length:24},(_,n)=>n*Math.PI/12).map(angle=>{
        const x=carbon.x+.8*Math.cos(angle),y=carbon.y+.8*Math.sin(angle);
        const separation=occupied.length?Math.min(...occupied.map(a=>gap(a,angle))):Math.PI;
        const collision=copy.atoms.filter(a=>a.id!==carbon.id).reduce((n,a)=>n+Math.max(0,.48-Math.hypot(a.x-x,a.y-y))*10,0);
        return {angle,x,y,score:separation-collision};
      }).sort((a,b)=>b.score-a.score);
      const best=candidates[0];let id=carbon.id+'-inline-h'+i;while(copy.atoms.some(a=>a.id===id))id+='h';
      copy.atoms.push({id,el:'H',x:best.x,y:best.y});copy.bonds.push({a:carbon.id,b:id,order:1});occupied.push(best.angle);
    }
  }
  return copy;
}
/** Static, labelled structure for a nearby explanation; no animation or progress state. */
export function moleculeDiagramHTML(mol,{label='分子結構與價電子雲分布',highlights=[],highlightEntries=[],electronCloud=true,cloudGroups=[],electrostaticPotential=false,netCharge}={}){
  const display=electronCloud||electrostaticPotential?withValenceHydrogens(mol,cloudGroups):mol;
  return molSVG(display,{highlights,highlightEntries,show:{lp:true,charges:true,partials:true,arrows:false,highlight:[]},electronCloud,cloudGroups,electrostaticPotential,netCharge,markerId:'inline-model-'+(++inlineModelSerial)}).replace('aria-label="分子結構圖"',`aria-label="${esc(label)}"`);
}

function sequenceFromSpec(spec) {
  switch (spec?.kind) {
    case 'structure-steps': return spec.steps || [];
    case 'name-pair': return spec.items || [];
    case 'newman': return spec.frames || [];
    case 'chair': return spec.frames?.length ? spec.frames : [{note: '椅式構形', flip: false}];
    case 'chirality': return spec.steps || [];
    default: return [];
  }
}

function cameraForSpec(spec, stepIndex = 0) {
  const kind = spec?.kind || '';
  if (kind === 'newman') return {...CAMERA_PRESETS.newman};
  if (kind === 'chair') return {...CAMERA_PRESETS.chair};
  if (kind === 'chirality') {
    const steps = sequenceFromSpec(spec);
    const step = steps[clamp(stepIndex, 0, Math.max(0, steps.length - 1))] || {};
    if (step.show === 'orient' || step.show === 'direction') return {...CAMERA_PRESETS.chiralityOrient};
    return {...CAMERA_PRESETS.chirality};
  }
  return {...CAMERA_PRESETS.default};
}

function stateFor(specInput) {
  const items = figureItemsOf(specInput);
  const first = items[0] || {};
  const camera = cameraForSpec(first, 0);
  return {
    item: 0,
    step: 0,
    yaw: camera.yaw,
    pitch: camera.pitch,
    zoom: camera.zoom,
    cameraTouched: false
  };
}

function activeSpec(specInput, state) {
  const items = figureItemsOf(specInput);
  return items[clamp(state.item, 0, items.length - 1)] || {};
}

function projectModel(points, camera) {
  return points.map(point => projectPoint(point, {
    yaw: camera.yaw,
    pitch: camera.pitch,
    zoom: camera.zoom
  }));
}

function fitProjection(projected) {
  if (!projected.length) return {points: [], scale: 1};
  const xs = projected.map(point => point.x);
  const ys = projected.map(point => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const scale = Math.min((MODEL_VIEW_W - MODEL_PAD * 2) / spanX, (MODEL_VIEW_H - MODEL_PAD * 2) / spanY);
  return {
    scale,
    points: projected.map(point => ({
      ...point,
      x: MODEL_PAD + (point.x - minX) * scale,
      y: MODEL_PAD + (point.y - minY) * scale
    }))
  };
}

function renderSimple3D({atoms, bonds}, camera) {
  const projectedRaw = projectModel(atoms.map(atom => atom.p), camera);
  const fitted = fitProjection(projectedRaw);
  const projected = fitted.points;
  const radiusScale = clamp(fitted.scale * 0.72, 0.96, 1.62);
  const bondWidth = clamp(fitted.scale * 1.08, 2.8, 5.2);
  const labelSize = Math.max(12, 11.5 * clamp(fitted.scale * 0.62, 1.08, 1.64));
  const center = projected.reduce((sum, point) => ({x: sum.x + point.x, y: sum.y + point.y}), {x: 0, y: 0});
  center.x /= Math.max(1, projected.length);
  center.y /= Math.max(1, projected.length);

  const approxLabelWidth = (text, fontSize) => {
    const chars = [...String(text || '')].length || 1;
    return chars * fontSize * 0.59 + 9;
  };

  const labels = atoms.map((atom, index) => {
    const p = projected[index];
    if (!p || !atom.label) return null;
    const radius = (atom.r || 11) * radiusScale;
    let dx = p.x - center.x;
    let dy = p.y - center.y;
    const d = Math.hypot(dx, dy) || 1;
    dx /= d;
    dy /= d;
    const offset = radius + labelSize * 0.72;
    const width = approxLabelWidth(atom.label, labelSize);
    const height = labelSize * 1.18;
    return {
      index,
      text: atom.label,
      priority: atom.priority,
      depth: p.z,
      anchorX: p.x + dx * offset,
      anchorY: p.y + dy * offset,
      x: p.x + dx * offset,
      y: p.y + dy * offset,
      width,
      height,
      radius
    };
  }).filter(Boolean);

  const maxIter = 24;
  for (let iter = 0; iter < maxIter; iter += 1) {
    let moved = false;
    for (let i = 0; i < labels.length; i += 1) {
      const a = labels[i];
      for (let j = i + 1; j < labels.length; j += 1) {
        const b = labels[j];
        const overlapX = Math.min(a.x + a.width / 2, b.x + b.width / 2) - Math.max(a.x - a.width / 2, b.x - b.width / 2);
        const overlapY = Math.min(a.y + a.height / 2, b.y + b.height / 2) - Math.max(a.y - a.height / 2, b.y - b.height / 2);
        if (overlapX > 0 && overlapY > 0) {
          const shift = (overlapY / 2) + 1.5;
          if (a.y <= b.y) {
            a.y -= shift;
            b.y += shift;
          } else {
            a.y += shift;
            b.y -= shift;
          }
          moved = true;
        }
      }
    }
    for (const label of labels) {
      const p = projected[label.index];
      if (!p) continue;
      const vx = label.x - p.x;
      const vy = label.y - p.y;
      const dist = Math.hypot(vx, vy) || 1;
      const minDist = label.radius + labelSize * 0.58;
      if (dist < minDist) {
        const push = minDist - dist + 0.8;
        label.x += (vx / dist) * push;
        label.y += (vy / dist) * push;
        moved = true;
      }
      label.x = clamp(label.x, MODEL_PAD * 0.3 + label.width / 2, MODEL_VIEW_W - MODEL_PAD * 0.3 - label.width / 2);
      label.y = clamp(label.y, MODEL_PAD * 0.3 + label.height / 2, MODEL_VIEW_H - MODEL_PAD * 0.3 - label.height / 2);
    }
    if (!moved) break;
  }

  const labelByIndex = new Map(labels.map(label => [label.index, label]));
  const items = [];
  for (const bond of bonds) {
    const from = projected[bond.a];
    const to = projected[bond.b];
    if (!from || !to) continue;
    const depth = clamp(((from.z + to.z) * 0.5 + 3) / 6, 0, 1);
    const tone = Math.round(58 + depth * 54);
    const bondStroke = `rgb(${tone - 12}, ${tone - 2}, ${tone + 18})`;
    const bondStrokeWidth = (bondWidth * (1.18 - depth * 0.24)).toFixed(2);
    items.push({
      z: (from.z + to.z) / 2,
      node: `<line x1="${from.x.toFixed(2)}" y1="${from.y.toFixed(2)}" x2="${to.x.toFixed(2)}" y2="${to.y.toFixed(2)}" stroke="${bondStroke}" stroke-width="${bondStrokeWidth}" stroke-linecap="round"/>`
    });
  }
  atoms.forEach((atom, index) => {
    const p = projected[index];
    if (!p) return;
    const radius = (atom.r || 11) * radiusScale;
    const label = labelByIndex.get(index);
    const priority = Number.isFinite(atom.priority) ? atom.priority : null;
    const labelNode = label
      ? `<g class="fv-atom-tag"><line x1="${p.x.toFixed(2)}" y1="${p.y.toFixed(2)}" x2="${label.x.toFixed(2)}" y2="${label.y.toFixed(2)}" stroke="#6c7b8f" stroke-width="1.1" opacity="0.75"/><rect x="${(label.x - label.width / 2).toFixed(2)}" y="${(label.y - label.height / 2).toFixed(2)}" width="${label.width.toFixed(2)}" height="${label.height.toFixed(2)}" rx="${(labelSize * 0.34).toFixed(2)}" fill="#ffffff" fill-opacity="0.93" stroke="#5c697a" stroke-width="1.05"/><text x="${label.x.toFixed(2)}" y="${(label.y + labelSize * 0.31).toFixed(2)}" text-anchor="middle" font-size="${labelSize.toFixed(2)}" font-weight="700" fill="#1f2b3a">${esc(label.text)}</text></g>`
      : '';
    items.push({
      z: p.z - 0.01,
      node: `<g data-atom-index="${index}" data-depth="${p.z.toFixed(4)}"${priority == null ? '' : ` data-priority="${priority}"`}><circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${radius.toFixed(2)}" fill="${atom.fill || '#f8fbff'}" stroke="${atom.stroke || '#2f4357'}" stroke-width="1.8"/>${labelNode}</g>`
    });
  });
  items.sort((a, b) => b.z - a.z);
  return `<svg viewBox="0 0 ${MODEL_VIEW_W} ${MODEL_VIEW_H}" role="img" aria-label="三維模型">${items.map(item => item.node).join('')}</svg>`;
}

function structureBody(spec, state) {
  const steps = sequenceFromSpec(spec);
  const step = steps[state.step] || steps[0] || {show: {}};
  const show = {
    lp: !!step.show?.lp,
    charges: !!step.show?.charges,
    partials: !!step.show?.partials,
    arrows: !!step.show?.arrows,
    highlight: step.show?.highlight || []
  };
  const mols = Array.isArray(spec.mols) ? spec.mols : [];
  const joiner = spec.joiner ?? '';
  const row = mols.map((mol, index) => {
    const markerId = `fv-structure-arrow-${index}`;
    const join = index > 0 && joiner ? `<span class="fv-joiner" aria-hidden="true">${esc(joiner)}</span>` : '';
    return `${join}${molSVG(mol, {show, markerId})}`;
  }).join('');
  return `<div class="fv-stack"><div class="fv-structure-row">${row}</div></div>`;
}

function namePairBody(spec, state) {
  const items = sequenceFromSpec(spec);
  const item = items[state.step] || items[0];
  if (!item) return '<p class="fv-note">沒有可顯示的資料。</p>';
  const highlightEntries = Array.isArray(item.highlight) ? item.highlight : [];
  const highlights = highlightEntries.flatMap(entry => entry?.atoms || []);
  const labels = highlightEntries.map(entry => `<li>${esc(entry.label || '')}</li>`).join('');
  return `<div class="fv-stack"><p class="fv-mol-label"><strong>${esc(item.name || '')}</strong></p>${molSVG(item.mol, {
    show: {lp: false, charges: false, partials: false, arrows: false},
    highlights,
    highlightEntries,
    markerId: 'fv-name-pair-arrow'
  })}${labels ? `<ul class="fv-highlight-list">${labels}</ul>` : ''}</div>`;
}

function newmanModel(spec, state) {
  const frames = sequenceFromSpec(spec);
  const frame = frames[state.step] || frames[0] || {dihedral: 60, note: ''};
  const dihedral = Number(frame.dihedral) || 0;
  const front = Array.isArray(spec.front) ? spec.front : ['H', 'H', 'H'];
  const back = Array.isArray(spec.back) ? spec.back : ['H', 'H', 'H'];
  const frontC = [-0.75, 0, 0];
  const backC = [0.75, 0, 0];
  const atoms = [
    {label: 'C前', p: frontC, fill: '#fff4da', stroke: '#7f6538', r: 12.6},
    {label: 'C後', p: backC, fill: '#eef4ff', stroke: '#425778', r: 12.6}
  ];
  const bonds = [{a: 0, b: 1}];
  const radius = 1.2;
  for (let i = 0; i < 3; i += 1) {
    const angle = i * TAU / 3;
    const pos = [frontC[0] - 0.95, Math.cos(angle) * radius, Math.sin(angle) * radius];
    atoms.push({label: front[i] || `F${i + 1}`, p: pos, fill: '#fffdf8', stroke: '#36475b', r: 11.3});
    bonds.push({a: 0, b: atoms.length - 1});
  }
  for (let i = 0; i < 3; i += 1) {
    const angle = i * TAU / 3 + dihedral * Math.PI / 180;
    const pos = [backC[0] + 0.95, Math.cos(angle) * radius, Math.sin(angle) * radius];
    atoms.push({label: back[i] || `B${i + 1}`, p: pos, fill: '#f7f9ff', stroke: '#36475b', r: 11.3});
    bonds.push({a: 1, b: atoms.length - 1});
  }
  return {atoms, bonds, frame, dihedral, front, back};
}

function newmanProjection(model) {
  const r = 126;
  const center = {x: 260, y: 170};
  const frontPoints = [];
  const backPoints = [];
  for (let i = 0; i < 3; i += 1) {
    const angleFront = i * TAU / 3 - Math.PI / 2;
    frontPoints.push({
      x: center.x + Math.cos(angleFront) * (r - 26),
      y: center.y + Math.sin(angleFront) * (r - 26)
    });
    const angleBack = i * TAU / 3 + (model.dihedral * Math.PI / 180) - Math.PI / 2;
    backPoints.push({
      x: center.x + Math.cos(angleBack) * r,
      y: center.y + Math.sin(angleBack) * r
    });
  }
  const frontLines = frontPoints.map((point, i) => `<line x1="${center.x}" y1="${center.y}" x2="${point.x.toFixed(2)}" y2="${point.y.toFixed(2)}" stroke="#36465f" stroke-width="3"/><text x="${point.x.toFixed(2)}" y="${(point.y + 5).toFixed(2)}" text-anchor="middle" font-size="16" font-weight="700">${esc(model.front[i])}</text>`).join('');
  const backLines = backPoints.map((point, i) => `<line x1="${center.x}" y1="${center.y}" x2="${point.x.toFixed(2)}" y2="${point.y.toFixed(2)}" stroke="#8b93a3" stroke-width="2.6" stroke-dasharray="6 4"/><text x="${point.x.toFixed(2)}" y="${(point.y + 5).toFixed(2)}" text-anchor="middle" font-size="15" fill="#4b5873">${esc(model.back[i])}</text>`).join('');
  return `<svg viewBox="0 0 520 350" role="img" aria-label="Newman 投影"><circle cx="${center.x}" cy="${center.y}" r="${r}" fill="#fafcff" stroke="#8290ad" stroke-width="2.3"/><circle cx="${center.x}" cy="${center.y}" r="10" fill="#2d3f57"/>${backLines}${frontLines}</svg>`;
}

function newmanBody(spec, state) {
  const model = newmanModel(spec, state);
  return `<div class="fv-stack fv-stack-3d"><div class="fv-figure3d" data-figure-3d data-yaw="${state.yaw.toFixed(4)}" data-pitch="${state.pitch.toFixed(4)}">${renderSimple3D(model, state)}</div><p class="fv-rotation-tip">拖曳模型可旋轉視角；下方 Newman 投影與目前二面角同步。</p><div class="fv-sync-panel fv-sync-panel-newman" data-figure-sync>${newmanProjection(model)}</div><p class="fv-legend">二面角：${Math.round(model.dihedral)}°；${esc(model.frame.label || '')}</p></div>`;
}

function chairFrame(spec, state) {
  const frames = sequenceFromSpec(spec);
  return frames[state.step] || frames[0] || {flip: false, note: ''};
}

function unit3(v) {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

function add3(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function mul3(v, k) {
  return [v[0] * k, v[1] * k, v[2] * k];
}

function chairConformerModel(spec, frame = {flip: false}) {
  const ringTemplate = [
    [1.25, 0.72],
    [0, 1.42],
    [-1.25, 0.72],
    [-1.25, -0.72],
    [0, -1.42],
    [1.25, -0.72]
  ];
  const carbons = Array.from({length: 6}, (_, index) => {
    const baseAxialUp = index % 2 === 0;
    const axialUp = frame.flip ? !baseAxialUp : baseAxialUp;
    const base = ringTemplate[index];
    // The ring axis is the projection's vertical (second coordinate), so the default side view shows the chair.
    const p = [
      base[0],
      axialUp ? CHAIR_RING_Z : -CHAIR_RING_Z,
      base[1]
    ];
    const radial = unit3([base[0], 0, base[1]]);
    const axialDir = [0, axialUp ? 1 : -1, 0];
    const equatorialDir = unit3([radial[0], axialUp ? -CHAIR_EQUATORIAL_TILT : CHAIR_EQUATORIAL_TILT, radial[2]]);
    return {index, carbon: index + 1, baseAxialUp, axialUp, p, axialDir, equatorialDir};
  });

  const atoms = carbons.map(carbon => ({
    label: '',
    p: carbon.p,
    fill: '#fff6e7',
    stroke: '#6d4b29',
    r: 10.4
  }));
  const bonds = carbons.map((_, index) => ({a: index, b: (index + 1) % carbons.length}));
  const substituentInfo = [];
  const substituents = Array.isArray(spec?.substituents) ? spec.substituents : [];
  for (const item of substituents) {
    const carbonIndex = clamp((Number(item.carbon) || 1) - 1, 0, 5);
    const carbon = carbons[carbonIndex];
    if (!carbon) continue;
    const requested = item.position === 'equatorial' ? 'equatorial' : 'axial';
    const desiredUp = requested === 'axial' ? carbon.baseAxialUp : !carbon.baseAxialUp;
    const actual = frame.flip ? (requested === 'axial' ? 'equatorial' : 'axial') : requested;
    const dir = actual === 'axial' ? carbon.axialDir : carbon.equatorialDir;
    const length = actual === 'axial' ? CHAIR_AXIAL_LEN : CHAIR_EQUATORIAL_LEN;
    const substituentPoint = add3(carbon.p, mul3(dir, length));
    atoms.push({
      label: item.label || 'R',
      p: substituentPoint,
      fill: '#f7fbff',
      stroke: '#2f4e69',
      r: 11.4
    });
    bonds.push({a: carbonIndex, b: atoms.length - 1});
    substituentInfo.push({
      label: item.label || 'R',
      carbon: carbon.carbon,
      requested,
      actual,
      up: desiredUp ? 'up' : 'down'
    });
  }
  return {atoms, bonds, substituents: substituentInfo};
}

function chairBody(spec, state) {
  const frame = chairFrame(spec, state);
  const model = chairConformerModel(spec, frame);
  const detailList = model.substituents.map(item => (
    `<li data-chair-substituent="${esc(item.label)}" data-carbon="${item.carbon}" data-requested="${item.requested}" data-actual="${item.actual}" data-up="${item.up}">C${item.carbon} ${esc(item.label)}：${esc(item.actual)}（${item.up}）</li>`
  )).join('');
  const note = frame.flip
    ? '翻環後 axial / equatorial 互換，但每個取代基的 up/down 方向保持不變。'
    : '目前為反式椅式視角：軸向平行環軸、赤道向外且略與軸向相反。';
  return `<div class="fv-stack fv-stack-3d"><div class="fv-figure3d fv-figure3d-chair" data-figure-3d data-figure-chair data-yaw="${state.yaw.toFixed(4)}" data-pitch="${state.pitch.toFixed(4)}">${renderSimple3D(model, state)}</div>${detailList ? `<ul class="fv-chair-info">${detailList}</ul>` : ''}<p class="fv-rotation-tip">拖曳模型可旋轉視角；按「下一步」翻環，看軸向與赤道向互換。</p></div>`;
}

function chiralityModel(spec) {
  const groups = Array.isArray(spec.groups) ? spec.groups : [];
  const dirs = [
    [1.08, 1.04, 0.95],
    [-1.08, -1.04, 0.95],
    [-1.08, 1.04, -0.95],
    [1.08, -1.04, -0.95]
  ];
  const atoms = [{label: '*', p: [0, 0, 0], fill: '#ffe8d6', stroke: '#7b4b1d', r: 12.2}];
  const bonds = [];
  groups.forEach((group, i) => {
    const d = dirs[i] || [0.8, 0.8, 0.8];
    atoms.push({
      label: group.label || `G${i + 1}`,
      p: d,
      fill: '#f9fcff',
      stroke: '#2f4a63',
      r: 11.1,
      priority: group.priority
    });
    bonds.push({a: 0, b: atoms.length - 1});
  });
  return {atoms, bonds};
}

function chiralityBody(spec, state) {
  const steps = sequenceFromSpec(spec);
  const step = steps[state.step] || steps[0] || {show: 'groups'};
  const model = chiralityModel(spec);
  const groups = Array.isArray(spec.groups) ? spec.groups : [];
  let detail = '';
  if (step.show === 'groups') detail = '先辨識四個取代基。';
  if (step.show === 'priorities') detail = `依 CIP 排序：${groups.map(group => `${group.priority}:${group.label}`).join('，')}。`;
  if (step.show === 'orient') detail = '把第 4 優先序轉到後方，再準備判讀 1→2→3。';
  if (step.show === 'direction') detail = `沿 1→2→3 判讀，結果為 ${spec.answer || ''}。`;
  return `<div class="fv-stack fv-stack-3d"><div class="fv-figure3d" data-figure-3d data-yaw="${state.yaw.toFixed(4)}" data-pitch="${state.pitch.toFixed(4)}">${renderSimple3D(model, state)}</div><p class="fv-rotation-tip">拖曳模型可旋轉視角，確認第 4 優先序朝後時再讀方向。</p><p class="fv-answer">${esc(detail)}</p>${step.show === 'direction' ? `<p class="fv-answer">手性判定：<strong>${esc(spec.answer || '')}</strong></p>` : ''}</div>`;
}

function schematicBody(spec) {
  const panels = Array.isArray(spec.panels) ? spec.panels : [];
  const joiner = spec.joiner ?? '';
  const panelHTML = panels.map((panel, index) => {
    const mol = panel.mol ? molSVG(panel.mol, {
      show: {lp: true, charges: true, partials: true, arrows: true},
      markerId: `fv-schematic-${index}`
    }) : '';
    const text = panel.text ? `<p>${esc(panel.text)}</p>` : '';
    const cap = panel.caption ? `<p class="fv-mol-label">${esc(panel.caption)}</p>` : '';
    return `<article class="fv-panel">${cap}${mol}${text}</article>`;
  });
  const joined = panelHTML.map((part, index) => (index > 0 && joiner ? `<span class="fv-joiner" aria-hidden="true">${esc(joiner)}</span>${part}` : part)).join('');
  let curve = '';
  if (spec.curve?.points?.length) {
    const pts = spec.curve.points;
    const xs = pts.map(pt => Number(pt[0]) || 0);
    const ys = pts.map(pt => Number(pt[1]) || 0);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = Math.max(1, maxX - minX);
    const spanY = Math.max(1, maxY - minY);
    const map = point => ({
      x: 24 + (((Number(point[0]) || 0) - minX) / spanX) * 620,
      y: 180 - (((Number(point[1]) || 0) - minY) / spanY) * 140
    });
    const path = pts.map((point, i) => {
      const p = map(point);
      return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    }).join(' ');
    const labels = (spec.curve.labels || []).map(label => {
      const p = map([label.x, label.y]);
      return `<text x="${p.x.toFixed(2)}" y="${(p.y - 6).toFixed(2)}" text-anchor="middle" font-size="12" fill="#3d4355">${esc(label.text || '')}</text>`;
    }).join('');
    curve = `<svg class="fv-curve" viewBox="0 0 680 200" role="img" aria-label="趨勢曲線"><path d="${path}" fill="none" stroke="#4060a8" stroke-width="3"/><path d="${path}" fill="none" stroke="#89a4dc" stroke-width="8" opacity="0.2"/>${labels}</svg>`;
  }
  return `<div class="fv-stack"><div class="fv-schematic" data-joiner="${esc(joiner)}">${joined}</div>${curve}</div>`;
}

function bodyHTML(spec, state) {
  switch (spec?.kind) {
    case 'structure-steps': return structureBody(spec, state);
    case 'name-pair': return namePairBody(spec, state);
    case 'newman': return newmanBody(spec, state);
    case 'chair': return chairBody(spec, state);
    case 'chirality': return chiralityBody(spec, state);
    case 'schematic': return schematicBody(spec, state);
    default: return '<p class="fv-note">不支援的圖解種類。</p>';
  }
}

function currentNote(spec, state) {
  if (spec?.kind === 'name-pair') {
    const item = (spec.items || [])[state.step];
    return item ? `目前項目：${item.name || ''}` : '';
  }
  const sequence = sequenceFromSpec(spec);
  const current = sequence[state.step];
  if (!current) return '';
  return current.note || current.label || '';
}

function itemTabsHTML(specInput, state) {
  const items = figureItemsOf(specInput);
  if (items.length <= 1) return '';
  return `<div class="fv-item-tabs" role="tablist" aria-label="圖解分頁">${items.map((item, index) => (
    `<button type="button" role="tab" data-figure-item="${index}" data-active="${index === state.item ? 'true' : 'false'}" aria-selected="${index === state.item ? 'true' : 'false'}">${esc(item?.title || `圖 ${index + 1}`)}</button>`
  )).join('')}</div>`;
}

function controlsHTML(spec, state) {
  const sequence = sequenceFromSpec(spec);
  if (sequence.length <= 1) return `<p class="fv-note" data-figure-note>${esc(currentNote(spec, state))}</p>`;
  return `<div class="fv-step-controls"><button type="button" data-figure-prev aria-label="上一步">上一步</button><button type="button" data-figure-next aria-label="下一步">下一步</button><span class="fv-step-indicator" data-figure-step>${state.step + 1} / ${sequence.length}</span></div><p class="fv-note" data-figure-note>${esc(currentNote(spec, state))}</p>`;
}

function renderFigure(specInput, state) {
  const spec = activeSpec(specInput, state);
  const items = figureItemsOf(specInput);
  return `<section class="figure-view" data-figure-kind="${esc(spec?.kind || '')}" data-figure-item="${state.item}" data-figure-count="${items.length}"><h3 class="figure-title">${esc(spec?.title || '圖解')}</h3>${itemTabsHTML(specInput, state)}<div class="figure-body" data-figure-body>${bodyHTML(spec, state)}</div>${controlsHTML(spec, state)}</section>`;
}

export function figureHTML(specInput) {
  return renderFigure(specInput, stateFor(specInput));
}

export function mountFigure(root, specInput) {
  if (!root || typeof root !== 'object') return () => {};
  const state = stateFor(specInput);
  root.innerHTML = renderFigure(specInput, state);
  const cleanups = [];
  const register = (node, type, handler, options) => {
    node.addEventListener(type, handler, options);
    cleanups.push(() => node.removeEventListener(type, handler, options));
  };
  const currentSpec = () => activeSpec(specInput, state);
  const currentSequence = () => sequenceFromSpec(currentSpec());
  const bodyNode = () => root.querySelector('[data-figure-body]');
  const noteNode = () => root.querySelector('[data-figure-note]');
  const stepNode = () => root.querySelector('[data-figure-step]');
  let dragCleanup = () => {};

  function applyCameraPreset(spec, {force = false} = {}) {
    const preset = cameraForSpec(spec, state.step);
    if (!preset) return;
    if (force || !state.cameraTouched) {
      state.yaw = preset.yaw;
      state.pitch = preset.pitch;
      state.zoom = preset.zoom;
    }
  }

  function stepFor(spec) {
    const sequence = sequenceFromSpec(spec);
    return sequence[state.step] || sequence[0] || {};
  }

  function paint3D() {
    const spec = currentSpec();
    const host = root.querySelector('[data-figure-3d]');
    if (!host) return;
    if (spec.kind === 'newman') host.innerHTML = renderSimple3D(newmanModel(spec, state), state);
    if (spec.kind === 'chirality') host.innerHTML = renderSimple3D(chiralityModel(spec), state);
    if (spec.kind === 'chair') host.innerHTML = renderSimple3D(chairConformerModel(spec, chairFrame(spec, state)), state);
    host.dataset.yaw = state.yaw.toFixed(4);
    host.dataset.pitch = state.pitch.toFixed(4);
    if (spec.kind === 'newman') {
      const sync = root.querySelector('[data-figure-sync]');
      if (sync) sync.innerHTML = newmanProjection(newmanModel(spec, state));
    }
  }

  function bindDrag() {
    dragCleanup();
    const host = root.querySelector('[data-figure-3d]');
    if (!host) return;
    const doc = host.ownerDocument || document;
    const win = doc.defaultView || window;
    let active = false;
    let pointerId = null;
    let lastX = 0;
    let lastY = 0;
    const hostBoundsOnPage = () => {
      const rect = host.getBoundingClientRect();
      const pageX = Number(win.scrollX) || 0;
      const pageY = Number(win.scrollY) || 0;
      return {
        left: rect.left + pageX,
        right: rect.right + pageX,
        top: rect.top + pageY,
        bottom: rect.bottom + pageY
      };
    };
    const pagePoint = event => {
      const pageX = Number.isFinite(event.pageX) ? event.pageX : event.clientX + ((Number(win.scrollX) || 0));
      const pageY = Number.isFinite(event.pageY) ? event.pageY : event.clientY + ((Number(win.scrollY) || 0));
      return {x: pageX, y: pageY};
    };
    // Only presses that land inside this figure start a drag. A page-coordinate test alone would also capture
    // presses on fixed UI drawn over the model (e.g. the lesson's Continue button) and swallow their clicks.
    const hitHost = event => {
      const target = event.target;
      if (!target || typeof target.closest !== 'function' || target.closest('button, a, input, select, label')) return false;
      if (host.contains(target)) return true;
      if (!root.contains(target)) return false;
      const bounds = hostBoundsOnPage();
      const point = pagePoint(event);
      return point.x >= bounds.left && point.x <= bounds.right && point.y >= bounds.top && point.y <= bounds.bottom;
    };
    const onPointerDown = event => {
      if (!hitHost(event)) return;
      active = true;
      pointerId = event.pointerId;
      lastX = event.clientX;
      lastY = event.clientY;
      if (typeof host.setPointerCapture === 'function') {
        try {
          host.setPointerCapture(pointerId);
        } catch {}
      }
    };
    const onPointerMove = event => {
      if (!active || event.pointerId !== pointerId) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      state.yaw += dx * 0.0125;
      state.pitch = clamp(state.pitch - dy * 0.0105, -1.3, 1.3);
      state.cameraTouched = true;
      paint3D();
    };
    const stopDrag = event => {
      if (!active || event.pointerId !== pointerId) return;
      active = false;
      if (typeof host.releasePointerCapture === 'function') {
        try {
          host.releasePointerCapture(pointerId);
        } catch {}
      }
      pointerId = null;
    };
    doc.addEventListener('pointerdown', onPointerDown);
    doc.addEventListener('pointermove', onPointerMove);
    doc.addEventListener('pointerup', stopDrag);
    doc.addEventListener('pointercancel', stopDrag);
    dragCleanup = () => {
      doc.removeEventListener('pointerdown', onPointerDown);
      doc.removeEventListener('pointermove', onPointerMove);
      doc.removeEventListener('pointerup', stopDrag);
      doc.removeEventListener('pointercancel', stopDrag);
    };
  }

  function refresh({rebuildBody = true, rebuildShell = false} = {}) {
    const spec = currentSpec();
    const sequence = currentSequence();
    if (state.step > Math.max(0, sequence.length - 1)) {
      state.step = Math.max(0, sequence.length - 1);
    }
    if (rebuildShell) {
      root.innerHTML = renderFigure(specInput, state);
    } else if (rebuildBody) {
      const node = bodyNode();
      if (node) node.innerHTML = bodyHTML(spec, state);
    }
    const step = stepFor(spec);
    const forceCamera = spec.kind === 'chirality' && (step.show === 'orient' || step.show === 'direction');
    applyCameraPreset(spec, {force: forceCamera});
    paint3D();
    const note = noteNode();
    if (note) note.textContent = currentNote(spec, state);
    const stepBadge = stepNode();
    if (stepBadge && sequence.length > 1) stepBadge.textContent = `${state.step + 1} / ${sequence.length}`;
    const prev = root.querySelector('[data-figure-prev]');
    const next = root.querySelector('[data-figure-next]');
    if (prev) prev.disabled = state.step <= 0;
    if (next) next.disabled = state.step >= sequence.length - 1;
    bindDrag();
    if (rebuildBody && (spec.kind === 'newman' || spec.kind === 'chirality')) {
      const host = root.querySelector('[data-figure-3d]');
      if (host && typeof host.scrollIntoView === 'function') {
        host.scrollIntoView({block: 'center', inline: 'nearest'});
      }
    }
  }

  register(root, 'click', event => {
    const target = event.target?.closest?.('button');
    if (!target || !root.contains(target)) return;
    if (target.hasAttribute('data-figure-prev')) {
      const sequence = currentSequence();
      state.step = clamp(state.step - 1, 0, Math.max(0, sequence.length - 1));
      refresh({});
      return;
    }
    if (target.hasAttribute('data-figure-next')) {
      const sequence = currentSequence();
      state.step = clamp(state.step + 1, 0, Math.max(0, sequence.length - 1));
      refresh({});
      return;
    }
    if (target.hasAttribute('data-figure-item')) {
      const nextItem = clamp(Number(target.getAttribute('data-figure-item')) || 0, 0, figureItemsOf(specInput).length - 1);
      if (nextItem !== state.item) {
        state.item = nextItem;
        state.step = 0;
        state.cameraTouched = false;
      }
      refresh({rebuildBody: false, rebuildShell: true});
    }
  });

  if (typeof matchMedia === 'function') {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const onMotionChange = () => {
      if (media.matches || reducedMotionPreferred()) root.dataset.motion = 'paused';
      else root.dataset.motion = 'active';
    };
    onMotionChange();
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onMotionChange);
      cleanups.push(() => media.removeEventListener('change', onMotionChange));
    }
  }

  refresh({rebuildBody: false});
  return () => {
    dragCleanup();
    while (cleanups.length) cleanups.pop()();
  };
}

export const __figureInternals = {
  esc,
  bodyHTML,
  sequenceFromSpec,
  figureItemsOf,
  numberingMapFor,
  cameraForSpec,
  chairConformerModel,
  chiralityModel
};
