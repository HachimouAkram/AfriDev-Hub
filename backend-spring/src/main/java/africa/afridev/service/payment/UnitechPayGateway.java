package africa.afridev.service.payment;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class UnitechPayGateway {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.payment.unitech.api-key:eb347b5f5b68382b58d3f0babd3687e0186026209ef62357d341fef9bccd4fd3}")
    private String apiKey;

    @Value("${app.payment.unitech.base-url:https://api.unitech.sn/api.php}")
    private String baseUrl;

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);
        return headers;
    }

    /**
     * Création d'une session de paiement Wave (Sénégal)
     */
    public Map<String, Object> createWavePayment(BigDecimal amount, String customerPhone, String orderNumber, String successUrl, String cancelUrl) {
        String url = baseUrl + "?action=create_wave_payment";
        Map<String, Object> body = new HashMap<>();
        body.put("amount", amount.intValue());
        body.put("currency", "XOF");
        body.put("reference", orderNumber);

        // Format phone to international format for Senegal if starting with 7X
        String formattedPhone = customerPhone != null ? customerPhone.trim().replaceAll("\\s+", "") : "";
        if (formattedPhone.startsWith("7") && formattedPhone.length() == 9) {
            formattedPhone = "221" + formattedPhone;
        } else if (formattedPhone.startsWith("+")) {
            formattedPhone = formattedPhone.substring(1);
        }
        body.put("customer_number", formattedPhone.isEmpty() ? "221771234567" : formattedPhone);
        body.put("description", "Commande AfriDev Hub #" + orderNumber);
        String safeSuccess = (successUrl != null && !successUrl.contains("localhost")) ? successUrl : "https://afridev.africa/payment/success?order=" + orderNumber;
        String safeCancel = (cancelUrl != null && !cancelUrl.contains("localhost")) ? cancelUrl : "https://afridev.africa/payment/cancel?order=" + orderNumber;
        body.put("callback_success", safeSuccess);
        body.put("callback_cancel", safeCancel);

        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, createHeaders());
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("Erreur UnitechPay create_wave_payment: {}", e.getMessage());
        }
        return Map.of("success", false, "message", "Erreur lors de l'initialisation du paiement Wave");
    }

    /**
     * Création d'un paiement Orange Money (QR Code ou lien)
     */
    public Map<String, Object> createOrangePayment(BigDecimal amount, String customerPhone, String orderNumber, String successUrl, String cancelUrl) {
        String url = baseUrl + "?action=create_orange_qr";
        Map<String, Object> body = new HashMap<>();
        body.put("amount", amount.intValue());
        body.put("reference", orderNumber);
        body.put("customer_number", customerPhone);
        body.put("description", "Commande AfriDev Hub #" + orderNumber);
        String safeSuccess = (successUrl != null && !successUrl.contains("localhost")) ? successUrl : "https://afridev.africa/payment/success?order=" + orderNumber;
        String safeCancel = (cancelUrl != null && !cancelUrl.contains("localhost")) ? cancelUrl : "https://afridev.africa/payment/cancel?order=" + orderNumber;
        body.put("callback_success", safeSuccess);
        body.put("callback_cancel", safeCancel);

        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, createHeaders());
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("Erreur UnitechPay create_orange_qr: {}", e.getMessage());
        }
        return Map.of("success", false, "message", "Erreur lors de l'initialisation Orange Money");
    }

    /**
     * Paiement Côte d'Ivoire, Burkina Faso, Togo, Bénin
     */
    public Map<String, Object> createIntlPayment(String country, String operator, BigDecimal amount, String customerPhone, String customerName, String otp, String orderNumber, String successUrl, String cancelUrl) {
        String url = baseUrl + "?action=create_intl_payment";
        Map<String, Object> body = new HashMap<>();
        body.put("country", country.toUpperCase());
        body.put("operator", operator);
        body.put("amount", amount.intValue());
        body.put("customer_number", customerPhone != null ? customerPhone : "");
        body.put("customer_name", customerName != null ? customerName : "Client AfriDev");
        body.put("description", "Commande AfriDev Hub #" + orderNumber);
        if (otp != null && !otp.isBlank()) {
            body.put("otp", otp);
        }
        String safeSuccess = (successUrl != null && !successUrl.contains("localhost")) ? successUrl : "https://afridev.africa/payment/success?order=" + orderNumber;
        String safeCancel = (cancelUrl != null && !cancelUrl.contains("localhost")) ? cancelUrl : "https://afridev.africa/payment/cancel?order=" + orderNumber;
        body.put("callback_success", safeSuccess);
        body.put("callback_cancel", safeCancel);

        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, createHeaders());
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("Erreur UnitechPay create_intl_payment: {}", e.getMessage());
        }
        return Map.of("success", false, "message", "Erreur lors du paiement international");
    }

    /**
     * Retrait automatique vers Mobile Money (Sénégal & autres pays)
     */
    public Map<String, Object> withdrawFunds(BigDecimal amount, String method, String account, String country, String operator) {
        String url = baseUrl + "?action=withdraw_funds";
        Map<String, Object> body = new HashMap<>();
        body.put("amount", amount.intValue());
        body.put("method", method.toLowerCase()); // wave, orange, intl, bank
        body.put("account", account);
        if ("intl".equalsIgnoreCase(method)) {
            body.put("country", country != null ? country.toUpperCase() : "CI");
            body.put("operator", operator != null ? operator : "orange_money");
        }

        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, createHeaders());
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("Erreur UnitechPay withdraw_funds: {}", e.getMessage());
        }
        return Map.of("success", false, "message", "Erreur lors de la demande de retrait");
    }

    /**
     * Vérification de la signature HMAC-SHA256 du webhook UnitechPay
     */
    public boolean verifyWebhookSignature(String payload, String signatureHeader) {
        if (signatureHeader == null || signatureHeader.isBlank() || apiKey == null) {
            return false;
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(apiKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString().equalsIgnoreCase(signatureHeader.trim());
        } catch (Exception e) {
            log.error("Erreur lors de la vérification de signature webhook UnitechPay: {}", e.getMessage());
            return false;
        }
    }
}

