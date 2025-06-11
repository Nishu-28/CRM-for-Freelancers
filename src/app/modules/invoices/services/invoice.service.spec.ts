import { TestBed } from '@angular/core/testing';
import { InvoiceService } from './invoice.service';
import { Invoice } from '../models/invoice.model';

describe('InvoiceService', () => {
  let service: InvoiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InvoiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Example of using Invoice as a type only
  it('should accept Invoice type', () => {
    const invoice: Invoice = {
      userId: '1',
      clientId: '1',
      clientName: 'Test Client',
      invoiceNumber: 'INV-001',
      date: new Date(),
      dueDate: new Date(),
      items: [],
      status: 'unpaid',
      totalAmount: 0
    };
    expect(invoice).toBeTruthy();
  });
});
