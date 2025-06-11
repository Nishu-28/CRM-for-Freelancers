import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService } from '../../services/client.service';
import { Client, Contact, Note } from '../../models/client.model';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-detail.component.html',
  styleUrls: ['./client-detail.component.css']
})
export class ClientDetailComponent implements OnInit {
  client: Client | null = null;
  isLoading = true;
  activeTab: 'overview' | 'contacts' | 'notes' = 'overview';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientService: ClientService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const clientId = params.get('id');
      if (clientId) {
        this.loadClient(clientId);
      }
    });
  }

  loadClient(clientId: string) {
    this.isLoading = true;
    this.clientService.getClient(clientId).subscribe(client => {
      this.client = client;
      this.isLoading = false;
    });
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

  getNoteTypeBadgeClass(type: string) {
    return {
      'bg-blue-100 text-blue-800': type === 'general',
      'bg-purple-100 text-purple-800': type === 'meeting',
      'bg-green-100 text-green-800': type === 'call',
      'bg-orange-100 text-orange-800': type === 'email',
      'bg-red-100 text-red-800': type === 'task'
    };
  }

  getNotePriorityBadgeClass(priority: string) {
    return {
      'bg-red-100 text-red-800': priority === 'high',
      'bg-yellow-100 text-yellow-800': priority === 'medium',
      'bg-green-100 text-green-800': priority === 'low'
    };
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    
    let dateObj: Date;
    
    if (date && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      dateObj = new Date(date);
    }
    
    if (isNaN(dateObj.getTime())) {
      return 'N/A';
    }
    
    return dateObj.toLocaleDateString();
  }

  editClient() {
    if (this.client) {
      this.router.navigate(['/clients', this.client.id, 'edit']);
    }
  }

  goBack() {
    this.router.navigate(['/clients']);
  }
} 