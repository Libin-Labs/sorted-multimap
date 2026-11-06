import test from 'node:test';
import assert from 'node:assert/strict';
import { SortedMultimap } from '../dist/esm/index.js';
test('stable duplicate keys and lower/upper bounds', () => {
  const m = new SortedMultimap((a, b) => a - b);
  m.add(2, 'first');
  m.add(1, 'low');
  m.add(2, 'second');
  m.add(3, 'high');
  assert.deepEqual(m.getAll(2), ['first', 'second']);
  assert.equal(m.lowerBound(2), 1);
  assert.equal(m.upperBound(2), 3);
  assert.equal(m.lowerBound(0), 0);
  assert.equal(m.upperBound(4), 4);
});
test('generic comparator equivalence not object identity defines duplicate groups', () => {
  const m = new SortedMultimap((a, b) => a.id - b.id);
  m.add({ id: 2 }, 9);
  m.add({ id: 2 }, 10);
  assert.equal(m.delete({ id: 2 }), 2);
  assert.equal(m.size, 0);
  assert.equal(m.delete({ id: 8 }), 0);
});
test('half-open range and exact result budgets', () => {
  const m = new SortedMultimap((a, b) => a - b, 4);
  for (let i = 0; i < 4; i++) m.add(i, i);
  assert.deepEqual(m.range(1, 3), [
    [1, 1],
    [2, 2],
  ]);
  assert.deepEqual(m.range(1, 3, 1), [[1, 1]]);
  assert.deepEqual(m.range(1, 3, 0), []);
  assert.throws(() => m.range(3, 1));
  assert.throws(() => m.range(0, 4, 5));
  assert.throws(() => m.add(4, 4));
  assert.equal(m.size, 4);
});
test('throwing, nonfinite and reentrant comparator failures preserve state', () => {
  let mode = '',
    m;
  m = new SortedMultimap((a, b) => {
    if (mode === 'throw') throw new Error('compare');
    if (mode === 'nan') return NaN;
    if (mode === 'reenter') m.clear();
    return a - b;
  });
  m.add(1, 1);
  for (mode of ['throw', 'nan', 'reenter']) {
    assert.throws(() => m.add(2, 2));
    assert.throws(() => m.delete(1));
    assert.equal(m.size, 1);
  }
  mode = '';
  assert.deepEqual(m.entries(), [[1, 1]]);
});
test('snapshots own tuples but retain value references; clear reusable', () => {
  const m = new SortedMultimap((a, b) => a - b);
  const value = {};
  m.add(1, value);
  const entries = m.entries();
  entries[0][0] = 9;
  assert.equal(m.getAll(1)[0], value);
  const range = m.range(0, 2);
  range[0][0] = 8;
  assert.equal(m.lowerBound(1), 0);
  m.clear();
  m.add(2, 3);
  assert.deepEqual(m.entries(), [[2, 3]]);
});
test('malformed limits and comparator reject', () => {
  assert.throws(() => new SortedMultimap(null));
  for (const limit of [0, -1, NaN, 0.5])
    assert.throws(() => new SortedMultimap((a, b) => a - b, limit));
  const m = new SortedMultimap((a, b) => b - a);
  m.add(1, 1);
  m.add(3, 3);
  m.add(2, 2);
  assert.deepEqual(m.range(3, 1), [
    [3, 3],
    [2, 2],
  ]);
});
test('seeded array oracle validates stable order and bounds after updates', () => {
  let seed = 351;
  const random = () => {
    seed = (Math.imul(seed, 22695477) + 1) >>> 0;
    return seed >>> 8;
  };
  const m = new SortedMultimap((a, b) => a - b),
    a = [];
  for (let i = 0; i < 1000; i++) {
    const key = random() % 30;
    if (random() % 3) {
      m.add(key, i);
      a.push([key, i]);
      a.sort((x, y) => x[0] - y[0]);
    } else {
      assert.equal(m.delete(key), a.filter((e) => e[0] === key).length);
      for (let j = a.length - 1; j >= 0; j--) if (a[j][0] === key) a.splice(j, 1);
    }
    assert.deepEqual(m.entries(), a);
    assert.equal(m.lowerBound(key), a.filter((e) => e[0] < key).length);
    assert.equal(m.upperBound(key), a.filter((e) => e[0] <= key).length);
  }
});
