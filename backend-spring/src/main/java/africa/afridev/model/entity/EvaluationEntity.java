package africa.afridev.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "evaluations", uniqueConstraints = {
    @UniqueConstraint(name = "uk_evaluator_evaluatee_collab", columnNames = {"evaluator_id", "evaluatee_id", "collaboration_id"})
}, indexes = {
    @Index(name = "idx_eval_evaluatee", columnList = "evaluatee_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluator_id", nullable = false)
    private UserEntity evaluator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluatee_id", nullable = false)
    private UserEntity evaluatee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collaboration_id", nullable = false)
    private CollaborationEntity collaboration;

    @Column(nullable = false)
    private Integer codeQuality; // 1-5

    @Column(nullable = false)
    private Integer collaborationRating; // 1-5

    @Column(nullable = false)
    private Integer technicalDepth; // 1-5

    @Column(nullable = false)
    private Integer reliability; // 1-5

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @Builder.Default
    private Boolean isPublic = true;

    @Builder.Default
    private Float weight = 1.0f;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
