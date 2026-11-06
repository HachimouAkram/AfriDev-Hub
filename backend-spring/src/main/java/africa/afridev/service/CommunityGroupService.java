package africa.afridev.service;

import africa.afridev.dto.group.*;
import africa.afridev.model.entity.GroupEntity;
import africa.afridev.model.entity.GroupMembershipEntity;
import africa.afridev.model.entity.GroupPostEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.model.enums.*;
import africa.afridev.repository.GroupMembershipRepository;
import africa.afridev.repository.GroupPostRepository;
import africa.afridev.repository.GroupRepository;
import africa.afridev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommunityGroupService {

    private final GroupRepository groupRepository;
    private final GroupMembershipRepository membershipRepository;
    private final GroupPostRepository postRepository;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final NotificationService notificationService;
    private final XpService xpService;

    public static final long XP_CREATE_GROUP = 50L;
    public static final long XP_JOIN_GROUP = 10L;
    public static final long XP_GROUP_POST = 15L;

    // ==========================================
    // 3.2 : CRUD GROUPE
    // ==========================================

    @Transactional
    public GroupDto createGroup(String userEmail, GroupCreateRequest request) {
        UserEntity owner = getUserByEmail(userEmail);

        String slug = request.getSlug().trim().toLowerCase().replaceAll("[^a-z0-9-]", "-");
        if (groupRepository.existsBySlug(slug)) {
            throw new IllegalArgumentException("Un groupe avec ce slug existe déjà.");
        }
        if (groupRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new IllegalArgumentException("Un groupe avec ce nom existe déjà.");
        }

        GroupEntity group = GroupEntity.builder()
                .name(request.getName().trim())
                .slug(slug)
                .description(request.getDescription().trim())
                .accessType(request.getAccessType() != null ? request.getAccessType() : GroupAccessType.PUBLIC)
                .tags(request.getTags() != null ? request.getTags() : new ArrayList<>())
                .country(request.getCountry())
                .city(request.getCity())
                .rulesMarkdown(request.getRulesMarkdown())
                .avatarUrl(request.getAvatarUrl())
                .bannerUrl(request.getBannerUrl())
                .owner(owner)
                .memberCount(1)
                .postCount(0)
                .build();

        GroupEntity saved = groupRepository.save(group);

        // Enregistrer le créateur comme OWNER
        GroupMembershipEntity ownerMembership = GroupMembershipEntity.builder()
                .group(saved)
                .user(owner)
                .role(GroupMemberRole.OWNER)
                .status(GroupMemberStatus.ACTIVE)
                .build();
        membershipRepository.save(ownerMembership);

        // XP pour création de groupe
        xpService.awardXp(owner, XP_CREATE_GROUP, XpSourceType.PROJECT_PUBLISHED,
                "group_created_" + saved.getId(), "Création de la communauté: " + saved.getName());

        log.info("[COMMUNITY] Groupe '{}' créé par {}", saved.getName(), userEmail);
        return mapToDto(saved, userEmail);
    }

    @Transactional(readOnly = true)
    public Page<GroupDto> searchGroups(String country, String tag, String query, String currentUserEmail, Pageable pageable) {
        Page<GroupEntity> page;
        if (tag != null && !tag.isBlank()) {
            page = groupRepository.findByTag(tag.trim(), pageable);
        } else {
            String cleanCountry = (country != null && !country.isBlank() && !"ALL".equalsIgnoreCase(country)) ? country.trim() : null;
            String cleanQuery = (query != null && !query.isBlank()) ? query.trim() : null;
            page = groupRepository.searchPublicGroups(cleanCountry, cleanQuery, pageable);
        }
        return page.map(g -> mapToDto(g, currentUserEmail));
    }

    @Transactional(readOnly = true)
    public GroupDto getGroupBySlug(String slug, String currentUserEmail) {
        GroupEntity group = groupRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Groupe introuvable : " + slug));
        return mapToDto(group, currentUserEmail);
    }

    @Transactional(readOnly = true)
    public GroupDto getGroupById(String groupId, String currentUserEmail) {
        GroupEntity group = getGroupOrThrow(groupId);
        return mapToDto(group, currentUserEmail);
    }

    @Transactional(readOnly = true)
    public Page<GroupDto> getMyGroups(String userEmail, Pageable pageable) {
        UserEntity user = getUserByEmail(userEmail);
        Page<GroupMembershipEntity> memberships = membershipRepository
                .findByUserIdAndStatusOrderByJoinedAtDesc(user.getId(), GroupMemberStatus.ACTIVE, pageable);
        return memberships.map(m -> mapToDto(m.getGroup(), userEmail));
    }

    @Transactional
    public GroupDto updateGroup(String userEmail, String groupId, GroupCreateRequest request) {
        GroupEntity group = getGroupOrThrow(groupId);
        assertCanManageGroup(group, userEmail);

        group.setName(request.getName().trim());
        group.setDescription(request.getDescription().trim());
        if (request.getAccessType() != null) group.setAccessType(request.getAccessType());
        if (request.getTags() != null) group.setTags(request.getTags());
        group.setCountry(request.getCountry());
        group.setCity(request.getCity());
        group.setRulesMarkdown(request.getRulesMarkdown());
        if (request.getAvatarUrl() != null) group.setAvatarUrl(request.getAvatarUrl());
        if (request.getBannerUrl() != null) group.setBannerUrl(request.getBannerUrl());

        return mapToDto(groupRepository.save(group), userEmail);
    }

    @Transactional
    public void deleteGroup(String userEmail, String groupId) {
        GroupEntity group = getGroupOrThrow(groupId);
        if (!group.getOwner().getEmail().equals(userEmail)) {
            throw new IllegalStateException("Seul le créateur peut supprimer ce groupe.");
        }
        groupRepository.delete(group);
        log.info("[COMMUNITY] Groupe '{}' supprimé par {}", groupId, userEmail);
    }

    // ==========================================
    // 3.3 & 3.4 : ADHÉSION & GESTION DES RÔLES
    // ==========================================

    @Transactional
    public GroupMemberDto joinGroup(String userEmail, String groupId) {
        UserEntity user = getUserByEmail(userEmail);
        GroupEntity group = getGroupOrThrow(groupId);

        Optional<GroupMembershipEntity> existingOpt = membershipRepository.findByGroupIdAndUserId(group.getId(), user.getId());
        if (existingOpt.isPresent()) {
            GroupMembershipEntity existing = existingOpt.get();
            if (existing.getStatus() == GroupMemberStatus.ACTIVE) {
                throw new IllegalStateException("Vous êtes déjà membre de ce groupe.");
            }
            if (existing.getStatus() == GroupMemberStatus.BANNED) {
                throw new IllegalStateException("Vous avez été exclu de ce groupe.");
            }
            if (existing.getStatus() == GroupMemberStatus.PENDING) {
                throw new IllegalStateException("Votre demande d'adhésion est déjà en attente d'approbation.");
            }
        }

        GroupMemberStatus status = (group.getAccessType() == GroupAccessType.OUVERT)
                ? GroupMemberStatus.PENDING
                : GroupMemberStatus.ACTIVE;

        GroupMembershipEntity membership = GroupMembershipEntity.builder()
                .group(group)
                .user(user)
                .role(GroupMemberRole.MEMBER)
                .status(status)
                .build();

        GroupMembershipEntity saved = membershipRepository.save(membership);

        if (status == GroupMemberStatus.ACTIVE) {
            group.setMemberCount(group.getMemberCount() + 1);
            groupRepository.save(group);

            xpService.awardXp(user, XP_JOIN_GROUP, XpSourceType.PROJECT_VIEW,
                    "group_join_" + group.getId(), "Adhésion à la communauté: " + group.getName());
        } else {
            // Notifier le propriétaire qu'une demande est en attente
            notificationService.createNotification(
                    group.getOwner(),
                    "GROUP_JOIN_REQUEST",
                    "Demande d'adhésion au groupe",
                    user.getProfile() != null ? user.getProfile().getFullName() : user.getEmail()
                            + " souhaite rejoindre " + group.getName(),
                    "/dashboard/groupes/" + group.getSlug()
            );
        }

        return mapMembershipToDto(saved);
    }

    @Transactional
    public void leaveGroup(String userEmail, String groupId) {
        UserEntity user = getUserByEmail(userEmail);
        GroupEntity group = getGroupOrThrow(groupId);

        if (group.getOwner().getId().equals(user.getId())) {
            throw new IllegalStateException("Le propriétaire ne peut pas quitter le groupe. Transférez le rôle ou supprimez le groupe.");
        }

        membershipRepository.findByGroupIdAndUserId(group.getId(), user.getId())
                .ifPresent(m -> {
                    membershipRepository.delete(m);
                    group.setMemberCount(Math.max(1, group.getMemberCount() - 1));
                    groupRepository.save(group);
                });
    }

    @Transactional
    public GroupMemberDto updateMemberRole(String actorEmail, String groupId, String targetUserId, GroupMemberRole newRole) {
        GroupEntity group = getGroupOrThrow(groupId);
        assertCanManageGroup(group, actorEmail);

        GroupMembershipEntity membership = membershipRepository.findByGroupIdAndUserId(groupId, targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Membre introuvable dans ce groupe."));

        if (membership.getUser().getId().equals(group.getOwner().getId())) {
            throw new IllegalStateException("Impossible de modifier le rôle du propriétaire.");
        }

        membership.setRole(newRole);
        return mapMembershipToDto(membershipRepository.save(membership));
    }

    @Transactional
    public void moderateMember(String actorEmail, String groupId, String targetUserId, GroupMemberStatus newStatus) {
        GroupEntity group = getGroupOrThrow(groupId);
        assertCanManageGroup(group, actorEmail);

        GroupMembershipEntity membership = membershipRepository.findByGroupIdAndUserId(groupId, targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Membre introuvable."));

        if (membership.getUser().getId().equals(group.getOwner().getId())) {
            throw new IllegalStateException("Impossible de modérer le propriétaire.");
        }

        GroupMemberStatus oldStatus = membership.getStatus();
        membership.setStatus(newStatus);
        membershipRepository.save(membership);

        if (oldStatus != GroupMemberStatus.ACTIVE && newStatus == GroupMemberStatus.ACTIVE) {
            group.setMemberCount(group.getMemberCount() + 1);
            groupRepository.save(group);
        } else if (oldStatus == GroupMemberStatus.ACTIVE && newStatus != GroupMemberStatus.ACTIVE) {
            group.setMemberCount(Math.max(1, group.getMemberCount() - 1));
            groupRepository.save(group);
        }
    }

    @Transactional(readOnly = true)
    public Page<GroupMemberDto> getMembers(String groupId, GroupMemberStatus status, Pageable pageable) {
        getGroupOrThrow(groupId);
        return membershipRepository.findByGroupIdAndStatusOrderByRoleAscJoinedAtAsc(groupId, status, pageable)
                .map(this::mapMembershipToDto);
    }

    // ==========================================
    // 3.5 & 3.6 : PUBLICATIONS DE GROUPE & MODÉRATION
    // ==========================================

    @Transactional
    public GroupPostDto createPost(String userEmail, String groupId, GroupPostCreateRequest request) {
        UserEntity author = getUserByEmail(userEmail);
        GroupEntity group = getGroupOrThrow(groupId);

        GroupMembershipEntity membership = membershipRepository.findByGroupIdAndUserId(groupId, author.getId())
                .orElseThrow(() -> new IllegalStateException("Vous devez être membre actif pour publier dans ce groupe."));

        if (membership.getStatus() != GroupMemberStatus.ACTIVE) {
            throw new IllegalStateException("Votre adhésion n'est pas active dans ce groupe.");
        }

        boolean canPin = membership.getRole() == GroupMemberRole.OWNER || membership.getRole() == GroupMemberRole.ADMIN;
        boolean isPinned = canPin && Boolean.TRUE.equals(request.getIsPinned());

        GroupPostEntity post = GroupPostEntity.builder()
                .group(group)
                .author(author)
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .type(request.getType() != null ? request.getType() : GroupPostType.DISCUSSION)
                .visibility(request.getVisibility() != null ? request.getVisibility() : GroupPostVisibility.PUBLIC)
                .isPinned(isPinned)
                .attachments(request.getAttachments() != null ? request.getAttachments() : new ArrayList<>())
                .likesCount(0)
                .commentsCount(0)
                .build();

        GroupPostEntity saved = postRepository.save(post);

        group.setPostCount(group.getPostCount() + 1);
        groupRepository.save(group);

        xpService.awardXp(author, XP_GROUP_POST, XpSourceType.PROJECT_PUBLISHED,
                "group_post_" + saved.getId(), "Publication dans le groupe: " + group.getName());

        return mapPostToDto(saved, userEmail);
    }

    @Transactional(readOnly = true)
    public Page<GroupPostDto> getGroupFeed(String groupId, String userEmail, GroupPostType type, Pageable pageable) {
        GroupEntity group = getGroupOrThrow(groupId);

        boolean isMember = false;
        if (userEmail != null) {
            UserEntity user = userRepository.findByEmail(userEmail).orElse(null);
            if (user != null) {
                isMember = membershipRepository.existsByGroupIdAndUserIdAndStatus(groupId, user.getId(), GroupMemberStatus.ACTIVE);
            }
        }

        return postRepository.findGroupFeed(group.getId(), isMember, type, pageable)
                .map(p -> mapPostToDto(p, userEmail));
    }

    @Transactional
    public void deletePost(String userEmail, String groupId, String postId) {
        GroupEntity group = getGroupOrThrow(groupId);
        GroupPostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Publication introuvable."));

        boolean isAuthor = post.getAuthor().getEmail().equals(userEmail);
        boolean isGroupAdmin = isUserGroupAdmin(group, userEmail);

        if (!isAuthor && !isGroupAdmin) {
            throw new IllegalStateException("Non autorisé à supprimer cette publication.");
        }

        postRepository.delete(post);
        group.setPostCount(Math.max(0, group.getPostCount() - 1));
        groupRepository.save(group);
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

    private void assertCanManageGroup(GroupEntity group, String userEmail) {
        if (!isUserGroupAdmin(group, userEmail)) {
            throw new IllegalStateException("Vous devez être propriétaire ou administrateur du groupe.");
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

    public GroupDto mapToDto(GroupEntity group, String currentUserEmail) {
        Boolean isMember = false;
        Boolean isPending = false;
        GroupMemberRole role = null;

        if (currentUserEmail != null) {
            UserEntity user = userRepository.findByEmail(currentUserEmail).orElse(null);
            if (user != null) {
                Optional<GroupMembershipEntity> m = membershipRepository.findByGroupIdAndUserId(group.getId(), user.getId());
                if (m.isPresent()) {
                    isMember = m.get().getStatus() == GroupMemberStatus.ACTIVE;
                    isPending = m.get().getStatus() == GroupMemberStatus.PENDING;
                    role = m.get().getRole();
                }
            }
        }

        return GroupDto.builder()
                .id(group.getId())
                .name(group.getName())
                .slug(group.getSlug())
                .description(group.getDescription())
                .avatarUrl(group.getAvatarUrl())
                .bannerUrl(group.getBannerUrl())
                .accessType(group.getAccessType())
                .tags(group.getTags())
                .country(group.getCountry())
                .city(group.getCity())
                .rulesMarkdown(group.getRulesMarkdown())
                .owner(authService.mapToUserDto(group.getOwner()))
                .memberCount(group.getMemberCount())
                .postCount(group.getPostCount())
                .createdAt(group.getCreatedAt())
                .updatedAt(group.getUpdatedAt())
                .isMember(isMember)
                .isPending(isPending)
                .userRole(role)
                .build();
    }

    public GroupMemberDto mapMembershipToDto(GroupMembershipEntity m) {
        return GroupMemberDto.builder()
                .id(m.getId())
                .groupId(m.getGroup().getId())
                .user(authService.mapToUserDto(m.getUser()))
                .role(m.getRole())
                .status(m.getStatus())
                .joinedAt(m.getJoinedAt())
                .build();
    }

    public GroupPostDto mapPostToDto(GroupPostEntity post, String currentUserEmail) {
        boolean canEditOrDelete = false;
        if (currentUserEmail != null) {
            boolean isAuthor = post.getAuthor().getEmail().equals(currentUserEmail);
            boolean isAdmin = isUserGroupAdmin(post.getGroup(), currentUserEmail);
            canEditOrDelete = isAuthor || isAdmin;
        }

        return GroupPostDto.builder()
                .id(post.getId())
                .groupId(post.getGroup().getId())
                .author(authService.mapToUserDto(post.getAuthor()))
                .title(post.getTitle())
                .content(post.getContent())
                .type(post.getType())
                .visibility(post.getVisibility())
                .isPinned(post.getIsPinned())
                .attachments(post.getAttachments())
                .likesCount(post.getLikesCount())
                .commentsCount(post.getCommentsCount())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .canEditOrDelete(canEditOrDelete)
                .build();
    }
}
