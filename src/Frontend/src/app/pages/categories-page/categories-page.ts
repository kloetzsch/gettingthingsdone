import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CategoryList } from '../../features/category-list/category-list';

@Component({
  selector: 'app-categories-page',
  imports: [CategoryList],
  templateUrl: './categories-page.html',
  styleUrl: './categories-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesPage {}
