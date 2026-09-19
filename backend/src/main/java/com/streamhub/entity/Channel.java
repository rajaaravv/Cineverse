package com.streamhub.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "channels", indexes = {
    @Index(name = "idx_channel_playlist", columnList = "playlist_id"),
    @Index(name = "idx_channel_group", columnList = "groupTitle"),
    @Index(name = "idx_channel_name", columnList = "name")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Channel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "playlist_id", nullable = false)
    private Playlist playlist;

    @Column(nullable = false, length = 250)
    private String name;

    @Column(length = 100)
    private String tvgId;

    @Column(length = 200)
    private String tvgName;

    @Column(columnDefinition = "TEXT")
    private String tvgLogo;

    @Column(length = 100)
    @Builder.Default
    private String groupTitle = "General";

    @Column(nullable = false, columnDefinition = "TEXT")
    private String streamUrl;

    @Column(length = 20)
    @Builder.Default
    private String status = "UNKNOWN";

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
