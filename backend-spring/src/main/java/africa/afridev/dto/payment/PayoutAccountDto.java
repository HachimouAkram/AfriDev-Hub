package africa.afridev.dto.payment;

import africa.afridev.model.enums.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PayoutAccountDto {
    private String id;
    private String country;
    private PaymentMethod method;
    private String phoneNumber;
    private String accountName;
    private Boolean isDefault;
    private Boolean isVerified;
}

