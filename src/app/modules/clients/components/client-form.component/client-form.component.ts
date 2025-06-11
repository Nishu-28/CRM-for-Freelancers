import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService } from '../../services/client.service';
import { Client, Contact, Note } from '../../models/client.model';
import { Auth, authState } from '@angular/fire/auth';
import { take } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './client-form.component.html',
  styleUrls: ['./client-form.component.css']
})
export class ClientFormComponent implements OnInit {
  clientForm: FormGroup;
  isEditMode = false;
  clientId: string | null = null;
  isLoading = false;
  private auth = inject(Auth);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private clientService: ClientService
  ) {
    this.clientForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      company: [''],
      website: [''],
      industry: [''],
      status: ['active', Validators.required],
      priority: ['medium', Validators.required],
      address: [''],
      tagsInput: [''],
      contacts: this.fb.array([]),
      notes: this.fb.array([])
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.clientId = params.get('id');
      if (this.clientId) {
        this.isEditMode = true;
        this.isLoading = true;
        this.clientService.getClient(this.clientId).subscribe(client => {
          if (client) {
            this.populateForm(client);
          }
          this.isLoading = false;
        });
      } else {
        // Add a default contact for new clients
        this.addContact();
      }
    });
  }

  get contacts() {
    return this.clientForm.get('contacts') as FormArray;
  }

  get notes() {
    return this.clientForm.get('notes') as FormArray;
  }

  addContact() {
    const contactGroup = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      position: [''],
      isPrimary: [false]
    });

    this.contacts.push(contactGroup);
  }

  removeContact(index: number) {
    this.contacts.removeAt(index);
  }

  addNote() {
    const noteGroup = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
      type: ['general', Validators.required],
      priority: ['medium'],
      isCompleted: [false],
      dueDate: ['']
    });

    this.notes.push(noteGroup);
  }

  removeNote(index: number) {
    this.notes.removeAt(index);
  }

  populateForm(client: any) {
    // Convert tags array to comma-separated string
    const tagsInput = client.tags ? client.tags.join(', ') : '';
    
    this.clientForm.patchValue({
      ...client,
      tagsInput
    });

    // Clear existing arrays
    this.contacts.clear();
    this.notes.clear();

    // Populate contacts
    if (client.contacts && client.contacts.length > 0) {
      client.contacts.forEach((contact: Contact) => {
        this.contacts.push(this.fb.group({
          name: [contact.name, Validators.required],
          email: [contact.email, [Validators.required, Validators.email]],
          phone: [contact.phone || ''],
          position: [contact.position || ''],
          isPrimary: [contact.isPrimary || false]
        }));
      });
    } else {
      this.addContact();
    }

    // Populate notes
    if (client.notes && client.notes.length > 0) {
      client.notes.forEach((note: Note) => {
        this.notes.push(this.fb.group({
          title: [note.title, Validators.required],
          content: [note.content, Validators.required],
          type: [note.type, Validators.required],
          priority: [note.priority || 'medium'],
          isCompleted: [note.isCompleted || false],
          dueDate: [note.dueDate ? this.formatDate(note.dueDate) : '']
        }));
      });
    }
  }

  formatDate(date: any): string {
    if (!date) return '';
    
    let dateObj: Date;
    
    if (date && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      dateObj = new Date(date);
    }
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    return dateObj.toISOString().substring(0, 10);
  }

  onSubmit() {
    if (this.clientForm.invalid) return;
    this.isLoading = true;
    
    authState(this.auth).pipe(take(1)).subscribe(user => {
      if (!user) return;
      
      const formValue = this.clientForm.value;
      
      // Convert tags input to array
      const tags = formValue.tagsInput 
        ? formValue.tagsInput.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0)
        : [];

      // Prepare contacts with IDs and timestamps
      const contacts: Contact[] = formValue.contacts.map((contact: any, index: number) => ({
        id: `contact_${Date.now()}_${index}`,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        position: contact.position,
        isPrimary: contact.isPrimary,
        createdAt: new Date()
      }));

      // Prepare notes with IDs and timestamps
      const notes: Note[] = formValue.notes.map((note: any, index: number) => ({
        id: `note_${Date.now()}_${index}`,
        title: note.title,
        content: note.content,
        type: note.type,
        priority: note.priority,
        isCompleted: note.isCompleted,
        createdAt: new Date(),
        updatedAt: new Date(),
        dueDate: note.dueDate ? new Date(note.dueDate) : undefined
      }));

    const clientData: Client = {
        name: formValue.name,
        email: formValue.email,
        phone: formValue.phone,
        company: formValue.company,
        website: formValue.website,
        industry: formValue.industry,
        status: formValue.status,
        priority: formValue.priority,
        address: formValue.address,
        userId: user.uid,
        contacts,
        notes,
        tags,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    if (this.isEditMode && this.clientId) {
      this.clientService.updateClient(this.clientId, clientData).then(() => {
        this.router.navigate(['/clients']);
      });
    } else {
      this.clientService.createClient(clientData).then(() => {
        this.router.navigate(['/clients']);
      });
    }
    });
  }
}