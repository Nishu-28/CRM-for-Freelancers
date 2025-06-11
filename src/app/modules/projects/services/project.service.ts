import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, Timestamp } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';

export interface Project {
  id?: string;
  userId: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  clientId: string;
  clientName: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  progress: number; // 0-100
  tasks: string[]; // Task IDs
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private firestore = inject(Firestore);

  getProjects(userId: string): Observable<Project[]> {
    const projectsRef = collection(this.firestore, 'projects');
    const q = query(
      projectsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return new Observable<Project[]>(observer => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const projects: Project[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          projects.push({
            id: doc.id,
            userId: data['userId'],
            name: data['name'],
            description: data['description'],
            status: data['status'],
            priority: data['priority'],
            clientId: data['clientId'],
            clientName: data['clientName'],
            startDate: data['startDate'] ? (data['startDate'] as Timestamp).toDate() : undefined,
            endDate: data['endDate'] ? (data['endDate'] as Timestamp).toDate() : undefined,
            budget: data['budget'],
            progress: data['progress'],
            tasks: data['tasks'] || [],
            createdAt: (data['createdAt'] as Timestamp).toDate(),
            updatedAt: (data['updatedAt'] as Timestamp).toDate()
          });
        });
        observer.next(projects);
      });

      return unsubscribe;
    });
  }

  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const projectsRef = collection(this.firestore, 'projects');
    const projectData = {
      ...project,
      startDate: project.startDate ? Timestamp.fromDate(project.startDate) : null,
      endDate: project.endDate ? Timestamp.fromDate(project.endDate) : null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(projectsRef, projectData);
    return docRef.id;
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    const projectRef = doc(this.firestore, 'projects', projectId);
    const updateData = {
      ...updates,
      startDate: updates.startDate ? Timestamp.fromDate(updates.startDate) : null,
      endDate: updates.endDate ? Timestamp.fromDate(updates.endDate) : null,
      updatedAt: Timestamp.now()
    };

    await updateDoc(projectRef, updateData);
  }

  async deleteProject(projectId: string): Promise<void> {
    const projectRef = doc(this.firestore, 'projects', projectId);
    await deleteDoc(projectRef);
  }

  async updateProjectStatus(projectId: string, status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled'): Promise<void> {
    const projectRef = doc(this.firestore, 'projects', projectId);
    await updateDoc(projectRef, {
      status,
      updatedAt: Timestamp.now()
    });
  }
} 