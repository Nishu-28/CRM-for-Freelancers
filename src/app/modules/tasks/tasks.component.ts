import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth, authState } from '@angular/fire/auth';
import { take, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { TaskService, Task } from './services/task.service';
import { ActivityService } from '../../services/activity.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TasksComponent implements OnInit, OnDestroy {
  private auth = inject(Auth);
  private taskService = inject(TaskService);
  private activityService = inject(ActivityService);
  private destroy$ = new Subject<void>();
  
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  searchTerm = '';
  filterStatus = 'all';
  filterPriority = 'all';
  showAddTask = false;
  editingTask: Task | null = null;
  isLoading = true;
  
  taskForm = {
    title: '',
    description: '',
    status: 'todo' as 'todo' | 'in-progress' | 'completed',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
    clientName: ''
  };

  ngOnInit() {
    this.loadTasks();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTasks() {
    authState(this.auth).pipe(take(1)).subscribe(user => {
      if (user) {
        this.taskService.getTasks(user.uid)
          .pipe(takeUntil(this.destroy$))
          .subscribe(tasks => {
            this.tasks = tasks;
            this.applyFilters();
            this.isLoading = false;
          });
      }
    });
  }

  applyFilters() {
    this.filteredTasks = this.tasks.filter(task => {
      const matchesSearch = !this.searchTerm || 
        task.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (task.clientName && task.clientName.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      const matchesStatus = this.filterStatus === 'all' || task.status === this.filterStatus;
      const matchesPriority = this.filterPriority === 'all' || task.priority === this.filterPriority;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }

  getTasksByStatus(status: string) {
    return this.tasks.filter(task => task.status === status);
  }

  getOverdueTasks() {
    const today = new Date();
    return this.tasks.filter(task => 
      task.dueDate && task.status !== 'completed' && task.dueDate < today
    );
  }

  getStatusBadgeClass(status: string) {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
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

  getPriorityBorderClass(priority: string) {
    switch (priority) {
      case 'high': return 'border-red-500';
      case 'medium': return 'border-yellow-500';
      case 'low': return 'border-green-500';
      default: return 'border-gray-300';
    }
  }

  editTask(task: Task) {
    this.editingTask = task;
    this.taskForm = {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : '',
      clientName: task.clientName || ''
    };
  }

  async saveTask() {
    authState(this.auth).pipe(take(1)).subscribe(async user => {
      if (user) {
        try {
          if (this.editingTask) {
            // Update existing task
            await this.taskService.updateTask(this.editingTask.id!, {
              title: this.taskForm.title,
              description: this.taskForm.description,
              status: this.taskForm.status,
              priority: this.taskForm.priority,
              dueDate: this.taskForm.dueDate ? new Date(this.taskForm.dueDate) : undefined,
              clientName: this.taskForm.clientName || undefined
            });
          } else {
            // Create new task
            const newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
              userId: user.uid,
              title: this.taskForm.title,
              description: this.taskForm.description,
              status: this.taskForm.status,
              priority: this.taskForm.priority,
              dueDate: this.taskForm.dueDate ? new Date(this.taskForm.dueDate) : undefined,
              clientName: this.taskForm.clientName || undefined
            };

            const taskId = await this.taskService.createTask(newTask);
            
            // Log activity
            await this.activityService.logTaskCreated(
              user.uid, 
              taskId, 
              this.taskForm.title, 
              this.taskForm.clientName
            );
          }
          
          this.cancelEdit();
        } catch (error) {
          console.error('Error saving task:', error);
          alert('Error saving task. Please try again.');
        }
      }
    });
  }

  async updateTaskStatus(task: Task, status: 'todo' | 'in-progress' | 'completed') {
    authState(this.auth).pipe(take(1)).subscribe(async user => {
      if (user && task.id) {
        try {
          await this.taskService.updateTaskStatus(task.id, status);
          
          // Log activity for task completion
          if (status === 'completed') {
            await this.activityService.logTaskCompleted(
              user.uid, 
              task.id, 
              task.title, 
              task.clientName
            );
          }
        } catch (error) {
          console.error('Error updating task status:', error);
          alert('Error updating task status. Please try again.');
        }
      }
    });
  }

  async deleteTask(taskId: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await this.taskService.deleteTask(taskId);
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('Error deleting task. Please try again.');
      }
    }
  }

  cancelEdit() {
    this.showAddTask = false;
    this.editingTask = null;
    this.taskForm = {
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: '',
      clientName: ''
    };
  }
} 