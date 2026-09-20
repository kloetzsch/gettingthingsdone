import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ProjectsService } from '../../core/services/projects.service';

@Component({
  selector: 'app-project-capture',
  imports: [MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './project-capture.html',
  styleUrl: './project-capture.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCapture {
  private readonly projectsService = inject(ProjectsService);

  @ViewChild('nameInput') private nameInput?: ElementRef<HTMLInputElement>;

  protected readonly name = signal('');
  protected readonly outcome = signal('');

  protected readonly submitting = signal(false);
  protected readonly justCreated = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected canSubmit(): boolean {
    return this.name().trim().length > 0;
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
      await this.projectsService.create({
        name: this.name().trim(),
        outcome: this.outcome().trim() || null,
      });

      this.resetForm();
      this.justCreated.set(true);
      setTimeout(() => this.justCreated.set(false), 1500);
    } catch {
      this.errorMessage.set('Projekt konnte nicht gespeichert werden.');
    } finally {
      this.submitting.set(false);
    }
  }

  private resetForm(): void {
    this.name.set('');
    this.outcome.set('');
    this.nameInput?.nativeElement.focus();
  }
}
