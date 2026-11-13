package africa.afridev.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeleteAccountRequest {
    private String confirmation; // e.g. "SUPPRIMER"
    private String password;
}

