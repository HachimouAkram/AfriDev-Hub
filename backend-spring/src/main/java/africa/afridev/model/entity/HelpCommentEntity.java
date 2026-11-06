package africa.afridev.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Commentaire posté en réponse à une publication d'aide.
 * Supporte les réponses imbriquées (parentComment).
 */
@Entity
@Table(name = "help_comments", indexes = {
    @Index(name = "idx_helpcomment_post", columnList = "help_post_id"),
    @Index(name = "idx_helpcomment_author", columnList = "author_id"),
    @Index(name = "idx_helpcomment_parent", columnList = "parent_comment_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HelpCommentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    /** Publication à laquelle ce commentaire répond */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "help_post_id", nullable = false)
    private HelpPostEntity helpPost;

    /** Auteur du commentaire */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private UserEntity author;

    /** Contenu du commentaire */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /**
     * Commentaire parent pour les sous-réponses (nullable).
     * Si null, c'est un commentaire de premier niveau.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    private HelpCommentEntity parentComment;

    /**
     * Marqué comme "réponse acceptée" par l'auteur de la publication.
     * Un seul commentaire peut être accepté par post.
     */
    @Builder.Default
    private Boolean isAccepted = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
