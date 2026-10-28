// Standalone ES-module data for the Figure contract dated 2026-10-26.
// pages always means PDF pages, not printed textbook pages.
// Sources: cards-v2.js and the local OpenStax/McMurry Organic_Chemistry.md.
// Teaching adaptations are identified in the visible notes, not presented as quotations.
// Each card value is one Figure or an ordered, nonempty array of Figures.
//
// Mol conventions: an unlabeled neutral C has implicit H to complete valence four;
// C⁺ has valence three. The hybrid's explicit C label has no implicit H.
// CH₃/CH₂/CH labels contain those H; do not add them again as separate atoms.
// H on heteroatoms is always explicit. A wedge/dash runs from a (narrow) to b.
// Coordinates are drawing coordinates (y downward), not measured bond geometry.
// Skeletal C–C bonds use unit length and 120° zigzags.

const Q = Math.sqrt(3) / 2;
const atom = (id, el, x, y, extra = {}) => ({ id, el, x, y, ...extra });
const bond = (a, b, order = 1, style) =>
  ({ a, b, order, ...(style ? { style } : {}) });
const mark = (atoms, label) => ({ atoms, label });
const reveal = (note, show) => ({ note, show });

function chain(n, doubleAt = 0) {
  return {
    atoms: Array.from({ length: n }, (_, i) => atom(`c${i + 1}`, 'C', i * Q, i % 2 ? -0.5 : 0)),
    bonds: Array.from({ length: n - 1 }, (_, i) => bond(`c${i + 1}`, `c${i + 2}`, i + 1 === doubleAt ? 2 : 1)),
  };
}

function branch(mol, carbon, id = 'm') {
  const c = mol.atoms.find(a => a.id === carbon);
  mol.atoms.push(atom(id, 'C', c.x, c.y - 1));
  mol.bonds.push(bond(carbon, id));
  return mol;
}

function attach(mol, carbon, element, id, dx = 0, dy = -1) {
  const c = mol.atoms.find(a => a.id === carbon);
  mol.atoms.push(atom(id, element, c.x + dx, c.y + dy, { lp: element === 'O' ? 2 : 3 }));
  mol.bonds.push(bond(carbon, id));
  if (element === 'O') {
    mol.atoms.push(atom(`${id}h`, 'H', c.x + dx + Q, c.y + dy + (dy > 0 ? 0.5 : -0.5)));
    mol.bonds.push(bond(id, `${id}h`));
  }
  return mol;
}

function methylHalide(el, partial = false) {
  return {
    atoms: [
      atom('c', 'C', 0, 0, { charge: 0, ...(partial ? { partial: 'δ+' } : {}) }),
      atom('x', el, 1, 0, { lp: 3, charge: 0, ...(partial ? { partial: 'δ−' } : {}) }),
      atom('h1', 'H', -1, 0),
      atom('h2', 'H', 0, -1),
      atom('h3', 'H', 0, 1),
    ],
    bonds: [bond('c', 'x'), bond('c', 'h1'), bond('c', 'h2', 1, 'dash'), bond('c', 'h3', 1, 'wedge')],
  };
}

function oxygenHydride(hydrogens, charge) {
  const positions = [[-Q, 0.5], [Q, 0.5], [0, -1]];
  return {
    atoms: [
      atom('o', 'O', 0, 0, { lp: 4 - hydrogens, charge }),
      ...positions.slice(0, hydrogens).map(([x, y], i) => atom(`h${i + 1}`, 'H', x, y)),
    ],
    bonds: Array.from({ length: hydrogens }, (_, i) => bond('o', `h${i + 1}`)),
  };
}

function acetate(swapped = false) {
  return {
    atoms: [
      atom('m', 'C', -1, 0, { label: 'CH₃' }),
      atom('c', 'C', 0, 0),
      atom('ot', 'O', 0.5, -Q, { lp: swapped ? 3 : 2, charge: swapped ? -1 : 0 }),
      atom('ob', 'O', 0.5, Q, { lp: swapped ? 2 : 3, charge: swapped ? 0 : -1 }),
    ],
    bonds: [bond('m', 'c'), bond('c', 'ot', swapped ? 1 : 2), bond('c', 'ob', swapped ? 2 : 1)],
    arrows: swapped ? [] : [
      { from: { lp: 'ob' }, to: { bond: ['c', 'ob'] } },
      { from: { bond: ['c', 'ot'] }, to: { atom: 'ot' } },
    ],
  };
}

function acetateHybrid() {
  // Only the sigma framework is drawn: the contract has no fractional bond order.
  // Do not invent localized lone pairs or a full formal charge on either oxygen.
  return {
    atoms: [
      atom('m', 'C', -1, 0, { label: 'CH₃' }), atom('c', 'C', 0, 0, { label: 'C' }),
      atom('ot', 'O', 0.5, -Q, { partial: 'δ−' }),
      atom('ob', 'O', 0.5, Q, { partial: 'δ−' }),
    ],
    bonds: [bond('m', 'c'), bond('c', 'ot'), bond('c', 'ob')],
  };
}

function butanolEnantiomer(mirror = false) {
  const mol = {
    atoms: [
      atom('c', 'C', 0, 0),
      atom('o', 'O', 0, -1, { lp: 2 }), atom('oh', 'H', 0.65, -1.5),
      atom('ethyl', 'C', 1, 0.6, { label: 'CH₂' }),
      atom('end', 'C', 2, 0.1, { label: 'CH₃' }),
      atom('methyl', 'C', -1, 0.6, { label: 'CH₃' }), atom('h', 'H', 0, 1),
    ],
    bonds: [
      bond('c', 'o', 1, 'wedge'), bond('o', 'oh'), bond('c', 'ethyl'),
      bond('ethyl', 'end'), bond('c', 'methyl'), bond('c', 'h', 1, 'dash'),
    ],
  };
  // Reflection reverses handedness; swapping labels alone would not suffice.
  if (mirror) mol.atoms.forEach(a => { a.x = -a.x; });
  return mol;
}

function butanePerspective() {
  return {
    atoms: [
      atom('c1', 'C', -1.4, -1, { label: 'CH₃' }), atom('c2', 'C', -0.8, 0),
      atom('c3', 'C', 0.8, 0), atom('c4', 'C', 1.4, 1, { label: 'CH₃' }),
      atom('h2a', 'H', -1.5, 0.55), atom('h2b', 'H', -0.95, 1.1),
      atom('h3a', 'H', 1.5, -0.55), atom('h3b', 'H', 0.95, -1.1),
    ],
    bonds: [
      bond('c1', 'c2'), bond('c2', 'c3'), bond('c3', 'c4'),
      bond('c2', 'h2a', 1, 'wedge'), bond('c2', 'h2b', 1, 'dash'),
      bond('c3', 'h3a', 1, 'dash'), bond('c3', 'h3b', 1, 'wedge'),
    ],
  };
}

function butene2(cis = false) {
  const side = cis ? -1 : 1;
  return {
    atoms: [
      atom('c1', 'C', -0.5, -Q, { label: 'CH₃' }),
      atom('c2', 'C', 0, 0),
      atom('c3', 'C', 1, 0),
      atom('c4', 'C', 1.5, side * Q, { label: 'CH₃' }),
      atom('h2', 'H', -0.5, Q),
      atom('h3', 'H', 1.5, -side * Q),
    ],
    bonds: [bond('c1', 'c2'), bond('c2', 'c3', 2), bond('c3', 'c4'), bond('c2', 'h2'), bond('c3', 'h3')],
  };
}

// Disconnected species share one Mol only when a panel contains several reagents.
// Prefixes prevent atom-id collisions; no covalent bond is used for hydrogen bonding.
function mixture(parts) {
  const result = { atoms: [], bonds: [] };
  for (const [prefix, mol, dx, dy = 0] of parts) {
    result.atoms.push(...mol.atoms.map(a => ({ ...a, id: `${prefix}${a.id}`, x: a.x + dx, y: a.y + dy })));
    result.bonds.push(...mol.bonds.map(b => ({ ...b, a: `${prefix}${b.a}`, b: `${prefix}${b.b}` })));
  }
  return result;
}

function ether() {
  return {
    atoms: [atom('c1', 'C', -Q, 0.5), atom('o', 'O', 0, 0, { lp: 2 }), atom('c2', 'C', Q, 0.5)],
    bonds: [bond('c1', 'o'), bond('o', 'c2')],
  };
}

function acetone() {
  return {
    atoms: [
      atom('c1', 'C', -Q, 0.5), atom('c2', 'C', 0, 0),
      atom('c3', 'C', Q, 0.5), atom('o', 'O', 0, -1, { lp: 2 }),
    ],
    bonds: [bond('c1', 'c2'), bond('c2', 'c3'), bond('c2', 'o', 2)],
  };
}

function tertiaryAlcohol() {
  return attach(branch(chain(4), 'c2'), 'c2', 'O', 'o', 0, 1);
}

function tertiaryBromide() {
  return attach(branch(chain(4), 'c2'), 'c2', 'Br', 'br', 0, 1);
}

function tertiaryEther() {
  const mol = tertiaryAlcohol();
  mol.atoms = mol.atoms.filter(a => a.id !== 'oh');
  mol.bonds = mol.bonds.filter(b => b.b !== 'oh');
  const o = mol.atoms.find(a => a.id === 'o');
  mol.atoms.push(atom('e1', 'C', o.x + Q, o.y + 0.5), atom('e2', 'C', o.x + 2 * Q, o.y));
  mol.bonds.push(bond('o', 'e1'), bond('e1', 'e2'));
  return mol;
}

function tertButanol(alkoxide = false) {
  const mol = attach(branch(chain(3), 'c2'), 'c2', 'O', 'o', 0, 1);
  if (alkoxide) {
    mol.atoms = mol.atoms.filter(a => a.id !== 'oh');
    mol.bonds = mol.bonds.filter(b => b.b !== 'oh');
    Object.assign(mol.atoms.find(a => a.id === 'o'), { charge: -1, lp: 3 });
  }
  return mol;
}

// Br⁻ has four lone pairs, outside lp:0–3. Omit lp, retain charge, explain in text.
const bromideIon = () => ({ atoms: [atom('br', 'Br', 0, 0, { charge: -1 })], bonds: [] });

function additionStart() {
  const mol = mixture([['e', ethene(), 0], ['a', hbr(), 2, -1]]);
  mol.arrows = [
    { from: { bond: ['ec1', 'ec2'] }, to: { atom: 'ah' } },
    { from: { bond: ['ah', 'abr'] }, to: { atom: 'abr' } },
  ];
  return mol;
}

function additionIntermediate() {
  const cation = {
    atoms: [atom('c1', 'C', 0, 0, { label: 'CH₃' }), atom('c2', 'C', 1, 0, { label: 'CH₂', charge: 1 })],
    bonds: [bond('c1', 'c2')],
  };
  const mol = mixture([['e', cation, 0], ['x', bromideIon(), 3]]);
  mol.arrows = [{ from: { atom: 'xbr' }, to: { atom: 'ec2' } }];
  return mol;
}

function substitutionStart() {
  const mol = mixture([['s', methylHalide('Br'), 0], ['n', oxygenHydride(1, -1), -3]]);
  mol.arrows = [
    { from: { lp: 'no' }, to: { atom: 'sc' } },
    { from: { bond: ['sc', 'sx'] }, to: { atom: 'sx' } },
  ];
  return mol;
}

function eliminationStart() {
  return mixture([
    ['s', attach(chain(3), 'c2', 'Br', 'br'), 0],
    ['b', tertButanol(true), 4],
  ]);
}

function eliminationProducts() {
  return mixture([
    ['p', chain(3, 1), 0], ['a', tertButanol(), 4], ['x', bromideIon(), 8],
  ]);
}

function rearrangement(after = false) {
  const mol = branch(chain(4), 'c3');
  mol.atoms.push(atom('h', 'H', 1.3, 1));
  mol.bonds.push(bond(after ? 'c2' : 'c3', 'h'));
  mol.atoms.find(a => a.id === (after ? 'c3' : 'c2')).charge = 1;
  if (!after) mol.arrows = [{ from: { bond: ['c3', 'h'] }, to: { atom: 'c2' } }];
  return mol;
}

function methylbutene2() {
  // Three sp² substituent directions 120° apart; no E/Z because C2 has two methyls.
  return {
    atoms: [
      atom('c1', 'C', -0.5, -Q), atom('c2', 'C', 0, 0),
      atom('c3', 'C', 1, 0), atom('c4', 'C', 1.5, Q), atom('m', 'C', -0.5, Q),
    ],
    bonds: [bond('c1', 'c2'), bond('c2', 'c3', 2), bond('c3', 'c4'), bond('c2', 'm')],
  };
}

const parentFour = () => mark(['c1', 'c2', 'c3', 'c4'], '主鏈四碳；依序編為 1 → 2 → 3 → 4');
const ethene = () => ({
  atoms: [atom('c1', 'C', 0, 0, { label: 'CH₂' }), atom('c2', 'C', 1, 0, { label: 'CH₂' })],
  bonds: [bond('c1', 'c2', 2)],
});
const hbr = () => ({
  atoms: [atom('h', 'H', 0, 0), atom('br', 'Br', 1, 0, { lp: 3 })],
  bonds: [bond('h', 'br')],
});

export const FIGURES = {
  lewis: {
    kind: 'structure-steps',
    title: 'CH₃Cl：四對成鍵電子，加上 Cl 的三對孤對電子',
    pages: [31, 32, 33],
    mols: [methylHalide('Cl')],
    joiner: null,
    steps: [
      reveal('碳與三個 H、一個 Cl 各形成單鍵：四條線代表 8 個成鍵電子。楔形／虛楔形表示前後方向，平面角度不是實際鍵角。', { lp: false, charges: false, highlight: ['c'] }),
      reveal('顯示 Cl 上三對孤對電子，共 6 個非鍵結電子。', { lp: true, highlight: ['x'] }),
      reveal('總計 14 個價電子：C 的 4 ＋ 三個 H 的 3 ＋ Cl 的 7。碳與氯滿足八隅體，H 滿足雙電子。', { lp: true, highlight: ['c', 'x'] }),
    ],
  },
  formal: {
    kind: 'structure-steps',
    title: '由左到右：H₂O、OH⁻、H₃O⁺ 的氧如何記帳',
    pages: [60, 61],
    mols: [oxygenHydride(2, 0), oxygenHydride(1, -1), oxygenHydride(3, 1)],
    joiner: null,
    steps: [
      reveal('先數氧上的鍵與孤對：依序為 2 鍵／2 對、1 鍵／3 對、3 鍵／1 對。三圖是比較，沒有表示轉換機構。', { lp: true, charges: false, highlight: ['o'] }),
      reveal('中性氧原有 6 個價電子，因此形式電荷＝6 − 非鍵結電子數 − 鍵級總和。H₂O：6−4−2＝0；OH⁻：6−6−1＝−1；H₃O⁺：6−2−3＝+1。', { lp: true, charges: true, highlight: ['o'] }),
      reveal('每個 H 的形式電荷都是 0；各圖總電荷依序為 0、−1、+1。形成 H₃O⁺ 是接受 H⁺，不是移走水的一個電子。', { lp: true, charges: true }),
    ],
  },
  polarity: {
    kind: 'structure-steps',
    title: 'CH₃Br：Cδ+–Brδ−，兩個原子的形式電荷仍為 0',
    pages: [56, 60, 61],
    mols: [methylHalide('Br', true)],
    steps: [
      reveal('Br 比 C 更吸引共用電子；C–Br 鍵的電子密度偏向 Br。', { partials: true, charges: false, highlight: ['c', 'x'] }),
      reveal('碳有四鍵；Br 有一鍵與三對孤對。按均分鍵電子的規則記帳，兩者形式電荷都是 0。', { lp: true, partials: true, charges: true }),
      reveal('δ 是電子分布的部分電荷，不能當作完整的 +1／−1，也不能用它直接決定反應機構。', { lp: true, partials: true, charges: true, highlight: ['c'] }),
    ],
  },
  resonance: [{
    kind: 'structure-steps',
    title: '乙酸根：原子不動，兩組電子對共同改變畫法',
    pages: [62, 63, 64],
    mols: [acetate(), acetate(true)],
    joiner: '↔',
    steps: [
      reveal('兩幅圖的原子位置與連接完全相同；單鍵氧有三對孤對及 −1，雙鍵氧有兩對孤對。', { lp: true, charges: true, arrows: false }),
      reveal('兩支彎箭頭要一起讀：單鍵氧的孤對形成 π 鍵；原 C=O 的 π 電子移到另一個氧。碳沒有五鍵的中間體。', { lp: true, charges: true, arrows: true, highlight: ['ot', 'ob'] }),
      reveal('↔ 連的是同一乙酸根的共振式，不是 ⇌ 平衡。真實兩條 C–O 等長，負電分散在兩個氧；兩式總電荷皆 −1。', { lp: true, charges: true, arrows: false }),
    ],
  }, {
    kind: 'structure-steps',
    title: '第三格｜共振混成體：同一個乙酸根，總電荷 −1',
    pages: [62, 63, 64],
    mols: [acetateHybrid()],
    joiner: null,
    steps: [
      reveal('這是前兩個共振式共同描述的真實分子，不是分子在兩式之間跳動。兩個等價氧的 δ− 表示負電平均分布；在這個對稱共振模型中，各分擔約一半的淨負電。', { partials: true, charges: false, lp: false, highlight: ['ot', 'ob'] }),
      reveal('圖上兩條相同的 C–O 線只表示 σ 骨架；另有離域的 π 成鍵分布在 O–C–O 上，兩鍵等長、平均鍵級約 1.5。中央碳沒有 H；這不是兩條普通單鍵的完整路易士式，也不以兩個 −1 取代 δ−。', { partials: true, charges: false, lp: false, highlight: ['c', 'ot', 'ob'] }),
    ],
  }],
  functional: {
    kind: 'name-pair',
    title: '看完整連接：醇、醚、烯與鹵烷',
    pages: [90, 91, 93],
    items: [
      { name: '乙醇 ethanol：C–O–H（卡片教學例）', mol: attach(chain(2), 'c2', 'O', 'o'), highlight: [mark(['c1', 'c2'], '兩碳骨架'), mark(['c2', 'o', 'oh'], '飽和碳上的羥基：醇')] },
      { name: '二甲醚 dimethyl ether：C–O–C', mol: ether(), highlight: [mark(['c1', 'o', 'c2'], '氧接兩個碳，沒有 O–H：醚')] },
      { name: '乙烯 ethene：C=C', mol: ethene(), highlight: [mark(['c1', 'c2'], '碳碳雙鍵：烯')] },
      { name: '氯甲烷 chloromethane：C–Cl', mol: methylHalide('Cl'), highlight: [mark(['c', 'x'], '鹵素接飽和碳：鹵烷')] },
    ],
  },
  naming: {
    kind: 'name-pair',
    title: '最長鏈與最低位置：2-甲基丁烷',
    pages: [102, 103, 104],
    items: [{
      name: '2-甲基丁烷（2-methylbutane；卡片教學例）',
      mol: branch(chain(4), 'c2'),
      highlight: [parentFour(), mark(['c2'], '雙向編號比較：從左端數支鏈在 2，從右端數在 3；取較小的 2'), mark(['m'], '甲基支鏈，不併入主鏈總長')],
    }],
  },
  'alkene-name': {
    kind: 'name-pair',
    title: '先編雙鍵位置，再分別比較雙鍵兩端的 CIP 優先序',
    pages: [229, 231, 232, 233],
    items: [
      {
        name: '順-2-丁烯 cis-but-2-ene ＝ (Z)-but-2-ene',
        mol: butene2(true),
        highlight: [parentFour(), mark(['c2', 'c3'], '雙鍵位置 2'), mark(['c1', 'h2'], '步驟 1：左端比較直接相連原子，C（原子序 6）> H（1）'), mark(['c4', 'h3'], '步驟 2：右端獨立比較，也是 C（6）> H（1）；若首層同元素，再逐層比較'), mark(['c1', 'c4'], '步驟 3：兩端各自較優先的 CH₃ 同側：Z；本例也叫 cis')],
      },
      {
        name: '反-2-丁烯 trans-but-2-ene ＝ (E)-but-2-ene',
        mol: butene2(false),
        highlight: [parentFour(), mark(['c2', 'c3'], '雙鍵位置 2'), mark(['c1', 'h2'], '步驟 1：左端比較直接相連原子，C（原子序 6）> H（1）'), mark(['c4', 'h3'], '步驟 2：右端獨立比較，也是 C（6）> H（1）；若首層同元素，再逐層比較'), mark(['c1', 'c4'], '步驟 3：兩端各自較優先的 CH₃ 異側：E；本例也叫 trans')],
      },
      {
        name: '2-甲基-1-丁烯（2-methylbut-1-ene；卡片教學例）',
        mol: branch(chain(4, 1), 'c2'),
        highlight: [parentFour(), mark(['c1', 'c2'], '雙鍵位置 1 優先；C1 是 CH₂，沒有 E/Z'), mark(['c2', 'm'], '甲基位於 2；cis/Z、trans/E 不是普遍同義詞')],
      },
    ],
  },
  'alcohol-name': [{
    kind: 'name-pair',
    title: '羥基先取得較小編號：位置不等於級數',
    pages: [588, 589],
    items: [{
      name: '1-丁醇（butan-1-ol）：一級醇 1°',
      mol: attach(chain(4), 'c1', 'O', 'o'),
      highlight: [parentFour(), mark(['c1', 'o', 'oh'], 'OH 在 1 號碳'), mark(['c1', 'c2'], '帶 OH 的碳只直接接 1 個碳：1°')],
    }, {
      name: '2-丁醇（butan-2-ol／2-butanol；卡片教學例，未指定 R/S）',
      mol: attach(chain(4), 'c2', 'O', 'o'),
      highlight: [parentFour(), mark(['c2', 'o', 'oh'], '羥基在 2 號碳'), mark(['c1', 'c2', 'c3'], '帶 OH 的碳直接接兩個碳：二級醇')],
    }, {
      name: '2-甲基-2-丙醇（2-methylpropan-2-ol）：三級醇 3°',
      mol: tertButanol(),
      highlight: [mark(['c1', 'c2', 'c3'], '最長主鏈三碳；OH 與甲基都在 2 號'), mark(['c2', 'o', 'oh'], 'OH 在 2 號碳'), mark(['c2', 'c1', 'c3', 'm'], '帶 OH 的碳直接接 3 個碳：3°')],
    }],
  }, {
    kind: 'structure-steps',
    title: '由左到右並列：1-丁醇（1°）、2-丁醇（2°）、2-甲基-2-丙醇（3°）',
    pages: [588, 589],
    // Distinct prefixes keep each step's highlight local to the intended molecule.
    mols: [
      mixture([['p', attach(chain(4), 'c1', 'O', 'o'), 0]]),
      mixture([['s', attach(chain(4), 'c2', 'O', 'o'), 0]]),
      mixture([['t', tertButanol(), 0]]),
    ],
    joiner: null,
    steps: [
      reveal('左：找帶 OH 的碳，再數直接連接的碳；亮起的中心碳只接 1 個碳，所以是 1° 醇。', { highlight: ['pc1', 'pc2'] }),
      reveal('中：帶 OH 的中心碳直接接 2 個碳，所以是 2° 醇。只數碳鄰居，不把 O 或 H 算進去。', { highlight: ['sc2', 'sc1', 'sc3'] }),
      reveal('右：帶 OH 的中心碳直接接 3 個碳，所以是 3° 醇。中、右兩例的 OH 都在 2 號，級數卻不同；位置編號不等於級數。', { highlight: ['tc2', 'tc1', 'tc3', 'tm'] }),
    ],
  }],
  'halide-name': {
    kind: 'name-pair',
    title: 'Br 的位置編號與受質級數要分開看',
    pages: [334, 335],
    items: [
      {
        name: '2-溴丁烷（2-bromobutane；卡片教學例，未指定 R/S）',
        mol: attach(chain(4), 'c2', 'Br', 'br'),
        highlight: [parentFour(), mark(['c2', 'br'], 'Br 在 2 號'), mark(['c1', 'c2', 'c3'], '帶 Br 的碳接兩個碳：二級')],
      },
      {
        name: '2-溴-2-甲基丁烷（2-bromo-2-methylbutane；卡片教學例）',
        mol: tertiaryBromide(),
        highlight: [parentFour(), mark(['c2', 'br', 'm'], '溴與甲基都在 2 號'), mark(['c1', 'c2', 'c3', 'm'], '帶 Br 的碳接三個碳：三級')],
      },
    ],
  },
  conformation: [{
    kind: 'structure-steps',
    title: '先看楔形透視丁烷，再沿 C2 → C3 看成 Newman 投影',
    pages: [108, 109, 110, 111],
    mols: [butanePerspective()],
    joiner: null,
    steps: [
      reveal('先認出中間的 C2–C3 單鍵；兩端 CH₃ 分別是 C1、C4。實楔朝向你，虛楔遠離你；這是丁烷 anti 構形的透視畫法。', { highlight: ['c2', 'c3'] }),
      reveal('把視線放在圖的左側，沿 C2 → C3 軸往右看：C2 成為前碳的中心點，C3 成為後碳的圓圈；兩碳在視線上重合，但沒有合成一個原子。', { highlight: ['c2', 'c3'] }),
      reveal('前碳接 CH₃、H、H；後碳也接 CH₃、H、H。投影後兩個 CH₃ 一上一下，相隔 180°；往下看 Newman 模型的 anti 起始格，再轉動 C–C 鍵比較。', { highlight: ['c1', 'c4'] }),
    ],
  }, {
    kind: 'newman',
    title: '沿丁烷 C2 → C3 看：C2 在前、C3 在後',
    pages: [108, 109, 110, 111],
    // dihedral is the CH₃(front[0])–C2–C3–CH₃(back[0]) torsion.
    front: ['CH₃', 'H', 'H'],
    back: ['CH₃', 'H', 'H'],
    frames: [
      { dihedral: 180, label: 'anti · staggered 交錯式', note: '兩甲基相隔 180°，丁烷最低能量的構形；不用斷鍵即可旋轉。' },
      { dihedral: 120, label: 'eclipsed 重疊式', note: '兩組 CH₃/H 及一組 H/H 重疊，能量高於交錯式。' },
      { dihedral: 60, label: 'gauche · staggered 交錯式', note: '兩甲基相隔 60°，仍是交錯式；因甲基接近，能量高於 anti。' },
      { dihedral: 0, label: 'eclipsed 全重疊式', note: '兩甲基彼此重疊，是這組丁烷構形中能量最高者。' },
    ],
  }],
  chair: [{
    kind: 'chair',
    title: '甲基環己烷：翻環交換位置，但保持朝上／朝下',
    pages: [132, 133, 134, 135, 136, 137],
    // Unflipped convention: C1 axial up; successive axial directions alternate.
    substituents: [{ carbon: 1, position: 'axial', label: 'CH₃' }],
    frames: [
      { flip: false, note: 'C1 的甲基軸向朝上，與 C3、C5 同側軸向 H 有 1,3-雙軸向作用，較不穩定。' },
      { flip: true, note: '翻環後甲基赤道朝上，較穩定；up/down 保持，axial/equatorial 交換。' },
    ],
  }, {
    kind: 'chair',
    title: 'trans-1,2-二甲基環己烷：雙軸向與雙赤道向的翻環',
    pages: [138, 139, 140, 383, 384],
    // C1 axial up and C2 axial down remain on opposite faces after the flip.
    substituents: [
      { carbon: 1, position: 'axial', label: 'CH₃' },
      { carbon: 2, position: 'axial', label: 'CH₃' },
    ],
    frames: [
      { flip: false, note: 'C1 的 CH₃ 軸向朝上、C2 的 CH₃ 軸向朝下：兩個都軸向且一上一下，稱為反式雙軸向（trans-diaxial）。兩甲基合計與同側軸向 H 有四組 1,3-雙軸向作用，較不穩定。銜接 E2：反應需要的是離去基與鄰碳 H 採這種排列，使 C–離去基鍵與 C–H 鍵呈反式共平面（二面角約 180°）；本圖的兩個 CH₃ 只用來辨認方向，不是被消去的一對基團。' },
      { flip: true, note: '翻環後 C1 的 CH₃ 赤道朝上、C2 的 CH₃ 赤道朝下：兩個都赤道向，仍為 trans。避開四組甲基與軸向 H 的 1,3-雙軸向作用後，雖仍有兩甲基接近的作用，仍比雙軸向構形低 11.4 kJ/mol，因此較穩定。後續 E2 若離去基在赤道向，須先翻環並確認鄰碳有軸向 H；雙赤道向的這對鍵不符合反式共平面的要求。' },
    ],
  }],
  chirality: [{
    kind: 'chirality',
    title: '指定空間排列的 (R)-2-丁醇：OH > CH₂CH₃ > CH₃ > H',
    pages: [157, 161, 162, 163],
    groups: [
      { label: 'OH', priority: 1 }, { label: 'CH₂CH₃', priority: 2 },
      { label: 'CH₃', priority: 3 }, { label: 'H', priority: 4 },
    ],
    steps: [
      { note: '四面體中心接四種不同基團。本模型選定 R 對映異構物作教學例；單看 CH₃CH(OH)CH₂CH₃ 無法指定 R/S。', show: 'groups' },
      { note: 'O > C > H；兩個 C 基團再比下一層，乙基的 [C,H,H] 高於甲基的 [H,H,H]。', show: 'priorities' },
      { note: '把最低優先序 4（H）轉到遠離眼睛的後方，再從中心朝 H 的方向看；虛楔朝後、實楔朝前。若 H 朝前，讀到的順逆時針必須反轉；轉動整個模型不改變組態。', show: 'orient' },
      { note: '在 H 朝後的視角，OH → CH₂CH₃ → CH₃ 順時針，故為 R；鏡像為 S。R/S 不代表旋光正負。', show: 'direction' },
    ],
    answer: 'R',
  }, {
    kind: 'schematic',
    title: '鏡像不可疊合：同樣的連接，兩種不同的空間排列',
    pages: [157, 161, 162, 163],
    joiner: 'vs',
    panels: [
      { caption: '(R)-2-丁醇', mol: butanolEnantiomer(), text: '最低優先序 H 以虛楔朝後；OH 的實楔朝前。1（OH）→ 2（乙基）→ 3（甲基）為順時針，所以是 R。' },
      { caption: '(S)-2-丁醇：左圖的鏡像', mol: butanolEnantiomer(true), text: '同樣讓 H 朝後，1 → 2 → 3 改為逆時針，所以是 S。這對鏡像不能只靠平移、旋轉而使四個基團全部重合，因此不可疊合；R/S 不代表旋光正負。' },
    ],
  }],
  'chair-e2': {
    kind: 'chair',
    title: '氯環己烷的 anti E2：C1–Cl 與 C2–H 反式雙軸向',
    pages: [133, 383, 384],
    substituents: [
      { carbon: 1, position: 'axial', label: 'Cl' },
      { carbon: 2, position: 'axial', label: 'H' },
    ],
    frames: [
      { flip: false, note: 'C1（α）的 Cl 軸向朝上；C2（β）的 H 軸向朝下。兩者 trans-diaxial，符合 anti-periplanar；消去後 C1=C2。C6 也有等價的軸向 β-H。' },
      { flip: true, note: '翻環後 Cl 與標出的 H 都在赤道，但原來上下方向不變。這個構形不符合本卡的 anti E2；必須回到反式雙軸向構形。' },
    ],
  },
  reactions: [{
    kind: 'schematic',
    title: '① 加成：乙烯 ＋ HBr → 溴乙烷',
    pages: [190, 191, 194],
    joiner: '→',
    panels: [
      { caption: '反應前：CH₂=CH₂ ＋ HBr', mol: additionStart(), text: '無過氧化物的離子型加成。兩支彎箭頭同時讀：π 電子進攻 H，H–Br 鍵電子移給 Br；先形成一條 C–H 鍵。' },
      { caption: '中間步驟：乙基碳陽離子 ＋ Br⁻', mol: additionIntermediate(), text: 'Br⁻ 的一對孤對電子進攻帶正電的碳，形成 C–Br。此處箭頭從 Br 原子起畫；Br⁻ 有四對孤對電子，圖中未畫出。中間體不是可分離的最終產物。' },
      { caption: '反應後：CH₃CH₂Br', mol: attach(chain(2), 'c2', 'Br', 'br'), text: '雙鍵變單鍵，雙鍵兩端分別加上 H、Br；原子總數不變，各格總電荷均為 0。' },
    ],
  }, {
    kind: 'schematic',
    title: '② 取代：溴甲烷 ＋ OH⁻ → 甲醇 ＋ Br⁻',
    pages: [190, 191, 194],
    joiner: '→',
    panels: [
      { caption: '反應前：CH₃Br ＋ OH⁻', mol: substitutionStart(), text: '卡片教學例：SN2。OH⁻ 的氧以孤對電子從 C–Br 的背面進攻碳；同時 C–Br 鍵電子移到 Br。兩支彎箭頭表示同一步，不經過五鍵碳中間體。' },
      { caption: '反應後：CH₃OH ＋ Br⁻', mol: mixture([['p', attach(chain(1), 'c1', 'O', 'o'), 0], ['x', bromideIon(), 3]]), text: '形成 C–O、斷開 C–Br，OH 取代 Br；原子總數不變，兩邊總電荷均為 −1。游離 Br⁻ 有四對孤對電子，圖中未畫出。' },
    ],
  }, {
    kind: 'schematic',
    title: '③ 消去：2-溴丙烷 ＋ 強鹼 → 丙烯 ＋ 共軛酸 ＋ Br⁻',
    pages: [190, 191, 194, 383, 387],
    joiner: '→',
    panels: [
      { caption: '反應前：2-溴丙烷 ＋ 第三級丁氧負離子 t-BuO⁻', mol: eliminationStart(), text: '卡片教學例：使用強鹼 t-BuOK，K⁺ 是未畫出的旁觀離子。E2 在 β-H 與 C–Br 呈反式共平面時進行；鹼移走鄰碳的 H，同步形成 C=C 並釋出 Br⁻。' },
      { caption: '反應後：丙烯 ＋ 第三級丁醇 t-BuOH ＋ Br⁻', mol: eliminationProducts(), text: '受質相鄰的兩個碳失去 H 與 Br，原單鍵變雙鍵；鹼取得 H，成為共軛酸。原子守恆，兩邊總電荷均為 −1；Br⁻ 有四對未畫出的孤對電子。此圖呈現消去途徑，不宣稱取代完全不會發生。' },
    ],
  }, {
    kind: 'schematic',
    title: '④ 重排：1,2-氫負離子轉移，二級碳陽離子變三級',
    pages: [190, 191, 194],
    joiner: '→',
    panels: [
      { caption: '重排前：CH₃–CH⁺–CH(CH₃)–CH₃', mol: rearrangement(), text: '教學補充：標出的 H 與原 C–H 鍵電子對一起移向相鄰正電碳；彎箭頭從 C–H 鍵出發。這是反應中間體的重排，不是游離 H⁺ 移動。' },
      { caption: '重排後：CH₃–CH₂–C⁺(CH₃)–CH₃', mol: rearrangement(true), text: 'H 換了連接位置，正電轉移到原來失去 H 的碳，成為較穩定的三級碳陽離子。碳骨架不變、分子式皆為 C₅H₁₁⁺；此處是中間體轉換，後續仍可被親核劑捕捉。' },
    ],
  }],
  solvent: {
    kind: 'schematic',
    title: '質子性與極性非質子性：比較 O–H 氫鍵供體',
    pages: [76, 77, 367, 374, 375],
    joiner: 'vs',
    panels: [
      { caption: '乙醇：質子性溶劑', mol: attach(chain(2), 'c2', 'O', 'o'), text: '有 O–H，可向陰離子提供氫鍵並使其溶劑化；對適合受質，極性質子性介質可協助 SN1 離解。氫鍵不是新增共價鍵。' },
      { caption: '丙酮 acetone：極性非質子性溶劑', mol: acetone(), text: 'C=O 有極性，但沒有 O–H／N–H 氫鍵供體；陰離子較少被這類氫鍵包圍，常有利 SN2。仍須檢查受質、親核劑及離子配對，不能說陰離子完全未溶劑化。' },
    ],
  },
  heat: {
    kind: 'schematic',
    title: '教學補充｜消去的粒子數：1 個受質 ＋ 1 個鹼 → 3 個粒子',
    pages: [204, 205, 387],
    joiner: '→',
    panels: [
      { caption: '反應前：2 個粒子（1 個受質 ＋ 1 個鹼）', mol: eliminationStart(), text: '1 個 2-溴丙烷分子 ＋ 1 個 t-BuO⁻ 離子。此處計數包含離子，所以稱「粒子數」；溶劑與兩邊相同的 K⁺ 旁觀離子都未畫出。' },
      { caption: '反應後：3 個粒子（1 個烯 ＋ 1 個共軛酸 ＋ 1 個 X⁻）', mol: eliminationProducts(), text: '1 個丙烯分子 ＋ 1 個 t-BuOH 分子 ＋ 1 個 Br⁻ 離子（本例 X＝Br；四對孤對電子未畫出）。教學補充：粒子增多可幫助理解分散的可能性，但溶劑化等因素也影響熵，不能只靠 2 → 3 就判定熵變為正。ΔG＝ΔH−TΔS；若 ΔS>0，升溫使熵項更有利。加熱常提高消去比例，實際比例仍取決於競爭途徑的活化自由能，不能只由粒子數或反應自由能判定。' },
    ],
  },
  equilibrium: {
    kind: 'schematic',
    title: '2-甲基-2-丁醇 ⇌ 2-甲基-2-丁烯 ＋ 水',
    pages: [204, 205, 604, 605],
    // The contract has no equilibrium joiner. Keep ⇌ in the title/text, never ↔ or →.
    joiner: null,
    panels: [
      { caption: '醇端：2-甲基-2-丁醇', mol: tertiaryAlcohol(), text: '酸催化可逆系統：醇 ⇌ 烯＋水。教學補充：提高水的活度有利加水生成醇；催化劑加速正逆反應，不改變固定溫度的平衡常數。' },
      { caption: '烯＋水端：以主要烯表示', mol: mixture([['p', methylbutene2(), 0], ['w', oxygenHydride(2, 0), 4]]), text: '酸催化並加熱，持續蒸出烯可使脫水繼續。2-甲基-2-丁烯是主要產物，另有 2-甲基-1-丁烯；移除產物改變組成，不是改變固定溫度的 K。' },
      { caption: '平衡量與反應方向', text: 'ΔG°＝−RT ln K；ΔG＝ΔG°＋RT ln Q。移除烯降低脫水反應的 Q，使系統再向產物端反應。ΔG°<0 表示 K>1，不代表反應一定很快。' },
    ],
  },
  zaitsev: {
    kind: 'schematic',
    title: '2-溴丁烷消去：先檢查幾何，再比較取代數',
    pages: [235, 236, 378, 383, 387, 399],
    joiner: null,
    panels: [
      { caption: '共同受質：2-溴丁烷', mol: attach(chain(4), 'c2', 'Br', 'br'), text: '卡片教學例：C2 是 α 碳，C1、C3 是兩側 β 碳；只有能符合反應幾何的 β-H 才能參與 anti E2。' },
      { caption: 'Zaitsev：2-丁烯，雙取代', mol: butene2(false), text: '從 C3 移除 β-H，形成 C2=C3。一般較小的強鹼常以 2-丁烯為主；此圖選畫 E 異構物，Z 異構物也可能生成。' },
      { caption: '較少取代：1-丁烯，單取代', mol: chain(4, 1), text: '從 C1 移除 β-H，形成 C1=C2。教學補充：體積大的 t-BuO⁻ 常提高此產物比例，不保證所有條件下都成主產物。這種區域選擇性與季銨鹽的 Hofmann 消去不能視為同一套反應條件。' },
    ],
  },
};
