import { SortedMultimap, type Comparator } from '@lp-labs/sorted-multimap';
const compare: Comparator<number> = (a, b) => a - b;
const map = new SortedMultimap<number, string>(compare);
map.add(1, 'x');
const rows: [number, string][] = map.range(0, 2);
// @ts-expect-error wrong key
map.lowerBound('1');
// @ts-expect-error wrong value
map.add(2, 4);
void rows;
