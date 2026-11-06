# @lp-labs/sorted-multimap

A generic sorted multimap with stable duplicate insertion, binary bounds, and half-open range selection.

## Install

```sh
npm install @lp-labs/sorted-multimap
```

Version 0.1.0. MIT. Zero runtime, peer, or sibling dependencies. Node >=18;
browser-compatible ES2022 runtime without browser-global reads. ESM and CommonJS
exports have separate matching declarations.

## Quick start

```js
import { SortedMultimap } from '@lp-labs/sorted-multimap';
const schedule = new SortedMultimap((a, b) => a - b, 100);
schedule.add(10, 'first');
schedule.add(10, 'second');
schedule.add(20, 'later');
if (schedule.upperBound(10) !== 2) throw new Error('bound');
console.log(schedule.range(10, 20)); // [[10, 'first'], [10, 'second']]
```

## Contract, customization, errors and ownership

The required Comparator<K> must provide a pure, stable total preorder: negative/zero/positive mean before/equivalent/after; every result must be finite. Comparator equivalence, not identity, defines a key group. `maxEntries` defaults 100,000 and is a positive safe integer. Keys/values are retained by reference: do not mutate key ordering properties after insertion.

`add` inserts after all equivalent keys, preserving duplicate insertion order. `getAll` returns group values in that order. `lowerBound/upperBound` return zero-based insertion indices before/after equivalent keys. `delete` removes the entire equivalent group and returns its size. `range(from, to, limit)` uses comparator order [from, to); reversed ranges throw RangeError. Limit defaults maxEntries, must be integer 0..maxEntries, and truncates without error. `entries` and range return fresh tuple/array containers; payload and key references remain shared. `clear` empties the map.

Invalid capacity/limits and full insertion throw RangeError. Nonfinite comparator results throw TypeError; callback exceptions propagate. All comparisons complete before mutation, so failed adds/deletes leave state unchanged. Reentrant access from the comparator throws Error, including reads/getters. Comparator purity and transitivity cannot be checked and are caller obligations.

Bounds O(log n), add/delete O(n) due to array movement, group/range O(log n + output), snapshots O(n), space O(n). This is not a balanced tree; intended for read-heavy bounded collections.

## Complete public declaration contract

Runtime exports and all exported types are listed below. Internal storage members
are omitted. Optional settings are constructor/function options, not globals.

```ts
export type Comparator<K> = (left: K, right: K) => number;
export declare class SortedMultimap<K, V> {
  constructor(compare: Comparator<K>, maxEntries?: number);
  get size(): number;
  lowerBound(key: K): number;
  upperBound(key: K): number;
  add(key: K, value: V): void;
  getAll(key: K): V[];
  delete(key: K): number;
  range(from: K, to: K, limit?: number): [K, V][];
  entries(): [K, V][];
  clear(): void;
}
```

## Development

```sh
npm ci --offline
npm run build
npm run typecheck
npm test
npm run format:check
```

TypeScript ^5.9.3 and Prettier ^3.6.2 are development-only. Offline installation
requires their locked packages already in the local npm cache. Build emits
dist/esm and dist/cjs with separate declarations; tests exercise runtime behavior
and bare-package ESM/CommonJS type consumers with negative checks. No publish
step is needed to build or test.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
