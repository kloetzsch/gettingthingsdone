import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CompletedTimeChart } from '../../features/completed-time-chart/completed-time-chart';

@Component({
  selector: 'app-statistics-page',
  imports: [CompletedTimeChart],
  templateUrl: './statistics-page.html',
  styleUrl: './statistics-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsPage {}
