package africa.afridev.dto.resource;

import africa.afridev.model.enums.ResourceType;
import africa.afridev.model.enums.SkillLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ResourceCreateRequest {
    @NotBlank(message = "Le titre est obligatoire")
    private String title;

    @NotBlank(message = "La description est obligatoire")
    private String description;

    @NotNull(message = "Le type de ressource est obligatoire")
    private ResourceType type;

    @NotNull(message = "Le niveau requis est obligatoire")
    private SkillLevel level;

    @NotBlank(message = "La technologie est obligatoire")
    private String technology;

    private String language = "fr";
    private String youtubeUrl;
    private String thumbnailUrl;
    private String contentMarkdown;
    private String pdfUrl;
    private Boolean isPaid = false;
    private BigDecimal price;
    private String currency = "XOF";
    private Integer durationMinutes = 30;
    private Integer xpReward = 50;
}

