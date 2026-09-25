import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CategoriesService } from '../../core/services/categories.service';
import { FocusCoordinatorService } from '../../core/services/focus-coordinator.service';
import { ProjectsService } from '../../core/services/projects.service';
import { TasksService } from '../../core/services/tasks.service';
import { TaskDto } from '../../core/api/models';
import { CLOSED_STATUSES, EFFORT_OPTIONS, STATUS_OPTIONS } from '../../core/models/task';

@Component({
  selector: 'app-task-list',
  imports: [MatCardModule, MatExpansionModule, MatFormFieldModule, MatInputModule, MatButtonToggleModule, MatButtonModule],
  templateUrl: './task-list.html',
  styleUrl: './task-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskList {
  private readonly tasksService = inject(TasksService);
  protected readonly categoriesService = inject(CategoriesService);
  protected readonly projectsService = inject(ProjectsService);
  private readonly focusCoordinator = inject(FocusCoordinatorService);

  protected readonly effortOptions = EFFORT_OPTIONS;
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly openStatusOptions = STATUS_OPTIONS.filter((option) => !CLOSED_STATUSES.includes(option.value));

  protected readonly statusFilter = signal<TaskDto['status'] | 'all'>('all');
  protected readonly effortFilter = signal<number | 'all'>('all');
  protected readonly projectFilter = signal<'all' | 'none' | string>('all');
  protected readonly searchText = signal('');

  protected readonly filterableProjects = () => this.projectsService.projects().filter((p) => p.status !== 'Completed');

  protected readonly openTasks = computed(() => {
    const status = this.statusFilter();
    const effort = this.effortFilter();
    const project = this.projectFilter();
    const search = this.searchText().trim().toLowerCase();

    return [...this.tasksService.tasks()]
      .filter((task) => !CLOSED_STATUSES.includes(task.status))
      .filter((task) => status === 'all' || task.status === status)
      .filter((task) => effort === 'all' || task.estimatedMinutes === effort)
      .filter((task) => {
        if (project === 'all') {
          return true;
        }
        if (project === 'none') {
          return task.projectId === null;
        }
        return task.projectId === project;
      })
      .filter((task) => !search || task.title.toLowerCase().includes(search))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });

  protected readonly expandedTaskId = signal<string | null>(null);

  protected readonly draftTitle = signal('');
  protected readonly draftNotes = signal('');
  protected readonly draftCategory = signal<string | null>(null);
  protected readonly draftMinutes = signal<number | null>(null);
  protected readonly draftProjectId = signal<string | null>(null);
  protected readonly draftStatus = signal<TaskDto['status']>('Inbox');

  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly activeProjects = () => this.projectsService.projects().filter((p) => p.status === 'Active');

  protected hasActiveFilters(): boolean {
    return (
      this.statusFilter() !== 'all' ||
      this.effortFilter() !== 'all' ||
      this.projectFilter() !== 'all' ||
      this.searchText().trim().length > 0
    );
  }

  protected onStatusFilterClick(value: TaskDto['status'] | 'all'): void {
    this.statusFilter.set(this.statusFilter() === value ? 'all' : value);
  }

  protected onEffortFilterClick(value: number | 'all'): void {
    this.effortFilter.set(this.effortFilter() === value ? 'all' : value);
  }

  protected onProjectFilterClick(value: 'all' | 'none' | string): void {
    this.projectFilter.set(this.projectFilter() === value ? 'all' : value);
  }

  protected effortLabel(minutes: number): string {
    return this.effortOptions.find((option) => option.minutes === minutes)?.label ?? `${minutes} Min`;
  }

  protected statusLabel(status: TaskDto['status']): string {
    return this.statusOptions.find((option) => option.value === status)?.label ?? status;
  }

  protected isExpanded(task: TaskDto): boolean {
    return this.expandedTaskId() === task.id;
  }

  protected onOpened(task: TaskDto): void {
    this.expandedTaskId.set(task.id);
    this.draftTitle.set(task.title);
    this.draftNotes.set(task.notes ?? '');
    this.draftCategory.set(task.category);
    this.draftMinutes.set(task.estimatedMinutes);
    this.draftProjectId.set(task.projectId);
    this.draftStatus.set(task.status);
    this.errorMessage.set(null);
  }

  protected onClosed(task: TaskDto): void {
    if (this.expandedTaskId() === task.id) {
      this.expandedTaskId.set(null);
    }
  }

  protected cancelEdit(): void {
    this.expandedTaskId.set(null);
  }

  protected canSave(): boolean {
    return this.draftTitle().trim().length > 0 && this.draftMinutes() !== null;
  }

  protected async save(task: TaskDto): Promise<void> {
    if (!this.canSave() || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    try {
      await this.tasksService.update(task.id, {
        title: this.draftTitle().trim(),
        notes: this.draftNotes().trim() || null,
        status: this.draftStatus(),
        category: this.draftCategory(),
        estimatedMinutes: this.draftMinutes()!,
        dueDate: task.dueDate,
        projectId: this.draftProjectId(),
      });
      this.expandedTaskId.set(null);
    } catch {
      this.errorMessage.set('Änderungen konnten nicht gespeichert werden.');
    } finally {
      this.saving.set(false);
    }
  }

  protected markDone(task: TaskDto): Promise<void> {
    return this.closeTask(task, 'Done', 'Aufgabe konnte nicht als erledigt markiert werden.');
  }

  protected discard(task: TaskDto): Promise<void> {
    return this.closeTask(task, 'Discarded', 'Aufgabe konnte nicht verworfen werden.');
  }

  private async closeTask(task: TaskDto, status: TaskDto['status'], failureMessage: string): Promise<void> {
    if (this.saving()) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    try {
      await this.tasksService.update(task.id, {
        title: task.title,
        notes: task.notes,
        status,
        category: task.category,
        estimatedMinutes: task.estimatedMinutes,
        dueDate: task.dueDate,
        projectId: task.projectId,
      });
      this.expandedTaskId.set(null);
      this.focusCoordinator.requestCaptureFormFocus();
    } catch {
      this.errorMessage.set(failureMessage);
    } finally {
      this.saving.set(false);
    }
  }
}
