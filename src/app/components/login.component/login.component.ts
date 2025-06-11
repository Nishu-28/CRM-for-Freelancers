import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private router = inject(Router);
  private authInstance = inject(Auth);

  email = '';
  password = '';
  isSignUp = false;
  isLoading = false;
  errorMessage = '';

  constructor(private auth: AuthService) {
    authState(this.authInstance).pipe(take(1)).subscribe(user => {
      if (user) {
        this.router.navigate(['/']);
      }
    });
  }

  async loginWithEmail() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter both email and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      if (this.isSignUp) {
        await this.auth.signUpWithEmail(this.email, this.password);
      } else {
        await this.auth.signInWithEmail(this.email, this.password);
      }
      this.router.navigate(['/']);
    } catch (error: any) {
      this.errorMessage = error.message || 'Authentication failed';
    } finally {
      this.isLoading = false;
    }
  }

  async loginWithGoogle() {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.auth.googleSignIn();
      this.router.navigate(['/']);
    } catch (error: any) {
      this.errorMessage = error.message || 'Google authentication failed';
    } finally {
      this.isLoading = false;
    }
  }

  toggleMode() {
    this.isSignUp = !this.isSignUp;
    this.errorMessage = '';
  }
}