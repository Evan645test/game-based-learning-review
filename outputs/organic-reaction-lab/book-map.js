import {chemistSVG} from './island-map.js';

const VIEW_W = 2400;
const VIEW_H = 1500;
const LEFT_AREA = {x0: 240, x1: 980, y0: 220, y1: 1260};
const RIGHT_AREA = {x0: 1420, x1: 2160, y0: 220, y1: 1260};

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => (
  ch === '&' ? '&amp;' :
  ch === '<' ? '&lt;' :
  ch === '>' ? '&gt;' :
  ch === '"' ? '&quot;' : '&#39;'
));

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function spreadAt(spreads, index) {
  if (!Array.isArray(spreads) || spreads.length === 0) return null;
  return spreads[clamp(Number(index) || 0, 0, spreads.length - 1)] || null;
}

function yFor(index, count, area) {
  if (count <= 1) return (area.y0 + area.y1) / 2;
  const t = index / (count - 1);
  return area.y0 + (area.y1 - area.y0) * t;
}

function pagePositions(nodes, area, page) {
  const count = nodes.length;
  if (!count) return [];
  const xMid = (area.x0 + area.x1) / 2;
  const wave = Math.min(96, (area.x1 - area.x0) * 0.18);
  return nodes.map((node, index) => {
    const t = count <= 1 ? 0.5 : index / (count - 1);
    const x = clamp(
      xMid + Math.sin((0.22 + t * 1.64) * Math.PI) * wave + (index % 2 === 0 ? -wave * 0.16 : wave * 0.16),
      area.x0 + 82,
      area.x1 - 82
    );
    const y = clamp(yFor(index, count, area), area.y0 + 26, area.y1 - 26);
    return {node, page, x, y};
  });
}

function layoutNodes(nodes) {
  const all = Array.isArray(nodes) ? nodes : [];
  const split = Math.ceil(all.length / 2);
  const left = pagePositions(all.slice(0, split), LEFT_AREA, 'left');
  const right = pagePositions(all.slice(split), RIGHT_AREA, 'right');
  return {
    split,
    points: [...left, ...right]
  };
}

function pathData(points, split) {
  if (!points.length) return '';
  let d = `M${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let index = 1; index < points.length; index += 1) {
    const prev = points[index - 1];
    const next = points[index];
    if (index === split && split > 0 && split < points.length) {
      const leftGateY = clamp(prev.y, 270, VIEW_H - 270);
      const rightGateY = clamp(next.y, 270, VIEW_H - 270);
      d += ` L1168.0 ${leftGateY.toFixed(1)} C1190.0 ${leftGateY.toFixed(1)} 1210.0 ${rightGateY.toFixed(1)} 1232.0 ${rightGateY.toFixed(1)}`;
      d += ` L${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
      continue;
    }
    const cx = (prev.x + next.x) * 0.5;
    d += ` Q${cx.toFixed(1)} ${prev.y.toFixed(1)} ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
  }
  return d;
}

function stateText(state) {
  if (state === 'done') return '已完成';
  if (state === 'next') return '進行中';
  return '待解鎖';
}

function pctX(x) {
  return `${(x / VIEW_W * 100).toFixed(3)}%`;
}

function pctY(y) {
  return `${(y / VIEW_H * 100).toFixed(3)}%`;
}

function normalizeSide(side, fallback = 'left') {
  if (side === 'left' || side === 'right') return side;
  return fallback === 'right' ? 'right' : 'left';
}

export function bookHTML({spreads, spread = 0, hero = '', side} = {}) {
  const current = spreadAt(spreads, spread);
  if (!current) {
    return `<section class="book-map"><p class="book-map-title">沒有可顯示的跨頁資料。</p></section>`;
  }
  const nodes = Array.isArray(current.nodes) ? current.nodes : [];
  const {split, points} = layoutNodes(nodes);
  const pointOf = new Map(points.map(point => [point.node.id, point]));
  const heroPoint = pointOf.get(hero) || points[0] || {x: (LEFT_AREA.x0 + LEFT_AREA.x1) / 2, y: (LEFT_AREA.y0 + LEFT_AREA.y1) / 2, page: 'left'};
  const initialSide = normalizeSide(side, heroPoint.page === 'right' ? 'right' : 'left');
  const path = pathData(points, split);

  const nodeButtons = points.map(({node, x, y}) => {
    const station = esc(node.id);
    const section = esc(node.section || '');
    const title = esc(node.title || '');
    const status = stateText(node.state);
    const label = `${section} ${title}（${status}${node.flag ? '；紅旗' : ''}）`;
    return `<button type="button" class="book-node" data-station="${station}" data-node-state="${esc(node.state || 'todo')}" data-flag="${node.flag ? 'true' : 'false'}" style="left:${pctX(x)};top:${pctY(y)}" aria-label="${esc(label)}"><span class="book-node-section">${section}</span><span class="book-node-title">${title}</span></button>`;
  }).join('');

  const chemistX = clamp(
    heroPoint.x - 104,
    heroPoint.page === 'right' ? RIGHT_AREA.x0 + 70 : LEFT_AREA.x0 + 70,
    heroPoint.page === 'right' ? RIGHT_AREA.x1 - 70 : LEFT_AREA.x1 - 70
  );
  const chemistY = clamp(heroPoint.y - 86, 132, VIEW_H - 120);
  const chemist = `<div class="book-chemist" style="left:${pctX(chemistX)};top:${pctY(chemistY)}" aria-hidden="true">${chemistSVG(38)}</div>`;
  const hasArt = !!current.art;
  // Single quotes: the value sits inside a double-quoted style attribute.
  const artURL = hasArt ? `url('${esc(String(current.art))}')` : 'none';

  return `<section class="book-map" data-book-spread="${esc(current.id || '')}" data-book-index="${clamp(Number(spread) || 0, 0, (spreads?.length || 1) - 1)}" data-book-side="${initialSide}"><h3 class="book-map-title">${esc(current.title || '')}</h3><p class="book-map-subtitle">${esc(current.chapters || '')}</p><div class="book-stage"><div class="book-viewport"><div class="book-canvas" data-has-art="${hasArt ? 'true' : 'false'}" style="--book-spread-art:${artURL}"><svg class="book-overlay" viewBox="0 0 ${VIEW_W} ${VIEW_H}" aria-hidden="true" focusable="false">${path ? `<path class="book-path-under" d="${path}"></path><path class="book-path" d="${path}"></path>` : ''}</svg>${nodeButtons}${chemist}</div></div><div class="book-page-controls"><button type="button" data-book-page="prev" aria-label="上一頁">上一頁</button><button type="button" data-book-page="next" aria-label="下一頁">下一頁</button></div></div></section>`;
}

export const __bookMapInternals = {
  layoutNodes,
  pathData,
  esc,
  normalizeSide
};
