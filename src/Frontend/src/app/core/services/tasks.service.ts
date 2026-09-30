import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiConfiguration } from '../api/api-configuration';
import { createTask, getTasks, reorderTasks, updateTask } from '../api/functions';
import { CreateTaskRequest, TaskDto, UpdateTaskRequest } from '../api/models';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);

  readonly tasks = signal<TaskDto[]>([]);

  constructor() {
    void this.refresh();
  }

  async refresh(): Promise<void> {
    const response = await firstValueFrom(getTasks(this.http, this.apiConfig.rootUrl));
    this.tasks.set(response.body);
  }

  async create(request: CreateTaskRequest): Promise<TaskDto> {
    const response = await firstValueFrom(createTask(this.http, this.apiConfig.rootUrl, { body: request }));
    const created = response.body;
    this.tasks.update((current) => [...current, created]);
    return created;
  }

  async update(id: string, request: UpdateTaskRequest): Promise<TaskDto> {
    const response = await firstValueFrom(updateTask(this.http, this.apiConfig.rootUrl, { id, body: request }));
    const updated = response.body;
    this.tasks.update((current) => current.map((t) => (t.id === id ? updated : t)));
    return updated;
  }

  /**
   * Speichert eine neue Priorität: die erste Id kommt ganz nach oben. Die Liste wird sofort
   * umsortiert, damit das Ziehen nicht auf den Server wartet; schlägt das Speichern fehl,
   * wird der Serverstand neu geladen.
   */
  async reorder(orderedIds: string[]): Promise<void> {
    const positions = new Map(orderedIds.map((id, index) => [id, index]));
    this.tasks.update((current) =>
      current.map((t) => (positions.has(t.id) ? { ...t, sortOrder: positions.get(t.id)! } : t)),
    );

    try {
      await firstValueFrom(reorderTasks(this.http, this.apiConfig.rootUrl, { body: { taskIds: orderedIds } }));
    } catch (error) {
      await this.refresh();
      throw error;
    }
  }
}
