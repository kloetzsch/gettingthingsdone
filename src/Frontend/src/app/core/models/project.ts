export type ProjectStatus = 'Active' | 'OnHold' | 'Completed';

export interface ProjectDto {
  id: string;
  name: string;
  outcome: string | null;
  status: ProjectStatus;
  createdAt: string;
}

export interface CreateProjectRequest {
  name: string;
  outcome: string | null;
}

export interface UpdateProjectRequest {
  name: string;
  outcome: string | null;
  status: ProjectStatus;
}
