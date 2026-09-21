import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CategoryDto, CreateCategoryRequest } from '../models/category';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/categories';

  readonly categories = signal<CategoryDto[]>([]);

  constructor() {
    void this.refresh();
  }

  async refresh(): Promise<void> {
    const categories = await firstValueFrom(this.http.get<CategoryDto[]>(this.baseUrl));
    this.categories.set([...categories].sort((a, b) => a.name.localeCompare(b.name)));
  }

  async create(request: CreateCategoryRequest): Promise<CategoryDto> {
    const created = await firstValueFrom(this.http.post<CategoryDto>(this.baseUrl, request));
    this.categories.update((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
    return created;
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${id}`));
    this.categories.update((current) => current.filter((category) => category.id !== id));
  }
}
