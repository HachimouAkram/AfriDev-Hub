package africa.afridev.model.entity;

import africa.afridev.model.enums.TechEventType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tech_events", indexes = {
    @Index(name = "idx_event_type", columnList = "type"),
    @Index(name = "idx_event_start_date", columnList = "start_date"),
    @Index(name = "idx_event_organizer", columnList = "organizer_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TechEventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TechEventType type;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    private String location; // e.g. "Dakar, Sénégal" ou "Nairobi, Kenya"

    @Builder.Default
    private Boolean isOnline = false;

    private String eventUrl; // Lien officiel d'inscription ou visio

    private String bannerUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organizer_id")
    private UserEntity organizer;

    private String organizerName;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "tech_event_tags", joinColumns = @JoinColumn(name = "event_id"))
    @Column(name = "tag")
    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @Builder.Default
    private Integer agreeCount = 0;

    @Builder.Default
    private Integer disagreeCount = 0;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
