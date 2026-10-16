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
