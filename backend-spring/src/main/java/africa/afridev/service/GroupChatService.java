package africa.afridev.service;

import africa.afridev.dto.chat.GroupChannelCreateRequest;
import africa.afridev.dto.chat.GroupChannelDto;
import africa.afridev.dto.chat.GroupChatMessageDto;
import africa.afridev.dto.chat.GroupChatMessageRequest;
import africa.afridev.model.entity.*;
import africa.afridev.model.enums.GroupChannelType;
import africa.afridev.model.enums.GroupMemberRole;
import africa.afridev.model.enums.GroupMemberStatus;
import africa.afridev.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GroupChatService {

    private final GroupChannelRepository channelRepository;
    private final GroupChatMessageRepository messageRepository;
    private final GroupRepository groupRepository;
    private final GroupMembershipRepository membershipRepository;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final SimpMessagingTemplate messagingTemplate;

    // ==========================================
    // 4.2 : GESTION DES CHANNELS
    // ==========================================

    @Transactional
    public GroupChannelDto createChannel(String userEmail, String groupId, GroupChannelCreateRequest request) {
        GroupEntity group = getGroupOrThrow(groupId);
        assertCanManageChannels(group, userEmail);

        String channelName = request.getName().trim().toLowerCase().replaceAll("[^a-z0-9-]", "-");
        if (channelRepository.existsByGroupIdAndNameIgnoreCase(groupId, channelName)) {
            throw new IllegalArgumentException("Un canal avec ce nom existe déjà dans ce groupe.");
        }

        GroupChannelEntity channel = GroupChannelEntity.builder()
                .group(group)
                .name(channelName)
                .description(request.getDescription())
                .type(request.getType() != null ? request.getType() : GroupChannelType.TEXTE)
                .isDefault(Boolean.TRUE.equals(request.getIsDefault()))
                .position(0)
                .build();

        GroupChannelEntity saved = channelRepository.save(channel);
        return mapChannelToDto(saved);
    }

    @Transactional
    public List<GroupChannelDto> getGroupChannels(String userEmail, String groupId) {
        GroupEntity group = getGroupOrThrow(groupId);
        assertIsMember(group, userEmail);

        List<GroupChannelEntity> channels = channelRepository.findByGroupIdOrderByPositionAscCreatedAtAsc(groupId);

        // Si aucun channel n'existe encore, créer automatiquement le channel #général
        if (channels.isEmpty()) {
            GroupChannelEntity defaultChannel = GroupChannelEntity.builder()
                    .group(group)
                    .name("general")
                    .description("Discussions générales de la communauté")
                    .type(GroupChannelType.TEXTE)
                    .isDefault(true)
                    .position(0)
                    .build();
            channels = List.of(channelRepository.save(defaultChannel));
        }

        return channels.stream().map(this::mapChannelToDto).collect(Collectors.toList());
    }

    @Transactional
    public void deleteChannel(String userEmail, String groupId, String channelId) {
        GroupEntity group = getGroupOrThrow(groupId);
        assertCanManageChannels(group, userEmail);

        GroupChannelEntity channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new IllegalArgumentException("Canal introuvable."));

        if (Boolean.TRUE.equals(channel.getIsDefault())) {
            throw new IllegalStateException("Le canal par défaut ne peut pas être supprimé.");
        }

        channelRepository.delete(channel);
    }

    // ==========================================
    // 4.2 & 4.3 : MESSAGERIE TEMPS RÉEL (STOMP)
    // ==========================================

    @Transactional
    public GroupChatMessageDto sendMessage(String userEmail, String channelId, GroupChatMessageRequest request) {
        UserEntity sender = getUserByEmail(userEmail);
        GroupChannelEntity channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new IllegalArgumentException("Canal introuvable : " + channelId));

        GroupEntity group = channel.getGroup();
        assertIsMember(group, userEmail);

        GroupChatMessageEntity parentMsg = null;
        if (request.getParentMessageId() != null && !request.getParentMessageId().isBlank()) {
            parentMsg = messageRepository.findById(request.getParentMessageId()).orElse(null);
        }

        GroupChatMessageEntity message = GroupChatMessageEntity.builder()
                .channel(channel)
                .sender(sender)
                .content(request.getContent().trim())
                .attachmentUrl(request.getAttachmentUrl())
                .parentMessage(parentMsg)
                .isPinned(false)
                .build();

        GroupChatMessageEntity saved = messageRepository.save(message);
        GroupChatMessageDto dto = mapMessageToDto(saved, userEmail);

        // Broadcast WebSocket STOMP vers les abonnés du canal
        String destination = "/topic/groups/" + group.getId() + "/channels/" + channel.getId();
        try {
            messagingTemplate.convertAndSend(destination, dto);
        } catch (Exception e) {
            log.warn("[CHAT WS] Échec du broadcast STOMP: {}", e.getMessage());
        }

        return dto;
    }

    @Transactional(readOnly = true)
    public Page<GroupChatMessageDto> getChannelMessages(String userEmail, String channelId, Pageable pageable) {
        GroupChannelEntity channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new IllegalArgumentException("Canal introuvable."));

        assertIsMember(channel.getGroup(), userEmail);

        Page<GroupChatMessageEntity> page = messageRepository.findByChannelIdOrderByCreatedAtDesc(channelId, pageable);

        // Inverser l'ordre pour un affichage chronologique agréable dans le chat
        List<GroupChatMessageDto> list = page.getContent().stream()
                .map(m -> mapMessageToDto(m, userEmail))
                .collect(Collectors.toList());
        Collections.reverse(list);

        return new PageImpl<>(list, pageable, page.getTotalElements());
    }

    @Transactional
    public void deleteMessage(String userEmail, String messageId) {
        GroupChatMessageEntity msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message introuvable."));

        boolean isSender = msg.getSender().getEmail().equals(userEmail);
        boolean isAdmin = isUserGroupAdmin(msg.getChannel().getGroup(), userEmail);

        if (!isSender && !isAdmin) {
            throw new IllegalStateException("Non autorisé à supprimer ce message.");
        }

        messageRepository.delete(msg);
    }

    // ==========================================
    // HELPERS & MAPPERS
    // ==========================================

    private UserEntity getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé."));
    }

    private GroupEntity getGroupOrThrow(String groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Groupe introuvable : " + groupId));
    }

    private void assertIsMember(GroupEntity group, String userEmail) {
        if (userEmail == null) throw new IllegalStateException("Authentification requise.");
        UserEntity user = getUserByEmail(userEmail);
        boolean isMember = membershipRepository.existsByGroupIdAndUserIdAndStatus(group.getId(), user.getId(), GroupMemberStatus.ACTIVE);
        if (!isMember && !group.getOwner().getId().equals(user.getId())) {
            throw new IllegalStateException("Vous devez être membre de ce groupe pour accéder au chat.");
        }
    }

    private void assertCanManageChannels(GroupEntity group, String userEmail) {
        if (!isUserGroupAdmin(group, userEmail)) {
            throw new IllegalStateException("Seuls les administrateurs du groupe peuvent gérer les canaux.");
        }
    }

    private boolean isUserGroupAdmin(GroupEntity group, String userEmail) {
        if (group.getOwner().getEmail().equals(userEmail)) return true;
        UserEntity user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) return false;
        return membershipRepository.findByGroupIdAndUserId(group.getId(), user.getId())
                .filter(m -> m.getStatus() == GroupMemberStatus.ACTIVE &&
                        (m.getRole() == GroupMemberRole.OWNER || m.getRole() == GroupMemberRole.ADMIN))
                .isPresent();
    }

    public GroupChannelDto mapChannelToDto(GroupChannelEntity c) {
        return GroupChannelDto.builder()
                .id(c.getId())
                .groupId(c.getGroup().getId())
                .name(c.getName())
                .description(c.getDescription())
                .type(c.getType())
                .isDefault(c.getIsDefault())
                .position(c.getPosition())
                .createdAt(c.getCreatedAt())
                .build();
    }

    public GroupChatMessageDto mapMessageToDto(GroupChatMessageEntity m, String currentUserEmail) {
        boolean isOwn = currentUserEmail != null && m.getSender().getEmail().equals(currentUserEmail);
        return GroupChatMessageDto.builder()
                .id(m.getId())
                .channelId(m.getChannel().getId())
                .groupId(m.getChannel().getGroup().getId())
                .sender(authService.mapToUserDto(m.getSender()))
                .content(m.getContent())
                .attachmentUrl(m.getAttachmentUrl())
                .parentMessageId(m.getParentMessage() != null ? m.getParentMessage().getId() : null)
                .isPinned(m.getIsPinned())
                .createdAt(m.getCreatedAt())
                .isOwnMessage(isOwn)
                .build();
    }
}

