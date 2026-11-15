import { Component, inject, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected readonly Math = Math;
  private readonly githubClientId = 'Ov23liThxmOjc0n7p0W3';

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

  // Initial Password Change State
  isChangeInitialPasswordRequired = false;
  currentPassword = '';
  newPassword = '';
  confirmNewPassword = '';
  showNewPassword = false;
  tempUser: any = null;

  // Forgot Password State
  isForgotPasswordMode = false;
  forgotStep: 1 | 2 | 3 = 1; // 1: Email, 2: Code OTP, 3: Nouveau Mot de passe
  forgotEmail = '';
  forgotOtpCode = '';
  forgotNewPassword = '';
  forgotConfirmNewPassword = '';
  showForgotNewPassword = false;

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
          if (res.data?.mustChangePassword || res.data?.user?.mustChangePassword) {
            this.isChangeInitialPasswordRequired = true;
            this.currentPassword = this.password;
            this.tempUser = res.data?.user;
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
          if (res.data?.mustChangePassword || res.data?.user?.mustChangePassword) {
            this.isChangeInitialPasswordRequired = true;
            this.currentPassword = this.password;
            this.tempUser = res.data?.user;
            return;
          }
          this.navigateByRole(res.data?.user);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error?.message || 'Code de sécurité invalide ou expiré.';
      }
    });
  }

  onSubmitChangeInitialPassword(): void {
    if (!this.currentPassword) {
      this.errorMessage = 'Veuillez renseigner votre mot de passe temporaire actuel.';
      return;
    }
    if (!this.newPassword || this.newPassword.length < 8) {
      this.errorMessage = 'Le nouveau mot de passe doit comporter au moins 8 caractères.';
      return;
    }
    if (this.newPassword !== this.confirmNewPassword) {
      this.errorMessage = 'Les deux nouveaux mots de passe ne correspondent pas.';
      return;
    }
    if (this.newPassword === this.currentPassword) {
      this.errorMessage = 'Le nouveau mot de passe doit être différent du mot de passe temporaire.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.changeInitialPassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.isChangeInitialPasswordRequired = false;
        this.navigateByRole(this.tempUser);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error?.message || err.error?.message || 'Erreur lors du changement de mot de passe.';
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

  openForgotPassword(): void {
    this.isForgotPasswordMode = true;
    this.forgotStep = 1;
    this.forgotEmail = this.email || '';
    this.forgotOtpCode = '';
    this.forgotNewPassword = '';
    this.forgotConfirmNewPassword = '';
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelForgotPassword(): void {
    this.isForgotPasswordMode = false;
    this.forgotStep = 1;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onSendResetCode(): void {
    if (!this.forgotEmail || !this.forgotEmail.trim()) {
      this.errorMessage = 'Veuillez saisir votre adresse email.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.forgotPassword(this.forgotEmail.trim()).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.forgotStep = 2;
        this.successMessage = res.data?.message || 'Un code de sécurité à 6 chiffres a été envoyé à votre adresse email.';
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.error?.error?.message || err.error?.message;
        if (err.status === 404 || err.error?.error?.code === 'EMAIL_NOT_FOUND') {
          this.errorMessage = 'Cette adresse email n\'existe pas.';
        } else {
          this.errorMessage = msg || 'Impossible d\'envoyer le code de réinitialisation.';
        }
      }
    });
  }

  onVerifyResetCode(): void {
    if (!this.forgotEmail) {
      this.errorMessage = 'Adresse email manquante.';
      return;
    }
    if (!this.forgotOtpCode || this.forgotOtpCode.trim().length !== 6) {
      this.errorMessage = 'Veuillez saisir le code de sécurité à 6 chiffres reçu par email.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.verifyResetCode(this.forgotEmail.trim(), this.forgotOtpCode.trim()).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.forgotStep = 3;
        this.successMessage = res.data?.message || 'Code validé avec succès ! Définissez maintenant votre nouveau mot de passe.';
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.error?.error?.message || err.error?.message;
        this.errorMessage = msg || 'Code de sécurité invalide ou expiré (valable 10 minutes).';
      }
    });
  }

  onResetPassword(): void {
    if (!this.forgotEmail) {
      this.errorMessage = 'Adresse email manquante.';
      return;
    }
    if (!this.forgotOtpCode || this.forgotOtpCode.trim().length !== 6) {
      this.errorMessage = 'Code de sécurité manquant.';
      this.forgotStep = 2;
      return;
    }
    if (!this.forgotNewPassword || this.forgotNewPassword.length < 8) {
      this.errorMessage = 'Le nouveau mot de passe doit comporter au moins 8 caractères.';
      return;
    }
    if (this.forgotNewPassword !== this.forgotConfirmNewPassword) {
      this.errorMessage = 'Les deux mots de passe ne correspondent pas.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.resetPassword({
      email: this.forgotEmail.trim(),
      otpCode: this.forgotOtpCode.trim(),
      newPassword: this.forgotNewPassword
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.isForgotPasswordMode = false;
        this.forgotStep = 1;
        this.email = this.forgotEmail.trim();
        this.password = '';
        this.successMessage = res.data?.message || 'Votre mot de passe a été réinitialisé avec succès ! Vous pouvez maintenant vous connecter.';
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.error?.error?.message || err.error?.message;
        this.errorMessage = msg || 'Code de sécurité invalide ou expiré (valable 10 minutes).';
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

  ngOnInit(): void {
    const code = this.route.snapshot.queryParamMap.get('code');
    const state = this.route.snapshot.queryParamMap.get('state');
    if (code) {
      this.handleGithubCode(code, state);
    }
  }

  ngAfterViewInit(): void {
    this.initGoogleSignIn();
  }

  ngOnDestroy(): void {
    this.clearLockTimer();
  }

  onLoginWithGithub(): void {
    const redirectUri = `${window.location.origin}/login`;
    const state = 'login_DEVELOPER';
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${this.githubClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user%20user:email&state=${encodeURIComponent(state)}`;
    window.location.href = githubAuthUrl;
  }

  private handleGithubCode(code: string, state: string | null): void {
    this.isLoading = true;
    this.errorMessage = '';
    const role = state && state.includes('RECRUITER') ? 'RECRUITER' : 'DEVELOPER';

    // Nettoyer l'URL immédiatement pour éviter un double appel au rafraîchissement
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { code: null, state: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });

    this.authService.loginWithGithub(code, role).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.navigateByRole(res.data?.user);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error?.message || 'Erreur lors de la connexion avec GitHub.';
      }
    });
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
            btnElement.innerHTML = '';
            google.accounts.id.renderButton(btnElement, {
              type: 'icon',
              theme: 'outline',
              size: 'large',
              shape: 'circle'
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
            this.navigateByRole(res.data?.user);
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

