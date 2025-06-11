import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, orderBy, onSnapshot, doc, getDoc, addDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Client } from '../models/client.model';
import { Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ActivityService } from '../../../services/activity.service';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private firestore = inject(Firestore);
  private activityService = inject(ActivityService);

  constructor(
    private toastr: ToastrService
  ) {}

  private convertTimestamps(data: any): any {
    if (!data) return data;
    
    const converted = { ...data };
    
    // Convert Firestore Timestamps to JavaScript Dates
    if (converted.createdAt && typeof converted.createdAt.toDate === 'function') {
      converted.createdAt = converted.createdAt.toDate();
    }
    
    return converted;
  }

  getClients(userId: string): Observable<any[]> {
    return new Observable(observer => {
      const clientsRef = collection(this.firestore, 'clients');
      const q = query(clientsRef, where('userId', '==', userId), orderBy('name'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const clients = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...this.convertTimestamps(data)
          };
        });
        observer.next(clients);
      });

      return unsubscribe;
    });
  }

  getClient(id: string): Observable<any> {
    return new Observable(observer => {
      const clientRef = doc(this.firestore, 'clients', id);
      getDoc(clientRef).then(docSnap => {
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

  async createClient(client: Client): Promise<any> {
    try {
      const clientsRef = collection(this.firestore, 'clients');
      const docRef = await addDoc(clientsRef, client);
      
      // Log activity
      await this.activityService.logClientAdded(client.userId, docRef.id, client.name);
      
      this.toastr.success('Client created successfully');
      return docRef;
    } catch (error) {
      this.toastr.error('Error creating client');
      throw error;
    }
  }

  async updateClient(id: string, client: Client): Promise<void> {
    try {
      const clientRef = doc(this.firestore, 'clients', id);
      await updateDoc(clientRef, client as any);
      
      // Log activity
      await this.activityService.logClientUpdated(client.userId, id, client.name);
      
      this.toastr.success('Client updated successfully');
    } catch (error) {
      this.toastr.error('Error updating client');
      throw error;
    }
  }

  deleteClient(id: string): Promise<void> {
    const clientRef = doc(this.firestore, 'clients', id);
    return deleteDoc(clientRef);
  }
}