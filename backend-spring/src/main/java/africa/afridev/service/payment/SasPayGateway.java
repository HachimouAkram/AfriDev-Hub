package africa.afridev.service.payment;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class SasPayGateway {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.payment.saspay.api-key:sk_live_5rmtOhLU_2ReoZK4Q5NAsvK4ms5J_dN8991cd5m8T78}")
    private String apiKey;

    @Value("${app.payment.saspay.base-url:https://api.saspay.me/api/v1}")
    private String baseUrl;

    @Value("${app.payment.saspay.fallback-link:https://link.saspay.me/bpz950t0zto}")
    private String fallbackLink;

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey.trim());
        return headers;
    }

    /**
     * Création d'une session de paiement hébergée SasPay (Panafricain : Wave, Orange Money, MoMo, Moov, Carte)
     */
    public Map<String, Object> createCheckoutSession(
            BigDecimal amount,
            String currency,
            String description,
            String customerEmail,
            String customerName,
            String customerPhone,
            String country,
            String reference,
            String returnUrl,
            String cancelUrl
    ) {
        String url = baseUrl + "/checkout-sessions/";
        Map<String, Object> body = new HashMap<>();
        body.put("amount", amount.setScale(2, RoundingMode.HALF_UP).toString());
        body.put("currency", currency != null ? currency.toUpperCase() : "XOF");
        body.put("description", description != null ? description : "Paiement AfriDev Hub #" + reference);
        body.put("reference", reference);

        String validEmail = (customerEmail != null && customerEmail.contains("@")) 
                ? customerEmail.trim() 
                : "client@afridev.africa";
        String validName = (customerName != null && !customerName.isBlank()) 
                ? customerName.trim() 
                : "Client AfriDev";

        body.put("customer_email", validEmail);
        body.put("customer_name", validName);

        if (customerPhone != null && !customerPhone.isBlank()) {
            body.put("customer_phone", customerPhone.trim());
        }
        if (country != null && !country.isBlank()) {
            body.put("country", country.trim().toUpperCase());
        }
        if (returnUrl != null && !returnUrl.isBlank()) {
            body.put("return_url", returnUrl);
        }
        if (cancelUrl != null && !cancelUrl.isBlank()) {
            body.put("cancel_url", cancelUrl);
        }

        try {
            log.info("Appel SasPay checkout-sessions pour {} (Montant: {} {}) -> payload: {}", reference, amount, currency, body);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, createHeaders());
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> respBody = response.getBody();
                Map<String, Object> data = (Map<String, Object>) respBody.get("data");
                if (data != null && data.get("checkout_url") != null) {
                    log.info("Session SasPay créée avec succès pour la commande {} -> {}", reference, data.get("checkout_url"));
                    return data;
                }
            }
        } catch (Exception e) {
            log.warn("Erreur appel API SasPay ({}), bascule sur le lien hébergé sécurisé: {}", url, e.getMessage());
        }

        // Fallback intelligent sur le lien hébergé marchand SasPay avec paramètres
        try {
            String encodedRef = URLEncoder.encode(reference, StandardCharsets.UTF_8);
            String encodedDesc = URLEncoder.encode(description != null ? description : "Commande AfriDev", StandardCharsets.UTF_8);
            String dynamicLink = fallbackLink + "?amount=" + amount.intValue() + "&reference=" + encodedRef + "&description=" + encodedDesc;
            log.info("Génération du lien de secours SasPay: {}", dynamicLink);
            return Map.of(
                    "checkout_url", dynamicLink,
                    "id", "sas_" + reference,
                    "status", "PENDING"
            );
        } catch (Exception e) {
            return Map.of(
                    "checkout_url", fallbackLink,
                    "id", "sas_" + reference,
                    "status", "PENDING"
            );
        }
    }
}

