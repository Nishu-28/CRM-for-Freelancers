export interface Client {
    id?: string;
    userId: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    address?: string;
    website?: string;
    industry?: string;
    status: 'active' | 'inactive' | 'prospect';
    priority: 'low' | 'medium' | 'high';
    contacts: Contact[];
    notes: Note[];
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    lastContactDate?: Date;
    totalRevenue?: number;
    totalInvoices?: number;
}

export interface Contact {
    id: string;
    name: string;
    email: string;
    phone?: string;
    position?: string;
    isPrimary: boolean;
    createdAt: Date;
}

export interface Note {
    id: string;
    title: string;
    content: string;
    type: 'general' | 'meeting' | 'call' | 'email' | 'task';
    priority: 'low' | 'medium' | 'high';
    isCompleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    dueDate?: Date;
}