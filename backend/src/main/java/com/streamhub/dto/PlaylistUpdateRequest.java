package com.streamhub.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PlaylistUpdateRequest {
    @NotBlank(message = "Playlist name is required")
    private String name;
}
