package africa.afridev.service;

import africa.afridev.dto.auth.UserDto;
import africa.afridev.dto.message.ConversationSummaryDto;
import africa.afridev.dto.message.MessageCreateRequest;
import africa.afridev.dto.message.MessageDto;
import africa.afridev.model.entity.MessageEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.repository.MessageRepository;
import africa.afridev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final AuthService authService;

    @Transactional
    public MessageDto sendMessage(String senderEmail, MessageCreateRequest request) {
        UserEntity sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new IllegalArgumentException("Expéditeur introuvable."));

        UserEntity recipient = userRepository.findById(request.getRecipientId())
                .orElseThrow(() -> new IllegalArgumentException("Destinataire introuvable."));

        MessageEntity message = MessageEntity.builder()
                .sender(sender)
                .recipient(recipient)
                .content(request.getContent())
                .isRead(false)
                .build();

        MessageEntity saved = messageRepository.save(message);
        return mapToMessageDto(saved);
    }

    @Transactional(readOnly = true)
    public List<MessageDto> getConversation(String userEmail, String targetUserId) {
        UserEntity currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));

        List<MessageEntity> messages = messageRepository.findConversationBetween(currentUser.getId(), targetUserId);
        return messages.stream().map(this::mapToMessageDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserDto> getRecentConversations(String userEmail) {
        UserEntity currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));

        List<MessageEntity> allMessages = messageRepository.findAllUserMessages(currentUser.getId());
        Set<String> partnerIds = new LinkedHashSet<>();
        List<UserDto> partners = new ArrayList<>();

        for (MessageEntity msg : allMessages) {
            String partnerId = msg.getSender().getId().equals(currentUser.getId()) 
                    ? msg.getRecipient().getId() 
                    : msg.getSender().getId();

            if (!partnerIds.contains(partnerId)) {
                partnerIds.add(partnerId);
                UserEntity partner = msg.getSender().getId().equals(currentUser.getId()) ? msg.getRecipient() : msg.getSender();
                partners.add(authService.mapToUserDto(partner));
            }
        }

        return partners;
    }

    @Transactional(readOnly = true)
    public List<ConversationSummaryDto> getConversationSummaries(String userEmail) {
        UserEntity currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));

        List<MessageEntity> allMessages = messageRepository.findAllUserMessages(currentUser.getId());
        Set<String> partnerIds = new LinkedHashSet<>();
        List<ConversationSummaryDto> summaries = new ArrayList<>();

        for (MessageEntity msg : allMessages) {
            String partnerId = msg.getSender().getId().equals(currentUser.getId()) 
                    ? msg.getRecipient().getId() 
                    : msg.getSender().getId();

            if (!partnerIds.contains(partnerId)) {
                partnerIds.add(partnerId);
                UserEntity partner = msg.getSender().getId().equals(currentUser.getId()) ? msg.getRecipient() : msg.getSender();
                boolean fromMe = msg.getSender().getId().equals(currentUser.getId());
                
                summaries.add(ConversationSummaryDto.builder()
                        .partner(authService.mapToUserDto(partner))
                        .lastMessage(msg.getContent())
                        .lastMessageTime(msg.getCreatedAt())
                        .isLastMessageFromMe(fromMe)
                        .isRead(msg.getIsRead())
                        .build());
            }
        }

        return summaries;
    }

    private MessageDto mapToMessageDto(MessageEntity entity) {
        return MessageDto.builder()
                .id(entity.getId())
                .sender(authService.mapToUserDto(entity.getSender()))
                .recipient(authService.mapToUserDto(entity.getRecipient()))
                .content(entity.getContent())
                .isRead(entity.getIsRead())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
