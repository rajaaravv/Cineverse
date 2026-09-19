package com.streamhub.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PlaylistCreateRequest {
    @NotBlank(message = "Playlist name is required")
    private String name;

    private String url;

    private String content;
}
