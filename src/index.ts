export type Comparator<K> = (left: K, right: K) => number;
export class SortedMultimap<K, V> {
  private data: [K, V][] = [];
  private busy = false;
  constructor(
    private readonly compare: Comparator<K>,
    private readonly maxEntries = 100_000,
  ) {
    if (typeof compare !== 'function') throw new TypeError('Expected comparator');
    if (!Number.isSafeInteger(maxEntries) || maxEntries < 1)
      throw new RangeError('Invalid capacity');
  }
  private guard(): void {
    if (this.busy) throw new Error('Reentrant comparator access');
  }
  private cmp(a: K, b: K): number {
    this.busy = true;
    try {
      const result = this.compare(a, b);
      if (!Number.isFinite(result)) throw new TypeError('Comparator must return a finite number');
      return result;
    } finally {
      this.busy = false;
    }
  }
  private bound(key: K, upper: boolean): number {
    let low = 0,
      high = this.data.length;
    while (low < high) {
      const mid = Math.floor((low + high) / 2),
        order = this.cmp(this.data[mid]![0], key);
      if (order < 0 || (upper && order === 0)) low = mid + 1;
      else high = mid;
    }
    return low;
  }
  get size(): number {
    this.guard();
    return this.data.length;
  }
  lowerBound(key: K): number {
    this.guard();
    return this.bound(key, false);
  }
  upperBound(key: K): number {
    this.guard();
    return this.bound(key, true);
  }
  add(key: K, value: V): void {
    this.guard();
    if (this.data.length === this.maxEntries) throw new RangeError('Capacity exceeded');
    const index = this.bound(key, true);
    this.data.splice(index, 0, [key, value]);
  }
  getAll(key: K): V[] {
    this.guard();
    const low = this.bound(key, false),
      high = this.bound(key, true);
    return this.data.slice(low, high).map((entry) => entry[1]);
  }
  delete(key: K): number {
    this.guard();
    const low = this.bound(key, false),
      high = this.bound(key, true);
    this.data.splice(low, high - low);
    return high - low;
  }
  range(from: K, to: K, limit = this.maxEntries): [K, V][] {
    this.guard();
    if (!Number.isSafeInteger(limit) || limit < 0 || limit > this.maxEntries)
      throw new RangeError('Invalid range limit');
    if (this.cmp(from, to) > 0) throw new RangeError('Reversed range');
    const low = this.bound(from, false),
      high = this.bound(to, false);
    return this.data.slice(low, Math.min(high, low + limit)).map(([k, v]) => [k, v]);
  }
  entries(): [K, V][] {
    this.guard();
    return this.data.map(([k, v]) => [k, v]);
  }
  clear(): void {
    this.guard();
    this.data = [];
  }
}
