import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ProjectsService } from '../../core/services/projects.service';
import { ProjectDto, ProjectStatus } from '../../core/api/models';

interface StatusOption {
  value: ProjectStatus;
  label: string;
}

@Component({
  selector: 'app-project-list',
  imports: [MatExpansionModule, MatFormFieldModule, MatInputModule, MatButtonToggleModule, MatButtonModule],
  templateUrl: './project-list.html',
  styleUrl: './project-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectList {
  private readonly projectsService = inject(ProjectsService);

  protected readonly statusOptions: StatusOption[] = [
    { value: 'Active', label: 'Aktiv' },
    { value: 'OnHold', label: 'Pausiert' },
    { value: 'Completed', label: 'Abgeschlossen' },
  ];

  protected readonly openProjects = computed(() =>
    [...this.projectsService.projects()]
      .filter((project) => project.status !== 'Completed')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );

  protected readonly expandedProjectId = signal<string | null>(null);
  protected readonly draftName = signal('');
  protected readonly draftOutcome = signal('');
  protected readonly draftStatus = signal<ProjectStatus>('Active');

  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected statusLabel(status: ProjectStatus): string {
    return this.statusOptions.find((option) => option.value === status)?.label ?? status;
  }

  protected isExpanded(project: ProjectDto): boolean {
    return this.expandedProjectId() === project.id;
  }

  protected onOpened(project: ProjectDto): void {
    this.expandedProjectId.set(project.id);
    this.draftName.set(project.name);
    this.draftOutcome.set(project.outcome ?? '');
    this.draftStatus.set(project.status);
    this.errorMessage.set(null);
  }

  protected onClosed(project: ProjectDto): void {
    if (this.expandedProjectId() === project.id) {
      this.expandedProjectId.set(null);
    }
  }

  protected cancelEdit(): void {
    this.expandedProjectId.set(null);
  }

  protected canSave(): boolean {
    return this.draftName().trim().length > 0;
  }

  protected async save(project: ProjectDto): Promise<void> {
    if (!this.canSave() || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    try {
      await this.projectsService.update(project.id, {
        name: this.draftName().trim(),
        outcome: this.draftOutcome().trim() || null,
        status: this.draftStatus(),
      });
      this.expandedProjectId.set(null);
    } catch {
      this.errorMessage.set('Änderungen konnten nicht gespeichert werden.');
    } finally {
      this.saving.set(false);
    }
  }
}
