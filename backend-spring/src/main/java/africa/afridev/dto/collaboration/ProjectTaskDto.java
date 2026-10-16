package africa.afridev.dto.collaboration;

import africa.afridev.model.enums.TaskPriority;
import africa.afridev.model.enums.TaskStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectTaskDto {
    private String id;
    private String projectId;
    private String title;
    private String description;
    private String rejectionReason;
    
    private String assignedToId;
    private String assignedToName;
    private String assignedToAvatar;
    
    private String createdById;
    private String createdByName;
    
    private TaskStatus status;
    private TaskPriority priority;
    private LocalDate dueDate;
    private boolean isOverdue;
    
    private LocalDateTime completedAt;
    private Integer orderIndex;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
