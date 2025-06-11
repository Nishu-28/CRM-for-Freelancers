import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, addDoc, query, where, orderBy, limit, onSnapshot, Timestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Activity {
  id?: string;
  userId: string;
  type: 'client_added' | 'client_updated' | 'invoice_created' | 'invoice_paid' | 'project_started' | 'project_completed' | 'task_created' | 'task_completed';
  description: string;
  entityId?: string;
  entityName?: string;
  timestamp: Date;
  metadata?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private firestore = inject(Firestore);

  getRecentActivities(userId: string, limitCount: number = 10): Observable<Activity[]> {
    const activitiesRef = collection(this.firestore, 'activities');
    const q = query(
      activitiesRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    return new Observable<Activity[]>(observer => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const activities: Activity[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          activities.push({
            id: doc.id,
            userId: data['userId'],
            type: data['type'],
            description: data['description'],
            entityId: data['entityId'],
            entityName: data['entityName'],
            timestamp: (data['timestamp'] as Timestamp).toDate(),
            metadata: data['metadata']
          });
        });
        observer.next(activities);
      });

      return unsubscribe;
    });
  }

  async logActivity(activity: Omit<Activity, 'id' | 'timestamp'>): Promise<string> {
    const activitiesRef = collection(this.firestore, 'activities');
    const activityData = {
      ...activity,
      timestamp: Timestamp.now()
    };

    const docRef = await addDoc(activitiesRef, activityData);
    return docRef.id;
  }

  async logClientAdded(userId: string, clientId: string, clientName: string): Promise<void> {
    await this.logActivity({
      userId,
      type: 'client_added',
      description: `New client "${clientName}" added`,
      entityId: clientId,
      entityName: clientName
    });
  }

  async logClientUpdated(userId: string, clientId: string, clientName: string): Promise<void> {
    await this.logActivity({
      userId,
      type: 'client_updated',
      description: `Updated client "${clientName}" information`,
      entityId: clientId,
      entityName: clientName
    });
  }

  async logInvoiceCreated(userId: string, invoiceId: string, invoiceNumber: string, clientName: string): Promise<void> {
    await this.logActivity({
      userId,
      type: 'invoice_created',
      description: `Created invoice ${invoiceNumber} for ${clientName}`,
      entityId: invoiceId,
      entityName: invoiceNumber
    });
  }

  async logInvoicePaid(userId: string, invoiceId: string, invoiceNumber: string, clientName: string): Promise<void> {
    await this.logActivity({
      userId,
      type: 'invoice_paid',
      description: `Invoice ${invoiceNumber} marked as paid for ${clientName}`,
      entityId: invoiceId,
      entityName: invoiceNumber
    });
  }

  async logProjectStarted(userId: string, projectId: string, projectName: string, clientName: string): Promise<void> {
    await this.logActivity({
      userId,
      type: 'project_started',
      description: `Started project "${projectName}" for ${clientName}`,
      entityId: projectId,
      entityName: projectName
    });
  }

  async logProjectCompleted(userId: string, projectId: string, projectName: string, clientName: string): Promise<void> {
    await this.logActivity({
      userId,
      type: 'project_completed',
      description: `Completed project "${projectName}" for ${clientName}`,
      entityId: projectId,
      entityName: projectName
    });
  }

  async logTaskCreated(userId: string, taskId: string, taskTitle: string, clientName?: string): Promise<void> {
    const description = clientName 
      ? `Created task "${taskTitle}" for ${clientName}`
      : `Created task "${taskTitle}"`;
    
    await this.logActivity({
      userId,
      type: 'task_created',
      description,
      entityId: taskId,
      entityName: taskTitle
    });
  }

  async logTaskCompleted(userId: string, taskId: string, taskTitle: string, clientName?: string): Promise<void> {
    const description = clientName 
      ? `Completed task "${taskTitle}" for ${clientName}`
      : `Completed task "${taskTitle}"`;
    
    await this.logActivity({
      userId,
      type: 'task_completed',
      description,
      entityId: taskId,
      entityName: taskTitle
    });
  }
}
