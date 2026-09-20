import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CreateTaskRequest, TaskDto, UpdateTaskRequest } from '../models/task';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/tasks';

  readonly tasks = signal<TaskDto[]>([]);

  constructor() {
    void this.refresh();
  }

  async refresh(): Promise<void> {
    this.tasks.set(await firstValueFrom(this.http.get<TaskDto[]>(this.baseUrl)));
  }

  async create(request: CreateTaskRequest): Promise<TaskDto> {
    const created = await firstValueFrom(this.http.post<TaskDto>(this.baseUrl, request));
    this.tasks.update((current) => [...current, created]);
    return created;
  }

  async update(id: string, request: UpdateTaskRequest): Promise<TaskDto> {
    const updated = await firstValueFrom(this.http.put<TaskDto>(`${this.baseUrl}/${id}`, request));
    this.tasks.update((current) => current.map((t) => (t.id === id ? updated : t)));
    return updated;
  }
}
