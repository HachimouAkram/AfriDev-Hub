package africa.afridev.dto.group;

import africa.afridev.model.enums.GroupPostType;
import africa.afridev.model.enums.GroupPostVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class GroupPostCreateRequest {

    @NotBlank(message = "Le titre est obligatoire.")
    @Size(min = 3, max = 200)
    private String title;

    @NotBlank(message = "Le contenu de la publication est obligatoire.")
    @Size(min = 10, max = 10000)
    private String content;

    private GroupPostType type = GroupPostType.DISCUSSION;
    private GroupPostVisibility visibility = GroupPostVisibility.PUBLIC;
    private Boolean isPinned = false;
    private List<String> attachments = new ArrayList<>();
}
