import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CategoriesService } from '../../core/services/categories.service';
import { FocusCoordinatorService } from '../../core/services/focus-coordinator.service';
import { ProjectsService } from '../../core/services/projects.service';
import { TasksService } from '../../core/services/tasks.service';
import { EFFORT_OPTIONS } from '../../core/models/task';

@Component({
  selector: 'app-task-capture',
  imports: [MatCardModule, MatFormFieldModule, MatInputModule, MatButtonToggleModule, MatButtonModule],
  templateUrl: './task-capture.html',
  styleUrl: './task-capture.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCapture implements AfterViewInit {
  protected readonly categoriesService = inject(CategoriesService);
  protected readonly projectsService = inject(ProjectsService);
  private readonly tasksService = inject(TasksService);
  private readonly focusCoordinator = inject(FocusCoordinatorService);

  @ViewChild('effortGroup', { read: ElementRef }) private effortGroup?: ElementRef<HTMLElement>;

  private readonly refocusOnRequest = effect(() => {
    this.focusCoordinator.captureFormRequests();
    this.focusFirstEffortButton();
  });

  protected readonly effortOptions = EFFORT_OPTIONS;

  protected readonly title = signal('');
  protected readonly selectedMinutes = signal<number | null>(EFFORT_OPTIONS[0].minutes);
  protected readonly selectedCategory = signal<string | null>(null);
  protected readonly selectedProjectId = signal<string | null>(null);

  protected readonly activeProjects = computed(() => this.projectsService.projects().filter((p) => p.status === 'Active'));

  // Roving tabindex: only the selected option (or the "none" option as fallback) is a tab stop,
  // the others are reached via arrow keys. MatButtonToggleGroup only initializes this once in
  // ngAfterContentInit, so options rendered later (categories/projects arrive asynchronously)
  // would otherwise keep their default tabindex 0 and each become a tab stop.
  protected readonly focusableCategory = computed(() => {
    const selected = this.selectedCategory();
    return this.categoriesService.categories().some((c) => c.name === selected) ? selected : null;
  });
  protected readonly focusableProjectId = computed(() => {
    const selected = this.selectedProjectId();
    return this.activeProjects().some((p) => p.id === selected) ? selected : null;
  });

  protected readonly submitting = signal(false);
  protected readonly justCreated = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  ngAfterViewInit(): void {
    this.focusFirstEffortButton();
  }

  protected canSubmit(): boolean {
    return this.title().trim().length > 0 && this.selectedMinutes() !== null;
  }

  protected onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    void this.submit();
  }

  private async submit(): Promise<void> {
    if (!this.canSubmit() || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    try {
      await this.tasksService.create({
        title: this.title().trim(),
        notes: null,
        category: this.selectedCategory(),
        estimatedMinutes: this.selectedMinutes()!,
        dueDate: null,
        projectId: this.selectedProjectId(),
      });

      this.resetForm();
      this.justCreated.set(true);
      setTimeout(() => this.justCreated.set(false), 1500);
    } catch {
      this.errorMessage.set('Aufgabe konnte nicht gespeichert werden.');
    } finally {
      this.submitting.set(false);
    }
  }

  private resetForm(): void {
    this.title.set('');
    this.selectedMinutes.set(EFFORT_OPTIONS[0].minutes);
    this.selectedCategory.set(null);
    this.selectedProjectId.set(null);
    this.focusFirstEffortButton();
  }

  private focusFirstEffortButton(): void {
    this.effortGroup?.nativeElement.querySelector<HTMLButtonElement>('button')?.focus();
  }
}
