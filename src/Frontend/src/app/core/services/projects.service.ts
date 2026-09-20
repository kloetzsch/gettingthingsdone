import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CreateProjectRequest, ProjectDto, UpdateProjectRequest } from '../models/project';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/projects';

  readonly projects = signal<ProjectDto[]>([]);

  constructor() {
    void this.refresh();
  }

  async refresh(): Promise<void> {
    this.projects.set(await firstValueFrom(this.http.get<ProjectDto[]>(this.baseUrl)));
  }

  async create(request: CreateProjectRequest): Promise<ProjectDto> {
    const created = await firstValueFrom(this.http.post<ProjectDto>(this.baseUrl, request));
    this.projects.update((current) => [...current, created]);
    return created;
  }

  async update(id: string, request: UpdateProjectRequest): Promise<ProjectDto> {
    const updated = await firstValueFrom(this.http.put<ProjectDto>(`${this.baseUrl}/${id}`, request));
    this.projects.update((current) => current.map((p) => (p.id === id ? updated : p)));
    return updated;
  }

  nameOf(projectId: string | null): string | null {
    if (!projectId) {
      return null;
    }
    return this.projects().find((p) => p.id === projectId)?.name ?? null;
  }
}
