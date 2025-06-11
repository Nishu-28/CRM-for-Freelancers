import { Component, OnInit, inject } from '@angular/core';
import { ClientService } from '../../services/client.service';
import { Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { take } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.css']
})
export class ClientListComponent implements OnInit {
  clients: any[] = [];
  isLoading = true;
  searchTerm = '';
  filterStatus: 'all' | 'active' | 'inactive' | 'prospect' = 'all';
  filterPriority: 'all' | 'high' | 'medium' | 'low' = 'all';
  private auth = inject(Auth);

  constructor(
    private clientService: ClientService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadClients();
  }

  loadClients() {
    authState(this.auth).pipe(take(1)).subscribe(user => {
      if (user) {
        this.clientService.getClients(user.uid).subscribe(clients => {
          this.clients = clients;
          this.isLoading = false;
        });
      }
    });
  }

  get filteredClients() {
    let filtered = this.clients;

    // Filter by search term
    if (this.searchTerm) {
      filtered = filtered.filter(client =>
      client.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (client.company && client.company.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (client.industry && client.industry.toLowerCase().includes(this.searchTerm.toLowerCase()))
      );
    }

    // Filter by status
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(client => client.status === this.filterStatus);
    }

    // Filter by priority
    if (this.filterPriority !== 'all') {
      filtered = filtered.filter(client => client.priority === this.filterPriority);
    }

    return filtered;
  }

  getActiveClientsCount(): number {
    return this.clients.filter(client => client.status === 'active').length;
  }

  getProspectsCount(): number {
    return this.clients.filter(client => client.status === 'prospect').length;
  }

  getHighPriorityCount(): number {
    return this.clients.filter(client => client.priority === 'high').length;
  }

  viewClient(id: string) {
    this.router.navigate(['/clients', id]);
  }

  editClient(id: string) {
    this.router.navigate(['/clients', id, 'edit']);
  }

  deleteClient(id: string) {
    if (confirm('Are you sure you want to delete this client?')) {
      this.clientService.deleteClient(id).then(() => {
        this.loadClients();
      }).catch(error => {
        console.error('Error deleting client:', error);
      });
    }
  }

  getStatusBadgeClass(status: string) {
    return {
      'bg-green-100 text-green-800': status === 'active',
      'bg-red-100 text-red-800': status === 'inactive',
      'bg-yellow-100 text-yellow-800': status === 'prospect'
    };
  }

  getPriorityBadgeClass(priority: string) {
    return {
      'bg-red-100 text-red-800': priority === 'high',
      'bg-yellow-100 text-yellow-800': priority === 'medium',
      'bg-green-100 text-green-800': priority === 'low'
    };
  }
}
