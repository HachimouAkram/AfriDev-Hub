package africa.afridev.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class WalletDto {
    private String id;
    private String userId;
    private BigDecimal balance;
    private BigDecimal pendingEscrowBalance;
    private BigDecimal totalEarned;
    private BigDecimal totalWithdrawn;
    private String currency;
    private List<PayoutAccountDto> payoutAccounts;
}

