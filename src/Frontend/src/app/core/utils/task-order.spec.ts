import { mergeVisibleOrder } from './task-order';

describe('mergeVisibleOrder', () => {
  it('übernimmt die neue Reihenfolge, wenn alle Aufgaben sichtbar sind', () => {
    expect(mergeVisibleOrder(['a', 'b', 'c'], ['c', 'a', 'b'])).toEqual(['c', 'a', 'b']);
  });

  it('lässt ausgeblendete Aufgaben an ihrem Platz', () => {
    // b und d sind weggefiltert; c wird in der sichtbaren Liste vor a gezogen.
    expect(mergeVisibleOrder(['a', 'b', 'c', 'd', 'e'], ['c', 'a', 'e'])).toEqual(['c', 'b', 'a', 'd', 'e']);
  });
});
