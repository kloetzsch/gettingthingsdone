import { TaskDto } from '../api/models';

/** Prioritätsreihenfolge: kleinere sortOrder zuerst, bei Gleichstand die neueste Aufgabe zuerst. */
export function compareByPriority(a: TaskDto, b: TaskDto): number {
  return a.sortOrder - b.sortOrder || b.createdAt.localeCompare(a.createdAt);
}

/**
 * Überträgt eine Verschiebung innerhalb einer (evtl. gefilterten) Teilliste auf die Gesamtliste:
 * Die Plätze, die die sichtbaren Aufgaben in der Gesamtliste belegen, werden in der neuen
 * Reihenfolge wieder aufgefüllt – ausgeblendete Aufgaben behalten ihren Platz.
 */
export function mergeVisibleOrder(allIds: readonly string[], reorderedVisibleIds: readonly string[]): string[] {
  const visible = new Set(reorderedVisibleIds);
  let next = 0;
  return allIds.map((id) => (visible.has(id) ? reorderedVisibleIds[next++] : id));
}
