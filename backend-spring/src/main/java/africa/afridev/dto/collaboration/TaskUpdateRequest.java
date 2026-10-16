package africa.afridev.dto.collaboration;

import africa.afridev.model.enums.TaskPriority;
import africa.afridev.model.enums.TaskStatus;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TaskUpdateRequest {
    private String title;
    private String description;
    private String assignedToId;
    private TaskStatus status;
    private TaskPriority priority;
    private LocalDate dueDate;
    private Integer orderIndex;
    private String rejectionReason;
}
