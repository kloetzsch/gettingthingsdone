import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CategoryDto, ProjectDto } from '../../core/api/models';
import { CategoriesService } from '../../core/services/categories.service';
import { ProjectsService } from '../../core/services/projects.service';
import { TasksService } from '../../core/services/tasks.service';
import { TaskCapture } from './task-capture';

describe('TaskCapture', () => {
  const categories = signal<CategoryDto[]>([]);
  const projects = signal<ProjectDto[]>([]);

  beforeEach(async () => {
    categories.set([]);
    projects.set([]);

    await TestBed.configureTestingModule({
      imports: [TaskCapture],
      providers: [
        { provide: CategoriesService, useValue: { categories } },
        { provide: ProjectsService, useValue: { projects } },
        { provide: TasksService, useValue: { create: () => Promise.resolve() } },
      ],
    }).compileComponents();
  });

  function tabIndexes(fixture: { nativeElement: HTMLElement }, groupLabel: string): (string | null)[] {
    const group = fixture.nativeElement.querySelector(`mat-button-toggle-group[aria-label="${groupLabel}"]`)!;
    return Array.from(group.querySelectorAll('button')).map((button) => button.getAttribute('tabindex'));
  }

  it('keeps a single tab stop per group when options arrive after the first render', async () => {
    const fixture = TestBed.createComponent(TaskCapture);
    await fixture.whenStable();

    categories.set([
      { id: 'c1', name: 'Haushalt' },
      { id: 'c2', name: 'Arbeit' },
    ] as CategoryDto[]);
    projects.set([
      { id: 'p1', name: 'Umzug', status: 'Active' },
      { id: 'p2', name: 'Garten', status: 'Active' },
    ] as ProjectDto[]);
    await fixture.whenStable();

    expect(tabIndexes(fixture, 'Kategorie')).toEqual(['0', '-1', '-1']);
    expect(tabIndexes(fixture, 'Projekt')).toEqual(['0', '-1', '-1']);
  });

  it('moves the tab stop to the option selected via arrow keys', async () => {
    categories.set([{ id: 'c1', name: 'Haushalt' }] as CategoryDto[]);
    const fixture = TestBed.createComponent(TaskCapture);
    await fixture.whenStable();

    const first = fixture.nativeElement.querySelector('mat-button-toggle-group[aria-label="Kategorie"] button') as HTMLButtonElement;
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, bubbles: true }));
    await fixture.whenStable();

    expect(tabIndexes(fixture, 'Kategorie')).toEqual(['-1', '0']);
  });
});
