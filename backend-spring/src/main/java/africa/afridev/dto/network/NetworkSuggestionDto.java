package africa.afridev.dto.network;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NetworkSuggestionDto {
    private UserNetworkDto user;
    private Double matchPercentage;
    private List<String> matchedSkills;
    private String reason;
}
