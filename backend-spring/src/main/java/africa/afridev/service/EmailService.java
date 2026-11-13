package africa.afridev.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from-address}")
    private String fromAddress;

    @Value("${app.mail.from-name}")
    private String fromName;

    // ── OTP Email (SYNCHRONE – l'erreur doit remonter pour le fallback DEV) ──
    public void sendOtpEmail(String toEmail, String otpCode) throws Exception {
        String subject = "\uD83D\uDD10 Votre code de vérification AfriDev Hub";
        String body = """
            <div style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: auto; background: #0F1828; color: #E2E8F0; border-radius: 16px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 32px; text-align: center;">
                <h1 style="margin: 0; color: #fff; font-size: 24px; font-weight: 800;">AfriDev Hub</h1>
                <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Connexion Développeurs Africains</p>
              </div>
              <div style="padding: 32px;">
                <h2 style="font-size: 20px; color: #F8FAFC; margin-bottom: 8px;">Votre code de vérification</h2>
                <p style="color: #94A3B8; font-size: 15px; margin-bottom: 24px;">
                  Utilisez ce code pour vérifier votre adresse email et accéder à votre compte AfriDev Hub.
                  Ce code est valable <strong style="color: #34D399;">10 minutes</strong>.
                </p>
                <div style="background: #1E293B; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px; border: 1px solid #334155;">
                  <span style="font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #10B981; font-family: monospace;">%s</span>
                </div>
                <p style="color: #64748B; font-size: 13px; text-align: center;">
                  Si vous n'avez pas demandé ce code, ignorez cet email.
                </p>
              </div>
              <div style="background: #0B1120; padding: 16px; text-align: center;">
                <p style="margin: 0; color: #475569; font-size: 12px;">© 2026 AfriDev Hub · Plateforme Panafricaine des Développeurs</p>
              </div>
            </div>
            """.formatted(otpCode);

        sendHtmlEmailChecked(toEmail, subject, body);
    }

    // ── Security OTP Email (2FA / Nouvel Appareil) ──────────────────────────
    public void sendSecurityOtpEmail(String toEmail, String otpCode, String deviceName, String ipAddress, boolean isNewDevice) throws Exception {
        String alertTitle = isNewDevice ? "Connexion sur un nouvel appareil détectée" : "Code d'authentification à deux facteurs (2FA)";
        String alertDescription = isNewDevice 
            ? "Une tentative de connexion a été initiée depuis un <strong>appareil non reconnu</strong>. Pour valider cet appareil et accéder à votre compte, veuillez saisir le code de sécurité ci-dessous :"
            : "Une tentative de connexion requiert votre vérification à deux facteurs. Veuillez saisir le code de sécurité ci-dessous :";

        String subject = "\uD83D\uDD12 Code de sécurité AfriDev Hub – " + (isNewDevice ? "Nouvel appareil" : "Double authentification");
        String body = """
            <div style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: auto; background: #0F1828; color: #E2E8F0; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
              <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 32px; text-align: center;">
                <h1 style="margin: 0; color: #fff; font-size: 24px; font-weight: 800;">AfriDev Hub</h1>
                <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Sécurité du Compte Développeur</p>
              </div>
              <div style="padding: 32px;">
                <div style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10B981; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px;">
                  <h3 style="margin: 0; color: #34D399; font-size: 16px; font-weight: 700;">%s</h3>
                </div>
                <p style="color: #94A3B8; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                  %s
                </p>
                <div style="background: #1E293B; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #334155;">
                  <div style="font-size: 12px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; text-align: center;">Détails de la tentative :</div>
                  <div style="display: flex; justify-content: space-between; font-size: 13px; color: #E2E8F0; margin-bottom: 6px;">
                    <span style="color: #64748B;">Appareil :</span> <strong>%s</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 13px; color: #E2E8F0;">
                    <span style="color: #64748B;">Adresse IP :</span> <strong>%s</strong>
                  </div>
                </div>
                <div style="background: #0B1120; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; border: 1px solid rgba(16,185,129,0.3);">
                  <div style="font-size: 12px; color: #34D399; margin-bottom: 8px; font-weight: 600;">VOTRE CODE DE SÉCURITÉ (VALABLE 10 MIN)</div>
                  <span style="font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #10B981; font-family: monospace;">%s</span>
                </div>
                <p style="color: #EF4444; font-size: 12px; line-height: 1.5; margin: 0;">
                  ⚠️ Si vous n'êtes pas à l'origine de cette tentative, nous vous recommandons de modifier immédiatement votre mot de passe et de révoquer vos sessions.
                </p>
              </div>
              <div style="background: #070B14; padding: 16px; text-align: center;">
                <p style="margin: 0; color: #475569; font-size: 12px;">© 2026 AfriDev Hub · Plateforme Panafricaine des Développeurs</p>
              </div>
            </div>
            """.formatted(alertTitle, alertDescription, deviceName, ipAddress, otpCode);

        sendHtmlEmailChecked(toEmail, subject, body);
    }

    // ── Application Rejection Email ────────────────────────────────────────────
    @Async
    public void sendApplicationRejectionEmail(String toEmail, String applicantName,
                                               String opportunityTitle, String reason) {
        String subject = "\uD83D\uDCE9 Résultat de votre candidature – " + opportunityTitle;
        String body = """
            <div style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: auto; background: #0F1828; color: #E2E8F0; border-radius: 16px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 32px; text-align: center;">
                <h1 style="margin: 0; color: #fff; font-size: 24px; font-weight: 800;">AfriDev Hub</h1>
              </div>
              <div style="padding: 32px;">
                <h2 style="font-size: 20px; color: #F8FAFC; margin-bottom: 8px;">Mise à jour de votre candidature</h2>
                <p style="color: #94A3B8; font-size: 15px;">Bonjour <strong style="color: #E2E8F0;">%s</strong>,</p>
                <p style="color: #94A3B8; font-size: 15px; margin-bottom: 24px;">
                  Votre candidature pour l'offre <strong style="color: #34D399;">« %s »</strong> a été examinée.
                </p>
                <div style="background: rgba(239,68,68,0.1); border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #EF4444;">
                  <p style="margin: 0; font-size: 15px; color: #FCA5A5; font-weight: 700;">❌ Candidature non retenue</p>
                  <p style="margin: 8px 0 0; color: #94A3B8; font-size: 14px;"><strong style="color: #E2E8F0;">Motif :</strong> %s</p>
                </div>
                <p style="color: #64748B; font-size: 14px;">
                  Ne vous découragez pas ! De nombreuses opportunités vous attendent sur AfriDev Hub.
                </p>
                <a href="http://localhost:4200/opportunities"
                   style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #10B981; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">
                  Découvrir d'autres opportunités →
                </a>
              </div>
              <div style="background: #0B1120; padding: 16px; text-align: center;">
                <p style="margin: 0; color: #475569; font-size: 12px;">© 2026 AfriDev Hub · Plateforme Panafricaine des Développeurs</p>
              </div>
            </div>
            """.formatted(applicantName, opportunityTitle, reason);

        sendHtmlEmail(toEmail, subject, body);
    }

    // ── Application Acceptance Email ───────────────────────────────────────────
    @Async
    public void sendApplicationAcceptanceEmail(String toEmail, String applicantName,
                                                String opportunityTitle, String publisherName) {
        String subject = "\uD83C\uDF89 Bonne nouvelle ! Candidature acceptée – " + opportunityTitle;
        String body = """
            <div style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: auto; background: #0F1828; color: #E2E8F0; border-radius: 16px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 32px; text-align: center;">
                <h1 style="margin: 0; color: #fff; font-size: 24px; font-weight: 800;">AfriDev Hub</h1>
              </div>
              <div style="padding: 32px;">
                <h2 style="font-size: 20px; color: #F8FAFC; margin-bottom: 8px;">\uD83C\uDF89 Félicitations !</h2>
                <p style="color: #94A3B8; font-size: 15px;">Bonjour <strong style="color: #E2E8F0;">%s</strong>,</p>
                <div style="background: rgba(16,185,129,0.1); border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #10B981;">
                  <p style="margin: 0; font-size: 15px; color: #34D399; font-weight: 700;">✅ Votre candidature a été acceptée !</p>
                  <p style="margin: 8px 0 0; color: #94A3B8; font-size: 14px;">
                    Offre : <strong style="color: #E2E8F0;">« %s »</strong><br/>
                    Émetteur : <strong style="color: #E2E8F0;">%s</strong>
                  </p>
                </div>
                <p style="color: #94A3B8; font-size: 14px;">
                  Connectez-vous à AfriDev Hub pour contacter directement le recruteur.
                </p>
                <a href="http://localhost:4200/dashboard/applications"
                   style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #10B981; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">
                  Voir mes candidatures →
                </a>
              </div>
              <div style="background: #0B1120; padding: 16px; text-align: center;">
                <p style="margin: 0; color: #475569; font-size: 12px;">© 2026 AfriDev Hub · Plateforme Panafricaine des Développeurs</p>
              </div>
            </div>
            """.formatted(applicantName, opportunityTitle, publisherName);

        sendHtmlEmail(toEmail, subject, body);
    }

    // ── Notification de Sanction de Compte (Suspension / Bannissement / Réactivation) ──
    @Async
    public void sendAccountSanctionEmail(String toEmail, String userName, String sanctionType, String reason) {
        String alertColor = sanctionType.contains("BANNED") ? "#EF4444" : (sanctionType.contains("SUSPENDED") ? "#F59E0B" : "#10B981");
        String alertBadge = sanctionType.contains("BANNED") ? "Bannissement Définitif" : (sanctionType.contains("SUSPENDED") ? "Suspension Temporaire" : "Compte Réactivé");
        String subject = "⚠️ Notification importante concernant votre compte AfriDev Hub (" + alertBadge + ")";

        String body = """
            <div style="font-family: Inter, Arial, sans-serif; max-width: 540px; margin: auto; background: #0F1828; color: #E2E8F0; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
              <div style="background: linear-gradient(135deg, %s, #0F1828); padding: 30px; text-align: center;">
                <h1 style="margin: 0; color: #fff; font-size: 24px; font-weight: 800;">AfriDev Hub</h1>
                <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Centre de Sécurité & Modération Panafricaine</p>
              </div>
              <div style="padding: 32px;">
                <h2 style="font-size: 19px; color: #F8FAFC; margin-bottom: 12px;">Mise à jour du statut de votre compte</h2>
                <p style="color: #94A3B8; font-size: 15px;">Bonjour <strong style="color: #E2E8F0;">%s</strong>,</p>
                <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid %s;">
                  <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: %s; font-weight: 700; margin-bottom: 6px;">Statut appliqué : %s</div>
                  <div style="font-size: 14px; color: #CBD5E1; margin-top: 8px;">
                    <strong>Motif consigné au registre d'audit :</strong>
                    <div style="margin-top: 6px; padding: 12px; background: rgba(0,0,0,0.25); border-radius: 8px; color: #F1F5F9; font-style: italic;">
                      « %s »
                    </div>
                  </div>
                </div>
                <p style="color: #94A3B8; font-size: 14px; line-height: 1.6;">
                  AfriDev Hub veille rigoureusement à l'intégrité des compétences et au respect des règles communautaires. Si vous estimez qu'il s'agit d'une erreur ou si vous souhaitez fournir des éléments complémentaires, vous pouvez contacter notre équipe de modération.
                </p>
                <div style="margin-top: 24px; text-align: center;">
                  <a href="mailto:support@afridev.africa?subject=Recours%%20Compte%%20AfriDev" 
                     style="display: inline-block; padding: 12px 24px; background: #1E293B; color: #E2E8F0; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; border: 1px solid #334155;">
                    Contacter le support / Recours
                  </a>
                </div>
              </div>
              <div style="background: #0B1120; padding: 16px; text-align: center;">
                <p style="margin: 0; color: #475569; font-size: 12px;">© 2026 AfriDev Hub · Plateforme Panafricaine des Développeurs</p>
              </div>
            </div>
            """.formatted(alertColor, userName != null ? userName : toEmail, alertColor, alertColor, alertBadge, reason != null ? reason : "Non spécifié");

        sendHtmlEmail(toEmail, subject, body);
    }

    // ── Notification de Modération de Projet (Gel / Dépublication pour Droits d'Auteur / Plagiat) ──
    @Async
    public void sendProjectModerationEmail(String toEmail, String userName, String projectTitle, String action, String reason) {
        String subject = "⚖️ Notification de modération – Votre projet « " + projectTitle + " »";
        String body = """
            <div style="font-family: Inter, Arial, sans-serif; max-width: 540px; margin: auto; background: #0F1828; color: #E2E8F0; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
              <div style="background: linear-gradient(135deg, #F59E0B, #B45309); padding: 30px; text-align: center;">
                <h1 style="margin: 0; color: #fff; font-size: 24px; font-weight: 800;">AfriDev Hub</h1>
                <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Cellule Droits d'Auteur & Propriété Intellectuelle</p>
              </div>
              <div style="padding: 32px;">
                <h2 style="font-size: 19px; color: #F8FAFC; margin-bottom: 12px;">Action administrative sur votre projet</h2>
                <p style="color: #94A3B8; font-size: 15px;">Bonjour <strong style="color: #E2E8F0;">%s</strong>,</p>
                <p style="color: #94A3B8; font-size: 14px; line-height: 1.6;">
                  Votre projet <strong style="color: #34D399;">« %s »</strong> a fait l'objet d'une intervention par l'équipe d'administration (%s).
                </p>
                <div style="background: rgba(245, 158, 11, 0.1); border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #F59E0B;">
                  <div style="font-size: 13px; color: #FBBF24; font-weight: 700; margin-bottom: 6px;">Motif de l'intervention :</div>
                  <div style="font-size: 14px; color: #E2E8F0; font-style: italic;">« %s »</div>
                </div>
                <p style="color: #64748B; font-size: 13px; line-height: 1.6;">
                  Si ce projet a été masqué ou gelé suite à un signalement (droits d'auteur, contenu non vérifié ou duplicata), il ne sera plus visible publiquement tant que la situation n'aura pas été clarifiée.
                </p>
                <div style="margin-top: 24px; text-align: center;">
                  <a href="mailto:moderation@afridev.africa?subject=Justificatif%%20Projet%%20" 
                     style="display: inline-block; padding: 12px 24px; background: #10B981; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px;">
                    Fournir les preuves de propriété intellectuelle
                  </a>
                </div>
              </div>
              <div style="background: #0B1120; padding: 16px; text-align: center;">
                <p style="margin: 0; color: #475569; font-size: 12px;">© 2026 AfriDev Hub · Plateforme Panafricaine des Développeurs</p>
              </div>
            </div>
            """.formatted(userName != null ? userName : toEmail, projectTitle, action, reason != null ? reason : "Vérification de conformité");

        sendHtmlEmail(toEmail, subject, body);
    }

    // ── Email Alerte Compte Désactivé (Rate Limiting / Anti-Brute Force) ──
    @Async
    public void sendAccountLockedEmail(String toEmail, int lockoutMinutes, String ipAddress, String deviceName) {
        String subject = "\uD83D\uDEA8 [AfriDev Hub] Sécurité : Votre compte a été temporairement désactivé";
        String body = """
            <div style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: auto; background: #0F1828; color: #E2E8F0; border-radius: 16px; overflow: hidden; border: 1px solid #EF4444;">
              <div style="background: linear-gradient(135deg, #EF4444, #B91C1C); padding: 28px; text-align: center;">
                <h1 style="margin: 0; color: #fff; font-size: 22px; font-weight: 800;">Alerte de Sécurité AfriDev Hub</h1>
                <p style="margin: 6px 0 0; color: rgba(255,255,255,0.9); font-size: 13px;">Suspension Temporaire de Connexion</p>
              </div>
              <div style="padding: 28px;">
                <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #EF4444; padding: 14px 18px; border-radius: 8px; margin-bottom: 20px;">
                  <strong style="color: #F87171; font-size: 15px;">5 tentatives de connexion infructueuses détectées</strong>
                  <p style="color: #CBD5E1; font-size: 13px; margin: 6px 0 0;">
                    Par mesure de protection contre les attaques par force brute, votre compte a été temporairement désactivé pour <strong>%d minutes</strong>.
                  </p>
                </div>
                <div style="background: #1E293B; border-radius: 10px; padding: 16px; margin-bottom: 20px; font-size: 13px; line-height: 1.6; color: #94A3B8;">
                  <div style="color: #F1F5F9; font-weight: 600; margin-bottom: 6px;">Détails de l'incident :</div>
                  <div>📍 Adresse IP : <span style="color: #38BDF8; font-family: monospace;">%s</span></div>
                  <div>💻 Appareil : <span style="color: #F1F5F9;">%s</span></div>
                  <div>⏳ Durée du blocage : <strong style="color: #F87171;">%d minutes</strong></div>
                </div>
                <p style="color: #94A3B8; font-size: 13px; line-height: 1.5;">
                  <strong>Que devez-vous faire ?</strong><br/>
                  1. Veuillez patienter et réessayer de vous connecter dans <strong>%d minutes</strong>.<br/>
                  2. Si vous n'êtes pas à l'origine de ces tentatives, quelqu'un a essayé de deviner votre mot de passe. Nous vous recommandons vivement de réinitialiser votre mot de passe dès la fin du blocage.
                </p>
              </div>
              <div style="background: #0B1120; padding: 14px; text-align: center;">
                <p style="margin: 0; color: #475569; font-size: 11px;">© 2026 AfriDev Hub · Sécurité de l'Infrastructure Panafricaine</p>
              </div>
            </div>
            """.formatted(lockoutMinutes, ipAddress != null ? ipAddress : "Inconnue", deviceName != null ? deviceName : "Navigateur web", lockoutMinutes, lockoutMinutes);

        sendHtmlEmail(toEmail, subject, body);
    }

    @Async
    public void sendTeamInvitationEmail(String toEmail, String recipientName, String companyName, String inviterName, String jobTitle) {
        String subject = "\uD83C\uDFE2 Invitation à rejoindre l'équipe de recrutement : " + companyName;
        String body = """
            <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: auto; background: #0F1828; color: #E2E8F0; border-radius: 16px; overflow: hidden; border: 1px solid #1E293B;">
              <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 30px; text-align: center;">
                <h1 style="margin: 0; color: #fff; font-size: 24px; font-weight: 800;">AfriDev Hub</h1>
                <p style="margin: 6px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Espace Entreprise & Recrutement</p>
              </div>
              <div style="padding: 30px;">
                <h2 style="font-size: 18px; color: #F8FAFC; margin-bottom: 12px;">Bonjour %s,</h2>
                <p style="color: #94A3B8; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
                  <strong>%s</strong> vous a invité(e) à rejoindre l'équipe de recrutement de l'entreprise <strong style="color: #10B981;">%s</strong> sur AfriDev Hub en tant que <strong>%s</strong>.
                </p>
                <div style="background: #1E293B; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #334155;">
                  <div style="color: #F8FAFC; font-size: 14px; margin-bottom: 8px;">🏢 Entreprise : <strong>%s</strong></div>
                  <div style="color: #F8FAFC; font-size: 14px; margin-bottom: 8px;">💼 Rôle attribué : <strong>%s</strong></div>
                  <div style="color: #34D399; font-size: 13px;">✓ Vos privilèges d'accès sont dès à présent actifs sur votre compte.</div>
                </div>
                <p style="color: #94A3B8; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
                  Vous pouvez dès maintenant accéder au cockpit recruteur pour publier des offres d'emploi, analyser les candidatures et organiser des événements tech au nom de votre entreprise.
                </p>
                <div style="text-align: center;">
                  <a href="https://afridev.africa/dashboard/recruiter" style="background: #10B981; color: #064E3B; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">
                    Accéder au Cockpit Recruteur →
                  </a>
                </div>
              </div>
              <div style="background: #0B1120; padding: 16px; text-align: center;">
                <p style="margin: 0; color: #475569; font-size: 12px;">© 2026 AfriDev Hub · Plateforme Panafricaine des Développeurs et Recruteurs</p>
              </div>
            </div>
            """.formatted(recipientName, inviterName, companyName, jobTitle, companyName, jobTitle);

        sendHtmlEmail(toEmail, subject, body);
    }

    public void sendAdminWelcomeEmail(String toEmail, String fullName, String roleName, String tempPassword) {
        String subject = "\uD83D\uDD11 Vos accès d'administrateur AfriDev Hub";
        String body = """
            <div style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: auto; background: #0F1828; color: #E2E8F0; border-radius: 16px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 32px; text-align: center;">
                <h1 style="margin: 0; color: #fff; font-size: 24px; font-weight: 800;">AfriDev Hub</h1>
                <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Gouvernance & Administration Panafricaine</p>
              </div>
              <div style="padding: 32px;">
                <h2 style="font-size: 20px; color: #F8FAFC; margin-bottom: 8px;">Bienvenue dans l'équipe, %s !</h2>
                <p style="color: #94A3B8; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                  Un compte avec les privilèges <strong style="color: #34D399;">%s</strong> vient de vous être attribué sur la plateforme officielle AfriDev Hub.
                </p>
                <div style="background: #1E293B; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #334155;">
                  <p style="margin: 0 0 10px 0; color: #94A3B8; font-size: 13px;">Identifiant de connexion : <strong style="color: #FFFFFF;">%s</strong></p>
                  <p style="margin: 0 0 12px 0; color: #94A3B8; font-size: 13px;">Mot de passe temporaire :</p>
                  <div style="background: #0F172A; padding: 12px; border-radius: 8px; text-align: center; border: 1px dashed #10B981;">
                    <span style="font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #10B981; font-family: monospace;">%s</span>
                  </div>
                </div>
                <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 14px; margin-bottom: 24px; color: #FBBF24; font-size: 13px;">
                  ⚠️ <strong>Sécurité obligatoire :</strong> Il vous sera immédiatement demandé de définir votre propre mot de passe personnel dès votre première connexion.
                </div>
                <div style="text-align: center;">
                  <a href="https://afridev.africa/login" style="background: #10B981; color: #064E3B; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">
                    Se connecter à AfriDev Hub →
                  </a>
                </div>
              </div>
              <div style="background: #0B1120; padding: 16px; text-align: center;">
                <p style="margin: 0; color: #475569; font-size: 12px;">© 2026 AfriDev Hub · Plateforme Panafricaine des Développeurs</p>
              </div>
            </div>
            """.formatted(fullName, roleName, toEmail, tempPassword);

        sendHtmlEmail(toEmail, subject, body);
    }

    // ── Generic fire-and-forget (errors logged, not propagated) ───────────────
    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            sendHtmlEmailChecked(to, subject, htmlBody);
        } catch (Exception e) {
            log.error("[EMAIL] Erreur envoi à {} : {}", to, e.getMessage());
        }
    }

    // ── Checked variant – caller must handle exception ─────────────────────────
    private void sendHtmlEmailChecked(String to, String subject, String htmlBody) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(fromAddress, fromName);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlBody, true);
        mailSender.send(message);
        log.info("[EMAIL] ✅ Envoyé à {} : {}", to, subject);
    }
}
