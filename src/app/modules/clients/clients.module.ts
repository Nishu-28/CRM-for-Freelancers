import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientListComponent } from './components/client-list.component/client-list.component';
import { ClientFormComponent } from './components/client-form.component/client-form.component';
import { ClientDetailComponent } from './components/client-detail.component/client-detail.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ClientListComponent,
    ClientFormComponent,
    ClientDetailComponent,
    RouterModule.forChild([
      { path: '', component: ClientListComponent },
      { path: 'new', component: ClientFormComponent },
      { path: ':id', component: ClientDetailComponent },
      { path: ':id/edit', component: ClientFormComponent }
    ])
  ]
})
export class ClientsModule { }