import {REACTION_EXAMPLES, exampleSpec} from './reaction-examples.js';
import {reactionScene3D} from './reaction-3d.js';

// Example IDs identify the shared starting material, even on the attempted route.
// camera: per-comparison viewpoint (merged over REFERENCE_VIEW) so both models fill their panels.
export const COMPARISONS = [
  {
    id: 'primary-sn2-vs-sn1', camera: {zoom: 1.3}, title: '一級鹵烷：為何走 SN2，不走 SN1？',
    winner: {type: 'sn2', example: 'sn2-ethyl'},
    loser: {type: 'sn1', example: 'sn2-ethyl', attempt: 'retreat'},
    energy: {winner: 'one', loser: 'attempt', shared: false},
    why: ['一級受質的背面較容易接近，碘離子可直接進攻 α 碳。',
      '為何不是 SN1？一級碳陽離子不穩定；右圖只拉長 C–Br 再縮回，不形成碳陽離子。'],
    pages: [363, 244, 245, 252],
    attemptLabel: 'C–Br 拉長後縮回；不形成一級碳陽離子'
  },
  {
    id: 'tertiary-sn1-vs-sn2', camera: {zoom: 1.3}, title: '三級鹵烷：為何走 SN1，不走 SN2？',
    winner: {type: 'sn1', example: 'sn1-water'},
    loser: {type: 'sn2', example: 'sn1-water', attempt: 'blocked'},
    energy: {winner: 'two', loser: 'attempt', shared: false},
    why: ['三級受質可先形成較穩定的三級碳陽離子，再由水進攻。',
      '為何不是 SN2？三個烷基擋住背面，親核劑難以靠近 α 碳。'],
    pages: [363, 244, 245, 252],
    attemptLabel: '背面接近 → 三個烷基阻擋 → 退開'
  },
  {
    id: 'bulky-e2-vs-sn2', camera: {yaw: .5, pitch: .3, zoom: 1.35}, title: '一級鹵烷＋大體積強鹼：為何走 E2？',
    winner: {type: 'e2', example: 'e2-primary'},
    loser: {type: 'sn2', example: 'e2-primary', attempt: 'switch-to-beta-h'},
    energy: {winner: 'one', loser: 'attempt', shared: false},
    why: ['一級受質通常有利 SN2，但 t-BuO⁻ 體積大，難以靠近碳，仍能拔取外側容易接近的 β-H。',
      '左圖形成取代較少的 1-butene；此受質只有一個 β 碳，不能用它比較 Hofmann／Zaitsev 的區位選擇。'],
    pages: [363, 378, 380, 381, 383],
    attemptLabel: '接近碳受阻 → 轉向外側 β-H；右圖停在拔氫前'
  },
  {
    id: 'heat-e1-vs-sn1', camera: {zoom: 1.3}, title: '三級鹵烷＋乙醇：加熱為何有利 E1？',
    winner: {type: 'e1', example: 'e1-tertamyl'},
    loser: {type: 'sn1', example: 'e1-tertamyl', attempt: 'retreat'},
    energy: {winner: 'two', loser: 'branch', shared: true},
    why: ['E1 與 SN1 先共用同一個碳陽離子；之後乙醇可拔 β-H，或進攻碳。',
      '加熱時熵有利消去，烯的比例提高；SN1 仍可競爭，右圖只呈現進攻嘗試，不代表它完全不發生。'],
    pages: [204, 205, 387],
    attemptLabel: '共用碳陽離子 → 乙醇接近碳；停在成鍵前',
    competing: true
  }
];

export const COMPARISON_DURATION = 9000;
const clamp = p => Math.max(0, Math.min(1, Number(p) || 0));
const smooth = p => {p = clamp(p); return p * p * (3 - 2 * p);};
const mix = (a, b, p) => a.map((v, i) => v + (b[i] - v) * p);
export function comparisonById(id) {
  const comparison = COMPARISONS.find(c => c.id === id);
  if (!comparison) throw new RangeError(`未知的比較：${id}`);
  return comparison;
}
export function comparisonExample(id) {
  const c = comparisonById(id);
  return REACTION_EXAMPLES[c.winner.type].find(e => e.id === c.winner.example);
}
const specFor = c => exampleSpec(c.winner.type, comparisonExample(c.id));

function timeline(spec, progress) {
  const t = clamp(progress) * spec.steps.length;
  const step = Math.min(spec.steps.length - 1, Math.floor(t));
  const local = t - step;
  const mode = local < .25 ? 'approach' : local < .85 ? 'transform' : 'product';
  return {step, mode, progress: mode === 'approach' ? local / .25 : mode === 'product' ? 1 : (local - .25) / .6,
    arrows: mode === 'transform' ? spec.steps[step].required.map((_, i) => i) : []};
}

// SN1/E1 step zero omits solvent in the original scene. Add only the unchanged
// reagent from the next step, to show identical substrate + reagent on both sides.
function withSolvent(scene, c, spec) {
  if (scene.step !== 0 || !['sn1', 'e1'].includes(c.winner.type)) return scene;
  const next = reactionScene3D(c.winner.type, 1, 'overview', 0, spec);
  const actor = c.winner.type === 'sn1' ? 'Nu' : 'Base';
  const belongs = a => a.id === actor || a.id.startsWith(actor + '-') ||
    actor === 'Nu' && ['HN', 'Hkeep', 'Hkeep-H0', 'Hkeep-H1', 'Hkeep-H2'].includes(a.id);
  const added = next.atoms.filter(belongs);
  const ids = new Set(added.map(a => a.id));
  scene.atoms.push(...added);
  scene.bonds.push(...next.bonds.filter(b => ids.has(b.a) && ids.has(b.b)));
  for (const a of added) scene.anchors.set(a.id, a.p);
  scene.bounds.push(...added.map(a => ({p: a.p, spectator: !!a.spectator})));
  return scene;
}

function freezeConnectivity(scene) {
  scene.bonds = scene.bonds.filter(b => b.opacity > 0 && !['newCN', 'formingOH'].includes(b.id))
    .map(b => ({...b, order: b.piOpacity === 0 ? 1 : b.order, changing: false}));
  return scene;
}
function translateGroup(scene, actor, destination) {
  const origin = scene.atoms.find(a => a.id === actor).p;
  const delta = destination.map((v, i) => v - origin[i]);
  // Traverse only the reagent component; never translate the substrate.
  const ids = new Set([actor]), queue = [actor];
  while (queue.length) {
    const id = queue.pop();
    for (const b of scene.bonds) {
      const other = b.a === id ? b.b : b.b === id ? b.a : null;
      if (other && !ids.has(other)) {ids.add(other); queue.push(other);}
    }
  }
  for (const a of scene.atoms) if (ids.has(a.id)) a.p = a.p.map((v, i) => v + delta[i]);
}
function sealAttempt(scene, c, progress) {
  // No hidden product endpoint coordinates or product metadata on attempts.
  for (const a of scene.atoms) {
    a.p0 = [...a.p]; a.p1 = [...a.p];
    scene.anchors.set(a.id, a.p);
  }
  for (const b of scene.bonds) {
    const a = scene.anchors.get(b.a), end = scene.anchors.get(b.b);
    scene.anchors.set(b.id, mix(a, end, .5));
  }
  scene.bounds.push(...scene.atoms.map(a => ({p: a.p, spectator: !!a.spectator})));
  return {...scene, attemptedType: c.loser.type, attempt: c.loser.attempt, progress,
    isAttempt: true, product: null};
}

/** Pure scene API used by the view and tests. Losing routes never run a
 * substitution transform; only the explicitly shared ionization may break a bond. */
export function comparisonScene(id, side, progress = 0) {
  const c = comparisonById(id), spec = specFor(c), t = clamp(progress);
  if (!['winner', 'loser'].includes(side)) throw new RangeError(`未知的面板：${side}`);
  const frame = timeline(spec, t);
  if (side === 'winner') {
    const scene = withSolvent(reactionScene3D(c.winner.type, frame.step, frame.mode, frame.progress, spec), c, spec);
    return {scene, frame, required: spec.steps[frame.step].required,
      caption: t === 1 ? comparisonExample(id).product : spec.steps[frame.step].title};
  }

  let scene;
  if (c.energy.shared && t < .5) {
    scene = withSolvent(reactionScene3D('e1', 0, frame.mode, frame.progress, spec), c, spec);
    return {scene: sealAttempt(scene, c, t), frame, required: spec.steps[0].required,
      caption: '共同第一步：C–Br 離解，形成三級碳陽離子'};
  }
  if (c.energy.shared) {
    scene = freezeConnectivity(reactionScene3D('e1', 1, 'overview', 0, spec));
    const actor = scene.atoms.find(a => a.id === 'Base'), ca = scene.atoms.find(a => a.id === 'CA');
    const local = (t - .5) * 2;
    const near = [ca.p[0], ca.p[1] + 2.5, ca.p[2]];
    const amount = local < .65 ? smooth(local / .65) : 1 - .3 * smooth((local - .65) / .35);
    translateGroup(scene, 'Base', mix(actor.p, near, amount));
  } else {
    scene = freezeConnectivity(withSolvent(reactionScene3D(c.winner.type, 0, 'overview', 0, spec), c, spec));
    const ca = scene.atoms.find(a => a.id === 'CA');
    const pulse = t < .5 ? smooth(t * 2) : 1 - smooth((t - .5) * 2);
    if (c.loser.attempt === 'retreat') {
      const br = scene.atoms.find(a => a.id === 'Br');
      br.p = br.p.map((v, i) => v + (v - ca.p[i]) * .32 * pulse);
      scene.bonds.find(b => b.id === 'CBr').changing = t > 0 && t < 1;
    } else if (c.loser.attempt === 'blocked') {
      const nu = scene.atoms.find(a => a.id === 'Nu');
      translateGroup(scene, 'Nu', mix(nu.p, [-2.65, 0, 0], pulse));
    } else {
      const base = scene.atoms.find(a => a.id === 'Base'), br = scene.atoms.find(a => a.id === 'Br');
      const direction = ca.p.map((v, i) => v - br.p[i]), length = Math.hypot(...direction);
      const blocked = ca.p.map((v, i) => v + direction[i] / length * 2.9);
      const hb = scene.atoms.find(a => a.id === 'HB');
      const beta = [hb.p[0] + .4, hb.p[1] - 1.9, hb.p[2]];
      const destination = t < .45 ? mix(base.p, blocked, smooth(t / .45)) :
        mix(blocked, beta, smooth((t - .45) / .55));
      translateGroup(scene, 'Base', destination);
    }
  }
  return {scene: sealAttempt(scene, c, t),
    frame: {step: c.energy.shared ? 1 : 0, mode: 'attempt', progress: t, arrows: []},
    required: [], caption: c.attemptLabel};
}
