import { Component, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements AfterViewInit {
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

  // 2FA / New Device State
  is2faRequired = false;
  twoFactorMessage = '';

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
          if (res.data?.twoFactorRequired) {
            this.is2faRequired = true;
            this.twoFactorMessage = res.data.message || 'Un code de sécurité a été envoyé à votre adresse email.';
            this.otpCode = '';
            return;
          }
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        const code = err.error?.error?.code;
        if (code === 'EMAIL_NOT_VERIFIED') {
          // Un OTP a été renvoyé automatiquement par le backend
          this.router.navigate(['/verify-otp'], { queryParams: { email: this.email, mode: 'login' } });
        } else {
          this.errorMessage = err.error?.error?.message || 'Identifiants invalides ou serveur indisponible.';
        }
      }
    });
  }

  onVerify2fa(): void {
    if (!this.email || !this.otpCode || this.otpCode.length < 6) {
      this.errorMessage = 'Veuillez saisir le code de vérification à 6 chiffres.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.verify2fa(this.email, this.otpCode).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data?.token) {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error?.message || 'Code de sécurité invalide ou expiré.';
      }
    });
  }

  cancel2fa(): void {
    this.is2faRequired = false;
    this.otpCode = '';
    this.errorMessage = '';
    this.twoFactorMessage = '';
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

  ngAfterViewInit(): void {
    this.initGoogleSignIn();
  }

  private initGoogleSignIn(): void {
    const checkGoogle = () => {
      if (typeof google !== 'undefined' && google.accounts?.id) {
        try {
          google.accounts.id.initialize({
            client_id: '496829118154-ifg5amooc56vptf4oorlfs3u77t51rem.apps.googleusercontent.com',
            callback: (response: any) => this.handleGoogleCredential(response)
          });

          const btnElement = document.getElementById('google-btn-login');
          if (btnElement) {
            google.accounts.id.renderButton(btnElement, {
              theme: 'filled_black',
              size: 'large',
              width: 360,
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left'
            });
          }
        } catch (e) {
          console.warn('Google Identity initialization error', e);
        }
      } else {
        setTimeout(checkGoogle, 300);
      }
    };
    checkGoogle();
  }

  handleGoogleCredential(response: any): void {
    if (response?.credential) {
      this.isLoading = true;
      this.errorMessage = '';
      this.authService.loginWithGoogle(response.credential).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.success) {
            this.router.navigate(['/dashboard']);
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.error?.message || 'Erreur lors de la connexion avec Google.';
        }
      });
    }
  }
}

