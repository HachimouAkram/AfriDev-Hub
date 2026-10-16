package africa.afridev.model.entity;

import africa.afridev.model.enums.VoteType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "event_votes", indexes = {
    @Index(name = "idx_event_vote_event", columnList = "event_id"),
    @Index(name = "idx_event_vote_user", columnList = "user_id")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_event_user_vote", columnNames = {"event_id", "user_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventVoteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private TechEventEntity event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VoteType voteType;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
