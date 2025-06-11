import { Component, OnInit, inject } from '@angular/core';
import { InvoiceService } from '../../services/invoice.service';
import { Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { take } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PdfService } from '../../../../services/pdf.service';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.css']
})
export class InvoiceListComponent implements OnInit {
  invoices: any[] = [];
  isLoading = true;
  filterStatus: 'all' | 'paid' | 'unpaid' = 'all';
  private auth = inject(Auth);

  constructor(
    private invoiceService: InvoiceService,
    private router: Router,
    private pdfService: PdfService
  ) {}

  ngOnInit() {
    this.loadInvoices();
  }

  loadInvoices() {
    authState(this.auth).pipe(take(1)).subscribe(user => {
      if (user) {
        this.isLoading = true;
        this.invoiceService.getInvoices(user.uid).subscribe(invoices => {
          this.invoices = invoices;
          this.isLoading = false;
        });
      }
    });
  }

  get filteredInvoices() {
    if (this.filterStatus === 'all') {
      return this.invoices;
    }
    return this.invoices.filter(invoice => invoice.status === this.filterStatus);
  }

  editInvoice(id: string) {
    this.router.navigate(['/invoices', id, 'edit']);
  }

  deleteInvoice(id: string) {
    if (confirm('Are you sure you want to delete this invoice?')) {
      this.invoiceService.deleteInvoice(id).then(() => {
        // Refresh the invoices list after deletion
        this.loadInvoices();
      }).catch(error => {
        console.error('Error deleting invoice:', error);
      });
    }
  }

  getStatusBadgeClass(status: string) {
    return {
      'bg-green-100 text-green-800': status === 'paid',
      'bg-red-100 text-red-800': status === 'unpaid'
    };
  }

  exportInvoiceToPdf(invoice: any) {
    this.pdfService.exportInvoiceToPdf(invoice);
  }
}