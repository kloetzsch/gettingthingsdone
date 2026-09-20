import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TasksService } from '../../core/services/tasks.service';
import { EFFORT_OPTIONS, TaskDto } from '../../core/models/task';
import { formatDuration } from '../../core/utils/duration';

function isSameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

@Component({
  selector: 'app-completed-today',
  imports: [MatCardModule],
  templateUrl: './completed-today.html',
  styleUrl: './completed-today.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompletedTodayList {
  private readonly tasksService = inject(TasksService);
  private readonly effortOptions = EFFORT_OPTIONS;

  protected readonly items = computed<TaskDto[]>(() => {
    const now = new Date();

    return this.tasksService
      .tasks()
      .filter((task) => task.status === 'Done' && task.completedAt !== null)
      .filter((task) => isSameLocalDay(new Date(task.completedAt!), now))
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
  });

  protected readonly totalLabel = computed(() => formatDuration(this.items().reduce((sum, task) => sum + task.estimatedMinutes, 0)));

  protected effortLabel(minutes: number): string {
    return this.effortOptions.find((option) => option.minutes === minutes)?.label ?? `${minutes} Min`;
  }
}
