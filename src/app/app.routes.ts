import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./components/login.component/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    loadComponent: () => import('./components/layout.component/layout.component').then(m => m.LayoutComponent),
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./modules/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'clients', loadChildren: () => import('./modules/clients/clients.module').then(m => m.ClientsModule) },
      { path: 'invoices', loadChildren: () => import('./modules/invoices/invoices.module').then(m => m.InvoicesModule) },
      { path: 'projects', loadComponent: () => import('./modules/projects/projects.component').then(m => m.ProjectsComponent) },
      { path: 'tasks', loadComponent: () => import('./modules/tasks/tasks.component').then(m => m.TasksComponent) },
      { path: 'reports', loadComponent: () => import('./modules/reports/reports.component').then(m => m.ReportsComponent) },
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];