import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth, authState } from '@angular/fire/auth';
import { take, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ProjectService, Project } from './services/project.service';
import { ActivityService } from '../../services/activity.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit, OnDestroy {
  private auth = inject(Auth);
  private projectService = inject(ProjectService);
  private activityService = inject(ActivityService);
  private destroy$ = new Subject<void>();
  
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  searchTerm = '';
  filterStatus = 'all';
  filterPriority = 'all';
  showAddProject = false;
  editingProject: Project | null = null;
  isLoading = true;
  
  projectForm = {
    name: '',
    description: '',
    status: 'planning' as 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled',
    priority: 'medium' as 'low' | 'medium' | 'high',
    clientName: '',
    startDate: '',
    endDate: '',
    budget: 0,
    progress: 0
  };

  ngOnInit() {
    this.loadProjects();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProjects() {
    authState(this.auth).pipe(take(1)).subscribe(user => {
      if (user) {
        this.projectService.getProjects(user.uid)
          .pipe(takeUntil(this.destroy$))
          .subscribe(projects => {
            this.projects = projects;
            this.applyFilters();
            this.isLoading = false;
          });
      }
    });
  }

  applyFilters() {
    this.filteredProjects = this.projects.filter(project => {
      const matchesSearch = !this.searchTerm || 
        project.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        project.clientName.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = this.filterStatus === 'all' || project.status === this.filterStatus;
      const matchesPriority = this.filterPriority === 'all' || project.priority === this.filterPriority;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }

  getProjectsByStatus(status: string) {
    return this.projects.filter(project => project.status === status);
  }

  getStatusBadgeClass(status: string) {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getPriorityBadgeClass(priority: string) {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  editProject(project: Project) {
    this.editingProject = project;
    this.projectForm = {
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      clientName: project.clientName,
      startDate: project.startDate ? project.startDate.toISOString().split('T')[0] : '',
      endDate: project.endDate ? project.endDate.toISOString().split('T')[0] : '',
      budget: project.budget || 0,
      progress: project.progress
    };
  }

  async saveProject() {
    authState(this.auth).pipe(take(1)).subscribe(async user => {
      if (user) {
        try {
          if (this.editingProject) {
            // Update existing project
            await this.projectService.updateProject(this.editingProject.id!, {
              name: this.projectForm.name,
              description: this.projectForm.description,
              status: this.projectForm.status,
              priority: this.projectForm.priority,
              clientName: this.projectForm.clientName,
              startDate: this.projectForm.startDate ? new Date(this.projectForm.startDate) : undefined,
              endDate: this.projectForm.endDate ? new Date(this.projectForm.endDate) : undefined,
              budget: this.projectForm.budget,
              progress: this.projectForm.progress
            });
          } else {
            // Create new project
            const newProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
              userId: user.uid,
              name: this.projectForm.name,
              description: this.projectForm.description,
              status: this.projectForm.status,
              priority: this.projectForm.priority,
              clientId: 'client_' + Date.now(), // In real app, this would be selected from clients
              clientName: this.projectForm.clientName,
              startDate: this.projectForm.startDate ? new Date(this.projectForm.startDate) : undefined,
              endDate: this.projectForm.endDate ? new Date(this.projectForm.endDate) : undefined,
              budget: this.projectForm.budget,
              progress: this.projectForm.progress,
              tasks: []
            };

            const projectId = await this.projectService.createProject(newProject);
            
            // Log activity
            await this.activityService.logProjectStarted(
              user.uid, 
              projectId, 
              this.projectForm.name, 
              this.projectForm.clientName
            );
          }
          
          this.cancelEdit();
        } catch (error) {
          console.error('Error saving project:', error);
          alert('Error saving project. Please try again.');
        }
      }
    });
  }

  async updateProjectStatus(project: Project, status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled') {
    authState(this.auth).pipe(take(1)).subscribe(async user => {
      if (user && project.id) {
        try {
          await this.projectService.updateProjectStatus(project.id, status);
          
          // Log activity for project completion
          if (status === 'completed') {
            await this.activityService.logProjectCompleted(
              user.uid, 
              project.id, 
              project.name, 
              project.clientName
            );
          }
        } catch (error) {
          console.error('Error updating project status:', error);
          alert('Error updating project status. Please try again.');
        }
      }
    });
  }

  async deleteProject(projectId: string) {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        await this.projectService.deleteProject(projectId);
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Error deleting project. Please try again.');
      }
    }
  }

  cancelEdit() {
    this.showAddProject = false;
    this.editingProject = null;
    this.projectForm = {
      name: '',
      description: '',
      status: 'planning',
      priority: 'medium',
      clientName: '',
      startDate: '',
      endDate: '',
      budget: 0,
      progress: 0
    };
  }
} 