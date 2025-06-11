import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Auth, authState } from '@angular/fire/auth';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-layout.component',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit {
  userName = '';
  userEmail = '';
  userInitials = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private authInstance: Auth
  ) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    authState(this.authInstance).pipe(take(1)).subscribe(user => {
      if (user) {
        this.userName = user.displayName || 'User';
        this.userEmail = user.email || '';
        this.userInitials = this.getInitials(this.userName);
      }
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  logout() {
    this.auth.signOut().then(() => {
      this.router.navigate(['/login']);
    }).catch(error => {
      console.error('Error signing out:', error);
    });
  }
}
