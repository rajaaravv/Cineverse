package com.streamhub.controller;

import com.streamhub.dto.ApiResponse;
import com.streamhub.dto.PlaylistCreateRequest;
import com.streamhub.dto.PlaylistResponse;
import com.streamhub.dto.PlaylistUpdateRequest;
import com.streamhub.service.PlaylistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/playlists")
@RequiredArgsConstructor
@Tag(name = "Playlists", description = "M3U playlist import, management, and refresh")
public class PlaylistController {

    private final PlaylistService playlistService;

    @GetMapping
    @Operation(summary = "Get user playlists", description = "Retrieves all playlists owned by the authenticated user")
    public ResponseEntity<ApiResponse<List<PlaylistResponse>>> getPlaylists() {
        List<PlaylistResponse> playlists = playlistService.getUserPlaylists();
        return ResponseEntity.ok(ApiResponse.ok(playlists));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get playlist by ID", description = "Retrieves playlist metadata by ID")
    public ResponseEntity<ApiResponse<PlaylistResponse>> getPlaylist(@PathVariable Long id) {
        PlaylistResponse playlist = playlistService.getPlaylistById(id);
        return ResponseEntity.ok(ApiResponse.ok(playlist));
    }

    @PostMapping
    @Operation(summary = "Create playlist via URL or raw M3U text", description = "Imports a new M3U playlist from URL or text body")
    public ResponseEntity<ApiResponse<PlaylistResponse>> createPlaylist(@Valid @RequestBody PlaylistCreateRequest request) {
        PlaylistResponse response = playlistService.createFromRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Playlist imported successfully", response));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload M3U file", description = "Imports a new M3U playlist via file upload")
    public ResponseEntity<ApiResponse<PlaylistResponse>> uploadPlaylist(
            @RequestParam("name") String name,
            @RequestParam("file") MultipartFile file
    ) {
        PlaylistResponse response = playlistService.createFromFile(name, file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Playlist uploaded successfully", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Rename playlist", description = "Updates playlist name")
    public ResponseEntity<ApiResponse<PlaylistResponse>> updatePlaylist(
            @PathVariable Long id,
            @Valid @RequestBody PlaylistUpdateRequest request
    ) {
        PlaylistResponse response = playlistService.updatePlaylist(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Playlist updated successfully", response));
    }

    @PostMapping("/{id}/refresh")
    @Operation(summary = "Refresh playlist", description = "Re-fetches M3U from the original URL and refreshes channel list")
    public ResponseEntity<ApiResponse<PlaylistResponse>> refreshPlaylist(@PathVariable Long id) {
        PlaylistResponse response = playlistService.refreshPlaylist(id);
        return ResponseEntity.ok(ApiResponse.ok("Playlist refreshed successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete playlist", description = "Deletes playlist and cascades deletion to channels")
    public ResponseEntity<ApiResponse<Void>> deletePlaylist(@PathVariable Long id) {
        playlistService.deletePlaylist(id);
        return ResponseEntity.ok(ApiResponse.ok("Playlist deleted successfully", null));
    }
}
