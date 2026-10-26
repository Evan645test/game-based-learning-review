import test from 'node:test';
import assert from 'node:assert/strict';
import {bookHTML, __bookMapInternals} from '../book-map.js';

const spreads = [
  {
    id: 'sp1',
    title: '結構與電子',
    chapters: '第 1–2 章',
    art: 'book-spread-1.png',
    nodes: [
      {id: 'lewis', section: '1.4', title: '路易士', state: 'done', flag: false},
      {id: 'hybrid', section: '1.6', title: '混成', state: 'done', flag: false},
      {id: 'formal', section: '2.3', title: '形式電荷', state: 'next', flag: true},
      {id: 'resonance', section: '2.4', title: '共振', state: 'todo', flag: false},
      {id: 'acidbase', section: '2.7', title: '酸鹼', state: 'todo', flag: false}
    ]
  },
  {
    id: 'sp2',
    title: '命名與空間',
    chapters: '第 3–5 章',
    art: 'book-spread-2.png',
    nodes: [
      {id: 'naming', section: '3.4', title: '命名', state: 'next', flag: false}
    ]
  }
];

test('bookHTML 會輸出跨頁標題、節點與翻頁控制', () => {
  const html = bookHTML({spreads, spread: 0, hero: 'formal'});
  assert.match(html, /結構與電子/);
  assert.match(html, /<button type="button" data-book-page="prev"/);
  assert.match(html, /<button type="button" data-book-page="next"/);
  assert.match(html, /data-station="formal"/);
  assert.match(html, /aria-label="2\.3 形式電荷（進行中；紅旗）"/);
  assert.match(html, /data-has-art="true"/);
});

test('bookHTML 節點順序遵守輸入順序（左頁先右頁後）', () => {
  const html = bookHTML({spreads, spread: 0, hero: 'lewis'});
  const ids = spreads[0].nodes.map(node => node.id);
  let lastIndex = -1;
  for (const id of ids) {
    const current = html.indexOf(`data-station="${id}"`);
    assert.ok(current > lastIndex, `節點 ${id} 順序錯誤`);
    lastIndex = current;
  }
  assert.match(html, /class="book-path"/);
  assert.ok(!html.includes('book-side-toggle'));
});

test('bookHTML 支援 side 參數，未提供時依 hero 所在頁決定', () => {
  const forcedRight = bookHTML({spreads, spread: 0, hero: 'lewis', side: 'right'});
  assert.match(forcedRight, /data-book-side="right"/);
  const byHero = bookHTML({spreads, spread: 0, hero: 'acidbase'});
  assert.match(byHero, /data-book-side="right"/);
  const fallback = bookHTML({spreads, spread: 0, hero: 'lewis', side: 'bad'});
  assert.match(fallback, /data-book-side="left"/);
});

test('bookHTML 文字與屬性會跳脫', () => {
  const html = bookHTML({
    spreads: [{
      id: 'sp&x',
      title: '<b>測試</b>',
      chapters: '"章節"',
      art: 'book-spread-1.png',
      nodes: [{id: 'x<y', section: '1.1', title: '<script>bad</script>', state: 'todo', flag: false}]
    }],
    spread: 0,
    hero: 'x<y'
  });
  assert.ok(!html.includes('<script>bad</script>'));
  assert.match(html, /&lt;b&gt;測試&lt;\/b&gt;/);
  assert.match(html, /x&lt;y/);
});

test('layout 與 path helper 可產生穩定結果', () => {
  const {layoutNodes, pathData, normalizeSide} = __bookMapInternals;
  const {points, split} = layoutNodes(spreads[0].nodes);
  assert.equal(points.length, spreads[0].nodes.length);
  assert.equal(split, 3);
  const path = pathData(points, split);
  assert.ok(path.startsWith('M'));
  assert.ok(path.includes('Q') || path.includes('C'));
  assert.equal(normalizeSide('left', 'right'), 'left');
  assert.equal(normalizeSide('bad', 'right'), 'right');
});
