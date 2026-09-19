package com.streamhub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WatchHistoryResponse {
    private Long id;
    private Long channelId;
    private String channelName;
    private String tvgLogo;
    private String groupTitle;
    private String streamUrl;
    private Long playlistId;
    private String playlistName;
    private LocalDateTime lastWatchedAt;
}
