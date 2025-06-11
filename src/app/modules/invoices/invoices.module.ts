import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceListComponent } from './components/invoice-list.component/invoice-list.component';
import { InvoiceFormComponent } from './components/invoice-form.component/invoice-form.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    InvoiceListComponent,
    InvoiceFormComponent,
    RouterModule.forChild([
      { path: '', component: InvoiceListComponent },
      { path: 'new', component: InvoiceFormComponent },
      { path: ':id/edit', component: InvoiceFormComponent }
    ])
  ]
})
export class InvoicesModule { }