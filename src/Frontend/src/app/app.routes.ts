import { Routes } from '@angular/router';
import { DashboardPage } from './pages/dashboard-page/dashboard-page';
import { ProjectsPage } from './pages/projects-page/projects-page';
import { StatisticsPage } from './pages/statistics-page/statistics-page';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardPage },
  { path: 'projects', component: ProjectsPage },
  { path: 'statistics', component: StatisticsPage },
];
