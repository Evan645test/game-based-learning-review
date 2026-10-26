import test from 'node:test';
import assert from 'node:assert/strict';
import {figureHTML, mountFigure, __figureInternals} from '../figure-view.js';
import {projectPoint} from '../reaction-3d.js';

const baseMol = {
  atoms: [
    {id: 'c1', el: 'C', x: 0, y: 0, label: 'CH₃'},
    {id: 'o1', el: 'O', x: 1.2, y: 0.6, lp: 2, charge: -1, partial: 'δ−'},
    {id: 'h1', el: 'H', x: 2.2, y: 0.5, partial: 'δ+'}
  ],
  bonds: [
    {a: 'c1', b: 'o1', order: 1, style: 'wedge'},
    {a: 'o1', b: 'h1', order: 1, style: 'dash'}
  ],
  arrows: [
    {from: {lp: 'o1'}, to: {bond: ['c1', 'o1']}}
  ]
};

test('figureHTML: structure-steps 會產生步驟控制與分子 SVG', () => {
  const spec = {
    kind: 'structure-steps',
    title: '路易士與形式電荷',
    mols: [baseMol, baseMol],
    joiner: '↔',
    steps: [
      {note: '先看孤電子對', show: {lp: true}},
      {note: '再看電荷與箭頭', show: {lp: true, charges: true, arrows: true, highlight: ['o1']}}
    ]
  };
  const html = figureHTML(spec);
  assert.match(html, /data-figure-kind="structure-steps"/);
  assert.match(html, /data-figure-prev/);
  assert.match(html, /data-figure-next/);
  assert.match(html, /先看孤電子對/);
  assert.match(html, /class="fv-mol"/);
  assert.match(html, /marker/);
});

test('figureHTML: 六種 kind 都會輸出對應區塊', () => {
  const specs = [
    {
      kind: 'name-pair',
      title: '命名對照',
      items: [
        {name: '2-甲基丙烷', mol: baseMol, highlight: [{atoms: ['c1'], label: '主鏈'}]}
      ]
    },
    {
      kind: 'newman',
      title: 'Newman',
      front: ['CH₃', 'H', 'H'],
      back: ['CH₃', 'H', 'H'],
      frames: [{dihedral: 180, label: 'anti', note: '最穩定'}]
    },
    {
      kind: 'chair',
      title: '椅式翻環',
      substituents: [{carbon: 1, position: 'axial', label: 'CH₃'}],
      frames: [{flip: false, note: '初始'}, {flip: true, note: '翻環後'}]
    },
    {
      kind: 'chirality',
      title: 'R/S 判讀',
      groups: [{label: 'Br', priority: 1}, {label: 'OH', priority: 2}, {label: 'CH₃', priority: 3}, {label: 'H', priority: 4}],
      steps: [{note: '先看取代基', show: 'groups'}, {note: '判讀方向', show: 'direction'}],
      answer: 'R'
    },
    {
      kind: 'schematic',
      title: '流程比較',
      panels: [{caption: '左', mol: baseMol}, {caption: '右', text: '觀察條件'}],
      joiner: 'vs',
      curve: {points: [[0, 0], [1, 2], [2, 1]], labels: [{x: 1, y: 2, text: '峰值'}]}
    }
  ];
  for (const spec of specs) {
    const html = figureHTML(spec);
    assert.match(html, new RegExp(`data-figure-kind="${spec.kind}"`));
  }
  assert.match(figureHTML(specs[1]), /data-figure-sync/);
  assert.match(figureHTML(specs[1]), /class="fv-stack fv-stack-3d"/);
  assert.match(figureHTML(specs[1]), /class="fv-sync-panel fv-sync-panel-newman"/);
  assert.match(figureHTML(specs[1]), /font-size="1[2-9]/);
  assert.match(figureHTML(specs[4]), /class="fv-curve"/);
});

test('figureHTML: 文字會跳脫，避免注入', () => {
  const html = figureHTML({
    kind: 'name-pair',
    title: '<img src=x onerror=alert(1)>',
    items: [{name: '"危險"', mol: baseMol, highlight: [{atoms: ['o1'], label: '<script>bad</script>'}]}]
  });
  assert.ok(!html.includes('<img src=x onerror=alert(1)>'));
  assert.ok(!html.includes('<script>bad</script>'));
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /&lt;script&gt;bad&lt;\/script&gt;/);
});

test('mountFigure 在無 DOM 環境可安全呼叫', () => {
  const cleanup = mountFigure(null, {kind: 'schematic', title: 'x', panels: []});
  assert.equal(typeof cleanup, 'function');
  cleanup();
});

test('name-pair: 骨架碳不顯示 C 圓點文字，位置重點會顯示主鏈編號與高亮筆觸', () => {
  const html = figureHTML({
    kind: 'name-pair',
    title: '2-甲基丁烷',
    items: [{
      name: '2-甲基丁烷',
      mol: {
        atoms: [
          {id: 'c1', el: 'C', x: 0, y: 0},
          {id: 'c2', el: 'C', x: 1, y: -0.5},
          {id: 'c3', el: 'C', x: 2, y: 0},
          {id: 'c4', el: 'C', x: 3, y: -0.5},
          {id: 'm', el: 'C', x: 1, y: 0.8, label: 'CH₃'}
        ],
        bonds: [
          {a: 'c1', b: 'c2'},
          {a: 'c2', b: 'c3'},
          {a: 'c3', b: 'c4'},
          {a: 'c2', b: 'm'}
        ]
      },
      highlight: [{atoms: ['c1', 'c2', 'c3', 'c4'], label: '主鏈四碳；依序編為 1 → 2 → 3 → 4'}]
    }]
  });
  assert.ok(!html.includes('>C<'));
  assert.match(html, /stroke-opacity="0\.48"/);
  assert.match(html, /font-size="9\.5"/);
});

test('figureHTML: 支援 Figure 陣列輸入並渲染切換 tabs', () => {
  const html = figureHTML([
    {kind: 'schematic', title: '圖 A', panels: [{text: 'a'}]},
    {kind: 'schematic', title: '圖 B', panels: [{text: 'b'}]}
  ]);
  assert.match(html, /data-figure-count="2"/);
  assert.match(html, /data-figure-item="0"/);
  assert.match(html, /data-figure-item="1"/);
});

test('sequenceFromSpec 對六種規格都回傳正確長度', () => {
  const {sequenceFromSpec, figureItemsOf} = __figureInternals;
  assert.equal(sequenceFromSpec({kind: 'structure-steps', steps: [1, 2]}).length, 2);
  assert.equal(sequenceFromSpec({kind: 'name-pair', items: [1]}).length, 1);
  assert.equal(sequenceFromSpec({kind: 'newman', frames: [1, 2, 3]}).length, 3);
  assert.equal(sequenceFromSpec({kind: 'chair', frames: []}).length, 1);
  assert.equal(sequenceFromSpec({kind: 'chirality', steps: [1, 2]}).length, 2);
  assert.equal(sequenceFromSpec({kind: 'schematic'}).length, 0);
  assert.equal(figureItemsOf([{kind: 'schematic'}, null, {kind: 'chair'}]).length, 2);
});

test('chairConformerModel: 翻環會交換 axial/equatorial，且 up/down 保持', () => {
  const {chairConformerModel} = __figureInternals;
  const spec = {
    kind: 'chair',
    substituents: [
      {carbon: 1, position: 'axial', label: 'Cl'},
      {carbon: 2, position: 'axial', label: 'H'}
    ]
  };
  const unflipped = chairConformerModel(spec, {flip: false});
  const flipped = chairConformerModel(spec, {flip: true});

  assert.equal(unflipped.substituents.length, 2);
  assert.deepEqual(unflipped.substituents.map(item => item.actual), ['axial', 'axial']);
  assert.deepEqual(unflipped.substituents.map(item => item.up), ['up', 'down']);
  assert.deepEqual(flipped.substituents.map(item => item.actual), ['equatorial', 'equatorial']);
  assert.deepEqual(flipped.substituents.map(item => item.up), ['up', 'down']);
});

test('cameraForSpec(chirality orient): priority 4 預設朝後且四基團投影分離', () => {
  const {cameraForSpec, chiralityModel} = __figureInternals;
  const spec = {
    kind: 'chirality',
    groups: [
      {label: 'OH', priority: 1},
      {label: 'CH₂CH₃', priority: 2},
      {label: 'CH₃', priority: 3},
      {label: 'H', priority: 4}
    ],
    steps: [
      {show: 'groups'},
      {show: 'priorities'},
      {show: 'orient'},
      {show: 'direction'}
    ]
  };
  const camera = cameraForSpec(spec, 2);
  const model = chiralityModel(spec);
  const groupAtoms = model.atoms.slice(1);
  const projected = groupAtoms.map(atom => projectPoint(atom.p, camera));
  const priority4 = projected[groupAtoms.findIndex(atom => atom.priority === 4)];
  const others = projected.filter((_, index) => groupAtoms[index].priority !== 4);
  const farthestOther = Math.max(...others.map(point => point.z));
  assert.ok(priority4.z > farthestOther + 0.25);

  let minDist = Infinity;
  for (let i = 0; i < projected.length; i += 1) {
    for (let j = i + 1; j < projected.length; j += 1) {
      minDist = Math.min(minDist, Math.hypot(projected[i].x - projected[j].x, projected[i].y - projected[j].y));
    }
  }
  assert.ok(minDist > 80, `groups too close: ${minDist}`);
});
