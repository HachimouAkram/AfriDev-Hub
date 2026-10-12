package africa.afridev.dto.opportunity;

import africa.afridev.model.enums.OpportunityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class OpportunityCreateRequest {

    @NotBlank(message = "Le titre est obligatoire")
    private String title;

    @NotBlank(message = "La description est obligatoire")
    private String description;

    @NotNull(message = "Le type d'opportunité est obligatoire")
    private OpportunityType type;

    @NotBlank(message = "La localisation est obligatoire")
    private String location;

    private Boolean isRemote;
    private List<String> stack;
    private String budget;
    private LocalDateTime deadline;
    private Integer maxApplicants;
    private Boolean isPaid;
}
