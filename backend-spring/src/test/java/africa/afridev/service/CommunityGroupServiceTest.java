package africa.afridev.service;

import africa.afridev.dto.auth.UserDto;
import africa.afridev.dto.group.GroupCreateRequest;
import africa.afridev.dto.group.GroupDto;
import africa.afridev.dto.group.GroupMemberDto;
import africa.afridev.model.entity.GroupEntity;
import africa.afridev.model.entity.GroupMembershipEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.model.enums.GroupAccessType;
import africa.afridev.model.enums.GroupMemberRole;
import africa.afridev.model.enums.GroupMemberStatus;
import africa.afridev.repository.GroupMembershipRepository;
import africa.afridev.repository.GroupPostRepository;
import africa.afridev.repository.GroupRepository;
import africa.afridev.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommunityGroupServiceTest {

    @Mock
    private GroupRepository groupRepository;

    @Mock
    private GroupMembershipRepository membershipRepository;

    @Mock
    private GroupPostRepository postRepository;

    @Mock
    private africa.afridev.repository.GroupChannelRepository channelRepository;

    @Mock
    private africa.afridev.repository.GroupChatMessageRepository chatMessageRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuthService authService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private XpService xpService;

    @InjectMocks
    private CommunityGroupService groupService;

    private UserEntity owner;
    private UserEntity member;
    private GroupEntity group;

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
                .name("DevOps Africa")
                .slug("devops-africa")
                .description("Communauté panafricaine des ingénieurs DevOps & Cloud.")
                .accessType(GroupAccessType.PUBLIC)
                .owner(owner)
                .memberCount(1)
                .postCount(0)
                .build();
    }

    @Test
    @DisplayName("3.2 : Doit créer un groupe et assigner le créateur comme OWNER")
    void testCreateGroup() {
        GroupCreateRequest request = new GroupCreateRequest();
        request.setName("DevOps Africa");
        request.setSlug("devops-africa");
        request.setDescription("Communauté panafricaine des ingénieurs DevOps & Cloud.");
        request.setAccessType(GroupAccessType.PUBLIC);

        when(userRepository.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));
        when(groupRepository.existsBySlug("devops-africa")).thenReturn(false);
        when(groupRepository.existsByNameIgnoreCase("DevOps Africa")).thenReturn(false);
        when(groupRepository.save(any(GroupEntity.class))).thenAnswer(i -> {
            GroupEntity g = i.getArgument(0);
            g.setId("group-1");
            return g;
        });
        when(authService.mapToUserDto(owner)).thenReturn(UserDto.builder().id(owner.getId()).email(owner.getEmail()).build());

        GroupDto result = groupService.createGroup(owner.getEmail(), request);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo("group-1");
        assertThat(result.getName()).isEqualTo("DevOps Africa");
        assertThat(result.getSlug()).isEqualTo("devops-africa");

        verify(membershipRepository, times(1)).save(any(GroupMembershipEntity.class));
        verify(xpService, times(1)).awardXp(eq(owner), eq(CommunityGroupService.XP_CREATE_GROUP), any(), any(), any());
    }

    @Test
    @DisplayName("3.3 & 3.4 : Doit rejoindre un groupe public directement en tant que MEMBER actif")
    void testJoinPublicGroup() {
        when(userRepository.findByEmail(member.getEmail())).thenReturn(Optional.of(member));
        when(groupRepository.findById("group-1")).thenReturn(Optional.of(group));
        when(membershipRepository.findByGroupIdAndUserId("group-1", member.getId())).thenReturn(Optional.empty());
        when(membershipRepository.save(any(GroupMembershipEntity.class))).thenAnswer(i -> {
            GroupMembershipEntity m = i.getArgument(0);
            m.setId("mem-1");
            return m;
        });
        when(authService.mapToUserDto(member)).thenReturn(UserDto.builder().id(member.getId()).email(member.getEmail()).build());

        GroupMemberDto result = groupService.joinGroup(member.getEmail(), "group-1");

        assertThat(result).isNotNull();
        assertThat(result.getRole()).isEqualTo(GroupMemberRole.MEMBER);
        assertThat(result.getStatus()).isEqualTo(GroupMemberStatus.ACTIVE);
        assertThat(group.getMemberCount()).isEqualTo(2);

        verify(xpService, times(1)).awardXp(eq(member), eq(CommunityGroupService.XP_JOIN_GROUP), any(), any(), any());
    }

    @Test
    @DisplayName("3.3 : Le propriétaire ne peut pas quitter son propre groupe sans transfert")
    void testOwnerCannotLeaveGroup() {
        when(userRepository.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));
        when(groupRepository.findById("group-1")).thenReturn(Optional.of(group));

        assertThatThrownBy(() -> groupService.leaveGroup(owner.getEmail(), "group-1"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Le propriétaire ne peut pas quitter le groupe");
    }
}

