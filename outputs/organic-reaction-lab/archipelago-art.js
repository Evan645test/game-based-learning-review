const ARCHIPELAGO_ATLAS = 'archipelago-atlas.png';
const ATLAS_COLS = 4;
const ATLAS_ROWS = 4;
const ATLAS_TILE = 512;

const THEME_META = {
  prep: {
    hint: '港灣訓練營',
    accent: '#b87656',
    seaA: '#cce7df',
    seaB: '#7fc9c7',
    row: 0,
  },
  alkene: {
    hint: '果園農莊',
    accent: '#6f9156',
    seaA: '#d6e8cf',
    seaB: '#96c785',
    row: 1,
  },
  subelim: {
    hint: '貿易港町與燈塔',
    accent: '#5d899b',
    seaA: '#cce5ef',
    seaB: '#86bbcf',
    row: 2,
  },
  summit: {
    hint: '山頂觀測站',
    accent: '#8a76a8',
    seaA: '#ddd8ef',
    seaB: '#a99ac8',
    row: 3,
  },
};

const STATE_TEXT = {
  done: '已完成',
  open: '可前往',
  fog: '霧中待開啟',
};

const PREP_BADGE = {
  ready: '已具備',
  review: '待補強',
};

const BOAT_ICON = '⛵';

const esc = value =>
  String(value ?? '').replace(/[&<>"']/g, char => {
    if (char === '&') return '&amp;';
    if (char === '<') return '&lt;';
    if (char === '>') return '&gt;';
    if (char === '"') return '&quot;';
    return '&#39;';
  });

const asArray = value => (Array.isArray(value) ? value : []);
const int = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeState(value) {
  return value === 'done' || value === 'open' || value === 'fog' ? value : 'fog';
}

function normalizeTheme(value) {
  if (value && THEME_META[value]) return value;
  return 'prep';
}

function resolveBoatTarget(list, boat) {
  if (typeof boat === 'number' && Number.isInteger(boat)) {
    return list[boat]?.id ?? null;
  }
  if (typeof boat === 'string') return boat;
  if (boat && typeof boat === 'object' && typeof boat.id === 'string') return boat.id;
  return null;
}

function progressSummary(progress) {
  const done = clamp(int(progress?.done), 0, 9999);
  const total = clamp(int(progress?.total), 0, 9999);
  if (!total) return '尚未開始';
  return `進度 ${done}/${total}`;
}

function normalizedProgress(progress) {
  const done = clamp(int(progress?.done), 0, 9999);
  const total = clamp(int(progress?.total), 0, 9999);
  if (!total) return {done: 0, total: 0, ratio: 0};
  return {done, total, ratio: clamp(done / total, 0, 1)};
}

function themeFor(entry) {
  const key = normalizeTheme(entry?.theme);
  return {key, ...THEME_META[key]};
}

function hexPoints(cx, cy, r) {
  const points = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = ((i * 60 - 90) * Math.PI) / 180;
    points.push(`${(cx + Math.cos(angle) * r).toFixed(1)},${(cy + Math.sin(angle) * r).toFixed(1)}`);
  }
  return points.join(' ');
}

function atlasTile({row, col, x, y, size, className = ''}) {
  const safeCol = clamp(int(col), 0, ATLAS_COLS - 1);
  const safeRow = clamp(int(row), 0, ATLAS_ROWS - 1);
  const viewX = safeCol * ATLAS_TILE;
  const viewY = safeRow * ATLAS_TILE;
  return `<svg class="arch-atlas-tile ${className}" x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${viewX} ${viewY} ${ATLAS_TILE} ${ATLAS_TILE}" preserveAspectRatio="xMidYMid slice" overflow="hidden"><image href="${ARCHIPELAGO_ATLAS}" width="${ATLAS_COLS * ATLAS_TILE}" height="${ATLAS_ROWS * ATLAS_TILE}" preserveAspectRatio="none"/></svg>`;
}

function statusText(state) {
  return STATE_TEXT[state] || STATE_TEXT.fog;
}

function archipelagoArt(theme, state, marker) {
  const fog = state === 'fog';
  const atlasRow = theme.row;
  const ground = [
    {x: 76, y: 106, r: 46, t: 0},
    {x: 128, y: 82, r: 46, t: 1},
    {x: 180, y: 106, r: 46, t: 2},
  ];
  const groundHex = ground
    .map(
      tile =>
        `<polygon class="arch-ground-shadow" points="${hexPoints(tile.x, tile.y + 3, tile.r)}"/><polygon class="arch-ground-top" points="${hexPoints(tile.x, tile.y, tile.r)}"/>`,
    )
    .join('');
  const atlas = ground
    .map(tile => atlasTile({row: atlasRow, col: tile.t, x: tile.x - tile.r, y: tile.y - tile.r, size: tile.r * 2}))
    .join('');
  const landmark = atlasTile({row: atlasRow, col: 3, x: 194, y: 36, size: 60, className: 'arch-landmark'});
  const fogLayer = fog
    ? '<g class="arch-fog-cloud"><ellipse cx="118" cy="91" rx="104" ry="47"/><ellipse cx="210" cy="79" rx="60" ry="35"/><ellipse cx="66" cy="70" rx="54" ry="33"/></g>'
    : '';
  const badge = marker
    ? `<g class="arch-boat-dot"><circle cx="246" cy="26" r="16"/><text x="246" y="31" text-anchor="middle">${esc(marker)}</text></g>`
    : '';
  return `<svg class="arch-card-art" viewBox="0 0 280 176" aria-hidden="true" focusable="false"><defs><linearGradient id="arch-sea-${theme.key}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${theme.seaA}"/><stop offset="1" stop-color="${theme.seaB}"/></linearGradient></defs><rect width="280" height="176" rx="18" fill="url(#arch-sea-${theme.key})"/><path class="arch-wave" d="M16 32q12-7 24 0t24 0t24 0t24 0t24 0t24 0t24 0" /><path class="arch-wave" d="M24 142q10-5 20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0" /><g class="arch-grounds">${groundHex}${atlas}${landmark}${fogLayer}</g>${badge}</svg>`;
}

function islandArt(theme, state, marker) {
  const fog = state === 'fog';
  const atlasRow = theme.row;
  const cells = [
    {x: 58, y: 70, r: 34, c: 0},
    {x: 98, y: 54, r: 34, c: 1},
    {x: 138, y: 70, r: 34, c: 2},
  ];
  const base = cells
    .map(
      cell =>
        `<polygon class="arch-ground-shadow" points="${hexPoints(cell.x, cell.y + 2, cell.r)}"/><polygon class="arch-ground-top" points="${hexPoints(cell.x, cell.y, cell.r)}"/>`,
    )
    .join('');
  const tiles = cells
    .map(cell => atlasTile({row: atlasRow, col: cell.c, x: cell.x - cell.r, y: cell.y - cell.r, size: cell.r * 2}))
    .join('');
  const fogLayer = fog
    ? '<g class="arch-fog-cloud"><ellipse cx="94" cy="66" rx="82" ry="30"/><ellipse cx="40" cy="59" rx="35" ry="20"/></g>'
    : '';
  const badge = marker
    ? `<g class="arch-boat-dot"><circle cx="152" cy="20" r="13"/><text x="152" y="25" text-anchor="middle">${esc(marker)}</text></g>`
    : '';
  return `<svg class="arch-island-art" viewBox="0 0 180 112" aria-hidden="true" focusable="false"><defs><linearGradient id="arch-sea-mini-${theme.key}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${theme.seaA}"/><stop offset="1" stop-color="${theme.seaB}"/></linearGradient></defs><rect width="180" height="112" rx="14" fill="url(#arch-sea-mini-${theme.key})"/><path class="arch-wave" d="M10 20q8-4 16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0" /><g class="arch-grounds">${base}${tiles}${fogLayer}</g>${badge}</svg>`;
}

function cardText(entry, fallbackName) {
  const name = String(entry?.name ?? fallbackName ?? '');
  return name || '未命名群島';
}

function fullText(entry, fallback) {
  const text = String(entry?.full ?? '');
  if (text) return text;
  return fallback;
}

function islandStatusPhrase(state, current) {
  if (state === 'done') return '已完成';
  if (state === 'open') return current ? '目前所在' : '可前往';
  return '霧中待開啟';
}

function archipelagoCard(entry, index, boatTargetId) {
  const idRaw = String(entry?.id ?? `arch-${index}`);
  const id = esc(idRaw);
  const theme = themeFor(entry);
  const state = normalizeState(entry?.state);
  const current = Boolean(entry?.current) || boatTargetId === idRaw;
  const flag = Boolean(entry?.flag);
  const progress = normalizedProgress(entry?.progress);
  const title = cardText(entry, idRaw);
  const summary = progressSummary(entry?.progress);
  const label = `${title}，${statusText(state)}，${summary}${current ? '，目前所在' : ''}${flag ? '，有紅旗需回看' : ''}`;
  return `<button type="button" class="arch-card state-${state} theme-${theme.key}${current ? ' is-current' : ''}" data-archipelago="${id}" data-arch-state="${state}" aria-label="${esc(label)}"><span class="arch-card-art-wrap" aria-hidden="true">${archipelagoArt(theme, state, current ? BOAT_ICON : '')}</span><span class="arch-card-body"><span class="arch-card-title">${esc(state === 'fog' ? `？ ${title}` : title)}</span><span class="arch-card-hint">${esc(theme.hint)}</span><span class="arch-card-meta"><span class="arch-chip status">${esc(statusText(state))}</span><span class="arch-chip progress">${progress.total ? `${progress.done}/${progress.total}` : '0/0'}</span></span><span class="arch-progress-line" aria-hidden="true"><i style="--arch-progress:${progress.ratio.toFixed(4)}"></i></span></span>${current ? '<span class="arch-current-marker">目前位置</span>' : ''}${flag ? '<span class="arch-flag-marker"><span class="arch-flag-icon">⚑</span> 回看</span>' : ''}</button>`;
}

function islandCard(entry, index, archipelago, boatTargetId) {
  const idRaw = String(entry?.id ?? `island-${index}`);
  const id = esc(idRaw);
  const theme = themeFor(archipelago);
  const state = normalizeState(entry?.state);
  const current = Boolean(entry?.current) || boatTargetId === idRaw;
  const flag = Boolean(entry?.flag);
  const title = cardText(entry, idRaw);
  const subtitle = fullText(entry, '');
  const prep = entry?.prep === 'ready' || entry?.prep === 'review' ? entry.prep : null;
  const prepText = prep ? PREP_BADGE[prep] : '';
  const status = islandStatusPhrase(state, current);
  const label = `${title}，${status}${prepText ? `，先備 ${prepText}` : ''}${flag ? '，有紅旗需回看' : ''}`;
  return `<button type="button" class="arch-island-card state-${state}${current ? ' is-current' : ''}" data-island="${id}" data-isle-state="${state}" aria-label="${esc(label)}"><span class="arch-island-art-wrap" aria-hidden="true">${islandArt(theme, state, current ? BOAT_ICON : '')}</span><span class="arch-island-body"><span class="arch-island-title">${esc(state === 'fog' ? `？ ${title}` : title)}</span>${subtitle ? `<span class="arch-island-full">${esc(subtitle)}</span>` : ''}<span class="arch-island-meta"><span class="arch-chip status">${esc(status)}</span>${prepText ? `<span class="arch-chip prep ${prep}">${esc(prepText)}</span>` : ''}</span></span>${flag ? '<span class="arch-flag-marker"><span class="arch-flag-icon">⚑</span> 回看</span>' : ''}${current ? '<span class="arch-current-marker">目前位置</span>' : ''}</button>`;
}

/**
 * 第一層：四個群島世界地圖。
 * @param {{archipelagos:Array<{id:string,name:string,theme:'prep'|'alkene'|'subelim'|'summit',state:'done'|'open'|'fog',flag?:boolean,current?:boolean,progress?:{done:number,total:number}}>, boat:number|string|{id:string}}} input
 * @returns {string}
 */
export function worldMapHTML({archipelagos, boat}) {
  const items = asArray(archipelagos);
  const boatTarget = resolveBoatTarget(items, boat);
  const cards = items.map((entry, index) => archipelagoCard(entry, index, boatTarget)).join('');
  return `<section class="archipelago-art arch-world" data-arch-world><header class="arch-world-head"><p class="arch-eyebrow">ORGANIC ARCHIPELAGO</p><h2>反應群島世界地圖</h2><p class="arch-note">依章節航行四座群島，完成每座的核心任務。</p></header><div class="arch-world-grid">${cards}</div></section>`;
}

/**
 * 第二層：單一群島內的島嶼地圖。
 * @param {{archipelago:{id:string,name:string,theme:'prep'|'alkene'|'subelim'|'summit',state:'done'|'open'|'fog'},islands:Array<{id:string,name:string,full:string,state:'done'|'open'|'fog',flag?:boolean,current?:boolean,prep?:'ready'|'review'|null}>,boat:number|string|{id:string}}} input
 * @returns {string}
 */
export function archipelagoHTML({archipelago, islands, boat}) {
  const info = archipelago || {};
  const theme = themeFor(info);
  const list = asArray(islands);
  const boatTarget = resolveBoatTarget(list, boat);
  const title = cardText(info, '未命名群島');
  const state = normalizeState(info?.state);
  const headerStatus = statusText(state);
  const cards = list.map((entry, index) => islandCard(entry, index, info, boatTarget)).join('');
  return `<section class="archipelago-art archipelago-panel theme-${theme.key}" data-archipelago-panel="${esc(String(info?.id ?? 'unknown'))}"><header class="archipelago-head"><button type="button" class="arch-back-btn" data-go-world aria-label="返回世界地圖">返回世界地圖</button><div class="archipelago-titles"><p class="arch-eyebrow">${esc(theme.hint)}</p><h2>${esc(title)}</h2><p class="arch-note">${esc(headerStatus)}</p></div></header><div class="arch-island-grid">${cards}</div></section>`;
}
