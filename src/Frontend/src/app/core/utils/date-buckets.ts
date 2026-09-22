export type Aggregation = 'day' | 'week' | 'month';

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, amount: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const mondayIndex = (d.getDay() + 6) % 7;
  return addDays(d, -mondayIndex);
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function bucketStart(date: Date, aggregation: Aggregation): Date {
  if (aggregation === 'day') {
    return startOfDay(date);
  }
  if (aggregation === 'week') {
    return startOfWeek(date);
  }
  return startOfMonth(date);
}

/** Inclusive list of bucket start dates covering [rangeStart, rangeEnd]. */
export function generateBucketStarts(rangeStart: Date, rangeEnd: Date, aggregation: Aggregation): Date[] {
  const starts: Date[] = [];
  let cursor = bucketStart(rangeStart, aggregation);
  const end = bucketStart(rangeEnd, aggregation);

  while (cursor.getTime() <= end.getTime()) {
    starts.push(cursor);
    cursor = aggregation === 'day' ? addDays(cursor, 1) : aggregation === 'week' ? addDays(cursor, 7) : addMonths(cursor, 1);
  }

  return starts;
}
