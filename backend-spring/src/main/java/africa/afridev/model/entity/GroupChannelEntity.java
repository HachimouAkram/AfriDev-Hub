package africa.afridev.model.entity;

import africa.afridev.model.enums.GroupChannelType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "community_group_channels", indexes = {
    @Index(name = "idx_channel_group", columnList = "group_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupChannelEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private GroupEntity group;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(length = 255)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private GroupChannelType type = GroupChannelType.TEXTE;

    @Builder.Default
    private Boolean isDefault = false;

    @Builder.Default
    private Integer position = 0;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}

