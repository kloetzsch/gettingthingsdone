import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiConfiguration } from '../api/api-configuration';
import { createProject, getProjects, updateProject } from '../api/functions';
import { CreateProjectRequest, ProjectDto, UpdateProjectRequest } from '../api/models';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);

  readonly projects = signal<ProjectDto[]>([]);

  constructor() {
    void this.refresh();
  }

  async refresh(): Promise<void> {
    const response = await firstValueFrom(getProjects(this.http, this.apiConfig.rootUrl));
    this.projects.set(response.body);
  }

  async create(request: CreateProjectRequest): Promise<ProjectDto> {
    const response = await firstValueFrom(createProject(this.http, this.apiConfig.rootUrl, { body: request }));
    const created = response.body;
    this.projects.update((current) => [...current, created]);
    return created;
  }

  async update(id: string, request: UpdateProjectRequest): Promise<ProjectDto> {
    const response = await firstValueFrom(updateProject(this.http, this.apiConfig.rootUrl, { id, body: request }));
    const updated = response.body;
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
