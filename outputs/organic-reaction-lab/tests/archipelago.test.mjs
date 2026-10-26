import assert from 'node:assert/strict';
import test from 'node:test';
import {archipelagoHTML, worldMapHTML} from '../archipelago-art.js';

test('worldMapHTML 依約定輸出四個群島按鈕與狀態', () => {
  const html = worldMapHTML({
    archipelagos: [
      {id: 'prep', name: '先備群島', theme: 'prep', state: 'done', flag: false, current: false, progress: {done: 3, total: 3}},
      {id: 'alkene', name: '烯的<加成>&群島', theme: 'alkene', state: 'open', flag: true, current: false, progress: {done: 1, total: 4}},
      {id: 'subelim', name: '取代與消去群島', theme: 'subelim', state: 'open', flag: false, current: false, progress: {done: 2, total: 4}},
      {id: 'summit', name: '醇與總整理群島', theme: 'summit', state: 'fog', flag: false, current: false, progress: {done: 0, total: 2}},
    ],
    boat: 'subelim',
  });

  assert.equal((html.match(/data-archipelago="/g) || []).length, 4);
  assert.match(html, /data-archipelago="prep"/);
  assert.match(html, /data-arch-state="done"/);
  assert.match(html, /data-arch-state="open"/);
  assert.match(html, /data-arch-state="fog"/);
  assert.match(html, /有紅旗需回看/);
  assert.match(html, /目前位置/);
  assert.equal(html.includes('烯的<加成>&群島'), false);
  assert.match(html, /烯的&lt;加成&gt;&amp;群島/);
});

test('archipelagoHTML 依約定輸出島嶼按鈕、返回鈕與 prep 標籤', () => {
  const html = archipelagoHTML({
    archipelago: {id: 'prep', name: '先備群島', theme: 'prep', state: 'open'},
    islands: [
      {id: 'w1', name: '結構與電子', full: '第 1–2 章', state: 'done', flag: false, prep: 'ready'},
      {id: 'w2', name: '命名與空間', full: '第 3–5 章', state: 'open', flag: true, prep: 'review'},
      {id: 'w3', name: '反應語言', full: '第 6 章', state: 'fog', flag: false, prep: null},
      {id: 'xss', name: '測試<script>alert(1)</script>', full: '危險字元 & 轉義', state: 'open', flag: false, prep: null},
    ],
    boat: 1,
  });

  assert.equal((html.match(/data-island="/g) || []).length, 4);
  assert.equal((html.match(/data-go-world/g) || []).length, 1);
  assert.match(html, /data-isle-state="done"/);
  assert.match(html, /data-isle-state="open"/);
  assert.match(html, /data-isle-state="fog"/);
  assert.match(html, /已具備/);
  assert.match(html, /待補強/);
  assert.match(html, /有紅旗需回看/);
  assert.equal(html.includes('<script>alert(1)</script>'), false);
  assert.match(html, /測試&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /危險字元 &amp; 轉義/);
});
