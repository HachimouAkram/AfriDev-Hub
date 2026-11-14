import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside *ngIf="showBanner()" class="cookie-banner-wrap" role="region" aria-label="Consentement aux cookies">
      <div class="cookie-card">
        <div class="cookie-content">
          <div class="cookie-icon-box" aria-hidden="true">
            <svg class="cookie-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M8.5 8.5h.01M15.5 15.5h.01M9.5 15.5h.01M13.5 11.5h.01" />
            </svg>
          </div>
          <div class="cookie-text">
            <h4 class="cookie-title">Gestion de vos préférences de confidentialité</h4>
            <p class="cookie-desc">
              AfriDev Hub utilise des cookies essentiels pour sécuriser votre authentification, mémoriser vos préférences 
              et garantir la meilleure expérience de mise en relation tech en Afrique. Aucun traceur publicitaire intrusif n'est utilisé.
            </p>
          </div>
        </div>

        <div class="cookie-actions">
          <button (click)="acceptEssential()" class="btn-cookie btn-cookie-secondary">
            Essentiels uniquement
          </button>
          <button (click)="acceptAll()" class="btn-cookie btn-cookie-primary">
            Accepter & Continuer
          </button>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .cookie-banner-wrap {
      position: fixed;
      bottom: 1.5rem;
      left: 1.5rem;
      right: 1.5rem;
      max-width: 900px;
      margin: 0 auto;
      z-index: 99999;
      animation: slideUpFade 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes slideUpFade {
      from {
        opacity: 0;
        transform: translateY(24px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .cookie-card {
      background: rgba(15, 23, 42, 0.94);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 16px;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(16, 185, 129, 0.2);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
    }

    .cookie-content {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      flex: 1;
    }

    .cookie-icon-box {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #34d399;
      flex-shrink: 0;
      margin-top: 0.15rem;
    }

    .cookie-svg {
      width: 22px;
      height: 22px;
    }

    .cookie-text {
      flex: 1;
    }

    .cookie-title {
      margin: 0 0 0.35rem;
      font-size: 0.95rem;
      font-weight: 700;
      color: #f8fafc;
      letter-spacing: -0.01em;
    }

    .cookie-desc {
      margin: 0;
      font-size: 0.82rem;
      line-height: 1.5;
      color: #94a3b8;
    }

    .cookie-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-shrink: 0;
    }

    .btn-cookie {
      padding: 0.65rem 1.25rem;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
      border: none;
    }

    .btn-cookie-secondary {
      background: rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
      border: 1px solid rgba(255, 255, 255, 0.14);
    }

    .btn-cookie-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
    }

    .btn-cookie-primary {
      background: #10b981;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
    }

    .btn-cookie-primary:hover {
      background: #059669;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.45);
    }

    :host-context(body.light-theme) .cookie-card {
      background: rgba(255, 255, 255, 0.96);
      border-color: rgba(0, 0, 0, 0.1);
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(16, 185, 129, 0.3);
    }

    :host-context(body.light-theme) .cookie-title {
      color: #0f172a;
    }

    :host-context(body.light-theme) .cookie-desc {
      color: #475569;
    }

    :host-context(body.light-theme) .btn-cookie-secondary {
      background: #f1f5f9;
      color: #334155;
      border-color: #cbd5e1;
    }

    :host-context(body.light-theme) .btn-cookie-secondary:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    @media (max-width: 768px) {
      .cookie-banner-wrap {
        bottom: 1rem;
        left: 1rem;
        right: 1rem;
      }

      .cookie-card {
        flex-direction: column;
        align-items: stretch;
        padding: 1.15rem;
        gap: 1rem;
      }

      .cookie-actions {
        flex-direction: column-reverse;
        width: 100%;
      }

      .btn-cookie {
        width: 100%;
        text-align: center;
        padding: 0.75rem 1rem;
      }
    }
  `]
})
export class CookieConsentComponent implements OnInit {
  private readonly COOKIE_KEY = 'afridev_cookies_consented';
  showBanner = signal<boolean>(false);

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem(this.COOKIE_KEY);
      if (!consent) {
        // Affiche la bannière avec un léger délai pour une entrée soignée
        setTimeout(() => this.showBanner.set(true), 1200);
      }
    }
  }

  acceptAll(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.COOKIE_KEY, 'all');
    }
    this.showBanner.set(false);
  }

  acceptEssential(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.COOKIE_KEY, 'essential');
    }
    this.showBanner.set(false);
  }
}

