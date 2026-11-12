import { Component, inject, AfterViewInit, OnDestroy } from '@angular/core';
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
export class LoginComponent implements AfterViewInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  protected readonly Math = Math;

  activeTab: 'password' | 'otp' = 'password';

  // Form Fields
  email = '';
  password = '';
  otpCode = '';
  showPassword = false;

  otpSent = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // 2FA / New Device State
  is2faRequired = false;
  twoFactorMessage = '';

  // Rate limiting / Lockout state
  isLocked = false;
  lockRemainingSeconds = 0;
  private lockTimerInterval: any;

  onLoginPassword(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Veuillez saisir votre adresse email et votre mot de passe.';
      return;
    }

    if (this.isLocked) {
      this.errorMessage = `Votre compte est temporairement bloqué. Veuillez patienter ${Math.ceil(this.lockRemainingSeconds / 60)} minute(s).`;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.clearLockTimer();
        if (res.success) {
          if (res.data?.twoFactorRequired) {
            this.is2faRequired = true;
            this.twoFactorMessage = res.data.message || 'Un code de sécurité a été envoyé à votre adresse email.';
            this.otpCode = '';
            return;
          }
          this.navigateByRole(res.data?.user);
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('[AUTH] Login error:', err);
        const code = err.error?.error?.code;
        const msg = err.error?.error?.message || err.error?.message;

        if (code === 'EMAIL_NOT_VERIFIED') {
          // Un OTP a été renvoyé automatiquement par le backend
          this.router.navigate(['/verify-otp'], { queryParams: { email: this.email, mode: 'login' } });
        } else if (code === 'COMPTE_TEMPORAIREMENT_BLOQUE' || (msg && (msg.toLowerCase().includes('temporairement désactivé') || msg.toLowerCase().includes('temporairement bloqué')))) {
          this.isLocked = true;
          this.errorMessage = msg || 'Votre compte est désactivé suite à 5 tentatives incorrectes. Veuillez patienter et réessayer dans 10 minutes.';
          const minMatch = msg ? msg.match(/(\d+)\s*minute/) : null;
          const mins = minMatch ? Math.max(1, parseInt(minMatch[1], 10)) : 10;
          this.startLockCountdown(mins * 60);
        } else {
          this.errorMessage = msg || (err.status === 400 || err.status === 401 
              ? 'Identifiants invalides (email ou mot de passe incorrect).' 
              : 'Impossible de joindre le serveur. Veuillez vérifier votre connexion.');
        }
      }
    });
  }

  private startLockCountdown(seconds: number): void {
    this.clearLockTimer();
    this.lockRemainingSeconds = seconds;
    this.lockTimerInterval = setInterval(() => {
      this.lockRemainingSeconds--;
      if (this.lockRemainingSeconds <= 0) {
        this.clearLockTimer();
        this.isLocked = false;
        this.errorMessage = 'Le délai de sécurité est écoulé. Vous pouvez réessayer de vous connecter.';
      }
    }, 1000);
  }

  private clearLockTimer(): void {
    if (this.lockTimerInterval) {
      clearInterval(this.lockTimerInterval);
      this.lockTimerInterval = null;
    }
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
          this.navigateByRole(res.data?.user);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error?.message || 'Code de sécurité invalide ou expiré.';
      }
    });
  }

  private navigateByRole(user?: any): void {
    const role = user?.role || this.authService.currentUser()?.role;
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      this.router.navigate(['/admin']);
    } else if (role === 'RECRUITER') {
      this.router.navigate(['/dashboard/recruiter']);
    } else {
      this.router.navigate(['/dashboard']);
    }
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
          this.navigateByRole(res.data?.user);
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

  ngOnDestroy(): void {
    this.clearLockTimer();
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  private resizeHandler?: () => void;
  private resizeTimeout: any;

  private initGoogleSignIn(): void {
    const checkGoogle = () => {
      if (typeof google !== 'undefined' && google.accounts?.id) {
        try {
          google.accounts.id.initialize({
            client_id: '496829118154-ifg5amooc56vptf4oorlfs3u77t51rem.apps.googleusercontent.com',
            callback: (response: any) => this.handleGoogleCredential(response)
          });

          const renderBtn = () => {
            const btnElement = document.getElementById('google-btn-login');
            if (btnElement) {
              btnElement.innerHTML = '';
              const parentWidth = btnElement.parentElement?.clientWidth || (window.innerWidth - 48);
              // Largeur fluide bornée entre 200px et 360px selon l'écran mobile
              const targetWidth = Math.max(200, Math.min(360, Math.floor(parentWidth)));

              google.accounts.id.renderButton(btnElement, {
                theme: 'filled_black',
                size: 'large',
                width: targetWidth,
                text: 'continue_with',
                shape: 'rectangular',
                logo_alignment: 'left'
              });
            }
          };

          renderBtn();

          if (!this.resizeHandler) {
            this.resizeHandler = () => {
              clearTimeout(this.resizeTimeout);
              this.resizeTimeout = setTimeout(renderBtn, 200);
            };
            window.addEventListener('resize', this.resizeHandler);
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

