import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { take, takeUntil } from 'rxjs/operators';
import { Subject, combineLatest } from 'rxjs';
import { ClientService } from '../clients/services/client.service';
import { InvoiceService } from '../invoices/services/invoice.service';
import { TaskService } from '../tasks/services/task.service';
import { ProjectService } from '../projects/services/project.service';
import { ActivityService, Activity } from '../../services/activity.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  totalClients = 0;
  totalInvoices = 0;
  totalRevenue = 0;
  pendingInvoices = 0;
  totalTasks = 0;
  totalProjects = 0;
  recentActivities: Activity[] = [];
  isLoading = true;
  
  private auth = inject(Auth);
  private clientService = inject(ClientService);
  private invoiceService = inject(InvoiceService);
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private activityService = inject(ActivityService);
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData() {
    authState(this.auth).pipe(take(1)).subscribe(user => {
      if (user) {
        // Load all data in parallel
        const clients$ = this.clientService.getClients(user.uid);
        const invoices$ = this.invoiceService.getInvoices(user.uid);
        const tasks$ = this.taskService.getTasks(user.uid);
        const projects$ = this.projectService.getProjects(user.uid);
        const activities$ = this.activityService.getRecentActivities(user.uid, 6);

        combineLatest([clients$, invoices$, tasks$, projects$, activities$])
          .pipe(takeUntil(this.destroy$))
          .subscribe(([clients, invoices, tasks, projects, activities]) => {
            this.totalClients = clients.length;
            this.totalInvoices = invoices.length;
            this.totalRevenue = invoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
            this.pendingInvoices = invoices.filter(invoice => invoice.status === 'unpaid').length;
            this.totalTasks = tasks.length;
            this.totalProjects = projects.length;
            this.recentActivities = activities;
            this.isLoading = false;
          });
      }
    });
  }

  getActivityIcon(type: Activity['type']): string {
    switch (type) {
      case 'client_added':
        return 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z';
      case 'client_updated':
        return 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z';
      case 'invoice_created':
        return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
      case 'invoice_paid':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'project_started':
        return 'M13 10V3L4 14h7v7l9-11h-7z';
      case 'project_completed':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'task_created':
        return 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01';
      case 'task_completed':
        return 'M5 13l4 4L19 7';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  getActivityColor(type: Activity['type']): string {
    switch (type) {
      case 'client_added':
        return 'bg-blue-500';
      case 'client_updated':
        return 'bg-yellow-500';
      case 'invoice_created':
        return 'bg-green-500';
      case 'invoice_paid':
        return 'bg-purple-500';
      case 'project_started':
        return 'bg-indigo-500';
      case 'project_completed':
        return 'bg-emerald-500';
      case 'task_created':
        return 'bg-orange-500';
      case 'task_completed':
        return 'bg-emerald-500';
      default:
        return 'bg-gray-500';
    }
  }

  formatTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - timestamp.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
  }
} 