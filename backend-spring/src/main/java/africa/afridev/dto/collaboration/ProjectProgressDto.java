package africa.afridev.dto.collaboration;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectProgressDto {
    private String projectId;
    private String projectTitle;
    private long totalTasks;
    private long completedTasks;
    private long inProgressTasks;
    private long reviewTasks;
    private long todoTasks;
    private long overdueTasks;
    private int completionPercentage;
    private long activeMembersCount;
    private boolean isProjectLead;
}
