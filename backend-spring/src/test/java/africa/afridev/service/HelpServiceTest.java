package africa.afridev.service;

import africa.afridev.dto.auth.UserDto;
import africa.afridev.dto.help.*;
import africa.afridev.model.entity.HelpCommentEntity;
import africa.afridev.model.entity.HelpPostEntity;
import africa.afridev.model.entity.UserEntity;
import africa.afridev.model.enums.DeveloperLevel;
import africa.afridev.model.enums.HelpPostStatus;
import africa.afridev.model.enums.HelpPostType;
import africa.afridev.model.enums.HelpPostVisibility;
import africa.afridev.repository.HelpCommentRepository;
import africa.afridev.repository.HelpPostRepository;
import africa.afridev.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HelpServiceTest {

    @Mock
    private HelpPostRepository helpPostRepository;

    @Mock
    private HelpCommentRepository helpCommentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AuthService authService;

    @Mock
    private XpService xpService;

    @InjectMocks
    private HelpService helpService;

    private UserEntity author;
    private UserEntity commenter;
    private HelpPostEntity post;

    @BeforeEach
    void setUp() {
        author = UserEntity.builder()
                .id("user-author-1")
                .email("author@afridev.com")
                .build();

        commenter = UserEntity.builder()
                .id("user-helper-2")
                .email("helper@afridev.com")
                .build();

        post = HelpPostEntity.builder()
                .id("post-1")
                .author(author)
                .title("Comment structurer une app Spring Boot ?")
                .description("Je débute et je souhaite des conseils d'architecture...")
                .type(HelpPostType.ORIENTATION)
                .status(HelpPostStatus.OUVERTE)
                .visibility(HelpPostVisibility.PUBLIQUE)
                .commentsCount(0)
                .viewsCount(0)
                .build();
    }

    @Test
    @DisplayName("1.1 & 1.2 : Doit créer une demande d'aide avec succès")
    void testCreatePost() {
        HelpPostCreateRequest request = new HelpPostCreateRequest();
        request.setTitle("Comment structurer une app Spring Boot ?");
        request.setDescription("Je débute et je souhaite des conseils d'architecture...");
        request.setType(HelpPostType.ORIENTATION);
        request.setTags(List.of("Spring", "Architecture"));

        when(userRepository.findByEmail(author.getEmail())).thenReturn(Optional.of(author));
        when(helpPostRepository.save(any(HelpPostEntity.class))).thenAnswer(invocation -> {
            HelpPostEntity p = invocation.getArgument(0);
            p.setId("post-1");
            return p;
        });
        when(authService.mapToUserDto(author)).thenReturn(UserDto.builder().id(author.getId()).email(author.getEmail()).build());

        HelpPostDto result = helpService.createPost(author.getEmail(), request);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo("post-1");
        assertThat(result.getTitle()).isEqualTo(request.getTitle());
        assertThat(result.getStatus()).isEqualTo(HelpPostStatus.OUVERTE);
        verify(xpService, times(1)).awardXp(eq(author), eq(HelpService.XP_HELP_POST_PUBLISHED), any(), any(), any());
    }

    @Test
    @DisplayName("1.3 & 1.11 : Doit ajouter un commentaire et notifier l'auteur du post")
    void testAddCommentAndNotifyAuthor() {
        HelpCommentCreateRequest request = new HelpCommentCreateRequest();
        request.setContent("Voici une super ressource pour démarrer.");

        when(userRepository.findByEmail(commenter.getEmail())).thenReturn(Optional.of(commenter));
        when(helpPostRepository.findById("post-1")).thenReturn(Optional.of(post));
        when(helpCommentRepository.save(any(HelpCommentEntity.class))).thenAnswer(invocation -> {
            HelpCommentEntity c = invocation.getArgument(0);
            c.setId("comment-1");
            return c;
        });
        when(authService.mapToUserDto(commenter)).thenReturn(UserDto.builder().id(commenter.getId()).email(commenter.getEmail()).build());

        HelpCommentDto commentDto = helpService.addComment(commenter.getEmail(), "post-1", request);

        assertThat(commentDto).isNotNull();
        assertThat(commentDto.getContent()).isEqualTo("Voici une super ressource pour démarrer.");
        assertThat(post.getCommentsCount()).isEqualTo(1);
        assertThat(post.getStatus()).isEqualTo(HelpPostStatus.EN_COURS);

        // Vérifie que la notification a bien été créée pour l'auteur (Tâche 1.11)
        verify(notificationService, times(1)).createNotification(
                eq(author),
                eq("HELP_COMMENT"),
                anyString(),
                anyString(),
                eq("/dashboard/aide/post-1")
        );
        verify(xpService, times(1)).awardXp(eq(commenter), eq(HelpService.XP_HELP_COMMENT_GIVEN), any(), any(), any());
    }

    @Test
    @DisplayName("1.10 : Doit marquer un commentaire comme solution acceptée et résoudre la demande")
    void testAcceptComment() {
        HelpCommentEntity comment = HelpCommentEntity.builder()
                .id("comment-1")
                .helpPost(post)
                .author(commenter)
                .content("La bonne façon est d'utiliser le pattern Controller-Service-Repository.")
                .isAccepted(false)
                .build();

        when(helpPostRepository.findById("post-1")).thenReturn(Optional.of(post));
        when(helpCommentRepository.findById("comment-1")).thenReturn(Optional.of(comment));
        when(helpCommentRepository.findByHelpPostIdAndParentCommentIsNullOrderByCreatedAtAsc("post-1"))
                .thenReturn(List.of(comment));
        when(authService.mapToUserDto(commenter)).thenReturn(UserDto.builder().id(commenter.getId()).email(commenter.getEmail()).build());

        HelpCommentDto result = helpService.acceptComment(author.getEmail(), "post-1", "comment-1");

        assertThat(result.getIsAccepted()).isTrue();
        assertThat(post.getStatus()).isEqualTo(HelpPostStatus.RESOLUE);
        assertThat(post.getResolvedBy()).isEqualTo(commenter);
        assertThat(post.getResolvedAt()).isNotNull();

        // Vérifie notification envoyée au bienfaiteur
        verify(notificationService, times(1)).createNotification(
                eq(commenter),
                eq("HELP_ACCEPTED"),
                anyString(),
                anyString(),
                eq("/dashboard/aide/post-1")
        );
        verify(xpService, times(1)).awardXp(eq(commenter), eq(HelpService.XP_HELP_ACCEPTED_ANSWER), any(), any(), any());
    }

    @Test
    @DisplayName("Sécurité : Un utilisateur tiers ne peut pas modifier le statut d'un post")
    void testUpdateStatusUnauthorized() {
        when(helpPostRepository.findById("post-1")).thenReturn(Optional.of(post));

        assertThatThrownBy(() -> helpService.updateStatus("stranger@afridev.com", "post-1", HelpPostStatus.RESOLUE))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Vous n'êtes pas l'auteur de cette publication.");
    }
}

