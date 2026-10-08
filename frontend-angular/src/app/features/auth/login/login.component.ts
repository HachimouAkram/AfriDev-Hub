import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  activeTab: 'password' | 'otp' = 'password';

  // Form Fields
  email = '';
  password = '';
  otpCode = '';

  otpSent = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  onLoginPassword(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Veuillez remplir l\'email et le mot de passe.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error?.message || 'Identifiants invalides ou serveur indisponible.';
      }
    });
  }

  onRequestOtp(): void {
    if (!this.email) {
      this.errorMessage = 'Veuillez saisir votre adresse email.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.requestOtp(this.email).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.otpSent = true;
        this.successMessage = 'Un code OTP à 6 chiffres a été généré et envoyé à votre adresse email (Valable 10 mins).';
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error?.message || 'Impossible d\'envoyer le code OTP.';
      }
    });
  }

  onVerifyOtp(): void {
    if (!this.email || !this.otpCode) {
      this.errorMessage = 'Veuillez saisir votre code OTP.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.verifyOtp(this.email, this.otpCode).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error?.message || 'Code OTP invalide ou expiré.';
      }
    });
  }

  switchTab(tab: 'password' | 'otp'): void {
    this.activeTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
  }
}
