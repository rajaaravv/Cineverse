package com.streamhub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChannelResponse {
    private Long id;
    private Long playlistId;
    private String playlistName;
    private String name;
    private String tvgId;
    private String tvgName;
    private String tvgLogo;
    private String groupTitle;
    private String streamUrl;
    private String status;
    private boolean favorite;
}
