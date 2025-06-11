import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, Timestamp } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';

export interface Task {
  id?: string;
  userId: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  clientId?: string;
  clientName?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private firestore = inject(Firestore);

  getTasks(userId: string): Observable<Task[]> {
    const tasksRef = collection(this.firestore, 'tasks');
    const q = query(
      tasksRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return new Observable<Task[]>(observer => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tasks: Task[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          tasks.push({
            id: doc.id,
            userId: data['userId'],
            title: data['title'],
            description: data['description'],
            status: data['status'],
            priority: data['priority'],
            dueDate: data['dueDate'] ? (data['dueDate'] as Timestamp).toDate() : undefined,
            clientId: data['clientId'],
            clientName: data['clientName'],
            createdAt: (data['createdAt'] as Timestamp).toDate(),
            updatedAt: (data['updatedAt'] as Timestamp).toDate()
          });
        });
        observer.next(tasks);
      });

      return unsubscribe;
    });
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const tasksRef = collection(this.firestore, 'tasks');
    const taskData = {
      ...task,
      dueDate: task.dueDate ? Timestamp.fromDate(task.dueDate) : null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(tasksRef, taskData);
    return docRef.id;
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    const taskRef = doc(this.firestore, 'tasks', taskId);
    const updateData = {
      ...updates,
      dueDate: updates.dueDate ? Timestamp.fromDate(updates.dueDate) : null,
      updatedAt: Timestamp.now()
    };

    await updateDoc(taskRef, updateData);
  }

  async deleteTask(taskId: string): Promise<void> {
    const taskRef = doc(this.firestore, 'tasks', taskId);
    await deleteDoc(taskRef);
  }

  async updateTaskStatus(taskId: string, status: 'todo' | 'in-progress' | 'completed'): Promise<void> {
    const taskRef = doc(this.firestore, 'tasks', taskId);
    await updateDoc(taskRef, {
      status,
      updatedAt: Timestamp.now()
    });
  }
} 