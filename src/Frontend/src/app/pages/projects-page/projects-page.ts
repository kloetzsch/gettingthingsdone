import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProjectCapture } from '../../features/project-capture/project-capture';
import { ProjectList } from '../../features/project-list/project-list';

@Component({
  selector: 'app-projects-page',
  imports: [ProjectCapture, ProjectList],
  templateUrl: './projects-page.html',
  styleUrl: './projects-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsPage {}
