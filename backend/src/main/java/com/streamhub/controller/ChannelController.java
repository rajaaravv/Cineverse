package com.streamhub.controller;

import com.streamhub.dto.ApiResponse;
import com.streamhub.dto.CategoryResponse;
import com.streamhub.dto.ChannelResponse;
import com.streamhub.service.ChannelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/channels")
@RequiredArgsConstructor
@Tag(name = "Channels", description = "IPTV channel discovery, search, and category listing")
public class ChannelController {

    private final ChannelService channelService;

    @GetMapping
    @Operation(summary = "Get channels with pagination and filtering", description = "List channels optionally filtered by playlist or category")
    public ResponseEntity<ApiResponse<Page<ChannelResponse>>> getChannels(
            @RequestParam(required = false) Long playlistId,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        Page<ChannelResponse> channels = channelService.getChannels(playlistId, category, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.ok(channels));
    }

    @GetMapping("/search")
    @Operation(summary = "Search channels", description = "Search channels by keyword in name or category")
    public ResponseEntity<ApiResponse<Page<ChannelResponse>>> searchChannels(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long playlistId,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        Page<ChannelResponse> channels = channelService.searchChannels(playlistId, category, query, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.ok(channels));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get channel by ID", description = "Retrieves channel details and favorite status")
    public ResponseEntity<ApiResponse<ChannelResponse>> getChannel(@PathVariable Long id) {
        ChannelResponse channel = channelService.getChannelById(id);
        return ResponseEntity.ok(ApiResponse.ok(channel));
    }

    @GetMapping("/categories")
    @Operation(summary = "Get categories with counts", description = "List all distinct channel categories and channel counts")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getCategories(
            @RequestParam(required = false) Long playlistId
    ) {
        List<CategoryResponse> categories = channelService.getCategories(playlistId);
        return ResponseEntity.ok(ApiResponse.ok(categories));
    }
}
