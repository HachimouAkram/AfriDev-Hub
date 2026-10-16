package africa.afridev.dto.event;

import africa.afridev.model.enums.TechEventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TechEventCreateRequest {

    @NotBlank(message = "Le titre de l'événement est obligatoire")
    private String title;

    @NotBlank(message = "La description est obligatoire")
    private String description;

    @NotNull(message = "Le type d'événement est obligatoire (MEETUP, CONFERENCE, HACKATHON, WORKSHOP)")
    private TechEventType type;

    @NotNull(message = "La date de début est obligatoire")
    private LocalDateTime startDate;

    private LocalDateTime endDate;
    private String location;
    private Boolean isOnline = false;
    private String eventUrl;
    private String bannerUrl;
    private List<String> tags;
}
