package africa.afridev.model.entity;

import africa.afridev.model.enums.CollaborationType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "collaborations", uniqueConstraints = {
    @UniqueConstraint(name = "uk_collab_initiator_partner_proof", columnNames = {"initiator_id", "partner_id", "proofUrl"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CollaborationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "initiator_id", nullable = false)
    private UserEntity initiator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partner_id", nullable = false)
    private UserEntity partner;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CollaborationType type;

    @Column(nullable = false)
    private String proofUrl;

    @Builder.Default
    private Boolean verified = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
