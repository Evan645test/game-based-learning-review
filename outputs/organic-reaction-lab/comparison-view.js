import {comparisonById, comparisonExample, comparisonScene, COMPARISON_DURATION} from './comparisons.js';
import {drawReaction3D} from './reaction-3d-view.js';
import {REFERENCE_VIEW} from './reaction-3d.js';
import {comparisonEnergyHTML} from './energy-visual.js';

const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));
const mounted = new WeakMap();
let sequence = 0;

/** Include comparison.css once in the host document, then mount after insertion.
 * Unknown IDs throw RangeError; no course navigation or storage is touched. */
export function comparisonHTML(id) {
  const c = comparisonById(id), example = comparisonExample(id);
  return `<section class="comparison" data-comparison="${id}" aria-label="${escapeHTML(c.title)}">
    <header><p class="comparison-kicker">同一組受質與試劑 · 兩條路</p><h2>${escapeHTML(c.title)}</h2>
    <p class="comparison-conditions">${escapeHTML(example.substrate)} ＋ ${escapeHTML(example.reagent)}<br>${escapeHTML(example.conditions)}</p></header>
    <div class="comparison-controls"><button type="button" data-comparison-play>同時播放兩條路</button>
      <span data-comparison-status role="status" aria-live="polite">準備播放</span></div>
    <div class="comparison-panels">${['winner', 'loser'].map(side => `<figure class="comparison-panel ${side}" data-comparison-panel="${side}">
      <figcaption><strong>${c[side].type.toUpperCase()}</strong><span>${side === 'winner' ? '有利路徑' : c.competing ? '較少的競爭分支' : '不利路徑'}</span></figcaption>
      <p class="comparison-badge">${side === 'winner' ? '完整反應播放' : c.competing ? '示意：較少；SN1 仍可競爭，僅演示嘗試' : '示意：很慢／幾乎不發生'}</p>
      <div class="comparison-model"><svg data-comparison-model="${side}" viewBox="0 0 650 410" role="img" aria-label="${c[side].type.toUpperCase()} ${side === 'winner' ? '完整反應' : '嘗試動畫，不生成產物'}"></svg><div class="comparison-labels" aria-hidden="true"></div></div>
      <p class="comparison-caption" data-comparison-caption>${side === 'loser' ? escapeHTML(c.attemptLabel) : '由反應物開始'}</p>
    </figure>`).join('')}</div>
    ${comparisonEnergyHTML(c)}
    <div class="comparison-why">${c.why.map(p => `<p>${escapeHTML(p)}</p>`).join('')}</div>
    <p class="comparison-pages">原文頁碼：${c.pages.join('、')} · 三維座標為教學幾何</p>
  </section>`;
}

function mountOne(host) {
  mounted.get(host)?.();
  const id = host.dataset.comparison;
  const comparison = comparisonById(id), camera = {...REFERENCE_VIEW, ...(comparison.camera || {})};
  const doc = host.ownerDocument, win = doc.defaultView, uid = `comparison-${++sequence}`;
  const button = host.querySelector('[data-comparison-play]');
  const status = host.querySelector('[data-comparison-status]');
  const panels = ['winner', 'loser'].map(side => ({
    side, svg: host.querySelector(`[data-comparison-model="${side}"]`),
    labels: host.querySelector(`[data-comparison-panel="${side}"] .comparison-labels`),
    caption: host.querySelector(`[data-comparison-panel="${side}"] [data-comparison-caption]`)
  }));
  if (!button || !status || panels.some(p => !p.svg || !p.labels || !p.caption)) {
    throw new TypeError('比較面板缺少必要元素；請使用 comparisonHTML 的完整輸出');
  }
  const media = win.matchMedia('(prefers-reduced-motion: reduce)');
  let raf = null, progress = 0, last = null, disposed = false, running = false;
  const staticMotion = () => media.matches || doc.body?.dataset.artMotion === 'paused';
  const onScreen = () => {
    const r = host.getBoundingClientRect();
    return host.isConnected && r.width > 0 && r.height > 0 &&
      r.bottom > 0 && r.top < win.innerHeight && r.right > 0 && r.left < win.innerWidth;
  };
  const render = () => {
    host.dataset.comparisonProgress = progress.toFixed(4);
    for (const panel of panels) {
      const {scene, frame, required, caption} = comparisonScene(id, panel.side, progress);
      const labels = drawReaction3D(panel.svg, scene, {id: `${uid}-${panel.side}`, frame,
        required, progress: frame.progress, camera, spot: false});
      panel.svg.dataset.comparisonProgress = progress.toFixed(4);
      panel.labels.replaceChildren();
      for (const label of labels) {
        const node = doc.createElement('span');
        node.textContent = label.text;
        node.style.left = `${Math.max(9, Math.min(91, label.x / 650 * 100))}%`;
        node.style.top = `${Math.max(10, Math.min(88, (label.y - label.r - 8) / 410 * 100))}%`;
        panel.labels.append(node);
      }
      panel.caption.textContent = caption;
    }
  };
  const stop = message => {
    if (raf !== null) win.cancelAnimationFrame(raf);
    raf = null; last = null; running = false;
    host.dataset.comparisonPlaying = 'false';
    button.textContent = progress >= 1 ? '重新播放兩條路' : progress > 0 ? '繼續播放兩條路' : '同時播放兩條路';
    if (message) status.textContent = message;
  };
  const staticFrame = () => {
    stop(); progress = 1; render();
    button.textContent = '顯示關鍵幀';
    status.textContent = '已減少動態：顯示終態／嘗試關鍵幀';
  };
  const tick = now => {
    raf = null;
    if (disposed) return;
    if (!host.isConnected) {cleanup(); return;}
    if (staticMotion()) {staticFrame(); return;}
    if (doc.hidden || !onScreen()) {stop('已離開畫面，播放暫停'); return;}
    if (last !== null) progress = Math.min(1, progress + Math.max(0, now - last) / COMPARISON_DURATION);
    // Snap the last sliver so the displayed 1.0000 always means the clock has stopped.
    if (progress > .99995) progress = 1;
    last = now; render();
    if (progress >= 1) stop('播放完成；右側未生成產物');
    else raf = win.requestAnimationFrame(tick);
  };
  const play = () => {
    if (disposed) return;
    if (staticMotion()) {staticFrame(); return;}
    if (running) {stop('已暫停'); return;}
    if (doc.hidden || !onScreen()) return;
    if (progress >= 1) progress = 0;
    running = true; last = null; host.dataset.comparisonPlaying = 'true';
    button.textContent = '暫停兩條路'; status.textContent = '同步播放中';
    raf = win.requestAnimationFrame(tick);
  };
  const motionChanged = () => {
    if (staticMotion()) staticFrame();
    else {stop('動態已恢復，可重新播放');}
  };
  const visibilityChanged = () => {if (doc.hidden) stop('頁面隱藏，播放暫停');};
  const intersection = new win.IntersectionObserver(entries => {
    if (entries.some(e => !e.isIntersecting) && running) stop('已離開畫面，播放暫停');
  });
  const motionObserver = new win.MutationObserver(motionChanged);
  const removalObserver = new win.MutationObserver(() => {if (!host.isConnected) cleanup();});
  function cleanup() {
    if (disposed) return;
    disposed = true; stop();
    button.removeEventListener('click', play);
    media.removeEventListener('change', motionChanged);
    doc.removeEventListener('visibilitychange', visibilityChanged);
    intersection.disconnect(); motionObserver.disconnect(); removalObserver.disconnect();
    if (mounted.get(host) === cleanup) mounted.delete(host);
  }
  button.addEventListener('click', play);
  media.addEventListener('change', motionChanged);
  doc.addEventListener('visibilitychange', visibilityChanged);
  intersection.observe(host);
  motionObserver.observe(doc.body, {attributes: true, attributeFilter: ['data-art-motion']});
  removalObserver.observe(doc.documentElement, {childList: true, subtree: true});
  mounted.set(host, cleanup);
  if (staticMotion()) staticFrame();
  else {stop(); render();}
  return cleanup;
}

/** Accepts one comparison section or a container of several. Cleanup is
 * idempotent; remounting replaces prior listeners and cancels their animation. */
export function mountComparison(root) {
  if (!root?.querySelectorAll) throw new TypeError('mountComparison 需要 DOM 根節點');
  const hosts = [...(root.matches?.('[data-comparison]') ? [root] : []),
    ...root.querySelectorAll('[data-comparison]')];
  const cleanups = [];
  try {for (const host of hosts) cleanups.push(mountOne(host));}
  catch (error) {cleanups.forEach(cleanup => cleanup()); throw error;}
  return () => cleanups.forEach(cleanup => cleanup());
}
