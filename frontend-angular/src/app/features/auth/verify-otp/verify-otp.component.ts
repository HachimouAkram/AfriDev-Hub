import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './verify-otp.component.html',
  styleUrl: './verify-otp.component.css'
})
export class VerifyOtpComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  mode: 'register' | 'login' = 'login';

  // OTP digits (6 cells)
  digits: string[] = ['', '', '', '', '', ''];

  isLoading = false;
  isResending = false;
  errorMessage = '';
  successMessage = '';
  resendCountdown = 0;
  private countdownInterval: any;

  get otpCode(): string {
    return this.digits.join('');
  }

  get isCodeComplete(): boolean {
    return this.digits.length === 6 && this.digits.every(d => d !== '' && d !== null && d !== undefined && /^\d$/.test(d));
  }

  trackByIndex(index: number): number {
    return index;
  }

  ngOnInit(): void {
    this.email = (this.route.snapshot.queryParamMap.get('email') || '').trim();
    this.mode = (this.route.snapshot.queryParamMap.get('mode') as any) || 'login';
    if (!this.email) {
      this.router.navigate(['/login']);
      return;
    }

    // Le code OTP a déjà été envoyé lors de l'inscription ou de la connexion.
    // On démarre simplement le compte à rebours avant de permettre un renvoi.
    this.startResendCountdown(30);
  }

  onDigitKeydown(event: KeyboardEvent, index: number): void {
    const key = event.key;

    // Handle Backspace
    if (key === 'Backspace') {
      event.preventDefault();
      this.errorMessage = '';
      if (this.digits[index]) {
        this.digits[index] = '';
      } else if (index > 0) {
        this.digits[index - 1] = '';
        this.focusCell(index - 1);
      }
      return;
    }

    // Handle Arrow Left
    if (key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusCell(index - 1);
      return;
    }

    // Handle Arrow Right
    if (key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      this.focusCell(index + 1);
      return;
    }

    // Handle Enter
    if (key === 'Enter') {
      event.preventDefault();
      if (this.isCodeComplete) {
        this.onVerify();
      }
      return;
    }

    // Handle single digit [0-9]
    if (/^[0-9]$/.test(key)) {
      event.preventDefault(); // Empêche le dédoublement de touche
      this.errorMessage = '';
      this.digits[index] = key;
      if (index < 5) {
        this.focusCell(index + 1);
      }
      return;
    }

    // Bloquer tout autre caractère sauf Tab/Escape ou raccourcis Ctrl/Cmd
    if (!['Tab', 'Escape'].includes(key) && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
    }
  }

  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const rawVal = input.value.replace(/\D/g, '');

    // Gestion du collage / saisie multiple
    if (rawVal.length > 1) {
      this.fillFromText(rawVal, index);
      return;
    }

    if (rawVal.length === 1) {
      this.digits[index] = rawVal;
      this.errorMessage = '';
      if (index < 5) {
        this.focusCell(index + 1);
      }
    } else {
      this.digits[index] = '';
    }
  }

  onCellFocus(index: number): void {
    setTimeout(() => {
      const el = document.getElementById(`otp-digit-${index}`) as HTMLInputElement;
      el?.select();
    }, 0);
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text')?.replace(/\D/g, '') || '';
    if (text) {
      this.fillFromText(text, 0);
    }
  }

  fillFromText(text: string, startIndex: number): void {
    const chars = text.slice(0, 6 - startIndex).split('');
    for (let i = 0; i < chars.length; i++) {
      if (startIndex + i < 6) {
        this.digits[startIndex + i] = chars[i];
      }
    }
    this.errorMessage = '';
    const nextIdx = Math.min(5, startIndex + chars.length);
    this.focusCell(nextIdx);
  }

  focusCell(index: number): void {
    setTimeout(() => {
      const el = document.getElementById(`otp-digit-${index}`) as HTMLInputElement;
      if (el) {
        el.focus();
        el.select();
      }
    }, 10);
  }

  clearAll(): void {
    this.digits = ['', '', '', '', '', ''];
    this.errorMessage = '';
    this.focusCell(0);
  }

  onVerify(): void {
    if (!this.isCodeComplete) {
      this.errorMessage = 'Veuillez saisir les 6 chiffres du code OTP reçu par email.';
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    const codeToSend = this.otpCode;

    this.authService.verifyOtp(this.email, codeToSend).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.successMessage = 'Email vérifié avec succès ! Redirection…';
          setTimeout(() => {
            const role = res.data?.user?.role || this.authService.currentUser()?.role;
            if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
              this.router.navigate(['/admin']);
            } else if (role === 'RECRUITER') {
              this.router.navigate(['/dashboard/recruiter']);
            } else {
              this.router.navigate(['/dashboard']);
            }
          }, 800);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error?.message || 'Code OTP incorrect ou expiré. Veuillez vérifier le code reçu dans votre boîte mail.';
      }
    });
  }

  onResend(): void {
    if (this.resendCountdown > 0 || this.isResending) return;
    this.isResending = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.requestOtp(this.email).subscribe({
      next: (res: any) => {
        this.isResending = false;
        this.successMessage = 'Un nouveau code OTP a été envoyé à votre adresse email.';
        this.startResendCountdown(60);
      },
      error: (err) => {
        this.isResending = false;
        this.errorMessage = err.error?.error?.message || 'Impossible d\'envoyer le code. Veuillez réessayer dans quelques instants.';
      }
    });
  }

  private startResendCountdown(seconds: number): void {
    clearInterval(this.countdownInterval);
    this.resendCountdown = seconds;
    this.countdownInterval = setInterval(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0) clearInterval(this.countdownInterval);
    }, 1000);
  }
}
