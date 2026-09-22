import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CategoriesService } from '../../core/services/categories.service';

@Component({
  selector: 'app-category-list',
  imports: [MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './category-list.html',
  styleUrl: './category-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryList {
  protected readonly categoriesService = inject(CategoriesService);

  @ViewChild('nameInput') private nameInput?: ElementRef<HTMLInputElement>;

  protected readonly newName = signal('');
  protected readonly submitting = signal(false);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected canSubmit(): boolean {
    return this.newName().trim().length > 0;
  }

  protected onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    void this.add();
  }

  private async add(): Promise<void> {
    if (!this.canSubmit() || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    try {
      await this.categoriesService.create({ name: this.newName().trim() });
      this.newName.set('');
      this.nameInput?.nativeElement.focus();
    } catch {
      this.errorMessage.set('Kategorie konnte nicht angelegt werden (existiert sie schon?).');
    } finally {
      this.submitting.set(false);
    }
  }

  protected async remove(id: string): Promise<void> {
    if (this.deletingId()) {
      return;
    }

    this.deletingId.set(id);
    this.errorMessage.set(null);

    try {
      await this.categoriesService.delete(id);
    } catch {
      this.errorMessage.set('Kategorie konnte nicht gelöscht werden.');
    } finally {
      this.deletingId.set(null);
    }
  }
}
