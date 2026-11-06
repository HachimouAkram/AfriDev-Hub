package africa.afridev.dto.mentor;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class MentorUpdateRequest {

    private Boolean isMentor;

    @Size(max = 1000, message = "La bio mentor ne doit pas dépasser 1000 caractères.")
    private String mentorBio;

    @Min(value = 1, message = "La disponibilité minimale est de 1 heure par semaine.")
    @Max(value = 40, message = "La disponibilité maximale est de 40 heures par semaine.")
    private Integer mentorHoursPerWeek = 2;

    private List<String> mentorTopics = new ArrayList<>();
}

