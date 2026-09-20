import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TaskCapture } from '../../features/task-capture/task-capture';
import { TaskList } from '../../features/task-list/task-list';

@Component({
  selector: 'app-dashboard-page',
  imports: [TaskCapture, TaskList],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {}
