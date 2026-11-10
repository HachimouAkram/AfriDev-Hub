package africa.afridev.dto.payment;

import africa.afridev.model.enums.PaymentMethod;
import africa.afridev.model.enums.PaymentProvider;
import africa.afridev.model.enums.PaymentTargetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PaymentInitiateRequest {
    @NotNull(message = "Le type de cible est obligatoire")
    private PaymentTargetType targetType;

    @NotBlank(message = "L'ID de la cible est obligatoire")
    private String targetId;

    @NotNull(message = "Le fournisseur de paiement est obligatoire")
    private PaymentProvider provider;

    @NotNull(message = "Le moyen de paiement est obligatoire")
    private PaymentMethod method;

    private String customerPhone;
    private String customerName;
    private String country = "SN";
    private String otp; // Requis pour Orange Money Côte d'Ivoire (#144*82#)
}

