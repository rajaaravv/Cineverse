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
public class PlaylistResponse {
    private Long id;
    private String name;
    private String sourceUrl;
    private Boolean isUrl;
    private Integer channelCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
