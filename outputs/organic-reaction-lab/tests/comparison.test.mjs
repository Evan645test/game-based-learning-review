import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {COMPARISONS, comparisonScene, comparisonExample} from '../comparisons.js';
import {comparisonHTML, mountComparison} from '../comparison-view.js';
import {REACTION_EXAMPLES, exampleSpec} from '../reaction-examples.js';
import {reactionScene3D} from '../reaction-3d.js';
import {energyHTML} from '../energy-visual.js';

test('four requested comparisons have stable public IDs', () => {
  assert.deepEqual(COMPARISONS.map(c => c.id), [
    'primary-sn2-vs-sn1', 'tertiary-sn1-vs-sn2',
    'bulky-e2-vs-sn2', 'heat-e1-vs-sn1'
  ]);
});

const atom = (scene, id) => scene.atoms.find(a => a.id === id);
const distance = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
const graph = scene => scene.bonds.map(b => [b.a, b.b, b.order]).sort();
const positions = scene => scene.atoms.map(a => [a.id, a.p, a.charge]);
const hash = value => createHash('sha256').update(JSON.stringify(value, (_k, v) =>
  v instanceof Map ? [...v] : v)).digest('hex');

for (const c of COMPARISONS) {
  test(`${c.id}: two panels, one energy graph, explicit attempt and source labels`, () => {
    const html = comparisonHTML(c.id);
    assert.equal((html.match(/data-comparison-panel=/g) || []).length, 2);
    assert.equal((html.match(/data-comparison-energy>/g) || []).length, 1);
    assert.equal((html.match(/data-energy-curve=/g) || []).length, 2);
    assert.match(html, /示意，非計算值/);
    assert.match(html, /嘗試動畫，不生成產物/);
    assert.match(html, /示意：/);
    assert.ok(c.why.length >= 1 && c.why.length <= 2);
    assert.equal(c.winner.example, c.loser.example);
    assert.match(html, new RegExp(comparisonExample(c.id).substrate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });

  test(`${c.id}: attempted route cannot produce product atoms, bonds or charges`, () => {
    const initial = comparisonScene(c.id, 'loser', c.energy.shared ? .5 : 0).scene;
    for (let i = 0; i <= 100; i++) {
      const t = i / 100, {scene} = comparisonScene(c.id, 'loser', t);
      assert.equal(scene.product, null);
      assert.equal(scene.isAttempt, true);
      assert.ok(scene.bonds.every(b => !['newCN', 'formingOH'].includes(b.id)));
      assert.ok(scene.atoms.every(a => a.p.every(Number.isFinite)));
      assert.ok(scene.atoms.every(a => a.p.every((v, j) => v === a.p1[j] && v === a.p0[j])));
      if (!c.energy.shared || t >= .5) {
        assert.deepEqual(scene.atoms.map(a => [a.id, a.element, a.charge]),
          initial.atoms.map(a => [a.id, a.element, a.charge]));
        assert.deepEqual(graph(scene), graph(initial));
        assert.ok(scene.bonds.every(b => b.order === 1));
        assert.equal(atom(scene, 'CA').charge, c.energy.shared ? 1 : 0);
      }
    }
  });

  test(`${c.id}: full winner uses original final scene and both panels start with same reactants`, () => {
    const start = comparisonScene(c.id, 'winner', 0).scene;
    assert.deepEqual(positions(start), positions(comparisonScene(c.id, 'loser', 0).scene));
    const example = comparisonExample(c.id), spec = exampleSpec(c.winner.type, example);
    const original = reactionScene3D(c.winner.type, spec.steps.length - 1, 'product', 1, spec);
    const final = comparisonScene(c.id, 'winner', 1);
    assert.deepEqual(final.scene, original);
    assert.equal(final.caption, example.product);
  });
}

test('retreat stretches and restores C–Br without forming a cation', () => {
  const scenes = [0, .5, 1].map(t => comparisonScene(COMPARISONS[0].id, 'loser', t).scene);
  const lengths = scenes.map(s => distance(atom(s, 'CA').p, atom(s, 'Br').p));
  assert.ok(lengths[1] > lengths[0] * 1.2);
  assert.equal(lengths[0], lengths[2]);
  assert.deepEqual(positions(scenes[0]), positions(scenes[2]));
});

test('tertiary SN2 approaches from the back and retreats before reaching carbon', () => {
  const scenes = [0, .5, 1].map(t => comparisonScene(COMPARISONS[1].id, 'loser', t).scene);
  const lengths = scenes.map(s => distance(atom(s, 'CA').p, atom(s, 'Nu').p));
  assert.ok(lengths[1] < lengths[0] && lengths[1] > 2.5);
  assert.deepEqual(positions(scenes[0]), positions(scenes[2]));
  assert.ok(scenes.every(s => atom(s, 'Nu').p[0] < atom(s, 'CA').p[0]));
});

test('bulky base moves toward beta H with all reagent internal distances preserved', () => {
  const scenes = [0, .45, 1].map(t => comparisonScene(COMPARISONS[2].id, 'loser', t).scene);
  assert.ok(distance(atom(scenes[2], 'Base').p, atom(scenes[2], 'HB').p) <
    distance(atom(scenes[1], 'Base').p, atom(scenes[1], 'HB').p));
  const initialDistance = distance(atom(scenes[0], 'Base').p, atom(scenes[0], 'Base-C').p);
  for (const s of scenes) assert.ok(Math.abs(distance(atom(s, 'Base').p, atom(s, 'Base-C').p) - initialDistance) < 1e-12);
  assert.deepEqual(scenes.map(s => atom(s, 'HB').p), Array(3).fill(atom(scenes[0], 'HB').p));
});

test('heat shares the entire ionization before branching, with ethanol on both sides', () => {
  const id = 'heat-e1-vs-sn1';
  for (const t of [0, .1, .2, .3, .425, .49]) {
    const winner = comparisonScene(id, 'winner', t).scene;
    const loser = comparisonScene(id, 'loser', t).scene;
    assert.deepEqual(positions(winner), positions(loser));
    assert.deepEqual(winner.bonds, loser.bonds);
    assert.ok(atom(loser, 'Base-C-C2'), 'ethanol must retain both carbons');
  }
  assert.equal(atom(comparisonScene(id, 'loser', 1).scene, 'CA').charge, 1);
  assert.equal(atom(comparisonScene(id, 'winner', 1).scene, 'CA').charge, 0);
});

test('invalid inputs fail clearly and numeric progress stays within endpoints', () => {
  assert.throws(() => comparisonHTML('unknown'), RangeError);
  assert.throws(() => comparisonScene(COMPARISONS[0].id, 'unknown'), RangeError);
  assert.throws(() => mountComparison(null), TypeError);
  assert.equal(comparisonScene(COMPARISONS[0].id, 'loser', -2).scene.progress, 0);
  assert.equal(comparisonScene(COMPARISONS[0].id, 'loser', 4).scene.progress, 1);
  assert.equal(comparisonScene(COMPARISONS[0].id, 'loser', NaN).scene.progress, 0);
});

test('all 26 exampleSpec results and sampled playback geometry match base 335b362', () => {
  const specs = [], scenes = [];
  assert.equal(Object.values(REACTION_EXAMPLES).flat().length, 26);
  for (const [kind, examples] of Object.entries(REACTION_EXAMPLES)) for (const e of examples) {
    const spec = exampleSpec(kind, e); specs.push(spec);
    for (let i = 0; i < spec.steps.length; i++)
      for (const mode of ['overview', 'approach', 'transform', 'product'])
        for (const p of [0, .5, 1]) scenes.push(reactionScene3D(kind, i, mode, p, spec));
  }
  assert.equal(hash(specs), '60701657f87a34b19de803535ec9171f2ccb7c148e3dd9d451ad9b89ea1c89ed');
  assert.equal(hash(scenes), '49408ee245e20c29148864af2fd3a68487c183e9ce4ab65016ce86da2e9e038c');
});

test('existing standalone energy diagrams keep their original two-diagram contract', () => {
  const html = energyHTML();
  assert.equal((html.match(/data-energy-diagram=/g) || []).length, 2);
  assert.equal((html.match(/data-energy-ts>/g) || []).length, 3);
  assert.equal((html.match(/data-energy-int>/g) || []).length, 1);
  assert.doesNotMatch(html, /data-comparison/);
});

// Minimal DOM/clock boundary for lifecycle checks; these do not assert browser
// layout, CSS, accessibility-tree behavior or replace the Playwright checks.
function lifecycleHarness(t, {reduced = false, paused = false} = {}) {
  class Element extends EventTarget {
    constructor() {
      super(); this.dataset = {}; this.style = {}; this.children = []; this.attributes = {};
      this.textContent = ''; this.isConnected = true;
    }
    append(...nodes) {this.children.push(...nodes);}
    replaceChildren(...nodes) {this.children = nodes;}
    setAttribute(key, value) {this.attributes[key] = String(value);}
    getBoundingClientRect() {return {top: 0, bottom: 900, left: 0, right: 900, width: 900, height: 900};}
  }
  const doc = new EventTarget(), media = new EventTarget(), callbacks = new Map();
  const mutations = [], intersections = [];
  let nextFrame = 0, requested = 0;
  media.matches = reduced;
  class MutationObserver {
    constructor(callback) {this.callback = callback; mutations.push(this);}
    observe(target, options) {this.target = target; this.options = options; this.active = true;}
    disconnect() {this.active = false;}
  }
  class IntersectionObserver {
    constructor(callback) {this.callback = callback; intersections.push(this);}
    observe() {this.active = true;}
    disconnect() {this.active = false;}
  }
  const win = {
    innerHeight: 1000, innerWidth: 1280, MutationObserver, IntersectionObserver,
    matchMedia: () => media,
    requestAnimationFrame: callback => {requested++; callbacks.set(++nextFrame, callback); return nextFrame;},
    cancelAnimationFrame: id => callbacks.delete(id)
  };
  Object.assign(doc, {defaultView: win, hidden: false, body: new Element(), documentElement: new Element(),
    createElement: () => new Element(), createElementNS: () => new Element()});
  if (paused) doc.body.dataset.artMotion = 'paused';
  const host = new Element(), button = new Element(), status = new Element();
  host.dataset.comparison = 'primary-sn2-vs-sn1';
  host.ownerDocument = doc;
  const panels = Object.fromEntries(['winner', 'loser'].map(side => [side, {
    svg: new Element(), labels: new Element(), caption: new Element()
  }]));
  host.querySelector = selector => {
    if (selector === '[data-comparison-play]') return button;
    if (selector === '[data-comparison-status]') return status;
    for (const side of ['winner', 'loser']) {
      if (selector === `[data-comparison-model="${side}"]`) return panels[side].svg;
      if (selector === `[data-comparison-panel="${side}"] .comparison-labels`) return panels[side].labels;
      if (selector === `[data-comparison-panel="${side}"] [data-comparison-caption]`) return panels[side].caption;
    }
    return null;
  };
  host.matches = selector => selector === '[data-comparison]';
  host.querySelectorAll = () => [];
  const previous = globalThis.document;
  globalThis.document = doc;
  t.after(() => {
    host.isConnected = false;
    for (const observer of mutations) if (observer.active && observer.options.childList) observer.callback();
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  });
  return {
    host, button, status, doc, media, panels, callbacks,
    get requested() {return requested;},
    click: () => button.dispatchEvent(new Event('click')),
    tick: time => {for (const [id, callback] of [...callbacks]) {callbacks.delete(id); callback(time);}},
    reduced(value) {media.matches = value; media.dispatchEvent(new Event('change'));},
    paused(value) {
      if (value) doc.body.dataset.artMotion = 'paused';
      else delete doc.body.dataset.artMotion;
      for (const observer of mutations) if (observer.active && observer.target === doc.body) observer.callback();
    },
    offscreen() {for (const observer of intersections) if (observer.active) observer.callback([{isIntersecting: false}]);},
    remove() {
      host.isConnected = false;
      for (const observer of mutations) if (observer.active && observer.options.childList) observer.callback();
    }
  };
}

test('one mounted clock draws both panels and stops at the full winner endpoint', t => {
  const h = lifecycleHarness(t), cleanup = mountComparison(h.host);
  assert.equal(h.requested, 0, 'mount never auto-plays');
  h.click(); assert.equal(h.callbacks.size, 1);
  h.tick(100); h.tick(4600);
  assert.equal(h.host.dataset.comparisonProgress, '0.5000');
  assert.equal(h.panels.winner.svg.dataset.comparisonProgress, h.panels.loser.svg.dataset.comparisonProgress);
  assert.ok(h.panels.winner.svg.children.length > 10, 'the real 3D renderer ran');
  h.tick(9100);
  assert.equal(h.host.dataset.comparisonProgress, '1.0000');
  assert.equal(h.callbacks.size, 0);
  assert.equal(h.panels.winner.caption.textContent, 'CH₃CH₂I + Br⁻');
  cleanup(); cleanup(); h.click();
  assert.equal(h.callbacks.size, 0, 'cleanup removes click handlers');
});

test('motion preferences show static endpoints without scheduling animation', t => {
  const h = lifecycleHarness(t, {reduced: true});
  mountComparison(h.host);
  assert.equal(h.host.dataset.comparisonProgress, '1.0000');
  h.click(); assert.equal(h.requested, 0);
  h.reduced(false); h.click(); h.tick(0); h.tick(100);
  assert.equal(h.callbacks.size, 1);
  h.paused(true);
  assert.equal(h.host.dataset.comparisonProgress, '1.0000');
  assert.equal(h.callbacks.size, 0);
  const requested = h.requested;
  h.click(); assert.equal(h.requested, requested);
  mountComparison(h.host);
  assert.equal(h.requested, requested, 'mount while body is paused also remains static');
  h.paused(false); h.click(); h.reduced(true);
  assert.equal(h.callbacks.size, 0, 'runtime media change cancels pending frame');
});

test('remount, pause, visibility, offscreen and removal cancel pending frames', t => {
  const h = lifecycleHarness(t);
  mountComparison(h.host); mountComparison(h.host); h.click();
  assert.equal(h.callbacks.size, 1, 'remount does not duplicate listeners');
  h.tick(0); h.tick(100);
  h.click(); assert.equal(h.callbacks.size, 0);
  h.click(); h.tick(200); h.tick(300);
  assert.equal(h.host.dataset.comparisonProgress, (200 / 9000).toFixed(4));
  h.offscreen(); assert.equal(h.callbacks.size, 0);
  h.click(); h.doc.hidden = true; h.doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(h.callbacks.size, 0);
  h.doc.hidden = false; h.click();
  assert.equal(h.callbacks.size, 1);
  h.remove(); assert.equal(h.callbacks.size, 0);
  h.click(); assert.equal(h.callbacks.size, 0);
});
