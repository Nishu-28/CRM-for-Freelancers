export interface Invoice {
    userId: string;
    clientId: string;
    clientName: string;
    invoiceNumber: string;
    date: Date;
    dueDate: Date;
    items: InvoiceItem[];
    status: 'paid' | 'unpaid';
    notes?: string;
    totalAmount: number;
}

export interface InvoiceItem {
    description: string;
    quantity: number;
    rate: number;
    amount: number;
}