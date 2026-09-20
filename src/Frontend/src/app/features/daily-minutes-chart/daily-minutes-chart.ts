import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TasksService } from '../../core/services/tasks.service';

interface DayBucket {
  date: Date;
  minutes: number;
}

const DAYS_TO_SHOW = 30;
const BAR_SLOT_WIDTH = 10;
const BAR_WIDTH = 8;
const CHART_HEIGHT = 64;

@Component({
  selector: 'app-daily-minutes-chart',
  imports: [DatePipe, MatCardModule],
  templateUrl: './daily-minutes-chart.html',
  styleUrl: './daily-minutes-chart.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyMinutesChart {
  private readonly tasksService = inject(TasksService);

  protected readonly chartWidth = DAYS_TO_SHOW * BAR_SLOT_WIDTH;
  protected readonly chartHeight = CHART_HEIGHT;
  protected readonly barWidth = BAR_WIDTH;

  protected readonly days = computed<DayBucket[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const buckets: DayBucket[] = [];
    for (let i = DAYS_TO_SHOW - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      buckets.push({ date, minutes: 0 });
    }

    for (const task of this.tasksService.tasks()) {
      if (task.status !== 'Done' || !task.completedAt) {
        continue;
      }
      const completed = new Date(task.completedAt);
      completed.setHours(0, 0, 0, 0);
      const bucket = buckets.find((b) => b.date.getTime() === completed.getTime());
      if (bucket) {
        bucket.minutes += task.estimatedMinutes;
      }
    }

    return buckets;
  });

  private readonly maxMinutes = computed(() => Math.max(1, ...this.days().map((d) => d.minutes)));

  protected barHeight(minutes: number): number {
    return Math.max(0.5, (minutes / this.maxMinutes()) * this.chartHeight);
  }

  protected barX(index: number): number {
    return index * BAR_SLOT_WIDTH + (BAR_SLOT_WIDTH - BAR_WIDTH) / 2;
  }

  protected barY(minutes: number): number {
    return this.chartHeight - this.barHeight(minutes);
  }
}
