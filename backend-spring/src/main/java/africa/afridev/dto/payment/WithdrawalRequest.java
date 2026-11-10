package africa.afridev.dto.payment;

import africa.afridev.model.enums.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class WithdrawalRequest {
    @NotNull(message = "Le montant est obligatoire")
    @DecimalMin(value = "500.0", message = "Le montant minimum de retrait est de 500 XOF")
    private BigDecimal amount;

    @NotNull(message = "La méthode de retrait est obligatoire")
    private PaymentMethod method; // WAVE, ORANGE_MONEY, BANK, etc.

    private String country = "SN";
    private String operator; // wave_money, orange_money, mtn_money, moov

    @NotBlank(message = "Le numéro ou compte de réception est obligatoire")
    private String account;
}

