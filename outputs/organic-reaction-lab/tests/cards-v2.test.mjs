import test from 'node:test';
import assert from 'node:assert/strict';
import {CARDS_V2, CONCEPTS_V2} from '../cards-v2.js';
import {REACTION_EXAMPLES} from '../reaction-examples.js';

// Independent contract lists: do not infer required IDs from the implementation.
const prep = {
  w1: ['lewis', 'formal', 'polarity', 'hybrid', 'resonance', 'acidbase'],
  w2: ['functional', 'naming', 'skeletal', 'degree', 'conformation', 'chair', 'chirality'],
  w3: ['reactions', 'nucleophile', 'arrows', 'energy'],
};
const primers = [
  'alkene-name', 'carbocation', 'alcohol-name', 'halide-name',
  'leaving', 'sterics', 'solvent', 'basicity', 'heat', 'equilibrium',
];
const details = ['inversion', 'anti', 'zaitsev', 'chair-e2'];
const required = [...Object.values(prep).flat(), ...primers, ...details];
const islands = ['addhx', 'rearr', 'halo', 'hydration', 'sn2', 'sn1', 'e2', 'e1', 'dehydration'];
const newCards = [
  'lewis', 'resonance', 'functional', 'naming', 'conformation',
  'chirality', 'reactions', 'alkene-name', 'alcohol-name', 'halide-name',
];
// Verified course-path.js media at the v2 branch point; the inversion label corrects
// 構形 to 組態 while preserving its kind/example. Keep this fixture independent
// of course-path.js, which the integration owner will replace with the v2 layout.
const media = {
  skeletal: {widget: {kind: 'skeletal'}},
  degree: {widget: {kind: 'degree'}},
  arrows: {
    visual: 'polarity',
    demos: [{label: 'C–Br 斷鍵（SN1 第一步）', kind: 'sn1', example: 'sn1-water', step: 0}],
  },
  hybrid: {demos: [
    {label: 'sp³ 四面體碳：從背面進攻（SN2）', kind: 'sn2', example: 'sn2-methyl'},
    {label: 'C–Br 斷裂後變成 sp² 平面（SN1 第一步）', kind: 'sn1', example: 'sn1-water', step: 0},
  ]},
  nucleophile: {
    visual: 'nucleophile',
    demos: [{label: '水進攻碳陽離子（SN1 第二步）', kind: 'sn1', example: 'sn1-water', step: 1}],
  },
  acidbase: {demos: [
    {label: '酸把 H⁺ 給醇的氧（醇脫水第 1 步）', kind: 'dehydration', example: 'dehyd-tertbutanol', step: 0},
    {label: '水拔走 R–OH₂⁺ 的 H⁺（SN1 第三步）', kind: 'sn1', example: 'sn1-water', step: 2},
  ]},
  leaving: {
    widget: {kind: 'leaving'},
    demos: [{label: '水帶著電子離開，留下碳陽離子（醇脫水第 2 步）', kind: 'dehydration', example: 'dehyd-tertbutanol', step: 1}],
  },
  sterics: {demos: [
    {label: '甲基：背面很空', kind: 'sn2', example: 'sn2-methyl'},
    {label: '二級：背面較擠', kind: 'sn2', example: 'sn2-secondary'},
  ]},
  carbocation: {widget: {kind: 'cation-cloud', initial: 'methyl'}},
  energy: {widget: {kind: 'energy'}},
  basicity: {
    visual: 'base',
    demos: [
      {label: 'OH⁻ 進攻碳（取代）', kind: 'sn2', example: 'sn2-methyl'},
      {label: 'EtO⁻ 拔 β-H（消去）', kind: 'e2', example: 'e2-butane'},
    ],
  },
  inversion: {demos: [{label: '背面進攻後組態反轉（SN2）', kind: 'sn2', example: 'sn2-secondary'}]},
  anti: {demos: [{label: 'β-H 與 Br 呈 anti 時拔氫（E2）', kind: 'e2', example: 'e2-butane'}]},
};
const conceptWidgets = {
  addhx: {kind: 'cation-cloud', initial: 'primary'},
  rearr: {kind: 'cation-cloud', initial: 'secondary'},
};
const heatBody = [
  'ΔG = ΔH − TΔS。ΔS 描述反應後分子變得多「自由」：粒子數變多時，ΔS 為正。',
  '（教學補充）消去把一個受質變成烯、質子化的鹼與脫離基等更多粒子，ΔS 通常比取代大。溫度 T 越高，−TΔS 這一項越負，消去就越有利；所以 E1 常寫「加熱」，室溫下則 SN1 較多。',
];
const cues = new Set(['受質', '試劑', '脫離基', '條件', '路徑', '命名', '產物']);

function nonempty(value, label) {
  assert.equal(typeof value, 'string', `${label} must be text`);
  assert.ok(value.trim().length > 0, `${label} must not be blank`);
}

function pageList(pages, label) {
  assert.ok(Array.isArray(pages) && pages.length > 0, `${label}: missing pages`);
  assert.ok(pages.every(page => Number.isInteger(page) && page > 0), `${label}: invalid PDF page`);
  assert.equal(new Set(pages).size, pages.length, `${label}: duplicate pages`);
}

function references(ids, label) {
  assert.ok(Array.isArray(ids) && ids.length > 0, `${label}: missing references`);
  for (const id of ids) {
    assert.ok(Object.hasOwn(CARDS_V2, id), `${label}: unknown card ${id}`);
  }
  assert.equal(new Set(ids).size, ids.length, `${label}: duplicate references`);
}

function question(item, label) {
  assert.ok(item && typeof item === 'object', `${label}: missing item`);
  nonempty(item.prompt, `${label}.prompt`);
  nonempty(item.feedback, `${label}.feedback`);
  assert.ok(Array.isArray(item.options), `${label}: missing options`);
  assert.ok(item.options.length >= 3 && item.options.length <= 4, `${label}: need 3–4 options`);
  item.options.forEach((option, index) => nonempty(option, `${label}.options[${index}]`));
  assert.equal(new Set(item.options).size, item.options.length, `${label}: duplicate options`);
  assert.ok(Number.isInteger(item.answer) && item.answer >= 0 && item.answer < item.options.length,
    `${label}: answer must index an existing option`);
}

test('exports every agreed card and reaction island with no retired IDs', () => {
  assert.deepEqual(Object.keys(CARDS_V2).sort(), [...required].sort());
  assert.deepEqual(Object.keys(CONCEPTS_V2).sort(), [...islands].sort());
});

test('every card satisfies the public content and assessment contract', () => {
  for (const [id, card] of Object.entries(CARDS_V2)) {
    assert.equal(card.id, id);
    for (const field of ['title', 'judge', 'example']) nonempty(card[field], `${id}.${field}`);
    pageList(card.pages, id);
    assert.ok(Array.isArray(card.body) && card.body.length > 0, `${id}: missing paragraphs`);
    card.body.forEach((paragraph, index) => nonempty(paragraph, `${id}.body[${index}]`));
    question(card.check, `${id}.check`);
    assert.ok(Array.isArray(card.diagnose), `${id}: missing diagnose`);
    const minimum = Object.values(prep).flat().includes(id) || id.endsWith('-name') ? 2 : 1;
    assert.ok(card.diagnose.length >= minimum, `${id}: need ${minimum} diagnostic items`);
    card.diagnose.forEach((item, index) => question(item, `${id}.diagnose[${index}]`));
    // Catch repeated prompts disguised by changing only numbers or chemical subscripts.
    const normalize = text => text.replace(/[0-9₀-₉⁰¹²³⁴⁵⁶⁷⁸⁹０-９]+/gu, '#').replace(/\s+/gu, '');
    const prompts = card.diagnose.map(item => normalize(item.prompt));
    assert.equal(new Set(prompts).size, prompts.length, `${id}: diagnosis must change the task`);
    assert.ok(!prompts.includes(normalize(card.check.prompt)), `${id}: check must be a separate item`);
    if (card.review) references(card.review, `${id}.review`);
    if (card.cue !== undefined) assert.ok(cues.has(card.cue), `${id}: unknown cue`);
    if (primers.includes(id) || details.includes(id)) assert.ok(cues.has(card.cue), `${id}: needs cue`);
    if (card.optional !== undefined) assert.equal(typeof card.optional, 'boolean');
  }
  assert.equal(CARDS_V2['chair-e2'].optional, true);
  assert.notEqual(CARDS_V2.chair.optional, true, 'basic chair geometry is required in w2');
});

test('new card paragraphs cite PDF pages included in their page list', () => {
  for (const id of newCards) {
    const card = CARDS_V2[id];
    assert.ok(card, `missing ${id}`);
    for (const paragraph of card.body) {
      const matches = [...paragraph.matchAll(/（PDF 第 ([0-9]+(?:、[0-9]+)*) 頁）/gu)];
      assert.ok(matches.length > 0, `${id}: paragraph needs its own PDF citation`);
      for (const match of matches) {
        for (const page of match[1].split('、').map(Number)) {
          assert.ok(card.pages.includes(page), `${id}: citation ${page} missing from pages`);
        }
      }
    }
  }
});

test('review links do not point forwards within the preparatory sequence or form cycles', () => {
  const sequence = Object.values(prep).flat();
  sequence.forEach((id, index) => {
    assert.ok(CARDS_V2[id], `missing ${id}`);
    for (const target of CARDS_V2[id].review ?? []) {
      assert.ok(sequence.indexOf(target) >= 0 && sequence.indexOf(target) < index,
        `${id}: prerequisite ${target} has not been taught`);
    }
  });
  function visit(id, path) {
    assert.ok(!path.includes(id), `review cycle: ${[...path, id].join(' -> ')}`);
    for (const target of CARDS_V2[id].review ?? []) visit(target, [...path, id]);
  }
  required.forEach(id => visit(id, []));
});

test('concepts provide see → lean → review and valid detail links', () => {
  for (const [island, concepts] of Object.entries(CONCEPTS_V2)) {
    assert.ok(Array.isArray(concepts) && concepts.length > 0, `${island}: missing concepts`);
    for (const concept of concepts) {
      nonempty(concept.title, `${island}.title`);
      nonempty(concept.example, `${island}.example`);
      pageList(concept.pages, island);
      assert.ok(Array.isArray(concept.body) && concept.body.length > 0);
      concept.body.forEach(paragraph => nonempty(paragraph, `${island}.body`));
      assert.ok(Array.isArray(concept.cues) && concept.cues.length > 0, `${island}: missing cues`);
      for (const cue of concept.cues) {
        nonempty(cue.see, `${island}.see`);
        nonempty(cue.lean, `${island}.lean`);
        references(cue.review, `${island}.cues.review`);
      }
      if (concept.details) references(concept.details, `${island}.details`);
      if (concept.widget) {
        assert.deepEqual(concept.widget, conceptWidgets[island], `${island}: changed concept widget`);
      }
    }
    if (conceptWidgets[island]) assert.deepEqual(concepts[0].widget, conceptWidgets[island]);
  }
  assert.deepEqual(CONCEPTS_V2.sn2.flatMap(concept => concept.details ?? []), ['inversion']);
  assert.deepEqual(CONCEPTS_V2.e2.flatMap(concept => concept.details ?? []), ['anti', 'zaitsev', 'chair-e2']);
});

test('preserves existing media and resolves each demo in its reaction family', () => {
  for (const [id, card] of Object.entries(CARDS_V2)) {
    for (const field of ['demos', 'widget', 'visual']) {
      assert.deepEqual(card[field], media[id]?.[field], `${id}: changed or invented ${field}`);
    }
    for (const demo of card.demos ?? []) {
      nonempty(demo.label, `${id}.demo.label`);
      const examples = REACTION_EXAMPLES[demo.kind];
      assert.ok(examples, `${id}: unknown demo kind ${demo.kind}`);
      assert.ok(examples.some(example => example.id === demo.example),
        `${id}: example ${demo.example} does not belong to ${demo.kind}`);
      if (demo.step !== undefined) assert.ok(Number.isInteger(demo.step) && demo.step >= 0);
    }
  }
});

test('retains the agreed heat explanation including the teaching supplement', () => {
  assert.deepEqual(CARDS_V2.heat?.body, heatBody);
  assert.deepEqual(CARDS_V2.heat?.pages, [204, 205, 387]);
  assert.deepEqual(CARDS_V2.heat?.check, {
    prompt: '依 ΔG = ΔH − TΔS，為什麼升溫有利消去？',
    options: ['消去的 ΔS 較大，T 越大，−TΔS 越負', '升溫讓 ΔH 變成零', '升溫讓碳陽離子無法形成'],
    answer: 0,
    feedback: '消去產生較多粒子、ΔS 較大；乘上溫度後，對 ΔG 的影響更大。',
  });
});
