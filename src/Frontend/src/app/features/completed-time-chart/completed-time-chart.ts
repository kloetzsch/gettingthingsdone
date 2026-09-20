import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { TasksService } from '../../core/services/tasks.service';
import { ProjectsService } from '../../core/services/projects.service';
import { formatDuration } from '../../core/utils/duration';
import { Aggregation, addDays, bucketStart, generateBucketStarts, startOfDay } from '../../core/utils/date-buckets';

type GroupBy = 'project' | 'category';
type RangePreset = '7d' | '30d' | '90d' | 'year';

interface ChartSegment {
  name: string;
  minutes: number;
  color: string;
  y: number;
  height: number;
}

interface ChartBucket {
  label: string;
  total: number;
  segments: ChartSegment[];
  tooltip: string;
}

const PALETTE = ['#2f6feb', '#2f8f4e', '#c9832f', '#a24fc9', '#c94f6f', '#2fa3a3', '#8a8f3f', '#6f6f8f'];

const BAR_SLOT = 14;
const BAR_WIDTH = 10;
const CHART_HEIGHT = 160;

@Component({
  selector: 'app-completed-time-chart',
  imports: [MatCardModule, MatButtonToggleModule],
  providers: [DatePipe],
  templateUrl: './completed-time-chart.html',
  styleUrl: './completed-time-chart.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompletedTimeChart {
  private readonly tasksService = inject(TasksService);
  private readonly projectsService = inject(ProjectsService);
  private readonly datePipe = inject(DatePipe);

  protected readonly barSlot = BAR_SLOT;
  protected readonly barWidth = BAR_WIDTH;
  protected readonly chartHeight = CHART_HEIGHT;

  protected readonly groupByOptions: ReadonlyArray<{ value: GroupBy; label: string }> = [
    { value: 'project', label: 'Projekt' },
    { value: 'category', label: 'Kategorie' },
  ];

  protected readonly rangeOptions: ReadonlyArray<{ value: RangePreset; label: string }> = [
    { value: '7d', label: '7 Tage' },
    { value: '30d', label: '30 Tage' },
    { value: '90d', label: '90 Tage' },
    { value: 'year', label: 'Dieses Jahr' },
  ];

  protected readonly aggregationOptions: ReadonlyArray<{ value: Aggregation; label: string }> = [
    { value: 'day', label: 'Tag' },
    { value: 'week', label: 'Woche' },
    { value: 'month', label: 'Monat' },
  ];

  protected readonly groupBy = signal<GroupBy>('project');
  protected readonly rangePreset = signal<RangePreset>('30d');
  protected readonly aggregation = signal<Aggregation>('day');

  private readonly rangeStart = computed<Date>(() => {
    const today = startOfDay(new Date());
    switch (this.rangePreset()) {
      case '7d':
        return addDays(today, -6);
      case '90d':
        return addDays(today, -89);
      case 'year':
        return new Date(today.getFullYear(), 0, 1);
      case '30d':
      default:
        return addDays(today, -29);
    }
  });

  protected readonly chart = computed(() => {
    const start = this.rangeStart();
    const today = new Date();
    const agg = this.aggregation();
    const groupBy = this.groupBy();

    const bucketStarts = generateBucketStarts(start, today, agg);
    const bucketIndexByTime = new Map(bucketStarts.map((date, index) => [date.getTime(), index]));
    const rawTotals: Map<string, number>[] = bucketStarts.map(() => new Map());
    const groupNamesSet = new Set<string>();

    for (const task of this.tasksService.tasks()) {
      if (task.status !== 'Done' || !task.completedAt) {
        continue;
      }
      const completed = new Date(task.completedAt);
      if (completed < start) {
        continue;
      }

      const index = bucketIndexByTime.get(bucketStart(completed, agg).getTime());
      if (index === undefined) {
        continue;
      }

      const name =
        groupBy === 'project'
          ? (this.projectsService.nameOf(task.projectId) ?? 'Kein Projekt')
          : (task.category ?? 'Ohne Kategorie');

      groupNamesSet.add(name);
      rawTotals[index].set(name, (rawTotals[index].get(name) ?? 0) + task.estimatedMinutes);
    }

    const groupNames = [...groupNamesSet].sort();
    const colorByName = new Map(groupNames.map((name, i) => [name, PALETTE[i % PALETTE.length]]));

    const bucketTotals = rawTotals.map((totals) =>
      groupNames.reduce((sum, name) => sum + (totals.get(name) ?? 0), 0),
    );
    const maxTotal = Math.max(1, ...bucketTotals);

    const buckets: ChartBucket[] = bucketStarts.map((bucketDate, i) => {
      const totals = rawTotals[i];
      let offset = 0;
      const segments: ChartSegment[] = [];

      for (const name of groupNames) {
        const minutes = totals.get(name) ?? 0;
        if (minutes <= 0) {
          continue;
        }
        const height = (minutes / maxTotal) * CHART_HEIGHT;
        segments.push({ name, minutes, color: colorByName.get(name)!, y: CHART_HEIGHT - offset - height, height });
        offset += height;
      }

      const label =
        agg === 'month'
          ? (this.datePipe.transform(bucketDate, 'MMM yy') ?? '')
          : (this.datePipe.transform(bucketDate, 'dd.MM.') ?? '');

      const tooltipLines = [label];
      for (const name of groupNames) {
        const minutes = totals.get(name) ?? 0;
        if (minutes > 0) {
          tooltipLines.push(`${name}: ${formatDuration(minutes)}`);
        }
      }
      tooltipLines.push(`Gesamt: ${formatDuration(bucketTotals[i])}`);

      return {
        label,
        total: bucketTotals[i],
        segments,
        tooltip: tooltipLines.join('\n'),
      };
    });

    const rangeLabel = `${this.datePipe.transform(start, 'dd.MM.yyyy')} – ${this.datePipe.transform(today, 'dd.MM.yyyy')}`;

    return { buckets, groupNames, colorByName, rangeLabel };
  });

  protected barX(index: number): number {
    return index * BAR_SLOT + (BAR_SLOT - BAR_WIDTH) / 2;
  }
}
