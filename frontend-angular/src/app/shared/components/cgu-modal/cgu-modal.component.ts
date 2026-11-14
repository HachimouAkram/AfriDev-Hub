import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cgu-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" (click)="onClose()">
      <div class="cgu-dialog" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" aria-labelledby="cguTitle">
        <!-- En-tête -->
        <div class="cgu-header">
          <div class="header-left">
            <div class="cgu-icon-badge" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="icon-svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
              </svg>
            </div>
            <div>
              <h2 id="cguTitle" class="cgu-title">Conditions Générales d'Utilisation (CGU)</h2>
              <p class="cgu-subtitle">Charte Déontologique, Propriété Intellectuelle & Politique de Bannissement</p>
            </div>
          </div>
          <button (click)="onClose()" class="btn-close" aria-label="Fermer la fenêtre">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="icon-svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Corps scrollable -->
        <div class="cgu-body">
          <div class="cgu-alert-ban">
            <div class="ban-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="icon-svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <strong>Avertissement Ferme — Règle de Bannissement Strict :</strong>
              <p>AfriDev Hub applique une politique de tolérance zéro envers les fraudes, arnaques, faux profils et violations de droits d'auteur. Tout manquement entraîne la suspension immédiate et le <strong>bannissement irrévocable et définitif du compte</strong> sans préavis.</p>
            </div>
          </div>

          <section class="cgu-section">
            <h3>1. Objet et Engagement de la Communauté</h3>
            <p>
              AfriDev Hub est une plateforme panafricaine professionnelle conçue pour certifier les compétences réelles, 
              les projets open-source et SaaS, faciliter le recrutement et favoriser l'entraide technique entre développeurs et entreprises.
              En créant un compte ou en naviguant sur le site, tout utilisateur s'engage formellement à respecter la présente charte.
            </p>
          </section>

          <section class="cgu-section">
            <h3>2. Règle d'Authenticité & Profils Certifiés</h3>
            <ul>
              <li>Chaque utilisateur certifie l'exactitude des informations fournies (nom, expérience, pays, projets et diplômes).</li>
              <li>L'usurpation d'identité ou la création de comptes multiples non autorisés constitue un motif de bannissement immédiat.</li>
              <li>Les coordonnées professionnelles renseignées (notamment le numéro WhatsApp direct) doivent être valides et appartenir à l'utilisateur.</li>
            </ul>
          </section>

          <section class="cgu-section">
            <h3>3. Propriété Intellectuelle, Projets & Vente de Code Source</h3>
            <ul>
              <li>Tout projet ou ressource mis en vente ou partagé sur AfriDev Hub doit appartenir légitimement au créateur ou disposer d'une licence appropriée.</li>
              <li>La revente de codes sources volés, piratés ou sous licence restrictive interdite est formellement prohibée.</li>
              <li>L'acheteur d'un code source acquiert un droit d'usage conformément à la licence stipulée par l'auteur lors de la commande.</li>
            </ul>
          </section>

          <section class="cgu-section">
            <h3>4. Offres d'Emploi, Recrutement & Candidatures</h3>
            <ul>
              <li>Toute offre publiée doit correspondre à une opportunité d'emploi, de stage ou de freelance réelle et transparente.</li>
              <li>Il est strictement interdit d'exiger des frais de candidature ou de soutirer des fonds aux chercheurs d'emploi.</li>
              <li>La confidentialité des CV des candidats doit être scrupuleusement respectée conformément aux préférences choisies par les développeurs.</li>
            </ul>
          </section>

          <section class="cgu-section">
            <h3>5. Entraide Tech, Volontariat & Conduite</h3>
            <ul>
              <li>Les échanges dans les espaces d'entraide, chats de groupes et commentaires doivent demeurer courtois, respectueux et constructifs.</li>
              <li>Tout propos haineux, discriminatoire, harcèlement ou tentative d'arnaque est sanctionné immédiatement par l'exclusion de la plateforme.</li>
            </ul>
          </section>

          <section class="cgu-section">
            <h3>6. Procédure de Bannissement et Sanctions</h3>
            <p>
              En cas de signalement avéré par des membres ou vérifié par l'équipe d'administration :
            </p>
            <ol>
              <li>Gel immédiat des offres, projets et fonds associés sur le portefeuille.</li>
              <li>Révocation des accès et bannissement permanent de l'adresse e-mail et de l'identité de l'utilisateur.</li>
              <li>Signalement aux autorités compétentes et juridictions en cas de cybercriminalité ou escroquerie avérée.</li>
            </ol>
          </section>
        </div>

        <!-- Pied de modal -->
        <div class="cgu-footer">
          <span class="last-update">Dernière mise à jour : 14 Novembre 2026</span>
          <button (click)="onClose()" class="btn-agree">
            J'ai lu et j'accepte les conditions
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 100000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      animation: fadeIn 0.2s ease forwards;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .cgu-dialog {
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 20px;
      width: 100%;
      max-width: 780px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(16, 185, 129, 0.25);
      overflow: hidden;
      animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes scaleUp {
      from { transform: scale(0.96); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .cgu-header {
      padding: 1.5rem 1.75rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      background: rgba(30, 41, 59, 0.5);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .cgu-icon-badge {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .icon-svg {
      width: 22px;
      height: 22px;
    }

    .cgu-title {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 800;
      color: #f8fafc;
      letter-spacing: -0.01em;
    }

    .cgu-subtitle {
      margin: 0.25rem 0 0;
      font-size: 0.8rem;
      color: #94a3b8;
    }

    .btn-close {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-close:hover {
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.4);
      color: #f87171;
    }

    .cgu-body {
      padding: 1.75rem;
      overflow-y: auto;
      font-size: 0.88rem;
      line-height: 1.6;
      color: #cbd5e1;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .cgu-alert-ban {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-left: 4px solid #ef4444;
      border-radius: 12px;
      padding: 1rem 1.25rem;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      color: #fca5a5;
    }

    .ban-icon {
      color: #f87171;
      flex-shrink: 0;
      margin-top: 0.1rem;
    }

    .cgu-alert-ban strong {
      display: block;
      color: #fef2f2;
      font-size: 0.92rem;
      margin-bottom: 0.25rem;
    }

    .cgu-alert-ban p {
      margin: 0;
      font-size: 0.84rem;
      color: #fecaca;
    }

    .cgu-section h3 {
      margin: 0 0 0.5rem;
      font-size: 0.98rem;
      font-weight: 700;
      color: #34d399;
    }

    .cgu-section p {
      margin: 0;
      color: #94a3b8;
    }

    .cgu-section ul, .cgu-section ol {
      margin: 0.5rem 0 0 1.25rem;
      padding: 0;
      color: #cbd5e1;
    }

    .cgu-section li {
      margin-bottom: 0.4rem;
    }

    .cgu-footer {
      padding: 1.25rem 1.75rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(30, 41, 59, 0.5);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .last-update {
      font-size: 0.78rem;
      color: #64748b;
    }

    .btn-agree {
      padding: 0.65rem 1.5rem;
      background: #10b981;
      color: #ffffff;
      font-size: 0.88rem;
      font-weight: 700;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
    }

    .btn-agree:hover {
      background: #059669;
      transform: translateY(-1px);
    }

    /* ────────── Light Theme Adaptations ────────── */
    :host-context(body.light-theme) .cgu-dialog,
    :host-context(.light-theme) .cgu-dialog {
      background: #ffffff;
      border-color: rgba(15, 23, 42, 0.12);
      box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(16, 185, 129, 0.25);
    }

    :host-context(body.light-theme) .cgu-header,
    :host-context(.light-theme) .cgu-header,
    :host-context(body.light-theme) .cgu-footer,
    :host-context(.light-theme) .cgu-footer {
      background: #f8fafc;
      border-color: #e2e8f0;
    }

    :host-context(body.light-theme) .cgu-title,
    :host-context(.light-theme) .cgu-title {
      color: #0f172a;
    }

    :host-context(body.light-theme) .cgu-subtitle,
    :host-context(.light-theme) .cgu-subtitle {
      color: #64748b;
    }

    :host-context(body.light-theme) .cgu-icon-badge,
    :host-context(.light-theme) .cgu-icon-badge {
      background: rgba(16, 185, 129, 0.12);
      border-color: rgba(16, 185, 129, 0.3);
      color: #059669;
    }

    :host-context(body.light-theme) .btn-close,
    :host-context(.light-theme) .btn-close {
      background: #f1f5f9;
      border-color: #e2e8f0;
      color: #64748b;
    }

    :host-context(body.light-theme) .btn-close:hover,
    :host-context(.light-theme) .btn-close:hover {
      background: #fee2e2;
      border-color: #fca5a5;
      color: #dc2626;
    }

    :host-context(body.light-theme) .cgu-body,
    :host-context(.light-theme) .cgu-body {
      color: #334155;
    }

    :host-context(body.light-theme) .cgu-alert-ban,
    :host-context(.light-theme) .cgu-alert-ban {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-left: 4px solid #dc2626;
      color: #991b1b;
    }

    :host-context(body.light-theme) .cgu-alert-ban .ban-icon,
    :host-context(.light-theme) .cgu-alert-ban .ban-icon {
      color: #dc2626;
    }

    :host-context(body.light-theme) .cgu-alert-ban strong,
    :host-context(.light-theme) .cgu-alert-ban strong {
      color: #991b1b;
      font-weight: 700;
    }

    :host-context(body.light-theme) .cgu-alert-ban p,
    :host-context(.light-theme) .cgu-alert-ban p {
      color: #7f1d1d;
    }

    :host-context(body.light-theme) .cgu-alert-ban p strong,
    :host-context(.light-theme) .cgu-alert-ban p strong {
      color: #7f1d1d;
      font-weight: 800;
    }

    :host-context(body.light-theme) .cgu-section h3,
    :host-context(.light-theme) .cgu-section h3 {
      color: #059669;
    }

    :host-context(body.light-theme) .cgu-section p,
    :host-context(.light-theme) .cgu-section p {
      color: #334155;
    }

    :host-context(body.light-theme) .cgu-section ul,
    :host-context(.light-theme) .cgu-section ul,
    :host-context(body.light-theme) .cgu-section ol,
    :host-context(.light-theme) .cgu-section ol {
      color: #334155;
    }

    :host-context(body.light-theme) .cgu-section li,
    :host-context(.light-theme) .cgu-section li {
      color: #334155;
    }

    :host-context(body.light-theme) .last-update,
    :host-context(.light-theme) .last-update {
      color: #64748b;
    }

    @media (max-width: 640px) {
      .modal-backdrop {
        padding: 0.75rem;
      }
      .cgu-footer {
        flex-direction: column-reverse;
        align-items: stretch;
      }
      .btn-agree {
        width: 100%;
        text-align: center;
      }
    }
  `]
})
export class CguModalComponent {
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }
}

