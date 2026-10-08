package africa.afridev.model.entity;

import africa.afridev.model.enums.ContentStatus;
import africa.afridev.model.enums.OpportunityType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "opportunities", indexes = {
    @Index(name = "idx_opportunity_type", columnList = "type"),
    @Index(name = "idx_opportunity_status_created", columnList = "status, createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OpportunityEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "publisher_id", nullable = false)
    private UserEntity publisher;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OpportunityType type;

    @Column(nullable = false)
    private String location;

    @Builder.Default
    private Boolean isRemote = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "opportunity_stack", joinColumns = @JoinColumn(name = "opportunity_id"))
    @Column(name = "technology")
    @Builder.Default
    private List<String> stack = new ArrayList<>();

    private String budget;
    private LocalDateTime deadline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ContentStatus status = ContentStatus.PUBLISHED;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
