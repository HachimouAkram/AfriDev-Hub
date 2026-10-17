package africa.afridev.model.entity;

import africa.afridev.model.enums.XpSourceType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "xp_transactions", indexes = {
    @Index(name = "idx_xp_user_date", columnList = "user_id, createdAt"),
    @Index(name = "idx_xp_source", columnList = "sourceType, sourceId")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class XpTransactionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(nullable = false)
    private Long points;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private XpSourceType sourceType;

    private String sourceId;

    @Column(columnDefinition = "TEXT")
    private String description;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
