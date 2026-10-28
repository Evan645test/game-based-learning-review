const RELATION_TYPES = new Set(['prerequisite', 'application', 'comparison']);
const STATION_STATES = new Set(['current', 'done', 'review', 'todo']);

const SCENE_WIDTH = 3200;
const SCENE_HEIGHT = 2100;
const MIN_ZOOM = 0.12;
const MAX_ZOOM = 2.4;
const MAX_SAFE_PAN = 200000;

const STATUS_TEXT = Object.freeze({
  current: '目前',
  done: '已完成',
  review: '需回看',
  todo: '待學習'
});

const STATUS_ICON = Object.freeze({
  current: '●',
  done: '✓',
  review: '↺',
  todo: '○'
});

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function finiteNumber(value) {
  return Number.isFinite(value) ? value : null;
}

function safeString(value) {
  return String(value ?? '').trim();
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => (
    char === '&' ? '&amp;'
      : char === '<' ? '&lt;'
        : char === '>' ? '&gt;'
          : char === '"' ? '&quot;'
            : '&#39;'
  ));
}

function deduceState(rawState, finished, reviewFlag) {
  if (STATION_STATES.has(rawState)) return rawState;
  if (finished) return 'done';
  if (reviewFlag) return 'review';
  return 'todo';
}

function sortStations(stations) {
  return [...stations].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.id.localeCompare(b.id);
  });
}

function normalizeModel(model = {}) {
  const chapterById = new Map();
  const stationById = new Map();
  const stationToChapter = new Map();
  const chapters = [];

  for (const [chapterIndex, chapterRaw] of asArray(model.chapters).entries()) {
    const chapterId = safeString(chapterRaw?.id);
    if (!chapterId || chapterById.has(chapterId)) continue;
    const chapterTitle = safeString(chapterRaw?.title) || `第 ${chapterIndex + 1} 章`;
    const chapterSubtitle = safeString(chapterRaw?.chapters);
    const stations = [];
    const sourceStations = asArray(chapterRaw?.stations);

    for (const [stationIndex, stationRaw] of sourceStations.entries()) {
      const stationId = safeString(stationRaw?.id);
      if (!stationId || stationById.has(stationId)) continue;
      const orderRaw = Number(stationRaw?.order);
      const order = Number.isFinite(orderRaw) && orderRaw > 0 ? Math.round(orderRaw) : stationIndex + 1;
      const finished = Boolean(stationRaw?.finished);
      const reviewFlag = Boolean(stationRaw?.flag);
      const state = deduceState(stationRaw?.state, finished, reviewFlag);
      const tasks = asArray(stationRaw?.tasks).map((taskRaw, taskIndex) => {
        const taskId = safeString(taskRaw?.id) || `${stationId}-task-${taskIndex + 1}`;
        return {
          id: taskId,
          label: safeString(taskRaw?.label) || `活動 ${taskIndex + 1}`,
          done: Boolean(taskRaw?.done),
          node: safeString(taskRaw?.node),
          screen: safeString(taskRaw?.screen)
        };
      });
      const missingPrerequisites = asArray(stationRaw?.missingPrerequisites)
        .map(raw => ({
          id: safeString(raw?.id),
          short: safeString(raw?.short) || safeString(raw?.id)
        }))
        .filter(item => item.id && item.short);

      const station = {
        id: stationId,
        order,
        short: safeString(stationRaw?.short) || `站點 ${order}`,
        title: safeString(stationRaw?.title) || safeString(stationRaw?.short) || `站點 ${order}`,
        goal: safeString(stationRaw?.goal),
        section: safeString(stationRaw?.section),
        hideSection: Boolean(stationRaw?.hideSection),
        note: safeString(stationRaw?.note),
        finished,
        flag: reviewFlag,
        state,
        tasks,
        missingPrerequisites
      };
      stations.push(station);
      stationById.set(stationId, station);
      stationToChapter.set(stationId, chapterId);
    }

    const doneCount = sortStations(stations).filter(item => item.state === 'done' || item.finished).length;
    const stationTotal = stations.length;
    const chapterTotalRaw = Number(chapterRaw?.total);
    const chapterDoneRaw = Number(chapterRaw?.done);
    const chapterTotal = Number.isFinite(chapterTotalRaw) && chapterTotalRaw >= 0 ? Math.round(chapterTotalRaw) : stationTotal;
    const chapterDoneCandidate = Number.isFinite(chapterDoneRaw) && chapterDoneRaw >= 0 ? Math.round(chapterDoneRaw) : doneCount;
    const chapterDone = clamp(chapterDoneCandidate, 0, Math.max(chapterTotal, stationTotal));

    const chapter = {
      id: chapterId,
      title: chapterTitle,
      chapters: chapterSubtitle,
      done: chapterDone,
      total: Math.max(chapterTotal, stationTotal),
      stations: sortStations(stations)
    };
    chapters.push(chapter);
    chapterById.set(chapterId, chapter);
  }

  const allStations = chapters.flatMap(chapter => chapter.stations);
  const firstTodo = allStations.find(station => station.state !== 'done')?.id || null;
  const activeId = stationById.has(safeString(model.active)) ? safeString(model.active) : null;
  const currentId = stationById.has(safeString(model.current)) ? safeString(model.current) : firstTodo;
  const resolvedActiveId = activeId || currentId || allStations[0]?.id || null;
  const relations = asArray(model.relations)
    .map(raw => ({
      from: safeString(raw?.from),
      to: safeString(raw?.to),
      type: RELATION_TYPES.has(raw?.type) ? raw.type : 'prerequisite',
      label: safeString(raw?.label),
      role: raw?.role==='support'?'support':'core',
      concept: safeString(raw?.concept),
      conceptCards: asArray(raw?.conceptCards).map(card=>({id:safeString(card?.id),label:safeString(card?.label)})).filter(card=>card.id&&card.label)
    }))
    .filter(rel => rel.from && rel.to && rel.from !== rel.to && stationById.has(rel.from) && stationById.has(rel.to));

  for (const relation of relations) {
    const complete=id=>{const station=stationById.get(id);return station.finished||station.state==='done';};
    relation.available=complete(relation.from)&&(relation.type!=='comparison'||complete(relation.to));
  }

  const summaryDoneRaw = Number(model?.summary?.done);
  const summaryTotalRaw = Number(model?.summary?.total);
  const summaryDone = Number.isFinite(summaryDoneRaw) && summaryDoneRaw >= 0 ? Math.round(summaryDoneRaw) : allStations.filter(item => item.state === 'done' || item.finished).length;
  const summaryTotalCandidate = Number.isFinite(summaryTotalRaw) && summaryTotalRaw >= 0 ? Math.round(summaryTotalRaw) : allStations.length;
  const summaryTotal = Math.max(summaryTotalCandidate, summaryDone);
  const summaryReview = asArray(model?.summary?.review)
    .map(item => ({
      id: safeString(item?.id),
      short: safeString(item?.short)
    }))
    .filter(item => item.id && item.short && stationById.has(item.id));

  return {
    summary: {
      done: summaryDone,
      total: summaryTotal,
      review: summaryReview
    },
    current: currentId,
    active: resolvedActiveId,
    chapters,
    relations,
    chapterById,
    stationById,
    stationToChapter
  };
}

function chapterCenters(count) {
  if (count <= 0) return [];
  if (count === 1) return [{x: SCENE_WIDTH / 2, y: SCENE_HEIGHT / 2}];
  if (count <= 5) {
    const presets = [
      {x: 550, y: 500},
      {x: 1600, y: 500},
      {x: 2650, y: 500},
      {x: 1050, y: 1610},
      {x: 2250, y: 1610}
    ];
    return presets.slice(0, count);
  }

  const centers = [];
  const radiusX = SCENE_WIDTH * 0.32;
  const radiusY = SCENE_HEIGHT * 0.33;
  for (let i = 0; i < count; i += 1) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * i) / count;
    centers.push({
      x: SCENE_WIDTH / 2 + Math.cos(angle) * radiusX,
      y: SCENE_HEIGHT / 2 + Math.sin(angle) * radiusY
    });
  }
  return centers;
}

function buildLayout(normalized) {
  const chapterPosition = new Map();
  const stationPosition = new Map();
  const centers = chapterCenters(normalized.chapters.length);

  normalized.chapters.forEach((chapter, chapterIndex) => {
    const center = centers[chapterIndex] || {x: SCENE_WIDTH / 2, y: SCENE_HEIGHT / 2};
    chapterPosition.set(chapter.id, center);

    const stations = chapter.stations;
    const hasCore=stations.length===7;
    const ringCount=hasCore?stations.length-1:stations.length;
    stations.forEach((station,index)=>{
      if(hasCore&&index===0){stationPosition.set(station.id,{...center});return;}
      const slot=hasCore?index-1:index;
      const angle=-Math.PI/2+slot*Math.PI*2/Math.max(1,ringCount);
      stationPosition.set(station.id,{x:center.x+Math.cos(angle)*360,y:center.y+Math.sin(angle)*300});
    });
  });

  const routeStationIds = normalized.chapters.flatMap(chapter => chapter.stations.map(station => station.id));

  return {
    chapterPosition,
    stationPosition,
    routeStationIds
  };
}

function relationTypeLabel(type) {
  if (type === 'application') return '應用';
  if (type === 'comparison') return '比較';
  return '先備';
}

function stationStateLabel(station, normalized) {
  if (station.id === normalized.active) return '目前位置';
  if (station.id === normalized.current) return '建議下一站';
  return STATUS_TEXT[station.state] || STATUS_TEXT.todo;
}

function progressPercent(done, total) {
  if (total <= 0) return 0;
  return clamp(Math.round(done / total * 100), 0, 100);
}

function relationLineHTML(rel, layout, hidden) {
  const from = layout.stationPosition.get(rel.from);
  const to = layout.stationPosition.get(rel.to);
  if (!from || !to) return '';
  const dashed = rel.type !== 'prerequisite' ? ' cv-line--dashed' : '';
  const hiddenAttr = hidden ? ' hidden' : '';
  const dx=to.x-from.x,dy=to.y-from.y,distance=Math.hypot(dx,dy),gap=Math.min(90,distance*0.4);
  const x1=from.x+dx/distance*gap,y1=from.y+dy/distance*gap;
  const x2=to.x-dx/distance*gap,y2=to.y-dy/distance*gap;
  const arrow=rel.type==='prerequisite'?' marker-end="url(#cv-prerequisite-tip)"':'';
  return `<line class="cv-line cv-line--${escapeHTML(rel.type)}${dashed}" data-rel-type="${escapeHTML(rel.type)}" data-rel-role="${escapeHTML(rel.role)}" data-rel-concept="${escapeHTML(rel.concept)}" data-rel-available="${rel.available?'true':'false'}" data-rel-from="${escapeHTML(rel.from)}" data-rel-to="${escapeHTML(rel.to)}" data-rel-label="${escapeHTML(rel.label)}" x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"${arrow}${hiddenAttr}></line>`;
}

function routeLinesHTML(routeStationIds, layout) {
  const lines = [];
  for (let i = 1; i < routeStationIds.length; i += 1) {
    const from = layout.stationPosition.get(routeStationIds[i - 1]);
    const to = layout.stationPosition.get(routeStationIds[i]);
    if (!from || !to) continue;
    lines.push(
      `<line class="cv-line cv-route-line" data-route-line x1="${from.x.toFixed(2)}" y1="${from.y.toFixed(2)}" x2="${to.x.toFixed(2)}" y2="${to.y.toFixed(2)}"></line>`
    );
  }
  return lines.join('');
}

function starHTML(station, chapterTitle, position, normalized) {
  const statusText = stationStateLabel(station, normalized);
  const isActive = station.id === normalized.active;
  const isCurrent = station.id === normalized.current;
  const isDone = station.finished || station.state === 'done';
  const needReview = station.flag || station.state === 'review';
  const statuses=[...new Set([statusText,isDone?'已完成':'',needReview?'需回看':''].filter(Boolean))];
  const aria = `${station.short}，${chapterTitle}，${statuses.join('，')}`;
  const tags = [
    isActive ? '<span class="cv-tag cv-tag--active">目前</span>' : '',
    isCurrent && !isActive ? '<span class="cv-tag cv-tag--next">下一站</span>' : '',
    isDone ? '<span class="cv-tag cv-tag--done">完成</span>' : '',
    needReview ? '<span class="cv-tag cv-tag--review">回看</span>' : ''
  ].join('');
  return `<button type="button" class="cv-star" data-star="${escapeHTML(station.id)}" data-state="${escapeHTML(station.state)}" data-active="${isActive ? 'true' : 'false'}" data-next="${isCurrent ? 'true' : 'false'}" style="left:${position.x.toFixed(2)}px;top:${position.y.toFixed(2)}px;" aria-label="${escapeHTML(aria)}" aria-pressed="false"><span class="cv-star-core" aria-hidden="true">${escapeHTML(STATUS_ICON[station.state] || STATUS_ICON.todo)}</span><span class="cv-star-caption" data-star-caption aria-hidden="true"><span class="cv-star-order">#${station.order}</span><span class="cv-star-label">${escapeHTML(station.short)}</span><span class="cv-star-status">${escapeHTML(statusText)}</span><span class="cv-star-tags" aria-hidden="true">${tags}</span></span></button>`;
}

function chapterQuickButtonHTML(chapter) {
  const percent = progressPercent(chapter.done, chapter.total);
  return `<button type="button" class="cv-cluster-nav-btn" data-cluster="${escapeHTML(chapter.id)}" aria-pressed="false"><span class="cv-cluster-nav-title">${escapeHTML(chapter.title)}</span><span class="cv-cluster-nav-progress">${chapter.done} / ${chapter.total}</span><span class="cv-cluster-nav-bar" aria-hidden="true"><i style="width:${percent}%;"></i></span></button>`;
}

function chapterPinHTML(chapter, center, index) {
  return `<button type="button" class="cv-cluster-pin cv-galaxy" data-cluster="${escapeHTML(chapter.id)}" data-galaxy="${escapeHTML(chapter.id)}" style="left:${center.x.toFixed(2)}px;top:${center.y.toFixed(2)}px;--galaxy-angle:${index%2?-18:18}deg;--galaxy-hue:${[200,255,175,35,300][index%5]};" aria-label="聚焦星系：${escapeHTML(chapter.title)}"><span class="cv-galaxy-cloud" aria-hidden="true"></span><span class="cv-galaxy-label" data-galaxy-label>${escapeHTML(chapter.title)}</span></button>`;
}

function altStationHTML(station, chapter) {
  return `<button type="button" class="cv-alt-star" data-star-alt="${escapeHTML(station.id)}"><span class="cv-alt-order">#${station.order}</span><span class="cv-alt-name">${escapeHTML(station.short)}</span><span class="cv-alt-chapter">${escapeHTML(chapter.title)}</span></button>`;
}

export function constellationHTML(model = {}) {
  const normalized = normalizeModel(model);
  const layout = buildLayout(normalized);
  const chapters = normalized.chapters;
  const stations = chapters.flatMap(chapter => chapter.stations.map(station => ({station, chapter})));

  const relationLines = normalized.relations.map(rel => relationLineHTML(rel, layout, !rel.available)).join('');
  const routeLines = routeLinesHTML(layout.routeStationIds, layout);
  const stars = stations.map(({station, chapter}) => {
    const position = layout.stationPosition.get(station.id);
    if (!position) return '';
    return starHTML(station, chapter.title, position, normalized);
  }).join('');
  const chapterPins = chapters.map((chapter,index) => chapterPinHTML(chapter, layout.chapterPosition.get(chapter.id) || {x: SCENE_WIDTH / 2, y: SCENE_HEIGHT / 2},index)).join('');
  const chapterNav = chapters.map(chapterQuickButtonHTML).join('');
  const altList = chapters.map(chapter => chapter.stations.map(station => altStationHTML(station, chapter)).join('')).join('');
  const reviewQuick = normalized.summary.review.map(item => (
    `<button type="button" class="cv-review-chip" data-star-alt="${escapeHTML(item.id)}">${escapeHTML(item.short)}</button>`
  )).join('');

  return `<section class="constellation-view" data-constellation-view data-panel-selected="false" data-route-visible="false" data-star-interactive="true"><header class="cv-head" aria-label="星圖摘要"><div class="cv-progress"><p>已完成 <strong>${normalized.summary.done} / ${normalized.summary.total}</strong></p><small>${normalized.current ? `下一站：${escapeHTML(normalized.stationById.get(normalized.current)?.short || normalized.current)}` : '概念站點已完成；最後必修機構複習另列。'}</small></div><div class="cv-review">${reviewQuick || '<span class="cv-review-empty">目前沒有需回看的站點</span>'}</div></header><div class="cv-toolbar"><div class="cv-toolbar-row"><button type="button" class="cv-control" data-star-overview>回全圖</button><button type="button" class="cv-control" data-star-current>定位目前站</button><button type="button" class="cv-control" data-route-toggle aria-pressed="false">顯示建議路線</button></div><div class="cv-toolbar-row"><button type="button" class="cv-control cv-control--icon" data-star-zoom="in" aria-label="放大">＋</button><button type="button" class="cv-control cv-control--icon" data-star-zoom="out" aria-label="縮小">－</button><button type="button" class="cv-control cv-control--icon" data-star-pan="up" aria-label="向上平移">↑</button><button type="button" class="cv-control cv-control--icon" data-star-pan="down" aria-label="向下平移">↓</button><button type="button" class="cv-control cv-control--icon" data-star-pan="left" aria-label="向左平移">←</button><button type="button" class="cv-control cv-control--icon" data-star-pan="right" aria-label="向右平移">→</button></div><nav class="cv-cluster-nav" aria-label="章節聚焦">${chapterNav}</nav></div><p class="cv-legend"><span>實線箭頭：核心底層</span><span>虛線箭頭：輔助理解</span><span>金色虛線：建議順序</span><span>點選預覽相關連線；完成後保留，移入可凸顯</span></p><div class="cv-layout"><div class="cv-map-wrap"><div class="cv-mobile-hint" data-mobile-hint hidden>點選一片星群放大，再選星點；也可以用下方清單找到各站。</div><div class="cv-map" data-star-canvas tabindex="0" role="application" aria-label="有機星圖"><div class="cv-sky-ambient" data-sky-ambient aria-hidden="true"><span class="cv-ambient-nebula"></span><span class="cv-ambient-stars"></span></div><div class="cv-scene" data-scene><svg class="cv-svg" viewBox="0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}" width="${SCENE_WIDTH}" height="${SCENE_HEIGHT}" aria-hidden="true"><defs><marker id="cv-prerequisite-tip" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10" fill="#89a7cb"/></marker></defs><g class="cv-lines cv-lines--base">${relationLines}</g><g class="cv-lines cv-lines--route">${routeLines}</g></svg><div class="cv-clusters">${chapterPins}</div><div class="cv-stars">${stars}</div></div></div><details class="cv-alt-panel"><summary>所有站點清單</summary><div class="cv-alt-list">${altList}</div></details></div><aside class="cv-preview" data-star-preview data-open="false" aria-live="polite" aria-hidden="true"><div class="cv-preview-head"><h2>站點預覽</h2><button type="button" class="cv-control cv-control--ghost" data-panel-toggle aria-expanded="false" hidden>展開</button><button type="button" class="cv-control cv-control--ghost" data-star-close>收合</button></div><p class="cv-preview-empty" data-preview-empty>請先選擇星點，預覽內容後即可開始學習。</p><div class="cv-preview-body" data-preview-body></div></aside></div></section>`;
}

function findHost(root) {
  if (!root || typeof root.querySelector !== 'function') {
    throw new TypeError('mountConstellation 需要可查詢的根節點');
  }
  if (root.matches?.('[data-constellation-view]')) return root;
  const host = root.querySelector('[data-constellation-view]');
  if (!host) throw new TypeError('mountConstellation 找不到 data-constellation-view');
  return host;
}

function safeInvokeLoad(loadViewport) {
  if (typeof loadViewport !== 'function') return null;
  try {
    return loadViewport();
  } catch {
    return null;
  }
}

function sanitizePersisted(raw, normalized) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      camera: null,
      selectedStation: null,
      routeVisible: false,
      panelOpen: false,
      visited: false
    };
  }

  const selectedStation = safeString(raw.selectedStation);
  const selected = selectedStation && normalized.stationById.has(selectedStation) ? selectedStation : null;
  const routeVisible = raw.version===2 && raw.routeVisible===true;
  const panelOpen = typeof raw.panelOpen === 'boolean' ? raw.panelOpen : false;
  const visited = typeof raw.visited === 'boolean' ? raw.visited : true;

  let camera = null;
  if (raw.version===2 && raw.camera && typeof raw.camera === 'object' && !Array.isArray(raw.camera)) {
    const x = finiteNumber(Number(raw.camera.x));
    const y = finiteNumber(Number(raw.camera.y));
    const scale = finiteNumber(Number(raw.camera.scale));
    const focusedChapter = safeString(raw.camera.focusedChapter);
    const chapterOk = focusedChapter && normalized.chapterById.has(focusedChapter) ? focusedChapter : null;
    if (
      x !== null && y !== null && scale !== null &&
      Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(scale) &&
      Math.abs(x) <= MAX_SAFE_PAN && Math.abs(y) <= MAX_SAFE_PAN &&
      scale >= MIN_ZOOM && scale <= MAX_ZOOM
    ) {
      camera = {x, y, scale, focusedChapter: chapterOk};
    }
  }

  return {
    camera,
    selectedStation: selected,
    routeVisible,
    panelOpen: selected ? panelOpen : false,
    visited
  };
}

function cameraBounds(scale, width, height) {
  const scaledWidth = SCENE_WIDTH * scale;
  const scaledHeight = SCENE_HEIGHT * scale;
  const limitX = Math.max(0, (scaledWidth - width) / 2) + 120;
  const limitY = Math.max(0, (scaledHeight - height) / 2) + 120;
  return {limitX, limitY};
}

function clampCamera(camera, width, height, normalized) {
  const scale = clamp(Number.isFinite(camera.scale) ? camera.scale : 1, MIN_ZOOM, MAX_ZOOM);
  const x = Number.isFinite(camera.x) ? camera.x : 0;
  const y = Number.isFinite(camera.y) ? camera.y : 0;
  const {limitX, limitY} = cameraBounds(scale, width, height);
  const focusedChapter = camera.focusedChapter && normalized.chapterById.has(camera.focusedChapter) ? camera.focusedChapter : null;
  return {
    x: clamp(x, -limitX, limitX),
    y: clamp(y, -limitY, limitY),
    scale,
    focusedChapter
  };
}

function overviewCamera(width, height) {
  const fitScale = Math.min(width / SCENE_WIDTH, height / SCENE_HEIGHT) * 0.94;
  return {
    x: 0,
    y: 0,
    scale: clamp(fitScale, MIN_ZOOM, 1.1),
    focusedChapter: null
  };
}

function chapterCamera(chapterId, layout, scale) {
  const center = layout.chapterPosition.get(chapterId);
  if (!center) {
    return {x: 0, y: 0, scale, focusedChapter: null};
  }
  return {
    x: -(center.x - SCENE_WIDTH / 2) * scale,
    y: -(center.y - SCENE_HEIGHT / 2) * scale,
    scale,
    focusedChapter: chapterId
  };
}

function relationExplanationHTML(station, normalized, related) {
  const stationLink=(id,label)=>`<button type="button" class="cv-related-star" data-star-alt="${escapeHTML(id)}">${escapeHTML(label||normalized.stationById.get(id)?.short||id)}</button>`;
  const conceptLink=rel=>{
    const source=normalized.stationById.get(rel.from)?.short||rel.from;
    return stationLink(rel.from,rel.concept||source)+(rel.concept&&rel.concept!==source?`<span class="cv-concept-source">（${escapeHTML(source)}）</span>`:'');
  };
  const status=rel=>`<small class="cv-relation-status">${rel.available?'已建立連線':'點選預覽連線'}</small>`;
  const readings=rel=>rel.conceptCards.length?`<div class="cv-concept-readings"><span>閱讀對應概念：</span>${rel.conceptCards.map(card=>`<button type="button" class="cv-related-star" data-review="${escapeHTML(card.id)}">${escapeHTML(card.label)}</button>`).join('')}</div>`:'';
  const incoming=related.filter(rel=>rel.type==='prerequisite'&&rel.to===station.id);
  const outgoing=related.filter(rel=>rel.type==='prerequisite'&&rel.from===station.id);
  const core=incoming.filter(rel=>rel.role==='core'),support=incoming.filter(rel=>rel.role==='support');
  const foundationList=(relations,role)=>`<section class="cv-relation-role" data-relation-role="${role}"><h6>${role==='core'?'核心底層概念':'輔助理解概念'}</h6><ul>${relations.map(rel=>`<li data-foundation-from="${escapeHTML(rel.from)}">${conceptLink(rel)}<p>${escapeHTML(rel.label)}</p>${readings(rel)}${status(rel)}</li>`).join('')}</ul></section>`;
  const foundations=`<details class="cv-relation-section cv-relation-disclosure" data-relation-section="foundations"><summary><span>理解本節的基礎</span><small>${core.length} 核心 · ${support.length} 輔助</small></summary><div data-relation-content>${core.length?foundationList(core,'core'):'<p class="cv-relation-empty">本節從基本概念開始，沒有另列其他核心底層概念。</p>'}${support.length?foundationList(support,'support'):''}<p class="cv-relation-note">核心指理解時會用到的概念，不要求先完成整個來源小節；輔助概念用來補充理解。</p></div></details>`;
  const extensions=outgoing.length?`<ul>${outgoing.map(rel=>{
    const target=normalized.stationById.get(rel.to);
    const other=normalized.relations.filter(item=>item.type==='prerequisite'&&item.to===rel.to&&item.from!==station.id);
    const partners=other.filter(item=>item.role==='core'),helpers=other.filter(item=>item.role==='support');
    const combination=partners.length?`搭配${partners.map(conceptLink).join('、')}，可更容易理解「${escapeHTML(target.short)}」。`:`運用本節的${escapeHTML(rel.concept||station.short)}，可支援「${escapeHTML(target.short)}」的理解。`;
    return `<li data-upper-station="${escapeHTML(rel.to)}">${stationLink(rel.to)}<span class="cv-contribution-role">${rel.role==='core'?'本節提供核心基礎':'本節提供輔助理解'}</span><p>${escapeHTML(rel.label)}</p><p class="cv-concept-combination">${combination}</p>${target.goal?`<p class="cv-relation-goal">理解目標：${escapeHTML(target.goal)}</p>`:''}${helpers.length?`<p class="cv-relation-note">也可搭配${helpers.map(conceptLink).join('、')}補充理解。這不要求先讀完整個來源小節，但實際題目仍須檢查適用的結構與條件。</p>`:''}${status(rel)}</li>`;
  }).join('')}</ul>`:'<p class="cv-relation-empty">目前沒有另列直接由本節支援的上層概念。</p>';
  const extensionsSection=`<details class="cv-relation-section cv-relation-disclosure" data-relation-section="extensions"><summary><span>搭配後可理解的上層概念</span><small>${outgoing.length} 個</small></summary><div data-relation-content>${extensions}</div></details>`;
  const uses=related.filter(rel=>rel.type!=='prerequisite');
  const usesSection=`<section class="cv-relation-section" data-relation-section="uses"><h5>應用與比較</h5>${uses.length?`<ul>${uses.map(rel=>{
    const other=rel.from===station.id?rel.to:rel.from;
    const direction=rel.type==='comparison'?'比較：共同點與差異':rel.from===station.id?'本節可應用於':'這個應用會用到';
    return `<li data-relation-use="${escapeHTML(rel.type)}"><strong>${direction}</strong> ${stationLink(other)}<p>${escapeHTML(rel.label)}</p>${status(rel)}</li>`;
  }).join('')}</ul>`:'<p class="cv-relation-empty">目前沒有另列直接的應用或比較關係。</p>'}<p class="cv-relation-note">比較用來辨認共同點與差異，不代表其中一節必須先學。</p></section>`;
  return `<div class="cv-related" data-relation-station="${escapeHTML(station.id)}"><h4>關聯說明</h4>${foundations}${extensionsSection}${usesSection}</div>`;
}

function previewHTML(station, chapter, normalized, relatedRelations) {
  const badges = [];
  const isActive = station.id === normalized.active;
  const isCurrent = station.id === normalized.current;
  const completed = station.finished || station.state === 'done';
  const needReview = station.flag || station.state === 'review';
  if (isActive) badges.push('<span class="cv-preview-badge cv-preview-badge--active">目前位置</span>');
  if (isCurrent && !isActive) badges.push('<span class="cv-preview-badge cv-preview-badge--next">建議下一站</span>');
  if (completed) badges.push('<span class="cv-preview-badge cv-preview-badge--done">整站已完成</span>');
  if (needReview) badges.push('<span class="cv-preview-badge cv-preview-badge--review">需回看</span>');

  const missingText = station.missingPrerequisites.length
    ? `<div class="cv-missing"><strong>先備提醒：核心概念待補</strong><ul>${station.missingPrerequisites.map(item => `<li>${escapeHTML(item.short)}</li>`).join('')}</ul><p>仍可先開始本節，再依需要補齊這些核心概念。</p></div>`
    : '';

  const relationText = relationExplanationHTML(station, normalized, relatedRelations);

  const tasks = station.tasks.length
    ? `<ul class="cv-task-list">${station.tasks.map(task => `<li><button type="button" class="cv-task-go" data-task-go="${escapeHTML(station.id)}" data-task-id="${escapeHTML(task.id)}" data-done="${task.done ? 'true' : 'false'}"><span class="cv-task-check" aria-hidden="true">${task.done ? '☑' : '☐'}</span><span class="cv-task-label">${escapeHTML(task.label)}</span></button></li>`).join('')}</ul>`
    : '<p class="cv-task-empty">本站沒有待辦活動。</p>';

  const actionLabel = completed ? '再學一次' : station.tasks.some(task => task.done) ? '繼續學習' : '開始學習';
  const chapterText = chapter?.title ? `<p class="cv-preview-chapter">${escapeHTML(chapter.title)}</p>` : '';
  const sectionText = station.hideSection || !station.section ? '' : `<p class="cv-preview-section">${escapeHTML(station.section)}</p>`;
  const noteText = station.note ? `<p class="cv-preview-note">${escapeHTML(station.note)}</p>` : '';
  const goalText = station.goal ? `<p class="cv-preview-goal">${escapeHTML(station.goal)}</p>` : '<p class="cv-preview-goal">尚未提供本站學習目標。</p>';

  return `<article class="cv-preview-card"><header><h3>${escapeHTML(station.title)}</h3>${chapterText}${sectionText}<p class="cv-preview-inline">${badges.join('')}</p></header>${goalText}${noteText}${relationText}${missingText}<section><h4>待辦活動</h4>${tasks}</section><button type="button" class="cv-start primary" data-station-go="${escapeHTML(station.id)}">${actionLabel}</button></article>`;
}

export function mountConstellation(root, model, options = {}) {
  const host = findHost(root);
  const normalized = normalizeModel(model);
  const layout = buildLayout(normalized);
  const canvas = host.querySelector('[data-star-canvas]');
  const scene = host.querySelector('[data-scene]');
  const preview = host.querySelector('[data-star-preview]');
  const previewBody = host.querySelector('[data-preview-body]');
  const previewEmpty = host.querySelector('[data-preview-empty]');
  const panelToggle = host.querySelector('[data-panel-toggle]');
  const mobileHint = host.querySelector('[data-mobile-hint]');

  if (!canvas || !scene || !preview || !previewBody || !previewEmpty) {
    throw new TypeError('mountConstellation 缺少必要 DOM 節點');
  }

  const saveViewport = typeof options.saveViewport === 'function' ? options.saveViewport : null;
  const notify = typeof options.onNotice === 'function' ? options.onNotice : null;
  const persisted = sanitizePersisted(safeInvokeLoad(options.loadViewport), normalized);
  const mapStars = [...host.querySelectorAll('.cv-star[data-star]')];
  const altStars = [...host.querySelectorAll('[data-star-alt]')];
  const clusterButtons = [...host.querySelectorAll('[data-cluster]')];
  const routeLines = [...host.querySelectorAll('[data-route-line]')];
  const relationLines = [...host.querySelectorAll('[data-rel-type]')];
  const routeToggle = host.querySelector('[data-route-toggle]');

  const state = {
    camera: {x: 0, y: 0, scale: 1, focusedChapter: null},
    selectedStationId: persisted.selectedStation,
    selectedChapterId: null, hoveredStarId:null, focusedStarId:null,
    routeVisible: persisted.routeVisible,
    panelOpen: persisted.panelOpen && Boolean(persisted.selectedStation),
    viewportWidth: 1,
    viewportHeight: 1,
    rafId: 0
  };

  const pointerState = {
    points: new Map(),
    pinch: null,
    dragId: null, start:null, dragging:false, suppressClick:false
  };

  function callNotice(text) {
    if (!notify || !text) return;
    try {
      notify(text);
    } catch {
      // no-op
    }
  }

  function saveState() {
    if (!saveViewport) return;
    const payload = {
      version: 2,
      visited: true,
      camera: {
        x: Number(state.camera.x.toFixed(4)),
        y: Number(state.camera.y.toFixed(4)),
        scale: Number(state.camera.scale.toFixed(5)),
        focusedChapter: state.camera.focusedChapter || null
      },
      selectedStation: state.selectedStationId || null,
      routeVisible: Boolean(state.routeVisible),
      panelOpen: Boolean(state.panelOpen)
    };
    try {
      saveViewport(payload);
    } catch {
      // no-op
    }
  }

  function updateMapInteractiveState() {
    host.dataset.starInteractive='true';
    if(mobileHint)mobileHint.hidden=true;
    for(const star of mapStars){star.removeAttribute('aria-disabled');star.tabIndex=0;}
    for(const pin of host.querySelectorAll('.cv-cluster-pin'))pin.tabIndex=0;
  }

  function applyCamera(nextCamera, save = true) {
    const clamped = clampCamera(nextCamera, state.viewportWidth, state.viewportHeight, normalized);
    state.camera = clamped;
    host.dataset.overview = !clamped.focusedChapter && clamped.scale < 0.65 ? 'true' : 'false';
    // Overview dots and expanded labels have different bounds; lines must meet the visible nodes.
    for (const line of relationLines) {
      const from=layout.stationPosition.get(line.dataset.relFrom),to=layout.stationPosition.get(line.dataset.relTo);
      if(!from||!to)continue;
      const dx=to.x-from.x,dy=to.y-from.y,distance=Math.hypot(dx,dy);
      const gap=12/clamped.scale;
      line.setAttribute('x1',String(from.x+dx/distance*gap));line.setAttribute('y1',String(from.y+dy/distance*gap));
      line.setAttribute('x2',String(to.x-dx/distance*gap));line.setAttribute('y2',String(to.y-dy/distance*gap));
    }
    scene.style.transform = `translate(-50%, -50%) translate(${clamped.x}px, ${clamped.y}px) scale(${clamped.scale})`;
    host.style.setProperty('--cv-scale', String(clamped.scale));
    scene.style.width=SCENE_WIDTH+'px';scene.style.height=SCENE_HEIGHT+'px';
    updateMapInteractiveState();
    updateClusterButtons();
    if (save) saveState();
  }

  function panBy(deltaX, deltaY, save = true) {
    applyCamera({
      ...state.camera,
      x: state.camera.x + deltaX,
      y: state.camera.y + deltaY
    }, save);
  }

  function zoomTo(nextScale, clientX, clientY, save = true) {
    const rect = canvas.getBoundingClientRect();
    const anchorX = typeof clientX === 'number' ? clientX - rect.left - rect.width / 2 : 0;
    const anchorY = typeof clientY === 'number' ? clientY - rect.top - rect.height / 2 : 0;
    const scale = clamp(nextScale, MIN_ZOOM, MAX_ZOOM);
    const worldX = (anchorX - state.camera.x) / state.camera.scale;
    const worldY = (anchorY - state.camera.y) / state.camera.scale;
    const x = anchorX - worldX * scale;
    const y = anchorY - worldY * scale;
    applyCamera({
      ...state.camera,
      x,
      y,
      scale,
      focusedChapter: state.camera.focusedChapter
    }, save);
  }

  function focusOverview(save = true) {
    applyCamera(overviewCamera(state.viewportWidth, state.viewportHeight), save);
  }

  function focusChapter(chapterId, save = true) {
    if (!normalized.chapterById.has(chapterId)) return;
    resize();
    state.selectedChapterId=chapterId;
    const scale=clamp(Math.min(state.viewportWidth/1020,state.viewportHeight/880)*.92,MIN_ZOOM,1.05);
    applyCamera(chapterCamera(chapterId, layout, scale), save);
  }

  function focusCurrent(save = true) {
    const currentStationId = normalized.active || normalized.current;
    if (!currentStationId || !normalized.stationToChapter.has(currentStationId)) {
      focusOverview(save);
      return;
    }
    const chapterId = normalized.stationToChapter.get(currentStationId);
    const scale=clamp(Math.min(state.viewportWidth/1020,state.viewportHeight/880)*.92,MIN_ZOOM,1.05);
    const target = chapterCamera(chapterId, layout, scale);
    applyCamera(target, save);
    selectStation(currentStationId, {openPanel: true, save});
  }

  function updateRouteVisibility() {
    host.dataset.routeVisible = state.routeVisible ? 'true' : 'false';
    for (const line of routeLines) {
      line.hidden = !state.routeVisible;
      line.toggleAttribute('hidden',!state.routeVisible);
    }
    if (routeToggle) {
      routeToggle.setAttribute('aria-pressed', state.routeVisible ? 'true' : 'false');
      routeToggle.textContent = state.routeVisible?'隱藏建議路線':'顯示建議路線';
    }
  }

  function updateClusterButtons() {
    for (const button of clusterButtons) {
      const id = button.dataset.cluster || '';
      button.setAttribute('aria-pressed', state.camera.focusedChapter === id ? 'true' : 'false');
      button.dataset.labelSelected=state.selectedChapterId===id?'true':'false';
    }
  }

  function updateStarSelection() {
    for (const star of mapStars) {
      const selected = star.dataset.star === state.selectedStationId;
      star.setAttribute('aria-pressed', selected ? 'true' : 'false');
      star.dataset.selected = selected ? 'true' : 'false';
    }
    for (const star of altStars) {
      const selected = star.dataset.starAlt === state.selectedStationId;
      star.setAttribute('aria-pressed', selected ? 'true' : 'false');
    }
  }

  function updateRelationVisibility() {
    const focus=state.hoveredStarId||state.focusedStarId||state.selectedStationId;
    for(const line of relationLines){
      const available=line.dataset.relAvailable==='true';
      const selected=Boolean(state.selectedStationId&&(line.dataset.relFrom===state.selectedStationId||line.dataset.relTo===state.selectedStationId));
      const linked=selected||Boolean(focus&&(line.dataset.relFrom===focus||line.dataset.relTo===focus));
      const preview=!available&&selected;
      const visible=available||preview;
      line.hidden=!visible;
      line.toggleAttribute('hidden',!visible);
      line.dataset.relPreview=preview?'true':'false';
      line.dataset.linked=visible&&linked?'true':'false';
      line.dataset.dimmed=available&&focus&&!linked?'true':'false';
    }
  }

  function positionCaption(star){
    if(!star)return;
    const rect=canvas.getBoundingClientRect(),point=star.getBoundingClientRect();
    star.dataset.labelSide=rect.right-point.right<205?'left':'right';
  }

  function clearSelection(){
    state.selectedStationId=null;state.selectedChapterId=null;state.hoveredStarId=null;state.focusedStarId=null;
    updateStarSelection();updateClusterButtons();updateRelationVisibility();renderPreview();saveState();
  }

  function onHover(event){
    const star=event.target.closest?.('[data-star]');
    if(!star||!canvas.contains(star))return;
    if(event.type==='pointerover'||event.type==='focusin'){
      if(event.type==='pointerover')state.hoveredStarId=star.dataset.star;
      else state.focusedStarId=star.dataset.star;
      positionCaption(star);
    }else if(!star.contains(event.relatedTarget)){
      if(event.type==='pointerout')state.hoveredStarId=null;
      else state.focusedStarId=null;
    }
    updateRelationVisibility();
  }

  function setPanelOpen(open, save = true) {
    const canOpen = Boolean(state.selectedStationId);
    state.panelOpen = Boolean(open && canOpen);
    preview.dataset.open = state.panelOpen ? 'true' : 'false';
    preview.setAttribute('aria-hidden', canOpen ? 'false' : 'true');
    host.dataset.panelSelected = state.panelOpen ? 'true' : 'false';
    previewBody.hidden = !state.panelOpen;
    const close = preview.querySelector('[data-star-close]');
    if (close) close.hidden = !state.panelOpen;
    if (panelToggle) {
      panelToggle.hidden = !state.selectedStationId || state.panelOpen;
      panelToggle.setAttribute('aria-expanded', state.panelOpen ? 'true' : 'false');
      panelToggle.textContent = state.panelOpen ? '收合' : '展開';
      if (!state.panelOpen && preview.contains(host.ownerDocument.activeElement)) panelToggle.focus({preventScroll:true});
    }
    if (save) saveState();
  }

  function relatedRelations(stationId) {
    return normalized.relations.filter(rel => rel.from === stationId || rel.to === stationId);
  }

  function renderPreview() {
    const stationId = state.selectedStationId;
    if (!stationId || !normalized.stationById.has(stationId)) {
      previewBody.innerHTML = '';
      previewEmpty.hidden = false;
      setPanelOpen(false, false);
      return;
    }
    const station = normalized.stationById.get(stationId);
    const chapterId = normalized.stationToChapter.get(stationId);
    const chapter = chapterId ? normalized.chapterById.get(chapterId) : null;
    previewBody.innerHTML = previewHTML(station, chapter, normalized, relatedRelations(stationId));
    previewBody.scrollTop = 0;
    previewEmpty.hidden = true;
    if (station.missingPrerequisites.length) {
      callNotice(`提醒：${station.short} 尚有 ${station.missingPrerequisites.length} 項先備可補齊，但可先開始。`);
    }
  }

  function ensureSelectedVisible() {
    if (!state.panelOpen || !state.selectedStationId) return;
    const star = mapStars.find(node => node.dataset.star === state.selectedStationId);
    if (!star) return;
    const rect = canvas.getBoundingClientRect(), point = star.getBoundingClientRect();
    const compact = host.ownerDocument.defaultView.matchMedia('(max-width: 900px)').matches;
    const bottom = compact ? Math.min(rect.bottom, preview.getBoundingClientRect().top) : rect.bottom;
    const safe = {left:rect.left+12, right:rect.right-12, top:rect.top+12, bottom:bottom-12};
    const dx = point.left < safe.left || point.right > safe.right ? (safe.left+safe.right-point.left-point.right)/2 : 0;
    const dy = point.top < safe.top || point.bottom > safe.bottom ? (safe.top+safe.bottom-point.top-point.bottom)/2 : 0;
    if (dx || dy) panBy(dx, dy, true);
  }

  function selectStation(stationId, {openPanel = true, save = true} = {}) {
    if (!normalized.stationById.has(stationId)) return;
    state.selectedStationId = stationId;state.selectedChapterId=null;
    positionCaption(mapStars.find(star=>star.dataset.star===stationId));updateClusterButtons();
    updateStarSelection();
    updateRelationVisibility();
    renderPreview();
    if (openPanel) setPanelOpen(true, false);
    if (save) saveState();
    if (state.rafId) {
      const win = host.ownerDocument?.defaultView;
      if (win?.cancelAnimationFrame) win.cancelAnimationFrame(state.rafId);
      state.rafId = 0;
    }
    const win = host.ownerDocument?.defaultView;
    if (win?.requestAnimationFrame) {
      state.rafId = win.requestAnimationFrame(() => {
        state.rafId = 0;
        ensureSelectedVisible();
      });
    } else {
      ensureSelectedVisible();
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    state.viewportWidth = Math.max(1, rect.width || canvas.clientWidth || 1);
    state.viewportHeight = Math.max(1, rect.height || canvas.clientHeight || 1);
    applyCamera(state.camera, false);
  }

  function onClick(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if(pointerState.suppressClick&&canvas.contains(target)){pointerState.suppressClick=false;return;}

    const stationGo = target.closest('[data-station-go]');
    if (stationGo) {
      const stationId = stationGo.getAttribute('data-station-go') || '';
      const station = normalized.stationById.get(stationId);
      if (station && station.missingPrerequisites.length) {
        callNotice(`提示：${station.short} 尚有先備可補齊，仍可先開始。`);
      }
      return;
    }

    const taskGo = target.closest('[data-task-go]');
    if (taskGo) return;

    const routeToggleButton = target.closest('[data-route-toggle]');
    if (routeToggleButton) {
      state.routeVisible = !state.routeVisible;
      updateRouteVisibility();
      saveState();
      return;
    }

    const closeButton = target.closest('[data-star-close]');
    if (closeButton) {
      clearSelection();
      return;
    }

    const panelToggleButton = target.closest('[data-panel-toggle]');
    if (panelToggleButton) {
      setPanelOpen(!state.panelOpen, true);
      return;
    }

    const overviewButton = target.closest('[data-star-overview]');
    if (overviewButton) {
      focusOverview(true);
      return;
    }

    const currentButton = target.closest('[data-star-current]');
    if (currentButton) {
      focusCurrent(true);
      return;
    }

    const zoomButton = target.closest('[data-star-zoom]');
    if (zoomButton) {
      const dir = zoomButton.getAttribute('data-star-zoom');
      const factor = dir === 'in' ? 1.18 : 1 / 1.18;
      zoomTo(state.camera.scale * factor, undefined, undefined, true);
      return;
    }

    const panButton = target.closest('[data-star-pan]');
    if (panButton) {
      const dir = panButton.getAttribute('data-star-pan');
      if (dir === 'up') panBy(0, 56, true);
      if (dir === 'down') panBy(0, -56, true);
      if (dir === 'left') panBy(56, 0, true);
      if (dir === 'right') panBy(-56, 0, true);
      return;
    }

    const chapterButton = target.closest('[data-cluster]');
    if (chapterButton) {
      const chapterId = chapterButton.getAttribute('data-cluster') || '';
      if(chapterButton.classList.contains('cv-galaxy')&&state.selectedStationId&&normalized.stationToChapter.get(state.selectedStationId)===chapterId){clearSelection();return;}
      if (normalized.chapterById.has(chapterId)) {
        if(state.selectedStationId)clearSelection();
        focusChapter(chapterId, true);
      }
      return;
    }

    const starButton = target.closest('[data-star]');
    if (starButton) {
      const isDisabled = starButton.getAttribute('aria-disabled') === 'true';
      if (isDisabled) {
        callNotice('請先聚焦章節或放大星圖，再直接點選星點。');
        return;
      }
      const stationId = starButton.getAttribute('data-star') || '';
      selectStation(stationId, {openPanel: true, save: true});
      return;
    }

    const altButton = target.closest('[data-star-alt]');
    if (altButton) {
      const stationId = altButton.getAttribute('data-star-alt') || '';
      const chapterId = normalized.stationToChapter.get(stationId);
      if (chapterId) focusChapter(chapterId, false);
      selectStation(stationId, {openPanel: true, save: true});
      mapStars.find(star => star.dataset.star === stationId)?.focus({preventScroll: true});
      return;
    }
    if(canvas.contains(target))clearSelection();
  }

  function onWheel(event) {
    event.preventDefault();
    const factor = Math.exp(-event.deltaY * 0.0016);
    zoomTo(state.camera.scale * factor, event.clientX, event.clientY, true);
  }

  function onPointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const target = event.target;
    if(target instanceof Element && target.closest('a,input,textarea,select'))return;
    pointerState.suppressClick=false;
    pointerState.points.set(event.pointerId, {x: event.clientX, y: event.clientY});
    if (pointerState.points.size === 1) {
      pointerState.dragId = event.pointerId;pointerState.start={x:event.clientX,y:event.clientY};pointerState.dragging=false;
      pointerState.pinch = null;
    } else if (pointerState.points.size >= 2) {
      pointerState.dragging=true;canvas.setPointerCapture?.(event.pointerId);
      const points = [...pointerState.points.values()].slice(0, 2);
      const dx = points[0].x - points[1].x;
      const dy = points[0].y - points[1].y;
      pointerState.pinch = {
        distance: Math.hypot(dx, dy) || 1,
        midX: (points[0].x + points[1].x) / 2,
        midY: (points[0].y + points[1].y) / 2
      };
      pointerState.dragId = null;
    }
  }

  function onPointerMove(event) {
    if (!pointerState.points.has(event.pointerId)) return;
    const previous = pointerState.points.get(event.pointerId);
    pointerState.points.set(event.pointerId, {x: event.clientX, y: event.clientY});

    if (pointerState.points.size === 1 && pointerState.dragId === event.pointerId && previous) {
      if(!pointerState.dragging&&Math.hypot(event.clientX-pointerState.start.x,event.clientY-pointerState.start.y)<5)return;
      pointerState.dragging=true;canvas.setPointerCapture?.(event.pointerId);
      const dx = event.clientX - previous.x;
      const dy = event.clientY - previous.y;
      panBy(dx, dy, true);
      return;
    }

    if (pointerState.points.size >= 2) {
      const points = [...pointerState.points.values()].slice(0, 2);
      const dx = points[0].x - points[1].x;
      const dy = points[0].y - points[1].y;
      const distance = Math.hypot(dx, dy) || 1;
      const midX = (points[0].x + points[1].x) / 2;
      const midY = (points[0].y + points[1].y) / 2;
      const prev = pointerState.pinch;
      if (prev) {
        const ratio = distance / prev.distance;
        zoomTo(state.camera.scale * ratio, midX, midY, false);
        panBy(midX - prev.midX, midY - prev.midY, false);
        saveState();
      }
      pointerState.pinch = {distance, midX, midY};
    }
  }

  function onPointerEnd(event) {
    if(pointerState.dragging)pointerState.suppressClick=true;
    pointerState.points.delete(event.pointerId);
    if (pointerState.points.size < 2) pointerState.pinch = null;
    if (!pointerState.points.has(pointerState.dragId)) pointerState.dragId = null;
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') {
      const focused=host.ownerDocument.activeElement;
      clearSelection();if(preview.contains(focused))canvas.focus({preventScroll:true});
      return;
    }
    if (event.target instanceof Element && event.target.closest('[data-station-go],[data-task-go]')) return;
    if (event.target instanceof Element && event.target.closest('.cv-preview,.cv-alt-panel')) return;
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      panBy(0, 44, true);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      panBy(0, -44, true);
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      panBy(44, 0, true);
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      panBy(-44, 0, true);
      return;
    }
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      zoomTo(state.camera.scale * 1.16, undefined, undefined, true);
      return;
    }
    if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      zoomTo(state.camera.scale / 1.16, undefined, undefined, true);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      focusOverview(true);
    }
  }

  const resizeObserver = typeof ResizeObserver === 'function'
    ? new ResizeObserver(() => resize())
    : null;
  const win = host.ownerDocument?.defaultView;
  const onWindowResize = () => resize();

  host.addEventListener('click', onClick);
  host.addEventListener('keydown', onKeyDown);
  for(const type of ['pointerover','pointerout','focusin','focusout'])host.addEventListener(type,onHover);
  canvas.addEventListener('wheel', onWheel, {passive: false});
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerEnd);
  canvas.addEventListener('pointercancel', onPointerEnd);
  if (win) win.addEventListener('resize', onWindowResize);
  if (resizeObserver) resizeObserver.observe(canvas);

  resize();
  updateRouteVisibility();
  updateRelationVisibility();
  updateStarSelection();

  const hasSavedCamera = Boolean(persisted.camera);
  if (options.returning && hasSavedCamera) {
    applyCamera(persisted.camera, false);
  } else if (!persisted.visited) {
    focusOverview(false);
  } else {
    const focusStationId = normalized.active || normalized.current;
    const chapterId = focusStationId ? normalized.stationToChapter.get(focusStationId) : null;
    if (chapterId) {
      focusChapter(chapterId, false);
    } else {
      focusOverview(false);
    }
  }

  if (persisted.selectedStation && normalized.stationById.has(persisted.selectedStation)) {
    selectStation(persisted.selectedStation, {openPanel: persisted.panelOpen, save: false});
  } else {
    renderPreview();
  }

  saveState();

  return () => {
    host.removeEventListener('click', onClick);
    host.removeEventListener('keydown', onKeyDown);
    for(const type of ['pointerover','pointerout','focusin','focusout'])host.removeEventListener(type,onHover);
    canvas.removeEventListener('wheel', onWheel);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerEnd);
    canvas.removeEventListener('pointercancel', onPointerEnd);
    if (win) win.removeEventListener('resize', onWindowResize);
    if (resizeObserver) resizeObserver.disconnect();
    if (state.rafId && win?.cancelAnimationFrame) {
      win.cancelAnimationFrame(state.rafId);
      state.rafId = 0;
    }
  };
}
