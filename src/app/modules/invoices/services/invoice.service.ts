import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, orderBy, onSnapshot, doc, getDoc, addDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Invoice } from '../models/invoice.model';
import { Observable } from 'rxjs';
import { ActivityService } from '../../../services/activity.service';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private firestore = inject(Firestore);
  private activityService = inject(ActivityService);

  private convertTimestamps(data: any): any {
    if (!data) return data;
    
    const converted = { ...data };
    
    // Convert Firestore Timestamps to JavaScript Dates
    if (converted.date && typeof converted.date.toDate === 'function') {
      converted.date = converted.date.toDate();
    }
    if (converted.dueDate && typeof converted.dueDate.toDate === 'function') {
      converted.dueDate = converted.dueDate.toDate();
    }
    
    return converted;
  }

  getInvoices(userId: string): Observable<any[]> {
    return new Observable(observer => {
      const invoicesRef = collection(this.firestore, 'invoices');
      const q = query(invoicesRef, where('userId', '==', userId), orderBy('date', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const invoices = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...this.convertTimestamps(data)
          };
        });
        observer.next(invoices);
      });

      return unsubscribe;
    });
  }

  getInvoice(id: string): Observable<any> {
    return new Observable(observer => {
      const invoiceRef = doc(this.firestore, 'invoices', id);
      getDoc(invoiceRef).then(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          observer.next({ 
            id: docSnap.id, 
            ...this.convertTimestamps(data)
          });
        } else {
          observer.next(null);
        }
      });
    });
  }

  async createInvoice(invoice: Invoice): Promise<any> {
    try {
      const invoicesRef = collection(this.firestore, 'invoices');
      const docRef = await addDoc(invoicesRef, invoice);
      
      // Log activity
      await this.activityService.logInvoiceCreated(
        invoice.userId, 
        docRef.id, 
        invoice.invoiceNumber, 
        invoice.clientName
      );
      
      return docRef;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  async updateInvoice(id: string, invoice: Invoice): Promise<void> {
    try {
      const invoiceRef = doc(this.firestore, 'invoices', id);
      await updateDoc(invoiceRef, invoice as any);
      
      // Log activity if invoice is marked as paid
      if (invoice.status === 'paid') {
        await this.activityService.logInvoicePaid(
          invoice.userId, 
          id, 
          invoice.invoiceNumber, 
          invoice.clientName
        );
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  deleteInvoice(id: string): Promise<void> {
    const invoiceRef = doc(this.firestore, 'invoices', id);
    return deleteDoc(invoiceRef);
  }
}