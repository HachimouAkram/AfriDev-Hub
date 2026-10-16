package africa.afridev.dto.collaboration;

import africa.afridev.model.enums.TaskPriority;
import africa.afridev.model.enums.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TaskCreateRequest {

    @NotBlank(message = "Le titre de la tâche est obligatoire")
    private String title;

    private String description;
    private String assignedToId;
    private TaskPriority priority = TaskPriority.MEDIUM;
    private TaskStatus status = TaskStatus.TODO;
    private LocalDate dueDate;
}
