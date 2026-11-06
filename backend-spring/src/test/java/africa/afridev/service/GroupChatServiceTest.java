package africa.afridev.service;

import africa.afridev.dto.auth.UserDto;
import africa.afridev.dto.chat.GroupChannelCreateRequest;
import africa.afridev.dto.chat.GroupChannelDto;
import africa.afridev.dto.chat.GroupChatMessageDto;
import africa.afridev.dto.chat.GroupChatMessageRequest;
import africa.afridev.model.entity.*;
import africa.afridev.model.enums.GroupAccessType;
import africa.afridev.model.enums.GroupChannelType;
import africa.afridev.model.enums.GroupMemberRole;
import africa.afridev.model.enums.GroupMemberStatus;
import africa.afridev.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GroupChatServiceTest {

    @Mock
    private GroupChannelRepository channelRepository;

    @Mock
    private GroupChatMessageRepository messageRepository;

    @Mock
    private GroupRepository groupRepository;

    @Mock
    private GroupMembershipRepository membershipRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuthService authService;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private GroupChatService chatService;

    private UserEntity owner;
    private UserEntity member;
    private GroupEntity group;
    private GroupChannelEntity channel;

    @BeforeEach
    void setUp() {
        owner = UserEntity.builder()
                .id("owner-1")
                .email("owner@afridev.com")
                .build();

        member = UserEntity.builder()
                .id("member-2")
                .email("member@afridev.com")
                .build();

        group = GroupEntity.builder()
                .id("group-1")
                .name("Flutter Africa")
                .slug("flutter-africa")
                .accessType(GroupAccessType.PUBLIC)
                .owner(owner)
                .build();

        channel = GroupChannelEntity.builder()
                .id("chan-1")
                .group(group)
                .name("general")
                .type(GroupChannelType.TEXTE)
                .isDefault(true)
                .build();
    }

    @Test
    @DisplayName("4.2 : Doit créer un nouveau canal si l'utilisateur est administrateur")
    void testCreateChannel() {
        GroupChannelCreateRequest request = new GroupChannelCreateRequest();
        request.setName("entraide-dart");
        request.setDescription("Questions d'architecture Flutter");
        request.setType(GroupChannelType.AIDE_CODE);

        when(groupRepository.findById("group-1")).thenReturn(Optional.of(group));
        when(channelRepository.existsByGroupIdAndNameIgnoreCase("group-1", "entraide-dart")).thenReturn(false);
        when(channelRepository.save(any(GroupChannelEntity.class))).thenAnswer(i -> {
            GroupChannelEntity c = i.getArgument(0);
            c.setId("chan-2");
            return c;
        });

        GroupChannelDto result = chatService.createChannel(owner.getEmail(), "group-1", request);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo("chan-2");
        assertThat(result.getName()).isEqualTo("entraide-dart");
        assertThat(result.getType()).isEqualTo(GroupChannelType.AIDE_CODE);
    }

    @Test
    @DisplayName("4.2 & 4.3 : Doit envoyer un message et émettre le broadcast WebSocket")
    void testSendMessage() {
        GroupChatMessageRequest request = new GroupChatMessageRequest();
        request.setContent("Bonjour à tous les développeurs Flutter !");

        when(userRepository.findByEmail(member.getEmail())).thenReturn(Optional.of(member));
        when(channelRepository.findById("chan-1")).thenReturn(Optional.of(channel));
        when(membershipRepository.existsByGroupIdAndUserIdAndStatus("group-1", member.getId(), GroupMemberStatus.ACTIVE))
                .thenReturn(true);
        when(messageRepository.save(any(GroupChatMessageEntity.class))).thenAnswer(i -> {
            GroupChatMessageEntity m = i.getArgument(0);
            m.setId("msg-1");
            return m;
        });
        when(authService.mapToUserDto(member)).thenReturn(UserDto.builder().id(member.getId()).email(member.getEmail()).build());

        GroupChatMessageDto result = chatService.sendMessage(member.getEmail(), "chan-1", request);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).isEqualTo("Bonjour à tous les développeurs Flutter !");
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/groups/group-1/channels/chan-1"), any(GroupChatMessageDto.class));
    }

    @Test
    @DisplayName("Sécurité : Un non-membre ne peut pas poster dans le chat du groupe")
    void testNonMemberCannotSendMessage() {
        GroupChatMessageRequest request = new GroupChatMessageRequest();
        request.setContent("Hello world");

        UserEntity stranger = UserEntity.builder().id("stranger-3").email("stranger@afridev.com").build();
        when(userRepository.findByEmail(stranger.getEmail())).thenReturn(Optional.of(stranger));
        when(channelRepository.findById("chan-1")).thenReturn(Optional.of(channel));
        when(membershipRepository.existsByGroupIdAndUserIdAndStatus("group-1", stranger.getId(), GroupMemberStatus.ACTIVE))
                .thenReturn(false);

        assertThatThrownBy(() -> chatService.sendMessage(stranger.getEmail(), "chan-1", request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Vous devez être membre de ce groupe pour accéder au chat.");
    }
}

