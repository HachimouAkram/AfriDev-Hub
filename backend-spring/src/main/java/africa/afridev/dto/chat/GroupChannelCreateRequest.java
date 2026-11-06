package africa.afridev.dto.chat;

import africa.afridev.model.enums.GroupChannelType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GroupChannelCreateRequest {

    @NotBlank(message = "Le nom du canal est obligatoire.")
    @Size(min = 2, max = 50)
    private String name;

    @Size(max = 255)
    private String description;

    private GroupChannelType type = GroupChannelType.TEXTE;
    private Boolean isDefault = false;
}
