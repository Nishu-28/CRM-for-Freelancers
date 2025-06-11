import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  exportClientsToPdf(clients: any[], title: string) {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    // Prepare data for the table
    const data = clients.map(client => [
      client.name,
      client.email,
      client.phone || '-',
      client.company || '-'
    ]);
    
    // Add table
    autoTable(doc, {
      head: [['Name', 'Email', 'Phone', 'Company']],
      body: data,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    });
    
    doc.save('clients-list.pdf');
  }
  
  exportInvoiceToPdf(invoice: any) {
    const doc = new jsPDF();
    
    // Helper function to format dates
    const formatDate = (date: any): string => {
      if (!date) return 'N/A';
      
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
        return 'N/A';
      }
      
      return dateObj.toLocaleDateString();
    };
    
    // Add invoice header
    doc.setFontSize(18);
    doc.text('INVOICE', 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 14, 32);
    doc.text(`Date: ${formatDate(invoice.date)}`, 14, 38);
    doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 14, 44);
    
    // Client info
    doc.text(`Bill To: ${invoice.clientName}`, 120, 32);
    
    // Add items table
    const itemsData = invoice.items.map((item: any) => [
      item.description,
      item.quantity,
      `$${item.rate.toFixed(2)}`,
      `$${item.amount.toFixed(2)}`
    ]);
    
    autoTable(doc, {
      head: [['Description', 'Qty', 'Rate', 'Amount']],
      body: itemsData,
      startY: 60,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    });
    
    // Add total
    autoTable(doc, {
      body: [['Total', '', '', `$${invoice.totalAmount.toFixed(2)}`]],
      startY: (doc as any).lastAutoTable.finalY + 10,
      theme: 'grid',
      styles: { fontStyle: 'bold' }
    });
    
    // Add notes if available
    if (invoice.notes) {
      doc.text(`Notes: ${invoice.notes}`, 14, (doc as any).lastAutoTable.finalY + 20);
    }
    
    doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
  }
}