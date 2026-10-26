import test from 'node:test';
import assert from 'node:assert/strict';
import { FIGURES } from '../figures-v3.js';

const required = 'lewis formal polarity resonance functional naming alkene-name alcohol-name halide-name conformation chair chirality chair-e2 reactions solvent heat equilibrium zaitsev'.split(' ');
const figures = value => Array.isArray(value) ? value : [value];
const molecules = figure => figure.mols ?? figure.items?.map(item => item.mol)
  ?? figure.panels?.flatMap(panel => panel.mol ? [panel.mol] : []) ?? [];
const allFigures = Object.values(FIGURES).flatMap(figures);
const neighbors = (mol, id) => mol.bonds.flatMap(b => b.a === id ? [b.b] : b.b === id ? [b.a] : []);
const getAtom = (mol, id) => mol.atoms.find(a => a.id === id);
const orderSum = (mol, id) => mol.bonds.reduce((sum, b) => sum + (b.a === id || b.b === id ? b.order : 0), 0);
const charge = mol => mol.atoms.reduce((sum, a) => sum + (a.charge ?? 0), 0);
const words = figure => JSON.stringify(figure);

function validateMol(mol) {
  assert.ok(mol.atoms.length);
  const ids = new Set(mol.atoms.map(a => a.id));
  assert.equal(ids.size, mol.atoms.length);
  const has = id => assert.ok(ids.has(id), `unknown atom ${id}`);
  for (const a of mol.atoms) {
    assert.ok(typeof a.id === 'string' && a.id);
    assert.match(a.el, /^[A-Z][a-z]?$/);
    assert.ok(Number.isFinite(a.x) && Number.isFinite(a.y));
    if (a.lp !== undefined) assert.ok(Number.isInteger(a.lp) && a.lp >= 0 && a.lp <= 3);
    if (a.charge !== undefined) assert.ok([-1, 0, 1].includes(a.charge));
    if (a.partial !== undefined) assert.ok(['δ+', 'δ−'].includes(a.partial));
    if (a.label !== undefined) assert.ok(typeof a.label === 'string' && a.label);
  }
  const edges = new Set();
  for (const b of mol.bonds) {
    has(b.a); has(b.b);
    assert.notEqual(b.a, b.b);
    assert.ok([1, 2, 3].includes(b.order));
    if (b.style !== undefined) {
      assert.ok(['wedge', 'dash'].includes(b.style));
      assert.equal(b.order, 1);
    }
    const key = [b.a, b.b].sort().join(':');
    assert.ok(!edges.has(key), `duplicate bond ${key}`);
    edges.add(key);
  }
  function endpoint(value, source) {
    assert.equal(Object.keys(value).length, 1);
    if (value.atom !== undefined) has(value.atom);
    else if (value.lp !== undefined) {
      assert.ok(source);
      has(value.lp);
      assert.ok(getAtom(mol, value.lp).lp > 0);
    } else {
      assert.ok(Array.isArray(value.bond) && value.bond.length === 2);
      value.bond.forEach(has);
      assert.ok(edges.has([...value.bond].sort().join(':')));
    }
  }
  for (const arrow of mol.arrows ?? []) {
    endpoint(arrow.from, true);
    endpoint(arrow.to, false);
  }
}

function validateFigure(figure) {
  assert.ok(figure && !Array.isArray(figure));
  assert.ok(typeof figure.title === 'string' && figure.title);
  if (figure.pages) assert.ok(figure.pages.every(p => Number.isInteger(p) && p > 0));
  const mols = molecules(figure);
  mols.forEach(validateMol);
  const ids = new Set(mols.flatMap(m => m.atoms.map(a => a.id)));
  switch (figure.kind) {
    case 'structure-steps':
      assert.ok(figure.mols.length && figure.steps.length);
      assert.ok([undefined, null, '↔', '→'].includes(figure.joiner));
      for (const step of figure.steps) {
        assert.ok(step.note);
        for (const [key, value] of Object.entries(step.show)) {
          if (key === 'highlight') {
            assert.ok(Array.isArray(value));
            value.forEach(id => assert.ok(ids.has(id)));
          } else {
            assert.ok(['lp', 'charges', 'partials', 'arrows'].includes(key));
            assert.equal(typeof value, 'boolean');
          }
        }
      }
      break;
    case 'name-pair':
      assert.ok(figure.items.length);
      for (const item of figure.items) {
        assert.ok(item.name && item.highlight.length);
        for (const mark of item.highlight) {
          assert.ok(mark.label && mark.atoms.length);
          mark.atoms.forEach(id => assert.ok(getAtom(item.mol, id)));
        }
      }
      break;
    case 'newman':
      assert.equal(figure.front.length, 3);
      assert.equal(figure.back.length, 3);
      assert.ok([...figure.front, ...figure.back].every(g => typeof g === 'string' && g));
      assert.ok(figure.frames.length);
      figure.frames.forEach(f => assert.ok(Number.isFinite(f.dihedral) && f.label && f.note));
      break;
    case 'chair':
      assert.ok(figure.substituents.length);
      figure.substituents.forEach(s => {
        assert.ok(Number.isInteger(s.carbon) && s.carbon >= 1 && s.carbon <= 6);
        assert.ok(['axial', 'equatorial'].includes(s.position) && s.label);
      });
      figure.frames?.forEach(f => assert.ok(typeof f.flip === 'boolean' && f.note));
      break;
    case 'chirality':
      assert.deepEqual(figure.groups.map(g => g.priority).sort(), [1, 2, 3, 4]);
      assert.ok(figure.groups.every(g => g.label));
      assert.ok(['R', 'S'].includes(figure.answer));
      assert.deepEqual(figure.steps.map(s => s.show), ['groups', 'priorities', 'orient', 'direction']);
      assert.ok(figure.steps.every(s => s.note));
      break;
    case 'schematic':
      assert.ok(figure.panels.length);
      assert.ok([undefined, null, '→', 'vs'].includes(figure.joiner));
      figure.panels.forEach(p => assert.ok(p.caption && (p.mol || p.text)));
      if (figure.curve) {
        assert.ok(figure.curve.points.every(p => p.length === 2 && p.every(Number.isFinite)));
        figure.curve.labels?.forEach(l => assert.ok(Number.isFinite(l.x) && Number.isFinite(l.y) && l.text));
      }
      break;
    default:
      assert.fail(`unknown Figure kind ${figure.kind}`);
  }
}

// Count explicit atoms, condensed labels and skeletal implicit H independently
// of the drawing helpers. Carbon cations have valence three.
function composition(mol) {
  const counts = {};
  const add = (el, n = 1) => { counts[el] = (counts[el] ?? 0) + n; };
  for (const a of mol.atoms) {
    if (a.label) {
      const formula = a.label.replace(/[₀-₉]/g, n => String('₀₁₂₃₄₅₆₇₈₉'.indexOf(n)));
      assert.match(formula, /^(?:[A-Z][a-z]?\d*)+$/);
      for (const [, el, n] of formula.matchAll(/([A-Z][a-z]?)(\d*)/g)) add(el, n ? Number(n) : 1);
    } else {
      add(a.el);
      if (a.el === 'C') {
        const h = (a.charge === 1 ? 3 : 4) - orderSum(mol, a.id);
        assert.ok(h >= 0, `overbonded ${a.id}`);
        if (h) add('H', h);
      }
    }
  }
  return { atoms: counts, charge: charge(mol) };
}

function components(mol) {
  const remaining = new Set(mol.atoms.map(a => a.id));
  let count = 0;
  while (remaining.size) {
    count++;
    const stack = [remaining.values().next().value];
    while (stack.length) {
      const id = stack.pop();
      if (!remaining.delete(id)) continue;
      stack.push(...neighbors(mol, id));
    }
  }
  return count;
}

test('all required cards accept one Figure or a nonempty, ordered Figure array', () => {
  required.forEach(id => assert.ok(FIGURES[id], id));
  for (const value of Object.values(FIGURES)) {
    assert.ok(figures(value).length);
    figures(value).forEach(validateFigure);
  }
});

test('Lewis structures retain valid valence, formal charges and lone pairs', () => {
  for (const f of allFigures) for (const mol of molecules(f)) for (const a of mol.atoms) {
    const valence = orderSum(mol, a.id);
    if (a.el === 'C') {
      const labelH = a.label?.match(/^CH([₂₃])?$/);
      const hydrogens = labelH ? (labelH[1] ? '₀₁₂₃'.indexOf(labelH[1]) : 1) : 0;
      assert.ok(valence + hydrogens <= (a.charge === 1 ? 3 : 4), `${f.title}: ${a.id}`);
    }
    if (a.el === 'H') assert.equal(valence, 1);
    if (a.el === 'O' && a.lp !== undefined) {
      assert.equal(6 - 2 * a.lp - valence, a.charge ?? 0);
      assert.equal(valence + a.lp, 4);
    }
    if (['Cl', 'Br'].includes(a.el)) {
      assert.equal(valence, a.charge === -1 ? 0 : 1);
      if (a.lp !== undefined) assert.equal(7 - 2 * a.lp - valence, a.charge ?? 0);
    }
  }
});

test('chirality compares actual R/S mirror structures with H pointing away', () => {
  const pair = figures(FIGURES.chirality).find(f => f.kind === 'schematic');
  assert.ok(pair, 'missing mirror comparison');
  assert.equal(pair.joiner, 'vs');
  assert.equal(pair.panels.length, 2);
  for (const [i, panel] of pair.panels.entries()) {
    const mol = panel.mol;
    const center = mol.atoms.find(a => a.el === 'C' && neighbors(mol, a.id).length === 4);
    assert.ok(center);
    const attached = neighbors(mol, center.id).map(id => getAtom(mol, id));
    const h = attached.find(a => a.el === 'H');
    const o = attached.find(a => a.el === 'O');
    const ethyl = attached.find(a => a.el === 'C' && neighbors(mol, a.id).some(id => id !== center.id && getAtom(mol, id).el === 'C'));
    const methyl = attached.find(a => a.el === 'C' && a !== ethyl);
    assert.ok(h && o && ethyl && methyl);
    assert.ok(mol.bonds.some(b => b.a === center.id && b.b === h.id && b.style === 'dash'));
    assert.ok(mol.bonds.some(b => b.a === center.id && b.b === o.id && b.style === 'wedge'));
    // With 4 away, positive signed area in screen coordinates means clockwise R.
    const area = (ethyl.x - o.x) * (methyl.y - o.y) - (ethyl.y - o.y) * (methyl.x - o.x);
    assert.ok(i === 0 ? area > 0 : area < 0);
    assert.match(panel.caption, i === 0 ? /\(R\)/ : /\(S\)/);
    assert.deepEqual(composition(mol), { atoms: { C: 4, H: 10, O: 1 }, charge: 0 });
  }
  assert.match(words(pair), /不可疊合/);
});

test('conformation begins with a wedge/dash viewing guide and at most four Newman frames', () => {
  const sequence = figures(FIGURES.conformation);
  assert.notEqual(sequence[0].kind, 'newman');
  const guide = molecules(sequence[0])[0];
  assert.ok(guide.bonds.some(b => b.style === 'wedge'));
  assert.ok(guide.bonds.some(b => b.style === 'dash'));
  assert.deepEqual(composition(guide), { atoms: { C: 4, H: 10 }, charge: 0 });
  const models = sequence.filter(f => f.kind === 'newman');
  assert.ok(models.length);
  const frames = models.flatMap(f => f.frames);
  assert.ok(frames.length <= 4);
  for (const label of ['anti', 'gauche', 'staggered', 'eclipsed']) {
    assert.ok(frames.some(f => f.label.includes(label)), label);
  }
});

test('alcohols compare primary, secondary and tertiary OH carbons side by side', () => {
  const sequence = figures(FIGURES['alcohol-name']);
  const comparison = sequence.find(f => f.kind === 'structure-steps' && f.mols.length === 3);
  assert.ok(comparison);
  for (const [i, mol] of comparison.mols.entries()) {
    const o = mol.atoms.find(a => a.el === 'O');
    const c = neighbors(mol, o.id).map(id => getAtom(mol, id)).find(a => a.el === 'C');
    const carbons = neighbors(mol, c.id).filter(id => getAtom(mol, id).el === 'C');
    assert.equal(carbons.length, i + 1);
    assert.deepEqual(composition(mol), { atoms: { C: 4, H: 10, O: 1 }, charge: 0 });
    assert.ok(comparison.steps.some(s => [c.id, ...carbons].every(id => s.show.highlight?.includes(id))));
  }
});

test('four reaction examples have explicit balanced before/after structures', () => {
  const reactions = figures(FIGURES.reactions);
  assert.equal(reactions.length, 4);
  for (const [i, f] of reactions.entries()) {
    assert.equal(f.kind, 'schematic');
    assert.equal(f.joiner, '→');
    assert.ok(f.panels.length >= 2);
    const mols = molecules(f);
    assert.equal(mols.length, f.panels.length);
    const initial = composition(mols[0]);
    mols.slice(1).forEach(mol => assert.deepEqual(composition(mol), initial, f.title));
    if (i < 2) assert.ok(mols[0].arrows.length >= 2, 'addition/substitution electron flow');
  }
  const elimination = reactions[2];
  assert.match(words(elimination), /強鹼/);
  assert.ok(molecules(elimination)[0].atoms.some(a => a.el === 'Br'));
  const [before, after] = molecules(reactions[3]);
  assert.equal(charge(before), 1);
  assert.equal(charge(after), 1);
  const chargedCarbonDegree = mol => {
    const c = mol.atoms.find(a => a.el === 'C' && a.charge === 1);
    return neighbors(mol, c.id).filter(id => getAtom(mol, id).el === 'C').length;
  };
  assert.equal(chargedCarbonDegree(before), 2);
  assert.equal(chargedCarbonDegree(after), 3);
  assert.notDeepEqual(before.bonds, after.bonds);
});

test('curved arrows start at electron donors and end at the appropriate acceptors', () => {
  const [addition, substitution, , rearrangement] = figures(FIGURES.reactions);
  const start = addition.panels[0].mol;
  const double = start.bonds.find(b => b.order === 2);
  const acidH = start.atoms.find(a => a.el === 'H');
  const bromine = start.atoms.find(a => a.el === 'Br');
  assert.deepEqual(start.arrows, [
    { from: { bond: [double.a, double.b] }, to: { atom: acidH.id } },
    { from: { bond: [acidH.id, bromine.id] }, to: { atom: bromine.id } },
  ]);
  const intermediate = addition.panels[1].mol;
  const brIon = intermediate.atoms.find(a => a.el === 'Br' && a.charge === -1);
  const cation = intermediate.atoms.find(a => a.el === 'C' && a.charge === 1);
  assert.deepEqual(intermediate.arrows, [{ from: { atom: brIon.id }, to: { atom: cation.id } }]);

  const sn2 = substitution.panels[0].mol;
  const oxygen = sn2.atoms.find(a => a.el === 'O' && a.charge === -1);
  const carbon = sn2.atoms.find(a => a.el === 'C');
  const leaving = sn2.atoms.find(a => a.el === 'Br');
  assert.deepEqual(sn2.arrows, [
    { from: { lp: oxygen.id }, to: { atom: carbon.id } },
    { from: { bond: [carbon.id, leaving.id] }, to: { atom: leaving.id } },
  ]);

  const [before, after] = molecules(rearrangement);
  const migratingH = before.atoms.find(a => a.el === 'H');
  const donor = neighbors(before, migratingH.id)[0];
  const acceptor = before.atoms.find(a => a.charge === 1);
  assert.deepEqual(before.arrows, [{ from: { bond: [donor, migratingH.id] }, to: { atom: acceptor.id } }]);
  assert.deepEqual(neighbors(after, migratingH.id), [acceptor.id]);
  assert.equal(getAtom(after, donor).charge, 1);
});

test('heat shows two reactant particles becoming three product particles, conserving atoms and charge', () => {
  const f = figures(FIGURES.heat)[0];
  const [before, after] = molecules(f);
  assert.ok(before && after);
  assert.equal(f.joiner, '→');
  assert.equal(components(before), 2);
  assert.equal(components(after), 3);
  assert.deepEqual(composition(before), composition(after));
  assert.match(words(f), /教學補充/);
});

test('resonance adds a separate hybrid with equal oxygen partial charges and no equilibrium implication', () => {
  const sequence = figures(FIGURES.resonance);
  assert.equal(sequence[0].mols.length, 2);
  assert.equal(sequence[0].joiner, '↔');
  const hybrid = sequence[1];
  assert.ok(hybrid);
  assert.equal(hybrid.mols.length, 1);
  assert.equal(hybrid.joiner, null);
  const mol = hybrid.mols[0];
  const oxygens = mol.atoms.filter(a => a.el === 'O');
  assert.equal(oxygens.length, 2);
  assert.ok(oxygens.every(a => a.partial === 'δ−' && a.charge === undefined && a.lp === undefined));
  assert.equal(orderSum(mol, oxygens[0].id), orderSum(mol, oxygens[1].id));
  assert.deepEqual(composition(mol).atoms, { C: 2, H: 3, O: 2 });
  assert.ok(mol.bonds.every(b => !b.style), 'stereochemical dash must not stand for a fractional pi bond');
  assert.ok(hybrid.steps.some(s => s.show.partials));
  assert.match(words(hybrid), /不是.*跳動/);
});
