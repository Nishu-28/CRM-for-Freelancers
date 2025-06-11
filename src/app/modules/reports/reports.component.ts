import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth, authState } from '@angular/fire/auth';
import { take, takeUntil } from 'rxjs/operators';
import { Subject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { ClientService } from '../clients/services/client.service';
import { InvoiceService } from '../invoices/services/invoice.service';
import { TaskService } from '../tasks/services/task.service';
import { ProjectService } from '../projects/services/project.service';

interface ReportData {
  totalRevenue: number;
  totalClients: number;
  totalInvoices: number;
  pendingInvoices: number;
  monthlyRevenue: { month: string; amount: number }[];
  clientRevenue: { client: string; amount: number }[];
  invoiceStatus: { status: string; count: number }[];
  topClients: { name: string; revenue: number; invoices: number }[];
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit, OnDestroy {
  private auth = inject(Auth);
  private clientService = inject(ClientService);
  private invoiceService = inject(InvoiceService);
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private destroy$ = new Subject<void>();
  
  reportData: ReportData = {
    totalRevenue: 0,
    totalClients: 0,
    totalInvoices: 0,
    pendingInvoices: 0,
    monthlyRevenue: [],
    clientRevenue: [],
    invoiceStatus: [],
    topClients: []
  };

  isLoading = true;

  ngOnInit() {
    this.loadReportData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadReportData() {
    authState(this.auth).pipe(take(1)).subscribe(user => {
      if (user) {
        const clients$ = this.clientService.getClients(user.uid);
        const invoices$ = this.invoiceService.getInvoices(user.uid);
        const tasks$ = this.taskService.getTasks(user.uid);
        const projects$ = this.projectService.getProjects(user.uid);

        combineLatest([clients$, invoices$, tasks$, projects$])
          .pipe(
            takeUntil(this.destroy$),
            map(([clients, invoices, tasks, projects]) => {
              return this.generateReportData(clients, invoices, tasks, projects);
            })
          )
          .subscribe(data => {
            this.reportData = data;
            this.isLoading = false;
          });
      }
    });
  }

  generateReportData(clients: any[], invoices: any[], tasks: any[], projects: any[]): ReportData {
    // Calculate total revenue
    const totalRevenue = invoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
    
    // Calculate pending invoices
    const pendingInvoices = invoices.filter(invoice => invoice.status === 'unpaid').length;
    
    // Generate monthly revenue data (last 6 months)
    const monthlyRevenue = this.generateMonthlyRevenue(invoices);
    
    // Generate client revenue data
    const clientRevenue = this.generateClientRevenue(invoices, clients);
    
    // Generate invoice status distribution
    const invoiceStatus = this.generateInvoiceStatus(invoices);
    
    // Generate top clients
    const topClients = this.generateTopClients(invoices, clients);

    return {
      totalRevenue,
      totalClients: clients.length,
      totalInvoices: invoices.length,
      pendingInvoices,
      monthlyRevenue,
      clientRevenue,
      invoiceStatus,
      topClients
    };
  }

  generateMonthlyRevenue(invoices: any[]): { month: string; amount: number }[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData: { [key: string]: number } = {};
    
    // Initialize last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = months[date.getMonth()];
      monthlyData[monthKey] = 0;
    }
    
    // Calculate revenue for each month
    invoices.forEach(invoice => {
      if (invoice.createdAt && invoice.status === 'paid') {
        const invoiceDate = invoice.createdAt.toDate ? invoice.createdAt.toDate() : new Date(invoice.createdAt);
        const monthKey = months[invoiceDate.getMonth()];
        if (monthlyData.hasOwnProperty(monthKey)) {
          monthlyData[monthKey] += invoice.totalAmount || 0;
        }
      }
    });
    
    return Object.entries(monthlyData).map(([month, amount]) => ({ month, amount }));
  }

  generateClientRevenue(invoices: any[], clients: any[]): { client: string; amount: number }[] {
    const clientRevenue: { [key: string]: number } = {};
    
    invoices.forEach(invoice => {
      if (invoice.status === 'paid') {
        const clientName = invoice.clientName || 'Unknown Client';
        clientRevenue[clientName] = (clientRevenue[clientName] || 0) + (invoice.totalAmount || 0);
      }
    });
    
    return Object.entries(clientRevenue)
      .map(([client, amount]) => ({ client, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }

  generateInvoiceStatus(invoices: any[]): { status: string; count: number }[] {
    const statusCount: { [key: string]: number } = {};
    
    invoices.forEach(invoice => {
      const status = invoice.status || 'unknown';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    return Object.entries(statusCount).map(([status, count]) => ({ status, count }));
  }

  generateTopClients(invoices: any[], clients: any[]): { name: string; revenue: number; invoices: number }[] {
    const clientStats: { [key: string]: { revenue: number; invoices: number } } = {};
    
    invoices.forEach(invoice => {
      const clientName = invoice.clientName || 'Unknown Client';
      if (!clientStats[clientName]) {
        clientStats[clientName] = { revenue: 0, invoices: 0 };
      }
      clientStats[clientName].invoices += 1;
      if (invoice.status === 'paid') {
        clientStats[clientName].revenue += invoice.totalAmount || 0;
      }
    });
    
    return Object.entries(clientStats)
      .map(([name, stats]) => ({ name, revenue: stats.revenue, invoices: stats.invoices }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }

  getPercentage(value: number, max: number): number {
    return max > 0 ? (value / max) * 100 : 0;
  }

  getMaxRevenue(): number {
    return Math.max(...this.reportData.monthlyRevenue.map(item => item.amount));
  }

  getMaxClientRevenue(): number {
    return Math.max(...this.reportData.clientRevenue.map(item => item.amount));
  }

  getMaxInvoiceCount(): number {
    return Math.max(...this.reportData.invoiceStatus.map(item => item.count));
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'paid': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'unpaid': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }

  getAverageInvoiceValue(): number {
    return this.reportData.totalInvoices > 0 ? this.reportData.totalRevenue / this.reportData.totalInvoices : 0;
  }

  getPaymentRate(): number {
    const paidInvoices = this.reportData.invoiceStatus.find(item => item.status === 'paid')?.count || 0;
    return this.reportData.totalInvoices > 0 ? Math.round((paidInvoices / this.reportData.totalInvoices) * 100) : 0;
  }

  getRevenuePerClient(): number {
    return this.reportData.totalClients > 0 ? this.reportData.totalRevenue / this.reportData.totalClients : 0;
  }

  refreshData() {
    this.isLoading = true;
    this.loadReportData();
  }

  exportReport() {
    // In a real app, this would generate and download a PDF or Excel report
    const reportContent = `
      Business Report - ${new Date().toLocaleDateString()}
      
      Key Metrics:
      - Total Revenue: $${this.reportData.totalRevenue.toLocaleString()}
      - Total Clients: ${this.reportData.totalClients}
      - Total Invoices: ${this.reportData.totalInvoices}
      - Pending Invoices: ${this.reportData.pendingInvoices}
      
      Top Clients:
      ${this.reportData.topClients.map(client => 
        `- ${client.name}: $${client.revenue.toLocaleString()} (${client.invoices} invoices)`
      ).join('\n')}
    `;
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
} 