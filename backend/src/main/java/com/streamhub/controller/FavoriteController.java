package com.streamhub.controller;

import com.streamhub.dto.ApiResponse;
import com.streamhub.dto.FavoriteResponse;
import com.streamhub.service.FavoriteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
@Tag(name = "Favorites", description = "User favorite channels management")
public class FavoriteController {

    private final FavoriteService favoriteService;

    @GetMapping
    @Operation(summary = "Get user favorites", description = "List all favorite channels for the authenticated user")
    public ResponseEntity<ApiResponse<List<FavoriteResponse>>> getFavorites() {
        List<FavoriteResponse> favorites = favoriteService.getUserFavorites();
        return ResponseEntity.ok(ApiResponse.ok(favorites));
    }

    @PostMapping("/{channelId}")
    @Operation(summary = "Add channel to favorites", description = "Saves a channel to user's favorites")
    public ResponseEntity<ApiResponse<FavoriteResponse>> addFavorite(@PathVariable Long channelId) {
        FavoriteResponse response = favoriteService.addFavorite(channelId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Channel added to favorites", response));
    }

    @DeleteMapping("/{channelId}")
    @Operation(summary = "Remove channel from favorites", description = "Removes a channel from user's favorites")
    public ResponseEntity<ApiResponse<Void>> removeFavorite(@PathVariable Long channelId) {
        favoriteService.removeFavorite(channelId);
        return ResponseEntity.ok(ApiResponse.ok("Channel removed from favorites", null));
    }
}
