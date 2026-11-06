package africa.afridev.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GroupChatMessageRequest {

    @NotBlank(message = "Le message ne peut pas être vide.")
    @Size(min = 1, max = 4000)
    private String content;

    private String attachmentUrl;
    private String parentMessageId;
}

