import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InvoiceService } from '../../services/invoice.service';
import { Invoice } from '../../models/invoice.model';
import { Auth, authState } from '@angular/fire/auth';
import { take } from 'rxjs/operators';
import { PdfService } from '../../../../services/pdf.service';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './invoice-form.component.html',
  styleUrls: ['./invoice-form.component.css']
})
export class InvoiceFormComponent implements OnInit {
  invoiceForm: FormGroup;
  isEditMode = false;
  invoiceId: string | null = null;
  isLoading = false;
  private auth = inject(Auth);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private invoiceService: InvoiceService,
    private pdfService: PdfService
  ) {
    this.invoiceForm = this.fb.group({
      clientName: ['', Validators.required],
      invoiceNumber: ['', Validators.required],
      date: ['', Validators.required],
      dueDate: ['', Validators.required],
      status: ['unpaid', Validators.required],
      items: this.fb.array([]),
      notes: ['']
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.invoiceId = params.get('id');
      if (this.invoiceId) {
        this.isEditMode = true;
        this.isLoading = true;
        this.invoiceService.getInvoice(this.invoiceId).subscribe((invoice: any) => {
          if (invoice) {
            this.invoiceForm.patchValue({ ...invoice, date: this.formatDate(invoice.date), dueDate: this.formatDate(invoice.dueDate) });
            this.items.clear();
            invoice.items.forEach((item: any) => this.items.push(this.fb.group({
              description: [item.description, Validators.required],
              quantity: [item.quantity, Validators.required],
              rate: [item.rate, Validators.required]
            })));
          }
          this.isLoading = false;
        });
      } else {
        this.addItem();
      }
    });
  }

  get items() {
    return this.invoiceForm.get('items') as FormArray;
  }

  addItem() {
    this.items.push(this.fb.group({
      description: ['', Validators.required],
      quantity: [1, Validators.required],
      rate: [0, Validators.required]
    }));
  }

  removeItem(index: number) {
    this.items.removeAt(index);
  }

  formatDate(date: any): string {
    if (!date) return '';
    
    let dateObj: Date;
    
    // Handle Firestore Timestamp
    if (date && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    }
    // Handle Date object
    else if (date instanceof Date) {
      dateObj = date;
    }
    // Handle string or number
    else {
      dateObj = new Date(date);
    }
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    return dateObj.toISOString().substring(0, 10);
  }

  onSubmit() {
    if (this.invoiceForm.invalid) return;
    this.isLoading = true;
    authState(this.auth).pipe(take(1)).subscribe(user => {
      if (!user) return;
      const formValue = this.invoiceForm.value;
      const items = formValue.items.map((item: any) => ({
        ...item,
        amount: item.quantity * item.rate
      }));
      const totalAmount = items.reduce((sum: number, item: any) => sum + item.amount, 0);
      const invoice: Invoice = {
        ...formValue,
        userId: user.uid,
        items,
        totalAmount,
        date: new Date(formValue.date),
        dueDate: new Date(formValue.dueDate)
      };
      if (this.isEditMode && this.invoiceId) {
        this.invoiceService.updateInvoice(this.invoiceId, invoice).then(() => {
          this.router.navigate(['/invoices']);
        });
      } else {
        this.invoiceService.createInvoice(invoice).then(() => {
          this.router.navigate(['/invoices']);
        });
      }
    });
  }

  exportToPdf() {
    if (this.invoiceForm.invalid) return;
    
    const formValue = this.invoiceForm.value;
    const items = formValue.items.map((item: any) => ({
      ...item,
      amount: item.quantity * item.rate
    }));
    const totalAmount = items.reduce((sum: number, item: any) => sum + item.amount, 0);
    
    const invoice = {
      ...formValue,
      items,
      totalAmount,
      date: new Date(formValue.date),
      dueDate: new Date(formValue.dueDate)
    };
    
    this.pdfService.exportInvoiceToPdf(invoice);
  }
}
