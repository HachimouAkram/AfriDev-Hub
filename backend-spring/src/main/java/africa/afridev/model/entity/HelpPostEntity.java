package africa.afridev.model.entity;

import africa.afridev.model.enums.HelpPostStatus;
import africa.afridev.model.enums.HelpPostType;
import africa.afridev.model.enums.HelpPostVisibility;
import africa.afridev.model.enums.DeveloperLevel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entité représentant une publication d'aide ou d'orientation.
 * Un utilisateur (étudiant, dev junior ou senior) peut poster une demande
 * que la communauté peut voir et auxquelles elle peut répondre.
 */
@Entity
@Table(name = "help_posts", indexes = {
    @Index(name = "idx_helppost_author", columnList = "author_id"),
    @Index(name = "idx_helppost_status", columnList = "status"),
    @Index(name = "idx_helppost_type", columnList = "type"),
    @Index(name = "idx_helppost_created", columnList = "createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HelpPostEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    /** Auteur de la demande */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private UserEntity author;

    /** Titre court de la demande */
    @Column(nullable = false, length = 255)
    private String title;

    /** Description détaillée (Markdown supporté) */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    /** Type de demande */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private HelpPostType type = HelpPostType.ORIENTATION;

    /** Tags techniques libres (ex: Angular, Java, DevOps) */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "help_post_tags", joinColumns = @JoinColumn(name = "help_post_id"))
    @Column(name = "tag")
    @Builder.Default
    private List<String> tags = new ArrayList<>();

    /** Captures d'écran / Photos d'erreurs (max 5) */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "help_post_screenshots", joinColumns = @JoinColumn(name = "help_post_id"))
    @Column(name = "screenshot_url")
    @Builder.Default
    private List<String> screenshotUrls = new ArrayList<>();

    /** Niveau déclaré du demandeur */
    @Enumerated(EnumType.STRING)
    private DeveloperLevel niveauDemandeur;

    /** Statut de la demande */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private HelpPostStatus status = HelpPostStatus.OUVERTE;

    /** Visibilité de la publication */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private HelpPostVisibility visibility = HelpPostVisibility.PUBLIQUE;

    /** Nombre de commentaires (dénormalisé pour performance) */
    @Builder.Default
    private Integer commentsCount = 0;

    /** Nombre de vues */
    @Builder.Default
    private Integer viewsCount = 0;

    /** Utilisateur qui a résolu la demande (optionnel) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by_id")
    private UserEntity resolvedBy;

    /** Date de résolution */
    private LocalDateTime resolvedAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

