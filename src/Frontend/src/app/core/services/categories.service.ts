import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiConfiguration } from '../api/api-configuration';
import { createCategory, deleteCategory, getCategories } from '../api/functions';
import { CategoryDto, CreateCategoryRequest } from '../api/models';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);

  readonly categories = signal<CategoryDto[]>([]);

  constructor() {
    void this.refresh();
  }

  async refresh(): Promise<void> {
    const response = await firstValueFrom(getCategories(this.http, this.apiConfig.rootUrl));
    this.categories.set([...response.body].sort((a, b) => a.name.localeCompare(b.name)));
  }

  async create(request: CreateCategoryRequest): Promise<CategoryDto> {
    const response = await firstValueFrom(createCategory(this.http, this.apiConfig.rootUrl, { body: request }));
    const created = response.body;
    this.categories.update((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
    return created;
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(deleteCategory(this.http, this.apiConfig.rootUrl, { id }));
    this.categories.update((current) => current.filter((category) => category.id !== id));
  }
}
